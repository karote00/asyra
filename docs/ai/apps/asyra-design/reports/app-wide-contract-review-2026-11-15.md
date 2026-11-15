# App-wide contract review - November 15, 2026

## Review contract

Status: Review findings recorded; not an App-wide acceptance. This is the user's explicitly requested App-wide review,
following the fourteen-finding cleanup, five handoff fixes and Pen type-diagnostic
plan. It is not limited to those findings. This report records evidence; it does
not change product requirements or authorize implementation.

Source: `.worktrees/ai-conversation-improvements`, branch
`codex/ai-conversation-improvements`, HEAD
`bd5fcee28cdb9ad58659071b3899016d85505796` plus inherited working changes.
The review starts with 380 Git status entries. The commit alone is not the source.

Review roots: all maintained Asyra Design App source, server, configuration,
scripts, knowledge, formal tests and current App rules/specifications/modules/
feature/BDD contracts. Read direct Framework owners where an App handoff requires
them; do not turn this into a Framework implementation audit. Historical reports,
completed plans, recordings and generated assets are evidence, not current rules.

Methods: inventory all owner directories and current specification families;
trace their public inputs, state ownership, mutations, outputs, failures,
lifetime/disposal and consumers; inspect current test selection and assertions;
use bounded static checks and existing focused formal tests to resolve candidates.
Do not infer semantic coverage from a passing count or matching schemas alone.
Record confirmed defects, verification gaps and unresolved hypotheses separately.

Mutation scope: this report and direct review references only. No product/test
source fixes, compatibility paths, dependency upgrades, full local suite, live
model/101 tests, commits or pushes. Test-generated evidence remains under the
project. Preserve local configuration and inherited changes.

The owner review covers startup and configuration; shell/UI/providers; input,
tools and selection; geometry, hierarchy and properties; history/cancellation;
render and capture; persistence/collaboration/recovery; AI conversation/provider
handoffs; discovery/Knowledge/result reuse; test and verification infrastructure;
and current documentation/export boundaries. None is excluded because it did not
participate in the last fix.

## Findings carried from the preceding review

### R1 - Removed App test remains in ordinary selection

Confirmed verification defect. `package.json` still selects
`src/init/__tests__/init-selection-compatibility.test.ts`, which no longer exists.
`__tests__/test-entrypoints.test.mjs` checks only its named files; the stale-file
check in `framework-runtime-boundary.test.mjs` only considers server tests.
Invoking Vitest with that missing selector and the real Pen observation test
returns success with eight passing tests. Missing selection is not rejected.
Evidence: `tmp/app-review-152-missing-selector.log` and source existence check.

### R2 - Observation regression compares a mutable result to its own source

Confirmed verification gap in
`src/testing/__tests__/pen-observation.test.ts:52`. The expected `original` object
is also returned by the mocked canonical reader. Its assertions still pass if
point coordinates are mutated in place from `(80, 90)` to `(0, 0)`: both expected
and observed points then hold the same changed values. A read-only assertion
probe demonstrated this. The current helper does not perform that mutation;
this finding concerns its ability to detect future coordinate corruption.
Preserve an independent pre-call expected value when repairing this regression.

### R3 - Browser case does not establish its claimed pre-frame ordering

Confirmed verification gap in `e2e/pen-tool.spec.ts:41`. Successive real clicks
and polling prove eventual continuation and point order, but do not hold display
projection stale or assert that the next action precedes frame completion. The
unit regression supplies stale display state to the continuation owner; it does
not replace real input-to-selection-to-next-action evidence. No current product
race was established by this finding.

### R4 - Supporting property browser observation is outside the type gate

Confirmed verification gap. `tsconfig.pen-handoff.json` omits the
`e2e/properties.spec.ts` case used as Pen/property Undo/Redo evidence. Adding that
file to the same compiler program in memory produces 33 diagnostics, including
18 in `getSelectedVectorPointProjection`, which still uses untyped state reads
and private `core.deps` observations. The original nine-root scope has zero
diagnostics; that is not evidence that its supporting browser test is typed.
This finding does not establish 33 product runtime failures.

