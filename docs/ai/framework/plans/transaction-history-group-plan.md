# Transaction History Groups

## Status and scope

Framework implementation and local regression acceptance are complete; latest PR CI, review and
downstream App integration are separate. Implementation and a PR to `main` were
authorized on 2026-10-01 in the originating AI panel conversation. This plan was
adopted from the coordinator's unmerged AI worktree as a new Framework task;
it is not represented as a prerequisite already integrated in `main`.

Worktree: `.worktrees/transaction-history-groups`.
Branch: `codex/transaction-history-groups`.
Initial base: `origin/main` at `c93176e1b14d58281664247071cfcd3552f7e0dc`.
The coordinating agent in the originating conversation owns closeout; Asa owns
PR review and merge. Single-agent work, no new conversation. Implementation
requires reviewed product and Transaction Inspector contracts first.

## Framework PR

Deliver Framework history-group APIs, grouped replay, count notifications and
the first incorrect batch-publication boundary with permanent tests and docs.
Preserve unrelated work in `.worktrees/ai-execution-flow`; its AI execution plan,
runtime changes and live model acceptance remain in that separate worktree.
Do not copy its implementation or depend on its unmerged Inspector tooling.

The Framework PR includes Core facade and lifetime integration, direct
Reactive Events/Factory/state-owner consumers required by the contract, existing
Transaction Inspector and proof registration, release metadata and formal gates.
The App will later bind each request, release its interaction lock and present
warnings through these APIs. App product integration and the live AI recording
in delivery steps 5-6 below are downstream work, not Framework PR completion
claims. Preserve one-request Undo in the current App until that integration.

Scope exclusions remain below. Do not add a CRDT conflict engine or alter model
parameters. Same-field Undo follows ordinary ordered replay, as confirmed by
Asa on 2026-10-01: it can overwrite a pending producer's live value. Pending
membership does not protect values or suspend the producer.

## Intended behavior

Several independently committed mutation batches can contribute to one pending
history group. Each transaction validates, publishes and reports its own outcome
normally. The group becomes one Undo entry only when its caller closes it.

- A group is not an open transaction, a document lock, or a second document log.
- Explicit membership selects transactions; elapsed time or a global active
  group must not accidentally capture user edits or remote changes.
- Pending groups do not enter the Undo or Redo stack. User Undo/Redo operates
  existing history without cancelling the producer or closing its group.
- Other user actions commit normally between finite mutation batches. Remote
  actions continue through the existing remote owner, without local Undo or echo.
- Closing a nonempty group appends one Undo entry at closure time. Undo replays
  its committed members in reverse order; Redo replays them in forward order.
- Stopping or finishing AI closes the group with successful batches retained.
  A failed active transaction rolls back itself; it does not erase prior commits.
- Empty groups add no history. A closed group cannot accept new transactions.
- Same-batch notification ordering and complete multi-property UI updates remain
  required. Grouping history does not repair publication ordering by itself.

The Framework is producer-neutral. AI request IDs, prompts and conversation
messages remain App-owned; the App maps one request to one group.

## API contract

Factory owns these public APIs; Core forwards them through its instance facade.

```ts
const group = core.startHistoryGroup()

core.updateHistoryGroup(group, () => applyFirstBatch())
// No mutation transaction remains open while waiting for the next batch.
// Unrelated user and remote actions are not members of this group.
core.updateHistoryGroup(group, () => applyNextBatch())

core.endHistoryGroup(group)
```

- `startHistoryGroup` returns an opaque handle bound to one Factory instance and
  runtime lifetime. It does not start a transaction or change stack depth.
- `updateHistoryGroup` binds exactly one finite transaction to that handle,
  runs the existing transaction machinery, and enrolls its successful journal
  atomically with commit. It returns the operation result; errors preserve the
  ordinary rollback outcome. It does not search for the latest transaction.
- Existing nested transaction calls join that finite transaction. Joining an
  unrelated already-active outer transaction is rejected before mutation.
- Callbacks are synchronous; returned promises are rejected and the current
  member rolls back. Asynchronous preparation occurs outside this API.
- A callback may not keep a mutation transaction open during model/network/user
  waits. Large actions use valid existing owner slices; slicing must not expose
  invalid partial hierarchy. Unrelated writes are serialized at the finite
  transaction boundary, not blocked for the group lifetime.
