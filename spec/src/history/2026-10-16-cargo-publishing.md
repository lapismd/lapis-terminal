# Protected Cargo publishing

Enclosing Jujutsu change: `mlulymzz`. Requirements: LTERM-RELEASE-001 through
LTERM-RELEASE-005, LTERM-GOV-100 and LTERM-GOV-103. The user explicitly authorized
merging PR #1, configuring Cargo trusted publishing and protecting main.
M5 remains Done; M6 tracks registry and OIDC completion. Runtime contracts and
the existing macOS ARM64/visual-pending qualification boundaries are unchanged.

## Before and remote changes

PR #1 head `016934a8271af61c2f833749eac1052b72d7af30` had passing full CI and
specification checks. Main had neither branch protection nor a ruleset. The
three crate names were absent from crates.io. Only version preparation and
Pages deployment existed; no registry publishing workflow was configured.

Configured main protection before merging: require PRs, strict/up-to-date
GitHub Actions checks `macOS ARM64 checks` and `Build specification` (app 15368),
resolved conversations, administrator enforcement, no bypass list, no force
push and no deletion. No additional human review count was requested. The
initial API request was rejected because `contexts` and `checks` were supplied
together; retrying with `checks` alone succeeded and a fresh GET confirmed it.

`gh pr merge 1 --squash --match-head-commit 016934a8271af61c2f833749eac1052b72d7af30`
merged through the ordinary protected path as
`9e260407c325430c0e300324b8926ad7c18876c0`. Main CI run 38915609611 subsequently
passed all validation. Created the `crates-io` environment with a branch policy
allowing only `main`. Existing local credentials were not displayed or copied.

## Implementation and validation

The new workflow uses read-only planning, exact-revision qualification, a
restricted OIDC job, pinned official authentication, dependency-ordered Cargo
publication and registry confirmation. Unit tests cover failed/foreign/PR
triggers, stale revisions, missing or spoofed checks, registry outages/yanks,
partial releases and unknown upload outcomes. `node --test
scripts/cargo-release.test.mjs` passed all 6 tests after the final fixture
adjustment; actionlint passed.

From a clean checkout of the merged version, `pnpm dev:cargo -- publish
--workspace --exclude lapis-terminal-demo --locked --dry-run` verified all three
0.1.1 archives. Cargo warned about optional repository/homepage/documentation
metadata; these are not required fields. The first real publish attempt was
rejected before any upload by crates.io's new-crate rate limit (HTTP 429), with
retry time 14:32:50 UTC. No alternative token or identity was used to evade it.

A clean-checkout retry after that time published `lapis-terminal-engine` 0.1.1.
Crates.io rejected the next new crate with retry time 14:42:50 UTC. Remaining
attempts select only absent crates; the engine will not be uploaded again.
Automatic publication remains disabled behind `CRATES_IO_BOOTSTRAP_COMPLETE`
until all initial crates and exact publisher registrations are confirmed.

The engine publisher registration was created and read back as ID 26195 with
owner `lapismd`, repository `lapis-terminal`, workflow `publish-crates.yml` and
environment `crates-io`. A live read-only release plan against main 9e260407
confirmed the engine version and selected only runtime and Tauri plugin as
missing. Runtime and plugin bootstrap remain pending their rate-limit slots.

Release infrastructure affects shared qualification, so the complete integration
lanes were run: `pnpm spec:check` passed all 8 lanes; `pnpm check` passed;
`pnpm test` passed 8 release tests, 10 TypeScript tests, 106 Rust tests (one idle
benchmark ignored), and 12 Storybook interaction/accessibility stories.
`VITE_STORYBOOK_THEME=dark pnpm test:storybook` passed the same 12 stories.
`pnpm build` and `pnpm package:check` passed, including real Cargo archive and
npm/Svelte/Tauri consumers. `pnpm test:native` passed 10 checks with process IDs
40788, 40789 and 40910; no surviving children and exit 0. Stories remain
visual-pending; other native platforms remain outside qualification.

A subsequent release-only refinement makes ordinary commits with pending
changesets defer publication. `pnpm test:release` then passed 9 tests, including
6 Cargo release tests. The last fixture-only adjustment passed the same 6
focused tests. Product lanes were not repeated for this release-script change;
the protected PR will run complete CI at its exact revision.

M5 remains Done. M6 remains In progress until all initial crates, their publisher
registrations and a real OIDC job are confirmed. The workflow can land safely
while its bootstrap variable is unset; this evidence does not claim that the
two remaining crates or OIDC verification have completed.
