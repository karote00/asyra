# Text adoption browser review

Date: 2026-10-23. Consumer baseline:
`719c414b7d8a80685ed042d1e1742bc32e09cb39`.
The adopted working source and the baseline were opened in the real in-app
browser using the same installed candidate dependencies and Vite server.
Only this consumer was read or written. Baseline source snapshots and screenshots
are retained in `test-results/browser-review/`; original fixtures are unchanged.

## Reproduction

Run the existing Vite script on a free localhost port. Open the consumer page.
Scroll below the canvas to reach its controls.

1. Initially select Text: metadata must show draft, record-17 and warning;
   typography must show Quarterly report, fontSize 16, lineHeight 24 and
   letterSpacing 1.5.
2. Click Approve selected Text: metadata must show approved, with other values
   unchanged.
3. Select chart-1: only the chart projection should appear, showing Revenue,
   sourceTextId text-1 and the approved source metadata.
4. Select text-1 again: metadata and typography should return, retaining approval.
5. Select chart-1 and click Approve selected Text to inspect invalid-target UX.
6. Reload: the original fixture loads as draft; this page does not save approval
   automatically. This is not a persistence round-trip test.

## Initial review results (before consumer fixes)

The initial values, valid approval action, chart projection and return to Text
all passed in both versions. Text-only projections disappear for the chart.
The page exposes read-only JSON outputs, not editable metadata fields or chart
rename controls; those Feature paths remain covered by the preservation suite.
No chart renderer is installed by this consumer, so chart checks concern its
projection and reference behavior, not a rendered chart visualization.

Two existing issues prevent a blanket visual/interaction pass:

- Text is not readable against the black canvas in either version. The installed
  Utils `createDefaultFill()` uses `#cccccc`, but the official candidate Text
  definition independently uses `textColor: '#000000'`. Both original documents
  explicitly save black. This is a Text default inconsistency with the stated
  shared gray-element policy, plus an existing saved-data visibility problem.
  Changing a new-object default alone would not recolor explicit saved values.
  No color override, fixture rewrite or Framework change was made for this review.
- The approval button remains enabled for a chart. Clicking it produces the
  uncaught `Text action requires Text` error in both versions. The chart/source
  projection stays unchanged, but the UI lacks invalid-target prevention.

The adopted selection outline uses the official 200 by 80 layout bounds; the
baseline outline follows smaller text-derived bounds. This is an observed
renderer change, consistent with the selected official geometry contract, not
proof that glyph rendering is visually correct.

Screenshots: `text-draft.png`, `text-approved.png`, `chart-approved.png`,
`baseline-text.png`, `baseline-chart.png`. Console evidence is in
`current-console.json` and `baseline-console.json` in the same evidence directory.
These were visually inspected. Browser verification is partial: metadata and
valid approval/chart interaction paths pass; glyph appearance remains blocked.

## Consumer fixes and re-verification

The user explicitly selected the shared-gray policy for newly created Text.
`src/definitions.ts` now uses the public Utils `createDefaultFill().color` in the
startup property redefinition. The official validator is retained. No saved
values or fixtures are rewritten. `src/panel.ts` subscribes to the existing
Text-only metadata projection to disable approval for chart or empty selection;
the subscription participates in panel cleanup.

Permanent regressions failed before the fix, then passed: new shared-gray Text,
unchanged saved colors across save/load, disabled approval without history/data
changes, re-enabled Text approval with one history entry, and panel cleanup.
All 16 tests, typecheck, lint and build pass after the fix.

Open `/e2e/text-review.html` on the consumer Vite server to repeat the browser
review. This permanent harness uses the real Core creation API, Feature and panel;
it creates new Text without a color override and never invokes save/storage.
Observed in the real browser:

- New Text visibly renders gray on black. The review output reports expected
  and created color from Utils as `#cccccc`; original saved Text remains `#000000`.
- New Text approval changes its metadata to approved.
- Chart and empty selection disable the approval button.
- Selecting saved Text re-enables approval; approving it updates the chart's
  referenced metadata while keeping record-17, warning and Revenue.
- No error-level browser console messages occurred in this sequence.

Inspected screenshots: `fixed-new-text.png`, `fixed-chart.png`, and
`fixed-chart-approved.png` under `test-results/browser-review/`.
The old black fixture remains unreadable on black intentionally: changing explicit
saved colors was excluded. The pre-existing test selection-overlay warning and
build chunk-size warning remain. No dependencies or Framework packages changed.

## In-memory persistence and history review

The permanent browser harness now exposes Edit new Text, Undo, Redo, Save to
memory and Reload memory in fresh runtime. Save serializes `core.save()` into a
JSON string held in the test page. Reload disposes the previous runtime and panel,
parses that JSON and starts a new runtime through the real load hook. It never
calls the App save wrapper, localStorage, IndexedDB or a backend provider.

Actual browser sequence passed:

1. Edit new gray Text, Undo to its original content, then Redo the edit.
2. Save to memory; compare every original fixture property, independent of JSON
   key order, to ensure no original values were altered.
3. Reload into generation 2: the edited content and Utils-derived gray remain.
4. Edit again, Undo and Redo in the fresh runtime, then save and repeat the
   original-property comparison.

At every checkpoint the new color was `#cccccc`, and both original Text and chart
colors were `#000000`. Screenshots `memory-reloaded.png` and `memory-history.png`
were inspected; `memory-final-state.txt` records the final visible state.
This proves document serialization/reload and history operations before and after
reload, not persistence of the old undo stack across runtime restarts.

A permanent integration regression covers the same memory-only round trip and
history semantics. All 17 tests, typecheck, lint and build passed. No production
implementation or original fixture changed during this follow-up.
