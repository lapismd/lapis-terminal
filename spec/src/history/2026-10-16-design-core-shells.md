# Design Core shell examples

Revision: enclosing Jujutsu change `kzsoxnux`. Date: 2026-10-16.
Requirements: LTERM-CATALOG-001, LTERM-CATALOG-002, LTERM-UI-001,
LTERM-PACKAGE-001 and LTERM-GOV-100 through LTERM-GOV-103.

## Scope and before state

The initial catalog used a custom Workbench for both dock and pane examples.
`pnpm test:storybook -t 'BottomDock|WorkspacePanes'` passed two stories with
zero failures and eight skipped, but neither rendered the requested Design
Core application shell. The repository was clean at `ca461091` before editing.

Added `catalog/shells` with a structural App Shell inspired by JJ Store and a
registered-view Workspace inspired by Lapis Notes. Both use public Design Core
0.5.0 exports and prepared styles from the npm registry. The structural shell
places a terminal below its document with hide, maximize and restore controls.
Its transparent, padded left navigation follows JJ Store's shell presentation;
the standard bottom-panel toggle sits in the top rail and there is no right
sidebar toggle. Workspace registers the terminal in its native bottom panel
below a note, with tabs, file navigation, ribbon, status and resizing controls.
The Workspace sidebar starts collapsed and terminal entries use square-terminal.

The composition/input stories now use a simple Design Core App Shell Body,
with all session actions in its header. A shared Storybook appearance control
switches every example between light and dark, including canvas palettes and
registered Workspace views. Three redundant theme-only stories were removed;
the final catalog has eleven stories, exercised in both global modes.

The fixture host explicitly owns its session. Workspace view teardown detaches
the viewport; host teardown closes the fixture session. No sibling application,
native API or runtime dependency changed. Design Core is a root development
dependency; it is absent from the distributed terminal package manifest.

## Retina regression

Visual inspection at device scale factor two revealed canvas CSS dimensions
following its backing image. A narrow regression command,
`pnpm test:storybook catalog/shells/Shells.stories.svelte -t '^AppShell$'`,
failed one test before the fix: the canvas was 1920 CSS pixels wide inside a
960-pixel viewport. The viewport now explicitly sets canvas CSS width/height to
100%, independently of its high-resolution backing image. The same command
passed one test afterward, with three skipped.

The catalog browser provider now uses device scale factor two. Both shell
stories assert canvas-to-viewport geometry. The App Shell checks hide/show,
retained session identity and maximize/restore. Workspace waits for startup,
switches panel tabs, closes/reopens the bottom panel, and checks retained
session identity. App Shell also verifies the bottom toggle's top-rail location.

## Iteration evidence

- `pnpm view @lapismd/design-core version` returned 0.5.0. The quoted command
  `pnpm add -Dw '@lapismd/design-core@^0.5.0'` installed registry artifacts; an
  initial unquoted shell attempt failed glob expansion before making changes.
- `pnpm check:js` initially found four unsupported `exact` options in Testing
  Library role queries. Removing those options preserved exact string matching;
  the next run passed with zero errors and zero warnings.
- The first new shell run had three passes and one failure because it checked
  Workspace readiness before startup completed. Waiting for the public ready
  marker fixed the assertion.
- The next run exposed one dark Workspace story with three contrast findings.
  The themed host now binds the documented view background/foreground tokens
  alongside its Lapis theme, so movable views inherit the intended palette.
  No accessibility rule was disabled. The four-story lane then passed.
- Visual inspection caught missing shared component defaults; importing the
  published `@lapismd/design-core/styles.css` supplied the intended geometry,
  focus treatment and fonts. No consumer Tailwind compiler or source alias was
  added.
- `pnpm check:architecture` passed. `pnpm build:js` rebuilt the public viewport
  after the canvas fix. Storybook was restarted after dependency/config changes.
