const encoder = new TextEncoder();

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalJson(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function evidencePayloadFromPacket(packet) {
  return {
    sources: packet.sources,
    authoritySourceRefs: packet.baseline.authoritySourceRefs,
    requestSourceRef: packet.request.sourceRef,
    requestLedger: packet.requestLedger.map((row) => ({
      id: row.id,
      status: row.status,
      evidence: row.evidence,
    })),
    dependencies: packet.delayAttribution.events,
  };
}

function closeEnough(left, right) {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 1e-9;
}

function addCheck(checks, id, label, pass, detail) {
  checks.push({ id, label, pass: Boolean(pass), detail });
}

export async function verifyMarginGuardProof(rawPacket) {
  const packet = structuredClone(rawPacket);
  const checks = [];
  const integrity = packet.integrity || {};
  delete packet.integrity;

  const expectedEvidenceDigest = await sha256(evidencePayloadFromPacket(packet));
  const expectedPacketDigest = await sha256(packet);
  addCheck(
    checks,
    "evidence-digest",
    "Evidence digest",
    integrity.evidenceDigest === expectedEvidenceDigest,
    `computed ${expectedEvidenceDigest}`,
  );
  addCheck(
    checks,
    "packet-digest",
    "Complete packet digest",
    integrity.packetDigest === expectedPacketDigest,
    `computed ${expectedPacketDigest}`,
  );

  const changedRows = packet.requestLedger.filter((row) => row.status === "scope_change");
  const addedHours = changedRows.reduce(
    (sum, row) => ({
      min: sum.min + (row.effortHours?.min || 0),
      max: sum.max + (row.effortHours?.max || 0),
    }),
    { min: 0, max: 0 },
  );
  const recordedHours = packet.marginSnapshot.knownAddedHours;
  addCheck(
    checks,
    "added-hours",
    "Scope-change effort",
    closeEnough(addedHours.min, recordedHours.min) && closeEnough(addedHours.max, recordedHours.max),
    `${addedHours.min}–${addedHours.max} hours recomputed from scope-change rows`,
  );

  const rate = packet.baseline.pricing.rate.amount;
  const baseFee = { min: addedHours.min * rate, max: addedHours.max * rate };
  const recordedBaseFee = packet.marginSnapshot.completeBaseFeeRange;
  addCheck(
    checks,
    "base-fee",
    "Base fee",
    closeEnough(baseFee.min, recordedBaseFee.min) && closeEnough(baseFee.max, recordedBaseFee.max),
    `USD ${baseFee.min}–${baseFee.max} at USD ${rate}/hour`,
  );

  const rushPercent = packet.baseline.pricing.rushPremium.percent;
  const rushFee = {
    min: baseFee.min * rushPercent / 100,
    max: baseFee.max * rushPercent / 100,
  };
  const recordedRushFee = packet.marginSnapshot.rushPremiumAmountRange;
  addCheck(
    checks,
    "rush-fee",
    "Rush premium",
    closeEnough(rushFee.min, recordedRushFee.min) && closeEnough(rushFee.max, recordedRushFee.max),
    `USD ${rushFee.min.toFixed(2)}–${rushFee.max.toFixed(2)} at ${rushPercent}%`,
  );

  const totalFee = { min: baseFee.min + rushFee.min, max: baseFee.max + rushFee.max };
  const recordedTotalFee = packet.marginSnapshot.completeTotalFeeRange;
  addCheck(
    checks,
    "total-fee",
    "Requested-deadline total",
    closeEnough(totalFee.min, recordedTotalFee.min) && closeEnough(totalFee.max, recordedTotalFee.max),
    `USD ${totalFee.min.toFixed(2)}–${totalFee.max.toFixed(2)}`,
  );

  addCheck(
    checks,
    "options",
    "Negotiation options",
    packet.clientOptions.length === 3 && new Set(packet.clientOptions.map((option) => option.id)).size === 3,
    `${packet.clientOptions.length} distinct bounded options`,
  );

  const emailSources = packet.sources.filter((source) => source.type === "email");
  const messageIds = emailSources.map((source) => source.messageId);
  addCheck(
    checks,
    "message-identity",
    "Mermail message identity",
    messageIds.every(Boolean) && new Set(messageIds).size === messageIds.length,
    `${messageIds.length} unique synthetic message identifiers`,
  );

  const authorityRefs = new Set(packet.baseline.authoritySourceRefs);
  addCheck(
    checks,
    "authority-separation",
    "Authority separation",
    !authorityRefs.has(packet.request.sourceRef),
    "the later request is not baseline authority",
  );

  const requestSource = packet.sources.find((source) => source.id === packet.request.sourceRef);
  const baselineDates = packet.baseline.authoritySourceRefs
    .map((ref) => packet.sources.find((source) => source.id === ref))
    .filter((source) => source?.type === "email")
    .map((source) => source.date);
  addCheck(
    checks,
    "chronology",
    "Evidence chronology",
    Boolean(requestSource?.date) && baselineDates.every((date) => date <= requestSource.date),
    "email-backed baseline does not postdate the request",
  );

  addCheck(
    checks,
    "external-effects",
    "External-effect boundary",
    packet.clientOptions.every((option) => option.id !== "send" && option.id !== "pay"),
    "the packet contains no send or wallet operation",
  );

  return {
    valid: checks.every((check) => check.pass),
    checks,
    computed: {
      evidenceDigest: expectedEvidenceDigest,
      packetDigest: expectedPacketDigest,
      addedHours,
      baseFee,
      rushFee,
      totalFee,
    },
  };
}
