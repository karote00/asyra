# Reusable Tool Composition - Current Handoff

## Latest complete Stage 4 review - 2026-10-17

Stage 4 is locally complete after the full fixed-category review and current-source
integration verification. The only new production edit in this review is the
missing host-only classification of Core.isInUndoRedo in basic-api-dispositions.ts;
the existing exhaustive public API test detected it before repair. History and
Session execution rules are unchanged. No open concrete finding remains in the
bounded Stage 4/predecessor handoff scope. Historical trace-less navigation/Undo
uncertainties remain explicit and are not claimed fixed by later passing runs.

Fresh gates: Runtime 379, Design server 1246, AI consumer 586 and real Chrome
integration 38 passed. Two server and five browser conditional skips are itemized
in the plan; none invokes a model. Design types, naming and scoped lint pass.
The preceding 35 history/collaboration browser cases remain applicable because
this review changed none of those runtime owners. Source-bound Design 37 and
Runtime 11 obligations, eight/seven exact negatives and recovery passed. Design
target assessment 60c734a8-8825-42e1-aca8-4f874517464b is current/eligible with
same-source accepted preservation; no accepted baseline was silently replaced.
Evidence: tmp/stage4-complete-review/. Owned test ports 3300/3401/4411 are closed.
Keep all local Stage 4 changes; no commit/push, live 101 or monitoring. Stop for
the user report, not for another automatically inferred implementation stage.

## Current authority

Latest scoped authority: **Stage 4 immediate history dispatch correction -
2026-10-16** in the plan. The earlier admission-only completion is superseded:
accepted idle history inputs still entered SessionManager's interaction queue.
The user requires no queue admission at all, busy inputs ignored, idle execution
immediate, existing Factory control retained, and active-operation settlement
proved with transactions, collaboration and save/reload. The user confirmed the original rule: an active drag finalizes its current session,
then Undo reverses that drag. There is no pending clarification. The correction
uses the existing Feature interaction owner and SessionManager finalizer;
Factory, drag finalization and persistence are not reimplemented. Immediate input
bypasses the ordinary queue; the execution owner enforces current-handler
settlement and ignores overlap without retaining commands. Idle execution begins
synchronously. Implementation and applicable integration verification are complete; prior
admission-only evidence is superseded by the closure below. No live AI/101, push or monitoring.
Preserve all existing local Stage 4 changes.

## Policy contract owner follow-up - 2026-10-17

The user superseded the former Feature System/Core export allocation. Utils now
owns SessionCancelPolicies and both derived types. Feature System imports them
for execution; Apps import the pure contract directly from Utils. Neither Core
nor Feature System re-exports them, and no compatibility alias remains. The type
regression and local/CI typecheck now live in Utils. History semantics are unchanged.
Utils 101, Feature 67, direct App 45 and Core export boundary 11 tests pass, as do
package builds, all Design typecheck projects, naming and scoped lint (three
existing console warnings). Public docs/Skill packaging: 35 pass, one inapplicable
installer opt-in case skipped. Skill 0.1.13 candidate and generated references
use Utils; installed caches are untouched. Evidence: tmp/session-policy-utils-*.log.
Prior Inspector/history evidence remains evidence for its recorded source, not
an assessment of this representation refactor. No 101, push or monitoring.

Latest owner review additionally corrected seven missed rollback literals across
Runtime Atlas, Sim's lifecycle fixture and Feature tests, and cleaned stale
Feature dist artifacts with the existing clean/build commands. Built runtime and
TypeScript export graphs confirm Utils-only value/type ownership. Fresh gates:
Utils 101, Feature 67, Core 270, Factory 300, Design Features 45, Runtime Atlas 15,
Sim lifecycle 20; Design types, boundary 13, naming 15 and scoped lint pass.
Docs/Skill checks remain current (35 pass, one installer-only opt-in skip).
Release-pinned CLI template output is intentionally unchanged under the release
workflow, not a runtime compatibility alias. No browser/live model rerun.
Evidence: tmp/session-policy-review-*.log. No new runtime behavior, commit, push,
or monitoring. Preserve previous browser evidence and unresolved historical
issues without upgrading them to a current-source proof.

## Utils policy browser follow-up - 2026-10-17

User-requested real Chrome integration now passes on the current local source:
12 history/group/durable-reload cases, four busy-history success/failure cases,
and all 19 collaboration cases. Total 35 passed, zero retries or skips. Current
source covers active drag interruption, Undo/Redo, subsequent edit/save/reload,
peer convergence, reconnect, compensation and persistence-failure recovery.
No production or test edit was needed. Logs and inspected screenshots are under
tmp/session-policy-browser/. Playwright-owned 3300/3401/4411 were verified in
this worktree and are closed. No live model/101, push or resumed monitoring.
Earlier intermittent failures remain historical unknowns; this pass does not
supply their missing cause. Keep all existing local Stage 4 changes.

