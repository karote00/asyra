# Taipei 101 - retrospective Knowledge evaluation

## Scope and evidence integrity

This is a retrospective application of revision 2 of the existing plan's rubric,
not a new model experiment or a replacement for the original reports. Only saved
Taipei 101 evidence was inspected. No model request, product change, push or
monitoring occurred. Scorer: Codex, aware of the run identities; visual judgments
are exploratory self-review, not independent or blind acceptance.

- A: `knowledge-quality-knowledge-taipei-101-1792337950811`.
- B: `knowledge-quality-knowledge-taipei-101-1792342207875`.
- Both folders are under `tmp/knowledge-evaluation/` in the current worktree.
- Call references below are zero-based indexes in each folder's
  `generation-analysis.json`, drawing stream `calls` array. Each call retains
  its original payload path and SHA-256 under `preserved-provider/`.
- All 90 A and 128 B input/output payload files were read again. All 218 hashes
  match their recorded digest and all decoded values equal the analysis values.
  This checks payload integrity, not unavailable provider-internal reasoning.
- Actual drawing stream headers confirm `gpt-6-astra` / `medium`. A completes;
  B lacks terminal completion after its forced stop. The publication stream in A
  reports model `none`; it is not another drawing/reviewer model.
- The original reports and raw evidence remain unchanged. Existing I/O informed
  the rubric, so this is development evidence, not a held-out assessment.

## Comparison eligibility

| Condition | A | B | Interpretation |
| --- | --- | --- | --- |
| Prompt, reference attachments and viewport | Same prompt, two attachments, 1920x1080 | Equal saved values | These conditions match; both prompts explicitly request Knowledge reading |
| Portable architecture Knowledge | Revision 3 | Revision 4 | Content changed |
| App architectural guidance | Revision 5 | Revision 6 | App-specific guidance also changed |
| Product and capture source | Saved source fingerprint `65a37025fa3e1e77082255abf69f38141e9daa09472677434eeac3ae8b69e8af` | `aad01335351a9575e97f3f08d4074a85c09e4a217ff2b39c13f29784bf25f06a` | Same Git HEAD does not mean the same dirty source. Provider, Knowledge owner, advisory files and capture sources differ |
| Completion | UI success at 366.088 s | Force-stopped at 600 s | Not matched completed workloads |
| First observed content | 59.743 s: whole-building massing | 98.364 s: detailed lower mass/podium | Different content strategies; neither timestamp proves equivalent-work speed |
| Evidence condition | Generation complete; original reload capture failed, later saved inspections exist | Generation incomplete; read-only post-stop recovery exists | Delivery/capture limitations remain visible |

Versions above are verified from discover outputs A0/B0; successful read outputs
A2/B1 contain the delivered documents. The run source maps independently show
changes to portable/App advice, `local-ai-provider.ts`, `local-knowledge.ts` and
capture implementation. No controlled content-only effect can be estimated here.
Stochastic differences, provider conditions and combined interventions are not
separable. Both arms already use Knowledge; neither is a no-Knowledge control.

## 1. Tool correctness and subsequent engineering fixes

| Observation | Saved evidence | Attribution and conclusion |
| --- | --- | --- |
| Material corrections are executable | A34 and B30 return success/completed for fill updates. B30 supplies per-tier gradient domains, including handles outside the local unit square | Tools can apply these chosen parameters. This does not prove that the agent chose good parameters early or that advice caused the choice |
| Root check does not reconcile old descendant results | B60 completes with no findings; B61 verifies the root; B62 still reports 5,459 stale measurement rows | Concrete App evidence-handoff failure. Root correctness cannot be converted into whole-ledger completion or a Knowledge failure |
| Large response is dominated by check records | B58 approximately 2.806 MB and B62 approximately 2.801 MB, in serialized parsed output | Transport/output responsibility, not evidence of poor portable architectural knowledge. No token-count inference |
| Final action is queried through the wrong entry | B63 searches `report_outcome` in the callable catalog and receives no matching tool | Observable route error; App guidance/recovery issue. No evidence that this query alone caused the timeout |
| Later mechanical-validity repair preserves supported evidence | Stage 1 plan records real structural/Undo/Redo/load and consumer tests, including zero new review calls after shared Fill change and one for the affected geometry change | Separate local engineering evidence after B. It was not present in A/B and cannot count as live Knowledge improvement. Stage 2 reconciliation remains unimplemented |
| Post-stop recovery loads durable state | B `post-stop-recovery.json`: zero model requests, durable receipt 1268 | Saved-state recovery demonstrated. Missing original pre-kill equality receipt prevents a claim of exact final-memory equality or unrelated-content preservation |

## 2. Knowledge adoption and decision quality

