# Compose only the infrastructure you need

Use a custom composition when your product needs Framework infrastructure but
does not want the complete official design-tool baseline. Start from Core,
define your app-owned information, and compose only the capabilities your
runtime actually uses.

This is the general Asyra path for whiteboards, BIM, simulations, and other
domain products. The Framework supplies owner boundaries and coordination; it
does not know the domain rules that make your product correct.

Use this guide as the App implementation baseline, including when Preset
supplies your initial composition. It extracts the reusable methods demonstrated
by Asyra Design; you do not need to reverse-engineer that app to discover how
editing, synchronization, UI updates, and lifecycle fit together. Its socket
protocol, 2D tools, and backend topology are product choices, not requirements.

## Build one complete data path

```text
Product intent -> Feature -> App API -> canonical owner transaction
                                      |-> local projections -> UI / Render
                                      |-> document SharedPublication
                                          -> App persistence / transport queue
                                          -> acknowledgement / recovery

Load / accepted remote change -> validation / canonical apply -> projections
Undo / Redo -> owner replay -> ordinary projection and publication paths
```

Assign each boundary before writing UI:

| Concern               | Owner and implementation decision                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Product action        | Registered Feature; reuse the same App API for UI and automation.                                             |
| Editable document     | Canonical Scene Tree and Props values; never a React document copy.                                           |
| Action grouping       | Existing transaction/session boundary; one completed action owns its intended Undo entry.                     |
| Changed document data | Factory publication exposed through Core; do not inspect private History or diff snapshots.                   |
| Storage and network   | One App document-session owner; ordered delivery, acknowledgement, retry and recovery.                        |
| UI and rendering      | Read projections scoped to relevant fields/entities; transient camera and input text stay local.              |
| Expensive computation | One producer with explicit semantic inputs, output lifetime and invalidation.                                 |
| Replacement           | App lifecycle coordinates public Core teardown and a fresh runtime; old work cannot write into the successor. |

Choose property registrations and observation boundaries together. Structured
object properties are supported; consumers can project individual UI values
without splitting the canonical object. First use the component/property
registration and projection contracts, then measure actual owner work and
publication evidence. A whole-object argument alone does not prove an
architecture defect. Value replacement and record collection patch APIs have
different semantics; do not assume automatic recursive JSON diffing. Change
schema granularity only for a demonstrated need, preserving persisted identities
through explicit migration where required.

For bulk actions, use the supported plural canonical operations where they fit,
such as `core.updateElementProperties(...)`. One transaction around thousands
of singular calls groups Undo but does not automatically share their validation,
reads or preparation. Consume owner-issued prepared artifacts through their
declared apply boundary instead of rebuilding them per element or consumer.
Keep all-or-nothing admission and real rollback; bulk performance cannot justify
applying an invalid prefix.

## Let transactions define completed actions

Finite changes use the existing transaction-safe App API. Long interactions use
the Feature session's outer transaction and settle at their declared completion
or cancellation boundary. Do not add a second per-control save timer, UI History
stack, or gesture classifier in the persistence layer.

For ordinary transaction-end delivery, consume each completed non-empty document
publication as it arrives. Undo and Redo already use the ordinary publication
path. A transaction status notification alone is not changed document data:
rollback, selection-only changes and other non-document work must not trigger
unconditional document capture.

One Undo entry is not a universal promise of exactly one network message.
Explicit immediate/progressive shared delivery can expose intermediate slices
and rollback compensation; preserve the declared publication order and atomic
boundaries. Choose that policy at its canonical owner, not by guessing in UI.
See [Feature sessions](../build/feature-session.md) and
[transactions and durability](../learn/transactions-and-durability.md).

## Persist publications, not repeated full snapshots

The public observation entry is `core.subscribeToSharedPublication(...)`.
Compose its subscription once per document lifetime and retain its cleanup.
The App adapter selects document channels while preserving publication identity,
order and atomicity. Selection, Awareness, local computed data and renderer
state do not become saved document data merely because they are observable.

For incremental automatic persistence or synchronization:

