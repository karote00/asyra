# Adopt Text Across Versions and Resume Partial Adoption

Revision 2, 2026-10-24. This revision supersedes the instructions in
[revision 1](text-cross-version-example-3.md) by clarifying digest verification
and composition-time definition reads. It does not change the three modeled
integration stages or their retained candidate artifacts. Revision 1 and its
four modeled release records remain byte-identical to the independent input.

The independent consumer chat `01a16e30-e3d0-7fa3-b7aa-f33e5f14c82a` completed
integration using revision 1: 31 tests plus typecheck, lint and build passed.
Revision 2 records the subsequent maintainer clarification and permanent-fixture
integration; it is not another independent run. The original result and its
hash-reporting mistake remain preserved, with a separate
[erratum](../../../fixtures/app-update-text-cross-version/evidence/ERRATA.md).

Start at the [update index](index.md) and [release history](history.md).
The three `model-text-app-*` records and `model-text-framework` remain **modeled**.
Their source SHA identifies retained upstream candidate source and their artifact
identity identifies supplied Preset bytes, not a published App package.
Use this range only in the supplied modeled exercise. Independent local success
does not establish registry availability, browser pixels or a published range.

## Verify the two digest formats

Release-record `guideHashes` use SHA-256 of the UTF-8 bytes of
`JSON.stringify(source)`, where `source` is the complete guide read as UTF-8.
Preserve whitespace, line endings and the final newline. Do not trim the text.
`HANDOFF-SHA256.json`, artifact checksums and archive `.sha256` files instead use
SHA-256 of the raw file bytes. These digests are intentionally different.

```js
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const bytes = readFileSync(
  'docs/public/updates/text-cross-version-example-3.md'
)
const source = bytes.toString('utf8')
const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const releaseGuideHash = sha256(JSON.stringify(source))
const handoffFileHash = sha256(bytes)
```

For the frozen revision-1 guide, `releaseGuideHash` is
`227135e30355aa0843af0bc853f678cdfa5e803094521cbd01622989273b5592` and
`handoffFileHash` is
`68f855f9e4649a541ca147cd20a48c5033a01ebd06f5083136f1d60b0ae65148`.
All four original records agree with the first value and the original handoff
agrees with the second. The independent report compared different algorithms;
there was no guide-byte mismatch. Keep each record bound to its named revision:
do not replace its digest with this revision's hash or the raw-file digest.
If either comparison fails under its specified algorithm, stop dependent
integration and request corrected inputs; do not choose one digest to bypass it.

## Exact inputs and selected outcome

The delivery supplies the App, immutable sample documents, `ADOPTION.md`,
`artifacts.json`, candidate archives, lockfile, public documentation and source
attachments. Verify `HANDOFF-SHA256.json` and archive hashes before edits.
Read the actual definitions and actions: the adoption note predates a local
`reviewNote` field and `annotate` action. Package installation does not prove
that local overrides or saved documents adopted a change.

Candidates come from source `7bf3655242e6adca9ac7d81ff57d17df9b310c9e`.
Core is 0.5.7, Utils is the supplied 0.5.2 resolution. The initial Preset 0.5.8
archive is `465e4e330d272162dc627b9004b109e7b15529eef4699366451697ca86085291`.
The installed target is the retained, private test artifact
`@asyra/preset@0.5.8-task4.0`, SHA-256
`60ba8503161a1f88adfbe17a5c136e4d202df987b07b14452a3b4e9047db32b7`.
It changes the official shared spacing default to 0.5; other package candidates
are unchanged. Exact identities of all supplied archives are in `artifacts.json`.
Do not upgrade the package manager or other dependencies. Install declared
dependencies with `yarn install --immutable`, using project-local Yarn cache,
global and temporary directories as described by the consumer README.

The user selects all three stages below, retains shared gray text color and all
custom fields/actions, and continues to defer the optional official Text panel.
There is no need to install every intermediate package. Preserve explicit saved
values, including spacing 0, even when a newer default is selected.

## Follow every stage and prerequisite

