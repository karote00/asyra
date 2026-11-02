# AI conversation corrections - implementation and Taipei 101 report

Date: 2026-11-02 (Taiwan). Status: local implementation and one live test complete;
user review pending. Parent: [Editable Design Agent](ai-design-agent-plan.md#conversation-continuity-and-tool-contract-corrections---2026-11-02).

## Scope and delivered behavior

Worktree: `.worktrees/ai-conversation-improvements`. Branch:
`codex/ai-conversation-improvements`. No push, PR, merge or publication.

| Stage | Delivered behavior | Review and regression evidence |
| --- | --- | --- |
| 1 - Conversation continuity | Exact settled intents, replies, clarification questions/choices/answers and source associations reach the next request. Current intent takes precedence. Current targets and evidence are revalidated. Projection occurs once per submission, not during progress notifications. | Controller/presentation 106 pass; server admission 19 pass; provider/prompt 199 pass and one existing skip. Actual serialized native request and separate image delivery verified. Inspector source proof passed. |
| 2 - Attachment ownership | One per-conversation draft map; asynchronous reads retain their original conversation and draft generation. Navigation preserves pending drafts; accepted submission retires the generation; unmount rejects late updates. | Three failures reproduced before correction; all 40 panel tests pass. Deferred-read browser case proves the subsequent submission uses the correct image. |
| 3 - Tool guidance | Removed implicit image dependency guidance that contradicted mandatory explicit per-check bindings. Existing schemas and validators remain authoritative. | Prompt regression failed before correction; all 129 prompt/review cases pass, including missing/foreign/stale bindings and valid sparse subsets. No validator weakening. |
| 4 - Complete flow and recording | Browser follow-ups, multi-object style changes, untouched-object preservation, undo/redo, failure/retry contracts, docs/template synchronization and a permanent locked-prompt live recorder. | Full applicable App gates passed before the single live run. Recording-only defects discovered afterward were reproduced and corrected, with separate no-AI saved-document verification. |

Each stage was reviewed before the next stage. Scope excludes renderer/geometry
changes, model/effort changes, dependency additions and unrelated release repairs.
History is bounded to 128 prior turns, 128 KiB serialized text context and 8 MiB
serialized source attachments. Exceeding a bound produces an actionable refusal
before Feature execution; it does not silently truncate or summarize requirements.

Implementation commits: `52c5e4bd8`, `d7912966f`, `ba3f3d01c`, `ca8364763`.
The live-tested source is **`ca83647639baa03906a467942cd9c0f20f8225d2`**.
Subsequent changes affect recording verification, local-record template exclusions
and documentation only; the production conversation implementation is unchanged.

## Validation

| Gate | Result |
| --- | --- |
| App AI tests | 619 passed |
| App local tests | 159 Node cases and 666 Vitest cases passed |
| Server response harness | 1,308 passed; two existing skips |
| Runtime boundary tests | 13 passed |
| Static-source browser conversation/navigation flows | 29 passed; three opt-in performance cases skipped |
| Additional navigation/style acceptance | Four passed, including delayed image ownership, single/multiple selection, preserved unrelated object and one undo/redo per request |
| Inspector contracts / final source proof | 24 contracts passed; candidate `cab4e9b3-7cee-4173-9c71-b7af69b5d9e4` passed |
| App typecheck, production build, scoped lint, naming | Passed |
| Generated template parity and local template build | Passed |
| Post-live recorder regressions | Two red cases before correction; all three contract tests green afterward; scoped lint and naming passed |

Counts overlap between focused and aggregate suites; do not sum them as unique
coverage. Narrow/wide panel and attachment/style screenshots were inspected.
Two early browser attempts were invalidated by concurrent manifest/package builds
and Vite reconnects. Their evidence is retained; the frozen-source rerun passed.
No production history change was made to accommodate that harness disturbance.

Template synchronization updated **349 generated template paths**, including
existing drift. Output was generated, not edited manually. Local template
build/parity passed. The final parity check exposed local execution records as
candidate template content; `tmp` was excluded and raw records were preserved.

### Correction to validation scope

The agent incorrectly ran release-only checks and asked to expand this development
task to fix them. Asa explicitly rejected that expansion: when the task is not a
release, release workflows and their checks are outside scope. No release check
is a prerequisite, blocker or outstanding deliverable for these corrections.
Do not rerun or repair release checks as part of this task.

For historical accuracy only, the unnecessary standalone probe encountered
`@asyra/domain-knowledge: workspace:*`; the unnecessary full release suite had
32 passes and one related failure. Original logs remain intact. These results
are excluded from App acceptance and do not create a release follow-up task.
The release package set and domain-knowledge publication integration were not
changed. The earlier scope-expansion question is withdrawn.

## Locked live test

Run: `taipei-101-fixed-1793560952884`.
Provider request: `aca349a7-de29-40f3-b270-13761f89e687`.
Root runtime request: `03fabc5e-949e-433f-938a-5bd82d3cad90`.
Source fingerprint: `cadc58f1743effbe7358cb720f715e48496396a54d0ae058080e78abf8563e8a`.

The runner read [the canonical prompt](../../../../../apps/asyra-design/test-data/ai-drawing/taipei-101-full-building-prompt.txt)
and removed only its final newline. Fixture SHA-256:
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
The composer and actual root request matched. There was exactly **one** user
submission, with no attachments, history, seeded artwork or test-only coaching.
No follow-up answer was needed. The ordinary production agent chose its own
research and drawing approach. Historical run instructions were used only to
understand recording, timeout and reporting procedures.

Command: `yarn workspace @asyra/asyra-design test:live:taipei-101`.
Configured provider/model/effort: `local-codex` / `gpt-6-astra` / `medium`.
Viewport: 1920 x 1080. Owned services: App 3045, collaboration 4145, document backend
4245. Source and package outputs remained static during execution. The recording
limit was ten minutes; the App completed normally before the limit. All owned
services were stopped, and the three ports were verified free afterward.

| Measurement | Observed value |
| --- | --- |
| Submitted | 2026-11-02 03:22:38.147 Taiwan |
| Provider finished | 2026-11-02 03:28:30.403 Taiwan |
| User submission to App settlement | **352.501 seconds (5 minutes 52.501 seconds)** |
| First paint opportunity | **50.205 seconds**; first saved image visibly contains building base/window geometry |
| Provider request duration | 351.829 seconds |
| App root request bytes | 351,286 |
| Provider wire bytes sent / received | 9,418,794 / 12,749,633 |
| Final canonical nodes | **20,906 vectors + 12 groups + 1 frame + 1 workspace = 20,920** |
| App outcome | `success`, `executed`; no clarification or timeout |
| Persistence | sequence 697 = durable sequence 697, generation 0 |
| Provider recording failures | 0; structured execution report complete, no record issues |
| Saved video | 33,069,445 bytes |

First paint opportunity is a browser instrumentation metric, not a visual quality
score. There is no comparable before/after live baseline, so this run establishes
an observed latency, not a speedup. CPU and peak memory were not sampled.

### Tool and research behavior

There were 48 completed tool calls, all classified usable, with zero partial,
rejected or failed tool outcomes. The report also contains one unknown native
research entry; it is not an additional failed App tool.

| Tool | Calls |
| --- | ---: |
| `describe_design_apis` | 9 |
| `import_reference_image` | 4 |
| `define_design_criteria` | 1 |
| `prepare_and_apply_design` | 6 |
| `select_design_references` | 1 |
| `record_design_facts` | 1 |
| `review_drawing` | 8 |
| `read_design_context` | 1 |
| `retain_design_targets` | 1 |
| `execute_design_batch` | 3 |
| `read_design_checks` | 3 |
| `review_design` | 10 |

One observed native web-search event completed in 2.047 seconds. Four image-import
calls supplied eight successful reference images, with retained source identity
and original dimensions. The agent recorded two source assertions about height
and module arrangement. Those are model-authored assertions, not independent
verification by this report. No failed-source recovery was exercised by this live
run; deterministic suites cover recovery separately. Native model inference round
counts and program parent relationships are unavailable and are not inferred from
tool counts.

The final `review_drawing` receipt reports six required checks, six passed, no
pending coverage, no deferred detail/check, no regressions and `accepted: true`.
Its check result summary records 5,243 passes and zero fail/unverified/stale results.
These counts reflect the product's checks and model judgments, not 5,243 independent
visual inspections. The offline report separately records `modelReview.current:
false` and `certifiesVisuals: false`; it does not certify final visual freshness.
Preserve that distinction rather than overriding the conservative report flag with
the accepted receipt. No post-run model assessment was requested.

### Time and usage attribution

The existing offline execution-report CLI attributes exclusive owner time as:
provider 323.939 seconds, App 24.209 seconds, tools 3.681 seconds, recording gap zero.
Within the detailed breakdown, provider wait is 308.333 seconds, App exchange
24.087 seconds, tool execution 3.535 seconds, tool queue 0.146 seconds and research
2.047 seconds. These categories follow the profiler's ownership model. Provider
wait is not a measurement of private model reasoning or a CPU bottleneck.

Reported usage: input 1,828,763 tokens, including 1,710,592 cached input tokens;
output 13,882, including 2,600 reasoning output tokens; total 1,842,645. These are
aggregated provider usage, not unique prompt size or account credits. The browser
phase buffer reached its 16,384-entry bound; use durable provider records for the
full execution rather than treating that browser buffer as an unlimited trace.

## Visual and persistence assessment

Inspected `first.png`, `final.png`, `base.png`, `tiers.png`, `spire.png`,
`native-detail.png` and the separate verified reopen screenshot. The entire base,
tiered shaft, crown and spire are visible. Two principal facades and top surfaces
follow a consistent elevated three-quarter treatment. Dense window/frame geometry,
projecting ledges and visible ornament are present as editable vectors.

**The result is still a stylized vector architectural illustration.** Repeated
window treatments, simplified base/crown/spire and limited material variation do
not establish the requested highly realistic architectural detail. High node
counts and a successful App result cannot close that quality gap. The agent states
that secondary dimensions were estimated from photographs. Exact unseen geometry,
all ornament fidelity and construction-scale architectural accuracy are not
independently certified. Final artwork acceptance remains with Asa.

The saved backend checkpoint equals the completion snapshot's document exactly.
A separate reopen loaded all 20,920 nodes in **12.527 seconds** and proved deep
saved-document equality. Its AI routes were blocked and it recorded **zero AI
requests**. This is persistence verification of the original drawing, not a second
AI test. The reopened screenshot was inspected and shows the complete drawing.

### Recording defects and retained evidence

The original recorder treated every POST to the action-batch endpoint as a new
user submission. It therefore logged 397 endpoint requests and 396 false prompt
mismatch errors: one real user submission plus 396 execution receipt POSTs. The
fixed prompt was not changed and these observational errors did not modify traffic
or cause extra prompts. Classification now uses the canonical receipt header.

The original reload capture waited only for socket connection, resulting in a
blank `reload.png` before the large document finished loading. This image is not
passing reload evidence. A permanent regression now rejects connected-but-empty or
partially loaded states. The separate reopen proof above supplies valid evidence.
Original `run.json`, its errors and the blank image were preserved unchanged.
Two failing tests were demonstrated before correcting the recorder. All three
recorder contract tests now pass; no production code or generated drawing was
altered, and the AI run was not repeated.

## Evidence locations and review handoff

All local evidence is retained under `tmp/conversation-improvements/` in this
worktree; large raw artifacts are intentionally local and are not committed.
The report and permanent test helpers are committed project files.

- [Verified reopened drawing](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793560952884/reload-review-1793561569602/reloaded.png)
- [Video](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793560952884/recording.webm)
- [Original run record](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793560952884/run.json)
- [Editable completion snapshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793560952884/source-snapshot.json.gz)
- [No-AI reopen proof](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793560952884/reload-review-1793561569602/review.json)
- [Structured offline execution report](../../../../../tmp/conversation-improvements/execution-report.json)
- Provider JSONL, input/output payloads, imported assets, durable backend documents,
  service logs and all detail screenshots are in the same live-run directory.
- Stage evidence: `task1-*`, `task2-*`, `task3-*`, browser attempt directories and
  `recorder-correction-*` logs under the evidence root.

Credit checks followed the requested 30-minute cadence. Last measured balance was
31,095.6336655 at approximately 03:22 Taiwan; that is a past reading, not a final
balance or the isolated live-test cost. No extra balance query is made just to
close this report before the next scheduled interval.

The four bounded corrections and single-run reporting task are complete. Review
the generated artwork and implementation before choosing further work. Future
quality improvements and conservative report freshness classification require
a separate bounded task. No release work is pending under this task.
The parent Editable Design Agent plan remains open.
