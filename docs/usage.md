# Embedding Lapis Terminal

Runtime is Rust plus a WebView. Node and pnpm are development tools. Applications
own permitted targets, shell profiles, layout, notifications and persistence.

## Tauri

Register `tauri_plugin_lapis_terminal::Builder::new(policy).build()` through
Tauri's `.plugin(...)`. Implement `HostPolicy`: validate the invoking window
label and URL in `authorize`, list opaque targets in `targets`, and revalidate
a target in `resolve` before returning a trusted `LaunchSpec`.
See `examples/desktop/src-tauri/src/main.rs` for a complete runnable host.

Grant `lapis-terminal:session` only to admitted windows through a capability.
The plugin's default permission grants nothing. Shell, filesystem and clipboard
plugins are unnecessary. Hosts do not copy invoke handlers or channel plumbing.

```ts
import { createTauriTerminalClient } from "@lapismd/terminal/tauri";
const terminal = createTauriTerminalClient({
  onError: (error, sessionId) => notices.publish(error.message, sessionId),
});
const targets = await terminal.targets();
const session = await terminal.open({
  requestId: crypto.randomUUID(),
  targetId: targets[0].id,
});
```

Retain the request ID when retrying the same open. A conflicting launch is
rejected; a closed identity is not reopened. Paths, executable, arguments and
environment remain Rust-only. Public metadata contains target IDs and labels.

The `TerminalExt` trait exposes `app.terminal()` for Rust-side enable, disable,
window cleanup and shutdown. Disabling closes sessions and rejects further
access; enabling allows fresh sessions. Shutdown is permanent. Confirmed exit
and destroyed windows clean up; cancelled close/exit requests do not. Keep
`authorize` cheap; listing and resolution run on blocking workers.

Each session belongs to an application instance and window and supports one
active attachment. Attaching again replaces its previous subscription. Multiple
panes normally use separate sessions. Cross-window transfer and simultaneous
mirrors are not v1 features.

## Svelte and other frontends

```svelte
<script lang="ts">
  import { TerminalViewport } from "@lapismd/terminal/svelte";
  import { terminalPalette } from "@lapismd/terminal";
  let { session } = $props();
</script>

<div style="height: 320px; min-width: 0">
  <TerminalViewport
    {session}
    palette={terminalPalette(true)}
    label="Workspace"
  />
</div>
```

Mount attaches; unmount detaches without closing the PTY. Call `session.close()`
when its owner closes the terminal. After renderer reload, call `client.list()`
and create controllers with `client.session(info)`. App restart restores no
processes. App chrome, shortcut policy and persistent layout remain host-owned.

Customize `palette`, `metrics`, `class`, `style`, `label` and `interceptKey`.
The interception callback returns true for app-reserved keys. A component
reference exposes `focus()`. Parents must provide usable height and width;
hidden zero-sized containers are not resized.

The base export supplies `createTerminalClient(transport)`, `TerminalSession`,
`TerminalGrid`, palettes and keyboard utilities without Tauri or Svelte imports.
Custom transports implement the typed grid/frame contract, acknowledgement and
viewport readiness. This is not a raw-byte adapter for an existing web terminal
host. The `/testing` fixture is not an ANSI emulator.

## Native ownership and limits

Rust applications use `Runtime` and trusted `LaunchSpec` directly; see the
runtime crate's `examples/basic.rs`. Default limits are 20 sessions, 4096 closed
identities, 5000 scrollback lines, 64 KiB input messages and 16 queued messages.
Delivery permits one in-flight frame plus one pending full snapshot. `Config`
customizes bounded session/history/scrollback limits and application identity.
Dimensions are 2–512 columns and 1–200 rows. Capacity failures are explicit.

The child environment starts from an allowlist and constructed PATH. Hosts can
supply explicit trusted overrides. Shells run as the local user, not in a
sandbox. OSC52 output cannot write the clipboard.

## Development

Run `pnpm install`, `pnpm build:js`, then `pnpm storybook` or `pnpm demo:dev`.
Storybook uses port 6048. The native demo owns a temporary folder and `/bin/sh`.
Start with **Terminal / Application shells** for two Design Core compositions:
**App Shell** places a dock below a repository document, and **Workspace**
registers a terminal view in its native bottom panel beneath a note. Both have
light and dark appearance through the shared Storybook toolbar control. The
App Shell's top rail uses Design Core's standard bottom-panel toggle to show or
hide the terminal. Composition stories use a simple App Shell Body with session
actions in its header. `VITE_STORYBOOK_THEME=dark pnpm test:storybook` runs the
catalog's interaction and accessibility checks in dark mode.
The catalog consumes released `@lapismd/design-core` and its prepared styles;
the terminal package itself remains independent of Design Core. Example source
is under `catalog/shells`, with explicit fixture session ownership and disposable
Workspace view registration. **Compositions** retains the smaller viewport and
input scenarios. Catalog browser checks run at device scale factor two.

Native code is compiled into a consuming app; enable/disable does not download
or dynamically load Rust libraries.

Final lanes: `pnpm check`, `pnpm test`, `pnpm build`, `pnpm package:check`,
`pnpm test:native`. Run `pnpm browser:install` for repository-local browser tools.
Native smoke uses production assets/CSP and real WKWebView/PTYs. Its extra
commands exist only in the demo's `native-smoke` feature. Visual approval and
the ignored idle-host benchmark are separate. Other platforms and existing
application adoption are not qualified by this repository's tests.