| Stage              | Before                                                                  | Required integration                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model-text-app-1` | Local definitions repeat official `lineHeight` and `letterSpacing`      | Compare defaults, units, validation and projection/persistence flags; use the official base and remove only equivalent local definitions.                                   |
| `model-text-app-2` | The App retains spacing default 0 although newer packages are installed | Adopt official default 0.5 for new Text **and chart captions** using the same property. Keep explicit values and the shared gray override. Requires `model-text-framework`. |
| `model-text-app-3` | Version 1 multiplier documents or version 2 scalar spacing documents    | Perform the ordered App-owned conversion below; save version 3 and retain runtime layout-unit APIs.                                                                         |

For direct adoption, read all three stages. For partial adoption, inspect what
stage 1 actually integrated and include the deferred stage 2 change before stage 3. Identify the prerequisite package's own adopted baseline and deferred changes,
not only its installed version. Missing records, bytes, unresolved baseline or
unavailable targets block dependent work. A future guide correction must be
checked against the exact revision recorded in the adoption note.

## Keep the official base and App extensions

Use the installed public exports `TEXT_PROPERTY_SCHEMA`,
`TEXT_PROPERTY_DEFINITION`, `TEXT_COMPONENT_DEFINITION`,
`TEXT_PROPERTY_TYPE`, `TEXT_RENDER_STRATEGY` and `DEFAULT_TEXT_DATA` from
`@asyra/preset`. Inspect their installed declarations before editing.
Composition stays in the App before startup: `registerPropertySchema`,
`definePropertyComponent`, `getPropertyTypeDefinition`,
`redefinePropertyType`, `defineComponent`, and `registerRenderStrategy` are
existing Core APIs. `getPropertyTypeDefinition` is composition-only even for
reads: call it before startup. The supplied runtime already captures
`app.definition` before startup; assertions after `open()` must use that snapshot.
Do not relax Core's lifecycle guard or remove the uniqueness/default assertions.
Preserve the current field's definition flags when overriding
one default; a schema field alone is not a complete property definition.

Remove the equivalent local line-height/spacing layer, not the entire App
definition. Preserve `approvalStatus` (including rejected), `sourceRecordId`,
`labelCategory`, and the later `reviewNote`, including their validation, defaults,
aliases, `persist`, `project`, UI projections and read/write paths. Keep gray via
the public Utils `createDefaultFill()` default. Do not replace explicit colors.
Keep chart typography, source references, annotation, approval/rejection, chart
renaming and the existing approval button. One user action still enters the App
Feature and one existing transaction; do not register duplicate handlers or add
a second canonical data store. The optional official panel remains deferred.

Same names do not establish equivalent meaning. `ambiguous-units.json` declares
spacing in em while the selected contract uses layout units. Reject it before
canonical load and report the unresolved choice; this exercise does not authorize
guessing a conversion. The ordinary fixtures use the explicitly documented units.

## Ordered App serialization migration

Use the existing `registerLoadHook`/`prepareDocument` boundary and public Core
save/load APIs. Clone the input before conversion; do not edit original samples
or partially apply invalid documents. Keep document, element, property and chart
reference IDs and every unrelated field.

1. Version 1 stores `lineHeight` as a font-size multiplier. Convert to layout
   units using `lineHeight * fontSize`, validate, and advance to version 2.
2. Version 2 stores numeric `letterSpacing` on every typography property. Move
   it to `tracking: { unit: 'layout', value: <the exact numeric value> }`, remove
   the serialized `letterSpacing`, and advance to version 3. Apply this to Text
   and chart typography. Preserve zero; never use a truthiness fallback.
3. Version 3 already uses that representation. Validate its unit/value and all
   App fields without converting again. Before passing raw data to Core,
   materialize runtime `letterSpacing` from `tracking.value` and remove the wire
   field. Core's public typography property still uses numeric layout units.
4. On save, clone Core's raw output, encode typography spacing as `tracking`,
   and save `{ documentVersion: 3, core: ... }` through the existing storage path.
   Core state and its UI projections must not acquire the wire-only field.

Unsupported versions, conflicting scalar/structured fields, invalid units or
metadata must fail before canonical load/storage changes. A failed migration
keeps the original input recoverable. Save/reload of version 3 is idempotent;
it must not multiply line height or convert spacing a second time.

## Required acceptance and next adoption note

These before-integration instructions apply to an unsolved consumer such as the
frozen input-v1 delivery. The repository's permanent fixture already contains the
completed integration; follow its README to replay all passing gates, without
reapplying migrations or expecting its target tests to fail.

Run the supplied `test:baseline` preservation cases before integration. Then run
`test:acceptance` to establish the expected missing default/format/ambiguity
behavior. Preserve the existing assertions and add coverage for any missing
cases; do not change the tests to accept the old behavior. Complete `yarn test`,
`yarn typecheck`, `yarn lint` and `yarn build` after integration.

Check both direct version-1 data and partial version-2 adoption through repeated
save/fresh-runtime reloads. Check every custom field, visible projection, approval
button, annotation, chart references and text. Check new shared defaults versus
explicit zero/1.5, registration uniqueness, rejected input leaving canonical data
and storage unchanged, and one-action session undo/redo after reload. Do not
claim persistent undo history: a new runtime starts a new session. Compare history
depth before and after each action; setup selection may already add an entry.

Append actual adopted record IDs and guide revision, retained overrides, the
intervening review-note customization, deferred panel, document version, package
identities, tests and unresolved choices to `ADOPTION.md`. Keep the earlier note.
A later AI receives this project and note, not the conversation. Record failed or
incomplete stages as pending. The exercise is not complete merely because a
build succeeds. No registry, online deployment or browser-pixel claim is made.

## Canonical sources

- [Official Text composition and extension guide](text-official-fields-example-1-r3.md)
- [Retained spacing candidate and shared-default contract](text-spacing-example-2-r2.md)
- [App-owned persistence migration](../build/persistence-migration.md)
- [Core public API](../reference/packages/core.md)
