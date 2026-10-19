# Taipei 101 - Knowledge-arm evaluation after whole-flow correction

## Result and claim boundary

One authorized real-agent run completed in **545.796 seconds (9m 5.796s)**,
within the independently armed 600-second deadline. First observed drawing
content appeared at **75.532 seconds**. The native drawing request completed,
the final evidence ledger had no fail/unverified/stale entries, persistence was
acknowledged, and a fresh page reloaded the same root order and durable receipt.
This is a successful generation/capture run, not proof of flawless artwork or a
controlled causal Knowledge improvement.

The agent used advice-consistent projection, offset podium composition, named
material roles, backend surface grids and a common height-domain material mapping.
However, it still constructed repeated tiers before resolving glass appearance,
later repaired metal appearance, queried tools 12 times and spent a final segment
repairing container/evidence state. Knowledge influenced observable choices in the
sense that choices agree with delivered advice; reading and agreement do not prove
that those choices would not occur without the advice.

The portable Knowledge text is **identical to historical anchor B**. The App
advisory text and implementation changed. Therefore this run cannot estimate the
causal effect of a new portable Knowledge module, nor isolate advice from tool fixes
or model variability. No additional control, general case or model retry was run.

## Protocol and integrity

- Run: `knowledge-quality-knowledge-taipei-101-1792392422804`.
- Sent: `2026-10-19T06:47:09.472Z`; successful UI outcome: `06:56:15.267Z`.
- Actual provider: `gpt-6-astra`, effort `medium`; fresh document and initially
  empty isolated tool library; fixed 1920x1080 viewport.
- Same frozen architecture-101 prompt, fixed aerial and ornament attachments and
  revision-2 rubric. The prompt explicitly requests Knowledge discovery/reading;
  this is not evidence of spontaneous retrieval.
- HEAD `3d503aa714336946839374dc948e9c171cfb8182`; dirty source is captured, not
  equated to HEAD. Source digest before/after capture:
  `53cd6c70f0497c0ecc62f9fc009fc0d8d06ef4fe2a16c9f223a263b933f6c39a`.
- One drawing model stream and one host-only `conversation-publication` stream
  (`model: none`). No additional reviewer model stream was found on the exact
  source-request chain. Visual verdicts below are authored by the same main agent.
- All 62 outer App-tool calls have input/output payloads. The exact-request archive
  also preserves nested action payloads: 98,817 unique payload files, 141,420,558
  bytes, individually SHA-256 checked. Recorder redactions are preserved; this is
  available recorded I/O, not private provider reasoning or unredacted transport.
- Raw drawing stream: 104,051 sequential records, 49,346 action spans, 62 tool
  spans, 107 provider spans, one research span and four lifecycle spans. Independent
  sequence/request/start-end/settlement audit found no issues; terminal recording
  failure count is zero. These counts describe trace workload, not visual quality.
- **Analysis limitation:** the standard offline analyzer was stopped after more
  than five minutes of CPU-bound processing without output. Source inspection
  shows an all-step child scan for every tool/action in `summarizeCallDurations`;
  this is a likely analysis bottleneck, not a measured drawing slowdown. A separate
  duplicate detailed parser was also stopped. No formal full-profiler pass is
  claimed. Report timings use original timestamps, interval unions and the recorded
  terminal summary, cross-checked independently; raw integrity auditing is not
  relabeled as that formal gate. No product parser was modified.

All runner evidence stages completed: final view, persistence, checkpoint,
recording, reload and its cleanup, source verification and browser cleanup.
Browser error list is empty. Read-only native-detail capture blocked AI POSTs,
attempted zero such requests and confirmed the same receipt. Services started for
this run were stopped after capture; ports 3307/4117/4217 have no remaining listener.
No push or monitoring occurred.

## Historical comparison - not a control experiment

Anchor B is `knowledge-quality-knowledge-taipei-101-1792342207875`, evaluated in
`2026-10-19-101-rubric-retrospective.md`. Both runs use Knowledge. B timed out and
this run completed; task exposure and decisions differ.

