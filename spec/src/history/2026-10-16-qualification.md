# Initial qualification

Revision: enclosing Jujutsu change `rumsyqqw`. Date: 2026-10-16.
Requirements: LTERM-ENGINE-001, LTERM-RUNTIME-001, LTERM-FLOW-001,
LTERM-HOST-001, LTERM-TAURI-001, LTERM-UI-001, LTERM-CATALOG-001,
LTERM-PACKAGE-001 and LTERM-GOV-100 through LTERM-GOV-103.

This record supersedes the pending gate states in the foundation record without
rewriting that historical before state. All implementation and repository
changes are confined to the new `lapismd/lapis-terminal` repository. No existing
consumer was migrated and no artifacts were published.

## Scope and before state

The directory did not exist before this slice. The acceptance target was a
standalone terminal package with a native engine/runtime, reusable Tauri helpers,
a flexible Svelte viewport, independent Storybook and working packaged consumers.

`crates/lapis-terminal-engine` contains parsing and grid state;
`crates/lapis-terminal-runtime` owns PTYs, admission inputs and process lifetime;
`crates/tauri-plugin-lapis-terminal` owns the native bridge and window isolation.
`packages/terminal` contains the client, controller, renderer, viewport,
Tauri adapter and test fixtures. `catalog` and `examples/desktop` exercise the
public package with dock and pane compositions. Root scripts, manifests, locks,
guidance and canonical specification establish independent maintenance.

The source import is pinned to jj-store
`fe0abc0c930676da9ff5380c314dd333e744deab`, retaining Buzz attribution at
`ef2aa1ae38fadcc0bc22b8bf6ed96b35933146be`. `docs/imports.json` records 37
source paths, original SHA-256 digests and destinations. The original imported
slicing test is the only non-growing line-count exception. Governance follows
lapis-ai `c504af636267aec8183d2e5c37374a78d6d886cd` with locally owned checks.

## Environment and public formats

Qualified host: macOS 27.0 build 26A428, ARM64, Rust/Cargo 1.99.0,
Node 24.10.0 and pnpm 10.32.1. Native acceptance used Tauri 2.12.4 and the
system WKWebView. Browser interactions used repository-local Playwright Chromium;
Storybook is 10.5.7. Lockfiles record exact dependency versions.

Cargo crates and npm `@lapismd/terminal` are version 0.1.0. The Rust/TypeScript
wire fixture records tagged messages, frame sequence, subscription ID, viewport
generation, rows, clusters, styles and cursor. Open request IDs and session IDs
are UUIDs; trusted launch paths and environment remain Rust-only. Permissions
default empty, with explicit `lapis-terminal:session` admission. Exit messages
currently have no process exit-code payload.

## Verification commands and results

All commands below ran from this repository. Builds used `pnpm dev:cargo`,
whose disk preflight protects the repository-local target. Full repository
lanes were warranted because this new package introduces engine, runtime,
native bridge, browser presentation and their shared build/test infrastructure.

| Command                                                                      | Result                                                                                                                       |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                                                               | Installed workspace development dependencies and lockfile.                                                                   |
| `pnpm browser:install`                                                       | Installed repository-local Chromium for browser checks.                                                                      |
| `pnpm build:js`                                                              | Built all public npm entry points and declarations.                                                                          |
| `pnpm check:js`                                                              | Package and native demo: zero errors, zero warnings.                                                                         |
| `pnpm test:js`                                                               | 10 tests passed; no failures or skipped tests.                                                                               |
| `pnpm test:rust`                                                             | Final workspace result: 106 passed, zero failed, one explicitly ignored latency benchmark.                                   |
| `pnpm test:storybook`                                                        | Final catalog result: 10 stories passed, including interaction and axe checks.                                               |
| `pnpm build-storybook`                                                       | Static Storybook built successfully.                                                                                         |
| `pnpm dev:cargo -- clippy --workspace --all-targets --locked -- -D warnings` | Passed.                                                                                                                      |
| `pnpm check`                                                                 | Complete repository governance, formatting, JavaScript/Svelte and Clippy lane passed.                                        |
| `pnpm test`                                                                  | Complete JavaScript, Rust and Storybook lane passed with the counts above.                                                   |
| `pnpm build`                                                                 | npm package, production demo assets, Storybook and native workspace built.                                                   |
| `pnpm package:check`                                                         | Publint passed; all three Cargo archives verified; isolated packaged Rust PTY consumer and npm/Svelte/Tauri consumer passed. |
| `pnpm test:native`                                                           | Cold production WebView and real PTY acceptance passed; process exit zero and no captured child PIDs survived.               |
| `pnpm spec:validate`                                                         | 12 requirements, complete verification coverage, document limits and links passed.                                           |
| `pnpm spec:build`                                                            | Specification book generated successfully.                                                                                   |
| `pnpm spec:first`                                                            | 139 protected files mapped to nine canonical chapters passed before this final evidence update.                              |

