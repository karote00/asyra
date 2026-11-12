# Contract verification and current Pixi proofs - 2026-11-11

The initial focused checks passed, but subsequent review found three missing
whole-result guarantees: selected reference context, validator keyword support,
and exact union auditing. Those findings are now repaired and verified in the
[follow-up below](#follow-up---complete-result-validation-and-handoff); the initial
checks alone did not establish closure of those guarantees. Superseded executable
expectations were removed and the affected type and browser checks passed. Formal GPU proofs use installed and browser-loaded Pixi 8.22.0 only.
This is scoped closure, not a claim that every Asyra Design or workspace test was
rerun. No live-model drawing, dependency installation, commit or push occurred.

Plan: [Current contract verification and SDK proofs](../plans/agent-context-and-report-continuity-plan.md#current-contract-verification-and-sdk-proofs).
The [preceding upgrade report](pixi-resource-lifetime-upgrade-2026-11-10.md)
records the original failures; its old-version comparison was attribution evidence,
not an exemption from fixing them.

Latest follow-up: [Failure receipt consistency and empty operation contracts](#follow-up---failure-receipt-consistency-and-empty-operation-contracts).
The review corrected the preceding blanket recovery-safety conclusion. It found
five failing cases across receipt consistency and empty operation declarations.

## Actual implementation defects

| Boundary                                  | Failure and correction                                                                                                                                                                                                                                             | Preserved constraint                                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registered schema to Runtime composition  | A local reference with sibling constraints could become unsupported before discovery or execution. Resolve local pointers against the registered root and intersect siblings using the existing conservative proof rules. Lazy references retain one schema graph. | Closed property sets, required fields, strict bounds, runtime lifetimes and uncertain recursive/union proofs remain enforced. Unsupported intersections are not treated as proven.                        |
| Selected result to retention description  | Selecting a nested result discarded the root needed to resolve its internal references. The follow-up replaces the caller-supplied original root with a self-contained projected reference graph for both classification and validation.                                                                                                           | Document values remain portable; request artifacts and secret values remain nonportable. The same field name cannot override lifetime metadata.                                                           |
| Request sequence to complete owner result | An opaque implication schema could reject a request that only returned the complete registered result. Request sequences now preserve that exact schema for output validation and whole-result forwarding.                                                         | This does not prove field bindings, construct opaque data, admit persisted recipes with unproved dependencies, or weaken input/output validation. Invalid results still fail and writes are not replayed. |

The real host regression covers direct and registry exposure across eleven schema
shapes, plus interrupted application. It executes the delivered invocation route,
checks successful, failed and partial results, rejects invalid fields/values and
confirms that failed delivery does not replay a write. The portability regression
checks both selected scalars and containers under document, request-artifact and
secret lifetimes.

The only additional production change is type inference in `createDesignReviewAction`:
its returned action now satisfies the public action contract without erasing its
known output type. Its runtime implementation is unchanged. This task does not
change rendering policies, tool search ranking, prompt guidance or draw algorithms.
Earlier dirty changes in those areas remain predecessor work.

## Test and contract corrections

The API audit now compares the appropriate boundary: the owner's value, the
Runtime-observed receipt, or the model-visible host result. Observation-owned
`toolOutcome` metadata is not required from the owner itself. JSON Schema
`required` sets are unordered; omitted `additionalProperties` and explicit `true`
have the same meaning. Explicit `false` and actual field constraints remain checked.
The negative oracle rejects removed required fields, wrong types, invalid bounds,
wrong enums and extra fields in a closed object.

Selected usage no longer mixes the ordinary operation parameters with the
`execute_design` envelope. Batch execution is verified through the actual host;
full structural evidence is retrieved through its retained receipt. An obsolete
`response` override is not reintroduced into the unified host input.

Current consumer tests now use:

- `references[]` metadata and `actionResults` media in one reference envelope,
  including cached redisplay without another download;
- explicit mechanical review when requested, with retained current checks,
  invalidation, cancellation and recovery still tested;
- captures and final settlement without automatic quality certification or
  removed representative-review declarations;
- current revisions, capture identity, purpose-search results and evaluation
  budget contracts;
- current preparation inputs without retired approval-plan fields. Immutable
  recorded evidence remains unchanged; only executable replay inputs are projected.

Browser checks retain the substantive behavior behind their old assertions:
activity state at both viewport widths; current versus stale mechanical results;
local and overall image delivery; real provider prefix recovery; no duplicate
mutation; undo/redo, durable reload and continued edits. They no longer demand a
quality pass that no current owner produces.

The scoped type configuration no longer names removed test files and now includes
the affected maintained contract families. Missing members fail a permanent guard.
The original fixture errors and errors exposed by that expanded membership are
fixed using accurate receipt types, narrowed values, valid creation inputs and
real serialized transport boundaries. Shared validation contracts were not relaxed.
The recorded-input fixture adapter also no longer uses `any`.

## Current-version Pixi verification

`readPixiProofIdentity` is test infrastructure shared by the App handoff and native
GPU proofs. It verifies the current package descriptor against the lockfile,
installed SDK and browser-exported `VERSION`, and records manifest/lockfile hashes.
The native hierarchy proof requires the same identity in the App handoff, as well
as unchanged canonical source hashes. Missing or different browser versions reject.
No old SDK is installed or executed, and no version compatibility path is added.

Independent-program and hierarchy-policy controls use the same current SDK. They
are measurement controls, not alternative supported SDK versions or production
fallbacks. All existing exact pixel, work-count and lifecycle assertions remain.

Results:

- Shared-program proof: eight measurement blocks, covering four large roots and
  1,000 small roots. Controls and candidate preserve image hashes; shared source
  still uses separate Shader bindings and survives another owner's release.
- Context restoration produces a new native program while preserving pixels;
  later material edits still update the rendered result.
- Pooled owners are reused without destroying their resources. Final shutdown
  releases geometry and shader resources once and removes retired ownership.
- Mixed Graphics, Sprite, Text and filter content retains correct changed,
  restored and extracted images, with no WebGL error.
- Retained-hierarchy proof: twelve measurement blocks and 24 samples per phase,
  retaining immediate query and direct/ordinary extraction assertions. Capture
  does not change the live scene; changed children change their captured pixels.
- App hierarchy proof: three cases cover identity, geometry, style, visibility,
  sibling order, immediate transaction barriers, undo/redo, remote replay and
  model restore after GPU owner disposal.

All recorded proof source hashes still match the closing source. This task makes
no new performance-improvement claim; it verifies current-version correctness and
retains the existing same-version performance measurements.

## Focused validation

| Scope                                                                                 | Final result                                       | Evidence                                                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Runtime schema admission, recipe flow and tool contracts                              | 140 passed                                         | `contract-cleanup-runtime-current.log`                                                   |
| API usage audit and negative oracle                                                   | 388 passed                                         | `contract-cleanup-audit-final.log`                                                       |
| Affected App AI, batch, composition, query, lease and mechanical consumers - 12 files | 282 passed                                         | `contract-cleanup-focused-jsdom-final.log`                                               |
| Discovery, reference, knowledge, geometry and result-delivery consumers - 9 files     | 176 passed; 2 opt-in live native-CLI cases not run | `contract-cleanup-focused-node-final.log`                                                |
| Actual provider and execution-flow cases                                              | 5 passed                                           | `contract-cleanup-provider-focused.log`                                                  |
| Previously failing browser cases                                                      | 5 passed across initial run and focused recheck    | `contract-cleanup-browser.log`, `contract-cleanup-browser-recheck.log`                   |
| App hierarchy/restore browser cases                                                   | 3 passed                                           | `contract-cleanup-handoff.log`                                                           |
| Current native GPU proofs                                                             | 2 passed                                           | `contract-cleanup-current-gpu.log`                                                       |
| SDK identity and type-proof membership guards                                         | 2 passed                                           | `contract-cleanup-sdk-identity-final.log`, `contract-cleanup-proof-membership-final.log` |
| App, AI server and scoped contract TypeScript configurations                          | All passed                                         | `contract-cleanup-*-types-final.log`                                                     |
| Naming gate                                                                           | 15 passed                                          | `contract-cleanup-naming-final.log`                                                      |
| Scoped ESLint                                                                         | 0 errors; 5 existing diagnostic-console warnings   | `contract-cleanup-lint-final.log`                                                        |
| Scoped formatting and diff checks                                                     | Passed                                             | Closing checks                                                                           |

Logs are under `tmp/conversation-improvements/`. The audit log includes a separate
batch-example failure after the audit passed; that exact batch case was corrected
and subsequently passes in the final 282-case run. The initial browser log likewise
contains intermediate failures; the two capture/provider cases passed there and
the other three passed the focused recheck. Earlier red logs are retained, not
relabelled or deleted. Tests excluded by explicit title selection are not counted
as passed. The two skipped cases require `NATIVE_DELIVERY_CODEX` and a real native CLI
session for selected-usage delivery. They were not enabled in this scoped task,
which excludes new live-model runs. The five deterministic provider cases do run
the actual App/Runtime protocol handoffs. Skipped live cases provide no additional
verification claim.

## Visual inspection and reproducibility

- Base URL: `http://127.0.0.1:3063`, explicitly supplied to the existing App runner.
  Temporary collaboration/document services used ports 4163/4263; the previous
  3053/4153/4253 services and persistent `.env` were preserved.
- Scope: `hierarchy-projection-updates.spec.ts`, Chromium, DPR 1, 1280 x 720;
  fixture camera zoom 2 with fixed pan and cleared selection.
- Command: `APP_URL=... COLLABORATION_WS_PORT=4163 VITE_COLLABORATION_WS_URL=...
E2E_DOCUMENT_BACKEND_URL=... playwright test --config
playwright.grouping-local.config.ts e2e/hierarchy-projection-updates.spec.ts
--workers=1 --reporter=line --output=test-results/contract-cleanup-handoff`.
- Runtime state: canonical child IDs, live engine handles, transaction batches,
  world coordinates, source hashes and SDK identity are checked by the formal
  test. `applied-handoff.json` is consumed by the native GPU replay.
- Screenshots: App `test-results/contract-cleanup-handoff/`; native PNGs and JSON
  under `tmp/conversation-improvements/pixi-lifetime-8.22.0/` and
  `tmp/conversation-improvements/retained-hierarchy-8.22.0/`.
- Agent screenshot review: inspected the App initial, edited and regrouped
  states and the native mixed-content edited capture. Geometry/color changes,
  preserved siblings and restored composition match the tested fixtures. Other
  states are covered by the exact automated pixel/hash assertions, not claimed
  as individually inspected screenshots.

No unresolved failure remains in the selected scope. This does not establish live
model behavior or a fresh full-app regression result. Those broader runs were
excluded by this task's focused-test instruction.

## Follow-up - complete result validation and handoff

The November 11 review's three failing counterexamples now pass on the same source.
The selected task is [Complete result validation and handoff](../plans/agent-context-and-report-continuity-plan.md#complete-result-validation-and-handoff).

| Finding | Canonical correction | Preserved negative evidence |
| --- | --- | --- |
| A valid selected container failed after its owner completed | Runtime retains the original reference context and materializes only reachable definitions into the selected validation root. Discovery, retention and envelope validation consume that root. | Invalid counts/extra fields still reject; request/secret values remain nonportable; missing references reject; recursive graphs stay finite; literals are not schemas. |
| A published dependent-field requirement was ignored | The App validator enforces `dependentRequired`. Registration checks the supported schema vocabulary before exposing native tools or browser actions; input/output checks reject unsupported or malformed constraints even in optional/unselected branches. | Unsupported constraints reject before publication; invalid results stop successors; unknown vocabulary is never treated as an unconstrained successful result. |
| The audit accepted an extra unconstrained alternative | Exact normalized alternatives replace subset/asymmetric matching. Expected values come from registration or the canonical model action plus its registered observation owner, then the declared invocation envelope. | Extra branches, omitted constraints and changed literal arrays reject. Reference siblings remain intersections; duplicate `oneOf` alternatives retain their meaning. |

The restored canonical negative tests also exposed a real upstream omission:
registered invocation usage omitted common leaf failures inside `execution.value`.
That path now shares the invocation failure owner. An intermediate broad alternative
was rejected by the existing invalid-prefix tests; the final public boundary
alternative restricted the nested failure settlement, but did not correlate the
complete invocation. The subsequent review below disproved the blanket safety
claim: contradictory completed envelopes still passed. The replacement validates
outer and inner settlement together and uses the owner's contract at both discovery
and actual invocation.

Invalid owner data and invalid delivery of a valid owner receipt are separate cases.
The former reports `TOOL_RESULT_INVALID` without invented completion; the latter
preserves completed settlement with `TOOL_DELIVERY_INVALID`. Restored direct and
registry tests exercise missing required fields, negative counts, interruption,
refresh and input rejection, while checking invocation counts to prevent replay.
The old early return was removed, not replaced with a skipped test. The former lease
test expecting standalone projection to fail now proves valid standalone validation
and retains document/request/secret portability negatives.

### Final focused evidence

| Gate | Result | Log under `tmp/conversation-improvements/` |
| --- | --- | --- |
| Original counterexamples before repair | 3 failed; 4 controls passed | `forwarding-fix-baseline.log` |
| Runtime admission, recipe flow and tool contracts | 142 passed | `forwarding-fix-final-runtime.log` |
| App schema, host, invocation, library and leases | 194 passed | `forwarding-fix-final-host.log` |
| Batch and final recovery consumers | 36 passed, including all 24 batch cases | `forwarding-fix-final-recovery.log` |
| Exact selected usage/action contracts and audit negatives | 390 passed | `forwarding-fix-final-audit.log` |
| Provider egress, reuse, image and correction paths | 5 passed | `forwarding-fix-final-provider.log` |
| Inspector architecture, generated catalog and formal test membership | 42 passed | `forwarding-fix-inspectors-final.log` |
| Naming | 15 passed | `forwarding-fix-final-naming.log` |
| Runtime build and App flow-proof types | Passed | `forwarding-fix-final-build.log`, `forwarding-fix-types-final.log` |

The test groups overlap; their counts are not a unique aggregate. Provider checks
use the formal provider driver and actual host/egress path, not a new live-model
conversation. ESLint reports no errors and one existing console warning in the
batch measurement test. New review tests are part of the maintained server command
and flow-proof type configuration. No dependency, renderer or prompt change, full
local test, live 101/GPU run, commit or push was performed for this follow-up.


## Follow-up - failure receipt consistency and empty operation contracts

Plan: [Failure receipt consistency and empty operation contracts](../plans/agent-context-and-report-continuity-plan.md#failure-receipt-consistency-and-empty-operation-contracts).
This bounded task preserves the earlier rendering changes and immutable live evidence.

### Five original failures

| Review case | Root cause | Current correction |
| --- | --- | --- |
| Delivered usage accepted successful/completed execution containing only an unknown failure | Recovery alternatives constrained the nested value without constraining the whole invocation | Recovery excludes successful execution and correlates outer/inner settlement |
| Registered handoff accepted failed/completed execution with unknown invalid result | Registry diagnostics were reused as the selected owner's recovery contract | Discovery and invocation share the native owner's projected result schemas |
| Registered handoff accepted unknown/completed execution with unknown invalid result | The same mismatched outcome and generic diagnostic route | The same correction; invalid receipt rejection never replays the owner |
| Canonical inspection-only tool set prevented an unrelated native read | Batch generator emitted an empty name enumeration rejected during registration | An empty capability uses a false name schema; other native tools register normally |
| Provider could not return invalid input for same-turn correction | Host startup failed on that empty operation declaration | The existing provider correction test proceeds without changing its fixture or weakening validation |

The handoff cases inject invalid receipts after one real owner execution; they
prove rejection boundaries, not an observed live-model corruption incident.
The published-usage case consumes the actual selected discovery response.

### Additional review and preserved behavior

- Four additional completed-inner variants remain rejected, including when both
  receipt layers claim completion. Completed owner data cannot bypass validation
  through a common diagnostic alternative.
- Successful work with unsaved storage remains valid. Saving can be retried without
  executing the product operation again; the existing storage-failure test retains
  its exact one-execution assertion.
- The inspection-only case exposed another handoff defect after startup was fixed:
  copying a reply invalidates its identity-bound validation receipt. Revalidation
  previously used the raw owner schema against a host-acknowledged result. It now
  uses the same host schema projection. Three permanent direct-reply cases verify
  valid data succeeds while negative counts and extra owner fields still fail.
- Empty batches and arbitrary operation names reject at the real operation owner's
  admission boundary without browser dispatch. There are no fabricated operations,
  compatibility paths, permissive enum rules or weakened schema checks.
- Recovery correlation uses small constraints over one result schema, not duplicated
  large result schemas or new retained state. No extra owner execution or model call
  is introduced. No latency improvement is claimed from test timings.

### Focused validation

All five original failures pass on the final source. Additional controls did not
require loosening any input/output constraint.

| Final gate | Result |
| --- | --- |
| Whole-result handoff, failure combinations and canonical inspection-only tools | 20 passed |
| Batch usage and invalid completed prefixes | 24 passed |
| Schema, input normalization, host, invocation and tool-library controls | 170 passed |
| Tool library, operation composition and selected prefix recovery | 81 passed |
| Actual provider protocol, usage and same-turn input correction | 5 passed |
| Declaration admission, exact affected usage and audit counterexamples | 392 passed |
| Inspector contract and maintained test/type membership | 2 + 3 passed |
| Naming | 15 passed |
| App flow-proof types | Passed |
| Scoped ESLint | No errors; one existing batch console warning |

Logs use `tmp/conversation-improvements/receipt-consistency-*.log`.
The initial broad native usage audit passed 594 cases in 132.73 seconds; after
refining schema construction, the affected exact invocation/read/execute routes and
all declaration-admission cases are the final bounded audit. Existing schema,
host, invocation, storage, batch and provider controls remain required.

The early combined test command incorrectly forced the Node provider suite into
jsdom; its mock-loading failure was a runner mismatch. The provider was rerun in
its intended environment, first reproducing the real empty-enum failure, then
passing after the fix. A filtered storage run also encountered the suite's complete
advertised-tool coverage assertion; the complete focused tool-library test file was
subsequently run. Neither guard was removed or weakened.

No full-local, live-model drawing, rendering benchmark, commit or push was run.
