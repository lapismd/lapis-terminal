# npm GitHub metadata correction

Enclosing change: `lustvvww`. Requirements: LTERM-RELEASE-006,
LTERM-RELEASE-007, LTERM-GOV-100 and LTERM-GOV-103. M5/M6 review preserves
actual npm schema/staging/publication/consumer gates separately from signed
artifact preparation and completed Cargo delivery.

## Rejected attempt and exact regression

The release coordinator submitted the qualified 0.1.2 tarball with detached
provenance from protected attest run `41149587175`, source
`2523a0b50a77e22f3b6400b73bf2e3096756c454`. npm rejected it with HTTP422
before creating a staged package because the SLSA v1 statement omitted
`buildDefinition.internalParameters.github.event_name`, `repository_id` and
`repository_owner_id`. Expected values were `workflow_dispatch`, `1422167487`
and `311425888`. No package or tag was published and no uncertain upload was
retried. Credential/debug logs were not read.

The bundle's signature and source binding had passed real Sigstore verification;
that did not prove provider schema admission. npm's official provenance generator
includes these three internal fields, and the registry binds them to the signed
GitHub identity. The owning repository and organization IDs were independently
confirmed through the public GitHub repository API.

Exact command: `node --test scripts/npm-provenance.test.mjs`.
Before repair: **three passed, one failed**; the concrete schema assertion found
`internalParameters` undefined. The generator now includes all three fields from
the validated environment. Missing or foreign repository/owner IDs fail before
signing. The registry-side verifier additionally requires the exact internal
fields, alongside source SHA, main ref, publishing workflow and tarball digest.
The existing real cryptographic/foreign-signer/tamper checks remain enabled.

The earlier bundle and attempt remain historical evidence. A fresh complete
source qualification and protected exact-main attestation are required before
the coordinator submits a newly signed candidate. Initial npm publication and
scoped GitHub release remain pending; Cargo 0.1.2 delivery is already verified.

## Qualified local results

The repaired focused provenance/registry boundary passed **eight of eight**
tests. A preserved real Terminal bundle from the rejected attempt is checked by
the actual Sigstore verifier: its correct workflow signature passes, while the
metadata verifier rejects the missing required fields. Public fixture
`scripts/fixtures/terminal-rejected-github-metadata.json` is 11,886 bytes with
SHA-256 `9eabb3d8147ad906a9536d770526a4a77c17c9275cd9de4d9a05ea2887fb78ba`.

All **24 release tests** passed, including schema admission, foreign/missing
IDs, real signature/foreign-signer/tamper checks and coordinated versioning.
The full eight-lane specification check passed from source 2523a0b5 through this
change, including formatting, architecture, boundaries, progress, release
metadata, mdBook and spec-first. Hosted source qualification and renewed signed
artifact generation remain required before the next provider submission.
