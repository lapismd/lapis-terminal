# Tauri helpers

## Requirements

| ID              | Requirement                                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-TAURI-001 | The Tauri plugin MUST provide typed commands, scoped permissions, channels, enable/disable and teardown helpers. Disabled runtimes reject new work and close sessions. Cancelled exit requests MUST preserve sessions; actual exit MUST clean up. Node and Deno MUST NOT be runtime dependencies. |

## Integration

The plugin builder installs commands, generated permissions and Channel-based
frame delivery. Its default permission is empty; `lapis-terminal:session` is
an explicit host grant. Rust TerminalExt exposes enable/disable/shutdown.
ExitRequested and CloseRequested do not tear down sessions; actual Exit and
WindowEvent::Destroyed do. No shell/filesystem/clipboard plugin is required.

The standalone native demo validates these boundaries with production frontend
assets and CSP. Only its `native-smoke` build feature adds test controls.
