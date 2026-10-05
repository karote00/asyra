# AI execution recording

Status: active - integrated implementation gates passed; full live acceptance failed on 2026-10-04. Earlier completed slices remain historical evidence.
Parent: [improvement plan](ai-execution-improvement-plan.md).

## Outcome

Every provider invocation retains a locally readable, versioned execution record
that survives normal request completion and makes successful, failed, cancelled,
partial and interrupted work distinguishable. A step can be located by request,
call and sequence; records never become a canonical scene or completion authority.

## Owner and design

Extend existing `local-ai-usage.ts` at Inspector `observe`, composed at the
existing provider boundary. Keep its current console summaries for consumers.
A dedicated App-server file sink stores one append-only JSONL per request under
the project's ignored runtime directory. It consumes already sanitized events,
does not copy geometry/images/prompts, queues ordered writes, reports sink errors
without changing drawing settlement, and exposes a drain hook for orderly tests
and shutdown. Missing terminal records are incomplete, never successful runs.

Record actual lifecycle events: provider RPC, tool admission/execution/end,
research, capabilities and settlement. Include model/effort and configured source
identity when available, wall-clock timestamps and monotonic elapsed durations;
absent identities remain unavailable. Tool metadata retains exact requested API
names/field selectors and input/output artifact references, bounded summaries,
explicit truncation and byte counts. Do not infer causal dependencies, source
quality, hidden reasoning or model-visible tokens from transport alone.

A pure reader reconstructs step spans, union accounting and unresolved calls
from records; retain malformed/incomplete evidence as diagnostics. Do not compare
separate requests as retries without a recorded relationship. Diagnostics must
not block user work with a second AI call or serialize the whole scene per step.

## Execution slices and gates

1. `observe`: formal tests for missing query selectors, ordered durable events,
   complete/failed/cancelled settlement, incomplete streams, redaction, bounded
   payloads, overlapping spans and unknown time. Prove gaps before production.
2. `observe`: implement record/sink/reader, integrate provider with unchanged
   console contract; permanent injected sink/clock tests plus normal caller
   integration. Test write failure and concurrent request isolation.
3. Sync execution spec/Inspector/proof and portable provider docs. Naming,
   focused usage/provider/proof tests, App typecheck/build and scoped lint pass.

Naming: neutral `ExecutionRecord`, `ExecutionRecordSink` and schema-versioned
diagnostic events owned by the App server, separate from document wire schemas.
No migration of old logs; the reader labels their absent fields explicitly.
No automatic deletion of historical logs or `.env` files. Source revisions and
configuration metadata must not collect secrets or run Git on every tool event.

## Active step card - observe

Spec: `ai-execution-flow.md#ownership-and-diagnostics` and execution recording
section. Inputs: actual provider lifecycle, queue/execution spans, sanitized
receipt summaries. Outputs: trace plus durable diagnostic record. Missing
provider fields bypass attribution; sink failure belongs to observe and cannot
fail drawing. Allowed: existing usage instrumentation and bounded receipt
timings. Forbidden: raw prompts/credentials/geometry/private reasoning and
diagnostics deciding output. Boundary: existing usage/provider files, new
execution record/sink helpers, and direct formal tests declared in Inspector.
No cache. Gates: tests above and existing accounting proof. Stop for any required
canonical mutation, unavailable semantic input, or unproven payload privacy.

## Evidence

- Baseline naming: 12 checks passed. Exact-selector regression failed before
  adding selector fields; persisted brief redaction, missing sequence and native
  item lifecycle regressions each failed before their corrections.
- Source-bound flow candidate `c15a4397-b982-4ffd-9b26-47c09f83133c` preserved
  seven existing owner cases; observe-boundary contract review
  `3bc7ce6363fda00ec081ba7dc41c74068fa5a179958adf2243d47e9bbe3d063c`
  had no blockers and was accepted for this slice. This initial proof does not
  substitute for the new recording tests or final source re-verification.
