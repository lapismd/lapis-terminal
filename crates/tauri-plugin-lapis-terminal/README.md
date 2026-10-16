# tauri-plugin-lapis-terminal

Reusable Lapis Terminal package. Apache-2.0; see NOTICE.md for attribution.
Consumers own application trust and lifecycle policy.

Register Builder::new(policy).build() and grant lapis-terminal:session to
admitted windows. Implement HostPolicy; TerminalExt supplies Rust-side
enable/disable/shutdown. The npm adapter is @lapismd/terminal/tauri.
