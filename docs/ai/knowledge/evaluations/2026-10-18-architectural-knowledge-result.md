# Architectural Knowledge - single 101 evaluation - 2026-10-18

## Decision and scope

The new Knowledge was delivered and its advice is visible in actual public-tool
use. The full drawing completed inside the ten-minute limit. This is evidence of
adoption and executable handoffs, **not evidence that Knowledge shortened thinking,
reduced repairs, or improved quality relative to a matched control**.

The user cancelled the original arm during execution. It was stopped at about
141.7 seconds and retained as user-cancelled, not scored or restarted. Only the new
Knowledge arm completed. No general model cases, additional model grader, follow-up
edit, remote push, PR or monitoring were performed for this evaluation.

## Content delivered

| Module | General knowledge and ownership |
| --- | --- |
| `illustration.architecture` | Reference-supported mass/attachment relationships; consistent projection and visibility ordering; rule-based repetition; coherent material/light across facades. Applies to relevant architectural illustration, including invented buildings. No Taipei-specific dimensions, answer geometry or IDs. |
| `design.architectural-illustration` | Maps those decisions to existing preparation, projection, surface-grid/pattern, retained target edits, mechanical/visual checks and reusable-tool contracts. Exact runtime schemas remain authoritative. |

Only explicit catalog/context admission and these content files were added in the
architectural content slice. No new Knowledge infrastructure or product tools.
Earlier adoption changes already present in this worktree are not attributed to
these new modules. App prompt and tool descriptions are procedural guidance too;
this run evaluates the additional advisory package, not a replacement authority.

## Fixed conditions and evidence identity

- Run: `knowledge-quality-knowledge-taipei-101-1792323795116`; Send: `2026-10-18T11:43:18.102Z`.
- Source base: `3d503aa714336946839374dc948e9c171cfb8182` plus recorded local fingerprints in `run-summary.json`.
- Model: `gpt-6-astra`, effort `medium`; one completed primary drawing stream.
- 1920 x 1080 recording, fresh document and isolated empty reusable-tool library.
- Original full-building prompt plus fixed reference-use limitations and an
  explicit discover/read instruction naming the module/context. This does not
  establish spontaneous retrieval under an unassisted prompt.
- Same two retained reference bytes: aerial for massing/silhouette/base only;
  ornament close-up for shape/material only. Construction equipment excluded.
- 600000 ms independent deadline armed before Send. Finished before deadline;
  no timeout rescue or model rerun. Recording retained at least ten seconds after
  successful UI completion.

## Completion and reliability

| Measure | Observed result |
| --- | --- |
| First visible content | 98.568 seconds (1m 38.568s), sampled by observer/polling and screenshot; not GPU presentation telemetry |
| Provider completion | 495.479 seconds |
| UI completion | 496.629 seconds (8m 16.629s) |
| App tool calls | 46 completed, zero unusable receipts, zero unfinished calls |
| Main construction calls | 6 `prepare_and_apply_design`; 2 compact edit batches |
| Knowledge | 1 discover + 1 read; both shared and App bodies delivered at approximately 9.8 seconds |
| Recorded page errors during live run | 0 |
| Persistence | sequence 814, durableSequence 814, generation 0 |
| Backend checkpoint | 187,936,908 bytes streamed to disk, not returned in a giant browser RPC |
| Original reload collector | **Failed**: collaboration handle became unavailable at the later `whenIdle` access; preserve original failed run result |
| Separate read-only reload | Fresh browser restored root identity/order and durable sequence 814; overview and native crops captured, no model call or document rewrite |
| Video | `recording.webm`, 48,540,390 bytes |

The separate reload inspected a stable connected state before capturing a handle.
It completed in about 17 seconds including stability waits and a screenshot wait;
this is not a precise loading benchmark. It does not prove the original lifecycle
race is fixed or all historical document fields are byte-identical. Initial
collector failure remains a known evaluation limitation, not a green rerun.

## Timing by observed boundary

Times below use the native provider trace origin, approximately 0.289 seconds
after Send. Phases are contiguous and end at recorded owner/tool events. Tool
intervals are counted once; nested action durations are not added again.

