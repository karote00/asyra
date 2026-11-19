# AI conversation full-flow review - 2026-11-13

## Formal verification handoff correction

The two verification re-reviews are implemented at the production handoff and
execution-evidence boundaries. The final maintained AI conversation gate passes:
265 files, 5,734 tests, zero failed or unexecuted. This is the current execution
checkpoint; earlier totals below are historical. No product tool implementation,
production validator, permission or lifecycle contract was weakened. No live model,
101, full repository gate or push ran.

The old assertion decorator implemented another invocation path: static output
validation could accept a result rejected by the invocation-selected contract, and
its model projection bypassed final validation. It is deleted. The replacement
fixture constructs the actual LocalToolHost with its resource ownership and calls
Host.invoke. Owner unit tests keep their domain assertions and are explicitly
owner-level evidence, not provider or Host execution proof. Existing formal Host,
provider, retained-data and cross-request tests remain in the feature gate.

Three permanent counterexamples now cover selected-result rejection, invalid model
projection after completed execution, and an unavailable continuation tool. The
first two failed with the original decorator; the third failed with the original
reader. Passing controls cover a valid selected result with exactly one owner call
and real Knowledge result reuse. Projection rejection preserves completed work;
no helper replays or repairs it. The shared information reader now dispatches the
returned tool and arguments. Fixed leaf consumers reject a foreign tool instead
of silently redirecting it; byte continuity, revision and completion checks remain.
No previous helper signature or file-local reader remains.

Runner corrections include adjacent startup/panel families regardless of filenames,
exact stage identity rather than result counts, rejection of contradictory failed
Vitest files, and one native Node subprocess receipt per selected file. Each receipt
retains the selected file, command, PID, exit status and log. The declared App build
graph selects 19 workspace dependency tasks. Their package-owned clean/build tasks
run without build cache before consumers. Fingerprints cover maintained App and
dependency sources, relevant build configuration and the actual compiled exports;
missing, changed or incomplete evidence cannot pass.

Current specification contradictions are removed: closed owner schemas are not
extended with acknowledgement fields, and rejected input uses an empty-input call
scope for diagnostic resources without borrowing rejected handles. The Host still
validates the owner result and model view separately and delivers the acknowledgement
at its own boundary. This documents current production behavior, not compatibility.

### Iteration and self-review

The first full run, `tmp/conversation-verification/run-zHsko8/summary.json`, retained
13 failures with unchanged source and compiled fingerprints. Eleven exposed an
additional file-local continuation reader in execution-flow-proof that still ignored
tool identity. It is removed in favor of the shared reader. Two newly collected
startup tests mocked the retired Reactive Events/SceneTree paths; they now use the
current Core event exports and read DTOs, preserving their scalar/batch/patch
work-count assertions. The separately discovered foundation test now explicitly
rejects duplicate App initialization of Core-owned features and verifies App
registration/disposal. No assertion was changed to accept incorrect product output.

The execution-proof migration initially left old owner alias references; that failed
focused attempt is retained and the references were corrected before the next gate.
The final focused rerun passes 94 execution-proof/Host cases and both derived-state
startup cases. Other focused groups cover 219 continuation/operation/Knowledge cases,
102 formal Host/model-delivery cases, 31 runner/manifest cases and the Inspector
contract. These groups overlap and are not added together as unique coverage.

Final evidence: `tmp/conversation-verification/run-uft8F8/summary.json`, command exit
0. Every selected file is accounted for; source and compiled fingerprints match
before/after their respective verification windows. Installed native-provider
protocol tests use the offline provider and the recorded large-document gate is
enabled. These closing document updates occurred after the run and do not change
its tested code or tests.

| Group | Files | Passed | Failed | Unexecuted |
| --- | ---: | ---: | ---: | ---: |
| Server/provider | 98 | 3,706 | 0 | 0 |
| Browser/common APIs/startup | 101 | 1,252 | 0 | 0 |
| Filesystem/Knowledge handoffs | 5 | 65 | 0 | 0 |
| Agent Runtime | 34 | 523 | 0 | 0 |
| Node harnesses | 24 | 152 | 0 | 0 |
| Inspector contracts | 3 | 36 | 0 | 0 |
| Total | 265 | 5,734 | 0 | 0 |

App and configured AI-server TypeScript checks pass. Scoped ESLint reports zero
errors and three existing console warnings; naming passes all 15 checks. Relevant
logs are `tmp/verification-handoffs-red.log`, `tmp/verification-pagination-red.log`,
`tmp/verification-runner-red2.log`, `tmp/verification-iteration-host3.log`,
`tmp/verification-iteration-startup.log`, `tmp/verification-iteration-types.log`,
`tmp/verification-server-types.log`, `tmp/verification-scoped-lint-final.log`,
`tmp/verification-iteration-lint-final.log` and `tmp/verification-iteration-naming.log`.

