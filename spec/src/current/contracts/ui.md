# Terminal presentation

## Requirements

| ID           | Requirement                                                                                                                                                                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-UI-001 | The public viewport MUST support host composition, explicit palette and metrics, keyboard/IME, selection/copy, paste, focus and resize. It MUST NOT own application layouts, global shortcuts, persistence or notifications. Unmount MUST detach without closing a session. |

## Composition

The base npm entry has no Svelte/Tauri import. `/svelte` supplies TerminalViewport
and `/tauri` supplies the transport factory. A TerminalSession controller has
explicit attach/detach/close; the viewport attaches while mounted. Palette,
font metrics, classes, dimensions, label and key interception are configurable.
Notifications use one typed onError path supplied by the application. Examples
keep layout, global controls and notifications outside production components.

The canvas uses the viewport's CSS dimensions independently of its scaled
backing image, so glyphs, selection and pointer coordinates remain aligned
on high-DPI displays. Catalog geometry checks run at device scale factor two.
