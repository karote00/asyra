# Adoption Entry and Onboarding Program

## Status and execution agreement

Planned on 2026-09-23. Product direction accepted. This document is the single
adoption journey owner for the program sequence, task dependencies, handoff
contract, and current adoption baseline; related README and website plans remain
specialized authorities and must link back here instead of becoming competing
program plans. Existing runtime, App, release, and homepage authorities continue
to own their exact behavior until an explicitly scoped task reconciles them.

Task 1 is partially in progress. The stale example-link child PR recorded below
completed one bounded documentation repair. The 2026-09-23
`codex/adoption-entry-contracts` baseline records the current root README and
homepage authority only. Minimal runtime readiness, release owner mapping,
community policy, and later public activation work remain pending and require
their own bounded task slices.

The user selected sequential, separate conversations with PR review between
tasks to control usage. This agreement supersedes the original proposal's
multi-agent delegation and autonomous execution across all workstreams.

- Use one agent per task. Do not spawn sub-agents or parallel task conversations
  unless the user explicitly changes this agreement.
- This coordinating conversation prepares one bounded prompt and reviews the
  resulting PR. The user starts the implementation conversation.
- Finish only the assigned task. Do not start the next task automatically.
- Each prompt defines scope, exclusions, prerequisites, exact applicable gates,
  stop conditions, and whether PR creation is authorized.
- Review approval, CI completion, merge, registry publication, and deployment
  are separate states. None implies authorization for another.
- A dependent task uses an integrated predecessor by default. Working from an
  unmerged predecessor requires an explicit base and dependency in its prompt.

## Integration branch and child PRs

- Integration branch: `codex/adoption-onboarding`.
- Integration worktree: `.worktrees/adoption-onboarding`.
- Initial base: `origin/main` at `208765de9`, fetched on 2026-09-23.
- Each task gets a separate worktree under `.worktrees/` and a dedicated
  `codex/adoption-<task>` branch from the current integration head.
- Child PRs target `codex/adoption-onboarding`, not `main`. Record the tested
  base and head. If the integration head changes, renew combined validation
  and review before integration.
- Child PR review does not authorize merge automatically. Integrate only under
  the user's merge authorization and applicable repository integration guards.
- Publish the integration branch before creating remote child PRs; local branch
  creation and this planning commit do not imply a push has occurred.
- The eventual parent PR targets `main`. Its creation, merge and public release
  remain separate authorized operations.
- Other programs, including Design AI, keep their own branches and worktrees.
  Worktree isolation prevents file collisions, not semantic dependency conflicts;
  consume their changes only through a reviewed integration decision.
- First small child task: repair stale executable-example entry links to
  maintained, existing destinations as a bounded part of task 1. Do not publish
  unavailable generic-starter commands or rewrite all public documentation.
- Child PR `codex/adoption-fix-example-links`: bounded scan of `README.md`,
  `docs/ai/framework/GETTING_STARTED.md`, and `docs/public` found one active
  broken entry, `GETTING_STARTED.md` linking to removed
  `../../examples/README.md`. The replacement target is the maintained
  `golden-paths/README.md` implementation playbook. Local validation confirmed
  the target file exists, the scoped stale-link search is clean, and the public
  documentation/readme validation scripts pass through their Node entrypoints.
  This records a bounded part of task 1 only; task 1 remains pending.

## Product decisions

The maintained adoption sequence is:

```text
See Asyra -> run something -> change something -> ask a coding agent to extend it
-> notice Framework benefits -> discover the architecture
```

Asyra remains visibly a Framework. The default builder entry becomes a small,
zero-choice `create-asyra-app`; the complete Design starter is the second path;
deliberate custom composition and Runtime Atlas remain advanced paths.

The sample domain is disposable and App-owned. React may supply the UI shell
but is not a Framework requirement. Features, canonical owners, transactions,
projections, registration, and replaceable providers retain their contracts.
The starter must prove real mutation, Undo/Redo, persistence/reload, and a
bounded coding-agent extension. It must not introduce another editable model.

Renderer replacement is a later reveal. A minimal runtime must use supported
public APIs; a no-provider compatibility branch does not prove Headless support.
Prefer explicit Save/Reload for V1, subject to the existing canonical persistence
contract. Do not claim automatic incremental persistence from full snapshots.

Design, FieldScope, and Sim provide evidence of App-owned domains and engines,
not an official production 3D Preset, built-in physics, or industrial safety.
Preserve each App's maturity and release limitations.

Discussions is the intended public community channel. External PRs remain
closed by default; Issues are not the public support channel. Security follows
SECURITY.md. Community access creates no SLA and does not close Sim maintenance
or safety obligations.

