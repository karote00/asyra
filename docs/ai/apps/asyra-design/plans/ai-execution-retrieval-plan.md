# AI precise retrieval and work reuse

Status: local retrieval stage validated; parent live acceptance pending.
Parent: [improvement plan](ai-execution-improvement-plan.md).

## Outcome and scope

AI can find applicable registered operations and retrieve exact required scene
data without repeatedly rediscovering names or reading the whole scene. Extend
the existing API registry, descriptions, artifact targets and narrow queries.
No context-rag dependency, vector database, second editable model or extra model
call for routine data preparation.

## Tasks

1. Trace existing registry/discovery consumers; add bounded purpose/name search
   over current registered descriptions where missing. Retrieve complete current
   schema by exact name after discovery; never truncate required parameters.
   An empty search is not evidence that the App lacks a capability. Preserve
   access to the complete compact catalog and custom registrations.
2. Prove existing artifact target maps/plural operations and field selection in
   permanent caller tests. Repair demonstrated gaps; preserve current existence,
   permission, document identity and revision checks. Queries return requested
   data and explicit completeness; known IDs never require semantic guessing.
3. Inspect measured repeated source loading/analysis within a request. Route to
   existing immutable artifacts first. Introduce retained work only with proven
   repeated cost, exact validity/release and work-count/equivalence tests. Record
   intentional non-reuse when bytes/configuration/identity differ. No blanket
   cross-request reference cache or fixed search sources.

## Completion

Formal cases cover name/purpose discovery, custom registration, no-match recovery,
exact schema, plural targets, field selection, deleted/replaced/locked targets and
current-data invalidation. Record supported before/after work counts. Sync tools,
prompt guidance and their exact Inspector owner boundaries, then run focused
provider/operation/context tests, App type/build/lint and final live acceptance.

## Active step card - compose registry lookup

Spec: Capability discovery and composition. Inspector: compose. Input is the
current invocation's admitted basic-API descriptors and optional exact names or
lexical name/purpose query. Output is a complete compact matching index or full
current schemas by exact name. No match exposes an explicit path back to the
complete catalog; it cannot declare a capability unavailable. Exact names and
query are mutually exclusive. Custom descriptor schemas/descriptions supplied
for admitted API identities remain authoritative; this does not admit arbitrary
new operations or change execution permissions.

Owner files: local-operation-tools.ts discovery branch and its formal tests,
ai-domain-prompt.ts if guidance needs sync, execution proof. Allowed contributors
are existing registration/contract metadata; forbidden are scene traversal,
model classification, geometry, semantic guessing of IDs, and blanket caches.
Failure belongs to compose input admission. Existing query without arguments
retains the complete compact catalog. No retained derived cache is introduced;
the admitted descriptors live for one invocation. Tests prove purpose/name
matching, current descriptors, exact schemas, empty-result recovery, payload
reduction and unchanged capability access. Gates: operation/provider/proof,
App typecheck/build, lint/naming and source-bound contract review. Target maps,
query execution and reference analysis are separate later owner segments.

## Discovery checkpoint

The admitted basic-API registry now supports optional lexical name/purpose lookup,
complete compact results and explicit no-match recovery. Exact-name schemas
retain the current invocation's descriptors. Formal proof keeps all registered
capabilities reachable; a narrowed query has fewer response bytes than the full
catalog and makes no canvas calls. No speed claim is inferred from this proof.

Four focused suites passed 173 tests, three existing opt-in live cases skipped.
App typecheck/build, scoped lint/naming and Inspector contract checks passed.
Source-bound candidate `2c2cadfa-b803-4109-8df7-eb41314792c5` and contract review
`58fdcb19b27d03a363148d0f4141febb463141e3f90222ea32416f0e335786d7` passed/accepted.
Target/query/reuse proof and final live acceptance remain. Direct caller review
also identified a recording gap: batched operation selectors are currently
omitted by the diagnostic allowlist; repair at observe before final acceptance.

## Active step card - observe batched selectors

Current recording contract requires exact bounded query selectors. The real
execute_design_batch caller puts them under operations; the allowlist currently
drops that key and query scope/pagination. Owner observe will retain bounded
operation names/selectors and explicit array truncation, plus discovery counts.
Report JSON exposes only the selector projection. Optional model assessment
continues to receive compact call summaries, not full nested operation arguments.
Inputs: actual tool arguments/results; outputs: sanitized evidence and read-only
report selectors. No scene read, cache, permissions change or renderer contributor.
Files: local-ai-usage.ts, local-ai-evaluation.ts, local-ai-assessment.ts and direct
formal tests already declared by observe. Test actual writer -> reader -> report
before implementation; preserve raw-payload exclusion and prove model-summary
size does not grow with nested operation payloads. Existing source-bound observe
proof, typecheck, lint and naming remain gates. Stop on any unbounded/raw payload.

