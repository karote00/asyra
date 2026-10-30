# Knowledge-only Taipei 101 - protocol follow-up evaluation

## Did Knowledge help?

**The saved I/O shows relevant advice being used in planning and execution, with
positive evidence for material representation and scoped edits. It does not show
less rework or a uniformly better illustration.** Reading a module alone receives
no efficacy credit. Portable domain methods and App-specific tool mappings are
separate contributors; this observation cannot isolate their individual effects.

| Knowledge method | Adoption in actual input/output | Observed help | Remaining limitation |
| --- | --- | --- | --- |
| Establish one spatial model before detail | Initial criteria choose world centimeters, a fixed elevated projection, visible surfaces and uncertainty; the first construction is whole-building massing. | Coherent projection and a complete silhouette are retained. | The podium's attached-volume relationships are not better than the prior drawing; advice did not guarantee correct reference interpretation. |
| Decide glass, metal and lighting roles early | Before construction, criteria and brief distinguish glass and frames, left/right illumination and continuous reflection; all six construction calls use material templates. | Decisions reach actual fills and geometry, not just a read acknowledgement. Final glass/frame separation and continuous lighting have positive visual evidence. | Reflection still requires a late correction; the initial role plan does not prove the first rendered material was adequate. |
| Represent repetition as rules and equal paint as templates | Facade calls use surface grids, shared definitions and placement rules; unique ornament geometry remains explicit. | Repeated construction is delegated to tools while preserving requested detail. | The 162182-byte ornament input is still substantial. This is not evidence that every shape can use a compact representation. |
| Repair existing affected parts rather than rebuilding them | The App mapping leads to exact fill/deletion operations with artifact keys; the 2147-byte correction patches the existing left/right tier faces and removes old arches. | The previous 670447-byte reflection construction is replaced by scoped edits in this sample. | The two corrections render different results; smaller payload alone is not equivalent quality. Query-material mapping was not exercised. |
| Inspect supported relationships and affected results | The primary agent detects crown occlusion, a wrong ornament crop, polygonal arches and uniform reflection, then uses scoped repair/review. | Concrete defects are identified and repaired without extra reviewer models. | Repair episodes remain two, and visual captures increase from four to seven. Knowledge has not demonstrated reduced review effort. |
| Find the capability appropriate to the intended method | Initial definition queries fall from six to three; later deletion/fill queries resolve exact operations and usable targets. | Useful App guidance reaches correct executable routes. | Ten total queries remain, including a 65110-byte definition refresh. This does not prove the AI consistently chooses the shortest discovery path. |

The construction with call ID `exec-76a90d0e-db59-470e-b16a-6dab973bcad0`
uses two `parts`, each with six fill templates. Its retained input was manually
checked: the automated representation summary only handles a top-level draft and
marks that entry unavailable. The raw input is present; the report does not infer
its adoption from that incomplete summary.

**No causal estimate of Knowledge's speed or token benefit is available.** The
comparison below is between two Knowledge runs with changed guidance/tool support
and independently generated designs. There is no no-Knowledge control. Faster
first content and smaller repair input are useful observations, not proof that
Knowledge alone caused them. Input tokens actually increased. The strongest
current evidence is the traceable advice -> decision -> tool-input chain; the
weakest areas remain attached massing, early visual adequacy and reduced rework.

## Result and scope

One authorized Knowledge-only run completed drawing in **366.088 s** (6 min
6.088 s), before the independent 600000 ms cutoff. First observed drawing content
appeared at **59.743 s**. The original final view, complete available provider I/O,
recording, source fingerprint and durable checkpoint were saved. No second arm,
automatic inference retry, push, PR or monitoring was performed.

**The end-to-end evaluator still failed its automatic reload stage.** A separate
read-only recovery subsequently loaded the same document and confirmed the same
roots and durable sequence. Do not turn the original failure green. Generation
analysis is valid independently of that failed reload gate; the normal complete
report command correctly rejects this run.

## Fixed conditions and evidence

- Run: `knowledge-quality-knowledge-taipei-101-1792337950811`.
- Send: `2026-10-18T15:39:16.236Z` (23:39:16.236 Asia/Taipei).
- UI success: `2026-10-18T15:45:22.321Z` (23:45:22.321 Asia/Taipei).
- Model record: `d9bbe926-dd20-4dbc-af4a-bdc8f46f646d`.
- Exact source request: `460976f4-afe9-43d5-9523-af68c06ea415`.
- Recorded model and effort: `gpt-6-astra` / `medium`.
- One model stream, complete terminal lifecycle, zero recording failures. An
  additional completed host-only record has model `none`; it is not another AI.