This completes the bounded verification-tool correction. It does not convert test
membership, null-input rejection or passing owner unit tests into proof of every
legal tool invocation. The parent semantic review retains that distinction; no
universal contract-completeness claim is derived from this passing test total.


## Typed-handoff correction

The follow-up task covers all 255 App TypeScript diagnostics in 36 test files,
including the non-AI files explicitly requested by the owner. Current App and
AI-server type checks pass with zero diagnostics. The maintained feature gate
passes on the final frozen source: 230 files, 5,373 tests, no failed or unexecuted
cases. The earlier shared-handoff results below remain historical evidence.
No live inference, 101, full repository gate, release or push is included.

| Baseline owner family | Diagnostics | Cause and correction |
| --- | ---: | --- |
| Agent actions, Knowledge and result handoffs | 112 | Executable definitions were passed where detached descriptions are required; obsolete permission/progress and boolean receipt fixtures; narrow mocks and unchecked opaque results. Use canonical contracts/receipts and check actual result shapes. |
| Query, property and retained-resource owners | 79 | Optional snapshot/lease handles and unavailable review branches were consumed without evidence; property view mocks were incomplete. Assert real presence, preserve negative branches and use truthful property views. One vector option declaration omitted an already implemented shared preview option. |
| Collaboration transport and materialization | 39 | Missing server sequence fields, Core internal types used as App transport DTOs, unchecked worker/payload branches and broad Proxy inference. Use App admission types, explicit ordered sequences and typed materialization. Remove the sequence-filling encoder wrapper. |
| UI, lifecycle and Feature fixtures | 25 | Missing required callback/receipt/activity/lifecycle fields; mock inference dropped parameters; unsupported role-query options and incomplete raw input events. Match the actual owner signatures without changing the assertions' intent. |
| Total | 255 | No casts, diagnostic suppression, compatibility path or weaker production validation added to discharge these diagnostics. |

The declaration correction reuses `VectorOperationIntentOptions` for
`AppendVectorAnchorPointOptions`; it changes no runtime route. Existing tests
still require active drag and non-undoable intent for local preview, canonical
writes for ordinary edits, and cleanup without history/publication. Knowledge
continues through real provider descriptions and operation consumers. The
structural test dispatcher now uses Runtime's actual result redaction boundary.

All 36 affected test files were exercised, plus the adjacent transient-preview
regressions. The first focused groups passed 335, 206 and 192 cases respectively;
those groups contain 37 distinct files. Collaboration then passed in the package's
formal jsdom environment after removing the obsolete sequence wrapper. An omitted
bootstrap helper rename caused one focused failure and was corrected, with all
54 WebSocket cases passing afterward. No failing expectation was relaxed.

Self-review caught a fixture lookup that could create an empty element for a
missing ID. Preserve undefined for missing records and add a no-canonical-write
regression. Its six-case focused file passes; the final total adds one case.
`run-VvrWyU` was deliberately interrupted before that edit and remains incomplete,
with matching before/after fingerprints. It is not passing feature evidence.

Final feature evidence: `tmp/conversation-verification/run-Zfhn8a/summary.json`,
command exit 0. Runtime build passed before its consumers. Before/after source
fingerprints match; every expected file was accounted for. Closing report/plan
edits do not change the tested code or tests.

| Final feature group | Files | Passed | Failed | Unexecuted |
| --- | ---: | ---: | ---: | ---: |
| Server/provider | 97 | 3,701 | 0 | 0 |
| Browser/common APIs | 70 | 907 | 0 | 0 |
| Filesystem/Knowledge handoffs | 5 | 65 | 0 | 0 |
| Agent Runtime | 34 | 523 | 0 | 0 |
| Node harnesses | 21 | 141 | 0 | 0 |
| Inspector contracts | 3 | 36 | 0 | 0 |
| Total | 230 | 5,373 | 0 | 0 |

App type evidence:
`tmp/type-handoffs-types-final3.log`; AI-server:
`tmp/type-handoffs-server-types.log`; scoped lint:
`tmp/type-handoffs-lint-final2.log` and
`tmp/type-handoffs-missing-target-lint-final.log`; naming:
`tmp/type-handoffs-naming-final.log`. The baseline remains
`tmp/type-handoffs-baseline.log`. The old 255-diagnostic statement below describes
the previous checkpoint and is superseded by this section.

## Previous shared-handoff checkpoint

The eleven failing cases and confirmed shared-handoff findings are corrected.
The maintained AI conversation execution gate passes on one unchanged source:
230 files, 5,372 tests, zero failed or unexecuted. At that checkpoint, App-wide type
closure remained open with 255 diagnostics, including AI/Knowledge tests and
unrelated App families. The typed-handoff correction above supersedes that status. No live model, 101, full repository test or push ran.
Test execution, semantic review and App-wide typing remain distinct conclusions.

