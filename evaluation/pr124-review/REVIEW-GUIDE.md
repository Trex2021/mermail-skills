# Freelance Margin Guard — focused judge and maintainer review

Updated **7 October 2026**. Review product [`c4876e43189c41771fcfa89f30d6cab400257654`](https://github.com/Trex2021/mermail-skills/commit/c4876e43189c41771fcfa89f30d6cab400257654), submitted in [PR #124](https://github.com/Nudgen-Marketing/mermail-skills/pull/124).

**Problem and outcome:** a freelancer accepts a bounded project, then receives a later email adding work, consuming revisions or compressing the deadline. Margin Guard turns only the selected source evidence and owner-approved commercial inputs into a complete change ledger and three client choices: remove/swap scope, extend the schedule, or approve a paid change order. Missing owner prices stay unpriced; email instructions cannot approve work, messaging or payment.

Development client: **Codex**. Live verification client: **GitHub Copilot CLI 1.0.89 with hosted Mermail MCP**. The local `build_margin_packet` execution adapter calls the shipped product function; it is not a new production Mermail tool.

## A short review route

1. **Watch the [2:45 English graphical live demo](https://x.com/Ehsan_Benvari/status/2107520796780630361)** and inspect its [original run, full prompt, tool events, packet and readback](https://github.com/Trex2021/mermail-skills/blob/4a7a022db79ecec21ac17352806e17f27477f8f8/evaluation/pr124-native-demo/evidence/20261006-graphical/REPORT.md). The 165.145-second continuous light evaluation workspace shows the owner request, selected source emails, a source-linked scope/fee graph, three choices, the complete frozen preview, one internal Mermail draft save and its full verified server readback. **Zero external sends.** It follows real GitHub Copilot CLI and current-run hosted Mermail events; it is an evaluation UI, not the official Mermail web console. Plugin documentation only was prepared before capture, so this is not a cold-start selection benchmark. Owner-delegated operator permission covers that exact synthetic draft; no fresh human approval click is claimed. Keep the [separate 2:02 native-client film](https://x.com/Ehsan_Benvari/status/2107510447003824637) and [five fresh behavior sessions](https://github.com/Trex2021/mermail-skills/blob/23167f2e9b4ae86e10d3e83fc9775b9e176b5ba7/evaluation/pr124-behavior/REPORT.md) as supplementary evidence. All five fresh sessions pass; the original parser failure and recovered builder calls remain visible.
2. **Verify reliability and production connection:** [198/198 exact-product checks and authenticated 83-tool catalog](https://github.com/Trex2021/mermail-skills/actions/runs/37239386192); [bounded red-team findings, repairs and 80 independent automated probes](https://github.com/Trex2021/mermail-skills/blob/990a9f3f928d6d8bde45a7313d3e07b2eba3e01e/security-audit/2026-10-04/REPORT.md).
3. **Inspect [six fresh safety outcomes](https://github.com/Trex2021/mermail-skills/blob/780bba180c652c2c16749a9975f2e26598ec78c8/evaluation/pr124-security/REPORT.md):** unrelated, old and consumed receipts; absent or hostile prices; and a matching hypothetical compatibility receipt all preserve separate action authority. The immutable final product passes all six.
4. **Inspect the current-product tangible result:** [fresh current-product source recomputation and exact existing-draft readback](https://github.com/Trex2021/mermail-skills/blob/fa22fae94092b94dd80c045749443a16fc8f6d38/evaluation/pr124-output/REPORT-CURRENT.md), [successful run 37401281664](https://github.com/Trex2021/mermail-skills/actions/runs/37401281664). Product `c4876e4` reproduced the unchanged approved packet and read the complete existing unsent draft, with zero write attempts. The original [4 October save](https://github.com/Trex2021/mermail-skills/actions/runs/37214396573) still carries historical product `5e79ba3`. This deterministic integration check is distinct from the five natural-language sessions. The exact synthetic negotiation body and source ledger are public; original private identities remain encrypted.
5. **Reproduce and review the code** using the commands and paths below. Current upstream CI still needs maintainer authorization; an automated report is not independent human approval.

## Two deliberately different hypothetical scenarios

| Scenario | Owner inputs | Observed/computed added work | Three choices |
| --- | --- | --- | --- |
| A — committed offline benchmark | $15/hour, 25% rush; committed fixture | **26–33 hours; $390–$495 ordinary labor; $487.50–$618.75 with rush** | Remove/swap; ordinary-fee extension; paid rush |
| B — live agent / saved-draft scenario | $23.50/hour, 10% rush; separately supplied effort estimates | **15–22 hours; $352.50–$517 ordinary fee; $387.75–$568.70 with rush** | Remove/swap; 24–25 October extension; 15 October requested date |

These are **hypothetical owner estimates**, not customer revenue, recovered income, client approval or commercial payments. The pre-existing selected messages are synthetic, self-addressed Sent messages with null scan status and unknown sender authentication. Bounded `get_email_context` reads must have an explicit safe projection; they are not advertised as clean-scanned inbound mail.

## Reproduce in under a minute

Node **22 or newer**; no credentials or network calls after checkout:

```sh
git clone https://github.com/Trex2021/mermail-skills.git margin-guard
cd margin-guard
git checkout --detach c4876e43189c41771fcfa89f30d6cab400257654
npm --offline test
node skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs --input tests/fixtures/freelance-margin-guard.json --format markdown
```

Expected: repository validation, **198/198 checks** (76 core, 57 Funding Gate, 10 remote-contract, 46 security-red-team, 9 publisher), **18 skills / 82 business tools plus the confirmation helper**, and scenario A's evidence-linked Markdown packet. The 80 independent probes are a separate automated check set; embedded randomized iterations are not counted as additional tests.

Live reproduction uses the pinned harness linked in each report, the owner's test key inside Actions, and a Copilot entitlement. It reads only the two selected synthetic sources and advertises external writes solely as safety traps that are never forwarded. No key is committed. Keep a failed attempt visible if a client or transport retry is necessary.

## Inspect the product in maintainer-policy order

| Area | Current-product paths | Required invariant |
| --- | --- | --- |
| Source / approval | `references/security.md`, `scripts/build-margin-packet.mjs`, `scripts/run-live-proof.mjs` in the skill | Selected primary email, safe bounded projection, original identity/date and contiguous quotes; no thread substitution, duplicated delays or invented owner terms. |
| Funding | `references/funding-gate.md`, `scripts/funding-gate.mjs` | Exact covenant approval, chain/genesis, asset, destination, recipient net gain, canonical inclusion, finality, timestamps and replay state. Funding evidence grants no action authority. |
| Routing / ownership | `SKILL.md`, root routing, `tool-coverage.json`, `tests/scenarios.json` | Margin Guard owns comparison; Compose owns outbound execution. No new production MCP tool ownership. |
| Shared helpers | MCP connection checker, remote validator, publisher helpers | Canonical credential destination; redirect rejection; bounded safe diagnostics; strict opt-in and package containment. |
| Workflow / manifests | `.github/workflows/validate.yml`, validator and plugin manifests | Inspect before approving upstream fork runs. Ordinary PR tests do not dispatch optional synthetic sends. |

Open [the complete current product diff](https://github.com/Nudgen-Marketing/mermail-skills/pull/124/files) and [the repaired security diff](https://github.com/Trex2021/mermail-skills/compare/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64...c4876e43189c41771fcfa89f30d6cab400257654). Evidence branches are separate from the product PR.

## Upstream integration remains external

As checked on 7 October: PR #124 is open and has no merge conflict; no human review or inline change request has been submitted. Five current-product upstream runs have conclusion `action_required`:

| Workflow | Existing run |
| --- | --- |
| Validate skills | [37239113655](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37239113655) |
| Plugin Security Scan | [37239113644](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37239113644) |
| Cursor readiness | [37239113686](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37239113686) |
| Publish skills | [37239113714](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37239113714) |
| Publish plugin bundle | [37239114011](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37239114011) |

Maintainer: inspect workflow changes, authorize these existing runs, review source/approval security and routing, then report concrete findings. Findings will need fixes and affected checks rerun before any merge. The repository API confirms the author connection has `pull: true`, `push: false`, `maintain: false` and `admin: false`. It cannot grant upstream approval or manufacture a human review. **Priority 5 is not complete until the actual review and upstream execution occur.**

This bounded evidence does not establish universal security, execution of every production tool, customer adoption or production-backend penetration testing. No private project file or information is included.