| Principle / decision | A evidence | B evidence | Assessment and claim level |
| --- | --- | --- | --- |
| Establish connected massing before detail | A9 and `first.png`: centered plinth under full tower massing | B9-11 and `first.png`: offset low podium attached to lower tower | B's broad relationship is more consistent with the aerial reference. Advice-consistent mechanism, not content causation; both prompt and prior model knowledge also support massing |
| Use one projection and backend repetition | A9 uses projected faces; A16 uses surface-grid; later parts expand detail | B17 expands tier surfaces through the existing main tool | Both already delegate supported construction. No evidence that B newly gains this capability from Knowledge |
| Resolve material before affected repetition | A draws repeated detail before the later material judgment A31 | B17 expands tiers before B19 flags weak reflection variation; B21 and B26-28 continue construction before B30 repairs material | The intended early material-decision mechanism is not fully adopted. Naming materials or reading advice did not prevent later correction |
| Correct after detecting a material issue | A31 -> A34 | B19 -> B30 | Earlier detection in B, later correction start and longer detection-to-action delay; no reduced-material-rework claim |
| Carry correct reference scope into visual judgment | A37-39 bind relevant reference uses late | B8 selects uses early, but first reference-backed overall capture occurs B31 | Reference selection is not early reference-backed judgment. Delayed handoff remains |
| Reuse acquired tool contracts | 10 lookups, one explicit delivery recovery | 14 lookups, one explicit delivery recovery, usage/full upgrades, unused exploration and wrong final route | No observed reduction. Concrete acquisition rules are App-owned, not evidence against portable geometry knowledge |
| Local correction preserves unrelated content | A34 scoped fill changes | B30 scoped fill changes; B35/37/40-42/55 targeted structural/ornament corrections | Inputs and receipts support local intent and successful operations. Exact all-unrelated-content equality is not captured, so full preservation remains unscorable |

### B discovery classification

Categories can overlap within a multi-name call. Do not present them as mutually
exclusive percentages or count every lookup as redundant.

| Calls | Actual purpose | Assessment |
| --- | --- | --- |
| 2, 5, 12, 16 | First acquisition of construction/reference/criteria/facts, reference selection, review and context capabilities | Appropriate acquisition; call16 is usage-level |
| 3 | `prepare_and_apply_design` refresh with `delivery-failure` | Declared recovery; necessity remains unknown because server delivery is not model receipt |
| 20 | Semantic `fill update` search | Capability discovery before material correction, not subject-image search |
| 22 | Full batch and fill contracts | Includes new batch contract and fuller fill acquisition; not automatically redundant |
| 23 | Qualified full context contract after usage acquisition | Schema upgrade; no evidence proving that the earlier usage response sufficed |
| 33, 36, 43, 59 | Delete/group, relative order, mechanical review and verification contracts | First explicit acquisition for subsequent actions |
| 34 | `map_retained_fills` usage | Unused exploration in this run; not a tool execution failure |
| 63 | `report_outcome` search | Wrong callable route; requested final action is outside this catalog |

## 3. Decision timing, corrective work and exposure

All times in this section use Send as zero. Raw call times use provider-start
zero; add A 0.283 s and B 0.259 s from saved `sentAt` and stream `startedAt`.
This differs slightly from older provider-relative report timestamps.

| Measure | A | B | Interpretation |
| --- | ---: | ---: | --- |
| First explicit material deficiency | 273.254 s (A31) | 185.943 s (B19) | Detected 87.311 s earlier in B |
| First material corrective write starts | 302.764 s (A34) | 306.218 s (B30) | B starts 3.454 s later, not earlier |
| Detection to corrective write | 29.510 s | 120.275 s | B takes 90.765 s longer after detection; includes other construction and service time, not pure thought |
| Material correction write episodes | One explicit batch | One explicit batch | No observed reduction; B's batch contains many fill operations, not many independent rework episodes |
| Later material acknowledgment | A39 | B32 (material positive, ornament still missing), B53 (tier pass) | B's mixed material/detail criterion must not be counted as repeated material failure |
| App-tool interval union | 24.686 s | 62.095 s | Different work; no same-operation performance claim |
| Provider outside observed tools/research | 338.236 s | 534.452 s | Residual service time; internal thinking/generation/queue/transport are not separated |
| Tool input / output bytes | 289,565 / 434,297 | 490,192 / 8,963,539 | Serialized parsed values, not tokens or full wire traffic; B output heavily reflects App result delivery |

### Verified correction episodes

| Episode | Detection -> corrective action -> later evidence | Outcome and limit |
| --- | --- | --- |
| A crown occlusion | A23 -> A27 -> A29 | Agent reports resolved; inspected final overview is consistent with removed blocking plates |
| A weak glass reflection | A31 -> A34 -> A39 | One material episode; final visual judgment below remains limited |
| A angular entrance arches | A31 -> A34-35 -> A39 | Agent reports resolved; saved native-base crop shows smooth arches |
| B weak glass variation | B19 -> B30 -> B32/B53 | One material episode; material resolves in prose before the combined detail criterion passes |
| B crown rear-column occlusion | B32 -> B35 -> B53 | Agent reports resolved; saved crown image shows remaining visible columns without the reported front-crossing defect |
| B angular ornament outline | B32 -> B40-42 -> B53 | Replacement/order work is visible in successful receipts and the final ornament crop |
| B podium roof/column/door occlusion | B53 -> B55 -> B58 | Later local repair still necessary despite better initial mass placement; recovered base image supports the reported cleanup |

