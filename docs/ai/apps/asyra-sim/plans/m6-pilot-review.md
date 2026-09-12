# M6: Independent Pilots and Release Review

Status: active - development authorized 2026-09-12 after the M5 merge.
The 2026-09-13 multi-agent handoff authorizes continued plan implementation,
development pushes and sub-PR integration. The user separately authorized merging
original PR #195 on 2026-09-13; it merged as `7e9ad9734`. Continued work now uses
`codex/asyra-sim-capacity-goal`, created from the resulting main, with verified
capacity commits replayed. This new goal branch must not be merged into main
without new authorization. External acceptance and R0 publication remain open.

## Original recovery slice contract

Baseline: 599cb5b916d25e157c3d5b40ce14b3bb5e93785f from fetched main after PR #192.
Branch: `codex/asyra-sim-m6-pilot-review`.
Worktree: `.worktrees/asyra-sim-m6-pilot-review`.
Preserve the M5 worktree, its exact candidate and failing resource proof.

Outcome of this development slice: users can perform the documented missing-method
recovery exercise using a shipped synthetic project, without a coordinator's
private file or missing instructions; candidate limitation and update/recovery
notes are usable locally. Run the normal packaged workflow and create an M6 PR
with all newest-head CI passing before requesting review.

Discovery is fixed to FIRST_RELEASE G3/G5-G8, roadmap section 9, the existing
pilot/maintenance/quick-start guides, distribution assembly and its direct tests,
and ordinary methods/project/report browser workflows. No repository-wide audit.

Mutation scope: ui-owned `apps/asyra-sim/e2e/**`, delivery
`scripts/**`, directly required App release documents, this plan/index and
append-only decision history. No production runtime, solver, Framework,
resource/precision limits, persisted format, telemetry/upload, dependencies,
environment upgrade, deployment or publication change.

Gates: prove the missing shipped fixture with a failing formal regression;
generate an explicitly synthetic unavailable-method fixture through the existing
ordinary method workflow; assert assembly includes the exact fixture and local
documentation link; test ordinary import, blocked rerun, retained declaration,
export and portable reopen with unchanged evidence. Run delivery/naming/placement,
App type/build/unit gates through the clean exact-source consumer, packaged
browser recovery plus the directly affected methods/comparison journeys, inspect
screenshots and verify final checksums. Commit validated delivery tooling before
the clean producer. Keep one browser worker, fail-fast/deadline/log guards and
PID ownership. Push the M6 PR and monitor all latest-head CI every five minutes.

Stop at a missing external decision/evidence or out-of-scope owner; do not invent
pilot completion, method correctness or support authority. Scope may expand only
on new user direction or the bounded rule's formal conditions.

## Carried release evidence

M5 stage closeout was explicitly accepted with release gaps. Its source
`9cf5c7f5e` passed the isolated consumer and 39 packaged cases. Those are
historical checkpoints, not this M6 candidate's gates. The unchanged representative
39-body / 30-fixture / 200-frame / 298-pair workload fails with all pairs unresolved
after exhausting original-triangle work. The formal failing file remains in the
M5 worktree at `apps/asyra-sim/src/analysis/__tests__/representative-resource.browser.spec.ts`,
with reports in `tmp/m5/`; it is not deleted, waived or claimed CI-covered here.

M1 / 8 GB reference hardware, independent numerical evidence, two non-developer
pilots (one with equipment/workcell experience), and maintenance/reporting
decisions remain open. Ask for the actual arrangements; do not substitute this
developer-generated recovery fixture for either G7 pilot's own work.

## Step Execution Card - self-contained pilot recovery

