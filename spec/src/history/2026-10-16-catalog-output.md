# Catalog output alignment and colors

Revision: enclosing Jujutsu change `zxqyzmwy`. Date: 2026-10-16.
Requirements: LTERM-CATALOG-001, LTERM-CATALOG-002, LTERM-UI-001 and LTERM-GOV-100.

## Before and change

The working copy was clean at `9abe00b5`. CompositionFrame retained
`margin-top: auto` on dock-mode viewports after the surrounding document had
been removed. High Output and other default-mode examples therefore displayed
an empty body above the terminal. The viewport itself rendered its rows from
the top correctly.

The exact regression command was
`pnpm test:storybook catalog/Terminal.stories.svelte -t '^HighOutput$'`.
Before the fix: one failure, eight skipped; the viewport started 457 CSS pixels
below the body instead of within its 16-pixel padding allowance. Removing the
auto margin and its conditional class made that same command pass: one pass,
eight skipped. Existing composition interactions now also check top alignment.

CatalogTransport adds deterministic styled spans to the existing fixture
transport. INFO, PASS, WARN, FAIL and prompt prefixes exercise named ANSI
palette colors and bold rendering. Ordinary text remains selectable. High
output alternates status labels; both application examples share the styled
fixture. A dedicated Colored Output story checks visible text and actual
canvas pixels for green, yellow, red and cyan at device scale factor two.
This is a display fixture, not an ANSI parser or native process claim.

No published package, terminal renderer, native runtime or sibling changed.
LTERM-UI-001 remains unchanged: composition and frame styling use its existing
host and palette contracts. The native ANSI engine remains the parser authority.

## Verification

The shared fixture and composition stylesheet affect both story families, so
the parent verification ladder requires the complete catalog plus root
check/test/build. Final native acceptance is required by the repository guide.

| Command                                                                    | Result                                                                                                                  |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Exact HighOutput command above                                             | One failure before; one pass after.                                                                                     |
| `pnpm test:storybook catalog/Terminal.stories.svelte -t '^ColoredOutput$'` | One pass, nine skipped; canvas colors and axe passed.                                                                   |
| Same ColoredOutput command with `VITE_STORYBOOK_THEME=dark`                | One pass, nine skipped; dark canvas colors and axe passed.                                                              |
| `pnpm check`                                                               | Passed: spec, architecture, boundaries, progress, formatting, Svelte/TypeScript and Clippy.                             |
| `pnpm test`                                                                | Passed: 10 JavaScript tests, 106 Rust tests and 12 Storybook stories. One existing idle-host benchmark remains ignored. |
| `VITE_STORYBOOK_THEME=dark pnpm test:storybook`                            | All 12 stories passed, including interaction, axe and canvas color assertions.                                          |
| `pnpm build`                                                               | Passed: npm package, demo frontend, static Storybook and Rust workspace.                                                |
| `pnpm test:native`                                                         | Ten cold macOS ARM64 checks passed; exit zero; PIDs 32460, 32461 and 32463 had no survivors.                            |
| `pnpm spec:check`                                                          | Initial mapped-governance failure; all seven lanes passed after the unchanged-contract note.                            |

Logs are local under `.local/composition-*.log`. Browser inspection confirmed
the removed gap and colored labels. Fresh Vitest browser processes provide
cold catalog runs; the static Storybook build is separately checked. Packaged
consumer checks are not repeated because no published files or dependencies
changed; their prior qualification remains applicable.

The first `pnpm spec:check` passed validation, formatting, architecture,
boundaries, progress and book generation, then reported one spec-first failure:
the changed `docs/usage.md` maps to the governance chapter. An explicit
unchanged-contract confirmation and evidence link were added there; no gate
or mapping was relaxed. The first failure is retained in
`.local/composition-spec.log`; the rerun uses `.local/composition-spec-final.log`.

## Milestone review

M3 remains Done within its existing macOS ARM64 scope, with this catalog
regression added to its evidence. M0-M2 and M4 are unchanged. Changed stories
remain visual-pending; no visual baselines were approved. Publication, existing
app integration and additional platforms remain separate work.
