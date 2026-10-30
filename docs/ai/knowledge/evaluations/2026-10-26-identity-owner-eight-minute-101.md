# Identity and owner receipts - Eight-minute 101 observation - 2026-10-26

## Result

One authorized evaluation used 480 seconds of work and a separate 60-second report
budget, no video, and the production 10,000 expanded-object per-artifact ceiling.
**First frame was 106.847 seconds.** Work stopped at the deadline; report/UI
settlement was 502.041 seconds. All evidence stages completed. The artwork did
not pass: later roof details visibly crossed foreground geometry and remained
unfixed at cutoff. No production source changed during or after the observation.

## Provenance and capture

- Run: `knowledge-quality-knowledge-taipei-101-1793028665812`.
- Evidence directory: `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1793028665812/`.
- Drawing provider: `31b603cc-f817-4acd-b28c-e816dcf989f6.jsonl`; outer request:
  `d1669c3d-1297-4098-a09c-a7463656c0af.jsonl`.
- Actual drawing model/effort: `gpt-6-astra` / `medium`.
- Source digest: `663d29774dc587514d7b134bc22f6614d9ef1beb0e2a29ef1f704a1c9c88cdcf`; final source verification matched.
- Archive: 1,034 files, 55,531,327 bytes, with per-file digests.
- Eleven parsed recording streams complete, no parser issues or reported recording
  failures. Drawing stream: 995 verified payload references, no unfinished tool calls.
- Eleven exact submitted inspection images, 2,699,690 bytes, restored
  with the existing hash-verifying helper. This establishes submitted image bytes,
  not an inaccessible internal model vision representation.
- Report text/image, first/final/reload screenshots and checkpoint saved.
- Durable sequence 490/490; fresh-context reload preserved root order and durable
  receipt. This does not compare every canonical property.
- Browser and all three task-owned services stopped. An initial analyst cleanup
  command inherited an incompatible Node stdin flag in its worker. Executing the
  same cleanup logic from a project-local module succeeded. This post-run command
  error is separate from product cleanup, which succeeded.

## Tool correctness and actual AI behavior

| Item | Evidence | Scoped result |
| --- | --- | --- |
| Counter allocation | Zero calls; AI supplied source keys | Adoption unobserved; local allocation/reference tests remain the proof |
| Key/boundary identity | All seven creation calls accepted without identity conflicts | No recurrence; cannot attribute this to an unused allocator |
| Prepared material | Two calls, each changed two targets; model output includes acceptedIds, unavailableIds=[], changed=true, complete/completed | Normal changed-result delivery exercised |
| Browser-to-model receipt | Both browser completion events and model replies agree on complete/completed | Browser diagnostic projection omits acceptedIds/changed; no byte-for-byte independent comparison of those omitted fields is claimed |
| Legal no-op / partial write | Neither triggered | Local-only verification |
| Geometry-composition / retained-fill receipt fixes | Those routes not invoked | Actual AI use remains unobserved |
| Partial discovery | read_design_context /properties unavailable at union root; companion contract remained available | Explicit partial with valid paths and recovery guidance |
| Snapshot recovery | Retain three bounds, then read same snapshot as columns; selectionExecutions=0 on second read | No repeated selection computation or redraw |
| Deadline | Last creation finished 437.352 s; only snapshot release and report_outcome after cutoff | No recorded late drawing |
| Review | Initial material failure led to two revisions; final overlap errors recorded fail and accepted=false | Useful detection, unfinished correction |
| Image-display error | Mentioned by AI self-report; this analysis did not establish a matching error payload | Unconfirmed self-report, not counted as a confirmed App failure |

There were 35 App-facing calls: 34 success, one partial, zero failed or unknown
top-level tool outcomes. This does not classify every native Code Mode operation.
A successful record-review call can contain failing visual checks; it means those
checks were recorded, not that the drawing passed. Seven creation calls produced
15,312 elements across artifacts, with each artifact below the production cap.
No safe-overflow recovery was exercised.

## Final partial explained

The report-only prompt requests outcome=unsupported, which UI aggregation combines
with completed operations into partial. There was also a real partial discovery
response. Separately, final visual coverage was 3/7 passed: overall, full-building
material, crown detail and base detail remained failed. That count is not a task
completion percentage. The artwork genuinely had unresolved visible defects.

The AI correctly reported that it only queried deletion; no deletion ran. Its
statement that persistence had not been confirmed reflects the information it had
when reporting. The later host capture independently confirmed durability/reload.
Provider outcome=completed means the bounded request/report lifecycle settled; it
does not override the interrupted work turn or failed artwork checks.

## Timeline

Seconds are relative to Send. First frame means first observed drawing bounds
with a saved screenshot, not an instrumented GPU paint timestamp.

