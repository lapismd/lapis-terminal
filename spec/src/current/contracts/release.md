# Repository automation and versioning

## Requirements

| ID                | Requirement                                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-RELEASE-001 | Changesets MUST prepare one coordinated version for the npm terminal package and its three Cargo crates, update internal version requirements, lockfiles and changelogs for changed workspace packages, retain private tooling/demo packages, and record canonical release evidence. Version preparation MUST NOT merge PRs, create tags or publish registry packages. |
| LTERM-RELEASE-002 | CI MUST validate committed changes on main and PRs with spec-first, governance, formatting, lint, types, unit tests, both Storybook themes, builds, packaged consumers and cold macOS ARM64 native acceptance. Bot version PRs MUST receive the same checks at their exact head.                                                                                       |
| LTERM-RELEASE-003 | The canonical specification MUST build on PRs and publish from main through GitHub Pages artifacts and deployment, with deployment permission limited to the deploy job. Generated books MUST remain untracked.                                                                                                                                                        |
| LTERM-RELEASE-004 | Cargo publication MUST use a successful CI revision that is still main, require all source checks and consumed changesets, and use crates.io OIDC restricted to this repository, publish-crates.yml and the crates-io environment. Existing versions MUST be skipped, registry errors MUST fail closed, and unknown upload outcomes MUST NOT be retried automatically. |
| LTERM-RELEASE-005 | Main MUST require pull requests, up-to-date branches and successful macOS ARM64 checks and Build specification checks from GitHub Actions. These requirements MUST apply to administrators, with no PR bypass allowances, force pushes or branch deletion.                                                                                                             |

| LTERM-RELEASE-006 | npm publication MUST use the immutable tarball and digest manifest from successful exact-main CI, consumed changesets and protected source checks. Uploads MUST require the npm-production environment, use OIDC after bootstrap and never automatically retry ambiguous outcomes. |
| LTERM-RELEASE-007 | Release completion MUST verify the exact registry version, downloaded tarball integrity, cryptographic signatures, source-bound provenance and a clean frozen registry consumer covering every public entrypoint before creating its package-scoped GitHub release. Existing mismatched tags or artifacts MUST fail closed. |

Prepared version: **0.1.1**.

The npm `@lapismd/terminal` package is the Changesets coordinator. The three
Cargo packages, private tooling root, private demo and Tauri demo metadata use
the same version. Version PR #1 prepared 0.1.1 and was merged after its full
checks passed. Registry availability is never inferred from a version string
or a passing archive check.

`pnpm release:check` rejects version drift, stale Cargo locks, invalid private
package policy and changesets targeting anything other than the coordinator.
`pnpm release:version` consumes changesets, updates Cargo offline after a locked
fetch, refreshes the pnpm lock, formats generated metadata and adds append-only
release evidence. Manifest/version files map to this chapter; runtime source
retains its existing engine, runtime, Tauri and UI mappings. Version-only PRs
have no exemption from spec-first or other CI checks.

The Changesets workflow uses signed GitHub API commits. Because bot pushes may
not trigger ordinary PR workflows, it explicitly dispatches CI and the spec
build on the version branch; CI verifies the expected commit SHA. The workflow
has no publish command and cannot auto-merge the PR. Cargo publication follows
the separately authorized workflow below. npm publication and tagged releases
follow the separately authorized workflow below.

The pending patch changeset records the private attach/output synchronization
repair. It does not prepare a version or authorize npm or Cargo publication.
Specification tooling uses the released Node-only validator `^0.2.0`.

CI qualifies the current macOS ARM64 boundary. Linux builds the specification
and prepares release metadata; that is not Linux native terminal acceptance.
The catalog remains visual-pending and the idle-host benchmark remains a
separate gate. CI caches dependencies/build outputs, never acceptance results.

Version preparation maintains the private demo changelog as well as the public
package changelog: Changesets reads both changed workspace packages when
constructing the PR. The CI runner installs actionlint from its pinned upstream
archive with SHA-256 verification; mdBook uses the pinned installer action.

Fresh CI checkouts build the demo frontend before Rust checks: Tauri's context
macro validates its configured frontend distribution even during Clippy.

[Hosted delivery evidence](../../history/2026-10-16-hosted-delivery.md) records
the first repository, Pages and signed version-PR runs. Later source updates
continue through the same full validation, without automatically merging the PR.

## Cargo trusted publishing

`publish-crates.yml` runs after successful main push CI. Its read-only planning
job verifies the revision is still main, the exact CI run passed and both
required GitHub Actions checks succeeded. Coordinated version metadata, consumed
changesets and canonical release evidence are required. It queries each exact
registry version; only 404 means absent. Errors, malformed or yanked versions
stop the release. Fully published versions need no authentication or upload.
Ordinary commits with pending changesets defer publication until the version
PR consumes them. Explicit verification of an unprepared version fails.
Automatic and manual publication additionally require the repository variable
`CRATES_IO_BOOTSTRAP_COMPLETE=true`, set only after all initial crates and their
publisher registrations are verified. Manual OIDC verification remains usable
during bootstrap; it cannot upload packages.