- Four focused suites passed 104 tests, with three pre-existing opt-in tests
  skipped. New file I/O tests use project-local temporary directories and
  validate actual successful writes, isolation and filesystem failures.
- Existing console logs remain available; version-2 local records are additive.
  App model/effort, canonical mutations, Undo and drawing quality gates unchanged.

- Final source-bound candidate `da2f2e3c-aad1-4ed8-9cb5-fd4ee67a1947`
  passed all seven owner cases. App typecheck/build, naming (12 checks),
  Inspector contracts (27 tests), scoped lint (no errors; three diagnostic
  console warnings) and diff whitespace checks passed. No push occurred.

## Final acceptance

See [parent results](ai-execution-improvement-results.md). The successful live
request, period report, independent post-run process opinion, zero-call reuse of
current visual-review opinion, native detail screenshots and full recording are
retained locally. Speed and visual limitations remain explicit; model opinion is
not user approval. No push.

## Integrated follow-up - 2026-10-04

Status: active. The previous acceptance above remains historical evidence.

Bounded objective: close the observed lifecycle gaps and nested-review attribution,
reject oversized construction before compilation with complete budget feedback,
and verify the requested viewpoint with the existing request-linked visual owner.
Use the existing recording harness (first established overall bounds and terminal
settlement only) for one complete headless live run after formal gates. Compare
with request `16440f14-7757-467a-ab9c-c8d9dfd75aa4`; this is observational evidence,
not a deterministic speed benchmark. The test brief explicitly requests an elevated
three-quarter view looking down with visible top surfaces.

Owners: observe instrumentation/report projection; prepare admission and its shared
construction limits; review current-request criteria and its direct tests. Scope
includes their direct callers, tests, spec and exact Inspector contracts. Preserve
canonical writes, Undo, model/effort, native resolution, rendering and normal App
viewport behavior. No dependencies, push, new search sources, universal detail
requirement, invented reasoning or geometry correction. Stop for a required change
outside these owners. Review only these changes and direct consumers.

### Step card - observe

Spec: ownership-and-diagnostics / execution-recording. Inspector: observe.
Inputs: observed invocation, provider handoff/return, tool and App action boundaries,
provider notification metadata and explicit child review relationship. Outputs:
continuous request ownership spans, per-call inclusive duration and exclusive
partition, parent request/call/span identity, recording defects. The App owns the
invocation envelope; provider waits begin at actual delegation and end on return.
Child AI waits override their enclosing tool duration in exclusive accounting.
Private provider computation remains unavailable; never infer reasoning from wait.
Historical missing spans remain missing. Logging does not decide drawing results.
No cache. Allowed files are the existing usage, provider, records, timing and report
owners and direct tests in the observe allowlist. Failure owner: observe.
Gates: injected-clock overlap/parent/child/missing-boundary tests; actual provider
harness success/failure/cancellation; report readers; typecheck, naming and lint.
Then review this exact owner contract before advancing to prepare and review.

Observe slice: 152 formal tests passed (three existing opt-ins skipped), including
continuous 100 ms accounting, nested review own time, missing lifecycle boundary,
real provider harness completion/cancellation and legacy report readers. Review:
no canonical output/settlement authority change; old logs remain honestly incomplete.

### Step card - prepare and its admission handoff

Spec: preparation-and-execution / native image regions and preparation limits.
Inspector prepare, followed by compose admission handoff. Add one pure bounded
budget inspection before geometry compilation, shared by direct preparation and
native invocation. Count source/expanded nodes, depth and path commands together,
including templates and selected pattern ranges. Return all observed exceeded
budgets in one correction response; preserve the caller's draft and canonical
identities. No model call, automatic partition, geometry simplification or guard
relaxation. Malformed inputs still pass through the existing schema authority.
Compose may enrich a schema rejection through the owner-declared pure budget
inspection without calling the execution handler; it cannot bypass either check or dispatch on rejection. The workflow
composes the same inspection. Failure owners stay prepare/compose respectively.
Allowed: design preparation/construction helper, local design tool/workflow and
invocation handoff with direct tests. Gates: oversize flat and regrouped drafts
report the same total in one rejection; compiler called zero times; exact bounded
valid draft keeps every entry/identity/order; pattern counts do not expand geometry.
Stop for required canonical/API changes outside this admission boundary.