- `endHistoryGroup` seals the collection only after its active member settles;
  calling it with an active member reports that precondition rather than partly
  sealing. The caller awaits settlement, then seals even after a member failure.
- Handles from another Factory, a retired document, or a closed group fail before
  mutation. No-op/non-undoable commits do not create empty Undo members. Remote,
  Undo and Redo origins cannot be enrolled as new group members.

Do not overload `undoable: false` to hide pending members: their inverse data
must remain available. Do not modify ordinary transaction defaults to enable
grouping. Preserve each member's recorded delivery/replay evidence instead of
flattening transactions and losing their source boundaries.

## Ownership and architectural integration

- **Factory:** group lifecycle, explicit enrollment, committed member retention,
  one history-stack transition at seal, and grouped replay with existing inverse
  primitives. Store the owned journal once; avoid whole-document history copies.
- **Reactive Events:** instance-bound finite transaction dispatch and normal
  transaction lifecycle. A history group does not increase transaction depth.
- **Core:** public facade, document-lifetime disposal and existing commit-driven
  persistence. Separate physical transaction identity from logical history
  identity for consumers of completion events.
- **State owners / Preset:** authoritative mutations and computed projection;
  preserve ordered hierarchy and property publication at valid batch boundaries.
  Render consumes those updates; no reload or forced-redraw recovery path.
- **AI runtime / App adapter:** explicitly enroll each applied batch, release the
  request-wide interaction lock, refresh context after dependent projection,
  and seal on completion/Stop/failure. Research and preparation do not enroll.
- **Collaboration:** normal committed publications and remote apply continue;
  local history grouping does not change wire data or invent conflict resolution.
- **App UI:** optional operation-count warning. Framework exposes owned counts
  and changes; it does not own notification wording or browser memory estimates.

The existing architecture owners to extend are
`transaction-flow-inspector.data.cjs` steps `coordinate-transaction-boundary`,
`record-reversible-journal`, `validate-requested-commit`,
`finalize-transaction-state`, `settle-local-shared-projection` and
`acknowledge-persistence`. Add the history-group lifecycle to this existing
Inspector, with exact inputs/outputs, failure ownership and implementation
boundaries, rather than creating a parallel transaction architecture. The downstream AI integration will update its own `apply` handoff.

## Interleaving contract

These are required behavior decisions, not permission to silently constrain the
user to a document-wide editing lock.

1. **Overlapping edits:** ordinary ordered Undo applies the recorded inverse.
   User x=0 -> 10, pending producer x=10 -> 20, then user Undo yields x=0.
   The group remains open. The producer reads current state before its next
   batch. Later group Undo/Redo also replays recorded values in order; there is
   no selective-Undo rebase or value protection against interleaved writes.
2. **Existence and hierarchy:** user Undo or remote removal can delete an AI
   target or its ancestor. AI must revalidate the next batch and receive an
   actionable failure. Define grouped replay when an intervening action depends
   on an object created by the group; never leave dangling children or resurrect
   deleted objects implicitly as a fallback.
3. **Redo branching:** define when a new committed member and later sealing
   invalidate Redo. Opening/updating a group must not act like a user Undo or
   automatically stop AI; ordinary new-mutation branch rules still need an
   explicit contract, including user Undo/Redo between group members.
4. **Replay failure:** one grouped Undo/Redo is one history transition. If a
   later member replay fails, restore prior replay work and retain the original
   stack position using canonical rollback; no half-undone group.
5. **Completion identity:** commit statuses/persistence occur per transaction;
   logical history completion occurs once at seal. Audit existing
   `userActionCompleted` consumers and AI history correlation so they cannot
   mistake a hidden pending member for an available Undo entry.
6. **Lifecycle:** define reset/load/disposal while groups are open. Invalidate
   old handles and release retained journals without undoing already committed
   document data or publishing a history entry into the replacement document.

Multiple producers may hold distinct handles; no implicit singleton membership.
Closing one group must neither close nor enroll another. Locking selected objects
for future prompt editing is explicitly deferred and cannot be assumed here.

## Memory, persistence and responsiveness

- Retaining inverse data costs memory. Expose member/change counts and a
  configurable warning crossing; do not stop work, prune history, or reduce
  detail automatically. Counts are a proxy, not a claim of measured RAM usage.
- The App presents a non-blocking warning without repeatedly notifying on each
  update. Choose the threshold during integration and record its rationale;
  this plan does not invent a universal safe operation count.