The final product logs are retained locally as `.local/check-final.log`,
`.local/test-final.log`, `.local/build-final.log`, `.local/package-final.log`
and `.local/native-final.log`. These ignored logs are supplementary: the actual
results and limitations are recorded here for review after checkout elsewhere.

After the final evidence and milestone updates, `pnpm spec:check` passed all
seven lanes: validation, formatting, architecture, boundaries, progress,
mdBook and spec-first. Its local log is `.local/spec-final.log`.

The packaged Rust fixture uses only extracted archives through temporary local
patches and runs the runtime's real shell example. The npm fixture installs the
tarball, imports the base entry in Node and bundles the Svelte, Tauri and testing
exports with Vite. It does not use sibling source aliases. These are local
distribution checks, not registry publication or adoption by another app.

## Boundary and lifecycle evidence

Rust coverage includes engine parsing/Unicode/scrollback/resize, environment
canaries observed in real children, retained sessions, bounded transport,
viewport credit, request identity reuse, disable/shutdown and three host
isolation tests. Another window cannot list, attach, input or close an owned
session; denied origins and targets fail through host policy.

JavaScript coverage includes early frame delivery before attach returns,
stale subscription callbacks, obsolete viewport acknowledgements, resize across
remount, prevention of resize/readiness feedback loops, exactly-once discovery
error reporting, grapheme selection, keyboard translation and the Rust wire
fixture. The frame fixture is consumed without field remapping.

Storybook covers dock, workspace panes, bare viewport, light theme, narrow
layout, Unicode input, exited sessions, high output, recoverable errors and
IME/paste/copy/resize. The last story checks one IME commit, bracketed paste,
selected-cell copy and changed height. Fixtures spawn no processes. Error
feedback is supplied by the host rather than duplicated inside the viewport.

The cold native smoke run used production frontend assets and CSP. Its ten
checks passed: PTY cwd/output, canvas, hide/show, workspace panes, Unicode input,
cancelled exit, reload with the same PID, explicit close, disable/enable and
quit cleanup. The final run captured PIDs 78691, 78692 and 78820; the runner
observed none alive after exit. Extra test controls exist only behind the demo's
`native-smoke` feature. The app's ordinary runtime requires no Node or Deno.

Dock and pane screenshots were inspected locally at `.local/evidence/dock.png`
and `.local/evidence/panes.png`. This is inspection evidence, not approved visual
baselines. The dock screenshot captures the maximized interaction end state.

## Failed attempts and corrections

- Initial Rust compilation rejected process-global `set_var` in imported tests
  under Rust 2024. Canary values now seed the command builder's captured
  environment, preserving real-child assertions without unsafe global mutation.
- A demo compile failed because its required icon was absent. An original SVG
  and generated PNG were added; subsequent native builds passed.
- Initial browser execution lacked Chromium. The repository-local browser
  install resolved it. A separate Storybook Vite configuration error prevented
  Svelte import transformation; the corrected configuration passed.
- An early browser run stalled in a resize/readiness feedback loop and was
  stopped. Desired-size deduplication and a regression test resolved it; a
  separate regression protects a remount resize behind an in-flight request.
- The light-theme story initially failed its assertion; the corrected story
  and final full catalog pass cover the theme toggle.
- Native smoke twice failed its background-job fixture because macOS's
  interactive shell expanded `!` in quoted `$!`. The fixture now reads the
  numeric job PID without those quotes. The final native test passed twice.
- A transient Workbench edit duplicated Svelte markup and failed type checking;
  the markup was repaired before the complete check, test and build passes.
- Generated Svelte and Tauri schemas initially appeared in the new JJ change.
  Build caches were untracked and ignored; intentional plugin permission
  metadata remains part of its archive.
- The final specification check caught formatting drift in Tauri-generated
  permission reference Markdown after a native build. Generated permission
  output is now excluded from Prettier, matching generated schemas; authored
  documents remain checked.

Storybook emitted Node loader deprecation and large-bundle advisory warnings;
these did not fail the final build. No assertion, permission or production CSP
was weakened to obtain acceptance.

## Milestone review and remaining qualification

M0 is complete for independent governance and pinned imports. M1 is complete
for engine/runtime and real PTY coverage. M2 is complete for scoped Tauri
helpers and native demo acceptance. M3 is complete for the reusable viewport
and interaction/accessibility catalog. M4 is complete for isolated archives
and cold native acceptance on the qualified macOS ARM64 host.

Visual baselines remain unapproved. The imported idle-host latency benchmark
`g3_renderer_acquire_stays_within_frame_budget` remains ignored and is not a
performance claim. Other operating systems, Windows/mobile adapters and other
Tauri minor versions are unqualified. Existing-app integration, publication,
release signing and cross-platform release qualification are outside this slice.
These limits are not failures concealed by the completed scoped milestones.

Next actions are separate visual review and idle-host performance measurement,
followed by any explicitly requested platform qualification or consumer adoption.
