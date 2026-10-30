# Ordered output capture correction

Enclosing Jujutsu change: `ywxyytvn`. Requirements: LTERM-RUNTIME-001,
LTERM-FLOW-001, LTERM-GOV-100 and LTERM-GOV-103. M1/M4 review retains the
separate Desktop native gate.

## Consumer failure and exact source regression

Desktop hosted native run `41140132320` (Terminal pin `e5bb735c`) reported
99 passes and 10 failures. Two Terminal cases stopped at the initial `$`
assertion: cold input/resize/reload and cancelled close. Their DOM receipts
showed eleven blank viewport rows; native session inspection reported one
live session with `exited:false`. Disable and vault-isolation cases passed
with the same `/bin/sh` fixture. The revoked-admission case reached only
final native Close and failed forced cleanup; that broader Desktop teardown
issue has separate ownership. No assertion was relaxed.

The previous source correction made bootstrap capture/subscription installation
atomic. Initial resize/full snapshots and PTY reader captures still occurred
before taking the publisher's offer lock. An older blank resize capture can
therefore replace a newer prompt capture while bootstrap credit is held.
Without subsequent output, the renderer remains empty.

Exact command:
`pnpm dev:cargo -- test -p lapis-terminal-runtime old_resize_snapshot_cannot_overwrite_newer_initial_output --locked`.
The first attempt stopped before compiling: the unchanged build guard required
20 GiB free and reported only 15.0 GiB. That is a host prerequisite failure,
not a functional test result. Shared cleanup is coordinated with the release
owner; no guard or acceptance assertion is bypassed.

The deterministic regression schedules a blank resize capture, a concurrent
newer prompt capture, the older offer and the exact bootstrap acknowledgement.
Functional before/after counts and wider qualification will be appended after
the required host space is available. Version PR #5 remains unmerged.

## Deterministic before/after

The release coordinator cleared the existing guard by removing only an unused
Desktop incremental compilation cache; source, profiles, evidence and binaries
were preserved. The exact source regression then compiled and failed **1/1**
with `an older resize snapshot must not erase newer idle shell output`.
The pre-fix helper extracted the original snapshot/capture behavior unchanged.

The corrected helper holds the publisher lock through snapshot selection,
engine capture and offer. Both full/resize snapshots and PTY reader frames use
that helper; empty reader frames remain inert. The exact regression then
passed **1/1**. All nested locks follow publisher-to-engine order. Other paths
release the engine before acquiring publisher; publication sends after the
helper releases publisher. No public API, environment or process policy changed.
Wider source, native and Desktop consumer results remain separate gates.

Focused widening passed: `pnpm dev:cargo -- test -p lapis-terminal-runtime -p
lapis-terminal-engine --locked` completed **105 passes**, zero failures and one
explicitly ignored known-idle-host performance test. That includes four real
PTY session tests and the wire fixture. Strict Clippy for both crates and all
targets passed with `-D warnings`. Formatting ran through the owned Cargo
wrapper. Full hosted source CI and a fresh Desktop consumer run remain required.

The first widened specification check passed validation, formatting,
architecture, boundaries, progress, release metadata and mdBook, then correctly
rejected the missing mapped host chapter. The host chapter now records its
unchanged admission/shell/lifecycle contract confirmation; no mapping exemption
was added. The same eight-lane command is rerun before committing.

The cold production-WebView/real-PTY source acceptance now checks the initial
`/bin/sh` prompt before sending any bytes. This preserves the original Desktop
failure boundary in the owning source lane, rather than allowing later input
to repair a missing initial snapshot. Existing input/lifecycle assertions stay.

The same widened specification command subsequently passed all eight lanes,
including every mapped canonical chapter. Both JS/demo type checks passed with
zero errors or warnings after strengthening the native prompt assertion.
