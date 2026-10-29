# `@asyra/input-system`

Environment-neutral semantic input registration and explicit browser host
attachment.

## Owns

- normalized keyboard, pointer, wheel, and mapped input event routing
- key-combination and app/runtime input mapping registration
- instance-owned browser listener attachment, switching, detach, reset, and
  disposal
- pointer blocking while render interaction capture is active

## Does not own

Feature decisions, scene mutations, render-layer behavior, app context-menu
policy, or unconditional native-menu suppression.

## Compose when

Compose it when a runtime needs normalized user input or Core visual startup.
Import/construction is safe without browser globals, but browser behavior begins
only after explicit host attachment. Do not compose it for a machine-only
adapter that has no input events.

## Public entrypoints and prerequisites

Use `@asyra/input-system`. Important surfaces include `InputSystem`, the default
instance, `on(...)`, `off(...)`, key-map/mapping APIs,
`attachBrowserHost(host, pointerTarget?)`, `switchWatchedElement(...)`,
`detachBrowserHost()`, `reset()`, and `dispose()`. Core re-exports `keyMap` for
app convenience.

## Lifecycle, inputs, outputs, and failure

Construction allocates instance state only. Attachment adds keyboard listeners
to the host and pointer/wheel listeners to the selected target. Repeating the
same pair is idempotent; switching removes exact previous listeners first.
`reset()` clears transient state but preserves attachment. `dispose()` detaches
and clears. `off(...)` removes only the requested callback and returns `false`
when absent.

`InputSystem.resetRuntime()` retires browser callback generations, detaches
listeners and clears transient state, timers and input mappings. Every listener
removal is attempted before cleanup failure is reported. Core uses this explicit
boundary for complete runtime replacement; ordinary reset/dispose are unchanged.

## Continuous keyboard controls

Use Core's `registerInputKeyCombinations` and retain its unregister callback for
scene disposal. For continuous controls, opt into `keyboardMode: 'held'` on a
keyboard combination. Its `keys` list observes alternatives, such as W and arrow
keys, rather than requiring every listed key at once.

The callback receives `RawInputEvent.keys` containing all held non-modifier keys,
live `modifiers`, and `keyboard` metadata (`phase`, `changedKey`, `target`,
`repeat`, `isComposing`). Phases are `down`, `up`, and `cancel`. Modifier changes
also notify while a tracked key is held. Held keys do not expire when native
repeat is absent. The ordinary `modifiers` chord filter is not used in this mode:
the callback must apply its modifier, editable-target and composition policy.
Return `false` to reject an event before semantic dispatch; rejected held
keydown leaves the native default intact.

Release is delivered in capture phase even if an editor stops bubbling, without
preventing editing. Blur, focus changes, composition start, hidden documents and
host detach cancel held state. Keep animation timing and business policy in the
consumer, and stop scheduled work when unregistering. Ordinary exact chords and
pointer mappings keep their existing matching behavior.

## Relationships

Reactive Events carries typed routes. Core visual startup attaches Input to the
engine surface. Feature System decides the accepted business response. Render
interaction capture may temporarily block pointer input. The app owns key maps
and native context-menu acceptance.

## Maintained use path

The [information-model guide](../../learn/information-models.md) explains how Input can be part of the current
Core artifact without an engine provider. For browser behavior, use the
generated Asyra Design app and its formal input/viewport tests.

## Replacement and disabled behavior

Apps may select another host/target or supply an environment adapter through
public mappings. Without attachment, no browser listeners exist. Omitting Input
from a future custom runtime must be proven by that runtime; current Core still
imports the existing graph.

## Support, migration, and deprecation

Node-safe import/construction is current. It proves environment safety only,
not Headless Core startup, no-Render dependencies, or multi-runtime isolation.
Migrate eager listener assumptions to explicit attachment and preserve reset
versus dispose semantics.

## Canonical sources and release inventory

- [Package contract](../../../ai/framework/packages/input-system.md)
- [Package manifest](../../../../packages/input-system/package.json)
- [Runtime boundary roadmap](../../learn/runtime-boundaries-roadmap.md)

The root entrypoint, version, and dependencies are manifest-generated and
release-checked.