## Current evidence and unresolved baseline

The initial read-only assessment found:

- The generic starter retirement test still prohibits its paths and public name.
  The new decision requires an explicit replacement contract and regression tests.
- Public builder routing favors custom composition. Getting Started retains an
  executable-examples link; the root README plan still says implementation has
  not started. Reconcile actual outcomes, not just status labels.
- The attachment's `spatial-story.tsx` and `home-resources.tsx` were absent in
  the inspected checkout and local main. The website plan did not contain the
  described supersession notice. Establish the actual accepted homepage baseline
  before changing its routes; do not reconstruct a presumed six-chapter design.
- Support wording is enforced by generators and tests, not only README prose.
- FieldScope's README says there are no plants. Verify current source and tests
  before correcting that statement or making crop claims.

These are observations from the initial local inspection, not an assertion about
the latest remote main. Task 1 must record its exact baseline commit once.

Task 1 README/homepage baseline recorded from
`b44be9e77b6a742ad8094da008b4122c06d51a2a` on 2026-09-23:

- Root `README.md` has already implemented the product-first public entry
  composition: Asyra Design evidence, the 7,076-element product proof, a
  conventional-versus-Asyra ownership comparison, a copyable Undo/Redo Feature
  excerpt, package-first and complete Design product starting paths, ownership
  boundaries, current support, and explicit non-capabilities.
- Existing README validators and tests now assert that composition, including
  `scripts/docs/__tests__/public-readme-inputs.test.mjs` and the public README
  validation workflow. This verifies the current README contract at this
  baseline; it does not prove the complete adoption program, future generic
  starter, publication readiness, or release-owner work.
- The homepage at `apps/asyra-framework-site/app/page.tsx` currently composes
  `SpatialStory`, `HomeResources`, and `SiteFooter`, with
  `apps/asyra-framework-site/docs/spatial-story.md` as the current visual,
  content, route, and verification contract. The prior observation that
  `spatial-story.tsx` and `home-resources.tsx` were absent is historical and is
  contradicted by this baseline.
- The accepted homepage is the six-chapter green spatial story at `/`; `/story`
  is removed. Current direct tests include homepage composition, route removal,
  six distinct chapters, server-owned product resources, native navigation,
  continuity, static snapshots, and Playwright coverage for desktop, mobile,
  reduced-motion, no-JavaScript, and building-replacement cases.
- Homepage CTAs and resource entries currently route to the live Asyra Design
  product, `/asyra-design`, `/docs/start/custom-composition`,
  `/docs/start/create-design-app`, and `/atlas`. This records the current entry
  implementation and tests, not final product-owner acceptance of every visual
  detail or integration with future adoption tasks.
- The six-chapter spatial story has a current contract and formal tests. Do not
  resurrect the retired factory film, five-chapter brand story, separate
  architecture explainer, PoC comic, or missing attachment description as the
  current homepage authority without a new product-owner decision.
- Remaining task 1 gaps after this README/homepage slice: minimal runtime
  readiness, exact release owners, community/support reconciliation, FieldScope
  source claims, and any integrated validation after child PRs merge.

## Relationship to Design AI work

The separate task titled `確認 asyra-design 的本機 AI 訂閱` owns the ongoing
Design local-provider and editable-design-agent work. Its inspected worktree was
`.worktrees/design-local-codex`, branch `codex/design-local-codex`, associated
with PR #223. These locations and status must be rechecked before consuming it.

Inspected source uses registered AI actions backed by App common APIs and
`transactionApis.runTransaction`. Its conversation-experience plan records real
subscription, Undo/rollback, and generated-consumer evidence. The larger
editable-design-agent plan remains active; historical passing tests do not
establish latest-head completion, merge, or publication.

Keep two acceptance cases separate:

1. A coding agent changes starter source correctly using local guidance.
2. An AI inside an App executes registered actions through canonical owners.

This program owns the first case and may cite verified Design evidence for the
second. Do not duplicate Design provider, image processing, research, panel, or
text-rendering implementation. Generic starter delivery does not depend on the
full Design agent being complete and does not require a model account or key.

## Sequential tasks

Tasks below are tracked by review and integration state. A child PR can complete
one bounded slice without completing the whole task or adoption program.

