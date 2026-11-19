# Taipei 101 - untimed same-session report - 2026-11-03

The fixed drawing run and full native self-report completed. Evidence collection
finished without errors; the runner exited with code 0. This verifies the report
and collector lifecycle, not independent architectural fidelity.

## Configuration and outcome

| Field | Evidence |
|---|---|
| Worktree | `.worktrees/ai-conversation-improvements` |
| Branch | `codex/ai-conversation-improvements` |
| HEAD | `a1ed9040315a70be8a6fbf13c79b072536d6ac0d` plus retained uncommitted changes |
| Run | `taipei-101-fixed-1793699786368` |
| Drawing policy | 900,000 ms maximum; original prompt unchanged |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Report policy | `reportTimeoutMs: null`; no report duration cap |
| App submissions | One |
| First paint opportunity | 157,433.8 ms; not a quality-acceptance metric |
| Work settlement | Completed at 855,865.25 ms (14m 15.87s), before the deadline |
| Report duration | 214,443.10 ms (3m 34.44s) |
| App settlement observed | 1,071,167 ms (17m 51.17s) |
| Native thread | `01a1a0d6-c80b-7d81-b6ff-9172e1a6b17a` |
| Drawing turn | `01a1a0d6-c86d-79e2-afbc-421e37d6a892` |
| Report turn | `01a1a0e3-d1fd-72c2-821a-e25efa46ae2e` |
| Public report | 8,476 characters, complete; verbatim TXT and byte-identical Markdown copy |
| Report SHA-256 | `6d2c410069f6fd78a43d4369c888e82681a4a8732833079566b248e7cd4b38fd` |
| Native content | 15,490 vectors, 49 ovals, 7 groups, 1 workspace |
| Report-phase canonical content | Unchanged |
| Persistence | sequence 497 = durableSequence 497, generation 0 |
| Reload canonical content | Unchanged |
| Recording | 103,666,117 bytes |
| Evidence errors / browser errors | None / none |
| Source freeze | All 30 tracked source hashes unchanged during the run |
| Service cleanup | No listeners on 3045, 4145, or 4245 after completion |

The App settlement is `executed` with outcome `partial`, not a failed run. The
host explicitly requires the report-only `report_outcome` to use `unsupported`;
this is not an independent AI verdict about capability or drawing completion;
the native drawing turn completed normally and the report receipt was verified.
Do not equate that report classification with drawing interruption or independent
visual acceptance.

## Changes and focused validation

- Admit explicit null report timeout and leave native completion, cancellation,
  disconnect, and tool-denial handling authoritative.
- Remove the fixed benchmark report cap and aggregate drawing/report deadline.
  Retire the drawing watchdog before report-entry capture.
- Save completed native report text before browser-dependent evidence. Retain
  per-stage failures while continuing independent source, receipt, persistence,
  checkpoint, image, reload, and video collectors.
- Match the settled receipt to the submitted turn. Compare canonical content
  across reporting and reload; retain failures instead of substituting output.
- Update the active plan, execution spec, Inspector contract, and debugging guide.

Test-first failures established the prior rejection of null policy, provider
failure to enter an untimed report, and missing independent collector behavior.
Focused validation passed: 19 provider/admission cases, 41 browser-stream cases,
17 runner/watchdog/recording cases, two Inspector contract cases, App typecheck,
naming, scoped lint (existing console warnings only), local runtime builds, and
whitespace checks. No full local test, release workflow, commit, or push ran.
The deterministic provider case waits ten simulated minutes before finishing;
this live report finished under five minutes, so the live run alone does not
prove beyond-five-minute behavior.

## Original AI report and interpretation boundary

The complete report is retained unchanged. Its tables cover completed work,
limitations, stages, the nonplanar-face rejection, square-to-round crown correction,
missing top surface, evidence rebinding, tool discovery detours, waiting intervals,
Knowledge/non-use, composed-tool/non-use, and prioritized recommendations.

It distinguishes operational explanations from measured latency: preparing large
inputs, reading contracts, visual review, geometric repair, and evidence rebinding
are supported activities, but provider/network timing remains unknown. Its
recommendations are self-assessment, not verified product defects or authorized
implementation changes.

The AI correctly limits persistence claims to what its own session saw. The host
subsequently confirmed durable sequence 497 and equal reload content. Preserve
both contexts; do not rewrite the original report to include later host evidence.

Overview, spire, base, and native-scale screenshots were inspected after the run.
They show the complete tower and editable facade detail. This inspection does not
establish exact real-world geometry or independent acceptance of realism.

## Retained evidence

All artifacts remain under
`tmp/conversation-improvements/live/taipei-101-fixed-1793699786368/`.

- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793699786368/self-report.md" target="_blank" rel="noopener noreferrer">Full original AI report</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793699786368/run.json" target="_blank" rel="noopener noreferrer">Run metadata</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793699786368/final.png" target="_blank" rel="noopener noreferrer">Final overview</a>

Also retained: original TXT, native report identity evidence, settled receipt,
summary, work/source/reload snapshots, checkpoint, first-frame and regional images,
provider records, service logs, and complete recording. No automatic rerun occurred.
