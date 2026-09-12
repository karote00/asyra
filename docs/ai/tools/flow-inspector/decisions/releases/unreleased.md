# Unreleased Flow Inspector Decisions

## 2026-09-07 - First bounded behavioral proof

- Implement a local Phase 3 checkpoint around two real Factory flows and six
  obligations mapped to the existing transaction Inspector. Keep the full
  contract-evolution, remote CI, agent, and integration roadmap deferred.
- Bind each result to captured source, scenario, required cases, and an immutable
  attempt. Require exact runner evidence and demonstrate cross-flow regression
  with a test-only transform of real Factory code and unchanged assertions.
- Expose the same controlled action service through CLI and a separate local
  board. Preserve the static schema/workspace and keep Framework runtimes free
  of tool dependencies. No new package, runtime, license, or publication change.
- Add direct CI negative proof and permanent browser verification; keep local
  evidence artifacts out of release packages and Git history.

## 2026-09-07 - Preserve the existing canvas

- Correct the checkpoint's separate-board decision: the existing workspace
  canvas remains the primary UI. Retain its renderer, cards, routes, navigation,
  controls, and detail panel; compose verification through card context actions
  and a collapsible detail section.
- The server loads the adapter only in its target documents. Static files remain
  independent. Evidence updates must not rebuild the graph or reset its viewport.
- Prove geometry, selection, filtering, target isolation, retained evidence,
  contract mismatch rejection, and negative/recovery behavior in the real canvas.

## 2026-09-07 - Complete the bounded Phase 3 proof

- Admit explicit case-backed conditional handoffs before execution. Extend the
  existing six Factory obligations with five configuration-only negative
  transformations of captured production source and an exact recovery proof.
- Bind format-2 attempts to source/mapping/architecture/configuration versions,
  runner environment, and artifact fingerprints. Keep historical format-1
  records without inventing stronger provenance. Admit retained evidence once;
  repeated reads do not recapture source or recompute inventory/history ordering.
- Require explicit, exact-base review for test-name mapping changes; preserve
  all obligations and atomically retain each decision with its accepted revision.
  The first local baseline remains trusted. General evolution and protected CI
  accepted-base policy stay in Phase 4.
- Share actions and evidence between the original canvas and an attached CLI.
  Retain retry identities across restart, and verify named artifact contents
  before serving. Preserve all existing canvas geometry and static compatibility.
- Extend direct CI and permanent browser coverage to the full proof and mapping
  review. No new dependencies, Framework runtime changes, package version,
  remote hosting, source-writing agent, or connector is introduced.

## 2026-09-07 - Close Phase 3 independently of Phase 4

- Context: PR #165 merged the bounded Core Proof; all eight checks on its exact
  pre-merge HEAD succeeded. The existing plan also owns unfinished Phase 4.
- Decision: close only Phase 3 in
  [its completed record](../../plans/completed/flow-inspector-phase-3-core-proof-closeout.md).
  Retain the combined plan as active and `CORE_PROOF.md` as the living contract.
- Consequences: preserve all prior decisions and local-proof limitations.
  Required CI enforcement is still unproven: the effective GitHub main rules
  have no required status checks. Phase 4 must address that explicit gap.
- Release boundary: this closeout changes no version, Changeset, tag, or release.

## 2026-09-07 - Activate Phase 4 with an explicit delivery blocker

- Context: the merged Phase 3 proof remains limited to two Factory flows and six
  behavioral obligations. Its completed record and prior decisions stay intact.
- Decision: extend the living contract with immutable version history, explicit
  split/merge/retirement review, accepted-base CI evidence admission, common
  local actions, and baseline/time-bound manager snapshots on the original board.
  Actual negative runtime cases prove rejection and recovery; provider success
  cannot replace assertions or source provenance.
- Consequences: changed versions invalidate prior results; reported work,
  execution, verification and delivery remain separate. The effective GitHub
  `protect-main` ruleset lacks required status checks and independent verifier
  protection. The CI command is explicitly a trial and full Phase 4 remains open.