- Physical commits still trigger existing persistence semantics. Measure commit
  snapshot work separately from history retention. Do not silently suppress
  durability, clone the full document for group enrollment, or build a second log.
- Prove existing complete-batch UI updates: resize/multi-selection must not emit
  partial valid-value/MIX_VALUE oscillation. Pending computed and hierarchy
  notifications must settle before a dependent read, fit or inspection.
- Use existing cooperative scheduling at valid owner boundaries for large
  batches. Do not add one/two-frame waits per action or an AI-specific renderer.

## Delivery sequence and gates

1. **Contract slice:** resolve the interleaving cases above against current
   owners; write the thin product spec, update existing Transaction/AI Inspector
   handoffs and permanent contract cases, and self-review. No production work
   advances while those contracts conflict. This document alone is not readiness.
2. **Factory slice:** test-first lifecycle/enrollment/seal, independent handles,
   ordinary interleaved commits, empty/invalid cases, nested transactions,
   member failure and logical completion identity. Preserve existing journal,
   shared delivery, rollback and history tests.
3. **Replay slice:** test-first grouped Undo/Redo, reverse/forward member order,
   replay failure restoration, Redo branching and overlapping canonical edits.
   Test real state owners, not only stack counts or mocked callbacks.
4. **Notification slice:** use the retained two-rectangle failure and direct
   Factory/Preset integration cases to fix the first incorrect publication
   boundary. Include dependent actions inside one batch, unrelated ordinary
   transactions, resize/multi-selection and remote delivery. No global switch
   to immediate per-field notifications.
5. **Core / App slice:** admit public APIs and types, handle lifetime, persistence
   and per-request enrollment; allow ordinary edits and Undo/Redo during AI
   waits. Test Stop/member error/request completion, pending-history invisibility,
   user/remote interleaving, counts and warning behavior. Synchronize runtime,
   Factory/Core/API-surface and App docs with actual implemented contracts.
6. **Integration slice:** replay the saved drawing actions without AI; inspect
   the real frame before request completion; verify one grouped Undo/Redo.
   Run the existing scoped type/build/lint/import/naming/contract gates and
   affected transaction, collaboration, persistence and render E2E suites.
   Run the applicable formal 7076 milestone after focused gates pass, then the
   parent plan's headless real-AI recording and latest-head PR CI checkpoint.

Primary future code owners are `packages/factory`, `packages/reactive-events`,
`packages/utils` public transaction types, `packages/core`, the direct
Preset/state-owner notification path if proven necessary, and the existing
AI runtime/App adapters. Each slice freezes its exact boundary before editing;
this planning task does not authorize unrelated package cleanup or render-engine
changes. Use existing project dependencies and runners.

## Definition of done

Transactions become visible at valid batch boundaries while a request is still
running. User and remote actions are never accidentally collected. Open groups
remain outside history; sealing creates exactly one restorable entry. Stop and
failures retain prior successful commits. Interleaved replay satisfies the
ordinary ordered replay contract; no tests hide it behind locks or reloads. Same-batch
ordering, multi-selection values, durability and grouped replay failure recovery
pass formal tests. Memory warnings are advisory. Framework acceptance is recorded below; App
integration and real-model performance are not claimed by this Framework PR.

## Evidence and exclusions

The current SceneTree move commits canonical hierarchy at
`packages/scene-tree/src/sceneTree.ts`, while Factory defaults its shared
delivery to transaction-end. Local computed events can reach Render earlier
through applied-event subscriptions in Preset. The parent plan retains the
two-rectangle red E2E and recorded stream showing coordinates delivered without
the matching hierarchy projection. Independent per-operation transactions pass.
This motivates both shorter physical transaction boundaries and the separate
within-batch publication fix; neither is assumed to prove the other.

Excluded: object editing locks, model/prompt changes, new dependencies, generalized
CRDT/OT replacement, automatic history truncation, persistent history formats,
unrelated UI redesign and source-image/detail reduction. If the overlap contract
requires a broader conflict engine, report that concrete dependency rather than
silently adding it or weakening the interleaving requirement.

## Current owner segment

