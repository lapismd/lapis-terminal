# Version PR App authentication

Revision: enclosing Jujutsu change.

## Contract and review

LTERM-RELEASE-001/002 version PR writes now use the existing dependency App only on canonical
main, scoped to this repository with contents and pull-request write permissions.
Missing credentials fail closed and checkout retains no credentials. The workflow
token remains read-only except existing actions-write dispatch authority where
needed. Existing publisher, dispatch, native and signature gates are preserved;
Changesets does not directly create GitHub releases. No package version changes.

## Verification

- Exact parsed auth regression: 1 failures before the workflow change; three
  passes afterward. Coverage includes canonical admission, scope, absent fallback,
  checkout credentials, API commits, pins and publisher/dispatch token separation.
- `pnpm spec:check`: all eight specification/tooling lanes passed.
- `TMPDIR=/home/steve/.cache/lapis-maintenance-validation pnpm test:release`:
  complete release-tooling suite passed, including the new parsed auth checks.
- `pnpm build:js`, followed by `pnpm check:js`: passed with zero diagnostics.
- Pinned actionlint through `pnpm check:workflow`: passed.

## Remaining acceptance

The initial demo type check had 36 errors because the workspace package's public
dist exports were not built. The normal build prerequisite resolved these to
zero without source changes. Existing doctor expects a root verification chapter
although configuration owns current/verification.md; QMD itself is healthy.
Native macOS, Storybook, package publication and hosted generated-candidate
acceptance remain separate existing gates; no runtime or visual source changed.

Next action: review the protected source PR and qualify the next eligible
App-created version candidate. Do not manufacture a version bump or merge it
without its existing review and functional gates.

## Pinned token API review

The exact action at `63a615b9cd06ba9a3e6d13796c7fbcb080a60a0b` exposes
`github-token` in action.yml. Its src/index.ts prefers explicit GITHUB_TOKEN
environment values before that input. The parsed regression resolves workflow,
job and step environment values before the input so inherited credentials cannot
shadow the scoped App token. The complete release-tooling rerun passes 27/27.
