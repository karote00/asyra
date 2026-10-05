# AI execution improvement - local results

Date: 2026-10-03. All five bounded plans completed locally. No push, PR update,
merge or remote CI is claimed. The full-building 1–2 minute aspiration is **not
achieved**. A successful test means the defined workflow completed; it does not
certify photographic quality or a causal speed improvement.

## Delivered changes

- Durable per-request execution records, bounded sanitized selectors, actual
  lifecycle/queue/tool spans and explicit missing evidence.
- Read-only run/period reports, separate feedback and model opinions; optional
  capability-free post-run assessment. Current visual-review opinion can be
  reused without another model call. Assessment diagnostics use stderr, keeping
  JSON stdout parseable; ordinary drawing logs retain their existing channel.
- Current admitted API discovery by lexical query, exact schema retrieval and
  batched selector evidence. Canonical property writes are distinguished from
  expanded computed projections, with the plural property patch example.
- Coherent-stage inspection and representative repeated-detail guidance, plus
  canonical owner profiling. Requested detail, editability, dimensions, Stop,
  progressive application, manual interaction and one request history group remain.
- `yarn validate:local` previews affected checks from the existing CI relationship
  map; `--run` executes them. Apps, packages, tools, dependencies and owned E2E
  contracts share that selection. No second owner allowlist was introduced.

No new context-rag integration, speculative cache, shared renderer, dependency,
model/effort change or blanket simplification was added. Existing reuse was proved
with work-count tests. The suspected old bulk-creation delay was not reproduced
in the final realistic run, so the framework creation owner remained unchanged.

## Successful live run

Request: `c0a06517-ead3-4417-807b-6d0ac2a3437c`.
Source: `119d39b47f27090e56ead42e7836234d9ba84097`.
Provider: local subscription, `gpt-6-astra`, `medium`.

> Draw only Taipei 101’s two uppermost large bamboo-shaped sections, plus the full crown and spire above them, as a highly detailed, realistic 2D illustration from one fixed oblique view. Use editable shapes, preserve visible façade details, and scale at 1 cm = 1 px.

| Observation                                | Result                                            |
| ------------------------------------------ | ------------------------------------------------- |
| Drawing request wall time                  | 927,019 ms - 15m27s                               |
| First applied stage completed              | 172,309 ms relative to request                    |
| First visible bounds captured              | 175,929 ms relative to test start                 |
| Observed tool/research interval union      | 32,719 ms                                         |
| Unattributed time                          | 894,301 ms                                        |
| Recorded tool/research calls               | 76                                                |
| Batch executions / drawing inspections     | 20 / 15                                           |
| Drawing elements                           | 6,514 - 8 groups, 6,486 vectors, 20 ovals         |
| Transport sent / received                  | 12.14 / 22.06 MB, decimal                         |
| Tool unavailable results / rejected inputs | 3 / 2; run subsequently completed                 |
| Largest application                        | 6,023 elements - 8,588 ms create, 11,480 ms total |
| All five creation / application spans      | 9,823 / 13,432 ms                                 |

Unknown time is **not measured reasoning time**. Native provider spans and tool
spans overlap; do not add nested owner timings to the interval union. Wire bytes
do not measure model context. The bounded owner-profile ring retains only its
latest 16,384 entries, so it cannot provide whole-run phase counts; application
receipts retain all five batch timings. Development results are not production
benchmarks or universal machine-speed thresholds.

The optional process assessment made one isolated call (~40.4s), after drawing,
under request `2d80a090-c729-4795-9de8-dce918f6021a`. Its duration and usage are
separate. It cited large responses, inspection/rework candidates and missing
attribution; these are investigation opinions, not proven waste. Reusing the
current final visual review returned `reused`, without another provider call.
The period report covers `[2026-10-02, 2026-10-04)` in UTC, one drawing and the
separate saved opinions. This is not a multi-sample performance baseline. No user
quality feedback or approval has been fabricated.

## Failed attempt and correction

The first live run, `d993ee8b-8db6-44a2-98e2-abb61264507a`, retained its partial
work and evidence. A call supplied expanded computed fill objects to canonical
`updateElementProperties`, which stores fill reference IDs. Native regression
proved rejection without mutation and the successful plural record-patch path.
The registered API descriptions now explain the distinction and batch patch
shape. Focused tests and this native case passed before the successful repeat.

The first server trace retained only a generic failure code; it did not by itself
prove the precise client rejection. The formal native reproduction supplies that
evidence. Two later recovered schema errors used top-level geometry instead of
`properties`; they remain visible in the successful run report. No errors were
silently treated as success. Both live attempts remain locally available.