Prepare focused gate: 88 tests passed. The same 1,172-item draft now reports the
1,173 source total before compiler invocation; grouping reports 1,174 without
compilation. Existing valid preparation, pattern geometry and identity tests pass.
Compose handoff regression was then proven red through real native invocation;
its generic schema rejection previously masked the complete budget response.
Valid native calls perform the budget scan once in the preparation owner; only
schema-rejected calls use the read-only rejection explanation, without dispatch.

Compose gate: 49 tests passed, including native admission and the combined workflow.
Review confirmed no invalid input reaches dispatch and no valid input is scanned
by both invocation admission and preparation. Existing schema checks remain intact.

### Step card - inspect

Spec: independent visual comparison. Inspector inspect. Existing input already
contains the unmodified original request, request-linked criterion requirements,
current image roles and prior findings. Clarify only the reference-view sentence:
a viewpoint differing from a reference is allowed when it still matches the user's
requested viewpoint. An explicit requested direction is checked from visible
surfaces; an omitted direction remains the model's decision. No App camera preset,
preferred angle or geometry mutation. Existing provider harness verifies exact
request handoff and whole-result judgment; full live test supplies the actual
viewpoint evidence. Allowed: visual assessment instructions and direct provider
test. Gate: assessment/operation/review suites, then integrated acceptance. Failure
owner: inspect. Stop if evidence cannot establish the requested view.

### Acceptance environment interruption

The first live attempt `ff4720cd-5464-4ca8-958d-a4c5b5e5558b` was cancelled at
679.920 s. The driver then timed out looking for the unmounted Agent panel. The
agent edited App development Markdown at 14:04:11 during the recording; provider
cancellation followed at 14:04:12. The installed Tailwind Vite plugin sends a full
reload for tracked non-module source changes. This attempt cannot establish final
visual acceptance or durable completion. Preserve it as interrupted evidence.

Bounded correction at the recording driver: retain main-frame navigation and Vite
reload events, fail with that cause rather than a missing-message timeout. Add a
formal browser reload regression before implementation. Freeze all watched project
files (including documents) during the replacement live acceptance; update this
plan only after servers stop. No drawing behavior change or automatic retry inside
the live test. One replacement uninterrupted full test remains required.

### Integrated validation outcome - 2026-10-04

The bounded observe/prepare/compose/inspect changes passed 617 server tests
(five existing skips), 373 App AI tests, typecheck, App/report builds, naming and
scoped lint (zero errors, three existing console warnings). The recording driver
passed five browser regressions, including page reload interruption. The latest
source-bound proof `ad2d185a-bb74-46fe-a241-a6eff3e4e739` passed one flow, three
negative cases and seven obligations.

The replacement headless live request `e1ffcf38-8b7a-4050-a1e0-d1463ba4f777` was
stopped by the existing 30-minute test guard before visual acceptance. It is a
failed acceptance, not a completed drawing. All 3,690 frozen source/document/config
hashes and the environment hash stayed unchanged during this run; there were no
browser errors or reloads. The first attempt's editing interruption did not recur.

The continuous invocation interval is fully attributed (zero uncovered time), but
an interrupted native dynamic-call item remains open, so the reader correctly marks
the record incomplete. No final durable-completion or successful settlement claim
is available. There was one fit at confirmed overall bounds; no terminal fit was
invented after the test guard interrupted the waiting driver. The two-fit success
path is covered by formal recording tests, not proven by this interrupted live run.

See the integrated lifecycle section in `ai-execution-improvement-results.md` for
comparison, ownership, rejected inputs and visual findings. Keep this acceptance
open. No extra live run, new scope, commit or push. Owned test servers were stopped;
local `.env` was retained and only the opt-in E2E flag was restored to false after
source verification.
