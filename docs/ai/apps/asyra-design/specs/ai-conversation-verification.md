# AI Conversation Verification Contract

## Authority and applicability

This is the mandatory verification contract for AI conversation claims: owner
tests, contract audits, integration tests, native-provider fixtures, browser tests,
evaluation harnesses, manual reviews and whole-feature acceptance. It also applies
to shared Knowledge, Runtime and verification tooling when their evidence is used
to accept this feature. It does not change the App's execution or completion rules.

Product behavior remains owned by [conversation experience](ai-conversation-experience.md),
[execution flow](ai-execution-flow.md), [local provider](local-ai-provider.md),
[design preparation](design-preparation.md), the Runtime
[tool specification](../../../../../packages/ai-agent-runtime/TOOL_SPECIFICATION.md),
and their referenced canonical owners. The current Inspector defines architecture;
the [Flow document contract](../../../tools/flow-inspector/FLOW_DOCUMENT.md) owns
evidence admission and evaluation. A plan, fixture, implementation, old report or
passing test cannot override these authorities. Conflicting current requirements
remain unresolved until the owning specification is clarified, before changing
assertions or product behavior.

Enforcement status: the requirements below are binding for review and acceptance.
The executable verification path, independent case reconciliation and corruption
controls are implemented. Independent semantic review remains mandatory and is
not automated by passing test totals. The [implementation record](../plans/completed/agent-context-and-report-continuity-plan.md#uniform-verification-contract)
and [current closeout evidence](../reports/conversation-closeout-2026-11-18.md)
distinguish completed mechanisms from each source-specific acceptance decision.

## Required proof for every verification method

Each method must declare the following in its existing test, fixture, Flow
criterion or review report. Reuse those records; do not create a second verdict
service or duplicate inventory. Small tests may refer to their owner-level proof
for obligations outside their boundary. Those obligations remain pending until
that proof exists; a reference alone never satisfies them.

| Requirement | Required evidence | Rejection condition |
| --- | --- | --- |
| Authority | Exact current spec section and externally observable requirement. | Expectation is derived only from the code, old assertion, historical report or test name. |
| Scope | Named producer, consumer, route, actual source/build/configuration and claimed boundary. | A mocked or omitted boundary is presented as executed; a focused run is presented as whole-feature acceptance. |
| Oracle | Expected values, state, effects and forbidden effects authored independently of the implementation under test. | Expected output is calculated by the same projection, normalization, validator or classifier being tested. |
| Stimulus | Legal, illegal, boundary and equivalent inputs for the claimed rule; real preconditions and explicit substitutions. | Only happy paths, null-input rejection or examples that never reach the claimed owner are exercised. |
| Observation | Actual producer output, consumer input and consumer behavior; relevant call counts, state and resources. | A schema check, spy called once or successful HTTP status substitutes for downstream behavior. |
| Fault sensitivity | A controlled violation of the claimed invariant makes the relevant assertion fail; a valid control passes. | A broken handoff passes, or failure occurs only because setup cannot load. |
| Evidence integrity | Declared selection reconciled with actual cases and reports, on the same source; omitted evidence remains explicit. | Missing, stale, skipped, canceled, contradictory or fabricated observations are counted as passing. |
| Claim limit | State exactly what is proved, contradicted and unverified. | Test totals, a repaired case or prior acceptance is used to discharge unobserved obligations. |

An oracle may use the real production flow to obtain observations. It cannot use
that flow to manufacture its expected answers. Use explicit small domain examples,
independent mathematical/standard semantics and invariant assertions. Large
fixtures require independently chosen sentinel values and ownership assertions,
not only snapshots regenerated from the current implementation.

For schema delivery, compare the actual delivered schema with its source using
an independent constraint oracle. Observing the producer and comparing only its
input proves lineage, not lossless delivery. Legal reference compaction and
inclusive union/intersection regrouping preserve constraints; sibling constraints,
literal values and exclusive-union multiplicity cannot be discarded. Fault
controls must reach this same audit assertion, with a legal equivalent control.
For selected input scopes, the source is the original registered owner contract,
not the selector's returned schema. Independently specify the operation exclusions
and optional-group selection, preserving every remaining canonical constraint.
Observe selection output only as evidence under test. Exercise corruption before
compaction as well as after it; an independent compaction check does not prove the
preceding scope selection. Equivalent references and inclusive regrouping must
remain valid through the same selected-scope assertion.

Review these requirements for each new or changed method and at whole-feature
acceptance. Missing proof is incomplete, not a waived requirement. An inapplicable
dimension requires a specification-based reason and, for unsupported execution
routes, evidence that the formal boundary rejects it before effects.

## Derive coverage before selecting tests

Maintain three distinct inputs in the existing Flow and runner artifacts:

1. Required behavior: read every normative clause in the current feature specs
   and referenced Knowledge, Runtime and canonical-owner contracts. Map each
   requirement to its Flow criterion, actual owner/consumer and expected assertion.
   Unmapped clauses and contradictory clauses block whole-feature acceptance.
2. Actual exposure: enumerate registrations, published operation scopes,
   provider transports, result branches and lifecycle routes from production.
   Compare them with the requirements. Undocumented exposure is a finding; missing
   required exposure is also a finding. The catalog does not define what is correct.
3. Executed evidence: independently collect files and individual cases, then
   reconcile execution, semantic assertions and final published observations.
   The execution selection cannot define its own required coverage.

Author clause-to-criterion references before selecting tests. Review those
references by reading the source specifications, not by reading only the mapped
list. A deliberately omitted declared obligation must fail reconciliation;
omission from the initial interpretation requires independent source review.
Automated extraction cannot prove complete understanding of natural language.
Record a reason for normative clauses deemed outside the feature, and follow
their referenced owners before excluding them.

Evidence strength is also bounded by method:

| Method | Can establish | Cannot establish alone |
| --- | --- | --- |
| Static/doc audit | Authority conflicts, unreachable/obsolete entry references and declared constraint preservation. | Invocation, consumer effects or actual provider receipt. |
| Owner unit/property tests | Owner semantics, exact limits and generated input invariants with retained seeds. | App wiring or transport behavior. |
| Handoff integration | Real producer/conversion/consumer behavior and resource/state transfer. | Unexecuted native/HTTP/browser routes. |
| Scripted native/HTTP tests | Actual declarations, content, acknowledgements and successor input through that adapter. | Model reasoning or visual quality. |
| Real browser/collaboration tests | Canonical effects, UI/media and cross-client behavior actually asserted. | Hidden execution paths, or visual correctness from a low-zoom screenshot. |
| Verifier fault tests | Detection and publication behavior for reached fault classes with valid controls. | Exhaustive spec interpretation or arbitrary malicious evidence. |
| Manual semantic review | Clause coverage, owner attribution, independent oracle reasoning and evidence limits. | A substituted execution trace or a pass for an unrun required case. |

The following twelve handoffs are mandatory review areas, not a fixed list of
all requirements. New normative clauses or registrations must be reconciled even
when none of these headings change. The implementation plan's twelve-row table
is a navigation aid, not the coverage authority.

| Handoff | Required behavior and observation |
| --- | --- |
| Draft, attachment, history and clarification to request | Preserve exact intent, attachment identity and question/answer association. Exercise asynchronous reads, conversation switching, stale generations, initial parent-local coordinates and disposal through actual submission. |
| Request and capabilities to provider | Observe assembled instructions, schema declarations, examples, context, permissions and images at actual outbound HTTP/native boundaries. Revalidate saved targets; old receipts grant no authority. |
| Purpose search to selected invocation | Check metadata/field applicability, candidate boundaries, revisions, scopes, paging and ambiguity. Execute published usage through its declared route. Finding a candidate is not acquiring its contract. |
| Knowledge to advice and provider | Load actual shared and App sources; preserve provenance, contexts, references, overrides, dependency order and text. Exercise admission, lazy reuse, compaction/rehydration, disposal and input/execution failures. Advice grants no mutation authority. |
| Invocation to admitted execution | Pin selected contracts before effects; validate schema and semantic constraints, permissions, identities and resource lifetimes. Reject unsupported rules explicitly. A correction reaches the same provider session. |
| Dependencies to composed execution | Verify direct, library, sequence, staged and iterative routes where supported. Bind actual prior outputs and saved inputs; resolve live targets after prior writes. Preserve completed prefixes and stop invalid dependents without replay. |
| Preparation to canonical App state | Use actual common APIs and Core state. Verify coordinate conversion, artifact/element identity, target membership, mutation, ordering, transaction, undo/redo and collaboration at their owners. |
| Owner result to external reply | Validate raw values, explicit outcome/settlement, internal bindings, failure wrapping, model projection and final packing. Preserve selected contract visibility on every branch. Falsy values remain data. |
| Saved results to later stages and turns | Retain and delivery stay independent. Verify immutable App values, descriptors, selected fields, direct bindings, replacement, stale targets, isolation and disposal. Unused saves are valid. |
| Reference/capture to provider media | Observe provenance, coordinate basis, target region, pixels, order and all selected images. Saved image reuse must not recapture. Status-only delivery follows explicit selection. |
| Progress, failure, cancellation and reports | Preserve call identity, partial state, cleanup and correctable input continuity. Exercise invalid progress, cancellation races, report entry, unlimited reporting and retained-session follow-up without re-execution. |
| Evidence to UI and acceptance | Verify actual UI/provider data and status together, benchmark evidence ownership and truthful final verdicts. Tool completion does not establish visual quality; report success cannot erase a drawing or evidence failure. |

Every registered tool and published operation scope must have contract/admission
and advertised-route coverage. Grouped cases may exercise a shared boundary only
when all members use that same implementation and invariant; check membership
against actual registration and test owner-specific semantics separately. Naming
similarity or the same schema shape does not prove equivalence. A family exception
must not silently skip a tool. Configuration-disabled routes require their declared
unavailability behavior as well as coverage when enabled, if enabling is supported.

## Prove connections, not matching schemas

For each producer-to-consumer handoff, use the following observation sequence:

1. Acquire the actual published contract and invoke the producer through its
   formal route with independently authored input.
2. Capture the owner value, outcome, settlement, identity/revision, coordinate
   basis, provenance and lifetime that the applicable contract requires.
3. Select or transform those fields using the supported binding/conversion path.
   Different schemas are legal. Do not invent missing coordinates, IDs, state,
   permissions or lifetime, or silently coerce unsupported values.
4. Submit to the actual consumer and observe its accepted input and real effects.
   Remove or corrupt one necessary field to prove rejection before dependent
   effects. Verify that valid alternative representations preserve meaning.
5. Follow the result through retention, projection and provider reply where the
   route supports them. Inspect the next provider input, not only a pre-transport
   object. A saved value must cross an actual App turn boundary for a cross-turn claim.

External network/model behavior may be scripted. The Host, Runtime, App adapters,
common APIs, projection and publication owners under review cannot be replaced by
a fixture that implements a simplified flow. A stubbed provider can prove protocol
delivery but not real-model decision quality. Native and HTTP routes each need
their actual adapter evidence. Browser pixels and collaboration claims require
their real browser/canonical consumers; jsdom cannot prove them.

## Required dimensions and branch interactions

For every applicable boundary, derive cases from its actual rules across:

- Entry: direct, tool-library, request composition, staged/iterative continuation,
  persisted tool invocation, retained read and later-turn reuse.
- Input: legal, illegal, empty/falsy, required/optional, exact limits, Unicode,
  local references, selected scopes, valid equivalent representations and
  semantically invalid targets. Schema keywords follow their declared standard;
  unsupported keywords cannot be silently ignored.
- Result: success, no change, legal partial completion, failed/unknown execution,
  malformed result, missing required output and unsupported resource transfer.
- Delivery: default, explicit status, selected fields, images, retention enabled
  or absent, and failures after execution, storage or cleanup.
- Lifecycle: current/stale revision, permission change, cancellation, dependency
  failure, conversation/document change, compaction, disposal and recovery.

Do not blindly generate every combination. For each shared state or contract
decision, identify interacting dimensions and test their supported combinations
and prohibited counterparts. For example, failed projection must be tested with
selected visibility and acknowledged writes; save failure with successful execution;
partial composition with a failed successor and later recovery; image selection
with retention and later-turn reuse. Testing each axis only in isolation is
insufficient. Declare exclusions from product semantics, not from test cost.

An outcome label alone is never the oracle. Assert the applicable tuple of value,
outcome, settlement, failure stage, completed prefix, resources, storage, delivery
and next allowed action. Preserve closed owner data; do not inject Host metadata
to make it validate. Failed delivery cannot broaden field visibility. Invalid
results cannot enter successful bindings. Recovery cannot replay acknowledged
effects or convert unknown settlement into retry permission.

App continuation and verification acceptance are separate. A correctable input
error must reach the original AI with precise status and permit a corrected call.
The test must observe that correction and owner effects. A test runner may stop
after a failed assertion; it must not inject that stop into the App's task-control
policy. Reporting a successful recovery does not erase an independent violation.

## Verify the verifier through its actual entry

Verifier conformance requires both valid controls and deliberately broken evidence
or wiring. Exercise the production CLI/admission/publication/evaluator chain, not
only exported helper functions. Use isolated project-owned fixtures and evidence
directories; never rewrite real run evidence or the working tree to manufacture
passing results. Remove the injected fault and prove the control passes again.

| Fault family | Required rejection observation and valid counterpart |
| --- | --- |
| Coverage omission | Omit a required owner file, one case inside a selected file, a registered operation scope or an entire spec obligation. Independent reconciliation identifies the omission. Adding an unrelated passing case cannot satisfy it. |
| Evidence identity | Duplicate/rename/misattribute cases, mix configurations or builds, replace a report with stale data, or change source during execution. Reject the affected binding; unchanged valid evidence remains admissible. |
| Contradictory reports | All cases pass but a suite/runtime/setup/teardown reports failure; process succeeds but report fails; report passes but process fails. Refuse success in each direction while accepting a complete consistent report. |
| Incomplete execution | Empty selection, missing case, skip/todo, interrupted collection/execution, timeout, truncated report or missing native/browser environment. Keep incomplete evidence explicit. Filtered siblings are permitted only outside an explicitly bounded selection and never count as passed. |
| Classification | Legal falsy/domain status values and legitimate partial completion remain valid; malformed success, hidden execution failures and missing settlement cannot become success through wrappers or projections. |
| Production bypass | Disconnect a real consumer, swap the pinned contract, bypass projection/admission, drop an image/state field or replace a formal owner with a no-op. The related semantic assertion must fail, not merely a setup/import check. |
| Publication | Fail admission/publication, lose diagnostics, reuse an old acceptance signature or publish only successful records. Inspect the resulting Flow verdict and CLI result; neither may claim completion. A later complete correction may resolve only the relevant failure. |
| Oracle weakness | Deliberately weaken/remove a critical assertion or make expected output use the faulty transform. A retained independent counterexample/review must detect lost sensitivity; passing process status is not sufficient. |

Use boundary substitutions at existing supported test seams, or controlled
mutation experiments in isolated project-owned fixtures with the real entry.
No permanent fault switches belong in product code. For each fault retain the
expected failing assertion/diagnostic and observed final verdict. A mutation that
never reaches its intended boundary is inconclusive, not detected. A surviving
fault blocks the affected proof until independently shown to be semantically
equivalent or irrelevant to the declared obligation.

Keep some spec-authored counterexamples out of helper construction and tuning;
run them unchanged at final conformance review. This is procedural separation,
not a claim of statistical independence or authorization to use another agent.
Review fault-family coverage against this document; a verifier must not generate
its own expected faults from only the functions it happens to implement.

Runner-specific adapters may normalize transport formats. Complete report
admission, source binding and verdict publication must use their authoritative
shared owners. Do not fork a weaker acceptance path for conversation. Reusing a
shared helper is not itself proof: the shared owner's rejection behavior and the
CLI's actual use of it both need evidence. No obsolete command, fallback reader,
compatibility alias or duplicate classifier may remain reachable after replacement.

## Completion and change rules

Whole-feature acceptance requires all three independently supported conclusions:

1. Product proof: every applicable spec obligation has actual owner/consumer
   evidence, including legal behavior, prohibited behavior and correction paths.
2. Coverage proof: spec obligations, actual exposure and executed evidence
   reconcile without unknown applicability, omitted cases or unresolved conflicts.
3. Verifier proof: required fault families are detected through the actual
   verification entry, and legal controls are not falsely rejected.

Existing Flow evaluation remains the verdict owner. These are required evidence
categories, not a new status protocol or parallel completion calculation. Reports
must distinguish executed pass, confirmed failure, conflicting spec, missing proof
and inapplicable behavior using existing evidence and applicability semantics.
No aggregate percentage or passing total can compensate for a required gap.

For a change, identify all affected consumers, branches, lifetimes and verifier
oracles before editing. Prove RED at the first incorrect owner, fix that owner,
then run focused handoff tests and fault controls before advancing. Remove obsolete
contracts and tests that solely preserve them; retain and rebase still-required
behavioral assertions. Never loosen validation or generate new expected snapshots
merely to obtain green results. Final whole-feature verification runs only after
the bounded slices are ready, on identical source/build/definitions.

Preserve immutable historical evidence. A new confirmed defect withdraws the
current broad completion claim until repaired and reverified; it does not rewrite
past observed test results as failures. Document corrections and limits explicitly.
No finite suite proves all possible inputs or future AI decisions. Completion means
the defined current contract is supported without known gaps, not universal certainty.