1. Accept the immutable document publication into the session's ordered queue.
2. Start the configured local-write or transport work without adding a debounce
   to reinterpret a completed action. If earlier work is pending, preserve order.
3. Track the acknowledgement for that exact publication. Later edits remain
   independent and must not be acknowledged by an earlier write.
4. Preserve pending evidence on failure or disconnection according to the App's
   recovery contract. Do not silently replace distinct publications with only
   the latest document or drop an unacknowledged operation.
5. Restore through the canonical load/remote-apply boundary. Received changes
   must not become new local intent, duplicate local Undo, or an outbound echo.

Asyra Design demonstrates this with a document-channel adapter, durable local
outbox, serial send and source acceptance. Its backend subsequently batches
durable materialization; this does not delay the browser's canonical commit.
Generic Collaboration alone does not retain disconnected edits for you.

Runtime commit, locally recoverable evidence, transport acceptance and backend
durability are different acknowledgements. Local transaction guarantees do not
provide distributed database isolation. The UI can edit and Undo immediately
after runtime settlement without waiting for storage, but must not claim durable
storage before its actual acknowledgement.

Core's explicit `save()` serialization is useful for portable export,
checkpoints and deliberate recovery capture. It is not an automatic incremental
save subscription. Do not put full-document serialization, geometry encoding,
or cancellation of an active Feature on every background save notification.

If your product deliberately uses complete snapshots as its storage format,
document and measure that policy; it is not equivalent to incremental delivery.
Large immutable assets and analysis results also need an App resource owner:
persist required bytes before acknowledging references, retain resources needed
by Undo and recovery, and avoid resending unchanged bytes with each field edit.
Project-list metadata needs its own explicit owner; decide whether it is part
of the undoable document rather than assuming every persisted field is.

See [collaboration](../build/collaboration.md) and
[persistence and migration](../build/persistence-migration.md) for provider and
load responsibilities. These are App composition boundaries, not APIs for
embedding a particular backend in Core.

## Scope updates before they reach React

Core exposes `registerUIProperty`, `getUIProperty`, `onUIPropertyChange` and
`getUIPropertySubject` for registered derived UI values. Registration supports
compute/aggregation, triggers and source observables. The canonical change
subscription that drives recomputation belongs to Preset or App composition;
registration alone does not install that subscription. A CUSTOM composition
with no selected defaults must not assume Design's projection wiring exists.

Use `registerDataChannelObserver` for owned change/batch subscriptions and the
Core property-to-computed projection helpers before consuming relevant
`getElementComputedData` values. Publish useful UI values through the registered
UI-property owner. Standard aggregation is selection-oriented; explicitly wire
the App's selection semantics and initial-load/removal behavior. Do not replace
this with a second editable model or duplicate signal registry. See the
[UI Context contract](../../ai/framework/packages/ui-context.md).

Subscribe at the field/entity/projection that consumes a value through the
approved owner observation facade. Keep unrelated projections stable at that
boundary. A whole-document notification followed by filtering child props still
performs upstream reads, clones and scans. Splitting components or wrapping them
in `React.memo` does not repair that work boundary.

For example, changing an experiment label should not rebuild every body's
geometry, read every retained result, or reparse an unchanged import. Camera
movement should update the viewport without querying the canonical workcell.
Changing a pose still must update every projection that depends on that pose.
Use a transient input buffer for incomplete text; it is not another editable
document. Retained callbacks must use current canonical inputs and preserve a
newer edit in another field.

Asyra Design's field-specific providers demonstrate the subscription concept.
Reuse the concept through your runtime's approved facades; do not copy a
module-global signal map or dependency singleton without proving its ownership
and teardown under your document lifecycle.

## Reuse admitted results at their real lifetime

Separate invariant preparation from changing-input queries. An immutable mesh
does not need new topology preparation for every camera or joint update. An
import parser should produce one bounded source artifact; unit/mapping
conversion produces another validated artifact that both preview and acceptance
consume. Changing any semantic dependency invalidates the affected artifact.

