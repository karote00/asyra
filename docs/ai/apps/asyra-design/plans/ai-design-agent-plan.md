# Plan: Editable Design Agent

## Status and authority

Active - implementation and local validation complete; latest PR CI pending.
Planned 2026-09-19. The user explicitly selected Figma Design (editable
canvas designs), not Figma Make (executable websites). Complete the plan, including
UI/UX and formal tests, then push to existing PR #223, verify every required check
on its latest HEAD, and notify the user to review. Do not merge.

This plan supersedes the image-first direction of AI Conversation Experience for
new design generation. Existing accepted conversation, transaction, tracing and
accessibility contracts remain binding. Earlier local evidence is not evidence
that this larger plan is complete. No blanket claim of all-product Figma parity.

Worktree: `.worktrees/design-local-codex`, branch `codex/design-local-codex`.
Preserve the existing dirty work. Inventory and validate earlier task-owned changes
before including them in the PR. Never reset unrelated changes.

## Product target

The product objective is to understand and fulfill the user’s design intent, not
to generate one category of page. Tasks include creating designs, revising existing
work, drawing editable illustrations, tracing references, and organizing layers and
design components. A landing page is one acceptance case, never the task router or
product boundary.

A user describes a design, style, dimensions and content; the agent researches when
needed and creates a genuinely editable, organized canvas design. Follow-up prompts
edit the intended selection or composition. Deliver the Figma Design agent's core
prompt-to-design collaboration experience, not a chat demo, raster screenshot,
hardcoded landing-page fixture, or a disguised vector tracing pipeline.

Baseline references, inspected 2026-09-19:

- <a href="https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files" target="_blank" rel="noopener noreferrer">Figma Design agent</a>
- <a href="https://help.figma.com/hc/en-us/articles/39715554287255-Search-the-web-with-the-Figma-agent-and-Figma-Make" target="_blank" rel="noopener noreferrer">Figma agent web research</a>
- <a href="https://help.figma.com/hc/en-us/articles/23955143044247-Use-First-Draft-with-Figma-AI" target="_blank" rel="noopener noreferrer">Editable first-draft generation</a>

These establish reference workflows, not a requirement to reproduce proprietary
branding, all Figma products, or undocumented internals. Evaluate observable
behavior and design editability. Common design-tool primitives are first-class;
Asyra-specific differentiators come later.

## Non-negotiable product cases

1. From an empty canvas, create a 1440px-wide Japanese minimalist coffee landing
   page with navigation, hero headline/body/CTA, product cards and footer, without
   an uploaded image. Use native editable text and shapes, organized sections,
   consistent spacing, legible typography and the requested dimensions.
2. Change the subject, style, width and section count; generation must respond to
   the request rather than reproducing case 1. Include a SaaS page and mobile layout.
3. Select a hero or card and request a targeted revision. Unrelated objects remain
   unchanged; subsequent human editing and agent editing both work.
4. Research a concept or public brand using the provider's own web-search ability.
   Synthesize useful findings into design decisions; research is not restricted to
   images or Wikipedia and is skipped when unnecessary.
5. Draw a named logo without an attachment: research, obtain a suitable reference
   through a bounded backend import, inspect it, then use existing decomposition
   and tracing only where appropriate. Preserve attribution and explain a specific
   acquisition limitation when necessary. Do not invent source receipts.
6. An attached reference can inform a layout or be traced. Do not automatically
   turn the entire design into vectors. Existing tracing regressions still pass.
7. Ask only material unresolved questions; choices are clickable. Routine choices
   use sensible defaults. Unsupported operations are clearly explained, without
   blind retry or silently substituting an unrelated result.
8. Multiple sequential batches form one Undo. Later ordinary failure retains
   applied progress, explains the failed operation, and supports Undo/Redo.
   Explicit cancellation retains the existing documented rollback policy.
9. Review first using backend measurements and constraints, then actual rendered
   screenshots. Iterate with measurable improvement and a bounded stopping rule;
   no success claim solely because an executor returned success.
10. Local clone users use their own supported AI subscription. Opening the panel
    immediately explains this, shows readiness, and never exposes credentials.

11. Create an editable original illustration from a text brief (for example a
    geometric night landscape, then a different subject/style). Compose native
    shapes and expressive vector paths; do not require an uploaded image, pretend
    to trace, generate a raster stand-in, or hardcode the illustrated subject.
12. Refine an existing illustration: change a selected part’s shape/color/placement
    while preserving unrelated parts and editability. Inspect current context
    before deciding whether a native shape, vector operation or analysis is needed.
13. Organize an existing document: meaningfully rename layers, group related items,
    arrange/alignment/spacing and reorder when requested, preserving appearance
    where the user asked only for organization. Deletion, deduplication and changes
    to component identity require evidence and the existing permission policy;
    do not equate a layer group with a reusable component/instance system.
14. Handle mixed requests in one conversation (research a style, revise a selected
    design, add an illustration, then organize the result). Route by actual intent
    and supported operations rather than keywords such as logo or landing page.
15. Ask for design feedback or an explanation without requesting mutations: answer
    from actual context and research when relevant, with no unintended canvas edit.

## Ownership and execution architecture

1. App conversation owner captures the request, selected canonical IDs, attachment
   references and target dimensions; preserves user messages on the right and
   assistant messages on the left. Context remains bounded and document-scoped.
2. Provider/domain owner interprets intent, optionally researches concepts/content,
   and chooses creation, revision, illustration, tracing, organization or advisory
   operations from the actual capability catalog. Mixed tasks compose these
   operations; no fixed page-generation or VTracer-first path. Native search
   is provider-owned; backend retrieval is a separate tool with bounded safe URL,
   redirect, content-type, byte, pixel, timeout and cancellation handling.
3. App server design-preparation owner accepts a typed semantic design description:
   sections, layout constraints, native text/shapes, reusable patterns and style
   choices. It validates and resolves layout and canonical descriptor preparation. Exact
   text metrics come from the rendered native text owner before visual review. AI does not manually emit huge point arrays or implement layout
   algorithms; backend does not invent style/subject intent.
4. Existing Runtime resolves prepared actions, checks permissions and executes
   through App common APIs. Framework owners alone mutate canonical state. Keep
   one invocation transaction and existing history/provenance contracts.
5. Backend review owns deterministic measurements: overflow, bounds, overlap where
   disallowed, spacing constraints, text fit, missing content and structural IDs.
   Model review owns visual hierarchy, style coherence, brief compliance and
   interpretation of the actual screenshot. Reuse measurements at their valid
   artifact lifetime; prove invalidation/work counts where computation is shared.
6. Conversation presentation projects real operation events into concise English
   activity labels. Terminal state exposes completion or concrete partial failure;
   canvas result and current history action stay consistent.

Before each implementation slice, align the affected product spec and exact
Inspector owner step/route, then write its Step Execution Card. Existing relevant
steps are `request-backend-action-batch` and
`resolve-server-prepared-action-batch` in the conversational drawing Inspector.
New native component/layout owners require their own exact contracts before code;
do not stretch an image-tool step into an unrelated renderer owner.

## Panel UI/UX acceptance

- Persistent canvas-adjacent conversation, clear New conversation/history navigation
  and explicit selected-object context; do not silently target an old composition.
- Composer supports text, current image attachments, send/stop, keyboard use,
  focus handoff to canvas, text selection, and meaningful unavailable states.
- Show the personal-subscription disclosure when opened, not only before sending.
- English UI, 12px conversation text, concise labels describing actual operations;
  no raw tool names, Waiting for AI, Applying changes, or verbose reasoning logs.
- Activity is collapsed by default, one message per row, stable prior DOM and text,
  consecutive duplicate suppression, follow only when previously at bottom or
  previously without overflow. Recompute Jump to latest after layout/toggle changes.