| Measure | Historical B | Current C | Interpretation |
| --- | ---: | ---: | --- |
| First observed content | 98.364 s | 75.532 s | 22.832 s earlier; both show detailed lower mass/podium, but not identical construction work or GPU-paint measurements |
| Product completion | Stopped at 600 s, incomplete | Success at 545.796 s | Current pipeline finishes within budget; not an isolated Knowledge effect |
| Tool discovery calls | 14 | 12 | Slightly fewer; most are first acquisitions, not redundant calls |
| App-tool interval union | 62.095 s | 34.484 s | Different operations; not a same-work speedup claim |
| Provider outside observed tools/research | 534.452 s | 507.184 s | Residual service time, not pure thinking |
| Serialized parsed outer-tool input | 490,192 bytes | 270,448 bytes | Actual chosen payloads; excludes other transport layers |
| Serialized parsed outer-tool output | 8,963,539 bytes | 514,080 bytes | Primarily a tool-delivery improvement; old full check rows are no longer returned by default |
| Final stale state | 5,459 after root verification | 0 | Tool evidence reconciliation/settlement works in this run; no Knowledge credit |
| Explicit material correction episodes | One glass episode | Glass plus metal episodes | No demonstrated reduction; inspected tasks/exposure differ |
| Material issue to first corrective construction | 120.275 s | 61.340 s | Current new reflection layer starts earlier after detection |
| Material issue to successful shared-domain mapping | Not separately classified | 120.935 s | Initial mapping matched nothing; final intended mapping still occurs late |
| Persistence/reload evidence | Post-stop recovery; no original final-memory equality proof | Original acknowledgment plus reload root/order/generation/sequence comparison | Stronger delivery evidence; not all-property equality proof |

Delivered portable `illustration.architecture` revision 4 has the same text hash
in B/C: `ec3b68032756cc659aa4ca27f1b5d6bb157658d4353bae7caf7a254dfe3e21c0`.
App `design.architectural-illustration` is labeled revision 6 in both, but its text
changed: B `d594d4de48555ac6d74e504d2b16d08cac7653601544a3a9fb59a987c7e6bd3c`,
C `f432051d47e55bbe8553a8b5b6d41a44ce44ae0fcdfd50a69331fd8b2e04ccc7`.
The shared revision label is not evidence of equal treatment; compare saved bytes.
The repeated revision label is a trace/versioning limitation, not corrected in this
execution-only task. Product source also differs. No percentage causal efficacy,
statistical significance or generalization claim is supported by this single run.

## Timing and interaction breakdown

Times below are seconds from Send. Call references C0-C61 are zero-based indexes
in `generation-analysis.json`'s drawing stream. Raw stream timing is provider-relative;
0.241 seconds is added for Send alignment. Tools are measured as interval unions,
so nested browser actions and overlapping work are not double-counted.

| Phase | Send interval (s) | Wall (s) | App tools (s) | External research, exclusive (s) | Residual (s) | App-tool calls |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Knowledge/reference/base | 0.000-75.510 | 75.510 | 2.205 | 0.000 | 73.305 | 9 |
| Tier/crown/reflection construction | 75.510-209.488 | 133.978 | 11.898 | 0.000 | 122.080 | 12 |
| Material mapping and base/crown refinements | 209.488-324.506 | 115.018 | 5.074 | 1.913 | 108.031 | 14 |
| Visual inspection and ornament correction | 324.506-451.231 | 126.725 | 0.961 | 0.000 | 125.763 | 11 |
| Mechanical settlement and evidence reacquisition | 451.231-534.722 | 83.491 | 12.520 | 0.000 | 70.971 | 15 |
| Final response/publication/UI | 534.722-545.796 | 11.074 | 1.826 | 0.000 | 9.248 | 1 |

