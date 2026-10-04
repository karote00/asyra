# The Starter App standard

Starter is the executable baseline for a complete App. Its ownership boundaries
follow Asyra Design: contexts, initialization, Features, common APIs, controllers,
property hooks/providers, composed views and render layers. The basic Item board
is the product used to explain those boundaries; Design's drawing tools, AI,
collaboration and server are not Starter features.

Start at `src/main.tsx`, `src/app/index.tsx`, then `src/init/init-app.ts`.

## Owners and dependency direction

| Owner                                              | Responsibility                                                                                      | Why this boundary exists                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `contexts/core.ts`                                 | Acquire the current Core lifetime and replace it after reset.                                       | Retained references must not operate on a replacement document runtime.                       |
| `init/init-app.ts`                                 | Assemble one App, start rendering and dispose its resources.                                        | React views must not independently register schemas, Features or subscriptions.               |
| `init/foundation/init-document.ts`                 | Register Item schema, local publication channels and empty document load source.                    | Persisted definitions must be admitted before Core starts.                                    |
| `features/items/index.ts`                          | Register the Item command API with explicit scheduling priority and exclusivity.                    | Product actions have a discoverable Feature boundary rather than direct writes from views.    |
| `common-apis/items.ts`                             | Validate commands, allocate identities, wrap each action in one transaction and write through Core. | Validation and journal ownership must remain the same for every caller.                       |
| `controllers/item-board.ts`                        | Coordinate selection, async commands, pending state and structured feedback.                        | Views should describe interactions without becoming a second transaction or document owner.   |
| `derived-state/item-projection.ts`                 | Read canonical Items and publish stable per-entity projections.                                     | UI/render adapters share derived results instead of independently reading the whole document. |
| `init/derived-state`                               | Connect publications/load events to projections and register fixed UI properties.                   | Notification and cleanup rules have an explicit App lifetime.                                 |
| `hooks/useProperty.ts`, `providers/properties.ts`  | Observe one fixed property or one Item and expose semantic hooks.                                   | Components update where their inputs actually change.                                         |
| `app`, `toolbar`, `contents`, `properties`         | Compose the shell, controls, Item views and selected editor.                                        | High-frequency state stays near its consumer, rather than in the root component.              |
| `render-app`, `render-layers`                      | Mount/resize the Core renderer and paint the App overlay from projections.                          | React cards and Core overlay share the document and geometry contract.                        |
| `persistence/storage.ts`, `common-apis/storage.ts` | Encode storage, validate loads and coordinate Core admission.                                       | External saved input must be checked before changing the document.                            |

Initialization constructs the dependencies. Views call the controller; it calls
registered `itemActions` or the named history/storage APIs. Features delegate to
common APIs; those use public `@asyra/*` contracts. Projection and rendering are
readers. Domain validation has no dependency on React. Avoid circular imports
and avoid importing UI into the domain or command API.

The App session returned by `initApp()` is a lifetime handle for composition and
tests. Views use `useApp()` and destructure their controller or render operations.
They do not navigate a `runtime.feature.xxx` hierarchy. Do not add one-line
forwarding modules only to reproduce a folder tree.

## State ownership

- **Canonical:** Core/Props/Factory own Item title, status, offsets, extension
  fields and history. The UI never holds another editable Item document.
- **Derived:** `StarterProjectionStore` owns immutable rows and the property-to-
  element index. Ordinary publications read only affected elements; reload
  replaces the projection from the accepted document.
- **UI properties:** ready, pending, status, selected ID, Item IDs and canvas width
  are transient and live under `UIProperties`. They are not persisted Item fields.
- **Local drafts:** the title input and in-progress drag may retain unfinished
  input. Commit through the controller; discard/reset on cancellation or failure.

The Feature scheduling priority is unrelated to the opt-in Item priority field.
Persisted identities remain centralized in `domain/item-domain.ts`; do not rename
storage slots or field names as a code cleanup.

## Listening to UI properties and Items

1. `initUIProperties()` registers fixed UI keys before `core.start()`. Core closes
   definition registration at startup; never register a property per newly added
   Item after startup.