- Preserve 0s initial timing and 12x12 completion bell: two gentle left/right cycles
  in about one second, then stationary; respect reduced motion.
- Keep right-aligned user messages and original attachment provenance. No unsolicited
  Edit request button, ratings/share toolbar, or AI has finished banner.
- Show concise results, requested clarification controls and meaningful recovery;
  retain usable work on ordinary errors. No duplicate always-current activity row.
- Verify narrow 360px and desktop layouts, keyboard focus, readable contrast,
  active/awaiting-answer/approval/success/partial/error/offline states.

## Implementation stages and gates

### A - Baseline, contracts and native capability inventory

Inventory registered text, container/frame, shape, style, layout and editing APIs;
map every task family and acceptance case to real capabilities, including
selection targeting, expressive path creation/editing, layer naming/grouping/order,
and the distinction between reusable components and plain groups. Reconcile the unfinished Wikimedia
search prototype: it must not remain the only research path. Determine the smallest
necessary native primitive additions. Do not hide absent editable text behind
outlines or screenshot layers. Produce exact spec/Inspector contracts and tests.
Gate: capability inventory and executable case definitions; no undocumented fallback.

### B - General research and reference acquisition

Enable the supported provider-native research path; preserve shell/credential
isolation. Add bounded reference acquisition separately. Wikimedia may be an
optional source, never the definition of research. Research failures remain
recoverable, source content remains untrusted, and no paid search service or new
login is required. No unapproved dependencies.
Gate: mocked provider protocol plus URL/redirect/private-network/body-limit/abort
regressions and real public-source read-only smoke where available; no live AI
subscription calls solely for debugging.

### C - Editable design preparation and canonical actions

Implement missing native foundations necessary for acceptance cases in their
canonical owners, then expose compact design-generation and targeted-edit tools.
Generate real text, containers, shapes and illustration paths with validated layout
and hierarchy. Expose targeted geometry/style/content edits and document organization
through canonical owners; read-only advice must not force a drawing action.
Keep style choices model-owned and geometry preparation deterministic. Preserve
human editability, normal selection, persistence and Undo/Redo.
Gate: test-first owner contracts, varied briefs, invalid input rejection, full
create/edit/save/load/Undo/Redo cases and affected framework tests. Run expensive
applicable geometry/7076 gates only at completed owner checkpoints, not per edit.

### D - End-to-end agent workflow and review convergence

Integrate intent, selective research, design planning, preparation, execution,
measurements and screenshot review. Retain a compact brief and receipts instead of
repeating geometry. Stop at satisfied criteria, no safe improvement, or bounded
review budget; explain remaining limitations. Keep prior successful work.
Gate: deterministic multi-step provider harness verifies complete output, targeted
revision, data review and visual review, failure retention and cancellation.

### E - Complete panel experience

Implement the UI/UX acceptance contract with fine-grained subscriptions and stable
activity rows. Reuse existing styles/components; no React.memo workaround. Verify
context selection, new/history navigation, follow-up interactions and all states.
Gate: component tests plus synchronized actual-app Playwright screenshots at 360px
and desktop. Inspect overview and text/details at relevant zoom; screenshots alone
cannot prove canonical editability or layout semantics.

### F - Full delivery

Run all affected formal suites, typecheck, build, naming, scoped and required lint,
Inspector contracts, generated create-app parity and clean-consumer checks. Review
all task-owned uncommitted changes and residual failures from earlier slices.
Validate all task families with different briefs, including mixed follow-ups; never
ship only a landing-page workflow or hardcoded demo. Live
subscription evaluation is not silently added to the test workload: document what
is established deterministically versus observed with an actual model.

Commit validated task-owned changes, push to PR
<a href="https://github.com/karote00/asyra/pull/223" target="_blank" rel="noopener noreferrer">#223</a>,
then check PR HEAD equals pushed HEAD and every required CI check completed
successfully. Fix in-scope failures and revalidate. Notify with PR URL, commit and
honest feature/test limitations. Never mark the goal complete while required gates
are pending or required functionality is absent. Do not merge or publish packages.

## Scope, costs and stop conditions

Authorized owners: Design App AI/server/conversation/UI/native primitives needed
for these design cases, their direct framework dependencies where canonical
capabilities are missing, formal tests, specs/Inspector, docs and generated template.
No repository-wide cleanup, third-party account integration, executable-site
hosting, proprietary Figma assets, or paid image-generation feature. Prior user
instruction to exclude generated raster images remains binding. Imported reference
handling does not imply a new raster-generation product feature.

Native text/layout or rendering changes must be separately bounded and verified;
missing owners are required work, not permission to fake parity. If a capability
requires an unapproved dependency, runtime upgrade, unavailable credential, or
conflicts with an accepted contract, explain the exact blocker. Do not label an
incomplete substitute as equivalent to Figma Design. Replan after repeated failures
at the first incorrect owner rather than accumulate special-case patches.

## Stage A findings and next owner slice - 2026-09-19

- Preset registers rect, oval, vector, frame and group; no text component is
  registered in `packages/preset/src/components/index.ts`. Native editable text
  is a required foundation, not a presentation-only overlay workaround.
- App AI actions currently expose composition insertion/replacement, bounded
  geometry/style updates, visibility, selection, inspection and reporting. They
  lack a general semantic design/layout and document-organization operation set.
- Context currently exposes only selected IDs/types/visibility/lock/bounds (up to
  50), not sufficient text/style/hierarchy context for general design editing.
- Canonical grouping, ungrouping and hierarchy movement already exist through App
  `common-apis/hierarchy.ts`; reuse these rather than invent AI-owned hierarchy.
- Native search is disabled in local provider configuration and its protocol
  admission currently rejects completed web-search items. Both configuration and
  event admission need tests before enabling native research.
- The unfinished reference-tools slice adds Wikimedia candidate search and bounded
  PNG/JPEG/WebP import, but has not passed complete gates. It is not delivery and
  does not satisfy native/general research. Review and adapt it in Stage B.
- The shell's default `codex` reports 0.40.0; do not upgrade it or infer that it is
  the App's configured executable. Resolve the actual App provider binary without
  exposing credential data before any protocol smoke test.

Next Step Execution Card: `request-backend-action-batch` / native research.
Inputs: user intent, bounded App capability/context, current provider config and
abort ownership. Outputs: provider-owned research events and bounded source
references, existing prepared batch protocol unchanged. Conditions: research only
when relevant; no shell, general file access, credentials, or unapproved paid
service. Source content cannot override domain permissions. No image requirement
for conceptual research. Boundaries: local provider, domain prompt, reference
helper, direct protocol/security tests and current App spec/Inspector. Failure
owner: provider/retrieval; report a concrete limitation, never fabricated research.
Gates: failing native-search-event test, retained isolation tests, safe retrieval
regressions, typecheck/lint/naming, then template parity. Stop if the configured
provider protocol does not support the feature; do not silently enable arbitrary
local tools. This card is not authorization for native text/rendering changes;
Stage C requires a separate canonical owner card and tests.

Stage B implementation evidence (not overall completion): native `webSearch`
protocol admission and cached search configuration pass a failing-first provider
regression; conceptual research has no attachment prerequisite. Reference import
now supports native-research HTTPS image URLs as well as optional Wikimedia IDs.
Twenty-two reference/transport tests cover import/trace handoff, preview transport,
public-address pinning, private redirect refusal, size admission, cancellation and
request-local reuse. The provider/image/prompt suite passed 83 tests before the
direct-URL extension; complete gates are rerun at the stage boundary. Native search
has not been exercised through a paid model call.

## Stage C first owner card - neutral text projection

