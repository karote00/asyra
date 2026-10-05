# AI precise retrieval and work reuse

Status: completed locally; final live evidence recorded in the parent results.
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

## Final acceptance

Completed locally. The corrected canonical property descriptors passed the native
regression and successful final drawing. See [parent results](ai-execution-improvement-results.md).
Remaining recovered argument failures and large responses are recorded as
observations, not concealed or treated as proven redundant queries. No push.

## Follow-up prerequisite - canonical Fill updates (2026-10-03)

Status: in progress. Before AI integration, refactor Design's public Fill write
API to consume target IDs and requested new fields only, then validate all Fill
interactions. This prerequisite does not change the completed lexical lookup.

The focused API regression failed on the old signature. Browser verification
then exposed a deeper defect: the Preset Fill child adapter supplied defaults
for omitted fields on existing-record patches, resetting a previously changed
color. Do not repair this by requiring full old data from callers.

Step card: `prepare-and-apply-property-batch` in the canonical projection and
collaboration Inspector; product sections `Canonical Element Property Update
Contract` and `Props Manager Batch Contract`. Inputs are canonical record deltas
and the registered Fill relation; outputs are updated fields and owner-produced
before/after evidence. Missing records use registered creation defaults;
existing records retain omitted fields. Empty/equal updates produce no changes.
Allowed contributors are Preset's Fill relation and existing Props preparation;
caller snapshots, render patches and manual history are forbidden. This slice
is bounded to `fills-component.ts` and `children-map-property-component.test.ts`,
both in that step's allowlist. Failure belongs to the property preparation step.
No new cache or schema is introduced. The failing sparse-adapter regression,
real App creation/patch/Undo/Redo test, existing Fill unit suites and complete
Property Panel/gradient browser suites form the gates. Broader relation-adapter
changes are excluded. Any further owner mismatch requires re-evaluation before
editing. After this prerequisite passes, sync the AI caller's new signature;
no live AI run starts before Fill verification passes.

Fill prerequisite checkpoint: common API/UI/gradient callers now send only the
requested fields. The Preset relation adapter retains ID/type mapping without
supplying creation defaults on an update. Existing component defaults still own
creation. The partial-update regression and all 38 Property Panel/Fill/gradient
browser cases pass, as does the two-peer computed/UI/Undo/Redo case. The run in
`tmp/fill-api-verification/verified` records 39 passes and verified source inputs.
The 24 App Fill unit cases and 28 Preset cases pass; typecheck, build and scoped
lint pass. Linear/radial/angular/diamond App screenshots were inspected.

User clarification - Design acceptance is the integration gate: verify the public
API replacement in Asyra Design itself before enabling any AI caller. Include
multi-element mutations, Property Panel edits, preserved independent fields,
gradients, canonical notifications and Undo/Redo. Passing batch API tests alone
does not prove multi-selection Property Panel behavior. The current panel uses a
single-selection owner and must be verified explicitly. The previously recorded
39 browser passes do not close that new multi-selection acceptance case.

AI integration remains deferred. Its descriptor regression was drafted, but
production descriptors have not been changed. Do not treat the public API
replacement as accepted, or begin AI integration, until the Design gate passes.

Deferred step card - `compose` caller synchronization: after the Fill prerequisite, update
only the two existing Fill descriptors and their contract tests. Source:
`ai-execution-flow.md` / Capability discovery and composition, Inspector
`compose` inputs/outputs and exact-schema condition. Input remains admitted
capability definitions; output keeps tool identity/effect but uses target IDs
and new values in public API argument order. No current-data prerequisite,
provider/model/prompt change, alternate mutation route, or new permission. Tests
must admit new-value requests and reject superseded snapshot arguments. Boundary
is `basic-design-api-contracts.ts` and `server/__tests__/basic-api-contracts.test.ts`;
failure belongs to compose. Stop if the descriptor requires behavior outside the
validated common API. No cache or additional runtime state is introduced.

Multi-selection verification slice: Design Fill UI intent composes one plural
canonical patch at `coordinate-canonical-owner-preparations`. Keep the existing
mixed-fill presentation and single-owner canvas gradient handles. Inputs are
selected element IDs, displayed row index and requested new fields; resolve each
row's actual Fill ID at the App API boundary. Outputs are one canonical batch,
preserved unmentioned fields and one Undo action. No caller old-value snapshot,
UI-owned document, default padding or per-element commit is allowed. Extend only
the direct Fill common API/UI callers and their permanent tests and docs. Test
multi-selection opacity, visibility, gradient edits, add/remove and exact replay;
reject invalid batches atomically. This is an App composition repair, not a new
Framework projection or mutation contract. First prove the current multi-select
UI fails; AI integration stays deferred until these cases pass.

