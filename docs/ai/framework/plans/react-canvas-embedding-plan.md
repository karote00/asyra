# Embeddable React canvas

The public React 19 package exposes the requested AsyraCanvas component.
Its owner is sdk/react, a separately packaged product built on the public
Framework. The Starter, existing Framework releases and commercial services
are outside this task. The worktree branch is codex/react-canvas.

## Runtime and delivery contract

One component owns one same-origin srcdoc frame. The editor bundle, styles and
initial document ship inside the package. The default Framework event bus and
transaction owner have module lifetime. Evaluating the bundle once per frame
gives each editor its own owners, without a second document model. A retained
browser test verifies isolation of the event owner and disposal of a sibling.

On frame load, apply the 2D shape, container and selection defaults. Register
the edit Feature and document load source before starting Core. Toolbar actions
remain inert until startup settles. On retirement, disconnect sizing observers
and dispose the runtime after startup settles. Errors surface in the editor.

A drag previews a rectangle locally. Release maps surface coordinates to the
workspace, validates finite positive geometry and creates one canonical element
in a Factory transaction. Escape, pointer cancellation and zero-area gestures
discard the preview. Selection uses Render hit testing and Core selection,
then requests a frame to project the existing selection overlay. Selection is
excluded from document Undo. History buttons and keyboard shortcuts use
Factory replay. External toolbar actions receive the mounted Feature's drawing
API. Saved documents use a caller-supplied identity and Core load admission.

## Acceptance

The React consumer fixture installs the SDK tarball and React dependencies into
a fresh npm project, checks TypeScript declarations and builds for production.
Every real input module in the application build must resolve inside the clean
consumer. Chromium exercises drawing, selection feedback, Undo, Redo, cancelled
gestures, simultaneous instances, teardown, external actions and saved document
reload and rejection. Pixel assertions verify the visible shape and the selection
outline. The independent realm experiment and the existing Framework release
consumer remain separate checks.

The flow contract and its verification command live in react-canvas/canvas.flow.json.