Contract: `specs/editable-text.md#neutral-text-projection`; Inspector
`editable-text-flow-inspector.data.cjs`, step `project-native-text`.
Inputs are validated plain text, typography and explicit layout bounds; output is
an owned neutral text operation. No text means bypass. Contributors are render
facade and engine contract only; Pixi, DOM and component decisions are forbidden.
Boundary and files are exactly the step allowlist. Failure owner is
`project-native-text`. New `RenderEngineTextOperation` is a neutral additive
runtime identity, not a saved-document migration. Tests must prove Unicode,
caller-mutation isolation, bounds and clear semantics. Run focused render tests,
package typechecks and naming before the engine consumer step. Stop for any
contract conflict or missing consumer requirement. Canonical property and App
editing owner cards will follow; this slice cannot establish complete text support.

Stage B final focused server harness: 249 passed, one opt-in live test skipped;
server typecheck and generated-template parity passed. Naming then caught the
new HTTP user-agent product token; use the public `asyra-design` spelling and
regenerate the template before closing the slice.

Neutral projection gate: two tests first failed for missing `text()`, then passed;
render-engine and render TypeScript builds and 11 naming gates passed. Review
confirmed an owned flat snapshot, explicit bounds and no engine imports/cache.

Stage C next owner card: `materialize-native-text`, editable-text spec
`#engine-text-materialization` and matching Inspector step. Input is completed
neutral text operations, output is engine-owned plain text children. Non-text
operations bypass this handling. Only Pixi adapter and its direct tests may
change; no canonical writes, App logic or unrelated-child destruction. Failure
owner is this engine step. Gates: test-first materialization/clear/destruction,
existing adapter tests, build and naming. Stop if rendering requires a contract
change; do not manufacture document objects or substitute outlines.

Engine step gates: 21 adapter tests and build passed, including failing-first
materialization and explicit-box alignment. Text ownership is restricted to
adapter-created children; non-text children survive clear. No cache introduced.

Stage C owner card: `define-canonical-text`, editable-text spec canonical section
and matching Inspector fields. Inputs are canonical property writes/load data plus
position/dimension; output is exported validated text definitions and a neutral
render strategy. Explicit App installation follows in a separate slice; existing
preset profiles do not change. Contributors: preset definitions and Core/utils
public facades; forbidden: AI-owned state, Pixi imports, outlined glyphs. Allowlist
is text component/property files, public export and direct tests. Persisted `text`
and `typography` are additive neutral identities; no existing document migration.
Gates cover valid Unicode save, invalid runtime rejection, invalid-load defaults,
and neutral projection; build/lint/naming before App installation. Stop if schema
semantics differ from canonical guards. Failure owner: define-canonical-text.

Canonical text definitions: 13 focused tests, preset build, scoped lint and naming
pass. Exported definitions preserve existing default-profile ownership. App text
installation is explicit rather than silently expanding preset defaults.

Next card `install-and-edit-text`: spec canonical text section and matching
Inspector. Consume exported definitions, selected computed typography and user
field edits; register before start, project selected typography only, and commit
validated fields through ordinary element transactions. No single selected text
means no section. App startup/UI projection and canonical API are contributors;
renderer mutation, keystroke document replacement and AI-only storage forbidden.
Files are the exact App step allowlist. Gates: registration/projection tests,
manual-edit/invalid-input/Escape tests, App typecheck/lint/naming; visual and Undo
integration remain required before foundation closure. Failure owner is this
step. Stop for lifecycle or selection-projection contract mismatches.

App owner continuation: add `e2e/native-text.spec.ts` to this step's evidence
boundary for ordinary canonical creation, property editing, Undo/Redo and saved
text. Use APP_URL=http://127.0.0.1:3000 and the existing Playwright managed-server
lifecycle; no model invocation or .env file. Inspect the actual text screenshot.

App integration exposed two concrete contract mismatches. Selection projection
supplies computed fields without element metadata; a failing-first regression
now proves typography projection without `type`. Canonical value writes target
individual schema fields, not a whole `typography` object. Return to
`define-canonical-text` for field aliases (same allowlist/spec/failure owner), then
return to `install-and-edit-text` to submit only the edited field. The E2E failing
Undo increment is the integration oracle; no generic framework API is changed.

## Text integration iteration - canonical projection correction

Three browser runs exposed successive gaps, so stop local UI patching and revise
the bounded text implementation around the actual owner contract. Props save and
`getValue()` are flat typography fields; canonical property updates publish flat
fields, like position/dimension. A nested `typography` in the input descriptor is
not the persistent projection authority and can remain stale. Revised sequence:

1. `define-canonical-text`: render consumes flat TextData, direct tests use real
   flat fields; schema and aliases remain unchanged. No framework fallback.
2. `install-and-edit-text`: project selected flat fields into one UI-only value;
   trigger on selected computed updates, retain ordinary UI equality suppression.
   Test the projection after text/font changes and absence of typography fields.
3. E2E fixture uses canonical flat descriptor fields inside the ordinary outer
   transaction; prove edit/read/Undo/Redo/save and inspect screenshot before
   declaring the text foundation usable. Add reload validation at closure.
   Scope remains the existing text allowlists. No new dependency, generic framework
   mutation, dual-format compatibility alias or invented nested persisted schema.

Native text foundation evidence: 14 preset schema/projection tests, 21 Pixi adapter
tests, two neutral facade tests, five App installation/manual-edit tests passed.
App and affected package typechecks, scoped lint and naming passed. The permanent
`e2e/native-text.spec.ts` now proves canonical creation, manual edit, one edit Undo,
Redo, durable document digest and browser reload. It passed in 15 seconds with
no model calls. The inspected `native-text.png` shows real editable multiline
English/Chinese text and matching sidebar content after reload. Playwright-owned
servers exit at gate completion; no .env was created. This completes this text
foundation slice, not general design actions or the whole AI panel plan.

## General design preparation owner card

Step `prepare-semantic-design`, spec `design-preparation.md#semantic-preparation`
and editable-design Inspector. Inputs: bounded semantic draft and invocation
artifact owner; output: validated parent-ordered native descriptors, deterministic
findings and opaque receipt. Read-only advice bypasses. Server layout compiler
and native definitions contribute; model calls, fetches, canvas mutation and
subject-specific design defaults are forbidden. First sub-slice covers native
frames, rects, ovals and text with absolute/row/column/grid layout; illustration
path compilation remains required before Stage C closure. Files: server
`design-preparation.ts`, direct tests, shared `src/ai/prepared-design.ts`.
Neutral additive wire identity uses version 1; all IDs are server-owned and no
saved document migration is introduced. Artifact lookup retains its immutable
output without repeating layout; this is invocation artifact ownership, not a
profiling-based cross-request optimization. Validate total size/depth before
compilation. Gates: varied layouts, malformed inputs, bounds findings and exact
prepare/lookup work counts; type/lint/naming before consumer wiring. Failure owner
is this step; stop for missing canonical type or layout contract.

Vector continuation of `prepare-semantic-design`: accept bounded closed rings of
anchors with paired cubic controls, validate the complete input before compiling,
and use existing `measureVectorPath` for exact curve bounds once per vector.
Keep points in canonical workspace space while descriptor positions stay parent
local. Native identifiers remain server-owned. No image tracing, renderer, or
transaction changes. Add this contract to the current spec; scope stays the
preparation implementation and direct tests. Gates cover straight/cubic paths,
nested origins, malformed controls, total point limits and immutable reuse.

