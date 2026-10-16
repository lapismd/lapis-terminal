# GitHub automation qualification

Enclosing Jujutsu change: `wpmwwtms` (GitHub CI, Pages and Changesets setup).
Requirements: LTERM-RELEASE-001, LTERM-RELEASE-002, LTERM-RELEASE-003,
LTERM-PACKAGE-001 and LTERM-GOV-100 through LTERM-GOV-103.

## Before and scope

The local repository had no remote, workflows, Changesets or release scripts.
GitHub returned 404 for `lapismd/lapis-terminal`. The working copy was clean at
`b6206b74`. The README only summarized package purpose and linked local docs.

This slice adds pinned CI and Pages workflows, coordinated Changesets version
preparation, public repository/package metadata, exact-version archive checks
and an expanded README. The initial patch targets 0.1.1 from the locally
qualified 0.1.0 foundation. The first version PR stays open. No registry publish,
release tag, consumer adoption or sibling-source change is part of this task.

Spec-first maps manifest/lock/version files to the release chapter, retaining
all existing source mappings. Automated versions update that chapter and add
append-only preparation evidence. They are not exempt from any checks.

## Validation

Full lanes are required because shared release and CI infrastructure affects
all distributed packages. Local environment: macOS ARM64, Node 26.9.0,
pnpm 10.32.1, Rust/Cargo 1.99.0, mdBook 0.5.4 and actionlint 1.7.12.
Hosted workflows pin Node 24, Rust 1.99.0 and the same pnpm/mdBook/actionlint.

| Command                                            | Result                                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm install --frozen-lockfile --ignore-pnpmfile` | Passed.                                                                                                                                                      |
| `pnpm dev:cargo -- update --workspace --offline`   | Passed; no dependency updates.                                                                                                                               |
| `pnpm dev:cargo -- fetch --locked`                 | Passed; populated all locked platform dependencies for offline preparation.                                                                                  |
| `pnpm test:release`                                | 3 passed: stale-lock and invalid-package rejection, non-increasing version rejection, real disposable Changesets preparation with formatting and spec-first. |
| `pnpm exec changeset status`                       | One patch for `@lapismd/terminal`.                                                                                                                           |
| `pnpm check:workflow`                              | Passed with actionlint 1.7.12.                                                                                                                               |
| `pnpm spec:check`                                  | All 8 lanes passed, including release metadata, mdBook and spec-first.                                                                                       |
| `pnpm check`                                       | Passed; zero Svelte errors/warnings and Clippy warnings denied.                                                                                              |
| `pnpm test`                                        | 3 release, 10 JavaScript, 106 Rust and 12 Storybook tests passed; one existing idle-host benchmark ignored.                                                  |
| `VITE_STORYBOOK_THEME=dark pnpm test:storybook`    | All 12 stories passed.                                                                                                                                       |
| `pnpm build`                                       | JS, demo, static Storybook and Rust builds passed.                                                                                                           |
| `pnpm package:check`                               | Cargo archives, isolated real PTY consumer and npm base/Svelte/Tauri/testing consumer passed.                                                                |
| `pnpm test:native`                                 | 10 cold production WebView/PTY checks passed; PIDs 54064, 54065 and 54096 exited with no survivors.                                                          |

`ci-range.mjs` was exercised with the all-zero first-push base and resolved the
empty tree. An incorrect expected dispatch SHA was rejected. Workflow action
pins were checked against GitHub's action repositories. Generated Pages paths
are checked during the deployment build; public deployment is pending the push.

The first release test failed because the local cache lacked a locked
cross-platform dependency (`jiff-tzdb`). Running the documented locked fetch
resolved it. The next run exposed the old broad `package` pattern also matching
`packages/` as governance; the mapping now assigns package source to its actual
UI/package chapters and manifests to release. The negative source-change test
still fails closed. Initial Changesets status needed the new local `main`
bookmark; status passed after creating it. No assertions or checks were waived.

The public repository and Actions-based Pages site were created at
`https://github.com/lapismd/lapis-terminal`; Actions uses default read permissions
and may create release PRs. The origin uses the existing SSH authentication.
Hosted main/PR runs and the actual Pages response remain pending at this commit.
No registry publication, tag or PR merge was performed.

## Milestone review

M0–M4 remain scoped as previously qualified. M5 is in progress until local
validation, main/PR CI, Pages deployment and the open version PR are verified.
Visual approval, idle-host measurement, Linux/Windows native qualification and
registry publication remain separate.
