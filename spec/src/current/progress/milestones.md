# Milestones

Completion is scoped to macOS ARM64 and the acceptance surfaces below. Visual
baseline approval, idle-host performance measurement, other platforms and
consumer adoption remain separate qualification work.

M1/M4 review: the [attach/output race correction](../../history/2026-10-30-attach-output.md)
adds deterministic initial-output coverage. [Hosted qualification](../../history/2026-10-30-attach-hosted.md)
completes full source CI, packaged consumers and cold standalone macOS ARM64
acceptance at the immutable correction revision. Desktop native consumer
acceptance remains a separate pending gate.

M5 review: main and the signed version PR passed full hosted CI, Pages is live,
and version PR #1 was subsequently merged with explicit user authorization. See
[hosted delivery](../../history/2026-10-16-hosted-delivery.md).

M6 review: all three 0.1.1 Cargo crates are published, publisher registrations
are verified, live OIDC authentication and token revocation passed, and the
registry consumer ran a real PTY. See [Cargo delivery](../../history/2026-10-16-cargo-delivery.md).
Main protection applies to administrators and all future changes.

M3 review: [composition controls](../../history/2026-10-16-composition-controls.md)
cover the Design Core selector, icon actions, resting tabs and narrow frame.
Visual baseline approval remains separate.

| Task | Status | Dependencies | Gate                                               | Evidence                                                                                                                                                                                                | Next action                                                     |
| ---- | ------ | ------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| M0   | Done   | none         | Standalone governance and pinned imports           | [Qualification](../../history/2026-10-16-qualification.md)                                                                                                                                              | Maintain contracts and evidence                                 |
| M1   | Done   | M0           | Engine, runtime and real PTY tests                 | [Qualification](../../history/2026-10-16-qualification.md)                                                                                                                                              | Separate idle-host performance gate                             |
| M2   | Done   | M1           | Scoped Tauri helpers and native demo               | [Qualification](../../history/2026-10-16-qualification.md)                                                                                                                                              | Qualify additional platforms when requested                     |
| M3   | Done   | M1           | Viewport and Storybook interaction/axe             | [Qualification](../../history/2026-10-16-qualification.md), [Shell examples](../../history/2026-10-16-design-core-shells.md), [Output alignment and colors](../../history/2026-10-16-catalog-output.md) | Separate visual baseline approval                               |
| M4   | Done   | M2, M3       | Packaged consumers and cold native acceptance      | [Qualification](../../history/2026-10-16-qualification.md)                                                                                                                                              | Qualify additional consumer adoption independently              |
| M5   | Done   | M4           | CI, coordinated version PR and specification Pages | [GitHub automation](../../history/2026-10-16-github-automation.md), [Hosted delivery](../../history/2026-10-16-hosted-delivery.md)                                                                      | Maintain protected version-PR checks                            |
| M6   | Done   | M5           | Protected main and Cargo trusted publishing        | [Cargo publishing](../../history/2026-10-16-cargo-publishing.md), [Cargo delivery](../../history/2026-10-16-cargo-delivery.md)                                                                          | Release future prepared versions through protected PRs and OIDC |

M5/M6 review: the [npm delivery lane](../../history/2026-10-30-npm-delivery.md)
qualifies immutable artifacts and exact registry verification. npm bootstrap,
trusted-publisher registration and completed publication remain explicit gates
until external receipts are recorded. Existing source and Cargo evidence stands.

M1/M4 review: [ordered output capture](../../history/2026-10-30-ordered-capture.md)
tracks the additional idle-prompt resize race. The new exact regression and
source/native qualification must pass before the next version PR merges.
Desktop native consumer qualification remains separate.

M5/M6 0.1.2 review: the [delivery receipt](../../history/2026-10-31-release-0.1.2.md)
completes the authorized version-PR approval/merge, all three Cargo versions,
real registry PTY consumer, npm latest/public bytes, source-bound signatures/
provenance, clean frozen npm consumer, trusted-publisher registration and scoped
GitHub release. Native Desktop adoption, other platforms, visual baselines and
the known-idle performance gate remain separate.

M1/M4 follow-up: [replacement sink fencing](../../history/2026-10-31-detach-sink.md)
retains the published 0.1.2 receipt while qualifying the Rust-only immutable Git
consumer repair. Forced interleaving, real PTY and Desktop/native evidence stay
separate; no new Cargo publication or visual approval is implied.
