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

### Fourth bounded iteration - query-local sibling ordering

The current source-query profile splits obstacle-11 into eight fixed one-second
windows, each retaining the 20-second test guard and the original 500,000 work
budget. The five expensive windows use 150,070 / 300,053 / 141,911 / 420,497 /
164,078 work; membership is small, while static triangle and interval queries
predominate. Exact same-time/source/pose/control comparisons found only nine
repeated admitted interval queries totaling 70,069 work. That approximately six
percent opportunity does not justify treating interval reuse as the main fix.
A diagnostic reversed complete index order preserved all source offsets,
components, representatives, leaf states and penetration while reducing the
2-second window from 300,053 to 183,570 combined work and the 4-second window
from 420,497 to 309,453. Each includes 3,134 extra reordering units. Reversal is
a diagnostic control, not the proposed production heuristic.

Step Execution Card: owner remains Inspector `method`; inputs, evidence outputs,
shared domain poses, full-source and containment contracts are unchanged. The
first avoidable owner work is source-order descent before establishing useful
witnesses. One candidate orders only the two child pairs of an existing node
expansion. Sort by conservative world-axis gap ascending, then squared world-box
center distance, then original source order. Centers select order only and never
supply product bounds, witnesses, membership or contact. Leaves gain no scoring.
No global queue, pose cache, sampled collision route or domain change is allowed.

A pending entry owns its two already computed complete world bounds and their
threshold-independent world gap, consumed once when that exact entry is popped.
Its lifetime is one distance/lowerOver call. Every prepared node pair charges its
existing node work immediately, even if later early exit leaves it unvisited;
one additional tick charges each sibling ordering decision. Projected rejection
still runs at pop with the current search threshold, including zero after a
warning witness. No threshold-dependent projected score is retained. Pending
entries and all their bounds disappear when the current query returns or throws.
All children and original triangles remain eligible; a warning still requires
searching every potentially intersecting region for penetration.

The reviewer and root accepted formal test-first experimentation instead of
copying the solver or adding test-only production hooks. First add a permanent
multi-component work oracle that is red on the current source-order method,
including source permutations, rotation, reversed pairs, late penetration and
exhaustive truth. After that red and plan review, implement this one candidate.
Then require those truth/work oracles, prior 576/10,000/50,000 gates, cancellation,
and both fixed representative windows to pass with material work reduction
(including the new decision charges). If this candidate fails those conditions,
remove only this uncommitted candidate's production change and replan; do not
retain it because it has been written or tune a heuristic to a fixture. Existing
full-workload red tests and prior immutable evidence remain preserved.

The sibling-order candidate failed its predeclared material-benefit gates. The
formal baseline was 300,053 versus a 240,000 ceiling and 420,497 versus a 336,000
ceiling. Candidate work increased to 316,490 and 454,787 respectively, despite
passing all twelve direct multi-component and prior bounded-work cases (the
dual-tree combined work was 536, below its unchanged 576 ceiling). There was no
observed truth regression; the cost hypothesis was wrong. The uncommitted
production candidate was restored to the reviewed third-slice implementation.
Its permanent red work tests, diagnostic controls, and bounded output logs in
tmp/capacity/sibling-order-{red,candidate}.log remain preserved. No alternative
heuristic was substituted. The next iteration must re-audit the same source
query owner and revise the plan before any further implementation.

The next diagnostic tests a different canonical decision, not another ordering
heuristic. Once a real static warning witness exists, the remaining question is
penetration. A strict positive certificate separating the complete original
source bounds would exclude penetration everywhere; the current search only
rechecks subtree bounds at the lowered zero threshold. Passively measure a
zero-threshold root certificate at the first real triangle warning witness in
the same two obstacle-11 windows. Keep the baseline traversal running unchanged,
record each completed query's remaining actual work and every probe axis cost,
and require the certificate to enclose the real upper witness with no later
penetration. No production early return is authorized by this diagnostic alone.

The zero-threshold root-box diagnostic disproved this candidate before any
production edit: the two windows had 30/33 first-warning probes and zero
positive full-root certificates, costing 120/132 additional logical units with
no saved work. Baseline completion subsequently found real penetration in
13/11 of those queries and positive-lower clearance warnings in 17/22. The
complete convex-query counts were respectively 17/13 penetration, 158/203
positive-lower warning, 7,408/14,181 separated, and 7/16 uncertain results.
Unconditional warning early return would therefore be incorrect. The formal
profile passes its truth checks and is retained in warning-separation-profile
and tmp/capacity/warning-separation-states.log; this candidate does not proceed
to production.

A separately authorized passive extension used the already established warning's
fixed axis to project every original source vertex with outward arithmetic.
This remained rejection-only, never convex-hull collision geometry or a product
upper witness. It also produced zero certificates in both windows. The complete
vertex/norm probe costs were 106,110 and 116,721 units, with zero saved work;
all baseline penetration and uncertain results remained present. This direction
is stopped without a production patch (tmp/capacity/vertex-separation-profile.log).

Read-only temporal-contract review also rules out treating a first clearance
warning as permission to skip subsequent required witness samples: the current
1.0.2 strategy explicitly requires remaining samples and a final certificate
unless strict full-interval clearance was proven. The same-pose penetration
priority and independent collision/clearance product findings remain binding.
No temporal shortcut or new retained-pose cache was implemented. Production
remains the independently reviewed third slice pending a new bounded owner plan.

The next same-query reuse audit measured exact completed projected-gap calls with
both query pose identities, all twelve bounds coordinates and the current
threshold fixed. Repeated value-equal calls account for 28,299 / 44,370 axis work,
but 55,573 / 77,417 lookups already exceed that saving before any bound interning
preparation. Reference-identical repeats account for only 150 / 216 units.
No query cache is justified by these results.

The next bounded feasibility adapter changes only triangle broad rejection:
compare the current local-box world bound with the outward extrema of the three
actual source vertices at the same admitted pose/interval. A triangle and its
motion are enclosed because each triangle point is a convex combination of the
three transformed vertices at every admitted time. This never supplies collision
or contact geometry. Root/node hierarchy, all source triangles and membership
remain untouched. Account for the replacement's three point transforms versus
the original three inverse-axis box projections, and separately measure avoided
axis queries, convex calls and the unchanged logical work budget. There is no
additional mesh scan or retained pose state. Only material evidence permits a
reviewed implementation plan and independent enclosure/work regressions.

### Immutable hierarchy partition feasibility

Exact triangle bounds reduce convex calls substantially but logical work only
3.3% / 6.7%, so no triangle correction is frozen. Complete query-local node source
extrema, including each transformed source point, bound union and lookup, instead
exhaust the unchanged combined budget at 500,001 in both windows. It is rejected.
The existing median hierarchy has 74,977 / 94,423 internal-node visits, of which
72,372 / 90,716 visit positive-overlap siblings; visit-weighted overlap relative
to the smaller child's surface area is 0.586 / 0.591. A frequently visited
1,101-triangle node has 0.829 sibling overlap. These structural observations
justify one immutable partition probe, not another query ordering heuristic.