## Prior focused evidence and limits

The preceding review preserved original Pen geometry/history assertions and
confirmed that public committed undoable counts use the canonical History owner.
It passed 27 Pen/property browser cases, two real two-actor Pen publication and
durable-reload cases, and focused startup, property, interaction, Knowledge,
delivery, declaration and boundary checks. The collaboration reload case compares
full canonical state, not only element identity or render-node count.

These results do not close R1-R4 and do not establish App-wide correctness.
The current review's additional findings and owner-specific evidence follow.

## Additional findings

Paths below are relative to `apps/asyra-design` unless they start with `docs/` or
`packages/`. Findings include existing defects; their presence does not establish
that the last type-diagnostic change introduced them.

### R5 - Current documentation still assigns removed ownership

Confirmed current-document contradictions:

- `docs/ai/apps/asyra-design/modules/source-coverage.md:44` still lists the removed
  `src/states/app.ts` as an orchestration owner.
- `docs/ai/apps/asyra-design/features/delete-vector-point.md:30` still requires
  clearing compatibility selected/hovered point state. The current feature and
  `systemContextApis.clearVectorPointState` use canonical selection channels.
- `docs/ai/apps/asyra-design/features/delete-element.md:28` requires a hover
  feature `reEvaluate` API that the current feature does not expose. R8 traces
  the resulting behavior difference, rather than merely requesting a doc edit.

These are active module/feature documents, not historical reports. Reconcile the
current owner before correcting their descriptions; do not restore deleted state
or an obsolete entry point to make a source-reference check pass. An inventory of
exact backtick source-file references in current rules/specs/modules/features
found the removed state file. This scan is not semantic proof that every other
sentence is current.

### R6 - New type proof conflicts with the formal debug-global boundary

Confirmed formal gate failure. `src/testing/__tests__/pen-handoff.typecheck.ts:6-7`
mentions `Window['__Core__']` and defines a value using `window.__Core__`.
`__tests__/debug-global-boundary.test.mjs:58-80` rejects both references.
The authority is `API_SURFACES.md:273-277`: human DevTools handles are not the
automation access path. Ordinary App tests encounter this failure before their
later type-check stage.

The fixture is compiled as a type proof, not executed by this compiler command;
this is not evidence of a production browser read. The guard also matches a
type-only reference lexically, so its failure must not be described as two runtime
violations. Nevertheless, the new proof and existing mandatory gate are not
integrated. Preserve proof of the declaration's actual type through an allowed
static boundary; do not broadly exempt tests or permit automation to use human
handles. Evidence: `tmp/app-wide-review-configuration.log`.

### R7 - App source type-check still has three unresolved diagnostics

Confirmed existing type-check failure, separate from the original 152 diagnostics.
`src/ai/__tests__/design-actions.test.ts:647,650,651` reads identity receipt fields
on an `unknown` result after a matcher that does not narrow its TypeScript type.
The test's purpose remains valid: verify complete acknowledged IDs before model
delivery selection. Preserve those assertions and establish the actual receipt
shape, rather than casting, deleting assertions or widening the public contract.
Evidence: `tmp/app-wide-review-src-types.log`, three TS18046 diagnostics.

### R8 - Delete bypasses canonical hover eligibility

Confirmed product defect with a browser reproduction, plus a weak regression.
`src/features/delete-element/index.ts:39-45` takes the result of
`elementApis.getElementIdAtClientPos` directly into `hoveredElementId`. That API
uses render-hit/geometry lookup. Normal hover instead resolves the hierarchy
target and rejects locked or hidden targets in `src/features/hover-element`.
The current hover spec explicitly excludes locked and hidden elements.

An isolated App page created overlapping rectangles through actual App APIs,
locked the lower rectangle, selected the upper one, placed the real pointer over
them, and pressed Delete. The upper rectangle disappeared; the lower locked
rectangle remained and became `hoveredElementId`. Observations were
`review-top -> review-bottom`, with `topExists: false` and `bottom: true`.
Evidence: `tmp/app-wide-review-browser-probes.log`. This is diagnostic evidence,
not a new permanent regression test or a substitute for one.

