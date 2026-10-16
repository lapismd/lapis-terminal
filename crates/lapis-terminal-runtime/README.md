# lapis-terminal-runtime

Reusable Lapis Terminal package. Apache-2.0; see NOTICE.md for attribution.
Consumers own application trust and lifecycle policy.

Bounded PTY sessions independent of Tauri. Supply a trusted LaunchSpec to
Runtime::open; detach retains sessions, close/shutdown ends them.
See examples/basic.rs. Initial native qualification: macOS ARM64.
