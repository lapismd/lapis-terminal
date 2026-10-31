# Hosted replacement sink qualification

Enclosing change: `usnxnuyw`. Requirements: LTERM-RUNTIME-001,
LTERM-FLOW-001, LTERM-GOV-100 and LTERM-GOV-103.

The earlier [source receipt](2026-10-31-detach-sink.md) remains immutable.
Its hosted source gates completed at exact signed source
`2463f944149d753eaf638cf876393a6f60f50190`:

- [Full macOS ARM64 CI](https://github.com/lapismd/lapis-terminal/actions/runs/41154451338)
  passed checks, all unit/runtime tests, light and dark Storybook interactions
  and accessibility, package/build checks, and the cold production WebView with
  a real PTY. The native demo requires the idle prompt before sending input and
  retains its lifecycle/cleanup checks.
- [Specification CI](https://github.com/lapismd/lapis-terminal/actions/runs/41154451323)
  passed its protected build.
- [PR #12](https://github.com/lapismd/lapis-terminal/pull/12) merged normally
  after both required checks passed, at
  `fe678e9f98f644b32a4cace98cbc602972f3d46b`.

M1/M4 review: private source correctness and standalone native acceptance are
complete. Desktop must independently pin that qualified owning Git source and
pass its original cold native consumer gate. Other platform, visual approval
and known-idle performance boundaries remain unchanged.

This Rust-only repair changes no npm payload or release version. The verified
0.1.2 registry artifacts remain immutable; no new npm or crates.io publication
wave is prepared or implied.
