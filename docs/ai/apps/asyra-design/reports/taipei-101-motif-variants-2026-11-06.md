# Taipei 101 - Motif variants and template reuse

## Result and evidence

The replacement run completed the requested fifteen-minute drawing window and
an unlimited report in the original native session. It did not complete visual
acceptance before the deadline. The recorder exited successfully, with zero
runner/evidence errors; all three owned services stopped. The drawing prompt and
tracked source/test checksums stayed unchanged throughout drawing and reporting.

- Run: `taipei-101-fixed-1793892999749`, started November 5 at 23:36:39 Asia/Taipei;
  report and evidence completed after midnight on November 6.
- Native thread: `01a1ac5a-fe61-7fa0-aeac-2f9163a7d8a2`.
- Drawing turn: `01a1ac5a-fec6-7490-a190-d6ca772b5fc6`.
- Report turn: `01a1ac68-b221-7252-ac06-824688d60fb7`.
- Drawing: 899.753 s, interrupted at the deadline.
- Report: 566.152 s; completed, no timeout.
- Prompt SHA-256: `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
- Final document: 14,087 vectors, 110 ovals, five groups, plus the workspace.
- Persistence: sequence 451 and durable sequence 451; reload unchanged.
- Report-only phase: document unchanged.

[Original AI report - complete, unedited](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793892999749/self-report.txt) ·
[Same-session evidence](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793892999749/self-report-evidence.json) ·
[Run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793892999749/run.json) ·
[Recording with process fit-zoom](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793892999749/recording.webm) ·
[Final overview](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793892999749/final.png) ·
[Base detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793892999749/base.png) ·
[Frozen source checksums](../../../../../tmp/motif-live-source.sha256)

The AI report is retained as immutable generated evidence in its original
language. Its statement that persistence was unknown describes the evidence
available to that AI. The recorder subsequently confirmed durable persistence and
reload equality. Its phrase "user stopped" refers to the configured work deadline,
not a new manual user cancellation. Neither correction implies final visual acceptance.

## Implemented behavior

1. Motif references accept patches keyed by motif identity. Supplied name,
   vertices, offset, fill and fills replace corresponding fields; arrays replace
   completely. A fill clears an inherited palette unless fills is also supplied.
   Unknown identities/fields and invalid geometry reject before writes.
2. Construction reuses unchanged validated vertices, offsets and compiled motifs
   within preparation. Budget admission counts authored patches and effective
   expanded geometry. The three recorded facade drafts retain identical output.
3. `read_design_templates` exports public motifTemplates, fillTemplates and
   sharedFills maps from an owned prepared source. `execute_design` can bind those
   values directly or retain them in App conversation context for later turns.
4. Registered typed maps now prove key/value constraints and runtime lifetimes
   during composition. Unknown keys remain unguaranteed paths; untyped narrowing
   and captured request-scoped references remain rejected.
5. Tool templates remain immutable authoring values. Native shared Fill source
   edits, selected-owner overrides, reset, Undo/Redo and reload preserve existing
   Core semantics. Reusing sharedFills values in another preparation creates new
   sources; linking existing document sources requires explicit canonical APIs.

No alternate shared-instance store, automatic geometry propagation, full local
test, release gate, commit or push was performed.

## Focused verification and first-attempt correction

Focused preparation, budget, discovery, workflow and App integration tests pass.
The runtime map/admission/execution gate passes 112 cases. The exact recorded
forwarding request passes both variants: public-value retention succeeds; the
unchanged request performs both writes and truthfully rejects its two artifact
saves as partial delivery. Typechecks, scoped lint, naming, and twelve
Inspector/recorder cases pass. No full repository test was run.

The first live attempt, `taipei-101-fixed-1793891248152`, exposed an omitted
same-invocation case: typed definition maps were treated as opaque even though
named App values already worked. Its immutable inputs 89 and 128 became the
permanent `template-forwarding-20261105.json` fixture. The correction belongs to
the registered-schema owner and the public template output contract, not a prompt
or a tool-name exception.

That first attempt's report was interrupted by the agent editing a test file
while Vite was recording. The Vite log records a page reload at 15:27 UTC and the
provider was cancelled. This was an agent workflow error; the attempt is not a
completed-report baseline. The replacement run froze source/test files until
recording, reporting and cleanup completed.

## Recorded operations

| Completion | Operation | Observed host interval | Outcome |
|---:|---|---:|---|
| 03:31.30 | `prepare_and_apply_design` | 2.632 s | usable |
| 05:43.51 | `prepare_and_apply_design` | 4.682 s | usable |
| 07:29.95 | `prepare_and_apply_design` | 1.063 s | usable |
| 11:02.45 | `prepare_and_apply_design` | 0.036 s | failed |
| 11:17.16 | `prepare_and_apply_design` | 0.735 s | usable |
| 11:44.64 | `execute_design` | 0.214 s | partial |
| 14:49.69 | `execute_design` | 0.267 s | usable |

The four successful preparations added 4,449, 7,601, 1,305 and 847 elements.
Grouping added one group; the last deletion removed one column, leaving 14,202
non-workspace elements. The nonplanar input was rejected before writes and repaired
through two replacements in the retained draft; completed buildings were not replayed.
The grouping partial outcome came from attempting to retain the entire result,
which contained request-scoped references. The grouping itself completed.

The recording fitted the viewport after the first three geometry extents changed
at 211.568, 343.532 and 449.960 seconds. Later detail and deletion did not expand
the extents. The final overview and base crop were inspected; they show the
building and facade detail, but are not a claim of complete architectural fidelity.

## Adoption and remaining limits

| Capability | Observed use | Supported conclusion |
|---|---:|---|
| Draft-local motif definitions | Seven definitions in four drafts | Repetition was delegated to tools |
| Per-reference overrides | Used for light/dark and surface variations | New override contract was adopted and applied |
| `read_design_templates` | Zero executions | Its availability was observed, not its live cross-draft use |
| Named App saves | One attempted name, zero accepted | Whole grouping receipt was unsuitable; no narrower retry |
| Named/step bindings | Zero | No live reduction from cross-call saved definitions can be claimed |
| `execute_design` | Two calls, one operation each | Grouping and exact artifact-key deletion worked; no multistep adoption |
| Automated iteration | Zero | No inference about saved repair round trips |
| Knowledge | Zero | No evidence of Knowledge benefit or failure in this run |
| App discovery | 11 calls | Matches the original AI's count |
| Native declarations | Six searches reported by the AI | Distinct from App capability discovery |
| Review | Six calls, ten images reported | Visual decisions account for actual handoffs |

The AI explicitly says it rewrote similar definitions by stage instead of planning
template storage. It does not claim the tool lacked that capability. This is
separate from the first attempt's real composition rejection, now covered by the
recorded regression.

## Waiting and rework

Across the 24 recorded outer App calls, start-to-completion host intervals total
approximately 10.783 seconds; the longest is 4.682 seconds. These intervals
are not complete provider/network or rendering latency measurements. Large gaps
between calls include research, native tool discovery, request construction,
visual interpretation and unmeasured provider work. They cannot all be labeled
host slowness or private model reasoning.

The AI's report identifies concrete contributors: large draft preparation,
contract pagination, unsuccessful native tool searches, visual review, nonplanar
geometry repair, and evidence rebinding after grouping. It explicitly labels
precise provider/network attribution unknown. The report provides per-sequence
tables rather than claiming an exact internal timing explanation.

Remaining observations are recorded, not automatically turned into changes:

- Repair followed by grouping had no new visual decision between calls. Combining
  them is justified only if the grouping decision was already ready at submission.
- Native search returned read_design_templates when the AI wanted execute_design.
  That is a declaration-discovery observation, not proof that the App's exact-name
  registry is wrong. Inspect that separate delivery path before changing it.
- The nonplanar rejection was valid and recovery worked. A proposed plane-authoring
  helper must be compared with existing geometric APIs before adding another tool.
- Naming a whole grouping receipt was rejected for actual lifetime reasons;
  retaining only the group ID is supported by existing result projection.
- The final delete succeeded, but no subsequent AI visual acceptance occurred.
  Durable storage and unchanged reload do not replace that acceptance.

The implementation and requested test/report are complete. This single sample
supports override adoption; it does not establish stable cross-draft reuse or a
speed improvement. No additional product changes follow automatically from the
AI's recommendations.
