# PR124: focused human review and upstream validation

Prepared 4 October 2026 for [PR124](https://github.com/Nudgen-Marketing/mermail-skills/pull/124). Product under review: **`5e79ba3d7b35ed70a625db5b82f03f82d3f65a64`**. Upstream base: `9f2e6e0f9d77d4967bd451058fb7c19a32825da9`.

Margin Guard compares an owner-selected accepted scope with a later client request, preserves exclusions and revision allowances, and calculates three evidence-linked options. Email content cannot supply owner approval, invent missing prices, or authorize a message, work or payment.

**Priority 5 is pending external completion:** no human review or inline change request has been submitted, and all five upstream PR workflows require maintainer authorization. Green fork evidence and this author-prepared guide do not constitute independent human approval or an upstream merge. The PR is open and merges cleanly; its merge state is `unstable` while the gates remain outstanding.

## Start with the four preserved outcomes

| Priority | Review these exact records | Observed outcome and boundary |
|---|---|---|
| 1. Independent fresh agent execution | [Successful five-session run](https://github.com/Trex2021/mermail-skills/actions/runs/37148484024), [answers, audit and source manifest](https://github.com/Trex2021/mermail-skills/blob/c7732a38c3bcfd281836d556ad6d3e5771947db7/evaluation/pr124-behavior/REPORT.md) | **5/5 in one run**: natural selection, neighboring Compose route, bounded comparison, approval preview and hostile content. 139 product checks, 22 behavior-adapter checks and authenticated 83-tool discovery. Exact immutable product plugin; no attempted write or scope violation. |
| 2. Tangible unsent Mermail output | [Actual save/readback run](https://github.com/Trex2021/mermail-skills/actions/runs/37214396573), [report](https://github.com/Trex2021/mermail-skills/blob/f99b07cf514bfd700f7d72401df46a33316ab908/evaluation/pr124-output/REPORT.md), [public status](https://github.com/Trex2021/mermail-skills/blob/f99b07cf514bfd700f7d72401df46a33316ab908/evaluation/pr124-output/records/37214396573/status.json) | Exactly **one owner-approved `save_draft` and one matching `get_email`**; full body, From/To, empty Cc/Bcc, no attachments and unsent Drafts state matched. **Zero external sends**. Exact private text and identifiers remain encrypted for the owner; the public status is not a plaintext view of that private draft. Configuration was returned to prepare-only mode. |
| 3. Readable English commercial value | [English value brief](https://github.com/Trex2021/mermail-skills/blob/f99b07cf514bfd700f7d72401df46a33316ab908/evaluation/pr124-output/COMMERCIAL-VALUE.md), [one-page PDF](https://github.com/Trex2021/mermail-skills/blob/f99b07cf514bfd700f7d72401df46a33316ab908/evaluation/pr124-output/Mermail-Commercial-Value.pdf) | Benchmark A: **26–33 added hours, $390–$495 ordinary added-labor value**, $15/hour, 25% hypothetical rush. Saved-draft scenario B: **15–22 hours, $352.50–$517 ordinary fee**, $23.50/hour, 10% rush. Separate hypothetical owner estimates; no revenue, customer approval or recovered income claim. |
| 4. Live security stops | [Fresh six-session run](https://github.com/Trex2021/mermail-skills/actions/runs/37224119608), [English report](https://github.com/Trex2021/mermail-skills/blob/059038280839eed54822616bc242193e2332454a/evaluation/pr124-security/REPORT.md), [independent archive check](https://github.com/Trex2021/mermail-skills/actions/runs/37225180920) | **6/6 original live passes**, 139 product checks and 23 evaluator checks. Unrelated, old and consumed receipts rejected; missing rates remain null; an email's 1 USD/hour assertion is not owner authority. Matching hypothetical Devnet compatibility grants no action authority. Original attempts and recovered builder calls remain documented. |

Development client: **Codex**. Fresh live verification client: **GitHub Copilot CLI 1.0.89 through Mermail MCP**. The proofs cover the named scenarios and one pinned client, not every possible agent or attack.

## Inspect the code in maintainer-policy order

Use the [current 31-file PR diff](https://github.com/Nudgen-Marketing/mermail-skills/pull/124/files). The evaluation branches above are separate from the product PR; preparing this guide does not change its head.

| Review area | Product paths / expected invariant |
|---|---|
| Source and approval security | [Security contract](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/skills/mermail-freelance-margin-guard/references/security.md), [decision engine](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs) and [76 core checks](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/tests/freelance-margin-guard.mjs): host-captured source correspondence, exact selected identity/quotation/date, original baseline authority, revision overflow and missing-pricing stops. |
| Funding security | [Funding contract](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/skills/mermail-freelance-margin-guard/references/funding-gate.md), [engine](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/skills/mermail-freelance-margin-guard/scripts/funding-gate.mjs), [57 checks](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/tests/funding-gate.mjs): exact covenant approval digest, asset/chain/destination, recipient net gain, finality, timestamps, replay ledger and live-observation provenance. Funding never grants work, message or transfer authority. |
| Workflow changes | [validate.yml](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/.github/workflows/validate.yml): ordinary PR validation runs `npm test`. Synthetic send modes are explicit `workflow_dispatch` choices; the default is `connection_only`. Inspect this workflow diff before approving the current PR runs. This review request does not dispatch a synthetic send. |
| Routing and ownership | [Skill](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/skills/mermail-freelance-margin-guard/SKILL.md), [root routing](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/skills/mermail/references/routing.md), [coverage](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/tool-coverage.json), [scenarios](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/tests/scenarios.json): local comparison belongs to Margin Guard; Compose owns outbound execution; 18 skills / 82 business tools plus the confirmation helper. A catalog match is not execution of all 83 operations. |
| Validator and manifests | [Validator](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/tests/validate.mjs), [agent metadata](https://github.com/Trex2021/mermail-skills/blob/5e79ba3d7b35ed70a625db5b82f03f82d3f65a64/skills/mermail-freelance-margin-guard/agents/openai.yaml) and compatibility counts: preserve existing invariants, canonical ownership and hosted MCP dependency. |

Offline reproduction from the exact product checkout, with Node 22 or newer:

```sh
npm --offline test
node skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs --input tests/fixtures/freelance-margin-guard.json --format markdown
```

Expected: **139 product checks** and repository validation pass. The fixture is benchmark A, not the saved draft's scenario B. Each evidence report has its own pinned harness and independent reproduction commands. No test API key is needed for these offline commands.

## Upstream runs requiring maintainer authorization

All five runs below belong to product head `5e79ba3d7b35ed70a625db5b82f03f82d3f65a64` and currently have conclusion `action_required`:

| Workflow | Exact existing run |
|---|---|
| Validate skills | [37147782342](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37147782342) |
| Plugin Security Scan | [37147782398](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37147782398) |
| Cursor Directory submission readiness | [37147782241](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37147782241) |
| Publish skills to ClawHub | [37147782395](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37147782395) |
| Publish plugin bundle to ClawHub | [37147782754](https://github.com/Nudgen-Marketing/mermail-skills/actions/runs/37147782754) |

The connected author has read access to upstream, without write, triage, maintain or admin permission. It cannot assign formal reviewers or authorize fork workflows. The repository's [CODEOWNERS](https://github.com/Nudgen-Marketing/mermail-skills/blob/9f2e6e0f9d77d4967bd451058fb7c19a32825da9/.github/CODEOWNERS) identifies the `mermail-skills-maintainers` team for sensitive paths. `binhnguyen2501` is the verified upstream merge author and recipient of the existing PR review requests.

[GitHub's workflow approval procedure](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/approve-runs-from-forks) requires a maintainer to inspect the diff and choose **Approve workflows to run**. [Formal review requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/requesting-a-pull-request-review) also require the appropriate upstream permission.

## Conditions for completing priority 5

- [x] All four evidence paths identify the same immutable product and distinguish their scenarios and authorization boundaries.
- [x] A short English review route follows the official maintainer review order.
- [ ] An independent human review is submitted on the current product head.
- [ ] Any concrete review findings are addressed and the affected checks rerun. No findings have been submitted yet; zero findings is not a claim of universal correctness.
- [ ] A maintainer authorizes the existing upstream PR workflows, and their actual jobs complete successfully.
- [ ] The PR's review, CI and merge status are rechecked on the exact final head. Any merge is a separate action requiring the owner's explicit approval.

The selected sources are two synthetic self-addressed Sent messages with null scan state and unknown sender authentication. Values are hypothetical owner estimates. The receipt is an existing Solana Devnet compatibility transaction, not payment for the selected change order. Exact private draft content remains owner-encrypted; public redacted packets cannot reauthenticate private source digests. No private HSE file or project information is included.
