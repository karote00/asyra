# Adoption Entry and Onboarding Program

## Status and execution agreement

Planned on 2026-09-23. Product direction accepted. This document is the single
adoption journey owner for the program sequence, task dependencies, handoff
contract, and current adoption baseline; related README and website plans remain
specialized authorities and must link back here instead of becoming competing
program plans. Existing runtime, App, release, and homepage authorities continue
to own their exact behavior until an explicitly scoped task reconciles them.

Tasks 1-6 have integrated child results through PR #252 at
`4b8015f6e01e5eaeba1227132e8dffbe076fa64b`. PR #244 was closed without
merge; PR #245 is the single starter-readiness documentation result. The
Starter build-owner repair (#254) and approved visual board with dragging and
title-draft review fix (#255) subsequently integrated at
`f518874e805ac598a0dd4ce85e8f5e1f732e3943` and
`86674ccc21ead7ad73f1fe57cb602258efbc6f63`. PR #253 later merged with all
reported checks successful, and parent PR #242 integrated the adoption work
into main. The independent AI onboarding verification is recorded below.
Task 8's published Starter entry, website deployment, and live routes were
verified on 2026-09-26 and are complete. Two program evidence gaps remain: the
recorded Task 5/7 `yarn docs:readme:check` attempts reported 15 Asyra Design
generated-template differences after applicable package README stages passed,
and no later passing result is recorded; the root README visual matrix also
lacks durable committed evidence. The Task 5 record identifies 12 screenshots
in its worktree, excluded from commits by `.gitignore`. This evidence does not
establish that the same 15 differences remain or that 15 files need correction.
Discussions settings are a separate user-owned action and are not a Codex
Adoption closeout condition.

Current release-entry status on 2026-09-26: `create-asyra-app@0.1.0` is
published on the public npm registry. Its registry integrity matches the
previously validated CLI tarball (`sha512-D+iT/bgZNN0x+9DMuWPNcSeZljoWJp1fFkxbdorv7+43fYEa9no05rmf2ODAhH9wyOfdQnp6KKXR/ob30s9wNQ==`);
that CLI tarball's SHA-256 is
`07ceb4be1d13d197a170f2e3907a3d621b2c3c64b99e2113093d5db4d5f2df77`.
The README, AI discovery, and homepage entry changes merged in PR #260 at
`6fdc917a8df201159946e2c946232ae9e2d08ad7`. Task 8's website production
deployment and live Starter entry are verified below. No Task 8 acceptance
item remains open. The composite README gate has no passing result recorded
after the Task 5/7 attempts reported 15 Design generated-template differences.
The root README plan also awaits committed artifacts for its visual matrix; the
Task 5 record identifies local screenshots excluded by `.gitignore`. The
overall plan is therefore not DONE.
GitHub Discussions settings are user-owned and outside this Codex task; they do
not block this plan's closeout.

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
- Child PR #243 `codex/adoption-entry-contracts`: merged at
  `0065d1504ac34889ded7adaea494e0d6f34b8262` and recorded the README/homepage
  baseline. Its Node validation covered focused public README inputs and
  validation entrypoints, not the complete `yarn docs:readme:check` chain.
  Visual evidence for GitHub-compatible desktop/narrow rendering with and
  without media was not found in this bounded repair, so README visual
  acceptance remains pending rather than completed.
- Child PR #244 `codex/adoption-starter-readiness` was closed without a merge.
  Child PR #245 `codex/adoption-starter-readiness-docs` is the merged
  starter-readiness documentation result at
  `b0c431fd4d832ec427a0766578d7bfb7f8785387`. Treat #244 and #245 as the same
  intended document outcome, with only #245 integrated.

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
- The earlier task 1 gap list is superseded by the integrated Tasks 2-8 and
  their retained evidence below. Two existing program conditions remain: the
  composite README check, which passed its applicable package README and
  validation stages before stopping on 15 unrelated Asyra Design template
  differences; and durable citation of the desktop/narrow README visual matrix.
  Its 12 screenshots remain in the Task 5 worktree under
  `apps/asyra-framework-site/test-results/`, but `.gitignore` excludes them from
  commits. The root README plan index keeps that visual-evidence condition
  pending until committed artifacts are cited. Neither condition belongs to
  the Starter public-entry implementation slice.

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

## Generic starter implementation readiness

Prepared on 2026-09-23 from
`origin/codex/adoption-onboarding` at
`0065d1504ac34889ded7adaea494e0d6f34b8262`. This documentation-only slice
freezes the smallest implementation-ready plan for the next minimal canonical
App task. It does not implement the starter and must not be described as
starter completion.

### Starter decision

- Source owner: create the canonical starter App source at `apps/starter-app`
  with workspace name `@asyra/starter-app`. This is the App source identity,
  not the public CLI package or generated-template identity. The name is
  intentionally brand-neutral for app-owned source while preserving the accepted
  product decision that a later zero-choice public builder command is
  `create-asyra-app`.
- Retired-starter boundary: do not use `apps/asyra`, `create-app/asyra`, or
  `release-configs/create-asyra-app.json` as a silent resurrection of the
  retired React-only starter. `scripts/__tests__/create-app-cli.test.mjs`
  currently asserts that those paths and the `create-asyra-app` public name stay
  absent. The canonical App slice must not edit that test. The later
  CLI/template slice must replace this retired-surface assertion in the same
  coherent change that introduces the successor public CLI path and generated
  template; until then, `apps/starter-app` is an internal canonical App source,
  not public activation.
- Minimal domain: use an App-owned `Item` with `id`, `title`, and `status`.
  The canonical `id` is the Scene Tree element id. `title` and `status` are
  stored in one App-owned Props property component attached to an App-owned
  component type. Current `PropertySchema` supports string fields plus a
  synchronous `validate` callback, so `status` should be a string field with an
  App-owned allowed-status validator rather than a fabricated enum schema. If
  implementation evidence shows that this cannot satisfy load fallback and
  runtime reject semantics, the minimal fallback is one validated object
  property that contains both fields, with the exact public API gap recorded.
- Composition: use `@asyra/core` as the public lifecycle facade. Before
  `core.start(...)`, register the App component/property schema, Feature,
  projection owner, load hook, diagnostics hook, any save hook needed for App
  version stamping, and cleanup. Apply `@asyra/preset` with profile `2D` and
  `defaults: []` to bind the official Pixi render provider without installing
  default product modules, then call `core.start(container, renderOptions)` and
  treat the resolved promise as readiness. `defaults: []` means no Preset
  default product wiring, so the App must install its own projection
  subscription, load refresh, UI property refresh, input shortcuts, and cleanup.
  This stays on a supported browser/Core composition path. Do not treat the
  current no-provider compatibility branch as Headless support, and do not
  install an empty custom provider merely to pass startup.
- Dependencies: the minimal App needs `@asyra/core`, `@asyra/preset`,
  `@asyra/render-engine-pixi` through Preset profile binding, and React/Vite
  only for the UI shell. It does not need Collaboration, AI runtime, backend,
  Design domain, release scripts, or new third-party packages in the starter
  App slice. Add `@asyra/persistence` only if the implementation uses a
  reference `DocumentLoadSource` or provider type directly; explicit
  Save/Reload can otherwise call `core.save()` and `core.load(...)` through the
  App document adapter.

### One complete starter data path

- Product action path: UI command or keyboard shortcut invokes the registered
  Feature. The Feature calls the App API only; the App API wraps one finite
  `runTransaction(...)` per intended add or edit action and calls Core facades
  such as `core.createElementsInParent(...)` for Item creation and
  `core.updateElementProperties(...)` for `title/status` edits. The App API is
  the canonical product owner for defaults, status eligibility, empty-title
  policy, and error messages.
- Canonical owners: Scene Tree owns Item entity identity and hierarchy; Props
  Manager owns `title/status` validation, runtime rejection, load fallback, and
  serialization; Factory owns the single undo entry and Undo/Redo replay; Core
  coordinates startup, registration, load/save, shared publication observation,
  and owner facades. React owns only transient input text, selected row, and
  command affordances.
- Projection and UI subscription: create one App projection store from Core
  observation facades. Initial startup builds the projection after the App has
  registered schemas/features/projection wiring, applied Preset, awaited
  `core.start(...)`, and read current canonical data through
  `core.getElementData(...)`, `core.getElementComputedData(...)`, and the
  App-owned Item property relation. General add/edit mutations refresh the
  projection from `core.subscribeToSharedPublication(...)` for completed
  document publications. Undo and Redo use the existing
  `undoWithRenderPolicy(...)` / `redoWithRenderPolicy(...)` route and refresh
  through the same shared-publication consumer plus any App command completion
  state needed for disabled/enabled controls. Reload is different: Core
  `load(...)` applies validated package state and emits `fileLoadComplete()`;
  it does not necessarily emit `sceneTreeLoadComplete`, and shared publication
  must not be assumed to contain every load update. The App must subscribe to
  the public `subscribeToFileLoadComplete(...)` entry for full projection
  rebuild after accepted reload. Dispose calls every retained unsubscribe from
  shared publication, file-load, UI property, shortcut, timer/resource, and
  runtime cleanup registration, and must prove late callbacks cannot update a
  retired projection. Where a UI value needs a derived registration, use
  `core.registerUIProperty(...)`, `core.getUIPropertySubject(...)`, and
  `core.onUIPropertyChange(...)`; registration alone does not install the
  document-change subscription. The projection must not keep a second editable
  document or make React state the source of persisted item data.
- Undo/Redo: expose Undo/Redo through the existing Factory/Core route. The next
  implementation may use the public `undoWithRenderPolicy(...)` /
  `redoWithRenderPolicy(...)` helpers re-exported from `@asyra/core` or an App
  command path that already wraps those helpers. It must verify add, edit,
  Undo, Redo, projection refresh, and explicit serialization through the normal
  caller path, not by editing Factory history directly.
- Save/Reload V1: use explicit `core.save()` and one App-owned browser
  `localStorage` slot, `starter-app.document.v1`. V1 does not add export/import
  UI and does not schedule save from every transaction. Save builds an
  App-owned wrapper `{ appDocumentVersion: 1, savedAt, core }`, where `core` is
  the detached `CoreRawData` returned by `core.save()`, then writes that wrapper
  to the single slot. The UI may show "saved" only after `localStorage.setItem`
  succeeds. Quota, serialization, unavailable-storage, or write failures are
  App UI errors and must not be reported as saved. Core still owns package
  snapshot assembly and performs no provider I/O.
- Reload acceptance V1: read only `starter-app.document.v1`; parse JSON; require
  an object wrapper with `appDocumentVersion === 1`, a string `savedAt`, and an
  object `core` payload. Missing slot is a user-visible "nothing saved yet"
  state and does not mutate the current document. JSON parse failure, malformed
  wrapper shape, unknown `appDocumentVersion`, missing `core`, or a non-object
  `core` payload are rejected by App admission before `core.preflightLoad(...)`.
  Before Core preflight or load, the App-owned V1 domain admission hook inspects
  the raw App Item components in `wrapper.core.props` with the same domain
  predicates used by the runtime Item property schema: required `title` string,
  required `status` string, and allowed status values. It returns the unchanged
  Core document on success and throws an App-domain load error on failure. Do
  not duplicate a second set of status/title rules in Reload code; share the
  planned App predicate module with the property schema registration. This hook
  is synchronous and side-effect free, and it runs before any Props fallback can
  assign default values.
- Core/package structural validation remains separate from App-domain
  admission. Core preflight still owns malformed Core shape diagnostics,
  package registration diagnostics, and Scene Tree hierarchy rejection; App
  domain admission owns Item `title`/`status` presence and status eligibility.
  Props Manager's current preflight path validates component map/type/id and
  registration, while field-level schema fallback happens when property
  components load. Therefore a structurally valid Item payload can have no Core
  preflight diagnostics while still being domain-invalid for V1. After wrapper
  and App-domain admission, run `core.preflightLoad(wrapper.core)`. Any thrown
  App-domain error, thrown load hook, invalid Scene hierarchy, or non-empty
  Core/package diagnostic list rejects the reload, shows the App-domain or
  structural diagnostic/error summary, and preserves the current document,
  history, and projection. V1 accepts only a clean current-version document.
  Every accepted reload then calls `core.load(...)`, rebuilds the projection
  through the `fileLoadComplete` path above, and reports success only after load
  returns.

### Direct API and formal-test evidence

- Lifecycle and public facade: `docs/ai/framework/packages/core.md`,
  `docs/public/reference/packages/core.md`, `packages/core/src/index.ts`,
  `packages/core/src/core.ts`,
  `packages/core/src/__tests__/core-start-render.test.ts`,
  `packages/core/src/__tests__/render-engine-provider.test.ts`, and
  `packages/core/src/__tests__/core-runtime-reset.test.ts`.
- Feature path and transaction owner:
  `docs/ai/framework/packages/feature-system.md`,
  `docs/ai/framework/packages/factory.md`,
  `docs/ai/framework/rules/data-flow-and-transactions.md`,
  `packages/core/src/__tests__/registration-facade.test.ts`,
  `packages/factory/src/__tests__/factory.test.ts`,
  `packages/factory/src/__tests__/history-depth.test.ts`, and
  `packages/factory/src/__tests__/shared-publication.test.ts`.
- App-owned schema, canonical properties, and projection:
  `docs/ai/framework/packages/props-manager.md`,
  `docs/ai/framework/packages/scene-tree.md`,
  `docs/ai/framework/packages/ui-context.md`,
  `packages/core/src/__tests__/define-component.test.ts`,
  `packages/core/src/__tests__/define-property-component.test.ts`,
  `packages/core/src/__tests__/element-property-api.test.ts`,
  `packages/scene-tree/src/__tests__/property-type-projection.test.ts`, and
  `packages/preset/src/__tests__/selection-subscriptions.test.ts`.
- Explicit persistence and load validation:
  `docs/ai/framework/packages/persistence.md`,
  `docs/public/start/custom-composition.md`,
  `packages/props-manager/src/manager/props-manager.ts`,
  `packages/props-manager/src/components/base.ts`,
  `packages/core/src/__tests__/transaction-persistence.test.ts`, and
  `packages/core/src/__tests__/load-validation.test.ts`.
- Preset/provider composition:
  `docs/ai/framework/packages/preset.md`,
  `docs/public/start/preset-2d.md`,
  `packages/preset/src/__tests__/apply-preset.test.ts`, and
  `packages/preset/src/__tests__/profile-provider.test.ts`.
- Release, generation, and consumer ownership:
  `docs/ai/framework/rules/generated-artifacts.md`,
  `docs/ai/framework/rules/release-version-topology.md`,
  `scripts/__tests__/create-app-cli.test.mjs`,
  `scripts/release-template.js`,
  `release-configs/asyra-design.json`,
  `scripts/__tests__/release-template-readiness.test.mjs`,
  `scripts/__tests__/release-clean-consumer.test.mjs`,
  `scripts/__tests__/app-release-plan.test.mjs`,
  `scripts/__tests__/app-release-service.test.mjs`,
  `scripts/__tests__/app-release-workflow.test.mjs`,
  `scripts/__tests__/app-release-verification.test.mjs`,
  `docs/ai/framework/plans/completed/local-versioned-package-install-research-plan.md`,
  and
  `docs/ai/framework/plans/completed/create-asyra-design-app-release-plan.md`.

### Release, generation, and consumer step owners

These are boundaries for later tasks, not work performed by this documentation
slice.

- App source owner: `apps/starter-app` and workspace `@asyra/starter-app`.
  Inputs are app source, app-local docs/tests, and workspace metadata. Outputs
  are runnable App source and formal App tests. Existing command for the next
  App task: no script exists yet; the task must add app-local tests and then run
  their actual workspace command. Until that script exists, do not list a
  fabricated `yarn workspace @asyra/starter-app ...` command as current.
- CLI and template generation owner: later CLI/template slice. Inputs are the
  accepted `apps/starter-app` source, successor release config, CLI package,
  generation rules, and the retired-starter test contract. Outputs are the
  public `create-asyra-app` command, generated standalone template, and updated
  assertions replacing the current retired-surface checks. Existing command
  today only covers Asyra Design: `yarn release:app:check --prod=asyra-design`.
  Any `--prod=starter-app` or `--prod=create-asyra-app` check is a next-task
  addition, not an existing script.
- Release-template owner: `scripts/release-template.js` plus a release config.
  Inputs are `src`, `dest`, `license`, cleanup lists, and package manifests.
  Outputs are copied template files, standalone README/LICENSE, exact
  `@asyra/*` dependency versions, Node/Yarn metadata, and cleaned scripts/files.
  The script may be used only after the successor release config exists.
- Framework clean/registry consumer owner: `scripts/release-readiness.js`,
  invoked as `yarn release:consumer` for packed artifacts and
  `yarn release:consumer:registry` for public registry packages. Inputs are
  validated Framework package artifacts under `tmp/framework-release-artifacts`
  or registry versions plus the clean-consumer fixture. Outputs are
  project-local consumer directories under `tmp/`, install/typecheck/build/test
  evidence, and release evidence JSON. This owner proves Framework packages,
  not generated starter templates.
- Generated-template consumer owner: `scripts/release-template-readiness.js`,
  invoked today as `yarn release:template --prod=asyra-design`. Inputs are a
  release config (`release-configs/<app>.json`), committed generated template,
  Framework release metadata, and packed artifacts under
  `tmp/framework-release-artifacts`. Outputs are a temporary generated-template
  consumer under `tmp/`, install/typecheck/lint/build/test/startup-smoke
  phases, installed-package identity checks, and generated-template evidence.
  This owner already exists and should be reused for the starter once the
  starter release config and generated template exist. Starter-specific work is
  to add `release-configs/starter-app.json`, the generated template target, CLI
  package wiring, and any starter-specific smoke expectations; it is not to
  invent a second generated-template readiness tool.
- Create-app release/publication owner: `scripts/release-create-app.js` owns
  the selected CLI release sequence through
  `yarn release:create-app --prod=<app>`, beginning with
  `yarn release:consumer:registry`, then `yarn release:app`,
  `yarn release:validate`, `npm pack ./create-app/<app> --dry-run --json`, and
  finally `scripts/publish-create-app.js`. `scripts/publish-create-app.js`
  publishes `create-app/<app>` and creates the CLI package tag. `scripts/release-full.js`
  composes Framework publication first and create-app publication second. These
  are existing owners and remain separate explicit operations requiring user
  authorization; this plan does not run them.
- Publication boundary: registry publication, push, tags, release records, live
  site routing, and production deployment are external operations requiring
  separate authorization. This adoption plan may name their existing owners but
  does not perform or imply them.

### Next implementation task contract

The next minimal canonical App task is limited to startup, add/edit Item,
Undo/Redo, projection, and explicit Save/Reload. Authorized mutation families
are the new canonical App source, its app-local docs/tests, and only the direct
workspace metadata required to run that App. It must not create the public CLI,
generated template, release config, package publication, homepage routing,
community policy, FieldScope evidence, Design AI work, or release scripts.

Acceptance for that task:

- App startup registers the App component/property/Feature/projection before
  `core.start(...)`, applies a real supported provider path, reaches ready, and
  disposes subscriptions/cleanup without late writes.
- Add and edit run through Feature -> App API -> one transaction -> Core owner
  facade, with invalid status and invalid load values covered by formal tests.
- Undo and Redo restore canonical state and refresh the same projection used by
  UI; no second editable document exists.
- Save returns a versioned `CoreRawData` snapshot and Reload validates,
  reports errors, applies only accepted data, and preserves document-version
  behavior.
- V1 reload regression cases must include structurally valid Core/Props/Scene
  payloads whose package preflight can report no diagnostics but whose App Item
  domain data is invalid. Invalid status, missing `title`, and missing `status`
  must each reject before `core.load(...)`, leave document/history/projection
  unchanged, and show an App-domain error. A valid V1 round trip must accept,
  call `core.load(...)`, refresh through `fileLoadComplete`, and preserve Item
  data.
- Focused gates should include the new App unit/integration tests plus the
  relevant existing package tests named above if implementation touches their
  owner contract. Full visual, 7076, release, or generated-template gates are
  not part of the minimal App slice unless that implementation broadens into
  those owners.
- Explicit next-task validation commands:
  - Baseline naming gate before introducing identifiers:
    `yarn lint:naming` when Yarn install state is available, otherwise the
    direct Node entrypoint from package.json:
    `node --test scripts/__tests__/brand-neutral-code.test.mjs scripts/__tests__/display-name-separators.test.mjs`.
  - Planned, added by next App task: `yarn workspace @asyra/starter-app test`
    for focused App behavior tests covering startup, add/edit, invalid status,
    invalid reload data, Undo/Redo, projection refresh, Save, Reload, and
    dispose.
  - Planned, added by next App task:
    `yarn workspace @asyra/starter-app typecheck`.
  - Planned, added by next App task:
    `yarn workspace @asyra/starter-app react:build`.
  - Planned, added by next App task:
    `yarn workspace @asyra/starter-app lint` if the new workspace defines an
    app-local lint script; otherwise run the repository lint only if the slice
    changes shared lint-owned surfaces. These planned commands are part of the
    next task's package.json/workspace metadata work and do not exist at this
    baseline.
  - If package owner contracts are touched, run the directly relevant existing
    package tests listed in "Direct API and formal-test evidence"; otherwise
    cite them as read evidence only.
  - Always run `git diff --check` and a bounded final diff review.

Inspector readiness: this readiness slice does not create a runtime flow. The
next implementation should first check whether it changes or proves an existing
Inspector-governed owner. Framework transaction/load/persistence semantics
already have owner contracts in the package docs and retained Inspectors
referenced from those docs. A starter-specific runtime Inspector is not a
prerequisite for a small App slice unless the implementation changes a governed
step or discovers that ordinary app-local docs and tests cannot express the App
product contract.

True starter prerequisites are: supported Core/Preset browser composition, an
App-owned Item schema decision, the Feature/App API transaction path, explicit
Save/Reload validation, and a replacement plan for the retired generic CLI
contract when the CLI slice begins. Community/support wording, FieldScope crop
claims, homepage/public activation, registry publication, and Design AI evidence
remain separate adoption tasks and must not block the minimal starter App
implementation.

## Sequential tasks

Tasks below are tracked by review and integration state. A child PR can complete
one bounded slice without completing the whole task or adoption program.

| Task | Bounded result and owners | Acceptance and dependency |
| --- | --- | --- |
| 1 - Reconcile contracts | This plan, existing entry/README/site plans, directly relevant public-entry authorities | The example-link repair and merged PRs #243/#245 established the entry and Starter-readiness documentation baseline; #244 was closed without merge. Tasks 2-8 supplied the Starter runtime, registry CLI/template, README/site entry, FieldScope evidence wording, support policy, and live public activation. Task 5's desktop/narrow README rendering was inspected; its 12 screenshots remain ignored local artifacts, so the separate root README plan's committed-evidence condition is still open. The composite README check also remains blocked by unrelated Design template drift; publication and deployment are complete. |
| 2 - Minimal canonical App | `apps/starter-app`, workspace `@asyra/starter-app`, and direct app-local tests/docs | Merged in child PR #247 at `407fd9c833889ce04ee8bdde3934b4076320435f`. The integrated App is revalidated in Task 7 below. This slice alone did not create the CLI/template, release, or public activation. |
| 3 - CLI and standalone template | Public `create-asyra-app` CLI, `create-app/starter-app`, `release-configs/starter-app.json`, generated `create-app/starter-app/template`, and directly affected release/generation tests | Merged in child PR #249 at `b1dcfa106b44a0f3b56ee605612b072e2dfb3602` into `codex/adoption-onboarding`; Task 4 starts from that exact integrated head. Task 3's local validation covered naming, focused CLI/template tests, Starter test/typecheck/lint/react:build, root lint, template sync, package artifacts, and packed-artifact template consumer install/typecheck/lint/build/test/startup smoke. This records Task 3 integration, not registry publication or public activation. |
| 4 - AI-first starter onboarding | Canonical Starter AGENTS/onboarding/prompt, opt-in priority exercise and formal tests, generated template sync | Merged in child PR #250 at `b785160c5645212509d3e1ca1ed4e8647922961c` into `codex/adoption-onboarding`. The priority tests failed before implementation and then passed through the App schema, Feature/API transaction, projection and Save/Reload owners. Starter test/typecheck/lint/build, desktop/narrow E2E, CLI/template tests, root lint, naming, template sync and packed-artifact generated consumer passed locally. The consumer reported `READY` for install/typecheck/lint/build/test/startup smoke on Node `v24.13.0` and Yarn `4.3.1`. No independent fresh coding-agent conversation or registry verification was performed; no AI provider was added. |
| 5 - Entry routing and product evidence | Root README, public docs/llms generators, existing homepage entry points and verified case evidence | Merged in child PR #251 at `fb7050f9a43a3f00fb73a6028457c1abfc24051b` into `codex/adoption-onboarding`. The merge commit contains the Task 5 source, generated documentation, validators, and tests. At that integration point, Registry publication and Starter public activation remained pending. Task 5's local gates and the unrelated Design template drift are recorded in the bounded contract below; this integration does not claim a completed composite `docs:readme:check`, release, publication, or deployment. |
| 6 - Community and support | SUPPORT.md, canonical support generators/validators, directly affected App release wording | Merged in child PR #252 at `4b8015f6e01e5eaeba1227132e8dffbe076fa64b`. GitHub Discussions remained disabled on the Task 7 recheck; no inactive link is published. Integrated support and generated-doc checks are recorded below. Sim maintenance and safety obligations remain open. |
| 7 - Integrated readiness and release handoff | Affected gate results, this plan and index | Integration validation and handoff record refreshed for `86674ccc21ead7ad73f1fe57cb602258efbc6f63` after #254/#255 merged. PR #253 merged at `a492b786b785769ba88b5c186a366cb618ebfc4c` with all reported checks successful; parent PR #242 merged to main at `e550e87b29824f72a1430eb34eac98f18c33235d`. Independent onboarding evidence is recorded below. The composite README gate remains blocked by unrelated Design template drift. |
| 8 - Published Starter public entry | README, homepage card, generated public docs/llms, release-entry status, and a pending empty Changeset | Completed on 2026-09-26. PR #260 integrated the published `create-asyra-app@0.1.0` installation path; the non-noop production deployment and live homepage/docs/source/onboarding/npm destinations are verified below. No Task 8 acceptance item remains open. |

### Task 7 integration validation and release handoff (2026-09-24 snapshot)

Initial frozen source and scope: `origin/codex/adoption-onboarding` at
`4b8015f6e01e5eaeba1227132e8dffbe076fa64b` (PR #252 merge), Node
`v24.13.0`, Yarn `4.3.1`, 2026-09-24. GitHub metadata confirms PRs #247 and
#249-#252 merged into that integration branch. Discovery was limited to this
plan; canonical Starter; generic CLI/template and their direct generators;
README, public docs/llms, three website entry cards, support policy, and formal
tests. Only this plan and its existing index may change. Product code, Design
template/runtime/release flow, dependencies, repository settings, publication,
tagging, and deployment are excluded. An in-scope gate failure, a changed
source SHA, or an unreviewable evidence mismatch stops that frozen validation
until a new source is bounded and checked; the known unrelated Design template
drift is reported separately.

Initial local results on `4b8015f6e01e5eaeba1227132e8dffbe076fa64b`:

- **Passed:** naming; 47 focused CLI/template/README/public-doc/support tests;
  Starter 13 tests (including opt-in priority), typecheck, lint, build, and two
  desktop/narrow E2E cases covering add/edit/status, Undo/Redo, Save/Reload;
  Starter template sync; package README and public docs/llms freshness and
  validation; website 97 passing contract/unit tests (15 skipped by their
  existing conditions), typecheck, lint, production build, 46-page route smoke,
  and 37 related desktop/mobile/reduced-motion/no-JavaScript E2E cases; root
  lint with 0 errors and 79 existing warnings. The formal packed CLI test checks
  bundled template assets and safe CLI behavior; the canonical source/template
  check passed.
- **Passed, distinct consumer evidence:** `yarn release:packages` packed 19
  Framework packages; `yarn release:consumer` reported `READY` for 19 packed
  packages through install/typecheck/build/test;
  `yarn release:template --prod=starter-app` reported `READY` for the generated
  standalone app through install/typecheck/lint/build/test/startup smoke. Its
  formal contract rejects workspace/hoisted/source-alias resolution. Separately,
  `yarn release:consumer:registry` reported `READY` for 19 currently published
  Framework packages through install/typecheck/build/test. This is Framework
  registry evidence, not a registry-installed Starter CLI or public release.
- **Failed as expected (Task 7 run):** composite `yarn docs:readme:check` passed
  applicable package README and README validation stages, then reported 15
  differing Asyra Design generated-template files. This is the result of that
  run, not a current count of differences or a confirmed repair scope. The
  applicable `docs:readme:packages:check`, `docs:readme:validate`,
  `docs:public:check`, and `docs:public:validate` passed separately. No Design
  template synchronization or full Design validation was performed.
- **Public state, read-only:** npm returned 404 for `create-asyra-app`.
  GitHub Discussions is disabled. The public Framework homepage, `/docs`,
  `/asyra-design`, both maintained guide destinations, and the live Design
  product returned HTTP 200, but the deployed homepage and `/docs` did not yet
  contain the integrated Generic Starter entry/source anchor. Local route/E2E
  success does not establish deployment of this source.
- **Not performed:** an independent fresh coding-agent onboarding task;
  registry-installed generated Starter/CLI consumer; release publication,
  tagging, deployment, or merge of this Task 7 child PR. Existing
  opt-in priority tests are product behavior evidence, not independent agent
  success evidence.

Refresh on the latest integrated product source,
`86674ccc21ead7ad73f1fe57cb602258efbc6f63` (Node `v24.13.0`, Yarn
`4.3.1`, 2026-09-24): GitHub confirms #254 and #255 merged into
`codex/adoption-onboarding`. Its Git tree
`833ffb69535a85c1e68b9589aa5810a51aee5aaf` is identical to validated
#255 head `2c090f80536dc1ded52f5f1f2d5b5579eadcf487`; the Task 5/6 README,
public docs/llms, website, and support inputs are unchanged since the initial
Task 7 source. Thus the earlier public-entry/support gates and #255's 19-package
artifact and six-phase generated Starter clean-consumer `READY` evidence carry
over by exact input identity, not by treating an older SHA as a new run. The
earlier packed and registry-only Framework consumers likewise retain their
unchanged package inputs; neither is a registry-installed Starter CLI result.
#255's CI checks, including Framework release readiness, completed successfully.

- **Re-executed on this integrated source:** Starter 16 unit tests (including
  opt-in priority), typecheck, lint, production build, and canonical/generated
  template synchronization passed. Focused desktop/narrow E2E on an isolated
  local port passed 7 cases with one desktop touch case skipped by its intended
  project condition. The cases cover canvas drag, title draft preservation on
  click and drag selection, edit-then-drag Undo order, invalid title feedback,
  touch drag, and pointer cancellation. Desktop and narrow drag screenshots
  from that same App path were inspected. Playwright closed its temporary port.
- **CI state, kept distinct:** the original #253 head
  `dc35222eb610d3181ae7caf4c597b41dcbc13cb1` failed in run
  `35983934121` as described below. The later pre-sync #253 head
  `5cfd2524964170fa8a7baddad20d192b762f5993` completed all ten reported
  checks successfully; #254 and #255 also completed their reported checks.
  These later successes and #254's one-build regression support the repair, but
  do not alone prove every cause of the earlier build race or Flow Inspector
  count failure. The updated #253 head needs its own CI result after push.
- **Current public state, read-only:** npm still returns 404 for
  `create-asyra-app`; GitHub Discussions is disabled. The live Framework `/`,
  `/docs`, `/asyra-design`, and two maintained start guides return HTTP 200,
  while the deployed homepage and `/docs` still omit the integrated generic
  Starter command/entry. Local and packed consumers do not establish a
  registry-installed CLI or website deployment.

Task 7's original handoff listed review of #253, registry publication, website
deployment, independent-agent evidence, and the composite README gate as separate
follow-ups. The first four are now evidenced: #253 and parent #242 merged with
successful checks, `create-asyra-app@0.1.0` and its registry consumer are
verified, the live website entry is recorded under Task 8, and the independent
AI onboarding result is retained below. Task 8 is complete. Two program-level
evidence gaps remain: Task 7's recorded `yarn docs:readme:check` attempt
reported 15 unrelated Asyra Design generated-template differences after
applicable package README stages passed, and no later passing result is
recorded; the root README plan still awaits committed artifacts for its visual
matrix. The Task 5 record identifies screenshots excluded from commits by
`.gitignore`. These records do not establish a current count of Design
differences or how many files would need correction. GitHub Discussions
settings are a separate user-owned action, outside this Codex task and not a
closeout blocker.

### Independent AI onboarding verification from main

A separate single-agent conversation started from fetched `origin/main` at
`e550e87b29824f72a1430eb34eac98f18c33235d`, after the adoption work had
reached main. Its PR base is `main`, not the former adoption integration branch.
The agent read the adoption plan's independent-verification scope and the
generated Starter's `AGENTS.md`, `docs/ONBOARDING.md`, and unchanged
`docs/PRIORITY_AGENT_PROMPT.md`. It generated a standalone Yarn consumer with
the local CLI and used the existing local package-packing flow for Framework
dependencies. The retained consumer and formal tests are in
`fixtures/adoption-priority-consumer/`; its `VERIFICATION.md` records the exact
commands and evidence boundary.

The prompt was completed without an extra human hint or a private monorepo
source import. Three new formal assertions failed before implementation:
two default-runtime cases rejected priority as an unsupported field and the UI
had no Priority control. After the consumer-only edit, 21/21 tests passed,
including the original title/status/drag cases, as did consumer typecheck,
lint, and build. The live generated page showed Normal on creation, High on
edit, Normal/High through Undo/Redo, and saved High after Reload. Formal tests
also prove that a legal V1 Item missing priority loads as Normal and a present
invalid value is rejected before Core preflight/load without changing the
document, history, or projection. No public document or API blocker was found.

This is local CLI generation and packed Framework consumer evidence. It is
distinct from installing `create-asyra-app` from npm or publishing the edited
consumer. At the time of this verification, registry distribution, website
deployment, review/CI, and community activation remained unfinished. Later
registry and website outcomes are recorded below; this local result alone did
not mark the adoption program DONE.

### Generic Starter registry consumer verification

Follow-up source baseline: `origin/main` at
`2bc5db655253bd683af97cffe3a974c4a3f3bdcb` (2026-09-25). The Framework
release stage published the versions in that source. The synchronized Starter
template pins `@asyra/core@0.5.7`, `@asyra/preset@0.5.8`, and
`@asyra/utils@0.5.2`, matching their source manifests.

The consumer was generated by the CLI installed from the actual packed
`create-asyra-app@0.1.0` tarball. Tarball SHA-256:
`07ceb4be1d13d197a170f2e3907a3d621b2c3c64b99e2113093d5db4d5f2df77`.
Separate npm and Yarn CLI runs created fresh consumers. Both installed all
three Framework dependencies from `https://registry.npmjs.org`; their lockfiles
identify registry resolutions and the installed package directories are real
directories, not symlinks. Both consumers passed install, 16/16 formal tests,
typecheck, lint, and production build. The existing Starter interaction suite
passed 11 tests and skipped its one narrow-only case on each consumer. This
includes actual page and Item edit, Undo/Redo, Save/Reload, and canvas
interaction assertions; an HTTP response alone is not used as product proof.

The synchronization check, Starter workspace tests/typecheck/lint/build, root
Framework build, naming gate, CLI/template readiness tests (17/17), and root
lint completed. The supplementary packed-artifact gate packed and validated 19
Framework packages, then reported the Starter template consumer `READY` for 3
packages and 6 phases. The initial Starter workspace build required the root
Framework build first because this fresh worktree had no local package outputs.

This evidence resolves the Framework-version and generated-consumer blocker
recorded in PR #257 for the tested source and tarball. At the time of this
verification record, the CLI package itself was still unpublished to npm;
later publication and current-entry activation are tracked separately below.
This verification did not mark the adoption program DONE.

### Published Starter entry and npm CLI verification

Source baseline: `origin/main` at
`c14d5040cdb19e2cd3d5d962a711101b853dde1b` (2026-09-26). On that source,
the public registry reports `create-asyra-app@0.1.0` with integrity
`sha512-D+iT/bgZNN0x+9DMuWPNcSeZljoWJp1fFkxbdorv7+43fYEa9no05rmf2ODAhH9wyOfdQnp6KKXR/ob30s9wNQ==`
and tarball URL
`https://registry.npmjs.org/create-asyra-app/-/create-asyra-app-0.1.0.tgz`.
The integrity matches the previously validated CLI tarball, whose SHA-256 is
`07ceb4be1d13d197a170f2e3907a3d621b2c3c64b99e2113093d5db4d5f2df77`.

Using Node `v24.13.0` and npm `10.8.2`, the exact `npx
create-asyra-app@0.1.0 my-app --package-manager=npm` path created a fresh
consumer after disabling npm's workspace discovery for this monorepo checkout.
An initial run with workspace discovery enabled resolved no executable in
this repository context; the same public npx command succeeded with
`npm_config_workspaces=false`. A separate `npm install
create-asyra-app@0.1.0` also installed the registry CLI and its binary generated
a consumer. Its lockfile records the registry tarball URL, exact integrity,
version `0.1.0`, and Node `24.x` engine. The README-path npm and Yarn consumers
were both generated from the registry CLI; both installed the generated
Framework dependencies from the public registry. No repo bin, local CLI
tarball, or workspace link was used for either generated consumer.

The README-path consumer installed `@asyra/core@0.5.7`,
`@asyra/preset@0.5.8`, and `@asyra/utils@0.5.2`; its lockfile resolves those
packages from `https://registry.npmjs.org`, and the installed directories are
not symlinks. It passed 16/16 tests, typecheck, lint, and production build.
The existing Starter Playwright interaction suite ran against both generated
consumers on desktop and narrow viewports: each run had 11 passed and 1 skipped
by its existing condition. They exercised item editing, Undo/Redo, Save/Reload,
canvas dragging, title-draft history, and pointer cancellation. The Yarn
consumer also passed 16/16 tests, typecheck, lint, and production build.

This result proves the published npm CLI and Framework registry consumer path
for the source above. The README, homepage card, public overview, generated
llms indexes, and this plan were updated in PR #260. Production deployment and
the live entry are verified below. This completes Task 8; the overall plan
remains active for the composite README gate's missing passing evidence and the
root README visual matrix's missing committed artifacts, as described in the
current status. Discussions settings are user-owned and not a closeout blocker.

Homepage verification for this entry edit: site `test:local` passed 97 tests
with 15 existing conditional skips; typecheck, lint, and production build
passed. Focused homepage routing E2E passed all 3 cases, including 1440px and
390px views, no-JavaScript/reduced-motion routing, the pinned npm command, and
the npm link's new-tab security attributes. The desktop and narrow screenshots
of both the entry card and destination docs content were inspected. The command
code block remains horizontally scrollable at the narrow viewport.

Task 8 production activation was verified read-only on 2026-09-26. The
<a href="https://github.com/karote00/asyra/actions/runs/36218261819" target="_blank" rel="noopener noreferrer">Manual App Release - Asyra Website run</a>
used main SHA `6fdc917a8df201159946e2c946232ae9e2d08ad7`; its plan selected
`asyra-framework` with `release: true` and `forced: false`, so this was not a
no-op. GitHub Deployment `6674692486` targets `app-production`, ref `main`, and
the same SHA; its final status is `success` at 2026-09-26 04:38:17 UTC. The
publish job is
<a href="https://github.com/karote00/asyra/actions/runs/36218261819/job/108338714990" target="_blank" rel="noopener noreferrer">recorded here</a>.
The run's release plan identifies `asyra-framework.vercel.app` as the stable
Production host, and that public URL displayed the Generic Starter homepage
card and linked documentation. The live
<a href="https://asyra-framework.vercel.app/docs#generic-starter-source" target="_blank" rel="noopener noreferrer">Starter documentation section</a>
links to the main-branch Starter source, onboarding guide, and published npm
package. It shows
`npx create-asyra-app@0.1.0 my-app --package-manager=npm`; the
<a href="https://www.npmjs.com/package/create-asyra-app/v/0.1.0" target="_blank" rel="noopener noreferrer">npm 0.1.0 page</a>
confirms that version is public. The homepage, docs overview, custom-composition
guide, Starter README, and onboarding guide opened successfully. This closes
the website deployment/live-entry portion of Task 8. The overall Adoption
plan remains active because the composite README gate has no later passing
result recorded and the root README visual matrix still lacks committed
artifacts; see the status above. Discussions settings are a separate
user-owned action and are not a blocker.

Historical CI detail: #253 head `dc35222eb610d3181ae7caf4c597b41dcbc13cb1`
failed in run `35983934121`. Render-performance job `107582066413` failed during
Design Vite build, before performance tests, because the built Props Manager
imported the runtime `Setter` class from a `@asyra/utils/dist` output that did
not export it at that instant. The separate, now merged PR #254 addressed the
confirmed duplicate Starter dependency build; its real-build regression
measured two `@asyra/utils` executions before the repair and one afterward,
with valid artifacts. The original #253 head also had a separate `validate`
failure at `tools/flow-inspector/control-plane/__tests__/agent-task.test.cjs:363`
(`29 !== 30`); `flow-ci` failed in aggregation, and Framework release readiness
was skipped. Later green CI is recorded above without treating that single
outcome as a complete causal explanation. Review #253's new exact-head CI
before merging it. The parent #242 can receive final adoption handoff review
after #253 is integrated, its head includes this record, and required checks
complete on that head; this does not authorize merging #242 or claiming the
public adoption journey delivered.

Task 1 selects one durable adoption-contract owner; later tasks link to it
instead of creating competing authorities. Exact implementation flows and
applicable Inspector readiness belong in the relevant task before code edits.
This sequencing plan is not an Inspector contract or a runtime implementation
allowlist. Split a task further only for a concrete owner/readiness issue, not
to create more administrative work.

### Task 3 bounded contract - CLI and standalone template

Objective and completion condition: provide a safe public `create-asyra-app`
CLI that copies the canonical generated Starter template into a standalone
project, installs with a supported package manager, and reports clear next
steps. The committed generated template must be synchronized from
`apps/starter-app` through the existing release-template owner and must pass the
generated-template consumer readiness owner without relying on monorepo
hoisting, `workspace:*`, source aliases, or unpublished registry state.

Authorized mutation scope:

- `docs/ai/framework/plans/adoption-entry-and-onboarding-program-plan.md` only
  for this Task 3 contract, Task 2/3 status, and the prompt contract wording
  that now references #248's common rules.
- `create-app/starter-app/**` for the directly maintained CLI package,
  executable, README/LICENSE, and generated `template/**` output.
- `release-configs/starter-app.json` for the Starter release-template input.
- `apps/starter-app` only for release-source metadata or script values required
  to generate the standalone template from the canonical source without changing
  the Task 2 runtime behavior.
- Direct tests and release owner wiring needed to admit this App into existing
  generation/consumer checks, including `scripts/__tests__/create-app-cli.test.mjs`
  and `scripts/__tests__/release-template-readiness.test.mjs`.
- Workspace metadata only if required for the new CLI workspace to install and
  validate.

Required product cases and formal tests:

- CLI name/path validation rejects empty, absolute, nested, dot, and parent
  directory targets before copying.
- Existing destination directories are never overwritten.
- Missing template, copy, install, and unsupported package-manager failures are
  reported with actionable error text and non-zero exit.
- Declared package-manager modes cover `yarn` and `npm` with the
  correct lockfile, install command, and start command. The tests may stub the
  package managers for CLI behavior, but must also verify that `pnpm` is
  rejected before project creation. The generated-template readiness gate owns
  the real Yarn consumer proof.
- The generated template is source/template synchronized from
  `apps/starter-app`, contains only public `@asyra/*` imports, uses frozen
  package versions for packed-artifact verification, and contains no
  `workspace:*`, source-alias, or monorepo-only scripts.
- The packed-artifact generated consumer completes install, typecheck, lint,
  test, build, and startup smoke under `tmp/`, with evidence identified as
  local packed-artifact evidence. This was the initial Task 3 boundary; after
  the Framework versions were separately published, the follow-up registry
  consumer result is recorded in “Generic Starter registry consumer
  verification” above. The CLI itself remains unpublished.

Required gates for this slice:

- Baseline and final naming gate:
  `node --test scripts/__tests__/brand-neutral-code.test.mjs scripts/__tests__/display-name-separators.test.mjs`
  or `yarn lint:naming` when using the root script.
- Focused CLI/generation tests:
  `node --test scripts/__tests__/create-app-cli.test.mjs scripts/__tests__/release-template-readiness.test.mjs`.
  Root `test:scripts` runs the same CLI test in CI.
- Starter App preservation gates:
  `yarn workspace @asyra/starter-app test`, `typecheck`, `lint`, and
  `react:build`.
- Template sync:
  `yarn release:app --prod=starter-app` after source/config changes and
  `yarn release:app:check --prod=starter-app` before commit/push.
- Packed-artifact consumer readiness:
  `yarn release:packages` followed by `yarn release:template --prod=starter-app`.
- Final pre-push review:
  `git diff --check`, staged diff review, source commit verification, then push
  only under the user's explicit PR authorization.

Exclusions and stop conditions: do not perform Task 4, public homepage routing,
community/support policy, Design AI work, Framework runtime contract changes,
registry publication, release tagging, deployment, merge, or any workaround
that changes the generated app to rely on local workspaces. Stop and report if
the current package versions or public package exports cannot support the
standalone template through packed artifacts, or if the registry evidence is
requested before publication is authorized.

### Task 4 bounded contract - AI-first Starter onboarding

Objective and completion condition: ship concise, standalone-safe instructions
that let a coding agent trace the Starter's canonical Item edit path, and retain
one actual priority-field extension exercise as a project-owned example with
formal tests. This task's agent performs the exercise; independent verification
in a fresh coding-agent conversation is a separate, unperformed result.

Authorized mutation scope: this plan only for Task 3/4 status and this contract;
`apps/starter-app/AGENTS.md`, its README and onboarding/prompt documents;
App-owned Item domain, runtime, projection, storage, and directly affected
Starter tests; a small optional priority example/fixture under
`apps/starter-app/src/examples/priority/`; a pending empty Changeset for the
mixed-code PR; focused CLI/template tests only if needed to prove shipped
instructions; and `create-app/starter-app/template/**` only as output of the
existing `release:app` generator. The default Starter UI and Item behavior
remain title/status-only; the exercise opts into an App-owned extra Item field
through the same Feature -> App API -> transaction -> Core path. No second
editable UI model or separate App/template generator is introduced.

Priority is a persisted Item Props field with exactly `low`, `normal`, and
`high`; its default is `normal`. New opt-in Items persist this field. On reload,
a valid V1 Item property that lacks priority is admitted as legacy data and
projects `normal`; an explicitly present value outside the domain is rejected
by App admission before Core load, leaving canonical state, history, and
projection unchanged. Other missing/invalid title or status data remain
rejected. The wrapper version and storage slot stay unchanged.

The example's authoritative field is the Props component. Its schema and App
admission share one priority predicate. Feature commands validate before the
App API's single `runTransaction`, which calls `core.updateElementProperties`;
Core/Props owns the write and journal. Shared publications and file-load
completion update the projection, which is read-only and document-lifetime
scoped. An edit and its Undo/Redo each cause the expected bounded projection
refresh, with no full-document read on normal edits; reload may perform one
full refresh. Explicit Save is a separate storage acknowledgement.

Formal acceptance cases: default Starter title/status behavior is unchanged;
an opted-in add/edit persists priority through the App schema and existing
mutation path; one edit creates one Undo entry, and Undo/Redo restore the
priority projection; Save/Reload preserves priority and title/status; legal V1
data missing priority uses `normal`; invalid priority is rejected at runtime
and before load without changing document/history/projection. Tests are added
before implementation and shown failing on the missing behavior.

Required gates after the last relevant edit: `yarn lint:naming` before names
spread and at completion; `yarn workspace @asyra/starter-app test`,
`typecheck`, `lint`, `react:build`, and `test:e2e`; focused
`node --test scripts/__tests__/create-app-cli.test.mjs scripts/__tests__/release-template-readiness.test.mjs`;
`yarn release:app --prod=starter-app` and
`yarn release:app:check --prod=starter-app`; `yarn release:packages` then
`yarn release:template --prod=starter-app`; `yarn lint:ci`;
`git diff --check` and bounded staged-diff review. After commit, run
`yarn changeset:pr:check` with the exact integration base and Task 4 head,
verify the committed source contains all tested behavior, then push and open
one child PR. Re-run affected local gates before any subsequent push.

Exclusions and stop conditions: no Framework contract or package changes,
default priority control, AI panel/provider, new package-manager support,
Task 5 public entry, release, tag, merge, publication, or deployment. If the
example cannot remain a small App-owned opt-in exercise without copying the
whole App or adding a second template tool, report the concrete tradeoff before
expanding scope. Stop if a required local gate cannot pass; CI is not the
diagnostic owner.

### Task 5 bounded contract - entry routing and product evidence

Baseline: `origin/codex/adoption-onboarding` at `b785160c5645212509d3e1ca1ed4e8647922961c`,
which includes merged PR #250. The public npm registry returned 404 for
`create-asyra-app` on 2026-09-24; the local packed-artifact result from Task 3/4
does not establish registry availability. Recheck the registry before public
activation in a separately authorized release slice.

Objective and observable completion: root README, public documentation
discovery, and the existing homepage resource section explain the Generic
Starter, complete Design product, and advanced composition in that order.
Every active link resolves to an existing, applicable destination. The
unpublished Starter has a source-and-guidance path but no public install
command or active installation CTA. Product examples identify what Framework
supplies and what each App owns, with current maturity limits.

Authorized mutation scope: this plan's Task 4/5 status and this contract;
`README.md`; `docs/public/index.md` and the public `llms.txt` generator source;
generator-produced documentation indexes and website `llms.txt` only through
`yarn docs:public`; `apps/asyra-framework-site/components/home-resources.tsx`;
direct README, public documentation, and homepage tests and validators; and
short evidence updates to the existing root README and homepage plans. One
pending empty Changeset records this mixed documentation/site change for the
repository's PR gate without versioning a package. The
six-chapter story, product image, other routes, Framework/App functionality,
and the fixed public page inventory remain unchanged.

Fixed discovery and proof: inspect the current entry sources and destination
files/routes, Starter onboarding/priority source and tests, the published
Design CLI registry identity/version and integrated Design case/source and
product evidence tests, FieldScope crop and Sim workbench source/tests,
current support guide, public documentation generator/validators, and the
homepage contract/Inspector. Registry queries are read-only. The published
version, integrated source, and another task's uncommitted Design work are
distinct evidence; never use pending AI-panel work to support public claims.
After edits begin, review only these direct contracts, consumers, negative
claims, and gates.

Acceptance cases and permanent tests:

- README and docs present Starter source/onboarding before the published Design
  CLI and advanced composition, with distinct suitability and live destinations.
- Registry-unpublished status remains explicit; validators reject a public
  `create-asyra-app` execution command or installation CTA until a later
  release-owned activation changes the contract and tests.
- Coding-agent source edits and the opt-in priority exercise are described as
  App-owned extension, never as built-in AI runtime behavior.
- Design's editable 2D product proof, FieldScope's implemented crops, and Sim's
  local development workbench are grounded in direct source/tests. No official
  production 3D Preset, built-in physics, or industrial safety is inferred.
- Public docs generation and both `llms.txt` copies remain synchronized. The
  homepage keeps the existing resource composition, native navigation,
  responsive presentation, reduced-motion and no-JavaScript contracts.

Required local gates after the last relevant edit: `yarn lint:naming` before
identifier-bearing changes and at closure; focused README/docs and homepage
tests; `yarn docs:public`, `yarn docs:public:check`,
`yarn docs:public:validate`, and the applicable README components
`yarn docs:readme:packages:check` and `yarn docs:readme:validate`. Execute the
requested full `yarn docs:readme:check` and report its exact result. Its bundled
`release:app:check --prod=asyra-design` compares a Design template that another
task is actively changing; a failure there is not a Task 5 pass or a Task 5
mutation authorization. Do not rerun that unrelated Design gate before push.
The applicable website gates are
`test:local`, scoped lint, typecheck, production build, public route smoke,
and focused desktop/mobile Playwright navigation, reduced-motion, no-JS, and
visual review; GitHub-compatible README desktop/narrow media-present and
media-unavailable captures; root `yarn lint:ci`; `git diff --check`, staged
review, and the exact-base Changeset PR check where applicable. Repeat the
affected local gates before each push; CI on the exact PR head is a separate
reported state.

Stop conditions and exclusions: stop on a missing or contradictory homepage
Inspector/active product contract, unusable destination, or an in-scope required
local gate failure. Do not expand into Task 6 support policy, product code, Framework
refactoring, a new public documentation page/inventory, a separate agent
exercise, Asyra Design runtime/AI panel/template/generation/release work,
Design full build/E2E/clean-consumer gates, package publication, public CLI
activation, deployment, tag, release, or merge. Publication and any active public installation CTA require separate
authorization and fresh registry proof. This task may commit, push, and open
one child PR against `codex/adoption-onboarding` under the user's authorization.

### Task 6 bounded contract - community and support

Baseline and fixed discovery: start from `origin/codex/adoption-onboarding` at
`fb7050f9a43a3f00fb73a6028457c1abfc24051b`, which includes merged PR #251.
Read the existing root README support section, SECURITY.md, Framework release
support and public support guide, the package README generator and README/public
documentation validators, and the directly affected Sim candidate/release
support text. Check the repository's Discussions setting and destination through
read-only GitHub metadata before writing an active link. The setting was disabled
on 2026-09-24; no working Discussions destination is established. After this
discovery pass, inspect only these sources, their direct generated consumers,
negative cases, and the gates below.

Objective and policy: publish one clear repository support policy in SUPPORT.md.
GitHub Discussions is the intended public community/general-help channel, but
while disabled, state that it is unavailable and provide no guessed or inactive
URL. External pull requests are not accepted by default; GitHub Issues are not
the general public support channel. Suspected vulnerabilities follow the
existing private GitHub advisory route in SECURITY.md. Participation creates no
SLA, response deadline, or maintenance promise. Sim's current local-candidate
review still uses its agreed coordinator; a later public channel decision may
use Discussions but cannot satisfy its named maintenance owner, serious-finding
notification/withdrawal/correction process, or safety/release gates by itself.

Authorized mutation scope: this plan's Task 5/6 status and Task 6 contract;
SUPPORT.md; the root README support paragraph; Framework/public support policy
text and the public content source map; the package README generator and its
generator-produced package README outputs; directly related README/public docs
validators and tests; and narrow support/reporting wording in Sim candidate and
first-release documents. A pending empty Changeset may record this mixed
documentation/generator change. Existing package/runtime/API identities and
release states remain unchanged.

Formal acceptance cases: root, public guide, SUPPORT.md and generated package
README policies agree on the planned Discussions channel and its currently
disabled state; no inactive Discussions URL is published; validators reject
general-Issue or external-PR invitations and an absent private security route;
the security route remains private and points to SECURITY.md; external links
newly authored in rendered Markdown use new-tab and safe-rel attributes; Sim
candidate text keeps the private pilot coordinator and all G8 maintenance and
serious-finding responsibilities open. Tests cover both enabled/disabled policy
inputs so a later settings change requires an explicit, verified update.

Required local gates after the final edit: `yarn lint:naming` before and after
identifier-bearing changes; focused docs generator, README/public documentation
validation, and Sim release-policy tests; `yarn docs:readme:packages`,
`yarn docs:readme:packages:check`, `yarn docs:readme:validate`,
`yarn docs:public`, `yarn docs:public:check`, and
`yarn docs:public:validate`; applicable `yarn lint:ci`, `git diff --check`,
staged review, and exact-base `yarn changeset:pr:check`. Run the composite
`yarn docs:readme:check` once and report any Design-template-only failure as
such; its individual applicable components must pass. Revalidate the current
head before each push and report CI separately.

Stop conditions and exclusions: stop if PR #251 is not integrated, an in-scope
required gate fails, or the private security route is unavailable. If
Discussions remains disabled, deliver conservative wording and report the
repository-setting action for the user; do not change settings or invent a
link. No Design runtime, AI panel, Design template or release-flow edits; no
Design full verification; no product feature repair, Task 7, Starter public
activation, merge, publication, tag, release, or deployment.

## Prompt and review contract

Task prompts now rely on the shared #248 rule contract in `AGENTS.md`,
`docs/ai/framework/rules/bounded-task-scope-and-closure.md`, and
`docs/ai/workflows/git-commit-push-policy.md` for recurring execution
requirements such as worktree safety, scoped local validation before every push,
and common handoff format. A task prompt should select the plan path and task,
state accepted predecessor/base, task-specific owner documents, objective,
allowed mutation families, exclusions, product cases, gates, stop conditions,
and any explicitly authorized remote operation. Do not re-copy the common rules
into every prompt.

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
