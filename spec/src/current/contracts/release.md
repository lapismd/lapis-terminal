# Repository automation and versioning

## Requirements

| ID                | Requirement                                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-RELEASE-001 | Changesets MUST prepare one coordinated version for the npm terminal package and its three Cargo crates, update internal version requirements, lockfiles and changelogs for changed workspace packages, retain private tooling/demo packages, and record canonical release evidence. Version preparation MUST NOT merge PRs, create tags or publish registry packages. |
| LTERM-RELEASE-002 | CI MUST validate committed changes on main and PRs with spec-first, governance, formatting, lint, types, unit tests, both Storybook themes, builds, packaged consumers and cold macOS ARM64 native acceptance. Bot version PRs MUST receive the same checks at their exact head.                                                                                       |
| LTERM-RELEASE-003 | The canonical specification MUST build on PRs and publish from main through GitHub Pages artifacts and deployment, with deployment permission limited to the deploy job. Generated books MUST remain untracked.                                                                                                                                                        |
| LTERM-RELEASE-004 | Cargo publication MUST use a successful CI revision that is still main, require all source checks and consumed changesets, and use crates.io OIDC restricted to this repository, publish-crates.yml and the crates-io environment. Existing versions MUST be skipped, registry errors MUST fail closed, and unknown upload outcomes MUST NOT be retried automatically. |
| LTERM-RELEASE-005 | Main MUST require pull requests, up-to-date branches and successful macOS ARM64 checks and Build specification checks from GitHub Actions. These requirements MUST apply to administrators, with no PR bypass allowances, force pushes or branch deletion.                                                                                                             |

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
remain separate tasks.

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
