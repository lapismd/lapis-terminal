# Replacement attachment sink fence

Enclosing change: `sonttnpn`. Requirements: LTERM-RUNTIME-001, LTERM-FLOW-001,
LTERM-GOV-100 and LTERM-GOV-103. M1/M4 review retains separate deterministic,
real PTY, production WebView and Desktop consumer evidence.

Published runtime 0.1.2 exposes a private concurrency defect: detach faults its
subscription, releases the publisher lock, then clears the separately locked
sink. A replacement can install its sink in that gap and lose it to the old
detach. Desktop's unawaited viewport disposal and remount can overlap these
operations; an attached renderer can remain blank without a reported error.

A disposable registry-only consumer exercised the real 0.1.2 runtime and one
local `/bin/sh` PTY. Across 1,000 concurrent detach/replacements, four successful
replacement calls delivered no bootstrap (iterations 20, 171, 333 and 358).
No shell input, package patch, mock transport or Desktop source edit was used.

The forced-interleaving regression is:
`pnpm dev:cargo -- test -p lapis-terminal-runtime stale_detach_cannot_clear_a_replacement_attachment_sink --locked`.
Before: one failure, no retained sink instead of the replacement sink. After:
one pass, zero failures. The test
holds the old detach at actual sink removal while a competing attachment either
completes or proves it is blocked by the publisher transaction.

The repair installs the replacement sink within bootstrap capture's publisher
transaction and holds that same publisher lock through old sink removal.
Publisher-to-engine ordering, channel delivery outside the publisher lock,
bounded frame credit, viewport fences and PTY lifetime remain unchanged.

The user authorized this Rust-only source repair and an immutable Git consumer
pin. The already verified 0.1.2 Cargo/npm release remains immutable; this repair
does not initiate another crates.io or npm publication wave. Native Desktop
correlation and final source/consumer qualification remain pending.

Initial full-workspace Rust validation stopped while compiling the unchanged
native demo because its frontend distribution had not been built in this fresh
workspace. No runtime test failed. Build the normal JS/demo prerequisites and
rerun that same full-workspace command; no distribution shim is permitted.

The first spec check correctly rejected the missing mapped host chapter. Its
unchanged-admission confirmation accompanies the runtime/flow updates; all host
authority and governance gates remain intact.

Desktop's existing bundle was used read-only for 14 cold mounts: ten displayed
the idle prompt and four stayed blank at the unchanged ten-second timeout.
In two failures, a post-failure real Tauri reattachment immediately delivered a
complete frame containing the existing shell prompt, with no input and a live
shell. This separates intact PTY/engine state from the lost rendered delivery;
it does not yet qualify Desktop against the new source repair.

## Source qualification

The unchanged real-PTY 1,000-remount diagnostic passes with zero missing
bootstraps against the repaired owning runtime source. Its isolated Cargo
consumer uses a documented, ignored path override only for this source test;
the earlier failure used the unmodified published 0.1.2 runtime.

After normal `pnpm build:js` and `pnpm demo:build` prerequisites, the exact
`pnpm dev:cargo -- test --workspace --locked` command passes 109 cases with zero
failures and the existing one ignored idle-host performance gate. Strict
`pnpm dev:cargo -- clippy --workspace --all-targets --locked -- -D warnings`
passes. All eight `pnpm spec:check` lanes, formatting, architecture, boundaries,
milestone links and coordinated release metadata pass.

Required hosted full checks, light/dark interaction/accessibility, cold native
demo and the original Desktop consumer gate remain open before final adoption.
