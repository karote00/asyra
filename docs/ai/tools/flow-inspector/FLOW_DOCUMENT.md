# Flow Document Contract

Stage 1 - implemented and locally accepted on 2026-10-17.
Owner: `@asyra/flow-inspector`. The adoption plan's Stage 1 owns delivery.

## Public document

A version 1 JSON document contains `schemaVersion`, `projectId`, `flowId`,
`revision`, `definition` and `current`. IDs are stable opaque identifiers within
their namespace. File paths and display titles are not identities. Documents in
one selected directory form one project; duplicate IDs and unresolved references
are errors. The public JSON Schema owns field types and required fields. Semantic
admission also checks identities, references, dependency cycles and evidence kinds.
Unknown versions/fields fail admission rather than silently losing constraints.

The reserved node identity `integration` selects flow-level criteria and cannot
be used by an ordinary node. Node bindings include its own definition, declared
source revision and prerequisite bindings/current acceptance; they exclude notes,
progress and unrelated nodes.

The definition contains title, purpose, nodes, flow-level criteria and optional
full schema-v2 architecture. Each node declares objective, owner, dependency
references, requiredness, applicability, criteria, references and actions.
Architecture step IDs bind to node IDs. Preserve complete route, artifact,
invariant, contributor, bypass, boundary and failure-owner semantics. Manual
flows need no architecture file, code path, package, Git or test runner.
Dependencies use `{ flowId, nodeId }`; references resolve inside the project.
Optional nodes do not block feature completion unless a required node depends on
them. Conditional applicability is explicit: unknown blocks completion, false
excludes the node, true evaluates it. An excluded prerequisite cannot satisfy an
active dependency. Empty acceptance cannot manufacture completion.

`current` owns only current criterion observations/decisions, notes, progress and
producer-declared source revisions. Every criterion observation binds to its
node's current definition/dependency/source signature. Unrelated nodes do not
invalidate that signature. Dependency acceptance/reopen changes invalidate
consumers. Flow-level acceptance binds to required nodes and integration criteria.
A stale failure remains visible as stale evidence, never as a passing result.
A manual criterion also binds to current automated evidence on the same node;
a changed automated outcome requires renewed human review. No verdict depends
on source scanning, referenced report content or old runs.

## Evaluation

The evaluator owns all node and flow verdicts. It accepts an admitted project and
returns immutable results, current blockers and per-node compact context.
Automated and manual criteria have distinct evidence kinds. Automated results
cannot satisfy manual criteria. All required criteria and applicable prerequisites
must be satisfied before a node is done. Otherwise report declared progress and
missing/failed/stale/blocked evidence separately. Reopening a manual criterion
removes its accepted effect. Explicit blocked progress prevents completion even
when criteria are satisfied; clearing that blocker does not invent evidence. Notes
never affect acceptance. No implicit waiver.

One context request includes project/flow/node/criterion identity, current error,
failure owner, available spec/implementation references, evidence revision and
configured rerun scope or external/manual next action. Absence is explicit.
This locates declared responsibility; it does not claim inferred root cause.

## Current writes

Supported writes validate expected document revision and relevant signature under
an exclusive local writer lock; publish by atomic rename. Duplicate current
updates are idempotent. Reject stale writes and invalid replacement before
publishing; retain no mutation journal. External file authors can write valid
files directly but must coordinate concurrent writes themselves. Revisions are
not authentication. Actor and assignee are separate fields.

Result replacement is criterion-scoped. Incomplete, skipped, canceled or stale
producer output cannot clear an unresolved failure. Discovery warnings need an
explicit correction referencing the current warning and covering its intended
selection; a failed assertion may resolve discovery without resolving failure.
Only complete current observations can replace an older scoped warning, even
after a declared source revision changes. Unselected skipped siblings in an
explicit selection are not missing selected work. No-test success is not passing evidence. Current attachments are bounded and
optional; cleanup may remove only unreferenced tool-owned attachments.

## Producer and migration boundary

Generic producers author the public document or use the revision-checked helper.
Vitest and Playwright integrations retain existing exact mapping/classification
owners and translate their completed current output. They publish while Inspector
is stopped. Existing reports are not read by the normal dashboard/evaluator.
Native test watch is producer-owned; file observation never launches tests.

An explicit one-time Asyra projection consumes existing admitted architecture and
current localized results, validates verdict parity, and creates current flow
files. Archives remain unchanged and inactive. Do not leave a permanent dual
reader or append historical observations in the new producer path. Existing
proof/Agent execution workflows remain separate development tooling, not a
required reader for ordinary flow documents.

## Service and presentation

The service reads the selected directory, admits and evaluates each refreshed
project once, and shares that completed snapshot with list/context/UI consumers.
Reuse is scoped to a refresh generation; unchanged signatures reuse the admitted
snapshot. File addition, deletion, replacement or invalid data invalidates it.
No consumer independently derives completion. Tests count admission/evaluation
work as well as verdict parity. Directory/size limits bound resource use.

Live polling or file notifications refresh flow documents only. Missing/invalid
files produce file/field diagnostics and invalidate current green presentation;
recovery requires valid files. Cold start and live refresh use the same admission.

Reuse the existing canvas renderer with a selected-directory flow navigator. The selected panel
starts with title, status, concise blocker, acceptance progress and actions.
Configured Rerun is immediately available; select among multiple actions before
preview and confirmation. Manual nodes expose accept/reopen. Notes support edit
and delete. Technical details and full context are collapsed. Selection and drafts
survive ordinary refresh; invalid data disables writes and stale previews.

Actions come from the locally authored definition, never report text. Structured
argv runs without a shell, within the project boundary. Preview binds action and
current revision; confirmation rejects changed definitions/source bindings.
An action may explicitly declare `inputs` for source fingerprints checked during
preview and confirmation only; these do not become implicit evaluation inputs.
Reading, startup, watch and summary never launch commands. Unknown or unavailable
runners are explicit failures. Current execution cancellation must settle before
another execution or shutdown completes.

## Acceptance and delivery

The adoption plan's complete Stage 1 acceptance is mandatory. Formal cases cover
manual/mixed/custom evidence, architecture preservation, invalid dependencies,
scoped invalidation, stale/parallel writes, bounded current storage, warning
replacement, offline publication, restart/live refresh, one-request context and
actual selected rerun. Browser cases cover desktop/narrow panels and primary
actions. Preserve existing Asyra localization and exact test selection.

Stage 2 owns installed-package CLI/assets, external CI distribution and clean
consumer release gates. Stage 1 provides the shared semantics and source-level
APIs those commands consume. No registry publication is part of this stage.