Own retained work at the lifetime where reuse actually happens. A cache created
inside each request repeats preparation. Sharing a helper does not share its
output. Do not repeatedly serialize a whole document to compute a cache key.
Before adding a cache, measure the owner work, identify all validity dimensions,
bound retained memory and implement disposal.

Keep real trust boundaries: imports, Worker messages and remote inputs still
require receiving-owner validation. Detached asynchronous analysis must not
hold a canonical transaction open. A completed accepted result can enter a
separate Feature transaction through an admitted receipt; progress and stale
results cannot mutate the document. Historical results retain their original
meaning even when the current method or model changes.

## Prove the integration, not just each helper

Use permanent tests along the normal caller path:

- A completed action creates the intended Undo boundary and document delivery;
  no-op, invalid and rolled-back transaction-end work creates no saved change.
- Undo/Redo follow the same persistence route; received changes do not echo.
- Two changes during a pending write preserve order and independent
  acknowledgement; failure, retry and restart preserve required evidence.
- Repeating an unchanged read/import performs no unnecessary capture, parsing,
  conversion or preparation; acceptance consumes the exact admitted result.
- An unrelated edit performs zero work in unaffected geometry/result owners;
  a real dependency edit and Undo/Redo invalidate the correct projections.
- Cancellation, teardown and document replacement settle owned work and reject
  late results. Failed startup never reports ready or opens a successor early.

Count meaningful reads, builds, bytes, conversions and writes together with
output equivalence. Helper-only mocks, render counts and green screenshots
cannot establish these integration properties. Follow with representative
browser, resource and visual tests for the product flow you actually changed.

For an AI coding agent, provide this guide and require it to name the canonical
write owner, publication consumer, projection subscriptions, artifact lifetime,
failure owner and permanent integration tests before implementing a slice.
Missing integration is not closed merely because a Feature has Undo support.

## Bind everything to the document lifetime

Register composition before startup and expose editing only after Core is
ready. Keep the runtime's Core instance in its owning closure. A callback that
reads a changing module export after replacement can accidentally target a
different document.

Ordinary load is validated canonical state application, not full runtime
replacement. For complete replacement, the App checks the target, closes old
admission, settles pending persistence according to its recovery policy, and
awaits real owned work and public teardown. `core.preflightLoad(...)` can check
a target without mutating the current document; it does not waive validation
when the successor loads it. Call `resetRuntime()` outside old Feature work,
await its fresh unstarted Core, then register and start the successor. Cleanup
failure must prevent false success or concurrent default runtimes.

Retain owned integration cleanup through `registerRuntimeCleanup(...)` where
appropriate. Dispose subscriptions, timers, Workers, prepared receipts and
renderer resources at their actual owning boundary. Aborting a signal or winning
a timeout race is not proof that work has stopped. Test that late completion
cannot publish a preview, mutate state or acknowledge persistence in a successor.
See the [Core lifecycle reference](../reference/packages/core.md).

## Current composition boundary

The current public `@asyra/core` facade coordinates browser/Core startup and
imports the present Framework graph. It can complete its existing no-canvas
compatibility branch when the default renderer lacks a provider, but that is
not a public Headless Core lifecycle or a no-Render dependency guarantee.

For non-visible and machine-facing products, read the
[runtime roadmap](../learn/runtime-boundaries-roadmap.md) before choosing an
architecture. Do not invent `createHeadlessCore()` or a Core Kernel package.

## Where this runs

Custom composition belongs to the browser application's bootstrap module. It
constructs the intended owner graph, registers app capabilities while
composition is open, and hands the resulting Core instance to the app startup.

## Implementation

This is the minimal current public composition shape without Preset. Add only
the optional provider boundaries your product uses:

```ts
import { Core } from '@asyra/core'
import { Factory } from '@asyra/factory'
import { InputSystem } from '@asyra/input-system'
import { PropsManager } from '@asyra/props-manager'
import { Render } from '@asyra/render'
import { SceneTree } from '@asyra/scene-tree'
import { SelectionManager } from '@asyra/selection'
import systemContext from '@asyra/system-context'

const factory = new Factory()
const props = new PropsManager()
const render = new Render()
const sceneTree = new SceneTree(props)
const selection = new SelectionManager()
const inputSystem = new InputSystem()

export const core = new Core({
  factory,
  inputSystem,
  props,
  render,
  sceneTree,
  selection,
  systemContext
})
```

