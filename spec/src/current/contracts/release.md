# Repository automation and versioning

## Requirements

| ID                | Requirement                                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-RELEASE-001 | Changesets MUST prepare one coordinated version for the npm terminal package and its three Cargo crates, update internal version requirements, lockfiles and changelogs for changed workspace packages, retain private tooling/demo packages, and record canonical release evidence. Version preparation MUST NOT merge PRs, create tags or publish registry packages. |
| LTERM-RELEASE-002 | CI MUST validate committed changes on main and PRs with spec-first, governance, formatting, lint, types, unit tests, both Storybook themes, builds, packaged consumers and cold macOS ARM64 native acceptance. Bot version PRs MUST receive the same checks at their exact head.                                                                                       |
| LTERM-RELEASE-003 | The canonical specification MUST build on PRs and publish from main through GitHub Pages artifacts and deployment, with deployment permission limited to the deploy job. Generated books MUST remain untracked.                                                                                                                                                        |

Prepared version: **0.1.1**.

The npm `@lapismd/terminal` package is the Changesets coordinator. The three
Cargo packages, private tooling root, private demo and Tauri demo metadata use
the same version. The initial checked-in version is a local foundation; the
first pending patch prepares 0.1.1 for review. Registry availability is never
inferred from a version string or a passing archive check.

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
has no publish command and cannot auto-merge the PR. npm/crates.io publication,
trusted publishing configuration and tagged releases require a separate task.

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