| Task | Bounded result and owners | Acceptance and dependency |
| --- | --- | --- |
| 1 - Reconcile contracts | This plan, existing entry/README/site plans, directly relevant public-entry authorities | In progress. Example-link repair is recorded above. README/homepage baseline is recorded at `b44be9e77`; the current root README composition and six-chapter homepage authority are implemented and locally testable at that baseline. Minimal-runtime readiness, existing gates beyond this slice, release owners, support/community, and remaining public-entry reconciliation stay pending. Documentation PR only; no runtime or site behavior changes. |
| 2 - Minimal canonical App | One explicitly authored App source and its direct tests/docs | Registered Feature -> App API -> canonical transaction -> projection; add/edit, Undo/Redo, validated Save/Reload, failure reporting and lifecycle. Prove supported runtime composition without Design domain coupling. Depends on task 1. |
| 3 - CLI and standalone template | Generic CLI, generation/release integration, canonical source instructions and generated output | Safe generation, supported package managers, public imports, independent install/build/typecheck/test, canonical behavior, no workspace hoisting dependency, template parity. Replace retired-contract tests deliberately. Depends on task 2. No registry publication. |
| 4 - AI-first starter onboarding | Canonical starter AGENTS/docs/tests and generated sync | One bounded priority-field extension preserves mutation, Undo, projection and saved-data compatibility through formal tests. Record whether the exercise was actually performed; instructions alone are not proof. Depends on task 3. No runtime AI provider. |
| 5 - Entry routing and product evidence | Root README, public docs/llms generators, existing homepage entry points and verified case evidence | Generic / Design / advanced hierarchy, current links, truthful App evidence, preserved visual/accessibility contracts. Reconcile only remaining README/site plan work. Depends on tasks 3-4; public activation waits for verified CLI availability. |
| 6 - Community and support | SUPPORT.md, canonical support generators/validators, directly affected App release wording | Synchronized policy, private security route, no SLA or implied PR acceptance. Confirm Discussions availability before publishing active links. Sim reporting path may change; remaining release obligations stay explicit. Depends on task 1; remains sequential by default. |
| 7 - Integrated readiness and release handoff | Affected gate results, release records, this plan and index | Review all PRs and exact integrated source; verify standalone consumption, generated docs/templates, relevant site routes and links. Identify external operations separately. Public command and live destinations must work before claiming the adoption journey delivered. |

Task 1 selects one durable adoption-contract owner; later tasks link to it
instead of creating competing authorities. Exact implementation flows and
applicable Inspector readiness belong in the relevant task before code edits.
This sequencing plan is not an Inspector contract or a runtime implementation
allowlist. Split a task further only for a concrete owner/readiness issue, not
to create more administrative work.

## Prompt and review contract

Each task prompt must include the accepted predecessor/base, a small list of
owner documents, objective, allowed mutation families, exclusions, observable
product cases, frozen validation commands, and stop conditions. Read only the
rules required by that task's triage level. Use a feature branch and preserve
other tasks' dirty work. Follow generated-artifact and naming rules where they
apply; never hand-edit generated templates as source.

Implementation handoff reports the PR and source commit, changed behavior,
exact gates and results, limitations, and any external operations not performed.
The coordinator reviews the diff, direct consumers, and required evidence once;
fix only concrete in-scope findings. Review is not a new repository-wide audit.

Update the task row with its PR, evidence and review/integration state as work
progresses. Do not mark work complete from a prompt, partial test result, pending
CI, or historical evidence belonging to another commit.

## Usage and validation discipline

- Reuse established baseline findings; no repeated whole-repository audits or
  full conversation dumps. Recheck only relevant changes and dependencies.
- Run focused permanent tests during implementation. Run applicable expensive
  integrated gates at completed owner or final checkpoints, not after each edit.
- Do not omit required gates to claim completion or weaken fail-fast/resource
  guards. Summarize failures and retain artifact paths instead of dumping logs.
- No additional live model/subscription calls as a shortcut. Describe necessary
  live evaluation explicitly in the task prompt for user authorization. Existing
  formal project tests retain their standing authorization.
- Stop repeated unsuccessful patching and revise the bounded approach. Do not
  expand into adjacent product features, packages, or architectural changes.
- No usage guarantee is made. The controls are bounded work, sequential
  execution, concise handoffs, and deliberate test checkpoints.

## Exclusions and closure

No Core redesign, generic Framework domain model, official 3D Preset, new
simulation capability, Design AI completion, Sim R0 completion, homepage visual
redesign, analytics, cloud requirement, or revived Executable Examples surface.
New dependencies and runtime upgrades retain explicit approval requirements.
Push/PR, merge, publication, deployment and repository administration follow
their applicable user authorization; planning does not perform those operations.

Close this program only when the required tasks and their integrated gates are
complete and public availability claims have live evidence. If external release
actions remain, report implementation readiness with those actions outstanding.
Use the existing plan-history workflow at actual closure, not now.
