# Milestones

Completion is scoped to macOS ARM64 and the acceptance surfaces below. Visual
baseline approval, idle-host performance measurement, other platforms and
consumer adoption remain separate qualification work.

M1/M4 review: the [attach/output race correction](../../history/2026-10-30-attach-output.md)
adds deterministic initial-output coverage. Focused runtime qualification is
complete; full source CI and Desktop native consumer acceptance remain pending
for this correction. Earlier milestone evidence is historical qualification.

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
| M4   | Done   | M2, M3       | Packaged consumers and cold native acceptance      | [Qualification](../../history/2026-10-16-qualification.md)                                                                                                                                              | Consumer adoption and npm publication remain separate           |
| M5   | Done   | M4           | CI, coordinated version PR and specification Pages | [GitHub automation](../../history/2026-10-16-github-automation.md), [Hosted delivery](../../history/2026-10-16-hosted-delivery.md)                                                                      | Maintain protected version-PR checks                            |
| M6   | Done   | M5           | Protected main and Cargo trusted publishing        | [Cargo publishing](../../history/2026-10-16-cargo-publishing.md), [Cargo delivery](../../history/2026-10-16-cargo-delivery.md)                                                                          | Release future prepared versions through protected PRs and OIDC |
