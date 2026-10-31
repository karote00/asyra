# Flow Inspector Static Workspace Contract

## Purpose

The Static Workspace is one directly openable browser surface for discovering
and navigating the Flow Inspectors that still describe the current Asyra
project. A persistent sidebar lists the current catalog; selecting an entry
mounts that Inspector in a keyed React subtree and updates its stable public route.

The workspace is a static documentation tool. It does not report runtime
health, execute commands, ingest test results, or decide CI acceptance.

The current independently versioned workspace artifact is `0.2.0`.

## Ownership

- `tools/flow-inspector/workspace/catalog.cjs` owns inclusion, exclusion,
  grouping overrides, and lifecycle metadata for discovery candidates.
- `tools/flow-inspector/workspace/generate-workspace.cjs` owns deterministic
  discovery, source loading, catalog validation, and generated browser bundle
  output.
- `tools/flow-inspector/src/` owns the React sidebar, search, group collapse,
  Overview, public path/hash-route parsing, selection, and keyed React composition.
- `tools/flow-inspector/vite.config.ts` owns the classic-script static build
  emitted under `tools/flow-inspector/workspace/generated/`.
- `tools/flow-inspector/src/architecture/` owns schema version 2 presentation,
  admission, selection, details and viewport interaction in React.
- `tools/flow-inspector/src/ContractDocument.tsx` renders the original fields
  of explicitly registered contract documents. It performs no schema conversion
  and invents no missing architecture semantics.
- Target data remains the semantic authority. Generated workspace data is a
  verified snapshot, never a second authored contract.

Framework and App runtimes must not import or depend on any workspace file.

## Discovery Input

The generator searches exactly `tools/flow-inspector/inspectors/` for files
named `*flow-inspector.data.cjs` or `*flow-inspector.data.js`. The same
tool-owned directory's `__tests__/` directory contains target contract tests.
There are no generated standalone renderer HTML files. Framework and App `plans/`
directories are forbidden artifact roots.

Every discovered file must appear exactly once as included or excluded.
Exclusion requires a stable reason such as `superseded` or
`replaced-historical-direction`. Filename location alone is not an exclusion
reason. Catalog policy explicitly owns Framework, App, Release, and Tool
presentation grouping because filesystem location no longer doubles as
semantic ownership metadata.

The initial exclusions are:

- Executable Examples, explicitly superseded and removed from the current
  website surface; and
- Website Visual Reimagine, a completed visual direction replaced by the
  current Result-First Landing contract.

All other discovered Inspector data is included in the static preview. This
includes retained architecture and reusable release records that still help a
reader understand the current project. The workspace does not claim that
inclusion makes a plan active.

## Catalog Contract

Each generated catalog entry contains only discovery and presentation data:

- stable catalog `id` and a unique public `slug`;
- declared presentation kind: `flow-v2` or `contract-document`;
- source data path;
- title, group, subgroup, lifecycle label, order, and search labels; and
- the exact source snapshot consumed by React.

For schema version 2, catalog `id` must equal `target.id`. Document ids are
deterministically derived from the source filename unless the catalog declares
an explicit stable override. Catalog entries must never duplicate authored
steps, routes, artifacts, invariants, or acceptance semantics.

Slugs are presentation routes, separate from Inspector and evidence identities.
The catalog owns explicit `routeSlugs` overrides; entries without an override use
their stable id. Titles never derive routes. Slugs use lowercase ASCII words and
digits separated by single hyphens; `api`, `tools`, `docs`, and `apps` are reserved
server namespaces. Duplicate, malformed, reserved, or orphaned declarations fail
generation before output.

Generated browser data must match the current source objects exactly after
JSON-safe serialization. Generator drift is a formal failure.

## Routing and Isolation

- Hosted Overview route: `/`; Inspector route: `/<catalog-slug>` with no
  `flows` prefix. The server explicitly enables path navigation through
  `data-workspace-routing="path"` and supplies the existing workspace asset base.
- Direct-open static and Vite entries retain `workspace.html#inspector=<catalog-id>`
  hash navigation and their relative assets; path routing is never inferred merely
  from HTTP hosting.
- On the path-enabled host, workspace `workspace.html#inspector=<catalog-id>` and
  `/#inspector=<catalog-id>` links resolve the original id and replace the address
  with its canonical short route without adding history. The server cannot read
  fragments; the workspace performs this conversion. Unknown ids stay errors.
- Path routes consume the exact generated slug, while React props and
  evidence retain the original catalog id. An unknown path cannot select a flow
  through a hash. Selecting a flow pushes one history entry; reselecting it does
  not. Back, forward, direct opening, and reload restore the matching selection.
- Search and group-collapse state are presentation state and do not alter the
  route or target data.
- Unknown, excluded, or malformed ids render an explicit error and never fall
  back to another Inspector.
- The main target uses a React subtree keyed by catalog identity. Switching
  targets disposes the previous subscriptions and local selection state.
  There is no iframe, target document, message bridge, or global selected entry.
