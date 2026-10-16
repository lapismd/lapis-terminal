# Hosted repository delivery

Enclosing Jujutsu change: `qpmzqkwv`. Requirements: LTERM-RELEASE-001,
LTERM-RELEASE-002, LTERM-RELEASE-003, LTERM-GOV-100 and LTERM-GOV-103.

Repository: <https://github.com/lapismd/lapis-terminal>.
Specification: <https://lapismd.github.io/lapis-terminal/>.
First version PR: <https://github.com/lapismd/lapis-terminal/pull/1>.

## Hosted qualification

Main revision `4008021148a72a5e55e72911f81fea794cbc80d3` includes the
fresh-checkout frontend prerequisite. Its
[CI run 38906210536](https://github.com/lapismd/lapis-terminal/actions/runs/38906210536)
passed every validation step: committed-range spec-first, workflow lint,
governance/formatting/types/Clippy, release/unit/Rust tests, both Storybook themes,
builds, packaged consumers and cold production WebView/real-PTY acceptance.
Its Pages build/deployment
[38906210867](https://github.com/lapismd/lapis-terminal/actions/runs/38906210867)
passed, and Changesets
[38906211064](https://github.com/lapismd/lapis-terminal/actions/runs/38906211064)
updated the existing version PR.

The version PR prepares 0.1.1 across npm, Cargo and the private demo. Reviewed
its file list: version metadata, lockfile, changelogs, consumed changeset and
canonical release evidence only. It remains open with auto-merge disabled.
Exact PR revision `a4c4cac4890cb3cc7db33460023e5bebc84ffd6b` passed the
explicitly dispatched full [CI run 38906307010](https://github.com/lapismd/lapis-terminal/actions/runs/38906307010).
GitHub reports its commit signature as verified and valid. Both corresponding
specification builds passed and correctly skipped deployment from the PR. The
ordinary PR run also reached native acceptance; the dispatched exact-head run
provides the completed full qualification. Main CI completed successfully too.

An HTTP request to the published release chapter returned its expected title.
`pnpm spec:validate`, `pnpm check:progress` and targeted Prettier checks passed.
The completed record and M5 review receive `pnpm spec:check` before commit.
Its first run requested table formatting after M5 changed to Done; Prettier
normalized the milestone table before repeating the full spec check.
The repeated spec check passed all eight lanes.

M5 is Done: the repository is pushed, main and the signed version PR have
completed full hosted qualification, and canonical Pages is published. The
first version PR remains open. M0–M4 retain their existing scoped acceptance.
No registry packages, tags or GitHub releases were published. The latest
composition changes have separate full local evidence in
[the controls review](2026-10-16-composition-controls.md); the combined final
push receives the same CI, Pages and Changesets workflows.
