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

This checkout is the consumer after intervening user edits, before its next update.

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

## Intervening user changes - 2026-10-24

The App now allows `rejected` as well as `draft` and `approved`, through its
existing metadata action and a dedicated `reject` Feature action.
`test-data/locally-extended.json` is a saved document with rejected approval,
source record `record-42` and category `general`. Preserve this document and the
original documents. The three custom fields and the intentional shared-gray
override remain App-owned. The official example UI panel is still deferred;
its string-based selection would include charts. Rich text and IME remain
outside the available target. These are not adopted by a package update.

The prior dated sections are history. Current state is the first local candidate
plus the maintainer follow-up and the intervening changes above. The next
`text-spacing-example-2` change is pending. The document schema is still 2.
Run the current tests before selecting the supplied next artifact. Keep failed
or partial adoption pending and retain the previous artifact and saved inputs.


## Subsequent independent Text adoption - 2026-10-24

Adopted `text-spacing-example-2`, guide revision 1, from the actual first
candidate plus shared-gray/approval follow-up and intervening rejected approval
extensions. This section supersedes the pending status above. V1/V2/V3 adoption
stages are separate from App document versions; the App format remains version 2.

Selected the supplied private, test-only Preset `0.5.8-task4.0` archive in the
existing dependency and resolution. Its SHA-256 is
`60ba8503161a1f88adfbe17a5c136e4d202df987b07b14452a3b4e9047db32b7`;
the retained previous Preset 0.5.8 archive is
`465e4e330d272162dc627b9004b109e7b15529eef4699366451697ca86085291`.
Both digests were recomputed. Archive comparison confirmed exactly the three
entries listed in `updates/model-artifact.json`; every installed target archive
file matches. Core remains 0.5.7 and resolved Utils remains 0.5.2 (the existing
manifest request is 0.5.1 with its unchanged local resolution). The lockfile
changes only Preset and its consumer dependency reference. Linked canonical
GitHub sources were reachable; installed public declarations were inspected.

New Text and chart typography now inherit spacing 0.5 from the official base.
Explicit saved spacing, including 0 and 1.5, and saved colors remain unchanged.
The existing composition required no runtime rewrite: twelve unique fields,
metadata aliases, one official renderer, all three metadata paths, rejected
approval, approve/reject transactions, shared gray from `createDefaultFill`,
chart references and Text-only controls are retained. The App loader still
converts version-1 multiplier units once and rejects incomplete/invalid data
before apply. Original fixture files and previous candidate archives are intact.
The official example UI panel remains deferred and uninstalled; rich text and
IME remain outside adoption.

Verification: the unmodified baseline passed 22 tests. Before installing the
candidate, the updated/new default assertions failed twice with actual 0 versus
expected 0.5; the other 27 tests passed. After installation, all 29 permanent
tests pass, plus typecheck, lint and build. Added coverage verifies new Text and
chart defaults through fresh load, explicit zero through two storage reloads,
missing spacing and each metadata field without canonical mutation, and each
metadata Feature write after reload with canonical/projection/storage checks.
Retained coverage exercises all three document generations, line height 24,
scene hierarchy and references, rejected approval, one-entry actions, Undo/Redo,
validation, renderer registration and chart control isolation.

Logs are retained in `test-results/subsequent-adoption/`: baseline, old-candidate
regression, artifact verification, install, formatting, test, typecheck, lint
and build. The first lint run rejected dynamic deletion in a new test; it was
replaced with `Reflect.deleteProperty` and lint passed. Installation reported
Yarn's optional TypeScript patch warning; typecheck/build passed without changing
tools or unrelated dependencies. Existing jsdom render warnings and the build's
large-chunk warning remain. Tests use packaged Core with canvas stubs: no browser
pixel, published release, production storage, restored prior-session undo stack,
or general release-range compatibility claim is made. No publication, push or
Framework source modification was performed.


### Non-blocking findings from this independent adoption

These findings describe the completed revision-1 run, not additional adoption
requirements. No blocking guide omission or ambiguity in the selected behavior
was found: artifact identities, shared spacing defaults, explicit saved values,
metadata ownership, gray override, deferred UI and document versions were
specified sufficiently. No product behavior had to be guessed. The 22-test
baseline, two expected failures on the old candidate, and 29 passing target
tests with typecheck, lint and build support this bounded result only.

