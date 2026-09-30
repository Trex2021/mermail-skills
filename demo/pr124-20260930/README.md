# Mermail Freelance Margin Guard: current-head continuous proof

Recorded 30 September 2026. Project author: Ehsan Benvari.

**Product commit:** [`3ad5f8ed296d05f8a53b9dfe1ef9ad56c671eb28`](https://github.com/Trex2021/mermail-skills/commit/3ad5f8ed296d05f8a53b9dfe1ef9ad56c671eb28)

[Open the continuous MP4](./continuous-agent-proof.mp4) → [inspect the live-agent job](https://github.com/Trex2021/mermail-skills/actions/runs/36755603483/job/110025051850) → [inspect production validation and the full packet](https://github.com/Trex2021/mermail-skills/actions/runs/36755603483/job/110024935000).

## What the recording proves

The **58.73-second** silent video is an original, continuous, real-time 1280×720 H.264 screen recording. No cuts, acceleration, fabricated calls, or post-production overlays were applied. It captures a sanitized terminal presentation while an independent **GitHub Copilot CLI agent** makes actual read-only calls through Mermail MCP.

The independent agent completed five successful calls:

1. `list_mailboxes`
2. `search_emails`
3. `search_emails`
4. `get_email`
5. `get_email`

The final agent output was checked against the independently validated product scenario:

```text
RESULT_STATE=scope_change_detected
ADDED_HOURS=26-33
TOTAL_USD=487.50-618.75
OPTIONS=3
```

The visible options are to remove or swap scope, extend the schedule with a 390–495 USD additional fee and 6–7 calendar days, or use an approved paid-rush change order totaling 487.50–618.75 USD at the requested deadline. These are calculated scenario options, not executed contracts or payments.

**Development client:** Codex. **Live demonstration client:** GitHub Copilot CLI with Mermail MCP.

## Exact-head provenance

Both successful jobs explicitly check out **`3ad5f8e`**. The workflow's own commit is [`72314d4`](https://github.com/Trex2021/mermail-skills/blob/72314d4fa2ba6216b46f370a44bab86ff408b0e2/.github/workflows/pr124-proof.yml), on an isolated fork demo branch. The workflow and recording are outside the product PR.

The same run passes:

- repository validation: **18 skills and 82 business tools**;
- all **65 core Margin Guard**, **57 Funding Gate**, and **6 offline remote-contract** checks;
- the skill ZIP build;
- authenticated discovery of the exact **83-tool API-key production catalog**, including the confirmation helper;
- read-only workspace/mailbox calls;
- an independent deterministic replay reading the two existing synthetic messages and verifying the complete packet.

The agent has only a narrow read-tool allowlist. Shell, writes, URL access, send/draft, wallet, and payment tools are unavailable to it. The recording feed logs fixed labels, tool names, timestamps, approved synthetic terms, and verified results. Raw agent events and mail/account data remain private temporary runner data; they are not included in the public artifact.

- [Original uploaded artifact](https://github.com/Trex2021/mermail-skills/actions/runs/36755603483/artifacts/11115349570)
- MP4 bytes: **3,096,547**
- MP4 SHA-256: `184495f621c96c7a47d3e99103fbc6cba2f72c9dfc42b2cafa4c6e82de02d79b`
- MP4 Git blob SHA-1: `8631a31a7abbd0abc88e1bf3951b5308bfb99cf2`
- Source artifact ZIP digest: `sha256:abfb65b14d03bbb7f548d0ae8ebe656506fb1d09630b69cd35c15f4b06d993b7`
- Format: H.264, 1280×720, 15 fps, yuv420p, MP4; local full decode verified without errors.

## Evidence boundary

The messages are **pre-existing synthetic self-addressed messages**, not private client correspondence. The recording is a **CI terminal capture**, not a native Mermail console recording. It proves real read-only MCP use and the computed business result; it does not prove a client acceptance, message delivery in this replay, or a paid change order.

The separate public Base/Solana testnet examples are Funding Gate compatibility evidence. They are not a scenario-linked settlement receipt. No `FUNDED` result is claimed for this Mermail scenario.

No client email, reply, draft, wallet connection, transaction, secret, mailbox identifier, or private project data is shown or performed.

The [earlier 2:10 X demo](https://x.com/Ehsan_Benvari/status/2104965245617983902) demonstrates product commit `445f562`. This new recording demonstrates `3ad5f8e`; no new X post is claimed.

## Reproduce the deterministic packet

From a checkout of product commit `3ad5f8e`:

```bash
npm --offline test
node skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs \
  --input tests/fixtures/freelance-margin-guard.json \
  --format markdown
```

This local path requires no credential, sends no message, and uses only the public synthetic fixture.
