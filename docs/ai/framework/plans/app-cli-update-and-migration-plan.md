# App Version Differences and AI-Assisted Integration

## Status and bounded task contract

Revised: 2026-10-24. Tasks 1-4 are complete within the local candidate scope.
Task 4's first independent acceptance satisfied the fresh-AI requirement;
the revision-2 existing-context rerun and permanent fixture checks are separate
follow-up evidence. No further independent acceptance is pending or required
for Task 4. Publication remains unperformed and separately authorized;
production CLI and Framework/App runtime changes remain outside scope.
Earlier dated task entries retain their status at the time and do not override
this current status.
Source inspected: `7bf3655242e6adca9ac7d81ff57d17df9b310c9e` on
`codex/validation-entry-isolation`.

The user-selected direction is to explain the difference between a consumer's
current official versions and a selected target, then let the consumer's AI
integrate selected changes using existing Asyra composition and migration APIs.
Official definitions form the base; consumer extensions remain App-owned.
This revision supersedes the earlier whole-template merge, per-hunk baseline
and automatic filesystem updater proposal. Those mechanisms are not prerequisites.

The original planning revision changed this plan and its entry in `../PLANS.md`.
Task 1 added the Text guide example and recorded its decisions here. Task 2
promotes that single guide into public documentation and adds its entry/format.
Completion requires source-grounded guidance, Text examples, subsequent
update rules and acceptance cases. Checks are formatting, local references,
target API/source checks and bounded content review. Task 2 also synchronizes
the existing documentation inventory/schema, generated
indexes, website document-count guard and their direct tests. Tasks 1-2 include no
Framework/App runtime, CLI, dependency, generated-template, consumer fixture or
release publication changes. Task 3 adds only the consumer fixture and supporting
acceptance evidence using existing package build/pack workflows. The documentation inventory receives
two page IDs; no new Inspector flow or agent service is introduced.

This plan is independent of the Adoption Entry and Onboarding Program's remaining
website tasks. Its coordinating owner retains closeout responsibility. Future
work selects an exact task below and a base containing this plan under
task context (`docs/ai/workflows/task-context.md`). The selected product direction
does not authorize CLI/runtime implementation or imply completed runtime validation.

## Existing architecture to reuse

Repository paths in this document are relative to the repository root.

| Owner                                                                                                  | Existing responsibility                                                                                         |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `apps/starter-app`, `apps/asyra-design`                                                                | Canonical App source and composition examples.                                                                  |
| `release-configs/starter-app.json`, `release-configs/asyra-design.json`, `scripts/release-template.js` | Generate standalone templates from canonical source and reviewed package versions.                              |
| `create-app/starter-app/bin/index.js`, `create-app/asyra-design/bin/index.js`                          | Create new projects and install dependencies; not existing-project update engines.                              |
| `packages/core/src/core.ts`                                                                            | Public definition inspection/redefinition, registration composition and load hooks.                             |
| `packages/props-manager`                                                                               | Complete property-definition validation and atomic schema/runtime rebuild.                                      |
| Consumer App                                                                                           | Custom Features, render strategies, definitions, relations, integration choices and document migration meaning. |

The inspected CLI manifests declare Starter 0.1.0 and Design 0.5.12; these are
source versions, not proof of published artifact availability. Existing create
commands and package-manager support remain unchanged. Updating the CLI tool
does not update an already generated App's code or package versions.

The relevant public APIs are `core.getPropertyTypeDefinition(...)` and
`core.redefinePropertyType(type, update)`. The updater receives the current
complete declarative definition and returns the next complete definition.
Core coordinates an atomic rebuild and preserves registration identity and
relations. Invalid updates retain the prior definition. See the
property redefinition contract (`docs/ai/framework/plans/completed/property-type-redefinition-plan.md`)
and architecture (`docs/ai/framework/ARCHITECTURE.md#registration-surfaces`).

This is bounded pre-start composition, not arbitrary live registration editing:
constructor-mode types, active or replay-retained instances, pending cleanup and
closed composition are not eligible. Definitions retain their type identity.
The API does not infer semantic equivalence, deduplicate arbitrary fields, or
merge every registration kind. Render/UI registrations and child relations use
their own public APIs. Persisted-data conversion remains an App-owned load path.