`finalize-transaction-state` - Factory lifecycle, enrollment, counts and replay.
Product authority: Factory package contract, Transaction history groups section.
Inspector: matching step inputs, conditions, boundaries and failure owner.
Inputs are explicit handles, finite callbacks and committed owner journals;
outputs are normal per-member commits, pending status and one sealed Undo entry.
Empty/non-undoable work bypasses membership. Existing rollback owns failures.
Allowed contributors are existing state-owner inverse/apply and transaction
boundaries; App prompts, render recovery and persistence-driven history are not.
Implementation stays in Factory sources/tests; public types are Factory-owned,
producer-neutral and local-only, without new persisted identifiers. Core is a
later facade segment. No additional cache is introduced.

Focused gates: source-bound history-group proof plus journal/shared/replay tests,
Factory type/build, naming and Inspector contract checks. Stop on contradictory
replay/publication semantics or a required owner outside the declared boundary.
The design review resolved same-field Undo, independent membership, closure
identity and failure rollback; runtime proof is intentionally red before APIs
exist. Flow target `71b5432f-9e1f-403a-9fb3-d55458f61b27` revision 1 admits the
source-bound cases. This admission is not runtime acceptance.

Factory segment result: 283 owner tests and Factory build pass. A red replay
case exposed lost member slice order; sealed history now indexes existing source
batches with member-scoped slice identities, without cloning canonical payloads.
Atomic and progressive Undo/Redo cover repeated target/slice names.

Next segment: `finalize-transaction-state` Core facade contribution. Same Factory
product contract and Inspector allowlist; Core only binds public methods/types
to its injected Factory and existing runtime lifetime. No new global group owner.
Cases: independent Core instances, real SceneTree edits, pending/closed history,
retired handle. Gates: Core focused tests/build and public types. Stop if the
facade needs to reconstruct journal evidence or bypass owner lifetime.

Notification evidence segment: `finalize-transaction-state` projection handoff.
Re-read its state-owner acknowledgement and Preset boundaries; diagnose the
mixed-delivery group/move/ungroup case in the real Design canvas before changing
production publication. Formal consumer test lives in
`apps/asyra-design/e2e/transaction-history-groups.spec.ts`. Assert hierarchy and
native snapshot bounds after one finite member, before group closure, then
Undo/Redo. App production behavior remains excluded. No renderer repair or
forced reload is allowed. A causal-order defect requires a red case and an
exact owner-contract update before its implementation.

The real-canvas red test fails after the finite member closes with
`Snapshot target has no finite visible bounds`. This confirms grouping alone
cannot repair publication. The revised projection handoff reuses the existing
`SCENE_TREE_CHANGED` identity and local applied-event boundary for complete
canonical Scene Tree batches. Preset Render consumes it instead of the delayed
shared echo; UI/shared/collaboration timing stays unchanged. The Inspector owner
boundary now includes that Reactive Events publisher and its Preset consumer
regression. Existing computed projection remains unchanged. No payload cache,
new renderer path or document reload is part of this correction.

Same owner segment, ordered-overlap regression: the real Core raw-data replay
rejected a recorded inverse when a pending producer had changed the same field.
The red Core test proves that mismatch (history moved but the value stayed).
Scene Tree synchronous Undo/Redo now accepts the recorded target value while
preparing fresh before evidence from its current state. Ordinary command/remote
stale-evidence checks remain strict. This is ordered replay, not conflict
resolution; Factory, Scene Tree and Core regression gates cover the correction.

Failure-atomic overlap case: a two-write user action followed by a pending write
must restore the actual pre-Undo value if its second inverse fails. The new Core
regression is red: static source restoration returns the old historical value.
Within `finalize-transaction-state`, extend the existing synchronous apply
acknowledgement with optional owner-prepared restoration events. Scene Tree raw
replay prepares these from current canonical before values; Factory retains them
only for acknowledged applies. Other owners/custom handlers retain the existing
prevalidated inverse contract. Do not infer complete restoration from a partial
journal. Gates: Core overlap/failure, Factory full replay, Reactive Events nested
acknowledgement/failure tests and the existing integration cases.

### UI projection correction - Step Execution Card

