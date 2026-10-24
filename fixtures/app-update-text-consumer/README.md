# Text update consumer

This is the permanent `custom-text-example-1` consumer for the Text update guide,
with the initial adoption and maintainer follow-up recorded below. It is a small App with local typography, approval metadata,
a chart that shares the typography property, and a versioned document loader.
Framework state remains canonical. UI projections read it; actions enter through
the App Feature and one transaction. Document conversion belongs to the loader.

`test-data/current.json` is the original document. Do not overwrite it with an
updated save. `test-data/multiplier.json` is the separately declared older format:
version 1 line height is a font-size multiplier, version 2 uses layout units.
Unknown versions or invalid metadata must fail before canonical load.

Install the explicitly supplied candidate artifacts before running this fixture.
The manifest versions alone do not identify the target build. Run `yarn test`,
`yarn typecheck`, `yarn lint` and `yarn build` from this directory. The preservation
suite describes existing behavior; integration must preserve its assertions.
Do not import workspace source or change Framework packages to satisfy a test.

The maintainer's verification record is in `VERIFICATION.md`. It is not input
to the independent integration conversation.

## Initial independent Text adoption - 2026-10-23

This section records the first acceptance turn. The later follow-up below changes
one default and panel availability; it is not part of that independent result.

Adopted `text-official-fields-example-1`, guide revision 2, for the equivalent
layout-unit fields case. Target source:
`7bf3655242e6adca9ac7d81ff57d17df9b310c9e`. Installed Core 0.5.7, Preset 0.5.8
and Utils 0.5.2 expose the required public APIs. The installed direct package
versions match
`updates/target-artifacts.json`; `yarn.lock` resolves the supplied local candidate
artifacts. The attachment also lists packages not installed in this consumer;
it is not a claim that every attached package is used. The attachment records
their SHA-256 identities;
archive digests were not independently recomputed because the archives are
outside this consumer. This is local-candidate adoption, not npm release
verification or a complete release-to-release dependency comparison.

`src/definitions.ts` now installs the official Text schema and property base,
redefines it before startup with the three original metadata fields, extends the
official component aliases and registers the official renderer once. Official
line-height/spacing validators and defaults are shared by Feature writes and the
loader through the composed schema. The renderer supplies layout bounds and hit
area behavior as well as drawing. No local typography definitions or duplicate
renderer remain.

Retained: `approvalStatus`, `sourceRecordId`, `labelCategory`, their validation and
persistence/projection policies, chart typography and source references, and all
existing actions in `src/runtime.ts`. The separate App projections and panel
remain type-scoped and preserve subscription cleanup. There is no equivalent
exported official App action to replace the local transaction/approval paths.
The official example's string-based selection projection is intentionally not
installed: charts also contain `text` and must keep their own controls. There
are no official field overrides. Rich text, IME, full canvas editing, the official
example's UI panel and any subsequent update remain outside this adoption.

Document schema remains version 2 with unchanged identities and representation.
The separately supported version 1 multiplier conversion in `src/documents.ts`
remains registered through `registerLoadHook`; 1.5 at font size 16 becomes 24
layout units exactly once. Invalid/overflowing conversions and invalid metadata
fail before apply. Original `test-data/current.json` and
`test-data/multiplier.json` are unchanged; no production storage was accessed.

Verification on the working source based on consumer commit
`719c414b7d8a80685ed042d1e1742bc32e09cb39` plus this uncommitted adoption diff:
`yarn test` passed 14 tests, `yarn typecheck`, `yarn lint` and `yarn build` passed.
The original 10-test baseline passed; the added adoption test failed against the
old local renderer before implementation. Permanent tests now also cover official
field contracts, fresh defaults, typography boundaries, renderer inputs/bounds/hit
area, conversion overflow and no repeated conversion. Existing preservation
assertions were retained. Logs are in `test-results/text-adoption/`.

Evidence limits: the suite uses jsdom canvas stubs, not browser pixel validation.
The pre-existing selection-overlay warning remains; the production build warns
about chunks above 500 kB. Guide source links were accessible and installed
composition APIs were inspected. No blocking guide information was missing for
this selected case; a verified historical release delta and published package
availability remain unspecified. No dependency upgrades, commits or pushes were
performed.

## Maintainer follow-up - 2026-10-23

The same acceptance chat later received explicit user requests to fix new-Text
color and approval availability. Its completed consumer fixes are now integrated
here. This is assisted follow-up, not another independent guide acceptance.

The one intentional official-field override is now `textColor.defaultValue`:
startup `redefinePropertyType` uses public Utils `createDefaultFill().color`
(currently `#cccccc`). All other official field contracts, including the color
validator, are retained. This shared property definition also supplies defaults
to charts using typography. Explicit persisted colors remain unchanged, including
the original Text and chart's black. The validation-only composed schema retains
the official schema; it does not create values or apply defaults.

The approval button subscribes to the existing Text-only metadata projection. It
is disabled for chart/empty selection, enabled for Text, and unsubscribes on panel
disposal. Feature validation and transaction ownership are unchanged.

All 18 retained tests pass, including fresh-runtime assertions for all five
adoption fields, metadata/typography/chart projections, complete saved properties
and scene structure, approval with one history entry, Undo/Redo, and subsequent
custom edits/save. New regressions also cover shared gray through serialization,
fresh load and history, unchanged original properties, invalid-target button
clicks, and subscription cleanup. Typecheck, lint and build pass.

The immutable initial guide, five-file patch and test outputs remain under
`updates/` and `evidence/`. See `VERIFICATION.md` for the separate follow-up patch,
results and baseline reconstruction. This fixture uses local candidate packages;
these checks do not prove published package support, browser pixels, restoration
of an old undo stack, or a subsequent official update. Task 4 remains unstarted.
