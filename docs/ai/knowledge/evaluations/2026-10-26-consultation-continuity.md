# Consultation continuity observation - 2026-10-26

The missing-predecessor problem did not recur in this observation. The second
native work input contained the exact first user request and the exact displayed
first answer, with zero omitted turns. Its generated answer explicitly continued
the same cool glass / matte silver materials, three-quarter viewpoint and upper-left
light. This supports the bounded context-handoff fix in one live case; it does not
establish future reliability or reduced Knowledge duplication.

## Execution and scope

- Run: `knowledge-consultation-1792946568945`.
- Start: 2026-10-26 00:42:52.581 Asia/Taipei.
- Original two non-drawing prompts, unchanged; gpt-6-astra / medium.
- Shared 120-second work budget; final reporting bounded to 60 seconds. No video,
  model retry, forced tool selection or changed production artifact limit.
- Finished in 88.198 seconds; both App outcomes were `no-change`.
- Full before/after document snapshots and IDs are identical. No drawing or image
  capture tools were called. First frame is not applicable to the requested advice.
- Source snapshot remained unchanged. HEAD is
  `04d87366167e048e719129b67f10dbb6929fd5f2` plus preserved local changes; the
  authoritative run manifest and source archive identify the executed version.
- Evidence: `tmp/knowledge-evaluation/knowledge-consultation-1792946568945/`.
- Original records: `tmp/continuity-provider-1792946513553/`.

The runner previously put both requests through the evaluation report phase,
replacing the first ordinary answer before the follow-up. Before this run, only
the diagnostic runner was corrected: first request ordinary, final request with
the existing report window. The existing process watchdog protects the first
request at the shared work deadline, then the final work/report phase. No product
code changed during this observation task. Five sequencing tests plus seven
existing watchdog tests passed; lint/naming passed and Inspector revision 130
verified all 80 cases. Failed pre-fix sequencing evidence remains saved.

## Handoff and observed behavior

| Question | Evidence | Conclusion |
| --- | --- | --- |
| Was the first design direction delivered? | Second native `4-input.json` has `metadata.conversationHistory`; its first intent and message exactly equal the saved prompt and displayed first answer | Confirmed, not inferred from conversation ID |
| Was any included history omitted? | One complete prior pair, `omittedTurns: 0`, 1,376 UTF-8 JSON bytes | No omission in this case |
| Did the model use the direction? | The second generated answer explicitly retains the material palette, viewpoint and upper-left light; it develops continuous facade reflections and restrained metal highlights | Observed semantic continuity; no missing-context claim |
| Did old tool sessions cross requests? | Different ephemeral native thread IDs; history contains only turnId, intent, message and outcome | Historical discussion was delivered without retained tool credentials |
| Were mutations replayed? | Only four successful Knowledge calls; identical before/after documents | No mutation/replay observed; interrupted mutation recovery was not exercised |
| Did the user-visible report capture work? | Matching terminal report text and screenshot were saved through the existing report projection | Final diagnostic report captured; ordinary second answer is saved separately from native work output |

Native work records:

- First: `d7c20068-b11f-436d-8dd2-bc7149462eeb.jsonl`, thread
  `01a173f1-9006-7f51-82bb-f9f1a6ffab45`.
- Second: `7d14a458-109d-4215-b8a0-8894bb00dfef.jsonl`, thread
  `01a173f2-061f-75d0-bbff-ef116bb3b151`.
- Exact second input:
  `7d14a458-109d-4215-b8a0-8894bb00dfef.payloads/4-input.json`.
- Second ordinary work output:
  `7d14a458-109d-4215-b8a0-8894bb00dfef.payloads/10-output.json`.

The final self-report speculates that Knowledge queries could contribute to delay,
but does not provide attribution. The original four tool spans total approximately
18 ms; multi-second intervals around them cannot be classified as retrieval time.
Its statement about zero prior action results concerns the report-phase input:
the ordinary second answer was generated before the harness replaced its final
batch with the diagnostic report. This is not evidence that a drawing owner failed.

## Knowledge and cost

