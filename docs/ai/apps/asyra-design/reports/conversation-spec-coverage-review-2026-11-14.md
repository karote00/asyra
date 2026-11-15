# Independent conversation specification review

## Push validation follow-up - November 16, 2026

Current execution evidence is `tmp/conversation-proof-ZB57xy`. The independent
review below remains the semantic baseline, supplemented by the fourteen-finding
cleanup, Pen handoff/type reviews and the completed ten-finding App review. This
follow-up reconciles their affected boundaries and the final test repairs; it does
not infer specification coverage from passing case counts.

- The explicit-generation contract requires a valid generation in a successful
  checkpoint response. The queue fixture now supplies and expects `3`, preserving
  the value rather than expecting a missing value to become `0`. The separate
  generation regressions still reject absent, null, negative, fractional and unsafe
  values; valid zero remains supported. No production fallback was added.
- Both malformed completed creation receipts still fail the registered output
  boundary. Parameterized case titles now include their row index, allowing the
  independent inventory to distinguish the two unchanged inputs and assertions.
- The lifecycle registers the read-only session observation owner; runtime input,
  document export and the two E2E fixtures read that owner. The fixtures no longer
  import the removed lifecycle getter. No transport import or compatibility export
  was restored. Their 192 real-browser cases pass, including durable reload and
  history transitions.
- The fourteen-finding review established final/named producer context, Knowledge
  lifetime and native delivery equivalence; the ten-finding review preserved full
  receipt assertions after type narrowing. Those contracts remain intact. Current
  native-consumer, Knowledge, retention and continuation tests pass through the
  formal execution paths, with the native executable/version admitted explicitly.
- The formal runner still compares independent case inventories with actual
  reports, rejects omissions/skips/failures/flakes and verifies unchanged source,
  compiled exports and flow definitions. Manual integration acceptance remains a
  separate requirement; an execution pass does not automatically accept it.

| Group | Selected files | Collected and passed cases | Issues |
| --- | ---: | ---: | ---: |
| Server | 103 | 3,731 | 0 |
| App | 143 | 1,538 | 0 |
| Runtime | 34 | 524 | 0 |
| Node verification and contract owners | 60 | 680 | 0 |
| Browser | 24 | 335 | 0 |
| Total | 364 | 6,808 | 0 |

The focused queue/generation/conversation run passed 71 cases. App TypeScript,
changed-file lint and naming passed. The complete run has identical before/after
source, compiled-export and definition snapshots, no execution issues and no
browser skips or flakes. Its original exit code is `2` because the previous
manual acceptance became stale; preserve that immutable summary. The subsequent
review is recorded separately through the public Flow Inspector observation API
in `tmp/conversation-proof-ZB57xy/manual-review.json`.

Earlier incomplete runs are not acceptance evidence: `24JlOp` observed a source
change during verification; `pXGN2J` exposed the incomplete checkpoint fixture and
duplicate case identity; `37rZYQ` exposed the two obsolete fixture imports and was
stopped before more redundant browser failures. The final run validates their
corrections without changing product code or weakening validation in this
follow-up. The original untraced rectangle-selection failure remains
cause-unconfirmed in the separate App review; later deterministic fixes are not
retrospective proof of its cause. No 101 or full repository local test ran.

## Single delivery correction - prior accepted evidence

November 15, 2026. The current source passes complete conversation verification in
`tmp/conversation-proof-nIjeLI`. The earlier acceptance of public response selection
is withdrawn; historical execution counts below are not its justification.

### Contract and implementation reconciliation

| Boundary | Removed behavior | Current verified behavior |
| --- | --- | --- |
| Prepared application and internal batch | Public/private response selector and default compact forwarding | Complete acknowledged IDs and counts before Host delivery selection; removed controls reject before effects. |
| Combined preparation/application | includeTargets opt-in, receiptScope label and reconstructed counts | createdTargets exposes acknowledged source-key maps; keep the actual owner's count. Binding and retention do not depend on model delivery. |
| Inspection receipt | Deletion of coveredMeasurementTargets during wrapping | Preserve the actual covered descendants and reconcile only affected obligations. |
| Verification | Full/compact variants, a saved compact-receipt oracle that bypassed result validation, incomplete simulated application receipts | Current valid receipts, explicit old-input rejection, real creation/history/cross-turn reuse and actual native consumer assertions. |
| Native provider | Inherited per-tool history truncation after App delivery | Shared process/thread configuration preserves selected data and the independent outcome. Model context management and explicit information paging remain unchanged. |
| Authorities | Acceptance of independent response and delivery selection layers | Delivery is the sole public result selector; retain remains independent. No old argument alias or compatibility branch remains. |

The independent review traced canonical application data through workflow mapping,
Host validation, binding/retention, model projection and actual native content.
Registered inventory and native contract tests reject retired controls and entries.
Knowledge still passes through its existing admission, paging, reuse and provider
owners; it does not acquire a separate result selector or mandatory consultation.
Current domain query field selection and compact geometry encoding are not old
response modes. Historical recordings retain their original bytes as evidence;
maintained requests explicitly select current authoring fields rather than replay
old controls or use a production migration helper.

### Failures found and corrected

1. Before implementation, the registration/workflow regressions and actual native
   successor contract failed: response was still accepted or advertised and source
   maps depended on includeTargets. The current checks reject those controls and
   expose acknowledged mappings without another selector.
2. `tmp/conversation-proof-VqGZx6` found three failed assertions in two files:
   direct/registered Host fixtures relied on count reconstruction, and mechanical
   closure required dropping coveredMeasurementTargets. The fixtures now supply
   complete canonical receipts. The inspection oracle requires all 70 parent IDs
   and their 70 child IDs while retaining the selective reconciliation/work-count
   assertions. The 98 focused cases then passed. This failed whole run was stopped
   before further expensive gates and is not acceptance evidence.
