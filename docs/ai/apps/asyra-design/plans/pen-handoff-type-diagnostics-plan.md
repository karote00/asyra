# Plan: Pen Handoff Type Diagnostics

## Bounded task

Status: Implemented and verified within the bounded scope. Resolve only the 152 diagnostics reported by the five-fix
review probe and their direct declaration/observation dependencies. Preserve all
inherited work in `.worktrees/ai-conversation-improvements` on
`codex/ai-conversation-improvements` (HEAD `bd5fcee28cdb9ad58659071b3899016d85505796`).
No 101, full local suite, dependency/runtime upgrade, production behavior redesign,
compatibility path, assertion cast, relaxed validation or unrelated cleanup.

The baseline probe reports 142 diagnostics in `e2e/pen-tool.spec.ts` and ten
missing Window declarations in collaboration lifecycle, Core composition and
performance profiling. Its manually selected roots omitted `src/types.d.ts`.
That declaration also imports Core through a path outside `src`; verify its
actual type rather than assuming including a declaration is sufficient.

## Current authorities and preserved behavior

Pen feature/API contracts and the Vector Inspector's `project-vector-interaction`
and `settle-vector-action` own canonical topology, workspace editing, current
selection, frame-aligned display projection and one intended history action.
Tests must continue proving handle geometry, selection, source continuation,
split/merge/close, cancellation, undo/redo, persistence and rendered-node identity.
Do not replace raw topology coordinates with a local-coordinate conversion or
replace rendered-node traversal with a canonical element count.

The App testing contract owns runtime observation and E2E selectors. Core's
public history depth and transaction-status APIs replace private journal reads;
typed App system/viewport accessors replace untyped optional calls. Canonical
computed observations must retain their real source coordinates and reject
missing/invalid data, using the existing Vector topology contract.

## Ordered work

1. Establish a permanent focused TypeScript entry with the same nine review
   roots plus the App's global declaration. Prove the baseline fails. Add a
   type-level regression that rejects an unbounded Window Core declaration;
   repair the declaration owner if the source confirms the wrong import.
   Do not change collaboration or profiling code for a missing compiler root.
2. Repair Pen observations through existing typed public App/Core APIs. Any
   needed browser observation helper remains test-only, reads actual canonical
   owners, and does not fabricate data, implement mutations or introduce a
   second validation model. First prove focused negative observations fail or
   expose a missing contract. Replace private history stack access with real
   transaction status and public history depth while retaining the bounded
   history-change assertion. Remove guessed topology/render-node casts and
   preserve actual render-tree traversal. Compile the entire original roots.
3. Run the affected Pen browser scenarios and the existing Vector property
   Undo/Redo case, plus focused observation/type regressions. Review every
   changed assertion against its prior purpose and current specification;
   no reduced thresholds, no skipped cases and no silent success on missing
   required state. Verify new observation helpers cannot accept malformed data.
   Keep the focused type gate reachable from ordinary App verification.

Before each slice, reread the applicable Vector flow. No product flow semantics
change is planned. Source testing adapters and their tests are the only additional
implementation boundary; changing product semantics requires a bounded replan.
Naming reuses Core, Selection, topology and transaction-status contracts; all new
names are test-owned and change no persisted identities.

## Evidence

Step 1 red evidence: focused compiler reported 142 Pen errors after including
existing globals. The separate owned-declaration check (without skipLibCheck)
failed on the invalid `../contexts` import. The type-level unbounded check alone
did not detect that unresolved declaration, so it is not used as sole evidence.
Repair the import and use the actual instance type; no lifecycle/profiling
implementation change is needed. All nine original roots remain in the strict
focused config, together with the declaration and its type-level fixture.

Step 1 completed: `src/types.d.ts` now imports the actual Core instance from
`./contexts` and declares `Window.__Core__` with its instance type. The independent
declaration regression checks that owned file with declaration checking enabled;
the focused strict compiler checks all original roots without diagnostic filters.
No collaboration lifecycle or performance implementation needed modification.

Step 2 completed: Pen observations use typed system/viewport APIs and canonical
computed data. The test-only observation adapter preserves stored coordinates,
rejects missing targets and malformed topology/bounds through existing owners,
and never manufactures empty topology. Its eight permanent tests cover valid
data, missing/invalid observations, committed history counts and disposal.
The history assertion now consumes public transaction status and history depth:
it retains `0 < changeCount < 30`, requires one new Undo entry and additionally
requires exactly one committed undoable transaction. Render identity still counts
actual render-tree nodes before and after persisted-document reload. No topology,
render-node or unchecked `any` casts remain in the repaired Pen observations.

Step 3 self-review: all 26 existing Pen scenarios remain, with no removed or
weakened behavioral assertions, skipped scenarios or changed timeouts. The
additional existing property-panel case verifies canonical geometry and one-step
Undo/Redo. Removed redundant empty-map/children fallbacks after switching to
required typed owners. Ordinary App verification includes the observation tests,
owned-declaration regression and focused compiler entry.

| Focused check                                            | Result                                       | Evidence                          |
| -------------------------------------------------------- | -------------------------------------------- | --------------------------------- |
| Original nine roots, globals and observation regressions | Zero diagnostics                             | `tmp/pen-types-final.log`         |
| Owned declaration and ordinary test entrypoints          | 9 passed                                     | `tmp/pen-types-formal-final.log`  |
| Observation adapter positive/negative cases              | 8 passed                                     | `tmp/pen-observation-final.log`   |
| Changed-file ESLint                                      | Zero errors or warnings                      | `tmp/pen-types-lint-final.log`    |
| Naming gate                                              | 15 passed                                    | `tmp/pen-types-naming-final.log`  |
| Pen and property browser behavior                        | 27 passed on the final source (43.7 seconds) | `tmp/pen-types-browser-final.log` |

The original baseline reused running services and passed 25 Pen cases but failed
the persisted-document digest before reload. An attempted alternate App port was
also already occupied. These runs are not accepted as final evidence. Fresh,
task-owned App/collaboration/document-backend services passed all 27 focused
cases without changing environment files, persistence expectations or product
code. The exact service mismatch in the inherited environment was not established;
this task does not claim to have repaired that environment.

## Closure boundary

The 152 diagnostics are not 152 proven product bugs: 142 were observation typing
and private-access mismatches; ten originated from the incomplete compiler roots,
with an additional invalid declaration import exposed by the permanent regression.
This task proves the fixed strict scope and the selected behavior scenarios only.
It does not claim a full App/repository typecheck, full local test or AI/101 result.
No dependencies, runtime versions, compatibility routes, validation thresholds or
production Pen behavior changed in this task.