Design acceptance completed: the multi-selection E2E failed before correction
(both opacity values remained 1). App common APIs now resolve actual row targets
and submit plural mutations, with single-item APIs delegating to them. Nine new
Fill E2E cases pass, including multi-selection add/remove/opacity/visibility/
gradient/replay and atomic invalid-batch rejection. Complete scoped browser gate:
35 ordinary passes plus 5 pre-existing expected gradient-render failures; these
five are known baseline limitations, not reported as successful visual checks.
The source-verified run is `tmp/fill-api-verification/design-final`; no unexpected
failures. App Fill unit tests: 26 passed. Multi-selection screenshot reviewed.

Compose integration now resumes: update existing Fill write signatures and admit
the validated plural APIs and narrow target lookup in the existing registry.
The formal catalog test failed on the old signature and uncovered unregistered
new methods before this integration. Keep native dispatch/permissions/history;
no AI-specific copy of mutation logic. The native action path must demonstrate
multi-target preservation and Undo/Redo before the full Taipei 101 live run.

Compose checkpoint: seven descriptor/coverage tests pass after removing old Fill
arguments and registering the four new public methods. All 89 focused compose,
operation and execution-proof tests pass. The native browser dispatch case passes:
registered AI action -> public Fill batch -> two real canonical records, preserving
independent opacity and restoring both records in one Undo/Redo. No mock replaces
the native canonical path. Guidance now requests direct productive first drawing
rather than disposable motif trials; actual drawing review remains required.
Full real-subscription acceptance is the next gate; model remains 6-Astra medium.

Live acceptance exposed a new admission defect: the model used the new batch API
for 22 targets but placed `gradientType`, `gradientStops`, `gradientHandles` and
`type` at Fill patch root. The permissive descriptor admitted them; the App key
filter silently dropped them. Stop this acceptance and preserve its artifacts in
`tmp/ai-fill-acceptance-20261003-r2`. Do not count partial field application as a
successful edit. Correction at App composition: reject unknown new-value fields
before any canonical call, derive writable keys from the existing registry, and
make the AI schema explain/validate nested `gradient`. Keep canonical value
validation and no-old-values semantics. Tests first: unknown field in the second
batch item rejects the entire batch; nested gradients admit while flattened
fields reject. Re-run Design gates before AI descriptor correction and native/live
acceptance. No renderer or Framework authority changes are needed.

Admission correction verified: the two new regressions failed on permissive
admission, then passed after unknown root keys reject before any transaction and
AI schemas describe the complete nested Fill gradient. Writable types derive from
the existing field registry and exclude record identity/type. Design: 27 unit
cases and nine native Fill E2E cases pass. Compose: 90 tests pass. Typecheck and
scoped lint pass. No legacy snapshot overload or automatic payload coercion was
introduced. The next native action and full live recording use this corrected
candidate; previous interrupted evidence is retained, not a successful acceptance.

## Active correction - retain verified source facts

R3 automated live gate passed but visual acceptance failed: the model moved
1,831 crown/facade objects by (-350, -260) after its structural review. Preserve
R3 evidence; do not label it a successful visual acceptance.

Bounded contract: retain evidence-backed source/requirement facts at the existing
review owner and guide composition to reuse them without subjective changes.
No Framework mutation, image caching, geometry locks, provider settings or new
external dependency. No automatic truth claim for an AI-authored statement.
Current canvas checks and final inspection remain required. Extend the existing
spec/Inspector inspect contract and compose guidance; do not change Fill work.

Step card - inspect: input is compact fact assertions with sources, verification,
scope and versioned dependencies, or explicit dependency changes with cause and
evidence. Output is retained current/invalid fact records in review receipts.
Unrelated drawing edits and read-only retrieval preserve facts; source/request/
contradictory evidence changes invalidate exact dependents. Valid records cannot
be overwritten. Unknown/invalid updates fail atomically. Only this invocation
owns facts; fresh invocations have none. Canvas observations are not source facts
and retain existing App generation validation. Forbidden: rendering from facts,
replacing canonical data, automatically certifying source correctness, resurrecting
stale image approval, aesthetic invalidation. Failure owner: inspect. Files:
local-design-review.ts, local-design-facts.ts, local-operation-tools.ts and existing
review/operation tests. No cache; this is retained authored evidence.

