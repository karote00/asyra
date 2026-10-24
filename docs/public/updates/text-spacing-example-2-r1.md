# Update Text Again and Preserve Intervening Extensions

## Scope and exact comparison

Worked example `text-spacing-example-2`, revision 1, 2026-10-24. Start at the
[update guide index](index.md). This is a modeled second update, not an official
release announcement. The fresh-AI local-candidate acceptance passed on 2026-10-24: 22 baseline
tests, two expected failures on the old default, then 29 passing tests plus
typecheck, lint and build. The delivered input retained its pending-at-start
status; this result adds no new integration instructions. No published-package,
browser-pixel, production-storage or general release-range support is claimed.

The source is the local candidate at commit
`7bf3655242e6adca9ac7d81ff57d17df9b310c9e`: Preset 0.5.8 with the exported Text
schema, Core 0.5.7 and Utils 0.5.2. This is the first example's actual candidate,
not npm Preset 0.5.8, which lacked these exports when inspected. Its Preset archive
SHA-256 is `465e4e330d272162dc627b9004b109e7b15529eef4699366451697ca86085291`.

The target is a **test-only derived artifact**, Preset `0.5.8-task4.0`, archive
`asyra-preset-0.5.8-task4.0.tgz`, SHA-256
`60ba8503161a1f88adfbe17a5c136e4d202df987b07b14452a3b4e9047db32b7`.
It changes the exported Text spacing default from 0 to 0.5. It is deliberately
marked private. Its manifest identity changes and obsolete map for the one
changed compiled file is removed; all other archive entries and package
candidates are unchanged. The supplied `updates/model-artifact.json` enumerates
this delta; `updates/base-artifacts.json` identifies all base candidates. The
consumer's `artifacts/` directory contains both Preset archives and the unchanged
candidates. Verify their digests and installed declarations before editing.
Do not fetch this invented prerelease from npm or treat it as shipped support.
Missing artifacts or a different baseline block dependent integration.

## What changes and what stays App-owned

| Contract                                          | Before                                                         | Target / retained choice                                     |
| ------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| New typography `letterSpacing` default            | 0                                                              | 0.5 layout units                                             |
| Explicit saved spacing, including 0 and 1.5       | Persisted value                                                | Unchanged; never replaced with the new default               |
| Spacing validation / persist / project / unit     | Finite -100 through 100 / true / true / false                  | Unchanged                                                    |
| Other eight official fields, renderer and aliases | First verified candidate                                       | Unchanged                                                    |
| `approvalStatus`                                  | App extended draft/approved with rejected after first adoption | Retain all three values and the reject action                |
| `sourceRecordId`, `labelCategory`                 | App validation, defaults and consumers                         | Retain read, write, projection, persistence and load paths   |
| `textColor` default                               | App uses public Utils shared gray                              | Keep intentional override and explicit saved colors          |
| Official example UI panel                         | Deferred in adoption record                                    | Still deferred; charts with text must not gain Text controls |

A property default is shared: new chart captions using typography also receive
0.5 spacing. Existing saved Text and chart values do not change. The same field
name with a changed default is a real contract change, not an equivalent-key
cleanup. This request selects the new spacing default while retaining gray.
If a real consumer intentionally overrides spacing, resolve that choice first.
Installing the package can affect shared consumers even when their UI is deferred.

## Canonical sources

Use installed public exports, not private import paths. The model's artifact and
builder are part of the supplied consumer handoff; they are test data, not a new
runtime API. The builder checks source hashes before deriving the target. Its
retained report names every changed archive entry. For offline use supply these
sources with the guide; stop if required evidence cannot be reached.

- [Original Text schema, validation and defaults](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/preset/src/props/components/text-component.ts)
- [Text component aliases and renderer](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/preset/src/components/text.ts)
- [Core composition and load APIs](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/core/src/core.ts)
- [Shared fill defaults](https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/utils/src/propsManager/fills.ts)
- [App-owned document migration](../build/persistence-migration.md)

The first source shows spacing 0. The target archive's exported
`TEXT_PROPERTY_SCHEMA` and `TEXT_PROPERTY_DEFINITION` show 0.5. Do not infer a
historical release delta from these pinned source links. A standalone consumer
receives the migration reference at `updates/persistence-migration.md`.

## Integrate using the current project and its adoption record