The **34.484 s** tool union plus **1.913 s** external research matches the native
terminal observed union of **36.398 s** (sub-millisecond boundary differences).
The drawing provider lasts **543.582 s**, leaving **507.184 s** outside those
observed operations. The phase residual additionally includes about 2.214 seconds
of pre-provider/final publication/UI observation. It can contain planning,
input/code generation, native orchestration, service waits and transport; it is
not a measurement of private model thinking.

Useful tool totals (inclusive of their own child execution): construction/apply
15.049 s across six calls; batches 8.498 s across seven calls; check reads 7.800 s
across seven calls; visual capture/verdict tool handling 1.702 s across 18 calls;
mechanical review 1.275 s across two calls; capability lookup 0.062 s across 12 calls.
The six preparation responses report 64.103 ms total admission, 59.919 ms source
construction and 317.956 ms compilation. These are reported internal owner phases,
not additive replacements for outer call duration or model review time.

The 18 `review_drawing` calls comprise **10 capture attempts** and **8 verdict
submissions**, not 18 separate AI reviewer calls. One capture attempt partially
failed; one identical early base capture was repeated. Main-agent decision time
between capture and verdict remains in the residual. Mechanical preparation did
not invoke another model.

Native usage reports input 2,676,961 tokens, of which 2,555,648 were cached,
output 15,791 and reasoning-output 3,346. Reasoning-output is a reported output
subset, not extra tokens to add again. Noncached input by subtraction is 121,313.
These are cumulative provider-reported usage, not subscription percentage or cost.
Transport sent/received totals are 8,967,934 / 10,417,468 bytes; unlike the outer
parsed payload totals, these include other protocol material. Do not interchange
them.

## What Knowledge actually changed in observable behavior

| Principle | Trace evidence | Assessment |
| --- | --- | --- |
| Plan a coherent projection | C5 declares 35-degree azimuth, 26-degree elevation and centimeter world coordinates; C8/C14/C19 use the same projection | Observable advice-consistent implementation; also requested by the user, so not uniquely attributable to Knowledge |
| Connect massing before decorative work | C8 starts with a laterally extended podium and lower tower; first/final views preserve that relationship | Broad composition is retained; no demonstrated category gain over B, which already did this |
| Separate material roles | First draft includes metal/edge/shadow/stone/roof/dark templates | Roles exist early, but naming them does not establish final appearance |
| Choose continuous glass appearance before replication | C5 promises a height-continuous domain; C14 still uses repeated tier-local gradient handles `[0,0]` to `[1,1]`; C17 later flags uniform glass | **Not fully adopted early.** Declarative intention diverges from initial construction |
| Delegate material variation to tools | C20 creates the reflection layer; C27 uses one `map_retained_fills` operation with shared parent-local height domains | Concrete successful delegation. C22 first matches zero because `equals` does not match generated names; suffix matching succeeds in C27 |
| Inspect representative material and revise locally | C40 identifies weak metal; C42 changes the relevant metal fills; C45 later passes it | A correct local repair, but still late rework. The tool can perform it; this does not prove earlier advice uptake |
| Use references only within their evidence | C6 restricts aerial to massing and ornament close-up to shape/material; C35/C59/C60 attach the appropriate use receipts to judgments | Actual reference-to-verdict handoff observed. Prompt fixes these limits, so not uniquely a Knowledge benefit |
| Reuse data rather than returning every object | C55 returns a retained result; C56 consumes that same reference to regroup | Valid App capability reuse; separate from portable domain knowledge |

The portable advice remains advisory and tool-independent. The App supplies
operation names, query conventions and contract guidance. Successful valid tool
execution does not depend on having read Knowledge.

## Tool selection and avoidable handoffs