3. `tmp/conversation-proof-6uRRMI` passed the first four groups but failed the real
   browser provider-receipt oracle. The App sent 86,617 characters of partial-work
   data plus a separate 514-character outcome; native history retained a
   48,023-character fragment and replaced the outcome with an omission marker.
   This was a real production defect, not a stale test. The original browser
   equality assertion was preserved. A new real-native saved-value regression
   reproduced truncation before the provider configuration changed. Process and
   thread creation now configure the supported tool-output history setting to the
   largest exactly representable JSON integer, preventing an implicit second
   selector. No model context capacity, input/output validation or paging bound
   was relaxed. Both the new native case and the unchanged browser prefix/repair/
   history/reload case passed before the final whole run.

The native mechanism is documented in
<a href="https://github.com/openai/codex/blob/rust-v0.160.0/codex-rs/core/src/context_manager/history.rs" target="_blank" rel="noopener noreferrer">Codex 0.160.0 history output handling</a>;
the decisive evidence here is the actual successor request, not that source alone.
The incomplete preliminary starts and fixture setup failures are not counted as
product regression proof. No failure was converted to a pass by narrowing an
existing browser oracle, suppressing required data or restoring compatibility.

### Complete current-source execution

| Group | Selected files | Independently collected and passed cases | Issues |
| --- | ---: | ---: | ---: |
| Server | 101 | 3,705 | 0 |
| App | 137 | 1,487 | 0 |
| Runtime | 34 | 524 | 0 |
| Node verification and contract owners | 56 | 654 | 0 |
| Browser | 24 | 335 | 0 |
| Total | 352 | 6,705 | 0 |

All case identities reconcile with no missing, extra, skipped, failed or flaky
cases. Source, compiled-export and definition snapshots are identical before and
after execution. Every tracked process completed successfully. The runner exited
2 solely because independent manual acceptance was stale; `summary.json` records
`executionStatus: passed` and no issues. Formal manual acceptance is recorded
separately after this review, without rewriting that immutable execution summary.
`tmp/conversation-proof-nIjeLI/manual-review.json` records the accepted current
binding; all twelve owner nodes and feature integration are now `done`.

Focused tests, all three affected App type configurations, naming and scoped lint
passed; existing diagnostic console warnings remain warnings. No 101, live model
drawing, full repository test, release, commit or push was performed. This is
acceptance of the current specified handoffs and recorded evidence, not a guarantee
about arbitrary future model choices or all possible inputs.

## Historical review - earlier conclusions do not override current evidence

Date: November 14, 2026.

