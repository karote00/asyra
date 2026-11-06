# Taipei 101 - repeat and single host comparison - 2026-11-05

Both runs submitted the same approved prompt once and finished drawing before the
900-second cutoff. All 72 files in the baseline source manifest matched before
and after the repeat. The full repeat retrospective was verified against the
original native report text and shared drawing thread. The single entry grouped
ready operations successfully in both runs. The repeat also had two real
create-to-order dependencies and delegated neither as an output binding.

| Measure | Previous complete run | Repeat |
| --- | ---: | ---: |
| Drawing seconds | 687.220 | 836.033 |
| Untimed report seconds | 295.200 | 342.924 |
| First paint opportunity, seconds | 123.805 | 153.007 |
| Outer App calls | 25 | 40 |
| App discovery / creation workflows / reviews | 9 / 4 / 7 | 15 / 7 / 11 |
| Unified calls | 3 | 5 |
| Operations per unified call | 2, 2, 7 | 1, 4, 1, 3, 1 |
| Multi-operation calls / total operations | 3 / 11 | 2 / 10 |
| Unified calls with completed settlement | 3 of 3 | 5 of 5 |
| Output bindings / host repair loops / step-time selections | 0 / 0 / 0 | 0 / 0 / 0 |
| Native declaration searches, as reported by the agents | 5 | 5 |
| Union of observed App tool intervals, seconds | 15.426 | 11.720 |
| Gaps of at least 30 seconds, count and total seconds | 8 / 460.193 | 7 / 425.818 |
| Last formal review, agent-selected units | 10 of 10 | 6 of 6 |
| Vectors / ovals / groups | 13,265 / 35 / 4 | 11,669 / 143 / 7 |
| Durable sequence | 429 | 396 |

The other two App calls in each run were one calculation record and one check
ledger read. Native declaration searches and external research are separate.
The 148.813-second difference in drawing time cannot be assigned to the host
entry. The extra 15 App calls comprise six discovery calls, three creation
workflows, four reviews and two unified calls. The inputs, geometry and visual
decisions differed. Per-run self-review counts are not a common quality scale.

## Repeat operations and handoffs

| Sequence | What ran | Reason for the boundary |
| --- | --- | --- |
| 295, 376 | Initial whole-building draft partitioned. The first part applied 9,986 elements; the spire faces in the remaining part failed a planarity check. A retained repair applied the remaining 674. | New vertex values were needed. Completed geometry was not replayed. |
| 606, 640, 687 | Ornament draft failed preparation on a nonplanar corner before writing. Repair applied 727 elements; a separate construction added 395 eave/crown elements. | The failed face required new geometry. The agent says some subsequent crown detail could already have been prepared with the ornament work. |
| 842 | Group four roots in one operation. | All member IDs were known. The group ID was then used for review; fixed data lookup could potentially be bound, whereas image judgment required the agent. |
| 1315 | Move the ornament layer and delete three selected groups of obsolete spire/coin details. Four operations in one canvas exchange. | Order and targets were ready. |
| 1382, 1420 | Create 209 replacement elements and move their root in a separate call. | Returned compositionIds[0] equals the moved ID. Anchor already appeared in earlier receipts. No intervening App call. Gap 6.98 seconds. |
| 1756 | Reorder spire rings and delete two sets of square coin grid lines. Three operations in one canvas exchange. | Target identities were resolvable from the artifact and the ordering decision was ready. |
| 1840, 1879 | Create 41 circle-fitting seam elements and order their root in a separate call. | Same ID equality and earlier anchor availability. No intervening App call. Gap 10.81 seconds. |
| Review and correction | Four capture calls, five judgment records, one data read and one evidence bind. | Images revealed actual occlusion and overly square coin grids. When capture succeeded but binding failed, existing images were rebound rather than recaptured. |

The agent identified 1315 → 1382 → 1420 and 1756 → 1840 → 1879 as opportunities
for one handoff once the replacement geometry is ready. The measured post-creation
gaps are not a measured savings estimate. The preceding 33.815 and 62.081 seconds
before the two creation calls included preparation of replacement inputs and
should not be counted as pure ID-transfer time. Neither run exercised automatic
repair or post-write target selection, so live stability for those behaviors
remains unmeasured. Five ready multi-operation calls across two runs demonstrate
repeatable use for that narrower behavior.

## Run evidence

Repeat run taipei-101-fixed-1793813033338. Fixed prompt SHA-256
25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51.
Native thread 01a1a796-cdfa-7ef2-9531-24a2c4d2dcda. Work turn
01a1a796-ce60-7e61-98ae-ef2b676e4b37 and report turn
01a1a7a3-89f8-76f2-8782-cc5e1e750b95. The drawing phase completed; the
combined App conversation settled as executed/partial after reporting. Standard
evidence collection exited zero with no recorded errors. The document matched
after reporting and reload. The 1920 by 1080 recording was seek-tested at 160,
410 and 840 seconds. Automatic fits occurred at 157.722 and 168.384 seconds.

<a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793813033338/self-report.md" target="_blank" rel="noopener noreferrer">Repeat original AI report</a>

<a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793813033338/handoff-analysis.json" target="_blank" rel="noopener noreferrer">Repeat call index</a>

<a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793813033338/run.json" target="_blank" rel="noopener noreferrer">Repeat metadata</a>

<a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793813033338/final.png" target="_blank" rel="noopener noreferrer">Repeat final canvas</a>

<a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793813033338/recording.webm" target="_blank" rel="noopener noreferrer">Repeat recording</a>

<a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793811525159/self-report.md" target="_blank" rel="noopener noreferrer">Baseline original AI report</a>

<a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793811525159/handoff-analysis.json" target="_blank" rel="noopener noreferrer">Baseline call index</a>