2. `initProjection()` coalesces publication batches for the current tick. Each
   intended edit still commits its own transaction; batching presentation does
   not merge user actions. Accepted file loads trigger a full projection refresh.
3. The projection publishes changed entity IDs. Only membership changes update
   the `itemIds` UI property; title/status edits do not rebuild the React list.
4. `useProperty()` uses `core.getUIProperty()` and `core.onUIPropertyChange()` with
   React's `useSyncExternalStore`. The hook unsubscribes on unmount or key change.
   Stable snapshots are required; never allocate a new object in `getSnapshot`.
5. Dynamic entity consumers use `useItem(id)`, backed by the projection's keyed
   subscriptions and stable rows. `useIsSelected(id)` receives only the previous
   and next selected Item notifications. `useSelectedId()` drives the editor.
6. The root shell has no document subscription. Status reads status; Toolbar
   reads ready/pending; each Item reads its own projection; counts read membership.

This follows Design's semantic property providers. React's existing external-
store hook is the adapter here, so no new signals dependency or module-global
subscription cache is required. Do not bypass Core registration with a lower-level
registry to make dynamic UI keys work. Do not use `React.memo` to hide broad reads.

The projection and indexes belong to one App lifetime. Local title drafts,
selection and status perform no canonical document reads. The 30-Item formal test
checks actual Core reads, notification counts, React renders, fresh Undo/Redo and
reload values, and cleanup. It proves localized work, not a hardware FPS claim.

## Commands, history and feedback

One intended edit runs in one transaction in `common-apis/items.ts`. Drag preview
only updates presentation; pointer release commits offsets once. Selection is UI
state and creates no history entry. Retained editing callbacks send a partial
update, so they do not overwrite newer unrelated fields.

Undo/Redo calls perform exactly one operation through Factory's supported render
policy API. Factory owns empty stacks and redo invalidation. There is no UI depth,
stack mirror, multi-step count or message-based decision. Both history controls
are available while the App is ready and idle because the current public facade
does not expose both `canUndo` and `canRedo`. Do not invent availability locally.
Feedback says that the history operation was requested; an empty stack must not
produce a false claim that a document edit happened. History callbacks are scoped to the App lifetime, since the underlying public
function addresses the active Factory.

Feedback is `{ tone, message }`; success/error state never parses human-readable
text. Translation cannot change history, error styling or command routing.
Pending commands are serialized by the controller. Its disposed guard suppresses
late async feedback, and Core rejects writes through retired runtime references.

## Loading, startup and teardown

Save is explicit. Reload parses the versioned wrapper, validates App fields,
checks Core preflight diagnostics and only then loads. Invalid present values
are errors; missing supported legacy fields receive documented defaults. Failed
loads preserve the current document and history. See `ONBOARDING.md` and the
priority exercise for field extension examples.

The render host owns its DOM ref and ResizeObserver. The App owns registrations,
publication timers, load subscriptions, projection, Feature and overlay. Disposal
first closes UI operations, then stops notifications/rendering, releases resources
and resets Core. Await disposal before direct `initApp()` reuse. React's App entry
coordinates asynchronous teardown before mounting another session. Startup and
storage failures remain visible instead of leaving a blank screen.

## UI and extension discipline

Keep composition readable. A new independent panel subscribes to its own semantic
provider. A new Item field extends domain validation, registration, command input,
projection and the consuming editor; it must not require unrelated panels to read
all Items. A new derived value needs an explicit owner, invalidation inputs and
lifetime, with work-count evidence if reused.

Existing shared visual styles are retained in `app/styles.css` during this
architecture migration. Dynamic card coordinates remain explicit style values.
Tailwind migration is separate because Starter does not currently declare that
dependency. Preserve keyboard editing, visible focus, narrow layout and readable
error messages when changing styling.

## How the standard evolves

Starter is the maintained reference for new Apps and developer-Agent guidance.
When a Design improvement becomes a reusable App pattern, update Starter's actual
owner, permanent tests and this explanation together. Regenerate the distributed
Starter template from its source; never edit generated copies independently.
Do not declare the standard updated based only on API examples or a green build.
