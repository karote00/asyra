# SDK documentation

Start here when changing how an external application embeds an editor, supplies
its own controls, or installs an extension. The [embedding plan](plans/canvas-embedding-plan.md)
owns those contracts across the four SDK packages.

| Package                                         | Consumer contract                                                                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Canvas](../../../sdk/canvas/README.md)         | Bind a caller-owned canvas and manage the session lifetime.                                                                                                                                 |
| [Design](../../../sdk/design/README.md)         | Mount a ready editor with React or JavaScript, edit a document, and supply custom UI. See the [feature catalog](../../../sdk/design/FEATURES.md) for operation and availability boundaries. |
| [Design UI](../../../sdk/design-ui/README.md)   | Place the editor's Position and Dimension controls in a host layout.                                                                                                                        |
| [Simulation](../../../sdk/simulation/README.md) | Attach a playback session and present its sampled frames.                                                                                                                                   |

## Where a change belongs

Keep SDK plans and their flow documents together under `plans/`. Keep install
instructions and runnable usage examples beside the package developers install.
For the transaction, rendering, and persistence primitives used by an SDK, follow
the [framework contracts](../framework/README.md). For the editing commands and
property controls that Design exposes, follow the [Design app contracts](../apps/asyra-design/README.md).

## Verification

The [Canvas SDK flow](plans/canvas/canvas.flow.json) connects the embedding
plan to the [packed-consumer check](../../../fixtures/canvas/verify.mjs).
From the repository root, run `node fixtures/canvas/verify.mjs` to build the
packages, exercise independent installations, and record the result in the flow.

## Planned behavior

[Read-only access after entitlement expiry](entitlement-read-only.md) records the
product decision for commercial extensions and its acceptance cases.
