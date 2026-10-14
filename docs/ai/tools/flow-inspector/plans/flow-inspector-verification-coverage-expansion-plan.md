# Flow Inspector Test Failure Localization

## Status and scope

Proposed follow-up, originally recorded on 2026-09-29 and redirected by the
user on 2026-10-10, with roadmap alignment on 2026-10-11. This revision replaces the previous coverage-first and
Board-task priorities. The filename remains stable for existing links.

The purpose is to eliminate repeated navigation and ownership discovery after
a test fails. Both humans and AI should start from the recorded responsible
step, its relevant implementation, and the actual failure evidence instead of
searching the repository to reconstruct that context.

The primary path is:

```text
Existing test command fails
  -> retain the test result and execution identity
  -> resolve its registered flow and responsibility step
  -> show the node, implementation location, and reported failure reason
  -> human or AI investigates and fixes from that location
  -> rerun the relevant tests and refresh the recorded result
```

Flow Inspector supplies deterministic localization and retained context. It is
not responsible for debugging, inferring a root cause, generating fixes, or
planning and dispatching tasks. A reported assertion explains the observed
violation; it does not prove which upstream implementation defect caused it.
The mapped node is the investigation entry point, not a restriction that every
fix must occur inside that node.

The original revision changed this plan and its index; the 2026-10-11 revision
aligns the roadmap and other unfinished plans with the same objective. These
are planning changes only: runtime, permissions, architecture steps, acceptance
authorities and completed delivery records remain unchanged.
Command buttons and comment blocks are deferred until this path is complete.

## Bounded implementation - 2026-10-14

The next implementation covers Priorities 1-3 for the existing Design Undo/Redo
shortcut cases and registered Factory cases. The base is
`c696dba31984ac2fc6be817524505c722b4af9d9`; implementation lives on a new
`codex/flow-test-failure-localization` worktree branch. The older inventory below
is retained as the planning baseline, not the current completion claim.

The implemented path is an opt-in Vitest reporter on the original invocation,
immutable per-run observations, exact file/name/project mapping through existing
contract admission, and the same original context exposed through the existing
Board, read API and CLI. Unmapped/ambiguous/stale failures and setup errors stay
visible. Recovery updates only observed cases and preserves historical failures.
Declared responsibility is the starting point for investigation, not a claim
that the mapped step is the proven root cause.

Owner execution boundaries:

- `admit-proof-contract`: admit the App terminal shortcut flow, optional exact
  implementation paths within the existing step boundary and project identities.
- `localize-test-results`: retain original results and mapped-input fingerprints,
  resolve responsibility once, preserve unknowns and immutable completed history.
- `serve-proof-actions`: expose read-only observations without accepted-proof,
  task or delivery effects; keep cached record reads separate from source capture.
- `render-proof-board`: select existing matching-version cards, display the same
  machine context and original failure, and clear retired details after recovery.

Formal validation includes unchanged App/Factory assertions through baseline,
fault and restoration; source edits during execution; missing/malformed reports;
identity collisions; independent scopes; actual read counts; API/CLI equality;
and desktop/narrow Board selection, history and recovery. Regression fixes add
permanent tests before implementation. Existing control-plane, package, naming,
placement, formatting, lint, typecheck, build and browser gates remain required.
The existing CI control-plane list and Board discovery include these new tests.

This bounded milestone is implemented and locally validated: the full existing
control-plane group passed 487 tests with two platform-specific skips; the final
focused group passed 54 tests; the complete Board group passed 14 tests with two
retained-live-evidence skips. The original proof passed all three flows, five
negative scenarios and nine obligations. Package tests, naming/placement/scope
contracts, lint, typecheck, generated catalog and production builds passed.
Desktop and narrow screenshots were inspected. No live provider or GitHub
write was used as test evidence. Broader result-producer and mapping coverage
remains future work; command buttons and comment blocks remain deferred.

No automatic repair, task dispatch, command buttons, comments, ADE integration,
Playwright result producer or general CI import is part of this milestone. Future
work should expand mappings and result producers only after the localized path
proves useful for real failures; those remain separate bounded increments.

