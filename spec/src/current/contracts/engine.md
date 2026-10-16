# Engine

## Requirements

| ID               | Requirement                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-ENGINE-001 | The engine MUST own bounded parsing, Unicode grid, scrollback, damage and viewport generations without PTY, Tauri, application or network dependencies. OSC52 clipboard access MUST remain disabled. |

## Owned boundary

`lapis-terminal-engine` exposes Terminal, SharedTerminal, Size, Viewport and
damage encoders. PTY launch, process lifetime and environment utilities belong
to the runtime crate. Imported deterministic suites remain separate from the
ignored idle-host latency benchmark.
