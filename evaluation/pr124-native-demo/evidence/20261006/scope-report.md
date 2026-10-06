# Freelance Margin Guard — Synthetic project

**State:** `scope_change_detected`

## Baseline

Authority: `accepted-scope`

### Deliverables

- One responsive landing page (`accepted-scope`)

### Exclusions

- Authenticated application and login (`accepted-scope`)
- Admin dashboard (`accepted-scope`)
- Payment processing (`accepted-scope`)

### Acceptance criteria

- Responsive at agreed desktop, tablet, and mobile breakpoints (`accepted-scope`)

### Commercial terms

- Deadline: **2026-10-20** (`accepted-scope`)
- Currency: USD
- Rate: **23.5 USD/hour** (`owner-rate`)
- Hours per workday: 8
- Rush rule: **10%** of added labor fee (`owner-rush`)

### Revision budget

| Included | Used before | Requested | Covered | Overflow | Remaining after | Allowance source | Usage source |
| ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 2 | 1 | 2 | 1 | 1 | 0 | `accepted-scope` | `revision-usage` |

## Request ledger

| Item | Status | Reason | Effort | Estimate source | Evidence |
| --- | --- | --- | ---: | --- | --- |
| Add admin dashboard | `scope_change` | the request is explicitly excluded by the approved baseline | 7–9 h | `estimate-dashboard` | “add an admin dashboard” (`later-request`) |
| Add Stripe payment processing | `scope_change` | the request is explicitly excluded by the approved baseline | 3–5 h | `estimate-stripe` | “Stripe payment processing” (`later-request`) |
| Add user login | `scope_change` | the request is explicitly excluded by the approved baseline | 2–4 h | `estimate-login` | “user login” (`later-request`) |
| Two additional revision rounds (1) | `in_scope` | covered by the remaining approved revision allowance | 3–4 h | `estimate-revisions` | “two more revision rounds” (`later-request`) |
| Two additional revision rounds (1) | `scope_change` | exceeds the remaining approved revision allowance | 3–4 h | `estimate-revisions` | “two more revision rounds” (`later-request`) |
| Deliver five calendar days earlier | `scope_change` | the request exceeds an approved quantity or limit | 0 h | `estimate-deadline` | “deliver five calendar days earlier (2026-10-15)” (`later-request`) |

## Margin snapshot

- Known added effort: **15–22 hours**
- Fee at risk: **352.5–517 USD**
- Complete base fee: **352.5–517 USD**
- Rush premium: **35.25–51.7 USD** (`priced`)
- Complete requested-deadline fee: **387.75–568.7 USD**
- Rate provenance: `owner-rate`
- Unpriced items: none
- Deadline compression: **5 calendar days**

## Delay attribution

| Dependency | Owner | Supplied delay | Source |
| --- | --- | ---: | --- |
| Late staging credentials | `client` | 2 days | “Staging credentials were supplied two days after the agreed access date.” (`later-request`) |

## Client options

| Option | Pricing | Additional fee | Deadline / extension | Conditions |
| --- | --- | ---: | --- | --- |
| `remove_or_swap` — Remove or swap added scope | `not_applicable` | 0 USD | 2026-10-20 | Remove additions or confirm an effort-equivalent swap before work starts. |
| `extend_schedule` — Keep additions and extend the schedule | `priced` | 352.5–517 USD | 2026-10-24–2026-10-25 | Use the ordinary owner-approved rate and include explicitly attributed client delay. |
| `paid_change_order` — Approve a paid change order at the requested deadline | `priced` | 387.75–568.7 USD | 2026-10-15 | Includes only an owner-approved rush rule; otherwise pricing remains approval\_needed. |

## Integrity

- Evidence digest: `6fdb29d48a8e7d0826edbc100df2ae88b05658d7e4224333e51de73945954183`
- Packet digest: `69262fd9b38c0eeb672e9b1af2c89bc559e14ab0dea053c5b1182b447f891382`
- Algorithm: `sha256` with `sorted-json-v1`

Extra work starts only after written approval of the selected option.