## Previous feature evidence

`tmp/conversation-verification/run-5HeAmn/summary.json`; command exit 0.
Runtime exports were built successfully before all consumer groups. Maintained
source fingerprints match before/after the run. Every expected test file was
accounted for; no skipped, missing or unexpected files were accepted. Installed
native text/image/protocol tests used the pinned offline provider, and the guarded
recorded large-document bootstrap was enabled. Closing document edits below record
this evidence without changing the tested product or test sources.

| Group | Files | Passed | Failed | Unexecuted |
| --- | ---: | ---: | ---: | ---: |
| Server and provider | 97 | 3,701 | 0 | 0 |
| Browser and common APIs | 70 | 906 | 0 | 0 |
| Filesystem handoffs | 5 | 65 | 0 | 0 |
| Agent Runtime | 34 | 523 | 0 | 0 |
| Node harnesses | 21 | 141 | 0 | 0 |
| Inspector contracts | 3 | 36 | 0 | 0 |
| Total | 230 | 5,372 | 0 | 0 |

Focused evidence includes 144 Runtime admission/execution cases, 61 runner and
Inspector cases, real recorded correction and target consumers, actual provider
schema packets and ordered-part cross-request reuse. An initial manually grouped
Node/browser focused command used the wrong environment for one browser suite;
its Node suites passed and the browser suite was rerun in jsdom (six passing
cases), then both whole-feature runs used their correct environments. Those failed
attempt logs remain evidence, not passing results.

Runtime build, AI-server TypeScript and 15 naming checks pass. Scoped ESLint has
zero errors and two existing console warnings. Current-task whitespace checks pass.
At that checkpoint, App-wide TypeScript failed as detailed below; those
diagnostics had not yet been individually classified. The subsequent typed-handoff
correction above classifies and resolves them separately from execution evidence. No assertion relaxation or production compatibility
path was introduced in this correction.

## Shared handoff correction results

The previous six created-target failures trace to shared boundaries, not six
case-specific tools. Rejected native input lacked the call lease needed to publish
its repair resource. The Host now opens an empty admitted scope for rejection
without borrowing foreign resources from invalid arguments. Corrected input can
consume the published repair and request cleanup releases it once.

Conditional request selectors previously treated alternatives and supported
intersections as absent fields. The Runtime now resolves those paths only for
request execution, where the complete actual owner result and destination are
validated. Durable recipe admission remains conservative. An initial experiment
with general parser normalization broke five durable guarantees and was discarded;
those unchanged regressions now pass. Selected request-handle lifetime metadata
survives the transform, so conversation retention rejects it before writes.
Dynamic ready-batch rows use actual-path selection after their owner validates the
receipt; a missing selected field reports failed delivery of completed work.

The four query-artifact failures were obsolete expectations: three required the
removed admission envelope and one expected an unavailable-handle message where
the resource owner correctly reports incomplete cleanup. Tests now assert canonical
TOOL_INPUT_INVALID/not-started and all dependency issue paths, then execute the real
query/fill consumer. Cleanup still verifies retry, sibling isolation and no handle
revival. The mechanical test confused unavailable owner evidence with bad authored
input; it now distinguishes operational failure from typed stale-revision rejection.
Neither production error classification nor validation was relaxed to satisfy them.

Uncovered public-boundary defects now have permanent regressions. The provider
packet must reject per-part retain/delivery and public response. Ordered parts own
preparation/application; the Host alone owns outer storage/delivery. includeTargets
requests identity maps without exposing internal timing/work diagnostics. Real
ordered-part source retention and a successor request consume the named draft
without returning geometry to the model. Existing default/status/selected delivery,
partial execution, storage failure, recovery and native image tests remain in the
feature gate. The conversation spec and old performance Inspector no longer require
review-plan registration, structural checkpoints or signed completion approval.

A further old assertion expected every conditional artifact delivery to fail before
work. Current request semantics allow an actually present, validated field. Its
replacement consumes that returned artifact through the real target resolver and
context query. Separate missing/invalid-result tests stop the dependent consumer,
and retention tests still reject exporting request handles across turns.

Test-first logs: `handoff-corrections-scope-red.log`,
`handoff-corrections-resource-red.log`, `handoff-corrections-alternatives-red.log`,
`handoff-corrections-intersection-red.log`, `handoff-corrections-delivery-red.log`,
`handoff-corrections-authorities-red.log`, `handoff-corrections-build-order-red.log`
under `tmp/`. The runner build prerequisite prevents App imports from exercising
stale Runtime dist while source tests exercise new code. Build failure blocks all
consumers; test failures remain visible while later feature groups still run.

### Whole-feature iteration