## Visual verification

- **Base URL:** `http://localhost:3000`, resolved from the App's retained `.env`.
- **Visual Test Scope:** formal `e2e/local-ai-provider.spec.ts`, test
  `local subscription draws the upper two Taipei 101 tiers and spire from one brief`.
- **Command:** from `apps/asyra-design`,
  `node --env-file=.env ../../node_modules/@playwright/test/cli.js test e2e/local-ai-provider.spec.ts --grep "local subscription draws the upper two Taipei 101 tiers and spire from one brief" --workers=1 --max-failures=1 --reporter=line,json`.
  The test invocation opts in with `E2E_LOCAL_AI=true`; the owned-process wrapper
  records exact output paths and PID cleanup in
  `result.json`; the formal test enables headless recording and inspection.
- **Runtime State:** real App, 1920×1080, AI panel opened and brief sent; fit bounds
  during drawing; final screenshot at 5% zoom after the required ten-second wait,
  without completion toast or selected-object outlines. Canonical document and
  receipts saved. Browser-error list empty; source identity verified unchanged.
- **Screenshots:** `last-app.png`, `completed-app.png`, 20 inspection images.
  Native-size inspection 16/17/18 show façade/ledge, spire/collars and ornaments;
  inspection 19 shows the overview. These are actual App inspection results.
- **Screenshot Review:** inspected the overview and native detail crops. Two
  large flared tiers, crown, full spire, glazing divisions, ledges, ornaments and
  rings are visible. Automated E2E passed; agent review confirms these structures,
  but does not certify photographic fidelity or surveyed dimensions.
- **Remaining Differences:** shaded architectural vector illustration, not a
  photoreal render. Materials are stylized, windows repetitive, and some thin
  lines/junctions remain visually awkward. Local dimensions are reference-based
  estimates. The model's own accepted review is stored separately from this
  assessment. Final artistic acceptance belongs to the user.

## Local evidence and commands

All generated evidence is ignored and retained under project-local `tmp/`:

- Success: `tmp/ai-final-acceptance-20261003-r2/`.
- Failure: `tmp/ai-final-acceptance-20261003/`.
- Browser subdirectory in each:
  `browser/local-ai-provider-live-exe-366f2-rs-and-spire-from-one-brief-chromium/`.
- Successful video: `page@adbc853e39216ab51ef87aee1fece06d.webm` in that subdirectory.
- Success artifacts: `final-report-with-assessment.json`, `period-report.json`,
  `visual-assessment.json`, `records/`, `result.json`, `playwright.json`;
  browser `document.json`, `execution-evidence.json`, `owner-profile.json`,
  `action-batch.ndjson`, screenshots and full video.
- Native property proof: `tmp/ai-property-contract-e2e/`.
- Affected suite: `tmp/local-validation/82f2410d-9c38-4ac5-9c18-7e1cbc09c662/`.

From repository root:

```sh
yarn validate:local
yarn validate:local --run
yarn workspace @asyra/asyra-design ai:report:build
yarn workspace @asyra/asyra-design ai:report --request c0a06517-ead3-4417-807b-6d0ac2a3437c
yarn workspace @asyra/asyra-design ai:report --from 2026-10-02 --to 2026-10-04
```

The retained local `.env` points to the successful record directory. Other
checkouts can supply `--directory` explicitly. Ordinary reports make no model
call. `--assess process --criterion "..." --request ...` explicitly requests one
separate assessment; saved opinions are already available for this run.

## Validation and closure

- Local selector/runner formal tests: 109 passed; Inspector tests: 25 passed.
- Nine affected checks passed with source identity verified: prerequisite builds,
  shared lint/scripts/naming, selected Design/site/Inspector owner checks,
  collaboration E2E, functional E2E and three render-contract cases.
  Functional evidence: 194 ordinary passes plus five declared expected failures;
  18 explicit opt-in skips. Zero flaky/unexpected failures. These are not 217
  executed successes. Site E2E: 102 passed; collaboration: 13 passed.
- Canonical descriptor correction: 153 focused passes, three existing opt-in
  skips; native property E2E passed. Final real-subscription drawing: one passed,
  zero flaky/expected failures, source verified; owned servers stopped afterward.
- Final assessment output regression failed first (11 unwanted stdout calls),
  then six focused suites passed 125 tests, three existing opt-in skips.
  App typecheck, frontend build, report build, scoped lint and naming passed.