The root and independent reviewer froze one source-complete SAH feasibility
rule before execution: eight fixed bins on each of three local axes, surface
area times source count, four-triangle leaves, deterministic axis/bin ties and
source-offset ties. Keep every original triangle exactly once, its vertices,
component and representative unchanged. Empty/degenerate partitions use the
existing legal median construction, never a different product geometry.
Every added scan/assignment/partition/prefix-suffix pass charges each 256 items
including its final partial chunk; each actual candidate split cost evaluation
charges one additional unit. Existing preparation charges remain, all new work
is included in prepared.work, warm runs pay equivalent preparation and failed
preparation is not retained. No bin, leaf, budget or charging changes may follow
measurement to make a fixture pass. A formal test-owned rebuilt index probe must
show total preparation-plus-query benefit, truth and fixed prior work limits
before a reviewed test-first production plan can be proposed.

### Lazy immutable refinement - bounded implementation experiment

The fully charged eager SAH probe improves the two windows to 169,653 / 234,238
work but regresses the complete workload: 33 meshes consume 26,081 median plus
449,840 SAH preparation units and leave coverage partial after 10,149 evaluations.
Eager preparation is rejected. The next experiment preserves that exact SAH
algorithm and charging but moves its owner to the first real hierarchy use.

Inspector `method` still owns immutable geometry/hierarchy preparation and all
query evidence. Distance uses the unchanged median index for complete-root
rejection and every membership test; only after those admissions does it obtain
completed refined indices before constructing pending node pairs. lowerOver
likewise retains root rejection and positive-witness containment admission before
refinement. Exhaustive mode and already-leaf indices require no refinement.
Median indices remain intact. No names, poses, times or past query performance
select the strategy. Completed refinements are keyed only by exact frozen source
geometry/hierarchy mode in the existing allowed preparation lifetime; invocation
state records whether the equivalent cold cost has already been charged. Warm
first use charges that same cost with the current checkpoint. Incomplete/aborted
refinement is not retained and cannot fall back to median as successful evidence.

Root and independent review authorized a real, uncommitted owner experiment
instead of fragile test proxies. Permanent tests precede implementation for
cheap-root and membership bypasses, same geometry in two poses, cold/warm charge
parity, unused warm refinements, exhaustive bypass and aborted preparation.
The existing representative and fixed-window work regressions are already red.
All prior work ceilings remain unchanged; the known approximately 60,000 cold
refinement cost may itself violate the 50,000 obstacle gate. Such a failure must
be reported, not hidden with a selector or raised ceiling. Candidate production
is accepted only after full workload, work-count, truth and independent review;
otherwise preserve evidence and restore only the uncommitted experiment.

The real lazy-owner experiment passed all four preparation lifetime/admission
contracts, both twenty-percent fixed-window improvements and the unchanged
460-of-576 dual-tree gate. It nevertheless consumed 66,482 units in both
obstacle-10 directions, exceeding the unchanged 50,000 ceiling. The candidate
is rejected; only its two uncommitted production files were restored. No full
workload/browser rerun or geometry-dependent selector follows this failure.
The formal red and candidate outputs remain in
`tmp/capacity/lazy-hierarchy-red.log` and
`tmp/capacity/lazy-hierarchy-candidate.log`; the rejected source diff is retained
as `tmp/capacity/lazy-hierarchy-rejected.patch` for reproducing that historical
experiment, not as current product implementation.

### Permanent capacity diagnostic commands

Hypothesis profiles are permanent, explicitly selected evidence, not ordinary
passing capacity gates. Run a specific profile with
`SIM_CAPACITY_DIAGNOSTICS=1 yarn workspace @asyra/asyra-sim test:local <file> --maxWorkers=1`.
The selected files are `source-query-cost.test.ts` and the method test files
ending in `-profile.test.ts`. Each retains its fixed twenty-second case guard.
Run expensive windows separately by test title when necessary. Negative net
benefit and partial budget exhaustion are expected diagnostic observations;
a passing profile assertion does not mean its strategy is adopted or G4 passes.
The source/node projected-bound adapters describe the earlier feasibility
hypothesis and must not be cited as an unmodified pre-projection baseline on
current 1.0.2 production. Current-owner profiles report current production.

`SIM_LAZY_HIERARCHY_EXPERIMENT=1 yarn workspace @asyra/asyra-sim test:local lazy-hierarchy.test.ts --maxWorkers=1`
selects the generic refinement lifetime contracts first exercised by the rejected
SAH experiment. The current API implements admitted-component refinement, so
these four contracts now pass without reconstructing SAH. The historical SAH
candidate still failed its 50,000 ceiling; its retained patch and recorded logs
are that algorithm's evidence. SAH/rotation eager adapters explicitly disable
newer demand-time refinement so it cannot replace their historical hierarchies.
The reverse-order, triangle-bound and node-source-bound adapters use the same
control to preserve their original index/metadata relationships. Actual
`source-query-cost.test.ts` and representative goal gates use current production.

`representative-work.test.ts`, `representative-resource.browser.spec.ts` and
`sibling-order-work.test.ts` retain their original selection and unchanged work
assertions. They are actual outstanding capacity/work regressions, not hidden
hypotheses. The representative goal remains incomplete.

### Median axis mismatch observation

A passive fixed-original-node diagnostic compares the current full-box longest
axis with the spread of the same `lo + hi` sorting key. It never changes product
indices or recursively repartitions the hierarchy. Across the two fixed windows,
600 nodes have mismatched axes, with 13,240 / 18,471 actual world-bound visits
out of 74,977 / 94,423 internal visits. Hypothetical median partition on the
other axis changes visit-weighted local overlap from 8,563 to 8,214 and from
12,195 to 10,770. These small local changes are not actual saved query work;
current complete query work remains 300,053 / 420,497. The observation does
not justify another production partition candidate. Diagnostic scans/sorts are
measurement overhead, not free product preparation or a proposed work budget.

### Single-pass immutable local rotation probe

The next method-owned test-only hypothesis preserves the original median leaves
and visits each original node once in postorder. The primary description is
<a href="https://hwrt.cs.utah.edu/papers/hwrt_rotations.pdf" target="_blank" rel="noopener noreferrer">Kopta et al., section 1.2</a>.
This is immutable source preparation, never pose refitting or contact geometry.
For children `L=(A,B), R=(C,D)`, the fixed candidate order is swapping R with A,
R with B, L with C, L with D, then regrouping `(A,C)|(B,D)` and
`(A,D)|(B,C)`. Invalid candidates are absent. Compare the change in complete
unnormalized internal surface-area cost, using only changed internal bounds;
fixed leaf costs cancel. Strictly negative cost is required, ties retain the
first candidate and no-op takes precedence. Nonfinite costs select no-op.
No additional passes, new partition rules or triangle/leaf splitting/merging.

Each original node visit, each actual bounds union, every candidate evaluation
including rejected candidates, and each constructed internal node costs one
checkpoint. Reuse a candidate's completed bounds when constructing its selected
node; do not charge or compute the union twice. Preserve all existing median
preparation charges. Tests must prove original leaf identity exactly once,
complete offsets/components/representatives, exact child unions, acyclicity,
unchanged original source index, and independent whole-tree area nonincrease.
The two existing windows and unchanged 50,000/576 work gates decide whether
this test-owned probe merits a production plan; observations alone do not.