| Interval | Wall time | Activity |
| --- | ---: | --- |
| 0-12.980 | 12.980 s | Startup and initial public response |
| 12.980-54.378 | 41.398 s | Three Knowledge calls and four tool-contract calls |
| 54.378-105.356 | 50.978 s | No App tool call; native output item starts at 57.254 s and dispatches at 105.345 s |
| 105.356-106.847 | 1.491 s | First creation completes 106.841 s; **first frame 106.847 s** |
| 106.847-191.364 | 84.517 s | Material capture/failure, revision/application, recapture/pass |
| 191.364-355.499 | 164.135 s | Four submissions: upper tiers, podium, crown/spire, ornaments |
| 355.499-412.084 | 56.585 s | Multi-target review, failed details, schema lookup and retained bounds |
| 412.084-437.352 | 25.268 s | Add podium and crown roof details |
| 437.352-479.665 | 42.313 s | Mechanical summary, visual failures and deletion contract queries |
| 479.665-480.016 | 0.351 s | Deadline and work interruption acknowledgement |
| 480.016-502.041 | 22.025 s | Report-only phase, release, report capture and UI settlement |

The 50.978-second pre-submission interval is explicit. Native evidence identifies
an output item start at 57.254 s, followed by 48.091 seconds with no recorded event
until dispatch. Cause is unconfirmed; argument progress is unavailable. The next
tool input was 6,124 bytes. No hidden activity is inferred from that size.

## Cost and guidance observations

The seven pre-drawing calls returned 90,127 serialized bytes, including envelopes.
Main drawing usage took two pages. A full review/reference query was followed by
capture-specific usage. No all-tools catalog query occurred. Across all calls,
input was 82,676 bytes and output 218,689 bytes, excluding image assets. Recorded
tool execution summed to 11.927 seconds. The per-call table exposes every gap;
other wall time is not assigned a guessed cause.

Knowledge reads were the requested architectural directory, entry, and material
method child. Actual world-space material fields were authored and revised. This
is consistent with guidance, but does not isolate its causal contribution.
The earlier run's first frame was 94.442 s versus 106.847 s here; two uncontrolled
runs do not establish a speed or stability effect from these changes.

## Actual visual findings

Original submitted before/after material images were inspected. The original
teal glass was comparatively uniform; after the two writes, continuous reflective
bands are visible. These were edits to existing targets, not a full redraw.

At 384.051 s, overall/crown/base failed and ornament remained unverified because
its framing did not establish the complete ornament. The agent read bounds and
added roof details under existing parents. The subsequent exact submitted crown
and base images visibly show roof lines crossing foreground solids. At 471.160 s,
the agent recorded those affected checks as fail and ornament as pass. It queried
deletion but reached the deadline before applying a correction.

Creation complete means the submitted objects were created; it is not visual
acceptance. Submitted order, delivery of placement controls, and canonical
insertion behavior still need to be traced before naming a root cause. The most
useful next bounded investigation is existing-parent additions to visible order
and overlap, using these saved inputs. It does not require another model run.

## Every App-facing tool call

Gap is from the previous App call's end; it may include public activity or native
operations. Input/output columns are serialized recorded bytes.