Tests: baseline must reject facts-phase admission; verify detached storage,
unchanged reads with zero App calls, selective dependency invalidation, invalid
updates/overwrites and invocation isolation; preserve stale-image rejection.
Then compose guidance and formal prompt assertions, focused tests/type/lint/build,
Inspector validation, and one full headless live Taipei 101 recording. Review its
actual source-bound images separately from automated pass. Stop on unavailable
required evidence or an owner contract conflict. No push.

Inspect checkpoint: three new retention/invalidation/admission regressions failed
before implementation and pass with the existing review owner's facts phase.
Review/operation/execution proof passed 70 cases. Source facts do not expire on
canvas revision, while current inspection approval still does. Invocation lifetime
and model-assertion limits are explicit; this does not claim geometric locking.

Step card - compose: consume retained facts through the existing review tool and
receipts, distinguish source assertions from current canvas evidence, and preserve
verified source results absent requested changes. Source/requirement corrections
must carry concrete dependency changes; visual review checks conformity rather than
reconsidering valid source facts. Owner compose, files ai-domain-prompt.ts and its
existing tests; no capability, model, tool dispatch or history change. The new prompt
contract test first fails. Required gates include review/operation/provider/proof,
types/lint/build, source-bound live acceptance and inspected screenshots.

Compose checkpoint: 191 focused review/operation/provider/prompt/proof tests pass,
three existing subscription opt-ins skipped. New normal-caller case retrieves facts
five times with zero App calls. Typecheck and scoped lint pass.

Step card - observe: retain bounded fact provenance and invalidation summaries in
existing local execution records so this live regression can be diagnosed later.
Inputs are actual review tool arguments/receipts; outputs are sanitized traces.
No raw document, source assets, credentials or canonical state. Existing evidence
length/depth/node guards remain. Files local-ai-usage.ts and local-ai-records.test.ts
are already in observe boundary. Prove retention through actual usage sink first;
run record/evaluation regression and existing schema checks. No new report owner.

Live attempt 1 reached final review with source facts retained but failed at
15m20s: native Codex emitted a sleep display item; compose rejected it as an
unsupported completed item. Preserve evidence in tmp/ai-verified-facts-acceptance-20261003.
This is not a successful full acceptance.

Step card - compose protocol correction: capability-discovery-and-composition and
Inspector compose permit native protocol orchestration. Accept the installed
provider's documented sleep display notification (id, durationMs) as lifecycle
evidence only. It cannot produce an App receipt, execute actions, or finish the
request. Reject malformed items and preserve unknown-tool rejection and diagnostic
assessment restrictions. Files: local-ai-provider.ts and its formal tests. First
prove started/completed sleep fails today; then test malformed notices, notification
without final output, existing transport/security cases and typecheck. Failure
owner compose. Stop for any need to broaden native execution authority. Repeat
headless full acceptance only after these gates pass.

Protocol checkpoint: the new native sleep regression failed before the correction.
205 focused tests pass (three subscription opt-ins skipped), including malformed
notifications and unchanged external-tool rejection. Typecheck, scoped lint and
naming pass. Inspector candidate ef63c235-e944-43bb-b610-52aac46f148a passed.
Next: repeat the same full live brief with model/effort unchanged.

Verified-facts acceptance checkpoint (2026-10-03): retry completed using unchanged
gpt-6-astra medium and the same upper-two-tiers/crown/spire brief. Formal headless
Playwright case passed, sourceVerified=true, zero browser errors; recording includes
ten seconds after completion. Provider duration 997.49 s; initial 77-element body
applied at approximately 232 s. Test artifacts: tmp/ai-verified-facts-acceptance-20261003-r2;
provider record b3041c6b-4b4e-431e-9cb9-c0319348be3f.

The real request saved two source facts (2.5 m double notches; eight 4.2 m storeys
per module) with source/evidence/versioned dependencies. Final visual receipts
retained both; no dependency invalidation or fact overwrite occurred. Inspected
full App screenshot and overview plus native-size ruyi/metalwork detail images.
No repeat of the previous whole-crown lateral move was observed. Some metalwork
remains stylized and other dimensions are explicitly estimates; this proves
request-owned fact retention and end-to-end completion, not surveyed accuracy or
photorealism. Runtime is still long; no speed-improvement claim.

The first failed run and its sleep-protocol diagnosis are retained separately.
No model/effort change, no remote push. Fact authority lasts this invocation;
diagnostic records persist but are not automatically restored as valid facts in
a new request. Framework Fill validation remains recorded in the preceding slice.

## Active stage - fact reuse and actionable call diagnostics