## Immediate history closure - 2026-10-17

- Actual input dispatch starts idle Undo/Redo synchronously, without ordinary queue
  admission. Existing session commit-current closes an active drag before Factory
  replays it. Overlap is ignored, never retained. Factory and drag finalization
  production were not rewritten; no App busy flag or second history controller.
- Session/finalizer failure prevents replay; disposal rejects stale generations;
  a retired input binding cannot dispatch into a replacement registration.
- Final gates: Feature 66, Factory 300, Core 269, App history/input/drag 28;
  real history browser 15 and collaboration 19 pass. Feature build, all App
  TypeScript projects, naming 15 and catalog 8 pass. Lint: zero errors, four
  pre-existing console warnings. No model calls. Evidence: tmp/history-immediate/.
- Inspector: recovery 1c6803c9-ea6b-4bcd-a2ac-29ae53936b97, source
  111a59e62e0b9e9973c379b1ce6fcd7247948fcddcc0179628de503313ea1671;
  four exact negatives plus recovery. Target 8bd253b8-fbcf-4bff-808c-1ed345edf05e,
  assessment 5ce717f9-b092-4299-be89-23252ccfa83b current/eligible; all 807 captured
  files match. No accepted baseline was silently replaced.
- Invalid mixed-worktree browser attempt was preserved separately: port 4401
  belonged to another worktree and rejected this branch's publication contract.
  Final browser gates used this worktree's isolated 4411 backend. Owned ports
  3300/3401/4411 are closed; unrelated 4401 was preserved.
- Preserve earlier trace-less Undo/navigation uncertainties as historical unknowns.
  They were not diagnosed merely by successful reruns. Do not resume old delivery,
  live 101 or monitoring instructions. No commit or push was made in this correction.

## Historical Stage 4 background

Stage 4 - Status, durable library and cross-stage integration - has completed a
follow-up local review on 2026-10-16. Its changes remain uncommitted/unpushed.
The user retains one unreproduced Stage 3 browser navigation interruption as a
known unresolved, non-blocking item. This supersedes earlier instructions to block this stage on that event.
Stage 3 delivery is complete. Stage 4 is locally complete after Inspector admission,
implementation, full affected suites and the fixed seven-category review. Stop for
the user report; no further implementation is authorized by older cards. No live AI/101,
push, PR, merge, monitoring or subagents. Preserve .env.

- Worktree: /Users/asa/Desktop/workspace/asra/.worktrees/ai-reusable-tool-design.
- Branch: codex/ai-reusable-tool-design.
- Pushed HEAD (Stages 1/2/3): b1c8f9ac8bbc4cc7380aee677b27629136de1514.
- Integrated main: eac2b0d8e719ee9055c846a24a033020c4b1c3cd.
- Current plan: reusable-tool-composition-plan.md, section
  **4. Preserve purpose, save eligibility and cross-request reuse** (locally complete).
- Older **Stage 3 - Direct structural delivery** is historical, not current work.

## Current implementation and contracts

Actual provider guidance, native operation descriptions and Runtime specification
agree on known/direct work, exact discovery, eligible reuse and new canonical
recipes. Primary AI owns creative decisions and explicit repair policy. Runtime
alone performs admitted finite iteration; mechanical tools call no extra model.

Native review_design.mechanicalSelection supplies fresh requestId and check revisions
to verify_design_checks and explicitly prescribed repair_design_checks. Returned
requestId/checks become next state; independent passes and owner-retired obligations
remain. Changed basis requires fresh attachment evidence and renewed policy.
Unknown mutation scope stops writes; a later geometry pass cannot clear it.
Mechanical pass, primary visual acceptance, document persistence and saved library
eligibility remain separate. Save-only retry never replays drawing; fresh requests
cannot reuse old transient selections or handles. No compatibility path was added.

## Historical Stage 3 evidence

Pushed-head candidate: f871cd9c-cabf-429f-85da-ff2a5594bf7e, all 35 obligations.
Assessment: 43ed6b39-9c46-4233-98ed-90baf8d7ec3c, current/eligible.
Production build, actual-head changeset and task-context checks pass. Rebase changed
only upstream Inspector documentation; implementation evidence remains same-source.
All 807 captured files exactly match current source. Details and seven-category
review are in the plan's **Final Stage 3 review - 2026-10-16**.