## PR 322 review iteration

The review baseline is `c2f50f75c`. Discovery is restricted to this PR, its
direct consumers, ordinary result identity/history, UI lifecycle, source/error
retention and the existing CI gates. The original Board CI failed because its
Linux Chrome socket path exceeded the platform limit.

Cross-target review replaced the earlier client-only repair approach: the static
workspace canonicalizes hashes, and the HTTP service rejects arbitrary query
parameters. `serve-proof-actions` must admit exactly one valid observation query
on a registered target page for GET requests. Its server and server contract tests
own that admission; unrelated queries, API routes and mutations remain rejected.
`render-proof-board` then consumes the retained selector, selects historical scope,
rejects stale asynchronous responses and retries transient reads. Its existing
browser test must follow the actual rendered cross-target link, not a constructed
URL that bypasses either owner. This is a bounded repair of the original failure
navigation contract, not a new routing system or static-workspace execution path.

The revised sequence is service query admission (positive and negative HTTP
cases), then actual cross-target browser navigation/retry and the full Board
suite. Core observation repairs retain filtered failures, simultaneous outcomes,
missing-source unavailability and original hook stacks, with permanent failing
regressions and real Vitest execution. Final gates are the existing control-plane
group, Board group, package contracts, generated catalog, lint, formatting, naming,
typecheck and build. No new dependencies, command actions or unrelated repairs.

Review corrections passed the full control-plane group (493 passed, two platform
skips), the complete Board group (16 passed, two retained-live-evidence skips),
and package, naming/placement/scope, lint, formatting, typecheck and build gates.
The original three-flow/five-negative/nine-obligation proof and candidate proof
also passed. New HTTP cases preserve query rejection outside the exact read-only
selector. Remote Linux validation is checked separately after the review update
is pushed; local success does not replace that result.

## Planning baseline and original gaps

Read-only inventory baseline: `0dd9e2c0e779b34a8f4bda66384b9ff10440d2f6`.
The following describes inspected source and permanent test coverage, not a
claim that those runtime tests were rerun for this documentation revision.

- **Implemented for registered proofs:** product manifests map exact test names
  and case ids to flow and step ids. The current
  [Factory manifest](../../../../../packages/factory/flow-contracts.json)
  includes deferred publication, cancellation, and history-group flows.
  [Contract admission](../../../../../tools/flow-inspector/control-plane/contracts.cjs)
  resolves the architecture and rejects invalid mappings. Reuse this authority;
  do not create a competing ownership registry.
- **Implemented for admitted reports:**
  [evidence assessment](../../../../../tools/flow-inspector/control-plane/evidence.cjs)
  retains case failures and source/contract identities. It rejects incomplete
  or inconsistent reports. Its current report path expects the admitted test
  suite and case inventory; it is not a general consumer of every ordinary test
  command. An unexpected test is an evidence issue, not a complete unmapped
  failure experience.
- **Implemented on the Board:**
  [the Board adapter](../../../../../tools/flow-inspector/control-plane/public/board.js)
  projects selected-flow evidence onto matching steps, displays assertion
  failures, and provides a run-level failure notice with owner-step navigation.
  Existing failure/recovery and mapping invalidation cases live in
  [Board tests](../../../../../tools/flow-inspector/control-plane/__tests__/board.test.cjs)
  and [mapping tests](../../../../../tools/flow-inspector/control-plane/__tests__/mapping.test.cjs).
  Extend these paths instead of building a second failure dashboard.
- **App support has advanced since the original follow-up:**
  [the Design manifest](../../../../../apps/asyra-design/flow-contracts.json)
  now registers AI execution proof cases and workspace source inputs.
  [Runner tests](../../../../../tools/flow-inspector/control-plane/__tests__/runner.test.cjs)
  contain private App and package integration execution cases. The earlier
  blanket assumption that source admission is package-only is no longer an
  adequate inventory. This does not establish Undo/Redo shortcut coverage or
  coverage of arbitrary App tests.
