# Collaboration Failure Responsibilities

These observation-only operations are investigation entries, not inferred root causes. Original joint-case failures do not identify an individual participant as faulty. Participant identity is collected by the test harness and retained per invocation/case/project/attempt. Canonical product behavior remains owned by [App architecture](../ARCHITECTURE.md#collaboration-ownership) and [the document session contract](socket-authoritative-document-session.md).

## observe-session-state

Publish connection transitions once without treating initial connection as recovery.

Owner: `@asyra/asyra-design`.

Inputs: Previous connection state (none, connected or disconnected); Next settled connection state (connected or disconnected).

An unchanged state emits no notification. Initial none-to-connected is silent; none/connected-to-disconnected emits disconnected and disconnected-to-connected emits reconnected. Returning to none is invalid.

Bypass/rejection: An unchanged connection state returns changed=false and no notification.

Allowed contributors: Session connection transitions from the lifecycle controller; Status toast rendering of the declared notification.
Observation records and UI guesses cannot change runtime state.

Implementation entries:

- `apps/asyra-design/src/collaboration/lifecycle.ts`
- `apps/asyra-design/src/render-app/status-toast-stack.tsx`

## recover-document-session

Reconcile the file-scoped outbox against the authoritative checkpoint and generation while retaining local edits.

Owner: `@asyra/asyra-design`.

Inputs: Active document, actor and generation identity; Authoritative server checkpoint and generation; File-scoped pending publication outbox and recovery cutoff.

Recovery restores the authoritative checkpoint before replaying eligible local outbox records. Reset changes generation; a prior-generation removal must not replay. Retained stale sources cannot apply during recovery and separate document rooms remain isolated.

Bypass/rejection: Stale document/generation sources and ineligible outbox entries cannot apply; disconnected sessions retain pending local work for reconciliation.

Allowed contributors: Document lifecycle controller; File-scoped publication outbox; WebSocket provider and authoritative document checkpoint.
Observation records and UI guesses cannot change runtime state.

Implementation entries:

- `apps/asyra-design/src/collaboration/lifecycle.ts`
- `apps/asyra-design/src/collaboration/publication-outbox.ts`
- `apps/asyra-design/src/collaboration/websocket-provider.ts`

## publish-history-members

Publish canonical finite members while preserving one local Undo and Redo action.

Owner: `@asyra/factory`.

Inputs: Factory-owned active HistoryGroupHandle; Finite canonical member callback and its transaction journal/delivery evidence.

Enroll each finite member at an idle group boundary. Members publish through the ordinary transaction path while the completed local group supplies one Undo/Redo action with original member order. Group handles must belong to the active Factory owner.

Bypass/rejection: Invalid or unavailable group handles and non-idle boundaries reject enrollment; observation evidence cannot create a History entry.

Allowed contributors: DataTransact History group lifecycle; Canonical transaction journals and shared delivery records.
Observation records and UI guesses cannot change runtime state.

Implementation entries:

- `packages/factory/src/data-transact.ts`

## apply-remote-publication

Validate received publications and apply canonical slices through Core without adding receiver History or echo publications.

Owner: `@asyra/asyra-design`.

Inputs: Received SharedPublication with explicit slice, batch and delivery order; Active document session and generation; Canonical Core state and public remote-apply APIs.

Validate slice/batch/delivery evidence before canonical application. Preserve peer hierarchy, geometry and partial property fields; remote application creates no receiver-local History action or echo publication.

Bypass/rejection: Invalid publication evidence is rejected; stale session sources cannot apply.

Allowed contributors: Remote publication organizer and apply owner; Current document lifecycle admission; Core public canonical apply APIs.
Observation records and UI guesses cannot change runtime state.

Implementation entries:

- `apps/asyra-design/src/collaboration/operations.ts`
- `apps/asyra-design/src/collaboration/lifecycle.ts`

## forward-live-publication

Forward committed document-channel publications while preserving immediate gesture frames and canonical order.

Owner: `@asyra/asyra-design`.

Inputs: Factory SharedPublication subscription; Scene-tree and props channel slices, ordered batches and deliveries.

Retain document-channel deliveries and their order; skip empty output. Atomic multi-slice publications collapse to one transport slice. Immediate gesture publications reach peers before pointer-up; local-only computed projections cannot enter shared transport.

Bypass/rejection: A publication with no document-channel deliveries is not forwarded. Computed projection events are rejected.

Allowed contributors: Factory shared-publication subscription; Document publication source adapter; Active document lifecycle transport.
Observation records and UI guesses cannot change runtime state.

Implementation entries:

- `apps/asyra-design/src/collaboration/factory-adapter.ts`
- `apps/asyra-design/src/collaboration/lifecycle.ts`
