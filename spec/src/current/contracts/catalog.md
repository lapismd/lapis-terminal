# Catalog

## Requirements

| ID                | Requirement                                                                                                                                                                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-CATALOG-001 | Storybook MUST demonstrate dock and workspace-pane compositions using the same public viewport, plus themes, narrow sizing, input and lifecycle states. Fixtures MUST NOT spawn processes. Interaction and accessibility checks MUST remain distinct from visual approval.                                        |
| LTERM-CATALOG-002 | Representative application stories MUST consume released Design Core public App Shell and Workspace APIs. Both MUST place the terminal below the document; Workspace MUST register it in its native bottom panel. Both MUST include minimal navigation and exercise session retention through shell interactions. |

## Acceptance surface

Stories cover dock, workspace panes, bare viewport, light/dark appearance,
narrow sizing, Unicode, IME, bracketed paste, explicit selection/copy, resizing,
exit, high output and recoverable errors. Both composition examples import the
public package. Interaction and axe passes do not approve visual baselines.

The application examples use Design Core navigation, tabs, bottom panels and
shell chrome. They are fixture hosts inspired by JJ Store and Lapis Notes,
with no dependency on either application. Design Core is a catalog development
dependency; the terminal package keeps its layout-neutral public boundary.

The App Shell uses a transparent left sidebar with padded navigation, matching
JJ Store's surrounding shell chrome. Its terminal toggle uses Design Core's
standard bottom-panel icon in the top app rail, without a right-sidebar toggle. Workspace
uses its built-in bottom panel, including tabs, sizing and visibility controls.
Its left sidebar starts collapsed, and terminal entries use `square-terminal`.

All composition stories use a simple App Shell Body, with session actions in
its header. One global light/dark control applies across the catalog, including
terminal palettes and the Workspace registered view. Per-story theme buttons
and duplicate theme-only stories are unnecessary. Both global modes run the
same interaction and accessibility suite.