`tmp/conversation-verification/run-PkvI24/summary.json` ran all 230 files on
unchanged maintained sources: 5,369 passed, three failed, none unexecuted. The three
failures still submitted retired public response inputs in selected-contract
discovery, duplicate-key repair and browser capacity integration. Their assertions
remain: full/selected input parity, illegal-field rejection, exact repaired source
geometry, real Core hierarchy and ordinary history. Only current inputs replace
obsolete controls; recordings remain immutable. Focused rechecks pass before the
final full-feature run.

At the earlier shared-handoff checkpoint, supplemental App-wide TypeScript checking was **not green**: the existing App config
reports 259 test typing diagnostics across 37 files, including unrelated selection,
collaboration, rendering and toolbar tests. This optional broader check is outside
the frozen eleven-failure/shared-handoff correction scope and is not a passing
feature gate. Four diagnostics in the edited interrupted-design test were direct
property access on a serialized element/container union; explicit required-container
assertions now narrow those values without casts or weaker hierarchy assertions.
The recheck reports 255 diagnostics across 36 other test files, with none in the
edited consumer: `tmp/handoff-corrections-app-types-final.log`. No production validation or dependency contract was changed to silence them.
Runtime build and the AI-server TypeScript gate are separate successful checks.

## Verification-method checkpoint

The maintained `test:ai` entry now discovers feature families rather than using
the former fixed browser-file list. The initial permanent entry regression failed:
the old AI command did not reach server handoffs. The former combined server/local
lists also omitted four existing server files: continuity-boundary-review,
discovery-boundaries, knowledge-contract-corpus and tool-input-continuation.
The new entry includes them by their owning directory. Test-entry assertions now
verify discovered membership and runner routing instead of prescribing a static
shell command. No product assertion was weakened or removed.

Runner and direct-entry regressions: 24 passed. These include new-family discovery,
Node/jsdom separation, unknown or missing results, missing files, skipped cases,
nonzero exits, source changes, and actual failed/skipped/interrupted child processes.
Self-review found inherited Node test-worker mode affecting nested runner tests;
the subprocess owner now removes that internal marker when starting a fresh runner.
The permanent subprocess case confirms the expected real exit and TAP evidence.

Full feature evidence: `tmp/conversation-verification/run-w15BiE/summary.json`.
The six groups ran sequentially with their recorded PIDs and raw logs. The
maintained source was unchanged during this execution. Later closeout edits
document this result and remove redundant package-wrapper invocations; they do
not change the feature tests or product implementation exercised by this run.

| Execution group | Files | Passed | Failed | Unexecuted |
| --- | ---: | ---: | ---: | ---: |
| Server and provider contracts | 97 | 3,677 | 11 | 1 |
| Browser and common API consumers | 70 | 906 | 0 | 0 |
| Filesystem and recorded handoffs | 5 | 65 | 0 | 0 |
| Agent Runtime | 34 | 521 | 0 | 0 |
| Node harnesses and entry verification | 21 | 140 | 0 | 0 |
| Inspector structural contracts | 3 | 35 | 0 | 0 |

Total: 230 files, 5,344 passing cases, 11 failures and one unexecuted case.
The command exited 1. All expected Vitest files were reported, with no unexpected
files. Installed native protocol/delivery cases used the existing offline fixture
provider. No live model, 101, Playwright E2E or full repository gate ran.
The unexecuted case is recorded-bootstrap's guarded large-document measurement;
it is explicitly unverified, not counted as passing or silently enabled here.

The 11 failures remain in created-targets (six), local-query-artifacts (four) and
local-mechanical-checks (one). Their exact assertions and failure messages are
retained in the run. Prior review distinguished real Host/resource/selection
handoff problems from assertions that require comparison with current contracts;
this verification-method change does not repair or reclassify those findings.
The reported workflow-part retain/delivery loss, public response selector and
conflicting active review requirements also remain open review findings. Their
absence from the failed-test count is not proof that they work.

These numbers prove test execution, not successful legal behavior for every
registered tool. Registry/null-input/schema tests, mocked consumers and structural
Inspector checks remain limited evidence. Current-spec consistency and real
producer-to-consumer behavior, including Knowledge and cross-turn reuse, require
their own semantic review. The procedure is maintained in App Workflow and the
AI Development and Debugging reference; no separate scoring registry is introduced.

## Earlier correction scope

The confirmed findings from the spec-based re-review are now corrected. Note
admission and registered recovery delivery use the existing correction contract;
the Knowledge oracle checks authored content rather than opaque identity bytes;
conflicting requirements and stale catalog/revision descriptions are removed.
The historical review and red evidence below remain recorded. This closes those
confirmed findings, not the parent plan or every possible tool invocation.

## Correction results

### Contracts and implementation

- `local-design-facts.ts` uses LocalToolInputError for its own schema and
  duplicate-ID rejection before any note is stored. Source-owner exceptions are
  not caught or reclassified. Existing IDs remain replaceable in later updates.
