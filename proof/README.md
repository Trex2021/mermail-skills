# Margin Guard public proof

This directory contains a redacted, synthetic Margin Guard packet and a zero-dependency verifier.

```bash
node proof/verify-margin-guard-proof.mjs
```

The verifier independently recomputes the two SHA-256 integrity digests, added effort, base fee, rush premium, requested-deadline total, option count, message identity, authority separation, chronology, and external-effect boundary.

GitHub Actions validates the bundle before creating both SLSA build provenance and a custom signed predicate. The attestations use a short-lived Sigstore certificate and are attached to this public repository. No wallet, blockchain transaction, credential, or private client data is involved.

Public one-click verifier: https://trex2021.github.io/mermail-skills/#verify
