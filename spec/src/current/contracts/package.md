# Distribution

## Requirements

| ID                | Requirement                                                                                                                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-PACKAGE-001 | Versioned Cargo and npm artifacts MUST work without sibling checkouts. Native platform acceptance MUST use a cold production WebView with real PTYs. In-repository examples MUST exercise public APIs. Publication and consumer adoption remain separate work. |

## Consumer verification

Cargo packages include license, notice, readme, public source and necessary
fixtures. Cargo verifies archives; an isolated fixture runs the packaged Rust
PTY example using only extracted archives. An npm tarball is installed in an
isolated fixture and its base, Svelte, Tauri and testing exports are bundled.
Temporary local archive patches are verification-only, never consumer adoption.
Native qualification uses Tauri 2.12.4; compatibility with other Tauri minors
requires separate qualification despite compatible manifest version ranges.

Design Core is used only by the repository catalog. It is not a dependency of
the distributed terminal package; packaged consumer checks retain that boundary.
