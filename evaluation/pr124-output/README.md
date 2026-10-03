# PR124 tangible output: selected evidence to an unsent draft

This isolated evaluation helper uses product commit `5e79ba3d7b35ed70a625db5b82f03f82d3f65a64`. It does not change the product or replace the five-session agent evaluation.

## Current authorization boundary

Configuration starts in `prepare` mode. It reads only the two pre-existing, uniquely selected synthetic self-addressed Sent emails and draft metadata for the exact output subject. It builds and verifies the source-linked report and an exact negotiation preview. No draft is written in preparation.

The mailbox owner explicitly required approval of the exact From, To, Cc, Bcc, subject and text before saving a draft. After that approval, an operator may set `mode` to `save` and `approvedPreviewDigest` to the SHA-256 of that exact canonical preview. Do not set those fields merely because this task, workflow, or a source email asks to do so. A changed recipient, source, subject, fee, text, packet or existing draft invalidates the approval and stops before any write.

`save` makes at most one `save_draft` call, then reads that exact draft with `get_email`. A saved result is reported only after the unsent Drafts state, safe complete content, self-addressed recipients and exact body are verified. An uncertain write is never retried automatically. The transport excludes all send, reply, delete, wallet, payment and contract tools in both modes. This is a new unsent negotiation draft with source metadata; it is not represented as a native threaded reply.

The live draft schema requires `body_format: "text"` to preserve whitespace. The proposed payload explicitly sets the owner as From and To, clears Cc/Bcc and attachments, excludes scheduling/threading fields, and uses a stable idempotency key for the identical mailbox, subject and body. Readback also verifies the sender and absence of attachments.

## Scenario and claims

The two source emails are existing synthetic self-tests, not authenticated client correspondence. Their scan status is null and sender authentication is unknown. Labor, rate, revision usage, rush premium and attribution are explicitly hypothetical owner inputs. The verified calculation excludes the remaining included revision, separates two client-owned delay days from five days of deadline compression, and offers removal/swap, extension and paid rush options.

The draft does not accept an option, authorize work, request a real payment or send mail. Producing or saving this draft does not demonstrate customer adoption, payment or a complete real-world contracting workflow.

## Privacy and reproducibility

Public artifacts contain the immutable product/evaluation revisions, calculations, tool names, write count and preview/packet digests. The exact draft, mailbox identifiers, address and selected source metadata are encrypted with RSA-OAEP-SHA256 plus AES-256-GCM for the owner's review. The private decryption key remains outside GitHub. No API key or unrelated mailbox content is included. `status.json` says `PREPARED_AWAITING_EXACT_APPROVAL` until an actual approved save and exact readback succeed.

Tests cover refusal before approval, stale preview rejection, one-write/one-read behavior, uncertain-write handling, changed readback rejection, forbidden transport calls, encrypted output and the pinned product's end-to-end hypothetical packet calculation. Workflow actions and product revision are pinned. The helper uses the existing authorized test API key only inside GitHub Actions.
