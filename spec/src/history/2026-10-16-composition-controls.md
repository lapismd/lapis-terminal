# Composition controls and narrow frame

Enclosing Jujutsu change: `ppyyrpvx`. Requirements: LTERM-CATALOG-001,
LTERM-GOV-100 and LTERM-GOV-103. M3 remains Done within its existing fixture
interaction scope; visual baselines remain unapproved. M0–M4 runtime contracts
are unchanged. M5 hosted automation qualification is tracked separately.

## Before and implementation

The composition target picker was a native select. New terminal and maximize
actions had text, and session controls had no resting background. In the narrow
story the 396px shell root contained a 396px main plus two 8px margins: its
right edge at 846px was clipped by the root at 838px.

Use the released Design Core shadcn Select and Button APIs, with Lucide icons
from its public WorkspaceIcon. Accessible names include the selected target;
icon buttons retain labels and titles. Session groups use semantic secondary
backgrounds and the active shell has an outlined button. App Shell's public
`desktopMinMainWidth={0}` allows the complete frame and margins to fit.
No sibling repository or distributed terminal source changed.

## Verification

The initial focused command used `-t 'Narrow container'`, which matched no
normalized Storybook test names. Its cold optimizer also requested Select
prebundling. Added Select to the test optimizer and used `-t Narrow`.
The next run caught an incorrect test role assumption: the released Select
exposes a button opening a listbox. Corrected the assertion to that API.
The following run caught an axe visible-label mismatch; including the selected
target in the accessible name repaired it without disabling any accessibility
rule. Regression coverage also checks icon-only actions, resting background,
active state, both frame insets, border width and horizontal containment.

`pnpm test:storybook catalog/Terminal.stories.svelte -t Narrow` passed the one
focused interaction/axe test. Both `pnpm test:storybook` and
`VITE_STORYBOOK_THEME=dark pnpm test:storybook` passed all 12 stories. Browser
inspection confirmed the 380px main now has 8px insets on both sides and a 1px
right border. The Design Core popup and both themes were visually inspected;
this is review evidence, not baseline approval.

The first `pnpm check` caught a testing-library type error from Playwright's
unsupported `exact` option. Removing it retained exact string matching, and the
repeated `pnpm check` passed governance, formatting, types and workspace Clippy.
Final integration additionally runs the full tests, builds, archive consumers
and cold native acceptance because this is the requested initial repository
delivery and AGENTS.md requires those gates. Results follow below.

Final local results:

- `pnpm test`: 3 release-preparation tests, 10 TypeScript tests, 106 Rust tests
  and 12 Storybook stories passed. The separate idle-host benchmark remains
  ignored; it is not a performance qualification claim.
- `pnpm build`: npm, demo frontend, production Storybook and Rust workspace
  builds passed.
- `pnpm package:check`: actual Cargo PTY consumer and npm/Svelte/Tauri consumer
  built and passed from archives.
- `pnpm test:native`: 10 cold WebView/real-PTY checks passed, including reload
  retention and shutdown. Fixture PIDs 77582, 77583 and 77588 had no survivors;
  process exit code was zero.
- `pnpm spec:check`: all 8 lanes passed. Documentation-only completion of this
  record is checked with the same governance/formatting lane before commit.

The local full integration gate is complete. Storybook remains on port 6048
for review. Hosted checks for this UI revision follow the push; publication
and merging the first version PR remain outside the authorized task.
