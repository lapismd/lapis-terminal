# Bounded Cargo registry planning

Enclosing Jujutsu change: `vkuwsnor`, based on merged main `79cf3768`.
Requirements: LTERM-RELEASE-004, LTERM-GOV-100 and LTERM-GOV-103.

The main Cargo publication planning job in run43870075879 failed before
authentication or upload because crates.io returned HTTP429 for
`lapis-terminal-engine@0.1.2`. Main CI and specification Pages had passed.
The existing helper stopped on the first service failure, requiring an operator
rerun even when all three exact versions were already published.

The exact new regression
`node --test scripts/cargo-registry-retry.test.mjs` initially had1 failure
(HTTP429). After the fix, all10 tests pass. Together with
`scripts/cargo-release.test.mjs`, the focused boundary passes17 tests.
A real loopback HTTP server also proves GET429/Retry-After followed by GET200
through the native fetch implementation, with no publication operation.

The owning read helper now caps requests at ten seconds and retries recognized
transient transport errors and HTTP429/500/502/503/504 at most four times within
one60-second monotonic deadline. It honors Retry-After seconds and HTTP dates,
never retries before a cooldown that exceeds the remaining budget, and reports
attempts, elapsed time and delays. Exhaustion remains an error. Only404 means
absent; permissions, invalid data, wrong identities and yanked versions remain
blocking. The upload callback, exact-main/source qualification, OIDC and unknown
upload-outcome handling are unchanged. No release intent or product version is
manufactured for this private tooling fix.

The development validator moves from0.2.0 to the released Node-only0.2.1 through
the normal npm range and lockfile. Its doctor now finds the configured
`current/verification.md`: ten pass checks and the existing intentional wrapper
alias warning. A QMD semantic search located the release contract and evidence.

The first full `pnpm test:release` attempt passed42 and failed3 because the host
GitHub CLI bytes differed from the source-pinned cryptographic verifier.
Installing the unchanged reviewed Lapis CI setup-gh tool into a private cache
and selecting that path repaired the environment: all46 tests pass, including
the real positive and negative cryptographic fixtures. No verifier check changed.
The first workflow check could not start because actionlint was absent from that
PATH; the verified rerun is recorded below.

A read-only live lookup with the repaired helper confirms all three0.1.2 Cargo
versions exist and are not yanked. No upload, release, tag or authentication
dispatch was performed. Hosted PR CI and subsequent main planning remain
separate deployment evidence.

M5/M6 review: retain their existing scoped completion and every native, registry,
signature and protected-main gate. Whole-version-recipe shared guard adoption,
other platform qualification, visual approval and idle-host measurement remain
separate pending work.

Final local checks pass: all17 focused Cargo tests, all46 release-tooling tests,
architecture, boundaries, actionlint1.7.12, coordinated release/progress checks,
and all eight `pnpm spec:check` lanes (including formatting, Cargo formatting,
mdBook and spec-first). The workflow check rerun used actionlint1.7.12 from the
existing tool cache. The initial no-op validator update attempt required the
workspace-root flag; the corrected targeted update changes only that validator
resolution. A first search invocation included an unsupported separator; the
corrected QMD semantic search passed.

Hosted PR CI and subsequent main planning remain pending. No broad product or
native pass is inferred from these release-tooling checks.
