# Attachment initial-output correction

Enclosing Jujutsu change: `msmktnzr`. Requirements: LTERM-RUNTIME-001,
LTERM-FLOW-001; unchanged host admission: LTERM-HOST-001.

## Regression and correction

Desktop native acceptance exposed live shells whose initial prompt never
appeared. The runtime captured a blank bootstrap before taking the publisher
mutex. PTY output could arrive and be offered without a subscription, then the
older blank snapshot was installed. With no later output the prompt stayed
invisible indefinitely.

The deterministic private regression coordinates a real engine feed after
bootstrap capture but before subscription installation. The original ordering
fails with `initial output must not be lost`: one failure, zero passes.
Capture and installation now share the publisher mutex. The same regression
passes: one pass, zero failures. The test also retains exact subscription and
sequence credit and viewport assertions.

Exact command (using the repository's managed Cargo entry point):

```sh
pnpm dev:cargo -- test -p lapis-terminal-runtime --locked session::tests::output_during_attachment_reaches_bootstrap_or_exact_ack_successor -- --exact --nocapture
```

Reader snapshot recovery already uses publisher-to-engine order. All other
inspected paths release the engine lock before taking publisher. Attachment
releases publisher before channel delivery, so synchronous sink callbacks do
not run under that mutex. No public contract signature changes.

## Validation and remaining gates

- `pnpm dev:cargo -- test -p lapis-terminal-runtime --locked`: 31 passed,
  zero failures, including real PTY lifecycle, environment, wire, credit and
  viewport tests.
- Runtime Clippy with all targets and `-D warnings`: passed.
- Engine suite: 73 passed, zero failures; the existing idle-host performance
  gate remains ignored. JavaScript suite: 10 passed, zero failures.
- Both JavaScript checks: zero errors and warnings. Public JavaScript and demo
  frontend builds passed. Release regression suite: nine passed.
- Fresh-process light and dark Storybook interactions/accessibility: 12 passed
  per theme, zero failures. Static Storybook build passed.
- `pnpm spec:check` against the committed base: all eight lanes passed,
  including formatting, architecture, boundaries, progress, coordinated release
  metadata, mdBook and spec-first.
- `pnpm spec:search --semantic "terminal attachment initial output subscription bootstrap frame credit"`:
  QMD returned the canonical frame-delivery chapter and related evidence.
- Spec Validator updated to released Node-only 0.2.0. Doctor confirms QMD binary,
  native bindings and collection health. Its fixed `spec/src/verification.md`
  probe does not recognize this repository's existing `current/verification.md`
  layout; this diagnostic is retained, not hidden with a duplicate record.
- Complete source CI, packaged consumers, native builds and cold acceptance
  remain pending for the review branch. Desktop native acceptance must consume
  the immutable source revision before its initial-output regression is closed.

M1/M4 remain qualified by their historical evidence, with this correction's
remaining integration gates tracked here. No visual baseline approval,
additional platform qualification or publication is claimed.