| Phase | Wall s | App tools s | Native research s | Outside observed calls s | Tool calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Reference, knowledge and construction planning | 96.019 | 0.090 | 2.454 | 93.474 | 12 |
| Base, tiers and crown construction | 97.416 | 15.417 | 0.000 | 81.998 | 4 |
| First visual review and edit discovery | 26.270 | 0.023 | 0.000 | 26.247 | 6 |
| Material repair, ornaments and base completion | 105.576 | 3.227 | 0.000 | 102.350 | 4 |
| Mechanical and second visual review | 58.620 | 0.136 | 0.000 | 58.484 | 7 |
| Continuous reflections and ordering | 46.611 | 5.331 | 0.000 | 41.280 | 3 |
| Final scoped evidence and acceptance | 64.967 | 0.255 | 0.000 | 64.713 | 10 |
| Total provider interval | 495.479 | 24.479 | 2.454 | 468.545 | 46 |

Outside observed calls includes model generation/decision work, provider scheduling
and transport. It is **not an independently measured thinking duration**. There is
no additional reviewing-model stream. Native research was one height/module-count
search; the provider exposes its query/timing but not full raw search I/O.

Reported token usage: input 1,292,213, including 1,200,000 cached input; output
17,316, including 5,240 reasoning output. These are provider-reported aggregate
usage, not distinct prompt size, independently verified model internals or money.
No comparison-based token saving is claimed.

## Knowledge adoption and tool selection

| Intended effect | Actual evidence | Assessment |
| --- | --- | --- |
| Consistent spatial/projection model | Six preparation inputs retain azimuth 32, elevation 30, scale 1 and a common world-to-canvas basis; projected faces and explicit boundaries sent to backend | Adopted; no coordinate-contract rejection observed |
| Delegate repeated geometry | Surface grids expand window/frame motifs; two pattern definitions repeat ornament faces | Adopted; not a list of every window's projected corners |
| Precise edits instead of rebuilding | Material batch addresses retained spire/podium artifact keys; later relative-order edit places reflection group before ornament anchor | Scoped targeting observed; no independent unrelated-content equality oracle for intermediate states |
| Avoid redundant tool search | 13 definition queries, 376,451 response bytes; one full definition refresh declared delivery-failure, one free-text fill search followed by exact operation lookup | Mixed. No refusal, but lookup volume remains; a recovery request is not automatically unnecessary |
| Compact material description | Final reflection preparation 670,447 bytes; sixteen grids each provide 224 per-cell gradient definitions | Valid API use but substantial data. Cannot claim bulk reduction |
| Preserve/reuse results | Final check state 275 pass, zero fail/unverified/stale; three detail passes remain current while final pending set narrows to overall/scale/ornament | Accumulation observed; not a comprehensive local-invalidation stress test |
| Discover new reusable recipe if needed | Existing main tools used; no submit/save composition call | Appropriate absence: no quota to author a new tool when an existing one covers the task |

Recorded App payloads total 1,038,747 input bytes and 509,059 output bytes, excluding
image transport and native research. Construction accounts for 1,013,123 input
bytes. Full transport totals (4,437,031 sent; 8,115,500 received) have a different
scope and must not be added to these App payload totals.

### Material payload finding

The reflection call contains 32 grids, 48 motifs and only 192 motif vertices.
Most bytes are in `fills`: sixteen 8 x 28 grids each carry 224 gradients with
97-159 distinct values. The documented schema and implementation select
`motif.fills[cell % motif.fills.length]`; these are **per-cell choices, not stacked
paint layers**. The lists do not have a shorter exact repeating period. The
source of volume is the agent's detailed material representation; replacing it
with fewer values would change output and requires quality judgment. No API bug,
invalid fill interpretation or automatic lossless compression is asserted.

## Repairs and review rounds

