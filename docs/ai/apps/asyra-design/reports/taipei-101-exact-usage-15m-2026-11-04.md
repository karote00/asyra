# Taipei 101 - exact usage and artifact data review - 2026-11-04

The runner sent one immutable prompt. Drawing reached the fifteen-minute limit.
The original AI completed its untimed report in the same native thread. The
recorder exited with code 1 during evidence collection. Independent recovery
verified the saved drawing and original recording. The original run retains its
failure status.

## Verification of the changes

| Production input from the preceding run | Previous complete body | New complete body | Pages required to retrieve the full body |
| --- | ---: | ---: | --- |
| Short names for fill mapping, retained targets and batch execution | 86,909 B | 31,085 B | 5 to 2 |
| Short name for context reading | 56,463 B | 15,809 B | 3 to 1 |

These are repeated queries against the same captured declarations. In the prior
live run the AI requested only the first page of each query. Page counts describe
complete retrieval. This live run used exact query matching for read_design_context
and received one action guide (15,881 B including the model reply envelope).
It requested map_retained_fills on its own and received one guide (14,140 B).
The separate initial draft with optional plan still required two fragments for
24,879 B. No wall-time improvement is inferred from these byte counts.

Default usage now represents a canonical wrapper through the qualified dependency
on its executable action. Native qualification, full retrieval and explicit machine
contracts preserve route selection. Output navigation is bounded to fields and
branch choices. True namespace collisions remain explicit. A failing regression
also exposed an unrelated same-name saved tool advertised as an action dependency.
The fix requires the action owner's registered identity. The App dispatcher already
uses namespace plus name. Model-reported misses during provider-native callable
discovery remain unattributed.

The sent operation contract and correction receipt now agree with the current fill
and discovery owners. A focused test combines one direct ID and exact keys from
two real preparation artifacts in one review invocation with one canonical read.
Foreign, missing and overlapping keys are rejected before reads. Stale selected
values are rejected at judgment. This live AI used visual capture and record only.
It did not invoke numeric review or the artifact-key extension.

Owner checks passed after correcting consumers of the old dual-route usage and
image-only data expectations. The operation suite passed 199 cases. The batch,
data and review suites passed 147. Eight selected discovery cases and the four
direct provider, correction and proof cases passed. App server typecheck, scoped
ESLint (zero errors), naming, Inspector and required runner builds passed. Only
focused tests were run. Recorded App and Inspector source hashes matched after
the run.

## Drawing, original report and evidence

| Item | Result |
| --- | --- |
| Run | taipei-101-fixed-1793776465986 |
| Prompt SHA-256 | 25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51 |
| Native provider record | 7afe0ebe-204c-46a2-ba08-9639cce8901d |
| Original thread | 01a1a568-e379-7920-a4d8-16715fd80ead |
| Drawing turn | 01a1a568-e3de-7d42-8590-fdfce01eca19 |
| Report turn | 01a1a576-9883-74c2-8a1a-d095d3e8ab2b |
| Drawing elapsed | 899.696 s, interrupted by the runner deadline |
| Report elapsed | 330.212 s, untimed and complete |
| First paint opportunity | 109.658 s |
| Recorder fits | 114.850 and 186.906 s |
| Editable elements at cutoff | 21,258 vectors, 160 ovals and 8 groups. One additional workspace |
| Last recorded review | Two of six checks passed before final edits. No final acceptance |
| Durable checkpoint | Sequence 688, generation 0, document equal to drawing cutoff |
| Independent reopening | All canonical props and elements matched the checkpoint fingerprint |
| Original WebM | 109,441,811 bytes, 1920 x 1080, 1,251.6 s including the report |

The original report describes seven successful preparation/application calls.
The first tower was partitioned into 9,524 and 904 elements. Subsequent work
included the crown, spire, layered ornaments, podium and facade shadows. The last
537-element revision refined scrolls and crown detail. It was applied but not
visually judged afterward. At the last review, silhouette and view had passed,
three detail units had failed and scale data remained unresolved.

The recorded reference import was partial. One aerial image was retained and a
second URL returned HTTP 404. The AI kept working from the usable reference.
Three context reads near the fill change addressed placement and finding actual
element names. A prefix matched no glass, a local inspection exposed the naming
pattern, and a suffix selected the intended targets for the batch fill change.
The last correction removed specific ring ornaments and added open scrollwork.
The AI identified earlier local inspection as a potential way to avoid repeating
a weak ornament. No automatic estimate of time saved is available.

## Work dispatched within one AI call

