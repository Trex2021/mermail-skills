import { verifyMarginGuardProof } from "./proof-verifier-core.mjs";

const elements = {
  status: document.getElementById("verify-status"),
  summary: document.getElementById("verify-summary"),
  checks: document.getElementById("verify-checks"),
  note: document.getElementById("tamper-note"),
  verify: document.getElementById("verify-proof"),
  tamper: document.getElementById("tamper-proof"),
  reset: document.getElementById("reset-proof"),
};

let publishedPacket;

function setBusy(label) {
  elements.status.className = "verifier-status busy";
  elements.status.textContent = label;
  elements.summary.textContent = "Recomputing SHA-256 digests and business invariants locally…";
  elements.checks.replaceChildren();
}

function render(result, mode) {
  const passed = result.checks.filter((check) => check.pass).length;
  elements.status.className = `verifier-status ${result.valid ? "pass" : "fail"}`;
  elements.status.textContent = result.valid ? "PROOF VERIFIED" : "TAMPERING DETECTED";
  elements.summary.textContent = result.valid
    ? `${passed}/${result.checks.length} independent checks passed in this browser.`
    : `${passed}/${result.checks.length} checks passed; ${result.checks.length - passed} failed closed.`;

  const fragment = document.createDocumentFragment();
  for (const check of result.checks) {
    const row = document.createElement("div");
    row.className = `verifier-check ${check.pass ? "pass" : "fail"}`;

    const mark = document.createElement("span");
    mark.className = "verifier-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = check.pass ? "✓" : "×";

    const copy = document.createElement("div");
    const label = document.createElement("strong");
    label.textContent = check.label;
    const detail = document.createElement("span");
    detail.textContent = check.detail;
    copy.append(label, detail);
    row.append(mark, copy);
    fragment.append(row);
  }
  elements.checks.replaceChildren(fragment);

  elements.note.textContent = mode === "tamper"
    ? "Tamper simulation changed the approved hourly rate from USD 15 to USD 16 without updating the signed packet. Digest and fee checks rejected it. The published bundle was not modified."
    : "Verification runs entirely in your browser against the downloadable public bundle. No credentials, wallet, or server-side trust is required.";
}

async function loadPublishedPacket() {
  if (publishedPacket) return structuredClone(publishedPacket);
  const response = await fetch("./proof-bundle.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`proof bundle returned HTTP ${response.status}`);
  publishedPacket = await response.json();
  return structuredClone(publishedPacket);
}

async function run(mode = "published") {
  setBusy(mode === "tamper" ? "TESTING TAMPER RESPONSE" : "VERIFYING PUBLISHED PROOF");
  try {
    const packet = await loadPublishedPacket();
    if (mode === "tamper") packet.baseline.pricing.rate.amount = 16;
    render(await verifyMarginGuardProof(packet), mode);
  } catch (error) {
    elements.status.className = "verifier-status fail";
    elements.status.textContent = "VERIFIER ERROR";
    elements.summary.textContent = error instanceof Error ? error.message : String(error);
    elements.note.textContent = "The verifier could not load or process the public proof bundle.";
  }
}

elements.verify.addEventListener("click", () => run("published"));
elements.tamper.addEventListener("click", () => run("tamper"));
elements.reset.addEventListener("click", () => run("published"));

run("published");
