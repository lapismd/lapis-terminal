# @lapismd/terminal

Layout-neutral terminal viewport and session client. Apache-2.0.

- Base export: framework-neutral client, controller, renderer and public types.
- `/svelte`: `TerminalViewport`, Svelte 5; parent supplies layout dimensions.
- `/tauri`: `createTauriTerminalClient`, paired with tauri-plugin-lapis-terminal.
- `/testing`: deterministic fixture transport without native processes.

Mounting attaches; unmounting detaches without closing a shell. Call
`session.close()` for explicit ownership teardown. Configure host targets and
window admission through the Rust plugin's HostPolicy. Tauri commands require
an explicit lapis-terminal:session capability. Native code is compiled into the
host; it does not require Node or Deno at runtime.

Svelte and @tauri-apps/api are optional peers required only by their entry points.
