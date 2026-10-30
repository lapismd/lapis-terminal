# Governance

## Requirements

| ID            | Requirement                                                                                                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-GOV-100 | Protected changes MUST update mapped canonical requirements or record an unchanged-contract justification, validation and milestone review in the same Jujutsu change.                                   |
| LTERM-GOV-101 | Authored specification Markdown MUST stay within 400 lines and 32768 bytes. Every requirement MUST have exactly one verification row.                                                                    |
| LTERM-GOV-102 | New production files MUST stay within 300 counted lines and tests within 500. Pinned imported exceptions MUST NOT grow. Evidence MUST distinguish fixtures, browser, native and platform acceptance.     |
| LTERM-GOV-103 | Boundary, architecture, progress and spec-first checks MUST protect the package. Validation MUST begin at the narrow affected surface and widen for final integration. Committed history is append-only. |

Catalog dependencies use released registry packages. Application shell examples
must not introduce a sibling-checkout dependency or a Design Core dependency
into the published terminal viewport.

LTERM-GOV-100 is unchanged by the catalog output usage-guide update: it describes
existing composition and palette APIs without changing package ownership or
validation policy. The [catalog output evidence](../history/2026-10-16-catalog-output.md)
records the regression, validation and M3 review.

The Node-only `@lapismd/spec-validator` release and tracked QMD collection enable
`pnpm spec:search --semantic "topic"` over canonical requirements and evidence.
Generated QMD databases remain ignored. Search is local discovery, never a CI
gate. LTERM-GOV-100 and LTERM-GOV-103 retain their existing validation policy.

Repository automation follows LTERM-RELEASE-001 through LTERM-RELEASE-003 in
[the release contract](contracts/release.md). Manifest and lockfile metadata map
to that chapter; source mappings remain intact. CI checks an explicit committed
revision range, including the initial push and dispatched Changesets PRs. No
automation-only spec or test exemption is introduced.

The first hosted run exposed installer and private-demo changelog gaps. The
[hosted bootstrap correction](../history/2026-10-16-hosted-bootstrap.md) records
the exact failures and focused regressions; all ordinary CI gates remain enabled.

The [fresh-checkout correction](../history/2026-10-16-fresh-ci.md) adds the demo
asset prerequisite before Rust validation. LTERM-GOV-100 and LTERM-GOV-103 are
unchanged: this repairs execution of the existing gates without exemptions.

The [composition controls review](../history/2026-10-16-composition-controls.md)
updates catalog fixtures and their README description. LTERM-GOV-100 and
LTERM-GOV-103 remain unchanged; the released viewport and native APIs are not
affected. Final integration retains all ordinary verification lanes.

[Hosted delivery](../history/2026-10-16-hosted-delivery.md) records remote
qualification separately from local checks. LTERM-GOV-100 and LTERM-GOV-103
remain unchanged; milestone completion does not approve visual baselines or
authorize registry publication.

The user authorized merging the first version PR, enabling Cargo trusted
publishing and protecting main. [Publishing evidence](../history/2026-10-16-cargo-publishing.md)
records that extension under LTERM-RELEASE-004 and LTERM-RELEASE-005. Future
repository changes use PRs and required checks, including automation changes.

[Cargo delivery completion](../history/2026-10-16-cargo-delivery.md) records
verified registry and OIDC results and the M6 review. LTERM-GOV-100 and
LTERM-GOV-103 are unchanged: this documentation-only update records external
evidence without relaxing release qualification or package contracts.