Owner: `ui`, R0 Inspector `ui` and `user-workbench-terminal`.
Inputs: ordinary authoritative retained artifacts, versioned local files, clean
exact source/lock and validated packed Framework inputs.
Output: `artifact:user-workbench` and its usable versioned local distribution.
Conditions: no canonical/model/solver ownership in UI; unavailable methods allow
historical reading but not rerun; retain immutable execution/coverage/declaration;
assemble only after exact-source gates; notices, local links and checksums cover
all shipped files. Startup/assembly failure is explicit, never fabricated success.
Allowed contributors: ordinary UI controls and versioned local distribution.
Forbidden: fixture-specific product paths, equipment commands, automatic
publication, external transmission or invented third-party validation.
Boundary: existing ui E2E and scripts allowlists plus direct release documentation.
Spec references: workcell comparable/traceable experiments and representative
product cases; FIRST_RELEASE G3/G5/G6/G7; runtime-profile Environment and Delivery.
Failure owner: ui. No cache or new persisted product identity.

Formal red oracle: the public exercise currently requires a coordinator-provided
missing-method file. New E2E must read the shipped file itself, and assembly must
preserve its bytes and a locally usable guide link. Existing methods E2E constructs
an in-memory private-method fixture, so it does not catch missing delivered input.
The fixture is a documented synthetic alteration of an ordinary example run,
not evidence that a private method actually ran.

DoD: shipped-file recovery works without installing code or modifying the package;
rerun blocks clearly, historical result/report survives export and reopening,
user instructions identify the exact file, controls and success/failure outcome.
Self-review: this implements existing pilot/distribution contracts within ui;
it does not add product semantics, expand Inspector boundaries or replace G7.


## UI slice evidence before candidate generation

The new supplied-file E2E fails with ENOENT before the fixture exists. The
assembly regression fails because the recovery link is rewritten as unshipped
source-only instead of a local example. Both red records are in `tmp/m6/`.
The existing methods E2E generates the explicitly synthetic fixture from the
unmodified M5 candidate; two authoring cases and the supplied-file recovery case
pass. This is fixture preparation, not an M6 candidate pass. Fixture SHA-256:
`6df67609d9c34502aa7bcd028e4b03dd70bde21847f754cd0dc805c6ab909c40` (681,506 bytes).

Only test-local names and the shipped example path are introduced; production
method IDs and saved schemas are unchanged. Naming passes before and after the
first identifier-bearing test slice. The assembler retains exact source bytes;
the SDK already copies E2E inputs. No product test path or runtime fallback exists.

Tooling checkpoint: delivery/placement 22, naming 11 and Inspector contracts 100
pass; App lint passes. The supplied-file recovery test also proves that blocked
rerun allocates no analysis Worker. The prepared fixture contains one retained
run, 11 generated visual sources, no load issues and no external/file URLs.
Bounded review confirms exact byte copying, local document linking, original
notices/checksum guards and unchanged ui/solver/storage ownership. Commit this
validated tooling stage before invoking the clean producer; its source tests and
packaged browser evidence remain the next checkpoint.

## Completed recovery evidence and continued development - 2026-09-13

The producer and packaged workflow above subsequently completed on exact source
`593762b965aacd83e3323245c35765e14da1889c`. The clean consumer rebuilt and packed
19 Framework inputs, retained 387 registry identities, passed 678 isolated App
tests and the type/bundle gates, and assembled 31 dependency notice records.
All five affected packaged browser cases passed; source, candidate and SDK
recovery-fixture bytes and the final candidate checksums agreed. All eight CI
checks passed on that same HEAD. These are completed recovery-slice results,
not evidence for later source changes or full M6 acceptance.

The original producer record is
`apps/asyra-sim/.artifacts/consumers/593762b965aa-9PKgp4/consumer-evidence.json`;
the packaged browser record is `tmp/m6/packaged-report.json`. The candidate
archive SHA-256 is
`fe1f23d6ffe7d6ff3a042757c2c08f36d0961ac726d2b76943f413a76f94dfa4`.
The handoff review found no concrete defect in the bounded recovery code diff;
the five distribution tests passed again on 2026-09-13. Prior screenshot review
remains historical evidence, not a new visual review.

Continued development first investigates the representative capacity failure
against the unchanged workload, precision and resource limits. A separate
method-owner execution contract must precede any correction; the original
recovery slice above is not retroactively expanded. Preserve the M5 failing
regression and original reports.

