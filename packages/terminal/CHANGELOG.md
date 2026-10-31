# @lapismd/terminal

## 0.1.2

### Patch Changes

- 7e9da38: Preserve PTY output arriving during initial attachment by capturing the bootstrap
  and installing its subscription under the publisher mutex.
- fdf11d1: Deliver the qualified terminal archive through protected npm publication with source-bound provenance, frozen registry consumer acceptance and package-scoped release receipts.
- 2a0091e: Keep resize and reader snapshots ordered so an older blank capture cannot erase initial shell output while renderer frame credit is held.

## 0.1.1

### Patch Changes

- fc99030: Prepare the first shared terminal distribution: a bounded Rust terminal engine
  and PTY runtime, scoped Tauri plugin, framework-neutral TypeScript session client,
  and composable Svelte viewport. Include layout-neutral embedding helpers,
  packaged consumer checks, Design Core shell examples, light/dark themes and
  colored terminal output. Native qualification currently covers macOS ARM64.