Vector preparation evidence: 17 semantic preparation tests and 19 existing vector
artifact tests pass (36 total). Initial new illustration test failed on unsupported
component admission; a separate two-anchor cubic regression failed before that
valid closed-path case was admitted. Native controls and straight segments, exact
curve bounds, nested workspace origins, compound rings, whole-request point
budgets, source isolation and once-per-artifact measurement are covered. Server
typecheck, scoped ESLint and the 11 naming checks pass. No model call, dependency,
renderer edit or remote push occurred. This closes the vector preparation
sub-slice only. Before completing Stage C, add canonical prepared-design admission
and application, selected/document context, targeted editing and organization,
then wire opaque preparation receipts through the provider. Deterministic overlap
and actual text-fit review, general design E2E, template sync and PR/CI remain open.

## Prepared design application owner card

Step `apply-prepared-design`, spec `design-preparation.md#canonical-execution`.
Input is a server-resolved prepared artifact, current workspace, abort signal
and registered action permission. Output is ordered native creation with root
and semantic IDs; read-only advice bypasses. App admission checks complete
identity/type/hierarchy/property/topology bounds before any write. Existing
common APIs and invocation transaction contribute; raw model design, geometry
reconstruction, new renderer/Undo mechanisms and permission bypass do not.
Boundary: `src/ai/prepared-design-admission.ts`, `src/ai/design-actions.ts`,
direct tests, `src/ai/runtime-input.ts`, `src/ai/startup.ts`, action constants
and App package test command. Failure owner is this step. Gates: malformed
payload produces no writes, parent order, ID collisions, ordinary failure
retains progress, explicit abort, bounded yields, registration/permission,
types/lint/naming. Browser save/Undo evidence follows in integrated execution
case before Stage C closure. Stop on missing canonical creation contract.

Application owner browser continuation: `e2e/editable-design.spec.ts` belongs to
this step and proves the registered action from the real panel with a deterministic
server-response interception (no model call), native hierarchy/typography/vector
data, one Undo/Redo, save/reload and a screenshot. Explicit APP_URL is
http://127.0.0.1:3000, viewport 1600x1000, panel closed for the final canvas
screenshot, ordinary zoom-fit after reload. Playwright owns temporary servers;
no .env required. This proves application, not autonomous model planning.

Application owner evidence: the registered `apply_prepared_design` action now
admits native frame/text/rect/oval/vector payloads, parent order, unique IDs,
canonical properties and complete vector topology before writes. It owns a
validated snapshot across yields, checks workspace/lock/identity changes, and
uses existing common creation/selection APIs. No geometry reconstruction or
custom rollback/Undo is introduced. The new registration test failed before
runtime wiring and now passes. The complete existing `test:ai` suite passes:
32 files, 213 tests, including 17 new application tests. App typecheck, scoped
ESLint, naming and Inspector module loading pass. Initial Node test invocation
was corrected to the App's declared jsdom environment (no production fallback).

`e2e/editable-design.spec.ts` passed in 21.3s. The actual panel accepted a
deterministic server batch and produced native text, nested frames and cubic
controls; one Undo/Redo and durable reload match document digests. Inspected
`test-results/editable-design-the-Agent--ecc51--curves-in-one-durable-Undo-chromium/editable-design.png`
shows the intended fixture hierarchy and content. It also confirms a remaining
text-rendering quality issue: native text appears blurred at 154% zoom. Return
to the native-text rendering owner for zoom-aware raster resolution before visual
closure; do not mark this screenshot as overall quality acceptance. Playwright
process session 73953 completed and its managed servers exited. No .env or live
model request was used.

Next: provider-owned semantic preparation tools and opaque artifact resolution,
then document context/targeted edits/organization and deterministic review. The
new App action is not yet autonomously usable through model preparation tools;
full AI plan, generated-template sync and final PR/CI delivery remain incomplete.

## Provider design handoff owner card

Step `resolve-design-operations`, spec `design-preparation.md#provider-handoff`.
Inputs: registered actions, semantic draft calls, request-local preparation
artifacts and operation receipts. Outputs: opaque preparation receipts to the
model and resolved canonical batches to `apply-prepared-design`. Advertise only
when that App action exists. Server preparation and existing operation/review
transport contribute; raw model descriptors, image attachment prerequisites,
extra credentials, network fetches and canvas writes inside preparation do not.
Boundary: `server/local-design-tools.ts`, `server/local-operation-tools.ts`,
`server/local-ai-provider.ts`, domain prompt, direct server tests, design tool
constants and App test registration. Names are additive tool/wire identities.
Bound failed preparation attempts as well as successful artifacts; bad draft or
reference input must be a recoverable tool result, never fake success or an
unrelated transport failure. Canonical execution failures keep existing runtime
ownership. Gates: capability gating, compact receipts without descriptors,
request isolation, invalid-input recovery, bounded attempts, no recompile on
resolution, operation application/review and fake native-provider protocol tests.
Stop if a required canonical action/receipt is unavailable. No paid model tests.

Handoff direct-consumer completion: map the two new design tool/action identities
to concise English activity labels using the existing presentation map. No change
to progress ordering, grouping, scrolling or lifecycle. Direct regression tests
belong in `src/ai/__tests__/presentation.test.ts`; only that test and the static
map in `src/ai/presentation.ts` join this tool-exposure boundary.

Provider handoff evidence: `prepare_design` now accepts semantic drafts without
images, returns request-local artifact IDs/findings, and has an eight-attempt
budget including invalid drafts. The model sees only `artifactId` for
`apply_prepared_design`; both dynamic and final-batch routes resolve the same
immutable artifact. Invalid references return recoverable native tool failures
without executing the App; execution failures remain owned by the existing
runtime. Three fake-native-provider tests failed before wiring and now prove
preparation -> canonical application -> actual inspection receipt, invalid
reference recovery, and non-streaming final resolution. Initial integration
fixtures were corrected to use the existing required report_outcome final action
rather than an invalid empty batch; no envelope validation was relaxed.

Full server harness: 276 passed, one live AI test skipped, 22 test files passed.
The direct preparation adapter/operation cases cover capability gating, raw
descriptor rejection, cross-request IDs, meaningful error correction, cancellation
and no recompilation on artifact reads. Server and App typechecks, scoped ESLint
and naming pass. The 13 presentation tests include failing-first coverage for
concise design activity labels. No paid calls, dependency changes, global agent
settings or remote push. Next owner: bounded document context, targeted edits and
organization; text rendering resolution and full review/UX/template/PR gates
remain pending.

## Selective canonical context read owner card

Step `read-design-fields`, supporting spec `design-preparation.md#context-and-targeted-operations`.
The current Core `getElementComputedData` obtains one shallow computed projection
through `getAllComputedData`/`Computed.save`, then deep-clones every field. This
unnecessarily traverses vector point payloads for metadata-only consumers. Add an
optional flat field selection to this existing facade: omitted selection retains
existing behavior; explicit fields clone only selected own values. No new cache,
recomputation, write or persistence format. At most 64 nonempty field names (128
characters each), deduplicated before projection; invalid selection fails before
reading. The owner remains Core observation admission, not the AI prompt.
Allowlist: Core scene-tree API implementation/type, its direct tests, this spec
and a Core changeset. Normal adapter inspection confirms its source read is one
shallow object spread, not a traversal of nested vector payloads. Tests must prove
unrequested nested geometry is not visited, requested values are detached, missing
objects stay absent, old whole-object reads remain compatible and every subsequent
read reflects current values. Gate: focused Core tests/build/lint/naming before
using this read in the App context owner. Stop for a source projection that would
materialize omitted geometry.

Selective read evidence: seven new negative/work-avoidance cases failed before
the facade change. The complete focused scene-tree facade file now passes all
20 tests, including existing detached whole reads. Omitted nested vector data is
never visited; requested arrays are detached; two reads after source edits each
read once and return fresh values without altering prior results. Core build and
scoped ESLint pass; naming passes. The existing Core library target does not
include Object.hasOwn, so the implementation uses the compatible existing
hasOwnProperty.call form rather than changing runtime/compiler targets. Updated
`docs/ai/framework/API_SURFACES.md` and added a Core changeset for the additive
optional argument. No other existing query callers were changed. Next App context
queries can consume this bounded observation instead of cloning full vectors.


