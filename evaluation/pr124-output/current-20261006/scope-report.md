Public projection: original private identifiers are redacted. This representation cannot reauthenticate the private source digests.

# Freelance Margin Guard — FMG-LIVE-34372972140-1

**State:** `scope_change_detected`

## Baseline

Authority: `accepted-proposal`

### Deliverables

- Responsive marketing landing page (`accepted-proposal`)

### Exclusions

- No authenticated application or login (`accepted-proposal`)
- No admin dashboard (`accepted-proposal`)
- No payment processing integration (`accepted-proposal`)

### Acceptance criteria

- Responsive at agreed desktop, tablet, and mobile breakpoints (`accepted-proposal`)

### Commercial terms

- Deadline: **2026-10-20** (`accepted-proposal`)
- Currency: USD
- Rate: **23.5 USD/hour** (`approved-rate`)
- Hours per workday: 8
- Rush rule: **10%** of added labor fee (`approved-rush-rule`)

### Revision budget

| Included | Used before | Requested | Covered | Overflow | Remaining after | Allowance source | Usage source |
| ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 2 | 1 | 2 | 1 | 1 | 0 | `accepted-proposal` | `owner-usage` |

## Request ledger

| Item | Status | Reason | Effort | Estimate source | Evidence |
| --- | --- | --- | ---: | --- | --- |
| Add an admin dashboard | `scope_change` | the request is explicitly excluded by the approved baseline | 7–9 h | `approved-estimate` | “add an admin dashboard” (`later-request`) |
| Add Stripe payment processing | `scope_change` | the request is explicitly excluded by the approved baseline | 3–5 h | `approved-estimate` | “Stripe payment processing” (`later-request`) |
| Add user login and authentication | `scope_change` | the request is explicitly excluded by the approved baseline | 2–4 h | `approved-estimate` | “user login” (`later-request`) |
| Provide two additional revision rounds (1) | `in_scope` | covered by the remaining approved revision allowance | 3–4 h | `approved-estimate` | “two more revision rounds” (`later-request`) |
| Provide two additional revision rounds (1) | `scope_change` | exceeds the remaining approved revision allowance | 3–4 h | `approved-estimate` | “two more revision rounds” (`later-request`) |
| Deliver five calendar days earlier | `scope_change` | the request exceeds an approved quantity or limit | 0 h | `approved-estimate` | “deliver five calendar days earlier” (`later-request`) |

## Margin snapshot

- Known added effort: **15–22 hours**
- Fee at risk: **352.5–517 USD**
- Complete base fee: **352.5–517 USD**
- Rush premium: **35.25–51.7 USD** (`priced`)
- Complete requested-deadline fee: **387.75–568.7 USD**
- Rate provenance: `approved-rate`
- Unpriced items: none
- Deadline compression: **5 calendar days**

## Delay attribution

| Dependency | Owner | Supplied delay | Source |
| --- | --- | ---: | --- |
| Staging credentials arrived after the agreed access date | `client` | 2 days | (`owner-delay`) |

## Client options

| Option | Pricing | Additional fee | Deadline / extension | Conditions |
| --- | --- | ---: | --- | --- |
| `remove_or_swap` — Remove or swap added scope | `not_applicable` | 0 USD | 2026-10-20 | Remove additions or confirm an effort-equivalent swap before work starts. |
| `extend_schedule` — Keep additions and extend the schedule | `priced` | 352.5–517 USD | 2026-10-24–2026-10-25 | Use the ordinary owner-approved rate and include explicitly attributed client delay. |
| `paid_change_order` — Approve a paid change order at the requested deadline | `priced` | 387.75–568.7 USD | 2026-10-15 | Includes only an owner-approved rush rule; otherwise pricing remains approval\_needed. |

## Integrity

- Evidence digest: `685f7ee5fd895a936333861d77f336a40fab4f9fe5cd5337f8683256072d78ec`
- Packet digest: `55b8b1d7af5a90d9c47addbd88698ef06a426567ec34c2f27c76e16d683258c6`
- Algorithm: `sha256` with `sorted-json-v1`

Extra work starts only after written approval of the selected option.