| Measure | First request | Second request |
| --- | --- | --- |
| Discovery | Architectural-illustration context | Same architectural context |
| Selected reads | Materials and projection | Materials method child |
| Effective closure | Architecture, materials, projection | Architecture, materials, materials method |
| Calls | 2 | 2 |
| Input bytes | 171 | 139 |
| Reply bytes | 15,395 | 19,807 |
| Paging / failure / refresh | None | None |
| Reported input tokens | 72,425 | 99,103 |
| Cached input tokens | 56,576 | 76,160 |
| Output tokens | 620 | 1,274 |

All six returned body occurrences exactly match the source-frozen Markdown bodies,
including leading/trailing newlines after their metadata boundary. The second
answer's representative facade segment, continuity checks and distinction between
whole-view and detail checks agree with its received method advice. This is
compatible use, not a controlled causal Knowledge-effect claim.

Architecture and materials bodies repeat across requests: **3,026 bytes**. They
were read in different request-scoped Knowledge sessions; no explicit reuse occurred.
This fix therefore does not close cross-request duplicate delivery. The model did
not read every child, page, or the complete tool catalog. The previous run's second
request read no body, so increased current tool bytes are not evidence of regression
in the context fix or proof that these reads were all necessary.

First-use history overhead remains zero. This run's history envelope is 1,376 bytes;
its metadata field adds 23 bytes and conditional interpretation guidance adds 631
bytes, totaling 2,030 bytes of additional projected content. This excludes outer
protocol escaping and is not a measurement of the underlying model HTTP request.
No additional request was introduced to fetch the predecessor discussion.

## Timeline

Offsets are wall-clock seconds from first Send. Tool owner durations and token
counters have separate measurement boundaries.

| Offset | Activity | Interval |
| --- | --- | --- |
| 0.000-0.825 | First request setup to native work submission | 0.825 s |
| 0.825-7.221 | Model/provider work before discovery | 6.396 s |
| 7.221-7.231 | First discovery | 0.010 s |
| 7.231-11.224 | Between discovery and read | 3.993 s |
| 11.224-11.225 | Materials/projection read | 0.001 s |
| 11.225-29.800 | Work until first ordinary answer completion | 18.575 s |
| 29.800-31.101 | UI settlement, answer capture, follow-up setup | 1.301 s |
| 31.101-37.583 | Second native work before discovery | 6.482 s |
| 37.583-37.588 | Second discovery | 0.005 s |
| 37.588-41.262 | Between discovery and read | 3.674 s |
| 41.262-41.263 | Materials-method read | 0.001 s |
| 41.263-74.498 | Work until second ordinary answer is retained | 33.235 s |
| 74.498-87.994 | Final diagnostic self-report | 13.496 s |
| 87.994-88.198 | Report settlement and capture | 0.204 s |
| First frame | Not applicable: drawing was explicitly excluded | No document change |

First answer reached settled UI at 29.949 seconds. The earlier run took 115.432
seconds and included two diagnostic reports; this one includes only the final
report. The difference is not a controlled speedup attributable to the context fix.

## Evidence completeness and limits

Six execution streams pass the existing Runtime parser. All 22 referenced payload
files exist and match recorded sizes and SHA-256 hashes. Browser cleanup completed;
the three task-owned services and ports were stopped after original evidence was
checked. Two cleanup-launch attempts inherited an incompatible stdin-only Node
flag; the file-based driver then used the unchanged cleanup owner successfully.
Both the unsuccessful attempts and successful process cleanup are recorded.

Full raw native I/O is **not** available at every boundary. In ordinary mode the
first native work-input envelope and final raw work-output envelope are not saved
as separate full payloads. Its turn/start byte count, source snapshot, prompt,
tool I/O, terminal events and actual displayed answer are saved. These cannot be
relabeled as the missing original envelopes. The second full native work input
and output are retained because it uses the evaluation window; they provide the
direct evidence for the repaired handoff. Both native capability snapshots also
contain nine recorded redactions each. Underlying model HTTP requests and complete
outer Code Mode programs remain unavailable through these public records.

The final screenshot was inspected. It shows the retained first ordinary answer,
follow-up prompt and diagnostic final report on an unchanged canvas. The second
ordinary generated answer is preserved as `turn-2-answer.txt`, not claimed to be
the displayed diagnostic report. No second model run was used to fill evidence gaps.