The existing test in `e2e/delete-element.spec.ts:541-551` only checks that hover is
not the deleted ID. It accepts both an ineligible target and an unconditional
`null`, despite its title promising actual reevaluation. All 12 existing delete
browser cases passed. A repair must use the current target policy and verify the
remaining eligible target, including locked/hidden and Group cases; deleting or
weakening that policy is not an acceptable optimization.

### R9 - Marquee overlay reuse omits a projection input

Confirmed rendering-owner invalidation defect under unchanged workspace endpoints
and a changed viewport. `src/render-layers/area-selection-render-layer.ts:70-95`
compares only workspace drag endpoints, then returns before converting them into
canvas coordinates. Its retained geometry is screen-space output of
`getCanvasPositionFromWorkspace`, so viewport translation/scale also affects it.
The actual `packages/render/src/layers/overlay-layer.ts` callback does not supply
an alternative viewport transform for those already-projected points.

A read-only in-memory probe loaded the actual App module and actual overlay
registration, held the selection endpoints fixed and changed projection scale
from 1 to 2. First update: `true`, two projection reads. Next update: `false`,
zero additional projection reads. The old output was retained. This proves the
owner's missing input; it does not establish a frequency or duration for the
user-visible drag-plus-navigation scenario. The 29 navigation/text/layer browser
cases do not exercise this condition. The gradient overlay, by contrast, includes
projected canvas handles in its signature; no equivalent defect was established
there. Preserve reuse while testing every input that changes the retained output.

### R10 - Local hierarchy targeting repeats document-wide validation

Confirmed repeated work, with end-user latency still unmeasured.
`src/controllers/canvas-hierarchy-target.ts:31-136` creates indexes and validates
all descriptors and ancestor chains. Every `resolveCanvasHierarchyTarget` call
enters that validation. `resolveCreateElementParent:271-289` validates once, then
calls the target resolver, which validates the same input again. Normal hover,
selection and creation consume these owners.

The actual module in a browser was invoked with 10,000 valid sibling descriptors
and a counting Proxy over the same descriptor map. A local hit needed 20,001 map
reads; repeating the identical query needed another 20,001. Creating at that same
hit needed 40,002. These counts exclude index allocation and enumeration, so they
are not a total cost estimate. Evidence: `tmp/app-wide-review-browser-probes.log`.
No GPU, frame-time or real-document millisecond claim follows from these counts.

The Framework computation-ownership-and-reuse rule requires distinguishing
admission of an unchanged projection from each changing pointer query. Determine
that owner's valid lifetime and invalidation before changing it. Do not remove
malformed-hierarchy checks, cache across document changes, or add a group-size
threshold. A future regression must assert work counts and correct invalidation,
not only returned target IDs.

## App-wide owner review

The inventory included 424 source, 267 server, 12 script, 88 E2E and 11 Knowledge
files, plus 16 root test files (selected source/config/document suffixes, including
tests). This is an inventory count, not a claim of line-by-line semantic proof.
The following families were inspected independently of the last Pen changes.

