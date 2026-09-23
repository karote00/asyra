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
homepage authority only. The starter-readiness documentation slice is one
merged result from PR #245; the earlier PR #244 was closed and must not be
counted as a second delivery. Minimal runtime proof, community policy, and
later public activation work remain pending and require their own bounded task
slices.

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
- Remaining task 1 gaps after this README/homepage slice: minimal runtime
  proof, complete public README gate execution, README rendering evidence,
  community/support reconciliation, FieldScope source claims, and any integrated
  validation after child PRs merge. Release/generation/consumer ownership is
  mapped below, but later implementation slices must still execute their actual
  commands.

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
  After wrapper admission, run `core.preflightLoad(wrapper.core)`. Any thrown
  load hook, invalid Scene hierarchy, or non-empty Core/package diagnostic list
  rejects the reload, shows the diagnostic/error summary, and preserves the
  current document and projection. In particular, invalid Item status, missing
  `title`/`status`, malformed App property payloads, and damaged hierarchy are
  rejected for V1 rather than accepted through fallback. Core normalization and
  package validation remain the source of diagnostics; the App's V1 admission
  decides whether those diagnostics are acceptable. V1 accepts only a clean
  current-version document. Every accepted reload then calls `core.load(...)`,
  rebuilds the projection through the `fileLoadComplete` path above, and reports
  success only after load returns.

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
| 1 - Reconcile contracts | This plan, existing entry/README/site plans, directly relevant public-entry authorities | In progress. Example-link repair is recorded above. README/homepage baseline is recorded at `b44be9e77`; the current root README composition and six-chapter homepage authority are implemented and locally testable at that baseline, but README desktop/narrow media-present/media-missing rendering evidence remains pending. PR #245, not closed PR #244, records the starter-readiness documentation. This correction records canonical starter source naming, projection/load/save obligations, and release/generation/consumer owner boundaries. Runtime proof, complete `docs:readme:check`, support/community, FieldScope claim reconciliation, merge/publication/deployment, and public activation remain separate. Documentation PR only; no runtime or site behavior changes. |
| 2 - Minimal canonical App | `apps/starter-app`, workspace `@asyra/starter-app`, and direct app-local tests/docs | Frozen next scope: supported Core/Preset startup, App-owned Item `id/title/status`, registered Feature -> App API -> one transaction -> Core owner facade, projection without a second editable document, Undo/Redo, explicit versioned Save/Reload with validation and error reporting. Use the readiness decisions above; do not create the CLI/template/release surface in this slice. Depends only on the integrated README/starter-readiness/correction documentation needed for this App scope, not on community policy, FieldScope claim work, homepage public activation, product evidence expansion, registry publication, or Design AI completion. |
| 3 - CLI and standalone template | Generic CLI, generation/release integration, canonical source instructions and generated output | Safe generation, supported package managers, public imports, independent install/build/typecheck/test, canonical behavior, no workspace hoisting dependency, template parity. Replace the current retired generic-starter test contract in the same coherent slice that introduces the successor public `create-asyra-app` path. Depends on task 2. No registry publication. |
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
