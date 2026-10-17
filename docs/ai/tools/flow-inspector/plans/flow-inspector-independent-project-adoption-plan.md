# Flow-Based Work Management and Independent Project Adoption

Status: Stage 1 implemented and locally accepted; Stage 2 not started; publication paused.
Updated: 2026-10-17 (Asia/Taipei).
Stage 1 base: `1cd4b38a6e3e09a320cb2fa70ba3e8c25e63a724` (merged planning PR #341).
Owner: Flow Inspector tool maintainer.

## Product direction and scope correction

Flow Inspector is a flow-based work management tool for humans and Agents.
A card represents a bounded task; completing its declared acceptance conditions
completes that task. Completing the required work and integration conditions of
the flow completes the feature. The user intends to use it instead of a separate
Jira/Asana task board. Test-failure localization is an important evidence path,
not the whole product and not a prerequisite for using the dashboard.

Developers must be able to install the npm package in their own projects, author
flows and operate the dashboard with automated results, manual acceptance or
both. No Asyra checkout, Framework dependency, Asyra Skill or particular test
runner is required. Humans and Agents receive the same authoritative state with
different presentation density.

This user-directed scope supersedes the earlier planning restriction to failure
localization and the first draft's Vitest/Playwright-only admission. Previous
A/B/C and persisted-result closeouts remain evidence for bounded Asyra-checkout
capabilities. They do not establish full task-oriented UX or independent adoption.
Publication remains paused. The user authorized complete Stage 1 implementation
after merging PR #341. Stage 2, registry writes and historical completion record
rewrites remain outside this implementation.

## Flow files are the sole project contract and state input

The installed Inspector reads user-authored flow files. It does not require test
reports, a test discovery pass, source scanning, Git, a proof manifest, an Agent
session or an internal database to render and evaluate a valid flow. Local launch
options select flow paths/port only; they cannot become a second contract store.
Referenced specs, code and attachments are optional supporting resources, not
implicit inputs that change a verdict. No configured source reference is required
for non-code/manual work. Unknown/unavailable references stay explicit.

Use one public versioned JSON flow-document contract with logically separate
`definition` and `current` sections. The definition owns stable node identities,
criteria, dependencies, applicability and declared actions. Current entries own
criterion results, manual decisions, work progress, notes and current blockers.
A directory of such files is supported; cross-flow links must resolve explicit
IDs. Exact JSON Schema and examples are first implementation deliverables, not
another product-scope decision. Never use executable JS as the public format.

Humans, Agents, any custom script or optional runner adapters can write this
contract. Adapters translate existing results into current entries before the
Inspector consumes them; supporting raw reports never form a competing state
source. UI/manual actions and explicit reruns use the same validated flow-file
write boundary. Keep public APIs for optional tooling, not an alternative
mandatory ingestion pipeline. Users need no approved adapter to author a flow.

The Inspector protects the declared contract by validating structure, references,
revision binding and dependencies, evaluating criteria, rejecting invalid writes
through its API and exposing unsatisfied work in UI/CI. It cannot prove that a
human's claim or a third-party producer's result is truthful, nor detect undeclared
source changes without a producer update. File authors remain the authority for
their contract. CI enforcement depends on the consuming project's chosen gate;
no protected remote attestation or prevention of direct file editing is implied.

## Current state without mandatory history

Do not retain per-stage/run snapshots, append-only acceptance/comment journals,
previous result bundles or historical UI lists in the new default workflow.
Persist the current flow document so shutdown/restart works without an always-on
service. Completed work stays visible as current completed work, not as an archive.
Users may use Git or their CI artifact retention externally; Inspector neither
requires nor implements a history service in these stages.

Retain only bounded current metadata: project/flow/node/criterion identity,
definition digest, relevant declared scope/source revision when provided, current
producer/execution identity and a monotonically updated document revision.
Updates carry an expected revision; atomic compare-and-replace rejects conflicts.
Repeating the same current update is a no-op; an older update cannot overwrite a
newer revision. Concurrency correctness does not require a replayable event log.
Current notes are editable/removable with the same revision checks; no edit history.
These concurrency guarantees apply to supported writers. Direct editors must
preserve valid revision bindings; validation cannot recover edits lost by an
external writer that bypasses coordination. Document that boundary without
requiring the helper API to author a valid flow.

A result update replaces only its declared current scope. Superseded warnings are
removed from current state after category-specific coverage validation, not moved
to a mandatory history list. A discovery correction supplies its current warning
reference, intended coverage and outcome in the update; a valid failed assertion
can resolve discovery while leaving product failure current. Partial, stale,
skipped, canceled and unrelated updates cannot clear unresolved work. An external
producer without valid ordering metadata must report a conflict, not win by clock.

Current failure detail remains available until valid replacement. Current-result
attachments are optional and bounded; remove unreferenced tool-owned attachments
on successful replacement, never user-owned referenced files. Prove bounded
storage and restart correctness without historical records. Definition changes
invalidate affected current acceptance; retain digests, not full old definitions.

Existing Asyra archives are not deleted by this planning change. During Stage 1,
provide an explicit one-time projection of their latest valid state into the flow
contract, validate it against the old current projection, and switch active
consumption to flow files. Leave original archives untouched and inactive; no
permanent dual reader, historical UI requirement or ongoing archive production.
This scoped transition does not rewrite old completion evidence.

## Current inventory

| Area                 | Available foundation                                                | Remaining work                                                                                       |
| -------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Architecture canvas  | Cards, routes, details, catalog and static assets                   | Public authoring schema, consumer-owned catalog and actionable task cards                            |
| Result localization  | Exact case mapping, original evidence, compact summaries            | Producer-neutral public admission and explicit manual evidence                                       |
| Persistence          | Offline results, restart, live polling, warning retirement          | Task/feature acceptance state distinct from observed test outcomes                                   |
| Node interactions    | Selected failed-case rerun, preview/confirmation, append-only notes | Card/top-panel entry, access without a prior failure, task completion and concise human presentation |
| Runtime distribution | Static archive with control-plane source                            | Installed CLI, consumer project root/config/storage, standalone dynamic service                      |
| CI                   | Bundles and existing Asyra aggregation                              | Portable project CI commands, task-policy evaluation and manual-evidence handling                    |
| Consumer proof       | Static package contract and Asyra fault/recovery tests              | Real installed-package workflows in non-Asyra automated, custom and manual-only projects             |

Concrete coupling to remove: `control-plane/cli.cjs` derives root from package
location; `service.cjs` requires a proof contract and `contracts.cjs` defaults to
Factory; `server.cjs` reads the bundled catalog; `workspace/generate-workspace.cjs`
scans Asyra and writes into the package; `localization.cjs` defaults to Asyra
manifests; Playwright ingestion and `node-interactions.cjs` assume Design paths.
The existing package has no public executable. Preserve useful implementations;
do not create another viewer or a competing result classifier.

## Public flow authoring and ownership

The project owner, developer or an Agent acting on their instructions authors
flow files. Agents can draft from requirements and source, but cannot silently
invent accepted responsibilities or acceptance decisions. The project reviews
flow changes through its normal process. Inspector validates and presents the
contract; it does not infer the project's architecture from test names.

Ship a public, versioned, data-only schema and reference, usable outside Asyra:

- Project and stable flow/node identities; feature purpose and scope.
- Node/task objective, responsible role or optional assignee, inputs/outputs,
  dependencies, implementation/specification references and acceptance criteria.
- Required/optional/conditional routes and flow-level integration criteria.
- Evidence bindings and completion policy per criterion: automated, manual or
  an explicitly declared combination. Evidence identity is not a display title.
- Explicitly registered actions: supported test rerun, external/custom producer
  instructions, inspect evidence, add note, submit acceptance and reopen work.
- Versioning, invalid input diagnostics, path semantics, examples and change rules.

For architecture flows, preserve the existing semantic responsibilities: explicit
step owner, inputs/outputs, conditions/bypasses, allowed/forbidden contributors,
implementation boundary, specification references, failure owner, invariants,
acceptance contracts, justified cache dimensions and route/artifact contracts. A task title and completion checkbox cannot replace those constraints.
Non-code/manual flows may omit code/package references; their declared
responsibilities, dependencies and acceptance criteria still require validation.

Keep definition and current-result fields separate within the flow contract: producers do not rewrite
architecture, and editing a definition cannot manufacture completion. Reuse the
existing architecture contract and extend at its semantic owner; do not create
independent editable task and architecture registries that can disagree.

Documentation must include a minimal manual-only flow, automated flow, mixed
flow, multi-node feature with integration acceptance and a custom producer.
Provide initialization/templates, schema-assisted editing and validation with
file/field diagnostics. Explain who writes each field and how an Agent consumes
it. Do not require Asyra knowledge, a hosted account or a plugin to author flows.
Examples must be executable consumer fixtures, not unsupported illustrative APIs.

## Evidence and completion semantics

Maintain three explicit concepts: declared work, observed evidence, and accepted
completion. A test's passed/failed result is not the whole task lifecycle.

- Work can be not started, in progress, blocked or done. Current evidence can be
  passing, failing, missing, stale or incomplete. The UI may combine these into
  an understandable presentation but cannot overwrite their separate meanings.
- A node is done only when its declared criteria and prerequisites are satisfied
  for the current relevant revision. A tests-only node may auto-complete if its
  policy explicitly allows it; a node requiring human acceptance waits for it.
- Manual-only nodes work without tests or a runner. An explicit acceptance
  records actor, criterion, decision, explanation, optional supporting reference,
  definition revision, optional source revision and timestamp. The UI labels this as manual
  acceptance, never as an automated test pass. Rejection/reopening updates the current decision.
- Manual acceptance cannot silently override a failed mandatory automated check.
  Any supported waiver is an explicit authorized policy/decision with a reason and
  revision; it does not relabel a current failed assertion as passed. Default policy
  does not grant waivers or arbitrary completion authority.
- A flow completes only when all required nodes on its applicable routes and
  flow-level integration criteria are satisfied. Optional/conditional branches
  require explicit applicability decisions; missing work cannot count as done.
  Dependency cycles and unresolved references fail admission.
- Relevant definition changes or producer-reported source changes/new contradictory evidence invalidate
  affected acceptance and make affected work require review/reopen. Define exact
  dependency invalidation before implementation; unrelated changes must not
  blindly reset an entire project. Retain only the current decision and its revision binding.
- Existing recovery coverage safeguards remain; resolved warnings are replaced, not archived.
  Source edits alone do not clear failure; comments cannot change verdicts.

The [Flow Document Contract](../FLOW_DOCUMENT.md), public JSON schema and
`flow-document-workflow` architecture Inspector freeze the Stage 1 transitions
and owner boundaries. Stage 2 consumes these owners without another state store.

## Any test system, including no tests

All projects have a documented way to supply observations. Ship a stable public flow current-result schema plus optional CLI update/import helpers and an adapter authoring guide. A custom
script can translate Jest, pytest, cargo test or other outputs into that schema;
this is not a claim of built-in automatic parsing for every runner. Reject
unsupported raw formats with a precise diagnostic and the documented import path.

Provide first-class Vitest and Playwright integrations using existing owners;
publish supported runner versions before implementation. Generic producers bind
project/flow/node/criterion and outcome. Automated producers also bind actual
case or observation identity, configuration and execution identity; source revisions and
supporting evidence references apply when declared by the flow. Test files,
test case identities and run metadata are not requirements for manual-only flows.
Producer integrations preserve producer failure exit status,
partial/missing output and project boundaries. Mapping may be explicit even when
there is no test file. Unknown failures remain visible rather than guessed.

Manual decisions use the same project identities but a distinct evidence kind,
inside flow files, with Board and machine-readable write/read interfaces. They work offline and
survive restart. Automatic producers cannot impersonate human approval through
an assertion field. Local actor attribution is not authenticated team identity.

Rerun exists where an executable test/action is configured. Manual-only cards
expose acceptance/review actions instead of a fake Rerun. A generic producer can
provide a locally configured structured action or clear external rerun guidance;
imported report command text is never executable authority. No arbitrary shell
input is added to the dashboard.

## Human panel and Agent context

A red card with a configured executable action exposes Rerun on the card or
immediately at the top of its selected panel, without selecting a hidden historical failure first. With multiple cases,
show the case/scope choice before execution. Preview/confirmation preserves
source selection and permissions while staying close to the primary action.
Passing and untested configured nodes remain operable with truthful state.

The panel's first screen shows only the task title, current work/evidence status,
short failure or blocker summary, acceptance progress, useful implementation/spec
links and applicable actions. Keep task notes accessible in a clearly labeled
section. Manual accept/reopen actions are visible when relevant.

Fold full errors/stacks, command arguments, run identifiers, source fingerprints,
artifact digests, optional original reports and full contracts under
clearly labeled disclosures such as Full context. Do not duplicate errors in
multiple expanded sections. Important current blockers must remain visible.
Preserve complete machine-readable evidence/compact Agent summaries; reducing
human visual density does not discard evidence. Legacy proof/delivery controls
are not unconditional content in an ordinary task panel.

A single machine-readable request for a selected node returns its current error
or blocker, exact flow/node/criterion identities, relevant specification and
implementation entry references, current evidence/revision and configured rerun
command/scope (or manual/external next action). Missing references are explicit;
never invent a root cause or require reading historical runs. Both the selected
node and its compact context identify the declared failure owner. This is the
starting point for investigation, not a claim of automatic diagnosis or repair.

## Independent runtime and external CI

Separate installed read-only assets from validated consumer project context and
project-owned data. Discover config from cwd or an explicit root; handle nested
workspaces, missing configuration, spaces, occupied ports and unavailable runners.
Do not modify node_modules or silently fall back to Asyra flows. Initialization
must not overwrite source, tests or configuration. Git is optional for local/manual
use; source/config fingerprints are used only when the flow declares them.
Manual-only flows need neither Git nor a source fingerprint.
Initial runtime target is Node.js 24 on macOS/Linux; Windows and Yarn PnP are not
claimed without separate verification. npm install is required; node_modules-based
Yarn/pnpm consumers resolve their local dependencies without global runners.

Other projects must run Inspector headlessly in CI without a browser or live
service. Provide schema/mapping validation, generic/runner evidence ingestion,
policy evaluation, bounded summary output and optional current-flow bundle export.
CI evaluation reads flow files alone and requires no browser, UI build, server,
rendering dependency initialization or background service.
Supply a generic shell recipe and a GitHub Actions example, not Asyra-only YAML.
CI executes product tests once; Inspector consumes results rather than rerunning.
Manual-only CI performs no product test step. A project may explicitly request a separate run action; reading/evaluation never
implicitly triggers it.

Define machine exit codes and structured outcomes for satisfied, unsatisfied,
invalid and awaiting-manual-acceptance states. No result is not a pass. The project
chooses whether manual pending blocks its CI gate; choosing a nonblocking policy
does not mark the feature complete. Current manual decisions may be imported only
when its identity, declared authority and relevant revision match. CI cannot
invent an approval. Report trust boundaries honestly; this stage does not provide
hosted authenticated review or protected remote attestation.

Current-flow bundles transfer between clean checkout paths, preserve identities,
validate included attachments, reject conflicts and import idempotently. Historical
runs are not required or bundled by default. Board, Agent context and CI
must use the same completion/evidence policy. Only current state and referenced tool-owned attachments require local storage;
there is no mandatory archival or team synchronization.

Live observation watches the selected flow-file set, including externally authored
updates, creation, replacement and deletion; it does not watch product source to
schedule tests. After a complete valid write, the dashboard and Agent reads
converge to the same evaluated revision without reload. Partial/invalid JSON,
unsupported schema and missing flow files show an actionable unavailable/invalid
state, never a silently retained green verdict. A last-valid display, if retained
in memory, is explicitly stale and cannot establish completion. Recovery requires
a valid current file; cold start and live refresh apply identical validation.
Product test watch remains producer-owned and publishes only executed results.

## Future team interfaces and conflict assessment

Evaluate these contracts now; implement only local correctness and extension
boundaries needed by this stage. Team hosting, accounts and synchronization remain
later work. Never claim reserved fields provide actual collaboration.

| Potential conflict                                | Boundary to establish now                                                                          | Later team capability                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Renamed cards or copied flows collide             | Stable project/flow/node/criterion IDs; names are presentation                                     | Shared project registry                     |
| Two people complete/reopen the same card          | Revision-bound commands, idempotency keys, explicit conflict rejection; no silent last-writer-wins | Multi-user concurrency UI                   |
| Human acceptance races with newer failing CI      | Current criterion entries with revision-checked updates and deterministic policy                   | Shared event delivery                       |
| Local and CI clocks disagree                      | Expected document revision plus source/execution identity, not clocks                              | Server sequencing                           |
| Flow changes during review                        | Bind acceptance to definition and relevant source revisions; expose invalidation                   | Collaborative review                        |
| Assignee is mistaken for authority                | Separate assignment, recorded actor, producer identity and authorization                           | Authentication, roles and approval policies |
| Several users edit comments                       | Stable note IDs and revision-checked edit/delete operations                                        | Editing/mentions/notifications              |
| CI imports into wrong branch/project              | Explicit namespaces and scoped evidence admission                                                  | Cross-project shared storage                |
| Shared storage loses concurrent writes            | Existing atomic writes plus local writer coordination; defined repository interface                | Transactional remote persistence            |
| Imported actions read secrets or execute commands | Local action registry, structured argv and bounded file access                                     | Audited remote execution                    |

This is task management through the flow itself, not Jira/Asana synchronization.
No automatic task decomposition, Agent dispatch, provider budgets, cloud hosting,
team login, protected merge enforcement or external ticket integration is activated.
Do not design the current system around a single display-name actor or assume a
future team can safely merge mutable status JSON files.

## Two complete delivery stages

### Stage 1 - Human task workflow and open evidence contract

One complete stage: public flow authoring/schema/docs, generic and manual evidence,
node/feature completion policy, card/top-panel actions, folded human context,
current notes, current-only storage and the team-interface conflict decisions. Reuse existing test producers
and reader. Stage 1 owns the public generic write/read contract, optional update
helpers, manual actions, live file observation and compact Agent context, including
adapting existing producers to the current-only contract. Stage 2 packages these
same owners as installed commands/integrations and proves external use; it does
not defer a write/read capability needed to accept Stage 1.
Review the complete product and architecture flow before implementing
owner steps. Do not split into per-button or per-state PRs.

Acceptance:

1. Using public instructions alone, a human or Agent authors and validates a
   real manual-only flow; the dashboard works without tests or a test dependency.
2. A multi-node feature progresses through dependencies, manual acceptance,
   automated failure/recovery and integration acceptance. Only the declared
   required work completes the feature; wrong/stale/missing evidence cannot.
3. A custom producer unrelated to Vitest/Playwright submits valid generic results;
   invalid/ambiguous results stay explicit. No runner-specific code is needed in
   the reader or completion policy to support the custom producer.
4. Clicking a red card exposes its summary and configured Rerun immediately,
   or its manual review action when no executable action exists. Multiple cases
   are selectable, while passing/untested/manual nodes expose appropriate actions.
5. A desktop and narrow-panel review shows first-screen human essentials and
   collapsed full context, no duplicate error dumps; complete Agent data remains.
6. Manual accept/reopen, repeated requests, stale revisions, simultaneous local
   writes and a newer CI failure cannot silently overwrite newer current state or complete work.
7. Existing Asyra current failure localization, warning-coverage safeguards and exact
   selected reruns are preserved through the explicit flow-file transition. Documentation distinguishes
   task completion, automated pass and manual acceptance.
8. A hand-written flow file alone operates the dashboard and policy evaluator,
   with no runner, reports, mapping database, Git or Asyra files. Invalid structure,
   criteria and dependencies produce actionable file/field errors.
9. Repeated updates, corrections and note edits keep only bounded current state;
   restarting without any historical files gives the same verdict. Old-version
   writes conflict. The one-time Asyra projection agrees with retained current
   outcomes without modifying old archives.
10. One compact-context request provides current failure/blocker, node and failure
    owner, specification, implementation entry, revision and exact rerun scope or
    manual/external action. A repair/retry case starts from that response without
    separately searching logs or historical records; absent references stay explicit.
11. Directly edit a flow with Inspector stopped, then load it; repeat with Inspector
    open and verify refresh without reload. Create/delete/atomically replace files
    and exercise partial/invalid writes and recovery. UI and machine reads never
    expose a stale passing result as current, and observation launches zero tests.
12. Translate an existing architecture flow and compare its owner, route, artifact,
    contributor, bypass and failure-boundary contracts. Invalid references/cycles
    fail; unrelated-node edits preserve unaffected acceptance while changed
    prerequisites invalidate affected downstream completion. Required, optional
    and conditional paths and flow-level acceptance have explicit verdict cases.

Stage 1 acceptance evidence (2026-10-17):

- `FLOW_DOCUMENT.md`, the public `flow.schema.json`, manual/mixed/dependent-feature
  examples and the `flow-document-workflow` Inspector define the reviewed schema
  and owner handoffs. The workspace renders the architecture without static errors.
- Permanent `flow-files/__tests__/policy.test.cjs` and `store.test.cjs` cover
  manual/automated kinds, required/optional/conditional and cross-flow dependencies,
  integration acceptance (including failure precedence over pending tasks), source
  invalidation, explicit blockers, revision conflicts,
  idempotency, atomic replacement, work-count reuse and current attachment cleanup.
- `producers.test.cjs` proves offline localization, complete warning replacement
  after source correction, excluded skipped siblings, architecture authority checks,
  empty/partial selected-report warnings and recovery, rejected-publication attachment
  cleanup, and one-time projection whose evidence and attachments survive removal of
  old archives. Superseded selections do not become missing-result warnings during
  projection. Long/empty runner diagnostics preserve full evidence with concise
  summaries and bounded detail fields. The original archive bytes are unchanged
  by projection.
- `server.test.cjs` and `service.test.cjs` prove shared machine reads, file
  creation/deletion/invalid-write recovery, authorization, stale previews, bounded
  current writes and explicit execution settlement. Reads and preview start no tests.
- `browser.test.cjs` exercises desktop and narrow human panels, folded full context,
  manual accept/reopen availability, live invalid-state recovery and failed-node
  Rerun through a real custom producer to renewed manual acceptance. Screenshots
  are produced under `tmp/flow-stage-one/browser/` and were visually reviewed.
- `selected-rerun.test.cjs` executes the original exact Factory Vitest and Design
  collaboration Playwright cases through the new current-file route. Existing
  Design baseline/fault/recovery, six-case partial/full recovery and original App
  rerun tests pass. The existing runner's nested process-group test proves cleanup.
- Package contracts, React tests, typecheck/build, generated assets, naming,
  test-file placement and CI/workspace contract checks pass. The new UI and selected
  rerun gates are included in the existing tool-validation CI jobs; they are explicit
  tool acceptance tests, not work performed by ordinary flow reads.

Known boundaries remain intentional: trusted local actors/actions, no hosted team
identity, cooperative local writer locking, and no source-change detection without
producer-declared revisions. Projection rejects changed retained source/architecture
rather than granting new authority to old evidence. Generic JSON authors can operate
without runners; packaged external adapters, independent install and external CI
release acceptance belong to Stage 2. No npm publication or product-feature changes
were performed in Stage 1.

### Stage 2 - Independent installation, CI and release readiness

One complete stage: installed executable, consumer config/catalog/storage,
distribution of Stage 1 adapters/import APIs, external CI, package assets and
clean-consumer proof.
It consumes Stage 1's complete task workflow, not the previous cluttered UI.

Acceptance:

1. Install the actual tarball into isolated non-Asyra consumer projects. No source
   symlinks, ancestor node_modules fallback, private scripts or Asyra build needed.
   npm installation and documented node_modules runner resolution work.
2. Complete manual-only, mixed automated/manual, Vitest, Playwright and custom
   producer scenarios from shipped docs. Include no-Git, nested workspace,
   named-project, duplicate-title, regex-character and path-with-spaces cases.
3. With Inspector closed, inject a real feature fault and run unchanged tests;
   start Inspector, locate the node via its summary, repair, and execute the actual
   selected-rerun preview/confirmation path. Verify only the intended case runs.
4. Source changes alone retain observed failure. New results update the open UI
   without reload; restart retains evidence, notes and accepted task state.
   Native watch publishes only actually executed cases; Inspector schedules none.
5. No-tests correction, assertion failure, partial coverage, stale/canceled runs
   and later regression preserve the existing warning/recovery guarantees.
6. External CI validates/evaluates/exports without UI. The producer workflow runs
   each product suite once; evaluation of flow files and optional current bundles starts zero runners
   and zero UI/server processes. Local/CI/manual
   policy agrees. Missing manual acceptance is visible, never fabricated green.
7. Corrupt, conflicting, missing and duplicate artifacts; wrong project/source;
   traversal/symlinks; missing runner; occupied port; stale previews and shell-like
   titles have bounded diagnostics and no unauthorized effects.
8. Inspect actual consumer UI and compare Board/API/CI outcomes. Record exact
   source and tarball integrity. All intended runtime files and public docs ship;
   no local evidence/secrets do. Verify existing Asyra operation is preserved.
9. From shipped documentation alone, initialize without overwriting existing
   files and validate the public manual/automated/mixed/custom examples. Repeat
   Stage 1's compact-context and external-file update/recovery paths through the
   installed package, not repository-private entry points.
10. A manual-only CI job with no test runner installed and no UI/server started
    evaluates a valid flow.
    Satisfied, unsatisfied, invalid and awaiting-manual outcomes have documented
    exit codes and matching structured results. An optional nonblocking manual
    gate never changes the task/feature verdict to complete.

Run focused formal gates at complete owner slices and assembled-stage checkpoints;
do not repeatedly rerun unaffected expensive suites. No tests run for this planning
edit. Additional dependencies need approval before introduction. Exact schemas,
runner versions and completion transitions must be reviewed before implementation;
do not fill missing contracts with fallback behavior.

## Release and next decision

Publish only after both stages meet their complete acceptance, one cohesive PR
per stage, and the user explicitly authorizes publication again. Then verify a
fresh registry installation. Current source version `0.2.0` and the previous
source-only tarball are not proof of readiness. Future team implementation is a
separate decision informed by the conflict assessment above; it is not silently
added as a prerequisite to local project adoption.

## Planning review disposition

Reviewed against the user's clarified requirements on 2026-10-17. Removed the
mandatory run/decision history, adapter-only admission and automated-test-only
completion assumptions. Confirmed direct flow authoring, manual/custom usage,
node/task and flow/feature completion, first-screen human actions, folded details,
headless external CI, independent installation and future-team conflict boundaries.

Stage 1 owns the schema, state transition and architecture-contract implementation;
Stage 2 proves its independently installed distribution. Neither stage can claim
completion from merely displaying static cards or passing Asyra-only tests. No
additional product-scope decision is needed to start Stage 1 design after user authorization;
owner-level design and formal tests remain part of implementation, not claimed
as already performed. Publication requires separate explicit authorization.

The follow-up planning review makes Stage 1's writer/reader ownership explicit,
preserves architecture constraints, and adds direct-file refresh/error recovery,
one-request Agent context and manual-only headless CI acceptance. Stage 2 proves
those same capabilities from the installed package. Exact schema/owner-flow
review remains a required Stage 1 design gate before production coding; this
planning review does not claim that implementation admission already passed.