The user authorized research into suitable public validation data and, when
unavailable, reproducible synthetic data grounded in real-world conditions.
Record source permission, provenance, assumptions and validation scope. Public
or synthetic cases do not count as reference-hardware measurements, independent
human numerical review, or either non-developer pilot. Maintenance authority and
physical evidence cannot be inferred from generated data. M6 and R0 remain open
until their actual required evidence exists.

## Capacity task iteration - 2026-09-13

The method owner remains responsible for FIRST_RELEASE G2/G4 and the unchanged
39-body, 30-fixture, 200-keyframe, 298-pair, three-candidate workload. The M5
regression and reports remain intact. Formal current-source regression reproduces
500,000 logical mesh-work exhaustion after 134 temporal evaluations; all 298
pairs are unresolved. This is not a wall-clock or temporal-node-budget failure.

Two bounded corrections have passed independent review without closing G4:
deterministic dual-tree descent raises progress to 17,686 evaluations, and
first-witness interval certification raises it to 19,996. The latter still spends
211,066 work on joint-2/table (199 clear intervals) and 186,994 on joint-2/obstacle-10
(96 clear intervals before exhaustion). Its 22,017 convex calls replace the
initial profile's zero convex calls: hierarchy order and redundant samples no
longer explain the entire failure. Do not continue local sampling/tree patches.

Revised Step Execution Card: `method`, Inspector `method` fields, numerical-method
spec and runtime-profile representative workload. Inputs remain admitted frozen
source geometry, domain-owned point/interval pair poses, and current budgets and
checkpoints. Output remains complete method evidence or explicit unresolved
coverage. Only conservative full-source rejection is allowed; bounding solids
never supply contact geometry, a penetration verdict, or a substitute witness.
Existing source geometry, thresholds, precision, tick accounting, legacy method
ordering and immutable history remain unchanged. No pose or temporal cache.

The next segment first profiles candidate separating directions against complete
source bounds, on the two measured expensive pairs at their ordinary static and
interval queries. Compare current axis-aligned rejection with outward projection
onto fixed directions derived from each current orientation. Count candidate
projection operations, certified rejections and actual current-query work.
Preparation is measured separately and is never presented as free production
work. These are formal test-owned profiles, not a production fast path.

Discovery and mutation stay in `analysis/methods/**`, directly owned tests and
this existing plan. No new repository-wide audit or workload change. Before any
third production correction, replace this profiling hypothesis with a reviewed
implementation plan only if profiles show material benefit after its added work.
That plan must include exact source enclosure, independent analytical truth,
rotated/static/continuous and near-threshold cases, containment/crossing negatives,
full-source and hierarchy-disabled agreement, deterministic work counts, current
cancellation, and source/pose/threshold invalidation. If root bounds cannot reject
the costly pairs, record that result and do not install an ineffective shortcut.

Self-review: this replaces the exhausted local optimization plan with a bounded
method-certificate investigation. It maps to the existing Inspector permission
for conservative rejection and changes neither product geometry nor cache
ownership. Focused proof must pass before the unchanged three-candidate gate;
no release, reference-hardware or independent-pilot claim follows from this slice.

### Revised certificate implementation plan

The test-owned node-certificate probe now establishes material benefit after
charging every attempted candidate axis to the unchanged combined 500,000 work
limit. For table at [0,2], original work 80,644 becomes 6,638 including 100 axes;
for obstacle-10 at [2,3], 65,502 becomes 4,502 including 156 axes. Its expensive
[3.75,4] and [4,4.25] windows fall from 205,000/185,302 to 28,137/23,512 including
17,312/14,121 axes. Complete coverage and leaf classifications match the original
runs. Preparation remains included and separately reported. Four cases pass
within their unchanged 20-second guards. A prior [3,4] profile exceeded that
guard and was split into quarter-second cases; its failure record is retained.
Root-only rejection is rejected as insufficient: it saves work but leaves the
most expensive subtree queries unresolved within the full-run budget.

