# Modeled adoption note before intervening customization

This is scenario input, not an independent acceptance report.

| Scenario | Actual adopted baseline | Remaining work |
| --- | --- | --- |
| Direct legacy documents | No completed modeled stage; document version 1 | Inspect all three App records and the Framework prerequisite. |
| Partial adoption | `model-text-app-1`, guide revision 1, partially adopted | Official renderer/base are in use; local line-height/spacing overrides were retained pending comparison. `model-text-app-2` and `model-text-app-3` remain deferred; documents are version 2. |

The selected installed candidates are Core 0.5.7 and Preset 0.5.8-task4.0, with
the Utils 0.5.2 local resolution. Exact archives are recorded in `artifacts.json`.
`model-text-framework` bytes are installed, but the App retains its old spacing
default. This is partial adoption, not completed integration.

Retain approvalStatus/sourceRecordId/labelCategory, approve/reject, chart captions
and their source links, and the shared gray text-color override. The official
Text panel remains deferred. No later edits are described by this older note;
inspect current code and samples before updating it. The user now selects the
official spacing default and App wire version 3 for this isolated exercise.

Append the new adoption result below. Keep this input note intact, and distinguish
actual checks from unverified assumptions and pending product choices.

## Isolated modeled acceptance - 2026-10-24

Completed the selected consumer integration for `model-text-app-1`,
`model-text-app-2`, `model-text-app-3` and prerequisite `model-text-framework`
using `text-cross-version-example-3` revision 1. Also reviewed
`text-official-fields-example-1` revision 3 and `text-spacing-example-2`
revision 2. The cross-version guide explicitly selects wire version 3; the
older default-only guide's unchanged-version instruction is not the selected
serialization contract for this exercise.

The actual starting state was partial stage 1: official base/rendering installed,
local line-height/spacing overrides still present, stage 2 default deferred, and
wire version 2 (with supported version-1 multiplier inputs). The Framework
candidate bytes were installed, but its spacing policy was not adopted. The
current source additionally contained `reviewNote` and `annotate`, absent from
the older note. No prerequisite beyond the supplied modeled Framework record
is declared; no intermediate package installation was required.

Adopted the official typography fields and shared spacing default 0.5 for new
Text and chart captions. Retained the complete four-field metadata extension,
rejected approval state, validators, defaults, aliases, persist/project flags,
annotation, approval button, rejection, chart renaming, source links, and UI
projections. Retained the shared gray default through `createDefaultFill()`;
explicit stored colors and spacing (including zero and 1.5) remain unchanged.
The existing Feature and transaction path remains the sole action owner.

App migration now clones the input and performs version 1 multiplier conversion,
then version 2 scalar-spacing conversion to version 3
`tracking: { unit: 'layout', value }`. Both Text and chart typography participate.
Version 3 loads materialize numeric runtime spacing without wire tracking in Core
or projections. Saving clones Core output and writes version 3 through the
existing localStorage wrapper. Invalid versions, conflicting representations,
missing/invalid fields and unsupported units fail before canonical apply or
storage changes. Document identities, hierarchy, property IDs and chart
references are preserved. Two fresh-runtime reloads establish idempotence for
each supplied valid input. No persistent undo history is claimed; each action
was tested with one new history entry and undo/redo in the fresh session.

### Identity and verification

All 114 `HANDOFF-SHA256.json` entries and all 20 `artifacts.json` archives were
verified before edits. The candidate source is
`7bf3655242e6adca9ac7d81ff57d17df9b310c9e`. Resolved candidates remain Core
0.5.7, Preset 0.5.8-task4.0 and Utils 0.5.2 (the local resolution overrides the
manifest request for Utils 0.5.1). Preset archive SHA-256 is
`60ba8503161a1f88adfbe17a5c136e4d202df987b07b14452a3b4e9047db32b7`;
other exact archive identities remain in `artifacts.json`. No dependency,
lockfile, candidate archive, sample document or public guide was modified.
Installed public declarations/exports and runtime validation were inspected.
Node v24.22.1 and Yarn 4.3.1 were used with consumer-local caches/temp files.

Commands, complete logs and exit statuses are retained in
`test-results/cross-version`:

| Check | Result / exit status |
| --- | --- |
| `yarn install --immutable` | Passed / 0, with optional TypeScript compatibility patch warning YN0066 |
| Baseline `yarn test:baseline` | 4 passed / 0 |
| Baseline `yarn test:acceptance` | 4 expected failures / 1: default, two version-3 cases, ambiguous units |
| Baseline `yarn typecheck`, `yarn lint`, `yarn build` | Each passed / 0 |
| Added regression suite before implementation | Corrected harness: 6 expected failures, 17 passes / 1 |
| Final `yarn test` | 31 passed across 3 files / 0 |
| Final `yarn typecheck` | Passed / 0 |
| Final `yarn lint` | Passed / 0 |
| Final `yarn build` | Passed / 0 |

The new permanent `migration-boundaries.test.ts` covers full property equality
through migration, existing version 3, chart zero, wire/runtime separation,
invalid-document atomicity including storage, metadata validation, unique field
registration/flags, each retained action's undo/redo and chart/empty-selection
control isolation. Existing preservation assertions were not removed or weakened.
The supplied acceptance test's definition lookup now uses the runtime's existing
pre-start `definition` snapshot: the installed Core forbids calling
`getPropertyTypeDefinition` after startup. Its definition assertions are unchanged.
The first added-test run also exposed that harness issue and an incorrect new
assumption that selected fresh sessions have zero history; those logs are retained.
The corrected test measures action history increments and exact undo/redo state,
without assuming selection adds no history.

### Remaining decisions and limitations

- `ambiguous-units.json` declares em spacing. It remains unchanged, recoverable
  and rejected. A product-approved unit conversion is still needed before that
  document can be admitted; no conversion was guessed.
- The optional official Text panel remains deferred and uninstalled.
- All four modeled release records embed guide hash
  `227135e30355aa0843af0bc853f678cdfa5e803094521cbd01622989273b5592`, whereas the
  supplied revision-1 guide hashes to
  `68f855f9e4649a541ca147cd20a48c5033a01ebd06f5083136f1d60b0ae65148`, matching
  `HANDOFF-SHA256.json`. This documentation inconsistency is unresolved. Execution
  used the explicitly authorized TASK and verified handoff guide, not a claim
  that release-record guide hashes agree. The supplied history also explicitly
  reports no verified published release range. Older guide links to historical
  maintainer evidence were not followed outside this consumer.
- Yarn's optional TypeScript patch warning, Pixi deprecation/selection-overlay
  warnings from the jsdom canvas harness, and Vite's large-chunk warning remain
  visible in the logs. Passing behavior gates do not establish browser pixels,
  typography readability, real registry availability, production storage
  migration, publication or deployment.


## Maintainer integration clarification - 2026-10-24

The preceding independent note is retained verbatim in
`evidence/independent-v1.tar.gz`. Its claim of inconsistent guide hashes is
corrected by `evidence/ERRATA.md`: release records hash JSON-encoded guide text,
while the handoff hashes raw bytes, and both original values are correct.
The original integration adopted revision 1. The maintainer has now reviewed
revision 2's digest and composition-read clarifications; these introduce no new
package, migration, default or adoption stage. All three modeled App stages and
the Framework spacing policy remain adopted; the panel remains deferred and
em units remain unresolved. This appended note is not another independent run.