- Current source digest: `47303e804fe686ef1a7e2e4997a88f00d3f3f99cbb6ab3509a84bbe3e560d626`.
- Same fixed architecture prompt, two image hashes, 1920 x 1080 viewport,
  new document and fresh isolated tool library. No reference-image search.
- Both `illustration.architecture` and `design.architectural-illustration`
  delivered through the existing Knowledge tools.

All evidence is under
`tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792337950811/`:
`run.json`, `deadline.json`, `source-snapshot.json.gz`, `preserved-provider/`,
`generation-analysis.json`, `metrics.json`, `recording.webm`,
`video-verification.json`, `checkpoint.json`, `final.png`, `first.png`,
`reload-inspection.json`, `reload-inspected.png`, `detail-capture.json`,
`native-{tiers,ornament,base,crown}.png` and `service-cleanup.json`.
Provider payload hashes were checked while preserving the source records.
Upstream native research input/output was not exposed; its unavailable markers
remain intact. This is not a claim that opaque provider internals were captured.

The 381.720 s recording includes setup and more than ten seconds after UI
completion. Chromium decoded sampled positions and played the final segment to
its actual end without media errors. Actual app overview and native detail
captures were inspected. Agent-owned ports 3307/4117/4217 were cleaned up after
read-only recovery; .env and saved documents remain intact.

## Comparison with the prior completed Knowledge drawing

Prior run: `knowledge-quality-knowledge-taipei-101-1792323795116`. Both are
Knowledge runs. This is an observational comparison of generated tasks, not a
randomized no-Knowledge control or a guarantee of repeatable timing. Generated
geometry and review paths differ. Object count is not an improvement criterion.
The intervening collector-aborted run is not used as a completed quality baseline.

| Measure | Prior Knowledge run | Current Knowledge run | Assessment |
| --- | ---: | ---: | --- |
| First observed drawing content | 98.568 s | 59.743 s | 38.825 s earlier (39.4%); current first content is whole-building massing. This is bounds observation, not GPU presentation timing. |
| Send to UI completion | 496.629 s | 366.088 s | 130.541 s shorter (26.3%) in this sample. |
| Definition queries before first construction | 6 | 3 | Fewer initial queries. |
| Definition queries overall | 13 | 10 | Fewer calls, but repeated definition delivery remains. |
| Definition response bytes | 376451 | 284060 | 24.5% lower, UTF-8 saved payload bytes. |
| Total recorded App-tool input bytes | 1038747 | 289565 | 72.1% lower; excludes image/provider transport envelopes. |
| Construction input bytes | 1013123 | 263450 | Lower authored payload; not proof of equivalent geometry. |
| Reflection-related correction input | 670447 bytes of new construction | 2147-byte batch including reflection patches and entrance deletion | A different, compact edit strategy; not a byte-for-byte equivalent rendering comparison. |
| Construction calls | 6 | 6 | No reduction in construction-call count. |
| Explicit repair episodes | 2 material/reflection episodes | 2 episodes: crown occlusion; reflections/entrance arches | No demonstrated reduction in repair episodes. Planned unfinished detail is not counted as a defect. |
| Visual capture requests | 4 | 7 | Increased. One immediate duplicate capture and one misplaced ornament crop occur. |
| Visual judgment submissions | 5 | 7 | Increased; primary-agent decisions, not seven extra model instances. |
| Other visual/final binding calls | 1 | 1 | A separate finalization step. |
| Wrong-tool/mutation rejections | None recorded | None across 45 App-tool calls | Lookup and consumer handoffs were usable; an unaccepted visual result can still be a successful tool call. |
| App-tool union time | 24.479 s | 24.686 s | Essentially unchanged; faster completion is outside measured App execution. |
| Provider residual time | 468.545 s | 338.236 s | Includes generation, decisions, scheduling and transport; not a measurement of pure thinking. |
| Input / cached input tokens | 1292213 / 1200000 | 1496697 / 1399552 | Input traffic increased despite smaller tool payloads; no blanket token-saving claim. |
| Output / reported reasoning-output tokens | 17316 / 5240 | 12628 / 2714 | Lower in this sample; token counts do not measure quality or thinking duration. |
| Final saved document | Original collector required separate recovery | Receipt and checkpoint passed; automatic reload failed, separate recovery passed | Original run remains failed; subsequent offline readiness repair is reported separately below. |