| # | Start-end (s) | Tool time (s) | Gap (s) | Tool | Input/output bytes | Observation |
| --- | --- | ---: | ---: | --- | ---: | --- |
| 1 | 12.980-12.988 | 0.008 | 12.980 | `discover_knowledge` | 87/5752 | Discover architectural topic |
| 2 | 23.985-23.987 | 0.002 | 10.997 | `read_knowledge` | 87/2518 | Read architectural entry |
| 3 | 28.417-28.470 | 0.053 | 4.430 | `describe_design_apis` | 170/23072 | Read selected draft/pattern/grid usage, first page |
| 4 | 34.893-34.894 | 0.002 | 6.423 | `describe_design_apis` | 279/4608 | Continue selected usage |
| 5 | 37.854-37.856 | 0.003 | 2.959 | `read_knowledge` | 104/21851 | Read material-method Knowledge |
| 6 | 50.219-50.222 | 0.003 | 12.363 | `describe_design_apis` | 69/23072 | Read full review/reference definitions, paged |
| 7 | 54.375-54.378 | 0.003 | 4.153 | `describe_design_apis` | 80/9254 | Read capture-specific usage |
| 8 | 105.356-106.841 | 1.485 | 50.978 | `prepare_and_apply_design` | 6124/1479 | Create two representative tiers |
| 9 | 114.140-114.193 | 0.053 | 7.299 | `review_drawing` | 188/3398 | Capture material |
| 10 | 137.768-137.781 | 0.013 | 23.575 | `review_drawing` | 866/5811 | Record material failure |
| 11 | 143.925-143.931 | 0.006 | 6.144 | `describe_design_apis` | 26/15027 | Find material capabilities |
| 12 | 149.829-149.833 | 0.004 | 5.898 | `describe_design_apis` | 122/8947 | Read material/reference fields |
| 13 | 166.448-166.511 | 0.063 | 16.615 | `prepare_material_revision` | 656/183 | Prepare Y material |
| 14 | 166.513-166.558 | 0.046 | 0.002 | `prepare_material_revision` | 608/183 | Prepare X material |
| 15 | 177.599-177.639 | 0.039 | 11.041 | `apply_prepared_material` | 133/1198 | Apply Y material to two targets |
| 16 | 177.641-177.660 | 0.019 | 0.002 | `apply_prepared_material` | 133/1202 | Apply X material to two targets |
| 17 | 177.661-177.683 | 0.022 | 0.001 | `select_design_references` | 797/2932 | Record restricted reference uses |
| 18 | 182.648-182.708 | 0.060 | 4.965 | `review_drawing` | 188/3392 | Capture revised material |
| 19 | 191.352-191.364 | 0.011 | 8.644 | `review_drawing` | 899/5667 | Record material pass |
| 20 | 207.031-211.781 | 4.750 | 15.667 | `prepare_and_apply_design` | 4715/819 | Create six upper tiers |
| 21 | 256.314-258.243 | 1.929 | 44.534 | `prepare_and_apply_design` | 8184/819 | Create podium and lower tower |
| 22 | 306.514-307.694 | 1.180 | 48.271 | `prepare_and_apply_design` | 10275/819 | Create crown and spire |
| 23 | 355.066-355.499 | 0.432 | 47.373 | `prepare_and_apply_design` | 27484/773 | Create ornaments |
| 24 | 364.965-365.227 | 0.262 | 9.466 | `review_drawing` | 1269/10443 | Capture overview and four details |
| 25 | 384.051-384.061 | 0.011 | 18.824 | `review_drawing` | 4971/9820 | Record overall/crown/base failures and unverified ornament |
| 26 | 399.124-399.127 | 0.002 | 15.063 | `describe_design_apis` | 84/15241 | Invalid union-root schema query; partial |
| 27 | 405.129-405.134 | 0.005 | 6.002 | `read_design_context` | 224/1126 | Retain three target bounds |
| 28 | 412.079-412.084 | 0.004 | 6.945 | `read_design_context` | 107/1512 | Read retained columns |
| 29 | 436.118-437.136 | 1.019 | 24.034 | `prepare_and_apply_design` | 5795/773 | Add podium roof and entrance |
| 30 | 437.138-437.352 | 0.214 | 0.002 | `prepare_and_apply_design` | 2413/773 | Add crown roof details |
| 31 | 457.119-457.183 | 0.064 | 19.767 | `read_design_checks` | 18/226 | Read mechanical summary |
| 32 | 457.185-457.320 | 0.135 | 0.002 | `review_drawing` | 1193/8956 | Capture overview and three details |
| 33 | 471.160-471.177 | 0.016 | 13.841 | `review_drawing` | 4230/9371 | Record occlusion failures; ornament passes |
| 34 | 471.180-471.185 | 0.005 | 0.003 | `describe_design_apis` | 42/4667 | Search deletion usage |
| 35 | 479.659-479.665 | 0.005 | 8.474 | `describe_design_apis` | 56/13005 | Read selected deletion operation; no deletion follows |

## Recorded-event gaps above ten seconds

These include public arrivals and captured native metadata. Each listed interval
has no recorded event and an unconfirmed cause; no private reasoning is inferred.

| Start-end (s) | Duration (s) |
| --- | ---: |
| 57.254-105.345 | 48.091 |
| 120.039-133.711 | 13.672 |
| 155.670-166.440 | 10.770 |
| 213.955-228.178 | 14.223 |
| 228.583-256.297 | 27.714 |
| 260.436-278.001 | 17.565 |
| 288.164-306.501 | 18.337 |
| 311.134-328.874 | 17.741 |
| 331.390-355.049 | 23.659 |
| 370.192-384.036 | 13.845 |
| 386.923-398.631 | 11.708 |
| 415.056-436.103 | 21.047 |
| 439.205-450.321 | 11.116 |

## Closure

Observed: ordinary material receipt delivery, valid submitted keys, explicit failed
visual judgments, deadline enforcement, report capture and reload. Unobserved:
allocator adoption, no-op and partial-write recovery, every audited API, and final
visual quality acceptance. The preceding local tests retain their separate scope.
No additional model run, production edit, CI inspection or push followed this run.