- **Bounded CI collection exists:** the
  [final workflow aggregation contract](../CORE_PROOF.md#final-workflow-aggregation)
  describes exact Design Delete cases, execution identity and failed/unverified
  outcomes. It explicitly does not project those cases onto local Factory
  cards. CI collection alone does not complete failure-to-node localization.
- **Still missing for the intended experience:** supported ordinary test runs
  feeding one localization path; complete retained records for unmapped failures;
  an immediately usable node/implementation/failure/rerun context shared by
  humans and AI; and end-to-end proof that a real App failure reaches that
  context without a second diagnostic run or repository search.

The historical baseline/fault/recovery experiment remains in
[evidence.test.cjs](../../../../../tools/flow-inspector/control-plane/__tests__/evidence.test.cjs),
under `source fault injection distinguishes an unmapped Design feature from cross-flow Factory failures`.
It reversed Design Undo/Redo shortcut direction: the App assertions failed while
the then-registered Factory proof passed. A numeric-clone Factory mutation
instead failed obligations mapped to `record-reversible-journal`,
`finalize-transaction-state`, and `settle-local-shared-projection`; recovery
restored the expected outcomes. Those are observed obligation owners, not
independently proven root causes. Historical counts are not the inventory of
the current expanded Factory manifest.

## Priority 1 - Connect test failures to existing ownership records

Use structured results from existing test execution, with its real run/source
identity, to resolve test cases through the admitted mapping to architecture
steps. Tests remain the behavior oracle. Do not require a second test run just
to discover where the first failure belongs, or require task/target creation
before a failure can be located.

The first bounded input is the existing Design Undo/Redo shortcut tests and the
registered Factory transaction cases. Inspect and reuse current App source
support. Begin with their existing Vitest execution path; add a Playwright or
CI producer only as a separately admitted expansion of this same path.

Before production edits, update the relevant living evidence contract and
review its exact architecture ownership, input/output handoffs and failure
handling. Preserve the existing Factory step boundaries. Review and admit the
App shortcut mapping at its actual owner; do not assign it to Factory merely
because it invokes History. Define complete test identity for each supported
runner, including file, full case name and applicable project/parameter identity,
so equal display names cannot route failures to the wrong node.

Acceptance:

- One supported ordinary test invocation produces both the original failing
  result and its node localization. Its exit status and assertions are unchanged.
- Every failed case in the received report is retained: either mapped to its
  declared responsibility or explicitly unresolved with its original identity
  and failure evidence. Unmapped failures never disappear or receive a guessed
  owner. Missing/ambiguous/stale mappings explain why localization is unavailable.
- Multiple failing cases remain individually readable, including multiple cases
  at one node and failures in different flows. Shared package membership does
  not mark unrelated nodes as failed.
- Suite setup errors, report loss and runner crashes remain execution/evidence
  failures; they do not invent a product-node diagnosis. Report completeness
  and skipped/not-run cases cannot be converted into passing evidence.
- Source, mapping and execution identities stay attached. Imported observations
  cannot silently acquire accepted-conformance or baseline-acceptance authority.

## Priority 2 - Make the failure location immediately usable

Reuse the existing canvas, details, failure notice, evidence records and read
interfaces. Provide the same recorded context to a human selecting a failure
and an AI reading that failure; neither should need to reconstruct ownership
from raw logs or a repository-wide search.

The localized context must contain:

- the failed test identity, run and source revision/digest;
- the flow, mapped step, semantic owner and relevant behavior contract;
- the responsible implementation path or symbol and its declared boundary;
- the original assertion/error, with expected/actual and stack location when
  the runner supplies them, plus a link to retained full evidence;
- the relevant rerun command and required context, as information rather than
  a new execution button.

Reuse authoritative references and source-bound locations. A broad package
label alone is insufficient when a more precise owner location is available.
Do not fabricate line numbers or causal explanations; identify unavailable
precision explicitly. Connected architecture routes may provide existing
context, but automatic root-cause inference is outside this milestone.

Acceptance:

- From a failure entry, one selection locates the mapped node and exposes the
  context above. AI-accessible output identifies the same node and evidence.
- Multiple failures at the same node cannot overwrite each other's reasons.
- Switching flow, source or historical run cannot misattribute evidence. A
  passing rerun clears the current failure only for the matching tested scope;
  the earlier failure remains historical and untested scopes stay unverified.
- Unmapped failures remain visible and usable as test evidence alongside mapped
  failures; static nodes without admitted tests do not imply successful coverage.

## Priority 3 - Prove the complete path on real failures

Use the existing fault-injection case as a starting point, retaining its
unchanged behavior assertions. Add formal ingestion/localization and Board
cases at their actual owners before implementing missing behavior.

The bounded acceptance set is:

1. Reverse Design Undo/Redo shortcut direction in an isolated source copy. The
   existing App test command fails, its received report identifies the App-owned
   node and implementation, and its original reason is available to humans and
   AI without a separate ownership search. This proves shortcut routing only;
   mocked History calls do not prove complete History replay.
2. Inject the existing shared Factory fault. All observed failed registered
   obligations map to their declared steps; unrelated passing obligations stay
   independent. Do not infer unobserved downstream failures.
3. Include an unmapped failure, colliding test display names, multiple failures
   at one node, a stale mapping and a runner/setup failure. None may be silently
   discarded, misrouted or represented as a confirmed root cause.
4. Restore the same behavior and rerun. The selected current result recovers,
   historical evidence remains accessible, and unrelated unresolved failures
   remain unresolved.

Completion requires formal result/mapping tests, the real App and Framework
baseline/fault/recovery cases, and Board tests proving visible node localization
and full failure details. Inspect the resulting screenshots as presentation
evidence. Documentation checks alone do not complete this milestone.

The practical success criterion is that the existing failed test result takes
both a human and an AI directly to the recorded investigation entry point and
reported reason. They should not need a new broad search, a new task record,
or another diagnostic execution merely to find that information. Debugging
from that point remains their work.

## Deferred work and delivery boundaries

- New command buttons and comment blocks come after the failure-localization
  milestone, under a separate bounded request.
- Automated debugging, repair suggestions, task planning/dispatch, provider
  orchestration and delivery management are not goals of this follow-up.
  Existing controls remain available; this plan does not extend or remove them.
- Broader App/Framework coverage follows the proven path, one declared set of
  tests and owners at a time. The eventual goal is to account for any received
  test failure; universal runner support and complete repository mappings are
  not current capabilities or prerequisites for the first bounded delivery.
- Mandatory CI enforcement, agent execution management, task dispatch, ticket/PR
  delivery management, hosting, team operation and cross-repository coordination
  are removed from the current mainline. They are not prerequisites or scheduled
  follow-ons; reopening them requires a separate product decision.
- Additional CI or runner result sources use the
  [result-source support plan](flow-inspector-control-plane-evidence-and-ci-plan.md).
  Receiving failures does not require merge enforcement. The
  [node interaction plan](flow-inspector-control-plane-actions-and-integrations-plan.md)
  owns optional buttons/comments only after core acceptance. The
  [roadmap](flow-inspector-workflow-control-plane-roadmap.md) sequences this work
  without duplicating its acceptance gates or effort.

The [living Control Plane contract](../CORE_PROOF.md) and
[static Inspector contract](../FLOW_INSPECTOR.md) retain current behavioral and
architecture authority. This proposal does not redefine them as already
implemented. Before each implementation slice, reconcile its contracts and
exact owner steps, define permanent positive/negative cases, and run the
focused owner and Board gates required by that slice. Reuse existing source
and evidence owners; do not add a parallel registry or change static schema 2
merely to store test execution state.

No new dependency, runtime modification, remote operation, merge, publication,
or implementation task is authorized by this documentation update. Completion
of this plan is owned by the Flow Inspector follow-up owner and is limited to
the explicitly supported inputs and mappings above; it does not reopen the
completed multi-PR delivery plan.