These are at least three A and four B trace-supported defect episodes, not an
exhaustive or exposure-normalized error rate. B's unfinished spire/detail additions,
rejected nonplanar preparation, capture-scope repairs and stale-check recovery are
reported separately rather than inflated into independent artwork defects. A's
initial missing six tiers is planned completion, not six rework episodes. Neither
arm supplies an independent exhaustive defect inventory. Do not infer B is worse
solely from the episode count; it executes longer and inspects different content.

Both agents inspect overview, tiers, base, crown and ornament, but the exact
times/crop coverage differ. Some early crops miss the intended ornament or show
insufficient base detail. Their `unverified`/scope-repair states are not visual
passes. By B58 the agent's visual criteria pass, but B62's mechanical ledger is
still stale; both facts remain, rather than declaring the task complete.

## 4. Retrospective artwork ratings

Scale: 0 absent/major contradiction, 1 consequential defect remains, 2 meets the
inspected criterion. These are ordinal, bounded observations with no aggregate
score. A is the completed saved result; B is the post-timeout durable result,
not an agent-completed deliverable. Artifact frames were inspected directly in
this review: both first frames, A final/native base/crown/tiers/ornament, B saved
overview and all four detail captures, and both original reference images.

| Dimension | A rating and evidence | B rating and evidence | Comparison / attribution limit |
| --- | --- | --- | --- |
| Complete target and silhouette | 2: base, eight tiers, crown and spire visible | 2: same required extent visible | Both recognizable and detailed; score does not certify exact surveyed proportions or B completion |
| Projection and visibility | 2 in inspected final views: consistent edge families and visible tops | 2 in inspected recovered views: coherent projection after repairs | No demonstrated net gain; earlier occlusion defects were real, and hidden geometry is not verified |
| Podium/tower composition | 1: generic centered plinth loses the supported extended/offset relationship | 2 for broad supported relationship: attached low mass extends forward/sideways from tower | Observed improvement, consistent with spatial advice. Exact dimensions and attribution to Knowledge remain unproven |
| Materials and lighting | 1: material separation visible, but repeated tier-local highlight rhythm remains schematic | 1: face contrast and broader tone variation visible, but repetitive reflection/grid appearance and simplified material cues remain | No demonstrated category improvement; weak reference cannot certify exact reflectance. A ornament has stronger highlight variation; B is flatter, so there is no universal visual winner |
| Required editable detail | 2 within observed coverage: native geometry operations and visible facade/frame/ornament details | 2 within observed coverage: same native editable construction with detailed saved regions | Both carry detail beyond broad shapes. No exhaustive editing probe or independent high-resolution facade fidelity proof |
| Scoped correction outcome | Unscorable for full preservation | Unscorable for full preservation | Local calls succeed, but no exact before/after unrelated-content equality evidence exists. Images alone cannot establish this |

The score of 2 is limited to the stated evidence and is not a claim of flawless
architecture. The supplied aerial image is low resolution and includes temporary
construction; the close-up is local ornament evidence. Neither supports exact
unseen geometry. Different crop scales, face orientations and screenshot
backgrounds limit pixel-level comparisons. The pale background of an inspection
image is not by itself proof that the agent added a background object.

Fixed 120/300/600-second synchronized image ratings are not assigned: this review
did not establish frame-exact Send alignment for those saved videos. Existing
first/final and event-bound captures are used with their actual meaning. No
missing checkpoint was synthesized, inferred as a pass or obtained by a new run.
No full-video temporal audit is claimed in this retrospective review.

## Conclusion

| Question | Supported answer |
| --- | --- |
| Did Knowledge get read? | Yes, both versions delivered architectural advice |
| Was there behavior consistent with it? | Yes: connected massing, supported projection/repetition, later coherent material-domain correction |
| Did B choose tools with fewer lookups? | No observed reduction: 10 -> 14; many are legitimate first acquisitions/upgrades and one is a wrong final route |
| Did B reduce material rework or correct earlier? | Not demonstrated: one explicit material correction in each; B detects earlier but acts later |
| Did any artwork dimension improve? | Broad podium relationship improves descriptively; no established overall quality gain |
| Are stale-result fixes Knowledge improvements? | No. The saved failure and later local mechanical-validity fix belong to App engineering; no new model run verifies their live effect |
| Is a causal Knowledge effect established? | No. Content, App guidance/source and stochastic decisions differ, with one run per version and unequal completion |

The strongest supported conclusion is partial advice-consistent adoption with a
better broad podium relationship, alongside unfulfilled early-material correction
and acquisition-efficiency goals. Claims that Knowledge generally reduces
thinking, rework or completion time remain unverified. Missing evidence is not
permission to run another experiment or alter production behavior.