### Execution card - read-document-context

Owner: App document observation. Spec: design-preparation context and targeted
operations. Inputs: selection or direct children, optional parent, offset and page
size (default 50, maximum 200). Output: fresh canonical summaries and next offset.
Read the current document; default children scope is the current workspace. No recursive traversal, writes, snapshots or
visual-review attempts. Common API owns projection, Core owns detached reads.
Metadata reads exclude vector geometry. Each page reads its parent once and each
page object once, with one selected computed read per existing object. The parent
children array is copied by existing Core observation; no cross-call cache.
Boundary: common-apis/design-context.ts and its permanent tests, spec/Inspector.
Gates: page/selection counts, invalid input, missing parent/object, truncation,
fresh reads and omitted geometry, scoped types/lint/naming. Stop on a requirement
for new framework mutation or permission policy. Provider exposure follows as a
separate owner slice after this read owner passes.

Read owner evidence: 12 permanent tests pass (missing implementation was proven
before implementation), selected-field app typecheck passes. Inspector imports.
No geometry, mutation or review code changed in this owner slice.

### Execution card - expose-document-context

Owner: App action/provider read route. Consume the validated read owner unchanged.
Expose read_design_context in registered actions, native tools and English activity.
Inputs: the bounded page query and abort signal. Outputs: canonical read receipt.
Permissions use existing explicit allow policy; no mutations, screenshots or
visual correction budget consumption. Final read batches are admissible without
mutation review. Boundary: context-action, runtime registration/startup/constants,
provider operation classification, presentation, domain prompt and direct tests.
Gates: read action cancellation and forwarding; provider read followed by outcome
without inspection or downgrade; bounded app/server types, lint and naming.
Stop if routing requires a new transaction or permission mechanism.


Document-context route evidence: App AI suite 228 passed across 34 files;
operation/prompt tests 23 passed, including context reads after all six visual
review attempts. App/server typecheck and scoped lint pass; naming 11 passed.
Final read-owner review found null page values bypassing defaults: added two
failing cases before correcting defaults; all 14 read-owner cases now pass.
Read-only route does not capture screenshots, consume correction attempts, or
reject final read operations as unreviewed writes. Prompt documents bounded
selection/children observations and warns against replacing truncated text.
Artifacts: tmp/local-codex/context-action-{ai-suite,server,types,naming}.log and
 document-context-{green,null-red,lint}.log. No paid calls, commit or push in this
slice. Next: canonical targeted edit and organization owners; native text visual
resolution and broader plan acceptance remain open.


### Execution card - revise-design-element

Owner: App targeted mutation via common APIs. Spec: context and targeted operations;
case 3 and 12. Add update_design_element (App action registry, additive wire name;
no saved identity changes). Input: one current canonical ID, optional name,
parent-local bounds/rotation, native typography patch and primary fill/stroke color.
Validate the whole request and current target/ancestor locks before any write;
reject unsupported fields instead of silently dropping them. Use native text schema
and existing geometry/style/name owners. Output: applied ID and same target as
visual review root. No new element, hierarchy replacement, custom renderer or Undo.
Boundaries: common-apis/design-edit.ts, ai/design-edit-action.ts, direct tests,
action registration/presentation/domain prompt and these contracts. Gates: invalid
patch no writes, inherited locks, literal text changes, geometry API routing,
unchanged fields omitted, partial writes preserved if a later canonical owner
throws, one-Undo/browser evidence in the later integrated product slice.
Stop for unsupported canonical geometry semantics rather than adding patch geometry.

Targeted edit browser proof is included in editable-design.spec.ts: follow-up
heading edit, unchanged sibling raw/computed data, one Undo/Redo and durable reload.
This is deterministic action transport, not a paid/live model quality claim.
Direct consumer review also found context using color instead of native textColor;
a failing canonical-field test precedes the read-owner correction.


Targeted mutation progress: 248 App AI tests pass (36 files), app/server types
pass, scoped lint and naming pass. Common edit tests cover whole-request rejection,
parent locks, unchanged values, literal text and partial retention. The context
textColor regression is corrected after a failing canonical-field test.

The integrated browser proof is RED at durable edit persistence after reload.
Canvas text/geometry/color, unchanged sibling data and one Undo/Redo all pass.
Permanent failure attachments compare canonical fields and transport state:
transport connected/synced, 0 pending, 3 publications, no decode failures. Backend
record remains durableSequence 3 with publicationSequences 1:publication:1,
2:publication:1, 3:publication:1 from the initial create/undo/redo. All follow-up
edit fields remain old on disk. Factory data-transact.ts nextPublicationId uses
only per-instance currentTransactionId and publicationSequence; after page reload
those identities repeat. This is an upstream publication identity collision, not
a typography rendering or patch-admission failure. Do not weaken the persistence
oracle or add an App-only ID patch. Next necessary owner slice: inspect Factory
publication identity contract and durable duplicate-admission contract, add a
permanent two-runtime/reload collision regression, fix the canonical identity
producer with saved publication compatibility, then rerun this browser proof.
No successful browser/visual closure, commit or push is claimed for this slice.
Relevant logs: targeted-edit-{ai-suite,types,server,browser}.log. The browser HTML
report contains durable-edit-differences and durable-edit-transport attachments.


### Execution card - record-and-deliver-transaction-batch identity correction

Evidence changes the bounded next step: editing after reload collides with already
accepted publication IDs, violating durable edits. Existing owner is Factory's
record-and-deliver-transaction-batch in canonical-projection-and-collaboration
Inspector, with settle-local-shared-projection in Transaction Inspector. Follow
Factory package shared publication contract and original plan Factory ownership.
Inputs remain the canonical journal and transaction/publication counters; output
is the same immutable transport publication with an opaque collision-resistant ID.
Use one lazy 128-bit random namespace per DataTransact lifetime, then existing
transaction/window suffix. Only publication IDs change; local action/artifact,
slice/delivery order, compensation links, Undo, wire schema and persisted IDs stay
unchanged. Existing stored opaque IDs remain accepted and are never rewritten.
No App transport patch, network policy, dependency, saved actor credential or
payload scan. Namespace generation occurs once per producer that publishes, never
per item. Owner files: data-transact.ts and shared-publication.test.ts, related
current Factory docs/Inspector, patch changeset. Tests first: two fresh producers
must not collide while retry/compensation correlations stay stable. Gates: full
Factory tests/build, collaboration tests, targeted-edit browser durability and
existing Core transaction integration. Stop if wire consumers parse ID syntax;
review those direct consumers before claiming compatibility.


Publication identity correction evidence: new two-runtime collision and namespace
work-count tests fail before the producer change. Factory 259 tests, Collaboration
69 tests and Core hierarchy transaction 17 tests pass. Factory build, scoped lint
and naming pass. Direct wire consumers treat publicationId as opaque; no syntax
parsing found in Collaboration, App codec, lifecycle or server. Existing static
legacy publication fixtures remain accepted in collaboration tests. The exact
previously failing editable-design browser test now passes (22.8s), proving follow-up
edits after reload persist and survive another reload, with sibling identity/data
and one Undo/Redo preserved. Screenshot targeted-edit.png inspected: correct updated
heading and composition, but native text remains blurry at 154% zoom. Native text
render resolution remains an open visual-quality requirement. No push yet.


### Execution card - materialize-native-text screen resolution

