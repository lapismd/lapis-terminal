# Lapis Terminal

[![CI](https://github.com/lapismd/lapis-terminal/actions/workflows/ci.yml/badge.svg)](https://github.com/lapismd/lapis-terminal/actions/workflows/ci.yml)
[![Specification](https://github.com/lapismd/lapis-terminal/actions/workflows/publish-spec-pages.yml/badge.svg)](https://lapismd.github.io/lapis-terminal/)

Reusable Rust terminal sessions, a Tauri plugin and a layout-neutral Svelte
viewport. Applications supply admitted targets and compose docks, tabs or panes.
The desktop runtime needs Rust and a WebView; Node and pnpm are development tools.

[Read the specification](https://lapismd.github.io/lapis-terminal/) ·
[Embedding guide](docs/usage.md) ·
[Qualification and milestones](spec/src/current/progress/milestones.md)

## Packages

| Package                       | Responsibility                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `lapis-terminal-engine`       | Terminal parsing, grid, scrollback and damage frames; no process or Tauri ownership.                   |
| `lapis-terminal-runtime`      | Bounded native PTY sessions, trusted launch configuration and lifecycle.                               |
| `tauri-plugin-lapis-terminal` | Window admission, capabilities, commands, channels and enable/disable helpers.                         |
| `@lapismd/terminal`           | Framework-neutral session client, renderer and types; `/svelte`, `/tauri` and `/testing` entry points. |

The first release is being prepared through an open Changesets PR. Registry
publication and adoption by other applications are separate steps. Everything
builds from this repository without sibling checkouts.

## Develop and review

Use Node 24 (minimum 22.12), pnpm 10.32.1, Rust 1.99 with Clippy/rustfmt, and
mdBook 0.5.4. Native development currently qualifies macOS ARM64 with Xcode
command-line tools and Tauri 2.12.4. Install actionlint 1.7.12 to lint workflows.

```sh
pnpm install --frozen-lockfile
pnpm build:js
pnpm browser:install
pnpm storybook
```

Open [Storybook](http://127.0.0.1:6048). The **Application shells** stories show
Design Core App Shell and Workspace layouts with a bottom terminal. Smaller
**Compositions** cover tabs, panes, input, colored output and high output. The
global toolbar switches every story between light and dark mode. These stories
use deterministic fixtures; they do not run local shells.

Run `pnpm demo:dev` for the native Tauri example. It owns a disposable target
folder and real `/bin/sh` sessions. See [the embedding guide](docs/usage.md) for
`HostPolicy`, capabilities, the Svelte viewport and session ownership.

## Validate

```sh
pnpm dev:cargo -- fetch --locked
pnpm demo:build
pnpm spec:check
pnpm check:workflow
pnpm check
pnpm test
VITE_STORYBOOK_THEME=dark pnpm test:storybook
pnpm build
pnpm package:check
pnpm test:native
```

Use `pnpm dev:cargo -- <arguments>` for Cargo commands; it checks free build
disk space. `package:check` builds isolated consumers from npm/Cargo archives.
`test:native` runs a cold production WebView with real PTYs and verifies process
cleanup. CI runs these gates on macOS ARM64 for main and PR revisions, including
the bot-created version PR. The specification also builds on PRs and deploys
from main to GitHub Pages.

Visual baseline approval, the ignored idle-host benchmark and other native
platforms remain separate qualification work. Tests passing on macOS do not
establish Linux or Windows support.

## Changesets and releases

Run `pnpm changeset` and select `@lapismd/terminal` for changes to the distributed
TypeScript or Rust packages. `pnpm release:check` checks coordinated metadata.
The main-branch workflow opens or updates a **Version Packages** PR using
`pnpm release:version`, including Cargo versions, lockfiles and release evidence.
The PR receives the complete CI suite and stays open for review. This workflow
does not merge, tag or publish packages. See the
[release contract](spec/src/current/contracts/release.md).

Applications own shell selection, filesystem admission, notification UI and
persistent layout. Detaching a viewport keeps its shell alive; explicit close,
disable and shutdown end sessions. Native code is compiled into the host;
enabling it does not download or dynamically load Rust libraries. Shells run
with the local user's authority and are not sandboxes.

Apache-2.0; see [LICENSE.md](LICENSE.md) and [NOTICE.md](NOTICE.md) for attribution.
