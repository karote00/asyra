# Starter App architecture standard

## Status

2026-10-04: DONE - planned, implemented and validated in the authorized worktree. The user
requires the entire Starter App architecture to follow Asyra Design's proven
structure, while retaining Starter's existing basic product behavior. Do not
copy Design and remove its features. Starter becomes the maintained standard
for new Apps, their documentation, and later developer Agent guidance.

Base: origin/main 85e88319f3659c5048966146c039c88ad22142c4, verified after fetch.
Branch: codex/starter-app-standard. Worktree: .worktrees/starter-app-standard.
Owner: primary agent in this conversation. Single writer; no subagent opt-in.

## Task 1 - Prepare and execute the complete App refactor

Authorized scope: apps/starter-app source, formal tests, local guides, generated
Starter template through its existing generator, directly affected generation
contracts, Starter architecture documentation and public App composition guides.
No Flow Inspector tooling changes are part of this task. Asyra Design is a read-only reference.
The separate developer-Agent worktree and the external demo App are not edited.

Preserve Item creation, selection, title/status editing, position/drag behavior,
explicit Save/Reload, saved data admission, one action/one history entry, one-step
Undo/Redo, rendering, startup failure reporting and teardown. Preserve existing
persisted identities. No extra Design product features, AI runtime, collaboration,
backend, remote push, publication, tool upgrade or new third-party dependency is
authorized by this refactor. A necessary Framework API change or verification-tool
extension is a separate boundary decision before editing that owner.

Discovery is bounded to Starter and its direct template consumers, Design's
corresponding App owners, the existing public Core/UI/Factory contracts, and their formal tests. After implementation starts, review
only those changed owners, direct consumers and the fixed gates below.

## Architecture reference and intended responsibility

| Concern                  | Design reference                                           | Starter outcome                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime access           | src/contexts/index.ts and core.ts                          | One explicit Core entry; no runtime.feature access chain or second document model.                                                                                                   |
| Composition and lifetime | src/init/init-app.ts, foundation and derived-state modules | A readable init entry coordinates registration, startup, subscriptions and disposal; UI does not own runtime assembly.                                                               |
| Intent                   | src/features and config                                    | Named registered Features for product actions and input routing.                                                                                                                     |
| App operations           | src/common-apis and controllers                            | Direct named APIs own validation, transaction boundaries and orchestration; no redundant one-line routing layers.                                                                    |
| UI properties            | src/hooks/useProperty.ts and src/providers                 | Property-level observation and semantic hooks; each consumer subscribes only to relevant values. Document registration, projection, notification, invalidation and cleanup together. |
| UI composition           | src/app, contents, toolbar, properties                     | Small responsibility-based components with local drafts; unrelated rows and controls do not refresh for another field.                                                               |
| Render                   | src/render-app and render-layers                           | Core/render remains authoritative; overlays and React display the same projected data.                                                                                               |
| History                  | src/features/undo-redo and common-apis/history.ts          | One call performs one Undo or Redo. Remove UI-maintained redoDepth and message-driven behavior. Read only owner-provided availability/counts when available.                         |
| Durability               | App-owned persistence and load boundary                    | Retain Starter's explicit local Save/Reload semantics with validation and clear success/failure state. Do not import Design's network architecture.                                  |

These are responsibility assignments, not implementation readiness claims.
Review actual exports, lifecycle and handoffs before fixing each step contract.
The Design hook currently retains per-key signals and subscriptions at module
scope; its lifetime must be checked against Starter's repeated startup/disposal
cases before adaptation. Do not silently invent a second subscription mechanism.
The current Core facade exposes getUndoHistoryDepth, but no public canRedo or
Redo count was found. Do not manufacture Redo availability in UI. Decide whether
the existing single-step action needs availability display before requesting a
separate Framework API change.

## Documentation outcome

Document the whole App, not only API invocation: why modules are separated,
allowed dependency directions, why each handoff exists, canonical versus UI-only
state, UI property registration and subscriptions, local update boundaries,
computed-output lifetime, styling, error handling and disposal. Every explanation
must point to the resulting Starter code and meaningful extension examples.
Starter remains the executable reference; docs explain its decisions, and Agent
packaging consumes those maintained docs in its own follow-up task.

## Fixed acceptance obligations

- Baseline and final Starter unit/integration tests, types, lint and build.
- Bug tests must fail for the intended defect before implementation: include
  Undo followed by a new edit, alternate display language, failed/no-op edits,
  empty history, save failure and accepted/rejected reload.
- Preserve title/status/position, canonical save contents, one-step history and
  migration behavior. No multi-step history API or UI history mirror.
- Prove actual subscription/read/render counts for changed versus unrelated
  properties and rows, with fresh values after Undo/Redo/reload and no late
  notifications after disposal/reinitialization. No React.memo workaround.
- Run Starter E2E and inspect real desktop/narrow-view screenshots for existing
  interactions. Preserve process ownership and cleanup temporary servers.
- Regenerate the CLI template, run generation and clean-consumer checks, and
  verify an ordinary consumer can build and extend the resulting App.