## Product outcome

A user can ask: "What changed between the versions my App uses and this target,
and how can my AI adopt the official Text improvements while retaining my
extensions?" The official deliverable answers that question with exact versions,
behavior differences, affected contracts, integration guidance and tests.

```text
Versioned official changes and source references
  -> current-to-target change guide
  -> consumer AI inspects actual definitions and custom Features
  -> selected official base + retained App extensions
  -> consumer integration and preservation tests
  -> concise record of what was actually adopted
```

A large official App diff does not automatically require a large consumer diff.
Classify changes as new optional capability, extension of an existing capability,
bug fix, public API/dependency change, or persisted-data change. For a new optional
capability, the consumer may leave it unregistered or remove its default
registration before startup after checking dependencies. For an existing
capability extension, prefer the selected official implementation and remove
redundant local definitions/behavior while retaining non-overlapping extensions.
Retaining an intentional custom implementation remains an explicit choice.

A new official capability is not necessarily independent: required shared APIs,
properties and package changes must still be listed. Generic Starter does not
become Design merely by adopting a Text guide. Unsupported compositions receive
explicit prerequisites rather than automatic imports of the complete Design App.

Non-goals: whole-App synchronization, generic three-way/hunk merge machinery,
a new plugin or migration runtime, automatic production-data conversion,
implementing complete Text editing, or promising that any custom fork needs no
manual decisions. No new third-party dependency is assumed.

## Official deliverable - What changed

Publish a versioned, human-readable guide that a coding agent can also consume.
One maintained change record owns each official change; release summaries and
current-to-target guides derive from those records rather than independent prose.
A small structured index may support selection, but a new registry service or
special agent integration is not required for the first delivery.

Each record includes:

- Exact affected App/capability and package versions, source references, stable
  change identity, and supported from/to conditions. Preserve immutable published
  records; corrections are explicit revisions, not silent replacement.
- Before/after behavior and why it changed, with new, changed and removed public
  definitions, fields, registrations or Features. Include important fixes even
  when exported types and field names are unchanged.
- Field contracts: key, kind, defaults, validation, persistence, projection and
  unit policy. Describe changes in meaning; source snippets alone are insufficient.
- Required dependencies and ordering, shared owners affected, and whether a
  package update changes behavior beyond the selected feature.
- How to adopt, keep an intentional custom implementation, or decline an optional
  capability; how to retire overlapping local code and retain extensions.
- Saved-data impact: explicitly state unchanged representation or provide
  preconditions, deterministic conversion guidance and known unsupported inputs.
- Focused acceptance cases, supported consumer test commands, and recovery limits.
  Internal monorepo gates are not requirements imposed on consumer projects.

The first usable delivery can be a static guide and version index distributed
with official release documentation/artifacts. Later, a read-only CLI query can
select the current-to-target range and present the same guide. Exact command and
metadata names are future naming decisions. Do not reinterpret existing create
arguments or implement a source-writing updater as part of this work.

A multi-release guide must include necessary intermediate migrations, removals,
renames and dependency changes. It must not summarize only the newest release
or infer runtime compatibility from the CLI version. Unavailable historical
records or artifacts are reported as evidence gaps, not replaced with guessed
contracts. Release publication must check that records match the shipped source
and accessible package exports.

## Consumer baseline and subsequent updates

The baseline is the official contract the consumer currently builds on, not an
exact copy of the official App or a per-file merge ancestor. Keep these facts
separate:

| Fact                                       | Meaning                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Installed package versions                 | Actual resolved dependencies used by the consumer.                                               |
| Initial generator version                  | Provenance of creation only; it does not describe later integration.                             |
| Selected official capability revision      | Official definition/behavior adopted for that capability.                                        |
| Local extensions and intentional overrides | App-owned differences that must remain visible to the next integration.                          |
| Per-change adoption status                 | Adopted and verified, deferred, intentionally overridden, or not applicable to this composition. |
| App document schema/version                | Consumer-owned persisted-data lineage, independent of release numbers.                           |

