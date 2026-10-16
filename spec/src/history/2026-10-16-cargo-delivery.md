# Cargo registry and trusted-publisher completion

Enclosing Jujutsu change: `wmmnztxy`. Requirements: LTERM-RELEASE-004,
LTERM-RELEASE-005, LTERM-GOV-100 and LTERM-GOV-103. This records completion of
the explicitly authorized release setup. No runtime, package, release-policy
or governance contract changes; the documentation reconciles verified remote
facts with the existing gates. Earlier committed evidence remains unchanged.

## Protected integration

PR #2 head `5aaf0a473d4ea746f94a77c4161150e8d109e1c6` passed CI run 38917624700
and specification run 38917624681. `gh pr merge 2 --squash
--match-head-commit 5aaf0a473d4ea746f94a77c4161150e8d109e1c6` used the ordinary
protected path and produced main `f59a16eede5cf8db4afc3a96264b6788510f85f7`.
Main CI 38918379135, Pages 38918379101 and Changesets 38918379449 all passed.

Fresh branch-protection reads confirmed PRs, both GitHub Actions checks, strict
up-to-date branches, resolved conversations and administrator enforcement.
Force pushes and branch deletion remain blocked; no bypass allowance was
added. The requested policy requires PRs and checks, without a human review
count. The `crates-io` deployment environment
accepts only branch `main`.

## Registry bootstrap and consumer

The rate limit reported in [setup evidence](2026-10-16-cargo-publishing.md)
was honored. From clean qualified main checkouts, these commands completed
ordinary Cargo archive verification and publication:

- `pnpm dev:cargo -- publish -p lapis-terminal-runtime --registry crates-io --locked`
  published runtime 0.1.1 after 14:42:50 UTC from main 9e260407.
- `pnpm dev:cargo -- publish -p tauri-plugin-lapis-terminal --registry crates-io --locked`
  published the Tauri plugin 0.1.1 after the next ten-minute interval from
  qualified main f59a16ee. The engine 0.1.1 was already published.

Each crate now has an independently read-back trusted-publisher configuration:
engine ID 26195, runtime ID 26197 and plugin ID 26202. All select repository
owner `lapismd`, repository `lapis-terminal`, workflow `publish-crates.yml` and
environment `crates-io`. The documented crates.io trusted-publishing API used
the existing local credential without displaying or copying it into GitHub.

The live `releasePlan` against f59a16ee confirmed all three exact 0.1.1 versions
are visible and not yanked, returning `missing: []`. A disposable consumer
under ignored `.local/registry-consumer` depends on the public runtime and
plugin at `=0.1.1`, with no path dependencies or patches. The command
`pnpm dev:cargo -- run --manifest-path .local/registry-consumer/Cargo.toml
--target-dir target` compiled the registry crates and passed the real PTY
example with `Native terminal example passed` and exit 0.

## OIDC and automated delivery

Manual verification run 38919049338 passed before the final crate registration:
it authenticated through the pinned official action, skipped upload and
successfully revoked the temporary token. Once all three public versions and
publisher registrations were verified, `gh variable set
CRATES_IO_BOOTSTRAP_COMPLETE --body true` enabled publication. A fresh API read
confirmed the string value `true`; no long-lived Cargo credential is stored in
GitHub. Final verification run
[38919503295](https://github.com/lapismd/lapis-terminal/actions/runs/38919503295)
passed after all three registrations. Its plan and publish jobs succeeded;
OIDC authentication and post-job token revocation passed, while upload was
correctly skipped in verify mode. No artificial version bump, duplicate upload,
npm publication, tag or GitHub release was created to exercise authentication.

M6 is Done for protected Cargo publication on the qualified macOS ARM64 path.
Future prepared version PRs use the normal required checks and then OIDC.
Consumer adoption, npm publication, other platforms, idle-host performance and
visual baseline approval remain separate work. The current slice changes only
documentation; its formatter and canonical checks are recorded below.

`pnpm exec prettier --write` on the seven changed Markdown files passed.
`pnpm spec:check` passed all 8 lanes, including progress, release metadata,
mdBook and spec-first. Product tests were not repeated locally for this
documentation-only slice; PR #2 and its main revision already passed the full
suite, both Storybook themes, packaged consumers and cold native acceptance.
The evidence PR retains both ordinary required hosted checks before merge.