Owner: Pixi materialize-native-text, editable-text spec engine materialization.
Observed screenshot at 154% zoom has blurred glyphs. Input: owned Text objects,
renderer pixel ratio and actual world linear transform. Output: text raster
resolution matching screen demand, capped at 4 and bounded by 4096px per edge and
4M pixels per text texture. Text content, layout, canonical IDs and geometry stay
unchanged. Register only adapter-owned text; remove on clear/destroy. Coalesce
resolution invalidations until flush after text creation, reparent, viewport-scale
or object linear-transform changes. Stable flushes and viewport translation do not
scan texts or assign resolution. No renderer-wide scene traversal or canonical cache.
Boundary: Pixi engine and its permanent tests; current text spec/Inspector and patch
changeset. Gates: failing DPR/zoom test, inherited scale, work counts on stable
flush/pan, clear/destroy cleanup, bounded resolution, package tests/build, actual
editable-design browser screenshot after 154% zoom and native text E2E. Snapshot
extraction continues its existing bounded protocol; this slice proves screen quality.


Screen text resolution evidence: the new zoom/DPR regression failed before the
engine change. All 22 Pixi tests pass, including inherited scale, zero work for
stable flush/pan, release after clear and both texture edge/area budgets. Engine
build, scoped lint and naming pass. APP_URL=http://127.0.0.1:3000 browser scope
editable-design.spec.ts plus native-text.spec.ts passes (2 tests, 28.1s). Inspected
actual App targeted-edit.png at 154% (1600x1000, panel closed) and native-text.png
at 238% (1280x720, text selected/properties open): headings and multilingual text
are now crisp, while editable content, one Undo/Redo and save/reload pass. Temporary
Playwright servers exited; port 3000 is free. Snapshot-specific resolution at a
different extraction scale has not been proved by this screen-quality slice.
Next product owner: organization operations (group, ungroup, reorder/reparent and
alignment/spacing), then deterministic review/convergence and varied full flows.


### Execution card - organize-design-hierarchy

Owner: App organization through canonical hierarchy common APIs. Product cases 13
and 14, design-preparation context/targeted operations. Add organize_design with
operation group/ungroup/reorder, 1..200 unique current IDs, optional group name and
required reorder index. Reorder keeps one parent; group/ungroup retain native
coordinate and stacking semantics. No arbitrary reparent, deletion, reusable
instance claim or replacement of unrelated layers. All query shape/target/ancestor
lock checks occur before writes; ungroup also checks all direct children. Use one
request-local raw observation map, one read per distinct touched node; no persistent
cache or full-document lookup in the App admission. Native hierarchy owners retain
their existing geometry preparation. Whole call remains in invocation Undo.
Output is actual group/member IDs and canonical hierarchy result. This structural
operation is reviewed from its canonical receipt, not automatically rasterized;
explicit inspect remains available where stacking effects need visual review.
It must remain executable after the visual-correction budget. Alignment/spacing is
a separate subsequent layout owner, not silently treated as hierarchy-only work.
Boundary: common organization implementation/tests, action/registration/presentation,
provider operation classification/tests, domain prompt, spec/Inspector/package.
Gates: bad args/duplicates/locks/membership no writes, native owner routing, actual
read counts/fresh next-call reads, canonical order receipt; AI and provider tests,
types/lint, browser grouping/ungroup/reorder with one Undo and stable native data.


### User-requested pause - Codex restart (2026-09-23)

Work is paused at the user's request. Preserve all uncommitted changes in
`.worktrees/design-local-codex`, branch `codex/design-local-codex`, HEAD
`16eed62639c30e208cfb670ece49748458c4552c`. No commit or push was made for this
checkpoint. No test .env was created. Port 3000 has no listener after the test.

The organization slice has 32 focused tests passing across three files; its
TypeScript and focused lint checks passed. Browser validation is NOT complete:
`e2e/design-organization.spec.ts` fails on the initial creation request at line 83
(the helper at line 78 expects outcome success but receives failed), before the
organization steps. Evidence: `tmp/local-codex/organization-browser.log` and
`apps/asyra-design/test-results/design-organization-Agent--bf8c0-request-is-one-durable-Undo-chromium/error-context.md`.
On resume, diagnose that initial request first, then finish organization browser
proof. Do not infer that organization Undo or persistence passed.

Remaining goal: organization browser proof; alignment/distribution; deterministic
review and convergence; varied editable creation/revision/illustration/organization
flows and UI evidence; documentation and generated-template synchronization; final
validation, scoped review, commits and push to PR 223, then latest-HEAD CI success.
The complete goal is not delivered. Unrelated multi-agent configuration belongs
to the separate task and must remain untouched.


### Resumed - organization evidence

The failed initial request omitted required action summaries in the E2E fixture.
Correcting those transport fixtures (without production changes) makes the full
organization browser case pass in 17.9s. Group/ungroup/reorder preserve artwork;
Undo/Redo and persisted reload assertions pass. Inspected organized-design.png
at 1600x1000 / 180% in the actual App: both rectangles and the circle remain intact.
No remote action performed. Continue the active goal on user request.

### Execution card - arrange-design-elements

Product cases 13/14, design-preparation #arrangement. Owner is App layout admission
and translation. Input: 2..200 sibling IDs, horizontal/vertical axis, align with
start/center/end or distribute with optional nonnegative gap. Output: actual
changed IDs and parent-local positions through one canonical property batch.
Use current native projected corners in parent coordinates (including rotation),
not path reconstruction or screen pixels. Validate all IDs/ancestor locks and
geometry first. One raw read per distinct touched node, one computed geometry read
and four projected corners per target; no retained cache. Equal distribution
preserves outer extent without gap, or first edge with explicit gap; preserve
orthogonal coordinates, sizes, order and styles. Reject negative implicit gaps.
One invocation Undo, ordinary failure policy unchanged. Use existing preset group
property projection once for group targets, then Core's plural write. No custom
renderer geometry, arbitrary parent changes, or guessed unsupported capabilities.
Boundary: design-arrangement common API/tests, action/tests, registration,
constants, presentation, domain prompt, focused E2E/spec/Inspector/package wiring.
Gates: all axes/alignment edges, unequal sizes/gaps, invalid/locked no-write,
work counts/fresh reads, wrapper cancellation, native browser positions and Undo.
Stop if canonical projection cannot provide finite parent-local bounds.


Arrangement slice evidence: 22 admission/position/work-count tests, one wrapper
cancellation test and runtime/startup checks pass (26 total). App typecheck and
focused ESLint pass. Organization E2E extended with top alignment and explicit
24px horizontal gaps: passes in 20.6s, preserving styles/dimensions, per-request
Undo/Redo and persisted reload. Actual organized-design.png inspected at
1600x1000 / 180%: top edges align and equal gaps are visible. Naming gate passes.
Native position publication is plural; group property preparation runs once when
target groups need it. No screenshot/renderer mutation, hierarchy or style writes.
Next slice: native content measurement and deterministic design review before
subjective screenshot review. Complete goal and remote delivery remain open.


### Execution card - query-native-content-bounds

Owner: neutral engine query and concrete engine content observation. Editable-text
#native-content-measurement. Input owned native object; output local content bounds
independent of zoom and canonical layout bounds. Optional named capability, explicit
unavailable for engines that cannot measure. Pixi uses native local bounds; no font
heuristic, image extraction, text recreation, geometry or canonical writes. Recording
engine explicitly does not claim actual measurements. Additive runtime protocol,
no persisted identities changed. Boundary: render-engine types/capabilities/testing
adapter, Pixi query and direct tests, spec/Inspector/changeset. Gates: local versus
world bounds, no extraction, destroyed/foreign handle rejection, engine tests/builds.
Following segment exposes one-flush plural measurement through Render/Core, then
App review; those segments must have their own execution cards before edits.