The rotation probe completes both windows with identical leaf state/penetration
evidence and unchanged source leaf identities, offsets, components and source
index. Original preparation is 3,176 and additional charged rotation work is
14,292. Total work is 266,659 / 380,416 versus 300,053 / 420,497: improvements
of 11.1% / 9.5%, below the existing 240,000 / 336,000 window ceilings. This
single-pass candidate is rejected before production or full-workload testing.
Do not add passes or tune its fixed candidates to rescue it. The three tiny
rotation oracles pass, including exact work counts 11 / 24 / 21; the two actual
source windows pass their diagnostic truth checks. These are hypothesis results,
not completed capacity gates. Evidence: `tmp/capacity/rotation-oracle.log` and
`tmp/capacity/rotation-preparation-profile.log`. Production remains unchanged.

### Replan - Euclidean world-bound certificate

After the rejected hierarchy candidates, the method Inspector and fixed 500,000
work goal remain unchanged. Retained two-window profiles identify static work
221,263 / 287,845 and interval work 78,790 / 132,652; membership is only
172 / 3,439. Repeated projection memoization and source-world-bound rebuilding
have already failed their net-cost tests. The next single hypothesis addresses
`mesh-index.boundsGap`: its current maximum coordinate gap is conservative but
weaker than the outward Euclidean norm of all positive coordinate gaps.

First run a passive `euclidean-bounds-profile.test.ts` on the same two windows.
At each actual oriented projection call, its explicit current threshold is the
authority, including zero after an initial or later warning. Reconstruct the
already available world bounds for measurement only; a possible implementation
would consume those caller-owned completed bounds. Try the norm only when at
least two coordinates have positive gaps and the existing maximum has not
already rejected. Count every attempted complete outward norm certificate as
one added checkpoint, including failed rejection. This is the same logical unit
as one complete directional projection certificate, not free arithmetic.
Record eligible calls, strict new proofs, existing projection work that would
be bypassed, and baseline outcome/total work. Do not infer avoided descendants
from hit rate; positive evidence needs actual bounded owner work-delta profiling
before a production plan. A zero-benefit result stops this hypothesis.

The future independent oracle, only if warranted, is the exact rational
3/256, 4/256, 0 gap with distance 5/256 and threshold 9/512, reversed pair,
zero/contact overlap, interval enclosure, and actual work/cancellation checks.
No new triangle solver, geometry, hierarchy strategy, cache, severity shortcut,
threshold or budget change is permitted. The bounded source owner and direct
method tests are the only implementation scope, pending independent review.

The passive norm counts were 7,730 / 12,105, with 2,482 / 5,102 strict
proofs. The actual test-owned adapter then charged every norm directly through
the original query checkpoint: 6,836 / 10,298 attempts after pruning. Complete
query work became 296,368 / 409,102, only 1.2% / 2.7% below baseline. Every
leaf start/end/state/penetration remained identical. This fails the fixed
20-percent material-work requirement; no production norm change or broader
gate follows. The adapter's reconstruction of caller-owned world bounds is
measurement overhead, never a proposed free second production computation.
Evidence: `tmp/capacity/euclidean-bounds-profile.log` and
`tmp/capacity/euclidean-bounds-delta.log`. Typecheck and focused ESLint pass.

The next read-only owner observation is existing source topology: joint-2 has
4,404 triangles in 36 closed components (sizes 48, 96, 124 and 256), while
obstacle-11 has 620 triangles in five 124-triangle closed components. Neither
has a topology issue. Current median construction partitions all triangles
globally instead of preserving these component subtrees. This is metadata for
replanning only; no new component partition algorithm has been authorized or
implemented by this observation.

### Replan - preserve admitted component hierarchy

The root authorized one test-owned construction using existing topology only.
Collect every original triangle and group by its already-admitted component
number. Build the unchanged longest-full-bound-axis median triangle hierarchy
within each group, with the existing four-triangle leaf limit and source-offset
sort tie. Build a deterministic median hierarchy over complete component roots,
using the same longest-bound-axis rule and original component number as tie.
A top-level leaf hands off to the complete component subtree; it is never a
convex surrogate. Membership retains the identical representatives and triangle
component ownership. No source split/merge, inferred topology, new axis heuristic
or threshold changes. The immutable original median index is never modified.

The probe preserves the original index preparation charge and adds every actual
original-node collection visit, every rebuilt triangle/top node, each new
bounds scan and grouping pass in 256-item chunks including each tail, and every
new sort's comparisons in 256-comparison chunks including the tail. Component
lookup/handoff is part of its charged top-node visit; no free second index build.
Warm preparation must include the full extra construction cost under the existing
prepared-index owner. Aborted construction returns nothing and retains nothing.

Before the two fixed-window measurements, permanent structural tests must prove
all offsets/components/representatives unchanged, all component roots complete,
leaf limit four, exact child bounds, unchanged source index, cancellation and
deterministic ordering. Overlapping and nested source components must retain
inside/outside/uncertain membership behavior. Then compare actual cold total
work and complete temporal/severity evidence against the fixed 240,000/336,000
window ceilings. Only material improvement permits the unchanged 50,000/576
gates; production still requires a separately reviewed implementation plan.

The component probe improves complete fixed-window work to 208,105 / 306,172
(30.6% / 27.2%), with original preparation 3,176 plus added preparation 10,366.
All original triangle objects, offsets, components, representatives and temporal
leaf state/penetration are preserved. The two structural tests pass, including
nested/overlapping membership and cancellation. The unchanged prior gates run
through `SIM_COMPONENT_HIERARCHY_EXPERIMENT=1` and
`component-prior-gates.test.ts`, which imports the original oracle files and
applies only the test-owned index builder. Eight of ten cases pass: both 50,000
obstacle directions and all dual-tree cases, including 576 work, pass. Both
10,000 table directions fail at 16,661 because eager extra preparation is paid
before root rejection. Eager component preparation is not accepted; no
production changes follow without another bounded owner replan. Evidence is in
`tmp/capacity/component-oracle.log`, `component-preparation-profile.log` and
`component-prior-gates.log`.

### Actual-demand component refinement - owner card

The eager candidate is replaced by a reviewed-lifecycle experiment at method
hierarchy entry. Keep the complete immutable median index for all existing root
rejection and closed-component membership. For distance, refine only after both
membership directions finish without resolving penetration; for lowerOver,
refine only after root rejection and the positive-witness containment admission.
Obtain both completed refined indices before capturing the initial pending roots.
Only the existing hierarchy=false and non-mesh routes bypass this construction;
no body, source name, component count, triangle count or cost selector is added.

The exact component builder and all previously frozen collection/grouping/node/
scan/sort charges remain. Original median preparation is never removed. Completed
component indices may join the existing exact-frozen-geometry/hierarchy-mode
prepared artifact; invocation-owned state records already charged refinements.
Cold and warm first actual use charge identical extra work with fresh checkpoints.
Unused warm artifacts cost nothing extra; mutable or replaced source geometry
cannot hit them. Interrupted refinement or an exhausted warm charge must not
publish invocation success or a partial retained artifact. No poses, witnesses
or temporal bounds enter the retained cache.