Server integration: 486 passed / three original opt-in skips. Browser full suite:
12 passed / two original opt-in skips, including real native selection/Runtime
repair, independent evidence, peer edits, Undo/Redo, interruption and save/reload.
Types/lint/naming/catalog pass; lint has four existing no-console warnings.
No new production finding was identified in the final review. Scripted provider
proofs establish wiring, not actual model preference or faster drawing.

## Known unresolved navigation event

Original tmp/stage3/browser-integration.log has one destroyed page.evaluate context.
No failing trace was retained: ordinary retries are zero but tracing had been
on-first-retry. The formal ai-inspection-evidence suite now retains first-failure
traces; its handoff test and lint pass. Later warm/cold/frozen and five repeated
runs pass, but this does not establish or fix the original trigger.

App reload owners are explicit reset/recovery controls, not automatic recipe/check
settlement; the failed test calls neither. Vite can reload after HMR or websocket
reconnect, but the original log has no correlating evidence. Do not report either
as the proven cause. Retain the event without blocking Stage 3 or repeating broad
suites solely to obtain more passes. Investigate new failing trace evidence if it
appears. Test-owned ports 3300/3401/4401 are closed.

## Reviewed Stage 4 plan

The active plan section now defines four bounded slices:

1. Real provider/Runtime lifecycle through transport, conversation and panel; exact
   purpose, phase, concurrency, cancellation, old-event and root-cohort ownership.
2. Completed product execution versus candidate/eligible tool persistence; genuine
   save-only recovery, nested dependency receipts, capacity and request disposal.
3. Actual SQLite close/reopen, current dependency admission and fresh-input reuse;
   exact-version management races and explicit unavailable/corrupt outcomes.
4. One real host/SQLite/browser/document flow preserving Stage 1 checks and primary
   judgment, Stage 2 local pass accumulation/repair and Stage 3 delegation, including
   Undo/Redo, peer edits, acknowledged failure, save and fresh document reload.

Existing mechanisms stay authoritative. The plan identifies missing combined proof,
not an assumption that every existing mechanism is broken. Request-local unsaved
receipts do not survive disposal: report candidate/unavailable honestly, never replay
product work or infer success from logs. Eligible reuse does not certify appearance
or document durability. Nested save-only recovery retains actual child proof privately behind the existing
root save receipt; no extra public receipt catalog.

## Stage 4 local completion

Actual nested starts/ends now reach the panel through production transport. Automatic
saving uses an observed Runtime invocation and retains the live parent purpose.
Nested successful composition receipts stay in private proof; child-before-parent
saving and exact root save-only retry never execute the product graph again.
Current durable availability is checked for every composed dependency before a
new graph. The real SQLite/browser flow preserves independent checks, peer edits,
Undo/Redo and independent document acknowledgement/reload.

Historical authority was the plan's **Stage 4 complete follow-up review - 2026-10-16**,
with evidence under tmp/stage4-followup-review/. The prior authority review below
remains evidence for its unchanged owners; its Design candidate is superseded.

The recurring persistence defect was an early snapshot treated as durable authority
after async preparation, plus separate save/load/resume publication paths and
per-instance queues that do not serialize independent SQLite writers. Final exact
identity/version/bytes confirmation is shared by no-write acknowledgement and
restore. A malformed-identity regression exposed the last missing key comparison;
it is fixed. Writes keep their atomic CAS acknowledgement. An acknowledgement
never promises immunity to later retirement; new invocation rechecks availability.

Real model-turn tests were removed from server/E2E/scripts, their commands and
active guidance. Formal suites use deterministic transcripts and actual tools,
SQLite and browser owners. The two remaining environment-specific server checks
both passed separately: native registration without inference and saved-checkpoint
encoding/decoding. No extra model or live 101 ran.

Prior authority-review verification: Runtime 379, server 1243 plus those two cases, AI/activity 586,
five browser suites 51, collaboration 19; five browser workload/retained-fixture
conditional skips remain explicitly unexecuted. Naming 15, boundary 14 and catalog
8 pass; Runtime build and production TypeScript pass. Lint has four existing console
warnings and zero errors. Seven Runtime/four Design exact negatives plus restored
baselines pass. Do not sum overlapping focused reruns.

Runtime candidate 4b1593a2-d243-43e4-8a9b-f356a2b393ce / assessment
b8ed6ad3-01a8-46e3-9ac7-00279358fff7 and Design candidate
7eaa2659-c20c-472b-97a2-1b96dc4c7ba5 / assessment
02ceed5c-9f27-4ceb-978f-d90dc14272a7 were current/eligible for that source. The Design proof is superseded below;
do not claim its 807 captured files still match the changed App history source. No accepted baseline was silently replaced.