- Adding PanelToggle initially triggered a late Vite dependency optimization:
  four stories failed and two render errors were reported during the reload.
  Declaring the public entry point in `optimizeDeps.include` stabilized startup;
  the next four-story run passed, including the revised bottom-panel layout.
- The global appearance configuration initially produced two type diagnostics
  (missing Vite environment types and an inferred private renderer type).
  Adding Vite's client types and explicitly typing the Preview resolved both;
  `pnpm check:js` then passed with zero errors and warnings.

## Final verification

Root check/test/build lanes are required because this slice changes the shared
catalog provider, dependency graph and a public viewport style.

| Command                                                    | Result                                                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:storybook catalog/shells/Shells.stories.svelte` | Four intermediate stories passed at device scale factor two, including axe and geometry checks, before consolidation into global themes.                |
| `pnpm test:storybook`                                      | All eleven final stories passed in light mode, including interaction and axe checks.                                                                    |
| `VITE_STORYBOOK_THEME=dark pnpm test:storybook`            | All eleven final stories passed in dark mode, including interaction and axe checks.                                                                     |
| `pnpm check`                                               | Specification, boundaries, architecture, progress, formatting, Svelte/TypeScript and Clippy passed.                                                     |
| `pnpm test`                                                | 10 JavaScript tests, 106 Rust tests and all 11 final Storybook stories passed; zero failures. One existing idle-host latency benchmark remains ignored. |
| `pnpm test:native`                                         | All ten cold native checks passed on macOS ARM64; exit zero; captured PIDs 11733, 11736 and 11751 had no survivors.                                     |
| `pnpm build`                                               | Final package, demo, static Storybook and Rust workspace builds passed.                                                                                 |
| `pnpm package:check`                                       | Three Cargo archives, a real packaged PTY consumer, npm/Svelte/Tauri consumer build and publint passed.                                                 |
| `pnpm spec:check`                                          | All seven lanes passed after the catalog refinements.                                                                                                   |

Logs are retained locally as `.local/shell-stories-final.log`,
`.local/shell-check-full.log`, `.local/shell-test-full.log`,
`.local/shell-build-full.log`, `.local/shell-native.log` and
`.local/shell-package.log`. The final catalog runs are
`.local/shell-stories-global-light.log`, `.local/shell-stories-global-dark.log`,
`.local/shell-check-final.log` and `.local/shell-build-final.log`.
Tests used Node 24.10.0, pnpm 10.32.1,
Rust 1.99.0, Design Core 0.5.0, Storybook 10.5.7 and Chromium at scale two.
The published styles need no consumer Tailwind compilation. Browser inspection
confirmed both full shells, the native Workspace bottom panel, top-rail toggle,
padded sidebar and corrected terminal geometry. The global theme control was
changed in the browser and retained across composition and Workspace navigation.
A fresh Storybook process serves review on port 6048.

After the final Workspace request, its two application-shell stories were
rerun in both modes with
`pnpm test:storybook catalog/shells/Shells.stories.svelte` and the same command
prefixed by `VITE_STORYBOOK_THEME=dark`: two passes per mode. The assertions
confirm the left sidebar starts collapsed and its open control remains present.
Browser reload confirmed the collapsed initial layout and square-terminal icons.
`pnpm build-storybook` passed again; logs are
`.local/shell-stories-collapsed-light.log`,
`.local/shell-stories-collapsed-dark.log` and
`.local/shell-build-storybook-collapsed.log`.

## Milestone review

M3 remains Done with representative Design Core shell and high-DPI interaction
and accessibility evidence added. M0-M2 and M4 retain their earlier scope.
LTERM-ENGINE-001, LTERM-RUNTIME-001, LTERM-HOST-001 and LTERM-TAURI-001
are unchanged: this slice changes presentation and catalog integration only.
The cold native and packaged-consumer evidence remains applicable after the
catalog-only refinements. Screenshots are inspection only and the application
stories remain visual-pending. Publication, existing-app adoption, other
platforms and the ignored idle-host latency benchmark remain out of scope.