User-approved bounded scope: preserve verified facts at first use and bind them
at the existing inspect owner to affected design targets; reuse the binding for
focused current-evidence checks. Improve union input diagnostics and existing tool
descriptions/examples rather than trial preparation. Record each call's admitted
input summary/shape, queue/execution duration, feedback, output summary and explicit
usability basis; distinguish missing evidence from success. Split observed provider
lifecycle time without inventing thinking time. Preserve model/effort, canonical
API authority, existing history and original-resolution evidence. No dependencies,
Framework edits, cross-request truth restoration, UI redesign or push.

Discovery is confined to provider/tool admission, review/fact owners, existing
record/evaluation projection and their direct tests/spec/Inspector. Required gates:
test-first regressions, normal-caller integration, types/lint/naming/build and
Inspector baseline, then same full headless Taipei upper-two-tier recording with
actual recorded call diagnostics inspected. No speed SLA or scripted geometry.

Step card - observe: observed provider and tool events are inputs; additive v2
call diagnostics and exclusive observed timeline categories are outputs. Queue and
execution come from actual boundaries; provider item spans describe reported
activity, never all hidden reasoning. Output utility is a receipt-based diagnostic,
not a visual correctness claim. Preserve sanitized summaries, explicit omissions,
legacy record readability, incomplete calls, concurrent interval unions and sink
failure isolation. Compute report projections once per report, not on each canvas
update. Existing record/evaluation owners plus local-execution-timing.ts own these
changes; their permanent tests prove overlap, failure, partial and unknown results.
Naming: additive internal diagnostic fields, no changed persisted identities.
First prove loss of rejection feedback and missing per-call diagnostics in tests.

Observe checkpoint: diagnostic regression reproduced omitted rejection feedback.
Additive call projections now distinguish unavailable, partial and unknown output;
legacy timing fields remain. No raw payload/geometry or hidden reasoning retained.

Step card - compose admission: existing operationInputIssue owns union validation.
Use a shared supplied string discriminator constrained by every alternative, not
only type. Preserve overlapping/general branches and allOf semantics. Input is
existing schema and arguments; output is actionable selected-branch diagnostics,
not relaxed admission. Scope operation-input-schema.ts and permanent tests, with
existing review/preparation regressions. Inspector compose allows this admission
owner; this is the identified phase diagnostic failure, not new routing.

## Prompt audit - current model instruction burden (2026-10-03)

User-requested additional discovery is bounded to the App prompt, provider prompt
assembly, registered tool guidance and their direct contract tests. Model remains
gpt-6-astra at medium. No installation, model migration, repository-wide rules
cleanup or removal of product requirements follows from this audit.

Method references:
<a href="https://github.com/anthropics/skills/blob/main/skills/claude-api/shared/prompt-audit.md" target="_blank" rel="noopener noreferrer">Anthropic prompt-audit</a>
identifies stale project assumptions, repeated guidance and unnecessary workflow
choreography; its Claude-specific advice is not an Astra requirement.
<a href="https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra" target="_blank" rel="noopener noreferrer">OpenAI's Astra instruction guidance</a>
supports contextual guidance and revisiting accumulated instructions. Neither
source proves a speed improvement for this App.

Baseline: dirty working tree based on c6506a164bea82a5c7284dd3c4a0b4f3bb17c7a5,
before audit-driven production changes. Static template bodies in
server/ai-domain-prompt.ts contain 36,481 characters / 5,039 whitespace-delimited
words in AI_APP_PROMPT and 16,910 characters / 2,404 words in
AI_OPERATION_INSTRUCTIONS. These are source-text counts before interpolation,
not token counts or complete request sizes. local-ai-provider.ts sends both as
baseInstructions for normal operation-enabled requests, alongside additional
developer instructions and discoverable tool definitions.

Findings and bounded follow-up:

- Confirmed repetition: research existing subjects, preserve requested quality,
  distinguish execution from visual proof, and recover from unsuitable references
  appear in multiple sections. Consolidate each invariant at one guidance owner;
  preserve tool-specific input requirements. Mere repetition does not establish
  its contribution to elapsed time.
- Confirmed broad loading: all requests receive tracing, decomposition, contour
  refinement and component-conversion procedures. Move procedural details to the
  relevant discoverable tool guidance, retaining concise routing and App-wide
  authority/privacy rules. Prove the relevant instructions remain discoverable.
- Ambiguous scope: "Review the representation of every meaningful object" and
  "Inspect all objects" are global, although the same prompt supports targeted
  edits and narrow context reads. Make representation analysis conditional on
  the relevant conversion task, preserving affected-object validation.