Native content query: regression failed before implementation; 20 Pixi tests and
10 neutral engine tests now pass, with builds passing. Recording engine rejects
actual measurement and does not advertise its capability. No image extraction.

### Execution card - observe-rendered-content

Owner Render facade, Core forwarding. Editable-text #native-content-measurement.
Input 1..200 unique IDs, output per-ID local native bounds or missing-target null.
Validate before flush; require optional capability; one flush per call then one
native query per present target. No image capture, canonical reads/writes or new
cache. Bound types exported from Render; Core only forwards. Boundary Render
render.ts/index.ts/direct tests, Core render request/types/create-apis/core.ts
and forwarding tests. Test admission no flush, work counts, detached results,
missing targets and unsupported engine; build Render/Core. No App heuristic.


Content observation: 50 Render tests and 7 Core facade tests pass; Render/Core
builds pass. Native-text browser proof passes in 14.8s: real content bounds differ
from its 320x120 layout box and remain identical after zoomFit; native editing,
Undo/Redo and save/reload continue to pass. Screenshot inspected at 238% zoom.

### Execution card - review-current-design

Owner App deterministic review, product case 9. Read 1..200 nodes under a requested
root, selected computed fields only; report truncation, unavailable measurements,
actual text overflow and parent-box overflow without screenshot or mutation.
Measure native text in one Core call. One raw/computed read per visited node;
no vector payload, retained cache or pixel export. Parent-box checks only compare
unrotated local boxes; mark unsupported rotated checks explicitly, never pretend
complete coverage. Text content is measured in its own local coordinates even if
rotated. Results describe what was checked, not subjective design approval.
Boundary common design-review/tests, review action/tests, registration/presentation,
provider read-only classification/tests, prompt and formal browser test. Stop on
missing canonical/measurement evidence; report incomplete rather than success.
This segment adds the read-only operation; automatic correction scheduling is the
following provider owner segment, not silently changed here.


Current-design review: 31 focused App/provider tests pass. Native-text E2E passes
in 14.4s: shrinking the box to 20px yields a concrete text-overflow finding; Undo
removes it. The operation is read-only and does not consume screenshot attempts.

### Execution card - schedule-design-review

Owner provider operation settlement, existing rendered-review route. After a
mutating receipt identifies a target, run registered review_design once before
snapshot capture. Return concrete text-overflow findings immediately for correction,
skipping that expensive image; missing/incomplete non-text checks accompany image
review rather than being converted into false failure or silent approval. Bound
mutating/review cycles to eight when deterministic review is available, retain the
existing six-image bound, preserve all applied writes and current transaction.
Do not finalize completed while known text overflow remains. No engine, geometry,
Undo or permission changes. Boundary local-operation-tools/direct tests, domain
prompt, spec and exact inspection route condition. Red tests: review before image,
overflow skips image and prevents completion; corrected next pass captures image;
cycle limit prevents more writes but permits reads. Existing image-only providers
keep their current flow. No new tool capability is invented if review is absent.


Provider review scheduling: red tests proved image capture previously ran before
measurements and the cheap-correction path was absent. Now 24 focused tests pass:
mutation -> deterministic review -> image only after text overflow is resolved;
eight cheap cycles, six images, reads still allowed; known overflow cannot finalize
completed. Issues are retained per measured text ID, so reviewing an unrelated
object cannot erase a known failure. Typecheck and focused lint pass. This is
measurement-driven ordering, not a claim of subjective design perfection.


AI suite: 294 tests pass across 42 files. Server suite: 281 passed, one usage
privacy assertion falsely matched `bad` inside a random UUID. Replaced the broad
substring test with exact sensitive-value and prohibited-field assertions; the
60-test provider file passes. No production privacy behavior changed.

### Execution card - conversation-lifecycle / general target continuity

Product cases 3/12/14. Existing target revalidation only retained group roots and
oval/vector roles, dropping native frames, rectangles and text on follow-up.
Preserve current non-workspace object IDs regardless of representation; executor
capabilities remain authoritative. Remove missing/workspace references. Observe
each distinct ID once per revalidation call, fresh on the next request; no retained
cache. Boundary conversation.ts/direct tests and conversation spec. Gates: native
frame/text/rect continuity, deletion invalidation, request-local observation counts,
existing conversation recovery and disposal tests. No geometry or UI changes here.


General target continuity: 19 conversation tests pass after retaining semantic
prepared-design receipts and current non-workspace targets. Duplicate role references
share one existence observation within a submission and deleted IDs disappear on
the next request.

### Execution card - conversation-lifecycle / navigation state

Owner document-scoped conversation controller. Product Stage E: New conversation
and history navigation preserve settled messages and each conversation's target
hints/turn IDs, without writing canonical data. Reject navigation during active
work or after disposal; switching to unknown IDs rejects. New on an empty current
conversation is a no-op. Histories last only for this document runtime, and disposal
clears them. Separate stable navigation projection/subscription updates only for
identity/title/busy changes, not each progress event. No additional provider or
transaction owner. Boundary conversation.ts/direct tests/spec and lifecycle
Inspector. Gates: new resets targets, return restores history and revalidates IDs,
active/disposed guards, stable navigation identity during progress, existing tests.
UI wiring and draft preservation are the next presentation segment.


Navigation controller: 21 conversation tests pass, including new/history state,
per-conversation IDs and target restoration, active/disposed guards and stable
navigation snapshots during progress.

### Execution card - conversation-lifecycle / navigation presentation

Owner panel composition, Stage E. Add compact New and History controls backed only
by the controller, disabled while active. Preserve unsent text/attachments separately
per conversation on switches, and clear attachment errors; never submit on switch.
Show current selection count using the existing fine-grained selection provider.
Keep 12px English UI, focus behavior, right/left messages and completion bell.
Use a separate navigation subscriber and selection component; no React.memo.
Boundary panel, small navigation/context components, component tests, formal E2E.
Gates: draft restoration, no send on switch, history messages restored, active
controls disabled, existing panel tests, actual narrow/desktop screenshots.


Panel navigation: 28 component tests pass. Desktop and 360px panel navigation E2E
passes (2 cases, 11.9s): per-conversation draft restoration, no extra provider call,
no canvas write, controls in viewport and subscription notice. Inspected screenshots.
Narrow setup follows the existing suite: initialize desktop canvas then resize;
it does not establish mobile cold-start support for the whole design tool. Use
viewport screenshots (not full-page overflow width) for final narrow evidence.


### Execution card - apply-prepared-design / varied product evidence

Owner existing prepared-design apply path. Product cases 1/2/11: formal mocked
provider drafts for 1440px coffee editorial, distinct SaaS, mobile composition and
original vector landscape, with native text/shapes/curves. Assert actual canonical
types/content/dimensions, no raster substitution, one Undo, deterministic text-fit
review and synchronized screenshots. Fixtures belong only in permanent E2E data;
no subject-specific production output. Boundary new editable-design-variants E2E
and matching Inspector evidence allowlist. Existing targeted-edit and organization
proofs remain complementary. This proves capability execution, not live model taste.

Varied design evidence: four mocked-provider browser cases pass (17.1s serial),
with native type/content/dimension, Undo and text-fit assertions. Inspected all
four canvas screenshots. The first parallel run encountered a page disappearing
during the mobile case; serial passed without product changes. Final browser gate
will use bounded serial execution and must still establish stable outcomes.

### Execution card - materialize-native-text / snapshot density

Owner Pixi text materialization, editable-text engine contract. Verify that a
bounded target snapshot uses its capture density independently of screen zoom,
retains ordinary screen density afterwards, and never touches unrelated text.
Inputs: owned target, native local transforms, admitted capture dimensions.
Outputs: actual target PNG and restored engine-owned text density; no canonical
write. No font heuristics, app content, or changed snapshot geometry. Boundary
Pixi adapter/direct tests and native-text E2E evidence. First prove zoom-dependent
capture via a permanent browser assertion; if absent, keep implementation unchanged.
If present, test-first bounded engine correction with restoration on extraction
failure, then browser pixel equivalence at low/high screen zoom.