- Source-bound owner proof `6c3314dd-8e41-4c5f-a9cc-1fb96ee2085a` passed; accepted
  review `d035b41b0db4512297a925857b05a51499a41c9ed41666d7c5047134d5b33278` has no blockers.
- Contract Changes Detected: execution diagnostics/evaluation, API write semantics
  and local validation command ownership. Docs Updated: corresponding specs,
  provider/local workflow docs and all five plans. Deferred Drift: none known
  within the bounded changed owners. Remaining product limitations are above.

The diagnostic stdout correction came after the live drawing and does not alter
its result or source identity. It was validated separately. Historical wider
checks are attributed to their recorded source; no claim of new remote CI is
made. Local environment and evidence are retained; no task-owned listeners remain.

## Combined fact, tool-diagnostic and prompt stage - 2026-10-03

This is a new source-bound acceptance run, not a replacement for the historical
results above. Branch codex/ai-execution-flow, base HEAD c6506a164bea82a5c7284dd3c4a0b4f3bb17c7a5
plus the dirty-source fingerprint saved in the acceptance directory. No push.
Model/effort and the upper-two-tier Taipei 101 brief are unchanged: gpt-6-astra,
medium. One headless live request; no generated fixture or substituted drawing.

### Observations compared with the immediately previous run

| Observation                               | Previous verified-facts run          | Combined stage                       |
| ----------------------------------------- | ------------------------------------ | ------------------------------------ |
| Request                                   | b3041c6b-4b4e-431e-9cb9-c0319348be3f | 00ac7e23-ce28-4f79-9ecf-ce38d3ba93a2 |
| Total                                     | 997.494 s                            | 846.515 s                            |
| First visible bounds                      | 235.757 s                            | 229.232 s                            |
| App calls / native research calls         | 52 / 10                              | 54 / 6                               |
| Rejected App calls                        | 4                                    | 7                                    |
| Observed tool/research union              | 45.212 s                             | 33.317 s                             |
| Final elements, excluding workspace       | 8,803                                | 7,334                                |
| Input / cached input tokens               | 3,750,225 / 3,601,280                | 3,033,151 / 2,913,792                |
| Output / reported reasoning output tokens | 20,133 / 6,947                       | 17,264 / 3,766                       |

The new run is about 151 seconds shorter, with first visibility only 6.5 seconds
earlier. Different generated geometry and decisions make this an observation,
not a controlled speed result or token/cost promise. The shared prompt shrank
from 53,391 to 13,983 source characters; total requests still include discovered
schemas, receipts and conversation. Do not attribute the elapsed difference to
prompt length alone. Input token sums include cached context across calls.

The first accepted plan at 154.983 s retained two verified source facts; bindings
were accepted subsequently. The previous run first recorded facts around 545 s.
Drawing mutations retained those facts. A focused visual assessment with
final=false explicitly failed spire/scroll contacts, correction followed, and a
current final assessment succeeded. This proves the new path was exercised;
it does not independently certify the model's source measurements or appearance.

### Complete App-tool diagnostic evidence

54 App calls have 54 input and 54 output payload snapshots. All 108 files were
read back and verified against recorded byte count and SHA-256: 2,903,625 bytes,
zero missing/mismatched files. Tool payload geometry/values are retained without
array truncation in local sidecars; redaction paths identify omitted credentials,
binary images, private reasoning and prompt fields. Console/model diagnostics
remain bounded summaries. Native provider research is represented by available
lifecycle evidence, not a claim to possess its hidden full response payloads.

New exclusive observed timing sums to total elapsed:

| Category                      | Seconds |
| ----------------------------- | ------: |
| App tool execution            |  19.246 |
| App tool queue                |   0.061 |
| Native research               |  14.011 |
| Provider reasoning-item spans | 158.551 |
| Provider response-item spans  |   7.597 |
| Provider request spans        |   0.494 |
| Unattributed                  | 646.556 |

No native wait or legacy unsplit tool span was observed. Reasoning-item duration
is reported provider lifecycle time, not all model compute. Legacy
`timing.unattributedMs` still means total minus tool/research only (813.199 s);
the new `timing.breakdown.unattributedMs` additionally removes observed provider
spans. These different definitions must not be mixed when comparing runs.