| Calls | Observed behavior | Classification |
| --- | --- | --- |
| C2/C3 | Full main-tool contract followed 3.294 s later by refresh with `delivery-failure` | Repeated delivery; actual model-side loss cannot be confirmed from successful server delivery |
| C7/C9/C18/C21/C28/C30/C41/C44/C49/C54 | First contracts for review/context/material mapping/batch/facts/delete/fill/calculations/mechanical review/grouping | Appropriate acquisition for later use; not all 12 lookups are waste |
| C10/C11 | Same unchanged base capture twice | Duplicate capture; captured evidence does not establish why the agent repeated it |
| C22/C24/C27 | Exact-name query maps zero; context reveals generated names; suffix query applies the desired mapping | Query selection/recovery, not missing material-rendering capability |
| C31/C34 | Delete supplies both empty `elementIds` and a target binding; rejected before mutation; corrected by omitting the slot | Input contract violation with successful recovery; no relaxation of validation |
| C35/C36/C37-C39 | First ornament crop misses ornament; next capture uses stale crown supersession revision 1 when current is 2; partial failure, then read/reacquire | Agent scope/revision selection and consumer handoff overhead; no partial result falsely treated as final pass |
| C51-C60 | Whole-root mechanical check finds child overflow; ungroup/regroup changes container identity, then captures/judgments are renewed | Remaining product/agent construction boundary problem. Root cause is not fully assigned by this run alone; canonical group handling vs parent-local attachment requires separate saved-I/O reproduction |
| Final | Normal final response publishes through the proper route | No `report_outcome` catalog lookup or invented callable action in this run |

C54 discovers `resetElementSize`, ungroup and group, but executes ungroup/group.
The five visual results become stale after their inspected root is removed and
replaced. This case does **not** demonstrate a normal local appearance edit
invalidating unrelated regions: it is a root identity change. After reacquisition,
C60/C61 report pass 8,551 and fail/unverified/stale zero. Counts describe settlement,
not quality. C57 mechanical observation reports zero new evaluations/reads and reuse
of existing geometry evidence. No fresh receipt silently substitutes for an unknown
visual judgment.

Largest current input is C20 reflection/ornament construction at 147,587 bytes;
the successful common-domain mapping is 1,037 bytes. The large construction input
still serializes substantial source geometry before backend expansion. The 12
lookup replies alone total 334,085 bytes (65.0% of outer output); the next largest
single source is Knowledge delivery at 47,542 bytes. This shifts the remaining
transport concern from historical full check rows to schema/advice acquisition.

## Material decisions and rework

- Glass deficiency: C17 at 143.594 s. Reflection construction C20 begins at
  204.934 s, a 61.340 s delay. C22 mapping at 241.910 s changes nothing; C27 at
  264.529 s successfully maps the shared domain, 120.935 s after detection.
  C40 later passes the tier criterion. These are one glass correction episode
  with multiple implementation/recovery actions, not separate errors per object.
- Metal deficiency: C40 at 385.814 s. Targeted fill correction C42 begins at
  419.712 s (33.898 s later); C45 passes it after inspection. The final native
  ornament crop shows strong highlights; the earlier deficiency is established by
  the recorded agent judgment, not an independently scored pre-edit crop.
- Missing base/crown details are recorded separately as incremental completion
  (C13/C23 and C26/C32), not automatically inflated into defect counts.
- Spire height is corrected after a later source lookup. C5 initially states
  50,920 cm; C29 asserts 508 m and C32/C34 replace the old tip. The reported external
  source supports the agent's factual assertion only; this report does not certify
  every final geometric dimension or independently validate that webpage.
- Final container/evidence repair consumes the separate 83.491-second settlement
  phase including 12.520 seconds of tools. It must not be labeled visual material
  rework or Knowledge deficiency without further owner evidence.

Thus the current run does **not** establish fewer material corrections. It shows
working compact tool delegation and some earlier corrective construction, while
successful final glass mapping remains about two minutes after issue detection.

## Outcome quality - fixed ordinal rubric

Scorer is the same development agent, not blind or independent. Original first,
final, reload and four native-detail images were inspected. Scale: 0 absent/major
contradiction, 1 consequential shortcoming remains, 2 meets the stated observed
criterion with limits. No summed score, object-count proxy or statistical claim.