| Owner family                          | Handoffs inspected                                                                                                               | Outcome and evidence limits                                                                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Startup and configuration             | `src/index.ts`, init/capability registration, Core start/dispose, environment and backend module graph                           | Focused environment/bundle/configuration gates passed. Page-hide cleanup is registered by init; absence of a second disposer in the entry file is not a leak. R5 affects the current owner map.                         |
| Shell, providers and editors          | App UI, providers, controlled fields, Canvas text, conversation drafts, interaction isolation                                    | Focused conversation-panel and Canvas-text lifetimes passed. Inputs own shortcut propagation isolation; an unguarded downstream shortcut alone does not prove typing triggers canvas history.                           |
| Input, tools and selection            | Feature priorities, canonical selection, Pen start/continue/edit, hover, create, delete and context-menu consumers               | R3 remains an ordering-proof gap. R8 is a different product path and was reproduced independently. No product Pen-coordinate mutation was established.                                                                  |
| Hierarchy and geometry                | Canvas target resolution, Group commands, layer drop/move, common-API coordinates/topology                                       | R10 shows repeated full validation. Browser layer reparent/reorder cases passed; those results do not measure pointer-query work.                                                                                       |
| Properties and text                   | Fill/Stroke/text editors, shared property access, gradient drag and transaction boundaries                                       | Focused gradient-history/text cases passed. Hidden advanced Stroke sections and the animation placeholder are intentional current behavior, not missing implemented controls. R4 remains outside the focused type gate. |
| History and cancellation              | Public transaction status, undoable depth, pointer session commit/cancel, selection restoration                                  | Focused Undo/Redo and layer-move lifetimes passed. Public counts derive from the History owner; no private-stack fallback is needed. Browser input-order proof remains R3.                                              |
| Rendering and capture                 | App render registration, selection/gradient overlays, projection caches, inspection result/image handoff                         | R9 affects marquee reuse. Image delivery/recovery checks passed without repeating acquisition. This round did not redo GPU benchmarking or exhaustive image-quality comparison.                                         |
| Persistence, reload and collaboration | Backend materialization/store, document generations, publication outbox, recovery/disposal                                       | Focused outbox and backend/module checks passed; three server type gates passed. Prior two-actor Pen/reload evidence remains prior evidence, not a new full collaboration run.                                          |
| AI orchestration and transport        | Prompt, admission, current operation contracts, execution, projection, outcome, cancellation and report lifecycle                | Focused contract and recovery tests passed. Native instruction/schema boundary and retained-state production handoff results are recorded below; no live model or 101 was run.                                          |
| Knowledge, discovery and reuse        | Knowledge input validation, source delivery, context reuse/invalidation, conversation result scope, retention versus delivery    | Focused Knowledge/contract/image recovery cases passed. Browser result storage expires by document scope and checks captured ownership. Untrusted advice remains distinct from tool authority.                          |
| Servers and external inputs           | Local provider origin/loopback checks, reference URL/DNS/redirect admission, download budgets, document file identities          | Focused reference-download/configuration checks passed. This is boundary review, not a penetration test or proof against every remote-server behavior.                                                                  |
| Verification and current documents    | App scripts, explicit file selectors, compiler roots, actual runner collection/report comparison, source consistency, assertions | R1-R7 include concrete gaps. The independent conversation verifier's omission/identity checks were also exercised; its passing result does not repair the ordinary App selector.                                        |

Explicitly retained current behavior was not classified as unwanted compatibility:
the owned document text-fill migration, the outbox's pre-handshake null generation,
and the 64-step limit for registered durable recipes (not unrestricted inline
execution). ColorPicker owns unmount/cancel cleanup; absence of duplicate cleanup
in its consumer is not itself a defect. App render lifecycle still delegates to
Core; similarly named Core APIs are not removed App-controller aliases.

## Focused execution evidence

All log paths below are relative to the worktree. Failed prerequisites and
unselected cases are not counted as passed verification.

