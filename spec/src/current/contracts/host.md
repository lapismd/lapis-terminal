# Host admission

## Requirements

| ID             | Requirement                                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-HOST-001 | Hosts MUST resolve opaque target IDs to trusted launch specifications. Sessions MUST be scoped to their originating host window. Rust owns shell, environment and admitted roots. Inherited credentials MUST NOT reach shells; local-user shells are not sandboxes. |

## Application policy

HostPolicy authorizes the actual invoking window/URL and resolves targets in
Rust. Every command checks that policy. Each admitted window has its own
runtime; knowledge of another window's session UUID grants no access. A host
instance admits at most 32 window runtimes. Target resolution must return the
requested target identity. Revocation/selection of application roots remains
host-owned; the package does not discover repositories, vaults or services.

The attachment synchronization repair leaves LTERM-HOST-001 unchanged. The
runtime fixes its private snapshot/subscription transaction; host admission,
window scoping, shell selection and environment filtering remain host-owned.

The ordered-output correction changes only capture/publication internals.
LTERM-HOST-001 retains the same host-owned admission, shell/environment, cwd,
notification and lifecycle policy. No new renderer input or host authority is
introduced; the [source regression](../../history/2026-10-30-ordered-capture.md)
records exact and wider qualification separately from Desktop acceptance.

Replacement sink fencing preserves LTERM-HOST-001. It changes only the
runtime's private subscription transaction; no new launch authority, window
scope, admitted-root rule or environment input is introduced.