Retain a concise project-local adoption record in the consumer's existing
project documentation/metadata. Record relevant official change IDs/revisions,
actual implementation locations, retained differences, dependency requirements
and verification source/results. Downloading a guide, updating a package, or an
AI reporting success is not proof that all App wiring was adopted. Failed or
partial work remains pending; do not mark the whole App as a target version.

On the next update, the AI reads the record and inspects current source and
resolved packages again. User edits since verification invalidate assumptions;
recorded evidence is historical, not a substitute for checking present behavior.
Deferred changes remain visible. An intentional override remains a review item
when upstream prerequisites or meaning change; it is not permanently ignored.

Example sequence:

1. At V1 the App extends official Text with five fields and custom behavior.
2. At V2 the user adopts two equivalent official fields, retains three local
   fields and defers an unrelated official feature. Record those exact choices.
3. The user changes one retained extension and adds approval metadata.
4. At V3 the AI compares the adopted Text contract with V3, inspects those local
   changes, and includes prerequisite changes from V2 through V3. The deferred
   feature is still offered separately; selecting it does not reinstall Text.
5. Accept only after tests verify the combined official and local behavior.

When an old project has no adoption record, infer candidates from package locks,
source and available release evidence, and state uncertainty. Users can still
receive a useful version guide without a stored template snapshot. Do not invent
an exact previous capability revision when copied or rewritten code obscures it;
review the actual local contract before making dependent changes.

## Text example - Official definitions plus local extensions

Current source anchors are:

- `packages/preset/src/components/text.ts`: the `text` component and render strategy.
- `packages/preset/src/props/components/text-component.ts`: `typography` fields,
  defaults and schema.
- `apps/asyra-design/src/init/capabilities/init-text.ts`: installs Text definitions,
  rendering and selection projection; `src/init/init-app.ts` invokes it.
- `apps/asyra-design/src/properties/text.tsx`: property controls using existing
  controller/API mutation paths.
- `packages/core/src/__tests__/property-type-redefinition.test.ts`: existing
  atomicity, relation-preservation and eligibility tests.

The five-field example below is hypothetical, not a claim that these fields are
new in the current release. Suppose a consumer added `lineHeight`, `letterSpacing`,
`approvalStatus`, `sourceRecordId` and `labelCategory`; the selected official
revision now supplies the first two with equivalent contracts.

Compose the selected official Text definitions first, then inspect the current
property definition and use `redefinePropertyType` to retain the three App-owned
fields. Construct one complete, unique-key field set based on `current`; preserve
other definition policy unless an intentional change was reviewed. Do not append
all five fields blindly or replace the current definition with a frozen V1 copy.

Preserving a field definition alone does not preserve its consumer path. Current
official Text component aliases and UI projections enumerate official fields;
redefinition does not automatically extend those lists. Trace each retained
field from its existing editing action through the public write API, canonical
value, read/projection consumers and save/load path. Preserve existing direct
property access; where the App uses aliases, child projections or UI properties,
retain or reconnect them through the existing relation and registration APIs.
No new API or automatic placement in the official Text panel is required.
For all three retained fields, acceptance must edit through the existing App
action, verify canonical reads and projected output, then save and reload and
verify the same values and behavior. Registry/schema inspection alone cannot pass.

| Overlap                                                                   | Integration decision                                                                                                                                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same key and equivalent full contract                                     | Retain the official field and remove the redundant local declaration. Existing data need not migrate solely because its definition now comes from upstream.                  |
| Same key but different defaults, validation, units or persistence meaning | Compare consumers and saved values. Adopt official semantics with an explicit adjustment/migration, or retain a documented intentional override. Never silently skip by key. |
| Different key but equivalent meaning                                      | Decide the canonical key and update callers/data references when adopting it; a name difference is not evidence of an independent extension.                                 |
| Local-only field                                                          | Preserve its complete schema, defaults, persistence/projection policy and direct consumers.                                                                                  |
| Duplicate feature behavior                                                | Use the official behavior for the selected operation and remove only the redundant local handler/Feature. Preserve local business rules and callers.                         |

A user's existing extension may need no edit if it already constructs the correct
unique-key result against `current` and the contracts are equivalent. Current
APIs do not automatically establish that equivalence. Duplicate field keys are
rejected; a stale complete definition can suppress upstream additions.

