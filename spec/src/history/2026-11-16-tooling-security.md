# Development tooling security intake

Baseline: Terminal main21616e502eaec123a83caf00db1606bedd9c926b.
LTERM-RELEASE-001/002/007 and LTERM-GOV-100/103 retain their existing contracts.
M5/M6 qualification and visual/platform boundaries are unchanged. This slice
changes development tooling, not terminal runtime, public API, product versions,
native protocol, publication authority or the source-owned version recipe.

## Original findings and exact regression

Fresh full audit exits1 with7 findings:2CRITICAL/2HIGH on Storybook10.5.7,
2MODERATE on Glob13.0.6/Minimatch10.2.6, and1 unfixed development deepmerge LOW.
Production audit exits0 with no findings. One moderate path is the private
Sigstore4.1.1 signing tool through make-fetch-happen15/cacache20, whose published
Glob constraint is^13.0.0. Minimatch10.2.6 also exists through Sigstore/TUF/models. The patched Glob14 range is outside that constraint.

The exact new command `node --test scripts/tooling-cohort.test.mjs` fails2/2 on
the baseline: the Storybook floor and actual locked signature-cache graph.
An initial test authoring syntax error was corrected before recording those
two behavioral failures; it is not counted as a product regression.

## Supported source remediation

Use the aligned published Storybook10.6.7 cohort and Vitest/browser4.1.12 floor.
The first supported SDK5 trial removes vulnerable Glob13, but its latest
TUF/models closure still constrains Minimatch10.2.6. The exact graph regression
therefore remains1FAIL/1PASS. Upstream tuf-js PR1042 is unreleased; waiting,
forcing an out-of-range override or waiving the moderate is not remediation.

The final source-owned composition uses official @sigstore/sign5.1.0 and
@sigstore/bundle5.0.1 for DSSE signing, preserving production endpoints, retry2,
timeout5000, certificateChain=false and Rekor DSSE/fetchOnConflict=false.
The high-level verifier dependency is removed. Its public signing engines are
^22.22.2 || ^24.15.0 || >=26.0.0; only the private tooling root follows them.
The published terminal package has no changed runtime engine or public peer.

GitHub CLI2.102.0 performs actual independent cryptographic verification. Both
real public Terminal0.1.2 and Core0.7.1 bundles/artifacts pass their exact owners;
foreign issuer/workflow/source/ref/signer, changed bytes and tampered payload
reject. The source integration additionally binds the exact Terminal PURL,
SHA512, repository1422167487/owner311425888 and GitHub-hosted certificate,
requires verified timestamp evidence and compares the returned statement.
The intentionally npm-rejected Terminal bundle remains cryptographically valid
and separately fails the unchanged required-GitHub-internals policy.

Tool admission checks executable hashes and version, qualified Node24 npm public
seed1300a33af16967e998983b364ab9988cd5c20e94c44e75d642dbeda1dbc255d9,
and normalized trust root844a1c6de3986c9f02070266b25e0d1a2fa99ceccc89f6b9ad90aae47b62a16e.
No vendored TUF JavaScript is imported. Child verification inherits no credential
environment. Unknown tool/platform/trust bytes fail closed. Linux actual tool
verification is distinct from the required hosted macOS ARM64 tool/native gates.

CLI2.31.1, pnpm10.32.1, Changesets config, Rust1.99, original offline Cargo
bootstrap/update and custom metadata synchronization remain unchanged. No
qualification-only Changeset or version bump is introduced. Actual supported
SDK verification/signing fixtures, immutable artifact/signature policies,
functional/browser/native source gates and later whole-recipe guard proof
remain required before deployment; metadata alone is not qualification.

Raw audits and local logs remain outside tracked source. The unresolved
deepmerge finding remains explicit and unapproved; another repository's
exception does not transfer. Full after counts and executed receipts must be
recorded before this slice is committed or represented as qualified.

## Current executed evidence