- Closeout decision: do not create a Phase 4 completed record or move this combined
  plan while mandatory enforcement is unverified. Follow the
  [operational guide](../../../../../../tools/flow-inspector/control-plane/README.md#github-enforcement-gap)
  for the necessary external setup and remaining acceptance evidence.
- Release boundary: no package version, dependency, tag, release, deployment, or
  Phase 5/6 capability is introduced.

## 2026-09-08 - Close local Phase 4 scope and defer GitHub enforcement

- Context: the bounded implementation and UX passed all eight checks on
  `6ae04626ad1a670002e78eb91514497cd8898513`. Main still has no required status
  check; protected verifier and remote refusal/recovery proof remain unverified.
- Decision: the user explicitly accepted local implementation closeout and
  deferred GitHub enforcement to avoid blocking concurrent projects and merges.
  Record the completed scope in the
  [Phase 4 local completed record](../../plans/completed/flow-inspector-phase-4-local-implementation-closeout.md).
- Supersedes only the 2026-09-07 instruction prohibiting any Phase 4 completed
  record: a bounded local record is now approved. The original mandatory-CI
  requirements remain in the combined plan as deferred work, not satisfied DoD.
- Consequences: preserve historical decisions and the living Core Proof contract;
  delivery remains unproven/blocked where applicable. Do not change GitHub rules
  or workflow enforcement. Resume external setup only on a separate user request;
  Phase 5/6 remain deferred. PR review/merge remains separate from local completion.
- Release boundary: no Changeset, version bump, tag, release or deployment change.

## 2026-09-08 - Activate isolated local Phase 5

After PR #166 merged, the user authorized Phase 5 local execution while keeping
mandatory GitHub protection, independent verifier/issuer and remote acceptance
evidence deferred. This supersedes the Phase 5 entry dependency only; it does
not satisfy or remove the original Phase 4 DoD. The product boundary is
[Local Agent Execution](../../AGENT_EXECUTION.md). Deterministic adapter proof
is distinct from real provider acceptance. No Phase 6, release or merge authority
is introduced.

## 2026-09-08 - Close bounded local Phase 5 execution

The [local completed record](../../plans/completed/flow-inspector-phase-5-local-execution-closeout.md)
records implementation `fedcfab3a`, 126 formal control-plane tests and five browser
cases. This closes the deterministic local adapter scope only. Real agent provider
acceptance and full Phase 5 remain pending; all deferred Phase 4 protection and
remote proof requirements remain unchanged. No version, Changeset, release,
protection change or merge is authorized by this decision.

## 2026-09-08 - Authorize release-neutral Phase 5 Changeset

The user authorized the existing Changeset CLI after the PR record gate blocked
CI. `yarn changeset add --empty` generated the release-neutral record; no package
version, tag or publication is requested. This supersedes only the prior
Changeset exclusion for this PR and does not change the bounded completion or
remaining provider/protection requirements.

## 2026-09-08 - Track the public Flow Inspector package

The user confirmed future open-source publication and authorized public-package
preparation. Remove the private-package exclusion for Flow Inspector itself and
record its changes through ordinary Changesets. This supersedes the empty
Phase 5 record: recording package release intent is distinct from applying a
version or publishing. The tool remains outside Framework bulk-release lists.
The initial archive provides static assets and source; dynamic control-plane
execution still depends on the Asyra checkout. No release is performed here.

## 2026-09-08 - Accept bounded Sol local integration evidence

The user selected Sol and authorized the existing ChatGPT subscription for a
bounded local provider trial. The [completed record](../../plans/completed/flow-inspector-phase-5-sol-local-integration-closeout.md)
records real model-produced regression, retained formal failure, corrected
candidate, cancellation, human handoff and restart. This supersedes the earlier
provider-unselected statement for this trial, while preserving immutable earlier
records. Unknown remote settlement blocks further dispatch rather than resetting
budgets. The trial closes only the selected macOS integration scope; full Phase 5,
protected verification/delivery and Phase 6 remain open. The existing package
patch Changeset is separate from closeout; no version application, merge, tag,
publication, protection or deployment change is performed.

## 2026-09-09 - Explain unresolved cancellation and retain local interruption receipts

Retain subscription-based local execution and leave CI autonomous repair to
separately configured operator integrations. Cancellation permits a bounded
wait for an app-server interruption notification, persists that observation
before completing local stop, and presents persistent investigation guidance.
An interruption notification is not cloud or billing settlement. User
acknowledgement, handoff and restart cannot remove an unresolved dispatch block.
Offline contract cases and read-only replay of existing live records prove this
follow-up; no new provider execution or remote reconciliation is claimed.

## 2026-09-09 - Complete bounded GitHub candidate review integration

The local owner selected one repository and one candidate review, and explicitly
changed PR creation to ready for review so CI executes. This supersedes only
the draft-only creation choice. The existing broker freezes exact source and
confirmation before the trusted adapter creates external objects. Retained audit
and query-only reconciliation prevent blind replay; HEAD-bound checks never
accept local baseline or verify manual PR edits. Real PR #179 demonstrates
creation, restart, shared Board/API/CLI records and visible Changeset CI failure.
The [completed record](../../plans/completed/flow-inspector-phase-6-github-review-closeout.md)
separates that live path from offline fault/state fixtures. Full Phase 5/6,
protected verification/delivery and provider reconciliation remain open. No
provider request, version, tag, merge of a GitHub PR, publication, protection or
deployment setting change is performed.

## 2026-09-11 - Complete trusted Changeset delivery and actual candidate CI acceptance

Keep candidate access runtime-only and assign fixed public Factory patch metadata
to the trusted review/delivery owners. Complete confirmation binds both artifacts
without treating release metadata as source verification. The
[bounded closeout](../../plans/completed/flow-inspector-trusted-changeset-closeout.md)
records deterministic test PR #189, exact remote content, duplicate/restart audit,
all five current-HEAD checks and closure without merge. One Sim production-test
timeout required an unchanged-HEAD rerun; no gate was relaxed. This supersedes
the source-only candidate CI limitation for this supported case, preserving
PR #179/#182 history and all deferred Phase 5/6 and provider boundaries. No new
model request or release action is authorized by green CI or by this closeout.

## 2026-09-10 - Separate flow contracts from multi-PR development work

The user identified that requiring an entire flow to fit one PR would prevent
useful decomposition. Record the [multi-PR development plan](../../plans/flow-inspector-multi-pr-development-and-integration-plan.md)
with a persistent target contract, bounded work promises, accepted-behavior
preservation and a distinct full integration assessment. Developing flows enter
verification immediately; incomplete target obligations are visible pending
work, never a blanket CI exemption or successful evidence. Full target acceptance
requires all necessary evidence on one integrated source and an explicit decision.

This supersedes only a one-flow/one-PR interpretation of the initial bounded
trial. Existing task/attempt delivery identities and safeguards remain. The
direction is approved but implementation has not started; this entry changes no
runtime, CI, accepted baseline or protection policy, and does not resume external
check monitoring. Prior completed records remain historical evidence.

## Flow targets and work decomposition - 2026-09-12

The first bounded multi-PR slice adds one-repository local targets, immutable
work commitments, complete assigned-or-pending coverage, explicit prerequisite
handoffs and audited scope revisions. Board/API/CLI share one target owner and
the existing store lock. Exact task linking preserves task/attempt PR identity.
Candidate verification remains strict; dependency evidence is unconfirmed and
whole-target integration/acceptance remain unimplemented. This records this
slice only, not completion of the multi-PR plan or full Phase 5/6.


## Source-bound work admission and bounded closeout - 2026-09-12

Review of PR 193 found that historical task linking did not enforce admission
before execution. The same PR now reserves source-bound work admission and makes
the existing task owner consume it before capture, after capture and on resume.
Target revisions cannot remove admitted promises. Bounded task assessments keep
failures and exact candidate identities separate from target completion.

This supplements the target/work checkpoint above; it does not erase its original
limits or accept a flow baseline. Board/API/CLI share the new admission owner,
while unresolved prerequisites remain blocked without a new evidence issuer.
The [bounded closeout](../../plans/completed/flow-inspector-target-work-admission-closeout.md)
closes only the first slice. Integration verification, explicit acceptance and
the existing provider/protection gaps remain open. No merge, version or release
operation is authorized by this record.