Snapshot density: reproduced differing actual dark text captures at 25% and 200%
screen zoom, plus a failing engine test (0.25 vs required 1.28 nested density).
The adapter now scopes density to target-local transforms during capture, restores
screen density in finally, and leaves unrelated text untouched. 21 Pixi tests,
build, focused lint and native browser case pass; real PNGs match at both zooms.
No canonical, geometry, viewport or snapshot-frame changes.

### Execution card - resolve-design-operations / full provider review evidence

Owner native provider semantic handoff (existing Inspector boundary includes
local-ai-provider.test.ts). Extend the complete protocol test to advertise real
measurement capability and assert apply -> measurement -> screenshot order with
compact measurement receipts. Existing local-operation-tools tests cover iterative
correction, unmeasured target preservation and bounded stopping; transport integration
must not bypass those owners. Test-only changes, no new capability or protocol.

Provider semantic handoff: full fake App Server transport now asserts canonical
apply -> native measurement -> rendered capture, while keeping descriptor arrays
out of model tool receipts. All 60 provider tests pass.

### Execution card - delivery / canonical docs and generated template

Stage F owner canonical App documentation and official template generator. Update
README to the implemented native research, editable capabilities, current review
and document-session conversation navigation. Then run release:app from canonical
source and release:app:check. No hand-edits to generated output, version bump,
registry publication or release claim. Packed local clean-consumer evidence is
pre-release compatibility evidence only; public registry installation needs the
new Framework packages to be released through their existing Changesets workflow.
Boundary canonical README/specs, generated template and existing release validation.
Exclude secrets, .env, runtime output and unrelated multi-agent settings.

Final browser gate: 22/22 passed in 1.5m, covering desktop/narrow conversations,
clarifications, partial failures, cancellation, Undo/Redo, canvas shortcuts,
activity following, new/history drafts, native text persistence, varied designs
and organization. Inspected final 360px panel, activity and actual text capture.

### Execution card - native measurement / direct engine consumer compatibility

Root production build exposed one direct union consumer: Fieldscope's custom
Three engine treated the new local-content-bounds query as a point conversion.
It does not advertise this optional capability. Add a formal unsupported-query
regression, then reject before projection just like its existing snapshot guard.
Boundary Three engine query/direct test only, no 3D semantics or new capability.
Gates: formal red/green, unchanged render work, root build.

Three consumer regression reproduced then fixed by explicit optional-capability
rejection; 21 direct engine tests pass. No 3D behavior added.

### Execution card - delivery / Inspector projections

Regenerate the existing workspace bundle from current source Inspectors (new text
and editable-design entries were missing from generated candidate inventory).
Update the direct canonical contract test's obsolete assertion that no App plan
is active: this task intentionally adds an active plan while preserving the
completed canonical plan record. No owner semantics changed. The unrelated
state-contracts wording assertion is classified separately against unchanged
HEAD content; do not restore legacy wording or alter canonical behavior to pass it.

The same union consumer exists in Asyra Sim's separate Three adapter. The next
root build exposed it after Fieldscope passed. Apply the identical unsupported
capability contract in that direct adapter/test, with formal red before correction.
A bounded query-implementation search confirms these are the only custom adapters.
The retained canonical Inspector test still has one pre-existing assertion about
transient point previews; its state-contracts input is unchanged from HEAD. This
AI task does not reintroduce that removed geometry behavior.

Generated catalog validation caught descriptive output strings in the new
Inspectors where the v2 schema requires registered artifact IDs. Normalize those
new owner outputs into explicit artifacts and link the native measurement handoff;
no product step/order/permission behavior changes. The existing catalog renderer
test is the failing oracle and must pass after regeneration.

### Execution card - install-and-edit-text / startup integration test

Full App local suite exposed its mocked composition test skipping preset owner
installation while invoking real initText, causing missing position registration
and subsequent duplicate typography registration. Match the existing isolated
capability spies: mock text installation in this composition test and assert one
call with Core immediately after preset. Native installation retains its own
formal test and real browser proof. No production fallback or double-registration
guard is introduced. Boundary init-app.test.ts and native-text Inspector evidence.

### Execution card - prepare-semantic-design / server protocol boundary

Clean-template validation found semantic preparation importing Preset runtime to
read typography defaults/schema, violating the existing backend-only-App-protocol
contract. Existing framework-runtime-boundary.test.mjs is the failing oracle.
Move semantic text defaults/admission into the App's prepared-design protocol;
canonical browser admission still validates against installed component schemas.
Add compatibility assertions against canonical typography in tests only. This
keeps server imports inert and does not weaken the boundary or duplicate document
authority. Boundary prepared-design.ts, design-preparation.ts and its tests/spec.
Gates: backend boundary, typography compatibility, existing preparation cases,
server typecheck, generated consumer. No new dependencies or Framework changes.

Delivery checkpoint: root build 23/23 tasks passed. App local 401 tests passed;
AI 298 and server 282 passed (paid-live case intentionally skipped), plus the
new typography compatibility test. Framework full suites: runtime 89, Factory 259,
Core 250, Preset 170, neutral engine 10, Pixi 24, Render 226. Inspector workspace
100 contracts passed after artifact registration. Root lint has 0 errors (existing
81 warnings); naming passes. Public reference download smoke returned 200 JPEG
9022 bytes through the actual bounded transport, without model use.

Packed clean Framework consumer READY: 19 packages / 4 phases. Generated template
consumer READY: 12 direct Framework packages / 6 phases including independent
install, typecheck, lint, production build, formal tests and startup. Official
template parity passes. These are pre-release tarball proofs, not registry
publication or live model design-quality evidence. Performance gates and final
bounded diff review/commit/push/latest-HEAD CI remain.

### Execution card - conversation-lifecycle / current visible status

Bounded panel diff review found the compact current status still reading the
event label while its more specific message is the last visible Activity row.
This violates the accepted current/history consistency requirement. Strengthen
the existing equal-row test so its current entry is actually last and assert the
current status equals its final visible message. Then change only the current
status projection/title to use that message when present. No new UI or execution
state; stable history rows remain unchanged. Gates: red/green component test and
existing Activity browser tests.

Final bounded review: render delta 3/3 passed (dense move retained zero geometry
strategy calls); existing 7,076 object browser case passed in 30.9s. Specific
current status now matches the final Activity message; 28 component tests and
both desktop/narrow streamed browser cases pass after a failing-first assertion.
Synced App API index for semantic operations, local mode and navigation. Clarified
that absolute overlap is intentional input, not an automatic semantic verdict.
No paid model calls or package publication occurred.

## Delivery state - 2026-09-23

Stages A-E and local Stage F checks are complete. Editable design generation,
targeted editing, organization/arrangement, local research and bounded references,
two-stage review, personal-subscription disclosure and full conversation navigation
are implemented and covered by the evidence above. The verified design fixtures
establish canonical capabilities, not live model taste or whole-Figma parity.

Known unrelated baseline: the retained canonical projection Inspector's
`computed data is a local-only Render projection` test expects transient point
preview wording that its unchanged HEAD state-contract document no longer has.
That obsolete assertion was not weakened or used to restore removed behavior.
Current workspace catalog (100) and conversational Inspector contracts (22) pass.

Remaining delivery condition: commit and push this bounded implementation to
PR #223, verify its latest HEAD and every required CI result, then notify review.
No merge, registry release, live paid-model evaluation, or unrelated multi-agent
configuration change is part of this delivery.