Seven rejected calls all belong to record_design_review: incorrect fact fields;
structure criteria outside the planned set; incorrect binding field name;
bindings supplied during structure review; final supplied outside visual review;
incorrect deferred-check field name; missing bound fact citation. Each rejection
executed in under 21 ms, but repair required further model interaction. The
schema diagnostics recovered successfully, yet this run does not demonstrate
reduced input trial-and-error. One reference image import returned unusable; the
model successfully imported another source instead of stopping. Two preparation
requests were blocked pending a successful structure review and were recovered. Receipt usability and model
visual judgment remain separate records.

### Visual review and validation

- Automated live case passed and retained the ten-second completed view. Final
  scene: seven groups and 7,327 vectors. No browser errors, no raster canonical
  content. Requested scale is recorded; some local dimensions remain estimates.
- Viewed completed-app.png and final overview inspection-10.png, plus native
  1000x1000 spire and ornament evidence inspection-11.png/inspection-12.png.
  The two main tiers, projecting bands, curtain-wall grid, crown, spire rings and
  shaded scroll ornaments are visible; the spire axis stays consistent. Materials
  remain stylized and repetitive. Some railing ends and ornament/window contacts
  remain awkward. This is not a claim of photorealistic fidelity or user approval.
- The App screenshot has a completion toast obscuring the lowest area; the saved
  overview provides the full subject. Preserve the original recording/evidence.
- 501 server tests passed; four existing opt-ins skipped. Five inspection E2E
  cases passed, two collaboration opt-ins skipped; one live drawing passed.
  Types, App/backend/report builds, naming and scoped lint passed. Three existing
  console warnings remain. Source-bound Inspector candidate and accepted review
  are recorded in the retrieval plan. The final wrapper verified unchanged source
  and cleaned up owned processes. No new remote CI claim.

Evidence root: `tmp/ai-diagnostics-prompt-acceptance-20261003/` contains source.json,
result.json, report.json and the inspection/live Playwright reports. Browser files
are under `taipei-live/browser/local-ai-provider-live-exe-366f2-rs-and-spire-from-one-brief-chromium/`.
Video: `page@9291d5652df0cdfabcc74c4a2eb4c3f4.webm` (44,647,447 bytes).
The recording starts with opening the App, opening Agent, filling the brief and
Send, then automatic viewport adjustment and final wait. Original provider record
and payloads remain in `tmp/ai-final-acceptance-20261003-r2/records/`, keyed by the
new request ID. `report.json` links every App call to its input/output files.

Contract Changes Detected: concise shared/discovered prompt ownership, source-fact
bindings, intermediate versus final checks, union admission diagnostics and local
per-call payload/timing evidence. Docs Updated: retrieval plan, execution spec,
Inspector owner contract and this results record. Validation is listed above.
Deferred Drift: no known contract/document mismatch in these changed owners;
model input retries and visual limitations are measured remaining product work.

## Clear requirements and phase-specific tool contracts - 2026-10-03

The approved STE-inspired change clarifies existing instructions; it does not
translate user requests into controlled English or add a model call. The original
brief remains authoritative. The existing plan separates observable requirements
from methods and assumptions. Review discovery now exposes complete, named
plan/facts/structure/visual alternatives containing only their applicable fields.
Exact criterion references, fact citations and current image evidence remain
runtime requirements. The unchanged provider passes multilingual intent verbatim.

### One-run before/after observations

Both runs use the identical Taipei 101 upper-two-tier/crown/spire brief and
`gpt-6-astra` with `medium` effort. The baseline is retained evidence, not a rerun.
The new request is `51e9ba2f-d902-48bb-8cb1-5e919434e870`; the baseline is
`00ac7e23-ce28-4f79-9ecf-ce38d3ba93a2`. Different reference acquisition, geometry
and model decisions prevent a causal speed or quality claim from this pair.

| Observation                          |    Before |     After |
| ------------------------------------ | --------: | --------: |
| Request duration                     | 846.515 s | 724.549 s |
| First visible bounds (browser clock) | 229.232 s | 217.696 s |
| App calls / native research calls    |    54 / 6 |    48 / 4 |
| Rejected App calls                   |         7 |         4 |
| Tool/research union                  |  33.317 s |  25.945 s |
| Final elements, excluding workspace  |     7,334 |     8,356 |
| Input tokens, including cached       | 3,033,151 | 2,039,848 |
| Cached input tokens                  | 2,913,792 | 1,918,080 |
| Input minus cached input             |   119,359 |   121,768 |
| Output tokens                        |    17,264 |    15,119 |
| Reported reasoning output tokens     |     3,766 |     3,717 |

