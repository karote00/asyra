# Adopt Official Text and Keep Your App Extensions

## Scope and exact comparison

This is a worked update-guide example, revision 2, dated 2026-10-23. It is not a
published release announcement or an instruction to update every dependency.
Start at the [update guide index](index.md) for selection and usage. Revision 2
promotes the unpublished planning draft into the public guide format; the Text
source/target contracts are unchanged.
The source is the explicitly modeled consumer contract below, not an asserted
historical Asyra release. The target is official Text at source commit
`7bf3655242e6adca9ac7d81ff57d17df9b310c9e`.

| Item                              | This example                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Guide revision and status         | Revision 2; worked example; local candidate independent integration verified |
| Change identity                   | `text-official-fields-example-1`                                             |
| From                              | `custom-text-example-1`, defined by the source contract in this guide        |
| To                                | Official Text at the commit above, plus the three retained App fields        |
| Inspected package manifests       | `@asyra/core` 0.5.7; `@asyra/preset` 0.5.8                                   |
| Release availability              | Local candidate verified; npm Preset 0.5.8 lacks the required Text exports   |
| Data effect for the exact example | No format change; preserve the consumer's existing document version          |
| Adoption unit                     | Text definitions, selected Text behavior and direct consumers only           |

On 2026-10-23 a fresh consumer AI completed this modeled integration using local
candidate packages built from the pinned source, with no planning history or
extra technical hints. The consumer's preservation tests passed. This verifies
that candidate case; it does not establish a published release delta, browser
pixel fidelity or subsequent-update support. The npm Preset 0.5.8 artifact
inspected that day did not contain the required Text exports despite the matching
manifest version. Obtain a verified target artifact before proceeding.

Before editing, check the installed package declarations and exports against the
APIs below and compare actual local definitions with this source contract. A
matching version string is not sufficient. If the installed artifact lacks the
required API or the target source cannot be obtained, report the missing evidence
and stop dependent edits; do not import package-private files or guess a version.
The guide is still useful for analysis without granting installation permission.

## What changes

The consumer previously supplied two typography fields and their behavior. The
selected official Text already supplies equivalent `lineHeight` and
`letterSpacing`. Adopt those official definitions and selected behavior, retain
`approvalStatus`, `sourceRecordId` and `labelCategory`, and remove only redundant
local declarations and handlers. Existing chart and approval functionality stays.

This is a concrete ownership-consolidation example. It does not claim that the
fields were introduced in a particular published version. A real release guide
must replace the modeled source with verified from/to artifacts and record the
actual behavior difference, including fixes that do not change field names.

### Source contract - custom-text-example-1

The fixture uses component type `text` and property type `typography`, matching
the target identities. Its initial Text property contains the target's other
seven typography fields unchanged: `text`, `fontFamily`, `fontSize`, `fontWeight`,
`fontStyle`, `textAlign` and `textColor`. Their exact definitions are in the
pinned target schema linked below. It adds these five App-declared fields:

| Field            | Type and validation                               | Default      | Persist / project / unit |
| ---------------- | ------------------------------------------------- | ------------ | ------------------------ |
| `lineHeight`     | Finite number, greater than zero and at most 8192 | 20           | true / true / false      |
| `letterSpacing`  | Finite number from -100 through 100               | 0            | true / true / false      |
| `approvalStatus` | String: `draft` or `approved`                     | `draft`      | true / true / false      |
| `sourceRecordId` | String, at most 128 characters                    | Empty string | true / true / false      |
| `labelCategory`  | String: `general` or `warning`                    | `general`    | true / true / false      |

No dynamic keys or child-property collection are added by this modeled type.
For the equivalent-fields case, the two local typography values have the same
layout-coordinate meaning and downstream renderer interpretation as the target,
not a percentage or font-size multiplier. Compare effective behavior as well
as field definitions before treating a real consumer as this case.

The consumer's component aliases include all twelve fields. Its separate custom
metadata panel reads a projection of the three local fields and writes through
its existing App Feature/common-API path. A chart caption reads `labelCategory`
and follows `sourceRecordId`; an approval action changes `approvalStatus` once
per user request. Local typography controls commit line height and spacing through
one registered action each. The fixture also has a redundant Text-edit handler;
it must not survive alongside the equivalent official handler for that operation.
Any approval rule in that handler must be preserved in the App-owned action path.

