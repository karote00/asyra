# Flow Inspector Static Workspace

Static React workspace for discovering and opening every current-project Flow
Inspector from one sidebar. The checked-in Vite build uses classic scripts, so
`workspace.html` can be opened directly from the repository with a `file:` URL
and does not require a development server.

## Local development

From the repository root, start the React app with Vite and open it directly:

```bash
yarn workspace @asyra/flow-inspector dev
```

The command refreshes the Inspector catalog, starts the app server, opens the
workspace, and enables React hot module replacement. Stop it with `Ctrl+C`.

## Static preview

Open `tools/flow-inspector/workspace/workspace.html` in a browser. Select an
Inspector from the sidebar or open a stable deep link:

```text
workspace.html#inspector=<catalog-id>
```

The selected Inspector is rendered directly by a keyed React component.
Switching targets resets the selected view's component state. There is no frame,
message bridge, standalone per-Inspector HTML or parallel renderer.

## Develop and verify

```bash
yarn workspace @asyra/flow-inspector typecheck
yarn workspace @asyra/flow-inspector build
yarn workspace @asyra/flow-inspector test:local
```

The React source lives in `tools/flow-inspector/src/`. Vite emits the committed
classic JavaScript and CSS under `workspace/generated/`; the catalog generator
emits `workspace-bundle.data.js` from the current Inspector sources. The build
command runs that generator before compiling both React applications.

Direct-open and Vite workspace entries remain read-only. The sibling
`tools/flow-inspector/control-plane/` serves this same committed workspace.
React composes the control-plane panels with the shared architecture components.
The server owns actions and evidence; React owns the canvas, cards, connections,
selection and zoom. The live flow-file dashboard also uses these React
architecture components and its own React task panel.
