import crypto from 'node:crypto';

export const SUBJECT = '[FMG-PR124-P1-20261006] Scope options (synthetic demo)';
export const canonical = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
export const hash = v => crypto.createHash('sha256').update(typeof v === 'string' || Buffer.isBuffer(v) ? v : canonical(v)).digest('hex');
export function must(ok, code) { if (!ok) { const e = new Error(code); e.code = code; throw e; } }

export function freezePreview(args, packetDigest, scope, packet) {
  must(args && typeof args === 'object' && !Array.isArray(args), 'preview_arguments_missing');
  must(Object.keys(args).every(k => ['mailboxId','body','idempotencyKey'].includes(k)), 'unexpected_top_level_argument');
  const b = args.body;
  must(b && Object.keys(b).every(k => ['from','to','cc','bcc','subject','body','body_format','attachments'].includes(k)), 'unexpected_draft_field');
  must(args.mailboxId === scope.mailbox.id && b.from === scope.mailbox.email && b.to === scope.mailbox.email, 'self_addressed_mailbox_required');
  must(Array.isArray(b.cc) && !b.cc.length && Array.isArray(b.bcc) && !b.bcc.length && Array.isArray(b.attachments) && !b.attachments.length, 'copies_or_attachments_forbidden');
  must(b.subject === SUBJECT && b.body_format === 'text', 'draft_subject_or_format_mismatch');
  must(typeof b.body === 'string' && b.body.length >= 600 && b.body.length <= 2400 && !/[\x00-\x08\x0b-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(b.body), 'unsafe_or_incomplete_body');
  must(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(b.body), 'private_identifier_in_public_demo_body');
  must(packet?.integrity?.packetDigest === packetDigest && /^[a-f0-9]{64}$/.test(packetDigest), 'packet_binding_mismatch');
  must(packet.state === 'scope_change_detected' && packet.clientOptions?.length === 3, 'incomplete_decision_packet');
  const m = packet.marginSnapshot;
  must(m.knownAddedHours.min === 15 && m.knownAddedHours.max === 22 && m.completeBaseFeeRange.min === 352.5 && m.completeBaseFeeRange.max === 517 && m.completeTotalFeeRange.min === 387.75 && m.completeTotalFeeRange.max === 568.7, 'unexpected_owner_terms');
  const needed = [/synthetic/i,/hypothetical/i,/15\s*(?:-|–|to)\s*22/,/352\.50/,/517(?:\.00)?/,/387\.75/,/568\.70/,/23\.50/,/10\s*%|10\s*percent/i,/remove|swap/i,/extend/i,/rush/i,/2026-10-20/,/2026-10-24/,/2026-10-25/,/2026-10-15/,/includ/i,/revision/i,/no[^.\n]{0,100}(?:work|option)[^.\n]{0,60}(?:authoriz|accept)|(?:work|option)[^.\n]{0,60}(?:not authoriz|not accept)/i];
  must(needed.every(re => re.test(b.body)), 'draft_commercial_or_safety_content_missing');
  const safeArgs = structuredClone(args);
  safeArgs.idempotencyKey = 'pr124-p1-' + hash({mailboxId:args.mailboxId, subject:b.subject, body:b.body, packetDigest});
  const preview = {action:'save_draft_only', packetDigest, arguments:safeArgs};
  return {preview, previewDigest:hash(preview)};
}

export function requireSaveAuthority(args, frozen, gate, audit, packet) {
  must(frozen && gate?.action === 'save_draft_only' && gate.authorizationSource === 'owner_delegated_demo_operator', 'internal_draft_approval_missing');
  must(gate.previewDigest === frozen.previewDigest && hash(frozen.preview) === gate.previewDigest && gate.packetDigest === packet?.integrity?.packetDigest && frozen.preview.packetDigest === gate.packetDigest, 'approval_stale_or_mutated');
  must(canonical(args) === canonical(frozen.preview.arguments), 'approved_payload_changed');
  must(!audit.some(e => e.kind === 'save_attempt'), 'save_already_attempted_no_retry');
}

export function verifyReadback(email, draftId, frozen) {
  const b = frozen.preview.arguments.body;
  const addresses = v => [...new Set((JSON.stringify(v ?? '').match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).map(x=>x.toLowerCase()))];
  must((email.id || email.email_id || email.emailId || email.draft_id) === draftId && email.subject === b.subject, 'readback_identity_mismatch');
  must(/^(drafts|draft)$/i.test(String(email.folder_name || email.folder_id || email.status || '')), 'readback_not_unsent_draft');
  must(email.agent_safe_content === true && !email.content_omitted && !email.content_truncated, 'readback_safe_projection_missing');
  const body = ['body','body_text','text'].map(k=>email[k]).find(x=>typeof x === 'string' && x.trim());
  must(typeof body === 'string' && body.replace(/\r\n/g,'\n') === b.body && hash(body.replace(/\r\n/g,'\n')) === hash(b.body), 'readback_body_mismatch');
  must(addresses(email.sender ?? email.from).length === 1 && addresses(email.sender ?? email.from)[0] === b.from.toLowerCase() && addresses(email.recipient ?? email.to).length === 1 && addresses(email.recipient ?? email.to)[0] === b.to.toLowerCase(), 'readback_addresses_mismatch');
  must(!addresses(email.cc).length && !addresses(email.bcc).length && (!Array.isArray(email.attachments) || !email.attachments.length), 'readback_copies_or_attachments');
  return {readbackVerified:true, bodyHash:hash(b.body), subject:b.subject, sent:false};
}