Formal `component-lifetime.test.ts` tests precede the production experiment:
root-clear and membership-resolved bypass, hierarchy=false, unused warm artifact,
same geometry at distinct poses and reversed pairs, equal cold/warm work,
interrupted preparation/retry, and actual current-query refined-root consumption.
The implementation allowlist is `mesh-index.ts`, `original-mesh-query.ts` and
direct method tests; only after independent card review may the uncommitted
owner experiment start. Re-run unchanged 10,000 / 50,000 / 576 gates and both
240,000 / 336,000 windows, followed by the real full representative gate only
if every owner gate passes. No commit/push or completed capacity claim precedes
those results and independent review. Failed work is preserved as evidence.

The actual-demand owner passes all 25 fixed/lifecycle cases, plus 23 original
mesh/motion/lifetime tests and the independent reviewer's 21 oracle/lifecycle
cases. The full representative gate remains partial at 500,197 work and 20,195
evaluations, first incomplete pair joint-2/obstacle-11 at 96 evaluations (73
clear interval certificates). Only three refinements were actually built,
costing 11,653 in addition to 28,943 median preparation. The full red evidence
is `tmp/capacity/component-full-representative.log`; no browser rerun follows.

Production is frozen while `component-transfer-profile.test.ts` compares the
same original 200-keyframe/full-pair schedule at the unchanged 500,000 budget.
One explicitly named median control makes refinement return its input without
new work; it must reproduce the earlier 20,189 total / 90 target evaluations
before any delta is interpreted. The other run keeps the current candidate.
Each case retains the twenty-second guard and records original segment times,
actual target prefix work, first unresolved intervals, and median/refinement/
axis/membership costs separately. This is no reordered or split-run completion
claim. The scheduler pushes original segments in ascending order and pops them
from the end, so full traversal begins at time eight; isolated [2,3]/[4,5]
windows are not equivalent to the first visited prefix and may clip boundary
segments. No new strategy or production edit is authorized by this comparison.

The exact-order control reproduces 20,189 total / 90 target evaluations. Across
the common 83 completely visited original segments [4.663316582914573, 8],
control work is 269,342 versus candidate 195,752 (27.3% less), including the
candidate's 1,287 newly needed refinement units. Static work is 184,454 versus
128,700, interval work 84,888 versus 67,052, and directional axes 152,239 versus
97,046; membership is identical at 138. This demonstrates genuine transfer of
the component improvement, separate from the preceding obstacle pair's 12,092
saved work. It does not complete the full goal.

The expensive original segment is number 115,
[4.623115577889447, 4.663316582914573]. The candidate completes it using 158,944
work (83,611 static and 75,333 interval); the control exhausts after only a
partial 116,384 inside this segment, leaving a frontier at 4.643216080402009.
Those two costs are not comparable complete intervals. The candidate proceeds
through segment 114 and exhausts in 113, with unresolved frontier at
4.542713567839196. Evidence: `tmp/capacity/component-transfer-profile.log`.
Independent review and the root accepted this as a validated owner improvement,
with the full G4 gate still red. The next bounded replan may only diagnose
repeated static/interval work in original segment 115; it does not authorize
sample/pose reuse or another production change without measured counts and
review of the exact ownership/identity contract.


### Exact segment repetition diagnosis

Step card: method owner, current component baseline `979ca24ad`, original
segment 115 only. The permanent opt-in `segment-repetition-profile.test.ts`
executes every static and interval query with the original settings and 500,000
work guard. It records exact ordered geometry identities, complete poses,
original segment/time, threshold, tolerance and iterations; interval identity
also includes the complete witness. Binary64 negative zero is distinguished.
Repeated completed inputs must produce identical complete outputs. Actual
static/interval work and original/refinement preparation are recorded separately.
Reported duplicate work is an optimistic upper bound before any lookup or
identity cost, not an implemented saving. Exceptions are not reusable evidence.
No production, cache contract, temporal schedule, severity rule, or full goal
gate changes are authorized. Run with `SIM_CAPACITY_DIAGNOSTICS=1` and the exact
file, retaining its twenty-second guard. Review the measured ownership and
identity contract before proposing any reuse.


