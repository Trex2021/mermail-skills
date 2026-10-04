# PR 124 security audit — 4 October 2026

The bounded red-team review reproduced defects in the public skill's settlement validation, evidence handling, credential diagnostics and publishing helpers. The confirmed cases are repaired in product commit [`c4876e43189c41771fcfa89f30d6cab400257654`](https://github.com/Trex2021/mermail-skills/commit/c4876e43189c41771fcfa89f30d6cab400257654). All 198 repository checks and all 80 independent automated forward checks pass. No confirmed defect remains in the tested matrix; this is not a guarantee that the software has no undiscovered vulnerabilities.

## Quick review

1. Read the prioritized findings below and [before/after outcomes](before-after.json).
2. Review the [product security diff](https://github.com/Trex2021/mermail-skills/compare/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64...c4876e43189c41771fcfa89f30d6cab400257654), especially the packet builder, Funding Gate, live-proof reader and MCP checker.
3. Check [the exact-product CI run](https://github.com/Trex2021/mermail-skills/actions/runs/37239386192), [the preserved CI log](ci/product-tests.log), [results](results.json), and [source fingerprints](source-sha256.json).
4. Check the separate [independent automated review](independent/review.md) and its five result files. The reviewer did not modify product files or use real credentials.
5. Use the reproduction instructions below; require a separate human review before treating this as human approval.

## Prioritized findings and repairs

Severity describes the demonstrated impact within these CLI helpers and the stated preconditions. A false funding classification did not grant permission to start work, send a message or transfer funds; those authority fields stayed false even in the original reproducer.

| Priority | Confirmed defect and precondition | Repair and observed result |
| --- | --- | --- |
| High | The MCP connection checker accepted a caller-supplied untrusted endpoint and followed a 307 redirect with the API-key header. A two-origin local test forwarded only a dummy key. | Only the canonical HTTPS Mermail endpoint and the supported inbox profile are accepted. Redirects fail, requests time out, and invalid settings fail before credential transport. The same local reproducer makes zero requests after repair. |
| High | A Solana devnet observation could satisfy a mainnet covenant because the selected cluster was not authenticated against its genesis identity. | Read and compare `getGenesisHash` before the finalized transaction; repeat the check when reauthenticating a saved receipt. Correct mainnet/devnet/testnet identities pass; substituted clusters stop before transaction retrieval. |
| High | EVM transaction, receipt and a different block at the same height could be combined into an accepted observation. Token-event context was insufficiently bound. | Require equal canonical block hashes, matching heights, transaction inclusion, matching event transaction/block context and canonical ABI address padding. Valid inclusion passes; inconsistent/orphan combinations reject. |
| Medium | A same-asset covenant could retain a price of 487.5 while settling 0.002527 of that same asset. | Compare exact decimal amounts with or without explicit `same_asset`; equivalent trailing zeroes pass, unequal amounts reject. Cross-asset conversion still requires the owner's explicit conversion authority. |
| Medium | SPL evidence could count a recipient-account credit while missing an offsetting debit from another recipient-owned account of the same mint in that transaction. | Compare aggregate pre/post balances across that owner's accounts, including closures; reject duplicate or ambiguous balance metadata. This guards accounting attribution, not a claim that an arbitrary sender can debit an owner's account. |
| Medium | A live proof could rely on an unrelated id, unsafe/omitted/truncated content, unrelated metadata containing fixture phrases, or uncaptured baseline evidence. | Require the selected id, explicit safe projection, valid date and bounded body. Build the packet from the captured tool receipts and verify contiguous source quotations. Safe Inbox and bounded outbound Sent context still pass. |
| Medium | Partly overlapping quotation spans could count the same delay twice. Repeated evidence text could be ambiguous. | Reject overlapping or ambiguous spans; preserve independent non-overlapping delay events. Both orderings of the overlapping reproducer reject. |
| Medium | Reflected server errors/names/catalog values could disclose a supplied credential in diagnostics. The CI validator also accepted unrelated JSON-RPC version/id envelopes. | Emit bounded safe diagnostics, sanitize catalog names, and validate JSON-RPC version/id. Connection and validator failure paths do not print the synthetic key; malformed envelopes reject. |
| Medium | `CLAWHUB_LIVE=0` or `false` could unexpectedly opt in to publication. | Only exact `1` enables a live publisher call. Unset/empty/0/false/no remain dry; invalid values stop before the CLI. Tests use a fake local publisher only. |
| Low | Publisher discovery/hashing followed package symlinks outside the workspace, permitting unintended local file access under a tampered package tree. | Reject discovered, nested, internal and broken symlinks before hashing or invoking the publisher, and reject paths outside the workspace. No actual external publication or private file access was tested. |
| Low | A malformed context response without a primary `email` could substitute a nested `thread.messages[].email`. | Accept only a primary selected projection, or a direct `get_email` projection, with bounded `data`/`result` envelope unwrapping. The original helper and whole-CLI malformed-response cases now fail at `selected-message-identity`. This was a provenance-contract defect, not a demonstrated production email sanitizer bypass. |

The repairs were published on the existing PR branch in [`2fff219`](https://github.com/Trex2021/mermail-skills/commit/2fff21912cfd8445a64b739bc558f6a4f232340b), [`72deaef`](https://github.com/Trex2021/mermail-skills/commit/72deaef1b06fb8fe32507aa0a0e380d62f9c62a5), and final [`c4876e4`](https://github.com/Trex2021/mermail-skills/commit/c4876e43189c41771fcfa89f30d6cab400257654). All 16 changed product text files were fetched back from the final GitHub commit and matched the tested local bytes.

## Validation evidence

| Check | Final result | Scope |
| --- | --- | --- |
| Margin Guard | 76/76 | Packet integrity, quotations, pricing, approvals and authority boundaries |
| Funding Gate | 57/57 | Binding, chain observations, approval digest, stale/unrelated/replayed evidence, receipts and authority boundaries |
| Remote contract | 10/10 | Controlled transport/envelope/error regression cases |
| Security red-team | 46/46 | Positive controls and adversarial funding, email evidence, credential, whole-CLI and numeric/text cases |
| Python publisher | 9/9 | Containment, symlinks, publication flags and fake publisher arguments |
| **Repository total** | **198/198** | Local Node 24 and exact-product CI on Node 22 |
| Embedded scenario iterations | 2,000 successful | 1,000 covenant/receipt substitutions plus 1,000 seeded numeric/hostile-text cases; already included in the named tests, not 2,000 additional tests |
| Independent automated forward review | 80/80 | 37 packet/funding/helper, 12 credential/validator, 16 publisher, 8 whole-CLI and 7 primary/thread cases; synthetic only |
| Syntax | Passed | 11 JavaScript modules, 2 Python files and 2 shell scripts |
| Bounded secret-pattern scan | No candidate | 162 tracked UTF-8 files; not a full secret-history, binary or CVE scanner |
| Skill/catalog structure | Passed | 18 skills and 82 business tools plus the confirmation tool |

The fresh exact-product CI completed successfully on 4 October 2026 at 22:16:48 UTC. Its harness commit is `ac38c2b86bb968f2901d8750502b9716d60f40bb`, and checkout explicitly pins product `c4876e43189c41771fcfa89f30d6cab400257654`. Its public logs are preserved here instead of depending solely on the seven-day Actions artifact. Artifact `11316985778` has ZIP SHA-256 `f57bfe5347a44cbc800951fea3ea6279511ad2741e5eb2f69653eaf8e9a15aa7`, independently checked after download. The audit's logging pipelines propagate command failures.

Authenticated **read-only** production checks passed on the final product: initialize, the full 83-tool catalog, `list_workspaces`, and `list_mailboxes`. The connection checker separately discovered 83 tools in the full profile and 12 in the agent-inbox profile. This confirms current catalog and connection compatibility; it does not claim that every one of the 83 tool behaviors was exercised. See [production log](ci/production-check.log), [full-profile log](ci/connection-check.log) and [inbox-profile log](ci/inbox-profile-check.log).

A fresh public Base Sepolia observation passed canonical inclusion, the matching token event and receipt-block decimals. [Public metadata](ci/public-compatibility-metadata.json) and [observation log](ci/public-base-observation.log) preserve the evidence. The historical transaction is a compatibility sample: it is **not a Mermail change-order payment**, actual owner approval, newly executed transfer or permission to act. Solana network genesis metadata was also retrieved read-only; the three cluster transfer-path checks were synthetic, not new live transfers on all three clusters.

## Reproduce without sending or paying

Check out the exact product and run the repository suite:

```bash
git clone https://github.com/Trex2021/mermail-skills.git source
git -C source checkout --detach c4876e43189c41771fcfa89f30d6cab400257654
(cd source && npm --offline test)
```

For the independent cases, put the `independent` folder from this audit beside `source` in a disposable review directory. Its scripts deliberately resolve `../source/` and write their own result files locally:

```bash
node independent/after-probes.mjs
node independent/after-transport-probes.mjs
python3 independent/after-publishing-probes.py
node independent/final-live-probes.mjs
node independent/final-primary-probes.mjs
```

Those probes use fixed synthetic credentials, mock fetch implementations, synthetic emails/transactions and a fake local publishing executable. They create no production email, draft, wallet connection, transfer or ClawHub publication. Existing result snapshots are under `independent/final-*.json`. Historical diagnostics have local workspace paths normalized and synthetic credential strings redacted; they contain no real secrets. Reproduction writes local result files, so use a disposable copy if retaining those snapshots.

The separately recorded production checks use the owner's existing GitHub test secret only inside Actions. This report and its artifacts contain no live API key, OAuth token, private project file or customer mailbox content. No private HSE repository was accessed.

## Remaining limits and external work

- This review covers the public skill's executable packet/funding/live-proof paths and relevant shared MCP, CI-validation and publisher helpers. The validator checks all 18 skill structures. It is not a penetration test of Mermail's private backend, production sanitizer, browser sessions, wallet service, operating system or every external package/tool.
- Public RPC consistency checks depend on a trusted RPC operator and authentic DNS/network responses. They are not independent consensus proofs. Host-captured email/provider results, the owner's separately retained approved digest, and the consumed-proof ledger remain external trust inputs; digests are integrity checksums, not signatures or human approval. The host must update replay state before another change order.
- No third-party npm dependencies are locked in this package. GitHub Actions and the external ClawHub executable still have their own supply chains; the real publisher was not invoked. This was a manual bounded code review and controlled regression exercise, not a commercial scanner/CVE certification.
- Existing agent-session/draft/video evidence pins the earlier product `5e79ba3`. The new CI proves the repaired code, current read-only connection and public-observation compatibility. Older live-demo evidence must not be relabeled as an end-to-end agent demo of `c4876e4`; a fresh agent/demo run is needed for that particular claim.
- [PR 124](https://github.com/Nudgen-Marketing/mermail-skills/pull/124) is open and has no merge conflict. At the checked final head there is no human review or human change request. Five upstream workflows are `action_required`, including [Validate skills](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37239113655); the upstream maintainer must authorize them. The successful fork audit does not replace that approval or a human review. The automatic comment gates are four successes and two neutral recommendations; they are not a human security sign-off.

No new public comment or security issue, merge, contract acceptance, message send, wallet connection or financial action was performed during this audit. The upstream Security Policy's prohibition on public vulnerability issues was respected. Further maintainer communication and merging remain subject to the user's approval.