- `evaluation-control.ts` consumes the declared single-leaf execution.value in
  addition to composed, call-correlated recovery. Root/call/value outcome and
  settlement must agree; the existing owner classifier decides whether correction
  is allowed. This includes completed read identity rejection without confusing
  completed reads with writes. Unknown settlement, conflicting receipts,
  operational values, extra calls and independent delivery issues remain blocking.
  No prose matching, extra permission flag, replay or compatibility was added.
- The actual Host audit retains eight note-route regressions and two completed
  prefix cases. Instrumentation observes callInternal, the invoked owner boundary,
  and proves the corrected submission executes only the remaining update.
- The real provider construction/transport test now includes duplicate numeric-note
  IDs. Controlled native replies prove the failure reaches the model and the next
  corrected call succeeds in the same turn, without a browser mutation.
- The Knowledge corpus test forces the exact opaque UUID that originally caused
  the false positive. Its content oracle retains documents, targets, sources,
  replaced sources and provenance while excluding request identities. Negative
  controls still detect subject-specific document text and provenance. Knowledge
  loading, caching and delivered content are unchanged.

### Iteration and counterevidence

The initial eight note-route tests failed. Correcting the note owner made six
pass and exposed the registered invocation's omitted recovery branch in evaluation.
The latter was reproduced independently before editing evaluation. The final
cross-route and prefix cases pass. Self-review added completed-read equivalence
and conflicting-settlement counterexamples, preserving the existing strict Runtime
admission guard and allowing only the owner's classified correction.

One proposed test incorrectly tried to invoke read_design_contracts through the
library. Its control-only boundary correctly rejected that route. The permanent
test now verifies that rejection and correction through native lookup, with and
without a valid sibling; no execution capability was expanded to satisfy it.
Completed-read registered-envelope equivalence is a boundary counterexample,
not a claim that this native-only control executes through the library.

The Knowledge failure was reproduced deterministically before correcting its
oracle. It was not hidden by retrying until random identities changed. The original
failure logs and note/library/read counterexamples remain under tmp with
conversation-spec-review or conversation-spec-fix prefixes.

### Documents updated

The execution specification removes the superseded sourceCorrections,
fact-change callback and evidence-dependent replacement requirements. It describes
atomic note admission and both current recovery envelopes. Preparation behavior
refers to the registered owner rather than duplicating its revision number.
The provider specification describes the authoritative shared/App catalog without
the obsolete five-file/six-entry claims. Inspector compose now explicitly includes
the note helper and the existing note/input-rejection spec anchors. The plan records
the bounded correction and its accepted behavior; no App prompt was expanded.

### Final verification

| Focused gate | Result and evidence |
| --- | --- |
| Complete registration/discovery/delivery audit | 1,371 passed; `tmp/conversation-spec-fix-registry-final.log` |
| Eight owner, Host, recovery and Knowledge files | 196 passed; `tmp/conversation-spec-fix-focused-final.log` |
| Actual-provider contract, correction and strict native recovery cases | Seven passed; 291 unrelated cases filtered; `tmp/conversation-spec-fix-provider-final.log` |
| Relevant execution-flow product cases | Three passed; 86 unrelated cases filtered; `tmp/conversation-spec-fix-flow-proof.log` |
| Execution Inspector authority/route checks | Two passed; `tmp/conversation-spec-fix-inspector.log` |
| Naming | 15 passed; `tmp/conversation-spec-fix-naming-after.log` |
| AI-server TypeScript and scoped ESLint | Passed; `tmp/conversation-spec-fix-types.log`, `tmp/conversation-spec-fix-lint.log`, `tmp/conversation-spec-fix-provider-lint.log`. One pre-existing provider-test console warning remains; no lint errors. |

The scoped diff check passes. Searches in the touched active authorities find no
remaining sourceCorrections requirement, evidence-dependent note replacement,
old catalog count or revision-4 preparation claim. Retired inputs appear only in
rejection tests and historical evidence. No full local suite, 101 run, live model
inference, commit or push was performed. Original report sessions remain untouched.
There is no deferred confirmed finding within this correction; the broader parent
plan's assurance limits are not converted into an all-tools correctness claim.

## Spec-based re-review

### Authority and review boundary

Use the active execution-flow specification, conversation/provider specifications,
Runtime tool specification and Inspector owner boundaries as the oracle. The
previous report, current implementation and passing counts are evidence, not
requirements. Preserve the review's existing full-conversation scope and inherited
changes. Only permanent regression tests and this report changed during this
re-review. No live AI request, 101 run, full local test, commit or push ran.

### P1 - Note admission loses the correctable input classification

