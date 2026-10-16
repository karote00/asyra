# Persisted Flow Results and Warning Supersession

Status: DONE - implemented, reviewed, merged and accepted.
Completion date: 2026-10-17 (Asia/Taipei).
Closeout owner: Flow Inspector follow-up owner.
Integrated base: `8b92a50fc0632505e321b1a413f3dd2204559785`.

## Final decision

The user accepted the complete persisted-result lifecycle and requested plan
closeout. PR #339 merged at the integrated base above. Its final head
`14723f5d0cae8887ece343dee895827421e2e9c7` has successful executed GitHub checks;
scope-skipped checks remain skipped, not executed product acceptance.
The original task contract and selected-base analysis below preserve design
history. They do not reopen completed work. Living behavior remains governed by
[Core Proof](../../CORE_PROOF.md#persisted-result-lifecycle).
There is no automatically scheduled implementation stage.

## Task contract

Deliver one complete stage in which existing test producers publish durable flow
execution evidence and Flow Inspector only reads, classifies and presents it.
Results must remain usable when the Inspector was not running, after restart,
and when transferred from CI. Corrected invocations must retire superseded
execution warnings without deleting or rewriting their original records.

This is the explicitly requested follow-up to PR #338, grounded in main
`042656118b81f7552ea2f1d612100051da5436f6` and the retained Delete/Group acceptance
runs. Scope is existing observation producers/readers, Board and compact-summary
consumers, CI evidence transport/aggregation, their formal tests and owner docs.
No new runner coverage, inferred root causes, automatic repair, test scheduler,
Agent session system, arbitrary command execution or broad CI redesign.
Do not split delivery into per-case PRs. No implementation, test execution,
commit or push is authorized by this planning document alone.

## Product and ownership

1. Flow definitions own architecture: nodes, routes, specifications and declared
   implementation boundaries. Tests never rewrite these definitions.
2. Test runners own execution, including optional native watch behavior. Existing
   adapters/reporters publish flow execution results from that same invocation.
3. Persisted run records own original evidence, source/configuration identities,
   intended test scope, actual observed cases and execution outcome. An optional
   derived index must be rebuildable, never a second mutable status authority.
4. One reader owns current/history classification. Board, AI summaries and CI
   projection consume that classification instead of independently deciding it.
5. Inspector startup loads available retained evidence; live refresh notices new
   or completed records. Existing polling is acceptable. Native filesystem watch
   is an optional optimization, not a prerequisite or a test trigger.
6. Explicit rerun controls remain optional producers. Viewing, restarting,
   importing, aggregating or refreshing results never launches product tests.

## Implementation at the selected base and verified limits

- `localization.cjs` writes per-run JSON under `tmp/flow-inspector/test-results`,
  uses atomic writes and rejects overwriting completed observations. The reader
  discovers files and reuses admitted data until file signatures change.
- The producer can run without the Inspector service. A new reader discovers
  retained records on its first read. This mechanism exists; the complete
  offline/restart/CI transfer acceptance chain still needs focused proof.
- `public/localization.js` polls the result API every 1500 ms and updates affected
  presentation when the response changes. It does not watch source files or
  start tests. Historical selection deliberately retains historical state.
- Playwright adapters are wired into existing Design functional/status and
  collaboration execution. The opt-in Vitest reporter observes the same runner
  and has repeated-run lifecycle handling; it is not universal test coverage.
- Current case recovery uses exact file/name/project identity. New stale or
  skipped observations do not establish failure recovery. Multiple current
  failures can keep a node highlighted after one case recovers.
- Warning retirement currently requires equal cwd, argv, environment and admitted
  manifest identities/digests, plus later clean mapped settled case coverage.
  Correcting a grep changes argv, leaving the old no-tests warning current.
- Compact API/CLI summaries already expose evidence, currentness, validated
  node/spec/implementation references and preview guidance with truncation limits.
- Evidence currently resides in ignored local storage; deletion of that storage
  loses availability. CI observation artifacts currently retain data for seven
  days. Persistence is not a promise of permanent archival or automatic sync.

## CI inspection at the selected base

`.github/workflows/e2e.yml` runs selected product suites once through existing
scripts, retains raw reports/observation JSON/attachments, and invokes
`workflow-results.cjs collect` on the existing reports. Collection does not
execute product tests. The collect envelope is passed as a workflow output.

`.github/workflows/main.yml` final `validate` downloads scope/workspace/check
artifacts and runs `workflow-results.cjs aggregate` with producer evidence and
job outcomes. This is read-only aggregation, not a second full product suite.
However, its flow-specific inventory explicitly lists only three representative
cases: Design Delete, collaboration Delete and collaboration Group Delete.
It is not a complete projection of every localized node. The final aggregate
does not currently download and classify the full Design/collaboration observation
artifact directories through the ordinary reader.

Separate tool-validation jobs are intentionally executable:

- `tools/flow-inspector` workspace validation validates the tool package.
- `design-e2e / flow-inspector-board` runs Board browser tests.
- Conditional `flow-inspector-validation` builds required App inputs and runs
  control-plane contract/integration tests, then `cli.cjs prove` and `candidate`.
  `prove` executes baseline, declared negative scenarios and baseline recovery;
  the default contract is `packages/factory/flow-contracts.json`.

These tool tests can execute bounded product fixtures to validate localization
and recovery. They must not be described as passive readers, but neither are
these commands a second run of the entire Design test suite. Preserve necessary
tool self-tests; do not remove them to claim zero execution for all CI jobs.
The zero-execution requirement applies to result consumption and aggregation.

## Result and supersession contract

### Preserve evidence; record intent before execution

Extend the existing result producer contract, rather than creating a competing
flow file format. Record the producer, repository/source context, runner/config,
project and intended case/suite scope before execution. Retain actual argv as
evidence, not as the sole operation identity or executable authority.

A rerun/corrected invocation carries a validated predecessor run reference and
its intended scope. An existing Inspector rerun supplies this automatically;
external producer entrypoints accept the same bounded reference. This reference
works without a live Inspector or an in-memory session. Repeated watch runs may
carry continuity through the producer; they must not republish cached passing
cases as newly executed evidence.

Do not infer correction from timestamps, similar command text, a shared directory
or arbitrary successful tests. A selection change is allowed only when the
producer can resolve it to the intended case/suite or an explicit correction
relation validates that change. Old zero-case records lacking structured intent
require one explicit correction association with supporting successor evidence;
there is no retroactive guess and no automatic deletion.

### Separate warning recovery from product recovery

Execution warnings and product assertion failures have separate outcomes.
Classify supported warning categories from the structured original report while
preserving original messages. Do not make retirement depend solely on matching English error text.

For a no-tests warning, a successor may retire it only when:

- its predecessor/correction relation and repository/config/project/scope are
  valid, non-cyclic and unambiguous;
- the predecessor is completed and the successor is a subsequent attempt;
- the successor completes and actually executes the intended cases, with valid
  source/mapping evidence and no unresolved execution problem for that scope;
- a partial selection cannot silently replace a broader failed execution intent.

A completed run with valid failed assertions can retire the no-tests warning:
test discovery recovered, while its product failures remain current. Passed
assertions additionally recover their exact case identities. Source edits alone,
empty/skipped-only runs, stale data, cancellation, unfinished runs or unrelated
success never establish recovery. Unknown warning categories remain unresolved
until an explicit category-specific rule exists; a correction reference alone
is not enough to suppress any arbitrary warning.

Preserve existing exact-scope automatic retirement where valid. Invalid or missing
successor evidence leaves warnings explicit. Persist additional associations
separately when needed for already-completed records; originals remain immutable.
A reader derives historical status with predecessor/successor links and reason.
Further failures become new current evidence; they do not erase the proven
history of earlier discovery recovery.

### Offline, restart and CI consumption

Use the same retained records and classification rules locally and in CI. Import
and startup validate identity, integrity and required artifacts; importing the
same run twice is idempotent, conflicting content is rejected. Paths in imported
evidence remain historical source references and must not authorize local reads
outside the repository or executable commands.

CI producers upload complete observation bundles even on test failure. Aggregation
reads the selected producers' bundles and validated job outcomes without launching
runners. Project every admitted case in those bundles; do not limit presentation
to the current three-case representative inventory. Preserve existing CI required
job/scope policy and pass/fail authority; richer localization must not grant new
passing authority or silently change which tests are required.

“All results” means retained results for the selected repository, source and CI
execution context, with explicit historical views. It never means mixing every
available branch/commit/job into one current verdict. Missing producer artifacts,
expired retention, interrupted jobs and not-selected scopes are explicit, not
successful or silently omitted. Do not reconstruct missing results by rerunning
product tests in the consumer.

## Complete acceptance conditions

1. With the Inspector stopped, run the existing mapped Group case against an
   injected feature fault and then a corrected source. Start Inspector afterward:
   latest is passing, original failure is historical, and no test is launched by
   startup. Tests and mappings remain unchanged during fault injection.
2. With Inspector open, newly completed results update the node and AI summary
   without reload. Repeated unchanged refreshes do not reread unchanged evidence
   bytes or execute tests. A source edit without a new result does not clear red.
3. Correct an actual no-tests invocation to the intended Group case. With Inspector
   stopped throughout, record the correction and successor. On startup the warning
   is historical with a visible successor and reason; no original bytes changed.
4. Repeat the correction with a real assertion failure: discovery warning retires,
   the Group node remains failed, and the summary exposes that assertion failure.
5. Unrelated success, different project/repository, partial coverage, missing or
   invalid relation, cycle, zero cases, skipped-only, stale, canceled and unfinished
   successors cannot falsely retire the warning. Other nodes/cases remain intact.
6. A later failure after a successful recovery becomes current without deleting
   the earlier successful result or resurrecting a superseded discovery warning.
7. Restart/reimport preserves classifications and links. Duplicate imports are
   idempotent; conflicting records, corrupt files and missing artifacts remain
   explicit. Historical selection does not pretend to be the current source.
8. CI bundles from existing selected producers yield the same normalized case,
   node and warning classifications as local consumption. Repository/base/head/
   integration/run/attempt context is checked; not-selected and missing evidence
   are distinct. Current branch views do not adopt unrelated CI success.
9. Include the existing Group case beyond the three representative CI cases to
   prove full admitted-result consumption. Product producer execution counts stay
   unchanged: aggregation/import/read starts zero test runners and does not use
   passing job status as a substitute for missing detailed evidence.
10. Board and compact API/CLI agree on current failures, historical warnings,
    replacement reasons and original evidence links. Keep existing summary size
    bounds, unavailable-mapping behavior and preview/confirmation permissions.
11. Formal tests assert actual runner invocation and file-read counts, not only
    output equality. Run focused regressions, the affected Board integration,
    CI transport/aggregation contracts and required scoped quality gates; do not
    rerun unrelated suites after unchanged inputs.

## Implementation entry and closure

Before production edits, review the existing localization, service and Board
Inspector steps and direct CI handoffs against this proposal. Update only those
owner contracts needed for the approved result lifecycle. Resolve concrete
schema/version admission and legacy-record association at those owners; no
new governance ledger or duplicate canonical status store.

Implement and self-review the complete stage before one delivery PR. Stop for
scope review if completion requires a new test scheduler, universal runner
integration, unrelated product fixes or a change to CI required-test policy.

Primary stage goal: durable test-produced flow results with consistent offline,
live and CI presentation and evidence-backed warning supersession.
Checkpoint completed: offline production, restart/import and real-use acceptance
are recorded below. Further features require a separate product decision.

## Implementation and acceptance evidence

- Producers accept version-1 exact-case requests; selected-case reruns retain intent
  and predecessor metadata. Vitest watch excludes cached, unexecuted modules.
- The shared reader derives current cases and warning history from immutable runs
  and optional explicit correction associations. Compact context retains recovery
  links after later passing results.
- Bundle export/import validates record and attachment integrity, exact execution
  identity and idempotency. CI consumes full bundles tied to the collected raw
  report while preserving existing required-test authority.
- Formal coverage: `observation-lifecycle.test.cjs`, `observation-files.test.cjs`,
  localization and watch regressions, workflow aggregation/CLI contracts, and the
  Board current/history integration case. File-read and child-process assertions
  cover unchanged refresh and passive consumption.
- Offline Group acceptance: Inspector PID 77649 was stopped before all three
  invocations. No-tests record `7c6b5986-0a52-4163-ac3a-d7a53e190b91` was superseded
  by the actual mapped assertion failure `4e64938b-a823-43da-8def-c8f38dc33082`.
  Restoring the feature produced passing record
  `87be42ff-5994-4168-b56b-622929508def`. Tests and mappings were unchanged.
  Restarting the service loaded passing current evidence and historical warnings.
  Raw reports, logs and results remain in this worktree's ignored
  `tmp/acceptance/stage-offline-*` and observation storage; they are local
  acceptance evidence, not portable committed artifacts.
- The earlier Delete no-tests record was explicitly associated with its already
  completed corrected successor; neither original was rewritten or rerun.

Limits: mapped runner coverage remains bounded; correction is explicit rather
than guessed; unknown warning classes do not gain new recovery rules. Local
storage and seven-day CI retention are not durable archival services. CI
aggregation and import are passive; tool proofs remain executable validation.
Stage review, final-head CI and the real-use checkpoint are complete. Continue
normal product use; additional features require a separate scope decision.

Local validation passed: lifecycle/bundle/localization regressions, targeted watch
and investigation-summary checks, producer/CI aggregation contracts, 108 CI
structure tests, 100 workspace contracts, 49 control-plane owner contracts,
Board current/history integration and inspected screenshots, naming, lint,
typecheck and build. Actual export/import retained eight observations and two
historical warning groups with zero current warnings. No product fault remains
in the source checkout.

## PR review corrections

The whole-stage review closed two gaps: equal argv can no longer bypass explicit
discovery correction or declared coverage, and startup/refresh now validate retained
attachments rather than trusting observation JSON alone. Missing or corrupt
attachments retain original records, invalidate derived locations and cannot clear
a previous failure. Formal regressions cover restart, live invalidation, restored
attachments, unchanged byte-read counts and post-hoc scope narrowing.

## Post-merge real-use acceptance - 2026-10-17

Accepted on the integrated base above in `.worktrees/flow-post-339`. This used a
previously unexercised existing feature, `apps/asyra-design/src/features/switch-primary-tool/index.ts`, and
the unchanged existing Chromium case `Tool Switching should switch to Rectangle
tool when pressing R key` in `apps/asyra-design/e2e/tool-switching.spec.ts`.
The existing case mapping is `functional.tool-switching.645a0034831c` and the
responsibility node is `design-functional / switch-tool`.

1. With Inspector stopped, inject a feature-only fault that forwards Select
   instead of the requested tool. Do not change tests or mappings.
2. The first hand-written anchored grep selected no tests. Preserve observation
   `0a8e321e-fbc4-4727-8be6-15dbd83da657`; this was an invocation error, not a
   product failure. Correct the selector with an explicit predecessor relation.
3. The existing test then fails with expected `rectangle`, received `select`,
   at assertion line 49. Observation `b3370576-20ba-4d3b-a62e-3850fc2d4064` was
   finalized while Inspector remained stopped. CI fail-fast also records an
   execution warning; this incomplete correction does not retire discovery.
4. Start Inspector. The retained failure maps to `switch-tool`. Its compact
   summary provides original errors, specification, feature/common-API entries,
   currentness and rerun guidance. The Board selects the same responsibility.
5. Follow those entries: the common API writes its supplied tool correctly;
   the feature incorrectly supplies Select. Repair forwarding to `tool`.
   Before any rerun, the latest observation remains failed.
6. Rerun the same existing case with the corrected invocation: one test passes
   in 2.9 seconds. Persist observation
   `94999bba-9ff8-4e21-b19f-76d96134befd`, retaining the original discovery
   predecessor and intended case. The already-open Board updates without reload:
   zero failures, zero current evidence problems, two historical warning groups.
   The fail-fast warning is replaced by complete same-scope execution; the
   no-tests warning is replaced by explicit correction with intended coverage.
7. The old failure summary becomes `superseded` and links to the current passing
   case. Restart Inspector again: all three records, the mapped passing case and
   both historical warning groups remain available. No consumer starts a test.

The feature fault was removed and the tracked worktree was clean after acceptance.
Raw reports, before/after/restart projections, summaries and inspected Board
screenshots are retained locally under `.worktrees/flow-post-339/tmp/acceptance/`;
immutable observations remain under that worktree's
`tmp/flow-inspector/test-results/`. These ignored files are local evidence, not
portable committed artifacts. UTC timestamps inside original observations are
preserved; this completion date uses Asia/Taipei.

### Evidence limits

This was not a blind unfamiliar-Agent benchmark: the same Agent selected and
injected the fault. It proves available localization context, not measured time
or token savings. Recovery reused the corrected producer invocation; the
summary's selected-rerun preview/confirmation path was not executed in this
acceptance. Existing formal coverage remains its evidence. This single case
neither expands mapped coverage nor establishes repository-wide product health.
CI consumption remains passive; executable tool proofs remain distinct.

## Closeout and next goal

Primary stage goal achieved: durable test-produced results with consistent
startup/live/CI classification and evidence-backed warning replacement.
The next goal is normal product use and separately scoped correction of concrete
observed gaps; no additional feature stage is activated.

Closeout is documentation-only: synchronize status and links, preserve evidence
limits, and append the decision. Do not rerun product tests, change runtime or
mapping contracts, create a Changeset, bump versions, tag or publish a release.
