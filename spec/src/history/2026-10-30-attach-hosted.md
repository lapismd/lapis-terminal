# Hosted attachment qualification

Requirements: LTERM-RUNTIME-001, LTERM-FLOW-001, LTERM-RELEASE-002.

The earlier [authored correction receipt](2026-10-30-attach-output.md) is
preserved unchanged. Its pending hosted gates were completed afterward at
immutable source revision `e5bb735c1225ba2e6a83754170e66c5789418885`.

- [Source CI 41138998944](https://github.com/lapismd/lapis-terminal/actions/runs/41138998944)
  completed successfully. It passed specification, workflow, format, type,
  architecture/boundary/progress/release checks, complete JavaScript and Rust
  suites, both Storybook interaction/accessibility themes, all builds, packaged
  Cargo/JavaScript/Svelte/Tauri consumers, and cold production WebView/real PTY
  acceptance on macOS ARM64.
- [Specification run 41138998880](https://github.com/lapismd/lapis-terminal/actions/runs/41138998880)
  completed successfully at that same revision.
- [Ordinary repair PR #4](https://github.com/lapismd/lapis-terminal/pull/4)
  merged after both runs passed, as merge commit
  `4c3ae3024ed0346276afc20960f5c83135598542`. The exact qualified source
  revision remains in merged ancestry for downstream Git pins.

M1/M4 source qualification is complete for this correction within the existing
macOS ARM64 boundary. Desktop consumer native acceptance remains pending and
must consume the exact qualified revision. Its application-owned adapters,
source projections and broader native scenarios require separate evidence.
Visual approval, idle-host performance and additional platforms retain their
existing gates. No version PR merge or registry publication occurred.
