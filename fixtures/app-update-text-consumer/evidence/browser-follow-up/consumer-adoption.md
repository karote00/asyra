# Text update consumer

This standalone `custom-text-example-1` App has adopted the selected official Text
contract with retained App metadata, chart references and versioned loading.
Core owns canonical values; UI projections read them, and App Features own actions
and transactions. Document conversion remains App-owned.

## Adoption status - 2026-10-23

- Change: `text-official-fields-example-1`, guide revision 2, equivalent
  layout-unit fields case. Guide: `updates/text-official-fields-example-1-r2.md`.
- Official source: `7bf3655242e6adca9ac7d81ff57d17df9b310c9e`.
- Installed direct packages: Core 0.5.7, Preset 0.5.8, Utils 0.5.2. Public exports
  and declarations were inspected. `yarn.lock` resolves the local candidates
  identified by `updates/target-artifacts.json`; manifest versions alone do not
  identify this build. Archive SHA-256 digests were supplied, not independently
  recomputed outside this consumer. Not every attached package is installed.
- Status: selected integration and consumer fixes validated on consumer baseline
  `719c414b7d8a80685ed042d1e1742bc32e09cb39` plus the current uncommitted diff.
  This is not npm release verification or a complete release-to-release delta.

`src/definitions.ts` installs the official Text schema/property base, extends it
once through `redefinePropertyType` before startup, composes official component
aliases and registers `TEXT_RENDER_STRATEGY` once. Official lineHeight and
letterSpacing defaults, validators and layout-unit meaning are adopted; redundant
local definitions and rendering are removed. Official rendering includes layout
bounds and hit testing. The final typography definition has twelve unique fields.

Retained App fields are `approvalStatus`, `sourceRecordId` and `labelCategory`,
including their original defaults, validators and persist/project/unit policies.
The chart still shares typography and references Text. Feature actions and the
separate metadata/typography/chart projections remain in `src/runtime.ts`.
`src/panel.ts` disables approval when the existing Text-only projection is empty,
including chart or empty selection, and cleans up the new subscription on disposal.
There is no equivalent exported official App action replacing these business rules.

## Intentional gray default and deferred behavior

The user requires the shared initial element gray because the canvas is black.
The sole official-field override is the registered typography `textColor` default:
`createDefaultFill().color` from the public Utils API, currently `#cccccc`, instead
of the candidate Text default `#000000`. The implementation does not hardcode that
color. The override is applied during property redefinition; the official color
validator remains intact. `textSchema` is used for validation and aliases, not as
the authority for the effective registered color default.

Because typography is shared, its effective default also applies to other newly
created users of that property, including chart captions. Explicit saved colors
are never recolored. Original black fixture text therefore remains black and
unreadable against black by design; do not rewrite it to improve a screenshot.

The official example's string-based selection projection is not installed:
charts also contain `text` and must retain their own controls. Rich text, IME,
full canvas editing, the official example's UI panel and subsequent updates remain
outside this adoption. This fixture has no chart renderer; chart verification
covers its controls, projection and references, not a chart visualization.

## Documents and storage boundary

Document version remains 2; component/property identities, hierarchy and references
are preserved. The existing version 1 font-size multiplier conversion remains in
`src/documents.ts` via `registerLoadHook`: 1.5 at fontSize 16 becomes 24 layout units
once. Unknown formats, invalid metadata and invalid/overflowing conversions fail
before canonical apply. Ownership consolidation adds no document migration.

`test-data/current.json` and `test-data/multiplier.json` are immutable inputs.
The final review compared both byte-for-byte against the consumer baseline and
confirmed no changes. The supplied guides, dependencies and lockfile are unchanged.
Original preservation test cases remain intact; new tests were added.

The App's existing `save()` wrapper in `src/runtime.ts` still writes localStorage;
that method and its storage key were not changed. Preservation tests exercise it
only in jsdom test storage. Real-browser verification uses the local fixture and
`core.save()` for serialization into an in-memory JSON string, never the App save
wrapper, browser persistent storage or a production backend. Reload parses the
snapshot into a fresh runtime after disposing the old runtime and panel. No
production storage was accessed or modified.

## Verification and reproduction

Latest gates: `yarn test` passed 17 tests; `yarn typecheck`, `yarn lint` and
`yarn build` passed. The original 10-test baseline passed. Adoption and gray/default
approval regressions were demonstrated failing before their fixes. Coverage now
includes official contracts/render inputs, fresh defaults, invalid values, shared
relations, metadata, one-action history, panel cleanup, save/reload, multiplier
conversion and preservation of all original property values.

Actual browser checks passed on the local App and permanent
`e2e/text-review.html` harness:

- New Text visibly renders the shared gray against black; original explicit
  Text/chart colors remain unchanged.
- Text approval updates metadata; chart selection shows the referenced approval
  state and disables approval. Empty selection disables it; Text re-enables it.
- Editing new Text, Undo and Redo preserve gray. Memory save and fresh-runtime
  reload retain the content/color. A new edit and Undo/Redo also work after reload.
  Both memory saves compare every original property value, ignoring JSON key order.

To repeat, run `yarn dev --host 127.0.0.1` and open `/e2e/text-review.html`.
For the persistence sequence use Edit new Text, Undo, Redo, Save to memory,
Reload memory in fresh runtime, then Edit new Text, Undo, Redo, Save to memory.
Reload the page before this sequence if you previously approved the original Text:
that action intentionally changes its metadata and will fail the preservation
comparison. Old undo-stack persistence across runtime restarts was not claimed.

Detailed evidence and earlier findings are in `docs/browser-review.md`. Local
screenshots/logs are ignored artifacts under `test-results/browser-review/`,
including `fixed-new-text.png`, `fixed-chart-approved.png`, `memory-reloaded.png`,
`memory-history.png`, `memory-final-state.txt` and `memory-*.log`. They are retained
locally but are not tracked; repeat the permanent harness if unavailable on handoff.
The jsdom suite uses canvas stubs; browser screenshots were separately inspected.
The pre-existing selection-overlay test warning and build chunk-size warning remain.

## Next update

Inspect current code and the next guide rather than resetting this consumer to
the modeled source. Preserve the shared-gray override, three metadata fields,
type-scoped projections, approval eligibility, shared chart relation and version
1 support. Compare upstream field contracts before composing extensions; collisions
require review. Verify existing explicit values and document identities through
load/save/load and rerun the gates and browser sequence above. Do not infer a
published release, missing migration or subsequent update from this adoption note.
No dependency/tool upgrade, commit or push was performed during this integration.