The exact cohort regression now passes2/2. Raw final full audit is1LOW,
0MODERATE/0HIGH/0CRITICAL; production audit remains0 before and after. The
remaining GHSA-gcqx-w48m-w2h4 path is
`.>@sveltejs/vite-plugin-svelte>deepmerge@4.3.1`.
No exception is introduced or transferred for the remaining deepmerge LOW.
The new crypto harness initially reports a missing-module setup failure
(not a product behavior count), then the crypto/provenance/registry/cohort
target passes14/14 before the additional
foreign-owner positive control. The final ordinary release suite passes34/34,
including that real foreign-owner positive and all original policy negatives.

`pnpm check` passes specification validation, architecture, boundaries, progress,
format/Rustfmt, both Svelte type checks (0errors/0warnings) and locked Rust Clippy.
`pnpm test` passes34 release tests,10 JS tests,108 Rust tests (one pre-existing
idle performance benchmark remains ignored), and all12 light-theme Storybook
interaction/accessibility cases. A separate fresh process passes12/12 dark cases.
The light run forced new dependency optimization after the graph changed; no
assertion, timeout or visual baseline is changed. Full JS/demo/Storybook/Rust
build and packaged Cargo PTY/npm-Svelte-Tauri consumer acceptance pass.
Frozen installation and actionlint pass; exact-head macOS CI remains pending.

## Supplemental native observation and qualification boundary

The Linux cold `pnpm test:native` reaches all11 UI/PTY checks and exits0,
but the unchanged runner detects background-job PID1376907 still alive after
its5-second cleanup bound; it reports1failure and kills only that fixture PID.
The retained raw report is not a passing native result. Candidate and baseline
21616e50 have byte-identical crates, examples, packages, catalog, Storybook,
Cargo manifests/lock and Rust toolchain inputs. Separate-process-group child
cleanup and its integration regression are explicitly macOS-only in the owning
runtime. The source contract qualifies macOS ARM64 and explicitly excludes
other platform acceptance. The operator retained this Linux observation as an
unqualified-platform gap; this tooling slice does not change product cleanup.
Exact-head hosted macOS ARM64 checks, including cold native acceptance, remain
required. There is no publication, runtime fix, Linux qualification or waiver
inferred from the passing build/browser/tooling results.

M5/M6 review: source-owned tooling security and signature policy remain guarded;
visual baselines, performance, Desktop adoption, other platform qualification,
whole version-recipe qualification and registry publication remain separate.

## Source tooling diagnostics

The qualified standalone actionlint1.7.12 passes. The first plain workflow-check
invocation lacked actionlint on PATH; the pinned binary resolved that host-tool
availability failure without a workflow change. QMD indexing and semantic search
pass. Validator0.2.0 doctor reports one inherited hardcoded-path failure for
`spec/src/verification.md`, while this source config explicitly validates its
canonical `spec/src/current/verification.md`; the actual8-lane specification
check including spec-first/mdBook passes. Doctor also reports the existing alias
warning. No forwarding chapter, exception or source-tool workaround is added.

## Shared tool adoption

CI and detached attest-mode publication consume the merged shared setup-gh action
at cfadc45863cb31d6ca0eb0882f8e618ea38c1052. LapisCI PR15's actual macos-15
ARM64 receipt uses Node24.15.0, qualified binary
8a4258433c81106343144857750316241759d06dcf16265cf3c4864a8f2f2ad6,
and verifies its owned installation and complete attestation argument ABI.
That tool receipt is not Terminal native/product acceptance. The parsed Terminal
workflow regression records2FAIL before adoption and checks exact shared pin,
source-CI ordering and attest-only publication setup; no permission is expanded.
After adoption the exact2/2 parsed controls and complete36/36 release tests pass.
The frozen install and exact actionlint task pass again. Browser/native inputs
are unchanged by this final workflow-only integration; their earlier complete
qualification and explicit Linux gap are retained.

Spec-validator's separate source PR5 repairs configured matrix discovery;
a temporary packed public CLI accepts Terminal with10passes/1intentional
wrapped-alias warning. Terminal's installed0.2.0 doctor still has the recorded
path defect. No validator dependency, lock or source gate is weakened here.