| Dimension | Historical B | Current C | Evidence/limit |
| --- | --- | --- | --- |
| Complete silhouette | 2 | 2 | Base, eight projecting tiers, crown and spire are visible; no proof of exact surveyed proportions |
| Projection/visible surfaces | 2 | 2 | Consistent edge families, visible tops and coherent attachment in inspected views; fixed parallel projection rather than a calibrated perspective photograph |
| Podium composition | 2, broad relationship | 2, broad relationship | Low forward/lateral podium remains attached rather than a generic centered plinth. Exact footprint cannot be determined from the low-resolution aerial |
| Materials/lighting | 1 | 1 | Current metal highlight improves visibly, but glass remains regular and graphic, and stone surfaces remain simplified. No broad category improvement established |
| Editable architectural detail | 2 | 2 | Native shapes/frames, corner members, louvers and ornament are visible; microscopic all-object correctness not asserted |
| Local correction plus unrelated preservation | Unscorable | Unscorable for complete preservation | Scoped writes and successful receipts exist, but no exact all-unrelated-property before/after oracle was captured for this live run |

The ornament close-up now shows strong bands of metallic highlight, bevel-like
shadow and the double-scroll motif. That is a concrete visible strength, not a
claim of photo-accurate metal or a proven Knowledge-caused improvement. The glass
native crop still shows a relatively flat regular window field. B and C share
similar rubric categories; improvements in completion and delivery should not
be sold as a demonstrated gain in architectural quality.

## Current status, persistence and recording

The one-second observer captured 45 display changes, including the terminal clear.
Specific tasks (tiers, glass mapping, regrouping) appear while their main operation
runs; between operations the UI labels the retained text as task context rather
than executing. Some broad commentary persists through later inspection, so this
run does not establish fully precise status wording or absence of subsecond flicker.
No asynchronous parallel-tool overlap is proved by predominantly sequential calls.

Durable receipt is generation 0, sequence/durableSequence 653. Reload matches root
order and receipt, with no page errors. This proves the declared reload comparison,
not exact equality of every property. Checkpoint export is 144,542,612 bytes.
Post-generation capture costs: persistence 0.007 s; checkpoint 1.526 s; recording
stage 12.947 s including the required ten-second tail/export; reload 10.349 s.
These costs are outside 545.796 seconds of generation. Source verification passes.
Recording is 56,110,020 bytes. First and changed-bounds fits are recorded; final fit
runs in final-view capture. No generation retry or user intervention occurred.

## Artifacts and remaining conclusions

All run-local artifacts are in:
`tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792392422804/`.

- `run.json`, `metrics.json`, `generation-analysis.json`, `record-integrity.json`.
- `preserved-provider/`: original exact-linked records and hash-verified payloads.
- `recording.webm`, `first.png`, `final.png`, `reload.png`.
- `native-base.png`, `native-tiers.png`, `native-crown.png`, `native-ornament.png`;
  `detail-capture.json` records scopes, matching receipt and zero AI POST attempts.
- `checkpoint.json`, `source-snapshot.json.gz`, `services-cleanup.json`.
- Original final-used attachments: tracked
  `apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/reference-0.jpg`
  (aerial massing only) and `reference-1.jpg` (ornament shape/material only).
  Their use receipts are present in C6 and final C60, not inferred merely from upload.

**Supported conclusion:** the corrected integrated system finishes and settles
its evidence, and the agent uses several useful architectural methods. **Not yet
supported:** that Knowledge by itself reduces total reasoning, query count or
material rework, or significantly improves final quality. The unchanged portable
Knowledge still fails to reliably become an early representative-material decision.
App query/revision/parent-boundary handoffs also still impose avoidable work. These
are separate responsibilities and should remain separately diagnosed.

No implementation changes or additional model run are part of this report.