These requirements describe the modeled consumer; they do not assert that the
target includes an official generic Text-edit handler. Adopt only behavior
present in the selected target; retain an App handler when no equivalent official
behavior exists. Current official Text includes rendering and property controls,
not a promise of complete canvas editing, rich text or IME support.

## Canonical sources

Use public package imports. These pinned source links explain the target; they
are not alternate package import paths. Installed declarations remain necessary.

- [Typography schema and defaults](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/preset/src/props/components/text-component.ts) - official field limits and defaults.
- [Text component and rendering](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/preset/src/components/text.ts) - official aliases and renderer inputs.
- [Text installation example](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/apps/asyra-design/src/init/capabilities/init-text.ts) - public definitions, render registration and selection projection.
- [Text property controls](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/apps/asyra-design/src/properties/text.tsx) - field validation and existing App controller calls.
- [Core composition and load APIs](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/core/src/core.ts) - redefinition, relation and load-hook behavior.
- [App migration guide](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/docs/public/build/persistence-migration.md) - supported load integration and product-owned version history.

The six contract links above were accessible during the 2026-10-23 source
review. This checks reachability, not published package availability or successful
consumer integration. Recheck evidence access when using this guide; an offline
handoff must include the referenced source. No private maintainer checkout or
prior discussion is required.

The inspected versions come from the pinned
[Core manifest](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/core/package.json)
and
[Preset manifest](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/preset/package.json).
The public exports are declared by the pinned
[Core entrypoint](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/core/src/index.ts)
and
[Preset entrypoint](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/preset/src/index.ts).
Inspect the consumer's installed declarations as well; do not assume these
source snapshots describe an installed artifact.

## Public APIs

From `@asyra/preset`: `TEXT_PROPERTY_SCHEMA`, `TEXT_PROPERTY_DEFINITION`,
`TEXT_COMPONENT_DEFINITION`, `TEXT_COMPONENT_TYPE`, `TEXT_PROPERTY_TYPE` and
`TEXT_RENDER_STRATEGY`.

Through Core from `@asyra/core`: `core.getPropertyTypeDefinition(...)`,
`core.redefinePropertyType(...)`, `core.getComponentPropertyRelations(...)`,
`core.removeComponentPropertyRelation(...)`,
`core.defineComponentPropertyRelation(...)` and `core.registerLoadHook(...)`.
These are existing APIs; this guide adds no runtime surface.

## Integration instructions for the consumer's AI

### 1. Inspect the consumer before changing it

Read project instructions, package manifests and lockfile, the Text installer,
local definitions, Features, render/UI registrations and persistence entry.
Find actual owners by type/field identity and call sites, not assumed filenames.
List local-only fields, intentional overrides, direct consumers and deferred
changes. Inspect shared package changes even when only Text is selected.

Run the existing focused behavior tests before replacement. If the retained
custom behavior has no test, establish a permanent regression case first. Do not
interpret a pre-existing failure as caused by adoption or erase a test to pass.
Use a normal task branch and preserve unrelated changes and local configuration.

### 2. Compose the official base and retain the local definition delta

The target installation uses public exports from `@asyra/preset`:
`TEXT_PROPERTY_SCHEMA`, `TEXT_PROPERTY_DEFINITION`, `TEXT_COMPONENT_DEFINITION`,
`TEXT_COMPONENT_TYPE`, `TEXT_PROPERTY_TYPE` and `TEXT_RENDER_STRATEGY`.
Reuse existing installation if present; do not register the same type twice.

Edit the startup composition so the official definition replaces the local base
and the retained extensions are reapplied once. Do not install official Text
on top of an already registered custom type. Then, before property instances or
Core startup, call `core.getPropertyTypeDefinition(TEXT_PROPERTY_TYPE)` to inspect
it. Use `core.redefinePropertyType(TEXT_PROPERTY_TYPE, update)` to return the
complete current definition with the three local field definitions added once.
Preserve current policy and all official fields. Retain the local definitions'
validation/default/persist/project/unit settings from the consumer, not guessed
settings. The table above defines those settings only for this exact example.