- Conflicting work-order risk: "After each coherent drawing stage" requires
  exactly one visual check for every criterion, while structureCriteria and
  deferredDetails explicitly permit unfinished later stages. Stage checks should
  identify pending requirements honestly; final acceptance must still require
  current evidence for every requested criterion. This requires checking the
  review owner, not just deleting prompt sentences.
- Confirmed fixture-specific wording: the unconditional 50,800px building-height
  example encodes one prior test in generic guidance. Replace it with the general
  distinction between dimension correctness and visual fidelity.
- Test limitation: ai-domain-prompt.test.ts contains exact prose assertions.
  They prove instruction presence, not model quality or speed. Update only
  affected assertions with the changed contract and retain normal-caller and
  live visual evidence; do not treat a shorter prompt as successful behavior.

Product constraints remain: requested detail (including intentionally simple or
rough work), source resolution, verified facts, exact registered API/schema use,
canonical permissions/history, preservation of completed work, and truthful
final visual assessment. Some repetition protects real previous failures;
remove duplication without removing its requirement. Capability unavailability
claims need verification against the current registry before classification as
stale. Record per-call evidence in the active diagnostic stage and use the same
live acceptance brief; one live run is evidence, not a causal speed benchmark.

Audit status: production prompt refactor and local validation completed in the
combined-stage checkpoint below. Live results retain the observed input-retry
regression; shorter instructions alone do not establish better tool selection.

User-approved audit integration: complete the four improvements, tool diagnostics
and prompt refactor before one new full acceptance run. Observe additionally
owns local sidecar snapshots of App tool inputs/outputs, with content digest,
byte count and explicit redaction paths. These are not model context or console
output. Credentials, binary images, private reasoning and request prompts remain
excluded. Existing geometry fields in tool payloads may be retained locally for
diagnosis. Failure to write evidence cannot affect drawing. Formal cases cover
exact geometry/value retention, redaction, detached input lifetime, sink failures
and per-call linkage; summaries remain bounded. No new configuration is needed.

Step card - inspect fact application: source assertions can be saved in the
initial plan, then linked to planned requirements and known canonical element
IDs through factBindings. Inputs remain source evidence, current image evidence
and registered receipts; bindings are request-local review metadata, never
canonical geometry or automatic factual certification. Require the corresponding
criterion check to cite bound fact IDs, validate bound target coverage through
the existing canonical inspection API, and preserve source facts through drawing
edits. Source dependency changes invalidate only their facts; unknown canvas
changes still invalidate all image evidence. Scope existing review/fact/tool
owners and direct tests, with spec/Inspector synchronization. No verdict cache or
geometry locks. Tests prove first-use capture, atomic rejection, bound checks and
canonical coverage, source invalidation and new-invocation isolation.

Inspect continuation: phase=visual with final=false admits a nonempty planned
criterion subset and current overview for intermediate decisions. It never
approves completion. Default final=true retains full criteria and required
native detail. Retained diagnostic comparison is not reused visual approval.
Focused regression proves final acceptance cannot use the partial assessment.

Step card - compose prompt: send one concise App contract plus operational
guidance; discover tool-specific tracing/conversion procedures through existing
tool definitions. Inputs are the request, current registered schemas and actual
receipts; outputs remain native tool calls with existing permissions. Preserve
all product constraints; remove duplicate rules, unconditional all-object
analysis, fixture-specific examples and stale total-call/rollback claims. Scope
ai-domain-prompt.ts, local-image-tools.ts, review tool description, provider
assembly and their direct tests. Formal prompt routing tests plus existing image
owner tests cover discoverability; normal-caller review tests cover semantics.
No new tools, schema suppression, capability classifier or model/effort change.

## Combined stage checkpoint - 2026-10-03

Implemented the approved fact capture/bindings, union admission diagnostics,
observed timing partition, per-call input/output snapshots and prompt audit.
Shared source-template instructions are now 13,983 characters versus 53,391
before this stage (74% fewer characters; not a token measurement). Image-specific
procedures remain in discovered tool descriptions. Model remains gpt-6-astra at
medium. Removed stale whole-request rollback and four-call separation claims.

Validation: 501 server tests passed, four explicit opt-in cases skipped; App
and backend types/builds, report build, naming and scoped lint passed (three
console warnings, no errors). Inspector candidate
`b816ab7f-9f85-4c73-a7ad-fe00ec359e11` passed; contract review
`09554acd00e1301c72b0de8cca63a5133514b2363b3edeada9260e8cef4e5c56`
was accepted without blockers. Five canonical inspection E2E cases and one real
subscription drawing passed with source fingerprint verified; two explicit
collaboration opt-ins were skipped by the ordinary inspection suite. An earlier
inspection-only wrapper omitted its fingerprint callback; its tests passed but
that wrapper was unverified, so it is not the final source-bound evidence.