Data-definition overlap and feature overlap require separate review. A single
field definition does not prevent two Features from responding to the same
input. Trace creation/editing, keyboard ownership, common APIs, rendering and
projections; one intended edit must retain one intended transaction/history
behavior. Remove duplicate logic without deleting unrelated behavior merely
because it lives in the same file or handler.

Prefer redefinition to unregistering a shared property for ordinary field
extension. For a complete implementation replacement, edit initialization to
compose the desired owners in a fresh runtime. If unregister is necessary,
inspect declared dependencies and affected consumers first: detach and recursive
unregistration do not automatically reappear when the target is redefined.
Preserve or explicitly reconnect chart/approval relationships, property-child
relations and aliases. Do not assume a generic update-register API exists for
render strategies or UI properties.

One current consumer boundary needs a specific negative case:
`init-text.ts` uses the presence of a string `text` field in its projection.
A custom chart or annotation can also expose `text`. The integration must verify
that such non-Text objects do not acquire unintended Text controls or mutations.
If the selected official target fails that case, report a prerequisite fix or
use an explicitly supported composition; do not claim preservation or silently
change the consumer's unrelated object semantics.

## Saved data and existing migration ownership

Reuse App migration (`docs/public/build/persistence-migration.md`) and Core's
existing load lifecycle. Redefining a schema does not itself convert saved data.
Equivalent fields with unchanged keys and representation require validation and
round-trip proof, not an artificial migration just to rename their owner.

Where representation or meaning changes, the official guide supplies a bounded
Text transform with input/output conditions. The consumer integrates it into
its own authoritative document-version chain, alongside existing chart and
approval migrations. Official release numbers must not overwrite consumer schema
versions; equal version strings from different projects do not imply equal data.
Core's ordered load hooks do not infer or merge these histories automatically.

Preserve element IDs, hierarchy, references, local metadata and local-only field
values. Keep custom fields in registered App schemas; unknown-field retention
must not be assumed. Validate semantic equivalence before load so fallback
values cannot hide loss. Missing mappings, incompatible units or unsupported
rich-text data stop the affected integration rather than flattening silently.

Keep old transitions needed for older documents; already-current input is a
no-op. A later update must support pre-adoption documents, documents saved after
the first adoption and documents containing subsequent custom schema additions.
Validate complete candidates before activation and retain originals on failure.
Live collaborative storage requires the backend owner's checkpoint/tail and
old-client coordination; a source integration is not proof of durable cutover.
Code rollback does not undo saved-data conversion or preserve later edits by
itself. Production conversion and recovery remain separately authorized actions.

## Consumer AI workflow

1. Read the requested official version guide and local project instructions.
   Verify actual dependencies, local definitions, registration order and Features.
2. Classify selected changes and local overlaps. Identify retained business
   behavior and data, then establish preservation tests before replacing behavior.
3. Prepare bounded changes using official definitions as the base and public
   redefinition/registration APIs. Reuse existing App migration where needed.
4. Execute authorized, reversible integration and validation in the consumer's
   normal development workflow. Routine unambiguous changes need no repeated
   confirmation. Ask only for unresolved product choices, lossy transformations,
   or operations requiring approval under that project's rules.
5. Review the diff and behavior, report unresolved failures, and record only
   verified adoption. Keep deferred changes and intentional overrides explicit.

The guide is technical evidence, not permission to disregard local instructions
or execute arbitrary downloaded commands. AI may adapt source to a consumer's
layout, but may not certify success from compilation alone, waive preservation
tests, or invent missing public APIs. No dependency on a particular AI provider,
agent plugin or hosted service is required.

## Implementation tasks and prerequisites

### Task 1 - Define the change guide and Text integration contract

Scope: decide the official change-record owner/format, version-range selection,
minimal adoption record and exact Text target references. Review existing public
APIs and define concrete fixtures and checks for the acceptance cases below.
Exit: a reviewable example guide from one exact source to one exact target,
including equivalent/conflicting fields, duplicated behavior and deferred changes.
Do not build an updater or redesign Text to satisfy this documentation task.

Task 1 document result, 2026-10-23:

