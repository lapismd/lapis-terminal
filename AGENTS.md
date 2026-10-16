# Lapis Terminal agent guide

This repository owns reusable terminal emulation, native sessions, Tauri helpers
and browser presentation. Apply parent workspace guidance. Source repositories
are references only: implementation here must not modify any sibling or parent.

Read the owning contract under `spec/src/current` before changing code.
Protected changes update mapped requirements or record a justified unchanged
contract confirmation, actual validation and milestone review in the same
Jujutsu change. Commit each verified slice with an explicit message.

New production Rust, TypeScript, Svelte and scripts stay within 300 counted
lines; tests stay within 500. Pinned imported exceptions in
`scripts/architecture-baseline.json` never grow. New tests live separately.
Authored specification Markdown stays within 400 lines and 32768 UTF-8 bytes.

Use `pnpm dev:cargo -- ...` for Cargo. Start with the exact affected tests and
crate/component checks. Final integration requires the complete repository
suite, Storybook interactions/accessibility and cold native acceptance.
Keep deterministic, browser, native and platform evidence distinct. Stories
remain visual-pending until separately approved. Never infer native acceptance
from compilation. Record failures and incomplete gates explicitly.

Applications own target admission, shell/environment selection, notifications,
layout, persistence and trust. The engine owns no process or Tauri API. Generic
TypeScript imports no native bridge, application global, catalog or fixture.
Core packages never depend on sibling checkouts. Node is development tooling.

Use explicit instances, bounded resources and scoped opaque handles. Detaching
views must not kill shells. Only confirmed exit, explicit close, disable or
shutdown tears down processes. No terminal output clipboard writes. Native
shells are local-user processes, not sandboxes. Preserve license attribution.

Repository pushes, specification Pages deployment and version PR preparation
follow `spec/src/current/contracts/release.md`. Never merge version PRs or
publish registry packages/tags without explicit release authorization. Do not
install services, mutate user data or update source repositories.
