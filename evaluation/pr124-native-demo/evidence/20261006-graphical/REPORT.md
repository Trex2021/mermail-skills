# Graphical continuous live demo — 6 October 2026

**Observed result:** a **2:45 English-narrated, continuous graphical recording** driven by the actual GitHub Copilot CLI 1.0.89 and current-run hosted Mermail events. Selected source emails, workspace files, source-linked scope calculations, complete frozen draft and full server readback are readable in a light evaluation interface. **One internal synthetic draft saved; zero external sends.** This interface is an **evaluation workspace, not the official Mermail web console**.

- Product: [`c4876e4`](https://github.com/Trex2021/mermail-skills/commit/c4876e43189c41771fcfa89f30d6cab400257654) — unchanged from PR #124.
- Isolated graphical harness: [`b926920`](https://github.com/Trex2021/mermail-skills/tree/b92692058d72f7e5339d317678f6c7c9b829dfa5/evaluation/pr124-native-demo).
- Successful [workflow run 37500975041](https://github.com/Trex2021/mermail-skills/actions/runs/37500975041); final live verification **2026-10-06T17:10:51.602Z**.
- **198 exact-product checks, 14 native save/readback guard checks and authenticated 83-tool discovery passed.** These checks do not constitute independent human review.
- Original recording: **165.145011 seconds**, 1920 × 1080, H.264, 15 fps, AAC-LC 44.1 kHz stereo. No cuts, speed changes or reconstructed after-the-fact screen sequence. English narration uses a locally generated Piper voice, not a cloned human voice.

## Three-minute review route

1. Watch `graphical-current-head-demo.mp4`: workspace → two selected sources → scope/hour graph and three options → exact pre-save stop → real internal draft save and complete server readback → clearly dated verification evidence.
2. Inspect `scope-report.md`, `packet-redacted.json`, `draft-body.txt` and `status.json`. Each addition remains linked to the source request; original exclusions and desktop/tablet/mobile acceptance criteria remain intact. The included revision is not charged twice.
3. Check the **17 original file hashes** in `SHA256SUMS.json`. `encrypted-review.json` retains raw selected-source receipts, private original identifiers, frozen arguments and server readback for owner-controlled review. Public redaction cannot authenticate those private identities on its own.

| Actual tool event | UTC | Execution |
| --- | --- | --- |
| `list_mailboxes` — live_read | 17:09:36.099 | hosted Mermail |
| `search_emails` — live_read | 17:09:39.205 | hosted Mermail |
| `search_emails` — live_read | 17:09:42.513 | hosted Mermail |
| `get_email_context` — baseline | 17:09:45.951 | hosted Mermail |
| `get_email_context` — request | 17:09:49.244 | hosted Mermail |
| `build_margin_packet` — local_builder | 17:10:11.632 | local builder / approval adapter |
| `freeze_draft_preview` — preview_frozen | 17:10:23.296 | local builder / approval adapter |
| `save_draft` — save_attempt | 17:10:44.389 | hosted Mermail |
| `save_draft` — save_completed | 17:10:45.863 | hosted Mermail |
| `get_email` — live_draft_readback | 17:10:49.005 | hosted Mermail |

## Visible commercial result — hypothetical live scenario B

**15–22 additional hours** at the owner-supplied hypothetical **USD 23.50/hour** produces **USD 352.50–517.00** ordinary fee and **USD 387.75–568.70** including the separately supplied 10% rush rule. The dashboard, Stripe, login and one overflow revision carry effort; the five-day earlier deadline itself adds zero labor. The two-day client-owned staging delay stays separately attributed.

The saved draft preserves three discussion choices: remove or confirm an effort-equivalent swap; keep additions at ordinary rates and extend to **24–25 October 2026**; or discuss a paid rush toward **15 October**. No option is accepted, no work is authorized and feasibility is not guaranteed. These are synthetic estimates, not recovered revenue. The separate offline benchmark A (26–33 hours; USD 390–495 at USD 15/hour) uses different inputs.

## Approval, provenance and claim boundaries

- Before capture, the client loaded **plugin documentation only**. No task data or source emails were preloaded. This continues a documentation-prepared native session; it is **not a cold-start skill-selection benchmark**. The separate [five fresh behavior sessions](https://github.com/Trex2021/mermail-skills/blob/23167f2e9b4ae86e10d3e83fc9775b9e176b5ba7/evaluation/pr124-behavior/REPORT.md) cover selection, adjacent routing, successful path, approval stop and hostile source handling.
- The actual client reads two owner-selected, pre-existing **self-addressed synthetic Sent messages**. Null scan state and unknown sender authentication are visibly disclosed. Source correspondence is bounded; authenticated real-customer identity is not claimed.
- The workspace is generated from **current-run live events and real verified payloads**, rather than illustrative result cards. The local `build_margin_packet` calls the shipped product builder; `freeze_draft_preview` is an approval adapter. Neither is represented as a new production Mermail tool.
- The complete frozen body is displayed and checked for clipping and digest correspondence before permission is granted. The operator acts under the owner's **delegated permission for one exact internal synthetic draft**; no fresh human click is claimed. The server readback is independently compared against the unchanged subject, sender, recipient, entire body, empty Cc/Bcc/attachments and unsent Drafts state. Changed, missing, stale or reused approvals cannot grant another save.
- The final verification screen distinguishes this run's 198/14/83 preflight from the **six separate live safety sessions of 5 October**. [Their report](https://github.com/Trex2021/mermail-skills/blob/780bba180c652c2c16749a9975f2e26598ec78c8/evaluation/pr124-security/REPORT.md) covers unrelated, old and consumed receipts, missing/hostile rates, and funding without send/work authority. Those cases are not claimed to have all occurred inside this success-path film.
- Product files and approval guards remain unchanged. Full video decoding, original file hashes, displayed complete-body correspondence and sampled real captured frames were checked after artifact download. Subtitles reproduce narration with approximate within-clip timing; they do not modify the original MP4.
- No private HSE files or information are used. No external message, contract, wallet connection, transfer or financial action occurred.

## Retained attempts and limitations

The first [graphical run 37499732306](https://github.com/Trex2021/mermail-skills/actions/runs/37499732306) functionally passed save/readback, but its chart labels overlapped the bars when the agent used longer ledger identifiers. It was **rejected for publication**. This run corrects the graphical label column and uses semantic labels from the actual ledger; the proxy and approval guards were not weakened.

The earlier [2:02 native CLI film](https://x.com/Ehsan_Benvari/status/2107510447003824637) remains supplementary evidence with its [own report and preserved attempts](https://github.com/Trex2021/mermail-skills/blob/af173585022eeea7270ca4be95fe737363736e27/evaluation/pr124-native-demo/evidence/20261006/REPORT.md). Each run's one-save count refers to that run, not all attempts combined. The native transcript preserves search/schema recoveries; no perfect first-call behavior is claimed.

Independent human review, upstream maintainer workflow approval and merge remain external gates. This demonstration establishes the stated measured path; it does not prove that every arbitrary email or Mermail operation is secure.

| Item | SHA-256 |
| --- | --- |
| Exact frozen preview | `bbdc153e8a928e632cbc88b84732a41ccf1fab39cbafbb2437fd1cfea8c08241` |
| Verified packet | `e5962fd554b76bd4376f4b73d107722b456f03af3c9c0f588d0119dc4c354733` |
| Exact retrieved server body | `f24828ff824a886071d08dfbf49619fb6ac8a65ad081b054cf400621f5fd9c51` |
| Original continuous MP4 | `ed26ca8fb60451d037e30fe862b9a3d82a8b12c35b66654e48675055e7ec26e5` |

`draft-body.txt` has a final newline; its file hash differs from the exact in-server body hash above.

## Complete observed unsent draft

```text
Entire draft is synthetic and uses hypothetical estimates only; it is not an agreement.

Accepted scope: one responsive landing page and two revisions; one revision remains. Exclusions: authenticated application/login, admin dashboard, and payment processing. Acceptance: responsive at agreed desktop, tablet, and mobile breakpoints. Original deadline: 2026-10-20.

The request adds a dashboard, Stripe processing, login, and two revisions. One revision is included; one is additional. Requested delivery is 2026-10-15 (five days earlier). Client-owned staging access delay: two days.

Hypothetical added labor: 15-22 hours (dashboard 7-9, Stripe 3-5, login 2-4, extra revision 3-4; earlier delivery adds zero). At USD 23.50/hour, ordinary fee: USD 352.50-517.00; 10% rush total: USD 387.75-568.70.

Remove or swap: remove additions or agree an effort-equivalent swap; retain the original fee and 2026-10-20 deadline.
Extend the schedule: retain additions at the ordinary fee; revised deadline 2026-10-24 to 2026-10-25, including the two-day client delay.
Paid rush: retain additions and target 2026-10-15 for USD 387.75-568.70 total.

No option has been accepted, and no additional work is authorized.
```