| Episode | Evidence and classification |
| --- | --- |
| Initial construction | Base, eight tiers and crown are deliberately separate parts; adding later ornaments/base finish is planned completion, not automatic rework |
| First actual repair | First visual judgment rejects crown finish; one retained-target batch changes spire metal and podium skylight color, then later screenshots inspect result |
| Second actual repair | Second visual judgment says glass is too flat; one preparation adds reflection layer plus a relative-order operation; inspected afterward |
| Evidence correction | Ornament crop missed its lower medallion; one recapture shifts the crop and renews declared reference use. No geometry rewrite |
| Final acceptance | 10 `review_drawing` calls consist of 4 capture calls, 5 judgment submissions and 1 existing-image rebind. They are not 10 extra model sessions |

No delete/rebuild batch was observed. Two correction episodes are identifiable;
no matched baseline supports saying their number decreased. Part of the 105.576s
repair/completion phase also constructs required ornament and base detail, so it
cannot all be charged to avoidable rework.

## Visual review, separate from agent acceptance

Actual overview and 1024 x 1024 source-rendered crops were inspected. No node count
or aggregate ceiling score is used as quality evidence.

| Criterion | Inspection result |
| --- | --- |
| Full form and recognizable silhouette | Present: complete spire, crown, projecting tiers and attached podium; no extra scenery/background object or crane visible |
| Projection and connected surfaces | Top surfaces and facade edge families appear coherent. No obvious floating attachment or rear-edge-through-front defect in inspected overview. Perspective fidelity beyond the chosen orthographic illustration is not established |
| Required local detail | Window frames, structural bands, base arcade and paired-curl ornament are visible at source scale. Ornament retains the reference's curls, center boss, pendant and lower medallion |
| Material/light | Partial: lighter/darker face hierarchy and metal gradients are present; broad reflection patches still look patterned/illustrative. No claim of photographically realistic glass or physically verified lighting |
| Reference fidelity | Broad tower/base relationship and ornament motifs are supported. Podium proportions, crown detail and exact ornament scale/location remain illustrative estimates; low-resolution aerial is insufficient to validate them precisely |
| Completion vs quality | Primary agent submitted 6/6 visual criteria as pass. This is recorded self-assessment, not independent blind human acceptance |

## Concrete conclusions

1. The generic content is usable by the real agent and maps to existing tools.
2. The run demonstrates rule-based construction and scoped correction without
   tool rejection. It does not prove less thinking, less rework or better quality.
3. Material planning was still deferred until a visual failure, and detailed
   per-cell gradients generated substantial input. This is mixed adoption of the
   existing material advice, not proof that another mandatory knowledge module
   or new infrastructure is needed.
4. Tool discovery still returned large definitions. The delivery-failure refresh
   must be distinguished from unnecessary lookup before any product change.
5. The next decision should use these actual images and traces. No additional
   model run or content change was made after seeing this result.

## Evidence and validation

Permanent compact evidence: `apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/`.
Raw local evidence: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792323795116/` including original run,
full checkpoint, video, trace analysis, metrics and independent reload captures.
Provider stream: `apps/asyra-design/tmp/ai-executions/f3691d71-6405-4dfc-928f-51b3dccf0858.jsonl`
and all referenced payloads; Runtime stream `73c30a40-dea0-4219-8bb6-2709d20a3beb.jsonl`.
Original control cancellation remains in its separate run folder ending
`1792323499452`; it is excluded from this evaluation.

Before inference: 208 applicable knowledge/prompt/provider tests passed with one
original conditional skip; 12 deterministic content/fixture/checkpoint/deadline
tests and 2 protocol tests passed; focused lint, server types and naming passed.
These tests do not invoke a model. No broad CI or general model cases were run.
The live runner exited nonzero for the original reload capture failure; none of
these earlier passes hide that fact. All owned services were stopped after capture.

Raw native search payloads are unavailable upstream. App call input/output hashes
were verified while reading, and the completed provider stream reports zero
recording failures. This is preservation of all available I/O, not fabricated
visibility into provider-private data or image attachments absent from the trace.

Post-run housekeeping: the user-scope guard in the two manual entry points was
formatted onto one line only. Focused lint and the two deterministic protocol
tests pass. Evaluated module, loader, prompt, fixture and reference hashes are
unchanged. Flow manual self-review records completion of this bounded evaluation
and report; it does not certify quality improvement or an all-green live collector.
