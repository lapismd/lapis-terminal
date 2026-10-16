# Catalog

## Requirements

| ID                | Requirement                                                                                                                                                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LTERM-CATALOG-001 | Storybook MUST demonstrate dock and workspace-pane compositions using the same public viewport, plus themes, narrow sizing, input and lifecycle states. Fixtures MUST NOT spawn processes. Interaction and accessibility checks MUST remain distinct from visual approval. |

## Acceptance surface

Stories cover dock, workspace panes, bare viewport, light/dark appearance,
narrow sizing, Unicode, IME, bracketed paste, explicit selection/copy, resizing,
exit, high output and recoverable errors. Both composition examples import the
public package. Interaction and axe passes do not approve visual baselines.
