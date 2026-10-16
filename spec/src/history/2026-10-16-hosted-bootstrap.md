# Hosted bootstrap correction

Enclosing Jujutsu change: `qypqkmnx`.
Requirements: LTERM-RELEASE-001, LTERM-RELEASE-002, LTERM-RELEASE-003,
LTERM-GOV-100 and LTERM-GOV-103. M5 remains in progress.

Initial source push: `fc99030b456da198be068c7a87449fee3477c6f5`.
The obsolete local `--allow-new` push option was rejected without a push; the
installed Jujutsu accepts new named bookmarks directly. The subsequent
`jj git push --remote origin --bookmark main` succeeded with existing signing.

## Hosted before state

- [Pages run 38904738424](https://github.com/lapismd/lapis-terminal/actions/runs/38904738424)
  passed build and deployment. An HTTP request to the published release chapter
  returned the expected Lapis Terminal specification title.
- [CI run 38904738512](https://github.com/lapismd/lapis-terminal/actions/runs/38904738512)
  failed before tests: the pinned installer does not support actionlint and
  fell back to a nonexistent Cargo package. Use the upstream macOS ARM64 archive
  with the release asset's verified SHA-256 instead.
- [Changesets run 38904739134](https://github.com/lapismd/lapis-terminal/actions/runs/38904739134)
  prepared synchronized 0.1.1 metadata successfully, then failed constructing
  the PR because the manually versioned private demo had no changelog. The
  pinned action source confirms it reads changelogs for every changed workspace
  package. Preparation now maintains that changelog and formats it.

## Validation

`pnpm test:release` with the added changelog assertion first reproduced the
hosted failure: 2 passed and 1 failed with the missing demo changelog. The
upstream actionlint archive download hash matched
`aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f`.

Post-fix `pnpm test:release` passed all 3 tests, including real preparation,
formatted private demo changelog and spec-first acceptance. The exact downloaded
actionlint 1.7.12 binary validated the workflows. `pnpm spec:check` passed all
8 lanes. Hosted reruns are pending this push. No product code changed and
no CI gate was removed. Version PR preparation remains separate from
publication, tags and merging. M0–M4 and native qualification are unchanged.