This sample finished 121.967 seconds earlier (14.4%) and became visible only
11.536 seconds earlier (5.0%). Summed input fell 32.7%, largely cached input;
uncached input increased 2.0%. This is not a billing reduction claim. Element
count increased 13.9%; it is not a quality score. The requested one-to-two-minute
aspiration remains unmet.

The accepted plan at 138.877 s retains the original scope, view, appearance,
editability and scale in five criteria and separately labels estimated dimensions
in method. Structure acceptance follows at 275.042 s. Source facts survive later
mutations. Intermediate visual review at 559.252 s remains non-final; final
current-evidence review accepts at 713.618 s. This is evidence of exercising the
workflow, not independent certification of source measurements or visual fidelity.

### Remaining retries and complete tool evidence

The four rejected calls recovered within the same request:

1. Plan facts omitted `scope` and used dependency `id` instead of `key`.
2. `structureCriteria` paraphrased rather than copied a subset of `criteria`.
3. Fact bindings used `criteria` instead of `requirement`.
4. `read_design_context` requested a `limit` greater than its declared 200 maximum.

The first three repeat baseline failure classes despite clearer descriptions.
No wrong-phase review field rejection occurred this time, but a single observation
cannot prove the new schema eliminated that behavior. The existing read bound was
not introduced or changed in this stage. No completed import/preparation call
returned unusable in this run. Regional images correctly report partial scope;
that flag alone does not mean tool failure.

All 48 App calls retain input and output payloads: 96 sidecars, 1,517,943 bytes.
Every file was read back and matched its recorded byte count and SHA-256. There
were no missing or mismatched payloads. Existing redactions remain; native research
has lifecycle evidence, not an assertion that hidden response payloads were saved.

Exclusive timing breakdown (seconds): tool execution 16.967, queue 0.032, research
8.946, provider reasoning-item spans 154.831, provider response-item spans 7.521,
provider request spans 0.480, unattributed 535.772. These sum to 724.549. Do not
label all unattributed time as model thought or renderer work. The older total-minus-
tool/research measure is 698.604 s and uses a different definition.

### Visual comparison and limitations

Reviewed the final App screenshot, final overview (inspection-10), and native
ornament, spire-base and window details (inspection-11 through inspection-13).
Compared them with the baseline final overview and native spire/ornament details.

Both show the requested two tiers, crown and spire with editable vectors and a
consistent overall axis. The new image has dense window grids and gradient metal
shading, but its broad façade planes appear flatter, its scroll ornaments are
less articulated, and stray thin lines remain around the crown/shoulders. The
baseline has stronger corner and tier relief and more legible scroll structure.
This is a visual-review judgment, not a numeric similarity score. More elements
and an accepted model review did not produce a clear quality improvement.

The completed App screenshot's toast obscures the bottom area; the final overview
preserves the full subject. Evidence does not establish exact real-world dimensions
or photorealistic fidelity. Preserve this run rather than replacing it with a
more favorable second attempt. Further schema-exposure or visual-acceptance work
requires a separate bounded iteration; this stage does not silently broaden it.

### Validation and retained artifacts

- Formal test-first phase regressions failed in 13 cases before implementation;
  all 91 phase/operation tests then passed. The new prompt assertion failed before
  the guidance edit. Normal-provider tests prove unchanged multilingual intent
  and no extra translation turn for a direct response.
- Full server-response harness: 524 passed, four existing opt-ins skipped.
  Typecheck, App/report builds, naming, scoped ESLint and formatting passed.
  The final phase test rerun after lint correction passed all 41 cases.
- One full headless live test passed; unchanged-source fingerprint verified.
  No browser errors. Eight groups and 8,348 vectors remain. The video starts
  with App opening and Agent input/Send and retains the ten-second finished view.
  Owned services stopped; ports 3000, 4101 and 4201 have no listener.
- Source-bound Inspector candidate: `ac244f52-69b7-47a3-892d-354bb08db0d5`.
  Accepted contract review: `314a80e39d165873a2ea6cc89eca2fe48e6b99ae223b7f64b7799be915a5a8e2`.
  No remote push or CI claim.

Evidence root: `tmp/ai-clear-contract-acceptance-20261003/` contains source.json,
result.json, report.json and taipei-live-tests.json. Browser artifacts are in
`taipei-live/browser/local-ai-provider-live-exe-366f2-rs-and-spire-from-one-brief-chromium/`.
Video: `page@8b1f85a2f139887e0e205ec4ee6bcb19.webm` (40,316,299 bytes).
Provider records and payloads remain under
`tmp/ai-final-acceptance-20261003-r2/records/` using the new request ID.

