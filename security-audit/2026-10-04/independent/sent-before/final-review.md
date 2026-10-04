# Independent forward validation of repaired source

Reviewed the current source without modifying product files. The original pre-fix probe scripts, results and fingerprints remain preserved. Intermediate follow-up outputs are retained under `interim-after/`; current outputs use `final-*` names. Every transport and credential was synthetic; no Mermail/blockchain request, email, wallet action or external publish occurred.

## Verified results

- `npm test` passes: 76 core packet checks, 57 Funding Gate checks, 49 Node tests across remote-contract/security-redteam, and 9 publisher tests. See `final-npm-test.log`.
- All 37 independent packet/funding/live-helper checks pass. They cover partial overlap in either ordering, repeated and whitespace-normalized evidence, distinct delays, same-asset equality at 18-decimal boundaries, canonical Base inclusion, valid receipt reauthentication, all three correct Solana genesis identities, wrong-cluster rejection before transaction read, owner aggregate SPL debits including closed accounts, newly created token accounts, duplicate balances, blocked live evidence, and semantically identical reordered projections. See `final-results.json` and `final-probes.log`.
- All 12 independent credential/CI-validator checks pass. Reflected errors, network/JSON exceptions, server names and catalog values do not disclose the synthetic credential; untrusted endpoint/profile settings are rejected before transport; invalid JSON-RPC envelopes fail both the connection checker and remote validator. See `final-transport-results.json` and `final-transport-probes.log`.
- All 16 independent publisher checks pass. Ordinary packages still work; discovered/nested/broken/internal symlinks and outside targets are rejected; unset/0/false/no preserve dry runs; invalid flags stop before the fake CLI; exact `1` remains the only opt-in. See `final-publishing-results.json` and `final-publishing-probes.log`.
- End-to-end Inbox resume passes using selected safe bodies and exact scan/safe-content/body-limit queries. See `final-live-results.json`.

These checks confirm that the previously reported security defects are repaired. The restored screenshot artifacts validate successfully and are not a remaining product defect. The separately approved-covenant digest, replay ledger and no-action-authority behaviors remain covered by the passing repository suite.

Source fingerprints for this forward validation are in `final-source-sha256.json`.

## One remaining confirmed correctness gap: Sent-only resume cannot use eligible context evidence — Medium availability

Locations: `skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs`, lines 256 and 339–353 in the reviewed version; `references/verification.md`, line 115 advertises recovering the Sent copy when Inbox is absent.

Precondition: A previously approved synthetic run has only its Sent copies available. Those outbound copies have null scan status. As permitted by the skill's strict-intake contract, `get_email_context` is available and would return a sanitized, bounded, non-omitted Sent projection with `agent_safe_content: true`, `is_incoming: false` and null scan status. The ordinary `get_email` clean-scan request omits that body.

Observed: The end-to-end synthetic Inbox case exits zero and prints the proof. The Sent-only case reads the selected baseline via `get_email`, exits one at `selected-message-security`, and never attempts `get_email_context`, despite that tool being in the mock catalog. The helper also hardcodes its receipt tool as `get_email`, so it cannot represent the context-only Sent eligibility rule.

Required: To preserve the documented Sent recovery behavior, use the server-managed selected context path and retain its actual tool provenance. Continue to block unsafe/omitted inbound bodies; a folder label alone must not create an exception. Alternatively, explicitly remove the Sent recovery promise if that workflow is intentionally unsupported.

Reproducer: `node independent/final-live-probes.mjs`. Raw mock selected-read arguments and both end-to-end outcomes are in `final-live-results.json` and `final-live-calls-sent.json`.

This failure is fail-closed. It does not authorize a message, action, unsafe content read or financial operation. No remaining confirmed security bypass was found in the reviewed repaired paths.
