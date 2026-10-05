# Tool definition delivery

Status: implementation complete; final local and remote integration checks pending.
Base: `9a59296796b24fac51c5a3f048186a24c052a8b0` (PR #281 merged).
Parent: [AI execution flow](ai-execution-flow-plan.md).

## Task - definition retrieval and transmission

The existing `compose` owner supplies exact admitted App and native tool
contracts. Add selective retrieval without another catalog, model call or
mandatory discovery round trip. Preserve execution, validation and full recovery.

Scope: Design server definition discovery, native schema conversion, their direct
provider consumers and permanent tests; the existing execution spec, compose
Inspector and source-proof mapping. Exclude rendering, image acquisition/retries,
geometry, model/effort settings, new dependencies and unrelated cleanup.
Discovery is fixed to these owners, existing schema utilities, registry consumers
and their tests. Final review stays within this diff and its direct consumers.

### Product cases and design

1. Exact name/operation queries accept `view: usage` or `schemaPaths`, using
   JSON Pointer paths into the registered input schema. Usage returns purpose,
   execution route and root field paths; field queries return exact fragments
   with referenced local schema dependencies. They explicitly identify partial
   coverage and retain a full-definition route. Unknown paths reject recoverably;
   never substitute a similarly named field. Existing selector/full/menu behavior
   remains available. Partial replies do not consume full-definition delivery.
2. Native conversion continues to materialize common union fields for Code Mode.
   Remove only provably redundant choices/constraints: identical anyOf/allOf
   branches, duplicate required/enum/type entries and enum constraints already
   implied by a compatible primitive const. Preserve oneOf multiplicity,
   incompatible constraints, definitions, required fields and closed objects.
   No reference factoring that makes native declarations opaque.
3. Full and partial replies identify response coverage separately from earlier
   delivery. A previously returned reference instructs reuse when context exists;
   explicit refresh restores the full contract after context loss or delivery
   failure. A server delivery record is not a claim that the model retained it.
   State remains request-local and keyed by identity/revision; no execution dedupe.

### Step card - compose

Authority: execution spec, Capability discovery and composition; Inspector
`compose`, request-to-compose and compose-to-apply routes. Inputs: admitted action
and native schemas, exact query and request-local delivery records. Outputs:
selective documentation, complete schemas or explicit prior-delivery references;
native declaration schemas retain admission equivalence. Conditions: one selector,
valid paths, current registry; known operations bypass discovery. Contributors:
registered contracts and native provider; forbidden: guessed capabilities,
model-generated schema repair, canonical writes or a second schema authority.
Failure owner: compose through existing recoverable invocation boundary.
Implementation boundary: local-operation-tools.ts, operation-input-schema.ts,
their owner-local projection helpers and corresponding server tests;
execution-flow-proof.test.ts for provider handoff. No new retained computation
cache. Reuse existing request-local delivery state; usage/fragment projections
are per query, only selected subtrees are traversed for reference closure.
Names are App-owned ephemeral wire/query fields, not persisted document data.

### Feasibility review

Registered schemas are already available at both exact lookup routes. Projection
can consume those same objects without changing admission. JSON Pointer supports
arrays, escaped field names and union branches without inventing field aliases.
Fragments cannot stand for a full executable schema: explicit coverage and the
full recovery route are mandatory. Local references need their transitive closure,
including cycles, rather than an unexplained dangling reference. Unknown or
external references remain explicit and can be inspected in the full definition.
Native compaction must keep contradictory schemas contradictory and must never
deduplicate oneOf. Existing conversion tests cover closed-object intersections;
add overlap, nullable, nested/reference and real registered-schema cases.
These decisions resolve the design risks inside compose; no new owner is needed.

### Verification and delivery

Add permanent regression tests first and demonstrate missing selective queries
and repeated constraints on the base. Verify actual transmitted byte counts,
registry callback counts, partial/full/repeat/refresh/new-request/revision cases,
malformed input, missing paths and native namespace ambiguity. Compare admission
before/after conversion for valid and invalid candidates; never assert model
seconds. Run focused server suites, complete Design lint/build/test, naming,
Inspector contracts/generation and source-bound execution proof, plus applicable
local CI selection. Preserve all accepted flow obligations. A live drawing is
not requested for this transmission change and cannot prove schema equivalence.
Stop on required out-of-scope change, contradictory authority, unproven schema
equivalence or failed mandatory gates. After bounded review and latest-main
integration, create a new PR and verify CI. User reviews; do not merge it.

### Validation checkpoint

Selective lookup and schema compaction regressions were demonstrated failing
before implementation. The focused provider/invocation/retrieval/schema proof
suite passed 283 tests (3 existing conditional skips); 98 retrieval/schema tests
also pass after strict query-type and object-choice preservation corrections.
Design full lint/build/test and shared checks passed. The generated Inspector
bundle was synchronized after its catalog consistency gate detected the stale
artifact. Remaining gates are the final routed validation and latest-head CI.

The source-bound compose candidate is `48670b76-ca35-4f25-8fa2-85474cbe1775`.
The unchanged main contract has its own retained preservation verifier
`26d48e8c-6cd4-4820-80ee-4043a97dd25c`; no existing obligations were removed.
Final reviewed target is `4ff56f4a-fe6f-43ea-a26c-d1e3c1876526`.
Synthetic long-definition tests require usage/fragment replies below half the
full reply size. This proves selective transmission, not a model latency gain.