Contract Changes Detected: original-request clarity in the existing plan and
phase-specific review discovery/admission. Docs Updated: execution spec, Inspector,
retrieval plan and this comparison. Deferred Drift: no known changed-owner
contract mismatch; repeated model argument errors and visual shortcomings remain
explicit product limitations. This stage's edits, test and comparison are complete;
it does not establish overall AI quality acceptance.

## Report-findings iteration - 2026-10-03 evening

### What changed

- `record_design_review`: criteria are stable IDs linked to original requirements
  and observable descriptions. Structure, facts and final checks reference those
  IDs. Final guidance compares deviations/relationships, not mere presence.
- `inspect_drawing`: returns rendered evidence without implicitly reading and
  attaching 200 object summaries. Explicit `read_design_context` owns data queries.
- `execute_design_batch`: prepared identities fill the unique identifier location
  in the registered API schema, including `request.elementIds`. Conflicts and
  ambiguous paths reject before identity lookup or canonical dispatch.
- `prepare_design` / `prepare_and_apply_design`: `vector-pattern` reuses exact
  2D curves at ordered positions; anchors, controls, order and editable output
  survive unchanged. Each preparation measures shared rings once. It does not
  create a persisted shared component or reduce detail/resolution.
- Reports retain public native exec/wait lifecycle names and the ten longest gaps
  between named App calls, with exclusive observed time categories. Missing
  provider coverage stays unknown; no private reasoning or native code is saved.

### One preserved live run

Same English upper-two-tier/crown/spire brief, gpt-6-astra, medium effort, headless
1920x1080, App opening/input/Send through ten seconds after completion. No second
stochastic attempt was used to replace the result.

Baseline: `51e9ba2f-d902-48bb-8cb1-5e919434e870`.
Candidate: `d360eb00-ac73-4e1c-9a01-778142df5f3f`.

| Observation                                 |      Baseline |       Candidate |
| ------------------------------------------- | ------------: | --------------: |
| Provider request duration                   |     724.549 s |       928.168 s |
| First visible bounds, browser timeline      |     217.696 s |       336.713 s |
| App operation calls                         |            48 |              42 |
| Thrown tool rejections                      |             4 |               3 |
| `inspect_drawing` calls                     |            14 |              10 |
| Implicit inspection element summaries       | 716,530 bytes |         0 bytes |
| Retained App input payloads                 | 657,017 bytes | 1,505,217 bytes |
| Retained App output payloads                | 860,926 bytes |   306,891 bytes |
| Reported input tokens, including cache      |     2,039,848 |       2,527,540 |
| Reported cached input tokens                |     1,918,080 |       2,401,024 |
| Uncached input tokens, subtraction          |       121,768 |         126,516 |
| Reported output tokens                      |        15,119 |          20,016 |
| Reported reasoning output tokens            |         3,717 |           5,388 |
| Final editable objects, excluding workspace |         8,356 |           3,608 |

The run completed and source fingerprint remained unchanged throughout it.
Browser errors were empty. The candidate has 9 Groups and 3,599 vectors. The
object count is descriptive, not proof of equivalent work or reduced rendering
cost: the two generated designs differ. Total duration increased 28%; first
visible output was about two minutes later. This is not a speed improvement.
Output payloads fell 64%, but input payloads more than doubled. Code Mode can
expand authoring input before dispatch; byte counts do not establish how much
coordinate text the model generated directly.

### What the new evidence establishes

1. Criteria remained concrete through recovery. The accepted plan retained six
   checks and four structural IDs, including flared modules, stepped corners,
   coherent depth, reflective glazing, ornaments and physical scale. It did not
   collapse to scope/view-only acceptance as in the baseline.
2. Curve reuse was actually used. The two tier detail batches each supplied 160
   templates for 696 placements; the crown supplied 56 for 986 placements; the
   ornaments supplied 22 for 44 placements. These are separate source geometries,
   not a duplicate apply of one tier. Both tier drafts differ in geometry/position.
3. Five plural artifact target references were used for Fill target lookup. The
   nested hierarchy resolver is formally tested; this live run still supplied
   explicit IDs for its hierarchy moves, so it does not prove model adoption of
   that new path.
4. There were six unusable responses in total, not merely the three thrown
   rejections: one unavailable reference image; a plan with incorrect fact fields;
   a forbidden root key; plural `factIds` where the binding schema needs `factId`;
   a structure check following that failed binding; and an oversized native
   inspection without an explicit overview/region. All recovered. A completed
   transport call is not equivalent to usable output.
