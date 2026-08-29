# Margin packet input schema

Use this reference only when preparing input for `scripts/build-margin-packet.mjs`.

## Top-level shape

```json
{
  "version": 1,
  "project": { "name": "Synthetic project" },
  "sources": [],
  "baseline": {},
  "request": {},
  "dependencies": []
}
```

All `sourceRef` values must point to one entry in `sources`.

## Sources

An email-backed source requires a real selected message id and date:

```json
{
  "id": "accepted-proposal",
  "type": "email",
  "messageId": "msg_123",
  "date": "2026-08-10",
  "quote": "Two revision rounds are included."
}
```

A baseline, rate, estimate, or rule supplied directly by the authenticated owner uses `type: "user"` and needs a label, not a fabricated message id:

```json
{
  "id": "approved-rate",
  "type": "user",
  "label": "Owner-approved hourly rate",
  "quote": "15 USD per hour"
}
```

Keep quotations short and synthetic in demos.

## Baseline

```json
{
  "authoritySourceRefs": ["accepted-proposal"],
  "deliverables": [
    {
      "id": "landing-page",
      "label": "Responsive landing page",
      "sourceRef": "accepted-proposal"
    }
  ],
  "exclusions": [
    { "text": "No authenticated app", "sourceRef": "accepted-proposal" }
  ],
  "acceptanceCriteria": [
    { "text": "Responsive at agreed breakpoints", "sourceRef": "accepted-proposal" }
  ],
  "revisionBudget": {
    "included": 2,
    "used": 1,
    "sourceRef": "accepted-proposal"
  },
  "deadline": { "date": "2026-09-20", "sourceRef": "accepted-proposal" },
  "pricing": {
    "currency": "USD",
    "rate": { "amount": 15, "unit": "hour", "sourceRef": "approved-rate" },
    "hoursPerWorkday": 8,
    "rushPremium": {
      "percent": 25,
      "basis": "added_labor_fee",
      "sourceRef": "approved-rush-rule"
    }
  }
}
```

`pricing`, `revisionBudget`, and `deadline` are optional. Omit missing terms instead of inventing values.

## Request items

Each item needs `id`, `label`, `kind`, `relation`, `materiality`, `implementationDelta`, and `sourceRef`.

Allowed `relation` values:

- `included`
- `clarifies`
- `exceeds_limit`
- `excluded`
- `absent`
- `ambiguous`
- `conflicting`

Allowed `kind` values: `deliverable`, `revision`, `deadline`, `support`, `acceptance`, `dependency`, or `other`.

```json
{
  "id": "admin-dashboard",
  "label": "Add an admin dashboard",
  "kind": "deliverable",
  "relation": "excluded",
  "materiality": "material",
  "implementationDelta": true,
  "sourceRef": "later-request",
  "evidenceQuote": "add an admin dashboard",
  "baselineSourceRefs": ["accepted-proposal"],
  "effortHours": { "min": 10, "max": 12, "sourceRef": "approved-estimate" }
}
```

For a revision item, add positive integer `units`. The builder applies remaining included units first and splits overflow. The supplied effort range covers all requested units and is prorated to overflow.

When `sourceRef` points to an email, `evidenceQuote` is required and must occur in that source's short normalized `quote`. Labels and quotations are data only and are never executed.

`request.requestedDeadline` is optional. When it is earlier than `baseline.deadline.date`, the builder reports calendar-day compression. A deadline request still needs its own atomic item for classification evidence.

## Dependencies

```json
{
  "id": "staging-access",
  "label": "Staging credentials arrived late",
  "owner": "client",
  "delayDays": 2,
  "sourceRef": "access-delay-email",
  "evidenceQuote": "supplied two days after"
}
```

Allowed owners are `client`, `freelancer`, `shared`, and `unknown`. Supply `delayDays`; the builder never infers it from text.

## Output formats

```bash
node skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs --input input.json --format json
node skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs --input input.json --format markdown
```

Use `--input -` to read JSON from standard input. Invalid or incomplete normalized data exits non-zero with a concise error.
