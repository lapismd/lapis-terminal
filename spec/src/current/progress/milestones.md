# Milestones

Completion is scoped to macOS ARM64 and the acceptance surfaces below. Visual
baseline approval, idle-host performance measurement, other platforms and
consumer adoption remain separate qualification work.

| Task | Status | Dependencies | Gate                                          | Evidence                                                                                                                                                                                                | Next action                                       |
| ---- | ------ | ------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| M0   | Done   | none         | Standalone governance and pinned imports      | [Qualification](../../history/2026-10-16-qualification.md)                                                                                                                                              | Maintain contracts and evidence                   |
| M1   | Done   | M0           | Engine, runtime and real PTY tests            | [Qualification](../../history/2026-10-16-qualification.md)                                                                                                                                              | Separate idle-host performance gate               |
| M2   | Done   | M1           | Scoped Tauri helpers and native demo          | [Qualification](../../history/2026-10-16-qualification.md)                                                                                                                                              | Qualify additional platforms when requested       |
| M3   | Done   | M1           | Viewport and Storybook interaction/axe        | [Qualification](../../history/2026-10-16-qualification.md), [Shell examples](../../history/2026-10-16-design-core-shells.md), [Output alignment and colors](../../history/2026-10-16-catalog-output.md) | Separate visual baseline approval                 |
| M4   | Done   | M2, M3       | Packaged consumers and cold native acceptance | [Qualification](../../history/2026-10-16-qualification.md)                                                                                                                                              | Consumer adoption and publication remain separate |