### Actual tool selection and data handoff

At 9.210 s the agent requested full definitions of the main construction tool,
reference validation and criteria. At 12.524 s it explicitly requested a refresh
of the main tool using `refreshReason: delivery-failure`, retransmitting 65110
bytes. The refresh reason is the agent's claim; the recording alone does not prove
an actual lost provider delivery. It did not use a compact schema-path query here.

Later it successfully used a usage query for deletion, exact operation discovery
for `element.deleteElements` and `fill.updateFillsAtIndex`, and retained artifact
keys for the actual edits. No full children enumeration or broad document query
was needed to change the eight left and eight right tier faces. The 2147-byte
batch updates those existing faces and removes 28 old entrance-arch shapes; it
acknowledges two fill updates and the deletion without an execution retry.
A subsequent 17441-byte construction supplies smoother arches and roof details.

The new query-material consumer was not exercised through a retained query in
this run. Successful artifact targeting is positive evidence for compact editing,
not proof of every query lease/invalidation path. All six construction calls used
material templates. The largest construction input was instead a 162182-byte
ornament definition; no claim is made that all explicit geometry has disappeared.

## Stage timing

Phases use actual tool-call boundaries relative to provider start. Tool intervals
are unioned, not added recursively. The provider started 0.283 s after Send;
UI observation followed terminal provider completion by about 0.784 s.

| Phase | Wall s | App tools s | Native research s | Provider residual s | App calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| References, Knowledge and massing plan | 58.515 | 0.081 | 2.099 | 56.334 | 9 |
| Massing and tier facade construction | 94.435 | 13.144 | 0 | 81.290 | 11 |
| Base, crown and ornament construction | 51.267 | 8.510 | 0 | 42.757 | 2 |
| Visual review and crown occlusion repair | 68.761 | 0.867 | 0 | 67.894 | 10 |
| Continuous reflection, entrance and roof refinement | 31.194 | 1.688 | 0 | 29.506 | 4 |
| Final scoped review and acceptance | 60.849 | 0.394 | 0 | 60.454 | 9 |
| Total provider lifecycle | 365.021 | 24.686 | 2.099 | 338.236 | 45 |

The native research event concerns external building facts; its raw I/O is
explicitly unavailable upstream. It is not a hidden reviewer model. No additional
review-model stream appears in the exact source-request tree.

## Rework and quality

The first criteria explicitly planned glass versus metal, continuous face
reflection, left/right lighting and repeated surface-grid frames. This is observed
adoption of the advice, not merely a read receipt. However, early material roles
did not prevent later visual corrections.

| Observed issue | Evidence and correction | Outcome |
| --- | --- | --- |
| Crown top faces obscure windows | Primary-agent failed decision at 215.869 s; delete 13 roof faces at 225.700 s | Corrected before final acceptance; compact artifact-key targeting. |
| Ornament inspection misses ornament | Decision at 250.972 s marks unverified; corrected region requested immediately | Extra inspection and primary-agent review, not a drawing mutation. |
| Entrance arches visibly polygonal | Failed local decision at 272.971 s; delete old arch shapes, replace with smoother construction | Native final close view shows smoother arch outlines. |
| Glass reflection too uniform | Same local decision; batch patches existing facade gradients at 302.481 s | Continuous horizontal-domain gradients, not per-window colored overlays. |
| Mechanical evidence stale after modifications | Final read identifies old measurement; review_design refreshes it | Final result 29 pass / 0 fail / 0 unverified / 0 stale; this is tool/agent acceptance, not independent aesthetic certification. |

| Fixed quality dimension | Prior visual evidence | Current visual evidence | Independent assessment |
| --- | --- | --- | --- |
| Full silhouette and eight tiers | Complete tower, crown and spire | Complete tower, crown and spire | Preserved. |
| Projection and visible top surfaces | Coherent projected edge families | Coherent connected faces and visible platforms | Preserved; illustrative dimensions remain estimates. |
| Foreground podium relationships | Wider/asymmetric foreground low mass and rooftop volume | More centered rectangular plinth-like podium | No improvement demonstrated; the older composition retains more of the reference's attached low-mass relationship. |
| Glass versus frames and lighting | Repetitive facade pattern, relatively uniform close views | More continuous facade lighting, clear frame/glass distinction | Positive material appearance evidence, with repeated bands still visible in overview. |
| Ornament shape/material | Scroll motif and metallic shading present | Scrolls, round knobs, stem and lower ring present with metallic shading | Both retain the major reference features; no defensible universal quality win. |
| Requested detail | Dense windows, ornament and base detail | Dense windows, ornament, arches and roof details | Detail retained; density alone is not improvement. |

