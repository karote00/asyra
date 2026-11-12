# Pixi resource lifetime upgrade - 2026-11-10

Follow-up: [contract verification and current Pixi proofs](contract-verification-and-current-pixi-2026-11-11.md) closes the affected failures with focused current-version checks. Results below describe the original upgrade run.

Pixi is upgraded from 8.20.1 to 8.22.0. The retired instruction-owner regression
fails on 8.20.1 and passes on 8.21.0 and 8.22.0. All four rendering package suites
pass, including native browser proofs. Asyra Design's expanded validation is
**not entirely green**: AI contract failures reproduce with the old SDK too,
and five unchanged AI test typing errors remain. These are not dismissed as
harmless tests and are not repaired through unrelated rendering changes.

Plan: [approved SDK lifetime implementation](../plans/agent-context-and-report-continuity-plan.md).
Architecture owners: `render-material` and `project-render-hierarchy` in the
Design Functional Inspector. This closes only the SDK lifetime slice, not the
entire AI conversation plan. No commit, push, release or live-model 101 run was
part of this verification.

## Implementation and ownership

The production delta for this slice is the engine dependency and lockfile.
Pixi 8.21.0 introduced the official instruction-set disposal handoff through
<a href="https://github.com/pixijs/pixijs/pull/12030" target="_blank" rel="noopener noreferrer">PR 12030</a>;
the selected stable SDK is
<a href="https://github.com/pixijs/pixijs/releases/tag/v8.22.0" target="_blank" rel="noopener noreferrer">8.22.0</a>.
There is no private-map sweep, monkey patch, periodic cleanup or old-version
compatibility branch.

| Owner                               | Normal reuse                                                 | Final disposal                                                     |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Native RenderGroup / InstructionSet | Pool reset retains reusable instructions                     | SDK notifies batch pipes and removes the retired instruction entry |
| Material batcher                    | Retains its geometry and separate Shader bindings while live | Releases owned geometry and Shader bindings                        |
| Shared GPU programs                 | Surviving owners retain usable immutable programs            | Binding destruction does not destroy a peer's program              |
| SceneTree model and history         | Deleted model identities remain available for undo/redo      | Governed by model/history lifetime, not GPU cache cleanup          |

Deleting rendered content destroys its native render objects; undo restores the
same canonical model identities and creates the needed native objects again.
Ungroup keeps surviving child render handles. Reparent does not destroy live
owners. No immediate JavaScript GC, heap, RSS or GPU-memory reduction is claimed.

## Four-step verification

1. The strengthened permanent native regression observes four retired cache
   entries and four retained Shader owners on 8.20.1. Final disposal on both
   upgraded versions leaves zero entries and releases all four batchers.
2. Eight pool reset/reuse cycles preserve the same owners without destroying
   resources. A material edit, capture and following frame all show the updated
   green value. Final shutdown releases geometry and Shader resources once.
   Immediate shutdown can invoke the SDK's idempotent batcher destructor twice;
   actual resource destruction events still occur exactly once.
3. App deletion/undo/redo preserves canonical tombstone identities through three
   cycles, with exact viewport images. Ungroup preserves child handles and
   images. Focused Core restore/rollback cases also pass; no Core-wide suite ran.
4. Shared-source programs, separate uniforms, multiple contexts, context restore,
   mixed materials, raster/text/filter content, capture, next-frame rendering,
   ordering and history pass. All 64 native phase image hashes agree across
   recorded 8.20.1, 8.21.0 and 8.22.0 runs. App handoff evidence is source-hash
   checked rather than silently loading historical artifacts.

Versioned evidence is under `tmp/conversation-improvements/pixi-lifetime-<version>/`.
The old-version failing log is `pixi-lifetime-red.log`; the final complete native
suite log is `pixi-upgrade-concrete-complete.log`, in the same parent directory.

## Expanded test results

Counts below describe suite executions, not unique tests across overlapping
entry points. All logs are under `tmp/conversation-improvements/`.

| Scope                                                      | Result                               | Evidence log                                                                |
| ---------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| Render complete suite                                      | 279 passed, 24 files                 | `pixi-upgrade-render-full.log`                                              |
| Render Engine complete suite and type contract             | 11 passed, 3 files                   | `pixi-upgrade-render-engine-full.log`                                       |
| Preset complete suite                                      | 420 passed, 46 files                 | `pixi-upgrade-preset-full.log`                                              |
| Pixi engine complete suite, native proofs enabled          | 62 passed, 10 files, no skips        | `pixi-upgrade-concrete-complete.log`                                        |
| App framework boundary                                     | 13 passed                            | `pixi-upgrade-registration-green.log`                                       |
| App AI suite                                               | 796 passed, 7 failed                 | `pixi-upgrade-app-full-registered.log`                                      |
| App local Node suite                                       | 236 passed                           | `pixi-upgrade-app-local-full.log`                                           |
| App local Vitest suite                                     | 669 passed, 29 failed                | `pixi-upgrade-app-local-full.log`                                           |
| App server harness, completed file results combined        | 2,996 passed, 161 failed, 14 skipped | `pixi-upgrade-app-server-full.log`, `pixi-upgrade-app-server-remaining.log` |
| Ordinary App browser suite, full run plus focused rechecks | 509 passed, 5 failed, 16 skipped     | `pixi-upgrade-app-e2e-paired.log`, `pixi-upgrade-browser-final-recheck.log` |
| Focused native hierarchy/material/restore browser cases    | 8 passed                             | `pixi-lifetime-app-final.log`                                               |
| Small-group and recorded large-scene measurements          | 2 passed                             | `pixi-lifetime-performance-8.22.0-settled.log`                              |
| Collaboration                                              | 19 passed, 3 skipped                 | `pixi-upgrade-collaboration.log`                                            |
| Render delta correctness/work contracts                    | 3 passed                             | `pixi-upgrade-render-delta.log`                                             |
| Complete 7076 intercepted action with socket unavailable   | 1 passed                             | `pixi-upgrade-7076.log`                                                     |
| Status notification and continued editing                  | 1 passed                             | `pixi-upgrade-status-toast.log`                                             |