- Text update guide example (`docs/public/updates/text-official-fields-example-1-r2.md`) is the reviewable
  deliverable. Its exact source is the guide-defined `custom-text-example-1`
  consumer contract, not a fabricated old release; its target is official Text
  at `7bf3655242e6adca9ac7d81ff57d17df9b310c9e`. First delivery demonstrates
  integration instructions, not a verified published-release comparison.
- Change-guide ownership is official consumer documentation. Task 2 promotes
  the accepted example into `docs/public/updates/` with a small Markdown index;
  there is no second authoritative copy. Existing package release
  records and source own release facts; guides own consumer integration advice.
- The format is ordinary Markdown: identity/revision and applicability,
  before/after contract, source evidence, integration steps, data impact,
  acceptance and a short adoption note. No JSON schema or new service is needed.
- Range selection uses actual resolved package versions and adopted capability
  revisions; generator version alone is insufficient. Include intermediate
  prerequisite changes, deferred items and intentional overrides. Missing exact
  history yields an explicit comparison limit, never an invented release story.
- Consumer continuity uses one section in existing project documentation with
  the fields shown in the guide. No per-file baseline or separate ledger.
- Proposed permanent Task 3 fixture root: `fixtures/app-update-text-consumer/`.
  Its future `src/__tests__/text-adoption.test.ts` covers definition/relations,
  and `src/__tests__/text-preservation.test.ts` covers actions, projections and
  persistence. A retained UI case must exercise the custom controls and the
  non-Text object case through the fixture's selected existing test stack.
  Task 4 adds `src/__tests__/text-subsequent-update.test.ts` and old/intermediate
  document samples under that fixture's `test-data/`. These are chosen test
  boundaries, not files created or tests executed by Task 1.
- The guide defines concrete field values, negative cases and a second-update
  scenario. Tasks 3-4 must materialize them and expose actual runnable scripts
  before independent acceptance; do not treat fixture prose as executable proof.

The sample is authored and locally checked. Its six initial pinned contract
links were reachable during the subsequent source review. Published artifact
availability and fresh-conversation integration remain unverified and belong
to the later delivery/acceptance tasks. The current
Text projection boundary remains an explicit prerequisite if its negative case
fails. No runtime or CLI change was made to obtain this document result.

### Task 2 - Deliver versioned official change information

Depends on Task 1. Scope: maintained release records, readable current-to-target
presentation and integration examples. Add consistency checks against shipped
source, package versions and public exports. Optional derived indexes must share
that authority. Exit: a consumer can obtain a complete guide without installing
an integration agent or modifying their project. A read-only CLI convenience
entry can follow after the static delivery is useful; existing create behavior
must remain intact.

Task 2 bounded delivery, 2026-10-23:

- The public owner is `docs/public/updates/`: `index.md` owns selection, usage,
  a short usage entry, required-information checklist and small revision index;
  the Text revision 2
  guide owns the concrete integration instructions. Revision 1 was an unpublished
  planning draft. Promotion removes the former internal example copy.
- Entry links belong to the public overview and AI extension guide. The existing
  content manifest generates navigation, search indexes and both `llms.txt`
  copies; register the two pages under Extend. The document-count guard and
  inventory tests change from 41 to 43 pages. No site interaction or runtime
  capability is added.
- Documentation identifiers are `updates/index` and
  `updates/text-official-fields-example-1-r2`. The stable change identity remains
  `text-official-fields-example-1`; no persisted App identity changes.
- Keep the modeled comparison and unverified package/integration status visible.
  A real release entry requires verified from/to artifacts, public exports and
  accessible source evidence. Do not invent a release record to make this
  example appear published. New published guide revisions keep their old links.
- Gates: naming, scoped formatting/lint, existing public documentation generation
  and validation, the affected documentation inventory/API/link tests, and
  website document-adapter tests. Check pinned source manifests/entrypoints and
  remote reference accessibility. Generated package/source indexes must remain
  deterministic. No browser/runtime acceptance is claimed by these checks.
- Stop conditions: unavailable target evidence blocks release claims; any need
  to change Text behavior, CLI arguments or runtime APIs returns to a separately
  authorized task. Tasks 3-4 remain pending and no consumer AI is dispatched.

