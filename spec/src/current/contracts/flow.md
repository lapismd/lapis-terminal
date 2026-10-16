# Frame delivery

## Requirements

| ID             | Requirement                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LTERM-FLOW-001 | Delivery MUST retain at most one in-flight frame and one replacement full snapshot. Exact subscription and sequence acknowledgements and viewport readiness MUST fence stale messages; resize responses and channel frames may arrive in either order. |

## Public frame contract

Messages are tagged `frame`, `title`, `resetTitle`, `bell` or `exit`. A frame
carries subscriptionId, sequence, rows/clusters/styles, cursor, full, viewport,
bracketedPaste and focusReporting. Viewports carry generation, columns and
screenLines. The shared JSON fixture checks Rust serialization and TypeScript
consumption. Exit currently carries no process exit-code payload.

Attachment may deliver its initial frame before the invoke response. The client
buffers that bootstrap until it knows the subscription. Resize requests are
coalesced and ordered through remounts; repeated observations of the requested
size cannot create a frame/readiness feedback loop. Old viewports release only
their own frame credit. Old attachment callbacks and errors are inert.
