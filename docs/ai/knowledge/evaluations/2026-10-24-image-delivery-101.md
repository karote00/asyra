# Native image handoff - bounded 101 observation - 2026-10-24

## Result and scope

First content appeared at **38.460 seconds** after Send. The first screenshot
contains the base/podium and its windows; an entire building was not required for
this milestone. Work stopped at 120.004 s, native interruption acknowledged at
120.009 s, and the model report completed at 134.832 s. Report capture/UI settlement
completed at 135.297 s. No App tool or action started at/after the work deadline.
The product result is **partial**, not visual acceptance.

One authorized run, no video, 120000 ms work and at most 60000 ms report; production
expanded-object ceiling 10000. Actual provider record confirms gpt-6-astra / medium.
No product source edits, repeated model run, CI inspection or push during this test.

- Run: `knowledge-quality-knowledge-taipei-101-1792839882487`.
- Base URL: `http://localhost:3307/?fileId=knowledge-quality-knowledge-taipei-101-1792839882487`; viewport 1920 x 1080.
- Command: `node --env-file-if-exists=.env test-data/knowledge-evaluation/run-101.mjs quality-knowledge --deadline-ms=120000`.
- Source digest: `76d6ff9e3278c332a2e776297b98acee6384587d4588a7171ae40b07b9a74623`; head `ca73c170896faf1be7a39a6b6cd86be965dd9da0` plus preserved dirty source snapshot.
- Drawing provider: `7e6750b8-41cd-45e5-a227-9e0486d6a289.jsonl`; source request `ef4badaf-2eea-4393-a489-63a9ab0093ea`.
- Raw evidence: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792839882487/`, including preserved-provider, source snapshot,
  checkpoint, first/final/reload images and self-report text/image.
- Existing framework report: execution-report.json. Parsed, non-certifying
  tool details: generation-analysis.json. Hash/asset/cutoff verification:
  image-handoff-verification.json. Original run.json remains unchanged.

## Handoff results

| Question | Observed evidence | Conclusion / limit |
| --- | --- | --- |
| Main image delivery | Three completed main-tool calls; each returns one inspection image. All three original PNGs retained and hash verified. | App-to-native submission is confirmed. Live Code Mode source and subsequent model request are not exposed by these records. |
| Criteria after capture | At 57.871 s, bindChecks references the first main-tool inspectionId. No targets/capture request. | Existing pixels are reused after criteria definition; no redraw or recapture for binding. |
| Multiple retained images | At 88.186 s, bindChecks uses both the base and upper-tower inspection IDs. At 95.922 s the bound result records detail=fail. | The retained-image-to-verdict path is observed; successful storage remains accepted=false. |
| Repeated capture | Three inspect_drawing actions total, each belongs to a different newly drawn composition. No standalone recapture or duplicate image digest. | No unnecessary recapture observed in this run. |
| Delivery-failure recovery | No observable App tool failure or self-reported forwarding error; no native exec body available. | No observed recovery trigger; actual store/load adoption and retry behavior remain unobserved. Prior formal native recovery proof remains separate. |
| No replay | Three different source submissions, three successful browser applications: 535, 7345 and 225 created elements. No repeat producer call for image display. | No replay observed; this does not exercise recovery after a display failure. |
| Cutoff | No tool/action start after the deadline; last application/capture completes by 116.868 s. Report-only turn follows interruption acknowledgement. | Work/report phase protection behaved correctly in this run. Durable flushing after cutoff is not a new drawing. |
| Save/reload | Sequence 257/257; same three roots and order after fresh-context reload. | Existing persistence oracle passes; not property-by-property visual equivalence. |

The immediately preceding run 1792834534052 returned the same 298604-byte image
again during a later review capture and included a model-reported forwarding error.
This run instead binds the existing image without recapture. That is a positive
observed handoff, but the historical error arguments remain unrecorded and the
specific store/load recovery branch was not observed. Old image(uri) was independently
valid in native offline tests; do not reinterpret the previous error as a proven
interface-format defect.

## Timeline

Times below use Send at `2026-10-24T11:04:47.608Z` as zero, using raw event timestamps.
Fine-grained durations use the monotonic event clock; millisecond rounding can
produce small differences. **First frame: 38.460 s**, during the interval after the
first completed submission. It is preserved in first.png.

| Interval (s) | Duration (s) | Activity |
| --- | ---: | --- |
| 0.000-9.574 | 9.574 | Between observed App calls / startup |
| 9.574-9.582 | 0.008 | Scoped Knowledge catalog |
| 9.582-9.587 | 0.005 | Between observed App calls |
| 9.587-9.589 | 0.001 | Parent Knowledge |
| 9.589-9.590 | 0.001 | Between observed App calls |
| 9.590-9.633 | 0.043 | Main usage including optional plan |
| 9.633-16.059 | 6.426 | Between observed App calls |
| 16.059-16.069 | 0.010 | Main usage without optional plan |
| 16.069-16.073 | 0.004 | Between observed App calls |
| 16.073-16.074 | 0.001 | Material-method Knowledge |
| 16.074-37.818 | 21.744 | Between observed App calls |
| 37.818-38.442 | 0.624 | Base/podium + capture |
| 38.442-38.460 | 0.018 | First completed submission to observed first content |
| **38.460** | **Milestone** | **First frame: visible base/podium and windows; first.png** |
| 38.460-40.929 | 2.469 | Between observed App calls |
| 40.929-40.931 | 0.002 | Criteria/review usage |
| 40.931-57.867 | 16.936 | Between observed App calls |
| 57.867-57.870 | 0.003 | Define criteria |
| 57.870-57.871 | 0.001 | Between observed App calls |
| 57.871-57.878 | 0.006 | Bind existing base image |
| 57.878-76.069 | 18.191 | Between observed App calls |
| 76.069-80.700 | 4.631 | Eight tiers/crown/spire + capture |
| 80.700-88.186 | 7.486 | Between observed App calls |
| 88.186-88.196 | 0.010 | Bind two existing images |
| 88.196-88.198 | 0.002 | Between observed App calls |
| 88.198-88.199 | 0.001 | Read-checks usage |
| 88.199-95.922 | 7.723 | Between observed App calls |
| 95.922-95.930 | 0.008 | Record detail fail; accepted=false |
| 95.930-95.932 | 0.002 | Between observed App calls |
| 95.932-95.950 | 0.017 | Read check summary |
| 95.950-116.351 | 20.401 | Between observed App calls |
| 116.351-116.868 | 0.518 | Ornaments + capture |
| 116.868-120.004 | 3.136 | No further App calls before work stop |
| 120.004-120.010 | 0.006 | Stop, interruption acknowledgement and report start |
| 120.010-134.832 | 14.822 | Report-only turn |
| 134.832-135.297 | 0.465 | UI/report capture settlement |


The complete App tool intervals total 5.885 s.
The provider request reports 134.495 s total, including reporting. The framework
report attributes observed ownership but does not measure hidden thinking or
separate every native generation/transport delay. In particular, the 21.744 s
between final initial acquisition and first submission is not proven model thought.

Fresh-context reload took 5.252 s after report capture and checkpoint export;
browser cleanup completed at 141.865 s from Send. These are outside the work phase.
Compared with the prior run's first frame at 37.468 s, this run is 0.992 s later;
there is no measured first-frame speed improvement attributable to this change.

## Data and image evidence

| Main submission | Start (s) | Saved input bytes | Saved output JSON bytes | Created elements |
| --- | ---: | ---: | ---: | ---: |
| Base/podium + capture | 37.818 | 4405 | 1840 | 535 |
| Eight tiers/crown/spire + capture | 76.069 | 7130 | 1373 | 7345 |
| Ornaments + capture | 116.351 | 57630 | 1371 | 225 |

Image payloads are separate from output JSON: base 608008 bytes (1024 x 984),
tower 327077 bytes (230 x 1024), ornaments 38333 bytes (210 x 1024). All 100 referenced
payloads and five referenced assets (two input references, three output images)
match their saved byte lengths and SHA-256. All seven preserved execution streams
parse complete; the drawing stream reports zero recording failures. This is full
available public I/O evidence under existing redaction, not private Code Mode code
or an exact live model-visible request. Redacted instructions in diagnostics do
not imply redacted product delivery.

The final ornaments submission is 57630 saved input bytes for 225 elements. This
is a remaining large-input observation, not a diagnosed image-delivery defect;
no additional issue was investigated or changed in this run.

## AI behavior and screenshots

AI read the architectural parent and material-method child, not every child. It
changed the initial main-tool usage scope by removing optional plan. This run does
not independently establish why that second query was necessary. Knowledge and
all schema changes are held as current context, not credited to this image slice.

AI recorded a fail verdict for repetitive reflections, flat top surfaces and
missing ornamentation, then added ornaments. No later material pass or whole-image
acceptance occurred. Its report explicitly calls the drawing incomplete and labels
its explanation for delay as speculation, consistent with recorded evidence.

Inspected first.png, final.png, reload.png and the first two retained inspection
PNGs. First content is visible, the final frame contains the complete tall massing
and ornaments, and the fresh reload visibly restores it. The App screenshots
include selection/UI overlays (first view 6%, final/reload 2%); captured inspection
PNGs have a white background without those UI overlays. Repeated window gradients
and uniform surfaces are visible, supporting the recorded fail rather than a
realism-pass claim. The narrow upper-tower overview cannot certify fine material
detail, and screenshot review does not establish dimensional accuracy.

No failure recovery or historical-error closure claim follows from this successful
normal-path observation. No further run is authorized by this report.