The single live drawing used the unchanged Taipei upper-two-tier brief. Request
`00ac7e23-ce28-4f79-9ecf-ce38d3ba93a2` completed in 846.515 seconds;
first visible bounds were observed at 229.232 seconds. It retained two source
facts in its initial accepted plan and later bound them to three criteria/target
associations. Intermediate visual review rejected visible spire/ornament contacts,
then the model repaired and completed its final assessment. All 108 input/output
sidecars exist and match recorded byte counts and SHA-256 digests; total 2,903,625
bytes. Full geometry is retained locally, with explicit secret/binary redactions.
No browser errors. Owned servers stopped. No push.

Implementation and acceptance execution are complete, but fewer model input
mistakes is not demonstrated: seven review calls were rejected (previous run:
four input rejections). All recovered. Names, phase-specific fields and required
fact citations are the observed remaining friction, not slow rejection execution.
The final illustration is detailed and editable, but retains stylized materials
and awkward railing/junction details; final artistic acceptance belongs to the
user. See the combined-stage section in ai-execution-improvement-results.md for
comparison, exact diagnostics and retained recording paths. No second live run
or unmeasured speed guarantee is claimed.

## Active stage - clear requirements and phase-specific tool contracts

Approved task: apply STE-inspired clarity to existing tool contracts and request
interpretation, then one full live recording with before/after observations.
Baseline is request 00ac7e23-ce28-4f79-9ecf-ce38d3ba93a2 and its retained source,
not a fresh baseline model run. Same brief, gpt-6-astra medium, original-resolution
checks, source preservation and complete final acceptance remain. The one new
sample is descriptive; it cannot establish statistical or causal improvement.
Repository agent-evals exercises development-agent fixture work; this App task
uses its existing server and live-provider harness, not a relabelled agent trial.
No new translator model call, STE dependency, vocabulary restriction, user-language
restriction, framework change, global rule rewrite or push. Preserve prior Fill
work. Scope discovery: review/fact schema, their operation/provider consumers,
App prompt, direct tests and these existing docs. Gates: failing formal schema
regression first, normal caller checks, server tests, type/build/lint/naming,
source-bound Inspector proof, one headless live drawing and artifact review.
Stop for out-of-scope changes; preserve any failed test/run evidence.

Step card - inspect: evidence-and-completion / retained-verified-facts contracts;
Inspector inspect owns phase admission and review metadata. Input: registered
plan/facts/structure/visual fields and existing evidence. Output: the same phase
receipts and truthful acceptance; no geometry or model-produced fallback.
Discovery must expose only fields used by each phase, including final and deferred
checks only for visual, and facts/bindings only for plan/facts. Required citations,
exact criterion matching, current coverage and native-detail final proof remain.
Use named phase schemas, concise conditions before actions, and exact field names
in examples/descriptions. Runtime remains the owner of cross-field/state checks.
Allowlist: local-design-review.ts, local-design-facts.ts, design-review-stages and
direct operation tests already assigned to inspect. No cache, new persisted/tool
identity, auto-corrected arguments or extra canvas read. Formal tests prove
illegal field combinations fail admission and valid native-projected phase
schemas retain complete validation. Existing tests prove facts and final checks.

Next segment is compose, after inspect passes: preserve the original request in
existing provider input and use the existing initial plan to organize requested
scope/style/units without inventing requirements. A short request needs no extra
translation or summary tool. Separate methods/assumptions from user requirements.
Preserve source terms and later corrections. Touch ai-domain-prompt.ts and its
formal tests, with normal-provider envelope verification. No new classification,
user-input rewrite or compulsory model call. Complete final gates before live.

Inspect checkpoint: 13 newly exposed invalid phase combinations failed the original
schema admission tests; after the phase split all 91 review/operation tests pass.
Each native-projected alternative admits its valid inputs and rejects unrelated
fields. Existing fact lifetime, coverage and final-acceptance checks still pass.

Step card - compose (active): original request and registered schemas enter the
existing provider; the existing initial plan organizes constraints and separates
method/assumptions. No request rewrite or extra model call is added. Owner,
allowlist, exclusions and failure owner remain compose above. Formal prompt
contract assertions precede edits; the normal provider test checks verbatim
multilingual intent and one native turn for a direct response. Inspect contract
rechecked: no new evidence acceptance or cache behavior is introduced.