Task: [Independent case completeness and specification reconciliation](../plans/agent-context-and-report-continuity-plan.md#independent-case-completeness-and-specification-reconciliation).

## Authority and conclusions

This review compares the current conversation experience, execution flow, local
provider, design preparation, Runtime tool specification and Runtime package
contract with their implementation owners and formal consumers. It does not infer
coverage from the previous 6,649 passing assertions. Specification consistency,
case execution completeness and behavioral coverage are separate questions.

The confirmed verification defect was **within-file omission**. Deleting a case
from a nonempty report file and adjusting both summary totals still passed the old
checker. This is a defective acceptance rule, not evidence that the previous run
actually omitted a case. Current admission requires independently collected case
identities and rejects missing, substituted, duplicated, skipped and failed cases.
The formal publication regression also proves a missing unselected sibling retires
an earlier passing Flow observation.

Current specifications contained mutually exclusive requirements. They have been
removed at their original locations, not retained behind a new priority rule. No
product implementation or tool validation has been relaxed in this task.

## Conflicting clauses resolved

| Authority and clause | Removed requirement | Current owner-backed contract |
| --- | --- | --- |
| Execution flow - native failure delivery | Unknown write settlement terminates the model turn | It blocks unsafe dependent writes; deliver the receipt and permit observation. Explicit cancellation and unusable transport retain their own termination rules. |
| Execution flow - recoverable discovery | Only one typed discovery failure may continue | Every valid failed receipt reaches the model; an evaluation controller does not maintain a correction allowlist. |
| Execution flow - target preflight | A failed read is ambiguously called a blocking failure | Block dependent mutations, not the conversation. No guessed target or automatic replay. |
| Execution flow - measurement completion and workspace review | Revalidated visual/mechanical evidence and accepted=false control completion | Reports expose actual findings; AI owns final verification, without completion credentials. |
| Execution flow - Knowledge adoption | Knowledge is the default method reference | Optional advice; no reading or adherence prerequisite. |
| Execution flow - selected action usage | Repeat the complete Host envelope inside selected action usage | Deliver operation arguments/results and the existing hostContract selector. |
| Execution flow - purpose lookup | A single candidate can deliver executable usage | Search supplies metadata; contract acquisition is a separate owner. |
| Execution flow - native acknowledgement | Ambiguous wording suggests inserting toolOutcome into every owner value | The provider sends owner data/images and a separate validated acknowledgement; object, array, scalar and null values keep their shape. |
| Execution flow - formal command | test:design-execution-flow is required | verify:conversation owns current consumer execution and formal publication. |
| Design preparation - construction and review | Mandatory structure-first order and patterned-detail review | AI chooses method/order; invalid compiled inputs still cannot apply. |
| Design preparation - capture scheduling | Deferred/immediate capture schedules layout measurement | Capture and requested mechanical review are separate; defer performs no follow-up reads. Existing review-free owner cases verify this. |
| Design preparation - measurement and completion | Incomplete checks/text overflow force completion failure | Findings remain visible without a global quality gate. |
| Design preparation - result transport | response=full is a public selector | Reopened: the spec requires delivery alone, but the public prepared-action schema and its forwarding test still preserve response. Native request-2.json in tmp/conversation-native-naZThS confirms actual delivery. |
| Design preparation - source budget | Cumulative input stops at 1,000 nodes/20,000 points | Work windows do not cap cumulative input; whole-artifact and individual-primitive bounds remain enforced by design-budget. |
| Design preparation - vector input | Every Vector requires width and height | Both omitted invokes owner measurement; a supplied pair is an enclosing-bounds assertion; a partial pair rejects. |
| Design preparation - closure | A historical CI requirement defines this plan's closure | Declared feature gates and independent spec review define closure. No remote operation is requested here. |
| Local provider - discovery | describe_design_apis combines search and schema lookup | search_design_tools and read_design_contracts have separate responsibilities. |
| Local provider - retention | No value can cross requests | Request handles remain local; explicitly named portable App conversation snapshots cross turns within their document scope. |
| Local provider - eager declarations | All declarations are deferred, with zero eager bytes | Observe the actual three eager entries plus deferred functions; bytes are not tokens. |
| Local provider - reference admission | Original references have a separate four-megapixel ceiling | Keep original pixels, MIME/byte/decoder safety; no source resizing or separate four-megapixel rejection. |
| Local provider - rendered review and layer decoding | Review every operation, compulsory two-stage review, implicit deferred measurements and a second four-million-pixel ceiling | AI selects observations; defer only suppresses automatic capture; original-pixel decoder safety remains. |
| Local provider - reference failure | A `recoverable: true` flag and source-change advice for every failure | Current receipts separate failure category, source code, settlement and next step; unknown admission cannot be blindly replayed. |
| Local provider - prompt projection | Full tool-name enumeration and a one-sentence final-answer rule | Name eager entries, discover deferred tools, and report actual results/limitations/attribution; no sentence-count contract. |
| Local provider - research and commentary | Always research first; no model commentary and two required reviews | Reuse available sources, research missing information and permit brief concrete commentary; no prescribed review sequence. |
| Runtime package - Design integration | Fixed six-action catalog and an outer transaction over all model work | App registration includes Common-API wrappers; finite mutation members join one intended request Undo entry. |
| Runtime package - execution/progress | Only the final batch can reach action resolution | Callback and final batches share resolution/permission owners; progress is observational only. |
| Runtime package - recipe diagnostics | Input classification grants permission to continue | Classification describes the failure; it neither grants continuation nor proves safe replay. |

Implementation anchors include `server/ai-domain-prompt.ts`,
`server/local-ai-provider.ts`, `server/local-tool-host.ts`,
`server/local-operation-tools.ts`, `server/local-result-delivery.ts`,
`server/design-budget.ts`, `src/ai/startup.ts`, and the Runtime invocation owners.
Historical reports and immutable provider records retain their original wording.
They do not govern current execution.

The Conversation Experience spec also references the conversation-lifecycle step
of the performance Inspector. Its location under a completed-plan authority does
not make that currently referenced contract historical. That secondary projection
still prescribed compulsory mechanical/visual review, obsolete source budgets,
turn-wide rollback and an interaction lock across model/cooperative waits. The
current execution Inspector and `src/ai/transaction.ts` instead define finite
synchronous mutation members, a shared intended Undo group, independent user
editing, preserved completed prefixes and optional review. The secondary Inspector,
its normative authority paragraphs, BDD and contract tests now match those owners.
The generated workspace snapshot is regenerated from the corrected source. Both
referenced Inspector test files are explicitly selected by the feature verifier;
their authority plan and BDD participate in its source snapshot.

## Clause-to-consumer review

Paths in this section are relative to `apps/asyra-design` unless prefixed with
`packages/`, `tools/`, or `scripts/`. Rows identify separate obligations, not a
single passing score for a whole file. The earlier formal run is historical
execution evidence for unchanged product/test owners; new focused executions are
recorded separately below. No row claims exhaustive model behavior.

### Request, instructions and conversation

| Specification obligation | Owner and actual consumer evidence | Review conclusion |
| --- | --- | --- |
| Draft, attachment and clarification belong to the originating conversation | `src/ai/conversation.ts`; `src/ai/__tests__/conversation.test.ts`; `e2e/ai-conversation-navigation.spec.ts` | Generation/lifecycle guards, per-conversation state and browser navigation are distinct from schema validation. |
| Selected IDs and coordinate context are refreshed before later work | `src/ai/context.ts`, `src/ai/startup.ts`; `server/__tests__/coordinate-handoff.integration.test.ts` | Historical IDs are not current permission. Actual Common-API conversion feeds plural position writes. |
| Keyboard focus, activity order and history grouping preserve ordinary editing | Conversation controller/panel; `e2e/ai-conversation-flow.spec.ts`, `e2e/conversational-ai.spec.ts` | UI behavior needs browser evidence; Host unit tests cannot stand in for it. |
| Actual base/developer instructions and enabled tools reach the provider | `server/local-ai-provider.ts`; `server/__tests__/conversation-production-handoff.integration.test.ts`, `native-provider-handoff.integration.test.ts` | Actual native requests are retained; reconstruction from a source prompt is not delivery proof. |
| Missing provider configuration fails before inference; credentials do not enter outputs | `server/ai-model-provider.ts`; `native-provider-config.test.ts`, production-handoff HTTP cases | Native authentication, HTTP configuration and redaction are separate owners. |
| HTTP and native continuation differ explicitly | `server/ai-model-provider.ts`; production-handoff HTTP cases submit a second request; native recovery cases remain in one turn | HTTP is intentionally single-batch. Do not claim its correction is native same-turn recovery. |
| Commentary/progress cannot mutate or terminate successful work | Runtime progress owner; `packages/ai-agent-runtime/src/__tests__/progress.test.ts`; native observation integration | Bad observational callbacks do not determine execution settlement. |

### Discovery and Knowledge

| Specification obligation | Owner and actual consumer evidence | Review conclusion |
| --- | --- | --- |
| Search matches purpose and supported input fields, not guessed names alone | `server/design-workflow-discovery.ts`; `purpose-discovery.integration.test.ts`, `discovery-boundaries.test.ts` | Candidate scope/metadata and exact qualified identity are separate. No automatic invocation. |
| Selected usage preserves the current input/output/recovery contract | `server/local-operation-tools.ts`; `discovery-delivery.integration.test.ts`, `api-delivery-audit.integration.test.ts` | Native projection, selected scopes and real invocation are checked; registration counts alone are insufficient. |
| Empty, ambiguous or partially available lookup has truthful coverage | `discovery-identity-recovery.test.ts`, `contract-review-acquisition.test.ts` | Preserve diagnoses and continuations; no fuzzy substitution or acquired-contract claim from search. |
| Large informational results preserve complete selectable fragments | `server/local-information-delivery.ts`; `information-delivery.integration.test.ts` | Byte limits require explicit continuation; truncation is not complete delivery. |
| Knowledge catalogs select children without fetching unrelated bodies | `server/local-knowledge.ts`; Runtime `knowledge.test.ts`, App `local-knowledge.test.ts` | Navigation is not a dependency or permission rule. |
| References, extends and overrides retain provenance and required dependencies | Runtime Knowledge owner and its permanent graph/authorization cases | Missing dependencies reject with owner stage; an override is not permission to omit source attribution. |
| Advice is untrusted and never a tool contract or mutation credential | `knowledge-contract-corpus.test.ts`; actual-native Knowledge successor assertion | Corpus examples are validated through published input schemas; prose checks are not a proof of all possible advice semantics. |
| Lazy loading/reuse respects revision, authorization, epoch and disposal | App loader and Runtime sessions; `local-knowledge.test.ts`, Runtime `knowledge.test.ts` | Source read caching and already-delivered markers have different lifetimes; failed load can retry. |
| Paging, retained references and compaction preserve real model delivery | `native-provider-handoff.integration.test.ts` actual successor bodies, paging and genuine compaction cases | Native echo alone is not model receipt. Missing/foreign context keys reject; rehydration remains possible. |
| Input and owner failures reach the same native AI turn | Native recovery with recording armed, input and owner-failure variants | Fresh focused executions pass; no allowlist or automatic write retry is involved. |

### Admission, composition and canonical work

| Specification obligation | Owner and actual consumer evidence | Review conclusion |
| --- | --- | --- |
| Current immutable contract is pinned before input validation/effects | Runtime registry/invoker; Host; `unified-tool-contracts.integration.test.ts`, `model-delivery-boundary.integration.test.ts` | Direct and composed calls must not select a different output contract after work. |
| Unsupported schema rules and bad input fail without fabricated defaults | Shared schema owners; `operation-input-schema.test.ts`, `result-schema-projection.test.ts`, Runtime `tool-contract.test.ts` | Current contract rejection remains strict; removing a quality gate does not weaken validation. |
| Common-API semantic rejection preserves its field/target and actual settlement | `src/ai/basic-api-actions.ts`; `api-delivery-audit.integration.test.ts` | Reads and writes share typed error adaptation. Arbitrary exceptions are not guessed to be input errors. |
| Producer output may be selected/transformed into a different consumer shape | `coordinate-handoff.integration.test.ts`; real read-to-removal browser/Common-API cases | Test the constructed input and canonical effect, not schema identity. Known output fields, DOMRect fields and omitted optional undefined values retain meaning. |
| Root/local/array references keep scope and runtime lifetimes through adapters | Runtime projection and Host output owners; `result-schema-projection.test.ts`, `request-binding-review.test.ts` | Equivalent inline/reference and whole/field mappings are checked; illegal references remain errors. |
| Request sequences admit available optional values with runtime checking | Runtime admission and invocation; request binding/recipe tests | A missing actual value stops its dependent step, preserving the prefix. Durable recipes retain stronger static guarantees. |
| One Host submission can chain operations, saved input and dependent output | `local-tool-host.ts`; `phase-continuity.integration.test.ts`, `created-targets.integration.test.ts` | Host orchestration is legitimate aggregation, not a second geometry/state owner. |
| Iteration/checkpoints stop on pass, decision, exhaustion, cancellation or uncertain settlement | Runtime recipe invoker; `continuity-boundary-review.test.ts`, Runtime tool-library/recipe tests | Check/repair ownership remains domain-specific; no visual judgment is inferred from a mechanical pass. |
| Ready preparation can apply before later independent preparation finishes | `e2e/ai-retained-anchor.spec.ts` staged overlap case | Actual first application is observed; both started branches must settle before final failure delivery. |
| Preparation templates/materials/projection stay deterministic and editable | Design compiler, budget and artifact owners; `design-preparation.test.ts`, `e2e/design-construction.spec.ts`, `e2e/editable-design-variants.spec.ts` | Whole-artifact limits, local coordinates, overrides and painter order are preserved; templates are not SceneTree shared components. |
| Mutation, permission, rollback/partial work, Undo and collaboration use canonical owners | `conversation-production-handoff.integration.test.ts`; `e2e/basic-api-actions.spec.ts`, `e2e/ai-retained-anchor.spec.ts` | Common-API wrapping does not transfer transaction ownership to the server. Catalog tests invoke real owners, not mock API bodies. |
| Locks, ancestry, target count and current geometry are validated before writes | Target/context owners; `design-target-index.test.ts`, coordinate integration, browser arrangement/organization cases | Unknown reads block dependent mutations while returning diagnostics. No guessed IDs or unsafe replay. |

### Results, retention, media and durable storage

| Specification obligation | Owner and actual consumer evidence | Review conclusion |
| --- | --- | --- |
| Success, failure, partial and unknown settlement have consistent canonical envelopes | `src/ai/tool-contract.ts`, `server/local-tool-invocation.ts`; boundary/projection integration | Validate canonical data first, then the selected model view; a failed envelope cannot substitute for invalid successful data. |
| Native model receives status separately from selected result data | Actual-native successor assertions and `model-delivery-boundary.integration.test.ts` | A transport success is not proof of completed drawing or saved data. |
| Partial completed prefixes and save failures remain legal without replay | `selected-prefix-recovery.test.ts`; actual-native durable-storage retry | The storage retry executes only storage. This is not acceptance of arbitrary partial payloads. |
| retain does not change delivery defaults; selected images remain selected | `local-result-delivery.ts`; `result-delivery.test.ts`, `result-delivery-handoff.test.ts` | Status-only delivery intentionally suppresses values; saving alone does not suppress them. |
| Named portable values cross turns; request capabilities do not | `src/ai/conversation-results.ts`; its tests and production-handoff cross-turn cases | Document scope, immutable snapshots, capacity and origin/shape descriptors remain authoritative. An unused saved name is not a failure. |
| Selected saved paths feed consumers without unnecessary full readback | `local-result-delivery.ts`; phase continuity and retained navigation tests | Escaped keys, optional fields, missing names and stale target IDs are checked at their owners. |
| Resource ownership transfers before producer cleanup | `local-tool-leases.test.ts`; Runtime recipe/invoker tests | Borrowed, sibling and exported references have different lifetimes. Cleanup failure cannot claim successful handoff. |
| Original references and user attachments retain identity, crop, dimensions and bytes | `local-reference-tools.test.ts`; actual-native media integration | No four-megapixel source rule, silent resize or replacement thumbnail. Tool return and actual image delivery are different observations. |
| Multi-image selection/recovery preserves every selected image | `result-delivery-handoff.test.ts`, `image-delivery.integration.test.ts` | A cached image can be redisplayed without recapture/reimport. Correctly returned image bytes do not prove the AI chose the right region. |
| Inspection eligibility does not clone a whole subtree; actual capture traverses its owner | Common inspection API; browser drawing-inspection/framing cases | Cheap preflight and real snapshot cost are distinguished. The AI still owns framing/design judgment. |
| Mechanical review and visual review do not become completion tokens | Review owner; `e2e/drawing-inspection.spec.ts`; current prompt | Invalid or incomplete findings remain explicit, but no mandatory evidence-registration workflow is added. |
| Export delivery, document persistence and visual completion are distinct | Export/persistence owners; `document-persistence-queue.test.ts`, browser reload/provider cases | Unknown durability is shown as unconfirmed; delivery or storage failure cannot replay drawing. |
| Saved tool library verifies immutable dependencies and separates execution from saving | Runtime tool library/persistence and `local-tool-library-tools.test.ts`, `e2e/ai-tool-library.spec.ts` | Library management is control-plane work. Foreign capabilities and captured request values are not durable recipes. |

### Lifecycle, diagnostics and verification

| Specification obligation | Owner and actual consumer evidence | Review conclusion |
| --- | --- | --- |
| Abort/dispose prevents late work and releases owned resources | Runtime lifecycle tests; native fixture teardown and Host lease cases | Borrowed resources and shared canonical state are not indiscriminately destroyed. |
| Tool errors do not decide recorder interruption | `evaluation-control.test.ts`; armed-recording native recovery cases | Assertion failures still fail formal tests; operator stop/deadline still stops the live evaluation. These are different policies. |
| Drawing/report/follow-ups keep the original native session | Native report/follow-up integration and evaluation controller cases | Reporting has no drawing-derived time cap. Offline scripted transport proves continuity, not autonomous report quality. |
| Diagnostics preserve provenance, redaction, bytes and explicit unavailable evidence | Runtime record delivery/profiler, App outbox and native output observation cases | No private-reasoning inference or timestamps-as-causality claim. Diagnostic failure cannot redefine execution. |
| Required behavior is independent from discovered files and runtime results | Reviewed Flow selectors and `conversation-scope.test.mjs` | The selector list does not by itself prove every spec clause has a sufficient oracle. |
| Every selected file and collected case must appear successfully | `runner-report.test.cjs`, `runner-inventory.test.cjs`, real runner collection tests | Independent identity comparison now detects dropped cases inside retained files, even after totals are adjusted. |
| Failed collection, interrupted execution and source drift cannot pass | Existing process/source guards plus collection failure checks and formal publication | Collection and execution use the same configuration/environment. No successful totals are fabricated from collected names in production. |
| Formal normalization/publication is reused rather than recreated in a helper | `flow-files/adapters.cjs`; real-runner integration and stale-pass regression | Unit corruption fixtures test the checker only; they are not product handoff proof. |

## Additional clause and oracle checks

These checks distinguish independently authored behavior from registration-derived
coverage. A catalog-driven loop is appropriate for detecting an untested registration,
but its expectation must not merely reproduce that registration.

| Clause family | Independent oracle and boundary | What it does not prove |
| --- | --- | --- |
| Every Common API remains usable when wrapped | `e2e/fixtures/basic-api-cases.ts` maintains explicit per-API inputs and semantic callbacks. It compares its names with the actual catalog, executes real actions through transaction and observation owners, validates actual output, checks canonical effects, and tests cancellation/unknown fields. `e2e/basic-api-actions.spec.ts` runs every entry. | The native schema catalog tests alone do not prove these effects. This is not an exhaustive input Cartesian product. |
| Every delivered tool has the current input/result contract | `api-delivery-audit.integration.test.ts` enumerates actual registrations, follows selected scope/paging, compares canonical schema meaning, and checks every real admission rejection. Production handoff checks independently compare the fixture registration with provider registration. | Rejection of null alone does not prove successful domain behavior; owner and browser cases supply that evidence. |
| Knowledge bodies and examples agree with current tools | Corpus tests load the actual package; executable examples are admitted against published selectors. Runtime graph cases cover dependency authorization, cycles, overrides and missing bodies. Actual native successor tests inspect complete bytes and retained references. | A prose pattern scan cannot understand arbitrary advice, and a schema-valid example is not evidence that a model followed it. |
| Source/reference acquisition is separate from drawing | `reference-image-download.test.ts` checks DNS pinning, mixed/private addresses, redirects, size/MIME, cancellation and bounded transient reads. `local-image-tools.test.ts` checks the real worker/parser, native regions, original pixels above four megapixels, concurrent reuse and foreign identities. | Download or conversion success does not authorize a canvas mutation or establish visual fidelity. |
| Geometry compilation preserves current coordinate/material semantics | Preparation, projected-ellipse, shared-motif, design-pattern and material tests check exact geometry and owner work counts; browser construction cases check canonical editable results and Undo. Target-parent conversion and relative group coordinates are distinct from world-space material fields. | Shared templates do not become SceneTree shared elements; optional representative review is not admission. |
| Reuse saves work without changing validity | Preparation tests assert measure/compile counts, immutable lookup and changed-source recomputation. Knowledge tests assert body/provenance reads. Lease tests exercise actual transfer, borrowed siblings, active children, incomplete cleanup and request boundaries. | Reusing a function or seeing equal output does not establish computation reuse. |
| Partial completion remains a real state | Actual native durable-save recovery and Host prefix tests preserve successful work and retry storage only. Runtime callback receipts preserve failed action identity and real settlement. Final HTTP batches have no same-turn continuation callback. | Tool failure does not require termination, but uncertain writes do not become safe to replay. |
| Ordinary conversation history differs from the retained evaluation session | Controller cases check history projection and fresh current targets; native report cases assert original thread identity, distinct later turn identities, explicit close and rejection after close. | Ordinary history does not preserve request-local capabilities. Named portable values and report-session retention are separate mechanisms. |
| Progress/UI remain observations | Controller, presentation, component and browser cases check ordering, stale/duplicate events, question/terminal segmentation, scroll/focus/IME, navigation and independent user Undo. Runtime progress failure cases exercise observer exceptions. | An activity label cannot prove provider reasoning or completed drawing. |
| Formal case completeness is independent from file presence | Collected names come from native declarations before the assessed execution. Omission, substitution, duplication, skipping, collection errors and count disagreement reject. The formal Flow publication counterexample removes an unselected sibling while retaining the selected passing case. | Collection cannot discover an absent test requirement; manual spec review and explicit semantic cases remain separate. |

The retired executable names `describe_design_apis`, `run_recipe`,
`execute_design_batch`, `correct_input` and mandatory `dataEvidence` have no current
runtime or Knowledge route in the reviewed owners. Remaining mentions are rejection
assertions or immutable historical provider fixtures. Those records are not loaded
as current instructions and are not compatibility implementations.

The remaining mechanical iteration requirements apply only after a caller chooses
that operation: typed checker status, stable unresolved progress, authorized repairs
and a next check. They do not impose a global visual completion gate. Similarly,
required Knowledge dependencies apply to an explicitly selected read, not to all
conversations. The composed-stage test asks for an end-of-stage capture; the product
does not require every stage to capture.

## Responsibility review

- `execute_design` coordinates known steps, bindings, iteration and delivery. It
  delegates geometry, canonical writes, permissions and resource ownership. Its
  multi-step input is not evidence that a primitive owns unrelated responsibilities.
- Search and contract acquisition are separate. Knowledge supplies advice, not
  schemas, permissions or task completion. The active specs no longer contradict
  these boundaries.
- Common-API results remain owner outputs. Adapters explicitly serialize/select
  values and construct valid downstream arguments. A different output/input shape
  is not itself a defect; missing semantics, hidden narrowing or lost state is.
- Validation failure ends the affected operation/dependency, not automatically the
  native conversation. Uncertain writes remain unsafe to replay. HTTP's final-batch
  boundary is documented rather than presented as same-turn native recovery.

## Evidence limits and remaining acceptance

The preceding review found a separate old-test conflict in
`e2e/crdt-endpoint-performance.spec.ts:3597`: the guarded 7,076-element endpoint
benchmark expects user keyboard/tool events to remain blocked between cooperative
creation slices. Its `blockedActionAttempts` report also encodes those expectations.
This is not an atomic in-member validation: events are sent while waiting for
half/three-quarter creation progress. It contradicts the current finite-member
contract and the actual transaction/interaction integration tests. The file is not
selected by the conversation verifier. Therefore a passing conversation run cannot
certify that benchmark or justify accepting the whole manual coverage criterion.
At that review checkpoint, the approved contract-only extension excluded benchmark changes and a 7,076 run;
this report preserves the gap rather than silently deleting its assertions or
reclassifying it as passing. Correcting it requires replacing the old interaction
scenario and its report consumers while preserving fixed creation/collaboration
work and timing guards. No production lock should be reinstated to satisfy it.

This review found no additional demonstrated product-runtime regression in the
reviewed handoffs. That is not a claim that arbitrary future inputs or model
choices are correct. The whole-feature source baseline preceded this verifier and
spec change; it cannot be relabeled as execution of the new checker.

Native collection establishes declared runnable identities. It cannot detect a
behavior for which no test was authored, or a test that both collection and execution
omit due to the same source condition. Independent specification review, explicit
required semantic cases and negative controls remain necessary. Node declaration
collection executes its test parents; it is not advertised as a free static scan.
A provider fixture scripts model responses while exercising the actual native
transport. It proves delivered data/state and recovery, not model reasoning.

No 101, live model benchmark, repository-wide local test, commit or push is part of
this task. Final focused results and any complete feature-run outcome are recorded
below without converting test counts into semantic acceptance.

## Current verification

- Test-first report regression: 14 existing tests passed and six new negative
  controls failed before the owner change (`tmp/conversation-case-completeness-red.log`).
- Shared report/publication/collection/scope tests: 65 passed, zero skipped
  (`tmp/conversation-case-focused.log`). Real Node, Vitest and Playwright collection
  is exercised; Vitest execution is separately reconciled with the collected list.
- Actual-native Knowledge delivery and contract disclosure, coordinate mapping,
  reference delivery and corpus selection: 12 selected cases passed
  (`tmp/conversation-spec-handoff-focused.log`). The filter left 41 unselected cases;
  those are not additional passes.
- Capture scheduling owner tests: eight passed, verifying no implicit measurement,
  zero deferred reads, unknown-settlement protection, cancellation and independent
  optional context operations (`tmp/conversation-review-scheduling-focused.log`).
- Actual-native save-only retry and two armed-recorder Knowledge recovery variants:
  three selected cases passed (`tmp/conversation-recovery-review-focused.log`).
- Initial whole-feature run `tmp/conversation-proof-cCPViv` was explicitly interrupted
  during Server execution after the independent Local Provider review found further
  obsolete mandatory-review prose. Its collection contained 3,704 cases; it is not
  passing execution evidence. The conflicting paragraphs were corrected before rerun.
- Whole-feature run `tmp/conversation-proof-YChR8U`: all 3,704 Server assertions
  passed, but the collector used CLI display titles, which differ from JSON report
  identities for nested suites. Strict reconciliation correctly refused acceptance
  but its input normalization was wrong. Publishing the large mismatch set also
  exceeded the Flow document bound. Neither failure is a product-tool failure.
- Permanent actual-runner regression `native nested collection retains independent
  identities and exposes within-file omission` failed before repair. The collector
  now walks public Vitest test/suite objects; it does not split or replace ` > `.
  Parameterized names and literal separators survive collection and actual execution.
  All 3,704 collected Server identities reconcile with the earlier actual Server
  report after this correction (`tmp/conversation-server-reconciliation.json`). This
  is a collector check, not a substitute for the final source-bound whole run.
- A 1,400-issue publication counterexample failed before repair. The current
  orchestrator writes every issue to its artifact, then publishes its count and
  location through the existing Flow adapter. The regression checks actual Flow
  invalidation and recovery; no document size limit or status validation is relaxed.
- Run `tmp/conversation-proof-TqlFoN` was explicitly interrupted during Server
  execution after manual scheduling review found remaining implicit-measurement
  promises in Design Preparation and Local Provider. Existing owner tests and
  `finishInspection` contradict those obsolete clauses. They were corrected before
  another run; this interrupted execution is not passing evidence.

### Final source-bound execution

Run: `tmp/conversation-proof-7HhRka`.

| Group | Selected files | Independently collected cases | Actual passed cases | Missing, failed or skipped |
| --- | ---: | ---: | ---: | ---: |
| Server | 101 | 3,704 | 3,704 | 0 |
| App | 137 | 1,489 | 1,489 | 0 |
| Runtime | 34 | 524 | 524 | 0 |
| Node verification and contract owners | 56 | 644 | 644 | 0 |
| Browser | 24 | 335 | 335 | 0 |
| Total | 352 | 6,696 | 6,696 | 0 |

`summary.json` records `executionStatus: passed` and zero issues. Before/after
source, compiled-export and required-definition snapshots are identical. Every
tracked verification process settled. The command exited 2 because the independent
manual criterion was still unaccepted; this is not a failed test or a timeout.

Final focused checks: 91 verifier/authority cases, 13 transaction/interaction cases,
and the 43-case authority/workspace selection check passed. These overlap the whole
run and are not added to its 6,696 total. Naming, touched-code lint and scoped diff
checks passed. The nested Vitest collection, omitted within-file sibling, missing
referenced Inspector selection, stale secondary contract and oversized publication
counterexamples were observed failing before their corrections.

After execution, the formal `spec-coverage-review` observation was explicitly
**rejected** for the unresolved endpoint benchmark consumer conflict. The later
`manual-review.json` records that decision; the original automated summary remains
unchanged. The Flow therefore does not present the whole feature as accepted.
The clause review is complete as a review with an open finding, not a claim that
every consumer is already consistent. No product runtime changes or compatibility
paths were added in this task, and no validation rule was weakened.


## Endpoint interaction evidence reconciliation

The subsequent authorized task replaces the obsolete high-detail interaction
scenario, rather than reinstating document locking. `duringCreation` now records
actual keyboard and pointer activation while the turn is active and canonical
progress is partial. Empty Delete/Undo probes and event-prevention conclusions are
removed. The existing streamed browser case remains the independent edit/history
oracle: it creates a real user element between AI members, undoes only that edit,
then stops AI and verifies its grouped Undo/Redo.

The report guard previously discarded nested `localInteraction` evidence. The
current producer and admission owner share strict evidence normalization. Missing,
old, contradictory and undeclared evidence rejects completion; other proof kinds
retain their own contracts, without a legacy endpoint branch. The endpoint source
now participates in the maintained conversation typecheck. JSON bounds, decreasing
counters, receiver summary DTOs and optional browser arguments have their actual
types; no casts or relaxed runtime contracts were introduced.

Permanent regressions failed before repair for report loss, eight invalid report
forms, stale benchmark assertions and Inspector/BDD lock rules. Self-review found
additional loading/proof-owner lock clauses; the strengthened owner regression
failed before those clauses were removed. Historical run records are unchanged.

Focused evidence:

- `tmp/endpoint-contract-focused-final.log`: 131 guard, scenario and Inspector
  cases passed; the final owner-clause check also passed all 25 Inspector cases in
  `tmp/endpoint-owner-authority-green.log`.
- `tmp/endpoint-owner-focused-final.log`: 13 transaction/interaction tests passed.
- `tmp/endpoint-interceptor-focused.log`: seven prepared-response tests passed.
- `tmp/endpoint-user-history-browser-final.log`: the real streamed edit/Undo/Stop
  browser case passed. The preceding startup failure is preserved separately:
  Vite returned HTTP 504 `Outdated Optimize Dep` for Pixi's renderer module while
  the production build was running. Restarting after the build passed without
  changing the case or product behavior. Do not run those build/browser gates
  concurrently when they share generated dependencies.
- `tmp/endpoint-current-proof.log`: current production artifact, fixed 7,076
  elements and two independently owned actors; guard finished without a stop,
  missing raw sample or attribution invalidity, and all six process groups exited.
  Actor A completed in 10,028 ms, Actor B converged in 15,031 ms, and total creation
  flow took 15,199 ms, within unchanged 15/30/45-second gates. Actor A retained one
  history entry; Actor B retained none, with zero echo and persistence work.
- The authenticated final report preserves keyboard activation at 3,607 canonical
  elements and pointer activation at 5,431, both active-turn/loading observations;
  completion preserves 7,076 elements and keyboard/pointer availability. The
  terminal diagnostic counter buffer is bounded: its milestone samples describe
  retained observations, not exact first-threshold times. Earlier loading and
  partial-progress obligations are separately asserted live during the run.

Whole-feature execution and independent manual acceptance will be recorded after
verification of the final source. Passing the endpoint alone does not accept the
conversation feature. No 101, full repository test, compatibility or product lock
was introduced.


### Whole-gate fixture iteration

`tmp/conversation-proof-VcruD7` failed one Server case after 5,134 ms and was
explicitly interrupted before continuing the remaining groups. Its JSON carries a
runner stack without a specific assertion message; this alone is not evidence of
a production contract bug. The focused file passed 24 cases, but the combined
catalog/execution case still took 4,760 ms against its default 5-second guard.
That case mixed the independent 10,000-entry catalog comparison with actual
execution, history, retained-prefix recovery and native delivery validation.

The two obligations now have independently collected current case names, unchanged
input volume and assertions, and the unchanged default time limit. Preset setup is
file-scoped; each case resets the canonical document and disposes its own hosts,
queries and reviewer. An intermediate focused failure caught duplicate Preset
registration before this initialization boundary was corrected. Measurements now
attribute the 10,000 entries only to the actual catalog case. The final focused
file passes all 25 cases, with the two separated cases at 2,936 ms and 4,002 ms
(`tmp/endpoint-batch-split-final.log`). No production behavior, comparison threshold,
validation or timeout changed. The interrupted whole run is not acceptance.


### Final authority review correction

`tmp/conversation-proof-ocKNuU` passed 6,707 cases with exact collected identities,
zero execution issues and identical before/after source, compiled and definition
snapshots. Manual acceptance was still withheld: the endpoint Inspector retained
two additional sequence conditions requiring blocked input at 50/75-percent
milestones, and the positive source-contract test still required those strings.
The negative owner regression failed for that residual contradiction before repair
(`tmp/endpoint-final-owner-red.log`). Both conditions and their positive tests now
follow the actual pan, zoom, keyboard, selection-reset and pointer sequence.

The bounded manual recheck inspected every lock/block/transaction/rollback occurrence
in the affected Inspector and tests (`tmp/endpoint-current-authority-review.txt`
and `tmp/endpoint-current-authority-tests-review.txt`). Remaining locks concern
inactive request-wide lock observations, finite canonical member admission, atomic
History application or collaboration ingress; none requires locking users across AI
waits. Obsolete endpoint field names remain only in rejection regressions. Historical
measurements are retained as history, not asserted as current interaction behavior.
The generated workspace is rebuilt. Product code and the already executed guarded
endpoint scenario are unchanged; whole-feature acceptance requires the final-source
run below, not the preceding automated pass.


## Previous automated checkpoint - semantic acceptance withdrawn

The acceptance conclusion below was incorrect: these successful executions also
protected a superseded public result selector. The current manual criterion is
reopened. These historical counts prove execution and case reconciliation only,
not compliance with the current single-delivery contract.

Historical run: `tmp/conversation-proof-MCCmiU`.

| Group | Selected files | Independently collected and passed cases | Issues |
| --- | ---: | ---: | ---: |
| Server | 101 | 3,705 | 0 |
| App | 137 | 1,489 | 0 |
| Runtime | 34 | 524 | 0 |
| Node verification and contract owners | 56 | 654 | 0 |
| Browser | 24 | 335 | 0 |
| Total | 352 | 6,707 | 0 |

All identities reconcile, with no missing, extra, skipped, failed or flaky cases.
Source, compiled-export and required-definition snapshots are identical before and
after execution. Every tracked process settled successfully. The automated command
exited 2 because the separate manual review was stale, not because tests failed.
The immutable `summary.json` preserves that sequence. After the documented clause
review and guarded endpoint evidence were checked, the formal Flow store accepted
`integration/spec-coverage-review` at its actual current binding.
`manual-review.json` records all owner nodes and integration as `done`.

The final authority correction changes no product code or endpoint scenario, so the
already recorded production guarded proof remains the direct execution evidence.
The additional whole run verifies the final Inspector/test/source combination.
Temporary startup and overgrown-case failures, both manual-review discoveries and
all iterations remain visible above. None was bypassed with a compatibility branch,
weaker validation, smaller workload, larger budget or a product interaction lock.
No 101, live provider drawing, full repository local test, commit or push ran.
The former semantic acceptance at this checkpoint is withdrawn. Its successful
execution does not establish the single-delivery contract; the corrected current
source and its independent review are recorded above.