The passive case completes seven evaluations/four clear leaves in 172,486 work:
3,176 original preparation, 10,366 refinement, and exactly 158,944 query work,
reproducing the complete original segment's full-run cost. Thirteen static
calls contain eight exact-input repeats costing 52,522. Ten interval calls
contain three exact-input repeats costing 23,045. A separate positive-admission
comparison that omits the rest of the witness finds the same three calls and
cost, so no additional witness-equivalence assumption is needed for these
observed repeats. All repeated complete outputs agree. Combined repeated work
is 75,567 (47.5% of this segment's query work), before lookup/identity/checkpoint
costs. This does not estimate whole-workload completion or authorize a cache.
Focused diagnostic, app typecheck, focused ESLint and naming 11/11 pass.
Evidence: `tmp/capacity/segment-repetition.log`. The first attempted diagnostic
assertion referenced a nonexistent snapshot budget field; the formal resource
profile owner now supplies the unchanged 500,000 limit explicitly.


### Subdivision evidence ownership card

Objective: eliminate demonstrated repeated completed work inside one original
segment while preserving the complete temporal/severity contract. The root approved this bounded card and its explicit Inspector/spec update;
it does not permit a generic pose cache. Direct owners
are `continuous-query.ts`, the original-part kernel adapter and its existing
mesh budget owner; direct tests, manifest/spec and Inspector wording are the
only accompanying edits. No domain, geometry, threshold, version-history or
budget changes; no cross-segment or cross-query evidence retention.

The proposed original-only capability has two explicit lifetimes:

- A node records each successfully completed start/middle/end DistanceEvidence.
  Only when it actually subdivides does it hand start/middle to its left child
  and middle/end to its right child. Children still visit samples in exactly
  the existing order and preserve the original best-witness and penetration
  rules. Original segment roots carry no inherited evidence. The node artifact
  contains endpoint time and complete evidence, never poses or a pose-key map.
  Uncompleted/null calls are never handed off. Each actual inherited read pays
  one mesh work unit and a fresh cancellation checkpoint before returning it.
- The original kernel explicitly declares eligibility only on its actual
  `lowerOver` mesh route (at least one side is a mesh). That interval lower
  certificate depends on a positive static lower bound for containment
  admission, but not the witness axis, upper bound or other witness metadata.
  A completed early certificate (including zero) is reusable only within that
  same node and only when both original and final witnesses have positive
  lower bounds. Zero admission is not a complete certificate; null is exhaustion.
  Each successful certificate handoff likewise pays one unit/checkpoint. If
  either witness is not positively admitted, the final query stays unchanged.
  Generic/primitive kernels opt into neither lifetime and retain their current
  sampling, certificate calls and witness dependencies. Native/native shapes
  inside the original-part adapter use witness-axis separation and must never
  opt into the interval-certificate handoff; method identity alone is insufficient.

The reuse operation must charge through the same `OriginalMeshQuery` budget
owner and use the adapter's existing MeshWorkLimit-to-null boundary. A failed
charge cannot publish a witness or certificate; established earlier evidence
and unproved lower-zero/unresolved behavior remain unchanged. Node evaluation,
retained-leaf, wall-time and cancellation budgets are not reduced. Evidence is
released with pending node ownership and never retained in immutable geometry
preparation. Snapshot, ordered pair, settings and kernel are fixed for the whole
query; original segment plus exact parent/child endpoint construction establishes
identity without fuzzy numerical comparisons or cross-keyframe equality.

Proposed Inspector cache-dimension addition for review: “Completed static
evidence may be handed from a parent to its children only within the same
original segment and original-part pair invocation; a completed same-node
interval certificate may be handed to final certification only under that
kernel's positive-witness admission contract. Each handoff charges owned work
and checks cancellation; no poses, cross-segment results or query evidence are
retained beyond the pending-node lifetime.” The existing immutable preparation
rule remains intact. The direct method spec must explain these two lifetimes
and preserve the requirement to consume remaining samples after unsuccessful
early clearance, including warning-to-later-penetration cases.

Formal red oracles precede implementation: parent/child endpoint actual calls
and exact evidence against a no-handoff control; repeated midpoint ancestry;
separate original segments sharing a timestamp cannot share evidence; same-node
positive-admission lower calls two-to-one with independent rational enclosures;
zero admission followed by positive admission still recomputes; generic
witness-axis-dependent kernels and original native/native pairs still recompute; threshold equality/contact,
midpoint and endpoint penetration, reversal and deterministic reruns; changed
source/pose/settings and fresh query produce fresh calls. Budget/cancellation
oracles exercise each handoff and prove no unpaid result publication, unchanged
node evaluation counts, and preservation of already completed witnesses.
Permanent tests must assert actual charged reuse work, not only output equality.

Gates: focused correctness/work/lifecycle, independent review, unchanged
10,000/50,000/576 and two-window work gates, then the current exact segment
profile and one full representative gate only if prior gates pass. The full
500,000 representative remains decisive and red until a complete result is
actually obtained. No browser rerun before that milestone. If the proposed
lifetime conflicts with Inspector/product semantics or materially changes
complete evidence, stop and revise the card; do not hide it by weakening tests.


Readiness review corrected one eligibility boundary before implementation:
original native/native queries use witness-axis separation, so only the actual
mesh `lowerOver` route declares positive-witness-only dependency. Inspector and
spec now express that exact restriction. The first formal run was five red and
two green tests (`tmp/capacity/handoff-red.log`): repeated work and missing paid
handoffs failed, while native-axis and changed-admission protection already held.
The implementation adds two optional kernel capabilities, explicit child endpoint
evidence fields, and one actual mesh-budget handoff operation. No result map or
pose artifact is created.

Focused synthetic source-independent evidence has 13 static / 10 interval calls
without handoff versus 5 / 7 with 11 charged handoffs; the complete result is
identical, including seven node evaluations. It uses dyadic sphere radii and
independent rational separation bounds. Additional tests cover original segment
separation, fresh queries, changed source/pose/settings, reversal, later
penetration, native axis dependence, nonpositive-to-positive admission, unpaid
handoffs and cancellation. The complete original segment source oracle compares
all PairEvidence fields against the same current kernel without handoff and
passes: 172,486 becomes 96,930 total work. Original/refinement preparation remains
13,542, query work is 83,388 including eleven handoff units, and no exact repeated
static or interval calls remain. This is a 47.5% reduction of that complete
segment's query work, with original sampling decisions and four clear leaves.

The unchanged 10,000/50,000/576 and two-window gates pass (14 tests), as do source,
motion, lifetime and independent mesh oracles. Typecheck, focused ESLint and
naming 11/11 pass; the regenerated Inspector catalog passes 8/8. Evidence is in
`tmp/capacity/handoff-owner-gates.log`, `handoff-source-equivalence.log`,
`handoff-segment-profile.log` and `handoff-final-focused.log`. Independent code
review and the subsequent full representative gate are the remaining boundaries;
G4 is not yet complete.


The independent production review passed and separately reran 26 tests. The
unchanged full gate still fails complete coverage: 500,197 accounted work,
20,234 evaluations, first partial joint-2/obstacle-11 at 135 evaluations. Its
397,818 work includes 279,895 static, 117,903 interval and 20 paid handoffs.
The preceding obstacle-10 remains 17,357. This improves the previous 20,195
whole / 96 target evaluations but is not complete G4. Evidence:
`tmp/capacity/handoff-full-representative.log` (8,111 ms). No browser run follows.

Direct diagnostic compatibility: the historical component transfer comparison
and the six existing historical hierarchy/bounds adapters (component, SAH,
rotation, reverse traversal, triangle bounds, source-node bounds) explicitly use
`evidence-recomputation-control.ts` to retain pre-handoff temporal behavior.
Their previous refinement controls remain intact. This preserves the recorded
hypothesis isolation and median control's 20,189 / 90 prefix. Current source
profiles, segment repetition and actual representative/sibling goal gates keep
current production. The helper is test-owned and never used by runtime code.

Historical replay closure: the six selected second-two adapters pass; the
component-transfer median control again reproduces exactly 20,189 total and
90 target evaluations. Focused closeout typecheck, ESLint and naming 11/11 pass.
Logs: `tmp/capacity/handoff-historical-replay.log`,
`handoff-transfer-control.log`, and `handoff-closeout-*.log`. The completed
handoff slice is frozen for scoped review/commit. The next discovery is limited
to the new actual original-segment frontier and completed-query cost attribution;
no new production strategy follows directly from the partial aggregate.


### Actual frontier cost attribution card

Method owner, baseline `fcbb00605`: one passive replay of the original ordered
representative input with the unchanged 500,000 budget and twenty-second case
guard. The test must reproduce 20,234 whole / 135 target evaluations before
interpreting costs. Instrument only the existing public query, kinematics,
preparation, membership and axis operations; do not inject a new production hook.
Each static row captures its exact input time and original segment, each lower
row its exact interval, and each records complete output or MeshWorkLimit plus
actual work. Static callbacks do not reveal parent node intervals; the profile
must not invent these from the most recent interval. Handoffs get their own
work counter, without borrowing a recent pose/time. All errors propagate.

Output is bounded to segment totals, largest completed queries, the actual
exhausted query and nearby final leaf intervals/severity. Unvisited pending
unresolved leaves are distinguished from the actual exhausted input. Separate
median/refinement preparation, membership, axis and residual traversal costs;
world-bound reconstruction counts are CPU observations, not savings in logical
work. Compare only completely visited identical original segments against the
retained baseline; do not compare partial aggregate costs. The next isolated
probe, if needed, is limited to that actual frontier original segment. No
production strategy, schedule change or new cache follows from this diagnosis.

The isolated segment 74 probe retains the same original endpoints and separates
its cold preparation from query work. Its added passive axis attribution uses
the actual threshold argument (clearance versus zero penetration search) and
actual completed projection rejection, not a guessed witness phase. First
warning work also accounts for the initial canonical source representative
upper witness before tracking improving convex results. No query is skipped.

The same segment-only attribution additionally registers exact original and
refined Bounds object identities as node or triangle bounds. It separates
actual projection attempts/axis charges/rejections by that source level and
records projection/convex elapsed time as a supplementary CPU signal. A
triangle-level rejection avoids one convex call after its triangle-pair tick
has already been paid; node rejection can avoid descendant work. Unknown
metadata is reported separately, never guessed from bounds values. This is
passive accounting, not authorization to remove any rejection policy.


The passive replay reproduces 20,234 / 135. Its actual exhausted call is the
static endpoint at 3.0150753768844223 in original segment 74
[2.9748743718592965, 3.0150753768844223], consuming only its remaining 1,008 units;
that partial call is not comparable to a complete query. The segment's retained
leaf is finding from an already completed midpoint witness; earlier pending
segments remain unresolved. The common 85 completed segments 114–198 cost
262,790 including handoffs, versus the retained 378,588 (30.6% less).

The isolated complete segment costs 42,963: 13,542 cold preparation and 29,421
query work. All three static results are positive-lower warning witnesses,
without penetration; final interval lower is zero. Actual warning arrives late:
only 119/162/196 static work remains after it. Complete triangle-level projection
performs 5,226 charged axes, zero rejections and zero avoided convex queries;
node/root projection performs 8,847 axes and 50 rejections. Exact source-bound
metadata has no unclassified calls. Projection CPU is supplementary: roughly
19 ms for triangle axes, while interval convex calls consume roughly 373 ms in
this recorded run. Evidence: `actual-frontier-profile.log`,
`frontier-segment74.log`, `frontier-segment74-phases.log`, and
`frontier-segment74-levels.log` under `tmp/capacity/`. No production policy changed.

### Final triangle projection policy probe

Reviewed bounded hypothesis: retain complete source root/node pose-axis rejection
and every existing charge; at the final original triangle pair only, compare
cheap world-gap rejection followed by the unchanged complete convex query
against the current additional pose-axis attempt. No descendant work remains
at that source level. A test-owned adapter must identify exact original triangle
Bounds objects, never infer from leaf size or treat a four-triangle leaf as a
triangle. It may return no additional certificate at that exact optional call;
all actual triangle ticks, convex queries, geometry and thresholds remain owned
by current production. No source shape is replaced and uncertainty cannot turn
into fabricated clearance.

First compare the same segment 74 source and settings with current control,
including complete evidence, actual work, axis attempts/rejections, convex call
counts and CPU. Repeat the cold case in alternating order to expose warm-up
noise; elapsed time supplements fixed logical work and the unchanged twenty-
second guard. Require no increase in complete convex calls on this measured
zero-rejection case and report all repeated timings rather than choosing the
best sample. Then run the existing 10k/50k/576 and two-window tests through the
same test-owned adapter, preserving their assertions and original guard. If
any required correctness or cost gate fails, stop/replan; do not redefine units,
tune axes, or claim success merely because fewer axes were charged. Production
requires a separately reviewed formal red/correction card after this evidence.


### Final triangle projection policy - validated owner correction

The method-owner correction retains root and hierarchy-node pose-axis rejection,
but final original triangle pairs now use the existing world-gap test followed
by the complete convex query. Both original triangle work charges remain intact;
no source triangle, precision setting, threshold, sample order or native route
changes. The implementation allowlist is the two original-mesh query call sites,
the method manifest, their direct formal tests and source diagnostics, this plan,
the method spec and the exact Inspector projection.

The test-owned pre-policy probe used source `7a889ff27`. Its three alternating
cold control/candidate timings were 599.6/547.2, 571.6/543.6 and 548.3/520.3 ms.
These are recorded experiments, not old-policy runs performed by current tests.
For complete original segment 74, PairEvidence was identical; total work changed
from 42,963 to 37,737, eliminating 5,226 actually unperformed triangle axes.
Convex calls remained 1,742 and node axes remained 8,847. The predeclared median
CPU regression ceiling passed. Formal production-route red/green, cancellation,
the original 576/10k/50k ceilings, both fixed windows and source/rational/motion
controls passed; independent review also ran 25 passing tests.

The unchanged full representative gate remains red: 20,237 whole evaluations,
138 on the first partial joint-2 / obstacle-11 pair, and 500,197 observed charged
work at exhaustion. The original ceiling remains 500,000. Its 9,760 ms partial
run is not directly comparable with the prior partial run's elapsed time, and
three additional evaluations are not proof of complete coverage.

A separate bounded complete-prefix control supplied the missing transfer evidence.
The candidate file was saved exactly; only the two current-task call sites were
temporarily restored to the verified pre-policy behavior for the permanent
comparison, then restored with exact SHA-256 verification. The same 85 original
segments 114 through 198 produced 90 leaves equal in every field. Charged work
was 262,790 versus 219,923 (16.31% less), including unchanged refinement 1,287,
membership 138 and handoff 19. Convex calls were 14,264 versus 14,289; observed
same-prefix query time was 5,604 versus 5,313 ms, with convex time 4,503 versus
4,386 ms. Logs are `triangle-transfer-control-complete.log` and
`triangle-transfer-candidate-complete.log` under `tmp/capacity/`.
The current exhausted query is an interval in original segment 71,
[2.8542713567839195, 2.8944723618090453]. These complete-prefix measurements support
accepting the owner improvement, while G4 remains open.

Current triangle-policy diagnostics measure current production, with pre-policy
values explicitly labeled as recorded data. The actual-frontier and component
transfer diagnostics likewise state their current geometry policy; their old
evaluation counts remain historical observations rather than claims that the old
full solver was rerun. No production history switch or copied solver was added.
Final direct compatibility tests (30), typecheck, scoped ESLint, naming (11) and
catalog projection checks passed. No browser gate was rerun.

Closeout review caught an accidental overwrite of this plan with a test file
before remote push. The full pre-policy plan was restored byte-for-byte before
this bounded result section was appended; existing DoD, rejected hypotheses and
accepted decisions remain preserved. No production or formal test was reverted.
The next possible witnessed-zero derivation still requires its own exact
Inspector/spec readiness and formal red tests; it is not implemented here.

### Witnessed-zero interval certificate - bounded readiness card

Owner: R0 Inspector `method`, complete continuous evidence. Inputs remain the
validated detached pair snapshot, shared domain kinematics, fixed settings and
owned execution budget. Output remains the same bounded PairEvidence; failure
belongs to `method`. This replan follows the accepted final-triangle correction
at `6862daf58` and restored plan at `d735bd45d`; G4 remains red at the unchanged
500,000 ceiling. Discovery is limited to the current continuous node, original
mesh lower adapter, their direct formal tests and existing frontier evidence.

The first unnecessary owner work is a full interval mesh certificate whose exact
completed result is already implied by an admitted static witness. The current
mesh `lowerOver` returns either zero or a strict lower bound above the configured
threshold. A completed full-source static upper bound at a time inside that same
interval, at or below that threshold, excludes the latter result. Therefore zero
is the exact threshold-certificate result, not a guessed contact or clearance.
Native/native interval kernels can return a positive value below the threshold
and are excluded. Raw `lowerOver` callers do not establish temporal provenance
and will retain their current implementation.

Proposed boundary: only the continuous node may request this derivation after it
has consumed a non-null witness from its own static samples or approved same-
segment endpoint handoff. Its ordered pair, geometry, settings, original segment
and invocation remain fixed, and witnessTime must lie in the node's closed
interval. An explicit original adapter capability checks the actual mesh route.
It returns zero after one owned work unit and cancellation checkpoint, undefined
for an ineligible native route, and null on exhaustion. The existing lower route
handles misses. Each derivation is newly charged; no map, retained pose, new
geometry cache or cross-node/cross-segment result lookup is introduced.

Derivation occurs only where the current node requests its early or final
interval certificate. It never ends the remaining static sampling on a warning;
all current sample order, penetration priority, temporal evaluations, leaf caps
and exhaustion handling remain. A failed derivation charge cannot publish a
successful interval result; already established static witnesses still survive.
Static point intervals retain their existing static lower bound.

Proposed internal names are method-owned `deriveZeroLower` and
`chargeEvidenceDerivation`; they are not persisted identities. The pending
1.0.2 release remains the version owner, and immutable older artifacts are not
rewritten. Allowed implementation files are continuous-query.ts,
original-part-method.ts and original-mesh-query.ts, their direct methods tests,
the method manifest/spec, this plan and the exact Inspector projection. Shared
domain, triangle algorithms, precision, budgets and source fixtures are excluded.

Formal test-first gates: zero lower from a strictly below-threshold or exact-
threshold completed source witness; remaining samples still upgrade an earlier
warning to penetration; native axis-sensitive lower remains unchanged; no
cross-segment/pair/settings evidence; exhausted derivation cannot succeed; and
actual original mesh calls/work match independently queried lowerOver output.
The source route must prove saved traversal work and separately count every
derivation charge even when lowerOver is not called. Existing rational mesh,
subdivision, motion, cancellation and 576/10k/50k ceilings remain unchanged.
After focused correctness/work gates and independent review, compare the same
complete current frontier segment and existing fixed windows before one full
representative run. No browser run until that source gate is green.

Self-review: the implication concerns only a threshold certificate at its
provenance owner, not a first-warning severity shortcut. The thin spec and exact
Inspector must agree before formal red tests or production edits. Stop on any
native-route leak, invalid witness provenance, lost charge, changed completed
evidence or failed fixed ceiling; do not retune prior rejected candidates. This
card records readiness only until independent review accepts it.

Independent readiness review passed. The existing completed-lower handoff keeps
priority over a final zero derivation; exactly one operation is consumed and
charged. Formal cases additionally require upper above threshold to use the
original lower route, and an out-of-interval near witness followed by a genuinely
clear source interval to prove temporal isolation. Early equality derivation
must still consume the remaining samples. Naming baseline passed 11 tests and
the regenerated Inspector catalog passed 8 tests before formal red work.

Formal `witnessed-zero-work.test.ts` detected the missing owner operation:
6 failures and 5 passing controls before production. The three bounded owner
changes then passed all 11 cases, including independent raw full-source
lowerOver results, both ordered pairs, native positive lower below threshold,
out-of-interval source isolation, equality, later penetration, actual one-unit
charge and cancellation. Existing direct 9-file gates passed 68 cases, including
the original work ceilings and subdivision/source evidence. No raw lowerOver
implementation, static sampling order or numerical bound formula changed.

The permanent `witnessed-zero-source-work.test.ts` compares exactly the current
source route with only this derivation disabled, using the same admitted input
and budget. Both complete fixed windows preserve every PairEvidence field:
window [2,3] costs 179,454 versus 152,833; [4,5] costs 196,189 versus 183,208.
Each candidate derives 23 certificates and charges all 23 units. Static costs
remain 135,258 and 135,947 respectively. Observed CPU is 2,547/1,502 ms and
3,689/3,293 ms; these are local timing observations, not hardware acceptance.
The true frontier segment 71 remains 24,467 in both routes with no eligible
derivation; the window savings must not be attributed to that specific query.
All three controls and candidates complete, and per-run static + interval +
handoff + derivation charges equal the actual context work exactly.

Current representative/frontier profiling now separates derivation charges and
includes them in pair/prefix totals even when no lowerOver callback occurs.
The current triangle-policy profile keeps its original work/axis/convex ceilings
while permitting fewer actual operations after a valid certificate derivation;
it still requires real node rejection and source convex work. No complete G4
or browser rerun has occurred at this checkpoint; independent code review and
the remaining direct gates precede any new full-run claim.

Independent production review passed with 26 independently rerun small cases.
The warranted full representative gate nevertheless remains red: total observed
work 500,197, whole evaluations 20,240, first partial joint-2 / obstacle-11 at
141 evaluations and 75 clear intervals. Derivation calls and charged units both
equal 456. The dominant pair uses 398,216 units: static 310,392, interval 87,745,
handoff 21 and derivation 58. Two earlier obstacle-17 pairs each derive 199 times
and together save 398 units, so three added target evaluations alone do not prove
equal-prefix transfer. The 8,239 ms elapsed time is a partial-run observation.
Evidence is `tmp/capacity/witnessed-zero-full-representative.log`; no browser run.
Production is frozen for root evaluation of this bounded improvement.

The current frontier profile now records the accepted pre-derivation counts as
historical metadata and expects the observed current 20,240/141 counts. The old
pre-triangle assertion-only environment selector has been removed: its recorded
temporary source-restoration experiment is historical, and restoring only two
triangle call sites would no longer reproduce that older complete method after
this new derivation. Current goal gates remain selected with their original
coverage and resource assertions; no diagnostic is claimed as a G4 pass.

The requested bounded complete-prefix control now passes in the permanent source
test's `commonPrefix` case. Both runs cover exact original segments 114 through
198, produce 95 evaluations and 90 leaves equal in every field, and charge the
same cold preparation lifetime. Total work is 232,178 versus 218,840 (5.74% less):
static 149,346 and handoff 19 stay identical; interval work falls from 82,813 to
69,459, with all 16 new derivation units included. The earlier full-run prefix
already had original preparation paid, whereas this isolated comparison includes
12,255 additional preparation units on both sides; these are not interchangeable
baseline totals. Observed same-input time is 5,287 versus 4,772 ms. Both complete
leaf arrays and all charged categories are retained in
`tmp/capacity/witnessed-zero-prefix.log`. No further full or browser run occurred.
This supports a bounded canonical improvement, not completion of G4; any next
iteration must begin at the actual new frontier rather than partial aggregate
CPU/evaluation counts.

### Current frontier - existing source representative seed diagnosis

Owner remains Inspector `method`, complete original source evidence. Root
authorized one passive exact-frontier replay under the unchanged 500k/20s guards
to answer the missing operation/time question, not another hopeful goal run.
`current141-frontier.log` reproduces 20,240/141 evaluations: the exhausted query
is static, original segment 67 at 2.693467336683417, after 2,292 remaining work,
1,025 node axes and no convex call. Its initial source upper is 1.0397306474722536.
The largest complete static query at segment 114 time 4.582914572864322 costs
6,148: first warning at 5,986 and 162 work afterwards. Its complete witnessed
upper is 0.010714356302402587. This is actual phase evidence, not an inference
from partial aggregate CPU or evaluation totals.

The bounded hypothesis uses only existing admitted closed-component source
representatives: whether their actual point pairs can establish a legal warning
upper before triangle traversal, allowing the unchanged complete penetration
search to start with threshold zero. This is not a first-warning exit and would
not guarantee the same final witness; any later implementation would need its
own observable-evidence/version review. No production edit is authorized here.

Diagnostic scope is exactly those two static times on the original joint-2 /
obstacle-11 pair. Run each original query to completion with its unchanged
source/index/settings and fresh budget, then measure complete source-point
distances from the actual prepared index representatives. All 36 + 5 transforms
and 36 x 5 point-pair norms are counted separately, one work/checkpoint per actual
operation, with an immediate combined 500k guard. Existing baseline preparation
and query costs remain charged. This conservative probe does not claim to reuse
membership transforms merely because it calls the same helper.

Permanent test boundary is `methods/__tests__/component-seed-profile.test.ts`;
the only other edit is this plan. Capture exact source index/pose identity, the
baseline completed evidence, candidate legal upper and full added work. If no
candidate upper is strictly below the current threshold, stop this hypothesis;
do not expand to all vertices, select new representatives or change the fixture.
A positive result is only admission to a reviewed actual-delta experiment, not
permission to accept changed witnesses or bypass full penetration traversal.
The existing Inspector source-witness and no-pose-retention contracts are
unchanged; no new cache dimensions or product identities are introduced.

The passive hypothesis is rejected. Both original static queries complete and
the exact 36-by-5 existing representative sets are checked: frame 67 has minimum
point-pair upper 0.1545195846814336; frame 114 has 0.12632201793555548. Neither
reaches the 0.02 warning threshold, despite improving the first-representative
upper near 1.04. Each adds 41 actual point transforms and 180 actual norms, all
221 units counted. No threshold-zero search could begin from these witnesses,
so an actual-delta experiment would have no supporting admission evidence.
Original completed source results remain finding without penetration, upper
0.007203098142746448 and 0.010714356302402587 respectively. No production change,
alternate representative selection or all-vertex scan follows this negative.

Permanent replay: set `SIM_CAPACITY_DIAGNOSTICS=1` and run the app test command
for `src/analysis/methods/__tests__/component-seed-profile.test.ts`. Its two cases
assert the negative warning admission and retain the entire added-work count;
logs are `tmp/capacity/component-seed-profile.log`. This is an explicitly opt-in
rejected hypothesis, while the ordinary representative capacity gate stays red
and selected. The separate exact-frontier replay also passed its current numeric
expectations without a full-goal completion claim.

### Completed source witness transport - passive readiness

Objective: test whether an already completed nonpenetrating source witness can
provide a legal upper seed at the next actual sample, without treating its old
distance as evidence at the new pose. Owner is Inspector `method`; only a new
permanent methods test and this plan may change. Production, cache dimensions,
sample order, full penetration traversal and observable witness policy stay fixed.

Cases are frozen to segment 114 start-to-middle and segment 74 middle-to-end,
whose completed source witnesses appear in `current141-frontier.log`. Capture
the actual ordered geometry identities, old static poses and complete world
witness enclosures from ordinary queries. Outward inverse-transform each whole
enclosure, then forward-transform it at the new static pose and use the outward
norm upper only. Never use a midpoint, penetration witness, lower certificate,
different segment or old result as the new result. Charge one admission check,
two inverse transforms, two forward transforms and one norm: six actual units
per eligible transfer, one on rejection, under the combined 500k/20s guard.

Oracle: independently known dyadic source coordinates under cardinal and exact
normalized rational rotations must remain enclosed, including asymmetric wide
input enclosures; exact rational squared distance bounds test the upper. The
two passive source cases retain unchanged full baseline queries and report the
transported upper, all added costs and first-warning work before the target.
No membership transform reuse is assumed. Stop on invalid provenance or no legal
early warning; any positive result still needs a separate actual-delta and
observable-evidence review before production. Reviewer approved this mathematical
protocol; no source triangle/barycentric API expansion is part of this probe.

The independent oracle passed three cases before the two passive source cases
were enabled; all five then passed. Transported upper is 0.016053481245753624 at
segment 114's midpoint and 0.00802329653171193 at segment 74's endpoint, both below
0.02, each with all six added units. Baseline target work is 5,168 and 6,092;
first-warning work 5,049 and 5,902 is only an avoidable-work upper limit, not an
actual saving. The original source query results remain untouched. Evidence is
`tmp/capacity/witness-transport-profile.log`, with the numerical oracle in the
same permanent `witness-transport-profile.test.ts` (source profiling is opt-in).
This positive admission supports review of an actual-delta/observable-contract
proposal only: a new seed may change which legal witness wins, so complete
PairEvidence equality cannot be silently replaced by classification equality.

### Transported witness - bounded actual-delta diagnostic

Objective: measure the actual traversal effect of the two reviewed seeds,
without production edits. Scope is a test-owned shared transport/interception
helper, its unchanged existing mathematical oracles, one new diagnostic test
and this plan. Cases stay segment 114 start-to-middle and 74 middle-to-end.
Each candidate must first compute its source witness in the same real query
context and pay all original source/preparation work. The target then pays all
six transport units through the existing owned tick before its ordinary distance
call. Intercept only that call's existing private witness() values, restoring
the method in finally; do not copy the solver or change original traversal.

Observable oracle, reviewed against version 1.0.2's nonunique valid witness
contract: the two targets must preserve threshold classification, penetration
and query time. Old axis, lower, convergence and iterations are not transported;
the unchanged solver establishes them. New upper/lower/witness coordinates may
differ but must be finite ordered conservative bounds; overlap with baseline
bounds is only a consistency check, never independent truth. Preserve existing
full-field equivalence tests. Add an exact dyadic closed-box squared-distance
seed-path oracle and a later-component penetration case before actual source
deltas, so a warning cannot hide penetration. Source-point upper validity follows
the independently checked whole-enclosure transport; lower validity retains the
original full-source certificates. No general plain-DistanceEvidence admission
API is implied by this controlled frozen-geometry/static-unit-pose prototype.

Report source, target, added and total work plus convex calls and CPU for control
and candidate. Original 500k/20s guards remain; neither setup nor warm preparation
is free. Stop on changed classification/penetration, invalid bounds, missing
provenance or no net material benefit. A positive result requires a separately
reviewed production ownership/provenance card; no full/browser run follows this
diagnostic directly.

The exact source experiment has material target savings: segment 114 target
5,168 to 2,058 units, convex calls 386 to zero; segment 74 target 6,092 to 2,451,
convex calls 448 to two. Each includes all six added seed units. Paid work before
the target remains exactly 19,690 and 25,143 on both sides. Complete segment work
is 30,453/27,343 and 31,236/27,595, with observed CPU 150/108 and 145/105 ms.
Target numeric witnesses are explicitly different: 114 upper rises from
0.015552252265540694 to 0.016053481245753624 and lower changes; 74 retains its upper
but lower changes. Both remain nonpenetrating findings with valid source bounds.
The complete PairEvidence for both segments nevertheless remains equal in every
field, and the new diagnostic asserts that stronger observed equivalence.

Independent seeded-path cases passed for the exact dyadic box gap squared under
both hierarchy modes, later-component penetration despite a warning seed, and
finally restoration after budget exhaustion. The original three transport
oracles retain their behavior after shared test-helper extraction. All actual
source inputs remain immutable controlled snapshots and domain static poses;
this test interception does not grant general admission to plain DistanceEvidence.
Evidence is `tmp/capacity/witness-seed-profile.log`. No production edit or broader
capacity/browser gate has been performed; independent diagnostic review precedes
the next explicit production readiness decision.
