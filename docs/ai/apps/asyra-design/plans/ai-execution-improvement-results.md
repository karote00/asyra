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
