# Composable Domain Knowledge V1

Status: **Task 3 vector delivery identity reduction is in progress. E2E execution continuity is locally complete and pushed as f5ad084ff. No model/101, CI inspection or push is authorized for this slice.**

Previous checkpoint: **Issue 1 deterministic delivery work complete and verified at Inspector revision 38. Issues 2 and 3 are complete within the bounded contracts. Inspector revision 42 and one recorded 101 run passed.**
The checkpoint is `c187aaf19`. Subsequent implementation remains local and is the
source of the completed Knowledge-only run `1792471047468`. This revision explains
its remaining discovery, material-judgment and status findings. Those earlier live-run
authorizations belong to historical checkpoints; only the current bounded correction
below governs this follow-up. Never automatically retry a model run.

Previous authorized follow-up - 2026-10-24: close and push the locally verified
projection slice, then run one 101 observation with 120 seconds of work and at
most 60 seconds of reporting, no video and the production 10,000-node limit.
Preserve complete provider input/output, report text and screenshots; analyze
recent handoffs separately from AI behavior and timings. Do not modify product
behavior, retry the model run, query CI or infer unobserved recovery success.

Follow-up result: pushed `ca73c1708` and completed the single authorized run
`1792830831162`. Work stopped at 120 seconds; reporting/UI settlement finished at
134.522 seconds. First content: 80.545 seconds. Result: partial, two failed visual
criteria, 10,374 created elements, durable sequence 327/327. Actual UI projection
reuse and compact delivery were observed; no earlier first-frame claim. All
referenced payload/image bytes verify, but one interrupted native agentMessage
span lacks a completed event. See
[the bounded live report](../evaluations/2026-10-24-ui-projection-101.md).
No additional run, implementation, push or CI inspection is authorized by this result.

## Current authority and task boundary

This is the single active plan. The three proposed issues below replace the prior
four-issue execution sequence and its completed execution instructions. Completed
plans, immutable reports, recordings and input/output are unchanged. The canonical
shared-property contract and fixed evaluation rubric below remain authoritative.

- Worktree: `.worktrees/design-knowledge-evaluation`.
- Branch: `codex/design-knowledge-evaluation`.
- Selected main: `eaddcdba2c1705dca6646a730cd87818ae214d56` (integrated for the authorized convergence push).
- Task association: **Task 3 - Asyra Design integration**.
- Current scope: vector delivery identity reduction only, as bounded below. No geometry recomputation, new tools, model/101, CI or push.
- Complete one issue's owner slices, direct-consumer integration and full bounded
  review before advancing. Do not create an older broad goal or automation.
- No Asyra Skill, extra model calls/reviewers, monitoring, subagents or completed-plan
  edits. Previous push/goal/live-run authorizations belong to completed historical
  stages and do not authorize another invocation.

### Direction and non-negotiable boundaries

- Knowledge is portable advisory domain information. App guidance owns capability
  selection and task-specific application. Tools own deterministic mechanics; the
  main agent owns visual judgments. No additional reviewer model, compulsory
  Knowledge read, aesthetic scoring gate or case-specific drawing answer.
- Reuse the canonical registry, invocation, review bindings/results, provider events,
  activity state machine, property/history and persistence owners. No second registry,
  purpose store, review ledger, intent classifier, scheduler or automatic evolution.
- Remove contradictory current instructions and superseded behavior in the affected
  owner slice. Do not remove valid independent/local editing, full schema retrieval,
  current recovery paths or archival evidence as if they were compatibility shims.
- Preserve narrow evidence invalidation, unrelated passes, canonical local/source/
  reset/detach distinctions, Undo/Redo, collaboration, compensation and save recovery.
- App model remains `gpt-6-astra` / `medium`. Future explicitly authorized 101 runs
  use the explicitly authorized work budget, independent bounded report phase and
  full I/O preservation. Video is disabled by the current user instruction.
  This plan itself does not authorize a run.
- Saved-input replay proves tool contracts, not better model decisions. Neither lower
  call counts nor object counts nor one historical runtime difference proves efficacy.

## Evidence baseline and limits

The pushed checkpoint contains the shared-property implementation and its completed
owner verification. Before that push, all 2,662 files in the live run's frozen source
manifest matched disk. Applicable source-matched implementation gates were retained;
task context, naming, generated documentation, changeset checks and staged review
were completed. This does not claim another broad test run or a fix for the findings
below. Reports retain their original execution-time status, including earlier failures.

Pre-implementation baseline evidence: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792446670972/`
(`generation-analysis.json`, `analysis.json`, `run.json`, preserved provider records,
checkpoint and recording). The durable summary is
[the recorded acceptance and root-cause report](../evaluations/2026-10-20-101-shared-property-acceptance.md).
Source digest: `b1c989fd3beaed33039cf7742e80a83e6419bc20ddf0a25528f6549a5485825b`.

| Observed result                                                              | Evidence limit                                                                                                             |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Completion 342.679 s; first content 75.808 s                                 | Not a controlled Knowledge effect or a promise of future runtime                                                           |
| 48 outer App calls; nine discovery calls; 320,292 discovery response bytes   | Backend payload availability does not prove full model-visible delivery or comprehension                                   |
| Final 14 pass, zero stale; visual coverage 5/5                               | Tool/main-agent judgments, not independent proof that material continuity is correct                                       |
| Durable sequence 709/709; fresh reload root/order/generation/receipt matched | The live oracle did not compare every property; new material regressions must compare relevant complete values             |
| One drawing stream and one host-only publication stream                      | No extra review model in this run; native provider internals remain unavailable                                            |
| Portable architecture revision 4, App method revision 14                     | Separate portable advice, delivered App instructions and actual arguments; revision labels alone do not establish adoption |

Call indices below are zero-based in `generation-analysis.json`, drawing stream 1.
Recorded artifacts are immutable. Formal regressions must preserve their relevant
inputs and values in project-owned fixtures, with minimal unrelated content and
explicit derivation, rather than depending on ignored local `tmp/` at test time.

## Task 3 - Asyra Design integration

### Mechanical review structural reads - 2026-10-25

Status: bounded implementation, formal local verification and self-review
complete. No model, 101, CI inspection or push; first-frame effects unmeasured.

Evidence: run 1792853203510, raw provider sequences 309/312, 488/491 and
553/556, verified input/output length and SHA-256. Three captures evaluate
2,311 / 6,164 / 641 nodes with the same metadata-read counts and no cache reuse.
The default reviewer read adapter, its structural-field consumer and Core full
snapshot getter match the historical source segments. Each structural read saves
and clones complete element data although props references are not consumed.
The three handler durations total 82.3 ms, including required work; isolated
copying latency and first-frame improvement are not established. Scoped visual
containment was not invoked in this run and is excluded from this slice.

Step Execution Card - inspect / mechanical structural reads:
- Objective: use existing scalar metadata and complete detached child queries
  for the reviewer structural input, avoiding full element saves and unused
  property-reference copies. Preserve the exact mechanical output and lifetime.
- Inputs: current canonical target identity, metadata and ordered direct children;
  unchanged computed geometry, text measurements and canonical change events.
  Outputs: unchanged verdicts, full findings, coverage, receipts and store handoff.
- Owner: existing App reviewer adapter under inspect. Core metadata and child
  query owners supply facts; reviewer retains existing verdicts and invalidation.
  Failure owner remains inspect; advice bypasses drawing review.
- Conditions: query a complete child list only when metadata reports children;
  do not turn absence, invalid hierarchy, unsupported geometry, cancellation or
  a mixed document into a pass. Preserve leaf handling, Group/Frame distinction,
  oval bounds, text, hidden nodes and standalone full-data queries.
- Contributors: existing Core public metadata/children/computed APIs, reviewer,
  registered review action, change observers and check store. No new API, cache,
  registry, state, model call, transport turn, geometry or renderer modification.
- Implementation boundary: apps/asyra-design/src/common-apis/design-review.ts.
  Tests: new server/__tests__/mechanical-inspection.integration.test.ts using
  real canonical owners and the existing recorded vector-delivery fixture;
  existing reviewer/action/mechanical-closure tests and Inspector proof. Wire the
  new suite into the existing server harness; architecture inventory guards it.
- Spec references: mechanical review structural reads and existing evidence,
  capture/reviewer responsibility and mechanical coverage-selection contracts.
  Inspector: inspect conditions, contributors, boundaries and existing cache
  dimensions (unchanged). Existing mapped proofs retain their product semantics;
  the separate real-owner integration gate is mandatory, not implied by proof.
- Naming: reuse read/getElementMetadata/getElementChildren and current wire
  fields; no persisted identity or compatibility path. New test names describe
  generic behavior, not a subject-specific route.
- Gates: admission, naming, formal red, real-owner and direct-consumer integration,
  cancellation/invalidation/recovery, production types/build, focused lint,
  architecture inventory, update notes and final Inspector verification. Existing
  browser inspection/reload gates cover read-only document preservation. Freeze
  source during verification. No model, 101, CI inspection or push.
- Stop: fixed DoD satisfied; missing existing capability or different production
  owner required; three failed implementation corrections. Do not broaden to
  visual scoped validation, numerical algorithms or unrelated snapshot consumers.

Fixed DoD:
1. First reproduce through actual review action, default adapter and real Core
   owners. Count element saves, full reads, cloned property references and child
   queries; formal fixtures never depend on ignored tmp. Existing injected-reader
   tests alone cannot prove the adapter's copying behavior.
2. Structural reads perform zero complete element saves and zero unused property
   reference copies. Leaves issue no child-list query; nonempty containers return
   all children in order, without the default 50-item page truncation. Keep
   detached immutable observations and legitimate full-data reads.
3. Preserve exact findings, completeness, supported-rule verdict, coverage and
   progress for Group/Frame, rotated oval, text, hidden/missing targets and invalid
   hierarchy. Compare actual saved-input-derived designs and generic boundaries;
   distinguish unavoidable computed/measurement work from structural copying.
4. Unchanged reviews reuse existing verdicts; local geometry/membership/ancestry
   changes invalidate only the appropriate evidence. Cancellation, load/disposal
   and mutation during cooperative yields cannot publish current mixed evidence.
5. Exercise review action -> receipts -> existing check store/recovery; preserve
   partial results and never replay writes. Reads do not change saved documents,
   selection, Undo/Redo depth or collaboration publications; preserve reload
   invalidation. No new cache or model-facing exchange. Reduced work, not model
   adoption or first-frame timing, determines this bounded task's success.

Validation and self-review:
- Admission accepted review
  a298544ee7d61926fab826cf4694dac70f196c3e1451ff38e4803e276ffe0824
  after candidate 2a86d50c-ed7e-4d1f-9378-636e9cb3c333 passed 77 cases.
  The original injected-reader reviewer/action/store suites passed 37 tests and
  did not detect the default-adapter copies. The new real-owner suite is wired
  into ordinary test:server-response-harness and its inventory guard.
- Formal red (mechanical-read-red-confirmed.log): three saved-input-derived
  cases passed semantic, coverage and read-only assertions, then failed the
  work-count oracle. Two additional preservation/recovery cases already passed.
  Actual Element.save/full-read counts were 2,311 / 6,164 / 641; copied props
  reference counts were 23,104 / 61,634 / 6,068. Tests use existing permanent
  source fixtures, official preparation/dispatcher/Runtime/transaction creation,
  the actual review action and default reviewer adapter. No tmp input dependency.
- The production change is confined to the existing default read adapter:
  getElementMetadata, plus getElementChildren with the exact positive childCount.
  Afterward all three cases perform zero full reads, zero Element saves and zero
  unused props reference copies; each nonempty root performs one complete child
  query, and no leaf performs one. Required geometry/text owners are unchanged.
  This removes 9,116 saves and 90,806 unused reference-copy entries in these cases;
  it is not a heap-byte or isolated latency measurement.
- Real output matches a full-read reference for findings, completeness, covered
  order, verification/progress and work decisions. Repeated capture reuses the
  existing receipt and verdicts. More than 50 children remain complete; nested
  Frame/Group and rotated oval behavior is preserved. Independent receipts survive
  unrelated changes; the exact required re-evaluation targets after a local edit
  include the leaf, ancestors and an oval whose standalone traversal context must
  be restored when entering its Frame. That fourth read is valid containment work,
  not a relaxed work-count expectation. Existing text/invalid-hierarchy cases pass.
- Cancellation through the observed review action leaves the earlier successful
  check available; retry closes the existing mechanical selection. Dispatched
  actions remain reads/validation only. Mutation during a cooperative yield
  produces no current receipt. Membership changes and reload invalidate evidence;
  undo/redo, detached child observations, saved document, selection, history depth
  and absence of read-induced shared publications remain asserted.
- Final direct gates passed 48 cases across appropriate jsdom/Node environments:
  reviewer, review action, mechanical store closure, new real-owner regression,
  existing image preflight and metadata/creation integration. A combined command
  initially put the existing file-URL metadata suite in jsdom and failed before
  its cases loaded; its unchanged formal Node invocation then passed 2/2. No
  assertion or production change was made for that invocation error.
- Browser verification passed four cases in 36.4 seconds: mechanical grouping and
  stacking receipts, server/browser freshness with history/reload and transport
  recovery, large/native image capture and multi-root workspace preservation.
  Test-owned ports were released; no source changed during gates. Real model
  inference is explicitly forbidden by these fixtures.
- Production types/build, architecture inventory 13/13, naming 15/15, update notes
  and diff checks passed. Focused lint has zero errors and one diagnostic console
  warning; production build retains its existing large-chunk warning.
- Final Inspector run 80c7ff06-f550-4ae8-8769-517119db1a8d passed 77/77,
  zero failed/pending, revision 116, source
  a7404515b1e02b426e55d66f8b53c3a850a10fd9315dade388eb7f72f44b0ae8.
  All 886 captured source inputs match the checkout. Workspace source collection
  intentionally excludes ordinary __tests__ files; the new regression is executed
  independently via the ordinary harness and is not claimed as a mapped Inspector
  case. Inspector success alone does not establish real-owner copy counts.
- Self-review covered the adapter, complete child-page arguments, missing/empty
  behavior, Core capability ownership, current snapshot lifetime, reviewer cache
  context, direct consumers, read-only state and failure/recovery paths. No API,
  schema, tool description, cache, renderer, persistence, mutation or fallback
  path changed. Existing full-data reads remain legitimate independent operations.

### Image preflight supplemental architecture failures - 2026-10-25

Status: both supplemental failures repaired and locally verified; image
preflight retained. No model, 101, CI inspection or push.

Evidence and classification: the architecture gate fails on the unchanged baseline
as well as the image-preflight checkout. The single-module assertion predates the
shared analytic oval dependency, but the current utils root import also brings
unrelated modules and lodash into the pure backend entry. Preserve shared geometry
ownership and replace that dependency edge, not the geometry calculation. Four
maintained server suites are absent from ordinary validation; two delivery suites
have a dedicated command but that does not satisfy ordinary validation coverage.
Native cases use version-pinned local Codex with loopback fixed responses, isolated
project-local state and cleanup receipts; they do not invoke a real model.

Step Execution Card - prepare / pure geometry dependency:
- Inputs: existing finite rectangles and typed rotated ovals. Outputs: unchanged
  analytic Group bounds and prepared artifacts; no new persisted or wire fields.
- Owner: Preset Group bounds consumes the existing Utils geometry calculation.
  Expose the existing geometry-bounds module through a narrow public subpath;
  retain the independently valid Utils root exports. No copied math or new owner.
- Conditions: preserve empty, invalid, reversed rectangle and rotated oval cases;
  no Core, Render, DOM, registration, lodash or unrelated Utils module in this
  entry graph. Advice/direct edits bypass preparation. Failure owner is prepare.
- Allowed contributors: existing public pure geometry; no canonical writes,
  model calls, additional caches, state or rendering changes.
- Implementation: packages/utils/package.json, packages/preset/src/group-bounds.ts;
  exact graph regression in the App architecture suite; the existing proof
  configuration maps the public subpath to captured source, not workspace dist. Existing geometry tests
  and projected-ellipse/shared-pattern consumers verify numerical equivalence.
- Contracts: projected ovals in the execution spec; prepare condition and allowlist;
  Utils/Preset package docs, App backend boundary and this Task 3 section.
- Naming: reuse geometry-bounds and its existing exports; new public subpath only,
  no persisted identity migration. The package maps the same declaration for
  the repository current Node type resolver and export-aware consumers.
  Run naming before and after implementation.

Validation segment - maintained server suite reachability:
- Owner: existing App package validation scripts and architecture guard. Add the
  four omitted suites to the existing server harness; keep standalone native
  delivery invocation and the all-maintained-suite assertion. No skips or new
  runner/registry. No product-flow step is introduced for package script wiring.
- Boundary: apps/asyra-design/package.json and its architecture regression suite;
  App workflow documents the no-model native prerequisites. Production owner
  behavior and retained fixture/source evidence remain unchanged.

Fixed DoD and closure:
1. Preserve the two original failing gate results. Before production edits,
   prove the exact pure-geometry graph test fails on the existing barrel import.
   Do not replace it with a general permission for all Utils dependencies.
2. Public packaged Group bounds contains only its entry and the existing pure
   geometry-bounds calculation, with no external or dynamic imports; unused
   point-transform code is tree-shaken from this consumer. Verify
   the compiled export against reversed rectangles, empty input, nonfinite input
   and analytic rotated oval expectations; retain one mathematical owner.
3. Every maintained server suite remains required by ordinary validation, and
   all four newly included files actually execute without a real model. Preserve
   version checks, captured next requests, cancellation, source/page invalidation,
   observation limits, test budgets, cleanup and evidence assertions.
4. Preserve the image-preflight diff and rerun its focused real-owner regressions.
   Run exact architecture suite, affected geometry/preparation tests, production
   types/build, naming/lint/docs checks and final Inspector proof. Review the diff
   and direct consumers only. No full local CI, model/101 or CI inspection.
5. Stop after bounded gates and self-review; report any unavailable native
   prerequisite instead of skipping or inventing success. No push in this slice.

Validation and self-review:
- Original architecture run failed the two unchanged baseline checks. The revised
  exact-graph regression and unchanged inventory assertion both failed before
  production edits (architecture-handoff-red-final.log); the graph failure showed
  unrelated Utils modules and lodash, not a numerical mismatch.
- Contract admission accepted review
  a93f67bb29bd9b1b31b929a0be94896c31647aace4ad914e23c9023c78ed217d
  after candidate 81951af2-80ca-4ec6-96a0-c2edd77d6bc1 passed. Captured-source
  subpath resolution was subsequently accepted under review
  6b7280de153d5ab0fd0fe5216a7d158af55bb44d6a5f0de8c1b420e551751b3d.
- Production changes are the Utils public export/declaration mapping and one
  Preset import. No geometry implementation changed. The packaged bundle retains
  exactly Group bounds and geometry-bounds, with zero external/dynamic imports;
  root and subpath resolve the identical calculation function. The compiled
  output passes empty, reversed rectangle, invalid and analytic rotated oval
  assertions. Utils/Preset builds validate the existing Node type resolver too.
- The four omitted suites are in the existing ordinary server harness; the full
  inventory assertion and standalone native-delivery command remain intact.
  Actual newly connected suites passed 20/20, zero skips, using local Codex
  0.160.0 against fixed loopback responses only. Their native request observations,
  disconnected-output evidence, cleanup, paging/recovery and budget assertions
  passed; this is deterministic handoff evidence, not model adoption evidence.
- Final architecture suite passed 13/13. Utils geometry and Preset Group tests
  passed 27/27; projected oval and image-preflight/evidence/dependency tests passed
  57/57. Both browser inspection cases passed in 28.4 seconds, preserving large
  overview/native region, independent workspace roots, rotation/order/occlusion,
  read-only history/publication and strict save/reload evidence. Test-owned ports
  3027, 4127 and 4227 were released. No source edits occurred during those gates.
- App production types and build passed; build has its existing chunk-size
  warning. Focused ESLint has zero errors and two retained diagnostic console
  warnings. A missing explicit Node Buffer import in the new bundle assertion
  was fixed before final lint/architecture verification. Naming passed 15 checks;
  update guidance, pending changeset policy and diff checks passed.
- Final Inspector run 15ead56e-1576-445d-a36a-ac0c5bd1e03c passed 77/77,
  zero failures/pending, accepted revision 115, captured source
  953268c551ae5a1d9fe2893e4559732323914eff8d230d76a3ec46b492cacb33.
  All 886 captured inputs match the checkout, including actual Utils geometry,
  Preset Group bounds and the explicit source alias. The separate architecture
  and browser gates ran against the final working tree; they are not implied by
  Inspector success. No whole-App/local-CI or live-model completion is claimed.
- Bounded review covered the package export and current compiler resolution,
  exact bundle closure, unchanged shared mathematics, production backend import
  restrictions, test inventory reachability, native isolation/cleanup, direct
  preparation consumers and preservation of the original image-preflight diff.
  No duplicate owner, calculation, cache, registry, persisted identity or recovery
  route was introduced. Existing root imports remain legitimate independent APIs.

### Image inspection target preflight - 2026-10-25

Status: bounded implementation and required local verification complete. The
two supplemental architecture failures recorded below were subsequently repaired
and verified in the authorized section above; no whole-App green claim.

Evidence: run 1792853203510, provider sequences 315/318, 500/503 and 583/586
capture two groups and the workspace. Input/output lengths and SHA-256 match the
raw receipts. The group creation inputs and checkpoint contain identical ordered
child lists of 2,310 and 6,163 IDs; workspace contains three roots. Inspection
preflight calls Core.getElementData, which saves and clones the complete element,
then consumes only existence/type. The workspace branch additionally queries
metadata for childCount. The inspection implementation and full-data getter are
unchanged from the saved source. Historical handler times include actual capture;
they cannot establish the isolated copying cost or expected first-frame benefit.

Step Execution Card - inspect / target preflight:
- Objective: obtain target existence, type and child count once through the
  existing scalar metadata facade; do not serialize full children or properties
  merely to decide whether and how the current snapshot owner may capture.
- Inputs: target ID, overview/detail and optional local region; current canonical
  metadata and current workspace identity. Outputs: unchanged capture arguments,
  image/receipt or precise unavailable result. Read-only advice remains a bypass.
- Owner: App inspection common API within inspect; Core metadata supplies facts,
  snapshot owner produces pixels, evidence owner controls freshness. Failure owner
  remains inspect. No cache or retained state is introduced.
- Conditions: keep missing/noncurrent/empty workspace and unsupported workspace
  region/detail guards; preserve ordinary element capture, native region framing,
  overview size, partial capture and failure-only retry. Full-data queries remain
  supported independently. No silent fallback to complete snapshots.
- Allowed implementation: apps/asyra-design/src/common-apis/inspection.ts only.
  Formal tests: existing workspace-inspection integration, inspection action and
  execution-flow proof; existing drawing-inspection browser cases. Existing Core,
  Group and snapshot source are read-only contributors. No schema/public API,
  Knowledge, renderer, persistence, mutation, UI or scoped-validation changes.
- Contracts: this Task 3 section, App execution spec, inspect condition/spec refs,
  existing capture-handoff mapping and generated bundle; App/root update notes.
- Naming: reuse getElementMetadata, root and childCount; no new public/persisted
  identity, registry or compatibility path. Formal fixture names are generic.
- Gates: admission; naming baseline; formal red real-owner copying and mapped
  preflight tests; focused inspection/evidence/integration tests; browser pixel,
  read-only history/shared-state and reload preservation; production types/build,
  focused lint, docs/changeset checks and final Inspector proof. Freeze source
  while validating; preserve historical evidence. No model, 101 or CI inspection.
- Stop: fixed DoD satisfied, no observed reduction in preflight work, a different
  owner required, or three failed implementation corrections. Do not expand to
  scoped containment validation or optimize required snapshot traversal.

Fixed DoD:
1. Before implementation, reproduce full snapshot creation through the formal
   inspection entry using actual Core/Group owners. Existing mocked tests alone
   cannot prove this property. Formal fixtures do not depend on ignored tmp.
2. After implementation, target preflight performs zero complete element saves,
   zero copied child/property records and one scalar target lookup per attempt.
   Increasing child count cannot increase preflight data volume. Count the actual
   getter/clone work; separate necessary capture work. No new tool/dispatcher turn.
3. Keep identical overview/detail/region arguments and results. Existing browser
   source-space/pixel checks preserve bounds, size, order, rotation, hidden content
   and occlusion; full element data and detached child queries remain valid.
4. Preserve missing/noncurrent/empty/unsupported-scope/render/cancellation failures,
   truthful settlement, mixed partial results and retained successful image IDs.
   Execute recovery from the actual reply; retry only failed captures without
   recapturing successes, replaying edits or inventing target identities.
5. Preserve local versus whole-view invalidation, stale evidence rejection and
   load invalidation; no document/selection/history/shared-publication mutations.
   Existing persistence/reload checks remain strict. No renderer fallback, cache,
   extra state or compatibility branch. Timing improvement requires measurement.

Validation and self-review:
- Admission accepted review
  0d9834b712cb6d4e2a4e0c6eee90decfb09d14a3a184517db20970c7e5982501
  after candidate 6db21d26-27fa-49e5-8010-a64a24a7549c passed 77 cases.
  The existing inspect.capture-handoff mapping already covers the changed App
  owner and proof; no new case registry or runtime scope was required.
- Before implementation, three real-owner formal cases failed their work-count
  assertion after passing output and read-only-state assertions. Each group
  preflight copied its 2 / 2,310 / 6,163 child IDs and four property references.
  Workspace preflight also copied its full member list and performed a second
  metadata read. The mapped missing-target proof failed on the full-data read.
- The production diff replaces the full-data lookup with metadata and reuses its
  childCount in the existing workspace guard. Every target attempt now performs
  one scalar lookup, zero full-data reads, zero Group saves and zero copied child
  or property records. Real Group/Core are exercised; only the pixel boundary is
  substituted in the work-count test. Three group sizes each exercise overview,
  detail, local region, workspace overview and a leaf. No cache/extra call exists.
- Existing full element and detached child-list reads remain ordered and mutable
  only in their returned copy. Complete document, selection, history depth and
  shared-publication assertions remain unchanged after inspection. Native reply
  tests execute returned failure recovery while retaining successful image IDs.
- Focused verification passed 45 cases (4 workspace integration, 7 inspection,
  27 evidence, 7 dependencies); naming passed 15 checks. App production types
  (three configurations), production build, update-note check and diff check
  passed. ESLint: zero errors, two console warnings (one pre-existing proof report,
  one formal work-count report). Build retained its existing large-chunk warning.
- Both drawing-inspection browser cases passed in 26.5 seconds: large overview
  and native region pixels, multi-root order/occlusion/rotation/hidden content,
  precise capture failures, independent local invalidation, history/shared-state
  immutability, persistence and reload. Test-owned server ports were released.
  Source was frozen during verification. No model, 101, recording or CI inspection.
- Final Inspector run 0770d9dc-4d5d-4947-86f9-0d3144d3c5ae passed 77/77 without
  pending cases, accepted revision 113, source
  d4661354f03ee6fe5a5142980c5c11e6ef77f564e546579d2f44c726e774a11c.
  All 886 captured inputs still match the checkout.
- Supplemental test:framework-runtime-boundary passed 11 of 13 checks. Two
  unrelated failures remain: the public Preset group-bounds entry imports utils
  runtime modules, and ordinary validation omits evaluation-budget.test.ts,
  information-delivery.integration.test.ts, local-information-delivery.test.ts
  and native-output-observation.integration.test.ts. The boundary test, App
  package scripts, Preset entry source and package manifest match baseline
  e298e1e12; reconstructing the baseline test list produces the same four omissions.
  This diff changes none of those paths or dependency edges. Do not weaken these
  checks. Their repair is now separately authorized in the supplemental section
  above; this original image-preflight run was not a whole-App green result.
- Self-review covered the two-line production change, direct consumers, real
  copying boundary, existing unavailable/cancelled/partial outcomes and recovery,
  capture inputs, current metadata lifetime, snapshot/evidence ownership and
  independently valid full-data reads. No public/wire/persisted contract changed.
  Exact elapsed-time savings and live AI/first-frame effects remain unmeasured.

### Metadata child-count handoff - 2026-10-25

Status: locally verified and closed for this bounded handoff; model behavior and
first-frame effects remain unmeasured.

Evidence: run 1792853203510, provider sequence 486 / 39-output.json records
599,061 scene-tree:membership:snapshot-items for 6,164 created elements; sequence
551 / 55-output.json records 6,723 for 641 elements. Payload byte counts and
SHA-256 match the original provider receipts. Core.getElementMetadata reads the
full lazy children snapshot only to return its length. The matching Core method,
Group owner and App inspection dependency sources are unchanged from that run.
The observer needs parent identity; Group already owns a constant-work child count.
Historical counters alone cannot assign every copy or millisecond to metadata.

Step Execution Card - inspect / canonical metadata contributor:
- Objective: remove child snapshot materialization from scalar metadata reads,
  and prove less copying in the real retained-inspection plus batched-creation
  flow. Keep public metadata results, complete child lists and current validity.
- Inputs: current element identity and registered container capability; canonical
  membership remains owned by Scene Tree Group. Output: the same detached scalar
  metadata and exact current childCount; unknown IDs remain undefined and leaves
  report zero. No transaction, provider turn or persisted identity changes.
- Conditions: use the existing public Group owner count under the current container
  capability, including registered derived containers. Never read children just
  for count, add a count cache, mirror membership, infer zero on missing contracts,
  or change full-list snapshots. Preserve strict invalidation and partial writes.
- Allowed: Core metadata facade and its existing Scene Tree contributor; existing
  inspection dependency and creation owners are unchanged consumers. Forbidden:
  alternate registries, type-name lists, state, delayed notifications, batch-size
  changes, replay, reduced full-list fidelity, model calls and CI inspection.
- Boundary: packages/core/src/core.ts, its app-runtime-facade tests; the existing
  Group public class/type (no new API planned); App metadata-inspection integration
  test, existing interrupted/prepared delivery and inspection tests, existing
  execution proof, package test script, existing browser construction cases.
  Contracts: current plan, Core package bounded observations, App execution spec,
  inspect step/mapping and generated bundle; release notes and Core changeset.
- Spec references: Core Bounded document observations; App Metadata child-count
  handoff. Inspector inspect owns the read handoff and failure; no apply policy
  or cache dimension changes. Discovery is limited to these direct consumers.
- Naming: reuse getCanonicalChildCount and registered container capability; no
  new public/persisted identifier or compatibility path. One owner membership
  read per metadata call, independent of number of children.
- Gates: admission; naming baseline; formal failing real-Group and real-App work
  tests; focused Core/Scene Tree and App consumers; cancellation/remaining-only
  recovery; browser collaboration, history and reload; production types/build,
  focused lint, docs/changeset checks and final Inspector proof. Existing saved
  inputs are permanent fixtures; no ignored data is required by tests.
- Stop: fixed DoD met, no reduction in real-flow work, a different owner required,
  or three failed correction iterations. Do not expand to child-page optimization.

Fixed DoD:
1. Real canonical Group metadata reads after membership mutation reproduce the
   current copying bug before production changes; avoid mocks hiding lazy reads.
2. Metadata alone materializes zero child snapshots. The same real App creation
   sequence with a live unrelated inspection has fewer copied IDs, without
   removing the observer or changing batch sizes/calls; report exact counts and
   timings without assigning unobserved historical latency.
3. All metadata values/counts remain exact for empty/noncontainer/missing and
   registered derived containers after insert/remove/replace, rollback, history,
   collaboration and load. Full lists/pages remain ordered and detached; already
   published child snapshots remain unchanged after later mutations.
4. Live unrelated local inspection stays current; changes within its dependencies,
   ancestor/subtree changes and load still invalidate it. No stale pass or skipped
   required validation can satisfy a lower count.
5. Real dispatcher/owner preserves partial results and cancellation, remaining-only
   recovery without replay, Undo/Redo, collaboration and save/reload. Existing
   direct-consumer suites and Inspector mapping must exercise the changed facade.

Validation and self-review:
- Admission: candidate 65938e63-3326-48a2-acc9-d6340abf340f; review
  e1d04292b6c191e9fa2c2d76dca34710d93fe194b43aa89b61810dd39616825b
  accepted the inspect contract and mapping before production implementation.
- Red tests: a real registered Group-derived container copied three child IDs
  on a scalar read; the mapped Inspector case copied two. The real App cases
  completed their semantic assertions and failed only on copied-ID counts.
  Fixtures come from the permanent recorded-101 vector-delivery fixture, not tmp.
- App creation measurements (same dispatcher count, objects and slices):

  | Saved input sequence | Elements | Execution slices | Copied IDs before | Copied IDs after |
  | --- | ---: | ---: | ---: | ---: |
  | 483 | 6,164 | 194 | 599,061 | 0 |
  | 546 | 641 | 21 | 6,722 | 0 |

  These counts cover the apply interval with live retained inspection. Full-list
  reads outside that interval still produce complete snapshots. The second local
  case starts with two workspace children; the historical run had three, explaining
  its original 6,723 count. No historical file was changed.
  Single-run owner times were 1,443.15 / 132.52 ms before and 1,581.27 / 162.66 ms
  after under concurrent local validation. These are diagnostics, not evidence of
  latency improvement or an isolated timing regression.
- Implementation reuses the already-public Group.getCanonicalChildCount under
  the existing container capability. Scene Tree membership, batching, observers,
  complete children reads, recovery and serialization owners are unchanged.
  No cache, registration list, new API, extra exchange or fallback was added.
- Final focused gates: Core facade 12, Scene Tree 63, App inspection/action/
  interruption 89, prepared-delivery integration 29, metadata integration 2,
  and Inspector 77 cases passed. Naming 15 checks passed. Core production build,
  all three App type configurations, update-note validation and diff checks passed.
  Focused ESLint had zero errors and three diagnostic console warnings (two
  pre-existing; one work-count report in the new formal integration test).
- The existing browser partition-recovery case passed in 42.9 seconds with strict
  canonical comparisons across two peers, failure recovery, history and durable
  reload. Source stayed frozen during validation; owned test server ports were
  released. No model, 101, CI inspection or recording was run.
- Final Inspector run e35ef210-1a7b-4313-8c52-cc98f46ef916 passed 77/77 with no
  pending cases, mapping revision 112. Captured source
  62d1b3c0635fc771634fd46118334e9a16c905a40a3d53630e4d5657bf9346c4:
  all 886 captured inputs matched the reviewed checkout after validation.
- Review covered the owner diff, registered derived containers, live parent-chain
  consumer, complete ordered observations, detached old snapshots, unrelated
  inspection preservation, affected-scope/load invalidation, partial cancellation
  and remaining-only recovery. The formal App test is in the existing response
  harness; the existing mapped Inspector case now calls the actual metadata owner.
  General AI adoption and end-to-end first-frame timing are outside this closure.

### Vector delivery identity reduction - 2026-10-25

Status: locally complete. Admission accepted at revision 111 (candidate
de8eeb62-4922-41bf-b745-dd06f0015acb). Final Inspector verification
fe7a6c26-6142-492b-b521-2ca77c138269 passed on captured source
d74138412a36ef38f96cc5630b4330ad9df656a886631c65b413cc0fea26dbfa.
Formal saved-byte and producer/admission identity regressions failed before the
owner change; no model or 101 run was performed.

Evidence: saved run 1792853203510, provider sequences 304/483/546 carry exact
unredacted prepared inputs of 8,588,993 / 23,248,274 / 2,128,964 bytes. In 81,513
point/segment/network records, map keys repeat each record's id. Removing only
those fields and restoring from keys yields exact complete JSON-value equality;
offline projected savings are 1,274,397 / 3,416,665 / 318,476 bytes (14.75% total).
Preparation, delivery, admission, resolver and execution sources match that run.
This is App-to-browser payload waste, not model input or a first-frame latency claim.

Step Execution Card - apply / prepare-to-apply:
- Owner: existing deliverPreparedDesign and admitPreparedDesignDelivery; unchanged
  resolver, dispatcher and canonical validation/execution consume the result.
  Spec: Prepared design delivery. Inspector: apply and prepare-to-apply.
- Inputs: retained owned canonical prepared artifact and exact vector record keys.
  Outputs: current compact wire version and identical admitted canonical artifact,
  then ordinary complete/partial/cancelled receipts and recovery.
- Conditions: verify every point, segment and network record id equals its key
  before omission. Restore only those exact identities; reject supplied id fields
  in the new wire shape and retain full canonical validation before writes.
  Update the sole wire version; no prior-version compatibility branch. Canonical
  version, independent conversions and explicit full receipts stay valid.
- Allowed: current delivery/admission owners and directly affected tests/consumers.
  Forbidden: geometry or topology recomputation, changed IDs/references/materials,
  array or child reordering, guessed defaults, caches/registries, new tools or
  round trips, changed budgets, persistence owner changes and replay.
- Lifetime/work: pack once per existing delivery, restore once per admission;
  retained canonical source remains immutable and the existing canonical clone
  isolates admitted output. Count compilation, projection traversal and dispatch;
  measure pack/encode and parse/restore/admission separately. No geometry work is
  justified by smaller bytes. Non-vector payloads retain their existing semantics.
- Boundary: prepared-design.ts, prepared-design-admission.ts; existing
  prepared-delivery.integration, design-actions, interrupted-design.integration,
  local-design-tools/local-ai-provider tests and execution proof; existing
  design-construction E2E and necessary direct wire-contract fixtures; current
  plan/spec/Inspector/mapping, App CHANGELOG and root release notes.
  Permanent saved inputs: server/__tests__/fixtures/recorded-101/vector-delivery-20261025.json.
- Naming: delivery version 3 is an internal App wire contract, not a persisted
  document identity. Id-omitting vector record types belong to prepared-design.ts.
  No new capability or registry names. Delivery owns no cache; unrelated existing
  apply-step cache dimensions remain unchanged.
- Failure owner: apply rejects inconsistent canonical IDs before projection and
  malformed compact input before writes. Real cancellation and acknowledged
  prefixes retain existing recovery and report owners.
- Gates: admission, existing naming baseline, formal red saved-byte/identity
  regressions, actual resolver/dispatcher/Core tests, cancellation and continuation,
  affected browser collaboration/history/save/reload, direct-consumer server gates,
  production types, focused lint, naming, documentation checks, final Inspector.
- Stop: fixed DoD complete, or implementation requires another product owner,
  compatibility branch or a third failed implementation iteration.

Fixed DoD:
1. Three permanent saved inputs each reduce bytes by at least 14% against their
   captured v2 payload; existing 15% full-map baseline regression still passes.
   No ignored tmp dependency or 101-specific runtime behavior.
2. Complete JSON-roundtrip equality for canonical IDs, points, controls, curves,
   networks, references, materials, ordering, hierarchy and continuation; include
   generic mixed kinds and multi-ring curves. Source objects remain unmodified.
3. Conflicting record IDs cannot disappear during projection. Missing, foreign,
   duplicate or malformed references and superseded wire versions reject before
   mutation; full canonical validation remains authoritative.
4. Real resolver -> dispatcher -> admission -> Core preserves complete/partial
   results, cancellation, recovery without replay, Undo/Redo, collaboration and
   save/reload. Existing legitimate independent consumers remain covered.
5. No extra model/dispatcher exchange or repeated geometry compilation. Formal
   measurements retain exact bytes and pack/encode plus parse/restore/admission
   costs for the same prepared values; report overhead honestly rather than infer
   lower first-frame latency. Remove superseded wire behavior and stale tests.


Validation and bounded self-review:
- Three saved source inputs reproduce their captured canonical SHA-256 values and
  exact v2 byte counts. Current payloads are 7,314,596 / 19,831,609 / 1,810,488
  bytes: 5,009,538 bytes removed in total (14.7486%). The original full-map
  regression also passes (17,380,806 -> 12,326,607 bytes).
- The permanent mixed fixture includes shared fills, native oval/text/frame and
  multi-ring cubic topology. Every restored value/reference matches; input stays
  immutable, map projection/restoration each visit once, compilation stays once,
  and the existing single isolation clone and dispatch count are preserved.
- Producer identity conflicts and redundant/missing/foreign/duplicate wire data
  reject before writes. Only wire v3 is accepted; canonical v1 is unchanged.
  The v2 projection exists solely as a test cost oracle, never a runtime branch.
- Focused suites: 382 passed; Inspector: 77 passed. One unrelated installed-Codex
  native-registration probe was skipped because LOCAL_AI_PROTOCOL_EXECUTABLE was
  unset; scripted-provider integration ran and no model inference was requested.
  The first Node invocation of browser-owned suites failed at collection because
  window was absent; their required jsdom invocation passed all 57 cases.
- Browser partition recovery: 1 passed (39.1 s), including peer convergence,
  original order/world placement, Undo/Redo, durable backend and strict reload
  digest. The existing recorded geometry oracle and real Core cancellation tests
  retain acknowledged prefixes and exclude replay. Test ports were released.
- Production types, focused ESLint (zero errors; four diagnostic console warnings),
  naming, update guidance and diff checks passed. No persistence, rendering,
  scheduling, Knowledge, model prompts or capacity owners changed.
- Cost measurements are three measured iterations after one warmup, per-stage
  medians in milliseconds. They are diagnostics, not a latency guarantee:

| Saved sequence | Pack + encode v2 / v3 | Parse + restore + admit v2 / v3 |
| --- | --- | --- |
| 304 | 14.84 / 26.26 | 113.75 / 109.22 |
| 483 | 37.07 / 70.94 | 280.84 / 287.34 |
| 546 | 3.34 / 5.68 | 25.71 / 23.82 |

The final regression run trades about 40.37 ms of measured local CPU in its largest case for 3,416,665 fewer
wire bytes. No extra exchange or geometry compilation occurs. Actual network,
model behavior and first-frame latency were not measured; they are not closure
claims for this bounded data-delivery change.

### E2E execution continuity and failure attribution - 2026-10-25

Status: locally complete. Initial admission accepted at revision 109; the permanent
fixture capture correction was admitted at revision 110. Final verification
`19bd0faa-737f-48bb-855e-e615c4f78d4c` passed on source
`1ab8a842562d34fe2576263244d7fd5d75c709b6890a240fb1d2626a627b8c9f`.
The original failure and its observation limits remain preserved.

Evidence: the preserved Frame trace (SHA-256
`a2d3b3ad6b4094a367507eab938b6da6f40c488ec2c1a117d960e39e253f1f2e`)
shows persistence expectation 164 completing, additional Vite full reloads,
then Undo expectation 175 failing. Durable sequence 9 contains the same width
95 document as Core. Runtime line 3265 identified the Undo assertion; the source
embedded after concurrent edits moved that assertion to line 3269. The trace
therefore does not establish a save corruption. Historical Undo depth and actual
shortcut handling were not observed. A later passing run does not erase this failure.

Step Execution Card - observe:
- Owner: existing App E2E harness contributes to Runtime-owned observation. Spec:
  E2E execution continuity. Inspector: observe inputs, conditions, boundary and
  failure owner. No prepare/apply/persistence owner behavior changes.
- Inputs: current public Core snapshots/history depth, backend checkpoint/sequence,
  main-frame navigation, explicit planned reload and frozen repository source identity.
- Outputs: named Playwright steps and JSON attachments, exact assertion failures
  and an explicit environment-continuity failure. No new product state or result store.
- Conditions: only an explicitly scoped single planned reload may replace one
  runtime. Extra navigation on either participant remains a latched failure;
  closing a page or missing evidence cannot certify success. Keep original assertion
  errors alongside environment violations; never diagnose from a mutable line number.
- Allowed contributors: existing Playwright page lifecycle/attachments, public Core
  save/getUndoHistoryDepth, existing backend read and Runtime Node source adapter.
- Forbidden: persistence repairs, reload suppression, automatic retries, weakened
  hashes, diagnostics changing product writes, model calls, CI and source edits
  during validation. No additional packages, state registries or evidence stores.
- Boundary: e2e/execution-evidence.ts, e2e/test-utils.ts,
  e2e/ai-inspection-evidence.spec.ts, existing execution-flow proof and e2e/fixtures/execution-continuity.json, current plan/spec/Inspector/mapping, App CHANGELOG and root release notes.
- Naming: execution-evidence identifiers are internal E2E diagnostics; no persisted
  document or public product identity changes. cacheDimensions remains empty.
- Failure owner: observe reports environment/source/evidence violations; an intact
  environment retains the original save/history/collaboration assertion failure.
- Gates: admission; formal red proof of the existing shortcut helper ignoring
  a continuity guard; deterministic lifecycle and saved-sequence regressions;
  real Frame/Group strict save/history/collaboration/reload and controlled extra
  reload/closed-page cases; production types, focused lint, naming, update notes,
  final Inspector verification. Do not rerun unrelated local CI.
- Stop: fixed DoD complete, or a correction needs a product owner change. Do not
  reopen earlier converged handoffs or treat missing AI adoption as a new defect.

Fixed DoD:
1. A permanent minimal fixture preserves the original persistence-pass then
   Undo-failure sequence and provenance. Tests do not require ignored traces and
   never use post-hoc line mapping as operation identity.
2. A deterministic extra reload between edit and Undo fails as runtime replacement,
   including a reload during focus acquisition or on the peer. No retry-to-green.
3. Planned reload followed by a new edit supports real Undo/Redo, exact Frame/Group
   Core and backend digests and collaboration. All existing strict assertions remain.
4. Phase evidence records source revision/fingerprint, expected and observed document,
   backend sequence, runtime identity and public history depth before/after operations.
   Unavailable captures remain explicit. Source drift fails validation separately.

Remaining-work inventory is bounded to this plan: this was the one confirmed active
correction, now locally complete. Native unfinished-argument progress remains an explicitly deferred
observability limit. Unobserved live adoption/recovery is not counted as a confirmed
bug. Historical completed sections are evidence, not an accumulating repair queue;
no total count of undiscovered App defects is asserted.

Local completion evidence:
- Red: the existing Undo helper ignored the supplied continuity check and resolved
  after dispatching the shortcut. The formal regression failed before implementation.
- Green: all 77 execution proof cases passed in the final isolated Inspector source,
  with zero pending cases. Production typecheck, focused lint (zero errors, one
  pre-existing console warning), 15 naming checks and update guidance passed.
- Real browser preservation: six cases passed in 1.7 minutes, including existing
  unguarded Undo/Redo/Core-load consumers, full Frame and Group lifecycles, and
  controlled editor reload, peer reload and closed-page failures. No model was called.
- Five native Playwright execution-continuity attachments are retained under
  `apps/asyra-design/test-results/e2e-lifetime-final/`. All have identical before/after
  source identity `790535be1dcd15d42f89c5d1dd946387b29e7c5cde1be177af332f4110e864d4`.
  Each Frame/Group new-edit Undo/Redo records public history depth 1 -> 0 -> 1,
  durable sequences 9 -> 10 -> 11 and strict editor/peer/backend document equality.
  Negative cases retain explicit environment violations and unchanged documents.
- Self-review corrected successful-attachment retention through native outputPath
  and attach, moved the fixture to existing E2E fixtures so isolated capture includes
  it, narrowed capture to the actual E2E inputs, and preserved both original errors
  and capture failures. The first isolated verification failure was not waived.
- Browser source remained frozen throughout each run. The later changes only move
  the proof fixture, declare isolated inputs and format its proof import; browser
  test and harness bytes are unchanged from the final browser run. Original trace
  SHA-256 remains unchanged. Test-owned ports were released.
- Replaced the persistence-only failure attachment with phase evidence and moved
  shortcut bodies to the guarded E2E owner; existing utilities re-export them. No product
  save, history, collaboration or drawing owner was edited. Historical runtime depth
  and exact shortcut handling remain unobserved; later controlled evidence does not
  rewrite that historical limitation. No model/101, CI or push.

### Mechanical coverage selection handoff - 2026-10-25

Status: complete for this bounded local implementation; admission, formal local gates and final Inspector verification passed. AI adoption remains unobserved.

Evidence: saved run 1792853203510 sends the second and third independent root
receipts to validate one and two prior roots respectively (provider sequences
493/496 and 558/561). All three return target-not-covered. Payload hashes match;
local-operation-tools.ts, design-review.ts and review-action.ts match the saved
source. These are automatic App exchanges after first frame, not AI tool choices
or evidence of a first-frame delay. Current owner code selects all retained
measurements solely because checkedElements > 1. Valid subtree reconciliation
and its refusal of uncovered targets must remain.

Bounded design and Step Execution Card - inspect:
- Owner: existing browser deterministic reviewer creates coverage and receipts;
  registered review action carries the contract; local-operation-tools selects
  existing check-store obligations and consumes validated successors.
- Inputs: ordinary review target and optional measurementTargets hints drawn from
  existing retained measurement identities (plus targets in the same read batch).
  Inputs are IDs only, never geometry or a second hierarchy. Explicit caller
  hints remain legal. No new persisted or cross-request state.
- Outputs: capture returns coveredMeasurementTargets from the exact captured
  subtree, restricted to hints, with its existing current receipt. This is scope
  selection, not findings, compatibility, currentness of prior receipts or a pass.
  No complete subtree ID list is delivered. Empty/missing scope selection grants
  no automatic reconciliation; it does not alter independent results.
- Consumer: intersect with currently retained obligations, exclude the current
  root, and use the existing 1-64 target validation windows only for nonempty
  intersections. Remove the checkedElements heuristic and all-target fallback.
  Reviewer.reconcile still owns inherited visibility, normalization, findings and
  fresh successor stamps; existing selected revision/stamp guards own commit.
- Work: one candidate-ID set per capture; select from its already-produced immutable
  coverage without geometry reads or another traversal/index/cache. Reconcile
  creates its existing index only when there is useful scope. Preserve cooperative
  cancellation and real failure recovery; no mutation or visual acceptance changes.
- Inspector: inspect inputs/outputs, review-coordinator purpose, mechanical coverage
  condition, existing verdict/receipt lifetime and failure owner inspect. Allowed
  contributors: App reviewer, registered action, existing measurement/check store.
  Forbidden: server-guessed ancestry, global IDs to the model, new state, replay,
  unknown->success conversion or a model-based scope decision.
- Mutation boundary: src/common-apis/design-review.ts, src/ai/review-action.ts,
  server/local-operation-tools.ts and their direct tests, mapped execution proof,
  existing inspection E2E if needed; one permanent recorded-input fixture; this
  plan, execution spec, Inspector/generated bundle, flow mapping and owner pending
  release note. No Framework mutation, new tool or registry, model/101, CI or push.
- Naming: measurementTargets reuses the existing mechanical target concept;
  coveredMeasurementTargets is an ephemeral owner-produced scope selection, not a
  persisted relationship, validation verdict or alternate result store.

Fixed DoD:
D1. Formal failing integration uses preserved three-root evidence and real reviewer,
action and operation owner; no ignored tmp runtime dependency.
D2. Disjoint roots cause zero additional reconciliation exchanges; adding unrelated
roots does not grow invalid requests. Existing independent result identities are
preserved; omission is not proof of currentness or pass.
D3. Parent review still reconciles covered children through the original supported
rule/visibility normalization and version guards. Missing, deleted, changed and
incompatible targets retain truthful handling; no ancestry-only approval.
D4. Cancellation, partial results, failed delivery and late/superseded replies
preserve acknowledged independent results and never replay canonical writes.
D5. Count complete browser request/reply bytes, dispatches and owner reads/work over
the fixed sequence. Total delivery decreases; no model round trip or all-object
identity dump is added. Prove no repeated geometry evaluation for scope selection.
D6. Direct consumers and final settlement remain consistent with the retained store;
mechanical success never certifies visual acceptance. Run focused integration,
reviewer/action tests, execution proof/server harness, affected production types,
App build, touched lint/naming, scoped release-note and Inspector gates. Exercise
real browser dispatch if the changed contract is not otherwise proved there.

Design self-review: returning scope IDs is smaller than moving projection/commit
into capture and preserves existing failure/partial/version semantics. Passing
hints also supports rechecks after browser receipt invalidation; filtering only
browser-retained roots would lose that valid recovery. An unavailable scope cannot
supply a fallback all-target query. This is one inspect-owner slice. Stop for an
out-of-scope owner requirement; fixed DoD and historical evidence stay unchanged.

Validation and bounded self-review:
- Initial admission: candidate 311ff67a-9c83-47d1-82b7-fd109c5abe74,
  review 0654a1649a0389c56cd63383b73c62434da299699bc5c3108a69813426702b5d,
  accepted before regression/implementation. Initial formal red: three independent
  reviews produced five browser exchanges; owner/action tests also lacked scope.
- D1-D2: permanent recorded fixture with source hashes, real reviewer/action/check
  store/operation integration, seventy additional disjoint roots, explicit empty
  selection and preservation of an unrelated failed result pass.
- D3-D4: seventy covered obligations still reconcile in 64+6 windows after browser
  invalidation. Existing parent/child normalization, hidden inheritance rejection,
  independent stamps, unavailable delivery, superseded revision, cancellation and
  no-write recovery tests pass. Missing/removed coverage cannot retire a result;
  canonical retirement remains the separate existing owner.
- D5: fixed three-root fixture counts complete request/reply envelopes: 4,647 to
  3,001 bytes (35.42% less), five to three exchanges, six metadata and six computed
  reads unchanged. The comparison replays the former extra validation exchanges
  against the same canonical fixture; it is not a model or wall-time benchmark.
  Scope selection performs no additional geometry evaluation. First review omits
  empty optional hints; explicit empty caller selection remains valid.
- D6: final server response harness 1,707 passed and two existing opt-in cases
  skipped (installed native registration and large recorded-checkpoint bootstrap);
  browser reviewer/action/inspection/startup tests 44 passed. Production
  typechecks, production App build, naming (15 tests), touched lint and update-note
  check pass. Lint retains one pre-existing console warning in the proof file;
  production build retains its existing bundle-size warning. The mapped deferred
  measurement proof now checks same-batch hints and empty selected scope without
  a new model call; the existing harness includes the real integration consumer.
- Real browser final source: Frame and Group lifecycle tests both pass, covering
  interrupted projection recovery, independent passes, final assessment, Undo/Redo,
  collaboration, durable save, fresh reload and subsequent editing. An earlier
  Frame attempt timed out, and another failed a post-reload persistence digest.
  A control with the original three owner files passed; the restored candidate
  then passed both cases. Cause of the earlier failures is not established, and
  no persistence fix is claimed. The formal test now attaches actual current and
  persisted documents on that failure; its assertions and poll budget are intact.
- Direct-consumer review: retain old read/write and completion assertions; update
  argument checks to admit the new optional scope field, and restrict intentional
  reconciliation-delivery faults to the validation action (scope hints now also
  occur on review). No status-name substitution, all-target fallback, duplicate
  state, geometry mutation, automatic replay or Knowledge changes were added.
- Final Inspector verify c1e00834-d12d-4536-bb2c-6d14bcb11c54 passed at revision
  108, source 8812f9d7dad83d7dbe684e0e37f8f417d33fe89c72adc5b0f402854cf5157424.
- Final contract review 3122ac56caac560a264d5bea769c161b1e5a2dea4802bf63d8b9e65c5c633fad
  accepted the clarified scope-versus-retirement contract. Local evidence logs use
  tmp/mechanical-coverage-*; raw saved 101 evidence is unchanged. No model/101,
  CI inspection or remote push was performed for this slice.

### Face-to-grid source boundary handoff - 2026-10-25

Status: local implementation and fixed DoD complete; AI adoption remains unobserved.

Evidence: preserved run 1792853203510 contains six same-scope face/grid pairs
with identical ordered world corners. Raw input hashes were checked against
16-input.json and 34-input.json; current construction/schema/examples equal the
saved source snapshot. Boundary values total 714 bytes; illustrative face references
use 99 bytes. Net delivery savings must include the changed guide and example.
No geometry error or timing causation was established by this repetition.

Bounded design and Step Execution Cards:
- Prepare owner: existing construction source geometry, budget selection and retained
  repair source. Input is boundary vertices or boundary:{face:key}; output is the
  same ordinary prepared geometry. Resolve exactly one polygon face in root children
  or the same pattern members, including forward references. No outer-scope lookup,
  ellipse conversion, implicit target selection or live document relationship.
- Resolve before selected-source slicing drops a face; the original retained source
  stays unchanged so explicit repairs re-resolve current values. Selection never
  reintroduces an unselected face or changes order. Reuse the existing source owner;
  no new store, registry, scheduler or cross-invocation cache.
- Source resolution performs bounded scope indexing once per resolved scope; no
  geometry projection or expansion. Budget accounting remains equivalent to inline
  boundaries, including expanded output and per-part source work. Existing compiler
  owns finite coordinates, planarity, convexity and camera degeneracy validation.
- Compose owner (after prepare passes): existing selected usage/schema/examples
  publish the legal boundary union and execute that exact example. No extra tool,
  preliminary request or unselected schema. No model-authored geometry inference.
- Inspector authority: prepare and compose inputs/conditions/boundaries; spec section
  Face-referenced surface boundaries. Forbidden contributors remain renderer, model
  calls, canonical writes in preparation, source approximation and replay.
- Allowed files: design-face.ts, design-construction.ts, design-budget.ts,
  design-construction-schema.ts, design-preparation-examples.ts; their direct formal
  tests/fixtures, execution-flow proof/mapping and existing construction E2E; active
  plan/spec/Inspector and generated workspace output. Other owners remain unchanged.
- Naming: face is a draft-only source selector owned by construction; it is not a
  canonical/persisted ID. Inline boundaries remain independent valid operations,
  not compatibility fallback. Existing tool revisioning owns contract publication.

Fixed DoD:
D1. Permanent extracted-input fixture and formal fail-first tests prove currently
unsupported references, without ignored tmp dependencies or live model calls.
D2. Recorded six pairs plus generic root/pattern cases preserve geometry, materials,
vertex order, painter order, keys and parents exactly against inline preparation.
D3. Preserve independent inline grids; reject missing/ambiguous/cross-scope targets,
non-quadrilaterals, ellipse targets, malformed references and invalid geometry without
inference or approximation. Forward references do not reorder output.
D4. Expanded and per-part budgets remain truthful. Existing retained-source parts,
explicit repair, cancellation, partial success and recovery never recreate completed
faces or replay completed batches. No raised limits or geometry splitting.
D5. Execute actual selected delivery/examples through formal invocation. Total inputs,
outputs and changed contract cost decrease on the fixed recorded sequence; calls do
not increase. Source resolution work is bounded by scopes, not grid-by-face scans.
D6. Exercise the real dispatcher and canonical creation, durable reload, Undo/Redo
and collaboration through existing integration/E2E mechanisms. Helper equality alone
cannot establish completion.

Gates: focused construction/budget/repair/delivery regressions, mapped execution proof,
server-response harness, affected production types/build, touched lint, naming,
Inspector architecture/source verification, and focused construction browser flow.
No model/101, CI, push, unrelated cleanup or completed-plan edits. Stop for an
unresolved contract mismatch or an out-of-scope owner requirement.

Design self-review: references resolve only source geometry and cannot encode a new
live dependency. Construction and budget consume the same resolution contract; source
selection resolves before removing dependencies. Original source and its repair paths
remain authoritative. Keep invalid target recovery explicit, and validate the complete
selected output before each existing write boundary. The net-size gate may fail even
if raw input shrinks; do not claim timing or model adoption from local tests.

Bounded review iteration: the broader discovery harness exposed a regression in the
published layered example after an attempted delivery-size reduction. Preserve its
separate painter layers and oval illustration; add the boundary-reference example
within the existing grid layer and remove redundant prose instead of weakening any
delivery budget. The fixed DoD remains unchanged. A failing aggregate source-traversal
regression also requires the existing source-node bound before resolving all scopes.
This review changes only the admitted prepare/compose files and direct consumers.

Closure evidence:
- Initial admission: revision 105, review
  39e5feeaa38c5551e0f996c5c5a8bf1893186d13e9e75bc90315623389933fb3.
  Final mapped contract accepted at revision 106; verification
  6ba1875c-c462-42c0-9397-b585ba5a09d5 passed on source
  e45bfb134d6b4ba76ef052e8da798291643c29ca711b037541983ef20375fa6e.
- Formal fail-first evidence is preserved in tmp/face-boundary-red.log and
  tmp/face-boundary-source-bound-red.log. Permanent tests and extracted inputs
  live in server/__tests__/face-boundary.test.ts and its recorded-101 fixture;
  the server-response harness now includes this direct consumer.
- D1-D5: all 19 boundary regressions pass; the complete server-response harness
  passes 1,706 tests. Two existing opt-in cases remain skipped: installed native
  registration and large saved-checkpoint bootstrap benchmarking, outside this
  boundary slice. Neither is counted as passed.
- Controlled first-use sequence: one selected lookup and three submissions in both
  versions; 38,309 -> 37,673 bytes including guide, inputs and replies (-636,
  1.66%). Guide alone: 19,537 -> 19,516 bytes. Existing layered/oval/motif delivery
  ceilings remain unchanged. These are deterministic delivery measurements, not
  historical provider timing or model behavior measurements.
- D6: final-source browser integration passes (39.5s): actual batch dispatcher and
  creation, two retained parts, interrupted second preparation and remaining-only
  recovery, one root, exact order, collaboration, Undo/Redo and durable reload.
  Cancellation before retry performs no write; successful recovery never resends
  geometry or recreates the completed face. Ambiguous apply failures retain the
  existing no-automatic-replay protection.
- Production types/build, touched lint (zero errors; one existing proof-console
  warning), naming, architecture contract tests and diff checks pass. Build retains
  its existing chunk-size warning. Test-owned ports are closed.
- Self-review preserved separate painter layers in the delivered example, independent
  inline boundaries, source-only reference semantics and immutable repair input.
  Existing preparation owns all geometry validation; no state/cache/tool/renderer
  path or capacity limit was added. No model/101, CI or push was performed.

### Cross-query Knowledge dependency delivery - 2026-10-24

Status: locally complete after admission, formal fail-first regressions and bounded self-review.

Evidence: run 1792853203510 reads the architectural entry at 11.262 seconds
(2,671 output bytes), then its material-method child at 18.101 seconds
(22,742 bytes). The latter repeats the same 1,964-byte entry body (2,241 bytes
including its document envelope). Raw payload hashes and snapshot sources were
checked. This proves redundant delivery, not its contribution to first-frame time.

Bounded design and Step Execution Card - compose:
- Authority: ai-execution-flow.md, Cross-query Knowledge dependency delivery;
  Inspector compose inputs, conditions, cache dimensions and implementation boundary.
- Owner: existing Runtime Knowledge session composes and retains advice; App owns
  read-tool admission, serialized delivery and recovery. The existing Code Mode
  forwarding example retains received results; neither owner certifies model receipt.
- Inputs: selected IDs/contexts and optional reuseFrom containing opaque contextKeys
  of complete advice the caller still holds. No preliminary acknowledgement call.
- Outputs: the same ordered documents and complete sources; an exactly matching
  document may replace text with retainedFrom pointing to that earlier result's
  same target. Ordinary reads deliver full text. New or changed overrides deliver text.
- Retention: use only the bounded existing session result map, retaining the full
  composition and its immutable wire response together. Query identity includes
  reuse selection. Result contextKeys are opaque per-result identities, not predictable
  query signatures. No parallel receipt registry or raw-content cache.
- Conditions/failure owner: validate inputs, permissions, context epoch, generation,
  cancellation and current dependency closure before reuse. Missing/foreign/evicted
  receipts fail explicitly at the read owner with same-read recovery without reuseFrom.
  Rehydrate clears context and returns full text even if old references were supplied.
  Page retries reuse the immutable wire result; stale continuations still reject.
- Allowed contributors: registered metadata/content, held result references and
  existing read/forwarding owners. Forbidden: topic-specific rules, model-receipt
  inference, automatic parent reads, new stores, rendering or mutation replay.
- Files: knowledge.ts, knowledge-types.ts and their existing tests; local-knowledge.ts,
  local-knowledge tests, execution-flow-proof and information-delivery integration
  tests; permanent recorded-input fixture. Update only associated active contracts,
  generated documentation/Inspector output and release metadata.
- Work boundary: preserve existing authoritative composition/validation reads; this
  slice reduces serialized body delivery, not provider file-I/O latency. Repeated
  identical reads and page continuations must not rerun provider reads.

Fixed DoD (unchanged outcome from the approved proposal):
D1. A permanent recorded-input regression fails on parent-to-child body duplication,
without ignored tmp inputs. Include generic synthetic graphs beyond architecture.
D2. Reconstruct from retained originals and delta references to obtain exactly the
full ordered composition, sources, necessary constraints and override semantics.
D3. Execute the actually delivered usage/forwarding example through real tool
invocation. Duplicate body bytes become zero; total serialized inputs and outputs,
including the incremental guide cost and reference overhead, decrease with no added
calls. No unrelated sibling content is read.
D4. Fresh-session direct child reads remain complete without a parent read or opt-in.
D5. Cover lost/foreign/evicted references, changed revision/context, permissions,
invalid input, concurrent reads, cancellation and disposal; never silently omit text.
D6. Preserve byte-stable pagination/retries, refresh/rehydrate, reconstructable saved
I/O and read-only recovery. No repeated drawing, recapture, transaction or state writes.

Gates: focused Runtime/App regressions first, then existing Runtime local suite,
App server-response harness, Knowledge direct consumers, native-interface offline
informational forwarding tests, production Runtime/App types, touched lint, naming,
public documentation generation/check and source-bound Inspector verification.
No model, 101, browser drawing, CI, unrelated cleanup or plan closeout. Stop for an
unresolved owner/contract mismatch or scope expansion; repair only this handoff.

Design review: prior App return alone is insufficient to omit advice. Explicit
caller-held references preserve that protection. Full internal compositions permit
exact override/source comparisons; immutable wire responses preserve paging without
querying a second store. Distinct result identities enforce session isolation.
Retaining full ordinary responses is intentional recovery, not obsolete behavior.


Implementation and bounded review - 2026-10-25:
- Admission accepted at revision 103: candidate a8aba90f-dadf-474e-b05d-1c531c4275cb,
  review 897854f3e187476dc20c4e9ae4226bead06f83c6c259feed36fef542c808a827.
- Runtime and App regression tests failed before implementation. Reuse is now an
  optional read selector; ordinary full reads remain necessary recovery, not an
  obsolete compatibility path. Tool revision 3 publishes the changed selector.
- Public reuseFrom/retainedFrom belong to the Knowledge read contract. contextKey
  is an ephemeral result identity, not a persisted document ID. No document migration,
  compatibility alias or additional store was introduced.
- Bounded review found and tested concurrent completion identity replacement and
  stale reuse arguments in rehydrate continuations. Concurrent completions now reuse
  the published identity; full-content rehydrate continuations omit retired references.
  The direct consumer contract version is set after shared semantics so it is not
  overwritten. Registration-order tests compare all content while requiring distinct
  identities for independent sessions.
- The actual published reuse and recovery expressions execute through invokeLocalTool.
  The unchanged forwarding example executes in native Codex 0.160.0 Code Mode
  against the offline fixture endpoint: both original advice and reference response
  reach successor requests byte-for-byte. No real model is called.
- Controlled recorded-input comparison: baseline 25,501 bytes; candidate 24,073
  bytes, including 484 bytes of incremental declaration/guidance. Both use two
  actual read calls. Net reduction 1,428 bytes (5.60%); duplicated entry body becomes
  zero, with exact ordered document/source reconstruction and no sibling reads.
- Gates: Runtime 447 passed; existing Preset direct-consumer gate 37 passed; App
  server harness 1,686 passed with two existing opt-in skips; focused informational
  integration 39 passed; Knowledge handoff 15 passed; runtime-input 21 passed.
  The two unrelated opt-ins are installed native registration without inference and
  saved large-checkpoint bootstrap benchmarking. The current native Code Mode
  delivery path is exercised directly by the focused suite; skips are not successes.
- Runtime build, App production types, naming (15), touched lint (zero errors, two
  existing console warnings), public documentation generation/check and diff checks
  passed. The unchanged Inspector architecture contract suite passed both tests after
  clarifying the existing App request-local session lifetime; that clarification was
  admitted at revision 104 (review
  b645a73ddcf3ef6ee9b7a6734963cb584f38d938cf3b3a7c61a0d8c9a6a5b198).
  Source-bound Inspector verification 092127aa-ec59-42e8-a8bb-8617e6ef92fe passed
  at revision 104 against source
  21ce72beaf10e58a066ceb26f3d6785bcf78d21e38e9f72b96037e36d23a634c.
  Detailed logs remain in tmp/knowledge-reuse-*.log; formal tests use tracked fixtures.
- A direct handoff test invocation initially used jsdom for Node file-URL consumers;
  running the existing owner suite in its Node environment passed without product
  changes. Mac restart preserved the source and completed evidence; remaining gates
  were resumed. No browser/document/Undo/Redo/collaboration owner changed.
- D1-D6 are satisfied locally. No model-adoption, first-frame improvement or model
  context-retention guarantee is inferred. Original run evidence remains immutable.


### Workspace overview and inspection receipts - 2026-10-24

Status: converged after contract admission, formal local verification and one
authorized live observation. The convergence push is authorized. Fixed D1-D8
below remain unchanged; live failed-target recovery remains unobserved.
Evidence: saved run 1792847647272, drawing request e4064411-79d6-457a-8dea-ab234241a77e,
84-input/87-output. At 113.678 seconds workspace capture was refused before snapshot;
the absent owner settlement became unknown in both browser and aggregate receipts.
The actual delivered subtree overview description omitted this capability boundary.
The native workspace container exists outside the ordinary Render element map.

Bounded objective: support a read-only overview of the current workspace through
Core.captureElementSnapshot and the existing Render snapshot owner. Preserve
positions, ordering, visibility and overlap across independent roots. Keep explicit
element captures, local detail, existing evidence lifetime and partial recovery.
Workspace detail/region remains unsupported; use a concrete child for native detail.
An empty workspace is unavailable evidence, never a visual pass. Unknown write
settlement elsewhere is not normalized by this task.

Step Execution Card - inspect (including its existing snapshot contributor):
- Spec: AI execution flow / Workspace overview and inspection receipts; Render
  and Core snapshot contracts. Inspector: inspect conditions, contributors,
  implementationBoundary and failureOwnerStepId; no new route or state.
- Inputs: actual current workspace/element identity, explicit overview/detail/region,
  canonical geometry/order/visibility and the existing evidence stamp.
- Outputs: exact snapshot with scoped evidence or owner-authored unavailable reason,
  completed read settlement, recoverable arguments and preserved successful images.
- Conditions: work only through existing Core snapshot; no document or selection
  mutation, no grouping, no viewport screenshot, no artificial render composition,
  no added model/tool/caches. Preserve explicit targets and mandatory native detail.
- Failure owners: Render target/capture, App inspection/evidence, existing aggregate
  review. Cancellation/transport failure retains real execution evidence.
- Allowlist: Render render.ts, ViewportLayer/RenderLayer snapshot target access and
  tests; App inspection API/action/schema/evidence and tests; local-design-review,
  local-operation-tools and their invocation/fixture/proof tests; existing mapping,
  package test scripts, drawing-inspection E2E, necessary Core/Render docs.
- Gates: focused Render and App tests; delivered-contract/real-owner integration;
  existing review/recovery and dependency tests; deterministic browser geometry,
  read-only history/shared-publication and reload proof; production types, naming,
  touched lint, Inspector source-bound verify and generated workspace contracts.
- Stop on unresolved snapshot semantics, scope expansion, stale admission or a
  repeated failed approach. Review only this diff and direct consumers.

Fixed DoD (not replaceable by label changes or mock-only success):
D1. Execute the actually delivered guide through formal dispatch/real inspection;
workspace overview and element/detail restrictions are visible before first call.
D2. Multiple independent roots with rotation, overlap, hidden elements and order
produce one correct world-space image; exact geometry/pixel oracles, not existence.
D3. No canonical, hierarchy, selection, undo/redo, shared publication or persisted
state changes from capture. No group creation or later repair replay.
D4. Missing/foreign target, empty workspace, unsupported scope, render failure,
document change and cancellation have explicit true outcomes. Known completed read
failures contain no unknown from owner through native reply.
D5. Image success never approves visual quality. All-failed/mixed/all-success output,
settlement and downstream presentation agree; preserve unrelated mutation uncertainty.
D6. Retry only failed captures using returned recovery. Keep valid images and local
judgments; zero additional captures for retained successes, zero mutation replay.
D7. Workspace additions/removals/reorder/visual changes invalidate its broad evidence;
unrelated local passes survive. Workspace switch/load cannot reuse old proof.
D8. Permanent saved-input fixture plus real-owner integration, browser proof and
bounded gates; no ignored tmp dependency, model rerun or CI query.

Feasibility review: use the existing scene workspace container by exact label for
snapshot resolution only; never insert it into the element map or alter other
lookup semantics. Snapshot is already engine-neutral and excludes sibling overlays.
Existing dependency ancestors cover workspace descendant edits; load clears receipts.
Existing multi-target recovery retains images and checks. Extend owner receipt/schema
and aggregate read settlement rather than weakening generic uncertain-write handling.

Implementation and bounded review:
- Snapshot-only workspace resolution reuses the existing scene container and
  engine-neutral Core/Render capture. Ordinary element lookup is unchanged.
- The App checks actual current workspace identity, childCount and overview scope.
  Missing/empty/unsupported targets and capture/evidence failures carry explicit
  completed-read receipts; no image or visual pass is fabricated. Generic uncertain
  writes and real cancellation/transport failures retain their existing semantics.
- The existing review owner distinguishes all-failed, mixed and successful capture
  outcomes, forwards reason codes and retains valid inspection IDs. Recovery follows
  returned failedInspections without replaying edits or recapturing retained images.
- Shared inspection schema, action guidance and review guidance expose workspace
  overview versus concrete-element native detail before dispatch. No new tool,
  state, grouping, registry, cache or renderer-specific App path was introduced.
- The direct owner integration is in the existing server-response harness. The
  existing Inspector capture-handoff proof now executes the App read owner; its
  source mapping includes the actual snapshot and receipt contributors.

Validation evidence (2026-10-24):
- Admission: candidate b43a6744-108e-4274-b267-fd3e8974e53f, accepted contract
  revision 102, review 6b8fcdd33580049e3aa8c4fa536f024731d271dd8b4fcfeffbac3dd406b60d06.
- Fail-first: real Render rejected the workspace target; actual App owner returned
  unavailable for the valid workspace. Logs: tmp/workspace-inspection-render-red.log
  and tmp/workspace-inspection-owner-red.log. Permanent fixture retains the saved
  input; tests do not read tmp evidence.
- Render: 53 tests. App owner/evidence/runtime/presentation/receipt: 404 tests across
  focused runs. Native image interface and execution proof: 85 tests. Discovery,
  schema admission and retained-review consumers: 118 tests.
- Browser: independent-root pixels prove overlap order, hidden exclusion, rotated
  oval shape and unchanged images after selection/pan/zoom. Capture preserves
  canonical state, history and shared/document publications. Add/remove/reorder and
  Undo/Redo invalidate broad evidence while unrelated local evidence survives.
  Durable persistence is confirmed before reload; the reloaded pixels match.
  Existing large-overview/native-detail, scoped-evidence, two-client edit and
  manual-edit/history/load cases also passed on the current production source.
- Browser fixture corrections use the existing compact prepared-delivery adapter,
  existing fill rows, connected-document readiness and explicit persistence receipt.
  Capture history is compared before/after capture, separately from deliberate UI
  actions and edits. One existing cross-client UI case timed out once and passed
  when rerun; that intermittent UI observation is not credited to this repair.
- Production Render/App types, naming and touched lint pass (two pre-existing
  no-console warnings). Inspector source-bound verify passed at revision 102;
  final attempt and source identity are retained in tmp/workspace-inspection-verify.log.
  Generated Inspector workspace is synchronized. Bounded review covered the diff,
  direct discovery/dispatch/invocation consumers, failure branches and evidence life.
- No claim is made about live AI target selection, visual judgment, recovery adoption
  or first-frame timing. Those behaviors were not rerun and are outside this closure.

Live observation and convergence - 2026-10-24:

- Run 1792853203510 used gpt-6-astra / medium, 120 seconds of work, an independent
  60-second report budget, no recording and the production 10,000 artifact limit.
  First visible content appeared at 49.987 seconds. This is not a speed improvement
  claim: the prior run observed 39.374 seconds under different generated work.
- At 109.826 seconds the actual workspace capture returned a 385 x 1024 overview
  in 53 ms, with both nested and outer success/completed receipts. All three
  independent roots were present without regrouping or replaying construction.
- The AI submitted overall pass and detail fail. Both judgments were retained;
  accepted remained false and the correction handoff preserved the failed criterion.
  Successful judgment recording was not treated as successful drawing acceptance.
- Work stopped at 120.004 seconds, acknowledgement followed at 120.012 seconds,
  and no tool/action execution occurred after cutoff. Report generation took
  16.969 seconds. Seven streams were complete; 82 payload/asset hashes matched.
  Saved subtree counts exactly matched 2,311 / 6,164 / 641 created elements.
- Durable sequence 289, root order and fresh-context reload were verified.
  Original evidence remains in tmp/knowledge-evaluation/
  knowledge-quality-knowledge-taipei-101-1792853203510. No capture failed, so AI
  adoption of failed-target-only recovery and nonreplay remains unobserved.
- The user authorized convergence and push of this tested source, including the
  previously converged native oval work. Next-issue discovery is limited to this
  saved run and its direct App/framework owners; no implementation is authorized.

Push integration validation - 2026-10-24:

- Rebased the task branch onto main 91ed0141a. Preserved both spatial facade and
  workspace snapshot contracts; regenerated public documentation from source.
- Rebuilt the dependency graph (16 builds) after detecting stale local capability
  artifacts. Refreshed tests: App inspection/runtime/receipts 404, discovery and
  direct consumers including oval 130, Render 77, Core 15, Preset 5, local gate
  selection 16, naming 15, and both drawing-inspection browser cases passed.
- The validation-chain regression had omitted the existing Preset build and
  selection-consumer steps. Its expected chain and injected failure cases now
  cover both steps; production validation commands were not weakened or changed.
- App production types and touched lint passed (two existing console warnings).
  Inspector revision 102 verification a30bab3d-c51a-4e99-a855-bffec31a7ca2 passed
  against captured source f36521a6c952dbdb5dfdf430e837aca265080468b294d3f0b40055b52847ab98.
  Logs: tmp/workspace-push-*.log. No model run or CI inspection was performed.

### Projected oval handoff - 2026-10-24

Status: locally complete after admission, formal fail-first regressions, bounded
self-review and source-bound verification at Inspector revision 101. Supersedes
sampled ellipse semantics; preserves the prior section as historical evidence.

Objective and fixed DoD: center/u/v defines a planar ellipse independent of point
count. Construction projects it into the existing oval component via official
preparation/dispatcher/Core creation. No tool calls render APIs. Preserve native
explicit vertices, pattern faces/members, order/identity/materials, source lifetime,
node budgets and nonreplayed continuation. Reject segments rather than retaining
an unrequested alias. Never rewrite saved documents or historical evidence.

Step Execution Cards (one owner segment at a time):

1. Prepare: design-face/construction/schema/budget/preparation, linear-field owner,
   existing preset group-bounds public geometry and its Group consumer. Input is
   exclusive vertices or ellipse:{center,u,v}; output is a normal prepared oval
   with bounded finite rotation, plus correct geometric extents and fills. The
   template is projected once; pattern instances translate the completed result.
   Public geometry owns transformed oval bounds; Group preparation and type lookup
   share one operation-local canonical snapshot without repeated full reads. Group normalization preserves
   child origins and world placement. Material phase is expressed in oval-local
   coordinates, not a screen bounding box. No sampling, curve fallback, model,
   render access or new cache. Failure owner: prepare. Test-first projection,
   analytic contour/bounds and materials, invalid/edge-on cases, zero curve-command
   accounting with ordinary object limits. Stop on missing canonical capabilities.
2. Apply: prepared admission and formal Core descriptor consumption, retained
   continuation and material provenance; preset oval render strategy consumes
   rotation only through its normal pipeline. Expected rotation comes from the
   existing immutable source/continuation anchor, never inferred from the current
   document. Permit original oval rotation and Group translation normalization;
   reject changed rotation, skew/scale, hierarchy, binding or unknown settlement.
   No new state or executor. Real Core tests cover partial cancellation, remaining
   work only, duplicate rejection, history, collaboration and saved reload.
3. Inspect/compose: design-review consumes shared oval bounds without bypassing
   unsupported rotated containers; schema/examples deliver center/u/v without
   segments in one existing acquisition. Run the actual example and rendered
   deterministic browser case; tools never invoke the renderer directly.

Bounded owners: existing App files named above and their direct formal tests;
preset group-bounds/components/group/components/oval and tests; existing plan,
AI execution spec/Inspector/mapping, and necessary package-owned behavior docs.
No broad rotation/layout redesign, arbitrary transforms of containers, dependency
installation, registry, scheduler, new tool, model run, 101, CI or push.

Fixed acceptance cases:

- Direct face, faces/members patterns, circles, oblique/conjugate and mirrored
  bases, nearly circular ellipses and edge-on/invalid geometry. Independently
  verify projected center and covariance, oval parametric boundary and exact
  extents; do not compare to a polygon and call it an ellipse.
- Renderer/selection geometry, Group normalization and Frame overflow agree with
  the same canonical transform. Parent/child placements do not drift after
  normalization or reload; unsupported transformed parents remain protected.
- Solid/template fills and world linear fields retain phase across rotations,
  pattern translations, revisions and source reuse. Genuine geometry/binding
  changes invalidate provenance; valid Group translation does not.
- One template compilation/projection per source, no sampled point arrays.
  Ordinary oval node budgets, depth, extent, cancellation and prewrite validation
  remain enforced; reduced path cost reflects the actual native representation.
- Execute actual delivered examples and saved-input-derived cases through the
  dispatcher and real Core; include partial/no-op/failure/recovery and reject
  superseded segments. No extra initial query or full-schema preload; compare
  complete selected delivery plus submission against the frozen prior evidence.
- Applicable focused App/preset tests, formal execution-flow mapping, production
  types, naming/lint, generated Inspector gates, deterministic browser rendering,
  and bounded self-review must pass. Record unobservable AI adoption separately.

Bounded correction after the first deterministic browser proof: creation/history/
reload passed, but screenshot inspection showed zoom-fit clipping a rotated oval.
Core scene bounds still unioned unrotated rectangles and skipped Group envelopes.
This directly prevents the fixed bounds DoD. Extend only this existing downstream
bounds path: move the analytic ellipse rectangle calculation into Utils geometry
bounds; Preset and Core consume it, with no new registry or retained computation.

Step Execution Card - apply / canonical world bounds: input is finite canonical
oval position, dimensions, radians and existing unrotated ancestor translation;
output is analytic world extents for current viewport consumers. Explicit oval
semantics only; preserve other shapes and invalid/missing hierarchy rejection.
Owners/allowlist: Utils render/geometry-bounds and tests, Core apis/scene-bounds and
its existing formal tests, Preset group-bounds, and the existing browser proof.
No renderer lookup, alternate viewport algorithm or new transform state. Add a
failing Core world-bounds test before implementation, then rerun the complete oval
browser case and inspect both initial and reloaded screenshots. This is the
existing rotation/bounds DoD, not an additional product feature.

Local closeout - 2026-10-24:

- Native projected ovals now use center/u/v only. Removed segment-based ellipse
  generation and its active schema/example contract; explicit polygon vertices
  remain valid. Tools still use preparation, dispatcher and official Core creation.
- Fail-first evidence covers native geometry/admission, analytic Group bounds,
  material normalization, existing oval render rotation (0 instead of 0.63),
  Core world bounds (minX 10 instead of 5.6298397555), and duplicate Group snapshot
  work (two reads instead of one). Final Group preparation reuses its existing
  operation-local snapshot; no persistent cache or extra registry was added.
- The saved-source-derived case retains 225 ordered identities, including 192
  native ovals. Every original oval contour sample lies on the analytic curve;
  unrelated polygon descriptors/world placement remain equivalent. A true curve
  can extend beyond the old polygon extrema, so the Group envelope legitimately
  changes. Historical fixture bytes were not rewritten.
- Exact selected first delivery: 19,931 bytes in one response versus the frozen
  19,948-byte baseline. Saved input: 6,918 versus 57,630 bytes. Combined delivery
  plus input: 26,849 versus 77,578 bytes (65.39% reduction). This proves encoding
  and handoff reduction, not model adoption or elapsed-time improvement.
- Formal local verification: Runtime 433; preset subscriptions 37; App server
  harness 1,684 passed with two existing opt-in skips; direct apply/material/review
  consumers 92; projected oval suite 12; Preset bounds/group/render 24; Core scene
  bounds 11; Utils geometry bounds 4; Inspector/workspace contracts 27. Counts
  overlap where the harness includes focused files. Two outdated assertions were
  corrected against the new contract, then their complete files (117 tests) and
  the server harness passed. The skips are installed native registration and the
  opt-in large checkpoint bootstrap; neither counts as evidence for this slice.
- Production App/server/flow-proof types and Utils/Core/Preset builds passed.
  Naming passed; scoped lint has zero errors and the existing unrelated
  execution-flow-proof console warning. Scoped Inspector verification passed at
  revision 101: attempt d0824bda-76a6-45f2-91a3-eb15a8958357, source digest
  af0f8c7a8916d921c7edde3473138cad67b4e976d956c7044c0d838a510363bd.
- Deterministic browser proof at `http://localhost:3307`: `test:e2e
  e2e/design-construction.spec.ts --grep 'structured ovals' --workers=1
  --max-failures=1 --reporter=line`. Real App creation, rendered rotation,
  analytic scene bounds, native hits after the normal viewport update, one
  Undo/Redo and durable reload passed. Screenshots before/after reload were
  inspected at 1440x1000, zoom-fit, no selection or agent panel. Initial clipping
  was fixed at Core bounds, not hidden by test viewport changes. Final artifacts:
  `apps/asyra-design/test-results/design-construction-struct-e50fe-able-geometry-with-one-Undo-chromium/ovals.png`
  and `ovals-reloaded.png`. No model or 101 was involved.
- Review covered changed owners and direct consumers, material phase/revision,
  real cancellation/remaining-only recovery, duplicate rejection, history,
  collaboration publication and durable replay. Arbitrary transformed containers
  remain outside this contract; genuine changed transforms/bindings remain
  rejected. AI adoption, first-frame timing and visual judgment are unobserved.
  No CI query, remote push, new dependency, automation or new state owner.

### Sampled planar ellipse handoff - 2026-10-24

Status: locally complete after admission (revision 95), fail-first regression, bounded delivery iteration and source-bound verification (revision 96).

Delivery review found two direct-consumer obligations: adding the canonical ellipse
option exceeded existing guide-byte ceilings, and the generic example oracle
assumed every projected face used vertices. Keep those byte ceilings unchanged.
Consolidate redundant projection/pattern prose without dropping constraints; extend
the independent oracle to expand ellipse samples and translations. This iteration
changes neither discovery selection nor limits. The fixed DoD remains unchanged.

Evidence: run 1792839882487, provider 7e6750b8-41cd-45e5-a227-9e0486d6a289,
81-input.json (SHA-256 b79a470d717353ce76113380fa410c6a1456c28f904ba92f341e36451a3d4b6a)
already uses eight pattern instances. Its 57,630-byte input contains 24 sampled
ellipses and four quadrilaterals (976 template vertices); vertices consume 53,384
bytes. Existing projected-face and motif inputs require explicit vertices; 2D
vector-pattern explicitly does not project. Do not infer that the 20.400-second
pre-submission interval is entirely caused by this data or claim faster live work.

Step Execution Card - prepare / sampled planar faces:

- Input: a projected-face or pattern face selects exactly one of vertices or
  ellipse:{center,u,v,segments}. World vectors u/v are nonzero independent
  conjugate radius vectors; equal perpendicular radii describe a circle.
  segments is an explicit integer from 3 through the existing primitive guard.
  Sample i is center + u*cos(2*pi*i/segments) + v*sin(2*pi*i/segments), i=0..n-1;
  no repeated closing point, automatic precision, normalization or fitting.
- Output: ordinary editable vectors via the existing projection, materials,
  pattern translation, identity, preparation and application pipeline. Preserve
  vertices as an independent legal representation; no new node/tool or alias.
- Owner: construction owns bounded sampling once per template per preparation;
  budget admission counts segments before sampling, multiplied by selected
  instances for expanded cost. Existing source snapshot/retention and repair own
  lifetime. Existing world-field semantics and painter order are unchanged.
- Boundaries: design-construction/schema, a focused design-face geometry helper,
  design-budget and their tests/fixtures. Forbidden: model calls, canonical writes
  during preparation, renderer changes, new cache/store, hidden approximation,
  fixture-specific geometry or relaxed budgets. Failure owner: prepare.
- Cases: root face, faces and mixed members, generic rotated/oblique planes,
  mirrored basis, circles/nonuniform ellipses, explicit quadrilateral siblings,
  fill templates/world fields, ranges, partition continuation, invalid/both/missing
  forms, nonfinite/collinear basis, invalid segments and generated extent.
- Stop: inability to preserve sampled contour/order/material, unbounded sampling,
  new ownership mechanism or required out-of-scope behavior.

Step Execution Card - compose / selected delivery, after prepare gates:

- Existing owner schema/examples feed selected usage and complete field/full
  queries. Replace the selected projected-face example's explicit ellipse-like
  data with the executable generic descriptor; no new preliminary request or
  exhaustive schema. Execution must use the exact delivered example through the
  dispatcher, not a separately authored substitute. Failure owner: compose.
- Allowed: preparation examples, existing workflow discovery, actual discovery
  integration and execution-flow proof. Existing checks/recovery remain complete.

Step Execution Card - apply / direct-consumer proof, after compose gates:

- No production mutation owner changes. Extend the existing real Core interrupted
  design integration to consume the new descriptor and verify canonical geometry,
  partial cancellation, remaining-only recovery, duplicate rejection, history,
  collaboration and saved reload through existing owners. Failure owner: apply.

Fixed DoD and gates:

1. Permanent saved-input fixture (no ignored tmp dependency), red test before
   implementation, explicit independent reconstruction oracle. Preserve all 225
   elements, projected samples, material values, order, identities and references
   within existing numerical precision; do not silently resample/simplify.
2. Non-101 generic cases exercise the same owner without subject-specific code.
3. Execute actual delivered example through schema, dispatcher and downstream
   owner; selected acquisition is one response with complete limits/recovery.
4. Saved compact input <=10,000 bytes; actual selected instruction/example plus
   submitted input is smaller than the frozen pre-change counterpart. Do not
   increase acquisition round trips or preload unrelated schemas. Preserve inline
   vertices and optional 2D methods without forcing ellipse adoption.
5. Budget/invalid input reject before writes; exact expanded costs, primitive
   bounds, sampling/projection work counts and changed-input isolation pass.
   Existing parts, partial success, cancellation and no-replay recovery pass.
6. Focused preparation/pattern/material/discovery suites, real Core integration,
   existing execution-flow gate, naming, scoped lint, production types, generated
   Inspector checks and source-bound verification. Bounded self-review covers
   changed owners, direct consumers and failure paths only. No model/101 or CI.


Local closure evidence:

- Fail-first: six selected regressions failed on the admitted pre-implementation
  source: unsupported face geometry, zero structural point accounting and missing
  delivered ellipse example. Logs: tmp/ellipse-red.log.
- The existing projected-face and both pattern representations now accept an
  exclusive ellipse descriptor. Sampling stays in construction, once per source
  template; budgets count segments before allocation. No canonical write owner,
  rendering, retained store, scheduler, limit or discovery round trip was added.
- Permanent saved-input fixture preserves all 225 entries, names, keys, geometry,
  materials, order and references. Input bytes: 57,630 -> 7,254 (87.4% fewer).
  Actual selected guide: 19,948 -> 19,929 bytes, one reply. Guide plus submission:
  77,578 -> 27,183 bytes (65.0% fewer). Existing delivery ceilings were not raised.
  Source data and historical evidence remain immutable.
- Geometry suite: 18 passed, including generic planes/circles/ellipses/mirrored
  radii, source isolation, ranges, invalid inputs and pre-allocation limits.
  Exactly 40 sample cosine evaluations plus two camera evaluations compile a
  100-instance template; 141 projection calls include shared zero and offsets.
- Real Core interrupted integration: six passed, including explicit and ellipse
  variants. Cancellation retains partial membership and receipts; remaining-only
  recovery, duplicate rejection, Undo/Redo, collaboration publication/replay and
  durable save/load preserve the final canonical state.
- Direct delivery runs the actual selected composition example through the
  dispatcher and application owner. Degenerate/ambiguous inputs write nothing;
  corrected execution writes once; refresh does not replay completed writes.
  Existing example consumers now independently expand ellipse samples instead
  of assuming every projected face exposes vertices.
- Execution-flow local stages: Runtime 433 passed; preset 37 passed; final App
  harness 1,690 passed, two existing opt-in skips (installed native registration
  and large saved-checkpoint bootstrap), neither counted as passing. Actual native
  image tests ran in the App harness. App/server/proof production types passed;
  naming 15 passed; lint zero errors, one pre-existing console warning.
- Inspector admission candidate 4a29354b-4862-4058-afc2-3504fa8fdd12 passed before
  implementation. Final 75-case verification 231d7c45-340f-4d15-8b05-ca247640c0ad
  passed at revision 96, source
  50b9dbc16d384239a2eda252022c2a1e19473ee39e2205d93de7206b26b05c84.
  The new regression suite is wired into test:server-response-harness, and the
  sampled-ellipse product case is mapped to prepare in flow-contracts.json.
- Generated workspace/catalog/package checks: 26 passed; this Inspector's own
  contract checks: two passed. Broader legacy viewer checks have one unrelated
  existing failure: canonical-projection-and-collaboration-contract-realignment
  artifact:property-intent-result lacks a terminal route. Its source and the
  failing test match HEAD; no out-of-scope repair or whole-suite pass is claimed.
  A filtered legacy viewer command selected no applicable cases and is not used
  as evidence. Logs: tmp/ellipse-generated.log and tmp/ellipse-inspector-contract.log.
- Bounded self-review covered changed owners, schema/executable examples, budget
  accounting, direct consumers and failure/retention paths. Initial proof capture
  excluded test fixtures by policy; the mapped proof now uses a generic inline
  oracle, while the formal App suite owns the immutable saved-input regression.
- No model/101, CI inspection or push. These results prove generic deterministic
  capability and lower delivery volume; model adoption, first-frame timing and
  visual-quality improvement have not been observed for this change.

### Native image delivery - authorized live observation - 2026-10-24

The user's subsequent authorization allowed one 101 observation with 120 seconds
of work and at most 60 seconds of reporting, no video, and production capacity
10000. Run 1792839882487 completed with a partial product result. First content
appeared at 38.460 seconds; work stopped at 120.004 seconds and report capture/UI
settlement finished at 135.297 seconds. Actual configuration was gpt-6-astra / medium.

Three main submissions produced three original inspection images. AI bound the
existing first image after criteria definition without recapture, later bound two
existing images, and recorded a detail failure with accepted=false. No App action
started after the work deadline. All referenced payloads/assets verify; the fresh
reload matches root order and durable sequence 257/257. No display failure/recovery
was observed, and live Code Mode store/load internals remain unavailable. Preserve
the historical forwarding-error uncertainty and separate the earlier native local
recovery proof. First frame was 0.992 seconds later than the preceding run, not a
speed-improvement claim. Services started for this observation were stopped.

See [the bounded image-delivery observation](../evaluations/2026-10-24-image-delivery-101.md).
No product code changed and no further live run is authorized by this result.

### Native image delivery and recovery - 2026-10-24

Status: complete within the fixed local DoD; no live-model outcome is claimed.

- Admission candidate 85963345-5049-4977-ad42-17e1809ab32e; review
  6b849fdcc318a1e00673a5e3bc682a72f62543ffbd099a7ab6e0f74b150f7e80 accepted.
- Red: published example lost the retained result on display failure
  (tmp/image-delivery-red.log). Native baseline independently passed zero/one/two
  images through the old image(uri) recipe. This rejects an assumed interface
  format bug on the tested native version; historical error remains unconfirmed.
- The fixed example saves before display; recovery uses existing load without
  invoking the producer. Native malformed-display injection now recovers the
  original image in the next execution with one producer invocation total.
  Criteria-before/after cases bind through the real review owner with one write
  and one capture, then reject stale evidence.
- Final admission review
  dc0c5fa42af805e9d9e237e94c4c6d23588a57e188563c6ca59a8f2db41fa957
  accepted the new compose.image-display-recovery case and existing source
  rebindings. Inspector verification 0527920e-f596-4faa-b64e-561b881943e3 passed
  at mapping revision 94 on source
  3674416f536c98f3f51a2f4b0f4f16d767a3e2d5b2f0151134153717f98dc4aa.
- Validation: Runtime 433, preset 37 and App 1,669 tests passed. The App run
  retains two existing opt-in skips: native registration without inference and
  saved large-checkpoint bootstrap measurement. Neither is an image delivery
  oracle; all ten image integration cases ran, including the actual native
  interface. Native delivery consumer suites passed 15 Node and 11 Vitest cases;
  the final provider-instruction assertion also passed independently. Generated
  workspace/catalog and Inspector contract checks passed 27 cases. Naming and
  all three production type projects passed; scoped lint has zero errors and
  two pre-existing console warnings. Diff whitespace validation passed.
- Self-review: production behavior changes only the published receipt guidance
  and executable examples. The native harness preserves exact completion items
  and inspects actual successor requests. Recovery uses the same stored result,
  leaves success/partial/cancelled receipts intact, and does not call the producer.
  Missing/malformed values, separate keys, release, criteria-before/after binding
  and stale evidence are covered. Existing multiscale and local-result protections
  passed with direct consumers. No new mutation, persistence or review owner was
  introduced. The initial broad gate's mapping block was resolved through final
  admission and verification, not bypassed.
- Evidence limit: the argument rejection in the native recovery test is an
  explicit injected fault, not reconstructed historical arguments. Current
  outbound pixel identity is proven; live model visibility, judgment and adoption
  are not. Historical records remain unchanged. No model/101, CI or push ran.

Step Execution Card - compose / image result delivery:

- Objective: execute the published receipt recipe through the native image helper,
  retain a result before display can fail, and recover display/binding without
  drawing or capturing again. Historical run 1792834534052 reports a forwarding
  argument error, but the actual Code Mode arguments/error are not preserved;
  this slice must not claim that historical cause is established.
- Spec: Image result delivery and recovery; existing reference transport and
  main-workflow visual judgment handoff. Inspector: compose conditions, inputs
  execution-receipt/inspection-evidence, tool-program output, failure owner compose.
- Inputs: admitted original result text and pixels, a fresh caller-selected
  resultKey, existing Code Mode store/load, registered review binding contracts.
  Outputs: unchanged receipt plus native image blocks; a retained result that
  can be redisplayed without another tool invocation; exact existing bindChecks.
- Conditions: zero/one/multiple images; storage precedes parsing/forwarding.
  Recovery loads the selected key and does not invoke its producing operation.
  Missing/malformed retained values fail explicitly. No visibility/pass claim is
  derived from mutation or transport success. Binding validates current criteria
  and scoped dependencies; defining criteria later does not require new pixels.
- Owner/boundary: existing local-operation-tools delivery examples/instructions,
  native-delivery offline harness, formal image-delivery integration and current
  workflow/provider consumers. Existing Code Mode storage is the only retention;
  existing review owner remains the only binding and invalidation authority.
  No new tool, registry, scheduler, image cache, retry loop or compatibility path.
- Allowed contributors: actual localToolContent, delivered recipe, installed
  native executable against fixed local responses, saved non-secret PNG/receipt
  fixture and real review owner. Forbidden: true model/network inference, mocked
  image helper as the native acceptance oracle, generated replacement evidence,
  geometry regeneration and broad removal of diagnostic redaction.
- Fixed DoD: (1) execute the actual published recipe, not a copied test recipe;
  (2) zero/one/multiple images reach successor requests with matching bytes/order
  and no base64 text; (3) forwarding failure preserves acknowledged writes and
  permits store/load redisplay with zero extra drawing/capture calls; (4) criteria
  before/after capture bind through the real owner, preserving local/multiscale
  results and invalidation; (5) execution, native delivery, model visibility and
  visual verdict remain distinct; (6) historical root cause stays unconfirmed.
- Formal gates: red retention regression before production changes; native
  offline integration with actual inputImage adapter and successor request;
  workflow/provider/reference/discovery direct consumers; execution-flow proof;
  naming, scoped lint, production types and generated Inspector checks. Wire the
  native consumer into the existing App harness, not an optional manual probe.
- Feasibility/review: native-delivery already supplies fixed responses to a real
  executable and captures successor bodies. Extend its existing reply/comparison
  contract for native image items; do not simulate their conversion. Existing
  review bindChecks accepts captured inspection IDs and never needs a redraw.
  The old example has no store call, so retention failure is reproducible without
  assigning a cause to the historical error. Native-format coverage is preventive
  until a genuine interface mismatch is observed.
- Stop: retained identity collision, changed receipt/geometry, stale binding
  accepted, unbounded retention, or inability to reach the real native interface.
  No model/101, CI, push, Knowledge changes or edits to historical evidence.

### Brief to safe capacity handoff - 2026-10-24

Status: locally complete; fixed DoD verified. The subsequent authorized run
`1792834534052` observed first content at 37.468 s, four completed applications
(10,581 elements total) and reporting/UI settlement at 132.643 s. Every individual
submission was below 10,000, so oversized-brief continuation and interrupted
recovery remain locally verified rather than observed in this run. Material
acceptance remained fail; no final visual pass is claimed. No App action continued
after the 120-second work deadline. Fresh-context root order and durable receipt
337/337 matched. No further model run, product edit or push is implied.
See [the bounded follow-up report](../evaluations/2026-10-24-brief-capacity-101.md).

Implementation-stage record (before the separately authorized live observation):

- Admission: candidate b7b4b82d-c247-48d8-a79d-98f10b1d4ff3, accepted review
  d2f9999b328c0ca8e9c329be6d5effb13843af382979ebf31627e66a8b53ec2c.
- Red: four new saved/generic brief and limitation cases failed on the prior
  implementation (tmp/brief-partition-red.log). Prepare gates then passed 126.
- Consumer test corrections: review belongs to the preparation receipt, not the
  compact artifact; pattern fixtures must include their advertised name/origin.
  The saved native input also contains plan and immediate inspection, requiring
  the corresponding registered capability. Its transport fixture has no pixels;
  preserve the real capture failure after successful writes. The real headless
  Core fixture lacks an App inspection evidence session; its unverified mechanical
  follow-up must remain partial, independently of complete canonical application.
  A prepended fixture import displaced native-test triple-slash type directives;
  restore their required header position rather than change production TS config.
- Bounded self-review found two direct-consumer regressions in the first full
  harness: replacing the budget message removed measured costs and established
  parts guidance. Preserve those diagnostics and append the partition limitation.
  Retain the original successful native source-only case beside the saved brief
  case, including its real unavailable-capture partial outcome. No guard weakened.

Local closeout:

- The unmodified saved arguments and SHA-256 are a permanent fixture; tests do
  not read ignored evidence. The saved source now yields 9,857 / 517 prepared
  entries, with the second artifact continuing the first root. Geometry, fills,
  source order and references match independent compilation. Both parts retain
  the exact brief; criteria are recorded once before the first write, not again
  for the continuation. Runtime logic contains no subject-specific exception.
- Existing budget owner now returns partitions or a bounded limitation; the
  existing repair store retains that decision and includes its bytes in capacity.
  Removed the ambiguous undefined-only planning result and updated every direct
  consumer. No new scheduler, store, registry, cache, state or compatibility path.
- Safe empty-check briefs use the main tool's existing automatic parts. Numeric
  whole-design checks remain explicitly unsupported for automatic partitioning;
  original source/checks are retained, while ordinary single-artifact evaluation
  remains tested. Duplicate key families, unsupported relations/layout/shared
  bindings, indivisible excess, expiry and retention limits remain protected.
- Final formal gates: App harness 1,656 passed / 2 existing opt-in skips;
  Inspector 73 passed; real Core integration 5 passed; generated Inspector tests
  27 passed; naming 15 passed; all three App typecheck projects passed; scoped
  lint zero errors / two pre-existing console warnings. Runtime 433 and Preset
  37 passed in the root gate; neither changed in the subsequent App diagnostic
  correction, so only affected App/Inspector gates were repeated.
- The two opt-in skips are installed native executable registration and the large
  checkpoint encoding probe, not brief/capacity cases. No live native executable
  or model test is claimed. Headless capture/evidence gaps remain partial outcomes
  after successful writes, never fabricated inspection passes.
- Real Core proves one root, original completed IDs, cancellation/remaining-only
  recovery, duplicate rejection, Undo/Redo, durable collaboration and save/reload.
  Native transport tests cover both the prior successful source-only input and
  the saved brief input with its explicit unavailable-capture follow-up.
- Final Inspector verification: 21351e16-3749-4a84-b5d9-f834840b49ee,
  source 9c4318fec885ec0ee0185f4b9b3fba5ca34aa16e872eef90562df13baab54d21,
  mapping revision 92. Admission preceded implementation; final contract review
  1be207138dd79928e2f261d3fc236459297e9487819e1e95ab751a582e1dad27
  confirmed no semantic drift from the admitted contract.
- Evidence logs: tmp/brief-partition-red.log,
  tmp/brief-partition-consumer-corrections.log,
  tmp/brief-partition-core-final.log, tmp/brief-partition-harness-final.log,
  tmp/brief-partition-inspector-final.log, tmp/brief-partition-types-final.log,
  tmp/brief-partition-generated-tests.log and tmp/brief-partition-lint-final.log.
- Self-review was limited to changed owners, actual direct consumers, preserved
  guards and fixed gates. Keep the production limit at 10,000. No model/101,
  CI inspection, push, historical report edits or unrelated task work occurred.

Step Execution Card - prepare:

- Objective: preserve accepted descriptive brief metadata in automatic safe capacity
  continuation, without removing checks or asking the model to split/resend geometry.
- Evidence: run 1792830831162, original provider 19-input.json: 10,373 expanded
  objects from 39 source nodes. The root brief contains empty checks; the root-key
  eligibility guard excludes brief and retains source without partitions. Removing
  only brief in a read-only diagnostic yields parts of 9,857 and 517 entries.
  Each selected original source compiles with brief retained and no findings.
- Spec: AI execution flow / Source-referenced expansion recovery. Inspector:
  prepare conditions, retained-capacity output, compose sequential parts consumer.
- Inputs: admitted root brief, immutable source, existing request-local limits.
  Outputs: retained partitions with unchanged brief, or an explicit partition
  limitation with original checks/source retained; no compiled claim or writes.
- Conditions: descriptive brief with empty checks may partition. Nonempty numeric
  checks require whole-design layout semantics and remain an explicit no-write
  limitation for automatic partitioning. Non-overflow checks still compile and
  evaluate normally. Unsupported root semantics, conflicting keys, indivisible
  excess and retention capacity stay protected; no silent metadata deletion.
- Owner/boundary: budget planner decides eligibility and cost; existing repair
  store retains the decision/source; local preparation delivers it. Use the
  construction schema for brief shape admission. No second validator, registry,
  scheduler, cache, artifact ceiling increase or compatibility branch.
- Allowlist: design-budget.ts, design-draft-repair.ts, local-design-tools.ts;
  formal draft-repair/local-design-tools tests and recorded-101 fixtures.
  Failure owner: prepare. Compose must consume the same owned plan unchanged.
- Fixed DoD: (1) saved input and a generic brief case fail before the fix;
  (2) original brief and every source sibling/instance, geometry, material, order
  and references survive partition compilation; (3) one public main invocation
  consumes parts with one root and no source resubmission; (4) malformed brief,
  nonempty checks and existing unsafe shapes never write or drop restrictions;
  (5) checks remain valid on ordinary single-artifact input; (6) cancellation,
  remaining-only recovery, expired references, history, collaboration and reload
  preserve real completed results without replay; (7) direct consumers and
  formal execution-flow mapping remain enforced on this source.
- Gates: focused owner/repair/motifs/preparation tests; workflow and native-provider
  handoff tests; real Core interrupted integration; formal execution-flow gate,
  production types, scoped lint, naming and generated Inspector checks.
- Stop: an eligible partition changes relationships/check meaning, requires new
  ownership, or any fixed DoD cannot be established. No model/101, CI, push, broad
  audit, historical report edit or unrelated capability extension.

Step Execution Card - compose/apply verification (after prepare gates):

- Inputs: actual retained capacity plans and normal cancellation/continuation.
  Output: existing ordered part receipts and one canonical root, including partial
  results. Owners remain compose and canonical apply; no production change planned.
- Spec/Inspector: same recovery section; compose capacity continuation and apply
  canonical identity/history rules. Existing workflow/provider and interrupted
  integration test allowlists are the boundary. No mocked owner success may stand
  in for Core/history/collaboration/reload proof.
- Verify the saved brief through real preparation and public main dispatch; extend
  the existing real Core cancellation case with descriptive brief, and retain its
  no-replay/history/durable-state assertions. Add a mapped product case for this
  metadata-to-capacity combination, not a standalone helper-only test.
- Stop on a consumer mismatch; recheck the exact Inspector before advancing.

### Incremental UI hierarchy projection - 2026-10-24

Step Execution Card - apply / canonical creation to UI projection:

- Objective: avoid rediscovering roots and walking unchanged subtrees during
  continuous creation, while retaining each exact batch's complete immutable
  flattened list and projected rows. Preserve cancellation, recovery and history.
- Evidence: saved run 1792770001609, original provider 32-output.json, SHA-256
  a0b9871ea8bebe255f9551b704985ce450fe2aaaf33441d190d7dba52c45155f:
  4,114 entries, 130 publications, 268,435 flattened output identities and 66.6 ms
  inclusive UI projection. Source snapshot matches current projection owner.
  Output copying is required; these counts alone do not prove unnecessary work.
- Owner: existing Preset data-channel UI projection under apply. Input is the
  admitted ordered Scene Tree batch and exact current map/array identities.
  Output is the same ordered immutable UI snapshots, synchronously per batch.
  Failure owner: existing projection lifecycle, never a new mutation/retry owner.
- Conditions: reuse only complete retained hierarchy with matching published
  identities and live observer. Prove additions are fresh, empty of pre-existing
  children, at their parent's tail, and extend the current depth-first tail.
  The existing full derivation remains necessary for cold/incomplete/reseeded
  projection, interior insertion, move, removal, reorder and mixed structural work.
  No type/tool-specific route, batch enlargement or delayed/coalesced publication.
- Feasibility: the existing parents/children maps and last flattened ID establish
  the terminal ancestry and child counts. A request-local append sequence can be
  proven before mutating projection, consumed for memberships and flattened
  output, then discarded. Reuse the same hierarchy lifetime; add no retained
  cache, authoritative tree, scheduler, registry or public/persisted identity.
- Names: internal append planning and diagnostic work counts belong to
  preset/subscriptions/data-channel.ts. Existing event names, UI properties,
  publication cadence and immutable array/map contracts remain unchanged.
- Allowed contributors: canonical Scene Tree changes, current Preset projection,
  existing diagnostic helpers and public Core/UI subscriptions. Forbidden:
  canonical rereads for future state, App hints, renderer writes, guessed order,
  mutation replay, shared mutable published arrays and full-document gating.
- Implementation boundary: packages/preset/src/subscriptions/data-channel.ts and
  its selection-subscriptions.test.ts; existing App prepared-delivery and
  interrupted-design integration tests, execution-flow-proof.test.ts and mapping;
  root existing test:design-execution-flow registration, active plan, preset
  package spec, App execution spec, Inspector and generated bundle. No App UI or
  canonical mutation implementation changes; test existing direct consumers.
- Fixed discovery: above owner, its direct UI subscribers, original saved case,
  existing real-Core/Runtime/history/durable collaboration tests. No broader audit.
- Fixed DoD: (1) formal real-owner test first fails on unchanged-subtree visits;
  (2) retained tail additions visit no unrelated subtree regardless of unrelated
  existing document size, with derivation, immutable copying and publications
  measured separately; (3) every batch equals full derivation, old snapshots stay
  unchanged and future batches never leak; (4) interior insertion, move/remove,
  reorder, custom containers, reload, foreign reseed, failure/reentry/disposal
  remain correct and invalidate reuse when necessary; (5) saved-input real
  dispatcher/Core plus cancellation, partial receipts, no-replay continuation,
  Undo/Redo, collaboration and durable reload pass with UI projection enabled;
  (6) existing App layer/selection/drag direct-consumer tests stay green and
  formal owner tests join the existing root gate. No live latency claim.
- Gates: naming baseline and final; task context; Inspector admission before
  tests/implementation; owner formal red/green; direct-consumer tests; existing
  root execution-flow gate; preset build and App production types; scoped lint;
  generated Inspector tests; bounded self-review. No model, 101, CI or push.
- Stop/replan if three owner correction attempts fail, if incremental ordering
  requires new retained state or owner, or if correctness requires deferring
  publication. Self-review confirms the full derivation is a valid current path,
  not compatibility or a way to conceal malformed output.

Local closure and bounded self-review:

- Initial admission preceded regression/production edits: review
  9695f1befc856aaf0e39ccd89e256b135436bb3b50b7da0a678e4d3f41bfeffa.
  Final accepted review
  17d0e79c1f7125e3fc97d8abae2f7345c2691401821fd91fc79492a63975737f;
  verification 506e4f9c-2250-4814-bd60-4899072c8728 passed at revision 89,
  source e442ad1ad5bde4ec75662c2fb1aa4398aab3ab9314093ddc950b1435d75b6f34.
- Formal red: three tail publications revisited 32/1,024 unrelated identities
  288/9,216 times through actual Map reads. The unchanged formal assertion now
  observes zero such reads. Existing tests covered row reuse but missed this
  retained-tree traversal. No temporary test or ignored fixture is required.
- Implementation reuses existing complete hierarchy preparation. A local terminal
  ancestry proof admits fresh tail entries, appends private memberships and
  creates the full immutable ID array. There is no new retained state, changed
  canonical owner, enlarged batch or deferred publication. Complete derivation
  remains authoritative for all other structural changes.
- Self-review found mixed indexed/unindexed scalar additions could reorder private
  memberships on the fast path. A formal warm-versus-cold regression reproduced
  the mismatch before correction. Flush already-collected additions before an
  unindexed append; preserve both immediate ordering and later derivation.
  Reentry and failing descriptor reads retire preparation; existing event-bus
  observer isolation is preserved, not relabeled as a new recovery mechanism.
- The Inspector reference check found full document paths in section-only
  specRefs. Corrected the references to the current App section, linking its
  Preset authority there; the authority check itself was not weakened.
- Saved-input real dispatcher/Runtime/Core replay preserves all 4,114 identities,
  geometry/materials, 130 complete publications and every earlier snapshot.
  Counts: one root candidate/complete-tree visit at initialization, 4,113 appended
  entries and 386 terminal-ancestry visits. Required immutable copying remains
  264,321 old IDs and cumulative complete output remains 268,435 IDs. These costs
  are explicitly retained, not counted as eliminated work or smaller delivery.
- Final root test:design-execution-flow passed: Runtime 433, Preset 37, App
  harness 1,646 and Inspector 72. The Preset build and formal owner suite now run
  through this existing entry before App integration. Two existing harness cases
  were skipped: installed native registration without an explicitly supplied
  executable, and opt-in large-checkpoint transport encoding/decoding. Neither
  is changed by this projection slice or counted as passing coverage.
- Direct consumers: 48 tests across nine files passed on the final built owner,
  including UI rows/order, interrupted partial receipts, remaining-parts recovery
  without replay, Undo/Redo, durable collaboration/reload, layers, selection and
  drag. Generated Inspector/contract tests: 27 passed. Naming: 15 passed.
  Preset build, App production typechecks, task-context preflight and diff checks
  passed. Scoped lint: zero errors, three diagnostic-console warnings (one new
  bounded work-count measurement and two pre-existing measurement warnings).
- Logs: tmp/ui-projection-red.log, tmp/ui-projection-mixed-red.log,
  tmp/ui-projection-preservation-final.log, tmp/ui-projection-root-flow-final.log,
  tmp/ui-projection-consumers-final.log and tmp/ui-projection-inspector-tests.log.
  Formal tests and the existing compressed saved-input fixture are tracked;
  these local logs are supplementary evidence only.
- This bounded slice is complete; Task 3 remains active. No model/101 execution,
  CI query, push or new first-frame/visual-quality/Knowledge-effect claim.

### Compact prepared delivery - 2026-10-24

Step Execution Card - apply / prepare-to-apply:

- Objective: consume retained prepared artifacts without transmitting repeated
  property-ID values and keyToId alongside the same entry keys and IDs.
- Evidence: saved run 1792770001609, native 25-input, SHA-256
  19df66cb35a03beafca9289b95b33ee20752de34bfd60e3263dd84c1c635d04a,
  contains 4,114 entries / 17,380,806 bytes. A read-only reconstruction of property
  IDs from property names and entry IDs plus keyToId from entries was identical
  and reduced bytes by 15.98%. This is feasibility evidence, not completed tests
  or proof of first-frame latency improvement.
- Owner: existing App action resolver projects its retained canonical artifact at
  delivery; browser admission restores derivable maps once and invokes unchanged
  canonical admission before ordinary execution. Failure owner: apply.
- Inputs: owned applicable canonical PreparedDesign, response mode, optional
  parent/attachment evidence and material member IDs. Outputs: compact delivery,
  then identical admitted canonical descriptors and actual execution receipts.
- Conditions/bypasses: every apply_prepared_design browser call uses the new
  delivery version; no full-map wire fallback. Canonical artifacts and their
  existing internal validator remain valid independent APIs, not wire aliases.
  Explicit full output still returns complete key/role mappings. Other prepared
  drawing/conversion formats remain independent and unchanged.
- Allowed: existing artifact resolution, action dispatch, admission and mutation
  owners. Forbidden: topology/layout/material recompilation, guessed defaults,
  changed IDs/order/geometry, new cache/state/registry, automatic replay, model calls.
- Names: PreparedDesignDelivery and deliverPreparedDesign belong to existing
  prepared-design.ts; admitPreparedDesignDelivery belongs to existing admission.
  Delivery version 2 replaces the old full-map wire shape. The canonical in-memory
  artifact version remains unchanged and is never accepted as browser delivery.
- Work boundary: shallow per-entry projection, one reconstruction per actual
  browser invocation and the existing canonical validation. Preserve geometry
  object references until normal serialization; repeated resolution never rereads
  caller draft or recompiles geometry. No new retained computation.
- Implementation boundary: prepared-design.ts, prepared-design-admission.ts,
  design-actions.ts and local-design-tools.ts; their direct tests, existing
  interrupted-design integration, a permanent saved-input fixture and a formal
  prepared-delivery integration suite registered in the existing server harness.
  Update direct fixture callers to the real delivered format, never add runtime
  compatibility to satisfy old tests. Active plan, ai-execution-flow specification,
  Inspector/mapping/generated bundle and App package test entry are in scope.
- Fixed discovery: saved 19/25 inputs and source snapshot, these owners and direct
  consumers, existing preparation/application/interruption/material tests. No
  repository-wide audit, new geometry feature, transport compression or budget change.
- Fixed DoD: (1) complete canonical equivalence including shapes, text, curves,
  containers and shared materials; (2) actual resolver/dispatcher/admission/Core
  execution equivalence; (3) malformed/missing/duplicate/foreign references reject
  before writes; (4) cancellation and partial-prefix recovery without replay,
  Undo/Redo, save/reload and affected collaboration preserve references; (5) at
  least 15% saved-case input reduction, measured encoding/decoding, no new geometry
  recomputation, whole-draft resend or model round trip; (6) permanent fixture and
  direct consumer tests run in existing gates, with no old wire branch.
- Gates: naming baseline/closeout; task context; Inspector admission before test
  edits; failing formal regression before production; focused preparation/delivery
  and real-owner preservation; root test:design-execution-flow; production types;
  scoped lint; generated Inspector tests; self-review of diff/direct consumers.
- Stop on a required new state/owner, weakened DoD, or three failed implementation
  iterations. Review plan and boundary before another attempt. No push or live run.

Bounded consumer review revision:

- The first complete local gate passed Runtime 433 and App 1,644 cases, but the
  non-streaming final-batch consumer still expected wire version 1. Earlier
  fixture failures similarly supplied canonical artifacts directly to the wire
  boundary. Re-audit confirms the current spec requires delivery version 2 and
  unchanged canonical validation; no production fallback is warranted.
- Remaining work is limited to direct consumer tests: local-ai-provider.test.ts
  (already in apply's boundary), local-design-tools.test.ts and the mapped
  execution-flow proof. Replace stale wire types, exercise real admission from
  the non-streaming result, and compare material delivery with the complete
  retained canonical artifact rather than keys alone. Production owners remain
  unchanged. Re-run these focused suites, refresh admission for the proof source,
  then repeat the existing root gate and final types/lint/naming checks.
- Self-review: this strengthens fixed DoD 1-3 and 6 without adding a route,
  compatibility branch, model turn or new owner. The 14 new integration cases,
  including real Core execution of all 4,114 saved entries, passed in that gate.

Verification evidence:

- The permanent saved-input regression first failed at 17,380,806 bytes against
  the fixed 85% ceiling (tmp/prepared-delivery-red.log), before production edits.
  Initial admission was accepted as
  4b22863215eb433d04c08caa4dacebb26e2f5a4acb3aed9aaeb92ccef0f058dd.
- Reviewed admission is fe17c126c6c24b467a8423c108427507a87b897d721de48c36af2161ae92a116.
  Projection and admission preserve the complete saved canonical object; the
  action input is 14,603,472 bytes, down 2,777,334 bytes (15.98%). Geometry retains
  references until serialization; repeated resolution compiles once, admission
  retains one existing structured clone, and actual dispatch remains one call.
- The world-material consumer now compares complete canonical values both before
  and after JSON transmission. Its first strengthened oracle exposed JSON's
  existing negative-zero normalization; both sides now cross the same ordinary
  JSON boundary, while the separate in-memory assertion preserves exact values.
  No runtime tolerance or material change was introduced.
- Bounded self-review covered the four production owners, their direct consumers,
  current version rejection, malformed identities/topology/material references,
  retained continuation and receipt paths. No geometry-specific exception, new
  state, model query, replay or old-wire compatibility was added. The formal fixture
  is project-owned; tests do not read ignored historical evidence.
- Final root `yarn test:design-execution-flow` passed: Runtime public build and
  433 tests; App 1,645 passed / 2 existing opt-in skips; Inspector 71 cases at
  revision 86, attempt abd237f7-7034-405d-a085-8729db8a33c3, verification source
  22cb37d19086da6f62872bf2653c16165fbb81c10c8a760c896e4c2e11a493c3.
  The skipped native registration and large-checkpoint bootstrap cases are not
  counted as passed and are outside this prepared-delivery boundary.
- Browser action/interrupted integration: 53 passed, including real owner partial
  results, no-replay recovery, history, collaboration publication and durable reload.
  Focused preparation/material/motifs/discovery preservation: 171 passed. These
  overlap the root harness where applicable; counts must not be added as unique cases.
- Production types passed; naming 15/15; generated Inspector tests 25/25; scoped
  lint has zero errors and three diagnostic-console warnings (one in the new
  measurement test, two existing); final whitespace check passed.
- Final timing sample in tmp/prepared-delivery-root-flow-final.log: baseline
  encode 42.195 ms + parse/admission 151.611 ms; compact projection/encode
  28.233 ms + parse/admission 165.949 ms. Combined cost is approximately unchanged
  (193.806 vs 194.182 ms); this is one local diagnostic sample, not a performance
  guarantee. Bytes and preserved owner work are the deterministic result.
- No model, 101, CI, commit or push was run for this slice. AI behavior, network
  latency and first-frame improvement remain unmeasured. WebMCP remains an
  architectural reference, not an implemented integration.
- Subsequent closeout authorization: commit and push this locally verified slice,
  retain the live-observation limits, then inspect the latest saved run for one
  unresolved handoff. Do not start the next implementation or inspect CI.

### Visual correction handoff - 2026-10-24

Step Execution Card - inspect / inspect-to-compose:

- Objective: deliver each unresolved visual check with its exact identity, unit,
  status, revision, full evidence and inspection links across sparse submissions.
  Known fact-bound elements are separate from image targets and never edit authority.
- Inputs: existing pending result store, required coverage, retained inspections,
  exact criterion/unit fact bindings and reference decisions. Outputs replace the
  criterion-aggregated correction summary with per-check `checks`, deduplicated
  inspection metadata, explicit unavailable inspection IDs and optional discovery
  guidance through the existing registered query owner. Known edits bypass discovery.
- Owner: App review coordinator; failure owner inspect. The main agent selects the
  repair intent and values; existing query, preparation and mutation owners retain
  schema, scope, receipt and recovery authority. No automatic semantic repair.
- Allowed contributors: current review/check/inspection owners and existing query
  contract. Forbidden: guessed targets from image roots, name prefixes, diagnostic
  prose or local rectangles; repair tool lists; new state/cache; automatic replay.
- Boundary: local-design-review.ts, direct local-operation-tools.ts consumer only
  if necessary, their existing formal suites, local-design-tools.test.ts for the world-material
  query consumer, the recorded correction fixture, visual-correction.integration.test.ts and
  execution-flow-proof.test.ts. Register the direct consumer in the existing App
  server harness; no separate suite registry.
  Contracts: this plan, ai-execution-flow.md, existing Inspector data/mapping and
  generated workspace. No changes to geometry, persistence, Knowledge or providers.
- Conditions/bypass: emit only unresolved checks; keep passed results in the store.
  All-passed or no-plan produces empty correction checks. Missing/expired images
  retain identity/evidence with unavailable scope; they never authorize a write.
  Guidance is optional and derives the query identity from existing constants;
  it does not preload schemas or require a discovery call for known operations.
- Public names are request-local response fields, not persisted document state.
  Remove the superseded `correction.criteria` aggregation and update direct tests;
  retain no alias. Advance the review tool contract revision.
- Spec references: Whole-result review and revision handoff; Tool-first correction
  contract. Inspector inspect conditions and inspect-to-compose route. Re-read
  those boundaries before tests, production and closeout.
- Fixed discovery: retained 1792770001609 inputs/outputs and source snapshot,
  current review/result/query/material owners, direct consumers and existing tests.
  Do not infer the cause of the observed 28.29-second no-call interval.
- Fixed DoD: (1) preserve individual multi-unit, multi-image and cross-call findings,
  exclude passes; (2) retain visual scope without fact bindings, distinguish unknown
  edit targets; (3) execute shipped guidance through query/dispatcher/real correction
  owner and re-review; (4) cover known world material, selected local properties and
  unresolved target selection without compulsory Knowledge/discovery; (5) invalidate
  only affected evidence, retain independent passes and whole-view requirements;
  (6) invalid input, expired source, cancellation and partial success keep truthful
  receipts and recover only unfinished work, with zero replay; (7) compare total
  handoff bytes and necessary calls, preserving complete limits/evidence.
- Formal regression first: add per-check and cross-call projection cases, published
  discovery-to-edit integration and source-bound proof before production. Existing
  local material, mutation receipt, partial recovery and invalidation suites remain
  authoritative; extend gaps rather than replace their real-owner checks with mocks.
- Gates: naming baseline/closeout, task context, Inspector admission, red/green
  focused suites, root test:design-execution-flow, production types, scoped lint,
  generated Inspector tests, diff review. No model, 101, CI or push.
- Stop on a required new state/owner, out-of-scope mutation, or three failed repair
  iterations. Local correctness does not prove AI adoption or latency improvement.

Bounded test-harness review: the integration fixture imports browser-owned APIs
only after establishing its Node window stub, uses the public owner methods (the
operation owner has no dispose API), and chooses an input actually rejected by
the registered schema (negative fill index, not an unconstrained color string).
The query and mutation boundaries remain unchanged. These fixture corrections
must pass focused execution and production types before broader verification;
no production fallback or weaker receipt oracle is authorized. Whole-file proof
execution exposed shared singleton Preset initialization between two integration
cases. Keep the real-Core correction case in its own formal integration file and
select it through the existing harness; keep the mapped proof owner-only. Use the
actual Runtime host to translate partial transaction settlement and await Core.save
before reload. No production initialization or transaction contract changes.

Local closeout - 2026-10-24:

- Admission preceded implementation: review
  `99eb62961f13151d57a03d4f32de262e145515d1a8f3cbe3fd3e3c245a799583`.
  Two formal regression failures reproduced missing per-check correction delivery
  before the production change. The final direct-consumer boundary admission is
  `61162989524614c376c4c24a57989b0163c1768aafc04cfc8a7b570497ff0e3a`.
- Shipped projection replaces `correction.criteria` with individual pending checks,
  exact unit fact associations, shared image metadata, explicit unavailable image
  IDs and optional existing-query guidance. No mutation target inference, repair
  tool list, new retained state or automatic repair was introduced.
- Focused suites: 231/231. Direct material, non-Core receipt, interrupted-operation
  and inspection-dependency preservation: 18/18 with the existing jsdom environment.
  The initial Node invocation failed browser-global imports; it was not a product
  regression or a successful test. No assertion was weakened to address it.
- Existing root `test:design-execution-flow` passed: Runtime public build, 433
  Runtime tests, 1,631 App tests and two existing guarded skips, then 71 Inspector
  proofs. Verification `4438f3ad-6fef-47b6-83ee-120c3cc84d52`, revision 83,
  source digest `27a6c7ea0d5d62d74a7670a587d1446e725afd7eb96ea310fe214b76da8da791`.
  Production types, naming 15/15, generated Inspector tests 25/25, task context and
  diff checks passed. Scoped lint has zero errors and one unchanged console warning.
- Existing skips remain explicit: large saved-document bootstrap encode/decode
  needs `E2E_LARGE_DOCUMENT=true`; installed native registration needs
  `LOCAL_AI_PROTOCOL_EXECUTABLE`. Neither owner changed in this slice, and neither
  skipped case counts as passed.
- The delivered query guidance reaches real local-property and material consumers.
  Real Runtime/Core integration verifies invalid input and cancellation before
  writes, acknowledged prefix retention, retry of only the unfinished operation,
  Undo/Redo and save/reload. Separate scoped dependency tests preserve local passes;
  stale-image judgments reject until explicitly rebound to current evidence.
- The saved-input exchange is smaller than the old receipt plus the pending-detail
  read needed for complete per-check context. This is a conditional deterministic
  comparison, not proof that the historical agent performed that extra read or that
  its 28.29-second no-call interval was caused by this defect. Review judgments in
  integration tests are authored inputs, not independent pixel-quality assessment.
  No live model, 101 or CI was run; AI adoption and latency effects remain unobserved.

### Scoped Knowledge catalog and consumer verification - 2026-10-24

Step Execution Card - compose, optional Knowledge discovery:

- Objective: a known topic can expose its complete selectable subtree in one metadata
  request, without unrelated catalog growth or implicit advice reads. Inputs are the
  existing context labels and optional nonempty `ids`; outputs retain the existing
  metadata envelope. Full discovery when ids is omitted and direct retrieval bypass
  scoped navigation. Missing, hidden or inapplicable roots return no entries, never
  a broad catalog fallback. Invalid selectors reject; visible selected cycles reject.
- Owner: Runtime Knowledge access owns traversal, visibility and lifecycle; the App
  advertises and forwards the selector. Children are the sole navigation relation;
  dotted names, prefixes, known topic lists and dependency relations never select
  descendants. Required read dependencies still resolve even outside the catalog.
- Sources: ai-execution-flow specification, Selective nested Knowledge delivery;
  Framework optional Knowledge access; Inspector compose step and its
  compose.knowledge-selection proof. No new registry, retained state or cache.
- Authorized production files: Runtime knowledge.ts / knowledge-types.ts, App
  local-knowledge.ts; repository package.json owns the validation entry. Contracts include this plan, those two specs,
  the existing Inspector data/mapping and generated bundle. Formal tests stay in
  the corresponding existing Knowledge suites, execution-flow proof and App local
  validation contract tests in scripts/**tests**/local-validation.test.mjs. No Knowledge bodies, geometry or saved evidence edits.
- Existing validation integration: Repository `test:design-execution-flow` chains the existing
  Runtime build (public exports must match source), Runtime `test:local`, App `test:server-response-harness`, then Inspector verify.
  Reuse the suite inventories; do not copy test filenames or extend Inspector's
  architecture proof claim to arbitrary consumers. A failed consumer exits nonzero
  before the Inspector command. Its standalone architecture check remains available.
  Self-review found App scripts are copied into standalone templates: keep this
  repository-only gate at the root, not in the App manifest or a new exclusion list.
  This corrects the validation entry boundary without changing product behavior.
- Fixed discovery methods: current owner/API/schema reads, actual published invocation,
  saved 1792770001609 metadata input/output and direct-consumer execution. Captured
  Knowledge owners match current source. Full response 9596 bytes / 20 entries;
  existing child closure 5752 bytes / 10 entries is an estimate, not achieved evidence.
- Fixed DoD: actual advertised selector -> catalog -> selected child -> complete
  required dependencies in two calls; no sibling bodies; full catalog/direct reads
  preserved; unrelated registration growth does not enlarge selected delivery or
  cause unrelated traversal; arbitrary registered IDs work without owner edits.
  Test hidden/missing/inapplicable roots and children, invalid/empty selectors,
  selected/unrelated cycles, multiple overlapping roots, updates/removal/disposal,
  cancellation, rehydrate, pagination and stale recovery. No writes or replay.
  Test the actual local gate command: passing Inspector cannot mask failed consumers;
  success reaches all phases, each failure stops later phases. Keep independent
  expected sets and semantic oracles rather than copying traversal into tests.
- Gates: naming, task-context, Inspector admission before production, test-first
  failures, focused owner/consumer suites, existing local flow gate, production
  types, scoped lint and generated Inspector tests. No CI queries or live models.
- Stop: any unresolved boundary mismatch or new owner requirement outside this slice;
  three failed repair iterations require bounded replanning. Live adoption and time
  improvements remain unobserved even after deterministic completion.

Local completion and bounded self-review:

- Admission preceded production edits. Initial review
  03f2a23e1e69a3884af1a7b34e28d11ceacf39dd74f047303bbdc4f537ff58f8
  admitted the selector contract at revision 78; subsequent source-proof and local
  gate-boundary reviews retain all obligations. Final accepted revision: 81.
- Test-first: five new owner/consumer failures exposed unsupported selector delivery,
  broad results and unrelated-cycle coupling; the local gate test exposed its missing
  entry. A separate regression caught the unchanged native revision; discovery now
  owns revision 3 while legal no-selector calls remain supported.
- Self-review: App imports use public Runtime dist exports, so the local gate builds
  current exports first. The gate belongs to the repository root because App scripts
  are copied into standalone templates. Existing local-validation tests execute the
  actual command with controlled process outcomes, covering success and each failed
  phase without launching models. No duplicated test-file inventory or new registry.
- Final actual entry `yarn test:design-execution-flow`: Runtime 433/433, App consumer
  harness 1627 passed / 2 existing skips, then Inspector 71/71. The preserved skips
  are not claimed as executed evidence. Knowledge focused suites: 58/58, including
  advertised-expression execution, dependency bodies, no eager siblings, 100 unrelated
  registrations with unchanged selected policy work, permissions, lifecycle, paging
  and context recovery. Local-validation suite 15/15, generated Inspector tests 25/25,
  naming 15/15, Runtime build and App/server/proof production types passed. Scoped
  lint has zero errors and the existing proof console warning.
- Final Inspector run: 5d3a8603-7974-4619-8b12-bea20a44c9a7, source
  942e245349dc7556a5eaf01b03c6755f841a4c37306d67147e20d7e151eeffca,
  mapping 6e24a2ffad14f9a25acdabc7ec6248711c166ad81fb8dfd18081edf78df97c05.
  Logs: tmp/knowledge-scope-root-flow-final.log, validation-closeout, types,
  lint-closeout, generated-closeout and naming-closeout under the same prefix.
- Current-owner measurement (same catalog, no model): full metadata 20 entries /
  9524 bytes; selected subtree 10 entries / 5680 bytes. Including each query input:
  9567 versus 5767 bytes, a 3800-byte reduction (39.7%) at the same call count.
  These owner-envelope figures exclude provider-added outcome/transport fields and
  shared tool declarations; they are not whole-turn token or latency measurements.
- Reviewed direct consumers, public exports, registered identities, full discovery,
  unchanged retrieval closure/recovery, and standalone packaging. No unresolved
  in-scope behavior finding. Shared/App advice bodies and immutable saved evidence
  remain unchanged. No observation of live AI selector adoption or timing benefit.

### Local convergence and authorized push - 2026-10-24

The user accepts the main-workflow image handoff and six discovery corrections on
formal local evidence. Close these slices with their verified behavior and unchanged
limitations: live AI adoption of the new image handoff and latency remain unobserved.
Preserve all prior saved evidence. This authorization covers the task branch push and
required target integration/checks, not a new model run or the next proposed fix.

Next analysis is bounded to the latest retained 101 inputs/outputs and direct owners.
Also assess why consumer checks did not accompany prior contract/example changes.
Operational choices and limits must come from their authoritative owners rather than
consumer copies; semantic tests must retain independent correctness oracles instead
of deriving expected answers from the implementation under test. Propose prevention
through existing test selection/validation and Inspector boundaries before altering
that workflow. Do not introduce a duplicate registry or another governance ledger.

Pre-push verification after target integration - 2026-10-24:

- Rebased the task branch onto eaddcdba2c1705dca6646a730cd87818ae214d56 without
  conflicts. The image-handoff and discovery changes are in 0608392e9; runtime owner
  sources are unchanged by the rebase. Installed the target's declared lockfile with
  immutable installation; no new package or toolchain choice was introduced.
- Post-integration gates: 870 relevant tests passed with one existing skip, interrupted
  App/runtime integration 8/8, production App/server/flow-proof types and production
  App build passed. Scoped lint has zero errors and its existing console warning;
  naming 15/15 and generated Inspector checks 25/25 passed. Existing build chunk-size
  advisories remain informational. Logs: tmp/handoff-push-*.log.
- Inspector candidate 5cdecddb-b6c7-4b21-b2ec-1d4fc72a3bca passed all 71 owner proofs
  on captured source 1cd15e8d7cbc193ab13b69cf1c49cc2e2fd737931bf0a5ab8ad36c4a3d7cfecc.
  Contract review 800f71a33fb7de353e699751d2b4176ff5e17e0d9ac90fea978249a6f4aa1126
  has no changes or blockers; architecture revision 77 remains applicable.
- Closeout relies on formal local evidence only. Live AI adoption of the image
  handoff and corresponding timing gains remain unobserved. The next investigation
  and drift-prevention proposal remain read-only; no automatic model retry.

### Discovery regression oracle reconciliation - 2026-10-24

Step Execution Card - compose:

- Objective: resolve the six reproduced discovery failures by checking delivered
  guidance, canonical ownership and actual execution, not by relaxing expectations.
  Preserve the uncommitted image-to-judgment slice and all immutable saved evidence.
- Discovery boundary: the six failing cases in discovery-delivery.integration.test.ts,
  their recorded fixtures, schema-path recovery, grid budget/schema, composed-material
  examples and their direct preparation/application consumers. No repository-wide audit.
- Contract: Inspection discovery field ownership and receipts; Expansion budget
  selection; Shared normalized motifs; selected composition/layer order. Inspector
  compose already requires valid-path recovery, resolved shared motifs, executable
  examples, unchanged limits/pages and no replay. No contract change is currently
  needed; verify accepted revision 77 before changing the formal oracles.
- Inputs/outputs: unchanged published selectors, example invocations and canonical
  schema fragments; ordinary budget, prepared entries and application receipts.
  Discovery owns guidance/recovery; preparation owns counts/reference resolution;
  application owns actual writes. Tests must compare those handoffs independently.
- Findings to verify: one obsolete assertion demands invalid recovery paths; one
  fixes prose to inline-only motifs.length; four index a legal template reference
  as an inline array. These are hypotheses until corrected behavioral checks execute.
- Authorized edits: this active plan, task context and formal discovery tests. Direct
  owner fixes and matching spec/Inspector changes are allowed only if these bounded
  checks expose a real contract mismatch; reproduce it before production changes.
  Do not modify saved fixtures, archived plans, live budgets or previous raw reports.
- Fixed DoD: execute the returned per-entry correction, verify exact valid fragments,
  rejected paths/outcome and zero writes; compare inline/reference budget counts and
  canonical output on an actual delivered example; prove resolved root materials,
  geometry, painter order, names, keys and parents through preparation and application;
  preserve inline use, malformed-reference rejection, refresh/no-replay, catalog-growth
  isolation and existing byte/page ceilings. Do not replace assertions with existence
  checks, self-derived expectations or looser numbers. No model-adoption claim.
- Verification: original six failures first; focused six cases after correction;
  complete discovery, shared-motif/budget/schema suites, prior workflow/provider
  direct-consumer coverage; production types, scoped lint, naming, diff review and
  source-bound Inspector verification. Existing test-oracle correction is the explicit
  exception in bugfix-test-first; no production fix is justified solely by a stale test.
- Stop/replan if following the actual correction still repeats invalid scope, if an
  inline/reference execution differs, or if first-use limits regress. Keep failures
  visible and correct the first mismatching owner within this boundary.

Verification outcome and bounded self-review - 2026-10-24:

- Reproduced all six original failures before test edits (discovery-six-baseline.log).
  Adjudication against the current product contract and owner execution:
  1. Foreign-field recovery: obsolete oracle. It required the original invalid paths
     in definition.recover, contradicting Inspection discovery field ownership and
     receipts and Inspector compose. The owner correctly delivers the valid subset
     for each exact identity; the original scope remains unavailable.
  2. Expansion guidance: obsolete inline-only wording assertion. The owner counts
     rows * columns * resolved motifs, including root-local references, consistent
     with Expansion budget selection and Shared normalized motifs.
     3-4. Composition examples (explicit false/true): obsolete array indexing after the
     owner example adopted a valid root-local motif reference. Material references
     must be checked through that definition, not a nonexistent array position.
     5-6. Layered examples (plan false/true): the same obsolete indexing assumption.
     Their existing painter-order, generated-key and byte/page obligations still hold.
- Corrected the owning formal oracles rather than changing valid product behavior.
  Per-entry recovery now executes definition.recover directly, checks precise failed
  paths, canonical fragments, scoped refresh and absence of writes. Composition and
  layered cases expand the delivered reference into an independent inline input and
  compare complete prepared output using the same artifact identity, then compare
  actual application descriptors and parent relationships. Missing references reject
  without changing prior writes. A two-motif variant proves the independently counted
  28 expanded objects for both forms and matches actual compiled/applied results.
- Existing fixture inputs, byte/page ceilings, geometry tolerances, accepted inline
  use and no-replay checks were not loosened. No production owner, schema, example,
  spec, Inspector architecture or formal mapping change was needed. The missing
  synchronization was in the older integration assertions after prior owner changes.
- Validation: discovery 62/62; preparation 53/53; shared motifs 15/15; input schema
  26/26 (156 total). Six focused workflow/provider delivery consumers passed; the
  remaining cases in those two files were intentionally filtered, not claimed run.
  Production App/server/flow-proof typecheck, scoped ESLint (zero warnings/errors),
  formatting, naming 15/15 and diff checks passed. Review covered only this test diff,
  its delivered contracts and direct consumers; no unresolved in-scope mismatch.
- Inspector admission reused accepted revision 77 after verify
  3064e327-7e12-4b39-ba63-13f4beb59d28 passed. Final candidate
  79bd1f12-e4bc-4b42-ae0a-7b59af0e9e87 passed all 71 owner proofs; contract review
  b5ff2de5b45b5c466d70b67ba379c7c18595f9fa562679b4dc6ae620a4388e1d reports no
  changes/blockers. Captured owner/proof source remains
  90c7f9f5d720df44ec52e26f603e4df6ced7fa00bcdbb70c94320310f9d8e748;
  this test-only edit does not change that Inspector source set. The complete changed
  discovery suite was run separately and recorded in discovery-six-regressions.log.
- Evidence is retained under tmp/discovery-six-*.log and the formal updated test
  remains in server/**tests**/discovery-delivery.integration.test.ts. The six failures
  noted in the preceding slice are now resolved; its historical verification record
  remains intact. No model/101, push, live latency or adoption claim.

### Main-workflow image-to-judgment handoff - 2026-10-24

Baseline: ffa575a2b4d5fcae541666a1a9c101430ee7b4d1. Saved run 1792770001609
returned an image at 76.191s, then used review usage (11,588 bytes), a bind call
(1,855 bytes), and a verdict call. These are valid existing operations; the gap
is optional explicit selection through the main workflow. The 15.518s interval
is not a measured saving or a cause of first-frame latency.

Step Execution Card - compose / apply-to-compose:

- Spec: Main-workflow visual judgment handoff; Explicit visual judgment bindings.
  Inspector: compose consumes settled execution and inspection evidence and delegates
  binding/validation to the existing review owner. Review owns acceptance and failure
  semantics; compose owns partial delivery. No new state or cache.
- Input: optional reviewChecks using the review owner's capture-check selection schema.
  Checks select only the existing automatic capture of this invocation, not all criteria
  or all created objects. Absent selection keeps ordinary immediate/defer behavior.
  reviewChecks with defer is contradictory and rejected before writes; selection is
  validated against the established or same-call plan before the first write.
- Output: original receipts/images plus visualReview containing owner-issued context,
  current bindings and exact registered next invocation with owner-derived status/evidence
  constraints. Binding records no judgment. AI still decides scope and visible findings.
- Reuse: existing capture, evidence validation, bindChecks, check store and invocation
  observations. Do not capture again, infer criteria from prose, extend image coverage,
  copy binding state, preload review schemas or introduce a tool/registry/retry owner.
- Boundary: local-design-workflow.ts, local-operation-tools.ts, local-design-review.ts
  and their direct selected-discovery projection in design-workflow-discovery.ts;
  their formal tests and execution-flow-proof, saved fixture, active plan/spec/Inspector
  and proof mapping/bundle. Existing invocation/native/recovery tests are direct gates.
- Failure: preserve settled writes, captures and independent passes. Only complete/current
  images may be bound. A failed binding returns partial follow-up and explicit review-only
  recovery; it never requests another main draw. Partial drawing keeps its actual scope
  and existing remaining-only recovery; never bind a failed part's checks to an earlier
  part's capture. Cancellation stays cancellation and retains acknowledged receipts.
- Fixed DoD: (1) actual delivered selected usage/example -> main workflow -> returned
  judgment arguments -> registered dispatcher/review owner; only fill status/evidence;
  (2) eliminate the independent binding call and mandatory full review-usage lookup,
  count added selection guidance and all responses, and reduce total bytes against the
  same local control; (3) no automatic visual pass or final acceptance; (4) preserve
  stale/tampered/foreign/missing-image, multi-image and independent-unit invalidation;
  (5) failure/cancellation/partial recovery never repeats settled writes/captures;
  (6) unselected/defer, independent bind, single/parts, compact/full remain valid.
- Gates: naming, admission before regression edits; failing formal main-workflow case;
  workflow/operation/discovery/invocation/native and interrupted-result integration;
  production types, scoped lint/naming, generated Inspector checks, candidate/accept/verify.
  Review only this diff, direct consumers and frozen negative cases. No model tests.
- Feasibility: automatic capture already produces retained IDs; review_drawing bindChecks
  already validates current evidence and produces next.arguments without judging. Compose
  can call that owner inside the same invocation and expose its result. Optional selection
  must remain explicit: a first preview or an incomplete/multiscale decision still uses
  independent capture/binding. No first-frame or live adoption improvement is promised.
- Stop if the route needs inferred evidence coverage, altered write settlement or a
  duplicate binding mechanism. Keep previous source evidence immutable.

Bounded delivery revision after integration evidence - 2026-10-24:

- The first regression pass exposed unselected/default example drift and extra bytes
  in established discovery budgets. Do not raise those budgets or change legal callers.
- Retain default example ordering. Within existing selected projection, prefer valid
  owner examples containing explicitly selected optional fields. Remove only a root
  not-clause proven unreachable by an explicitly excluded required field; selected
  and unrelated restrictions remain intact. This is the same compose/discovery owner.
- Recheck native unscoped/defer callers, selected example execution and every existing
  discovery byte/page oracle before final verification. Fixed DoD is unchanged.

Local verification and bounded self-review - 2026-10-24:

- Admission preceded regression edits: candidate dfe8fc0e-c457-418f-963c-c975f30aa3f8,
  accepted revision 76. Formal compact/full handoff tests failed before implementation;
  later tests reproduced missing capture recovery, stale-image recovery and misleading
  parts completion before their corrections. Failed attempts remain in project evidence.
- Main workflow now composes explicit selection, the existing automatic image and review
  binding. Delivered examples preserve ordinary defaults; explicit optional selection
  chooses a valid example for existing criteria or a same-call plan. No new registry,
  review state, geometry owner, mandatory selection or compatibility route was added.
- Actual published information assembly and image-forwarding examples execute in formal
  tests. The returned bound invocation executes through the real registered review
  dispatcher with owner-derived editable-field limits. Binding alone records no pass.
- Same local scenario, including input/output and selected guidance: 40,431 -> 32,180
  bytes (20.4% less), 5 -> 4 model-facing tool calls. Drawing and capture each remain
  exactly once; underlying owner event sequences match. The selected same-call-plan
  contract takes two pages versus one drawing-contract page in the control, but removes
  the later full review-usage read and independent bind call. This is total-delivery
  improvement, not a claim that every selected contract fits one page or that first
  frame/model latency improved. Existing page limits and byte oracles were not raised.
- Failure recovery distinguishes temporarily unavailable validation (reuse the image and
  rebind), explicitly stale evidence (recapture the affected target through review only),
  failed capture and partial drawing. Cancellation preserves acknowledged receipts;
  parts binding failure reports partial/completed settlement instead of complete.
- Final local checks: workflow 100; provider 222 passed/1 existing skip; operation 196;
  review 114; invocation 66; host 16; interrupted App/runtime integration 8. Existing
  interrupted integration includes actual Core writes, Undo/Redo, persistence/reload
  and remaining-only recovery. Existing review cases cover multiscale, independent
  passes, foreign/tampered evidence and local invalidation. The new composer does not
  alter those owners. Production App/server/flow-proof types passed, scoped lint had
  zero errors and one unchanged console warning, naming 15 and generated Inspector 25
  passed. Diff/format and direct-consumer self-review found no remaining in-scope issue.
- Discovery: 56 passed, 6 failed both at baseline ffa575a2b4d5fcae541666a1a9c101430ee7b4d1
  and on the final implementation. One expects four foreign-field recovery paths where
  the owner supplies inspections; one expects superseded motif-count wording; four
  assume inline motif arrays in composition/layered examples now using shared templates.
  Preserve these tests and report them separately; do not weaken their assertions or
  claim the whole suite passed. Baseline comparison restored all current file bytes.
- Final Inspector candidate ed0c04e3-20dc-4f86-8b41-34012c62607a passed all 71 cases;
  review ba57dc5725d7a0cebf96b3adef57a6e0ece4f2420368aae8a6043627ae6b2893 had no
  blockers and was accepted as revision 77. Verify 040255d9-881b-4a16-b6f9-0f488fd2e9f7
  passed on the same captured source
  90c7f9f5d720df44ec52e26f603e4df6ced7fa00bcdbb70c94320310f9d8e748.
- Evidence: tmp/visual-handoff-{red,main-final,owners-final,discovery-baseline,
  interrupted,production-types,lint-final,naming-final,generated-final,final-verify}.log.
  Formal cases and their existing recorded fixture live in the repository, not tmp.
  No model/101 run, new screenshot evidence, remote push or live-adoption claim.

### Compact workflow receipts - 2026-10-24

Closeout - 2026-10-24: accepted on the formal local evidence below. The user
authorized push without another 101 run. Model latency and live adoption remain
unmeasured; those claims are not needed to close the deterministic delivery contract.

Baseline: d2d6ba8a5f45543206020694c9b6b53c61e34134. Saved run
1792770001609 requested compact output but delivered 5,372 text bytes, including
2,869 bytes of drawing timing. Removing only timing/reuse/sourceWork from a
read-only projection gives 1,938 bytes (63.9% less); this is a size oracle, not
measured model latency. Immutable evidence and previous closed slices stay unchanged.

Step Execution Card - compose / apply-to-compose:

- Spec: Compact workflow delivery and Owner results and workflow outcomes.
  Inspector: compose consumes execution receipts and prepared artifacts through
  existing native orchestration; failure owner remains compose. Existing apply
  owners, receipt consumers and trace sinks run before delivery projection.
- Allowed input: validated owner results and the existing compact/full choice.
  Output: equivalent operation result without pure diagnostics on compact paths.
  Explicit full bypasses projection. Invalid input, cancellation, partial results
  and real failures retain authoritative outcomes and recovery; no inferred success.
- Allowed contributors: existing workflow/operation owners, native adapter and
  existing observations. Forbidden: diagnostic inference, recursive deletion from
  arbitrary user/result data, new state, registries, tools, retry or changed budgets.
- Boundary: local-design-workflow.ts and its formal tests, execution-flow-proof,
  one permanent saved-receipt fixture, current plan/spec/Inspector/mapping/bundle.
  Direct delivery/native tests may be strengthened if needed. No canonical writes,
  history, collaboration or persistence implementation changes.
- Work lifetime: project the completed receipt once at its existing delivery boundary;
  no preparation, mutation, image capture or diagnosis is recomputed. Raw inner
  observations remain available before projection. No cache is introduced.
- Fixed DoD: (1) exact saved compact text is at most 1,938 bytes after the three
  diagnostic fields are omitted, with every other field equal; (2) real main-tool
  execution and the actual published forwarding example preserve results/images;
  (3) existing trace retains original diagnostic values and call correlation;
  (4) single/parts, success/no-op, partial/failure, cancellation and follow-up failure
  keep truthful outcomes, limits, identities and recovery; (5) full stays complete;
  (6) no extra calls or writes, and returned recovery does not replay completed work.
- Gates: baseline naming and existing tests, admission, failing formal regression,
  focused workflow/delivery/native and interrupted-result regressions, production
  types, scoped lint/naming, generated Inspector checks, candidate/accept/verify.
  Review is limited to this diff, direct consumers, frozen cases and gates.
- Self-review found timing inside existing executionResult failure containers.
  A stronger negative-path regression failed before the bounded correction; traverse
  only executionResult/batches protocol containers, never arbitrary result data.
- Stop if reducing diagnostics requires changing authoritative owner semantics.
  Do not lower the DoD or claim AI latency/adoption improvements from local tests.

Compact delivery result - 2026-10-24:

- Admission used candidate abd58a5a-ae62-4209-8744-4afb12704288 and accepted
  contract facc517d03a5d4480d55e0424d03fc5a9808a08c231a1c6c8a94a7bcf1ecb4eb
  at revision 74 before test/production edits. Architecture changes correctly
  required contract review rather than mapping-only admission.
- Existing 66 workflow tests passed before correction. The new real-workflow
  regression failed on retained timing and the mapped proof failed on reuse.
  Self-review then reproduced retained timing inside a partial failure's
  executionResult; the same bounded projection now handles protocol containers.
- Saved exchanges are permanent fixtures with source hashes, not tmp dependencies.
  Their replay validates exact field equality and 5,372 -> 1,938 text bytes
  (3,434 fewer; 63.9%). The saved-boundary replay is not a new canonical creation
  test. Separate real preparation/operation tests verify the public route, full
  bypass, actual forwarding example, unchanged image bytes and execution counts.
  Synthetic valid pixels test transport, not reconstruction of historical artwork.
- The existing profiler and record sink persist original inner results and the
  compact outer result with call correlation. Disk readback verifies the saved
  diagnostics, not only callback presence. Full results and nested semantic data
  retain their values; no new store, tool, cache or retry path exists.
- Validation: workflow 77 passed; operation/invocation/host 278 passed; native
  provider 222 passed with one existing executable-dependent skip. Real interrupted
  owner/Runtime recovery, history and durable-state regression: 8 passed. Existing
  mapped cases retain valid no-op and non-replay protection. Production types and
  naming passed; lint has zero errors and one unchanged console warning. Inspector
  catalog/workspace: 25 passed. Final revision 75 verify passed all 70 obligations
  at attempt 7a276f5d-f776-4aca-86e3-bc7b6b3d00fc, source
  faa9d485e8dcdbcb2ffaf4bfc26cace6d4a2fddec3ed663441ff3c9ad6e2513a.
- Final bounded review covered normal/partial/stopped single and parts delivery,
  executionResult/batches, full, direct owners, raw evidence and the published
  forwarding example. Removed only the superseded diagnostic transport behavior;
  authoritative state/receipt handling and independent owner APIs are unchanged.
  No additional query, preparation, capture or write is introduced.
- No model/101 or push was performed. Local evidence establishes byte reduction
  and semantic preservation, not lower model latency, earlier first frame or AI
  adoption. No unrelated issue is opened by this closeout.

### Interrupted owner results - 2026-10-23

Closeout - 2026-10-24: accepted on the formal local integration evidence below.
The user authorized publishing this bounded slice. Live AI recovery remains
unobserved; no further model run is needed to close the deterministic contract.
Next-issue investigation is read-only and must not reopen this slice without new
evidence of a product defect.
Pre-push validation reran 68 App/Runtime cases and 370 native/host/workflow
cases (one existing executable-dependent skip), production types, Runtime build,
scoped lint (zero errors, four existing warnings), naming and Inspector revision
73 verification (attempt 402e2bea-4681-452f-bed6-e0a670e90fd0). The public
documentation check exposed a stale generated contract index; the existing
generator synchronized its three outputs and the check then passed. Runtime
release metadata is included. No next-issue production changes are included.

Local coverage follow-up - 2026-10-24 (same fixed DoD): the live run
1792770001609 completed its only drawing before cutoff, so it did not exercise
an interrupted owner prefix or recovery. Existing real-Core tests cover deadline
admission and member rollback, while native reporting uses synthetic receipts.
Do not infer connected coverage from those separate results.

Step Execution Card - apply verification:

- Reuse the admitted apply/apply-to-compose/apply-to-settle contracts and
  Interrupted owner results spec. Inputs remain prepared artifacts, real Core
  mutations, cancellation and existing retained-source continuation.
- Extend the existing interrupted-design integration with actual AbortSignal
  cancellation, rejection of whole-artifact replay, and safe remaining-part
  continuation through the existing preparation owner. Confirm canonical values,
  History boundaries, publication reduction, remote application and reload.
- The slice may edit this plan, the existing interrupted-design integration
  test and its registration in the existing App test:ai gate. No production owner, persisted state, budget policy or new recovery
  mechanism. Test-controlled scheduling and small fixture budgets are fault
  injection, not product settings or another capacity experiment.
- Keep partial-member recovery distinct from fully acknowledged-part continuation;
  never manufacture a resume instruction for an uncertain member.
- Run focused App/Runtime tests, naming, scoped lint and current-source Inspector
  verification; stop if production behavior or the admitted owner boundary must
  change. New test identifiers are internal only, with no wire/persistence change.

Step Execution Card - compose verification (after apply review):

- Reuse compose and apply-to-compose, the existing provider protocol fixture,
  actual prepared owner/Runtime receipts and bounded report input.
- Extend local-ai-provider.test.ts to consume real interrupted drawing results,
  not a hand-authored count. The native process remains scripted: no model call.
- Verify exact root/count/range, cancellation, drainage before reporting and no
  restarted mutation. Preserve ordinary requests and bounded omission cases.
- No new receipt store or provider protocol; production contracts and Inspector
  architecture remain unchanged. Run the provider suite, production types and
  bounded self-review. AI interpretation/adoption remains unobserved locally.

Follow-up result - 2026-10-24:

- Existing coverage was real for Core/Factory prefix state but disconnected from
  reporting; its save/load oracle used only the canonical reducer in memory.
  The integration was also absent from the existing App test:ai file list. These
  coverage gaps are now closed without changing production owners or contracts.
- The real owner/Runtime test now covers AbortSignal cancellation at 33 of 41
  entries, deadline admission and member rollback. It rejects whole-artifact
  replay without writes or another History entry. The original full-prefix
  canonical assertions remain; cancellation is not relabeled as success.
- Safe continuation is tested separately: after all entries of the first retained
  part are acknowledged but its delivery is cancelled, the existing source repair
  prepares only the next part. Actual creation calls contain only missing IDs;
  duplicate continuation is rejected. Completed state equals uninterrupted
  execution of the same artifacts, including properties, hierarchy and order.
  One Undo removes the continuation, the next removes retained earlier work;
  Redo restores each exact state. This does not invent within-part auto-resume.
- Document evidence now follows the real publication filter and wire encoder,
  materializer and file store. A new store instance reads the persisted checkpoint
  before Core load and full-state comparison. Repeating the same persistence batch
  is idempotent. Remote canonical application retains identical values, produces
  no echo and creates no local History. No live socket/browser claim is made.
- A scripted native peer now dispatches the main drawing tool through real
  preparation, App drawing and Runtime. The actual 33/41 receipt reaches the native
  report input with exact root/range/status, then the real report_outcome owner.
  Only one drawing batch executes; report processing leaves canonical state intact.
  This tests transport/report handling, not model interpretation of those facts.
- Admission: existing revision 73 mapping is unchanged. The four production owner
  files match the saved live-run source byte-for-byte. New tests initially exposed
  fixture omissions (selection registration and document wire decoding), which were
  corrected by using existing owners, not by weakening state comparisons.
- Validation: 68 focused App/Runtime cases passed; after adding actual file-store
  readback, all four owner integration cases passed again. Native/host/workflow
  suites passed 370 cases with one pre-existing executable-dependent skip; the
  strengthened real-receipt report case passed again after self-review. Production
  types and a separate strict integration-test typecheck passed. Scoped lint has
  zero errors and one unchanged console warning; naming passed 15 cases. Inspector
  current-source verify passed all 69 mapped cases at revision 73 (attempt
  1b105693-a564-4bd2-be51-d19f7f6582a2). The supplemental tests run through the
  existing App gates; they are not additional Inspector mapped cases.
- Self-review checked exact creation calls, actual abort versus delivery failure,
  final transaction authority, new-request replay rejection, owner drainage before
  reporting, History grouping, remote filtering, durable retry and cleanup. No
  production behavior change was needed. Test scratch stores are created inside
  the project and removed by the formal tests; no saved run evidence is modified.
- Scope limit: safe remaining-part recovery is verified only while the original
  retained source is valid and earlier parts are fully acknowledged. An uncertain
  partial part does not gain an automatic resume invocation. The live 101 run had
  already completed its sole drawing before cutoff, so actual AI recovery remains
  unobserved. No model/101, push or next-issue work was performed in this follow-up.

Status: implemented and locally verified. Base: 74e44c1f3bac2ac6cbe18901260be191c3fba6ad.
Evidence: immutable run 1792765309915, provider 5c12d7a4-6a90-482f-972e-f9a83d9cfe17,
inputs 38/42 and outputs 40/44/46. The second prepared artifact has 8,071 entries;
checkpoint IDs contain exactly its first 3,169 entries. Runtime reports unknown
settlement and native cancellation drops the structured result. This is not proof
that every property is correct or that replay actually happened.

Bounded design: the prepared-design owner captures confirmed mutation results using
runAiMutation's existing synchronous settlement observer. Its existing failure type
carries detached partial action evidence; Runtime retains it in existing actionResults
and failure settlement, preserving cancellation and transaction authority. No new
progress registry, scheduler, retry, persistence owner or geometry transformation.
For evaluation reporting only, extend the existing causal receipt ancestry to the
request root so the already
bounded reporting handoff consumes settled receipts after tool drainage. Cancellation
still rejects; evidence is not a successful invocation or permission for another write.

Step Execution Card - apply:

- Spec: Interrupted owner results; Inspector apply and apply-to-compose/apply-to-settle.
- Inputs: admitted prepared artifact, current permissions, existing mutation executor,
  synchronous settled results, real errors and cancellation/transaction outcomes.
- Outputs: unchanged successful output or typed failure with confirmed prefix,
  composition identity, counts/ranges and conservative settlement; original cancellation.
- Conditions: no receipt before acknowledged work; a rolled-back or failed member
  cannot join the confirmed prefix; final rollback overrides claims of retained writes.
  Full and compact success remain legal; no implicit resume for an uncertain member.
- Contributors: App drawing owner, Runtime failure/actionResults, existing grouped
  transactions and canonical publication. Forbidden: guessed IDs, diagnostic counters
  as receipts, replay, document rescans per slice or alternate History/persistence.
- Boundary: design-actions.ts, Runtime runtime.ts and public types, direct owner and
  runtime tests, current Framework package contract and App contract. Failure owner: apply.
- Naming: extend the existing AiActionExecutionError and AiExecutionError with optional
  owner receipts, preserving failure versus abort identity; existing result,
  settlement, appliedElementCount/Ids and compositionId meanings remain authoritative.
  No persisted document-format change. Capture each confirmed slice once, not a full
  accumulated result on every slice; assemble the interruption receipt once.
- Gates: fail-first cases before/within/after writes, later member rollback/failure,
  real grouped Undo/Redo, document publication/remote apply and save/load equivalence;
  real Runtime callbacks and terminal cancellation, no later action or replay.

Step Execution Card - compose:

- Spec: Interrupted owner results; Inspector compose and apply-to-compose.
- Inputs: registered native calls, existing causal batch receipts and cancellation.
- Outputs: failed/cancelled observation retaining owner evidence; bounded report input
  separates receipt facts from model interpretation and does not admit more operations.
- Conditions/bypasses: no acknowledged result preserves ordinary abort; cancelled
  transport is never success. Ordinary non-evaluation requests do not start reporting.
  Do not supply expired artifacts as executable recovery or synthesize remaining geometry.
- Contributors: local-tool-invocation, local-ai-provider, existing call ancestry and
  error carrier. Forbidden: duplicate receipt store, model calls, retry or new tool.
- Boundary: those owners and direct tests; local host/workflow only if required to
  preserve the same receipt. Failure owner: compose. No new lifecycle owner.
- Gates: actual native host path with cancellation, sibling isolation, provider mock
  protocol showing settled receipts in report input, bounded receipt representation,
  no tool/mutation after cutoff, unchanged successful and empty-result behavior.

Fixed DoD:

1. Distinguish interruption before writes, after a confirmed prefix, and after all
   writes before delivery; actual owner evidence determines the result.
2. Preserve confirmed count, identities/range and root across real owner, Runtime,
   native host and reporting. Unconfirmed work is neither successful nor replayable.
3. No later mutation after cutoff/cancellation; reporting uses only settled evidence.
4. Reuse existing recovery; offer remaining-only invocation only when proven safe.
   No whole-geometry resend, silent resume or replay of acknowledged changes.
5. Formal integration verifies canonical state, publication/remote application,
   persistence/reload and affected Undo/Redo, including rollback and no echo/history
   on remote apply. Successful writes retain their existing History boundary.

Required closure: mapped proof, focused App/Runtime integrations, production types,
scoped lint, naming, Inspector static/generation/candidate/accept/verify and bounded
self-review of changed owners and direct consumers. No model or 101. Stop/replan if
transaction semantics must change or an additional state owner becomes necessary.

Closure evidence and review:

- Structural admission passed before implementation. Fail-first formal cases proved
  lost owner prefixes, cancellation results, native evidence and report facts before
  their respective changes; permanent tests do not read ignored run artifacts.
- App/Runtime: 224 tests passed across ten focused files. Real Core/Factory tests use
  the actual mutation deadline and a later member rollback; the retained root and 32
  panels match complete canonical values after one Undo/Redo, server publication
  reduction, browser remote apply without echo/history, and save/load.
- Native/provider/workflow: 369 tests passed; the one existing executable-dependent
  native-protocol test remains skipped. The scripted provider drains an interrupted
  owner, carries failure evidence, emits bounded facts for 1/40 actions, explicitly
  marks omission, excludes geometry/free text, and performs no replay.
- Runtime/App/server/proof production types passed. Scoped ESLint has no errors and
  four unchanged console warnings. Naming passed 15 tests. Scoped Inspector catalog
  and workspace checks passed 25 tests. The extra whole-catalog viewer check exposes
  an unrelated pre-existing missing terminal route for artifact:property-intent-result
  in canonical-projection-and-collaboration-contract-realignment; its source is not
  modified by this task and it is not claimed as passed.
- Candidate 769b8741-e555-4547-8db6-5905ae2ebd71 passed all 69 mapped cases;
  review b1e17f5c94679f531d2de867003f9d6bd17d9adf8591ca5869d5475cccfee6a3
  had no blockers or retirements and was accepted as revision 73. All 67 previous
  obligations remain, with two interruption cases added. Final current-source verify
  is recorded in tmp/interrupted-results-inspector-final.log.
- Self-review preserved the existing abort class/code, safe failure explanation,
  grouped transaction authority, member settlement callback, full/compact success,
  partial status, completed-write settlement, sibling isolation and remaining-only
  recovery. General requests do not gain an extra receipt retention lifetime.
- This closes the fixed local DoD only. No model/101 was run, no actual AI recovery
  or first-frame improvement is asserted, and no next issue was started. Historical
  evidence is unchanged; no push is included in this authorization.

### Context discovery handoff - 2026-10-23

Status: completed after contract admission, fail-first regression, bounded
implementation and self-review. Inspector revision 72 verified all 67 cases.
Entry source: 0739116c3e4a5f03061b7cfaed5a8b6f12181a0f (clean worktree).
Shared motifs remains closed; no repetition round is reopened.

Evidence: immutable run 1792759840879, provider
6b02a8f4-aaae-4070-936d-fda4163552b5, payloads 38/39, 41/42 and 44/47.
Usage exposes no action fields at the union root and only the native wrapper's
outer fields. The same /oneOf/0 query delivers the action branch but rejects the
native path. The published native recovery repeats that invalid path. Both actual
execution routes remain valid. The live agent did not execute that recovery;
its deterministic failure must not be reported as an observed model retry.

Step Execution Card - compose:

- Product source: ai-execution-flow.md, Inspection discovery field ownership and
  receipts. Inspector: compose inputs, outputs, conditions, contributors, boundary
  and failure owner. Registered schemas remain the validation authority.
- Inputs: existing action/native registrations, exact selectors, usage/field/full
  requests, explicit refresh and continuations. No new invocation state.
- Outputs: compact union/wrapper navigation, identity-specific continuation selectors,
  complete requested fragments/constraints/references, truthful coverage and recovery.
- Conditions: action continuations use existing operations; native continuations use
  qualified names. Usage shows immediate fields and union branch roots at wrapper
  boundaries without enumerating all branch leaves. Missing paths remain unavailable;
  recovery requests the valid subset or same-entry usage, never the invalid scope.
- Bypasses: known contracts execute directly; full and dual-entry lookups remain legal.
- Contributors: canonical schemas, existing descriptor projection, schemaFragments,
  dispatcher and read owner. Forbidden: aliases, pointer inference, extra lookup
  prerequisites, full-schema preload, new registry/cache, mutation replay.
- Implementation: local-operation-tools.ts only; direct tests and a minimal saved
  query fixture, execution-flow-proof.test.ts and existing flow mapping. Contract
  edits: this plan, product spec, Inspector, generated bundle and task context.
- Failure owner: compose; read settlement never certifies requested coverage.
- Cases: saved same-name union/wrapper query, successful direct paths, invalid/mixed
  paths, delivered recovery, both executions, full/refresh/paging/cancel/stale reads,
  unrelated inventory, escaped keys/local references and ancestor restrictions.
- Fixed DoD: tests select paths and selectors from delivered usage and execute the
  published recovery; both routes reach the read owner with exactly one wrapper;
  complete constraints survive; invalid requests do not dispatch; valid siblings
  survive; recovery never repeats writes. Measure total lookup bytes and calls
  against the saved flow; no extra preliminary round trip or schema preload.
- Gates: naming before/after identifiers, fail-first formal regression, direct
  discovery/dispatcher tests, mapped execution proof, production types, scoped lint,
  Inspector static contract, generated bundle, candidate/accept/verify and diff review.
- Stop: any need for new owners/state, changed execution semantics, unrelated fixes
  or a model run. Review is bounded to this diff and its direct consumers.

Minimal change: derive compact navigation from canonical schema structure; reuse
existing operation/qualified-name selectors for each returned entry; replace invalid
recovery with usable same-entry navigation or valid requested subset. Keep valid
scoped refresh unchanged. Formal execution tests consume the delivered selectors,
paths and recovery, not a separately authored correction. No context-owner or
Framework API change is planned.

Verification and closeout:

- Structural admission preceded formal tests. The two delivered union-navigation
  cases failed on missing paths; executing the saved published recovery independently
  reproduced failed coverage. The mapped case also failed on missing navigation.
  Evidence: tmp/context-discovery-red.log, context-discovery-recovery-red.log and
  context-discovery-proof-red.log. The permanent fixture contains only saved queries,
  invocation, baseline sizes and source hashes; formal tests do not depend on tmp.
- Production change is confined to local-operation-tools.ts. Usage exposes compact
  canonical branch/definition navigation; per-entry action/native selectors replace
  ambiguous bare-name continuations. Invalid recovery now retrieves a valid subset
  or same-entry usage. It never retries known invalid pointers, marks unavailable
  requested scope successful, guesses aliases, preloads schemas or dispatches edits.
- Both actual context invocation routes receive identical unwrapped action values
  and reach createDocumentContextAction plus createRetainedDesignContext. Exact
  fragments preserve the original union and native-wrapper restrictions. Malformed
  input, extra fields, invalid scope, missing/double wrappers reject before dispatch.
  Cancellation, stale snapshots, full retrieval, refresh and valid sibling outcomes
  remain covered; informational recovery does not repeat an acknowledged call.
- Whole saved lookup comparison (UTF-8 input plus output, two requests in each):
  historical mixed flow 108 + 27,654 = 27,762 bytes; corrected action flow
  113 + 19,138 = 19,251; corrected native flow 147 + 19,217 = 19,364.
  This proves about 30% less lookup delivery with no extra prerequisite request,
  not a measured reduction in model latency or proof of model adoption.
- Final deterministic integration: 458 passed across operation tools, provider
  adapter, context action and retained context; one existing installed-native
  registration check skipped because LOCAL_AI_PROTOCOL_EXECUTABLE was unset.
  No inference was invoked. Existing tests cover ordinary discovery, shared-path
  multi-entry queries, paging/revision invalidation and unrelated catalog growth.
- Production typecheck passed. Scoped ESLint: zero errors, one pre-existing warning
  at execution-flow-proof.test.ts:1626. Naming: 15 passed before and after identifiers.
  Inspector static contracts: 2 passed. Generated workspace and diff checks passed.
- Candidate 1f3ed021-3273-4cb7-a83e-a10309f6a502 passed all 67 cases; review
  9a8818a45b70012589cf05ed337903d1b6a51e2f7cf7cbd62e9de1a3779567ba
  admitted one new case without retirement or blockers. Accepted revision 72 verify
  a3fcfef3-c762-4f83-8ded-8c38fca98d68 passed all 67 on the same captured source
  1cc92a5a83668bc4fdc3737d44d077a7705a060f5450bbe82eb923bb01801957.
- Bounded self-review checked the changed projection/recovery branches, public
  provider description forwarding, both selectors, exact schema/reference closure,
  dispatcher envelope and read owner, and existing page/refresh consumers. Test
  fixture/type/lint errors were corrected before final gates. No runtime owner,
  mutation, persistence, Undo/Redo or collaboration semantics changed.
- Subsequent authorized live run 1792765309915 preserved complete input/output,
  report and screenshots without video: 120 seconds of work plus at most 60 seconds
  for reporting. The updated discovery description reached local Codex, but the
  agent made no read_design_context or schemaPaths request. It reused the first
  drawing receipt's compositionId directly. This is not an observed pass or failure
  of context navigation or recovery; AI adoption remains unobserved.
- Close this slice on formal local integration evidence, as authorized by the user.
  No claim about model adoption, reduced live lookup time, first-frame improvements
  or Knowledge effects. The live run does not replace deterministic regression
  coverage. No new compatibility path, state or registry; Task 3 remains active.

### Shared normalized motifs handoff - 2026-10-23

Bounded contract: generic reuse of an ordered normalized polygon definition across
independent planar grids, not a building/window-specific algorithm. Entry source:
86b391f9f4624e018a08b0824bacaa216a072174. Saved first input from run 1792750592095
contains six identical 278-byte motif arrays in a 7,807-byte invocation. Grids differ
in boundaries/counts, so translation-only pattern cannot replace them. Public events
bound the final preparatory read to first submission at 34.826 seconds; serialized
App arguments do not establish model-generated code size or causality for that delay.

Public contract: optional root motifTemplates maps names to existing ordered inline
motif arrays; a grid uses either its existing array or motifs:{template:key}. No
per-reference overrides, inheritance, recursion or automatic deduplication. Inline
arrays remain independent. Root-local references disappear into ordinary vectors;
canonical IDs, materials and painter order do not change. Invalid/missing references
reject before writes. Existing retained recipes own source snapshots and repairs.

Owner review: construction validates a named definition once per compilation and
reuses only normalized motifs and camera-projected offsets. Each grid independently
validates/projects its boundary and expands cells. Budget admission resolves the same
root-local source to count all expanded nodes/points before cloning; partitions retain
root definitions. No cross-preparation cache. Source edits, repair, cancellation and
release follow existing preparation lifetime. No Framework API change is necessary.

Step Execution Card - prepare:

- Spec: Shared normalized motifs; Inspector prepare, compose-to-prepare and existing
  prepare/apply routes. Inputs: draft, root definitions, current budgets; outputs:
  ordinary prepared artifact, real source-work counts, retained source/error receipts.
- Conditions: same shared projection, absolute root, strict inline-or-reference form;
  bypass: direct edits and drafts without templates retain current behavior.
- Contributors: construction, budget, preparation, existing repair/parts. Forbidden:
  model calls, canonical writes in preparation, geometry inference, sorting, global cache.
- Allowlist: design-construction.ts, design-budget.ts, design-construction-schema.ts,
  local-design-tools.ts, their formal tests/recorded fixture, execution-flow proof.
- Test first: shared vs inline exact outputs, generic non-window motifs on varied
  planes/counts/orders/palettes/offsets, pattern members, missing/invalid references,
  count bounds, cancellation, mutation isolation, repair and release. Browser verifies
  real application, Undo/Redo and durable reload through existing test harness.

Step Execution Card - compose (after prepare passes):

- Same spec; Inspector compose and compose-to-prepare. Inputs: canonical selected
  schema and owner examples; outputs: executable selected guide with all constraints.
- Existing discovery/filtering/example and dispatcher owners only; known calls bypass
  discovery. No additional lookup or broader preload. Inline/independent choices legal.
- Allowlist: design-preparation-examples.ts, design-workflow-discovery.ts if needed,
  local-design-workflow.ts if needed, local-design-tools.ts, direct delivery tests.
- Execute the actual delivered example, then the saved compact input through main
  workflow; verify partial outcomes and recovery without replaying completed writes.

Fixed DoD:

1. Permanent provenance-bearing fixture, no ignored tmp dependency; formal red before
   implementation. Recorded invocation decreases at least 15% with unchanged content.
2. Total first-use delivery (startup/query/guide/example/input) decreases, guide bytes
   and page count do not increase, no new lookup. Measure the baseline on entry source.
3. All 2,669 recorded objects retain geometry, material values, order, keys and parents;
   generic cases preserve palettes, offsets, both orders, pattern references and inline.
4. Definition validation occurs once per compilation; repeated artifact lookup does no
   source work. Budget admission counts expanded output; no persistent cache or limits change.
5. Invalid references reject before writes; cancellation, repair, release, partial success
   and recovery retain truthful results and never replay acknowledged parts.
6. Actual apply/Undo/Redo/durable reload, relevant integration tests, production types,
   scoped lint/naming, Inspector admission/proof/static gates and bounded self-review.
7. No fixture names, dates, counts or building semantics in runtime branches. Deterministic
   improvement does not establish AI adoption or reduced live latency.

Stop on a contract/owner conflict or if the proposed delivery cannot meet the fixed
byte/round-trip DoD; revise this bounded plan from evidence, never silently weaken it.
No fourth round of the closed repetition slice and no capacity experiment.

Result - deterministic DoD complete:

- Structural admission passed before implementation (66 mapped cases). The formal
  red reproduced unsupported shared input and incorrect reference budget accounting.
  Construction now parses each named normalized array once, independently projects
  each boundary and retains existing expanded output and source limits.
- Saved first invocation: 7,807 -> 6,614 bytes (15.28% less); all 2,669 canonical
  objects, geometry, materials, source keys, names, parents and order are identical.
  Selected guide: 27,021 -> 27,009 wire bytes, still two pages. Guide plus invocation:
  34,828 -> 33,623 bytes (1,205 / 3.46% less). Existing initial scope instructions and
  query route are unchanged; no added lookup or preliminary capability read.
- The actual delivered root-material/independent-node/pattern example executes through
  the main dispatcher. Generic triangles/chevrons on different planes/counts, both
  painter orders, palettes, world offsets, mixed inline exceptions and pattern members
  pass. Work-count tests prove one definition read and separate boundary projection;
  unused definitions still consume source budget, and source edits recompile correctly.
- Partial part failure returns an owned draft; repairing its missing reference uses
  the existing retained source and preserves the completed part without replay.
  Cancellation, invalid definitions, release and source-selected parts retain current
  protection. No production budget change or live capacity experiment.
- Eight focused server suites passed 465 tests; the final strengthened 15-case motif
  suite passed again. Production App/server/proof types, scoped lint (zero errors,
  one preexisting console warning), naming and static Inspector checks passed.
  Browser application/Undo/Redo/durable reload passed in 28.4 seconds, with real
  canonical geometry/parent/order checks and full scene/props persistence digests.
  Its owned services were stopped; evidence is under tmp/shared-motifs-browser/.
- Isolated proof initially could not capture a fixture from **tests**; static import
  did not change that owner boundary. Keep the full recorded fixture in ordinary
  formal tests; the self-contained mapped proof uses generic polygons, following
  the existing verifier contract. No Inspector engine change or missing-proof pass.
  Candidate c98d057b-1bd3-417f-a63d-2ee3ab43c29c passed 66/66; contract review had no
  blockers and was accepted. Admitted revision 71 verification
  bb5694c5-d18f-43a2-b627-29ca02d50133 also passed 66/66 on the same runtime source.
- Bounded self-review covered the changed owner, schema/selected reference closure,
  inline consumers, budget partitions, retained repair, material compilation and
  browser lifecycle. No building-specific runtime branch, new owner registry,
  persistent state or compatibility alias. Initial compressed wording was clarified
  to retain absolute-root and row-major requirements while staying below baseline.
- Evidence and failed attempts are retained under tmp/shared-motifs-*. No model/101,
  Knowledge edit or additional push. AI adoption and first-frame latency are not
  established by these deterministic results.

Result - authorized live observation and convergence:

- Run 1792759840879 used the production 10,000 ceiling, no video, 120 seconds of
  work and at most 60 seconds of reporting. Four independent grids referenced one
  three-motif definition. No motif-specific supplementary query, refresh or repeated
  drawing submission occurred. The same saved input is 4,483 bytes versus 5,676
  bytes with inline definitions: 21.0% less, with all 2,119 compiled entries equal.
- First submission was at 52.37 seconds and first content at 53.81 seconds, compared
  with 62.53 and 64.28 seconds previously. Different initial drawing scope and optional
  contract selection prevent assigning the whole timing difference to motifs. The
  bounded success is useful reuse and reduced redundant input without changed output;
  overall task duration is not an additional closure requirement.
- Work stopped at 120 seconds; reporting took about 13.88 seconds. Full retained
  input/output, report text, images and reload evidence are saved with the run. The
  material judgment remained failed and the building incomplete. A later context
  field query returned partial coverage across two identities; tool-host cleanup
  also failed after the deadline. Neither is recorded as successful or repaired by
  the motifs slice. They do not reopen its unchanged fixed DoD.
- The user accepted convergence and authorized push. Before closeout, all 861 files
  in the accepted Inspector source and all 2,744 live source manifest entries matched
  the worktree. Historical evidence remains immutable; only this active plan records
  the subsequent observation. The next context-delivery investigation is read-only.

### Repetition handoff convergence - 2026-10-23

The user accepted closure of this bounded slice and authorized pushing the completed
work. The three-round count remains closed; the fixed DoD is unchanged. The broader
Task 3 plan remains active and must not be archived.

Separately authorized live run `1792750592095` used the production 10,000-object
limit, no video, at most 120 seconds of work and 60 seconds of reporting. Work ended
normally at 106.751 seconds; reporting ended at 118.461 seconds. Complete recorded
payloads/assets, report text, first/final/reload screenshots and source hashes remain
under that immutable run directory. No further capacity experiment is requested;
future evaluations use the production default without the explicit 2,000 override.

The first frame appeared at 64.278 seconds. The later submission at 90.410 seconds
used seven mixed-component instances; its adoption cannot explain the earlier first
frame. Component order preserves the upper tier occluding the lower top surface.
Forcing all surfaces, grids and lips into global layers would change relevant
occlusion. The absence of layer-pattern adoption is therefore not a failed DoD item.
The delivered first-page example supports layers where needed and preserves mixed
components as required by the existing contract.

Read-only same-content expansion measures the second invocation at 7,854 bytes
versus 23,851 explicit bytes (67.07% smaller); including the first invocation gives
15,661 versus 31,658 bytes (50.53% smaller). The permanent original fixture still
measures 24,502 versus 9,588 bytes and retains all 1,443 canonical objects. The live
checkpoint preserves 7,505 elements, submitted material choices and painter order.
This is not full visual acceptance, proof of model-visible native content, or a
controlled latency comparison. The version-bound deterministic and browser evidence
below remains applicable; the 841 Inspector runtime source hashes were rechecked.

Push validation integrated main `77debb222` and preserved both upstream text tests
and the completed delivery tests. Rebuilt the App dependency graph (20 successful
production build tasks) to replace stale pre-rebase declarations. The three text
admission/default failures then passed; all 95 preparation/tool cases passed, as did
145 browser-runtime unit cases, production types and scoped lint. The source-bound
Inspector attempt `9ecfbe71-2e03-4a91-8bb7-93a7ea18c5d6` passed all 64 mapped cases.
The deterministic layered fixture again passed actual application, Undo/Redo and
fresh-context durable reload (25.5 seconds); no real model was called. The broader
owner check passed its remaining 292 cases before the corrected dependency build;
no assertions or production behavior were changed to resolve those stale artifacts.
Naming and static Inspector checks passed (34 cases). The five preexisting console
warnings in the wider scoped lint remain warnings, not errors. Evidence is retained
in `tmp/repetition-integrated-*`; complete commit-dependent checks before pushing.

The subsequent read-only investigation identified identical normalized motifs on
independent grids as one bounded input-contract gap. Its authorized implementation
and fixed DoD are recorded above. The 34.826-second interval remains unassigned to
specific native generation/streaming work; no new logger or model run was introduced.

### Layer-preserving pattern handoff - 2026-10-23

Round **1 of at most 3**, including the preceding read-only diagnosis. Do not reset
this count on a changed hypothesis or relax the fixed DoD. A failed complete candidate
requires a bounded replan before the next round; three unsuccessful rounds stop work.
Model adoption and latency remain unverified without a separately authorized live run.

Evidence: saved run 1792742530370, drawing record 151121ee-201e-4563-9ae6-ec677678d331,
input payload 19 and usage outputs 11/14. The 24,502-byte invocation can be represented
in 9,588 bytes by two ordered patterns, preserving all 1,443 objects. Same-order
canonical materials/parents agree; coordinate difference is at most 2.19e-11. Source
keys/names change for 1,328 entries and must never be silently treated as unchanged
references. The delivered example is valid but models per-component interleaving only;
it begins after byte 23,241 on the second usage page. This is not proof of model causality.

Round 2 bounded replan: the first complete candidate passed the 538 direct-owner
regressions and real-browser lifecycle, but the full mapped proof retained the
superseded two-child example assertion. Correct that direct consumer to the current
three-child layered example, retain its executable validation and 16-object oracle,
then rerun the mapped proof. No production redesign, scope expansion or DoD relaxation.
The two unchanged template getter-count tests also fail on the entry source (5 reads
versus 1); record them as unresolved rather than changing the expected count.

Round 3 bounded replan - preparation read ownership (user-authorized follow-up):
The live call-stack trace attributes four raw face.vertices reads to two budget
reductions (array guard + length for maximum and sum), then one to structuredClone.
This is repeated structural scanning, not five geometry projections. The previous
whole-session one-getter-read assertion does not distinguish budget admission from
the required source snapshot.
Preserve admission before cloning; do not move cloning ahead of bounded rejection
or skip validation to satisfy that obsolete aggregate assertion.

Step Execution Card - prepare:

- Inputs: ordinary draft and effective existing budget; output: unchanged budget
  observation/rejection, then immutable recipe and canonical artifact.
- Owner: design-budget structural admission, followed by existing preparation
  snapshot/compilation. Conditions: read each pattern face vertex collection once
  per budget scan to derive sum and maximum together. Successful preparation also
  snapshots once. Rejected budgets never snapshot/compile; cancelled async work
  never publishes. Artifact lookup reuses completed work without source reads.
- Bypass: retained valid artifact lookup; direct construction does not acquire a
  session snapshot. Forbidden: skipped validation, widened limits, changed geometry,
  new cache/state, pre-admission cloning or compatibility paths.
- Boundary: design-budget.ts (faces budget scan only), design-patterns.test.ts and
  execution-flow-proof.test.ts; same plan, spec, Inspector, manifest and generated
  workspace. No prepare/session/compiler production changes anticipated.
- Spec: Preparation source reads and immutable lifetime. Inspector prepare step,
  current source/target lifetime and failure owner; existing budgets/recovery routes.
- Tests first: separate admission read count, snapshot ownership, projection counts
  and cached artifact identity for sync/async and varied instance counts; exact sum,
  maximum and expanded counts for uneven/empty/malformed faces; reject before
  snapshot/compile and preserve cancellation, mutation isolation and release.
- Fixed DoD remains unchanged. This explains its work boundary rather than changing
  an expected count to five: one read in admission, one snapshot read, template-only
  vertex projection plus one shared zero and one offset projection per instance,
  no source reads during repeated lookup, unchanged canonical output.
- Gates: complete pattern suite, preparation/repair/owner/discovery consumers, mapped
  Inspector proof, types, naming, scoped lint, static Inspector tests and bounded
  self-review. Prior browser evidence remains valid unless output/consumer semantics
  change; no new model or 101. A failed complete round-three candidate stops work.

Step Execution Card - compose / compose-to-prepare:

- Spec: Layer-preserving repetition delivery; Composition examples within selected usage;
  Selected operation usage guide. Inspector compose inputs/outputs/conditions/bypasses,
  boundary and failure owner, plus the existing compose-to-prepare route.
- Input: current owner definitions/examples, actual selected query and canonical source.
  Output: one scope-valid executable composition example early in the same bounded guide,
  complete constraints/recovery, and ordinary validated source consumed by preparation.
- Conditions: choose repeat units by intended painter order. Independent layers stay
  separate; mixed components remain legal. Known calls bypass discovery. Explicit
  irregular or name/reference-constrained geometry remains legal; no mandatory pattern.
- Contributors: existing owner examples, schema scope filtering, usage projection,
  preparation and action consumers. No model, classifier, second registry, cache, state,
  automatic source rewrite, inferred geometry, new query or altered primitive semantics.
- Boundary: design-preparation-examples.ts, local-design-workflow.ts (guidance only),
  local-operation-tools.ts (selected usage presentation only); existing discovery integration,
  execution-flow proof, native-provider startup consumer and design-construction E2E files; new permanent recorded fixture
  and test-side equivalence helper. Contract files and generated Inspector bundle included.
- Failure owner: compose reports unavailable/invalid scoped content; downstream owners keep
  current invalid-input, partial, stale, cancellation and no-replay behavior.
- Design review: replacing the selected composition example, retaining the independently
  valid mixed example, and moving the existing invocation before parameter prose require
  no runtime feature. Compilation/references use current APIs. One source comparison
  excludes declared names/keys only; materials/topology/order are fully checked. New
  canonical persistence or collaboration behavior is outside scope.
- Stop: boundary mismatch, weakened oracle, missing constraints, unbounded delivery, or
  failures requiring a new mechanism. No compatibility path or subject-specific example.

Fixed observations and DoD (all remain required):

1. Preserve raw evidence/version hashes; extract necessary source/query into a permanent
   fixture. Formal tests cannot read ignored tmp evidence.
2. Startup owner selection distinguishes component versus layer repetition without eager
   schemas, extra discovery or increased initial guidance. Verify source-derived delivery.
3. Actual scoped usage, including optional plan, retains all pages/revision/constraints;
   executable example is in the first page and total bytes/replies do not grow. Recorded
   full guide body ceiling 25,604 bytes; wire replies 27,702 bytes / two pages. Preserve
   existing smaller one-page no-plan budgets and unrelated-catalog growth invariance.
4. Execute the published example through the dispatcher and canonical owners, not a
   separately invented sample; successful receipts agree with actual created objects.
5. Prove component-major and layer-major order, independent interposed nodes and a negative
   control that combines layers incorrectly. Valid mixed examples remain available.
6. Compare every coordinate/control/topology/fill/gradient/bounds at existing precision,
   ordered children and parents; no output omission or helper-only/count-only oracle.
7. Declare changed source names/keys, verify canonical target lookup from returned artifact
   references, preserve unaffected identities and explicit naming/reference constraints.
8. Saved full invocation shrinks at least 50%, without reducing expanded output. Count
   source/projection work and total delivery, not only a final page or node count.
9. Cover generic translations/counts, independent details/materials, and irregular/rotated
   or explicitly named alternatives without forced adoption or 101-specific behavior.
10. Keep existing budget, local success, cancellation, expired references and no-replay
    recovery gates. Do not repeat the completed live capacity experiment.
11. Verify actual browser application, editable ordering/parents, one Undo/Redo and durable
    reload for the compact fixture through the existing streamed receipt harness. Use
    canonical publication, not a separate model or test-only mutation path.
12. Preserve the separate future model observations (eligible repetitions, actual inputs,
    lookup bytes/calls, submission and first-content timing). Existing records suffice;
    do not add a logger or claim model adoption/performance from deterministic tests.

Gates: test-first failed delivery/order case; saved canonical equivalence and references;
focused owner/discovery/representation suites and existing recovery consumers; production
TypeScript, scoped ESLint, naming, Inspector static/workspace generation and source-bound
mapped proof; the focused real-browser lifecycle above. Self-review is limited to this
change, direct consumers and frozen gates. No broad local CI, model or 101.

Round 2 verification and bounded self-review:

| Observation                        | Result                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formal red before production edits | Two selected-usage cases failed: example after parameters / absent from the first optional-plan page. `tmp/layered-pattern-red.log`.                                                                                                                                                                                                                           |
| Saved complete invocation          | 24,502 to 9,588 bytes (60.87% smaller); 1,443 canonical entries retained. Both source forms remain permanent fixture data.                                                                                                                                                                                                                                     |
| Ordered canonical equivalence      | All entry geometry/topology/parent references/materials compared at existing precision; 1,328 changed source keys/names explicitly counted. Returned target-set IDs resolve the intended final grid layer; release invalidates them.                                                                                                                           |
| Work counts                        | Construction source nodes 103 to 33; projection calls 336 to 130. Expanded output is unchanged. `tmp/layered-pattern-work-counts.log`.                                                                                                                                                                                                                         |
| Selected usage with plan           | 25,604 to 25,437 body bytes; 27,702 to 27,565 wire bytes; still two pages, complete executable example now on page one.                                                                                                                                                                                                                                        |
| Selected usage without plan        | Implicit pattern 19,719 to 19,654 bytes; explicit pattern 20,087 to 20,022; one page. The saved query with an explicit empty optionalInputs list is 20,082 bytes.                                                                                                                                                                                              |
| Initial native instructions        | Entry-source replay 30,395 bytes; candidate 30,169; owner selection forwarded once, no eager example/schema.                                                                                                                                                                                                                                                   |
| Direct owner and discovery suites  | 538 passed / 1 preexisting skipped across discovery, operations, workflow and native provider. `tmp/layered-pattern-regression-final.log`.                                                                                                                                                                                                                     |
| Generic and negative cases         | Different counts, signed translations, explicit naming alternatives, materials and independent details pass; merging painter layers fails the same canonical oracle despite equal object count.                                                                                                                                                                |
| Browser lifecycle                  | Real streamed action receipts, 1,443 applied objects, every parent/world position/size and child order; one Undo/Redo, durable document digest and reload pass (25.4 s). `tmp/layered-pattern-browser/test.log`. Owned services stopped.                                                                                                                       |
| Inspector                          | 63/63 mapped cases pass in source-bound attempt `5d488e4d-eb07-4274-924c-5ddd67cdc05d`; all 841 captured runtime source hashes still match. 27 static contract/workspace tests pass.                                                                                                                                                                           |
| Other gates                        | Production TypeScript and naming pass. Scoped ESLint has zero errors; two unchanged console warnings remain. No task-added whitespace errors; the two existing Inspector trailing spaces are unchanged from entry.                                                                                                                                             |
| Open entry-source failures         | design-patterns.test.ts: both sync/async `reads template vertices once instead of once per instance and reuses admitted artifacts` expect one getter read but observe five. The entry-source replay reproduces both; no expectation was weakened and no unrelated preparation implementation changed. `tmp/layered-pattern-baseline-failures.json` and `.log`. |

Self-review confirmed only compose guidance, the current owner example and selected
usage property order changed in production. The valid mixed example, canonical input
schemas, output budgets, independent actions, parts/repair, refresh and execution
owners remain intact. Tests execute the published invocation, preserve partial and
cancelled receipts, and retain no-replay behavior. No automatic source folding, new
state, compatibility branch, model invocation or 101 was added.

The obsolete native-provider text assertion was updated to the current owner wording
(`each part artifact fits`); its byte ceiling and source-derived guidance checks remain.
The mapped proof's old two-child example assertion now matches the three-child layered
example while retaining input admission and 16-object validation.

Round 2 checkpoint (resolved by round 3 below): full fixed-DoD closure was **not claimed** while the two existing representation-suite
failures remain unresolved. Do not reset the round count, suppress those tests, loosen
their oracle or expand this compose patch into preparation work without a bounded
follow-up decision. Future model adoption, generated invocation bytes, repeated reads,
submission timing and first-content timing remain unobserved for this candidate.

Round 3 result - fixed deterministic DoD complete:

- Confirmed cause: the faces budget branch traversed the same list twice and read
  each vertex collection twice per traversal (array check and length). Snapshotting
  read it once more. This was four structural reads plus one snapshot, not five
  geometry compilations. The old whole-session count mixed distinct work owners.
- Production change: one pass in design-budget.ts derives both total and maximum
  from one local vertex-collection read. No other production owner changed in this
  round; admission still precedes snapshot/compilation. No new cache or larger limit.
- Permanent tests first: five strengthened phase/aggregate cases failed on the old
  budget code (`tmp/layered-pattern-round3-red.log`). Assertions distinguish one
  admission read, one snapshot read, and zero caller reads during retained lookup;
  the whole-session expectation was not simply changed to the observed five.
- Template work: with 1/100/1000 instances, four face vertices are compiled once;
  total projections are four vertices plus one shared zero plus one offset per
  instance. Source-work nodes/points remain 2/4. Complete artifacts equal fresh
  preparation, including after a real source edit. Existing artifacts stay immutable.
- Rejection and lifetime: over-budget sources never snapshot or compile; pre-cancelled
  async calls read nothing; unrelated valid artifacts survive rejection. Release and
  foreign-session lookup reject. Unequal, empty and malformed faces retain exact
  sum, maximum and expanded accounting; malformed geometry remains rejected.
- Validation: all 60 pattern cases pass; 425 preparation/repair/owner/discovery
  consumer cases pass; 64/64 Inspector cases pass and are accepted under attempt
  `678e0ecf-7917-449f-a19b-0746ed669c7a`. All 841 captured runtime source hashes match.
  Inspector static checks pass 27/27. Production types, naming and scoped lint pass
  (zero lint errors, one unchanged console warning). The final source-edit isolation
  assertion was rerun in both sync and async modes and passed.
- Evidence: `tmp/layered-pattern-round3-patterns-final.log`,
  `tmp/layered-pattern-round3-consumers.log`, `tmp/layered-pattern-round3-proof.json`,
  `tmp/layered-pattern-round3-accepted.json`, `tmp/layered-pattern-round3-static.log`,
  `tmp/layered-pattern-round3-types-final.log`, `tmp/layered-pattern-round3-lint-final.log`.
- Self-review: old reductions removed; input schemas, limits, geometry, material,
  painter order, keys, parent relations, delivery bytes/pages and recovery behavior
  unchanged. The earlier layer-equivalence/first-page cases pass again through the
  actual dispatcher. The prior verified browser Undo/Redo/durable reload evidence is
  retained because those owners and canonical outputs did not change; no model or
  browser experiment was repeated just to replace unchanged evidence.
- The two former representation-suite failures are resolved. No DoD criterion was
  dropped and the round count remains 3/3. Model adoption, latency and first-frame
  improvement remain outside these deterministic completion claims.

### Safe capacity continuation - 2026-10-23

Confirmed boundary: the retained-source partition plan is already executable, but
compose exposes it as failed/not-started and requires a redundant model invocation.
The latest 2,000 live run did not overflow; fixed saved 13,095-object input is the
regression source. Historical evidence and completed stages remain unchanged.

Step Execution Card - prepare:

- Spec: Source-referenced expansion recovery; Inspector prepare inputs, outputs,
  conditions, implementation boundary and failure handling.
- Input: admitted source or explicit repair, optional owned material source, effective
  artifact limit. Output: standalone prepare_design success guarantees a compiled artifact. The main
  workflow opts into the same owner internal capacity-plan result; this is never a
  canvas receipt or a new registered tool. Unsupported/invalid/expired/unretained input
  remains an explicit failure. Small sources bypass partition planning.
- Contributors: existing budget, source retention and preparation owners only; no
  model, canonical write, additional store, geometry simplification or raised limit.
- Files: local-design-tools.ts, design-preparation.ts, design-draft-repair.ts if terminology needs correction,
  their formal tests and execution-flow-proof.test.ts, already in the allowlist.
- DoD: fixed excess produces an owned plan without compilation/writes; enforce real
  rejection, capacity/expiry and valid ordinary preparation. Prove failure first.

Step Execution Card - compose (after prepare review):

- Spec: Source-referenced expansion recovery and Expansion budget selection;
  Inspector compose consumes prepare outputs and actual canonical action receipts.
- Input: ordinary draft/repair or ordered parts, owned partition plan. Output: actual
  ordered completed/partial receipts and confirmed remaining-only repair references.
- Use the existing parts executor for first and later partitions without returning to
  the model. Preserve explicit part parent links, order, plan/message, material source,
  inspection policy, cancellation and no replay. No second scheduler/state owner.
- Files: local-design-workflow.ts and direct delivered guidance, discovery-delivery,
  local-design-workflow and execution-flow-proof tests. The existing deterministic browser
  lifecycle test now connects the real main tool to streamed browser receipts (no
  model), proving sequential application, normalization, Undo/Redo and durable reload.
- Fixed discovery/review: current owner files, actual public invocation/observation,
  direct consumers, permanent 13,095-object fixture; no unrelated repository audit.
- DoD: one public call completes eligible excess at 10,000/2,000 with truthful child
  progress; source-free remaining recovery on real later failure; no repeated writes
  for duplicate handles, cancellation, lost acknowledgement or stale continuation.
  Preserve geometry/material/order/one root and valid explicit parts; no early success.
- Gates: fail-first formal cases, focused owner/integration tests, canonical browser
  lifecycle, production types, scoped lint, naming, static Inspector and source-bound
  mapped cases. Stop after self-review; no model/101. Boundary/spec contradiction or
  repeated failed implementation requires bounded replan, not scope expansion.

Prepare step review exposed an export-pin failure in the first public-plan-output
iteration. The revised boundary below removes that public union and the temporary
borrow helper entirely. Existing request-owned source lifetime and native repair
input borrowing remain authoritative. A separate native cache-read regression proved
that an already compiled partition needs the existing borrow operation before its
current call exports it; preserve assertOwned and reuse without recompilation. No
lease policy or store changes remain.

Bounded self-review also reproduced and corrected two direct regressions: retaining
only pending source partitions after an earlier independent success, and preserving
the ordinary immediate-inspection default when automatic capacity continuation is
selected. Explicit defer/immediate remain unchanged. Dedicated formal cases cover
both; no write or failed follow-up is relabeled successful. The native case
checks the main invocation and a later source read through actual host ownership.
Final source-matched gates and the streamed browser lifecycle remain required.

Bounded replan after full Inspector regression: a union in standalone prepare_design
success broke existing statically admitted recipes that bind /artifactId. Preserve
that valid single-artifact API and its genuine capacity refusal. Only the main tool
opts into the existing preparation owner capacity-plan branch, with its exact internal
result schema and normal progress; it consumes the plan before returning. No public
compatibility alias, duplicate registry, relaxed recipe admission or new state.
Keep the failing source-bound recipe case unchanged; it is the preservation oracle.
Rerun native handoff, owner cases, types and source-bound Inspector after this correction.

Verification checkpoint: 202 owner, discovery, recovery and existing recipe cases,
four scripted native protocol cases, 62 source-bound Inspector cases, one real browser
streamed lifecycle case, 15 naming and ten static Inspector/catalog cases passed.
Production app/server/proof types passed. Scoped lint has zero errors and two existing
console warnings. Fixed 13,095-object input completes via the main tool at both
10,000 and 2,000 limits without a model round trip. Real later failure retains only
pending source references; cancelled/uncertain work never becomes automatic replay.
The browser oracle verifies every member world position/size, painter order and one
root, then one Undo/Redo and durable reload. Source geometry/fills/ordering equivalence
is also covered by the permanent partition tests. A development reload interrupted
an earlier browser attempt; the subsequent frozen-runtime lifecycle passed. Later
edits were type annotations only; no browser behavior changed.

Inspector attempt `76b2415b-9074-4dad-96f2-364c9cf86e10` was accepted after bounded
self-review; all 841 runtime source files matched. Evidence is under
`tmp/capacity-progress-*`, including fail-first logs, native reuse failure, the first
failed Inspector attempt and final accepted proof. All task-owned browser test
services were stopped and their ports released. Existing unrelated dirty work and
immutable run reports remain unchanged. No model/101, push, goal or automation ran.
This closes this capacity-handoff stage only; no model behavior or latency improvement
is claimed. Standalone preparation remains the valid single-artifact API; the main
tool owns automatic retained-source continuation.

### Evaluation-only 2,000 artifact budget - 2026-10-23

Step Execution Card - prepare, with compose/observe direct consumers:

- Spec: Bounded evaluation work and self-report. Replace the current evaluation-only
  5,000 override with 2,000; production remains 10,000. Historical runs and reports
  retain their original policy. No compatibility alias for the superseded override.
- Inputs: existing evaluation-window metadata and explicit runner argument.
  Outputs: identical effective limit in delivery, admission and source partitions.
- Owner/boundary: existing preparation session, evaluation-window admission and
  runner argument parser; tests use the actual discovery/dispatcher/recovery path.
  No new state, scheduler, geometry, recovery schema, result-status or Knowledge changes.
- Contributors: those existing owners, their formal tests and current contracts.
  Failure owner: preparation for admission; observe for collection. Absence of the
  test override retains production policy; invalid values reject before work.
- DoD: prove 2,000/2,001 boundaries and old-override rejection, production isolation,
  real delivered policy, geometry/material/order preservation across smaller parts,
  partial recovery and no replay. Run focused tests, production types, scoped lint,
  naming, Inspector admission and source-bound cases; review direct consumers.
- Observe card: after verification run exactly one no-video 101, 120 seconds of
  work plus at most 60 seconds of reporting, preserving full linked I/O, images,
  report and source identity. Stop after that run, including inconclusive outcomes.
- Review the user's proposed distinction between recoverable capacity and genuine
  rejection using actual existing recovery replies. Do not silently change result
  semantics during this budget experiment. Record the minimal follow-up, including
  valid next-part signals, acknowledged progress and terminal failure protections.

Verification checkpoint: the 2,000 override replaces 5,000 in the evaluation-window,
preparation-session and runner admission only. Two fail-first cases reproduced the
old rejection of 2,000. All 69 budget/repair/discovery cases, 45 transport/projection
cases, one native-delivery case, 18 capture/protocol cases, 62 source-bound Inspector
cases, 15 naming and ten static Inspector/catalog cases passed. Production types
passed; scoped lint has zero errors and two existing console warnings. Inspector
attempt `fb5b44a1-33de-4917-867e-43292cb93e89` was accepted and all 841 runtime
source files matched. The single authorized live run follows this fixed source.

Live checkpoint: run `1792698079485` completed once without video. One 70-object
artifact, first content 73.930 s, cutoff 120.003 s, report 133.315 s, collection and
cleanup complete 135.003 s. There was no live overflow or parts recovery; do not
claim model recovery adoption. Report text exactly matched raw output and its
screenshot was captured. Four streams and 46 payload/assets verified; two native
tool images retained, one saved root and durable sequence 4 matched reload.
No post-cutoff drawing; all owned services stopped. The model's image-forwarding
error claim remains self-report, not independently proven by App tool receipts.
[Detailed observation and capacity-continuation proposal](../evaluations/2026-10-23-101-evaluation-2000-and-parts.md).
Current recoverable capacity still surfaces failed/not-started with recoveryInvocation;
this experiment did not modify that status contract or authorize another model run.

### Test-only artifact budget - 2026-10-23

Step Execution Card - prepare, with compose/observe direct consumers:

- Objective: reproduce budget recovery under an explicitly lower evaluation limit,
  without changing the production ceiling or claiming that overflow is guaranteed.
- Input: existing evaluation-window metadata, optional expandedNodeLimit=5000.
  Absence preserves 10000; all other override values reject. No model tool can
  alter the policy. Lifetime is the existing request/session, never global state.
- Owner: canonical design budget, existing preparation session and rejected-source
  store. Thread the effective limit through guidance, structural inspection and
  contiguous complete-instance partition planning. Keep compiler/browser hard
  safety ceilings, all other limits, geometry and order unchanged.
- Contributors/allowlist: evaluation-window and its provider consumer; design-budget,
  draft-repair, preparation, local-design-tools/workflow; existing runner/protocol;
  their permanent tests, execution-flow proof/mapping and necessary contracts.
- Failures: invalid evaluation settings reject; rejected preparation writes nothing.
  Returned recoveryInvocation uses retained source only. Partial/failed/cancelled
  recovery retains acknowledgements and resumes only confirmed remaining parts.
- DoD: fail-first tests prove default/override isolation and exact 5000 boundary,
  effective delivered guidance, each recovered part within budget, complete geometry,
  and existing no-replay/expiry/cancellation protection. Verify real provider setup
  receives the same window. Run focused tests, naming, lint, production types,
  Inspector admission and source-bound proof before the single authorized run.
- Observe: record explicit effective and production limits, work/report deadlines,
  complete linked raw records and assets. Capture admitted report independently of
  raw provider prose. Report no-overflow or missing recovery as unexercised, never
  passed. Stop after one run; no automatic model retry or unrelated correction.

Implementation checkpoint: explicit evaluation-window policy reaches the existing
request-local preparation session, budget inspector, source partition store and
usage/schema descriptions. Production and all non-object limits remain unchanged.
The compiler/browser 10,000 safety ceilings remain intact. Fail-first tests detected
all three missing policy boundaries before implementation. Verification includes
exact 5,000/5,001 boundary, default isolation, native discovery delivery, complete
13,095-object geometry/material/order equivalence, remaining-only retry and duplicate
protection. Final owner 15, discovery integration 54, browser transport/projection 45,
capture/protocol 18 and source-bound Inspector 62 cases passed. Existing workflow 63,
local preparation tools 39 and compiler 52 cases also passed. Naming, scoped lint
(zero errors; four existing console warnings), production types and ten static
Inspector/catalog checks passed. Source-bound attempt
`4901f069-a15f-4c1a-83c6-48ed17518bf0` was accepted. The native budget test uses a
scripted transport; only the following explicitly authorized observation calls a
real model. No inference of live recovery coverage before that run.

Live checkpoint: run `1792696509071` completed with no video. First content 66.165 s;
work stopped 120.002 s, report returned 135.522 s, capture/reload/cleanup ended
140.745 s. Two artifacts contained 2,629 and 2,495 objects; neither exceeded 5,000,
so live parts recovery remains unexercised. Exact report text and screenshot were
captured successfully. The model report incorrectly compares their document total
5,124 with the per-artifact ceiling; delivered guidance and admission both use
per-artifact scope. Preserve this interpretation error in evidence. All 79 referenced
payload/assets and five stream sequences verified; two exact tool images retained;
durable roots and sequence matched fresh-context reload. No drawing after cutoff.
All owned services stopped. Detailed evidence and limitations:
[the bounded evaluation report](../evaluations/2026-10-23-101-evaluation-budget-and-report-capture.md).
No automatic follow-up run is authorized by this completed checkpoint.

### Settled report capture - 2026-10-23

Evidence: run 1792693671659 retains the native report in payload 64-output and
renders it in final.png, while run.json records Network.getResponseBody eviction
and a failed self-report capture. The collector calls response.text() on the full
stream, including large drawing batches. Browser context closure happens later;
the error's navigation suggestion alone does not prove navigation caused this loss.
The App has already consumed the stream and retains the actual runtime result in
its existing settled conversation turn. Raw model output alone is not admission.

Bounded design and Step Execution Card - observe:

- Spec: Bounded evaluation work and self-report. Inspector: observe, execution-trace.
- Input: the current settled conversation result, its recording/request and turn
  identity, the exact host report marker, final report action receipt, and rendered
  message. Output: attributed text plus independently confirmed screenshot.
- Reuse the conversation's existing result. Project only a bounded valid report to
  its rendered message; do not create a report store, fetch/parse a second stream,
  trust raw provider output as a fallback, or infer success from visible prose.
- Require executed runtime settlement, exact host marker, one final preview action,
  its matching terminal report_outcome/no-change receipt and valid bounded report
  text. Runtime receipts are ordered across batches; earlier batches may legally
  reuse action IDs. Consume the final receipt, not a global uniqueness scan.
  Earlier acknowledged drawing receipts remain valid and are not replayed.
- The collector selects exactly one report belonging to an observed request and
  the same rendered turn. Missing, conflicting, malformed, stale, failed or
  cancelled results remain missing evidence. Verify identity and displayed text
  again before screenshot. Only the assistant result text can match; user text or
  history cannot substitute. Text saved before screenshot survives image failure.
- Contributors: existing evaluation-window contract, conversation presentation,
  capture-lifecycle and runner. Failure owner: observe. No cache or new lifecycle.
- Allowlist: those owners, their panel/capture/real-browser tests, the existing
  execution-flow proof/mapping and necessary spec/README. No framework mutation,
  model settings, budgets, refresh, Knowledge, history or drawing algorithm edits.
- DoD: permanent regression fails before implementation; real App with scripted
  large response completes one report without DevTools body access or a second
  execution; request/turn mismatch, report rejection, text/image failure and bounds
  remain failures. Run focused capture, panel, provider/protocol and Inspector
  proofs, naming, lint and production types. Review direct consumers and the diff.
- Stop if the existing settled result cannot prove admission or preservation
  requires a new result authority. No real model calls or 101 run.

Budget reproduction remains independent: retain the actual 10,000 limit and use
saved over-budget source for deterministic recovery tests. A future live experiment
with a lower test budget needs an explicit isolated configuration and attribution;
it is not a product-limit change or part of this capture correction.

Status: implemented and verified. Contract admission passed before implementation;
formal panel and real-browser regressions failed on the previous collector boundary.
The browser reproduced diagnostic-body eviction while the App retained/rendered the
report. The replacement uses the actual settled result and the existing collector.
Self-review strengthened terminal-receipt selection for legal ID reuse and excluded
user/history text from screenshot verification; both new failures were reproduced
before correction.

Validation: 109 focused projection/panel/conversation/provider tests, 14 capture
cases, one real-browser scripted large-stream case, 61 source-bound Inspector cases,
15 naming cases, two architecture checks and eight workspace catalog checks passed.
App/server/proof production types passed. Scoped lint: zero errors; one unchanged
console warning in the existing execution-flow proof. Inspector attempt
`2b0f3ee8-7063-46ee-a3ba-d814f101bd75` passed and evolution review
`47419b344f3ba16ca4ce3e1d20aa2b25c0e07a83bf52128e5b7c31c60db04aec` was accepted.
All captured runtime source files matched the final implementation. Browser evidence:
`tmp/report-capture-browser-evidence/`; regression logs use `tmp/report-capture-*`.
The screenshot was inspected: the entire retained public report is visible.

No historical evidence was rewritten. Native report generation, real-model behavior
and a new 101 run remain untested in this stage. Artifact limits and work/report
budgets are unchanged. No push, extra model, automation or goal was started.

### Source-referenced expansion recovery - 2026-10-23

Objective: make the actual budget rejection directly executable as ordered recovery,
without model arithmetic or resending geometry. Run 1792686476663 payloads 30/33
confirm 13,095 expanded objects against 10,000, before writes; the selected draft
contract excludes parts and rejection only supplies prose. This does not establish
why the model made no subsequent call. Existing tests hand-author remaining drafts.

Design and admission review:

- The 10,000-object / 200,000-command limits bound each compiled artifact and browser
  wire admission. The preparation specification gives memory/wire containment as
  rationale; no measured 10,000-object performance cliff has been established.
  Keep the limits, the source work windows and browser admission independent.
- Budget owner computes exact costs and contiguous partitions over existing root
  children and complete pattern instances. Preserve original ranges and order.
  Scope automatic recovery to flat projected group contents with independent
  fillTemplates/world linearFields; reject relations, layout, nested containers,
  shared bindings or indivisible excess rather than changing their semantics.
  Require disjoint source key families for automatic recovery; duplicate keys or
  overlapping generated prefixes stay explicit failures, never become valid merely
  because they land in separate artifacts. Normal independent parts remain legal.
- Retained rejected source owns an immutable bounded partition description in its
  existing request lifetime. Extend repair with a partition index, mutually exclusive
  with arbitrary replacements. Return ordinary parts envelopes referencing that
  source, with backward continuation of the original root. No source geometry in
  the recovery invocation and no new lookup prerequisite.
- Preparation compiles one admitted partition at a time. Continuing partitions bind
  to the first partition's retained artifact/root; canonical application skips the
  already-created root and rebases child coordinates against its current normalized
  placement. Validate an unchanged anchor and ancestry before each slice; moved,
  removed, locked or stale dependencies reject. No extra group or relationship.
- Parts retains prior receipts and stops on failure. Return a remaining-only
  invocation only for confirmed not-started work; uncertain/partially written work
  requires inspection and never automatic replay. Normal draft/repair/parts remain.

Step execution cards (execute sequentially):

1. prepare - execution spec Source-referenced expansion recovery; Inspector prepare.
   Input: rejected compact source, immutable retained handle and explicit partition.
   Output: structural costs, bounded recovery parts and prepared artifacts with exact
   continuation binding. Contributors: budget, repair, preparation owners. No model,
   browser mutation, inferred geometry or duplicate stores. Boundary: design-budget,
   design-draft-repair, design-preparation, local-design-tools and their formal tests.
2. apply - same spec; Inspector apply. Input: admitted partition artifact and retained
   first-root evidence; output: canonical same-parent writes and truthful receipts.
   Contributors: existing Core APIs/transactions. No second mutation path, silent
   parent creation or replay. Boundary: design-actions, prepared-design contracts
   and prepared-material-action plus affected formal application/lifecycle tests.
   Bounded canonical lifecycle proof: existing e2e/design-construction.spec.ts.
   Material provenance must retain prior members and accept only equivalent Group
   coordinate normalization; changed geometry/binding or request ownership rejects.
3. compose - same spec; Inspector compose. Input: actual failure/part receipts;
   output: directly executable recovery/remaining invocations using ordinary parts.
   Contributors: existing preparation/application/discovery. No model recomputation,
   scheduler, status store or mandatory preflight. Boundary: local-design-workflow,
   selected delivery and formal dispatcher integration/proof cases.

DoD and bounded gates:

- Formal red case consumes the actual rejection and cannot recover on old source.
  Preserve the saved compact input as a formal fixture, independent of tmp.
- Execute returned invocations through dispatcher/preparation/application; compare
  complete geometry, materials, order and a single root/parent graph. Prove exact
  budget boundaries, unsupported cases, source expiry, cancellation, duplicate
  attempts, stale root, partial success and remaining-only recovery.
- Reuse source/partition computations in the retained lifetime; each successful
  partition is compiled/applied once. No increased artifact limits or first-read prerequisite. Recovery metadata is
  bounded to 128 parts and charged to existing retained-byte capacity; unsupported
  larger recovery plans remain explicit failures. Cancellation retains the existing
  aborted-invocation protocol and browser acknowledgements; it does not fabricate
  an outer success receipt or automatically replay the interrupted batch.
- Validate actual Core normalization plus Undo/Redo/save/reload where changed;
  source-space equivalence and owner receipt checks precede browser evidence.
- Focused suites, production types, scoped lint, naming and mapped Inspector gates.
  Self-review only the diff, direct consumers, failure paths and these gates.
- Stop and replan within this task if continuation cannot preserve coordinate or
  material identity. Do not silently broaden to native scene instancing.

Bounded verification review:

- Complete source equivalence and dispatcher recovery pass. Additive owner cost
  calculation replaces repeated prefix scans; the formal work-count regression
  failed at 64,250 vertex reads and now stays within 2,500 for 250 components.
- The browser lifecycle oracle reached full geometry/order validation. Its keyboard
  helper waits a fixed 500 ms and did not establish completed Undo. The next bounded
  verification uses the existing awaited public history owner and the same document
  digest; it does not change history behavior or claim the shortcut is fixed.
- Collect all per-node differences before one assertion to avoid tens of thousands
  of Playwright trace steps. Freeze source during the browser run to avoid dev HMR.
  Keep the geometry tolerance, one-commit check and durable reload oracle unchanged.

Verified checkpoint:

- Admission reviews `ca1d309e55c8c3b3ca57287e7d983174fe0624d2e8864cd641ce223b0f6e550c`
  and `bc94092bbe23affcbd4d7a78f3f946c495bd59e1773663b200edea0cb4b46554`
  accepted the bounded contracts. Final captured-source run
  `674aab04-efe9-4d9a-ab7f-e3f5ec033b99` passes all 60 mapped cases at revision 65;
  source digest `20eda93a345ea28a9df47c74a19d333046036958e920b71f0c6c1ddf7a690a1f`.
- 303 server and 52 application/material tests pass, including the permanent saved
  input fixture, complete numeric/fill/order equivalence, work counts, metadata caps,
  invalid references, key-family conflicts, cancellation and remaining-only recovery.
  Duplicate/foreign/released or unconfirmed application cannot advertise a replay.
- Deterministic browser lifecycle passes: 13,094 children plus one root, exact parent
  and painter order, every position/size, one Undo commit, awaited public Undo/Redo
  and durable reload digest equivalence. Log: `tmp/budget-recovery-e2e-owner.log`.
  This tests public history completion, not keyboard shortcut timing.
- App/server/proof production typechecks pass; scoped ESLint has zero errors and one
  pre-existing console warning; naming 15/15 and Inspector static contracts 2/2 pass.
  Selected composition delivery remains one reply (19,763 / 20,131 bytes for the
  tested implicit/explicit scopes), without raising the delivery cap.
- Self-review covered the actual recovery invocation, request ownership, same-root
  normalization, material provenance/revision identities, existing independent parts
  and field repair, failure settlement and source-key preservation. The supported
  recovery scope stays flat, projected and independently keyed; unsupported geometry,
  shared bindings, relations or indivisible output retain explicit failure/repair.
- No live model/101, Knowledge changes, push, new goal, scheduler or artifact store.
  Tool recoverability is verified; AI adoption and live latency remain unmeasured.

### Repetition available with selected contents - 2026-10-23

Objective: remove the extra representation-selection prerequisite for translating
already selected world-space faces/grids. Raw run 1792683709943 queried only
projected-face/surface-grid (payload 10, SHA-256
2ca73b38f8690b36f1e4c4e2f12a5faa5c2e3a5b56e0f42a02beb80c631d7aa1).
The current projection excludes pattern and the executable combined example;
this is confirmed delivery behavior, not proof of the model's private reason.

Step execution card - compose:

- Authority: execution spec Component selection and bounded repetition and
  Optional repetition in selected contents; Inspector compose and existing
  compose.selected-operation-contract mapping.
- Inputs: canonical main-owner schema, existing scope and examples. Outputs:
  selected primitive contracts plus their optional canonical member-repetition
  wrapper, valid executable examples, complete outcome/recovery guidance.
- Owner declaration: add a neutral repetition descriptor inside the existing
  x-design-input-scope declaration, identifying the canonical node type and member
  field. Derive supported member types and all limits from that schema; no new
  capability registry, execution syntax, persistent state or inference engine.
- Conditions: draft/parts content scopes include only compatible selected member
  alternatives in the optional wrapper; an explicit pattern selection retains its
  full faces/members contract. Unrelated 2D scopes and repair remain independent.
  Invalid owner declarations fail closed. Original single nodes remain legal.
- Boundary: local-design-workflow.ts, design-workflow-discovery.ts and existing
  discovery-delivery.integration, local-ai-provider and execution-flow-proof tests;
  existing plan/spec/Inspector and generated workspace. Reuse existing examples
  and recorded formal fixtures. No construction, transaction, persistence,
  Knowledge, report-capture or live-model changes.
- Failure owner: compose for query/delivery; unchanged prepare/apply owners for
  mutation. Preserve canonical nested limits, material conflicts, painter order,
  budget rejection, cancellation, partial receipts, refresh and no-replay.
- DoD: one content query delivers an executable combined example, without asking
  for pattern; single-content scopes do not pull unselected member definitions.
  Execute the actual delivered example through dispatcher and App action, then
  reuse existing material/order equivalence and partial recovery cases. Preserve
  explicit pattern faces mode and independent siblings. Validate every admitted
  example against both projected and canonical schemas. Reject malformed members,
  nested patterns, conflicting fills and invalid axes before writes.
- Delivery gate: startup bytes <=30327, no executable draft preloaded. The selected
  face/grid closure fits one unchanged-budget response and is smaller than the
  pre-edit face/grid plus pattern acquisition sequence. Explicit mixed scope
  remains <=20148 bytes. Do not claim single-query primitive bytes decrease; adding
  useful optional repetition can increase that reply while removing a later query.
  Adding 10000 unrelated tools must change neither bytes nor calls.
- Gates: admission, naming, formal red before production, focused discovery/native
  provider/workflow/preparation suites, production types, lint, static Inspector
  and mapped proof; review only this diff and direct consumers.
- Stop: needed construction changes, incomplete canonical constraints, new state,
  raised limits or failure to fit one reply require bounded replan. No model/101.

Readiness review: the canonical pattern already exposes members, origin, axes and
instanceRanges and expands to ordinary editable siblings. Its member union owns
supported content types; a scoped projection can select its existing members mode
without recreating validation. Existing first-valid example filtering then exposes
the combined root-material example for the formerly non-pattern face/grid query.
Independent choices remain valid; this fixes availability, not guaranteed adoption.
The earlier composition task's unchanged-startup instruction is superseded only by
an equally bounded selection explanation; its executed-source evidence stays historical.

Admission: e5a4586abf6ce99df701ea62861b0ede89338369fd2b01eaaa3277062e20bd9c;
static Inspector/catalog 10 passed, naming baseline 15 passed. Formal red:
three failures for omitted repetition/combined example; explicit selection passed.
Pre-edit dispatcher replies: content 16297 bytes and explicit combined 20146 bytes.
These are complete same-test replies, not redacted provider diagnostics.

Bounded self-review: retained canonical member keys/material conflicts and all
wrapper restrictions; no construction owner changed. Reference closure removes
unreachable repetition from repair without a new operation-name branch. Initial
wording distinguishes explicit faces mode, and selected usage limits the loop hint
to faces/grids so vector-pattern placement stays independent. Replaced one stale
English substring assertion without weakening its behavioral cases. The first
startup-size test caught a 20-byte increase; shortened redundant selection wording
rather than changing its ceiling. Test lint assertions were corrected; no production
fallback, new state or increased limit was introduced.

Completed bounded verification: six relevant server suites total 613 passed and
one opt-in native probe skipped, with directly affected tests rerun after review;
final discovery suite 46 passed and final delivery/native subset 7 passed. No live
model or 101 was invoked. Production types passed; lint zero errors with two
pre-existing console warnings; naming 15 passed; static Inspector/catalog 10 passed.
Final Inspector attempt 87ae22f6-5b2b-429a-ba4f-5fc9b5632c78 contains 59/59 passed,
zero skipped; actual vitest artifact inspected. Captured source
8b02481e8b16fec65d897c3ee527ed7df5969f6195efb1a9e6000564e8918c5c matches the final
production files, proof test, spec and Inspector. Mapping revision 62 is unchanged.

Final measured complete replies: implicit content-plus-repetition 19768 bytes in
one reply, versus the pre-edit two-read acquisition total of 36443 bytes (45.8%
less); the primitive-only old reply was 16297 bytes, so that one reply grows by
3471 bytes when optional repetition is included. Explicit combined selection is
20136 bytes (ceiling 20148). Actual native startup is 30302 bytes versus 30327;
10000 unrelated tools do not change selected reply bytes or calls. Existing recorded
full-component equivalence, material/order and remaining-only recovery passed;
output budgets remain unchanged. These are deterministic delivery results, not
measured model adoption, first-frame latency or visual acceptance.

### Composition example handoff - 2026-10-22

Objective: deliver a usable composition of root material definitions, independent
siblings and translated mixed members through existing owner examples and valid
scope filtering. Run 1792680047092 received the mixed contract but submitted eight
explicit seven-node blocks. The current example omits root materials and independent
siblings; this is a handoff gap, not proof of the model's internal cause.

Step execution card - compose:

- Authority: execution spec, Composition examples within selected usage; Inspector
  compose and existing compose.selected-operation-contract proof mapping.
- Inputs: canonical owner examples and selected schema, existing query/dispatch,
  saved raw tool arguments and actual owner receipts.
- Outputs: the selected mixed-sibling example is schema-valid and executable;
  root materials, independent nodes and mixed pattern compose in painter order.
- Conditions/bypasses: use existing first-valid example filtering. Pattern-only,
  face-only and nonrepeating selections remain legal; never infer geometry or
  require a pattern. No new selector, tool, registry, state or preflight.
- Contributors/boundary: design-preparation-examples.ts; selected-only redundant
  explanatory prose in design-workflow-discovery.ts if needed to offset example
  size; discovery-delivery.integration, local-ai-provider, local-design-tools and
  execution-flow-proof tests. Initial provider guidance, owner selection and queryExample stay unchanged.
- Failure owner: compose for delivery; existing prepare/apply owners for execution
  and truthful outcomes. No construction, persistence, transaction or refresh edits.
- DoD: execute the returned example via real dispatcher and preparation/action
  owners; preserve complete constraints/results/recovery. Mixed selected response
  stays one reply and at most 20148 bytes (complete pre-edit dispatcher baseline); startup reading
  does not grow. No unrelated catalog growth. Preserve standalone choices, partial
  receipts, cancellation, refresh and remaining-only recovery without replay.
- Gates: contract admission and naming; new formal red before production changes;
  provider/discovery/pattern/workflow/operation suites, production types, focused
  lint, Inspector static checks and mapped proof. Review only changed files and
  direct consumers. No live model, 101 or report-capture changes.
- Stop: construction changes, missing owner constraints or a repeated failed
  implementation approach require a bounded replan. Do not raise delivery limits.

Validation segment card - prepare (after compose review):

- Authority: unchanged Translated mixed components contract and prepare step.
- Inputs: hash-verified saved full draft and explicitly compacted representation;
  outputs: equivalent ordered geometry/materials and unchanged budget decisions.
- Boundary: design-patterns.test.ts and recorded composition-materials fixture;
  integration consumes this fixture through existing dispatcher. No runtime edits.
- Verify independent prefix/suffix, all numeric/material values, generated unique
  keys, root parent/order, input-byte reduction, overflow before writes and legal
  partitions. Generated names/keys may differ, but original painter order cannot.
- DoD/gates: focused equivalence plus integration recovery; failures remain owned
  by prepare/apply. No visual quality or model adoption claim from these tests.

Readiness review: saved 18875-byte diagnostics redact usage instructions. The same
query through the unmodified dispatcher yields 20148 bytes, so compare complete
replies against that measured baseline rather than redacted evidence. Initial
provider text is measured separately. No delivery limit changes are authorized.
Contract admission digest: 90fd0ebbeb6053a1d33190b73a9ff1c00ce0623346bfec8d28ca7e4bbe892322.
Static architecture/catalog checks: 10 passed after the referenced fixture exists;
naming: 15 passed. Raw fixture input hash verified before extraction.

Bounded iteration after the first full gates: the selected composition now fits
one reply and executes, but an existing restriction test requires explicit
"oneOf exactly one" wording. Retain that wording rather than weakening its oracle.
The direct preparation test also hardcodes the vector example at array index 2;
select the actual vector-pattern example by its semantics instead. This changes
only the existing compose-allowlisted direct test, not preparation behavior.
Rechecked compose conditions, selected usage spec and both failing assertions;
no schema, owner, budget or recovery changes are needed. Add the direct
local-design-tools suite to the frozen gates. Self-review found no additional
contract gap; the default generic example and pattern-only fallback remain valid.

Self-review correction: keep the illustrative panel and grid on the same four
corners. A smaller triangular panel is executable but needlessly obscures the
composition relationship. Strengthen the actual returned-example oracle first;
recover those bytes from duplicate selected-guide prose, never from constraints,
limits or incomplete geometry. Initial guidance and owner execution stay unchanged.

Status: bounded composition-example handoff complete; Task 3 remains active.

Validation and self-review:

- Existing delivery test did not detect the missing combination. The new formal
  test failed on missing linearFields before production edits (composition-example-red.log).
  A second review regression caught the mismatched panel/grid boundary before its
  correction (composition-example-review-red.log). Both now pass without weakening
  limits or constraint assertions.
- Actual native startup base instructions remain 30327 bytes with identical SHA-256
  449ed337fe09167e94f9ce5f872d9aa858c77cc3c7245ceca6619897407ea07c.
  Selected mixed delivery: 20148 -> 20146 bytes, one reply; adding 10000 unrelated
  tools leaves that reply unchanged. This measures model-facing startup prose and
  selected delivery, not unchanged deferred registration payload size.
- The selected example resolves root fillTemplates and world linearFields, one
  independent face and two mixed face/grid instances through actual dispatcher,
  preparation and App action owners. It produces 16 entries with correct parent
  relationships. Tests use the existing storage adapter, not a browser/render pass.
  Pattern-only examples, independent selections and face-only patterns remain valid.
- Hash-verified saved draft: 29540 -> 12160 submitted draft bytes (58.8% reduction).
  Its 13117 expanded objects still reject before writes. Explicit 7034/6084-object
  partitions preserve every ordered numeric/material value, independent prefix/
  suffix and unique generated keys. Generated names/keys intentionally differ.
- Integration retains successful first-part writes across failed second preparation,
  cancellation, refreshed documentation and explicit remaining-range execution.
  Successful part receipts remain distinct from aggregate partial/completed when
  the optional mechanical follow-up is unavailable; no success inference or replay.
- Six server suites passed 609 tests; one optional native probe skipped. After the
  final review edit, affected discovery/preparation suites passed 81 tests and the
  actual startup delivery test passed again. Production types passed; focused lint
  has zero errors and two pre-existing console warnings. Naming: 15 passed;
  static architecture/catalog: 10 passed. No live model or 101 was run.
- Final contract admission: bfb75e606c84d6c94dfd5603723f5d7cbaab06e26a78ab64956aed19bf7a48f4.
  Inspector attempt c0ea2ac6-61c7-46d1-b9cf-fef6a021c22f passed all 59 mapped cases,
  zero skipped/failed. Captured source
  0c50d07b4f389eea198af62c69a0560076654d1ef56438b2c75f5b3af8a09434;
  both production files and the proof test match that saved source byte-for-byte.
- Bounded review covered the changed example/selected prose, actual provider
  delivery, first-valid filtering, direct preparation tests, dispatcher and failure
  consumers. Removed redundant selected prose; retained all schema restrictions,
  owner results/recovery and legitimate examples. No construction, owner selection,
  refresh, transaction, persistence or report-capture behavior changed. Model
  adoption, first-frame latency and visual quality remain unmeasured this round.

### Component selection through bounded execution - 2026-10-22

Objective: distinguish component contents from outer repetition before the first
query, then connect the existing query example to an executable mixed-component
example and explicit expanded-budget recovery. Saved run 1792673491884 has eight
nine-face blocks and eight two-grid blocks translated by Z 3900. The repeated grid
alone expands to 12800 nodes: compression is not capacity. These are evidence of
applicable capability and constraints, not proof of the model's internal decision.

Step execution card - compose:

- Authority: execution spec, Component selection and bounded repetition;
  Inspector compose and existing compose.selected-operation-contract mapping.
- Inputs: existing owner selection/queryExample, canonical examples, selected
  schemas, saved exact face/grid inputs and actual execution receipts.
- Outputs: two-level selection advice and executable same-read query, complete
  selected usage/example, budget-aware remaining-work recovery with stable order.
- Conditions/bypasses: explicit representation choice; patterns are optional.
  Independent geometry, differing shapes, existing face-only mode and direct
  execution stay valid. No inferred geometry or automatic partition.
- Contributors: local-design-workflow owner prose/queryExample, existing discovery
  projection and provider delivery, design-preparation-examples if needed; direct
  provider/discovery/pattern tests and existing mapped execution proof.
- Implementation boundary: those existing compose allowlisted files only, plus
  a project-owned recorded fixture for formal tests. Construction, apply,
  transactions, persistence and Knowledge remain unchanged.
- Failure owner: compose for advice/contract delivery; existing prepare/apply
  owners remain responsible for budget rejection and actual write receipts.
- Forbidden: new state, registry, selectors, preflight calls, eager schemas,
  increased limits, forced patterns, altered painter order or report-capture work.
- DoD: actual native first request includes owner conditions and usable query;
  execute that query and its returned example through normal dispatch. Preserve
  one reply and catalog-growth independence. Exact saved geometry/material/order
  matches compact representations; source bytes fall. Repeated grids still reject
  overflow before writes; ordered parts preserve completed work across failure,
  refresh, cancellation and explicit recovery. Nonrepeating exceptions stay explicit.
- Gates: contract admission, formal delivery red before production edit, provider,
  discovery, construction and workflow tests; production types, naming, focused
  lint, Inspector static and mapped proof. Bounded review covers direct consumers.
- Stop: any required construction or execution semantic change requires revisiting
  the contract. No live model/101 or claim that deterministic proof ensures adoption.

Readiness review and validation segment - prepare:

- Existing translated-component contract remains unchanged. Inputs are the exact
  recorded drafts and explicitly authored compact counterparts; outputs are full
  ordered constructed geometry and unchanged budget rejection.
- Boundary: design-patterns.test.ts and recorded component-selection fixture only;
  no construction, mutation, state, cache or persistence edits. Failure owner stays
  prepare. Compare all numeric/material fields, preserve independent exceptions,
  and test 12801-node overflow plus two exact 6401-node ranges.
- Compose integration consumes those representations through real prepare and App
  action owners, with the existing test storage adapter. It preserves acknowledged
  writes when optional mechanical follow-up is unavailable (partial/completed),
  cancellation occurs, or remaining ranges are explicitly retried.

Bounded iteration: initial expanded usage prose exceeded the existing one-reply
budget in two formal cases. Replaced redundant prose rather than raising limits
or relaxing tests. Existing complete schema constraints/results/recovery stay intact.
The first-query example is illustrative pattern selection, not an automatic selector;
independent choices remain available. Review confirms no new execution semantics.

Status: bounded component-selection handoff complete; Task 3 remains active.

Validation and self-review:

- Two formal delivery cases failed before the owner edit (component-selection-red.log).
  Actual thread/start and actual initial-query execution now reach the canonical
  mixed example. Existing independent choices and exact recovery remain covered.
- Recorded fixture derives exact drafts from verified raw input hashes, omitting
  only the brief. Tests do not depend on ignored tmp evidence. Explicit exceptions
  remain intact; comparisons exclude generated keys/names while verifying all
  numeric geometry, materials and ordered output, plus unique keys and root order.
- Massing source 19156 -> 5915 bytes; repeated grid source 16636 -> 2421 bytes.
  These are representation measurements, not model latency or adoption evidence.
- The 12801-node grid artifact rejects without writing. Two 6401-node ranges
  preserve the completed massing and first range across cancellation, refresh
  and remaining-only execution. Missing mechanical follow-up remains truthful
  partial/completed with successful child receipts; never promoted to success.
- Five focused server suites: 567 passed, one optional native probe skipped.
  Final discovery rerun: 40/40. Production types passed, naming 15/15, static
  Inspector 10/10. Focused lint: zero errors, two existing console warnings.
- Inspector e8f92b4e-c138-4578-a03d-55a5f9c13af6 passed all 59 cases on source
  fc8e61b7269871f4e76c5d9fcf79ad0724f3194fd453e10dc470a60257d9bedb.
  Admission digest a0fe1974cc6a2145ae31af06f70fff5a41e37f03096d809d124ffda11ea7df59.
- Review: production change is owner selection/queryExample and concise usage;
  existing example inventory, schema projection, dispatcher, construction and
  mutation semantics are reused. One selected guide remains one reply; 10000
  unrelated tools do not change delivery. No limits or recovery protections relaxed.
- No Knowledge, report-capture, model, 101, Undo/Redo, collaboration or persistence
  changes. App storage is adapted in integration tests; no claim of a new end-to-end
  persistence/visual acceptance. Model adoption remains untested this round.

### Initial owner selection delivery - 2026-10-22

Objective: preserve the existing owner selection conditions in the first actual
provider request, before operation scope is selected. Current query guidance drops
selection while retaining enum choices. Deferred registration alone does not prove
the model received these conditions before its first query.

Step execution card - compose:

- Authority: execution spec, Next-part operation selection; Inspector compose.
- Inputs: canonical workflow input scopes and existing owner selection text.
- Outputs: the same selection text in initial Main tool scope; selected queries
  retain their complete constraints, executable examples and recovery.
- Conditions/bypasses: owner opt-in only; known scopes remain directly usable;
  independent faces/grids, face-only patterns and mixed members remain legal.
- Contributors/boundary: existing design-workflow-discovery projection, native
  provider consumer and local-operation-tools error projection; provider, discovery and mapped execution-proof tests.
- Forbidden: new selector, registry, state, mandatory read, eager schemas, changed
  limits, inferred geometry, mutation changes, Knowledge changes or live models.
- Failure owner: compose. Missing selection is a delivery regression; do not infer
  model adoption or generation latency from deterministic delivery tests.
- Cases/DoD: actual thread/start contains exact canonical selection once; mixed
  repeat versus independent geometry and root/optional choices remain explicit;
  direct selected published examples execute; unrelated catalog growth adds no
  first-query bytes or calls. Preserve budget rejection, partial success, refresh
  and no-replay recovery with existing formal integration cases. Existing recorded
  mixed-component equivalence cases cover geometry; no new construction owner work.
- Gates: contract admission; failing actual-provider and mapped proof assertions
  before production edit; focused provider/discovery/pattern/workflow suites,
  production types, naming, focused lint and Inspector static/mapped gates.
- Stop: unexpected execution-owner changes require revisiting this bounded scope.

Direct-consumer review: forwarding full selection into bounded error text truncates
its recovery JSON (five existing integration cases fail). Preserve the original
error projection of legal enums and executable example; complete selection belongs
to startup and ordinary discovery. No error limit change or recovery extra read.

Status: this bounded delivery slice is complete; Task 3 remains active.

Validation and self-review:

- Actual native-request regression failed with missing selection before the fix
  (tmp/initial-selection-red.log). Initial test setup was corrected to read the
  canonical owner, since native declaration normalization strips owner metadata.
- Existing recovery tests detected truncated correction JSON after the initial
  change. Explicit bounded error projection preserves the previous executable
  recovery; no limit was increased. The mapped proof now separately asserts
  complete startup guidance and bounded error choices.
- Final five focused suites: 565 passed, one optional native probe skipped
  (tmp/initial-selection-final-tests.log). Covers actual provider delivery,
  published mixed-component dispatch, recorded geometry equivalence, budget
  rejection, partial receipts and recovery without completed-write replay.
- Production types passed; naming 15/15, Inspector static 10/10. Focused ESLint
  has zero errors and two existing console warnings outside this slice.
- Inspector candidate e02f44af-f301-4a8b-b393-b60128b267a4 passed on source
  919bd01914a58dfdd55f13605d45c2b1ae741b9c82d619f75ef625fa6a6620aa.
  Admission digest: 9eb06bca42125a64a86e4c19b9baa07eff25835034793cd01a150bb4eea00f38.
- First guidance adds only the canonical 1650-byte text (1665 JSON bytes), once.
  Ten thousand unrelated tools leave guidance and direct-query delivery equal;
  the published query still takes one reply. No eager child schemas or new calls.
- Reviewed direct consumers: provider startup, scope-error projection, selected
  discovery, dispatch and existing no-replay cases. Execution, storage, transaction,
  material and Knowledge owners are unchanged. No model or 101 run; no claim of
  adoption, latency improvement or a complete explanation of prior AI behavior.

### Translated mixed components - 2026-10-22

Objective: express a translated ordered face/grid component once through existing
pattern construction, without extra discovery or a new mutation path. Run
1792666831862 submitted 30 source nodes: its second 15 repeat the first with
world Z +3900. Twelve grid motif declarations were identical. This proves a
representation gap, not the cause or duration of unobservable provider work.

Reviewed bounded contract: pattern retains its valid faces mode and adds mutually
exclusive members (ordered projected-face/surface-grid only). No recursive pattern,
container, scale, rotation, automatic grouping or geometry inference. Shared root
projection, origin, axes and instanceRanges retain their owners. Members do not use
pattern-level fills; each member retains native fills or face materialField. Keys
are pattern-instance-member (grid includes cell/motif suffix), order is instance,
member, then existing grid order; no new canonical hierarchy. Existing faces is a
valid distinct operation, not a compatibility path. Expanded budgets multiply the
whole component and include the root; source traversal counts templates once.

Step execution card - prepare (first):

- Inputs: explicit mixed members, existing world projection/axes/ranges/materials.
- Outputs: ordinary editable vectors, deterministic keys, material membership,
  unchanged artifact lifecycle and no-write failures. Existing construction owns
  one compiled member template per invocation and translates that output, not source
  re-expansion per instance. No cross-request cache.
- Conditions: absolute root with shared projection; flat face/grid members only;
  reject ambiguous forms, unsupported transforms, key collisions, overflow and
  budget excess. Existing faces and independent grid remain legal.
- Boundary/contributors: design-construction.ts/schema, design-budget.ts, direct
  design-patterns tests and retained fixture. Failure owner: prepare; no renderer,
  fallback geometry, new scheduler or persistence state.
- Cases: full recorded geometry/fill/order/parent equivalence, mixed ordering,
  axes/ranges, face world materials and grid offsets/palettes, exact budget/excess,
  source/projection work counts, cancellation and immutable source.
- Gates: updated contract admission, red formal tests before implementation,
  focused preparation tests, naming, production types/lint, mapped proof.

Step execution card - compose (after prepare passes):

- Inputs: canonical pattern member contract and owner examples.
- Outputs: same-read next-part selection and executable complete mixed example
  through existing main tool, with no preflight or additional state.
- Boundary: design-preparation-examples.ts, local-design-workflow.ts, existing
  discovery projection if needed for selected closure, direct discovery/provider/
  workflow/proof tests. Failure owner: compose. No inference, automatic splitting,
  new tools, knowledge edits or expanded pagination budget.
- DoD: actual delivered example -> dispatcher -> preparation -> apply, equivalent
  recorded input with materially fewer bytes, preserved full/scoped contracts,
  existing page/byte gates, partial success/cancel/recovery without replay.
- Naming: members is an App pattern input, not a persisted canonical property;
  generated IDs still belong to preparation. No migration or compatibility path.
- Stop: complete these deterministic gates and bounded self-review only; no model,
  101, push, automation or unrelated dirty-work changes. Shared owner files remain
  in the declared preparation/composition segments; do not broaden discovery.

Feasibility: existing pattern already compiles faces once and translates ordinary
vectors. Existing expandGrid produces the same output shape; reuse its compiled
output inside the same template loop, preserving materialField offset evaluation.
Budget inspection must understand members before this reaches compilation. Schema
and discovery must expose complete member constraints in the selected read; the
existing tests retain their page limits. No global recipe capability is needed.

Compose iteration review: adding the member closure exceeded existing single-reply
gates. Keep those gates and all schema constraints; compact repeated schema prose
inside the same construction/discovery owners. Do not omit member contracts or
raise delivery limits. The partial-recovery case must use schema-valid budget
excess: invalid rows correctly reject the entire invocation before any writes.
Recheck selected-guide bytes, actual example dispatch and existing consumers before
advancing; no additional scope or protocol is authorized.

Completed deterministic slice:

- Existing pattern/construction now compiles ordered face/grid templates once and
  translates their outputs. Native vector parents, keys, materials and painter order
  remain owned by preparation. No new tool, mutation owner or persisted state.
- Recorded source draft: 11951 bytes; equivalent mixed draft: 6870 bytes (42.52%
  smaller), both producing 1778 child vectors plus root. Tests compare every geometry
  and material field, ordered correspondence, parent identities and source reuse.
- Existing selected usage includes a directly executable mixed example and complete
  member constraints. Compact parameter notation retains canonical restrictions and
  explanatory notes; existing single-guide/two-total-reply and unrelated-catalog
  growth gates pass without larger budgets or another required query.
- Red regressions established unsupported mixed input and missing multiplied budgets
  before implementation. Review added red cases for grid-template double charging
  and rejecting pre-translation projected extent; both corrected in the same owner.
  Template compilation reuses the existing bounded work helper separately from final
  artifact accounting. Final extents still reject after translation.
- Formal coverage includes two-axis ranges, both grid orders, palette phase/offsets,
  world-material phase, collisions, unsupported nested members/transforms, exact
  10000-object capacity, excess, cancellation, immutable input, actual published
  example dispatch, partial parts and refresh/recovery without replay.
- Verification: 633 server tests passed, one optional native probe skipped; 13
  prepared-consumer/transaction tests passed in the repository's jsdom environment;
  59 Inspector proof cases passed; 10 Inspector/catalog tests and 15 naming tests
  passed. Production App/server/proof types passed. Scoped lint: zero errors, one
  pre-existing console warning in execution-flow-proof.test.ts.
- Initial admission: b69fefef3a565849e4f667919ba8e2da1f50fcb0bfdd700b2629e9881e5f73d1.
  Final contract: d4c602ad1bc05b722fc5c02ab30f1473a10c98785d7c26cfbb848d3e6fb0a05d.
  Final proof: 77de2bac-707f-498f-90dd-8a44ef20dd42; captured source
  c32d549bfe2356f060437e04a35629f76633dc2facdc32be9dd53bf46d78e62d.
- Self-review covered the bounded diff, schema/usage consumers, budget and async
  construction boundaries, retained target lifecycle and existing application path.
  This closes this component slice only. No live model or 101 was run; adoption and
  first-frame latency remain unmeasured. Translation is deliberately limited to flat
  face/grid members; unrelated transforms/hierarchies are not added.

### Expansion budget and operation selection - 2026-10-22

Objective: deliver aggregate expansion accounting and draft/parts selection in
existing startup/discovery replies, before submission, without extra preflight.
Evidence: run 1792664385631 rejected 10078 objects (10008 grid instances,
69 independent faces and one root), before compilation or canvas dispatch.
The delivered guide stated 10000 but omitted explicit grid accounting and root
counting; internal work windows do not partition an oversized artifact.

Step execution card - compose:

- Authority: execution spec, Expansion budget selection; Inspector compose.
- Inputs: canonical preparation limits and node schemas, selected operation,
  existing discovery/provider routes and retained rejection receipts.
- Outputs: same-read selection conditions, exact expansion rules and executable
  existing parts example; rejection directs safe correction without replay.
- Conditions/bypasses: direct known calls remain legal; no required preflight,
  Knowledge read, new tool or automatic geometry partition. Full reads remain.
- Contributors: existing workflow/discovery, preparation budget/schema owners and
  formal provider/dispatcher/parts tests. Failure owner: compose for delivery;
  preparation retains deterministic budget rejection ownership.
- Boundary: local-design-workflow.ts, design-budget.ts, design-construction-schema.ts,
  direct discovery/provider/workflow/proof tests and recorded fixture; current plan,
  necessary spec, Inspector, mapping and generated catalog only.
- Names: reuse canonical limits and operation identities; no persisted identities,
  registry, scheduler, state or compatibility branch.
- Cases/DoD: actual delivered selection and guide, recorded 10078 rejection with no
  compilation/write, exact 10000 boundary, delivered parts example through real
  dispatcher/preparation/application, later failure/cancellation and no replay.
  Unrelated catalog growth must not change selected delivery; no mandatory exchange.
- Gates: contract admission before tests/production, failing formal delivery tests,
  focused integration/regression, mapped Inspector proof, static catalog, naming,
  scoped lint and production types; bounded review of changed owners/consumers.
- Exclusions: model/101, Knowledge, pagination budgets, geometry algorithms,
  automatic splitting, limit increases, history/persistence changes, push.
- Stop: close only this deterministic contract once gates pass; model adoption and
  time savings require separately authorized observation. Preserve prior dirty work.

Feasibility review: workflow query guidance already consumes owner operation prose;
selected usage derives the canonical schema. Put limits/formulas at those owners,
not a second counter. Existing ordered parts admits backward parent links and stops
on failure, retaining earlier receipts. Keep independent artifacts explicit rather
than infer safe split boundaries. Test actual returned examples, not parallel prose.

Bounded iteration: the formal parts-example test exposed an existing prose-only
orderedInputExample, unavailable to selected discovery. Move that same value into
canonical examples and remove its duplicate prose; do not author a parallel example.
The first wording attempt increased selected guide pages. Preserve the existing
byte/page oracles, shorten redundant explanations and keep exact budget semantics.
No mutation owner, geometry or pagination budget change is permitted. Re-admit this
same compose boundary before correcting delivery and rerun the same failing cases.

Bounded closeout:

- Initial admission: 9dcece78e91db210790a0064decb06535a4885d0c8a2db2f801de8e38359bf8a.
  Formal red tests proved missing startup capacity, missing parts recovery guidance,
  and unavailable canonical parts example. The original recorded draft is retained
  in a permanent fixture; tests do not depend on ignored evaluation evidence.
- Canonical limits now feed same-read selection and aggregate-count guidance;
  surface-grid usage states rows * columns * motifs.length plus other/container
  nodes. Internal work windows and template compression cannot raise capacity.
  Existing orderedInputExample moved from prose to schema.examples; no duplicate
  example, new tool, state, counter, automatic split or raised limit was added.
- Existing reply-count and size gates remain unchanged: representative menu +
  selected guide takes two replies, including with 10000 unrelated tools. Grid
  selection totals 24093 bytes; projected-face/pattern selection totals 26152.
  These are deterministic delivery measurements, not model timing observations.
- Recorded 10078 rejects before compilation/writes with retained source. Exact
  10000 prepares successfully. The actual delivered parts example executes through
  dispatcher/preparation/application. A later oversized part preserves earlier
  receipts; submitting only the remaining part preserves the previous descriptors
  and attaches to the acknowledged parent. Existing cancellation tests pass.
- Five focused suites: 396 passing cases and one existing optional native probe
  skipped, combining the preserved passing suites with the final owner/discovery
  rerun (101 passed). The prior prose-extraction test now executes schema.examples.
  Logs: tmp/budget-selection-regression.log and budget-selection-owner-final.log.
- Inspector attempt 9362e56e-65f6-4582-9a5f-f7842fddb43a passed the mapped baseline
  on source c15ce7b826274b4466f01b09d5355b26fbfa7daf0ad8dca446a44708e5141e0a.
  An earlier attempt could not import the test-only JSON fixture from its isolated
  source. That failure is retained; the mapped proof now constructs a generic
  10001 expansion boundary, while integration retains the exact recorded input.
  No snapshot mechanism or evidence policy changed.
- Production App/server/proof types passed; static Inspector/catalog 10 passed;
  naming 15 passed; scoped lint zero errors and two existing console warnings.
- Self-review covered the owner wording, canonical examples, real provider packet,
  selected/full discovery consumers, preserved recovery and unchanged execution.
  No model, 101, visual claim, Knowledge change, push or automation. AI adoption
  and avoided live roundtrips remain unmeasured. This closes only this handoff.

### First-query scope choices - 2026-10-22

Objective: deliver owner-defined query scope choices before the first scoped
lookup, and make invalid scope recovery actionable without another menu lookup.
Evidence: run 1792662315890, provider call exec-5e711e43-d542-4cd7-aec2-f71fa2fa706b
submitted operation=create. The query schema accepted a string while projection
rejected it; the failure omitted supported choices. The subsequent menu supplied
draft/repair/parts. Native deferred registration does not prove model visibility.

Step execution card - compose:

- Authority: ai-execution-flow.md, First-query scope choices; Inspector compose,
  existing registered definitions -> provider instructions/query -> tool contract.
- Inputs: the selected main tool's canonical scope declaration and owner-authored
  query example, caller scope, existing invocation/result and cancellation paths.
- Outputs: compact startup choices and executable lookup example; rejected lookup
  explains invalid fields and the same owner choices without guessing a replacement.
- Conditions: only the already-guided main capability enters startup text; other
  tools remain on demand. Missing owner declarations are not invented. Direct known
  calls, full discovery, refresh and independent operations remain legal.
- Allowed contributors: App provider, canonical workflow schema, existing discovery
  projector and query failure channel. Failure owner: compose. No new registry,
  cache, state, alias, scheduler, Knowledge prerequisite or automatic mutation retry.
- Boundary: ai-domain-prompt.ts, local-ai-provider.ts, local-design-workflow.ts,
  design-workflow-discovery.ts, local-operation-tools.ts and direct formal tests;
  this plan, necessary spec/Inspector and existing proof mapping/generated catalog.
- Naming: reuse inputScopes, operation/nodeTypes/optionalInputs and existing error
  status. Any helper is internal App discovery data, not a persisted identity.
- Product cases: recorded invalid create, invalid node/optional choices, valid
  draft/repair/parts, actual delivered example -> dispatcher -> owner, refresh,
  partial receipts/no replay, cancellation and 10,000 unrelated registrations.
- Gates: naming baseline, contract admission before tests/implementation, red formal
  regressions, provider/discovery/owner integration, mapped Inspector proof, scoped
  lint, production types and bounded self-review.
- Stop: close when these deterministic gates pass. Do not investigate hidden model
  reasoning, change Knowledge/pagination/geometry, run inference/101 or claim a
  measured first-frame latency improvement. Preserve all unrelated dirty changes.

Feasibility review: workflowInputScopes already derives choices from the canonical
schema. Reuse that derivation for a small provider instruction and rejection text;
keep the existing failed/not-started channel. Validate an owner-authored lookup
example against those choices rather than infer user intent. Scope errors must name
the offending field, not silently map create to draft. The actual provider packet
and delivered example are test inputs, not a separate test-only instruction.

Bounded closeout:

- Structural admission before tests/production: 8ef2cda31ffeefd6e2685188ecd64f74e8084fbe720c74cb3ea447bcee78a5d0.
  Final contract admission: 1377e63dfcfc09cfa4d0221941f9e68d6e646e05e5a0b6356fab127243369842.
- Red regressions proved missing startup choices and missing actionable rejection
  content. Startup and rejection consume the same canonical choices; the owner
  publishes one validated query example. No create alias, guessed replacement,
  extra menu requirement, registry or mutation path was added.
- Error delivery retains its existing 1,000-character bound. Recovery includes only
  choices and the query example, not redundant operation prose. Structural schema
  failures still identify their exact invalid field/index. Owners without scope
  declarations explicitly direct callers to their independent full contract.
- Five focused suites passed 521 tests, with one existing optional native probe
  skipped. The final recovery-preservation case additionally passed in the complete
  discovery suite. Last owner correction reran both discovery and operation suites
  (224 passes before that additional case). Provider tests execute the actual
  startup example through discovery; owner integration applies the returned example,
  preserves partial/completed receipts and performs informational refresh without
  repeating the write. The saved invalid query is a permanent project fixture.
- One selected example uses one reply; adding 10,000 unrelated registrations leaves
  guidance and reply sizes unchanged. Owner option changes update both entry and
  rejection; invalid owner examples fail validation. Existing full constraints,
  legal branches, pagination, cancellation and partial-recovery tests pass.
- Inspector's 59 mapped cases passed on production source at attempt
  30ca429a-3d37-4ded-b005-13bbf2cccfb3 (source
  4522c3862ba31621e86394c1e5d512ec11090cb408ea3be9a300bd83b3a8eb03).
  Final closure rerun is retained in tmp/scope-choices-inspector-closure.log.
  Static Inspector/catalog: 10 passed; naming: 15 passed. Production App/server/proof
  types passed. Scoped lint: zero errors, four existing console warnings.
- Self-review covered actual provider packets, query/execution field separation,
  unchanged valid selections, rejected scope recovery, direct consumers and retained
  completed writes. No drawing, history, persistence or Knowledge owner changed.
  No live model, 101, push or automation occurred. Model adoption and first-frame
  latency improvement remain unmeasured; this bounded issue is closed independently
  of the unobserved pre-first-frame parameter-generation interval.

### Bounded work followed by reporting - 2026-10-22

Objective: an explicitly configured local evaluation stops new drawing at its work
cutoff, obtains a bounded public self-report, captures its text and screenshot
without video, and keeps missing reports and capture failures explicit. The work budget is 120 seconds
for the requested observation; the independent report budget is 60 seconds. Neither
this plan nor deterministic tests authorize inference.

Pre-change evidence: the runner sent its process-killing watchdog the work deadline
and rejected absent/partial outcomes before recording export. Provider cancellation
killed both native computation and tools, preventing a post-cutoff report. Native public protocol exposes turn/interrupt and subsequent
turn/start on the same thread; this is feasibility evidence, not a live-model proof.

Step execution cards:

- apply: existing browser transaction owner receives an optional local evaluation
  deadline. Check at the synchronous mutation entry after waiting for an idle boundary;
  retain committed history members and ordinary cancellation/settlement. No rollback
  of completed work and no deadline extension. Prove queued and delayed mutations,
  partial settlement, Undo/Redo and ordinary operation in transaction tests.
- compose: existing native provider receives the same explicit evaluation window.
  Cancel tool work and interrupt the work turn at cutoff, then request a public
  report in the same thread. No App operations in the report phase; no completion
  validation or final mutation replay. Preserve request cancellation, transport failure,
  model/effort and normal requests. Prove actual scripted protocol exchanges, late
  calls, independent report timeout and failure handling without inference.
- observe: existing runner supplies the window before Send and retains work/report
  timestamps separately. Save report text and screenshot; video recording is disabled
  by the user. Failures retain explicit evidence and bounded cleanup. Reuse the external
  watchdog as an outer fail-safe, not the work transition. Self-report is attributed
  model-authored explanation, not verified latency attribution or private reasoning.

Allowed files: current plan/spec/Inspector/mapping; App evaluation-window boundary,
transaction/startup/server provider adapters and their direct tests; existing evaluation
runner, lifecycle helpers and tests. No Runtime-wide scheduler or second result store.
Admission requires exact apply/compose/observe contracts. DoD: formal red regressions,
scripted provider and owner integration, report capture/failure tests, mapped Inspector
proof, affected production types, scoped lint, naming and bounded diff review. Missing
native acknowledgements or capture evidence must remain failures. Stop implementation
if an owner cannot preserve its cancellation and mutation-settlement contract.

Bounded closeout:

- Admission preceded production changes (initial digest
  a2e2aa06344a415d806025b0241c871ef2a543879119d4e615e5c59a86351951).
  The user's later no-video instruction replaced video startup/export with report
  text, verified message screenshots and explicit work-context closure before reload.
- Formal red tests reproduced late/queued mutation admission and absence of the
  second native report turn. Further tests exposed initialization outside the report
  timeout and profiler fields omitted by its existing allowlist. Corrections use the
  existing cancellation, trace fields and payload sink; no new diagnostic registry.
- Server/transport tests: 240 passed, one existing optional native probe skipped.
  Browser/runtime/transaction tests: 91 passed. Report capture/protocol tests: 16
  passed. Applicable production App/server/proof types passed. Scoped lint has zero
  errors and five existing console warnings. Naming: 15 passed; static Inspector and
  generated catalog contracts: 10 passed. Existing browser/watchdog fixtures also
  passed; those fixtures use no model and do not authorize a live observation.
- The 59 mapped Inspector cases passed on captured production source
  41b3778fe314799f075a292bbfecc349ab48a26e16936c3f577c6c62424e0adc,
  attempt dbc4cebc-e097-4445-8f98-55a458b98b3b. Final admission digest:
  ae9e144980c36849206c480f1498d6b91528f7716ddb9e40a714f3829bb067fb.
  Only closeout metadata was updated after that captured verification.
- Self-review covered direct transport consumers, native interruption/turn identity,
  late calls, early completion, malformed reports, cancellation, missing interruption,
  report timeout, payload storage failure, expired windows, queued writes, partial
  history and Undo/Redo. Screenshot failure preserves text; late screenshot completion
  cannot upgrade failed evidence. Ordinary requests have no evaluation deadline.
- Limits: native protocol tests use a scripted peer, not real inference. Actual model
  willingness, report usefulness, first-frame latency and live screenshot appearance
  remain untested. A synchronous mutation already entered may finish settlement;
  the deadline rejects new mutation entries. Unresponsive cleanup is bounded by the
  independent external watchdog. Self-report is never verified causal attribution.
  No Knowledge changes, live 101, model call, push, goal or automation occurred.

### Exact-name query delivery - 2026-10-22

Status: complete within the bounded contract. Admission
d151a63dea4c659db865e7b128bea94e0d29e8b000a7876abf56d3d5abdf38e6
preceded formal red regressions and production edits. Red tests reproduced broad
exact-query results, semantic-alias expansion and missing query ambiguity handling.
The selected-test red run also exposed the existing suite-wide exercised-tool guard;
final validation ran the complete owning suites rather than weakening that guard.

Validation: 528 regression tests passed; one existing optional native probe skipped.
All 58 mapped Inspector cases passed at attempt
7275b80f-3aad-4ea0-a0fd-56cc2e383b79, captured source
ef8f737f5a02839213adde907c1f4370219282f07e0da46a7258f36d2e764a8c.
Production App/server/proof types, 15 naming cases, 10 static Inspector/catalog cases
and diff checks passed. Scoped lint: zero errors, one existing console warning.
Logs: tmp/exact-query-red.log, tmp/exact-query-regression.log,
tmp/exact-query-inspector-final.log, tmp/exact-query-types-final.log,
tmp/exact-query-lint.log and tmp/exact-query-static.log.

Same integration fixture query: 16082 -> 3803 bytes. Query plus world-face guide:
35511 -> 23232 bytes; grid: 36446 -> 24167; face/pattern: 38679 -> 26400.
Each query is one reply and each query/guide pair remains two replies. Adding 10000
related descriptions leaves exact delivery unchanged; lexical/category pagination
still exposes the additional capabilities. The live five-result/two-page receipt is
historical context, not a new model measurement or an identical fixture comparison.

Bounded self-review verified the shared names branch, default-menu behavior,
qualified/ambiguous identities, semantic aliases, independent action/native schemas,
full contracts, offset/revision rejection, cancellation and refresh without replay.
The published example still reaches preparation/application and preserves partial
follow-up settlement. The mapped proof now includes a description-only distractor. Final typecheck caught
missing native metadata in that added fixture; it now derives the complete registered
definition, and production types plus the Inspector were rerun successfully.
No canonical schema, execution owner, budget, Knowledge or timing/report workflow
changed; existing unrelated work and historical evidence were preserved.

Evidence: run 1792655965388 queried prepare_and_apply_design with view=usage.
Lexical token matching expanded an exact identity to five tools; their combined
23170-byte body required two replies totaling 25421 bytes. The batch tool alone
contributed 4605 bytes of output field paths. This is an App selector/delivery
issue, not evidence of a wrong model decision.

Step Execution Card - compose:

- Spec: Capability discovery and composition; Inspector compose, request-to-compose
  and compose-to-prepare. Owner/failure owner: existing App discovery.
- Inputs: admitted action/semantic-name indexes, native namespace/name index, one
  existing query selector, view, revision and continuation controls.
- Output: an exact registered identity uses existing exact delivery and ambiguity
  semantics. Trim surrounding whitespace, otherwise preserve exact case/spelling.
  Do not broaden exact hits through descriptive references or choose one namespace.
  Preserve action/native independent routes and semantic aliases already supported
  by names. query without view remains a menu; usage/full keep their representations.
- No exact hit: unchanged lexical capability search and category exploration.
  Known calls bypass discovery. Exact query has no inventory continuation; reject
  nonzero inventory offset rather than silently broadening. Content paging remains.
- Allowed contributors/files: existing local-operation-tools indexes and definition
  delivery; discovery-delivery integration, local-operation-tools and mapped
  execution-flow-proof tests; existing active plan/spec/Inspector and generated view.
- Forbidden: new registry/search service/state/cache, forced selection, limit changes,
  provider edits, Knowledge edits, work/report timers, model calls or historic edits.
- Naming/lifetime: request-local names/query selection only; no wire identity change.
- DoD: saved query returns only the main workflow in one usage reply; 10000 related
  descriptions do not grow its bytes/calls. General search and category pagination
  still discover those tools. Cover qualified names, ambiguity, dual routes, default
  menus/full constraints, invalid offset/revision, repeated/refresh/cancelled reads,
  and published invocation with partial/no-replay recovery. Actual root/child/plan
  restrictions remain unchanged.
- Gates: task context, naming, structural admission, failing formal regression,
  direct discovery/workflow/provider/information tests, mapped Inspector candidate,
  production types, scoped lint/static contracts and bounded self-review.
- Stop if existing exact delivery cannot preserve these behaviors; revise the
  bounded contract before expanding owner changes. No next issue is authorized.

### Root-container and optional-input selection - 2026-10-22

Status: complete within this bounded deterministic contract. Structural admission
5ccfded07d9364b7d4e8aef9e80a96ffff8132fbdb35e489ec7bc21a4aa9b506 preceded
formal failing delivery tests and production edits. Three delivery assertions failed;
the existing execution constraints already passed and were not changed.

Validation: 525 regression tests passed with one existing optional native probe
skipped; 58 mapped Inspector cases passed in attempt
99514b19-420e-43b7-9839-455ae242b29d at captured source
dff3da03fd837476a9ce9df8db8fa5b0aac60783b0ddd1a28bf572452f8274d7.
Production App/server/proof types, 15 naming cases and 10 Inspector/catalog static
cases passed. Scoped lint has zero errors and one pre-existing console warning.
Logs: tmp/container-scope-red.log, tmp/container-scope-regression.log,
tmp/container-scope-inspector.log, tmp/container-scope-types.log,
tmp/container-scope-lint.log and tmp/container-scope-static.log.

Bounded self-review: changes are confined to existing selection/usage prose and
formal consumers. Canonical schemas, execution and recovery owners are unchanged.
Published examples execute with both root types and omitted plan; nested-frame
selection and invalid dimensions/group/plan constraints remain enforced. A committed
write followed by unavailable checking remains partial, and refresh does not replay
it. Existing criteria timing, partial/cancellation and stale/repeated-read regressions
pass. Representative query plus guide still takes two replies, including with 10000
unrelated tools; added explanation costs 552 total bytes (307 menu, 245 guide), with
no budget change. This does not establish reduced model latency or fewer live rereads.
No model, 101, push, Knowledge edit or unrelated implementation was performed.

Evidence: run 1792654309001 acquired a complete group/projected-face/surface-grid
usage guide with optional plan by 55.98 s, then selected frame and omitted plan
at 105.65 s. The first guide already allowed a frame root and omission of plan.
The record does not establish whether nested frames were intended or why the
model reread. This correction addresses App delivery ambiguity, not model intent.

Step Execution Card - compose:

- Spec: Next-part operation selection and Selected operation usage guide.
  Inspector: compose, request-to-compose and compose-to-prepare; failure owner compose.
- Inputs: existing canonical workflow schema, owner selection text and explicit
  inputScope. Outputs: existing menu/usage explaining root versus descendant choices
  and selected optional documentation versus required execution fields.
- Root draft group/frame constraints remain in every draft guide. nodeTypes selects
  children, including nested containers; changing only the root needs no new lookup.
  Selecting plan documentation does not require sending plan; omission needs no
  reread. Adding previously unread child types or optional inputs may need discovery.
- Conditions/bypasses: known contracts execute directly; no inferred scope, forced
  container choice, mandatory planning, new roundtrip, schema preload or limit change.
- Allowed contributors/boundary: local-design-workflow owner text,
  design-workflow-discovery selected usage, discovery-delivery integration tests,
  execution-flow-proof test and existing plan/spec/Inspector generated snapshot.
  Existing selected-operation proof mapping remains applicable.
- Forbidden: Knowledge edits, provider changes, new registry/state/validator, runtime
  schema changes, completed evidence rewrites, model calls and 101.
- Names/lifetime: reuse existing nonpersisted selection/instructions fields and the
  current registry/query lifecycle; no new public or persisted identity or cache.
- DoD: initial menu and direct selected usage distinguish roots/children and optional
  documentation; actual published examples execute with group or frame root and no
  plan without another read. Nested frames require their selected child contract;
  frame dimensions, group restrictions and plan validation remain effective.
  Preserve partial receipts, criteria-before-review and no-replay recovery.
- Gates: task context, naming, structural admission, failing delivery regression,
  existing discovery/workflow/information tests, mapped Inspector candidate,
  production types, scoped lint/catalog contracts and bounded self-review.
- Stop: an execution/schema defect or new owner requirement invalidates this bounded
  explanation-only implementation; revise the contract before expanding changes.

### Next-part operation selection - 2026-10-22

Status: complete within the bounded deterministic contract. Admission digest
5a60356245a5e2a5f7f535cafdfbb816cfa25d2e5d2fbd7bcd8cdc74693b3d6d preceded
formal red tests and production edits. The red cases exposed missing selection
conditions and a missing executable surface-grid example, not missing grid support.

Final evidence: 574 focused tests passed; one pre-existing optional native probe
skipped. All 58 mapped Inspector cases passed at attempt
8f95c98d-0b40-4004-ade8-3d7d4aaee4fb, captured source
17f8be22855f967379e1dc932f3414c7054edd28c1a28c4eb6abc03d9b573a65.
App/server/proof production types, 15 naming tests, eight catalog contracts and
scoped lint passed (zero errors, one pre-existing console warning). Generated
Inspector snapshot synchronized through its existing generator; diff check passed.

Same-fixture measurements before/after: initial usage query 21,538 -> 15,775 bytes;
query plus world-face guide 40,722 -> 34,959 bytes, two replies in both versions.
Current query plus grid guide is 35,894 bytes; plus projected-face/pattern guide is
38,127 bytes. All focused cases take two replies, unchanged with 10,000 unrelated
tools. These are deterministic tool-delivery measurements, not model latency.
The preserved live receipt comparison in the fixture is separately labeled and is
not a controlled model experiment. Tests do not depend on ignored evidence files.

Self-review verified source-derived restrictions for both world faces/repetition
and grids, actual published examples through dispatch/preparation/application,
first-part and later grid attachment, invalid-row rejection, partial follow-up
failure and recovery without write replay. Native Code Mode forwards both selected
guides byte-for-byte using the existing local non-model protocol harness. Existing
full/field lookup, optional criteria, cancellation, stale pages and independent
consumers passed. The integration fixture now retains actual parent attachment
metadata so continuation is checked rather than bypassed. No geometry, document,
Knowledge, provider model, refresh behavior, limit or canonical state owner changed.
Logs: tmp/next-part-red.log, tmp/next-part-focused-final.log,
tmp/next-part-inspector-final.log, tmp/next-part-types-final.log and
tmp/next-part-lint-final.log. No claim of earlier first-frame delivery; no model
or 101 was run. Stop here; no next issue is authorized by this completion.

Evidence: run 1792643796914 exposed surface-grid as a name at 19.263 s and as a
regular-facade method in selected Knowledge at 32.794 s, after the 25.494 s scope
selection. The next scope added it at 85.489 s; no write occurred before 120 s.
This proves late scope expansion, not its internal model cause or a guaranteed
latency saving. Existing ready-part guidance and optional criteria are valid.

Step Execution Card - compose:

- Spec: Next-part operation selection; Inspector compose and request-to-compose /
  compose-to-prepare routes. Owner and failure owner: App compose.
- Inputs: registered canonical workflow schema, owner selection guidance, existing
  query/category/exact selectors and explicit inputScope. Output: concise choices
  and registered route in the current read, then complete selected usage, valid
  executable examples and existing result/recovery semantics.
- Select for the next submitted part. Explain independent world faces, translated
  multi-face repeats and regular four-corner planar grids before scope selection.
  Select grid immediately when this part needs it; a ready massing part need not
  wait for later grid details. Do not infer scope or require a planning call.
- Reuse the canonical x-design-input-scope declaration for selection text and
  existing inputScopes projection. Replace the opted-in workflow's unscoped usage
  verbosity with concise selection guidance; nested output field inventories are
  not selection inputs. Keep root input paths, existing example and route. Full
  and field reads, non-opted tools and selected complete result guides remain valid.
- Allowed: local-design-workflow, design-workflow-discovery, local-operation-tools,
  design-preparation-examples and their formal integration/proof tests; active plan,
  spec, Inspector and mapping. No new registry, tool, classifier, state or cache.
  Selection metadata is App-owned nonpersisted documentation, not execution input.
- Work lifetime: same existing registry/query and continuation lifetimes. No extra
  schema enumeration or canvas exchange; preserve catalog-independent small reads.
- Cases/DoD: real menu and usage expose selection conditions before body reads;
  published examples execute for both first-part grid and world-face-first then
  grid continuation. Query plus selected guide takes at most two replies for each
  focused case, less total data than the saved query/scope path; no Knowledge call.
  Adding 10000 unrelated tools does not grow selected bytes or calls. Preserve full
  cross-field constraints, optional plan, invalid input rejection, partial writes,
  cancellation, stale/repeated/refresh reads and no automatic write replay.
- Gates: task context, naming, structural admission, red regression, complete focused
  discovery/information/workflow/provider tests, mapped Inspector candidate,
  production types, scoped lint/static contracts, bounded diff/direct-consumer review.
- Exclusions: model behavior/latency claims, pagination limits, Knowledge, rendering,
  canonical geometry algorithms, inspection and persistence changes. Stop/replan if
  selected completeness needs a new executor or canonical mutation semantics change.

Design review: existing canonical scope projection and parameter formatter already
preserve constraints; change their selection handoff, not execution validation.
Keep broad explicit compositions paginated. Do not promise one response for every
possible operation combination or treat concise advice as a complete executable
contract. Tests must consume returned examples and actual dispatch/apply owners.

### Inspection discovery field ownership and receipts - 2026-10-22

Status: implementation, bounded review and final gates complete. The single authorized
live observation is complete; its corrected negative branch remains unexercised. Formal saved-input tests first reproduced false
success, then exercised actual narrow recovery and partial-page forwarding. Native
protocol tests verify failed lookup and successful recovery without a browser write.

Final gates: 506 focused tests passed with one pre-existing optional native probe
skipped; complete operation/discovery rechecks passed after test-only review edits.
All 58 mapped Inspector cases passed (attempt
695428eb-88f7-49a9-8e20-37a05e18b87e; source
220302f0ad47abe658a530ff6557fb6cd4c6c91d533a9f2feca68be82c40620b).
Production App/server/proof types, naming (15), static contracts (6) and diff check
passed; lint has no errors and two pre-existing warnings.

Live run 1792643796914: gpt-6-astra/medium; stop expired at 120.003 s and completed
at 120.118 s. Thirteen calls completed with 0.104820 s aggregate App duration.
No drawing, schemaPaths query, failed lookup or canvas inspection occurred. The
initial selected guide remained one reply; adding surface-grid later required two
pages. Final contract returned at 88.158 s, last public reasoning event at 96.565 s,
then the deadline. Blank near-deadline video frame confirmed. This does not prove
live adoption of failed-scope recovery or a speed improvement. The raw video receipt
remains unexported; a separate remux was retained. All 38 text payloads and two
reference assets match retained digests. Original lifecycle incompleteness remains.
Detailed timing/evidence tables: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792643796914/observation-report.md`.
No further model invocation is authorized by this completed checkpoint.

Self-review correction: preserve the existing full definition.refresh route alongside
scope-preserving definition.recover. The first implementation incorrectly narrowed
that full refresh; existing formal consumers caught it, and it was restored. No
compatibility alias was added. Final source retains original requested paths on
failed-scope recovery and separately labels valid-path narrowing. Ordinary menu
pagination remains successful. Partial-page outcome is included inside the existing
byte budget and retained with the existing continuation entry. No inspection verdict,
criteria, binding or document owner changed. Follow-up test cleanup removed non-null
assertions; a title-filtered owner-suite run hit its intentional whole-suite coverage
guard, so its entire focused file is rerun rather than weakening the guard.

Evidence: preserved run 1792610978725, drawing provider
b81cadcf-c7db-49a5-a55e-0276aea9f8ce, payloads 28-32. Usage correctly separated
review_drawing and define_design_criteria inputFields. The next query applied four
paths to both identities. Each identity rejected foreign paths and returned
coverage=none, but the invocation reported success/completed with no issues.
The input description did not explicitly explain shared-list semantics. This
supports a handoff defect; model reasoning and whether the success flag changed
its decisions are not observable. Existing per-identity failure isolation is valid.

Step Execution Card - compose:

- Product clause: Inspection discovery field ownership and receipts. Owner/failure
  owner compose; registered descriptors are inputs, scoped contract or explicit
  failed-scope recovery is output, consumed by native invocation and Code Mode.
- Keep one schemaPaths list applied independently to every selected identity.
  Explain that different per-tool fields need separate queries, which can be issued
  in parallel in one exec. Never infer field ownership or rewrite pointers. Keep
  valid shared-path multi-tool queries and whole-scope rejection within an identity.
- On invalid paths retain existing root/field diagnostics and failed identity.
  Publish a same-tool correction query containing only that identity's valid
  requested paths when any exist; label it as a narrower scope, not full recovery.
  Existing usage/full recovery remains. Scoped recovery retains the original requested paths; the existing full refresh route remains.
- Aggregate exact lookup results at the discovery owner: all requested identities
  delivered is success; mixed delivered/unavailable is partial; none is failed.
  Explicit missing/ambiguous identities count as unavailable. An empty lexical
  search, category menu, empty names query or ordinary next page is not a failure.
  Read settlement is completed (the lookup settled), independent of usable coverage.
- Reuse status/settlement/code/message and the common invocation result boundary.
  Carry the same lookup status through existing content fragments; the published
  forwarding example must retain legitimate partial-result pages without treating
  assembly completeness as successful requested coverage. No duplicate state/registry.
- Boundary: local-operation-tools, local-information-delivery, their formal direct
  integration tests and existing execution-flow proof; active plan/spec/Inspector/
  mapping. No production inspection, criteria, mutations, persistence or Knowledge
  owner changes. New nonpersisted names belong to App discovery only.
- Work/lifetime: one outcome aggregation per canonical lookup; continuation reuses
  existing returnedDefinitions content and registry revision. No new cache, scan of
  unrelated descriptors, limit increase or per-field metadata expansion.
- DoD: saved query reproduces failed coverage and false success before production
  edits; corrected per-tool queries retain canonical cross-field/reference closure;
  all-failed/mixed/all-success/missing/ambiguous/empty/valid-paging are truthful;
  execute published narrower recovery and forwarding example; partial paging,
  repeat/refresh/stale/cancel preserve results and never replay completed writes.
  Verify invocation success boolean and outcome consumers, not only owner JSON.
- Gates: naming, task context, structural admission, failing formal regression,
  discovery/information/provider/flow suites, production types, scoped lint/static
  contracts, Inspector candidate, bounded self-review. Then the single 120-second
  recording: report observed query choice, receipt coverage, recovery and timings;
  no claim that absence of the failure proves all inspection behavior correct.
- Stop/replan: new state/executor needed, status lost through paging, legitimate
  partial consumers broken, or failure requires broad tool-owner changes.

Design self-review: preserve per-identity all-requested-path integrity rather than
silently omitting invalid fields. Narrow correction is explicitly distinct from
full recovery. Partial page forwarding is a direct consumer requirement: otherwise
truthful non-success receipts would prevent assembly of valid sibling contracts.
The plan does not assume AI misuse is the sole cause, and does not auto-run repairs.

### Selected operation usage guide - 2026-10-22

Status: deterministic implementation and bounded self-review complete. Final gates:
568 tests passed, one optional native registration probe skipped; 57 mapped Inspector
cases passed (attempt 05ce8216-24c0-4500-931e-ac764a71e5bb, source
6670aa47a93516036085e8be9634366d294bc6f9b6e00ce60f53fc443963d81e).
Production types, naming and six static contracts passed; scoped lint has no errors
and one pre-existing warning. Final guide receipts: vector 18,534 bytes and
projected-face/pattern 22,352 bytes, one reply each. Published examples execute via
real dispatcher/preparation/apply; native Code Mode delivers the larger guide exactly.
The single authorized live observation completed: run 1792610978725. Selected guide
adopted in one native reply (22,457 bytes), search plus acquisition two calls versus
four previously, first visible content 47.484 s. Deadline stop completed at 120.121 s.
The full design remains unfinished. See the preserved observation report under
`tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792610978725/`.
No additional model run or production correction followed. Candidate usage verbosity
and review-tool field-query mismatch remain observed follow-ups, not completed work.

Evidence: the saved selected draft/group/projected-face/pattern contract is 57,018
bytes: input 36,889, output/partial/recovery 13,763, description 4,895. Query plus
three pages still costs four reads. The inherited description mixes preparation-only
and prepare-and-apply effects. Full validation schemas are not the default user guide.

Step Execution Card - compose:

- Owner/failure owner: compose; specification: Selected operation usage guide;
  Inspector: compose conditions and request-to-compose/compose-to-prepare handoffs.
- Inputs: existing exact registered descriptor, explicit inputScope, usage view,
  canonical owner examples and owner-authored execution/result instructions.
- Output: selected operation instructions, readable parameter constraints derived
  from the selected canonical input, one matching executable example when available,
  actual execution route, outcome interpretation and no-replay recovery guidance.
  The guide is not a machine validation schema or a prerequisite to execution.
- Reuse describe_design_apis usage + inputScope. The existing full and fragment
  paths remain available. No new tool, registry, cache, validator or executor.
  Repeated field shapes/notes may be referenced within the same guide; all input
  constraints remain represented. Unknown schema vocabulary must remain explicit,
  never silently disappear. General native tools retain existing usage behavior.
- Owner declarations describe main workflow effects, not inherited child effects.
  Full output schemas stay on the execution/validation path; usage describes
  actionable success/no-op/partial/failure, completed work, artifacts, cancellation,
  stale handles and check-only recovery. Do not summarize away recovery semantics.
- Conditions/bypasses: exact supported scope plus usage opts into the guide; known
  contracts execute directly; full retrieval remains necessary for new machine
  recipes. Unsupported scope rejects without side effects. Refresh preserves view
  and scope; delivery failure never replays completed writes.
- Boundary: local-design-workflow, design-workflow-discovery, local-operation-tools,
  ai-domain-prompt and their direct tests; active plan/spec/Inspector/proof mapping.
  New identifiers are App-owned nonpersisted documentation projections. Compute on
  selected reads using the existing catalog lifetime, with no new retained state.
- DoD: search + one selected guide (not three pages), under the existing byte limit
  including the receipt; actual published examples through dispatcher/preparation/
  apply; full/scoped restriction parity and invalid cross-field cases; no-op/partial/
  cancellation/stale handle and informational recovery without duplicate writes;
  bounded bytes/calls with unrelated tools. Preserve full/field/paged lookup.
- Gates: task context, naming, structural admission, formal red/green integration,
  direct discovery/provider/flow/recovery regressions, production types, scoped lint,
  static contracts, mapped Inspector candidate and bounded self-review. Then exactly
  one 120-second recorded 101 observation; report live adoption and timings separately.
- Exclusions: review-tool delivery, Knowledge, rendering/history/persistence changes,
  output budget increases, model-assisted review and unrelated existing work.
- Stop/replan: missing constraints, failure semantics, unbounded delivery, or any
  required new executor/owner; never mark a partial guide as complete.

Bounded iteration: two focused attempts still produced two pages. The vector guide
alone was 21,707 bytes before route/example/receipt overhead. Reformatting alone is
insufficient. Keep the same owner/gates and explicitly select optional input groups:
the workflow declares optionalInputs=[plan] at its canonical scope annotation;
inputScope.optionalInputs opts into them in the same read. Omission excludes plan
from the selected contract and publishes its selection condition, never requires
another query for ordinary drawing. Full unscoped contracts retain all capabilities.
Required fields cannot be optionalized. Unknown/duplicate selectors reject. This
changes only informational coverage, not canonical execution admission. Tests cover
both default absence and explicit inclusion, preservation of all selected constraints,
and truthful paging for broader selections. No budget adjustment. Self-review: this
removes an unrelated optional contract rather than weakening required drawing or
recovery behavior; no additional owner or registry is needed.

Bounded self-review: the projection reads canonical input constraints and preserves
all nonstructural vocabulary verbatim, including future keywords. Required root or
operation fields cannot be declared optional. The actual guide example is filtered
against the selected schema, and actual native Code Mode forwarding uses the delivered
example. Output-schema omission affects documentation only: dispatcher/owner outcome
validation remains unchanged. Receipt recovery preserves view/scope and completed
writes. The main description no longer inherits preparation-only canvas semantics.
An initial Inspector proof failure was a missing local test import, corrected after
its focused reproduction; the final candidate must pass before the live run.
No history, collaboration, save, Knowledge or review-tool execution owner changed.
The guide still has substantial input detail because the current public draft accepts
it; broader optional selections can paginate and are explicitly outside the one-page
representative guarantee. This is not a promise that the model will select the guide.

### Selected operation contract delivery - 2026-10-22

Status: complete for deterministic selected-contract and on-demand discovery delivery;
no model or 101 adoption claim.

Scope extension: default first delivery must not enumerate all tool names. Existing
query/exact selection is the normal route; explicit category pagination remains
available for intentional complete inventory, including complex requests. Add
thousands of unrelated descriptors and prove fixed small-task reply bytes/calls.
Native deferred registration remains distinct from model-visible instructions;
registration cost is measured separately, not claimed constant. No new search index
or registry. Provider instruction assembly is in this compose slice.

Step Execution Card - compose:

- Outcome: existing describe_design_apis accepts an explicit inputScope for the
  ready-part workflow and returns a complete contract for that operation and selected
  node types, including all successful, partial and recovery output contracts.
- Inputs: exact registered identity/revision, owner-declared scope paths in its
  canonical schema, explicit operation and nodeTypes. Output: same execution route,
  scoped input schema, unchanged lifecycle/output contracts and scope-preserving
  refresh/continuations. Full and schemaPaths queries remain independent.
- Owner/failure owner: compose. Boundary: local-design-workflow declares supported
  scope structure; design-workflow-discovery derives choices/projections; existing
  local-operation-tools delivers them; existing App prompt advertises the route.
  Direct discovery/provider/information/flow tests and formal mapping are included.
- Design: derive operation choices from the canonical exclusive root alternatives
  and node types from canonical discriminators; never maintain a parallel type list.
  Explicitly restrict excluded operation fields and node alternatives, preserve all
  common and branch constraints and retain reachable definitions. No extra schema
  factoring layer is needed. Unsupported/ambiguous scope rejects before execution.
  This is a bounded read projection, never a replacement execution validator.
- Conditions/bypasses: known operation/type selections use inputScope directly;
  undecided or unrestricted recipe contracts use full. Usage/menu exposes supported
  choices without a mandatory extra call. A scoped contract covers only its stated
  subset; new types require widening or full acquisition. Output/recovery is never
  summarized away. Cancellation, refresh, stale pages and no-replay stay unchanged.
- Cases/DoD: formal red on absent scoped delivery; actual discovery -> complete
  scoped result -> real dispatcher/preparation/apply with valid, conflicting and
  out-of-scope inputs. Cover draft/repair/parts, frame/group, projected and grid
  mixtures, invalid scope and unsupported owners; compare validation with full
  within the selected domain. Preserve partial completion, cancellation, failed
  follow-up and save/recovery semantics with no repeated writes.
- Measure actual serialized replies and every continuation call, including an
  optional usage acquisition, against current full discovery on the same source.
  Both total bytes and calls must decrease from equivalent initial knowledge: direct
  selected vs direct full; usage+selected vs usage+full. Also report absolute costs
  against direct full: optional navigation is not free and may erase the call saving.
  Do not equate deterministic reduction with live model adoption or latency.
- Gates: task context/naming, structural admission, red/green integration and direct
  consumers, offline native delivery, mapped Inspector candidate, production types,
  scoped lint/static contracts, bounded self-review. No new tool/registry/scheduler,
  no output limit change, model/101 run, Knowledge edit or component-repeat feature.
- Failure classification: projection/grid/material conversion already exist and
  were used; full-interface acquisition is a delivery burden. Repeated compound
  surface components are a separate capability gap. Recipe is finite tool binding,
  not a design interpreter. Do not classify ambiguous model decisions as tool misuse.
- Stop: non-equivalent restrictions, missing output recovery, insufficient measured
  reduction, or required owner expansion blocks closure and requires bounded replan.

Usage navigation exposes root input fields rather than enumerating every nested
schema path. Exact field queries and their path-resolution recovery remain valid;
selected/full contracts retain all nested constraints. Evidence: current usage
inputFields alone occupies 24,166 bytes; usage plus scoped acquisition took five
calls versus four for full. This superseded exhaustive navigation must be removed.

Bounded iteration review: root usage removed the 24 KB exhaustive path list.
Selected vector delivery is three pages versus four full; optional usage adds one
to either route. Keep that limitation explicit rather than increasing budgets or
dropping constraints to force a page target. Schema factoring alone is insufficient;
operation/type exclusion plus root navigation are the delivery change.

Feasibility: existing exact-name queries already carry revisions, paged delivery and
recovery selectors. Schema-owned scope metadata survives the existing registry path.
Scope projection is pure, request-local and uncached; continued pages reuse existing
information retention. No execution or canonical document state changes are required.

Implementation and self-review evidence:

- Default provider instructions no longer interpolate the full native tool inventory.
  Explicit category pagination remains available; no discovery API was removed.
- The canonical workflow declares scope paths. Existing discovery derives choices,
  excludes incompatible operation fields/node branches, retains recursive reference
  closure and keeps output/partial/recovery/lifecycle contracts unchanged.
- Usage now exposes root input fields; exact nested queries, binding metadata and
  missing-path recovery remain. Native descriptor getters are materialized once
  within the existing registry-revision snapshot, preserving the prior work count.
- Same-source first-use replies: full 82,074 bytes / 4 calls; selected vector draft
  51,965 bytes / 3 calls. Including usage: 91,951 / 5 versus 61,842 / 4. Optional
  usage+selected still takes 4 calls, equal to direct full; do not conceal that cost.
- 10,000 unrelated tools leave purpose-query replies/calls unchanged. A real provider
  assembly test adds 1,000 deferred tools without changing initial base/developer
  instructions. Native registration still grows; this is not constant host CPU or
  proof of live model selection. Full inventory is intentionally still pageable.
- Formal fixtures validate primitive/projected/pattern/grid and ordered input scopes,
  real rejection-to-repair and actual browser creation, preserved partial follow-up,
  cancellation and read recovery without write replay. Existing owner tests retain
  successful/partial execution and credential-expiry protections.
- Gates: 499 focused/direct-consumer tests passed; one existing optional native
  registration probe remains skipped without its executable configuration. Production
  typecheck passed, naming passed (15 cases), static contracts passed (6 cases),
  scoped lint has zero errors and four pre-existing console warnings. Formal mapped
  Inspector adds the selected-operation case to the existing 56 cases.
- Offline native Code Mode executes the exact delivered forwarding example for
  selected contract pages and checks outgoing content equality/no truncation. No
  real model or 101 run. Component repetition and Knowledge were not changed.

### Knowledge selection conditions before reading - 2026-10-22

Status: complete within the pre-read selection-conditions DoD; no model/101 run.

Step Execution Card - compose:

- Objective: the existing discovery descriptions distinguish an ordinary material
  method decision from a needed detailed parameter walkthrough before any body read.
  Direct selection remains possible; hierarchy depth is not a completeness signal.
- Evidence: run 1792601859074 selected method.parameters together with repetition
  and spatial advice immediately after discovery. Its catalog described executable
  parameters without a selection threshold; the parent body's optionality arrived
  too late. This supports a delivery ambiguity, not a proven model motive. Removing
  that document alone would still leave a multi-page selection.
- Inputs/outputs: trusted existing metadata and request decisions -> discoverable
  descriptions -> selected IDs -> unchanged necessary dependency closure and pages.
- Owner and failure owner: compose. Spec: Selective nested Knowledge delivery.
  Inspector: compose conditions, boundaries and existing tool-program output.
- Boundary: App material-method and parameter Markdown descriptions, their catalog
  revisions, ai-domain-prompt, direct local-knowledge/prompt/provider/handoff/execution-proof tests,
  existing plan/spec/Inspector. No new metadata schema, registry, state or tool.
- Conditions: ordinary representation/lighting decisions can select method directly;
  unresolved local-coordinate conversion or a needed worked example can select
  parameters directly, with method restrictions included automatically. An already
  known supported representation does not require the walkthrough. No parent-first
  call, forced selection, keyword router or sibling expansion is introduced.
- Bypasses/preservation: advice stays optional; known-value work and absent advice
  can continue. References, bodies, permissions, deduplication, paging, rehydrate,
  cancellation, stale-revision recovery and no-replay behavior stay unchanged.
- DoD/cases: real discovery contains both positive and negative selection conditions
  without bodies; direct method selection completes in one reply with necessary
  restrictions and no parameter/sibling body; direct parameter selection includes
  its example and required method closure once, following actual continuations.
  Assert request counts, normal repeat/rehydrate and actual provider instructions.
  Deterministic tests prove information availability, not autonomous model choice.
- Gates: supported structural admission before test edits; existing baseline tests,
  formal failing regression then focused catalog/prompt/handoff/delivery tests;
  mapped compose proof, production App/server types, naming, scoped lint and static
  content/Inspector checks; bounded diff and direct-consumer self-review.
- Exclusions: four-page drawing schema, Knowledge splitting, delivery budgets,
  provider/runtime algorithms, model/101 runs, historical evidence and other owners.
  Stop for a lost necessary restriction or a required out-of-scope change.

Feasibility review: discovery already returns the same descriptions and child links
used for direct selection. Editing those descriptions and the existing prompt is
sufficient; the resolver need not choose on behalf of the model. Existing mapped
selected-topic proof can cover pre-read conditions without a duplicate mechanism.

Validation and bounded self-review:

- Structural admission passed before test edits: digest
  `106c23cf5a4fb2753993fd8d3ba38ba9977cbaff6e56e2c5a894ef1396f0cc82`,
  `tmp/knowledge-selection-conditions-admission.json`. Existing 38 tests passed;
  strengthened tests then failed on missing catalog conditions and child-only
  prompt guidance (two failures, 37 passes) before production edits.
- Existing descriptions now distinguish ordinary method decisions from unresolved
  local conversion or worked-example needs. Prompt and both read/discovery tool
  descriptions permit direct parent/child selection. Method revision advances to
  3 and parameters to 2. Bodies, dependencies and all executable examples remain
  byte-identical; no shared Knowledge or delivery algorithm changed.
- Focused catalog/prompt/handoff/information-delivery suites: 65 passed, including
  offline native successor checks. Actual normal-provider handoff: one passed
  (206 unrelated cases not selected). Fresh detail-owner reads request only the
  selected detail ID and returned continuations, retaining every parent document
  once; ordinary method uses discovery plus one read without optional bodies.
- Repeat/rehydrate, cancellation and stale-content regression cases remain passing.
  A direct-consumer revision assertion was updated from 2 to 3; a case-sensitive
  old wording assertion now checks the preserved optional-children semantics.
  The new test's unknown-input type assertion was corrected; production App/server
  and flow-proof types pass. Scoped lint has no errors.
- Review checked only this turn's edits against the saved pre-edit source, direct
  consumers and frozen gates. No schema acquisition changes, new state/registry,
  compatibility path, budget increase, forced lookup or mutation path was added.
  No model or 101 was run. Selection quality and latency remain live-test questions.
- Final mapped Inspector candidate `46f13985-ae7f-4798-bf93-30e20f09c302`
  passed all 56 cases on source digest
  `43359f22317069620cad005ca3cd8139e81914606647191975f91b94607a8c64`.
  Existing proof mapping remains unchanged; strengthened assertions stay in its
  registered selected-topic case. No accepted baseline mutation was performed.
- Final catalog rerun: 22 passed. Static/content gates: six passed; naming: 15
  passed. Scoped lint: zero errors, two pre-existing console warnings. Task context
  and whitespace checks passed. Four-page drawing schema remains the next task.

### Complete selected Knowledge delivery - 2026-10-22

Status: complete within the selected-topic delivery DoD; no model/101 run.

Step Execution Card - compose:

- Objective: deliver the material-method and representative-review decision topics
  with their necessary constraints in one complete reply each, under the existing
  information budget. This is a topic contract, not a building-specific exception.
- Evidence: preserved run 1792595690638 returned 40,186 and 27,324 byte closures,
  each in two pages; shared dependency text was 13,514 bytes. Raw payload digests
  were checked. Relevant source files match the saved source snapshot.
- Inputs/outputs: discoverable selected IDs/context and trusted authored metadata
  enter the existing Knowledge resolver; complete advisory documents and sources
  pass through existing invocation/forwarding to the native successor request.
- Owner/boundary: compose; App architectural Markdown and local-knowledge catalog
  registrations, direct catalog/handoff/information/native integration tests,
  execution proof/mapping, this plan and the current product spec/Inspector.
  Runtime resolution and informational delivery algorithms remain unchanged.
- Design: keep common contract/recovery constraints in the contracts topic; move
  detailed invocation examples to optional contracts.operations. Keep material
  selection and representation limits in materials.method; move detailed parameter
  walkthrough and executable preparation example to optional method.parameters.
  Existing correction/review topics remain selectable. Required dependencies stay
  references; optional details use children. No parent eagerly reads children.
- Naming: new dotted IDs belong to the existing App catalog, with flat Markdown
  filenames; increment changed document revisions. No persisted document migration,
  alias, alternate registry, new tool, cache or cross-query read suppression.
- Preservation: exact examples remain executable at their new topics; current
  consumers explicitly select details when needed. Preserve shared/local ownership,
  material-domain limits, evidence adequacy, local versus whole acceptance, exact
  settlement and no-replay recovery in the decision topics themselves.
- Conditions/bypasses: Knowledge is advisory; known-value work and absent advice
  bypass reads. Multi-select and optional detailed reads may still paginate.
  Repeat/rehydrate, stale revision, cancellation and error behavior stay unchanged.
- DoD: formal regression fails on current two-page replies; actual discovery ->
  selected read -> invocation -> delivered forwarding example -> native successor
  is complete and untruncated. Verify necessary limits, absent sibling bodies,
  optional detail reachability, shared-dependency uniqueness, and recovery gates.
  Tests retain selected inputs/provenance in formal fixtures, never depend on tmp.
- Gates: task context, naming, structural admission, focused App Knowledge and
  direct-consumer tests, offline native integration, mapped Inspector candidate,
  production App/provider types, scoped lint, content/static Inspector checks.
- Failure owner: compose. Forbidden: model/101 calls, output-budget changes,
  refresh restrictions, mutation replay, portable tool names, unrelated cleanup.
  Stop for lost constraints or an out-of-scope owner change. The unfinished native
  call's generation-versus-stall cause remains unresolved and deferred.

Feasibility/self-review: existing children navigation, mandatory closure deduplication,
request-local retained reads and bounded forwarding already provide the required
mechanism. The prior tests reconstruct arbitrary page counts and therefore do not
assert one-reply topic delivery. New tests must measure actual calls and serialized
replies, not simply helper output or selected-node count. Native scripted transport
proves delivery bytes, not live model adoption or elapsed-time improvement.

Validation and bounded self-review:

- Structural admission passed before tests: `tmp/complete-knowledge-admission.json`,
  digest `63c95f80e50ca71010be643e80a3371e7fe12d56061dd81d96eb3cfbcae72a9c`.
- Formal recorded-input regression failed on the original two-page method response
  before implementation (`tmp/complete-knowledge-red.log`). Existing tests only
  reconstructed pages and did not enforce one-reply decision delivery.
- Content owner now exposes optional contracts.operations and method.parameters
  children; changed common/method/correction revisions advance to 2. The old eager
  detail bodies are removed from their former owners, not retained as aliases.
  All eight published JSON examples are unchanged and their direct consumers select
  the new detail owners. Shared portable Knowledge and runtime algorithms are unchanged.
- Self-review kept nonzero dimensions, basis partitioning and shared-value limits
  in the method decision body, in addition to the detailed walkthrough. Existing
  no-replay, partial receipt, capture-versus-record and local-versus-whole acceptance
  constraints remain mandatory. No cross-query suppression was introduced.
- Catalog/handoff/prompt: 53 passed. Focused normal-provider Knowledge handoff: one
  passed (206 unrelated cases not selected). Native delivery script: 15 harness
  cases and 11 information-delivery cases passed before the final constraint edit;
  rerun the changed native case on final content. Static/content: six passed.
  App/provider production types passed; scoped lint has no errors.
- The existing test:native-delivery script now includes the real information
  forwarding integration suite; no alternative runner or live inference was added.
- Final native case passed on the last content edit: `tmp/native-handoff-DRAJOX`.
  Both successor comparisons are exact, without truncation; two selected reads
  produce two native replies. Method body: 40,186 -> 22,670 bytes; review body:
  27,324 -> 21,256 bytes (same JSON-body basis, excluding toolOutcome).
  Final invocation replies including toolOutcome: 22,742 and 21,328 bytes.
  Each topic changes from two pages to one; optional multi-topic detail still pages.
- Final Inspector candidate `ab63e44e-e934-48f4-822d-5f42ad1a390c`: 56/56 passed,
  source `1725a65501a2ca1c3701dee8a647a6b2f282d4f817f39c91d05cc5660a944734`,
  mapping `609386aa62b9caac03e8320036358f331dcb7bbb6542d113b8264d22809dbd5d`.
  Final content/handoff/prompt rerun: 53 passed. Native fixture cleanup has no
  errors; its deliberate offline-test termination is not a live task completion.
- Unfinished native parameter progress, live adoption and latency remain
  unconfirmed; no model or 101 was run. Final review found no remaining in-scope
  constraint loss or owner change. Existing pagination and recovery algorithms,
  source permissions, Knowledge optionality and write paths remain unchanged.

### Unfinished native tool-output observation - 2026-10-22

Status: bounded visibility declaration and real-native characterization complete;
pre-dispatch argument progress acquisition remains unsupported.

Step Execution Card - observe:

- Objective: establish observable boundaries for unfinished native tool output and
  prove whether current interfaces distinguish argument generation from silence.
- Inputs: existing child public events/transport metrics and same-version offline
  scripted Responses inputs. Outputs use the existing Runtime trace and sink.
- Evidence: run 1792595690638 had a native diagnostic custom_tool_call start at
  90.957s, absent from the App stream. An actual 0.160.0 offline experiment also
  exposes no such start on stderr, even with the narrow debug target enabled.
  The proposed diagnostic parser cannot deliver its contract and is removed.
- Reviewed feasible contract: publish explicit visibility for pre-dispatch output
  items, parameter deltas/bytes and generation-versus-stall attribution as
  unavailable, alongside observable public item and App invocation boundaries.
  Controlled progressive versus withheld input must prove this limitation against
  the real native engine, not a mocked event. Completion remains separately tested.
- Allowed boundary: local-ai-provider and direct tests, existing native-delivery
  fixture server/tests, execution proof, current spec/Inspector/formal mapping.
  Runtime recorder uses its existing allowlisted evidence fields unchanged.
- Conditions/bypasses: missing public events never mean zero generated bytes or a
  stall. Diagnostics never become product status, tool execution or permission.
  Existing success, cancellation, disconnect and no-replay behavior remains.
- Exclusions: no database polling/exporter/proxy, binary or log configuration change,
  new registry/scheduler/state, raw diagnostics/code/reasoning retention, model/101,
  Knowledge/paging/refresh or mutation changes. Historical evidence is unchanged.
- Naming: app/output-visibility is an App diagnostic method on the existing
  provider_notification stage, using existing
  source/coverage/kind/status/reason/bytes fields; no new Runtime contract.
- DoD: revised formal red then green; actual provider-to-record integration on
  completion/abort/disconnect; no private-content leakage or invented invocation;
  same-version native progressing/silent inputs during an unfinished custom call,
  later completed invocation and successor receipt; interruption leaves no inferred
  completion. Explicitly report that live differentiation is still unsupported.
- Gates: task context/naming/admission, provider suite, offline native observation,
  mapped Inspector proof, App production types/scoped lint, bounded self-review.
- Failure owner: observe. Stop rather than invent native capabilities or expand to
  a new transport. No claim that the historical delay itself has been repaired.

Iteration review: the original fake-stream regression reproduced missing metadata,
but the real native test disproved the assumed stderr source. Those failures remain
in tmp/native-output-red.log and native-output-offline*.log. The revised test must
assert actual observability, not accept a simulated start as production evidence.
There is no recurring scan or cache. Fixture-emitted byte counts are test witnesses,
not production argument counts. This closes a bounded visibility characterization,
not acquisition of an unavailable native stream.

Validation and bounded self-review:

- Revised contract admission: `tmp/native-output-revised-admission.json`, digest
  `463b5740a317640ac55076e77dbb67b1face2aff812f4b4fad53091b4d2420fd`.
- Revised provider regression failed before implementation on the missing visibility
  declaration (`tmp/native-output-visibility-red.log`). Tests were corrected to
  assert the existing Runtime array-summary envelope, not to change that owner.
- Final provider suite: 206 passed, one existing skipped case. The three new cases
  preserve normal completion, abort/disconnect codes, no invocation and no leakage.
- Actual native observation integration: two tests passed, covering progressive
  64,000-byte input, withheld input, later actual invocation/successor and an
  interrupted unfinished call without invocation. Only user-message items were
  public before tool completion. HTTP/SSE fixture results are not live WebSocket
  timing measurements. Existing native delivery regression: 15 passed.
- Final Inspector candidate `224e075f-68c0-443f-812d-2ae7ec2eabdc`: 55/55 passed;
  source digest `0b030358c7b622b936573d56d2902d851a3310176d1a022c5aad315206269d51`. Static Inspector: two passed.
  App/provider production types passed; naming: 15 passed; scoped lint: zero errors,
  four existing console warnings. Task context and whitespace checks passed.
- Self-review removed the unsupported stderr parser/debug configuration completely.
  The adapter now adds one capability record using existing provider_notification
  and allowlisted evidence fields. No new Runtime state/schema, execution decision,
  output limit, refresh behavior, Knowledge edit, logging system or model call.
- Limitation: this does not recover the historical unfinished tool's arguments or
  distinguish live generation, network silence and internal provider delay. Native
  diagnostic database observations remain a separate historical evidence boundary;
  no production reader/poller was introduced. A supported pre-dispatch event source
  is required before claiming that finer acquisition has been implemented.

### Selective nested Knowledge delivery - 2026-10-21

Status: complete within this selective delivery contract; no model/101 run.

Step Execution Card - compose:

- Objective/output: actual discovery exposes selectable nested children with IDs,
  descriptions and revisions; a selected leaf returns only its required dependency
  closure, preserving necessary limits without loading siblings.
- Inputs: trusted catalog metadata/content, authorized context labels and selected
  IDs through existing discover/read tools. Runtime owns metadata validation and
  dependency resolution; App owns catalog, topic guidance and delivery.
- Conditions: `children` is optional navigation, never a content dependency.
  Discovery filters children against discoverable entries; absent/inapplicable/
  unauthorized optional children are omitted. Visible navigation cycles reject.
  Direct reads need no parent read. Mandatory missing/denied/cyclic dependencies
  keep existing rejection. Duplicate query dependencies remain deduplicated.
- Bypasses: known-value work and unavailable advice never require Knowledge.
  Existing repeated read, rehydrate, paging, cancellation and disposal remain.
- Allowed contributors/boundary: existing runtime knowledge types/resolver/tests;
  App local-knowledge loader/descriptions, ai-domain-prompt, architectural Markdown
  family and its direct provider/handoff tests; portable architecture Markdown
  family; current spec, Knowledge architecture, package docs and proof mapping.
  No new registry, search engine, cache, state, tool, scheduler or model call.
- Naming: `children` is neutral advisory metadata in the existing registration
  contract. Dotted child IDs remain flat filenames, not inferred hierarchy.
  Parent IDs become thin navigation modules with newer revisions; no old full-body
  alias or eager umbrella remains. Historical evidence is immutable.
- Required cases/DoD: real catalog discovery -> child selection -> real read;
  parent/deep leaf exclude unrelated bodies; selected child retains constraints;
  multi-select shared dependencies once; metadata visibility/cycles; mandatory
  dependency failures; unchanged refresh/revision/cancellation and paged content;
  direct App examples still execute against canonical downstream owners.
- Gates: structural admission before tests; formal red then green; runtime Knowledge,
  App catalog/handoff/prompt/provider suites, mapped execution proof, production
  runtime/App types, scoped lint/naming and direct-consumer self-review.
- Failure owner: compose reports invalid metadata/query/delivery without writes.
  Stop for conflicting ownership, required out-of-scope behavior or loss of a
  necessary restriction. Do not infer AI adoption or speed from deterministic tests.

Feasibility review: discovery already returns metadata and read accepts selected
IDs. Existing recursive references/extends/overrides provide mandatory closure;
using them for optional children would reproduce full delivery. Add navigation to
that same metadata owner, not another index. Split existing advice by purpose,
keep common limits in small dependencies, and replace relative cross-section
pointers with explicit topic names. Tests that require material/review/examples
must select those topics rather than silently reconstruct an umbrella.

Validation and self-review:

- Supported contract admission passed before regression/implementation; retained in
  `tmp/knowledge-selection-admission.json`. Direct-consumer and selected-topic
  proof admissions are retained beside it. No accepted baseline was mutated.
- Formal regressions: `knowledge-selection-runtime-red-corrected.log` proves three
  navigation failures with a valid task identity against pre-change semantics;
  27 prior Runtime cases passed. Initial test fixtures required a task identity
  correction. The App red case reports the absent selectable children.
- Runtime Knowledge: 30 passed. App catalog, downstream Knowledge handoffs,
  actual prompt and bounded delivery suites: 61 passed. Provider suite: 203 passed,
  one existing skipped case; the actual provider directory-to-correction read and
  recovery case passed again after the final content relocation.
- Final isolated Inspector candidate `90a1e7ac-3a40-416e-bd29-55bb9ee2ed30`:
  54 passed, source `9014d28428236727840f38204fd015982c4ec576c194c6e63d6e64f15c6dc3dc`,
  mapping `472804ad502ee25e9e04dbf11a71bac3148b05c18f4b0d51df22e28298fe271f`.
  Source HEAD remains `37577161005b34ceab2ee82fd12f4f6e36cd2e1b`; candidate
  evidence captures the actual dirty source, not only that commit.
- The earlier candidate failed on two old parent-file example reads and an
  unavailable isolated-test helper. Cases now retrieve their selected module
  through the real owner and use the existing isolated continuation consumer.
  No production fallback or widened retrieval was introduced to pass them.
- Shared content checks: four passed; static Inspector: two passed; naming: 15
  passed. App production types and Runtime production-source typecheck passed.
  Scoped lint has zero errors and two pre-existing console warnings.
  The package-wide Runtime build remains blocked by pre-existing `.at` calls in
  profiler test lines 1428/1441 under ES2020; those unrelated files are unchanged.
- Bounded self-review preserved all eight original App fenced examples verbatim,
  executing their published forms in direct-consumer/proof tests. Moved capability
  table rows to their relevant topics instead of retaining all rows as common
  prerequisites. Updated cross-topic pointers and removed the obsolete
  previously-returned-state wording while preserving missing-context recovery.
- Existing source capture includes the new Markdown files. The historical
  architectural ablation helper is not active for a control run; no historical
  evidence, model configuration or evaluation scenario was changed.
- No new registry, retained cache, tool, scheduler or write path. Discovery reads
  no advice bodies into model context; existing request catalog file loading is
  unchanged. Selective delivery does not establish faster startup/file I/O,
  successful AI topic choice, reduced model latency or improved artwork.

### Executable retained information delivery - 2026-10-21

Status: complete for the bounded executable-delivery contract; no model/101 run.

Step Execution Card - compose, then existing observe verification:

- Objective: publish and execute the same bounded information-forwarding example
  in discovery descriptions and native provider instructions. Preserve every selected
  contract restriction without reprinting the assembled full value.
- Inputs: one actual text-only informational result and an explicit query-specific
  Code Mode storage key; later calls may consume one retained original page.
- Output: one bounded original page per exec; parsed complete value retained only
  after contiguous revision/size coverage. A stored value is not a model receipt.
- Owner/boundary: local-information-delivery.ts owns the example; existing
  local-operation-tools.ts attaches it to discovery/provider instructions;
  local-ai-provider.ts distinguishes required contract delivery from compact findings. Formal
  local-information-delivery, information-delivery integration, discovery-delivery
  integration and local-ai-provider tests exercise the delivered text. No new
  registry, tools, App result store, scheduler or output-budget override.
- Conditions/bypasses: ordinary text/image receipt forwarding stays independent.
  Replay the saved page without a tool call; new query/refresh uses a fresh key.
  Missing storage allows ordinary read/refresh recovery. Invalid/incomplete/mixed
  fragments never yield a complete value; failed read receipts preserve prior state.
- Allowed contributors: existing Code Mode store/load/text, canonical paginated
  read owners, dispatcher, saved fixtures and offline native adapter/sink.
  Forbidden: arbitrary summaries replacing schema constraints, automatic write
  retries, hidden native instrumentation, Knowledge edits or model/101 calls.
- Work lifetime: only query-scoped Code Mode storage, incremental incoming-page
  validation and one final JSON assembly; replay performs no owner read or write.
  Existing App continuation invalidation, permissions and cancellation remain.
- Formal cases/DoD: tests extract and execute the actual advertised example; verify
  native outgoing pages, Unicode/escaping, full/partial schema restriction closure,
  small results, duplicate/replay, gaps, mixed revisions, invalid size, failed reads,
  stored-data loss and legitimate refresh. Downstream invocation uses the delivered
  contract and rejects invalid input; output recovery cannot increase write count.
  Keep the negative full-print/combined-output characterization to detect loss.
- Gates: structural admission before tests, failing formal test, focused owner and
  provider suites, native suite, mapped compose/observe cases, production App types,
  scoped lint/naming and bounded direct-consumer self-review.
- Naming: example and guidance are App-owned source constants, not new wire fields.
  Storage keys are example caller inputs, never persisted document identities.
- Stop: unavailable native evidence, a needed new execution owner, or a requirement
  to suppress refresh/increase limits blocks completion. No historical cause claim.

Feasibility review: current descriptions and developerInstructions share the same App
instruction owner; the native adapter already accepts scripted exec sequences and
captures actual outgoing requests. A one-page example can preserve raw serialized
bytes while retaining assembled data. It cannot intercept arbitrary agent text()
usage, so deterministic success does not establish model adoption.
Formal proof fixture correction: discovery is enabled by registered canonical basic
capabilities, not an arbitrary fake action or native-only descriptor. The mapped
case uses the existing basic catalog with explicit typed test semantics; no product
availability condition is relaxed. Cancellation remains a rejected invocation,
not a fabricated failed reply. Provider example delivery is developerInstructions,
not baseInstructions. These fixture corrections do not alter the implementation
boundary or the behavior under test.

Knowledge decomposition is the next separate task: select only needed nested
modules; do not keep an umbrella that eagerly references all content. No Knowledge
source or retrieval semantics change in this slice.

Validation and bounded self-review:

- Admission before tests: b548aed64c7d05c41011e536a9b38ab3f903151f386e769c2cdfa4e4b93ae0aa.
  Formal case mapping admission: 323e9f5287b9337f71509050d1d37bd6a4eab5fdf47072a986455e147737e2ae.
- Red evidence: the actual advertised-example test failed because no executable
  information example was delivered; three provider cases then detected the missing
  explicit distinction between required contracts and compact findings. Logs:
  tmp/information-example-red.log and tmp/information-example-provider-red.log.
- Five focused owner/provider files: 408 passed, one existing skip. Actual delivered
  source runs in native Code Mode: six canonical Unicode/escaped contract pages and
  retained-page replays are exact in successor requests. Full/combined printing
  remains a detecting negative control. Missing/mixed/invalid pages preserve prior
  state, cancelled reads stay rejected, and refresh after storage loss remains legal.
- Real dispatcher/owner integration rejects invalid input, performs one actual
  composition mutation and preserves its result across saved-page redisplay and
  refresh without a second write. Existing text/image forwarding remains passing.
- Native characterization: 15 passed; static Inspector: 2 passed; production App
  typecheck passed; naming passed; scoped lint has zero errors and five console
  warnings (four existing sites and one native evidence-location output).
- Source-bound Inspector candidate ced5f8c9-8559-4cb0-b46d-1206b4ace510 passed all
  53 mapped cases, including compose.information-forwarding. Captured source:
  d1e0ff1238627007f7570f656d1f9cc5c80a7b7cdd1f55cdffb25e4625d28fbc.
  Candidate verification is not acceptance of a new baseline or whole-plan closure.
- Evidence logs: tmp/information-example-owner-gates.log,
  tmp/information-example-native.log, tmp/information-example-proof.log,
  tmp/information-example-types.log, tmp/information-example-lint.log and
  tmp/information-example-candidate.log. Native sink directories are named in the
  test logs; owned native cleanup receipts contain no errors.
- Review: selected source, direct instruction consumers, failure paths, registered
  route, schema restriction preservation and no-replay counts were checked. The
  informational body remains bounded at 23,000 bytes; the example permits the
  existing 24,000-byte serialized reply bound including the canonical outcome
  envelope. No provider output limit was changed. No App result store, runtime
  cache, compatibility route or tool was added. Tests execute extracted published
  source rather than a parallel implementation.
- This fixes the offered executable handoff and conflicting compact-output guidance,
  not arbitrary agent-authored output. Model adoption, historical Code Mode output
  and live latency remain unverified. No Knowledge files or retrieval semantics
  changed, and no model/101, push or automation was run.

### Cross-execution native assembly evidence - 2026-10-21

Status: complete for the bounded offline evidence contract; not a historical diagnosis.

Step Execution Card - observe (offline assess-recorded-changes consumer):

- Inputs: permanent digest-verified saved replies, explicit scripted Code Mode
  executions, revision-bound UTF-8 fragments and installed pinned native binary.
- Outputs: existing sink records for each scripted execution, native tool reply,
  successor wire request and public notification; exact output comparisons and
  explicit unobservable boundaries. Scripted instructions are not model decisions.
- Conditions: local fixed Responses endpoint only; default native output limits,
  existing isolated home and 45-second owned-process watchdog. No external model.
- Bypass/failure: absent or unsupported output cannot pass as exact; missing or
  mixed fragments reject assembly. Preserve failed evidence and cleanup receipts.
- Allowed contributors: existing native-delivery adapter, Runtime evidence sink,
  permanent fixtures and native public notifications. No production instrumentation,
  private reasoning, credentials, inferred parent links or timing-based attribution.
- Boundary: native-delivery.mjs and its formal test, evaluation README and existing
  flow document; current plan, ai-execution-flow spec and observe Inspector contract.
  Existing static mapping remains the owner-boundary gate, not the native oracle.
- Cases: multiple exec calls retain and assemble complete fragments; a later exec
  reads the retained complete value; missing or mixed-revision pages cannot produce
  successful assembly; compact output survives; deliberately printing the full
  retained large value characterizes downstream truncation without losing storage.
- DoD: capture each actual successor request, verify reconstructed bytes/digest and
  required source content, locate output transformations separately from retention,
  retain public notifications without claiming hidden store internals are observable.
  Run the full native suite, static admission/contract tests, naming and scoped lint.
  Production types are not applicable without production TypeScript changes.
- Naming: optional scripted execution sequence is test-adapter-owned, not a product
  API, registry or persisted document identity. Preserve direct/code controls.
- Stop: native version mismatch, unsupported public protocol, escaped output or
  cleanup failure cannot be relabeled success. No refresh or Knowledge alteration.

Design review: the existing loopback endpoint can return successive fixed exec
calls and already saves real wire requests and public events. Extend that owner,
not a second transport. A controlled store/load result proves that scripted path;
it cannot reconstruct the missing 50.499-63.805 second historical execution.

Validation and self-review:

- Structural admission before tests: 4898da491eb05568e64507f83bf77144ddf20910a9c759c78df9729dfffc7a30.
  Final explicit offline input/contributor admission:
  7d03b9cb5b8504ef4140891f8a97d8639641ae1e1164eac1b573277d0072f2ae.
- Initial formal cross-execution case failed because the old adapter produced two
  requests instead of three. This was a test capability gap, not a product defect.
- Native suite: 15 passed; static Inspector: 2 passed; analysis/assessment consumers:
  17 passed; canonical information-owner integration: 4 passed; mapped observe
  cases: 3 passed (49 unrelated cases excluded by explicit selection). Naming and
  scoped ESLint pass. No production TypeScript changed.
- Saved advice (66,434 bytes) and schema (84,960 bytes) remain exact after separate
  store/load executions and assembly. Full printing omits 26,434 and 44,960 bytes
  respectively in the actual successor request; subsequent bounded retained reads
  reconstruct the original SHA-256 and parsed content. Missing and mixed-revision
  pages reject assembly. Public completed items expose no functionCallOutput here.
- Evidence: tmp/code-mode-native-final.log, tmp/code-mode-owner-integration.log,
  tmp/code-mode-consumers.log, tmp/code-mode-observe-proof.log and the sink-owned
  native-handoff directories named in those logs. All native cleanup receipts have
  zero errors. A scoped ESLint missing-global finding was corrected and rechecked.
- Review covered the adapter, its current owner consumer, fixture integrity,
  request identities, output comparison, failure cleanup and existing direct/code
  controls. The protocol fragments are scripted test inputs, not a replacement
  implementation of canonical pagination. No second result store or public raw
  event flag was added. Refresh, Knowledge, 101 and real inference were untouched.

### Bounded information delivery - 2026-10-21

Status: complete for bounded informational delivery and no-inference verification; actual model adoption remains untested.

Step Execution Card - compose, followed by observe verification:

- Objective: necessary advisory content and schema restrictions survive the actual
  native successor request without increasing provider output limits.
- Inputs: canonical discovery descriptors, composed Knowledge, existing selectors,
  refresh/rehydrate and optional revision-bound contentPage continuation.
- Outputs: unchanged complete small replies or explicit bounded JSON fragments with
  byte ranges, total size, content digest and a same-tool continuation. A final
  fragment does not assert that preceding fragments were consumed. Reassembled
  bytes must equal the canonical complete result before its contract is used.
- Owner: existing App discovery/Knowledge owners. Runtime Knowledge's existing
  delivery bookkeeping may retain immutable content for the App's paged consumer;
  ordinary sessions keep their existing reference-only duplicate behavior.
  Discovery's existing returned-definition bookkeeping becomes request-local
  content delivery retention; no second registry, result store or scheduler.
- Replace optimistic discovery duplicate suppression: a previous App return is not
  evidence that the model received a definition. Repeated read requests remain
  legal and return the selected content, with the same bounded delivery rules.
- Use a pure App projection shared by the two informational owners. Keep existing
  category pagination, usage, field constraints, execution routes and examples.
  Bound serialized output including metadata; never silently truncate or summarize
  canonical content. Reject mismatched, expired or cross-query continuations.
- Cancellation, permission and revision checks precede delivery even when content
  is retained. Refresh/rehydrate still initiate recovery; continuation does not
  repeat a context reset, re-read source files or dispatch a document write.
- Retention extends existing request/session delivery ownership, with bounded
  entries and context/revision/disposal invalidation. Prove source read counts and
  immutable reuse together; this is continuation ownership, not a new cache tier.
- Mutation scope: local-operation-tools, local-knowledge, local-information-delivery,
  their formal tests; Runtime knowledge/knowledge-types and knowledge tests; current
  App prompt/provider instruction handoff; native-delivery test adapter and cases;
  existing plan/spec/Inspector/evaluation flow, Runtime package documentation and
  formal proof mapping. No Knowledge prose, drawing owners or UI changes.
- DoD: native Code Mode/default-budget successor requests retain every returned
  fragment exactly; ordered assembly matches source SHA-256 and parses as the
  original JSON, including full/partial schema closure, routes and advice. Formal
  negatives cover stale/invalid/cross-query cursors, duplicates, cancellation and
  recovery. Existing direct consumers and valid unpaged reads remain covered.
- Script one informational reply per exec output. Guidance must explain that
  concatenating all pages into a single exec output defeats bounded delivery;
  retain assembled data in Code Mode and print only the requested page/decision.
  Actual model adoption and arbitrary model-generated concatenation are unproven.
- Gates: admission, failing owner/integration regressions before implementation,
  focused Runtime/App tests, native handoff gate, production types, scoped lint,
  naming, Inspector verification and bounded direct-consumer self-review.
- Stop on an unsupported protocol, missing outbound capture or owner outside this
  scope. No real model, 101, extra AI review, dependency, push or goal.

Self-review: usage alone cannot replace a complete contract. Category item counts
cannot bound one large schema. The current 66,434/84,960-byte counterexamples require
byte-bounded delivery and an explicit completeness distinction. Existing selectors
remain preferable when they answer the question; full content stays accessible.

Implementation review:

- Formal failures reproduced a 48,612-byte advice reply and a 71,462-byte schema
  reply exceeding the delivery bound. The same-version native proof also exposed
  the canonical callInternal bypass: its 71,718-byte result lost 31,718 bytes.
  Both public and internal discovery entry points now use the same projection;
  non-discovery internal execution retains its prior owner semantics.
- Full content remains lossless, with UTF-8-safe contiguous ranges and a digest
  bound to request, tool, query and source. Retained results are optional Runtime
  session behavior; default independent Runtime consumers are unchanged.
- Direct consumers now follow the published continuation before parsing a complete
  contract. Existing assertions for dispatch, schema constraints, partial success,
  review binding and no-replay recovery remain in place. Prior-return suppression
  assertions were removed because they falsely imply successful delivery.
- The native test preserves the old saved-response truncation counterexamples and
  separately proves current owner pages survive default Code Mode successor input.
  Actual model reading, comprehension and discretionary concatenation are not
  established by the scripted peer. No model or 101 was run.

Validation:

- App owner/provider/direct-consumer regression gate: 499 passed, one existing
  skipped case. Final declaration follow-up: 18 passed, including the real native
  Code Mode page handoff. Runtime Knowledge: 27 passed. Preserved-response native
  characterization: 9 passed. Offline analysis/assessment consumers: 17 passed.
- App production type configurations passed. Runtime compilation passed with
  ES2022,DOM libraries; its ordinary package build remains blocked by a pre-existing
  profiler test using Array.at with the package's ES2020 library configuration.
  No unrelated profiler or compiler configuration was changed.
- Scoped lint: zero errors, two existing console warnings. Naming: 15 passed.
  Inspector accepted revision 62 and verified captured source
  19eab3283f845eba3b534c178760110d50bb78dcfaed49b01b2f2bfdd7677cc0
  in run 2ca25f1b-e7f7-4c89-b611-677792749fa7.
- Final bounded review covered canonical internal/public entry points, existing
  usage/schema fragments, retained-result permissions and lifetime, recovery,
  direct consumers and native output preservation. No design writes or new
  persistence/registry/scheduler mechanism were introduced.

### Offline native delivery handoff - 2026-10-21

Status: completed offline characterization and bounded self-review. No production
refresh behavior, output limit or historical evidence was changed.

Step Execution Card - observe / assess-recorded-changes:

- Objective: execute the installed Codex 0.160.0 against a loopback-only scripted
  Responses endpoint and preserved tool replies; capture its subsequent real request.
- Owner: existing App evaluation tests, Runtime payload sink and independent
  live-test deadline worker. Native Codex owns all transformation under observation.
- Inputs: permanent fixtures extracted from the retained initial discovery and
  Knowledge payloads, their native declarations, SHA-256 provenance, fixed synthetic
  response items and actual executable identity. Tests never read ignored tmp fixtures.
- Output: source/binary identity, scripted input, exact captured request evidence
  through the existing payload sink, matching native completion, comparison and
  explicit unavailable boundaries. No actual model inference or external credentials.
- Boundary: test-data/knowledge-evaluation/native-delivery.mjs,
  **tests**/native-delivery.test.mjs, fixtures/native-delivery/*, App package script,
  evaluation README and existing contracts. No product provider/refresh changes.
- Use a fresh project-local native home and loopback custom provider, disable
  auxiliary tools/telemetry, retain medium effort and Code Mode, preserve default
  output limits. Track native process group and always stop through existing watchdog.
- Compare direct native tool output with Code Mode output where the installed native
  interface supports both. Script the native response, not a mocked completed echo.
  Capture actual outbound requests before replying; only allow fixed fixture tools.
- Formal cases: fixture integrity, same native version, actual call identity,
  subsequent request content/omissions, UTF-8 boundaries, missing capture rejection,
  local-only endpoint validation and bounded cleanup. Absence is not truncation.
- Gates: admission, formal native test, focused Node assertions, naming, scoped lint,
  Inspector evidence and bounded self-review. Existing unchanged production gates
  remain historical validation, not newly executed checks.
- Stop on unsupported native protocol or missing next request and retain evidence;
  do not change provider behavior, raise budgets, enable raw internal events, add
  dependencies or run 101. A deterministic scripted server is not a real model.

DoD: identify the selected tool reply and its actual successor request; compare raw
UTF-8 digest/size and content around any observed omission; distinguish Code Mode
presentation, history transformation and request assembly only when evidence permits.
Report active test configuration separately from unavailable historical effective
configuration. A local outbound request establishes what native Codex sends, not
remote service processing, model understanding or the cause of historical refresh.
Self-review: public custom Responses provider configuration permits loopback request
capture; native Code Mode shape must be learned from its actual declared tools.
No second product recorder, dispatcher, scheduler or authoritative result state.

Observed result and closure:

- Codex 0.160.0 native binary SHA-256:
  `112fae7a5a1223e673c8a1791d32338f37df8b527ff1159bb8adac6c4dbf1b4b`.
- Permanent raw-text fixtures retain the original 66,434-byte Knowledge reply and
  84,960-byte discovery reply, exact hashes, original input and declaration lineage.
  Raw reply files are text evidence, not executable configuration; their bytes were
  not normalized to satisfy code naming or formatting checks.
- Both replies match native completed content exactly. The real next HTTP requests
  omit their middle: direct control loses 18,434 / 36,960 bytes; Code Mode loses
  26,434 / 44,960 bytes. Matched retained prefixes/suffixes and omitted-byte hashes
  establish loss; marker text alone is insufficient. Code Mode advertises a default
  10,000-token direct-result budget; no override was supplied.
- This isolates transformation between native tool completion and outbound request.
  It does not isolate an internal native function, reconstruct historical effective
  settings or prove why a prior model requested refresh. Synthetic prompts, a fresh
  local home and a fixed response server are explicit test differences.
- Nine formal tests pass, including six native executions, short UTF-8 controls,
  version refusal, missing-request refusal, exact persisted-request verification and
  literal-marker false-positive protection. Twenty existing evaluation consumer
  tests, fifteen naming tests and scoped lint pass. Static Inspector candidate and
  verification passed at revision 61; the native gate is separately evidenced on
  the existing evaluation node, not inferred from those static owner cases.
- Test-first red was the missing adapter; an initial incorrect scripted call shape
  was rejected and corrected against native advertised custom-tool syntax. Neither
  failure is evidence of a product regression. The passing characterization gate
  proves the observed loss, not a repair of that loss.
- The existing watchdog intentionally stops each owned native group after capture;
  its raw stop receipt remains failed/offline-test-cleanup with no cleanup errors.
  It is not relabeled as a successful product turn or a deadline expiry.
- Production types and browser/model gates are not applicable to this test-only
  adapter change. No production source, refresh, limits, model or 101 was changed.

### Native delivery evidence - 2026-10-21

Status: evidence instrumentation validated; the original delivery cause remains
unresolved until actual native observation. This slice supersedes prior no-model limits only for one authorized
120-second 101 observation after the deterministic gates pass.

Step Execution Card - observe:

- Objective: preserve publicly exposed local-native results for initial discovery
  and Knowledge delivery, distinguishing them from App output and final model input.
- Owner/input/output: existing Design provider receive adapter selects matching
  completed dynamic tool results; Runtime profiler writes selected sanitized output
  through its existing payload sink and trace. Request, thread, turn and call
  identities remain explicit. Native result presence is not model visibility.
- Boundary: local-ai-provider.ts, profiler/recorder.ts, their formal tests and
  execution-flow-proof.test.ts; existing spec, Inspector and flow-contracts.json.
- Retain only public result content for describe_design_apis/read_knowledge. Decode
  structured text before existing redaction. Preserve original text byte count and
  digest separately from sanitized structured content. Missing, null, empty,
  malformed and unsupported content remain distinct; none proves transport loss.
- Public exec/wait output has no reliable child-call relation in the inspected
  interface. Record its explicit uncorrelated/unavailable provenance, not arbitrary
  output that could include other tools, prompts or credentials. Never infer links
  from timing. Actual final model input remains unavailable unless directly exposed.
- Keep refresh, Knowledge rehydrate, normal duplicate references, native settlement,
  cancellation and mutation dispatch unchanged. Diagnostics never replay operations.
- Formal cases: unchanged/changed Unicode and nested output, absent/malformed output,
  interleaved calls, diagnostic sink loss and cancellation. Retain existing recovery
  tests proving no mutations replay. Fake native output verifies recording only.
- Gates: structural Inspector admission, red regression, provider/runtime integration,
  mapped observe proof, focused lint, naming, production types and direct-consumer
  review. No dependency changes, new result store, scheduler or compatibility path.

Step Execution Card - capture-recorded-document:

- Existing run-101 runner accepts an explicit shorter run deadline, validated before
  launch and recorded in run.json. Default canonical scenario remains 600000 ms.
- Reuse existing watchdog from Send, recording, source capture and I/O preservation.
  One authorized run uses 120000 ms; no automatic retry. A forced stop may prevent
  final video export; retain original bytes and report incomplete capture truthfully.
- Boundary: run-101.mjs, existing architecture-protocol.mjs and its formal tests,
  evaluation README and existing capture Inspector flow. No browser/product changes.

DoD: retain the existing nine delivery investigation criteria described in
tmp/provider-gap-audit/delivery-refresh/analysis-and-dod.md as evidence context:
localize each observable boundary, permanent fixtures, actual native consumer
observation, complete usable contracts, valid refresh/context recovery, no replay,
real downstream use, bounded gates, and no closure from fewer rereads alone.
The formal contract above is self-contained and tests must not depend on tmp.
Recording implementation can pass while native transformation diagnosis remains
open. The live report must separate bytes/semantic comparisons, redactions,
observable native results, missing model input and the exact deadline cutoff.

Self-review before implementation: public generated installed protocol declares
optional nullable contentItems on completed dynamicToolCall. Capturing that public
field is feasible without a model. It does not expose the final model request.
No native-context claim or causal explanation is admissible from an echo alone.

Validation before the authorized observation:

- Structural observe admission digest: 197da4c609e0c98187f6b2cb51132f78ccc51c67199897eab48437089a53a6e3.
- Seven provider red regressions failed on absent native payloads, then passed;
  the throwing sink regression failed before failed-receipt handling was added.
- Full provider suite: 202 passed, one pre-existing skipped; the added interleaved
  real-schema/Knowledge reply case also passed. Runtime/Knowledge: 68 passed.
- Capture/browser: 19 passed; deadline/recording/protocol: 11 passed.
- Production App types and Runtime build passed; scoped lint has zero errors and
  five existing console warnings. Naming passed. No refresh implementation changed.
- Inspector source-bound baseline passed at accepted revision 60, attempt
  3743e03e-480a-489c-8f73-4d9b5bba8549. Source digest:
  8a8f3b3ec128e2682852f56dbebfacc1bc25769b5fdf6f42e2d6318063e35eb2.
- Direct-consumer review: native output is diagnostic only; no final batch parsing,
  canonical tool receipt, transport retry, call execution or Knowledge invalidation
  is replaced. Original image-retention and reload changes are preserved.

Authorized 120-second observation completed once:

- Run: tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792577336316.
  Report: delivery-report.md; selected boundary data: delivery-boundary-analysis.json.
- Initial Knowledge (66434 bytes) and discovery (84960 bytes) match native completed
  output exactly by bytes, SHA-256 and JSON. Five selected completions were retained:
  four exact matches and one sanitized-only match with existing schema redactions.
- Twelve tool calls have I/O; 47 payload references verified with no missing files.
  No refresh/rehydrate occurred. The first three acquired routes were subsequently
  used. This observation cannot explain earlier rereads or prove final model input.
- First content at 82.869 s; deadline fired at 120.001 s and owned process shutdown
  completed at 120.120 s. The last lookup requested fill.updateFillsAtIndex; no later
  fill call or final acceptance was observed. No second model run was made.
- Raw video is readable (1920x1080, 124.44 s including setup, five successful seeks),
  but normal export and terminal record-flush receipts are absent after force-stop.
  Full-quality analysis correctly rejected incomplete capture; no completion fabricated.
- Instrumentation slice is complete. The original model-visibility/reread DoD remains
  open at the unexposed native-to-model boundary. Refresh behavior is unchanged.

### Reload transport correction - 2026-10-21

Status: implemented after reviewed contract admission and formal red regressions;
source-bound Inspector and bounded self-review passed.

The saved-document copy reproduced the same closed-page error without inference.
Remote Playwright forwarded a 312,375,259-byte WebSocket frameReceived control
message, exceeding its 256 MiB transport maximum. The transport log explicitly
reports Max payload size exceeded, followed by connection cleanup. Native Chrome
exited with code 0 only after requested cleanup. A small document completed the
same remote recording/export/reload chain. This is a control-transport defect,
not proof of broken canonical persistence or recording export ordering.
Evidence: tmp/reload-chain-document/transport-debug.log, transport-events.json,
events.json; tmp/reload-chain-Tggrel/events.json. Original evidence is unchanged.

Step Execution Card - capture-recorded-document:

- Owner: App evaluation browser adapter, existing recording/capture lifecycle and
  independent deadline worker. Inputs: local browser options, public Chromium
  process identity, saved document URL, viewport and durable receipt.
- Output: original video plus read-only reload receipt/screenshot, bounded browser
  lifecycle events in existing run/replay metadata and explicit cleanup outcomes.
- Replace the local evaluator's remote Playwright control hop with direct local
  launch. Do not forward complete document frames through a second WebSocket,
  raise payload limits, split product documents or retry failed drawing operations.
- Obtain the native browser PID through public SystemInfo.getProcessInfo; retain
  its OS start identity using the existing watchdog identity helper. Existing
  watchdog remains the only force-stop owner, including blocked RPC cleanup.
- Record launch, disconnect, context/page close/crash and cleanup intent separately;
  process presence is an observation, never a fabricated exit code or cause.
- Self-review found one white screenshot despite a valid receipt. The formal
  post-fit pixel test passed alone but failed in the complete evidence suite,
  capturing white instead of the scheduled blue presentation. This supplies the
  missing regression proof: await post-fit browser presentation frames before
  screenshot, under the unchanged capture deadline. No fixed sleep or new state.
- The stalled-close regression also found that a watchdog kill receipt can precede
  native process reaping. Cleanup must await disappearance of the same PID/start
  identity before reporting settlement; termination request alone is insufficient.
- Preserve current root/order/generation/durable comparison, video export, bounded
  capture and generation deadlines. Existing standalone remote-recording helper
  remains valid for independent remote consumers.
- Allowed files: capture-browser.mjs, capture-lifecycle.mjs, run-101.mjs,
  run.mjs, replay-saved-document.mjs, capture browser/reliability tests and
  live-test-deadline.mjs (export its existing identity helper only).
- Spec: evaluation README browser lifecycle contract. Inspector: existing
  design-knowledge-evaluation flow, capture-recorded-document step. Failure owner
  remains this capture step, not canonical document or generation settlement.
- Formal cases: recording export then fresh-context receive above the former
  remote limit; bytes delivered to page intact; root/receipt match; browser remains
  connected; blocked RPC force-stop; normal exit and original failure preservation.
  Tests use generated generic bytes and a local server, not ignored 101 data.
- Gates: admission, red regression on old transport, same green regression on local
  transport, existing capture suites, saved-document copy replay, lint/naming,
  applicable types and bounded direct-consumer review. No model or 101.
- Stop if canonical document changes, another watchdog or dependency is needed.

Self-review: direct local launch is already used by read-only saved-document replay.
The current browser process must remain identity-bound for independent cleanup;
removing BrowserServer cannot remove hard-stop coverage. The recording helper's
context close/saveAs contract works for both public local and remote browsers.
No new persistence, retry, scheduler or compatibility path is required.

Final evidence and review:

- Inspector capture-recorded-document is accepted/passed at flow revision 165,
  source 8cd58cf1ed771abbaa6c7b60a8cb4abe51766be95bc9473664cda71711a1beae.
  Admission used the existing public flow document update API before production
  changes; no unrelated Runtime step was expanded to claim ownership.
- Formal red: tmp/reload-large-frame-red.log reproduces remote control loss using
  generic generated 257 MiB data after recording export. The identical scenario
  passes through the production local launch adapter without document retries.
- Formal red: tmp/reload-evidence-final.log captures white instead of the scheduled
  blue presentation and catches kill-receipt-before-process-exit. Both corrected
  owner boundaries pass in the final full evidence suite.
- Final suite tmp/reload-evidence-final-reviewed.log: 46 capture/protocol/deadline,
  28 frontend provider transport and 19 backend exchange tests passed. Scoped
  lint, naming, App production/proof typecheck, syntax and diff checks passed.
- Final read-only copy replay: tmp/reload-chain-document/final-replay/replay.json
  matched root order, generation 0 and sequence/durableSequence 1213; zero model
  requests, zero page errors, unchanged original evidence and settled browser PID.
  reload.png was inspected and shows the saved drawing rather than a white frame.
- Original run.json SHA-256 remains
  6da5999c4c45e4c074ac048a44e89edd36155fe855d6af3f496981958b1a17d4.
  Temporary services on 3307/4117/4217 were stopped after ownership checks.
- Removed the now-unused ChildProcess-based stopUnsettledProcess helper and its
  replaced test. Local process tests retain already-terminated/no-repeat behavior
  and prove real forced termination; the independent remote video export helper
  remains valid and unchanged. No old launch path remains in the evaluation callers.
- Review covered all three callers, native identity lifetime, original recording
  export, generation deadline wiring, bounded force cleanup, failure preservation,
  post-fit presentation and source capture. No canonical document/render semantics
  changed. Read-only receipt and screenshot checks do not compare every property.

### Preserve submitted inspection pixels - 2026-10-21

Status: implemented and verified after contract admission and formal failing regressions.

Step Execution Card - observe / provider tool image delivery:

- Objective: restore the exact image bytes and order submitted in native tool
  replies, using the existing request-scoped Runtime asset sink.
- Finding: localToolContent separates validated images from text; the provider
  recorder retains only parsed text and imageCount. The sink already supports
  immutable image assets but the App adapter only supplies reference inputs.
- Inputs: validated native contentItems at successful local transport submission,
  request/call identity and content index. No canvas recapture or reconstruction.
- Outputs: existing asset_retained events correlated by callId and contentIndex,
  submitted status, mediaType and immutable asset reference. The existing offline
  analyzer resolves bytes/digests and rejects missing or corrupt image evidence.
- Owner: Runtime observe step with App provider and offline reader adapters.
  Storage/deduplication/lifetime remain createExecutionRecordSink-owned.
- Conditions: archive the exact submitted data URL bytes, no resampling; duplicate
  images reuse assets while retaining every call/order binding. No submitted
  claim before writeProtocol accepts the reply; native/model perception is not
  inferred from a local stream write. Cancelled/suppressed or failed delivery
  cannot manufacture submission evidence. Recording loss is distinct from tool
  outcome and cannot trigger mutation replay or a second capture.
- Contributors: existing content validation, transport, profiler and asset sink.
  Forbidden: new image registry/store, raw base64 in JSON/console, generic binary
  redaction removal, model calls, reload fixes, historical evidence rewriting.
- Boundary: local-ai-provider.ts; recorder allowlisted metadata; existing
  execution-flow proof/provider tests; analyzer and its formal tests. Contracts:
  ai-execution-flow.md Execution recording; observe Inspector and flow-contracts.
- Gates: naming; admission; failing real-provider-adapter/real-sink deterministic
  proof; exact bytes and decoded pixels/order, duplicate identities, invalid
  images, cancellation/transport suppression, storage loss and offline corrupt
  references; direct provider/content and Runtime recording tests; App production
  types, scoped lint, source-bound Inspector baseline and focused self-review.
- Stop: any required runtime/ownership change outside this boundary must be
  reassessed in this plan; no model/101 or reload work in this task.

Self-review: preserving input reference assets alone cannot establish inspection
image delivery. The canonical point is the final native tool reply. A queued
asset reference is not durable evidence: offline readers verify the flushed
file and digest, and missing evidence cannot pass. Reuse the existing sink's
per-request content digest map; do not introduce another cache or retention owner.
The regression uses deterministic image bytes and a fake native process, never
an actual model. Historical image-less records remain unchanged and cannot be
upgraded to complete image evidence. Reports focus on this recording fix.

Validation and bounded self-review:

- Admission accepted review 52a113a94b116f9453e468fcaf8bba6dd92237846c25b88a124d8c32e833f235
  before regression implementation. The red provider proof received three native
  images but found zero retained deliveries; the offline CLI incorrectly accepted
  a positive imageCount without pixels. Both now pass their corrected contracts.
- Final Inspector verify a2f7b2b2-5750-4349-b440-893c6d5d324d passed all 52 cases
  on source 596a243851dafec073f4a9d39aaacea53ee4e2f765af3ef1be5c6ca13ebb180c.
  The added observe.tool-images case was registered through contract review;
  mapping-only review is restricted to selector renames.
- Provider proof compares bytes, SHA-256 and decoded pixels against the actual
  fake-native reply, including two-image order and repeated-asset reuse. Invalid
  image, cancellation and transport failure cannot manufacture retained delivery.
  Storage failure leaves submitted tool results intact and does not repeat captures.
- Direct provider/content tests: 385 passed, one existing skipped. Runtime
  recording/collector tests: 44 passed. Offline analysis/assessment tests: 17 passed.
  App production/proof typecheck, Runtime build, naming and scoped lint passed;
  lint retains three existing console warnings. No model or 101 was run.
- Reviewed the final delivery callback, metadata allowlist, existing sink and
  content producer, offline containment/digest/completeness checks and failure
  paths. Generic binary redaction remains intact; no second storage owner or
  compatibility reconstruction path was introduced.
- Exact local submission is observable; hidden provider perception is not.
  Previously missing historical pixels cannot be recovered by this change.
  Reload behavior remains outside this completed slice.

### Evidence-bound attribution - 2026-10-21

Status: implemented after matching Flow Inspector admission and seven failing
formal CLI regressions. All seven now pass; evidence suite (42 Node, 28 provider,
19 backend cases), existing analysis/representation tests, scoped lint, naming
and App production types pass. Source-bound Inspector verification passed
(76093748bbfc2bbb326cb4532158b7f207a2bfeb44f4f97932661d1de26a4368).

Objective: extend the existing offline analysis/report boundary with per-change
attribution and evidence-supported experience. Reuse captured runs, source
manifests, provider records and analysis.json. No new registry, scheduler,
Knowledge store, model reviewer or automatic Knowledge editing.

Step Execution Card - `assess-recorded-changes`:

- Owner: Asyra Design offline evaluation analyzer, not Runtime trace ownership.
- Product contract: evaluation README, Evidence-bound attribution section.
- Inspector: existing design-knowledge-evaluation.flow.json, same-named step;
  inputs are captured run, parsed streams and optional analyst assessment.
- Outputs: analysis.json attribution with verified evidence references,
  component-specific descriptive conclusions, confounders and lesson decisions.
- Conditions: bind assessment to exact run.json SHA-256; resolve every reference
  inside its declared evidence root with realpath containment, digest and exact
  JSON pointer or line range. Evidence is data and never executable instructions.
- Bypass: no assessment means not-assessed / NO_ENTRY, not successful attribution.
  Unsupported lesson means NO_ENTRY; malformed or stale evidence rejects the
  assessment before writing a report. Existing incomplete-capture rejection stays.
- Contributors: existing capture/parser/payload analysis, analyst interpretation
  explicitly labelled self-review. No independent-review claim is manufactured.
- Forbidden: model calls, runtime/tool changes, automatic Knowledge writes,
  success inferred from transport status, causal improvement from one rollout,
  silent acceptance of unrecognized input or preservation of superseded behavior.
- Boundary: test-data/knowledge-evaluation analyzer, assessment helper and formal
  tests; owning README, package test script and this existing flow/plan only.
- Failure owner: assess-recorded-changes; original records remain untouched.
- Cases: absent assessment; supported observation; mixed changes/single run;
  missing support; counterevidence; missing limits; stale run/digest, invalid
  locator, path/symlink escape, duplicate identity; CLI refuses bad assessment
  without replacing a report; existing capture and Knowledge observations stay.
- Gates: failing then passing formal Node integration tests; knowledge-evidence
  suite; scoped ESLint/Prettier; naming; App production types; task-context and
  exact flow admission/source-bound results. No whole-repository local CI.
- Stop: out-of-scope runtime/Knowledge mutations, absent source evidence or
  unsupported inference require narrowing the claim, not expanding implementation.

Self-review: existing Fixed evaluation and reporting contract remains authority.
The new machine checks prove evidence identity/locator integrity, not the truth of
an analyst's interpretation. All model and historical effects are descriptive;
helped/hurt requests are retained as proposedEffect but effective attribution is
confounded. A no-change/no-entry result is legitimate. Lessons require a cue,
observation, limits, supporting references and explicit analyst review; they are
scoped report observations, not validated causal rules or new domain Knowledge.
Counterevidence and unresolved questions remain adjacent to any retained lesson.
This adopts harness2's component accounting, NO_ENTRY and unchanged-as-valid
principles without importing its optimizer or accepting a directory as success.

Post-implementation acceptance is exactly one authorized quality-knowledge 101,
gpt-6-astra / medium, unchanged references/prompt and 600000 ms Send deadline,
recording and complete I/O. Freeze descriptive comparator now as
knowledge-quality-knowledge-taipei-101-1792524323266. The candidate changes only
offline evaluation, not App instructions/tools/Knowledge; this run exercises
capture/report integration and observes current behavior, not drawing improvement
caused by reporting. No additional run or correction prompt is authorized.

Post-implementation recorded result: run
knowledge-quality-knowledge-taipei-101-1792526483163 completed generation in
482765 ms. All 51 main tool I/O pairs and projected outcomes were audited; two
failed/not-started preparations and one partial capture/binding result remained
explicit. Six successful inspection IDs were reused in binding-only recovery.
Original reload capture failed; a separate existing read-only replay passed with
zero AI POST requests and unchanged original evidence. The ordinary analyzer
refuses the incomplete original capture, including its proposed assessment;
no candidate experience was admitted. Inspection image metadata is preserved,
but individual pixel payloads were not found, so multimodal I/O completeness is
not established. See that run's evaluation-report.md for evidence and limits.
No runtime correction or extra model run followed these observations.

### Pre-push direct-consumer reconciliation - 2026-10-21

The user authorizes pushing the existing completed owner/tool work before the
new evaluation slice. Current-source AI and server gates exposed six stale
consumer expectations. Owner segments apply/settle/compose retain their admitted
contracts: explicit owner mutation receipts, original per-action outcomes and
settled-purpose context. Reconcile only runtime-integration, structural-delivery
and knowledge-handoff tests plus the obsolete aggregation paragraph below;
no production behavior changes or weakened failure oracle. Existing red gate
logs are tmp/evaluation-prepush-ai.log and tmp/evaluation-prepush-server.log.
Verify true receipt fields and original scopes, current Knowledge revision,
compact per-action delivery and existing negative recovery. Rerun affected
suites, types, lint, source-bound Inspector and applicable package gates before
commit/push. Stop if a production mismatch is found; do not relabel it successful.

Review outcome: stale fixtures supplied void or incomplete mutation receipts,
asserted the retired aggregate delivery, and omitted follow-up unavailability.
Tests now preserve each successful owner receipt while asserting partial overall
results when mechanical follow-up is unavailable. Settled-purpose expectations
follow current status semantics. Core test compilation now reads public history
depth and matches computed fields without accessing a private stack. Generated
public API index was regenerated; no production logic changed in this reconciliation.

Validation: AI suite 666 passed plus three corrected cases passed; server suite
1410 passed plus three corrected cases passed (two pre-existing skips). Focused
consumer reruns passed 38 tests, additional material/Core integration six, Core
52, Runtime 45 and direct App consumers 35. Production App/server/proof types,
Core/Preset/Runtime builds, production App build, generated docs, naming and
scoped lint passed (five existing console warnings). Inspector revision 57
baseline c022a482-5455-43d2-910b-15ae295ef44a passes 51 cases. All 2674 live-run
source entries were compared: only tests and emitted test bytes differ, so the
prior real browser material/history/peer/reload evidence remains applicable.
Source-matched evidence does not claim that the historical run independently
validated every owner. No new model call occurred during pre-push verification.

### Viewport-independent material provenance - 2026-10-21

Status: scoped implementation, deterministic verification and self-review complete.

Step Execution Card - apply:

- Objective: pure viewport zoom/pan must not invalidate a prepared material;
  real canonical geometry, ancestry, permission and Fill-binding changes must
  reject before any write. This is a general material contract, not a 101 exception.
- Sources: ai-execution-flow specification, Source-preserving material correction;
  Inspector apply and its prepared-artifact input / execution-receipt output.
- Inputs: owned compiled revision, original request-scoped creation provenance,
  current Core computed geometry, ancestor transforms and canonical Fill targets.
- Outputs: existing application receipt or pre-write rejection identifying the
  mismatched dependency. Numeric diagnostic differences inform the caller but
  never grant a model override of invalid provenance.
- Allowed: existing Core read facades, material application owner, canonical Fill
  mutation and existing transaction/lifetime machinery. Forbidden: viewport-derived
  validity, widened tolerances, a second state store, recapture of stale sources,
  geometry recreation, model calls and mutation replay. Read-only bypass unchanged.
- Boundary: prepared-material-action, its formal tests, existing ai-linear-material
  browser integration, execution-flow proof/mapping and necessary current docs.
  Keep preparation semantics (applied:false), geometry algorithms, persistence and
  Knowledge unchanged. Stop and replan if canonical APIs cannot describe the
  supported source transforms or the formal test cannot reproduce rejection.
- Naming: any diagnostic names are App-owned request-local output; no persisted
  identifiers or new public registry. Replace the old viewport basis outright.
- Tests/DoD: reproduce viewport-only rejection before implementation; prove real
  position/shape/ancestor and Fill-binding invalidation, valid repeated application,
  cancellation/lifetime and no replay. Verify the existing source-revision browser
  route including history, peer and reload; run focused unit/integration tests,
  production types, scoped lint, naming and admitted Inspector baseline.
- Work remains bounded to selected members and their ancestors; retain the existing
  request provenance map and cleanup, with no document scan or extra cache.

Verification results:

- Initial architecture admission: revision 56, review
  `2192f0d73b2a03528d9c383cba1e3db73af2283aa611aaa8a9eba784271f8ba8`.
- Before implementation, the strengthened real-browser source-material case
  rejected after pure zoom while the document digest remained unchanged.
  `tmp/material-provenance-zoom-red.log` retains the exact material geometry/binding
  rejection. The Core/Render integration regression also failed at the first
  application (`tmp/material-provenance-unit-red.log`).
- Removed screen-coordinate basis reads entirely. Existing request provenance now
  reads canonical geometry, point coordinate space and ancestor placements through
  Core. No tolerance was added. Rejections distinguish missing provenance,
  unavailable/editability, geometry and binding; the first differing numeric field
  reports expected/current/delta without publishing whole geometry snapshots.
- Formal App tests: 45 passed, including real Core mutation, viewport independence,
  genuine member/ancestor/dimension changes, Fill rebinding, repeated application,
  abort and existing post-write provenance-loss recovery. Server direct-consumer
  tests: 130 passed. Existing browser source-revision integration: one passed,
  including pure zoom, later pan/repeated application with unchanged document,
  native Fill values, Undo/Redo, peer, durable reload and field reuse for extension.
- Final Inspector admission: revision 57, review
  `94918cd2a0c23bf74cc73f29d07cb68a4b24acf810d2bac65c034f0622549619`.
  Candidate `a1906f72-3c06-4b58-a60d-d576bcf57586` passed all 51 cases.
  Isolated negative `42bbd59c-82e6-480f-bd4c-fe7c04a8e138` reintroduces viewport
  dependence and fails only `apply.material-provenance`. Restored baseline
  `e0dfdc04-27e1-4833-a3a0-5c83ad33370e` passes all 51 cases on the same source
  digest `f8976c6888dc2fae35df4ca64d8c71e0a8d9394b8a2cc98a2ac7757a06f15155`.
- Production App and proof type checks passed; scoped ESLint has zero errors and
  the existing console warning in execution-flow-proof. Naming: 15 passed.
  Scoped review covered the creation capture, dispatcher revision resolution,
  preflight-before-write ordering, post-write retirement and direct consumers.
  Test-managed ports 3317/4127/4227 were released after browser completion.
- Limits: historical provider evidence did not save both provenance snapshots;
  the reproduced mechanism does not establish the exact historical differing
  field. No new model/101 run, Knowledge adoption claim, visual-quality verdict,
  global tolerance change or automatic stale-source recovery was performed.

### Authorized owner-receipt live verification - 2026-10-21

The user authorizes exactly one new Taipei 101 run on the current worktree after
completion of the 31 App-owner result correction. Reuse architecture-101.json,
its exact references/prompt, gpt-6-astra / medium, fresh document and isolated empty
tool library. Existing runner, capture owners and the independent 600000 ms
Send-relative watchdog remain authoritative. No retry or additional model review.

This is execution/evidence work under the existing apply, apply-to-compose and
settle contracts, not a product-contract change. Preserve full provider inputs and
outputs, recording, source snapshot and canonical checkpoint. Compare each observed
owner result with native receipt and flow status, and inspect failed successors for
repeated acknowledged writes. Historical runs are diagnostic context, not matched
causal controls. Untouched tools and unobserved failure paths remain unverified by
this single live run. Do not modify implementation or Knowledge based on this run.

Live result: run `knowledge-quality-knowledge-taipei-101-1792520355122` completed
in 593434 ms with gpt-6-astra / medium, before the 600000 ms cutoff. Recording,
checkpoint, reload, source verification and cleanup completed. Source digest is
`71bed82fd577c28662ab41b81d6f9920ed4e0a78ab69fceadfd2079cc49aa449`.

The 59 App tool calls contain 55 successes and four explicit failed/not-started
receipts; all 118 input/output payload hashes verify and all terminal outcomes match
App progress projections. The changed Fill owner ran three operations over twelve
targets; requested fields match saved canonical Fill records. The other thirty
changed writer definitions and live no-op/partial/post-write-loss paths were not
exercised. Recovery used native Fill edits after material-source rejection, retained
source repair after preparation rejection, and review-only retry after invalid
review input. No acknowledged drawing replay was observed; exact-input duplicate
checks supplement, not replace, those manually traced recovery chains.

Remaining evidence: material provenance was rejected after creation without an
intervening documented drawing mutation; the reason for that mismatch needs a
separate bounded investigation. One provider-native webSearch completed without
an exposed outcome/body, producing the unconfirmed label. Its hidden I/O remains
unavailable; do not claim full upstream visibility. Switching from world-coordinate
material repair to local native gradients is an AI method choice, not proof of
material equivalence. No causal Knowledge or whole-artwork improvement claim.

Detailed new evidence is preserved under the run directory in
`tmp/knowledge-evaluation/`, including `owner-receipt-report.md`,
`owner-receipt-analysis.json`, `analysis.json`, `provider-manifest.json`,
`preserved-provider/`, `recording.webm`, PNGs, checkpoint and source snapshot.

### Non-Core owner result contracts - 2026-10-21

Status: scoped implementation, deterministic verification and self-review complete on 2026-10-21.

Objective: eliminate opaque application outcomes from all 31 currently registered
non-Core writers. Preserve successful results, validated no-ops, partial application,
canonical failure settlement and recovery without replay. This is not a model or
101 run and does not evaluate Knowledge adoption.

Confirmed current-source findings: wrappers discard Core property receipts; position
batches silently omit invalid and unchanged targets; scalar flags conflate those
cases; Vector descriptions equate null/false with no change while the generic
adapter promotes nonempty values without a declared semantic contract. Vector
commit helpers also discard canonical changed evidence. The inventory is six general
element writers, seven Fill writers, three Stroke writers and fifteen Vector writers.

Step Execution Card - apply and its existing apply-to-compose handoff:

- Sources: specification "Non-Core owner result contracts" and Inspector apply.
- Inputs: declared operation arguments, existing owner validation and original
  canonical apply receipts. Transient interaction options retain their existing
  ownership and are not model inputs.
- Outputs: explicit ephemeral mutation receipts retaining the original value,
  acceptedIds, unavailableIds and changed. Accepted identities certify validated
  requests, not changed values. The tool adapter derives complete/no-change/partial/
  failed only from that declared contract. Empty valid input is no-change.
- Scalar refusal must identify the unavailable target. Position batches preserve
  valid unchanged targets and rejected targets separately. Atomic Fill/Stroke
  writes continue to reject invalid input before committing; empty patches must
  validate target identity rather than certify missing targets.
- Vector topology/point owners use their existing validation and commit paths.
  Canonical writes obtain changed from Core; transient editing retains its existing
  computed patch authority. Validate targets before an empty-patch shortcut.
- Direct UI/Feature and composition consumers explicitly consume the retained value
  where they need point/creation identities or prior boolean behavior. Do not let a
  receipt object's truthiness turn refusal into success. This is one current public
  contract, with no legacy return-mode switch or duplicate mutation implementation.
- Allowed contributors: existing common APIs, Core apply receipts, Factory settlement,
  the registered basic-tool adapter and its direct consumers. Forbidden contributors:
  visual scope as a no-op oracle, document-wide rereads, new stores/registries,
  retries, model judgments or fixture-specific branches.
- Scope: the 31 non-Core declarations in basic-design-api-contracts and
  basic-vector-api-contracts; element/apis, element/vector-apis, fills, strokes,
  ephemeral receipt type/helper, basic-api results/actions/contracts, direct callers,
  formal tests and necessary public documentation. Existing Core mutation algorithms,
  history, persistence formats, Knowledge and Current status are excluded.
- Naming: MutationReceipt is App-owned ephemeral API output, not persisted state.
  Reuse acceptedIds/changed from Core and existing unavailable semantics. Changed
  tool contracts require a new revision; no alternate runtime aliases.
- Formal cases: every registered non-Core writer declares semantics; real owners
  distinguish changed, unchanged, unavailable and mixed targets; adapter/native
  output agrees; malformed receipts cannot succeed; cancellation prevents writes;
  failed successor/delivery retains prior results without replay; affected history,
  saved reload and transient consumers retain their current behavior.
- Gates: task context, naming, focused owner and integration tests, native/source
  execution proof with a negative control, focused lint, App production/server/proof
  types and any directly affected package production types. No broad local CI.
- Stop conditions: unresolved owner evidence or consumer behavior must be resolved
  before its implementation slice; changes outside this boundary require replan.

Admission: revision 53 accepted via review
692dd59084e2e235095bf2af6e1950aa4035a559487de33a218cb3dd3e68d83f.
The new mapped contract case failed on pre-implementation source. Fill, Stroke,
element geometry/position and Vector regressions then failed before their owner
changes. The provider-description regression also failed before description repair.
Owner implementation and final integrated verification are complete; evidence and limits follow.
The initial candidate could not admit a missing selector; adding the executable
formal case resolved that admission blocker before production edits.

Direct-consumer follow-up card - apply-to-compose: preserve the original domain
value in UI/Feature callers, share the same declared receipt semantics with actual
provider descriptions, native schemas and recipe aggregation. Same failure owner
and no-replay rule; no new scheduling or persistence. Extend only the directly
changed Pen transient regression, API surface documentation and existing contracts.
Focused gates are direct consumers, real Core/native/history integration and the
source proof. No visual or model-effect claim follows from these gates.

Verification follow-up - apply: wire the permanent real-owner integration case
into the existing App test command, preserving all existing test entries. The
integration covers all 31 declarations through native contracts, real property
writes, partial targets, validated no-ops, known refusal, failed-successor
recovery, Undo/Redo and save/load. The headless gradient case stubs only renderer
coordinate projections; it does not certify browser pixels. Existing source proof
and a non-Core no-op negative scenario remain the Inspector contract gate.

Validated completion:

- All 31 previously opaque writers now declare explicit mutation-receipt semantics.
  The shared adapter no longer guesses application from return-value truthiness.
  Canonical writes preserve original apply evidence; valid unchanged targets,
  unavailable targets and partial results remain distinct. Direct consumers retain
  their original domain values explicitly. No additional mutation state is retained.
- Permanent integration invokes all 31 registered tools through native input/output
  validation and actual App/Core owners. It verifies document effects, native
  success/no-change/partial/failure outcomes, invalid-input and cancellation admission,
  failed-successor recovery without prefix replay, and actual Undo/Redo plus save/load.
  Gradient coordinate projections alone are stubbed for the headless harness.
- Final passing focused suite: 214 App/owner/direct-consumer tests, 406 server
  discovery/invocation/composition/workflow tests and 50 Inspector source cases
  (670 distinct tests/cases; reruns are not added). The integration test is included
  in the existing test:ai command. Existing usage-size regression detected verbose
  descriptions; concise equivalent descriptions passed without changing its budget.
- App production, server and proof typechecks passed. Naming passed all 15 checks.
  Scoped ESLint has zero errors; one existing console warning remains in the source
  proof file. Task context and whitespace checks passed.
- Final admission is Inspector revision 55, review
  77321edac9faa53de8a28734a61b393119fdf9085e6cb823780125620a1cbf75.
  Captured source: deb7414f7d32811b741eae9c369e2a642ff9ef1c904acbb4f07117666e119e1d.
  Baseline b2406cf4-9592-4e70-9288-b7a71880ce23 passed all 50 cases.
  Negative fbeddb30-73ff-4673-aebc-9ba1fbd506d4 failed only
  apply.non-core-owner-results when unchanged was promoted to changed.
  Restored baseline 8378b35d-5a05-4860-920e-a15cda7374a7 passed all 50 on that same source.
- Bounded self-review covered the changed owner returns, their actual commit helpers,
  native schemas and descriptions, direct UI/Feature/composition consumers, canonical
  rejection and no-replay settlement. No geometry, collaboration publication,
  persistence algorithm or scheduler was changed; existing transient/History paths
  are covered without a broad local-CI or performance run.

Limits: a coupled-handle split still reaches the existing unrelated-record guard.
Its owner rejection and settled no-write recovery are tested; the geometry limitation
is not repaired or reclassified as success. A stale segment or Fill identity must be
queried again rather than treated as a current target. Generic runtime failures keep
existing stable error messages; this work does not claim a redesign of error wording.
Transport/rollback uncertainty remains with its existing failure owner and must never
be guessed successful. No new live provider evidence, pixel review, Knowledge adoption
measurement or 101 outcome improvement is claimed. Historical evidence remains unchanged.

### Core owner result contracts - 2026-10-20

Status: scoped implementation and deterministic verification complete on 2026-10-21.
No model or 101 execution; no claim about Knowledge adoption or visual improvement.

Admission: revisions 48 and 49 accepted before their production slices.
Core receipt tests failed first (3 cases), adapter tests failed first (10 cases),
and direct App wrapper tests failed first (2 cases). The additional creation
alignment regression failed before replacing opaque application with an explicit
result-contract failure. Existing partial creation identities remain recoverable.

Validated result:

- All 11 registered Core writers have explicit result contracts. Eight property writers
  return immutable acceptedIds/changed from original apply evidence; element-data
  retains its validated boolean. Creation/move retain their structural contracts.
- Direct App property wrappers no longer discard receipts; Group and Vector consumers
  retain their legal public behavior. Empty values validate targets. Repeated sharing
  really replaces bindings and creates history, so it correctly remains a change.
- Missing/misaligned output fails its contract and retains evidence. Known discarded/
  rolled-back member settlement reaches Runtime; prior successful results survive.
  Failed recovery cannot be swallowed into success or followed by more writes.
- Test-first failures covered Core returns, adapters, creation alignment, missing
  structural receipts, App wrappers, four Vector consumers, known failed-member
  settlement, swallowed rollback failure and the original public failure message.
- Scoped final suites: Core 62, Preset Group 19, Runtime 86, App 102 and server 454
  tests passed (723 distinct scoped tests). Canonical integration includes actual
  publication scope, empty values, invalid targets, cancellation, prefix recovery,
  Undo/Redo and saved-state reload. No ignored evidence is required by these tests.
- Core production-only TypeScript, Preset build/types, Runtime build/types and all
  three App type projects passed. Naming 15/15 passed; focused lint has no errors
  and retains one pre-existing no-console warning in the source proof. Full Core
  test-inclusive TypeScript still has the two pre-existing test typing issues;
  it is not the production-only validation claimed here.
- Final Inspector admission revision 52, source
  `d5fd7f21294aa8eaa6d3e9c745814290596f04a4dbcc5e4b5eb87fba70e95f72`:
  baseline `65bedbd7-5369-4ce3-b5c5-c4ed0749ef4a` passed all 49 mapped cases.
  `lose-core-no-op` (`0300edda-6156-4881-ad2d-b70f8dddbba1`) and
  `lose-core-failure-settlement` (`3c708292-bf8f-4ab2-a4e7-ea46878a99f9`)
  each failed only `apply.core-owner-results` on that same source.
- Bounded review checked the changed owners, direct consumers, native/recipe schema
  selection and failure recovery. It found no remaining in-scope mismatch. No
  parallel state owner, mutation algorithm, document format or model configuration
  was introduced. Genuine transport/rollback uncertainty remains explicit and
  stops writes; it is never promoted to success or a valid no-op.
- Additional Runtime integration checking found two existing Current status assertions
  expecting cleared completed-purpose text. Both fail identically using Runtime and
  transaction source from pre-implementation admission `f4aa17f7-a1d6-4512-b8f4-339bc93e4e5a`.
  Their display behavior/tests are outside this owner-result correction and unchanged.
  This is not a claim that every repository test passes. The discovery delivery
  fixture's missing-checker expectations were corrected to assert partial/completed
  writes plus FOLLOWUP_UNAVAILABLE, instead of incorrectly expecting whole-flow success.

Objective: every registered Core mutation has an explicit owner-result contract;
normal success, valid no-op, partial results and rejected output must not fall
through the opaque-owner unknown-application branch. Do not rename uncertainty
or promote an unreported operation to success. Lost transport or failed rollback
is a separate existing settlement failure; preserve known effects and prohibit replay.

Step Execution Card - `apply`, then `apply-to-compose`:

- Sources: specification "Core owner result contracts" and Inspector apply/compose.
- Inputs: the existing canonical return value, declared input identity path,
  synchronous mutation settlement and canonical publication scope. No document
  rereads, method-name switches, parallel registry, new state or automatic retry.
- Owner inventory: updateElementProperties and patchElementProperties return
  validated ordered element IDs; updatePropertyComponents returns accepted property
  IDs; updateElementData returns changed/unchanged after canonical target validation.
  updateElementPropertyTargets, resetElementPropertyOverrides,
  detachElementPropertyTargets and shareElementPropertyTargets return unique accepted
  element IDs; updateSharedPropertySources returns unique accepted source IDs.
  createElementsInParent and moveElements keep their explicit creation/move contracts.
- Accepted IDs certify fulfilled requests, not changed values. The existing Core
  property owners must return an immutable PropertyMutationReceipt with acceptedIds
  and changed, derived from original Props/Scene apply evidence. Empty input and
  empty apply evidence mean no-change. Include binding/retirement effects and
  unowned source changes; visual scope cannot substitute for mutation evidence.
- Malformed, missing or misaligned output is a result-contract failure with original
  evidence and completed settlement retained when known; never fabricated success
  or an instruction to repeat writes. Creation partial results retain successful IDs.
- Boundary: existing Core property API return construction/types/public export;
  App Core declarations, basic result adapter/schemas and direct consumers/tests.
  Keep Props/Scene preparation/application and mutation/history/save algorithms
  unchanged; use their existing apply evidence, with no extra reads or writes. Add actual Core/Factory integration coverage and mapped
  handoff proof before implementation. No model, 101, external writes or broad CI.
- Direct App consumer: element.updateElementProperties must forward the Core receipt
  instead of discarding it. Its group normalization returns accepted original targets
  while preserving the canonical changed flag. Empty values still validate requested
  targets through Core; empty target input is an inert no-op. The direct patch wrapper
  declares the same result contract. Keep existing group geometry algorithms unchanged.
- Direct typed consumers: GroupOperationCore uses the canonical property receipt
  return type; Vector scaling keeps its boolean accepted-target result and plural
  positioning keeps its accepted-ID list by consuming acceptedIds. No Vector or
  Group geometry/history algorithm changes. Production types detected the stale
  array assumptions; run existing Vector behavior tests with canonical receipts
  before the bounded consumer adjustment.
- Naming: PropertyMutationReceipt is a Core public return type; property-mutation
  and change-flag are result kinds in the existing BasicApiContract; resultIdentityPath belongs to that same declaration. These are
  current tool contract metadata, not persisted document data. Affected definitions
  advance to revision 8; no legacy alias or compatibility branch is introduced.
- Cases: all nine currently opaque Core writers, empty/matching/change cases,
  invalid/missing/stale targets, ordered identities, malformed output, cancellation,
  rollback and partial prefix recovery. Check native input/output/status and recipe
  successor behavior, not just direct helper results. Preserve creation/move paths.
- Gates: naming baseline/final; supported contract admission; formal red then green;
  real-owner integration, complete affected adapter and direct consumer suites,
  production types, focused lint, Inspector source proof and negative control.
- Stop/replan only inside this bounded owner family if original return semantics or
  publication evidence do not support the proposed classification. Never weaken
  existing tests or claim general UI/persistence correctness from receipt tests.

Step Execution Card - `apply-to-compose` known failed-member settlement:

- Review found that prepared-batch execution defaults thrown owner errors to unknown
  even when Factory publishes discarded/rolled-back for that exact member.
- Inputs: existing synchronous Factory transaction status and original error;
  outputs: existing AiTransactionSettlementError and batch failure settlement.
- Boundary: App transaction runner and Runtime prepared-batch failure projection,
  plus permanent real-Core integration and transaction/multi-batch tests. Capture
  exact member status only; no inferred success, new public status, scheduler,
  registry, history algorithm or replay. Preserve original errors at outer settlement.
- A discarded/rolled-back failed member is not-started in the action failure receipt;
  earlier acknowledged actionResults remain available and make the enclosing work
  partial. A committed failed delivery remains completed. Missing status or failed
  rollback remains unresolved and never certifies no writes; stop further writes
  in that existing invocation when rollback fails.
- Gates: admission, real owner missing-target and successful-prefix red/green proof,
  runtime multi-batch and App transaction suites, production types, Inspector proof.
  Stop if the Factory cannot provide exact member evidence; do not guess from errors.

Step Execution Card - `compose` consumer verification:

- Apply slice review: original preparation/application ordering, rollback, publication
  and history algorithms remain unchanged; direct Group/Vector consumers are aligned.
- Inputs/outputs: admitted native usage and actual action receipts; preserve completed
  writes and report partial when required follow-up capability is unavailable.
- Contract: Inspector compose conditions and spec "Owner results and workflow outcomes";
  existing discovery-delivery integration fixture intentionally lacks review_design.
- Boundary: only its formal assertions and existing composition regression tests;
  no new registry, retry, model, production behavior or state. The three workflow/
  operation/invocation owners match the pre-implementation admission snapshot byte for
  byte. Their old success assertions are stale, not a new Core regression.
- Cases/gates: strengthen partial plus completed-action assertions, no duplicate writes,
  successful independent criteria capture, scoped server suite and final Inspector.
  Stop if the underlying owner differs from the admitted partial/no-replay contract.

### Owner result and workflow outcome correction - 2026-10-20

Status: implemented after contract admission and formal failing regressions; bounded
self-review and source-bound verification passed at Inspector revision 47.
This bounded follow-up supersedes earlier completion claims only for the result
handoffs below. Historical reports, evidence and other completed slices remain unchanged.

Objective: distinguish confirmed application, valid no-op, unavailable targets and
unconfirmed owner results through the existing action and native workflow paths.
Fix the canonical result producer before adapting its consumer. Do not add a
registry, state store, scheduler, write retry, model call or subject-specific rule.

Step Execution Card - `apply`:

- Sources: execution specification "Owner results and workflow outcomes";
  Inspector `apply`, execution-receipt routes to compose/inspect/settle.
- Inputs: admitted arguments, original owner results, ordered target identities,
  existing canonical mutation scope and cancellation/settlement observations.
- Outputs: ordered changed/unchanged/unavailable primary-color results; valid
  no-change remains successful; mixed available/unavailable is partial; wholly
  unavailable is failed. Ambiguous void/false/null owner output is unconfirmed,
  never promoted to successful application. Preserve acknowledged effects.
- Boundary: existing Fill/Stroke common APIs and direct scalar consumers;
  basic API declarations/adapters/results; composition action aggregation;
  associated formal owner/action tests. No Framework mutation or history changes.
- Contributors: canonical App/Core APIs, existing mutation executor and registry.
  Forbidden: document rereads to guess success, renderer evidence, tool-name
  exception lists, a parallel receipt store, automatic replay or new compatibility paths.
- Cases: changed, unchanged, unavailable and mixed targets; empty input; invalid
  item/count; missing target; cancellation; owner throw; partial composition edits;
  scalar callers retain boolean semantics. Existing transaction boundaries remain.
- Failure owner: original mutation owner; receipt adapter preserves uncertainty.
  No bypass for document mutation; read and transient receipts keep their contracts.

Step Execution Card - `compose` (start only after the apply slice review):

- Inputs: canonical action receipts, existing follow-up check/capture results,
  completed part receipts and explicit deferred-inspection requests.
- Outputs: complete only when requested execution/follow-up delivery completed;
  follow-up failure is partial with completed write settlement and usable recovery
  evidence. Negative visual/mechanical judgments remain successfully delivered
  results, not transport failures. Explicit deferral remains valid.
- Boundary: local operation/workflow/invocation owners and direct provider tests;
  execution-proof mapping and existing settled-result consumers. Preserve actual
  partial/unknown settlement and current cancellation ownership.
- Cases: immediate capture unavailable, measurement transport failure, valid
  negative check, deferred capture, mixed parts, child failure, compact/full parity,
  recovery by checks only, cancellation and no duplicate mutation dispatch.
- Contributors: registered output contracts and existing receipt/check owners.
  Forbidden: inferred visual approval, status-only re-execution, replay of completed
  parts, unconditional success from transport completion, new runtime state.
- Failure owner: existing invocation boundary; partial output remains excluded
  from successful recipe bindings. No bypass for failed required follow-up.

Feasibility: existing status-items receipts, toolOutcome status/settlement, partial
schemas, mutation scopes and retained inspection recovery supply the necessary
mechanisms. Primary-color plural owners already determine missing versus equal
values before one canonical patch; expose that result instead of discarding it.
The workflow already retains inspectionIssues/measurementIssues; propagate their
meaning without changing writes or making domain judgments into execution errors.

Gates: naming baseline and completion; supported Inspector contract admission;
formal failing regressions before production edits; complete affected owner/action,
workflow/invocation suites, registered execution proof and direct status consumers;
App/server/proof production types and focused lint; current source-bound Inspector
verification and bounded diff/upstream/downstream/failure-path review.
Tests must exercise real App owners and dispatch/output conversion, not only helper
calls. No model/101, broad local CI, package upgrades, push or plan closeout.

Discovery is frozen to the audited result branches and their direct consumers.
Exclude schema delivery, DOMRect serialization, material source rebinding, Knowledge,
visual criteria and unrelated rollback internals. Stop/replan within this scope if
formal evidence contradicts the owner boundary; never weaken a gate to pass.

Implementation review:

- Primary Fill/Stroke owners expose their existing changed/unchanged/unavailable
  decisions without changing canonical patch or transaction boundaries. Scalar UI
  consumers retain boolean results. Empty/unchanged typed results remain valid.
- Opaque void/false/null/empty-array owner results are unknown, not invented no-ops;
  executor-confirmed settlement and actual scope remain distinct. Creation count
  mismatches preserve returned IDs without certifying complete creation. Output
  schemas explicitly admit these unknown receipts.
- Required follow-up delivery failures propagate through single and ordered workflow
  receipts, native invocation and recipe eligibility. Domain findings remain separate.
  Recovery uses retained identities and checks only; no automatic mutation replay.
- Removed obsolete boolean-items interpretation and valueless successful-count
  compaction, including consumers of that superseded aggregate evidence.
- Direct composition fixtures now provide actual mutation settlement callbacks and
  review evidence, use current dependency revisions and aligned creation inputs.
  Their successful repair-loop case uses an explicitly reporting owner stub; the
  added void-owner case must stop with unknown/completed and one mutation call.
  This is not proof that opaque Core owners now provide semantic per-target results.
- No Framework history/publication/persistence algorithm changed. Formal App owner
  tests cover the same canonical patch and transaction call paths; this slice makes
  no new browser Undo/Redo, collaboration or save/reload claim.

Validation:

- Admission preceded production changes: accepted contract review
  `591d7bf474b44eeb9f326f5910baf865e3bed7ce7aa7b216d24d22114ba61e64`,
  followed by removal of the conflicting successful-compaction clause in review
  `bfd0bae5ed9e597309662a58ca3e4f902561ccafe9b157cfb359ed0a9a8ad41a`.
- Formal regressions failed before their corrections: owner missing-target and
  ambiguous-result classification, incomplete follow-up, creation alignment,
  settlement preservation, domain parts, obsolete aggregate evidence, unknown
  output-schema admission and provider-facing compact guidance.
- Affected owner/action suites: 122 passed. Workflow/invocation/host/provider suites:
  525 passed, one existing skipped case. Direct contract/status/recipe/library suites:
  102 passed. Registered execution proof: 48 passed. Repeated runs are not added to
  these counts. The retained-receipt test still exercises 5,000 ordered acknowledgements;
  recorded discovery byte-budget assertions remain unchanged and pass.
- App, server and proof production types passed. Scoped lint has no errors; two
  pre-existing console warnings remain outside this change. Naming: 15 passed.
- Final candidate `907f84ce-0ff9-4f4c-b289-6f302ca2db38` and accepted review
  `abba8fc9e37d46fd2a3ec239205a4bf4124fbe184be10e44c9b60b7daf95cec8`
  bind the new formal handoff case at revision 47. Negative run
  `0fc3a079-044c-408d-8da3-7328bb7bbf3d` fails exactly
  `compose.owner-result-handoff` when owner unavailability is ignored.
  Final baseline `9c7423db-bd08-4a61-99b2-31361ac74d49` passes all 48 cases on
  source `62d1bf701505d4fe9fc167b004132defc77d1fa4207a60b43f9105d048bca5d0`.
- Bounded self-review checked current production changes against the preimplementation
  captured source, all direct plural-color consumers, output schemas and versions,
  compact/full parity, required-check failure, cancellation and check-only/suffix
  recovery. No new runtime state, dependency, replay path or Framework mutation
  algorithm was introduced. Existing user work and historical evidence are preserved.

Known limitation: application remains unconfirmed for owners without a semantic
result contract, even when execution has settled. This prevents false success but
can stop a recipe. A passing geometry check does not retroactively certify the
requested operation. Model usage, Knowledge adoption and visual quality are untested.

### General multiscale evidence follow-up

Status: implemented; deterministic regression, direct-consumer checks and source-bound
Inspector verification passed. Model judgment and outcome improvements remain untested.

Validation (2026-10-20):

- Initial contract admission: review
  `dfa0767c2e5ba9917bdf138641586f24c99a02324bbde33eebb259526a0f8024`,
  revision 43, before production implementation.
- Test-first: the mapped `inspect.regional-units` execution proof failed on the
  original mixed-image veto, then passed after its removal. The generic integration
  exercises real native capture/bind/record/read entry points with a deterministic
  browser receipt stub, not model output or rendered-pixel assertions.
- Expanded the existing registered case; no duplicate mapping, registry or state.
  Verified exact signed dependencies, either-image expiry, local-pass preservation,
  whole-view pending/final acceptance, failed capture recovery, cancellation,
  unknown/tampered evidence and explicit revision-bound scope replacement.
- Focused server suites: 396 passed (review suite rerun after descriptor revision
  expectation update); provider/check-store suites: 211 passed, one pre-existing
  skipped test; browser inspection/evidence suites: 36 passed; execution proof:
  47 passed. Production App/server/flow-proof types passed. Naming: 15 passed.
  Focused lint has no errors and one unchanged console warning in the existing
  execution proof. Logs: `tmp/multiscale-evidence-work/`.
- Source-bound Inspector verify `81f77444-0a4b-40a7-89c9-3489d85bd7cf`
  passed at mapping revision 44. Final candidate
  `e6f77c26-6a79-429f-84ae-f5f02cc38aaa` also passed and confirmed the same
  captured source `1dbdd22ea510e2a391a62054a2ddec609e9a1ed1b5c83c576d458e37dfb66956`.
  Historical evidence remains unchanged.
- Self-review: only the mixed-scope veto was removed. Signed binding, dependency
  registration/invalidation, explicit supersession and final coverage retain their
  existing owners. App advice and tool description agree; tool/advice revisions
  advance to 13/17. No drawing writes, persistence or Undo/Redo implementation
  changed. No model/101 run and no claim of improved visual judgment or Knowledge
  adoption.

Objective: support a visual conclusion that genuinely needs an overview and a
local image of the same target, while retaining independent local passes and the
separate whole-result obligation. This is general evidence behavior, not a
subject-specific drawing method or a change to aesthetic judgment ownership.

Step Execution Card - `inspect`:

- Sources: specification sections "Scoped visual check units" and "Declared regional
  acceptance coverage"; Inspector `inspect` ownership and boundary.
- Inputs: declared criteria/units, explicit per-check inspection IDs, current source
  receipts, existing bindings and exact supersession revision/reason.
- Outputs: unchanged capture/bind/record replies, signed complete dependencies,
  accumulated local verdicts and independently derived whole-request acceptance.
- Conditions: cited images are necessary evidence, not an inherited batch list.
  Same-target overview plus crop is valid. Every cited image remains a dependency;
  broad evidence deliberately has broad invalidation. Independent local checks cite
  only their own evidence. Capture/binding never judges appearance.
- Preserve: exact signatures, stale/cancelled/invalid evidence rejection, explicit
  scope change, partial recovery without write replay, independent local passes,
  declared whole-view coverage and final settlement. No auxiliary-image state.
- Owner and failure owner: App review and existing browser evidence validation.
  Contributors: registered tools, existing check store and main-agent judgments.
  Forbidden: new registry/cache/state, inferred visual sufficiency, document writes
  during recovery, fixture-specific exceptions or model execution.
- Boundary: local-design-review.ts; direct App prompt/Knowledge; existing review,
  operation/provider integration and execution-proof tests; spec/Inspector/mapping.
  No new persisted or wire identities. Test names describe generic behavior.
- Feasibility: existing bindings sign all selected images and the check store already
  invalidates their union. The blanket mixed-image rejection precedes scope handling;
  remove that rejection without replacing dependency or currency ownership.
  Review final coverage to prevent a regional overview replacing whole acceptance.
- Cases: local-only isolation; same-target multiscale capture/bind/record; either
  dependency becoming stale; same-scope recapture; explicit scope replacement;
  missing/foreign/tampered evidence; cancellation/partial capture; local pass with
  whole pending; complete final acceptance followed by invalidation and recovery.
- Gates: naming, test-first red/green formal review and native-operation integration,
  direct provider/Knowledge consumers, production types, focused lint, Inspector
  admission and source-bound proof. No model, 101, unrelated local CI or new renderer.
- Stop: necessary new owner/state, unsatisfied final coverage, unexplained loss of
  independent passes, or required gates failing outside the authorized boundary.

Minimal sequence: reconcile this contract and Inspector, admit the mapping, add a
failing generic regression through the registered tool owner, remove only the mixed
scope veto, replace superseded instructions/tests, then run the affected complete
suites and bounded self-review. Existing historical fixtures remain unchanged.
A supersession reason is not proof of visual sufficiency. The primary agent must
retain the original obligation and judge whether revised evidence can support it.

### Authorized multiscale live follow-up - 2026-10-20

One subsequent user-authorized 101 run was executed with video and preserved
provider I/O: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792497475941/`.
The 600000 ms watchdog stopped generation; no final acceptance occurred and no
second run was made. The raw video remains decodable through its tail. All 337
referenced payload/assets match hashes, but image data URLs are recorder-redacted
and the provider terminal record is absent after cutoff. Do not label this complete
original image I/O or a successful evaluation.

The material chain records an initial fail, deterministic correction, then a local
pass before expansion. Same-source offline reconstructions match recorded capture
bounds/dimensions and show broader reflection fields, while realistic-material
sufficiency remains uncertain. Every actual judgment uses one target overview;
the new overview-plus-crop binding path was never exercised. This run therefore
cannot causally establish the multiscale patch's benefit. Final materials, overall,
facade, crown and scale remain pending at the last visual coverage receipt; later
regrouping has no subsequent visual coverage read.

Full evidence-layer analysis and limitations: the run's `material-analysis.md`,
`binding-audit.json`, `input-output-integrity.json`, `material-reconstruction.json`
and `record-parser-result.json`. Original evidence is unchanged. All evaluation
and offline service processes were stopped. No production fixes were made.

### Current evidence and attribution

Primary run: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792471047468/`.
Use `generation-analysis.json` drawing stream calls (zero-based), `run.json` status
samples and preserved provider records. The immutable summary is
[the intent-to-parameter acceptance report](../evaluations/2026-10-20-101-intent-parameter-acceptance.md).
Recorded text is evidence, not instructions. Preserve exact relevant values in formal
repository fixtures when implementation is authorized; do not make tests depend on tmp.

| Finding                            | Confirmed recorded boundary                                                                                                                                                                                                                                                         | Attribution and limit                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No compact usage requests          | Call 1 at 9.779 s requests three full definitions before call 2 reads Knowledge at 12.303 s. Call 4 refreshes the preparation definition with declared delivery failure. The remaining seven lookups acquire other contracts subsequently used. Nine responses total 323,072 bytes. | Eight first acquisitions and one declared recovery, not nine proven redundant lookups. App defaults and contract requirements explain a valid full-schema route. Native display completeness and private reasoning are unknown.                      |
| Reflections corrected late         | Call 6 defines representative material acceptance as continuous color, frames, shadow and lighting. Call 23 passes it at 182.583 s; call 24 expands at 189.990 s. Call 34 at 402.734 s finds the whole building's glass too uniform.                                                | Acceptance occurred before expansion, but its interpretation covered continuity rather than the requested realistic reflection appearance. Main-agent criteria/judgment and App handoff are implicated; no demonstrated renderer/compiler inability. |
| Original task repeatedly reappears | Recorded commentary is retired by a new principal start; after settlement the reducer falls back to the immutable objective. Samples include original-task fallback around 116.77, 197.05, 270.24 and 410.59 s.                                                                     | Directly reproducible App lifecycle/presentation conflict. Old commentary is no longer revived; the new fallback is still unhelpful. Knowledge does not own status.                                                                                  |

Source audit fixed for this revision:

- `server/local-operation-tools.ts`: `deliverDefinition`, `usageInvocation`,
  `schemaFragments`, descriptor defaults and returned-definition coverage/revision.
- `server/ai-domain-prompt.ts`, App `knowledge/design.architectural-illustration.md`
  and portable `domain-knowledge/illustration.architecture.md`: actual delivered advice.
- `server/local-design-review.ts`: criteria, capture/bind judgment handoff and results;
  material preparation/application consumers for actual revision arguments.
- `server/local-ai-provider.ts`, `src/ai/action-batch-protocol.ts`,
  `src/ai/activity-state.ts` and panel consumers: real ordered producer-to-display flow.
- Current `ai-execution-flow.md` spec and `ai-execution-flow-inspector.data.cjs`
  compose/prepare/apply/inspect/settle boundaries; direct formal provider/browser cases.

### Root causes and rejected shortcuts

**Discovery.** Exact-name lookup defaults to full. Both delivered App instruction
sources permit full definitions when executable contracts are missing; usage is
explicitly navigation without executable validation schemas. Usage only publishes
owner examples that pass the canonical schema. The run's first preparation schema
contains roughly 52,264 JSON characters and no owner example; its related initial
criteria/reference schemas also have none. Therefore the previous improvement to
example delivery does not automatically help these first high-level acquisitions.
A zero-usage trajectory is not itself incorrect. Changing the default to usage would
force another query when execution requires the full contract and can make matters
worse. A full reply in saved backend I/O does not disprove the stated delivery failure.
The delivered App method is 50,521 characters versus 12,836 for portable advice;
attention burden is plausible but not an observed causal measurement.

**Material judgment.** Portable advice already says window grids are not reflection,
to establish large light/dark relationships before detail, and to evaluate the actual
composite material. App guidance already requests representative review. Calls 10,
24 and 25 use the same vertical world field from (0,0,0) to (0,0,50800); continuity
works, but that chosen height grade is not proof of convincing spatial reflections.
The representative pass cites joined platforms, continuous glass tone, frames and
face lighting. The later overall failure explicitly requests large continuous
reflection variation. Six revision/apply pairs then succeed using 3,975 input bytes
and 0.793 s App execution. The correction mechanism is available and fast; no claim
that tools spent minutes computing reflection is supported.

The concrete review handoff gap is that capture/bind returns criterion identities,
versions, evidence bindings and status/evidence slots without the selected criterion's
requirement/description and method context. Correct IDs do not remind the judge of
what must actually be assessed. This can be fixed deterministically; it does not prove
that absent text caused the specific model judgment. A tool cannot guarantee visual
realism by validating an evidence sentence or adding more checks.

**Status at the initial audit (superseded by Issue 3 below).** The delivered main
prompt promised cross-call commentary retention while the reducer retired it on
principal dispatch. Inspector settle contained BOTH the old cross-invocation retention
rule and the new permanent-retirement rule; it also contained both no-original-objective
fallback and objective-as-context descriptions. The prior closeout claim that all
superseded clauses were removed was too broad and is withdrawn in this active plan.
A successful reducer test did not prove the delivered prompt, exact Inspector contract
and visible lifecycle agreed. The original objective then won when no live purpose
existed. Native commentary supplies no reliable semantic-stage end/binding event.
Keeping the last text forever, adding a TTL, renaming a generic label or guessing
private reasoning would recreate stale activity.

### Proposed order and admission boundary

Only after implementation authorization, reconcile each issue's thin spec, exact
Inspector owner, executable cases and DoD before production edits. Keep one issue
active at a time: **1 discovery delivery; 2 representative judgment handoff;
3 truthful activity projection**. No cross-issue patching between failed tests.
Every issue starts with its own Step Execution Card and test-first proof for a
confirmed mismatch. Existing correct behavior gets preservation tests, not a
fabricated red test. Admission must inspect assembled provider inputs and downstream
results, not just an isolated helper. Issue 1 admission and completion evidence are
recorded below; this does not admit Issues 2 or 3.

### Issue 1 execution card - Native usage to real invocation

Owner: `ai-execution-flow` / `compose`. Spec: **Actionable usage projection** and
**Discovery**; preserve prepare/apply/inspect/settle semantics. Inputs: current
registered descriptors, exact selectors/view/paths and request-local delivery state.
Outputs: validated owner examples through their real invocation envelope, traversable
canonical schema pointers, complete full contracts and scope-preserving recovery.
Bypasses: direct known-contract invocation and first-use full retrieval remain valid.
Failure owner: compose rejects invalid lookup scopes without drawing/replay; actual
invocation retains its preparation/application and cancellation failure owners.

Confirmed pre-implementation finding: the preparation owner had six formally exercised
examples, but embeds them in description prose. Its schema has none, so usage cannot
publish one. Criteria likewise has a canonical example in prose. Move these existing
examples into descriptor `inputSchema.examples`, remove duplicate prose serialization,
and use the existing usage validator/route wrapper. Do not author alternative domain
examples or modify material acceptance. Inspect local `$defs` navigation so the returned
pointers can reach existing node fields without expanding recursive schemas.

Allowed boundaries: existing compose files `local-operation-tools.ts`,
`local-design-tools.ts`, `local-design-workflow.ts`, descriptor-only
`local-design-review.ts`, `design-preparation-examples.ts`, `operation-input-schema.ts`,
`ai-domain-prompt.ts`,
`local-knowledge.ts`, the App method's retrieval section, current spec/Inspector/mapping,
and their existing formal tests, including App package registration of the new
formal integration suite. Add a saved discovery-input fixture and a deterministic
native-delivery integration test under server/**tests**. Runtime, property/history,
material/compiler behavior, visual judgments and activity projection are excluded.
No new public tool or persisted identity. Existing canonical examples and schema
pointers own identity; the changed App method gets a new content revision.

Gates: naming baseline; supported Inspector mapping admission before production;
red regression for actual high-level usage example/fragment availability; provider
wire -> usage/full/scoped-recovery -> real preparation/criteria/workflow invocation,
canonical output validation, invalid-input/no-write and cancellation/retry; existing
operation, schema, preparation/workflow, provider, Knowledge and execution-proof suites;
production server types and focused lint; bounded diff/direct-consumer self-review.
No live provider, browser drawing run, 101, whole local CI or push. The provider fake
only replaces native transport; real owner code must process returned tool arguments.
If a new registration/ownership requirement cannot fit this slice, replan the bounded
issue before editing. Do not start the material-judgment or status fixes.

#### Independent takeover verification - 2026-10-20

The current checkout is `c187aaf19de1867850d9b704a087c723ea420beb` on the selected
branch. All 49 pre-existing dirty entries are preserved. Nine discovery inputs and
outputs match their preserved provider payload SHA-256 values and parsed analysis.
The preparation, review, discovery and prompt owners match the recorded source.
Full retrieval followed by declared delivery recovery is observed; redundant model
queries or incomplete native display are not established by that evidence.

The exported review JSON says pending, but the authoritative Inspector service
records review `e9b809cc465ffaff65ffb7ed4568db49acacbfc5a9d800b23d4e1055e5129ca8`
as accepted at revision 35. All 827 files captured by candidate attempt
`e66ba740-6ee9-427e-95a2-b11e193fc053` still match disk; its 47 passing cases remain
baseline evidence only. New usage-to-owner regression coverage is still required.
The execution card and Issue 1 boundary are retained. Discovery is frozen
to those owners, their direct consumers, saved discovery payloads and the named
gates. No material judgment, activity, canonical mutation or persistence change is
part of this slice. Request-local delivery tracking remains the existing owner;
no cache or new registry is introduced. Direct-consumer review also requires common
examples to remain at their union scope in native schema conversion, rather than
being advertised inside incompatible alternatives. This preserves all admission
constraints. Stop after Issue 1 validation and review.

#### Issue 1 - Deliver the information actually needed for an invocation

Owner: existing Inspector **compose**, registry definitions and provider delivery.
Input: exact native name or semantic operation, view/paths, revision and current
request delivery coverage. Output: canonical navigation, requested schema fragments
or full executable contract, with truthful route/example availability and recovery.
Failure owner: existing discovery validation/delivery path, never mutation replay.

Implementation boundary after admission: `local-operation-tools.ts`, canonical
owner descriptors for the actually used high-level tools, `ai-domain-prompt.ts`,
App architectural guidance, exact compose spec/Inspector and their provider tests.
Portable Knowledge does not receive tool names or become required for invocation.

1. Keep full exact-lookup defaults and explicit full composition acquisition. Distinguish
   route-only, missing-field and new executable-contract needs in one concise App rule.
   Do not demand usage first for every call or measure success by usage-call count.
2. Provide canonical, schema-valid owner examples for the evidenced preparation and
   criteria routes where a meaningful minimal example exists. Publish through existing
   usage projection and actual execution wrapper. Use illustrative identities explicitly;
   never invent a live handle or substitute examples for schema constraints.
3. Surface the existing precise schemaPaths needed by the chosen example/route through
   canonical pointers; retain required ancestor constraints, unions and referenced schemas.
   Reuse the current projection; no parallel schema or arbitrary truncation. Where a
   selected union still needs broad information, say so and permit full retrieval.
4. Consolidate duplicated discovery instructions, remove stale root-only pointer wording,
   preserve operations/native-name distinction and match delivered content revisions.
   Recovery explicitly retains requested view/paths/revision; full delivery recovery
   remains valid when that was the lost contract.

Required scenario proof: delivered prompt -> actual provider descriptor response ->
parsed example/selected fields -> existing native/batch dispatcher -> canonical outcome.
Cover first full acquisition, known-route usage, field correction, repeated lookup,
namespace ambiguity, revision change, invalid/missing examples, malformed/missing paths,
local schema references, transport/context recovery, cancellation and fresh requests.
Exercise the actual high-level contracts from the recording, not only small basic APIs.
Assert complete required constraints and error behavior for valid/invalid inputs. Measure
serialized bytes and query roundtrips for each route; do not assert a universal reduction
where the user genuinely needs the complete schema. Reuse existing definition lifetime;
no new cache. Existing material/anchor/lease consumers must continue to work without
Knowledge or usage preflight.

DoD: no contradictory acquisition advice; published examples execute through the stated
route; focused fragments preserve constraints; full and scoped recovery still work.
Whether a model chooses compact delivery is explicitly unverified without a later run.

#### Issue 1 deterministic completion - 2026-10-20

**Confirmed evidence.** All nine discovery input/output payloads were checked against
preserved provider events and their hashes. The first complete acquisition and the
later declared delivery-failure recovery are valid observed routes, not evidence of
redundant queries. Formal red tests separately established missing preparation/criteria
usage examples, absent local-definition/dictionary field navigation, and common examples
being attached to incompatible native union branches after moving them into schemas.
Backend payload completeness does not establish native display completeness or retention.

**Implementation and removals.** Existing preparation and criteria examples now live
in their canonical input schemas and are validated/wrapped by existing usage projection.
Removed their duplicate serialized description examples and obsolete root-only navigation
wording. Navigation traverses stored definitions and dictionary schemas without expanding
recursive references. Native conversion retains common examples at their whole-union
scope and preserves admission constraints. The App method revision is 16; portable
Knowledge, model/effort, mutation ownership, material judgments and status are unchanged.
The permanent saved-input fixture and integration suite are registered in the existing
server test harness. The existing discovery proof maps its actual descriptor/conversion
owners; no new registry, scheduler, cache, result store or compatibility route was added.

**Verification.** Formal tests exercise provider wire declarations and recovered full
payloads; usage to real preparation, criteria and combined dispatch; the actual prepared
application action with an injected creation adapter; invalid input, cancellation,
cross-request expired artifacts and fresh retry; complete schemas, required/conditional
ancestor constraints and local reference closure; repeated lookup and scope-preserving
recovery. Existing suites cover namespace ambiguity, descriptor revisions, invalid/missing
examples, malformed pointers, partial outcomes and recovery without replaying writes.
The high-level recovery sequence performs one compile and one application; six deliberate
discovery roundtrips cover full acquisition, two usage reads, two scoped recoveries and
full recovery. Serialized usage is smaller than the corresponding full replies in those
tested routes; this is not a universal payload or model-time claim.

- Server regression: 11 files, 664 passed, one existing external-protocol test skipped
  because `LOCAL_AI_PROTOCOL_EXECUTABLE` was unset; no live provider was authorized
  at that Issue 1 checkpoint. The later authorized 101 run is recorded separately.
- Action consumers: 47 passed under their required jsdom environment. An initial Node
  invocation failed on missing `window`; no production workaround was introduced.
- Final added/strengthened provider and discovery handoffs: 8 passed. Remaining tests
  omitted by the focused selector are not reported as executed in that focused run.
- Production server types and proof types passed. Focused lint has zero errors and two
  unchanged console warnings. Naming: 15 passed. Inspector structure: two passed.
- Final accepted Inspector revision: **38**. Candidate
  `23c7c549-309e-4257-9836-0ea80148d9f5` and accepted verification
  `2d9d7c35-dd23-47de-9c08-27ddea78ead6` both pass all 47 registered cases on source
  `f69fd5dc1dc488726fe7fcd0c2fff308245ab7e8fd587c5fe7379bb4ee5a6fd4`.
  Final review: `6280b3da1f28352d4933a2259134771375936f6055733b72791641eec396d1fd`.
- Local logs: `tmp/issue1-independent-final-regression.log`,
  `tmp/issue1-independent-browser-consumers.log`,
  `tmp/issue1-independent-final-handoffs.log`,
  `tmp/issue1-independent-final-verification.log`, and matching types/lint/naming logs.

**Bounded review and limits.** Reviewed the changed descriptors, canonical schema to
native projection, usage invocation envelopes, schema navigation, request-local delivery
state and direct preparation/application consumers. Preserve first-use full retrieval,
direct known-contract calls and independent preparation without Knowledge. Definition
recovery executes no document mutation. Mutation, Undo/Redo, collaboration and persistence
owners were not changed; these results do not claim a new live browser/save/reload proof.
The fake provider replaces native transport; the application integration injects its
creation adapter, so model choices and rendered quality remain outside this evidence.
No model/101 run, external AI review, push, PR, automation or goal was started. No
Knowledge adoption, artistic quality or end-to-end model efficiency improvement is
established. This was the Issue 1 stopping point. Subsequent user authorization permits Issues 2
and 3 followed by one guarded 101 run; it does not change this historical validation.

#### Issue 2 execution card - inspect acceptance handoff

- Owner/failure owner: `inspect`; spec `Evidence and completion`, Inspector inspect
  conditions and implementation boundary. Inputs are the existing canonical plan,
  selected criterion/unit identities and current inspection bindings.
- Output: informational `acceptanceContext` beside `next.arguments`, containing
  shared method, current requirement revision and selected requirement/description/unit.
  No extra stored state, judgment, mutation, dependency or readiness claim.
- Conditions: a plan exists and images are delivered; bound selections carry exact
  current meaning. Unbound recovery remains explicitly incomplete; read-only advice bypasses.
- Allowed contributors: existing review owner and explicit main-agent judgments.
  Forbidden: model calls in tools, inferred realism passes and copied criterion stores.
- Boundary: local-design-review, ai-domain-prompt and their existing formal tests;
  spec/Inspector and this plan only. Material and document owners remain unchanged.
- Proof: capture/bind/retry context, strict output schema, executable unchanged arguments,
  partial/cancel/stale handling, retained passes; existing material/history/reload and
  provider integrations. Run naming, focused tests, production types, lint and Inspector.
- Stop: missing owner contract, a required change outside this boundary, or failed gates;
  reconcile in this plan before advancing. Do not advance settle before inspect review.

#### Issue 2 - Carry the actual acceptance meaning into representative judgment

Owner: Inspector **inspect**, existing review plan, capture/bind, results and App method.
Prepare/apply consume existing accepted evidence and exact material provenance; they do
not judge appearance. Input: current criterion definitions, selected units, method,
request/revision, exact capture dependencies and explicit main-agent judgments.
Output: selected acceptance context beside unchanged executable bound arguments;
recorded judgments remain scoped and revision-checked. Failure owner: existing review
binding/freshness validation. No automatic visual pass or additional model.

Implementation boundary after admission: `local-design-review.ts`, actual review tool
schema/serializer and capture/bind consumers, App architectural guidance, inspect
spec/Inspector and permanent provider/browser scenarios. Reuse existing material APIs.

1. Consolidate App representative guidance: for a requested realistic reflective material,
   assess its visible material/reflection character as well as geometric joins, color
   continuity and lighting before repeating it. A height grade or a seam-free join alone
   does not settle reflection quality. Flat or deliberately graphic styles remain valid;
   no compulsory gradient shape, reflection count, review quota or 101-specific rule.
2. At capture/bind/retry handoff, project the selected criterion's current requirement,
   description, unit and relevant method next to its binding. Reuse the canonical plan;
   no copied mutable criterion store. One shared method context per response is sufficient.
   Clearly separate informational acceptance context from `next.arguments`; the caller
   supplies judgments only in the existing supported fields.
3. Bind meaning to the same requirement revision as the executable judgment. A changed
   criterion requires current binding; canceled/incomplete captures do not claim ready
   visual evidence. Return recoverable next actions without clearing unrelated passes.
   Preserve current dependency-specific invalidation; displaying context adds no new
   document/viewport dependency and cannot broaden result invalidation.
4. Keep the main AI's visual judgment authoritative. A mechanical check may confirm
   valid scope, binding and parameters, but not whether prose proves realism. Do not
   add a mandatory Knowledge acknowledgment or a second aesthetic reviewer.

Required proof: saved criteria -> real capture/bind/provider response -> main-agent-shaped
judgment -> existing result accumulation -> material-only revision/apply -> affected
recapture -> final completion and save/reload. Use controlled judgments to prove the
contract, not to simulate improved AI taste. Cover representative and whole views,
multiple selected criteria/units, retries, criterion revision, canceled/partial captures,
stale artifacts, invalid ownership, unrelated pass preservation and failed persistence.
Verify material correction preserves geometry, unaffected owners and explicit sharing,
including Undo/Redo, collaboration and reloaded relevant values. Existing canonical
material compilation remains the owner; add no field engine or forced late-geometry use.

DoD: the consuming judge sees the exact selected criterion and current evidence together;
completion still requires valid current results; local corrections invalidate only real
dependencies; receipt/saved values agree. Existing portable advice is sufficient for this
confirmed gap, so no Knowledge-content change is proposed. Earlier correct visual
judgment and reduced rework remain model-behavior hypotheses, not deterministic test claims.

#### Issue 2 deterministic checkpoint

The saved provider inputs for calls 6, 23, 24 and 34 were independently matched to
raw provider events and payload SHA-256. The retained criteria emphasize continuity,
frames and lighting; a later whole-view judgment explicitly reports overly uniform
glass. This establishes observed ordering, not a causal model-quality diagnosis.
The permanent saved declaration fixture verifies exact acceptance projection.
The new regression failed with missing acceptanceContext before implementation.
Capture/bind replies now derive method/revision and selected meaning from the canonical
plan, outside executable arguments, with binding validation before projection.
The existing invocation output schema describes the new field; the review revision is 12.
No material, result-invalidation or persistence owner was replaced.
190 operation tests and 114 review-stage tests passed; provider/prompt suites passed
(211 tests, one optional external-protocol skip). Material browser cases: 3 passed on
http://127.0.0.1:3307, including history, peer and durable reload. An earlier run was
interrupted by development reload during editing; frozen-source rerun passed.
Production server types, lint and naming passed. Inspector candidate
21eec6cb-1d48-49ae-8e38-de1ebbf24d98 passed and was accepted. Full final-source gates
and screenshot review remain required before the live 101 checkpoint.

#### Issue 3 execution card - settle outcome projection

- Owner/failure owner: settle. Spec Purpose lifetime and Inspector settle conditions.
- Inputs: ordered existing activity, principal identity/purpose, canonical toolOutcome,
  and authoritative lifecycle. Output: live principal work or explicitly settled context.
- Conditions: only completed known roots contribute settled context; generic native end
  is outcome-unconfirmed. Fresh idle commentary supersedes it. Roots retire commentary;
  concurrent roots retain every member and only present group settlement after all finish.
- Reuse the existing closed-call map for settled receipt metadata; no parallel history,
  lifecycle, scheduler or persisted state. Retry clears the attempt; lifecycle overrides.
- Boundary: provider ExecutionActivity transport admission, App provider/reducer/prompt,
  direct panel/protocol consumers and formal tests; no document mutation changes.
- Tests: canonical success/partial/failure/unknown, late/duplicate/child events,
  concurrent roots, fresh commentary, retry/cancel/save; provider through panel at
  360 and 1280 pixels. Types, lint, naming and exact-source Inspector gates required.
- Stop on unowned transport/state changes or failed gates; preserve all completed writes.

#### Issues 2 and 3 final deterministic checkpoint

- Issue 3 propagates only canonical outcome status/settlement from the existing provider
  reply through ExecutionActivity. Shared transport validates the optional outcome.
  Existing closed-call metadata retains the current group's principal subjects and results;
  no second state store or lifecycle was added. Live siblings remain current, descendants
  cannot replace them, and duplicate/late identities stay closed. Unknown transport ends
  remain explicitly unconfirmed. Original-objective idle fallback and cross-call commentary
  retention claims were removed. The panel now renders settlement labels rather than
  replacing them with the generic task-context caption.
- Test-first failures: all four canonical status projections returned the original objective;
  actual provider completion omitted canonical outcome. Both regressions now pass.
- Final focused server suite: 546 passed, one optional external protocol skip. Direct UI,
  conversation and stream consumers: 170 passed. Shared runtime progress: 22 passed.
  Existing deterministic evidence/deadline/video tests passed. Production server, App and
  flow-proof types passed. Focused lint has zero errors and four existing console warnings.
- Five browser cases passed on frozen source at http://127.0.0.1:3307: three material
  history/peer/reload cases and streamed status at 360/1280 pixels. Inspected actual
  completed-call and wrapped-context screenshots, plus the material reload screenshot.
  The material fixture deliberately retains independent solid overrides; it is not a
  visual-realism claim. Current status remains nonexecuting after root completion.
- Bounded review covered changed owner code, exact output schemas, direct dispatcher,
  transport and panel consumers, lifecycle failures and relevant persistence flows.
  Inspector proof now asserts acceptance context and canonical provider settlement.
  The live run is still outstanding; no improved Knowledge adoption or quality is claimed.

#### Authorized live 101 outcome - 2026-10-20

The single authorized run is `1792480806846`, captured under
`tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792480806846/`.
It finished with App success in 562426 ms (9 minutes 22 seconds), before the
600000 ms Send-relative deadline; the watchdog reports finished, not forced stop.
The actual preserved provider header identifies `gpt-6-astra` / `medium` and one
drawing request. No model retry or additional reviewer was launched by this task.

- `run.json`, `source-snapshot.json.gz`, `checkpoint.json`, `recording.webm`,
  `first.png`, `final.png`, `reload.png` and the official analyzer's `analysis.json`
  are retained. The recording is 49031204 bytes. Final view, persistence, checkpoint,
  recording, reload, source verification and browser cleanup stages all completed;
  no browser errors were recorded. Durable sequence equals captured sequence 676.
- Copied the full new provider recording directory into this run's `preserved-provider`
  and hash-verified all 692 files against their originals. Independently verified all
  42 parsed tool input/output values and SHA-256 references against raw events in
  `6d44e963-cc71-4d06-b969-077b724ec0e9.jsonl`. Original evidence remains untouched.
- Observed material route: the main agent first failed the representative surface for
  missing environmental reflection contours, corrected it, then recorded a local pass
  before expanding the remaining tiers. Two rejected bindings recovered from retained
  images and current revisions rather than replaying successful drawing writes.
  A later crown/antenna visual failure triggered a local correction. These are actual
  observed judgments and ordering, not an independent aesthetic oracle.
- Final review accepted all 8 required criteria. The final common check read reports
  34 pass, zero fail/unverified/stale. Earlier intermediate counts were not final success.
  Actual status observations distinguish authored context, active work and canonical
  completed/partial results; final settlement clears the live status.
- Viewed final and reload images: both retain the completed tower, podium, crown and
  editable facade detail. Overview images do not independently establish every geometric
  or photorealistic requirement. The single Knowledge-enabled run demonstrates adoption
  and this execution's handoffs, not causal improvement over historical noncontrolled runs.

Final Inspector candidate `81e91dde-c8aa-411b-9440-672a571d5854` and accepted
verification `924acc18-1b65-4234-a7d0-75e482b2e3e9` passed all 47 mapped cases at
revision 42, source digest `b1c0889d8d9ce51177f8572d3a968f68e36849cd9e925ba123a1372c7a3d2a77`.
All 827 captured source files matched the worktree before the live run. Final naming,
server/App/proof production types and bounded lint passed (existing console warnings only).
No push, PR, external reviewer, goal or automation was started. Preserve the dirty worktree.

#### Issue 3 - Unify purpose, execution and settled context without stale work

Owner: Inspector **settle**, existing provider event producer, activity reducer and
panel projection. Inputs: ordered attempt/call/root identities, public commentary,
explicit call purpose, canonical outcomes and authoritative conversation lifecycle.
Outputs: truthful live principal work, or explicitly settled context when no work is
observable; diagnostics retain child events. Failure owner: provider/settle, with no
write replay or fabricated successful outcome.

Implementation boundary after admission: `ai-domain-prompt.ts`, `local-ai-provider.ts`,
existing progress/outcome types, `activity-state.ts`, their conversation/panel consumers,
settle spec/Inspector and provider/browser scenarios. No parallel lifecycle/store.

First remove conflicting old retention/fallback clauses from the CURRENT prompt,
spec and Inspector, then make the one replacement contract executable:

| Observed state                                  | Presentation contract                                                                                                    | Forbidden inference                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| One active principal                            | Its current authored purpose plus observed execution phase                                                               | Child wording becomes a new principal; admission means pixels changed                                        |
| Concurrent principals                           | All live root ownership; shared live purpose or explicit concurrent summary                                              | Last sibling replaces the others; a completed root remains active                                            |
| Public commentary before dispatch               | Explicit intended-work context, distinct from execution                                                                  | Commentary means a tool is running                                                                           |
| Root starts/settles                             | Retire superseded commentary permanently; consume canonical outcome                                                      | Tool-end transport event implies success or ends an unobserved model stage                                   |
| No active principal, no new public purpose      | Show the most recent confirmed principal settlement as clearly completed/failed/partial context; omit unsupported claims | Original long prompt or stale action verb presented as current work; guessing what the silent model is doing |
| Retry, cancellation, saving or terminal outcome | Authoritative lifecycle; correct attempt/document ownership                                                              | Old success survives as current activity; drawing completion implies durable save                            |

The original objective remains in the conversation/request, not the idle current-work
fallback. Reuse existing history/receipt data for settled context, not a second writer.
A progress `status: completed` currently represents both successful and failed calls;
it is not sufficient for a success label. Use the canonical outcome/receipt and preserve
unknown or transport-only settlement honestly. Adapt missing outcome propagation in the
existing provider event path, never guess it from prose or replay the operation.
For concurrent completion, retain each outcome and its identity; only after all roots
settle project the completed group deterministically. A surviving root stays current.
Fresh commentary with no active principal replaces settled context as intended work,
not proven execution. Unbound commentary during principal execution remains diagnostic;
only correctly call-scoped purpose can update that live owner. Before any confirmed
result or public purpose exists, omit an invented concrete work claim; retain the
request in the conversation. Native research without a canonical result cannot gain
a success label from a generic end event.
App instructions must describe exactly this lifecycle and must not promise automatic
cross-call stage continuity. No extra status-only tool calls or exposure of private
reasoning. If the model supplies no new public purpose while silent, the App cannot
truthfully name its current internal task; a historical confirmed result is the limit.

Required proof: actual provider commentary -> lookup -> prepare -> apply -> inspection
-> settlement, using recorded ordering and canonical results through the real panel.
Also cover two independent roots, children finishing late, repeated/late start and end,
missing/duplicate outcome, partial/failed receipt, cancellation, cleanup failure after
committed writes, clarification/retry, saving failure/retry and fresh document reload.
Assert displayed semantic state and identity throughout, not only presence of a string.
No finished verb appears as executing, no raw original prompt idle fallback, no child
status churn, no false success. Existing statuses without authored purpose remain valid.
Include actual provider wire production and 360/1280 panel scenarios; preserve diagnostics
and language. Do not use timers or suppress start/end evidence to reduce visual changes.

DoD: delivered instructions, current Inspector and event consumers agree on one lifecycle;
parallel and failure outcomes remain truthful; no extra AI calls. Fewer visible changes
alone do not prove a better current status.

### Whole-flow review and completion standard

Before each implementation issue: verify exact Inspector owner, inputs, outputs,
conditions, bypasses, contributors, implementation allowlist, spec/failure owner and
accepted behavior; complete supported admission. After the issue, re-read that contract
and review direct upstream/downstream consumers before advancing. Do not substitute a
new governance ledger for the existing product cases and Inspector.

Required combined path after all three authorized issues: canonical discovery response
-> valid representative preparation -> current acceptance context and judgment ->
material correction with local result retention -> extension/final judgment -> save
confirmation and fresh reload, while observing the same provider/panel event stream.
Run deterministic formal integration with saved inputs and controlled provider replies;
no model inference is required or authorized. Exercise failure/recovery at each changed
handoff, including artifact loss, stale revisions, cancellation and publication failure.
A successful inner call is neither completed design nor durable save.

Existing scenario entry points include `server/__tests__/local-operation-tools.test.ts`,
`server/__tests__/local-ai-provider.test.ts`,
`src/ai/__tests__/prepared-material-action.test.ts`,
`src/app/__tests__/ai-conversation-panel.test.tsx` and
`e2e/ai-conversation-flow.spec.ts`. Extend current real-owner scenarios rather than
replacing their collaborators with success-only mocks. Exact affected review/browser
files are resolved from the current Inspector allowlist at admission; unrelated owners
do not enter the mutation scope simply because a broader gate exists.

Run focused existing and added formal tests, affected owner suites, production types,
focused lint/naming and applicable Inspector source evidence after implementation.
Reuse unchanged validated canonical gates only with source/coverage justification;
report actual commands and failures, not an aggregated fictional all-green run. Avoid
an unrelated whole-repository CI run. No commit/push or live 101 is implied.

Self-review findings resolved in this proposal:

- Usage default flip rejected: executable-contract discovery can legitimately need full
  schemas; compact navigation must not add mandatory roundtrips or remove constraints.
- Missing owner examples and 50,521-character App guidance are distinct from Knowledge;
  simplify duplicated App routing, do not add more portable tool instructions.
- Criterion context is a projection of the existing authoritative plan, not a new review
  store. Bind it to current revision; do not broaden invalidation or auto-judge aesthetics.
- Representative pass before expansion was already achieved. Repair acceptance meaning,
  not an obsolete premature-expansion diagnosis or a new mandatory gate.
- Contradictory status clauses must be removed together across prompt/spec/Inspector.
  The earlier closure was incomplete; preserve real evidence and correct current authority.
- Settled result context is explicitly historical. Canonical outcome, concurrent ownership
  and authoritative persistence lifecycle prevent stale execution and false success.
- Silent provider intervals cannot disclose an unreported task. Record that limitation
  instead of claiming exact ongoing work from an original objective or previous call.
- Deterministic replay can establish consistent handoffs; it cannot establish Knowledge
  efficacy, attention reduction or earlier aesthetic choices. A later model evaluation
  requires separate authorization and the fixed rubric below.

## Preserved canonical shared-property contract

The following current contract remains authoritative for the existing canonical
Inspector. It describes implemented semantics, not an instruction to repeat its
completed owner stages. New material/binding work must consume these semantics.

### Product operations and exact intent

| Intent                   | Required canonical behavior                                                                                                                                                                                                    | No-change and invalid-target behavior                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Read an owner's property | Return its effective value, stable owner/binding identity, source identity when source-backed, explicit local fields and supported operations. Source values are distinguishable from effective values.                        | Missing owners, removed rows and unsupported capabilities are typed failures, never an empty success.                                                                                                                               |
| Edit an owner's property | Only that owner changes. A source-backed binding records the supplied fields as explicit local overrides; omitted fields continue to inherit. An independent property receives an ordinary direct write.                       | Repeating the same existing override is a no-op. Setting an inherited field to its current source value creates an explicit override, even though the rendered value is unchanged.                                                  |
| Edit the shared source   | Explicitly address the canonical source identity. All unmasked dependent fields follow the update; explicit local fields remain unchanged.                                                                                     | The operation must not redirect to a selected owner's effective copy. Validate the resulting effective values of affected dependents before applying any write.                                                                     |
| Reset overrides          | Remove specified local fields, or all local fields when explicitly requested; resolve against the source at the accepted mutation boundary. Later source changes continue to flow through.                                     | An already inherited field or independent binding has no override to remove: return a truthful no-op. Invalid field names still fail validation. Reset is not assignment of today's source value or restoration of schema defaults. |
| Detach explicitly        | Materialize the current effective property and its owned child graph into independent ownership, replace only the selected binding and remove its source dependency. Preserve its effective appearance and unrelated bindings. | An independent binding is a no-op. New identities are recorded once in the transaction and reused during replay/retry; never clone again on a persistence retry.                                                                    |

Missing fields mean unchanged. Valid null, false and zero retain their registered
schema meaning; absence of an override is represented by field absence, not a
sentinel value. Native `gradient` is a whole registered field: partial stop/handle
JSON paths are not implicitly supported. Cross-field validity is evaluated on the
resolved effective value, including type/gradient combinations. No automatic
N-field detachment threshold, hidden clone or multi-level inheritance chain.

A binding's intent must not change merely because its source currently has only
one consumer. An explicit shared binding remains shared until explicit detachment;
an ordinary independent component is a valid current model case, not a legacy
compatibility path. Existing canonical identity sharing remains real data and must
not be flattened on load.

### Representation, semantic owners and collection isolation

Use the existing registered Props graph for source-backed property records and
sparse explicit fields; Scene remains the owner of element-to-property bindings.
Do not place canonical overrides in computed data, an App side table, a new store
or a parallel registry. The logical record consists of a canonical source identity,
explicit registered field values and, where supported, owner-local child bindings.
Props owns resolution, schema validation and indexed source/child dependencies;
Scene resolves the selected owner and root/child binding path; Core coordinates
through existing owner APIs. Persist this relation and the explicit fields, not a
second flattened authoritative value. Exact exported names and wire encoding must
be fixed in admission before names spread into implementation.

Resolve the first local edit of an existing shared canonical ID into an
owner-specific binding without rewriting the source or other owners. An effective
property read must retain that owner context through child getters and projection;
an ownerless source getter must not guess which instance's overrides to apply.
Audit computed projection, rendering/hit-test consumers and API reads against the
same resolved values. Canonical serialization writes the source/binding graph,
not the getter's flattened effective output. Reuse registry metadata for validation
at live and persistence boundaries; do not maintain divergent App/backend field lists.

A local change beneath a shared outer collection requires an owner-specific
binding, not an in-place replacement in the shared collection. Resolve children by
stable canonical identity and registered relationship path; an array index may be
an immediate selection convenience but is not a retained mutation identity.

- Editing one child's opacity leaves the collection's other rows, order and
  inherited membership intact. A later source reorder still follows identity; a
  later unrelated source child addition is inherited.
- Overriding an explicitly supported collection membership field is a separate
  structural intent and retains that explicit membership until reset. A leaf edit
  must never silently freeze membership by copying the entire collection.
- Detaching one child removes only that child's source dependence. Detaching the
  whole collection explicitly materializes its effective owned descendants. Neither
  operation rewrites another element's binding to a shared outer collection.
- Sharing an already overridden binding must not create an implicit chain or
  discard its explicit fields. Reject that ambiguous request before mutation;
  explicit detach/materialize followed by sharing the independent result is the
  supported path. Rebinding an overridden target likewise requires an explicit
  reset or detach decision, rather than silently dropping its overrides.
- Source deletion is rejected while live dependent bindings require it. Deleting
  an element releases its binding, not a source still used by other owners.
  Removing a source child with a dependent local override also rejects until the
  dependent is explicitly reset/rebound/detached. No orphaned masks or automatic
  appearance-changing recovery. Existing history retention still protects records
  needed for Undo/Redo; reference cleanup cannot collect them prematurely.

Capability support comes from existing property registration/schema/relationship
metadata, not a concrete Fill type list. This slice must support the registered
Fill/Fill-collection paths used by the App and the affected generic property APIs.
Opaque constructor-mode types without declarative semantics must report unsupported
before mutation; do not invent inheritance rules for them. Their existing valid
independent operations remain supported. Admission must record this capability
boundary in discovery and tests. No unrelated custom-property migration.

### Public APIs, consumers and truthful receipts

Expose distinct local-edit, source-edit, reset and detach intents through the
existing Core/App API and tool registry. Reconcile the existing element-property,
Fill batch, retained-query and gradient-handle consumers with selected-owner
semantics. Direct canonical source APIs remain explicit source operations, not a
second ambiguous element-edit route. New UI controls and shared-style management
are deferred; existing UI API consumers must still obey the corrected semantics.

Each request resolves the actual document, element binding, registered child path
and expected source identity before preparing writes. Reuse the existing prepared
mutation/dependency validation. A retained query or recipe must preserve this owner
context; a child property ID alone cannot authorize a local edit. Changed bindings
or removed rows require a fresh resolution, while unrelated document edits must
not invalidate an otherwise current target.

Receipts distinguish requested scope, actual canonical change, effective-value
change and persistence state. Use the existing invocation identity and input targets together with the standard
mutation-scope envelope; the Core value is the accepted owner/source ID list, not
a promise that every ID changed. Exact target reads provide binding/source and
mask fields when needed. Preserve truthful no-change/failure settlement and the
existing bounded query/detail path rather than adding a second result protocol. Do not return every dependent's
full snapshot, omit a partial outcome, or call a local apply durably saved.
Creating an equal-valued explicit override is a canonical change despite no pixels
changing. Cancellation after a committed change must report that change; it cannot
report an unqualified cancellation as though nothing happened.

App admission owns editability/lock policies. Local editing checks the selected
owner and ancestors using the existing policy. Explicit source edits disclose their
shared impact; selection lock on an instance does not detach it or stop inheritance.
A source or document that is not writable fails before mutation. No new framework
copy of App lock policy. Knowledge remains advisory and contains no API names or
mandatory acknowledgment; concrete selection/recovery guidance stays in the App.

### History, concurrency, publication and failure recovery

All intentions use the existing Factory transaction/journal, owner preparations and
publication ordering. Record field presence as well as values, source links and
binding replacements so Undo/Redo restores inheritance, not just today's pixels.
One user intent remains one history action; no new scheduler or Undo queue. Direct
selected-object edits during an existing session retain its normal session policy.

The admitted publication must explicitly encode binding/source/override mutations
and validate them through the same live receiver, backend reducer and load model.
Do not smuggle a new relation into unrestricted JSON fields or treat only flattened
values as authoritative. Keep the existing single socket ordering authority,
publication ID/digest deduplication, source settlement, compensation and durable
sequence acknowledgment. No second CRDT or ordering protocol.

| Boundary or interleaving                   | Required outcome and recovery                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Batch preflight                            | Validate all targets, capabilities, source links and resulting effective schemas before the first write. Conflicting writes to one binding/layer/field fail the whole intent; different owners may override the same source field differently. Deduplicate identical targets without collapsing local edits by source ID. Validate a combined source/local batch against its resulting effective state. |
| Source edit versus local field edit        | They write different layers. An explicit local opacity remains local while source color changes propagate; use ordinary authoritative publication order for same-layer conflicts.                                                                                                                                                                                                                       |
| Reset versus source edit                   | Reset removes the field mask, so the final value follows the accepted source state, never a captured old value written back as an override.                                                                                                                                                                                                                                                             |
| Detach versus source/rebinding change      | Materialization and binding replacement use one current prepared dependency set. If it changed before acceptance, reject/reprepare through the existing recovery boundary; never publish a stale flattened copy as a successful detach.                                                                                                                                                                 |
| Undo/Redo after peer edits                 | Replay the intended field/link deltas through the existing conflict and reconciliation policy. Preserve unrelated peer fields; do not restore a whole document or rewind another actor's changes to make a local history assertion pass.                                                                                                                                                                |
| Failure during canonical apply             | Roll back explicit fields, source/child relations and bindings together; no visible half-detached state or dangling dependency. Keep the original failure and report compensation failure separately if it occurs.                                                                                                                                                                                      |
| Peer rejection or apply failure            | Preserve the existing conflict/outbox and authoritative resync behavior. No applied-sequence advance, partial prefix, remote history entry or rebroadcast on failure.                                                                                                                                                                                                                                   |
| Lost acknowledgment or resend              | Reuse the same publication identity and bytes. No duplicate property allocation, second override application or additional Undo entry.                                                                                                                                                                                                                                                                  |
| Save failure after local/source acceptance | Retain the accepted change and existing recovery/outbox evidence; retry persistence without replaying the product operation. A captured durability target is not extended by later edits.                                                                                                                                                                                                               |
| Invalid or interrupted load                | Validate the complete source/binding graph and effective schemas before replacing the active document. Missing sources, cycles or unsupported records fail explicitly; do not silently flatten or drop overrides. The prior usable state/recovery data remains available.                                                                                                                               |
| Recovery followed by work                  | After retry/reconnect/reload, another local edit, source edit and save must succeed with the same inheritance semantics. Do not close on a single recovered response alone.                                                                                                                                                                                                                             |

Source propagation and result reuse follow actual indexed dependencies. A masked
source field does not change that owner's effective value; an identity/relationship
check can still depend on the source binding itself. Local edits invalidate only
checks whose values or relationships changed, preserving unrelated passed results.
Reset and detach must update those dependencies as well as display values. Measure
actual affected-owner resolution and projection work; do not add full-scene scans,
computed mirrors or unprofiled caches to implement overrides.

### Contract admission - canonical shared-property layers

Current accepted canonical contract, retained as the existing Inspector authority.
This section does not schedule another shared-property implementation.

Canonical representation: `PropertyInheritance` on a registered property
record consists of `sourceId`, sparse `overrides` keyed by registered fields and
`childBindings` keyed by canonical source child ID. A source-backed record keeps
its own `id`/registered `type`, but serializes inheritance rather than a flattened
copy of inherited values. An independent record retains its ordinary registered
fields. `sharedSource: true` marks explicit shared intent even when one consumer
remains; source-backed records cannot themselves be shared sources. These names
are neutral persisted identities, owned by Utils data types and Props execution.

Sources must be independent, active, same-type registered declarative components.
No inheritance chains, missing sources, cycles, unknown override fields or duplicate
child bindings. Effective field validation uses the same registered schema as an
ordinary write. An inherited collection resolves its current source membership and
then substitutes its owner-local child bindings by identity. A source reorder/add
remains inherited. A removed child with a live dependent override is rejected.
After explicit child detachment, membership still belongs to the parent collection:
removing the source slot may remove that independent local slot, without changing
the detached property's value or other consumers; history retains its record.
An explicit whole-collection detach instead owns independent membership.

Updates to override presence and child bindings are typed field/link deltas, not
whole-map replacement. The current `UPDATE_PROPERTY` payload has an optional
`layer` discriminator (`overrides`, `childBindings`, or `sharedSource`). Layer
deltas use `key` plus exact `{ present: false }` or `{ present: true, value }`
before/after states. Ordinary field events have no layer. History identity includes
the layer, so an override cannot collide with an ordinary field or child link.
The existing prepared property batch accepts `layers` operations containing
per-key changes; reset is absent state and equal-valued explicit presence is a
real canonical change. No whole inheritance map is replaced during edits.
Factory history and publications carry these deltas with
exact before/after presence, including equal-valued overrides. Reset removes the
field, never writes a source snapshot. Scene alone changes element root bindings;
Props alone changes property links and fields. Existing indexed dependency edges
cover source inheritance and local child bindings, without a second graph owner.

Core local target identity is an element ID, root property name and zero or more
registered child steps `{ key, childId }`, with expected source/binding identity
when retaining the target. Resolve the complete path before mutation. During a
gesture, the selected logical child survives the first local binding allocation;
subsequent frames must not mutate the old source or retarget a reused row index.
Source edits explicitly target a source property ID and do not infer local intent.
Core coordinates atomic preparations; no new session, history queue or scheduler.

The browser remains the semantic schema/relationship admission owner. The backend
reduces the same explicit canonical field/link deltas and validates structural
references atomically; it must not import browser Framework execution, duplicate
registered field schemas or invent new ordering. Reload validates the complete
canonical graph through Props/Scene before replacing live state. Portable wire
types are projected at the existing App protocol boundary. Durable acknowledgment
continues to refer to an accepted publication sequence, not local apply success.

Read results distinguish independent/source-backed/source mode, target path,
source identity, sparse local values and effective values. Mutation results include
canonical changes, effective changes, affected owners and local acceptance; save
receipts remain separate. Unknown target/capability, stale binding, invalid source,
invalid field, source-in-use and failed apply are typed errors with unchanged or
explicit compensated state. They cannot become empty successful results.

Public coordination names are `readElementPropertyTargets`,
`updateElementPropertyTargets`, `updateSharedPropertySources`,
`resetElementPropertyOverrides`, `detachElementPropertyTargets` and
`shareElementPropertyTargets`. All are batch-only at the canonical boundary; a
single edit is a batch of one. Existing `updateElementProperties` and
`patchElementProperties` remain current convenience APIs for selected owners,
not ambiguous source edits. They delegate to the admitted target resolver.
App Fill API operations expose the four intentions through the existing registry;
no second native-tool registry or mandatory Knowledge acknowledgment is added.

## Research basis and application limits

| Primary source                                                                                                                                                                                                                                                                                       | Established mechanism or finding                                                                                                       | Proposed application and limit                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a href="https://arxiv.org/html/2602.12670v1" target="_blank" rel="noopener noreferrer">SkillsBench</a>                                                                                                                                                                                              | Retrieval/acknowledgment can diverge from use; focused procedural guidance often outperformed comprehensive documents in its benchmark | Evaluate first actual parameters and outcome, not reading. Terminal-task findings are not proof of architectural drawing efficacy; do not impose a fixed module quota.          |
| <a href="https://arxiv.org/html/2603.15401v1" target="_blank" rel="noopener noreferrer">SWE-Skills-Bench</a>                                                                                                                                                                                         | Preliminary study found many skills with no pass-rate gain and possible token overhead/context conflicts                               | Additional text requires a specific missing decision benefit, not presumed improvement. Different task/model population.                                                        |
| <a href="https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills" target="_blank" rel="noopener noreferrer">Agent Skills design</a>                                                                                                                              | Progressive disclosure and deterministic executable helpers                                                                            | Reuse existing metadata/context access; do not add infrastructure or executable code to portable Knowledge.                                                                     |
| <a href="https://www.anthropic.com/engineering/writing-tools-for-agents" target="_blank" rel="noopener noreferrer">Effective tools</a> and <a href="https://www.anthropic.com/engineering/advanced-tool-use" target="_blank" rel="noopener noreferrer">advanced tool use</a>                         | Task-level capabilities, filtered intermediate results, on-demand definitions and concrete invocation examples                         | Improve existing main-tool/typed-recipe handoffs. Do not adopt arbitrary model code execution, predict vendor benchmark gains or classify every lookup as waste.                |
| <a href="https://www.w3.org/TR/SVG2/pservers.html#LinearGradientElementGradientUnitsAttribute" target="_blank" rel="noopener noreferrer">SVG gradient coordinates</a>                                                                                                                                | Distinguishes per-object bounding-box coordinates from user coordinates and transforms                                                 | Make the chosen material domain explicit. `userSpaceOnUse` is not automatically global across differently transformed objects; current color mapping is not gradient remapping. |
| <a href="https://tldraw.dev/sdk-features/parenting#reparenting-shapes" target="_blank" rel="noopener noreferrer">tldraw parenting</a> and <a href="https://github.com/tldraw/tldraw/blob/main/packages/editor/src/lib/editor/Editor.ts" target="_blank" rel="noopener noreferrer">implementation</a> | Editor converts page position into new-parent coordinates when reparenting                                                             | Trace Asyra's existing canonical owners. Do not copy unsupported transforms or change descendant-edit/lazy-bounds semantics.                                                    |
| <a href="https://bazel.build/reference/skyframe" target="_blank" rel="noopener noreferrer">Bazel Skyframe</a>                                                                                                                                                                                        | Explicit dependencies and change pruning when recomputed values are equivalent                                                         | Validate actual mechanical dependencies; visual judgments require their own complete dependency proof. Do not introduce a generic graph/cache or infer visual equality.         |
| <a href="https://kubernetes.io/docs/reference/using-api/api-concepts/#updates-to-existing-resources" target="_blank" rel="noopener noreferrer">Kubernetes update contracts</a>                                                                                                                       | Conditional updates reject stale resource versions                                                                                     | Reuse producer-issued current receipts; preserve conflict recovery. Never relabel old judgments with a new revision.                                                            |

These sources motivate bounded hypotheses. They are not new Asyra requirements,
proof of Asyra root causes, or permission to replace existing public owners.

## Fixed evaluation and reporting contract

The following existing rubric and attribution rules remain in force. They are not
permission to run a model, a no-Knowledge control arm or general drawing cases.

### Separate engineering correctness from Knowledge efficacy

| Evidence layer                | Question and evidence                                                                                                                               | Permitted conclusion                                                                                            | Not established                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Tool correctness              | Real canonical producers/consumers, saved-input regressions, integration tests, cancellation, invalidation, recovery and save/reload where affected | The specified current tool contract works in the tested conditions, with explicit coverage and unresolved cases | The model selects it well, thinks faster or produces better artwork                                       |
| Advice adoption               | Delivered Knowledge revision -> observed method/criteria -> actual tool arguments -> resulting edit                                                 | Behavior is consistent with a particular advisory principle; report contrary decisions too                      | Retrieval alone proves use, or the same decision would not occur without Knowledge                        |
| Decision and artwork efficacy | Actual agent run, frozen task/conditions, independent evidence and fixed rubric below                                                               | Observed decision/quality/rework differences within the stated comparison limits                                | Deterministic replay proves AI improvement, or one historical difference proves a causal Knowledge effect |

Knowledge remains optional, portable and App-independent. Tool identifiers,
capability selection and invocation recovery remain App-owned. Neither the rubric
nor a Knowledge read becomes a tool admission gate. Missing advice is a valid
condition, not a tool failure. Shared advice must not contain the 101 answer.

Borrow CTT's distinction between observed performance and measurement error:
variation can come from the model, reference interpretation, environment or
scorer. Reliability means consistent measurement; validity means measuring the
intended capability. Neither is established by one successful execution. Do not
calculate a latent ability score, reliability coefficient or confidence interval
from one run or from its correlated tool calls. IRT calibration/adaptive sampling
is deferred; the dependent stages of one 101 drawing are not independent items.

### Frozen case and comparison conditions

- Case authority: `apps/asyra-design/test-data/knowledge-evaluation/architecture-101.json`
  and its existing `architectureScenario` construction. Preserve exact prompt,
  common read instruction, module/context selectors, both reference bytes/hashes
  and their declared scopes. This evaluates adoption after requested retrieval,
  not spontaneous Knowledge discovery. Only Taipei 101 is in scope.
- Preserve `gpt-6-astra` / `medium`, a fresh document/request/conversation, empty
  isolated tool library and 1920x1080 viewport. Record actual provider settings,
  exact dirty-source hashes, delivered App prompt, tools and Knowledge revisions,
  runner version, machine/browser and available resource/load observations. A
  missing configuration value is unknown, never assumed equal.
- Keep first-content/real overall-size-change/final fit behavior. The independent
  600000 ms deadline starts at Send and force-stops owned generation without a
  question or retry. Record actual stop latency. Ten-second recording tail applies
  after successful completion; bounded capture/save/reload time is separate from
  generation. No additional evaluator model or follow-up correction prompt.
- No new execution is scheduled. Any later authorized comparison must name exact
  run IDs and the intended changed variable before execution. Freeze references,
  rubric and sample budget before observing candidate results. Changing the
  rubric starts a new rubric revision; never select a favorable historical run
  after seeing the candidate. Preserve all failed attempts and original reports.
- Pre-implementation diagnostic baseline is run `knowledge-quality-knowledge-taipei-101-1792446670972`; current acceptance is run `knowledge-quality-knowledge-taipei-101-1792471047468`.
  Its recorded report preserves the original descriptive comparison and source
  conditions. Earlier runs remain immutable evidence, not replacement controls.
  Existing reports retain their original scores. The authorized acceptance is compared descriptively with this fixed baseline, without a causal claim.
  Different App/tool/guidance versions make historical comparisons integrated-system
  observations, not Knowledge/no-Knowledge experiments. No control arm is authorized.
- A content-only comparison would require the same App/tools/prompt/protocol with
  declared Knowledge revisions as the intervention, plus adequate repeated real
  evidence under a separately authorized budget. Even that would compare content
  versions, not establish the effect of having Knowledge at all. For now report
  descriptive observations; controlled efficacy remains unverified.

### Attribution rules and observable Knowledge mechanisms

The evaluated system is the complete model + delivered instructions + portable
Knowledge + App advisory mapping + tools + references. Keep those components
separate in the comparison. Faster validation, fewer stale receipts or smaller
tool outputs after a tool fix are engineering improvements, not portable
Knowledge efficacy. Improved routing after an App-prompt or App-module change is
App-guidance evidence. If multiple components change, the result belongs to the
combined system; do not allocate its gain to individual components.

Use the following claim levels in each report row, independently of its numeric
quality rating. An `improved` observation does not automatically raise the claim
level:

1. **Observed difference:** a referenced metric or artifact differs. A single run
   can establish this fact, with its configuration and uncertainty limits.
2. **Advice-consistent mechanism:** delivered advice precedes a relevant decision,
   actual arguments implement that decision, and the artifact confirms it. This
   supports adoption, not causation; the model may already know the same method.
3. **Content-version effect:** reserved for an authorized, repeated content-only
   comparison with frozen non-content components and uncertainty reported. A
   change in the content includes the resulting context-length cost; it does not
   isolate semantic content from that cost. This level is currently unavailable.
4. **Presence-of-Knowledge effect:** requires a separately authorized appropriate
   counterfactual. Current Knowledge-only runs cannot establish this claim, even
   when repeated. No control arm is authorized or added by this plan.

No statistical method can recover the missing counterfactual from tool tests or
a single favorable run. For later authorized repeated comparisons, predeclare
sample count/budget, balanced or randomized version order, stopping rules and
analysis unit (one fresh run). Keep model/provider changes and failures visible;
never rerun until a preferred result appears. Identical seeds, when available,
do not prove identical service behavior. Insufficient samples or unknown provider
configuration leave the comparison descriptive; do not invent significance.

| Advisory mechanism                                | Observable decision opportunity and predicted result                                                                                                                          | Evidence against the prediction or limiting attribution                                                                                                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Resolve spatial relationships before dense detail | First committed tower/podium arrangement preserves supported contact, placement and occlusion before facade detail; fewer subsequent spatial defect episodes                  | Wrong initial arrangement, late footprint/order repair or unsupported reference precision; prettier final art alone does not show earlier planning                                         |
| Choose material relationships before repetition   | Actual first representative facade includes the relevant material contrasts and continuity domain; a detected material defect is corrected before further affected repetition | Prose names continuous glass but arguments restart an unsuitable local gradient; diagnosis is early but correction remains late; a tool-generated material change is not an agent decision |
| Delegate genuinely repeated structure             | Agent chooses a supported template/domain for equivalent repeated parts and preserves requested detail                                                                        | Lower payload comes from missing detail, changed serializer/tool output or different work; irregular geometry can legitimately remain explicit                                             |
| Use precise scope and reuse valid information     | Agent supplies a sufficient local target for the requested correction and avoids unnecessary contract reacquisition when delivery/currentness are evidenced                   | Broad targeting, omitted relevant neighbors, wrong route or unjustified reacquisition; backend receipt reuse/expiry remains an engineering measure, not an AI-choice score                 |

The first three mechanisms originate in portable advice; concrete tool routes and
the last mechanism's contract-acquisition policy belong to the App. An improvement
in discovery cannot, by itself, credit portable architectural Knowledge. Mark the
actual source of the guidance, including duplicate principles already present in
the base prompt, rather than attributing all architectural behavior to retrieval.
Correct justified departures from advice are not failures. Scoring rewards the
user's outcome and appropriate decisions, not literal compliance with a module.

### Fixed quality rubric - revision 2

Revision 2 remains fixed. Existing saved reports retain their original judgments;
the current acceptance report uses the same rubric and does not rescore historical runs.

Score each dimension separately, with evidence locators and a written reason.
Use 0 = absent or a major contradiction; 1 = present but a consequential defect
remains; 2 = meets the stated criterion at the inspected views with no observed
consequential defect. A consequential defect violates the brief/reference
relationship or requires geometry/material/order correction, rather than optional
polish. Record smaller limitations even at 2. This is an ordinal rubric, not an
interval scale or an overall capability score; do not sum or average dimensions.

| Dimension                      | 0 anchor                                                                                                  | 1 anchor                                                                                          | 2 anchor                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete target and silhouette | Major tower/base/spire portion absent or wrong silhouette                                                 | Full extent present but tier/setback/crown structure materially wrong                             | Base through spire, eight tier units and distinctive setbacks/crown are coherent                                                                                           |
| Projection and visibility      | Connected masses contradict the chosen view or foreground/background order                                | Mostly coherent, with a consequential seam, alignment or overlap error                            | Consistent elevated three-quarter projection, visible tops and coherent overlapping edge families                                                                          |
| Podium/tower composition       | Base missing or generic placement contradicts supported reference relationships                           | Podium present but attachment, foreground placement or visible roof relationships need correction | Supported footprint/attachment/occlusion relationships agree with the reference; estimates remain identified                                                               |
| Materials and lighting         | Material cues or lighting contradict the requested realistic illustration or supported reference evidence | Recognizable materials but incoherent face lighting or repeated reflection resets remain          | Coherent material cues and reflection/light continuity across related surfaces, allowing justified segmentation and a plausible interpretation where references are silent |
| Required editable detail       | Broad schematic or flattened artwork replaces required editable structure                                 | Some facade/frame/ornament structure present but major visible areas are unfinished               | Editable facade/window-frame/visible ornament detail is carried through the result without unsupported precision claims                                                    |
| Scoped correction outcome      | A correction fails its requested purpose or damages unrelated artwork                                     | Intended correction partly succeeds, with residual defect or unintended artwork changes           | Requested correction succeeds and unrelated canonical content is preserved                                                                                                 |

The last row scores the observed outcome, not its cause. Separately attribute an
incorrect target/argument to the agent or incorrect execution of a valid request
to the tool. Evidence-receipt invalidation/reconciliation belongs exclusively to
the engineering report. A correct narrow agent request followed by an App failure
must not receive a poor decision score, although the delivered outcome failed.
An ambiguous contract or missing trace remains unresolved, not agent blame.

Judge against the user brief and reference-supported relationships first. The
agent cannot earn full marks by declaring a weaker goal, easier style or its own
acceptance criterion. Coarse references cannot justify exact dimensional error
scores; credible alternative projections/material interpretations are allowed.
Do not award eight-tier count alone as architectural quality: the adjacent
projection, composition and detail dimensions remain independently assessed.

Use `unobserved` for a correction that never occurs, and `unscorable` when required
images/state/reference evidence is missing or ambiguous. Neither is zero or a
pass. Known absent requested content is zero even on timeout; other observed
partial dimensions may be scored, but timeout remains an overall completion
failure. Appearance cannot prove editability or canonical preservation: inspect
saved document and tool evidence for those properties.

Inspect whole-building overview plus matched semantic crops: podium/tower join,
lower/middle/upper tiers and crown/spire. Use equivalent framing/scale for each
comparison region and source-detail crops where available; no artwork retouching.
The aerial reference supports massing/base/silhouette only, the close-up supports
ornament shape/material only. Missing reference detail must remain uncertain;
construction equipment and invented unseen geometry are not required detail.
Report the first completed relevant mass/surface and final-or-cutoff state so an
early correct decision can be distinguished from a late repair.

Do not let an agent's declaration choose its favorable scoring checkpoint. Use
the earliest applied tower-plus-podium massing for spatial decisions and the
earliest rendered relevant material contrast/adjacent facade region for material
decisions. Record evidence availability and the agent's declared phase separately;
unfinished planned work is not automatically a defect. Also compare the last
available state at common elapsed checkpoints of 120, 300 and 600 seconds from
Send, retaining the completed final state for a run that finishes earlier. If no
appropriate capture exists, mark that checkpoint unavailable; do not interpolate
or rerun. These checkpoints aid progress comparison, not equal-work or causal
claims. Final/cutoff judgments and timestamps remain separate.

### Decision quality and rework exposure

For each mechanism above, report the first observable decision opportunity as
`appropriate`, `inappropriate`, `not reached` or `unresolved`, with argument/state
evidence and the contract available at that time. Unknown model receipt is not
proof that a repeated lookup was unnecessary. A valid alternative tool chain is
appropriate; there is no required exact call sequence or recipe-use quota.
Do not collapse decision labels into an artwork score or tool-success rate.

Keep each material, podium or projection defect episode tied to its semantic
region and criterion. Record initial defect, detection, corrective write,
verification and remaining defect separately. Count all episodes, including open
ones, and list resolved/open/reopened totals. A failed repair does not erase its
episode. One bulk correction and many per-object writes for the same defect are
one episode with different implementation work; neither node count nor batch
shape determines the score. A single fix addressing multiple defects retains the
separate defects but its execution time is counted once.

Always show inspection exposure: which prescribed regions/criteria were actually
visible and assessed at each milestone. Fewer observed corrections with missing
review, less completed work or unresolved defects is not reduced rework. Failure
to detect a visible defect is not success. Separate work done before detection
from detection-to-correction latency; an earlier report without an earlier useful
correction is only earlier detection. Timestamp origin is Send throughout.
At cutoff, incomplete work and open defects remain open; time-to-completion is
unobserved beyond the cutoff, not a successful 600-second completion or an assumed
future repair. Observation counts are not independent statistical samples.

### Fixed process measures and attribution

| Measure                     | Recording and interpretation rule                                                                                                                                                                                                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tool selection              | Classify every discovery call as first acquisition, required schema upgrade, documented recovery, redundant acquisition, unused exploration or wrong route; ambiguous cases remain unknown. Report category counts, failed invocations and actual recovery, not a lower-call-count score.                 |
| Advice adoption             | Cite the retrieved principle, earliest observable commitment in method/tool arguments, first application, first detected defect and first correction. Record contradiction or absent evidence. Do not infer hidden reasoning or force the agent to reveal it.                                             |
| Material and spatial rework | One episode is a defect/region/property from first evidence through correction and verification. Group its tool calls; reopening the same defect is recorded explicitly. Separate planned detail additions, failed writes and retransmission from actual corrective changes.                              |
| First frame and phases      | Send -> first observed content; acquisition/planning -> initial massing -> repeated facade/material work -> inspection/correction -> settlement. Identify exact event boundaries; interleaved work remains interleaved, not forced into sequential totals.                                                |
| AI/provider vs tools        | Report wall time and tool interval unions; show inclusive child/coordinator time separately to prevent double counting. Provider time outside observed tools is residual service time, not measured thinking. Native search, queueing and unavailable provider internals retain their attribution limits. |
| Interaction and transfer    | Count top-level model/tool round trips separately from backend child operations. Measure actual recorded UTF-8 payload bytes, identify reserialization estimates, repeated contracts and large data transfers; bytes are not token counts.                                                                |
| Safety and delivery         | Report cancellation, current-status agreement with active work, scoped result currency, save/reload evidence and capture completeness independently. Tool failures and capture failures have separate owners; neither is a Knowledge-quality score.                                                       |

No node count, Knowledge-read count, model self-approval, blanket tool-success
rate or shorter runtime alone establishes improvement. A practical efficiency
claim requires comparable completed quality and no correctness regression; a
faster failed/partial run only has a faster observed milestone. Mechanical checks
do not independently certify visual quality, and final visual approval does not
clear unsupported or stale mechanical obligations.

### Reporting and uncertainty

Use a comparison table separating tool correctness, advice adoption, first actual
material/spatial decisions, defect episodes and artwork quality. Include evidence
locators, exact changed conditions, missing evidence, scorer identity and whether
scoring was blind. Keep failed attempts and unfavorable results. Replayed tools
cannot prove reduced AI thinking; provider residual time is not private reasoning.
Historical mixed-source runs remain descriptive, not causal controls. No summed
quality score, full IRT calibration or generalization beyond the observed case.

## Current-plan cleanup and review

This revision replaces obsolete four-issue next-step instructions and local execution
cards with the three proposed issues above. It preserves the implemented material-domain
and retained-anchor contracts, independent shared-property authority and fixed evaluation
rubric. Historical test runs remain evidence for their source, not proof that newly found
prompt/Inspector conflicts were absent. In particular, the previous assertion that all
stale status clauses had been removed is corrected by the explicit source findings above.
No completed plan, immutable report or product source is modified by this planning turn.
New implementation/admission/test results must be recorded only after actual execution.

## Recorded current acceptance - historical evidence

The only authorized run, `knowledge-quality-knowledge-taipei-101-1792471047468`,
completed in 474.364 s with first visible content at 78.047 s. It used the unchanged
`gpt-6-astra medium`, portable architecture revision 4 and App method revision 15.
The source snapshot verified digest
`434fc4f8bbe2e2aea8760a295132a6a057c2fe06f50d681d2d93fc5aac77707a`.
Two complete recorded streams contain one drawing model and host-only publication;
there is no additional reviewer model. All 62 outer calls have recorded I/O.

Representative acceptance preceded upper-tier expansion. Six world-material revision
and apply pairs succeeded, preserving world coordinates, with 3,975 total input bytes
and 0.793 s App execution. Two nonplanar geometry submissions failed before mutation
and recovered using retained-draft patches. Final results accumulated to 41 pass, zero
stale and visual coverage 6/6. Save and fresh reload matched root order, generation 0
and durable sequence 547/547; the live oracle does not compare every property.
Recording, checkpoint, final/reference images and saved-document detail captures remain
local. The full report is
[the intent-to-parameter acceptance analysis](../evaluations/2026-10-20-101-intent-parameter-acceptance.md).

The unfavorable findings are part of completion: runtime was 131.685 s slower than the
previous different-workload run; discovery remained nine calls and 323,072 response
bytes. The agent did not request compact usage, retained anchor binding or later-geometry
materialSourceId. Glass reflection correction still occurred late. Idle purpose no
longer falsely claims executing work, but often falls back to the broad original task.
These observations do not prove causal Knowledge efficacy or product-wide perfection.
These observations motivate the proposed issues above. No further implementation or model
test is authorized by this planning revision.
