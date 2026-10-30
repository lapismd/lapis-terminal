# npm delivery qualification

Enclosing Jujutsu change: `sqykxplu`. Requirements: LTERM-RELEASE-002,
LTERM-RELEASE-006, LTERM-RELEASE-007, LTERM-GOV-100 and LTERM-GOV-103.
M5/M6 review preserves existing qualified source/Cargo scope and tracks npm
completion separately. The user explicitly authorized release PR approval,
merge and publication follow-through.

## Initial boundary

Terminal attach correction PR #4 merged at
`4c3ae3024ed0346276afc20960f5c83135598542`. Its complete hosted source CI
`41138998944` and spec `41138998880` passed. Evidence PR #6 merged at
`33041989963ebf5ab0a577ea5ca9ef02defeda5e` after source CI `41140430482`
and spec `41140430578` passed. Version PR #5 remains pending while the npm
delivery lane qualifies. All three Cargo crates exist at 0.1.1;
`@lapismd/terminal` returns npm 404. Existing local npm identity returns E401.
Repository secret inventory is empty, which does not prove inherited protected
organization credentials are absent. No shared authentication was changed.

## Implementation and local validation

The CI tarball is preserved with exact source SHA and both checksums. The
protected main-only release consumes that immutable artifact, validates exact
registry state and source-bound provenance, runs a fresh frozen public consumer
and only then creates a scoped GitHub release. It preserves the existing
coordinated Cargo version policy and never retries unknown upload outcomes.

Baseline `pnpm test:release` contained nine release tests. New focused tests
cover rejected triggers, exact CI/check qualification, pending changesets,
artifact tampering, registry errors, provenance mismatch, bounded propagation,
unknown upload outcomes, token rejection and scoped tag identity. Actual local
results: the nine new focused tests passed, followed by all 18 release tests.
`pnpm spec:check --base 33041989963ebf5ab0a577ea5ca9ef02defeda5e --head @`
passed all eight lanes, including format, architecture, boundaries, progress,
release metadata, mdBook and spec-first. `pnpm check:js` passed both packages
with zero errors/warnings; `pnpm test:js` passed ten tests; JS package build
and publint passed. `actionlint .github/workflows/*.yml` passed; the ordinary
`pnpm check:workflow` cannot discover a Git root in this non-colocated JJ
workspace, so explicit workflow paths were used. Hosted source CI remains the
full Rust/browser/native gate. The npm-production environment was created
with main-only branch admission and administrator bypass disabled.
Hosted/publication receipts will be appended after qualification.

Specification discovery used QMD semantic search. Validator 0.2.0 is the
latest Deno-free release. Its doctor reports the known hardcoded top-level
verification probe despite the configured canonical `current/verification.md`;
no duplicate chapter or diagnostic exemption was added.

## Pending external gates

Merge the delivery implementation after full protected hosted CI; let
Changesets refresh PR #5; review and merge that exact passing version head;
verify coordinated Cargo delivery; publish the immutable npm artifact through
the protected bootstrap; register trusted publication; verify downloaded npm
bytes, signatures, provenance and all public consumer entrypoints; verify the
scoped GitHub release; append completion evidence. No publication is claimed.