For this target the result has twelve unique fields. Use official `lineHeight`
and `letterSpacing`, not a second copy. If any supposedly local-only key already
exists upstream, compare its full contract before deciding what to keep. Blind
array concatenation and name-only deduplication are both incorrect. The updater
is synchronous; it cannot rename the property type or mutate other registrations.
It is not available after startup, with active/replay-retained instances or for
constructor-mode definitions. Keep complete-implementation replacement separate.

### 3. Preserve aliases, projections and existing actions

Official Text aliases enumerate its nine official fields. If replacing the
consumer component definition, include the three original local aliases using
its existing composition, or inspect and adjust the relation through
`getComponentPropertyRelations`, `removeComponentPropertyRelation` and
`defineComponentPropertyRelation` before startup. Preserve the slot name, type,
other aliases and direct consumers. If the consumer already writes by property
identity and needs no alias, retain that path instead.

The official typography selection projection also enumerates official fields.
Keep the consumer's separate custom metadata projection/panel, its lifecycle
cleanup and fine-grained subscriptions. Do not put all metadata in the official
Text panel or assume schema extension updates UI projections automatically.
If the consumer intentionally shares a UI-property identity, explicitly compose
one complete projection using its supported UI registration APIs and preserve
both sets of consumers; do not leave competing registrations.

Prefer property redefinition over unregistering a shared property. If a whole
render/Feature implementation is being replaced, remove only that duplicate
installation from the fresh runtime's initialization and connect the chosen
implementation through its public API. Inspect dependent registrations before
any unregister: recursive cleanup and detached relations are not restored merely
by registering the target again. Preserve custom chart and approval dependencies.

### 4. Decide actual behavior overlap

| Consumer situation                       | Action                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same field and equivalent full contract  | Use official definition; remove duplicate local declaration. No data conversion solely for ownership.                                                   |
| Same key but line height is a multiplier | Do not treat it as equivalent. Define the old unit and conversion, check target range and test visual/data meaning before adopting.                     |
| Local default or validator differs       | Decide whether to adopt official behavior or retain an intentional override; consider missing values in old documents as well as valid existing values. |
| Same meaning under a different key       | Update direct callers and references, and migrate saved keys only through the App's declared transition.                                                |
| Equivalent official action exists        | Route to it and retire the redundant local handler while keeping approval/chart business rules.                                                         |
| No equivalent official action exists     | Keep the local action; adopting a schema/render definition does not replace all Text behavior.                                                          |

Current official projection detects a string `text` field. Test a non-Text chart
with `text` before claiming preservation. If the target causes unintended Text
controls or writes, report the concrete prerequisite or use an already supported
App-owned projection. Do not silently change the chart's semantics or declare
this known boundary solved by updating packages.

### 5. Preserve saved data; migrate only when required

For the exact equivalent-fields example, keep component/property identities,
element IDs, document version and representation. Verify the three local fields
remain registered and persisted, then test load/save/load. Do not introduce a
migration just because an official definition replaces an equivalent local one.

If meaning or representation differs, integrate a deterministic Text transform
into the consumer's existing document migration dispatcher through
`core.registerLoadHook(...)`. Preserve the consumer's supported version chain;
release versions do not replace document schema versions. Reject unknown source
formats, lossy conversions and invalid converted values before canonical apply.
Do not let normal load defaults hide lost data. Preserve original documents.
A live collaborative backend additionally needs its own cutover and old-client
policy; this code-integration request does not authorize production data changes.

## Acceptance contract and concrete fixture values

Run these permanent checks in each consumer's existing test suite using its real
scripts. The modeled local-candidate acceptance does not replace verification of
your App's actual fields, Features and documents.

Start from a saved document in the fixture's normal format containing Text
`text-1`, with `lineHeight=24`, `letterSpacing=1.5`, `approvalStatus=draft`,
`sourceRecordId=record-17` and `labelCategory=warning`. Keep its original parent,
order and the chart/approval references to `text-1`.

