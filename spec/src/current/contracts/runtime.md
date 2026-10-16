# Runtime

## Requirements

| ID                | Requirement                                                                                                                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-RUNTIME-001 | The runtime MUST own bounded local-user PTYs with filtered environments, stable open identities, one live subscription per session and explicit close. Detach and renderer reload MUST preserve sessions; close and shutdown MUST terminate owned processes. Restart MUST NOT recreate shells. |

## Public lifecycle

`Runtime::new(Config)` creates an isolated instance. Rust callers provide
`LaunchSpec { target, cwd, shell, args, env }`; only `Target { id, label }` is
serialized in session metadata. Defaults and limits are documented in usage.
Open identities are UUIDs. Conflicting or closed identities fail. Detach keeps
the PTY; explicit close is idempotent. Disable closes sessions; enable permits
fresh identities. Shutdown is permanent. No persistence recreates processes.

Native support is initially qualified on macOS ARM64. Other platforms are
unqualified; Windows/mobile adapters are not implemented.
