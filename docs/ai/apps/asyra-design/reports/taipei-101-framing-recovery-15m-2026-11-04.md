# Taipei 101 - framing recovery validation - 2026-11-04

The authorized fixed-prompt run completed before its fifteen-minute drawing limit.
The original drawing agent completed its detailed retrospective in the same native
thread, with no report time limit. The runner exited with code 0. No automatic
rerun, source modification, full local test, commit or push was performed.

## Configuration and observed results

| Field | Retained evidence |
|---|---|
| Branch | `codex/ai-conversation-improvements` |
| Source HEAD | `736bd14316756765abc8aa189feb6bf38fb3db4f`; clean worktree at submission |
| Run | `taipei-101-fixed-1793725505653` |
| Drawing limit | 900,000 ms; fixed original prompt unchanged |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| App submissions | 1; fresh conversation, no attachments |
| First paint opportunity | 164721.20 ms (2m 44.72s); not quality acceptance |
| Native drawing | `completed`; 769529.14 ms (12m 49.53s); no deadline interruption |
| Native report | `completed`; 229211.04 ms (3m 49.21s); timeout null |
| Native thread | `01a1a25f-3b4e-7923-bf3c-0df77d181a34` |
| Drawing turn | `01a1a25f-3bb1-7af1-b28f-d681fd92077c` |
| Report turn | `01a1a26a-f272-7d50-80f9-3925bd0d176f` |
| Report text | 8968 characters; TXT and byte-identical Markdown |
| Report SHA-256 | `d69731dd9bf7522323aa4c14af53671e3bc82582e48e89ce105ecccff2172894` |
| Canonical elements | 15,232 vectors, 22 ovals, 4 groups, 1 frame; 1 additional workspace |
| Report-phase document | Unchanged |
| Persistence | sequence 488 = durableSequence 488, generation 0 |
| Reload document | Unchanged |
| Recording | 85,186,562 bytes |
| Browser / evidence errors | None / none |
| Service cleanup | No remaining listeners on 3045, 4145 or 4245 |

The App settlement is executed/partial because the report-only host policy
requires unsupported. That is not drawing interruption or an independent judgment
that the App cannot draw. Native drawing completed normally, and the report's
thread identity, distinct turn and settled receipt were verified.

## Original agent report

The unchanged original report contains nine sections and detailed tables covering
completion limits, five drawing batches, local corrections, discovery detours,
review evidence, waiting intervals, Knowledge/non-use, reusable tools/non-use and
prioritized suggestions. Its waiting explanations identify observable activities:
large structured-input preparation, contract exploration, reference research,
visual review and evidence rebinding. It explicitly cannot measure how much time
belongs to model preparation, provider scheduling, network or App execution.

Its self-assessment is not a verified defect list or authorization to implement
its recommendations. In particular, statements about perspective interpretation,
missing capabilities or acceptance requirements require separate source review.
The agent had not seen durable persistence when reporting; the host subsequently
confirmed durable sequence 488 and identical reloaded content. Preserve both
contexts rather than rewriting the original report.

## Framing evidence

The runner recorded one automatic fit at 166,682 ms. The initial container already
reserved the full tower extent, so later construction remained within that view.
No pause/resume transition occurred; this run therefore does not independently
exercise navigation recovery (covered by the focused browser regression).
Process-video frames at 180, 300, 600 and 750 seconds are retained, together with
first paint, final overview, spire, tiers, base, native-detail and reload captures.
The recording shows intermediate construction, not only the final overview.
This verifies recording visibility, not independent architectural fidelity.

## Evidence

Artifacts are retained under `tmp/conversation-improvements/live/taipei-101-fixed-1793725505653/`.

- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793725505653/self-report.md" target="_blank" rel="noopener noreferrer">Complete original AI report</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793725505653/run.json" target="_blank" rel="noopener noreferrer">Run metadata</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793725505653/recording.webm" target="_blank" rel="noopener noreferrer">Complete recording</a>
- <a href="../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793725505653/final.png" target="_blank" rel="noopener noreferrer">Final overview</a>

Also retained: native report identity evidence, settled receipt, summary,
work/source/reload snapshots, checkpoint, provider records and service logs.
