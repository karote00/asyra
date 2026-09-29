# Complete basic API action coverage

Status: implemented and validated locally; no push or live-model generation.

## Bounded objective

Expose existing public design-task APIs as discoverable, composable actions instead
of adding capabilities only after a specific drawing fails. Preserve existing high-level
actions, canonical owners, transaction semantics, current permissions, source resolution
and requested visual fidelity. Do not add dependencies or perform a live model test/push.

## Scope and completion

Inventory Core's public facade and Design common-apis exports. Every inventoried method
must resolve to an executable contract, an equivalent existing action/API, or an explicit
non-task classification (lifecycle/registration, replay, subscription/host resource,
transient interaction ownership). Unknown additions must fail a permanent coverage test.
Do not classify an ordinary missing design operation as infrastructure to pass coverage.

Contracts supply API identity, named inputs, coordinate space, result meaning and effect.
Actions call the existing owner; they do not reproduce geometry or create a second state
model. Model callers cannot provide event/history suppression options. Existing backend
admission validates the published input schema; canonical owners still validate writes.

## Ordered slices

1. Establish the complete inventory and action contract; prove the current missing vector
   capability with a formal test. Start with read/anchor/handle/connect/split operations.
2. Cover remaining basic object, property, hierarchy, selection, viewport and Core queries;
   resolve every inventory entry rather than leaving a hand-selected subset.
3. Integrate generated definitions with Runtime registration, default permission policy,
   backend tool admission, batch dispatch, review invalidation and presentation. Derive
   these consumers from the same contracts; avoid another manual action-name allowlist.
4. Prove actual vector point/handle edits and reflection through normal Runtime batches,
   retained object identity, failure behavior and Undo/Redo. Verify catalogue coverage,
   schemas, input cancellation and propagation to provider-native tools.
5. Run focused contracts, AI/server integration suites, type/lint/naming/build and template
   parity; update the public integration documentation. Do not claim live-model quality
   or speed from deterministic tests.

## Owner boundaries and gates

The request-backend-action-batch step owns tool descriptions/admission. The
resolve-server-prepared-action-batch step owns registration and ordinary executor handoff.
Work on one owner slice at a time. Existing API owners remain the only geometry/mutation
implementation. Any discovered need to alter an existing geometry algorithm must be
separately justified rather than hidden in an AI adapter.

Required cases: missing capability, complete inventory with no unknown method, matching
registered action/schema, malformed batch rejected before dispatch, scalar and plural
queries, coordinate-space round trip, multiple point/handle edits, no-op/invalid targets,
permissions and cancellation, mirror without replacement, Undo and Redo.

## Current evidence

Core exposes roughly 150 public members (including infrastructure). Design element and
vector API objects declare 65 methods before spreads. Existing Runtime performs one
invocation transaction with sequential batches and preserve-progress failure policy;
this task preserves that established contract rather than inventing per-action savepoints.

## Current execution segment - API handoff verification

Owner: `resolve-server-prepared-action-batch`; backend discovery remains owned by
`request-backend-action-batch`. Inputs are the data-only public API contracts and
server-admitted arguments. Outputs are ordinary registered actions and canonical
receipts. Existing permission/confirmation and invocation transaction conditions
remain unchanged; aborted calls never dispatch. No model-selected method paths,
client geometry validation, new mutation owner or event/history suppression inputs.
Allowed files are the basic API contracts/adapters, direct Runtime/backend consumers,
and their permanent tests listed in this plan and the Inspector boundary.
Gates: complete public-member classification, actual signature order, schema admission,
permission classification, compact discovery, real vector reflection and Undo/Redo.
Stop at a canonical geometry defect requiring a separate owner change; do not hide it
with an adapter correction, delays, weaker expectations, or replacement geometry.

The original browser failure was caused by transaction-buffered computed projection:
canonical writes were current but the next coordinate API read stale projected values.
Applied batches now refresh Scene/Render immediately; committed UI observers remain
buffered. The permanent mirror tests retain object/node identity, one Undo/Redo entry,
translated-container coordinates, and rollback restoration. No AI-side geometry fix,
replacement element or frame delay was introduced.

Validation: AI 338, server 424, reactive-events 63, SceneTree 204, Factory 20,
Core 37, Preset subscriptions 24, vector units 19 and Inspector contracts 46 passed.
Six headless browser cases passed, including existing topology operations; the three
basic API cases also passed with rollback verification. Typecheck, scoped lint,
naming and production build passed. Browser screenshots were inspected. An old
transient-preview test mock was brought onto the current Core facade; its original
geometry assertions remain. No live-model quality/speed claim is made.


## Approved geometry synchronization segment

Bounded extension: trace the failing vector-node/handle sequence through the existing
common API, canonical property commit, derived geometry and coordinate-query owners.
Repair the first incorrect owner only; no AI-specific coordinates, forced delays,
replacement objects or loosened oracle. Preserve transaction, permissions, original
object/point IDs and requested coordinates. Read actual mutation evidence before selecting
the implementation step. The existing browser reflection test is the failing product
oracle; add the smallest permanent owner regression before the correction. Validate
sequential reads/writes, transformed parents, single transaction Undo/Redo and the
same public path outside AI. Update the matching owner contract if semantics require it.

### Applied projection delivery step

- Owner: `derive-local-computed-projection`; source contract: Framework
  `API_SURFACES.md` canonical/local projection and transaction-owner sections;
  Inspector conditions require current local property-derived values without
  canonical history or duplicate delivery.
- Evidence: permanent `local-computed-projection.test.ts` reads 0 after writing
  48 inside a transaction; browser vector reflection reads the original topology
  between successive canonical patches.
- Input: accepted immutable ordinary owner event batches and replay batches.
  Output: synchronous local derived projection; committed observers remain buffered.
- Boundary: reactive-events applied-batch delivery and Scene subscription. No
  Factory journal, AI geometry patch, history split, sleep, or persisted format change.
- New identifier owner: reactive-events `subscribeToAppliedEventBatches`, an
  in-process derived-state subscription, not a wire/persisted identity.
- Gates: transaction observer rejection/rollback tests, Scene read-your-writes
  and exact projection count, then vector browser reflection and Undo/Redo.
- Stop/replan if the evidence requires a second canonical mutation route or
  makes uncommitted canonical evidence visible to committed observers.

### Render and committed UI delivery segment

- Owner: `project-render-state`, paired with reactive local projection delivery.
  Existing vector topology E2E passes with the original delivery and fails when
  computed UI notifications run before outer commit. This is an in-scope regression.
- Input/output: the same local computed batch updates Render for current coordinate
  reads, then committed UI subscribers after owner finalization. No repeated Render
  work, new geometry, history entries, or shared computed payloads.
- Boundary: reactive local-computed publisher/boundary and Preset's existing Render/UI
  subscription wiring. Formal gates: transaction projection order/rejection/rollback,
  existing topology E2E, basic API matrix and Preset subscription tests.
- Stop if correcting notification timing requires moving canonical ownership.