5. The longest observed App-call gaps were 131.026 s (`inspect_drawing` to
   `prepare_and_apply_design`), 111.560 s (between two drawing batches), 100.000 s
   (accepted plan to first preparation), and 94.170 s (structure acceptance to
   tier details). These locate waiting; they do not reveal private model compute.

Exclusive observed timing: App execution 22.912 s, queue 0.058 s, research
13.849 s, provider reasoning-item lifecycle 224.217 s, response lifecycle
8.665 s, provider requests 0.437 s, unknown 658.031 s. No paired native exec/wait
lifecycle was exposed in this run, so orchestration-event time remains zero,
meaning no observed interval rather than proof that native orchestration was free.
Do not label the unknown interval as rendering or model thinking.

### Visual review and limits

Reviewed completed-app.png, final overview inspection-4, and native crops
inspection-5 through inspection-8 (ornaments, crown, spire collar and glazing).
The candidate has clearer corner depth, articulated scroll ornaments, cornices
and glazing than the immediately preceding flatter result. Some fine lines still
extend outside shoulders/crown, and metal/ornament forms remain stylized. The AI
accepted every criterion, but that does not establish photorealism or fully
faithful reference reconstruction. Estimated physical dimensions are disclosed
in the final reply. The App toast partly covers the bottom of the canvas; use the
full overview to judge the entire subject.

### Validation and follow-up boundary

- Server suite: 533 passed, 4 existing opt-in skips; App inspection: 6 passed.
  Typecheck, scoped ESLint, naming, App/report builds passed.
- Root-cwd launches initially exhausted Node memory in the TypeScript API
  inventory test. Running from the documented App cwd passed. This was a launch
  error, not evidence of a product rendering/memory regression.
- The final changed-owner review found the new vector-pattern path could bypass
  the old root-only planar structure guard. Two new root/nested regressions
  reproduced it before correction. The guard now covers both pattern forms.
  This correction was after the recorded run; the run itself passed structure
  review at 378.949 s before its first vector-pattern call at 473.119 s. It does
  not exercise the bypass; post-correction formal gates cover that branch.
- 84 payload snapshots, 1,812,108 bytes, verified against recorded byte counts and
  SHA-256 digests. Owned services closed; no listeners on 3000/4101/4201.
- No push. This completes the bounded report-findings changes and one live test;
  it does not close the broader speed or visual-quality objective.

Next investigation candidates, not automatic scope expansion: fact/binding schema
mismatch and error recovery; more compact authoring of repeated whole motifs and
stages; and the gap between model acceptance and visible boundary defects. Retain
this slower result and its input/output records rather than claiming savings from
fewer calls or rerunning until a favorable time appears.

Evidence: `tmp/ai-report-findings-acceptance-20261003/` contains source.json,
result.json, report.json and taipei-live-tests.json. Browser artifacts are under
`taipei-live/browser/local-ai-provider-live-exe-366f2-rs-and-spire-from-one-brief-chromium/`.
Recording: `page@b6a30c23b96ff72b9830ba6d5c271032.webm`.
Provider record/payloads remain in `tmp/ai-final-acceptance-20261003-r2/records/`.

## Integrated lifecycle, budget admission and requested-view test - 2026-10-04

Status: implementation gates passed; full live acceptance failed. This section does
not close the drawing-quality or speed objective.

### Change and test identity

- Continuous request/provider spans and explicit child assessment correlation now
  separate AI/provider, tool-own and App exchange intervals. Reports distinguish
  inclusive call duration from exclusive ownership; provider waiting is not private
  model reasoning. Historical missing intervals are not retroactively invented.
- Preparation inspects source/expanded nodes, path commands and depth together
  before geometry compilation. Native schema rejection exposes the same owner
  budget explanation. Formal tests prove compiler work is zero on rejection and
  geometry/identities survive valid input; limits remain unchanged.
- Independent assessment compares the view with the user's request. The live brief
  explicitly adds an elevated three-quarter view looking down, with visible top
  surfaces. No angle or universal detail level is imposed by the App.
- Recording navigation belongs only to the test: first confirmed overall bounds,
  then actual terminal settlement. Questions do not settle; normal App has no
  automatic fit. A regression now identifies navigation/reload interruptions.