Task 2 result: local static delivery is complete. The existing documentation
generator produces 43 pages and 19 package guides, including the two update
pages. All 28 affected documentation/source-map/API/inventory and website-reader
tests pass. Public validation passes with 299 local links and 147 API references;
naming (15 tests) and scoped lint pass. All ten pinned external source links
return HTTP 200, and the pinned Core 0.5.7/Preset 0.5.8 manifests match the guide.
These are source and delivery checks, not registry or consumer-integration proof.
The Markdown can be supplied directly to a consumer AI now; online publication
has not been performed. Published package verification and Tasks 3-4 remain open.

Task 2 entry corrections, 2026-10-23: the review found that the website discovery
copy used repository-relative Markdown URLs and that the site's Markdown
renderer did not render the guide's HTML anchors as links. Permanent regression
tests first reproduced a discovery 404 and a missing source link. The existing
generator now emits repository file links and website `/docs/...` links from
the same inventory. The Text guide uses supported Markdown links; the existing
renderer supplies external-link target/rel attributes without an HTML parser.
The entry merges audience prose into short usage instructions and replaces fixed
section requirements with a scalable information checklist. Verification adds
complete discovery-route mapping and two browser cases: discovery through the
index to Text, and all ten source links with their external-link attributes.
These are Task 2 delivery checks, not Task 3 consumer integration.
After correction, all 29 affected documentation/adapter tests, the website
discovery-inventory test and both browser regressions pass. Naming, scoped lint,
formatting and generated-documentation freshness checks also pass. No CLI,
Framework runtime, consumer fixture or deployment work was performed.

### Task 3 - Prove consumer AI integration with Text

Depends on Tasks 1-2 and an available, verified Text target artifact. Scope:
permanent consumer fixtures with custom Text, shared chart dependencies, approval
metadata and existing migrations; execute the documented integration workflow.
Exit: selected official Text plus retained extensions pass behavior and data
checks on the same source. Missing official capability/bug fixes are separate
bounded prerequisites, not permission to broaden this task into Text development.

Run this acceptance in a fresh AI conversation with no history from this planning
discussion. Provide only the consumer project and its instructions, the user's
integration request, and the delivered update guide with sources/artifacts
reachable through it. Do not supply private monorepo context, an author-prepared
patch or undocumented integration instructions. Record the input guide revision,
resulting diff and test results using existing project evidence conventions.
If additional technical explanation is needed, the guide has a gap: add that
explanation to the guide and repeat acceptance in a fresh conversation. User
decisions explicitly requested by the guide remain legitimate inputs. Passing
requires actual field-path and behavior tests, not the AI's completion statement.
The user authorized Task 3 and explicitly authorized a new independent acceptance
chat on 2026-10-23. This needs no new evaluation service or tracking system.

Task 3 result, 2026-10-23: the fresh chat used only the standalone consumer,
delivered revision-2 guide, installed candidate artifacts and linked public
sources. No follow-up technical hints or guide repairs were needed. It adopted
official definitions/rendering through pre-start redefinition, retained the three
custom fields, actions, projections, shared chart relation and existing migration
chain, and recorded actual adoption. The original 10 baseline tests passed; its
new adoption test failed before replacement; all 14 independent tests and the
typecheck/lint/build gates then passed. Maintainer replay of the same App source
plus a selected-chart live-projection test passes 15 tests and the same gates.
The original documents and dependency inputs are unchanged. See
fixtures/app-update-text-consumer/VERIFICATION.md (`fixtures/app-update-text-consumer/VERIFICATION.md`)
for the exact input revision, five-file AI diff, artifact digests and results.

Availability boundary: npm Preset 0.5.8 lacks the guide's Text exports. The existing
pack workflow instead built and validated 19 local candidates from the pinned
source, then installed them into the consumer without workspace source aliases.
This proves the modeled integration on those candidates, not published-release
readiness or a historical version delta. No CLI or Framework/runtime source was
modified. Task 4, browser-pixel verification and publication remain excluded.