`ai-execution-flow.md`, "Canonical input rejection", requires confirmed no-write
input rejection to remain correctable through final delivery and strict evaluation.
`local-design-facts.ts` checks duplicate IDs before resolving or storing any update,
but throws a plain Error. `local-design-context.ts` preserves typed schema rejection
but does not classify this semantic rejection. Host therefore publishes
`TOOL_EXECUTION_FAILED` with unknown settlement. The evaluation owner correctly
treats that received classification as blocking: the first incorrect boundary is
the note owner's error, not a missing message-pattern exception in the stopper.

Both `record_design_facts` and `record_design_calculations` reproduce this through
native Host invocation, registered-library invocation, ordinary execute_design
operations and staged execution. Eight permanent tests in
`api-delivery-audit.integration.test.ts` fail the expected classification,
settlement and continuation assertions. In every case the unchanged-store check,
corrected follow-up and no-browser-dispatch checks pass. The staged regression
includes the required apply operation; an earlier incomplete test envelope was
corrected before drawing conclusions about staged execution.

The existing design-context test checked only that duplicates throw and storage
remains unchanged. It did not prove the error classification survives delivery.
This is one common-owner defect reproduced on eight paths, not eight independent
product defects. The tests exercise actual Host replies and the production stop
classifier, without claiming a real provider session was interrupted.

### P2 - Active note specifications contradict each other

"Evidence tool responsibilities" permits authored facts/calculations without prior
facts, criteria or drawing and says updating an existing ID replaces the note.
"Retained reference identity and diagnostics" still promises sourceCorrections,
dependency versions, fact-change invalidation and evidenced dependency changes
before factual content changes. The current note schemas/owner expose none of
those old correction mechanisms; the App prompt also describes optional authored
context without suitability registration.

These requirements cannot be treated as one consistent acceptance contract. The
user's accepted removal of compulsory evidence gates and the responsibility-scoped
section establish the intended direction. Do not restore those gates to satisfy
the old paragraph, and do not silently edit the spec to excuse a new runtime
failure. Remove superseded requirements in the authorized follow-up together with
their remaining references; retain provenance and actual input validation.

### P2 - The Knowledge contamination test searches random identity bytes

`local-knowledge.test.ts` serializes the complete read reply and rejects any match
for /Taipei|50800|101/. This run failed because contextKey was
`df533406-0d42-4e56-af26-c8f2e101d536`. Parsing the failure payload and searching
every string field found the only match at /contextKey, not in advice content.
Runtime deliberately generates that opaque key with crypto.randomUUID().

This is an unreliable test oracle, not evidence of building-specific Knowledge.
Keep the content-neutrality requirement, but test the authored content/metadata
that it governs rather than transport identity bytes. Do not weaken the content
check or rerun until a different random UUID hides the error. The existing test
was not changed in this review; its recorded failure remains explicit.

### P3 - Published catalog and revision descriptions are stale

The provider spec still describes five shared files and a six-entry catalog.
The loader currently has eleven shared file IDs plus additional App-owned topics.
The execution spec's compiled-findings section says prepare_design revision 4,
while the current owner publishes revision 5. These are documentation mismatches;
they do not independently prove a model received an invalid execution contract.

### Acceptance correction and proof limits

The previous report's blanket "every tool through every supported route" closure
statement was too broad as a standalone oracle. The actual execution spec's
"Per-registration tests" paragraph requires published operation scopes, advertised
routes, complete external replies and applicable admission/inner/success/no-op/
partial/recovery branches. Unsupported routes should remain rejected; a matching
registration count and generic null-input probes do not satisfy that requirement.
Conversely, an unexercised Cartesian combination is not automatically a defect.
Associate each proof or gap with the applicable published behavior.

This re-review reran real provider-construction comparisons for full registry,
native input projection and the inspection-disabled profile: all three passed.
They establish that the audit fixture's definitions match the provider and its
thread/start declarations, not that every owner behaves correctly for all inputs.
The note counterexamples demonstrate that distinction directly.

Focused evidence:

- Eight note-route regressions fail as described:
  `tmp/conversation-spec-note-routes-final.log`.
- Eight targeted files covering note context, input continuation, evaluation,
  Knowledge, coordinates and phase/continuity boundaries: 117 pass, one Knowledge
  oracle failure; `tmp/conversation-spec-review-focused.log`.
- Three actual-provider handoff cases pass; 294 unrelated cases filtered out:
  `tmp/conversation-spec-provider.log`.
- Naming gate: 15 pass; `tmp/conversation-spec-review-naming.log`.
- AI-server TypeScript check and scoped regression-file ESLint pass. The initial
  new-test lint findings were corrected without changing production or expected
  behavior; `tmp/conversation-spec-review-types.log` and
  `tmp/conversation-spec-review-lint.log`. Scoped `git diff --check` passes.

The initial review evidence below remains historical evidence for its exercised
paths. It is not a substitute for the current spec, and its "no new production
defect" conclusion no longer describes this worktree.

## Initial review