Keep shared owners shared: `SceneTree` receives the same Props Manager instance
that Core receives. Collaboration and AI do not appear unless the app
explicitly composes their adapters.

This example shares the imported System Context; constructing some classes
does not prove complete instance isolation. The default Core singleton is also
a supported starting point. Do not rebuild every package graph just to follow
this guide; prove dependency and subscription wiring for any custom instances
you actually need.

## Flow

1. Construct one instance for each current Framework owner.
2. Pass those owners to Core through public package entrypoints.
3. Register app schemas, Features, projections, and optional providers.
4. Attach the browser host required by the chosen input and visual path.
5. Call `core.start(...)` once, then wait for readiness before product work.
6. Dispose the composition from the app lifecycle that created it.

## Expected result

The app receives one Core facade coordinating its selected owners. Uncomposed
Collaboration and AI systems perform no work. A render-engine provider exists
only when the app selected one. Duplicate registration, invalid composition,
startup failure, and post-start mutation remain explicit errors rather than
silent fallback behavior.

## Choose capabilities explicitly

- Use `@asyra/props-manager` and Core registration for app-owned property
  definitions and validation.
- Use `@asyra/scene-tree` for canonical hierarchy, not for app-specific group
  semantics.
- Use `@asyra/feature-system` and `@asyra/factory` for intent sessions and one
  transaction per intended action.
- Use `@asyra/render` plus an `@asyra/render-engine` provider when information
  needs a visual projection.
- Add `@asyra/persistence`, `@asyra/collaboration`, or
  `@asyra/ai-agent-runtime` only when the app owns their adapters and policy.
- Use `@asyra/preset` selectively when an official default helps; custom and
  Preset capabilities can coexist through their declared registration rules.

Core is the public composition facade. Do not reach into dependency containers
or package-private source, and do not make one package call another package's
owner through a relative import. Use public facades and typed communication.

## Customize transaction replay and inversion

When an app introduces a canonical event shape that Factory cannot invert or
replay through a built-in contract, register that lower-level behavior on the
composition-owned `Factory` before product work begins. Use
`Factory.registerTransactionInverter(...)` for the inverse evidence and
`Factory.registerTransactionReplayHandler(...)` for the semantic replay route.
Every inverter output must itself have a built-in or registered inverse, and a
custom inverter must never return an empty result.

This is a Customize concern because it changes how the Framework restores a
canonical event. Ordinary product intent still belongs in an Extend guide and
should use the existing transaction-safe Feature path. Do not create a second
history system, an AI-only transaction engine, or a collaboration-specific
replay path. See the
[transaction-safe Feature guide](../build/feature-session.md) for the normal
app-owned session flow and the [Factory reference](../reference/packages/factory.md)
for the exact public contract.

## Validate the boundary

Prove the exact composition you claim:

- import only public package entrypoints;
- confirm optional packages perform no work when absent;
- verify duplicate and post-start registration fail explicitly;
- verify canonical write, rollback, undo/redo, and load paths;
- test the selected host environment; and
- use clean-consumer artifacts before describing the composition as supported.

## Canonical sources

- [Framework architecture](../../ai/framework/ARCHITECTURE.md)
- [Core package contract](../../ai/framework/packages/core.md)
- [Core package guide](../reference/packages/core.md)
- [App optimization and maintainability](../../ai/framework/rules/app-optimization-and-maintainability.md)
- [Computation ownership and reuse](../../ai/framework/rules/computation-ownership-and-reuse.md)
- [Design document-session contract](../../ai/apps/asyra-design/specs/socket-authoritative-document-session.md)

## Next

- [Learn information models](../learn/information-models.md)
- [Build a custom schema](../build/custom-schema.md)