The primary model accepted the drawing. Independent inspection does **not** conclude
that every architectural relationship improved. In particular, better transport
and faster first content do not establish a better podium composition.

## Four-item verdict

| Correction | Verdict | Evidence and remaining limit |
| --- | --- | --- |
| Knowledge-to-capability guidance and discovery | Partially effective | Initial lookup 6 to 3, whole run 13 to 10; correct operation/target routing. Full-definition refresh and late discovery remain. |
| Material roles before repeated construction | Adopted, rework not eliminated | Explicit early roles and continuous-domain plan; crown occlusion, arch and reflection repairs still occur. |
| Compact representation and retained consumers | Positive for this artifact-edit path | Templates plus existing-target gradient patches avoid the former 670 KB reflection construction. Query-specific consumption was not exercised. |
| Reliable evidence and recovery | Original run failed; offline repair verified | Original generation/I/O/video/checkpoint retained. Delayed browser regression and the actual saved-document replay now pass without inference; the original failed run is unchanged. |

## Automatic reload failure and separate recovery

The automatic reload stage failed at about 0.474 s with
`Capture session unavailable, disconnected or replaced`. It did not wait for the
large saved document to finish initializing. A diagnostic using the **same async
waitForFunction predicate** returned `false` while no collaboration handle existed
at 334 ms. A separate awaited polling loop observed connection and expected roots
at 14.706 s, then confirmed generation 0 / durableSequence 829. Complete recovery
and screenshot took 18.343 s; no page errors were observed.

The installed Playwright polling implementation calls `predicate()` and tests its
truthiness before fulfilling the returned result. An async predicate returns a
truthy Promise, which can subsequently resolve to false. Therefore this runner's
async import/status predicate does not perform the intended repeated readiness
check. This is a collector readiness defect, not evidence of corrupted persisted
content or an App save failure. The earlier browser fixture had an immediately
connected handle and did not cover genuine asynchronous startup. This coverage
gap survived the 81 offline checks; their pass must not be interpreted as complete
real-app startup coverage.

The original run and failed gate are unmodified. Independent recovery is stored
separately. The full-report analyzer rejects the failed original evidence. The
separate generation analysis uses complete exact-ID Runtime streams and does not
change the original gate or fabricate completion.

### Offline correction and saved-document verification - 2026-10-19

The runner now awaits each readiness RPC result, requiring the current connected
session and a loaded workspace before capture. Startup and reload share that
owner. Existing enclosing deadlines remain authoritative; timeout closes the
reload context, late completion cannot publish success, and recovery uses a fresh
context without replaying drawing writes.

The new real-browser regression failed before the change with `Capture must await
the real session`. After the change it covers delayed module loading, a later
session and still-later workspace, an unresolving module, a never-connected
session, disconnect/navigation during capture, context cleanup and independent
recovery. Existing watchdog, recording, HTTP receipt and failure-oracle tests
remain part of the evidence suite.

The permanent `replay-saved-document.mjs` command used this exact saved document,
the original durable receipt and the same production evaluator capture helpers.
Its reload completed in **17.205 s** with the exact root order and generation 0 /
sequence 829 / durableSequence 829. There were **zero AI POST attempts and zero
page errors**; original `run.json` bytes remained unchanged. The live screenshot
was inspected. Evidence: `tmp/knowledge-evaluation/readiness-replay-20261019/`.
This verifies collector readiness/reload, not new drawing quality or full
property-by-property equality. No model test was rerun.

## Current activity and references

Sixteen sampled status entries include the initial generic state, research,
authored task context, actual main-tool work and terminal clearing. Long gaps show
`Task context - no App operation executing`; observed multi-second operations show
their concrete main-tool messages. Child calls did not produce a per-child status
flood in this one-second sample. Short operations can fall between samples, so
this does not establish every parallel timing case.

The final selected references are the same immutable supplied files:

1. `apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/reference-0.jpg`
   - Only broad massing, silhouette and podium relationships. Low resolution;
     temporary construction equipment is excluded. Not precise window/hidden geometry.
2. `apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/reference-1.jpg`
   - Only the visible scroll ornament form and metal appearance. Position and
     scale remain illustrative estimates.

The final checks carry those exact reference-use revisions. Selection remains the
primary agent's semantic decision; image validation is not aesthetic approval.