#### Guide content - optional operational clarification

The guide does not describe the optional TypeScript patch warning emitted by
Yarn during this installation. This is an operational documentation opportunity,
not a missing spacing or migration contract. Installation completed and the
required checks passed; this run does not establish that every such warning is
harmless. Evidence is retained in `test-results/subsequent-adoption/install.log`
and the corresponding gate logs.

Recommendation: add a short installation troubleshooting note identifying the
observed warning, requiring readers to retain the install result and run all
required gates, and explaining that a failed installation or required gate
leaves adoption pending. Do not recommend unrelated upgrades or suppressing
warnings merely to complete adoption.

#### Delivery attachments - historical references and portable links

Historical README sections refer to `VERIFICATION.md`, `evidence/` and
`updates/target-artifacts.json`, which are absent from this consumer handoff.
This is an attachment/history-context problem, not missing target identity:
the current handoff supplies both Preset archives, `updates/model-artifact.json`
and `updates/base-artifacts.json`. Actual code, installed packages and fresh
verification were used; the absent historical evidence was not reconstructed
or treated as verified by this run.

Recommendation: preserve the dated record but annotate historical attachments
as not included in this handoff, or supply them when historical reproduction is
intended. Include a handoff inventory distinguishing current required evidence
from optional historical evidence, with paths that exist in the consumer.

The supplied `updates/persistence-migration.md` also contains relative links
into a documentation tree not included in this standalone consumer. Those
optional references were not used to establish the selected migration behavior:
the update guide and actual loader specify the supported versions and conversion.
This is a delivery portability problem rather than an unresolved migration rule.

Recommendation: check relative links when packaging the standalone handoff;
supply the referenced documents or replace the links with pinned accessible
sources. Clearly label optional background references. If a future update
requires an unavailable source, stop dependent integration as the guide directs.

#### General execution decisions - not guide omissions

Permanent test organization and assertions were chosen to exercise the guide's
required behavior. Package caches and logs were kept inside the consumer to
satisfy the task's filesystem constraint. The new test's dynamic deletion was
changed to `Reflect.deleteProperty` after the first lint run rejected it; this
was a test-authoring correction, not a package or guide defect. These choices
required implementation judgment but no inferred product contract.

Recommendation: keep these details in execution evidence rather than expanding
the update's behavioral contract. A reusable runner may document project-local
cache/log settings and use the consumer's existing lint configuration. Retain
failed attempts alongside final passing logs; do not present first-attempt lint
failure as a failure of the supplied update.

These recommendations are recorded for future guide and handoff maintenance;
this documentation follow-up does not modify the supplied guide, attachments,
runtime, dependencies or saved fixtures, and does not claim the recommendations
have already been implemented.


### Documentation follow-up - revision 2 - 2026-10-24

The [revision-2 guide](updates/text-spacing-example-2-r2.md) now documents the
observed installation warning, required exit-status/identity/gate checks and
project-local execution settings. The [handoff inventory](updates/handoff-inventory-r2.md)
distinguishes required current inputs, included supporting evidence and missing
historical attachments, including Git-ignored archives/logs that must be delivered
explicitly. The [revision-2 migration reference](updates/persistence-migration-r2.md)
replaces unavailable documentation-tree links with actual consumer references
and labels the generic migration example as background, not this App's format.

This implements the documentation recommendations recorded above without changing
the original revision-1 guide, original migration attachment or dated history.
The old missing attachment references describe unavailable historical evidence;
use the new inventory for current availability. Runtime, dependencies and saved
fixtures are unchanged by this follow-up. Revision-1 acceptance remains the
recorded result; revision 2 is not claimed as a fresh independent acceptance.

Documentation validation checked 38 active local links and all 20 archive
SHA-256 digests, and confirmed the historical absence annotations. Protected-file
hashes confirmed no changes to original guides, runtime, tests, fixtures, manifest
or lockfile during this follow-up. All 29 tests, typecheck, lint and build passed
again; logs are retained under `test-results/subsequent-adoption/docs-r2-*.log`.
Existing render/build warnings remain. These checks validate this documentation
follow-up and current checkout, not a new independent adoption experiment.