Task 3 maintainer follow-up, 2026-10-23: strengthened fresh-runtime assertions
cover the five adoption fields, complete saved properties and scene structure,
chart references/projections, approval, Undo/Redo and subsequent custom edits.
Integrated the independent chat's later App-level shared-gray default and
projection-driven approval availability fixes, with their three regressions.
The expanded suite failed before these fixes and all 18 retained tests plus
typecheck/lint/build pass afterward. The original 14-test independent result,
guide, patch and logs are unchanged; the assisted follow-up has separate evidence
and a reversible patch. No new independent acceptance or browser-pixel claim is
made. Local candidate limitations still apply; Task 4 remains unstarted.

Task 3 browser evidence handoff, 2026-10-23: retained the later consumer chat's
browser page and necessary screenshots/logs in the permanent fixture, separately
from the unchanged first acceptance. Public guide revision 3 clarifies shared
color defaults, browser acceptance and history boundaries; revision 2 and the
captured input remain available unchanged. Discovery now selects revision 3.
This is evidence retention and guide clarification, not a second independent
acceptance, new Framework runtime behavior, publication or Task 4 execution.
Entry-validation correction: search records include both pages and headings, so
the search trigger must receive the page count from the existing content owner,
not count flattened search records. Change only that count handoff and rerun the
existing entry/search browser checks, typecheck and lint; no search redesign.

### Task 4 - Prove subsequent updates and publish supported guidance

Status: complete for the authorized local subsequent-update validation and
guidance delivery. Publication is a separate operation, not an unfinished
Task 4 acceptance gate.

Depends on Task 3. Scope: the V1/V2/V3 sequence, intervening consumer edits,
deferred adoption, schema evolution and user-facing examples/support limits.
Exit: the second guide and adoption record correctly identify remaining work,
and tests preserve official behavior and local extensions without whole-template
synchronization. Release publication remains separately authorized.

Acceptance requirement (satisfied by the first Task 4 run): use another fresh
AI conversation for the subsequent update, with no first-run
chat history. Supply the consumer project after the intervening user edits,
its retained adoption record, the new user request and the next update guide
with its linked sources. Apply the same no-undocumented-help rule as Task 3.
The second integration must preserve the three custom field paths and data,
recognize prior adoption and deferred work, and pass the V1/V2/V3 cases. An
author completing both updates with remembered context does not satisfy this gate.

Task 4 result, 2026-10-24: completed the bounded subsequent-update case without
publication. A second fresh chat received only the consumer after intervening
rejected-approval edits, its existing adoption record, the new revision-1 spacing
guide and supplied artifacts/sources. Its 22-test baseline passed; two new-default
assertions failed on the old candidate before selecting the target. All 29 tests,
typecheck, lint and build then passed, including two fresh-runtime round trips,
explicit spacing 0/1.5, all custom field paths, reject/approve history, chart
references and invalid-input rejection. No technical hints or App runtime rewrite
were needed. The six-file independent diff and logs are retained in
fixtures/app-update-text-subsequent/VERIFICATION.md (`fixtures/app-update-text-subsequent/VERIFICATION.md`).

The target is a private test-only Preset `0.5.8-task4.0` derived from the exact
first candidate, with spacing default 0.5; the normal Framework source is unchanged.
A deterministic builder and archive checks constrain this model to one default
and package/map metadata. Existing enum widening and the version-1-to-2 loader
remain App-owned; V1/V2/V3 are adoption stages, not new document versions. Deferred
UI and the shared-gray override remain recorded. This proves the modeled range,
not renamed/removed-field releases, published package availability, browser pixels,
production storage or restoration of a previous session's undo stack. The first
Task 3 fixture and evidence remain byte-identical. Publication remains unperformed
and separately authorized.

Task 4 revision-2 retention, 2026-10-24: integrated the later chat's warning and
attachment guidance, exact pre-update delivery archive, and 12 additional tests
into the permanent fixture. Its isolated revision-2 rerun passed 34 tests with
existing context; this is not another independent acceptance. The permanent
suite retains the original 29 cases and now passes 41, plus typecheck/lint/build.
The public entry selects revision 2 and retains revision 1. Separate records
preserve the initial 29-test independent result, later rerun, packaging evidence
and maintainer checks. Git retention now includes evidence logs; original bytes
are unchanged. The warnings, omitted bundle history and unpublished candidate
limits remain explicit. No publication or runtime change was performed.

