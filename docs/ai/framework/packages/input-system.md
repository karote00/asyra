# Package: @asyra/input-system

## Responsibility

Normalize raw keyboard/mouse/pointer input into framework input events.

## Owns

- key-combination mapping
- pointer event normalization (client/workspace conversion hooks if configured)
- event dispatch to runtime consumers
- explicit, instance-owned browser keyboard and pointer listener lifecycle

## Must Not Own

- feature decision policy
- scene-tree mutation logic
- render-layer business behavior
- app context-menu semantics, command eligibility, or menu session state
- unconditional browser context-menu suppression outside a handled app surface

## Rules

- Input-system publishes normalized events; it does not choose business outcomes.
- Key maps should be configurable by app domain.
- Wheel events merge their own modifier flags with currently held keys for that
  event's matching and normalized payload. Trackpad pinch can supply `ctrlKey`
  without a keyboard event. These flags never mutate held-key state or survive
  into later events. Consumers retain ownership of 2D/3D pan and zoom policy.
- A combination callback may return `false` to suppress dispatch synchronously,
  before downstream queues or sessions receive the event. Void callbacks proceed
  normally. Admission policy remains App-owned; InputSystem stores no busy state.
- Event contracts must stay stable and typed.
- Pointer input can be temporarily blocked when render interaction capture is active.
- App-owned surfaces decide whether a native `contextmenu` event is handled and
  call `preventDefault()` only for that accepted invocation.
- Runtime consumers register listeners with `on(event, callback)` and release
  the same callback with `off(event, callback)`. `off` removes only the requested
  listener, returns `false` when it was not registered, and removes an empty
  event bucket.
- Import and construction must not read `window`/`document` or attach browser
  listeners.
- `attachBrowserHost(host, pointerTarget?)` is the explicit browser activation
  boundary. Keyboard listeners belong to `host`; pointer/wheel listeners belong
  to `pointerTarget`, defaulting to `host`. Repeating the same pair is
  idempotent.
- Ordinary keyboard combinations retain exact chord matching and bubble-phase
  dispatch. Release bookkeeping clears the released key and timer in capture
  phase, even when an editor stops propagation.
- Keyboard combinations may opt into `keyboardMode: 'held'`. Their `keys` are
  observed alternatives, not an exact chord. Snapshots contain all held
  non-modifier keys plus live modifier flags and `keyboard` metadata: `phase`
  (`down`, `up`, `cancel`), `changedKey`, `target`, `repeat`, and `isComposing`.
  Held state does not expire with the ordinary key-repeat timer. Modifier
  changes while an observed key is held also publish snapshots. The `modifiers`
  chord filter is not applied in held mode; callback admission owns modifier,
  editable-target and IME policy. Do not use held mode for pointer combinations.
- Held keydown dispatch runs in bubble phase; accepted callbacks prevent the
  native keydown default. Returning `false` suppresses dispatch and preserves
  that default. Held release dispatch runs in capture phase without preventing
  native editing; it must reach consumers even when an editor stops propagation.
  Blur, focus changes, composition start, hidden documents and host detach cancel
  held state. Scene consumers must unregister and stop their own scheduled work
  on disposal. Runtime reset attempts all cleanup even if cancellation throws.
- `switchWatchedElement(element)` derives the element's owning `Window`. A
  target/document switch removes exact prior listeners before attaching the new
  host/target pair.
- `detachBrowserHost()` removes all browser listeners owned by the instance.
  `reset()` preserves the active attachment while clearing transient state;
  `dispose()` detaches and clears transient state.
- Core visual startup retains the typed watched-element event route. DOM-neutral
  import/construction is not a public Headless Core or Core Kernel guarantee.

## Extension Points

- key-combination registration
- input event mapping per app/runtime mode
- optional app-level adapters for host environment differences
- explicit browser host and pointer-target selection

## Facade Note

- `keyMap` is also re-exported by `@asyra/core` for app-level convenience.

## Explicit Runtime Reset

`InputSystem.resetRuntime(): void` is the complete lifecycle handoff after
Feature work is quiescent. It invalidates old browser callbacks, attempts every
owned listener removal, clears timers/transient state and removes input mapping
registrations. Cleanup failure is reported to Core, preventing successful
reconstruction. Other instances are unaffected. Ordinary reset/dispose retain
their attachment semantics; the App must not enumerate private listeners.

## Validation Checklist

- Keyboard shortcuts resolve consistently across supported platforms.
- Pointer down/move/up sequence remains ordered and complete.
- Input event payloads match typed contracts.
- Listener cleanup does not remove other consumers of the same normalized event.
- Node import/construction succeeds with no browser globals.
- Identical attachment is idempotent; same-document and cross-document switches
  remove the exact previous listeners.
- Reset preserves attachment and dispose removes it.
