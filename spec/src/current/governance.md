# Governance

## Requirements

| ID            | Requirement                                                                                                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-GOV-100 | Protected changes MUST update mapped canonical requirements or record an unchanged-contract justification, validation and milestone review in the same Jujutsu change.                                   |
| LTERM-GOV-101 | Authored specification Markdown MUST stay within 400 lines and 32768 bytes. Every requirement MUST have exactly one verification row.                                                                    |
| LTERM-GOV-102 | New production files MUST stay within 300 counted lines and tests within 500. Pinned imported exceptions MUST NOT grow. Evidence MUST distinguish fixtures, browser, native and platform acceptance.     |
| LTERM-GOV-103 | Boundary, architecture, progress and spec-first checks MUST protect the package. Validation MUST begin at the narrow affected surface and widen for final integration. Committed history is append-only. |