| Case                        | Actions and required result                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Equivalent overlap          | Final definition contains twelve unique fields; official limits/defaults apply to the two overlapping fields.                                                                             |
| Local field editing         | Through existing App actions set approval to `approved`, source record to `record-18` and category to `general`; canonical reads, custom panel and chart projection show those values.    |
| Persistence                 | Save, dispose, reload and read all five fields plus IDs/hierarchy/references; values match and existing approval/chart behavior still works.                                              |
| Duplicate action            | One line-height edit produces one intended update/history entry; Undo/Redo behaves as before and retained approval behavior occurs once.                                                  |
| Invalid custom value        | Attempt approval value `archived`; reject without changing the canonical value, projected value or saved value.                                                                           |
| Shared relation             | Chart still observes custom metadata after Text adoption; no relation or registration was lost through cleanup.                                                                           |
| Non-Text object             | Select a chart whose own `text` is `Revenue`; it keeps its original controls and cannot receive unintended typography edits.                                                              |
| Different units             | Separate variant stores line height multiplier 1.5 with font size 16; the declared conversion produces 24 only if that is the consumer's established unit contract. Ambiguous units stop. |
| Unknown or invalid document | Existing consumer policy diagnoses it and retains original data; the AI must not silently flatten or replace custom values.                                                               |

Use the consumer's package-manager equivalents of its declared typecheck, lint,
focused tests and build scripts. Inspect its manifest before choosing commands.
Add the above permanent cases where missing; a build alone does not prove them.
For a standard generated Design project, `yarn typecheck`, `yarn test` and
`yarn react:build` are documented starting points, not universal script promises.
Do not call monorepo-only tests from an independent consumer.

## Minimal adoption note and the next update

Use one short section in existing project documentation. Suggested contents:

```text
Change: text-official-fields-example-1, guide revision 2
Official target: 7bf3655242e6adca9ac7d81ff57d17df9b310c9e
Resolved packages: record actual installed versions and artifact evidence
Status: pending until the required tests pass
Adopted: official lineHeight and letterSpacing definitions; list actual behavior
Retained: approvalStatus, sourceRecordId, labelCategory; actual owner paths
Overrides/deferred: list actual exceptions, or explicitly none
Document schema: actual consumer version; unchanged for equivalent fields
Verification: tested source revision, commands/results and retained fixture paths
```

Do not record all Text behavior or the entire App as adopted when only the two
fields were integrated. A later AI reads the note, actual current source and the
next version guide. It must preserve intervening user changes and still show
previously deferred items. Stale notes cannot override present source behavior.

For subsequent-update acceptance, give a new AI conversation no earlier chat
history.
The consumer now allows `rejected` in its App-owned approval field and has saved
that value. A second, explicitly modeled guide revision describes an official
`letterSpacing` default change from 0 to 0.5, with existing explicit values and
other contracts unchanged. This is a proposed test scenario, not an announced
release. Verify new untouched Text uses 0.5, existing spacing 1.5 stays 1.5,
`rejected` survives, all three custom field paths remain usable, and a deferred
optional capability is still listed. Create the exact second artifact and guide
before that acceptance run; neither exists as a shipped update in this guide.

## Handoff prompt and independent acceptance

Give the consumer's AI this guide and a normal request such as:

> Adopt the official Text changes described in this guide in my existing App.
> Keep my custom metadata, charts and approval behavior. Check actual versions
> and definitions, preserve the existing read/write/projection/save paths, and
> use existing Asyra APIs. Run the required preservation cases and record what
> was actually adopted. Ask about unresolved product decisions; do not discard
> data, deploy or rewrite production storage.

First acceptance uses a fresh AI conversation with only the consumer project,
its instructions, this request and the guide's accessible references/artifacts.
No author patch, private checkout knowledge or undocumented technical hints.
If hints are necessary, improve the guide and repeat in a fresh conversation.
User decisions requested explicitly by the guide are legitimate inputs.

Repeat the later-update acceptance in another fresh conversation with only the
updated consumer project/adoption note, next guide and new request. Both runs
must produce inspectable diffs and passing behavior/data evidence. Neither a
plausible explanation nor the AI's completion statement establishes success.