Compose checkpoint: the new guidance assertion failed before the prompt change;
the normal provider already preserved the complete multilingual request and
used one turn. With the concise guidance, 107 prompt/provider tests pass (three
existing opt-ins skipped). No provider implementation change was needed. The
full server-response harness passes 524 tests (four existing opt-ins skipped),
with typecheck, build and naming checks passing. Live acceptance is next after
final scoped lint and Inspector source verification.

Clear-contract stage closure: one full headless request
51e9ba2f-d902-48bb-8cb1-5e919434e870 completed with the unchanged brief and
6-Astra medium. Source verification passed and owned services stopped. Final
current-evidence review accepted; manual comparison found persistent stray lines
and flatter/simpler detail than baseline despite more elements. Four rejected
calls recovered, including three recurring review-input mistakes. The results
record contains timing, cached/uncached usage, exact rejection reasons, verified
96 payload sidecars and recording paths. The observed improvement is 14.4% in
elapsed time, not proof of causation or quality improvement. No repeat run, push,
new dependency, translation call, framework change or imposed user language.
Inspector candidate ac244f52-69b7-47a3-892d-354bb08db0d5 passed and contract review
314a80e39d165873a2ea6cc89eca2fe48e6b99ae223b7f64b7799be915a5a8e2 was accepted.
The bounded STE-inspired stage is complete; model reliability and visual quality
remain measured follow-up work, not hidden closure claims.

## Completed stage - execution-report findings

Approved scope: address the five report findings and timing attribution in the
existing Asyra Design owners. Preserve Fill work and every unrelated dirty file.
Baseline request: 51e9ba2f-d902-48bb-8cb1-5e919434e870. No push, dependencies,
model/effort change, language restriction, image downsampling or framework rewrite.
Discovery is limited to review/inspection, batch target admission and API contracts,
semantic construction/patterns, provider event recording and their direct consumers.
No speculative renderer optimization. One owner segment at a time; focused failing
regressions precede behavior fixes. Complete server/type/build/lint/naming and
Inspector gates, then one headless live case with retained input/output evidence.
Long-run records supplement deterministic equivalence/work-count tests; no speed SLA.

Plan and handoffs:

1. inspect: named criterion IDs map to original requirement text and an observable
   description. Structure selects IDs, fact bindings and results refer to IDs. Keep
   detailed structure checks through format recovery; final review covers every ID.
   Inspection captures images/evidence without implicit hierarchy summaries;
   explicit read_design_context remains the owner of targeted data reads.
2. compose: target resolution follows registered API argument locations, including
   nested request.elementIds, rather than assuming a root field. Preserve collision
   rejection, current canonical admission and plural one-call execution.
3. prepare: reuse existing construction to define vector templates once and reference
   them with explicit placements. Preserve rings, bounds, fills, ordering and keys;
   validate each immutable template once per preparation, never across requests.
4. observe: retain metadata for provider execution spans and gaps between App calls,
   separate observed spans from inference, with no private reasoning/code capture.
5. compose guidance and final verification: visual judgments compare the requested
   shape/contact/finish to observed evidence, not merely feature presence. Requested
   rough/simple styles remain valid. Reuse exact schemas and prepared target handles.

Step card - inspect: evidence-and-completion. Inputs: initial request-based criteria,
source assertions, current canonical image stamps; outputs: named checklist and
truthful phase acceptance. Criterion wire IDs are request-local; no saved-document
migration or compatibility parser. Use a map keyed by model-chosen stable IDs, each
value {requirement,description}; structureCriteria selects IDs and checks/bindings
use criterionId. No automatic text repair or weakened completion. Existing retained
facts and image freshness rules remain. Snapshot owner stops implicit traversal;
no cache is needed. Direct formal tests cover linked detailed checks, unknown IDs,
full completion, stale evidence, zero summary traversal and fresh image capture.
Allowlist: review/facts and direct tests, common-apis/inspection.ts and its tests,
AI inspection descriptor/tests, operation caller/tests; spec and exact Inspector
updated before implementation. Stop for any canonical renderer or external API need.

Inspect checkpoint: two formal regressions failed before edits; 105 focused
review/operation/flow/inspection tests now pass. Image capture performs no computed
summary reads; current stamps and native image behavior remain. No cache introduced.

Step card - compose: registered-schema target resolution / capability composition.
Inputs: registered schema, explicit non-target arguments and existing artifact handle.
Output: admitted canonical actions at a unique nested identifier path. No API-name
allowlist or hierarchy read. Path ambiguity/conflicting IDs/non-object ancestors fail
before dispatch; resolve once per operation and plural calls remain one action. Normal
caller tests prove new nested path plus original root path and rejection. Files:
local-operation-batch.ts, local-operation-tools.ts, direct operation tests; domain
prompt/tests synchronize named criteria and evidence-only inspection. Source clauses:
Prepared target and geometry reuse, Request-linked criteria. No canonical semantics,
transport permissions, new cache or argument repair. Stop for unknown schema forms;
explicit API arguments remain available when target inference is ambiguous.