The next implementation is one pure method-owned full-source-bound projection
helper, consumed only by original-part root/node/triangle rejection. Each call
first uses the existing world-axis gap. When insufficient, try the three axes
from each current pose in fixed order. The midpoint proposal is merely a fixed
nonzero search direction; outward inverse rotation and interval dot products
bound the projection of every point of the complete local bounds at every
admitted pose/time. Divide a positive projection gap by an outward direction
norm. Return only a conservative lower gap; zero/overlap has no collision or
clearance meaning. The helper receives the current search threshold, including
zero after a clearance witness; every attempted axis calls the existing tick.
Mixed analytical/mesh queries retain their existing path in this slice.

At the root, a positive full-source gap may return the existing real source-point
upper witness and the certified lower gap, never a bounding-box corner witness.
At a subtree or triangle, a positive gap rejects only that source subset.
Retain the original static membership phase and the interval witness.lower
containment condition; absence of a surface crossing must not turn contained
solids into clearance. No current pose, projected bound or temporal certificate
survives its query. Mesh preparation lifetime and equivalent hit charging remain
unchanged. Method version 1.0.2 describes the completed bounded correction; old
reports and studies remain unchanged and old methods are never aliased.

Before production edits, independent review must accept this plan and permanent
red tests must show the current unnecessary source-traversal work. Required
proofs include analytical rotated and translated closed solids, near-threshold
and crossing negatives, source-point upper witnesses, original contact/warning
priority, both pair directions, hierarchy-disabled classification, deterministic
reruns, changed source/pose/threshold, exact work ceilings and cancellation during
axis attempts. Then run the direct method suite and independent numerical oracle,
naming, typecheck and lint before the original three-candidate capacity gate.
The feasibility adapter is not shipped as a product route and is not itself a
correctness oracle. Failure returns to this exact method boundary and does not
permit another speculative shortcut, smaller fixture, extra budget or fallback.

The third slice's first production attempt exposed an owner mismatch: omitting
cardinal candidate axes kept the dual-tree 576-work gate but used 54,997 work
against the unchanged 50,000 obstacle gate. Existing worldBounds forwards an
interval box through a quaternion cross-product expression, repeating the box
variables and weakening the world-axis enclosure. Cardinal inverse projections
were therefore not redundant in the feasibility profile. The bounded correction
is to share one pure inverse-direction source projection with worldBounds itself,
then omit genuinely repeated cardinal candidate queries. First prove exact
rational rotated-box extrema and cardinal tightness red on the current owner;
also retain interval-rotation vertex enclosure and near-contact negative cases.
No domain pose, source geometry, work ceiling, or budget changes are authorized.

The corrected third slice passed 103 direct method tests, independent review
(40 tests), typecheck, focused ESLint, naming (11), and diff checks. Exact
rational/cardinal source-width regressions were red before worldBounds changed
(3.68 versus 0.8 and 6 versus 2), then green with the same projection owner.
The unchanged 10,000/50,000 representative pair work ceilings and 576 dual-tree
ceiling pass in both pair directions. These are bounded method results, not G4.

The complete unchanged representative profile remains partial after 20,189
evaluations and 500,197 accounted work (7.862 seconds on this development host).
Its first partial pair is joint-2 versus obstacle-11: 385,726 work, comprising
249,830 static and 135,896 interval work, with 90 evaluations and 70 clear
certificates. The previous obstacle-10 pair now completes all 199 intervals in
29,449 work. Evidence is in tmp/capacity/representative-world-bounds.log. The
three-candidate browser milestone is not rerun while its focused full-workload
prerequisite remains red.

The next bounded diagnostic remains at the method owner and this newly measured
obstacle-11 pair. Separate static membership, source hierarchy/triangle queries,
convex queries, and interval work by fixed trajectory windows before choosing
any further algorithm. Inspect whether late source-order discovery of a valid
penetration witness dominates; do not infer this from the previous baseline or
assume trajectory keyframes can be merged outside the domain contract. Any next
production iteration requires a revised reviewed plan and a permanent work-count
red oracle, with full source, warning/penetration semantics, thresholds, shared
poses, and the existing budget unchanged.