1. Read project instructions, the current adoption note, resolved package
   identities, definitions, Features, projections and loader. Inspect actual
   intervening edits; an old note is not authority to remove newer behavior.
   Run the existing suite first. Distinguish V1 (custom Text), V2 (first official
   adoption) and V3 (this subsequent candidate) from App document versions 1/2.
2. Select the supplied target archive in the existing Preset dependency and
   resolution, then install with the existing package manager. Keep all other
   resolutions unchanged. Verify the installed public exports and identity.
   Do not mark the App adopted just because installation succeeded.
3. Keep the current official base from `@asyra/preset`. If already composed
   correctly, no definition rewrite is needed. Before startup,
   `core.redefinePropertyType` returns the complete current definition plus the
   three App fields exactly once, with the deliberate color override only.
   Do not copy the previous full definition or retain stale spacing defaults.
   Do not append official fields a second time. Compare full contracts if any
   local key overlaps. Preserve official aliases plus the metadata aliases,
   existing property relations and the single official render registration.
4. Preserve `rejected` validation and its Feature transaction, all three metadata
   actions/projections, chart references and Text-only controls. Do not reset
   local validators to the earlier draft/approved example. Keep public Utils
   `createDefaultFill().color` as the shared default override. No unregister is
   required; package identity alone does not restore removed registrations.
5. Keep the existing `registerLoadHook` and App document chain. The supported
   version-1 multiplier conversion runs once; version-2 absolute units remain
   unchanged. A new default and wider App enum do not require a new document
   version. The supplied loader requires complete valid fields; missing spacing
   or invalid metadata must fail before apply, not silently acquire a default.
   Preserve original inputs for recovery. Never update stored explicit spacing
   to 0.5, rewrite IDs/relations, or add a second migration hook.
6. Run the checks below and update the current adoption record only for verified
   work. Preserve the dated first-adoption facts, intentional overrides and
   deferred UI. If a gate fails, retain pending status and original documents;
   reverting code/packages alone cannot undo edits to production storage.

## Required verification

Use permanent tests and the consumer's test, typecheck, lint and build commands.
Change the obsolete fresh-default expectation from 0 to 0.5 only after proving
the new expectation fails on the old artifact. Keep saved-value assertions at
1.5 and add explicit saved 0. Test actual Core values, not only exported schemas.

- New Text and new chart typography use spacing 0.5 and shared gray; saved Text
  and chart keep explicit spacing/colors. Twelve unique fields, three retained
  aliases and one renderer remain. No unrelated controls appear on charts.
- Load pre-adoption multiplier, post-adoption absolute-unit and intervening
  rejected documents. Through two save/fresh-runtime reloads, line height stays
  24 (not 384), spacing stays explicit, all properties, IDs, hierarchy, chart
  references and metadata remain equal. Do not mutate original fixtures.
- After fresh reload, edit each custom field through its existing Feature, read
  canonical values, observe Text and chart projections, save through the App
  storage wrapper and reload. Exercise reject and approve with one history entry
  each; Undo/Redo preserves other fields. New-session history works; restoring a
  previous session's undo stack is not promised.
- Reject unknown document versions, missing required fields and invalid approval
  without changing canonical state or original data. Deferred UI remains listed
  and uninstalled. No new format version is invented solely for ownership/defaults.

The tests use the real packaged Core with a jsdom canvas stub. They establish
field/action/projection/data behavior, not rendered pixels. If claiming browser
appearance, additionally use a real browser with these same packages and retain
screenshots, errors and save/reload steps separately. This update changes no
browser harness; no browser-pixel result is implied by unit tests or a build.

Record the change ID/revision, exact artifact identity, previous adopted state,
new adopted spacing policy, retained rejected/metadata/gray behavior, still-deferred
UI, unchanged App document version, executed checks and limits. Future updates
start from that record plus actual code and intervening edits. A later release
with renamed/removed fields or skipped intermediate requirements needs its own
verified range and migration instructions; this default-only case does not prove it.

For an independent run, provide only this guide and its linked artifacts/sources,
the current consumer including its existing adoption note, and a request to adopt
the spacing change while retaining custom behavior. No previous chat or private
maintainer explanation is necessary. Supply the guide unchanged; needed technical
hints indicate a guide gap and require a corrected revision and a fresh run.