### Compose checkpoint and prepare step card

Compose now uses a unique path from the registered operation schema, preserving
supplied sibling arguments and rejecting ambiguity/conflicts before identity lookup.
The corrected regression used the registered hierarchy API and failed on missing
`request.elementIds` before the resolver change. Compose/review tests passed (60).

Prepare step: add request-local `vector-pattern` construction for exact repeated
2D rings plus positions. Existing planar pattern and canonical vector APIs retain
their roles. Inputs are one geometry template and ordered placements; output is
ordinary editable vectors with stable keys. No scaling, simplification, inferred
lighting, hidden geometry, shared canonical component or persisted template cache.
Reuse existing ring bounds measurement for one preparation lifetime. Tests compare
explicit vectors, painter order, geometry, validation limits, work counts and fresh
input changes. Owners: design-construction, local-design-tools/schema/examples,
design-patterns/preparation tests and their documented prepare contract.

### Prepare checkpoint and observe step card

Prepare tests passed (54): exact curved geometry and order, one bounds measurement
per template per preparation, fresh measurement after source change, invalid
controls/overrides and expanded budgets. New syntax uses `vector-pattern` with
`template` and ordered `placements`; existing preparation examples advertise it.

Observe step: preserve public native exec/wait item name and lifecycle timestamps,
add exclusive orchestration-event duration, and report the longest gaps between App
calls with the surrounding actual operation names. Gaps include observed research
and public provider events; missing event coverage stays unattributed. No additional
model calls, inference of private reasoning or capture of native code/output bodies.
Owners: local-ai-provider, local-ai-usage, local-ai-records, local-execution-timing,
existing provider/record tests and the observation spec. Tests cover overlapping
calls, queue/execution precedence, missing starts and redacted native metadata.

### Observe checkpoint and validation stage

Focused observation/preparation tests passed (170, with 3 existing opt-in skips).
Native lifecycle metadata retains only kind/name and times, never code/output or
reasoning content. Added concurrent-gap and missing-start regressions before final
validation. All six report findings now have owner changes. Remaining: full scoped
server/App inspection regression gates, type/lint/build, source-bound Inspector
acceptance, then one unchanged-brief headless run with current source frozen.

### Pre-live gates - report findings iteration

- Server suite from App cwd: 533 passed, 4 existing opt-in skips.
- App inspection: 6 passed. Typecheck, scoped ESLint, naming and App/report builds passed.
- Earlier root-cwd test launches exhausted the Node heap because the public API
  signature test resolves its TypeScript project from cwd. Correct App-cwd run
  passed; no product memory or renderer conclusion follows from those launches.
- Freeze implementation for one formal headless upper-two-tier run. Compare to
  request 51e9ba2f-d902-48bb-8cb1-5e919434e870, not a timing pass/fail threshold.
- No push. Review actual final overview and native detail evidence before claims.

### Final diff review - prepare guard correction

The new vector-pattern branch must honor the same unresolved structure gate as
planar patterns, including nested groups. The final changed-owner review found
that the original guard matched only root planar patterns. Add root/nested formal
regressions before correcting local-design-tools; do not change canonical writes
or the successful live artifact. The live run passed its structure checkpoint
at 378.949s before the first vector-pattern call at 473.119s, so this correction
does not explain or invalidate that observed run. Re-run preparation, flow, types
and lint gates; no additional stochastic live attempt.

### Completed report-findings stage

One headless run completed: d360eb00-ac73-4e1c-9a01-778142df5f3f. Source unchanged
during recording, browser errors empty, 84 sidecars verified, owned services
closed. Compare with baseline in ai-execution-improvement-results.md: total time
928.168 s versus 724.549 s; browser first visible 336.713 s versus 217.696 s.
Implicit summary bytes fell to zero and return bytes fell 64%, while input bytes
increased. No speed-success claim. Final overview and four native detail crops
were inspected; visual defects remain documented.

Post-live guard correction: both new regressions were red before implementation;
54 preparation/flow tests then passed. Typecheck, scoped lint and naming passed.
The accepted live structure path was unchanged; the new rejection branch has
formal coverage. All six authorized changes, documents and the single live
comparison are complete. No push, and no additional quality/performance tuning
was silently added to this stage.