The ordinary browser run originally recorded 506 passes, eight failures and 16
skips. Eight focused rechecks on the corrected environment and final SDK passed
three and reproduced five failures. The merged result is not represented as a
fresh all-green full run. The server harness was resumed at remaining files
after its initial process was interrupted; completed failing assertions were
preserved, not excluded. Existing skip conditions remain unchanged.

Engine, App production, collaboration-server and document-backend builds pass.
The AI server type configuration passes. App/flow-proof type checking reports
five existing AI test errors: an `afterEach` return value, obsolete outcome
`issues`, an unknown value, a batch fixture return type, and missing element
fixture fields. Evidence: `pixi-upgrade-app-typecheck.log` and
`pixi-upgrade-app-flow-types.log`. New native proof types and scoped ESLint pass.

## Failures separated from the SDK upgrade

The same App source was tested with an actual temporary 8.20.1 installation and
a fresh Vite cache. All selected failures reproduce: seven AI, 29 local and 161
server failures. Baseline logs are `pixi-baseline-ai.log`,
`pixi-baseline-local.log` and `pixi-baseline-server.log`. Version 8.22.0 was
restored before final native and browser checks.

The failures include inspection/outcome fields, delivery schema audits,
reference-image delivery, query ownership/composition, optional input contracts
and activity presentation. Baseline reproduction establishes that the SDK
upgrade did not introduce them; it does not establish that every failure is
merely a stale assertion.

The five remaining browser failures also reproduce on 8.20.1: two current
activity/history presentation cases, measurement freshness evidence,
representative guidance, and repeated-detail provider receipt ownership.
Evidence: `pixi-baseline-browser.log` and `pixi-upgrade-browser-final-recheck.log`.
They require a separately bounded AI contract investigation before claiming
the entire App is green.

The existing App test inventory gate exposed 18 maintained suites omitted from
the server command and three deleted suites still named there. The command now
includes maintained suites and removes deleted paths; a permanent guard rejects
stale references. A style-edit browser assertion also assumed execution success
meant the scheduled render frame had already completed. It now polls the actual
canonical/rendered values before asserting them, retaining history and unrelated
element checks. Its failure reproduced on both SDK versions before correction.

## Environment corrections

The worktree App `.env` exists and is nonempty; it was preserved. The root has
no `.env` or root template. Test-specific ports are explicit overrides, not
secret/config rewrites. Missing local configuration should be initialized from
the App `.env.example`; an existing local file must not be overwritten.

The originally running Vite server retained an 8.20.1 prebundle after upgrade.
Its early passing result is not upgrade evidence. Final checks use a fresh cache
and assert the actual native SDK lifecycle hook. A second early browser attempt
hit the original collaboration server's allowed-origin rejection; a matching
test origin/server pair fixed the setup. The original document backend also
used a live-101 directory rather than the formal disk fixture directory; a
test-owned backend fixed the fixture case. Original services and data remain.

A small-group exact screenshot comparison initially included a transient offline
toast. The formal test now waits for the status notification to disappear before
measurement; full pixel equality is retained without masks. A continuity case
passes with source frozen during browser execution. These invalid environment
runs are retained as diagnostics, not SDK regressions or passing evidence.

## Performance boundaries

Same-version 8.22.0 measurements compare ordinary and retained transform groups,
using four alternating blocks and 30 samples per phase. They are not an SDK
speedup A/B experiment. Exact images and work-count assertions pass.

| Scene / metric                                                      | Ordinary | Retained transform groups |
| ------------------------------------------------------------------- | -------: | ------------------------: |
| Recorded scene: four roots, 25,491 descendants, reparent CPU median |  54.3 ms |                   10.3 ms |
| Recorded scene: steady redraw CPU median                            |   0.3 ms |                    0.6 ms |
| Recorded scene: steady redraw GPU median                            | 0.638 ms |                  0.560 ms |
| 1,000 groups of four vectors: steady redraw CPU median              |   1.6 ms |                    3.2 ms |
| Small groups: steady redraw GPU median                              | 0.225 ms |                  0.258 ms |
| Small groups: reparent CPU median                                   |  24.2 ms |                   23.0 ms |

Small-group draw calls remain 1,000 in both policies. Retained groups avoid the
two ordinary reparent buffer uploads, but carry 2,000 matrix updates rather than
two. The residual steady CPU overhead remains visible; the SDK lifetime repair
does not remove it. No group-size threshold or new optimization rule was added.
Measurement JSON and images are in
`apps/asyra-design/test-results/pixi-lifetime-performance-8.22.0-settled/`.

## Closure

The SDK lifetime regression and preservation cases pass without custom cleanup.
Complete rendering package checks and the selected App rendering/collaboration
gates pass. App-wide green status remains blocked by the explicitly recorded AI
contract and test typing failures. No unrelated package-wide, release or live
model tests were run; this report does not infer untested manual scenarios.
