# Independent forward validation of repaired source

Reviewed the current source without modifying product files. The original pre-fix probe scripts, results and fingerprints remain preserved. Intermediate follow-up outputs are retained under `interim-after/`; current outputs use `final-*` names. Every transport and credential was synthetic; no Mermail/blockchain request, email, wallet action or external publish occurred.

## Verified results

- `npm test` passes: 76 core packet checks, 57 Funding Gate checks, 55 Node tests across remote-contract/security-redteam, and 9 publisher tests: 197 named tests in total, including 1,000 covenant/receipt substitutions and 1,000 seeded numeric/hostile-text scenarios. Static validation covers 18 skills and 82 business tools. The process ran with an explicit network-denying preload and `PYTHONDONTWRITEBYTECODE=1`. See `final-npm-test.log`.
- All 37 independent packet/funding/live-helper checks pass. They cover partial overlap in either ordering, repeated and whitespace-normalized evidence, distinct delays, same-asset equality at 18-decimal boundaries, canonical Base inclusion, valid receipt reauthentication, all three correct Solana genesis identities, wrong-cluster rejection before transaction read, owner aggregate SPL debits including closed accounts, newly created token accounts, duplicate balances, blocked live evidence, and semantically identical reordered projections. See `final-results.json` and `final-probes.log`.
- All 12 independent credential/CI-validator checks pass. Reflected errors, network/JSON exceptions, server names and catalog values do not disclose the synthetic credential; untrusted endpoint/profile settings are rejected before transport; invalid JSON-RPC envelopes fail both the connection checker and remote validator. See `final-transport-results.json` and `final-transport-probes.log`.
- All 16 independent publisher checks pass. Ordinary packages still work; discovered/nested/broken/internal symlinks and outside targets are rejected; unset/0/false/no preserve dry runs; invalid flags stop before the fake CLI; exact `1` remains the only opt-in. See `final-publishing-results.json` and `final-publishing-probes.log`.
- Seven of eight independent whole-CLI resume cases pass. Inbox, null-scan outbound Sent, and Sent with an opaque provider folder id work. Null-scan incoming content, omitted Sent content, changed baseline text, and unavailable context fail closed. Inbox reads retain the exact clean-scan/safe-content/10,000-character query; Sent reads explicitly request `query.limit: 1`. The eighth case exposes the missing-primary defect below. See `final-live-results.json` and `final-live-probes.log`.
- Six of seven independent primary/thread-envelope cases pass. A wrong or omitted primary cannot be repaired by a normal sibling; unrelated siblings do not contaminate a correct primary; a direct `get_email` response works, and a direct context projection or absent primary with plain siblings is rejected. A nested sibling can still replace an absent primary. See `final-primary-results.json`.

The independent total is 78 passing checks out of 80. Both failures reproduce the same remaining malformed-response defect.

These checks confirm that the previously reported funding, overlap, live evidence, key-handling, JSON-RPC and publishing defects are repaired. The previously reported Sent-only availability failure is also repaired, including the explicit context bound. The restored screenshot artifacts validate successfully and are not a remaining product defect. The separately approved-covenant digest, replay ledger and no-action-authority behaviors remain covered by the passing repository suite.

Source fingerprints for this forward validation are in `final-source-sha256.json`.

## One remaining confirmed defect: a nested thread email replaces an absent primary — Low correctness

Location: `skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs`, lines 239–245 in the reviewed version, SHA-256 `1442bc3032135c66fc723ce75b3f8a42bcb6c0b7276a2fd0c89b9646f25d47ff`. `namedSelected` recursively finds every object-valued `email` property instead of requiring the response's primary selected-email field.

Precondition: An authenticated context response is structurally malformed and has no primary `email`. It instead contains `{thread:{messages:[{email:selected}]}}`, whose nested email has the selected id, valid date and safe bounded content.

Observed: The helper accepts that nested email. The complete synthetic Sent CLI exits zero and reports its proof passed when both selected context reads use this malformed envelope.

Required: Require the response's primary selected `email` projection. Surrounding thread entries must not replace an absent primary; the malformed response should fail at `selected-message-identity`.

Reproducers: `node independent/final-primary-probes.mjs` and `node independent/final-live-probes.mjs` (`sent_nested_primary`). Exact preconditions, raw responses, mocks and the pre-fix source hash are retained under `primary-before/`.

This is an envelope/provenance-contract failure. The accepted nested projection still passes the ordinary identity, scan, safe-body, date and quotation checks. The probe does not establish that an ordinary email body can alter server response structure, bypass the server sanitizer, or authorize an action.

## Residual validation limits

All credentials, mailbox records, emails, settlements and transports were synthetic. This review did not contact Mermail or blockchain services, exercise production sanitization/delivery, use real credentials, connect a wallet or publish through the actual external ClawHub executable. Publisher calls were recorded by a fake local executable. No product file was edited.

Public-settlement verification still depends on the configured public RPC returning authentic finalized chain data; these probes check validation of its responses, not operator/DNS compromise. Live email receipts remain host-captured inputs, and digests freeze evidence rather than authenticating a sender or granting owner approval. The original and intermediate findings remain preserved for audit history; they should not be presented as current defects after the corresponding repair passes.
