# Native current-product demo — 6 October 2026

**Observed result:** one continuous **2:02 English-narrated recording** of GitHub Copilot CLI 1.0.89 using the submitted Mermail plugin. The agent read the two owner-selected synthetic messages, built a source-linked scope/fee packet, stopped at an exact frozen draft preview, then saved **one internal draft** after owner-delegated operator approval and read its **complete unchanged body** back from the live Mermail server. **Zero external sends.**

- Product: [`c4876e4`](https://github.com/Trex2021/mermail-skills/commit/c4876e43189c41771fcfa89f30d6cab400257654) — unchanged from PR #124.
- Evaluation harness: [`1278f95`](https://github.com/Trex2021/mermail-skills/tree/1278f952c17cd98dd86aef3f5ab828d41fdd451a/evaluation/pr124-native-demo).
- Successful [workflow run 37495103611](https://github.com/Trex2021/mermail-skills/actions/runs/37495103611); live observation begins 2026-10-06T16:26:35.123Z.
- 198 immutable-product checks, 14 exact-write/approval/readback guard checks and authenticated 83-tool discovery passed in this run. These do not constitute independent human review.
- Video: 1920 × 1080, H.264, 15 fps, AAC English Piper narration, **122.207982 seconds**. Complete decoding and indexed artifact hashes verified after download.

## A three-minute review route

1. Watch `native-current-head-demo.mp4`. The owner request, skill calls and actual tool events are native CLI output, with private identifiers redacted as the output arrives. The operator preview and result views display the real frozen and retrieved draft text.
2. Read `scope-report.md`, `packet-redacted.json`, `draft-body.txt` and `status.json`. Follow dashboard, Stripe, login and excess revision back to the selected request; preserve baseline exclusions and breakpoint acceptance criteria.
3. Check `SHA256SUMS.json` against the artifacts. The full raw selected-source receipts, original identifiers, frozen arguments and server readback are encrypted in `encrypted-review.json` for owner-controlled review; public redaction cannot reauthenticate those private identities.

| Observed event | UTC | Result |
| --- | --- | --- |
| `list_mailboxes` — live_read | 16:26:35.123 | forwarded to hosted Mermail |
| `search_emails` — live_read | 16:26:38.281 | forwarded to hosted Mermail |
| `search_emails` — live_read | 16:26:41.489 | forwarded to hosted Mermail |
| `get_email_context` — baseline | 16:26:45.130 | forwarded to hosted Mermail |
| `get_email_context` — request | 16:26:48.380 | forwarded to hosted Mermail |
| `build_margin_packet` — local_builder | 16:27:12.404 | local approval/builder adapter; no remote write |
| `freeze_draft_preview` — preview_frozen | 16:27:24.213 | local approval/builder adapter; no remote write |
| `save_draft` — save_attempt | 16:27:41.888 | forwarded to hosted Mermail |
| `save_draft` — save_completed | 16:27:43.485 | forwarded to hosted Mermail |
| `get_email` — live_draft_readback | 16:27:45.821 | MATCH; complete unsent body |

## Commercial result — hypothetical live scenario B

The agent observed **15–22 added hours** at the owner-supplied hypothetical **$23.50/hour**: **$352.50–$517.00** ordinary additional fee, or **$387.75–$568.70** including the separately approved 10% rush rule. One remaining included revision is not charged again. Earlier delivery adds zero labor. The two-day staging delay remains separately attributed to the client.

Three choices are visible in the saved draft: remove or agree an effort-equivalent swap; ordinary-fee extension to **24–25 October 2026**; or discuss the requested **15 October** target at the rush estimate. No option is accepted, no work is authorized and no deadline feasibility is guaranteed. This is not customer revenue. The offline benchmark A (26–33 hours, $390–$495 base at $15/hour) uses different inputs.

## Approval and evidence boundaries

- Plugin documentation only was loaded **before capture**. No task data or Mermail sources were preloaded into the client. The recorded request continues that documentation-prepared session; it is **not a fresh cold-start skill-selection benchmark**. The separate [five fresh behavior sessions](https://github.com/Trex2021/mermail-skills/blob/23167f2e9b4ae86e10d3e83fc9775b9e176b5ba7/evaluation/pr124-behavior/REPORT.md) retain that role.
- The initial owner request names only the two permitted subjects and supplies estimates and commercial terms. The harness pins and hashes all 97 plugin files. Expected outcomes, fixtures and evaluator receipts remain outside the client's allowed files.
- A narrow adapter exposes hosted Mermail reads and a guarded native `save_draft`/`get_email` route. `build_margin_packet` invokes the shipped local builder; `freeze_draft_preview` registers an exact approval preview. Neither is a newly claimed production Mermail operation.
- The approval is **owner-delegated operator approval for one exact internal synthetic draft**. No new human approval click or independent human review is claimed. The saved subject, sender, recipient, complete body, empty Cc/Bcc/attachments and Drafts/unsent state were checked independently against the frozen preview. Changed/absent/stale approvals cannot grant save permission; save retries are blocked.
- The two selected sources are pre-existing self-addressed synthetic Sent messages. `scanStatus: null` and unknown sender authentication remain visible. Safe primary body projections establish bounded source correspondence, not authenticated real-customer identity.
- The 13 indexed artifact hashes match. No private HSE material is used. No outbound message, wallet connection, agreement, transfer or financial action occurred.
- This film shows the bounded successful workflow. The separate [six live security sessions](https://github.com/Trex2021/mermail-skills/blob/780bba180c652c2c16749a9975f2e26598ec78c8/evaluation/pr124-security/REPORT.md) cover unrelated, old and consumed receipts, missing/hostile rates and funding that grants no action authority.

## Recording attempts are retained

Earlier [37487360698](https://github.com/Trex2021/mermail-skills/actions/runs/37487360698) and [37489082548](https://github.com/Trex2021/mermail-skills/actions/runs/37489082548) stopped before any save when the native preview did not finish within the time budget. [37487617669](https://github.com/Trex2021/mermail-skills/actions/runs/37487617669) and [37493956777](https://github.com/Trex2021/mermail-skills/actions/runs/37493956777) each separately passed save/readback, but their terminal framing was rejected for publication. This run's one-save count refers to **this run**, not to all attempts combined. Documentation preparation and the advertised preview argument schema were improved without weakening the approval guards.

No perfect first-call behavior is claimed: native search/schema recoveries remain in the transcript. This is a real measured demonstration of the stated bounded path, not proof that every Mermail operation or arbitrary client email is secure.

## Digests and raw result

| Item | SHA-256 |
| --- | --- |
| Exact frozen preview | `bf2fc5c4cac60e7f009e84ebf947abc69e38e2a62dfa757ebe277e7df7ec9f98` |
| Verified packet | `69262fd9b38c0eeb672e9b1af2c89bc559e14ab0dea053c5b1182b447f891382` |
| Exact retrieved body | `0ab25d657d327906908756ba908455df6b771b9f64150c842330c8ee935596eb` |
| Continuous MP4 | `aca9fab3b7e4ee5663bb62b2c25d5131be1e4464ed929d87571a94295c0fa110` |

`draft-body.txt` includes a final newline for download; its file digest therefore differs from the exact in-server body digest above. Optional English subtitle files reproduce the narration; their per-cue timing is approximate and they do not alter the source MP4.

Human review and authorization/execution of the five upstream PR workflows remain external maintainer gates. The evidence harness and artifacts are kept outside the product PR.

## Complete observed unsent draft

```text
SYNTHETIC TEST DRAFT ONLY — all rates, estimates, and prices are hypothetical.

The accepted scope remains one responsive landing page, accepted at the agreed desktop, tablet, and mobile breakpoints. It excludes an authenticated application/login, admin dashboard, and payment processing. Of the original two revision rounds, one was used, leaving one included. Of the two requested rounds, one is included and one is additional.

The dashboard, Stripe, login, and overflow revision total 15–22 additional hours; the earlier deadline adds 0 labor hours. At USD 23.50/hour, the ordinary fee is USD 352.50–USD 517.00. With the hypothetical 10% rush premium, the total is USD 387.75–USD 568.70.

Remove or swap: Remove the additions or confirm an effort-equivalent swap; baseline deadline remains 2026-10-20.
Extend the schedule: Keep additions at ordinary rates; including the 2-day client-owned staging delay, proposed delivery is 2026-10-24–2026-10-25.
Paid rush: Keep additions and target 2026-10-15 for the rush total above.

No option has been accepted, and no work is authorized. These are discussion options only.
```
