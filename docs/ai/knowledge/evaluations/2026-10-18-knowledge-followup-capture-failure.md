# Knowledge-only Taipei 101 - interrupted capture evaluation

## Outcome

The single authorized run failed in the evaluator, not in an observed App tool.
At 111.404 seconds after Send the collector stopped owned generation and browser
processes because it misclassified a valid browser execution receipt as a new
model request. The first base/tower-foot content was observed at 110.176 seconds.
No second model run, control arm, push or monitoring occurred. The drawing is
unfinished; this report must not be interpreted as a quality acceptance.

## Frozen conditions and evidence

- Run: `knowledge-quality-knowledge-taipei-101-1792336440948`.
- Send: `2026-10-18T15:14:05.806Z`; independent deadline: `15:24:05.806Z`.
- Actual provider record: `f0a8bf4b-4a7a-4abf-b294-887af2824cf3`;
  source request: `b328ca86-bfc2-477b-bf92-182d9a3585d9`.
- Actual recorded model/effort: `gpt-6-astra` / `medium`.
- Fixed 1920 x 1080, original architecture prompt and two reference hashes,
  fresh document, verified empty isolated tool library before launch.
- Frozen source archive and digest are in the run directory's `run.json` and
  `source-snapshot.json.gz`. Post-run collector correction is not run source.
- Both `illustration.architecture` and `design.architectural-illustration` were
  delivered. No additional reviewer-model stream was observed.

All current evidence lives under
`tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792336440948/`:
`run.json`, `deadline.json`, `partial-metrics.json`, `partial-trace-analysis.json`,
`preserved-provider/` (available raw stream plus 29 payload artifacts),
`first.png`, `last-recorded-frame.png`, `partial-recording.webm`,
`video-recovery-verification.json`, `partial-backend-checkpoint.json` and
`partial-recovery.json`. Raw browser video remains under `browser-artifacts/`.
The incomplete provider lifecycle is preserved, never supplied with a synthetic
completion event. The normal analyzer rejects this run; partial metrics are
explicitly separate and cannot certify final quality.

## Comparison with the saved Knowledge run

The saved prior run is `knowledge-quality-knowledge-taipei-101-1792323795116`.
These are descriptive observations with different generated geometry and an
interrupted candidate, not an isolated causal Knowledge comparison.

| Measure | Prior Knowledge run | New Knowledge run | Interpretation |
| --- | --- | --- | --- |
| First observed content | 98.568 s | 110.176 s | New run is 11.608 s later; no first-frame speed improvement demonstrated. Bounds/polling observation, not GPU presentation telemetry. |
| Complete generation | 496.629 s UI completion | Stopped at 111.404 s | Cannot compare total completion speed. |
| Definition queries before first construction | 6 | 2 | New agent successfully selected exact capabilities in fewer pre-construction queries. |
| Definition response bytes before first construction | 195370 | 125246 | Lower observed prefix volume; not a complete-run traffic reduction claim. |
| Whole-run definition queries | 13 | 2 before interruption | Unequal coverage; do not claim an 85% whole-run reduction. |
| Tool selection errors in observed interval | None in prior completed run | Zero missing names; all 9 completed App calls usable | No wrong-tool rejection observed. |
| Material decisions before first construction | First brief mainly states dimensional uncertainty; later crown/glass repairs | Criteria and brief explicitly separate continuous glass color, frames, metal, shadows and face lighting | Evidence of earlier articulated material planning; final visual efficacy untested. |
| First preparation input | 13131 UTF-8 bytes | 8860 UTF-8 bytes | Different base geometry/motifs; raw size alone is not an optimization proof. |
| Material templates in first preparation | Already used | Used for all 31 authored material occurrences; 9 compiled fill definitions | Template use is not new. Whole-tower reflection representation remains unobserved. |
| Reflection refinement input | 670447 bytes, later full-building refinement | Not reached | Cannot claim the large reflection input is fixed in a real task. |
| Rework | Two identifiable material/reflection correction episodes | No correction episode before interruption | Not evidence of less rework. |
| Final quality | Complete illustration, with patterned reflection limitations | Only podium and tower foot | No final quality comparison is possible. |
| Capture/persistence | Original reload collector failed; separate read-only recovery | Collector failed on execution receipt; partial backend state recovered | End-to-end capture did not pass in either run. |

## Timing by observed owner boundary

Origin for phases is the provider start, 0.279 seconds after Send. Tool intervals
are unioned so nested tool work is counted only once. No native research interval
was observed. Provider-side residual includes generation, decisions, scheduling
and transport; private thinking time cannot be extracted from this stream.

