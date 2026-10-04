# Missing primary context projection accepted through a nested sibling

Severity: Low correctness / provenance-contract enforcement. This finding concerns a malformed authenticated tool response; it does not establish a way for an ordinary email body to change server response structure or bypass the server sanitizer.

Observed source: `skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs`, SHA-256 `1442bc3032135c66fc723ce75b3f8a42bcb6c0b7276a2fd0c89b9646f25d47ff`, lines 239–245. `namedSelected` walks all response objects and collects every object-valued `email` property, including surrounding thread entries.

Precondition: The selected safe-context call returns a malformed response without a primary `email`, containing only `{thread:{messages:[{email:selected}]}}`. The nested email has the selected id, eligible scan/safe-content flags, bounded non-omitted body and valid date.

Observed: The independent helper accepts that envelope. The complete synthetic Sent-only CLI also exits zero and reports its proof passed for both selected reads in this format. The ordinary mismatch, omission and plain-thread-sibling cases correctly reject.

Required: The context path must receive and validate its primary selected `email` projection. A surrounding thread entry must not fill in the missing primary. Accepting tool-result structural corruption undermines the documented selected-message gate, even though the accepted nested projection still passes the ordinary identity and safe-body checks.

Raw evidence and source fingerprint are preserved in this directory. Reproduction uses only synthetic local transport and no writes: `node ../final-primary-probes.mjs` and `node final-live-probes.mjs` (the latter includes `sent_nested_primary`). Parent owns remediation; the independent review does not modify product files.