The original third-Undo failure remains unproven: its final input/transaction trace
was not recorded. Preserve tmp/stage4-review/undo-first-failure. The formal Frame
case now records actual shortcut/history lifecycle and publications, deliberately
holds real progressive replay, then verifies exact document, committed history
depth, durable save and reload. A replay event can precede outer Feature transaction
commit. This proves the old fixed-wait oracle insufficient, not the historical
trigger. The final capture-only follow-up passes and writes frame-history-lifecycle.json;
capture failure cannot mask the original error. Do not claim that rerun success
root-causes the earlier event or the distinct Stage 3 navigation interruption.

All changes remain local/uncommitted/unpushed. Test-owned ports 3352/3452/4452
are closed. No live model/101, push, monitoring or remote operation. Preserve .env.
Stop for the user report; do not resume delivery or later stages from old cards.


## Prior follow-up evidence (superseded history acceptance)

The user clarified that history input during replay must be ignored, not queued.
The preceding queued-Redo test encoded the wrong acceptance policy and is superseded
by the plan's Stage 4 history admission correction. Factory remains the only replay
busy authority; Core reads its state and App input rejects busy history commands
before InputSystem dispatch/Feature queueing. No busy mirror, timer or second lock.
Accepted idle commands retain historyDirection; malformed intent is a no-op.
Factory, replay and document persistence are unchanged. The older third-Undo
artifact still lacks its input trace; do not claim its unique trigger established.

Two real SQLite connections now prove post-commit retirement with returned/lost
acknowledgement, storage-only retry without product replay, observed settlement,
disposal and fresh-request unavailability. No further save-production change was
needed. Current review results: 106 persistence/host cases; 112 history/dialogue/
presentation cases; three Frame/queued-history browser cases; existing history and
inspection suites 22 pass/two original conditional skips; collaboration 19 pass.
App/server/mixed-proof types pass; catalog eight pass; scoped lint zero errors and
one existing console warning. Prior broader suites were not repeated unchanged.

Design candidate 9192cbf7-ffb0-43db-9453-82ec54e18a04, source
0f7883e23ffe7d8cb5c6696ba32c257c5890d7ac60d30a2603e9a3d41cab1821,
target 0e5fd935-c067-4aa1-b4b9-ffe65eae8b9b and assessment
75cc0094-2991-490f-a383-f3e79b18e700 are current/eligible with 37 obligations.
The exact late-modifier negative fails apply.history-intent; recovery passes.
Mixed App/server verification has its own tsconfig.flow-proof.json, invoked by
normal typecheck; production server types do not acquire DOM.

Evidence is in tmp/stage4-followup-review/. Actual browser red proof is
queued-history-first-failure/trace.zip. Final collaboration passed, test-owned
3352/3452/4452 listeners are closed. All edits remain local. Do not run inference,
101, push, monitoring or later stages. Report the scoped completion and the
historical Undo/navigation uncertainty without claiming an established cause.


## Historical input-admission closure - superseded by immediate dispatch

The user-required rejection policy is implemented using existing Factory flags:
App input -> read-only Core query -> existing Factory inUndo/inRedo; explicit
false prevents InputSystem dispatch into the Feature queue. Accepted idle inputs
retain their original direction. Factory/history/persistence production is unchanged.

Evidence under tmp/history-admission/: Core 269; InputSystem 36; App 13;
FieldScope 1; four real browser busy/success/failure cases; full history regression
18 (includes those four); full collaboration 19. Types/builds/lint/naming and eight
catalog tests pass. Inspector recovery a8830b4c-66fb-4b96-a44a-74d3d8148d6b passes
37 obligations; both policy and dispatch exact negatives fail only history-intent.
Assessment b118a121-7e31-40c0-892c-96533a03ccc4 is current/eligible; all 802 runtime
files match source 90a48bcffdf57d0703a96e97b5d93fadfa16e71305cab70e3de11cca113eab9d.

The first collaboration run failed final Redo once. A controlled hold did not
reproduce the same failure; three diagnostic repeats and the final full suite pass.
Do not call this root-caused. The existing 16-item case now persists keydown,
admitted direction, actual API entry/return/error and Factory state for future
failures. No timeout increase or input retry. Original third-Undo and Stage 3
navigation uncertainty also remains; passing tests do not explain those events.

All work remains local; no model call/101, push or monitoring. Report this bounded
completion with the unresolved evidence limitation, then stop.