The publishing job uses the `crates-io` environment, restricted to the `main`
branch. Only this job has `id-token: write`; the pinned official Rust action
exchanges OIDC for a temporary crates.io token and revokes it after the job.
Each of the three crates trusts owner `lapismd`, repository `lapis-terminal`,
workflow `publish-crates.yml` and environment `crates-io`. No long-lived Cargo
token is stored in GitHub. Node and pnpm remain build/release tooling only.

Cargo publishes missing packages in dependency order with locked dependencies
and ordinary archive verification. The job rechecks qualification immediately
before uploading and confirms all three versions are visible afterward.
Interrupted or ambiguous uploads stop; a later explicit rerun queries registry
state before selecting remaining crates. Crates.io rate-limit errors must be
honored, not bypassed with alternate credentials or duplicate requests.

Manual dispatch on main defaults to `mode=verify`, which checks eligibility and
exercises real OIDC without uploading. `mode=publish` can recover a partial
release after inspecting its outcome. Failed or non-main CI, PR workflows and
fork workflows cannot trigger publication. The private demo is never published.

Crates.io requires an initial publication before publisher registration. The
authorized bootstrap uses the existing local Cargo credential from the clean,
qualified merged version; that credential is never copied into this repository
or GitHub. All later Cargo releases use the registered publisher.

The initial 0.1.1 bootstrap is complete: all three versions and publisher
registrations were verified, a registry consumer passed a real PTY example,
and hosted OIDC authentication/revocation succeeded. Automatic publishing is
enabled. [Cargo delivery evidence](../../history/2026-10-16-cargo-delivery.md)
records the exact runs and registry checks.

## Branch protection

Both required checks are bound to GitHub Actions app 15368. PRs must be current
with main, and unresolved review conversations block merging. No human approval
count is added beyond the user's PR-and-checks requirement. Administrators and
automation receive no bypass. New source checks must be added to protection and
the release qualification guard together. Changesets continues to update its
own version branch and must pass the ordinary protected merge path.

## npm delivery

`publish-npm.yml` requires an explicit main dispatch. Its read-only plan
rechecks a successful main-push CI run and both protected GitHub Actions checks
at the current main SHA, coordinated versions, consumed changesets and release
evidence. Only registry 404 means absent; authentication, service and malformed
metadata errors fail closed. CI preserves the actual package-check tarball and
a SHA-256/SHA-512 manifest after full native acceptance. Publication downloads
that immutable artifact from the qualified CI run and verifies its source,
version, content and checksums without rebuilding it.

Only the publishing job has OIDC permission and uses the `npm-production`
environment restricted to main. The initial package requires an already
protected bootstrap credential or a separately approved staged-publication
bootstrap; no user credential is copied into CI. After registration, owner
`lapismd`, repository `lapis-terminal`, workflow `publish-npm.yml` and environment
`npm-production` define its trusted publisher. Token fallback is rejected.
A missing bootstrap credential fails visibly without attempting an upload.

One upload is attempted. A later explicit rerun rechecks registry state before
selecting work. Existing exact versions skip upload only when their integrity
matches the qualified artifact. Verification retries only bounded registry
propagation 404s. Tarball bytes, npm signatures and provenance must bind the
source SHA, main ref, repository and publishing workflow. A fresh public-only
consumer uses an exact registry version, a generated lockfile and `npm ci`,
exercises generic, Svelte, Tauri and testing entrypoints, builds with Vite and
runs `npm audit signatures` to validate cryptography.

The publish-mode GitHub release job runs only after verification. Its scoped
tag is `@lapismd/terminal@VERSION`; existing mismatched or unstable releases
fail. It attaches the qualified manifest and tarball. Verify mode never uploads
a package or creates a release. Cargo retains its existing coordinated delivery.

[Initial npm delivery qualification](../../history/2026-10-30-npm-delivery.md)
records the source and external publication gates separately.

For first-package bootstrap without an inherited protected npm credential,
`mode=attest` requalifies the exact source CI and immutable artifact in
`npm-production`, probes existing protected authentication without printing
credentials, and signs detached npm-compatible provenance with GitHub OIDC.
It binds the sole npm PURL/SHA-512 subject, source SHA, main workflow and run.
The public pinned Sigstore library verifies the signed bundle against the
expected GitHub issuer and workflow identity before artifact upload. It never
uploads to npm or creates a tag. A task-scoped local npm session can submit
the exact tarball with `npm stage publish TARBALL --provenance-file BUNDLE`;
npm revalidates the signature, PURL and digest before staging. A maintainer's
2FA approval completes bootstrap; verification mode must subsequently prove
registry bytes, signatures, provenance and the clean consumer before release.
No local npm credential is read, modified or copied by this repository.
