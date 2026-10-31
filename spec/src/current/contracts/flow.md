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

Bootstrap capture and subscription installation MUST exclude concurrent frame
offers. Output received during attachment MUST appear in the bootstrap or the
successor released by its exact acknowledgement. Publication retains the same
one-frame credit and viewport fences; initial output requires no later shell
activity to become visible.

Every output capture and its publisher offer MUST be ordered atomically under
the publisher-to-engine lock order, including initial resize snapshots and PTY
reader snapshots. An older blank capture MUST NOT replace newer initial output
while bootstrap credit or viewport readiness is held. The latest pending
snapshot must reflect capture order, without requiring a subsequent shell byte.

Subscription replacement includes its output sink. Clearing an old sink MUST
remain atomic with faulting that subscription; a concurrent replacement MUST
retain its bootstrap channel and subsequent output without requiring new input.