| Gate                                                                   | Result                                                                                                                                               | Log                                                                                                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| App source TypeScript                                                  | Failed: 3 diagnostics, R7                                                                                                                            | `tmp/app-wide-review-src-types.log`                                                                                               |
| AI, collaboration and document-backend server TypeScript               | All three exited 0                                                                                                                                   | `tmp/app-wide-review-ai-server-types.log`, `tmp/app-wide-review-collaboration-types.log`, `tmp/app-wide-review-backend-types.log` |
| Configuration/runtime/debug-global boundaries                          | 36 passed, 1 failed, R6                                                                                                                              | `tmp/app-wide-review-configuration.log`                                                                                           |
| Unified tool contract, result schema projection, Knowledge             | 3 files, 84 passed                                                                                                                                   | `tmp/app-wide-review-tool-contracts.log`                                                                                          |
| UI/gradient/history/layer/outbox lifetimes                             | 6 files, 83 passed                                                                                                                                   | `tmp/app-wide-review-lifetimes.log`                                                                                               |
| Delete browser cases                                                   | 12 passed; R8 still reproduced independently                                                                                                         | `tmp/app-wide-review-delete-navigation.log`                                                                                       |
| Viewport, Canvas text and layer reparent/reorder browser cases         | 29 passed                                                                                                                                            | `tmp/app-wide-review-viewport-text-layers.log`                                                                                    |
| Result delivery, selected-prefix recovery, reference download          | 3 files, 42 passed                                                                                                                                   | `tmp/app-wide-review-delivery-recovery.log`                                                                                       |
| Verifier selection/collection/publication and CLI                      | 15 passed initially; cancellation case did not reach its boundary without native-client configuration. Both CLI cases passed on the configured rerun | `tmp/app-wide-review-verification-tool.log`, `tmp/app-wide-review-verification-cli-configured.log`                                |
| Actual native instruction/schema boundary                              | 3 selected cases passed, including missing-instruction and altered-schema fault injection; 25 unselected cases excluded                              | `tmp/app-wide-review-native-contract.log`                                                                                         |
| Real controller, HTTP exchange, native Host, Core and later-turn reuse | 8 passed, including altered retained input/advice, Knowledge reuse without rereading, canonical child failure and actual successor delivery          | `tmp/app-wide-review-production-handoff.log`                                                                                      |

The native fixture used the already-installed, admission-checked Codex CLI
0.160.0 against an offline scripted model endpoint. It verifies actual native
request conversion; it is not a claim about a live model's design choices.
The first delete-browser command included a nonexistent navigation selector;
its 12-case result was only delete coverage. Navigation was rerun using the real
file and appears separately above. This reinforces R1 rather than excusing it.

## Review conclusion and repair boundaries

There are ten recorded findings: four carried forward and six additional
findings covering documentation, verification integration, typing, hover,
render invalidation and repeated hierarchy work. They are not ten equivalent
runtime failures. R7 was already known outside the original 152-item scope;
R2-R4 concern missing proof rather than demonstrated current Pen corruption.

The common problem is that a boundary can be correct in isolation while its
consumer or evidence uses a different rule: deletion bypasses hover eligibility,
overlay reuse omits projection input, new type evidence conflicts with an existing
guard, and ordinary test selection does not validate all its selectors. A future
repair should close these owner/consumer boundaries with independent expected
values and real ordering, not replace the current spec with observed behavior.

No implementation is authorized by this report. No product or test source was
changed for these findings. The review does not establish that every possible
App combination is correct: active-marquee navigation has owner-level proof but
not a browser visual reproduction; hierarchy work has counts but no latency
benchmark; native cases are scripted, not a live AI run; full local verification
and 101 were intentionally not run. None of those limits converts the confirmed
findings into a passing App acceptance.

## Authorized R1-R10 implementation follow-up

The subsequent user-authorized work is recorded separately in
[App Review Ten Findings](../plans/app-review-ten-findings-plan.md). The original
findings above remain the pre-fix evidence. All ten received bounded repairs and
focused verification, including independent oracle corruption, real frame
ordering, eligible hover, viewport invalidation and hierarchy work/lifetime
checks. The final selector audit also reconciles the exact Pen case with real
Playwright collection.

The first combined browser run was 50/51; the one rectangle-selection
precondition failure remains preserved. Its exact historical cause is unproven.
The authorized follow-up established two independent defects through permanent
red-to-green regressions: the rectangle helper could return before real input
admission, and repeating a held tool key could terminate an active create gesture.
The helper now acknowledges canonical selection and visible controls; the App
admits fresh tool keydown before session cancellation and ignores repeats.

Final focused integration is **84/84 browser cases passed**, with 29 App owner
checks, 5 existing held-input checks, 21 entry/declaration/spec guards and 3 exact
case-discovery checks passing. Strict handoff types, scoped lint and naming also
passed. See the plan for evidence and limits. Layers empty-area deselection still
preserves the active tool. No full local suite or 101 ran; this is bounded
integration acceptance, not a claim that every App interaction is proven correct.
