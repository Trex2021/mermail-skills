# Proposed PR review update — prepared, not posted

This is a reviewable draft. It has not been applied to PR #124 or posted as a comment.

## Current verified product

[Product `5e79ba3`](https://github.com/Trex2021/mermail-skills/commit/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64) fixes correspondence between an evidence quotation/date and the two selected live reads, explicitly copies the resolved mailbox identifier, and requires complete reply-preview headers and full-year dates. The host-owned receipt gate rejects fabricated or unsafe source material before a packet can be used; structural packet checksums alone are not proof of email origin or client identity.

[One fresh complete run](https://github.com/Trex2021/mermail-skills/actions/runs/37148484024) on 3 October passes **all five agent scenarios**, **139 product checks**, **22 harness checks** and authenticated production discovery/catalog validation for **83 tools**. The agent used the exact 97-file product plugin. Tested cases cover natural selection with missing commercial approvals, neighboring compose routing, owner-approved terms, a complete reply preview with fresh approval required, and controlled hostile tool content. All cases recorded zero write attempts or scope violations.

[Reviewer report and preserved evidence](https://github.com/Trex2021/mermail-skills/blob/evaluation/pr124-behavior-20261002/evaluation/pr124-behavior/REPORT.md) provide original archives, unchanged failed runs, answers, redacted packets, source manifest, hashes and an offline consistency checker. The final outcome is from one complete run; partial historical runs are not combined into it.

The proof uses GitHub Copilot CLI 1.0.89 and two pre-existing synthetic self-addressed Sent messages. Null scan state and unknown sender authentication are retained. The hostile text is an injected tool response; the packet builder is a local adapter over the shipped product function. Two sessions corrected an initially rejected builder input. This demonstrates the defined workflow and approval boundary, not every client/attack, real customer adoption, an email delivery round trip or a financial settlement. Existing demo videos are historical demonstrations, not recordings of this new product head.

No email, public reply, contract, account/wallet connection or financial transaction was performed. Upstream workflow authorization still requires a maintainer; successful fork proof does not authorize upstream workflows or merge.