The first independent acceptance, revision-2 existing-context rerun and permanent
fixture checks retain distinct provenance. The latter two confirm the revisions
and integration without replacing the first result or reopening the fresh-AI
requirement. No additional independent run is needed to complete Task 4.

For future execution, select normal docs/tooling or App workflows by actual
changed behavior. Developer Agent guidance/packaging retains its existing scope
exception; App runtime migration does not inherit it. Complete applicable flow
design/review before production implementation under task-context rules. No
Inspector or production implementation is created by this planning revision.

## Permanent acceptance cases

| Case                                                               | Required result                                                                                                                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Five local fields, two equivalent official additions               | One definition per key; the two use official contracts, the other three retain values, defaults, validation, persistence and projections.                                        |
| Retained custom field paths                                        | Each of the three fields can still be edited through its existing App action, read canonically, observed through its existing projection and saved/reloaded without loss.        |
| Guide-only first integration                                       | A fresh AI conversation completes integration using only the declared consumer inputs and guide-linked sources; formal preservation tests pass without undocumented author help. |
| Guide-only subsequent update                                       | Another fresh conversation handles intervening edits and deferred changes using the retained project record and next guide; custom field paths/data and V1/V2/V3 cases pass.     |
| Same key with different units/default/validation                   | Guide identifies the difference; integration explicitly resolves it or stops; no silent key-based deduplication.                                                                 |
| Stale full-definition override or duplicate append                 | Fixture exposes the problem; integration produces a complete definition based on the current official contract.                                                                  |
| Redundant Text handler mixed with approval logic                   | Only duplicate behavior is retired; approval logic remains and one intended action has its intended history entry.                                                               |
| Chart shares a property or child relation with Text                | Relations, aliases, rendering and chart behavior survive integration; no collateral unregister loss.                                                                             |
| Non-Text object with a string `text` field                         | No unintended Text controls or mutations; existing object editing remains correct.                                                                                               |
| Existing Text IDs and custom metadata                              | References, hierarchy and custom values survive edit/save/reload; invalid conversion never becomes silent fallback.                                                              |
| Equivalent ownership change only                                   | Existing documents load without an unnecessary format migration.                                                                                                                 |
| Second update after local changes                                  | Newly edited local extensions remain; already adopted changes are not duplicated and deferred changes remain visible.                                                            |
| V3 with pre-adoption, post-adoption and locally extended documents | All declared supported inputs follow the consumer's authoritative migration chain once and preserve local data.                                                                  |
| Skipped releases or renamed/removed official fields                | Guide includes intermediate requirements and directs caller/data changes; it does not assume the latest notes suffice.                                                           |
| Package updated but App wiring deferred                            | Actual packages and capability adoption remain distinct; shared-package behavior is included in regression scope.                                                                |
| Missing provenance or historical evidence                          | Guidance states uncertainty; no invented baseline or automatic completion claim.                                                                                                 |
| Partial or failed AI integration                                   | Adoption stays pending and original data remains recoverable; no whole-App version advancement.                                                                                  |

Task 1 selects exact permanent test paths and consumer commands. Reuse existing
property-redefinition tests, Text initialization/property tests, and affected
consumer transaction/persistence tests; add cases where these do not prove
preservation. Run the relevant package/app tests, typecheck, lint and build for
actual code changes. If CLI/generation is changed later, also run existing
create-command tests, template synchronization/build and packed-consumer checks
for supported package managers. A guide-only change does not require rebuilding
unrelated templates or running all runtime gates.

Tests/fixtures are retained project assets; screenshots and AI summaries cannot
replace semantic acceptance. The initial planning review was source-grounded. Executed consumer evidence
and its limits are recorded under Tasks 3-4 above.

## Readiness and review outcome

Existing Asyra definition redefinition, registration composition and App migration
provide the required architectural foundations. The new work is making official
version differences precise and actionable, then proving a consumer can integrate
them while retaining local extensions. No general merge engine is required.

Before implementation, Task 1 must resolve exact release/change-record ownership,
version availability, guide completeness and executable fixture contracts.
The known Text projection boundary and shared-relation behavior remain explicit
acceptance obligations. Completion requires both the first adoption and the
subsequent update proof; a useful guide alone does not prove every custom App safe.