This review follows the complete conversation path, including Knowledge, rather
than the preceding repair list. It found defects in the verification setup and
an obsolete test expectation. It did not reproduce a new production defect in
the exercised handoffs. Only tests, their fixture and this report/plan changed.
No production validation, compatibility route or mandatory agent step was added.

The earlier statement that the audit covered the complete registered surface was
incorrect. Its fixture omitted production capabilities and a preparation adapter.
The corrected fixture now matches all 208 full-capability provider registrations,
including their input/output contracts, revisions, effects and composition policy.
That is stronger evidence than a matching count; it is still not proof that every
possible invocation of every tool is correct.

Task association: [Complete conversation contract verification](../plans/completed/agent-context-and-report-continuity-record-2026-11-16.md#complete-conversation-contract-verification).
Worktree: `.worktrees/ai-conversation-improvements`. Preserve the inherited dirty
changes and idle report sessions. No 101 run, full local test, inference, commit
or push belongs to this review. No App AI was contacted.

## Confirmed verification defects

### The registry audit omitted conditional production owners

`local-ai-provider.ts` supplies image resolution, validation and preparation to
`createLocalOperationTools`. The original audit supplied only `getNativeTools`.
Consequently it omitted `check_drawing_image` and `select_design_references`.
The reported 206 registrations described the fixture, not the complete provider.

The corrected full-capability fixture has 208 registrations: 174 allow durable
composition, eight allow request composition, and 26 are control-plane entries.
These are registrations, not 208 eagerly exposed model functions. Stored recipes
and a provider without drawing/inspection capabilities have different inventories.
The canonical App registry contains 182 actions, including 156 basic APIs across
Core, element, hierarchy, selection, viewport, fill and stroke owners.

Permanent correction: `delivery-audit-fixture.ts` is used by the registry audit
and by a real provider-construction test. The latter captures the Host created by
`requestConfiguredAiActionBatch`, compares every definition by qualified identity,
and checks actual `thread/start` declarations. It verifies both inspection-enabled
and inspection-disabled profiles. Provider-published examples must be admitted by
the delivered and owner input schemas; scalar/array roots must be rejected.

### Matching tool names concealed a missing preparation branch

The first full-definition comparison failed for
`design_operations.insert_vector_composition`. Production chains
`designs.modelActions(imageTools.modelActions(actions))` and chains both batch
resolvers. The audit used the design adapter alone. Its insert and replace
contracts therefore omitted the VTracer image-artifact input branch.

After connecting that adapter, two existing audit expectations failed for insert
and replace: those expectations also derived their input contract from design
preparation alone. Both now use the complete preparation chain. No extra schema
alternative was accepted merely to silence a failure. Exact provider-definition
comparison and the existing complete-schema checks remain mandatory.

This was a test pipeline mismatch, not evidence that the provider lacked image
preparation. It explains why passing the earlier audit did not establish the
provider's complete contract coverage.

### A refusal test expected a superseded execution wrapper

`model-delivery-boundary.integration.test.ts` expected `execution.status` when a
control-plane tool was refused through the library entry. The current boundary
correctly rejected it before execution with `TOOL_INPUT_INVALID`,
`stage: admission`, `settlement: not-started` and a failed `toolOutcome`.

The test now validates the entire canonical failure schema and those exact
status fields, proves the underlying owner was never called, and verifies the
evaluation stopper permits correction. The valid native path and registered
data-plane path still verify selected result delivery without reacquisition.
The product did not regain the obsolete wrapper.

## Complete handoffs checked

| Boundary                                 | Implementation and exercised evidence                                                                    | Established behavior                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft, attachments, history and targets  | Conversation panel/controller/context, server action-batch provider; browser/controller tests            | Asynchronous attachments retain originating draft identity/generation. Target and history projection, cancellation and successor-turn saved-name descriptions retain their ownership.                                                                                                  |
| Instructions, registration and discovery | App/domain prompt, actual provider construction and `thread/start`, registry audit and capability search | All 208 full-profile registrations now match the provider fixture exactly. Purpose/identity search, qualified names, usage/full contracts and branch constraints are checked. The loaded Knowledge corpus is inspected separately from tool contracts.                                 |
| Direct and composed execution            | Host selection, local library, sequence/stage compilation, Runtime admission/execution                   | Invocation-specific contracts precede execution; invalid output cannot feed successors. Direct, registered, ordinary and staged input rejection remains correctable. Known successful prefixes are not replayed.                                                                       |
| Canonical App owners and coordinates     | Basic API adapters, real Core/property/scene owners, coordinate integration                              | Existing mutation/partial-result and transaction cases pass. A new enumeration executes all 28 current read APIs accepting empty arguments against real owners. Nested/rotated parent conversion and capture cases pass.                                                               |
| Delivery and images                      | Selected/default projection, operation receipts, image delivery, installed native transport              | Retain does not select delivery. Selected images survive the tested native receipt paths, invalid output is rejected, and resource or delivery failure does not invent successful execution.                                                                                           |
| Retention and Knowledge                  | Conversation result store, leases, Knowledge loader/session and information paging                       | Portable data can feed a successor request without another producer call. Request-owned identities are rejected for cross-turn storage. Page/context invalidation and source-load work counts are exercised; request-local caching is not described as an application-wide file cache. |
| Recovery, completion and reports         | Input continuation, evaluation stopper, selected-prefix recovery, report-session and provider tests      | Input correction is permitted; independent execution/resource/storage failure remains distinguishable. Same-thread reporting and retained sessions are tested without launching a drawing or modifying an answering AI's files.                                                        |

The source review also followed the browser batch bridge, saved-result exchange,
permission/transaction invocation and provider cleanup consumers. Model choices,
visual quality and a real multi-machine collaboration deployment are outside
these focused proofs; none was inferred from simulated transport receipts.

## Suspicions tested without changing production

- A `LocalToolInputError` thrown while selecting a contract remains correctable
  through direct, registered, ordinary and staged routes. It inherits Runtime's
  `AiToolContractError` with input stage. The new counterexamples pass with zero
  producer/dependent calls; no new error flag is necessary.
- Null ordinary arguments are rejected before dispatch for both the no-argument
  document export and current-workspace read. They are not silently converted to
  an empty object in these tested routes.
- Reference content IDs are stable content hashes; attachment indexes are
  request-owned access handles. Portable source notes must not be prohibited
  merely because their content hash is reused.
- App file selection comes from the page URL; reset/reopen reloads the page, and
  page teardown disposes the controller. The result store independently rejects
  expired document scopes. A live controller crossing documents with colliding
  element IDs was not reproduced as a supported product path.
- The initial combined browser test command incorrectly ran two Node-owned
  file-loading suites under jsdom. Their URL/path failures disappeared in the
  documented Node environment. They are not product fixes or omitted tests.

## Evidence and limits

Final focused results follow. Overlapping
test groups must not be added into a purported count of independently verified
tools. A single file can exercise many tools, and many tests can exercise one
tool. Neither 19 files nor 208 registrations establishes complete semantic
coverage by itself.

| Gate                                                                | Final evidence                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete registry/discovery audit using the corrected fixture       | 1,359 passed; `tmp/conversation-review-registry-final.log`                                                                                                                                                                                                 |
| Provider, Host and model delivery, including installed registration | 390 passed; `tmp/conversation-review-provider-final.log`                                                                                                                                                                                                   |
| Semantic tool owners, prompt and capability search                  | 363 passed in nine files; `tmp/conversation-review-owners.log`                                                                                                                                                                                             |
| Browser conversation, real owner receipts and continuity            | 275 passed in 13 files; `tmp/conversation-review-continuity-final.log`                                                                                                                                                                                     |
| Runtime contracts, execution, Knowledge, lifecycle and retry        | 255 passed in eight files; `tmp/conversation-review-runtime.log`                                                                                                                                                                                           |
| Node-owned Knowledge and image handoffs                             | 32 passed; three installed-image cases were enabled in the native gate below; `tmp/conversation-review-node-handoffs.log`                                                                                                                                  |
| Native-focused provider/text/image checks                           | 69 passed; 267 unrelated tests filtered out; `tmp/conversation-review-native.log`. The opt-in checks include five installed text handoffs, three installed image handoffs and one installed registration check. Controlled responses avoid live inference. |
| Type, lint and naming checks                                        | App and AI-server type checks passed; scoped ESLint has zero errors and one pre-existing console warning; naming has 15 passing checks. `git diff --check` passed for the current review files.                                                            |

The initial server boundary group had 685 passes and one obsolete-wrapper
expectation failure. That same test now passes in both the owner and final
provider groups. The two preparation expectations failed only after the missing
image adapter was exposed; both pass in the final 1,359-case run. The new provider
proof separates setup from contract assertions using the existing test/hook
budgets; no timeout, validation rule or product restriction was relaxed.

The remaining assurance gap is explicit: no current permanent gate proves that
every registered tool has a successful, real-owner scenario through every
supported execution and successor-use route. Registry admission/schema coverage,
family owner scenarios and shared-boundary counterexamples establish different
facts. The broad basic-API delegation test uses mocked owner methods and proves
parameter forwarding, not every real owner's successful result contract. The new
28-read enumeration improves that evidence without substituting for parameterized
mutation, preparation, image and stateful scenarios.

Accordingly, this report does not close the plan's universal per-tool verification
claim. A subsequent implementation/verification slice must associate each current
registration with its real valid scenario and explicit supported routes, preserve
illegal/equivalent-input checks, and expose uncovered registrations as failures.
Reuse existing family fixtures; do not create another hand-maintained alternate
provider or add production restrictions to compensate for missing proof.