Baseline: `16440f14-7757-467a-ab9c-c8d9dfd75aa4`, from
`tmp/integrated-region-live-20261004/`. Candidate:
`e1ffcf38-8b7a-4050-a1e0-d1463ba4f777`, under
`tmp/lifecycle-integrated-live-20261004-clean/`. Both used gpt-6-astra medium.
The candidate includes the explicit downward-view requirement; this is an observed
comparison, not an equivalent-work deterministic performance benchmark.

| Observation                               | Earlier accepted run | Candidate                         |
| ----------------------------------------- | -------------------- | --------------------------------- |
| Total invocation                          | 641.667 s            | 1,804.131 s; test guard cancelled |
| First applied drawing                     | 230.487 s            | 256.306 s                         |
| Canonical elements, excluding workspace   | 2,076                | 8,824 at interruption             |
| Rejected App tool inputs                  | 2                    | 3                                 |
| Uncovered interval in detailed accounting | 498.100 s            | 0 s                               |
| Final visual acceptance                   | Passed               | Not reached                       |
| Durable completion match                  | Verified             | Not reached                       |

Zero uncovered time is an instrumentation improvement, not 498 seconds saved.
Candidate exclusive invocation ownership: provider 1,770.391 s (98.13%), App
31.315 s (1.74%), tool own/queue 2.425 s (0.13%). Provider includes 118.996 s
of independent assessment waits and 1,204.198 s of provider-owned waiting outside
more specific observed events. Neither number proves hidden model compute time.
All categories sum to the observed invocation duration without double-counting.
The terminal outcome is cancelled. One native dynamic-call item lacks completion
because it was interrupted, so `complete=false` remains correct despite continuous
lifecycle coverage.

### What the run established

All four reference imports succeeded. The first canvas batch applied 138 elements
at 256.306 s; the first recording fit occurred at 319.948 s after complete scope
was established. There were 113 App tool starts, 112 completions, 26 explicit
inspection calls and 40 batch-edit calls. Three rejected inputs were an empty
`execute_design_batch.operations`, a `read_design_context` limit above 200, and an
unsupported gradient discriminator in `prepare_and_apply_design`. Subsequent calls
continued; this does not mean the input mistakes or correction cost were eliminated.
No construction-budget rejection occurred in this candidate; formal tests provide
that path's evidence, not this live result.

Independent visual checks passed scope and elevated viewpoint, but twice rejected
spire joint appearance and insufficient material/ornament fidelity. Ornament
corrections were recognized on the second review. A further final review was
interrupted by the existing test guard; no successful final result may be inferred.
Manual inspection of `last-app.png` and native `inspection-25.png` shows the elevated
view and dense façade detail, with the latest mast geometry improved but remaining
flat/segmented shading. These observations do not replace pending final acceptance.

The recording contains only the initial fit because the driver did not reach
terminal settlement. Final fit, successful checkpoint equality and the ten-second
completed hold were therefore not exercised. The formal recording tests cover the
success path; this video is explicitly unfinished evidence.

### Evidence and validation

The first attempt `ff4720cd-5464-4ca8-958d-a4c5b5e5558b` was interrupted after the
agent edited development Markdown during recording, triggering the development
reload path. Preserve it separately in `tmp/lifecycle-integrated-live-20261004/`.
The replacement froze 3,690 project source/document/config files plus `.env`:
`source-verification.json` confirms no changes. No browser errors or reloads occurred.

Candidate `result.json` and `report.json` contain the concise result and full report;
`records/` contains ordered events and 1,671 input/output payloads (63,918,925 bytes),
all verified against recorded size and SHA-256. Browser evidence, document, native
inspection images and the video are under
`browser/local-ai-provider-live-exe-366f2-rs-and-spire-from-one-brief-chromium/`.
Video: `attachments/execution-video-89b01b49f0eb339eedef66c756a229b0be6b7888.webm`.

Formal gates: 617 server tests passed with five existing skips; 373 App AI tests and
five recording tests passed. Typecheck, App/report builds, naming and scoped lint
passed (zero lint errors, three existing warnings). Source-bound proof
`ad2d185a-bb74-46fe-a241-a6eff3e4e739` passed one flow, three negative cases and
seven obligations. Live E2E: one replacement run, failed at the test guard.
Owned services on 3000/4101/4201 were closed. Local `.env` was retained; the opt-in
E2E flag was restored after hash verification. No commit or push.

This evidence does not support a claim of faster generation or complete resolution.
The remaining observed cost is repeated provider preparation/correction between
short App operations, with three exact input-contract mistakes and unresolved
visual review. Keep those findings separate from the completed recording/admission
changes; do not expand geometry/camera/quality rules to force this fixture to pass.