Owner: `finalize-transaction-state`, canonical projection handoff. Inputs are
completed immutable Scene Tree changes and their instance-local projection
identity. Render consumes applied batches; UI consumes the same ordered batches
at outer commit and flushes once. Shared delivery is not local projection order.
Existing computed routes, persistence and network payloads remain unchanged.
The real browser regression now proves a nested Layers row has depth 1 instead
of 2 although canonical hierarchy and Render are correct. No canonical rescan,
reload, global cross-instance delivery or intermediate UI notifications are
allowed. Implementation allowlist and failure owner remain this step's Scene
Tree, Reactive Events, Preset and real Design regression files. Gates: deferred
UI, owner isolation, mixed-delivery Layers depth, rollback, Undo/Redo, and the
existing large-batch case. Stop if correction requires new app production code.
The identity is a local symbol only, never persisted or sent over the wire.
The regression passes: Render and Layers agree before sealing and after Undo/Redo.

## Framework acceptance

Factory (283), Reactive Events (68), Core (255), Scene Tree (207) and Preset
(174) unit/integration cases pass. Source-bound Transaction flow proof covers
nine cases. The complete headless Design suite passes 191 cases with 12 existing
opt-in skips. The explicit pointer-down/drag previews pass without delaying
Layers creation or duplicating commit delivery. Real browser acceptance covers finite-member visibility before seal,
exact document and image restoration after one Undo/Redo, existing Group
interaction (9 browser cases), and remote Group Undo/Redo with and without
tombstones (3 collaboration cases). One earlier hover setup run lost its second
selection before grouping; the isolated case and full 9-case rerun pass without
changing that test. No timing or renderer fix is claimed for that occurrence. The formal
7,076-object drawing case passes and its screenshot was inspected. Naming, applicable lint/type/build and public documentation generation pass.
The target assessment is completed and eligible on the reviewed projection
contract; all nine source-bound obligations pass. The original allocation lacked
an executable verification-source pin and is superseded by the source-pinned
allocation. Public package artifacts and clean-consumer validation are recorded
in the PR (19 packages, all four clean-consumer phases pass); no package
publication is authorized. The full Inspector package passes 12 React and 100
contract cases; Design API inventory and server-response validation pass
(428 cases, one existing opt-in skip). These results include the corrections below.

The originating AI execution plan remains active in its own worktree. Its
request enrollment, interaction unlock and warning UI are not implemented here.
This plan stays active until that downstream integration is completed; do not
close the entire plan merely because this Framework PR is ready for review.

### Public API consumer inventory correction

The existing Design public-API coverage test detects four unclassified new Core
methods (local red confirmed). Its direct consumer metadata is part of facade
admission: classify the opaque-handle/callback history lifecycle as host-owned,
using the existing disposition registry. This does not add model actions or App
request enrollment. No Inspector runtime step changes: this file is a coverage
inventory, not an execution allowlist. Allowed edit is the disposition metadata
and this plan; gates are the unchanged coverage test, server-response suite,
App declared typecheck, naming and scoped lint.

### Inspector reference and generated catalog correction

The full Inspector package contract suite detects an invalid cross-document
step anchor and a stale generated workspace catalog. The owner remains
`finalize-transaction-state`: its references must resolve within the Inspector's
declared specification. Add the history-group contract link under that spec's
existing Undo section, retain its local `#undo` reference, and regenerate the
catalog using the official generator. This repairs contract delivery only; no
Inspector runner changes. Gates: full Inspector package tests, transaction
contract proof and generated-catalog equality.

### Revised projection iteration - explicit preview delivery

The real create-on-pointer-down E2E fails because UI deferral removed the existing
explicit `sharedDelivery: immediate` preview contract (Inspector
`choose-session-outcome` condition). Replace the assumption that all structural
UI waits with: default waits; explicit preview flushes its same-Scene-Tree local
projection sequence in canonical order. Render still applies once immediately.
Owner step: `finalize-transaction-state`, with Reactive Events local boundary as
contributor. Inputs: completed projection events, instance scope, explicit
immediate intent. Outputs: immediate ordered preview or one deferred delivery;
no committed echo. Keep scope-indexed pending event references and delivered
identities per finite transaction; clear on end/rollback. Never flush another
owner, mutation commands, or unrelated computed events. No document scans or
repeated scan of all pending events per preview. Self-review: preserves current
preview and deferred UI contracts and fixes the ordering owner instead of App
rendering. Files: existing app/publish.ts, scene-tree/publish.ts, publisher tests,
current specs/Inspector and generated catalog. Gates: source-level test-first
preview/order/isolation/rollback, existing element-creation E2E, pending-group
E2E, Preset/Reactive/Factory/Core, collaboration, and final 7076 milestone.
