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

The authorized npm release lane extends LTERM-RELEASE-006 and
LTERM-RELEASE-007 in [the release contract](contracts/release.md). Release
scripts, immutable CI artifacts, registry consumers and protected publication
retain LTERM-GOV-100 and LTERM-GOV-103 unchanged. The
[npm delivery evidence](../history/2026-10-30-npm-delivery.md) records validation
and M5/M6 review without inferring publication from version preparation.

Detached bootstrap signing uses the public pinned Sigstore API in the owning
release workflow. LTERM-GOV-100 and LTERM-GOV-103 remain unchanged; signing
does not waive exact-main source qualification, registry acceptance or 2FA.

The [ordered-capture correction](../history/2026-10-30-ordered-capture.md)
extends runtime/frame-delivery evidence under unchanged LTERM-GOV-100 and
LTERM-GOV-103. It retains full native/consumer acceptance and all diagnostics.

The [bootstrap identity correction](../history/2026-10-31-bootstrap-identity.md)
keeps LTERM-GOV-100 and LTERM-GOV-103 unchanged. Public Sigstore integration
acceptance uses an immutable public npm provenance fixture and current TUF trust
metadata; it never requires a signing or npm credential. Functional policy
rejection, cryptographic rejection and eventual hosted signing stay distinct.

The Cargo event relay preserves LTERM-RELEASE-004 qualification and the existing
coordinated version policy. Its unsupported-event failure, zero-upload registry
inspection and supported recovery are recorded in the bootstrap correction;
no local Cargo token, new exception or branch bypass is introduced.

The npm GitHub-metadata correction retains unchanged LTERM-GOV-100 and
LTERM-GOV-103 gates. Signature validity, provider schema admission, actual
staging/2FA, publication and registry-consumer acceptance remain distinct.
No credential log or user npm configuration is read by source verification.

The [0.1.2 delivery receipt](../history/2026-10-31-release-0.1.2.md) keeps
current registry/source state separate from prepared metadata. LTERM-GOV-100
and LTERM-GOV-103 retain every functional/native check and explicit platform,
consumer and visual qualification boundary.
