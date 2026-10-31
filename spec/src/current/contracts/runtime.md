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

Attachment captures its bootstrap and installs the subscription while holding
the publisher mutex. PTY output arriving during capture is retained for that
subscription, even when no further bytes arrive. The publisher-to-engine lock
order matches reader snapshot recovery; channel delivery happens after the
publisher mutex is released. This private synchronization changes no public API.

Native support is initially qualified on macOS ARM64. Other platforms are
unqualified; Windows/mobile adapters are not implemented.

Resize/full captures and PTY reader publication share the publisher-to-engine
lock order. Capture selection and offer are one atomic publisher operation, so
a stale full snapshot cannot overwrite a newer idle prompt while credit is
held. Input, detach, process teardown and public signatures remain unchanged.

Sink installation and subscription capture share the publisher transaction.
Detaching a live subscription MUST retain that lock through sink removal; an
overtaken detach MUST NOT clear the replacement attachment's channel. This
private fence preserves PTY ownership and every public signature.
The [hosted qualification](../../history/2026-10-31-detach-hosted.md) completes
source and standalone native checks at the qualified immutable Git revision;
Desktop adoption retains its independent cold consumer acceptance.
