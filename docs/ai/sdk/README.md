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

For inspector customization, see [how to insert a control between X and Y](../../../sdk/design/README.md#insert-a-control-between-x-and-y) and the [row composition contract](plans/canvas-embedding-plan.md#compose-inspector-row-items).

## UI ownership and debugging

The [app row registry](../../../apps/asyra-design/src/properties/inspector-registry.ts)
defines each composable row's ID, placement, label and ordered native fields.
The SDK build ships its JavaScript and literal declarations. The app reads the same
registry for native controls. The SDK creates per-editor templates from the rows
and marks each mounted group at its actual host. UI outside these templates is
marked at its rendering component. See the [DOM inspection guide](../../../sdk/design/UI.md)
for names and examples. Update the packed React and JS relocation cases when
changing this contract.

## Verification

The [Canvas SDK flow](plans/canvas/canvas.flow.json) connects the embedding
plan to the [packed-consumer check](../../../fixtures/canvas/verify.mjs).
From the repository root, run `node fixtures/canvas/verify.mjs` to build the
packages, exercise independent installations, and record the result in the flow.

## Planned behavior

[Read-only access after entitlement expiry](entitlement-read-only.md) records the
product decision for commercial extensions and its acceptance cases.