- Run naming before identifier edits and at the required slice boundaries;
  public-document freshness and bounded diff review close the documentation.
- Review the bounded diff and report actual verification results before closure.

## Execution sequence and scoped workflow decision

The user clarified that the collaboration checkpoint means completing a plan
first, then explicitly authorized direct execution in this new worktree. The
previous Flow Inspector tooling blocker is superseded for this task. Do not
extend that tool or claim dynamic admission. Existing App tests and direct
architecture evidence are this task's verification path.

1. Record baseline naming and Starter tests. Add a permanent UI regression for
   history controls and structured status, proving the current defect first.
2. Extract contexts, common APIs, feature registration, render layer, foundation
   and derived-state initialization from the mixed runtime. Keep transactions,
   persisted schemas and render geometry unchanged; migrate direct consumers.
3. Register App UI properties through Core's existing public UI property facade.
   Bind React via useSyncExternalStore and semantic providers. Separate shell,
   toolbar, per-item views, selected editor and render host. Controllers own
   command/status orchestration. History never derives behavior from text.
4. Add permanent work-count, subscription, lifecycle and integration evidence;
   run focused tests, naming, typecheck, lint, build and browser scenarios.
5. Explain every ownership boundary in Starter docs and public composition
   guidance. Regenerate the template and run generator/consumer checks. Finish
   with scoped diff review, record results here and notify the user.

Identifiers: existing persisted Item/property/storage/feature identities remain
unchanged. New UI-only keys belong in config/ui-properties.ts; they are not saved.
Core context is the runtime owner; initApp owns registration and disposal; named
itemActions expose the registered Feature API. No global React signal cache.
No new dependency is needed: React's existing external-store hook observes
Core's existing UI-property APIs. Existing CSS is retained during this architecture
migration; Tailwind conversion requires a separately approved Starter dependency
and is not silently added. No visual redesign is included.

## Implementation decisions and bounded corrections

- Core closes UI-property definitions at startup. Fixed properties are registered
  during initialization; dynamic Item rows use keyed projection subscriptions.
  No Framework change or lower-level registry bypass was introduced.
- The React lifecycle adapter waits for Core reset, coalesces repeated starts
  and passes StrictMode mounting. A retained old history callback is guarded
  because public history functions address the current Factory. Permanent tests
  first reproduced both the stale callback and StrictMode failures.
- Existing template readiness tests detected a leaked monorepo-only
  `test:e2e:ci` script. Its removal was added to the existing release config,
  within the authorized generation-contract scope.
- Public docs generated indexes are updated from the edited composition guide.
  Starter's exported guide is `apps/starter-app/docs/ARCHITECTURE.md`; no Agent
  bundle in the separate worktree was modified.
- Review after edits is limited to these owners, direct consumers and planned
  gates. No new repository-wide architecture audit was opened.

## Completion evidence - 2026-10-04

- Baseline: 16 existing App tests passed. Two new UI regressions failed as
  intended (UI-owned Redo availability and message-derived error tone).
- Final `yarn workspace @asyra/starter-app test:local`: 24/24 passed, including
  canonical history, invalid/no-op edits, localized feedback, storage errors,
  accepted/rejected loads, StrictMode and retired-lifetime callbacks.
- `typecheck`, `lint`, `react:build`: passed. Vite retains a bundle-size advisory
  for the framework/render chunk; no bundle-size improvement is claimed.
- Naming baseline and final: 12/12 passed. Public docs freshness and validation
  passed (41 pages, 19 package guides, 258 local links, 129 API references).
- CLI and template-readiness tests: 17/17 passed. Generator freshness passed.
  Packed 19 local Framework packages; isolated Starter consumer passed install,
  types, lint, build, tests and startup smoke. No registry publication occurred.
  Evidence: `tmp/framework-release-evidence/generated-template.json`.
- Browser scope: all `apps/starter-app/e2e/starter-app.spec.ts` cases. Initial
  command `STARTER_APP_URL=http://127.0.0.1:5192 yarn workspace
@asyra/starter-app test:e2e`; final rerun used its existing Playwright config
  directly against the already built same server. 11 passed; desktop touch-only
  case skipped by the existing test condition. Desktop 1280x780; narrow 390x840.
- Screenshot review passed for the actual Core-rendered App: three Items, first
  selected, edited title/status, accepted reload; also inspected a live App in
  Codex browser. Screenshots under `apps/starter-app/test-results/` include
  `starter-desktop.png` and `starter-narrow.png`. Canvas overlays, selection,
  list and editor were enabled. No geometry-output change or FPS claim.
- Work-count evidence: on a 30-Item document, editing one Item performed one
  element read, zero full-document reads, one relevant Item notification, no
  unrelated Item/list notification, one relevant React render, and no unrelated
  row/list/status renders. Selection/status changes caused no document reads.
- Scoped staged-diff whitespace review passed. Framework code, Asyra Design,
  external demo and separate Agent worktree were not changed.

Remaining distribution work is a separate release: this local refactor does not
publish create-asyra-app or update the installed developer-Agent bundle. Existing
CSS was retained as planned; adopting a new styling dependency needs its own
approved change. All work in this bounded plan is complete.