- React receives only the admitted generated bundle entry. It does not mutate
  catalog membership or source data.
- Rapid switching must leave only the final selected target visible.
- Document, source, specification, and related Inspector links open in a new
  tab without replacing the selected React view or losing canvas state.

## Supported Behavior

- direct-open use from the repository through `file:` URLs;
- a checked-in classic-script React build with no server or module-loader
  requirement;
- Overview with static counts by group and schema kind;
- Framework, Apps, Release, and Tools groups;
- sidebar search by title, id, subgroup, and labels;
- catalog groups collapse only through a visible, labeled arrow button; group
  text and counts do not toggle the list;
- independently toggleable catalog, v2 header, and v2 step-detail panels with
  persistent workspace controls outside the scalable canvas;
- mouse and keyboard-accessible Inspector selection;
- narrow v2 viewers (at most 900 CSS pixels) keep one primary surface visible:
  the canvas or a full-width, independently scrolling step detail. Selecting a
  card opens its detail; a fixed Back to flow control restores the canvas and
  selected-card focus without resetting pan or zoom. Catalog navigation becomes
  an overlay at narrow workspace widths and closes after selection. Overview
  and route errors retain a catalog reopen control. React state owns panel
  visibility. Desktop side-by-side panels remain available;
- trackpad pinch zoom from 20% through 250% inside the v2 flow viewport, with
  scale-matched scroll bounds, a visible reset control, and `Command+0`
  restoration to 100%;
- explicit React focus requests fit rendered step IDs with padding through the
  viewport owner; absent cards are ignored, and reset/manual zoom remain
  authoritative afterward;
- `Command+1` in the canvas document restores All lanes and fits the union of
  every card, centered with at least 24 CSS pixels from the viewport's outer
  border; the limiting axis has exactly 24 pixels per side (subpixel rounding
  allowed). Padding is measured after zoom, not in graph coordinates. Fit-all
  may exceed manual zoom limits to keep all cards visible. Editable controls
  retain ordinary typing. Page-delivered Command+1/0 work consistently across
  catalog, search, canvas and details through the mounted React viewport.
  Shift+1/0 outside editable controls and visible viewer
  buttons are browser-independent alternatives. Browser chrome/address-bar focus
  is outside the page's keyboard scope. `Command+0` resets scale and fit translation;
- stable deep links and reload restoration;
- schema version 2 rendering through the shared renderer;
- concise step-detail summaries with clearly separated categories and a
  collapsed full-contract view for execution rules, ownership boundaries, and
  related contract data;
- read-only React presentation of explicitly registered contract documents; and
- one shared React build, with no obsolete standalone entry or compatibility renderer.

## Unsupported Behavior

- runtime status or health colors;
- evidence/test mapping, provenance, freshness, or history;
- CI comparison or enforcement;
- API, CLI, commands, actions, process execution, or mutation;
- mapping reconciliation;
- remote data loading, hosted synchronization, permissions, or accounts; and
- editing target data from the workspace.

## Product Cases

1. Opening the static workspace without a hash or hosted `/` shows Overview and the complete current
   catalog without claiming runtime status.
2. Selecting Framework, App, Release, and Tool entries updates the route and
   renders the selected target in the same main region.
3. A short hosted deep link, static workspace hash link, reload, and browser
   back/forward restore the selected Inspector without duplicate history entries.
4. Search filters sidebar entries without changing selection or catalog truth.
5. Rapidly switching targets cannot retain the previous target's title, flow,
   details, links, or globals.
6. A duplicate id, missing path, mismatched v2 target id, unclassified
   discovery candidate, or stale generated snapshot fails formal validation.
7. An unknown or excluded route reports a clear error without fallback.
8. The workspace HTML directly opens the checked-in React build without a server.
9. Registered contract documents retain all authored fields and are never
   presented as schema version 2 architectures.
10. The complete static artifact works without a local server.
11. Panel controls remain outside the scalable flow while its content
    scrolls or scales, and every control toggles its owner panel in both
    directions.
12. Step ownership is visibly neutral metadata, while detail content defaults
    to a concise summary with an explicitly separated full contract.

## Definition of Done

- every fixed-root candidate is classified once;
- generated catalog and source snapshots pass exact validation;
- every included v2 target passes the shared structural contract;
- workspace Inspector routes, artifacts, and boundaries are valid;
- sidebar, search, collapse, Overview, deep-link, reload, unknown-route,
  rapid-switch, and isolation cases pass formal DOM tests;
- every catalog target renders through its declared renderer kind;
- direct-open React, served React, removed-asset and installed-package gates pass;
- synchronized browser inspection confirms desktop and narrow viewport
  usability, including v2 flow scrolling, pinch zoom, and exact zoom reset; and
- package `test`, `test:local`, and `test:ci` run the React suite plus complete
  catalog, workspace, architecture, and React delivery Node contract gates; and
- preview documentation contains no dynamic Control Plane claim.
