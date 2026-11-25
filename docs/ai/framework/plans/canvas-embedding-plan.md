# Caller-owned canvas SDK

Canvas owns the lifetime and exclusive claim on the supplied HTMLCanvasElement.
Creating a binding preserves all pixels, children and attributes. The base does
not acquire a drawing context, install tools, process input or start a clock.
A product attaches one tool session through the public mount contract.
Closing a binding settles pending startup, retires the product once and then
releases the claim. A failed mount can be retried on the same open binding.

Design owns its isolated Core composition, 2D Preset, drawing, selection,
document history and storage format. Simulation independently owns transient
playback with the existing simulation playback clock. Its host supplies frame
presentation. Neither product depends on the other. This slice does not migrate
the complete Design or Sim applications or change workcell analysis.

Verify independently packed consumer installations and dependency boundaries,
canvas identity and untouched pixels, pending mount teardown, simultaneous
targets, design edits and replay, simulation time and cancellation, reattachment
and existing Framework container and canvas lifecycle behavior.

## Design editor entry

The Design SDK owns the one-call editor on a supplied HTML container or canvas.
For a container, Design adds its own resizable editor area, canvas and optional
controls, retaining existing host children. A container admits one editor until
disposal completes. Failure or disposal releases the claim and owned nodes.
For an existing canvas, Design borrows the exact target and preserves it. Its
default controls select Rectangle, Select, Undo and Redo. Callers can replace
the ordered controls with built-in commands and named actions receiving the
same public Design tools, or supply their entire UI. Registered actions can also
run by ID with the toolbar hidden. All document writes and
history go through the existing Design session. The canvas binding owns the
session lifetime. Failed initialization and disposal release the binding and
SDK-owned controls. The packed browser cases exercise each mode, history and
reuse of the target. This step changes only the Design entry and its consumer
proof, documentation and flow.

## Place the editor as a component

The Design SDK owns the public AsyraDesign component and asyra-design HTML
tag. These are public distribution names. A browser element owns one Design
session, mounts at its template position, preserves state across a synchronous
DOM move and releases its session after removal, including during startup.
React exposes the named component. Other hosts can use the registered element or createDesign. TypeScript compiles the SDK implementations and their public declarations for distribution.
Mount options reach the same Design action registry. The Canvas SDK has no UI
or framework dependency. Verify the package exports, JSX types, startup,
editing, independent instances and disconnect/reconnect in packed consumers.

### Element sizing

The declarative element fills the layout space assigned by its parent. With
an indefinite parent height its intrinsic height is the dynamic viewport
height. On a page containing only the editor, browser-default body margins
yield to an edge-to-edge layout. Authored margins and panel padding remain
part of the application's layout. Toolbar and canvas share this area. The
existing canvas ResizeObserver owns drawing buffer updates. Packed browser
checks resize the window and panel independently, including a framework root.

## Full Design workspace

The default container and declarative entries mount the maintained Design app's
non-conversation workspace. Its registered editing features, layers, properties,
menus, renderer, text overlay and optional collaboration session have the same
owners in apps/asyra-design. A host supplies initial document or collaboration
settings and named actions without Framework imports. Browser input, portals and
styles belong to each workspace. The borrowed-canvas API retains its lightweight
tools. Verify real editing, isolation, configured actions, lifecycle and packaged
assets from an independent JavaScript installation.

### Feature availability

The embed step owns a per-instance runtime policy over the local commands
cataloged in sdk/design/FEATURES.md. Resolve it at mount, gate the distinct
input and facade paths, and preserve schema registration, remote replay and
rendering. Host chrome visibility is independent. Acceptance runs on packed
consumers with the full workspace and borrowed canvas.

### Host-owned Design controls

With workspace chrome hidden, host controls read projected properties and
call the same app operations for text, paths, selection, layers, appearance,
viewport and recovery. The host receives detached reads and subscriptions
scoped to its editor. Reset rebinds observers and destroy releases them.
Validate using a packed JavaScript consumer, including disabled operations,
document reload, Undo and collaboration recovery.

### Workspace common APIs

The embed step binds Design common operations to the creating container editor.
The app owns signatures, work and feature admission. The host receives grouped
commands, detached document reads, transaction handles and scoped observers.
Reset retains the editor entry and retires session-local resources. Destroy
releases the owner. Verify the catalog, mixed feature policy, callback lifetime
and independent documents with two editors in a packed plain JavaScript consumer.

### Extension UI and live availability

Each editor exposes its own accepted IDs through the read-only `features` property, including disabled features, host actions and registered extensions, from the same registry used for validation.

The container editor owns stable tool group IDs, manual host mounts and ordered
placements in the toolbar, properties panel and selection menu. During a drag, each visible panel marks its docking area. The entire Properties panel and toolbar route a drop to their own outlet. A grip released outside a docking area floats its group at the pointer in host viewport coordinates. The same grip can move it again or dock it. The host restores floating coordinates through its existing layout preference. Extensions own
their DOM and listeners. Moving a group in one document preserves its mount.
The host owns preference storage and user identity. Layout changes do not
publish document mutations. Availability changes update command admission,
input registrations and visible controls on the live session. The packed
consumer proves disposal, independent editors, layout restoration and feature
switching through actual UI and SDK entry points.

The packed React quickstart must automatically save committed edits with a stable local storage key and reopen the board in
both a default Vite development server and production preview. Replacing the
document reference or collaboration identity on a declarative host retires
the old editor before opening its successor. Keep built-in feature IDs
reserved for their owning commands. If extension UI fails to mount during
activation, restore the previous policy before allowing a retry.

### Ready editor, packaged tools and persistent nodes

React reports each ready editor through `onMount`. A host can install the
Position row extension as a separate package with the public SDK as its peer.
The app registers an extension's stable component type, scalar property schema
and preset render strategy before validating a local or supplied document.
Reads and rendering remain available while the owning extension is disabled.
The packed consumer checks editing, undo, redo, real rendered geometry, pointer
selection, reload and feature policy through public APIs.

Keyed local boards persist structured snapshots in IndexedDB. The board owns
one connection, coalesces committed edits within one turn and closes the
connection on disposal. A missing IndexedDB record admits one validated legacy
snapshot from the same key. Atomic import precedes removal of that legacy
value. A failed import leaves the original available for retry.
