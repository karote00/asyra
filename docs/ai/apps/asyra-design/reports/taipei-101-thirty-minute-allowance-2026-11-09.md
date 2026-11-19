# Taipei 101 - Thirty-minute Allowance - November 9, 2026

The AI completed drawing naturally in 11m10s under a thirty-minute allowance.
All ten outer execution calls succeeded, without input rejections or tool/action
failures. The original native thread then wrote an unlimited detailed report in
6m07s. The report session remains open. This confirms a successful execution
lifecycle, not complete artistic or architectural acceptance.

## Scope and setup

The existing runner rejected durations beyond eighteen minutes. The user's
explicit thirty-minute request was implemented at the benchmark CLI and existing
App evaluation-window parser. Both direct tests first failed on thirty minutes,
then passed after the limit change. The default remains fifteen minutes.
The shared watchdog and other evaluators' budgets were not changed.

The drawing prompt and report questions are unchanged. No drawing tools or
instructions changed for this run. No manual files changed while the AI drew
or reported: all 31 frozen file hashes matched after reporting.

| Item | Value |
| --- | --- |
| Run | `taipei-101-fixed-1794238899355` |
| Source HEAD with working changes | `71ff3fa09786160fe2c0902c04f98e40c3858441` |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Work allowance | 1,800,000 ms |
| Work elapsed | 669,778 ms |
| Work status | completed - native-completion, not deadline or cancellation |
| Report elapsed | 367,118 ms, no timeout |
| Provider request | `a0cdc44f-1b1c-4da0-bf12-9c4c604997dd` |
| Native thread | `01a1c0f9-0688-74c1-a2e4-9f743f8a47cd` |
| Work turn | `01a1c0f9-06e1-7793-bb69-0c860a032a55` |
| Report turn | `01a1c103-37f0-78b2-987a-dd4bbd5364de` |
| Retained session | `2ef78633-981d-4773-a9b2-051e38265bca` - waiting |
| Base URL | `http://127.0.0.1:3052` |
| Viewport | 1920 by 1080 |
| Final document | 22,700 vectors, 267 ovals and nine groups, plus workspace |
| Durable sequence | 739 of 739 |
| Report and reload equality | Document unchanged in both checks |
| Collection errors | None |

Command, from the worktree root:

```sh
APP_URL=http://127.0.0.1:3052 \
DOCUMENT_BACKEND_PORT=4252 \
DOCUMENT_PERSISTENCE_BACKEND_URL=http://127.0.0.1:4252 \
COLLABORATION_WS_PORT=4152 \
VITE_COLLABORATION_WS_URL=ws://127.0.0.1:4152/collaboration \
TAIPEI_101_STRICT_STOP=1 \
node apps/asyra-design/test-data/ai-drawing/taipei-101-live.mjs --minutes=30
```

The selected scope is the maintained live Taipei benchmark, not a full local or
visual suite. Before launch, 19 runner/watchdog tests and 52 evaluation-window/
control tests passed, as did scoped lint and diff checks. No commit or push ran.
Services with tracked PIDs 65203, 65204 and 65207 remain for follow-up.

## Actual execution

| Call | Submitted work | Text bytes returned | Images | Outcome |
| --- | --- | ---: | ---: | --- |
| E1 | Base, then dependent tiers | 2,034 | 0 | Success |
| E2 | Base coordinates and overview | 1,078 | 1 | Success |
| E3 | Locate tier group by region and name | 791 | 0 | Success |
| E4 | Correct position, add crown, capture | 2,207 | 1 | Success |
| E5 | Add ornaments | 1,051 | 0 | Success |
| E6 | Map reflection fills, add base finish, capture | 2,101 | 1 | Success |
| E7 | Add terraces, reorder ornaments, group, capture and read bounds | 2,032 | 1 | Success |
| E8 | Three native-scale detail captures | 1,001 | 3 | Success |
| E9 | Add seals, reorder, add coin/scroll details and two captures | 2,161 | 2 | Success |
| E10 | Delete two unwanted detail sets and capture overview/coin | 700 | 2 | Success |
| Total | Ten outer calls | 15,156 | 11 | No rejected or failed call |

Fifteen contract queries returned 161,457 text bytes. Both byte totals are
response text telemetry, excluding image bytes, tokens and other transport data.
Eight combined preparation/application steps executed through the host. Existing
step bindings connected creation to parent assignment, ordering, grouping,
capture and bounds reads. Thirteen distinct names were requested and acknowledged;
five were subsequently referenced: taipeiRoot, taipeiOrnaments, taipeiCrown,
taipeiBaseFinish and taipeiFinalInspectionTarget. Unused saved drafts remain valid
continuation data and are not scored as failures.

## AI report and independent corrections

The original report describes coordinate alignment, reflection, layer ordering,
seals and ornament refinements. It attributes action-free intervals to reference
research, contract discovery, geometry authoring and visual decisions at a high
level, without claiming measured model/network timing. No interruption or tool
failure is needed to explain the observed execution lifecycle.

The AI identifies several limitations despite choosing to finish: approximate
dimensions and ornaments, geometric rather than fully realistic material effects,
incomplete coin grille edging, and one detail crop missing its intended terrace
corner. It also notes that the connected mall podium was not drawn. These are
self-assessed visual/scope limitations; they do not turn successful calls into
tool failures. The final overview and native-scale screenshot were inspected and
show the full tower and editable facade detail. Screenshots retain App panels
and selection outlines; they do not establish complete architectural accuracy.

Three statements require distinguishing the AI's knowledge from host evidence:

1. The report says fourteen saved names, but its own table and actual requested/
   acknowledged receipts contain thirteen. Five names are actually reused.
2. Its closing wording suggests work ended because it was asked to report.
   The work output in provider payload 844 already contains completed status
   and the AI-authored completed report_outcome. The lifecycle records
   native-completion before the report input in payload 845. No human stop,
   deadline stop or policy stop occurred.
3. The AI could not verify final durability from its visible report context.
   Later runner evidence confirms durable sequence 739 and identical reload.
   This does not certify visual quality.

Position discovery again consumed eight exploratory calls before the chosen
property update contract. The report also notes repeated projection values and
the initial construction/capture split. These are recorded follow-up observations;
no extra implementation or prompts were added during or after the run.

A longer allowance did not force longer work: the AI chose to finish before even
fifteen minutes. This run should not be treated as proof that increasing the
deadline improves quality or consistently changes the model's completion choice.
Different drawing content makes direct per-action time comparisons inappropriate.

## Complete artifacts

All links resolve to retained local evidence; large assets are not claimed to be
committed to Git. The recording uses the existing fit-zoom behavior.

- [Original AI report, unedited](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794238899355/self-report.txt)
- [Run metadata and persistence](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794238899355/run.json)
- [Same-thread report evidence](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794238899355/self-report-evidence.json)
- [Retained session](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794238899355/report-session.json)
- [Final overview](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794238899355/final.png)
- [Native detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794238899355/native-detail.png)
- [Recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794238899355/recording.webm)

The collector exited successfully. The retained session was checked after
collection and remains waiting in the original native thread.