| Stage | Wall s | App tools s | Provider-side residual s | Evaluator/stop s | Completed App calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Reference, Knowledge and first-part planning | 107.120 | 0.073 | 107.047 | 0 | 8 |
| Base and tower-foot preparation/application | 2.754 | 2.754 | 0 | 0 | 1 |
| Receipt misclassification and forced stop | 1.251 | 0 | Not attributable to AI | 1.251 | 0 |

Provider startup adds 0.279 s, giving 111.404 s from Send to stopped result.
Total observed App-tool union is 2.827 s. Available completed calls carried
12091 input bytes and 165861 output bytes, excluding image/transport envelopes.
There is no terminal usage event, so final token totals and full provider duration
are unavailable. No fabricated estimates replace them.

The first main call's result reports construction 20.527 ms, admission 12.910 ms
and compilation 79.715 ms. Its browser application reports admission 108.100 ms,
creation 1096.400 ms, cooperative yield 92.700 ms and total 2195.600 ms. These are
nested measurements inside the 2.754 s main call; do not add them to wall time.

## Root cause and post-run correction

`server-action-batch-provider.ts` sends both model inputs and browser execution
receipts to `ACTION_BATCH_ENDPOINT`. A receipt carries `AI_BATCH_RECEIPT_HEADER`
and its receipt body, not `metadata.sourceRequestId`. `server/action-batch.ts`
recognizes the header before interpreting a model input. The collector checked
only URL and method, then required source identity from every body. It therefore
rejected the valid first execution acknowledgement immediately after drawing.
The prior formal browser fixture exercised only the model-input POST, so it did
not represent the real bidirectional exchange. This is a collector protocol
coverage failure, not an absence of Knowledge or an App capability rejection.

Post-run, a permanent regression first failed on the unmodified collector. The
collector now uses the canonical receipt-header branch before reading model
metadata. Missing identity on an actual model request still fails. The formal
real-browser capture now sends both requests to the same endpoint and verifies
only the model request contributes an identity. No App or Runtime tool contract
was changed. All 32 evidence tests passed, plus focused ESLint. This offline
correction does not retroactively turn the interrupted model run green.

Logs: `tmp/knowledge-live-receipt-red.log`,
`tmp/knowledge-live-receipt-green.log`, `tmp/knowledge-live-receipt-lint.log`.

## Four-item verdict

| Item | Verdict |
| --- | --- |
| Knowledge-to-tool guidance and exact discovery | Partial positive evidence: qualified lookup succeeds and pre-construction queries fall from 6 to 2. First content is still later; no overall speed claim. |
| Material-role decisions before repetition | Earlier explicit role/light decisions observed. Final joins, reflections and subsequent repair needs are not evaluated. |
| Compact representation and retained-query consumers | Templates compile successfully, but prior run also used them. No large reflection pass or retained-query local edit occurs before the stop; real-task effectiveness remains unverified. |
| Reliable evidence capture and stop/recovery | Failed full capture. Force stop and original-failure preservation worked; valid receipt classification was missing and is now corrected offline. The normal report correctly refuses incomplete evidence. |

## Visual and recovery limits

Actual first and final-recorded frames were inspected: the image contains a
projected low podium and a tapered tower foot with window grids, differentiated
faces and a metal/glass band. It contains no upper bamboo tiers, crown, spire or
completed ornament. Those are unfinished planned parts, not diagnosed drawing
errors. No whole-building material-quality or local-edit preservation claim.

The UI retains the concrete planning message with an explicit task-context label;
the interval is too short to assess parallel status handoffs or long-run stale
status. A one-second sampler can miss short tool execution labels.

The watchdog stopped the owned Vite/provider group and browser processes with
zero stop errors, before the ten-minute cap. The recording was remuxed without
changing frame content to a separate 115.840 s WebM and played to its end in
Chromium. It includes setup before Send; it is not a final-completion recording.
The original spool is retained. Forced shutdown interrupted provider lifecycle
closure and browser-context cleanup; both remain visible failures.

A read-only backend export recovered 28829343 bytes, durableSequence 140 and
documentGeneration 0. No original client persistence receipt or fresh App reload
was obtained, so this does not prove saved/reloaded document equality. All three
agent-started services were stopped after recovery. User documents and .env were
not reset or deleted.

## Last selected references

No final drawing or final reference acceptance exists. Before interruption the
agent selected these exact supplied references with restricted uses:

1. Aerial: massing, silhouette and podium relationships only; not window sizes,
   precise geometry or construction equipment.
2. Ornament close-up: visible metal scroll form/material only; not exact size or
   unseen geometry. The ornament had not yet been drawn.

The unchanged files are
`apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/reference-0.jpg`
and `reference-1.jpg`, with hashes frozen in `architecture-101.json` and the run.