The native provider record counts outer App calls. A drawing workflow, an
ordered action batch and a reusable recipe have different execution boundaries.

| Provider sequence | AI submission | Work completed behind that call |
| --- | --- | --- |
| 259 | One tower draft and plan to prepare_and_apply_design | Prepared and applied two partitions of 9,524 and 904 elements, returning one workflow result |
| 1002 | One execute_design_batch operation | Mapped existing fills across 10,227 targets and returned one action result |
| 22746 | Two ordered operations in execute_design_batch | Changed relative layer order, then grouped elements, returning both action results |
| 24080 | Three ordered deletions in execute_design_batch | Deleted the selected ornament subsets and returned three action results |

All seven drawing workflow calls supplied a single draft. The AI submitted
three explicit batches containing one, two and three operations respectively.
It made zero submit_tool and invoke_tool calls. The two review captures and
two review records were separate calls so the AI could inspect the returned
images before judging them. These records establish which work ran together.
They do not measure the latency of a hypothetical sequence of individual calls.

The actual purpose query `import reference image` returned import_reference_image
and select_design_references. The AI then selected import_reference_image by
exact name. This illustrates discovery followed by contract selection. Native
provider search misses reported by the AI are a separate observation.

## Intervals between App calls

There were 32 calls (12 discovery, seven preparation/application, four review,
four native context reads, three batches, one import and one reference selection).
The measured interval union of App calls is 25.106 s. Twelve inter-call gaps of
at least 30 seconds total 646.727 s (rounded). The AI describes organizing large
inputs, inspecting images, resolving target names and locating contracts.
The provider trace does not allocate all elapsed time to these causes.

| Gap start (s) | Next call (s) | Elapsed (s) | Next operation |
| ---: | ---: | ---: | --- |
| 48.163 | 108.023 | 59.860 | prepare_and_apply_design |
| 129.230 | 185.507 | 56.277 | prepare_and_apply_design |
| 186.555 | 227.997 | 41.442 | review_drawing |
| 239.948 | 316.938 | 76.990 | prepare_and_apply_design |
| 375.589 | 434.211 | 58.622 | prepare_and_apply_design |
| 466.612 | 504.012 | 37.400 | select_design_references |
| 504.061 | 568.052 | 63.991 | prepare_and_apply_design |
| 569.428 | 613.956 | 44.528 | prepare_and_apply_design |
| 650.808 | 692.172 | 41.364 | review_drawing |
| 692.574 | 742.055 | 49.481 | review_drawing |
| 751.568 | 797.820 | 46.252 | describe_design_apis |
| 812.356 | 882.876 | 70.520 | prepare_and_apply_design |

## Recorder failure and independent recovery

The provider finished the report and the collector exported the verbatim text
and its native turn evidence. Subsequent page-dependent collection operations
reported a closed target. The initiating cause of the browser closure remains
unknown. The original page's final source, App report receipt, persistence
confirmation, detail captures, reload comparison and video export did not finish.

The backend checkpoint was collected successfully. Its document equals the work
snapshot. A fresh App page opened an isolated copy of the run's own backend store.
The checkpoint and reopened document match across canonical props and scene
elements using the same sorted, chunked fingerprint, including document version,
workspace and workspace list. Recovery produced an overview and did not resubmit
the prompt. The original WebM temporary file was playable at 150, 260, 650 and
898 seconds. The 260-second frame shows the building from base to spire during
drawing. The independent evidence supports persistence, reopening and playback.
It cannot reconstruct the original page's missing final App receipt. No release,
commit or push occurred.

- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793776465986/self-report.md" target="_blank" rel="noopener noreferrer">Original AI report, verbatim</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793776465986/self-report-evidence.json" target="_blank" rel="noopener noreferrer">Native same-thread report evidence</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793776465986/run.json" target="_blank" rel="noopener noreferrer">Original runner result</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793776465986/usage-analysis.json" target="_blank" rel="noopener noreferrer">Provider calls and gaps</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793776465986/recovered-persistence.json" target="_blank" rel="noopener noreferrer">Cutoff/checkpoint comparison</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793776465986/evidence-recovery/recovery.json" target="_blank" rel="noopener noreferrer">Independent reload and playback verification</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793776465986/evidence-recovery/reopened-overview.png" target="_blank" rel="noopener noreferrer">Reopened document</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793776465986/evidence-recovery/video-260.png" target="_blank" rel="noopener noreferrer">Intermediate video frame</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793776465986/browser-artifacts/page@3518ba25ec98e8bd32892a9eb58af595.webm" target="_blank" rel="noopener noreferrer">Original process recording</a>