Observe checkpoint: actual writer/reader/report regressions reproduced the
missing batch selectors and passed after the allowlist/projection repair.
Optional assessment excludes those nested selectors. Five focused suites passed
123 tests (three existing live opt-ins skipped); typecheck, scoped lint and naming
passed. Source candidate `788ef8fe-c9e0-4f71-9260-11b7abb1032f` passed; contract
review `bf6d5d05f179f0df56520a3e94e0fa84f1d09bf6616cef9ebf3c07a43658470b`
has no blockers. Existing two console warnings remain unchanged.

## Existing owner proof - targets and immutable preparation

Validation-only segment: request/prepare/apply contracts in the execution flow
remain unchanged. Run existing formal callers for continuity, target resolution,
plural operations, canonical narrow reads/edits and immutable image preparation.
No production edits or new cache are authorized by this proof segment. Inputs
are current IDs/fields, current canonical records and invocation-local handles;
outputs are exact query values, canonical edit results and reused admitted
preparation. Verify deleted targets and locks at the canonical owner, stale
continuity at request, and artifact release/request isolation at prepare.
Stop and write a separate owner correction only if a formal case fails.

Validation: nine existing owner suites passed 154 tests. Known-ID context queries
return 250 targets in one call, read only named fields and make zero computed
reads for metadata-only requests. A subsequent canonical deletion/rename is
visible on the next query; inherited locks and missing ancestors reject edits.
Prepared prefix targets resolve once into one exchange containing three actions;
canonical failures propagate, and cancellation prevents dispatch. Continuity
drops deleted compositions and stale reply targets. Prepared keys require no
canvas reads, disappear after explicit release, and repeated semantic edits
reuse the original identities rather than rebuilding covering layers.

Image preparation tests prove one conversion and one geometric analysis feed
two prepared sizes; foreign invocation receipts, stale sources and cancelled
work are rejected. Reference import already retains the decoded receipt by URL
within one request and its formal test proves one download. These are existing
reuse paths, not new optimizations. The observed historical trace does not prove
material redundant reference decode/analysis beyond these paths, so no new
cache or cross-request retention was added. Different source/configuration or
refinement artifacts still require their declared owner work.

Local changes are registry name/purpose discovery and repaired batched-selector
recording. Target/query/preparation paths remain unchanged because their formal
work-count and invalidation cases pass. Logs: `tmp/ai-retrieval-owner-tests.log`.

## Live failure correction - compose property semantics

Run `d993ee8b-8db6-44a2-98e2-abb61264507a` stopped during a 2310-target
Core property update. Its saved arguments copy computed fill objects into the
canonical `fills` reference list. The canonical document retains string IDs.
Confirm the distinction with the formal App runtime before changing guidance.

Step card: compose; Capability discovery and composition. Inputs are registered
API descriptors and current canonical/computed query results; output is accurate
discovery guidance with existing plural record-patch alternatives. Canonical
validation remains authoritative; no automatic payload conversion, swallowed
exception, new operation, renderer change or subject-specific workaround.
Allowlist: basic-core-api-contracts.ts (the registered Core descriptor owner),
basic-api-contracts.test.ts and local-ai-provider.spec.ts, plus corresponding
compose contract/spec documentation. First add a failing descriptor-contract
test and a native App case proving invalid expanded values do not mutate while
plural record patches preserve identities and update gradient values. Then
clarify read/value/record meanings and batching guidance. Gates: focused catalog,
provider and native App cases, type/lint/naming, source proof and a fresh live
recording. Stop if canonical behavior differs; do not modify Framework based on
this input-shape observation. Failure owner is compose metadata.

Correction validation: the native App reproduced the exact PropsManager invalid
`fills` array rejection with unchanged prior state; plural `records` patches
updated gradient values while retaining fill IDs. Descriptor regression failed
before the correction; four suites now pass 153 tests (three existing live
opt-ins skipped), and the native E2E passes. Typecheck, scoped lint/naming and
source candidate `39ab4173-e1e5-4c30-84e1-9dd3f6a5cdf4` passed; contract review
`44f83fcc44eafe4174b98646ac2c09198cc4b379fc0873b1a02889cbf3eac3b0` has no blockers.
Only discovery descriptions changed; native validation and failure propagation
remain intact. Failed run and video remain under `tmp/ai-final-acceptance-20261003`.
A fresh full acceptance remains required.
