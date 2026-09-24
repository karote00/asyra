# Starter App

This is the CLI-generated consumer retained for the independent priority
onboarding verification. The new document starts empty.
Add an Item, select it on the 2D canvas or in the Item list, then edit its
`title`, `status`, and `priority` in the inspector. Drag a canvas Item to move it. Each
completed drag is one Undo action; Undo/Redo and explicit Save/Reload
remain available. The screen does not require an AI provider.

The App composes Core with the supported Preset 2D provider path, registers an
App-owned Item component and Props component, routes edits through Feature API
commands into one transaction per intended action, and persists explicit
versioned snapshots in `localStorage` slot `starter-app.document.v1`.
Canvas cards are read-only projections of those Item values and saved position
offsets. The drag preview, selection and unfinished title input remain transient
UI state.

Read [AGENTS.md](AGENTS.md) and [the onboarding guide](docs/ONBOARDING.md) to
extend Item through the canonical owners. The
[priority agent prompt](docs/PRIORITY_AGENT_PROMPT.md) was applied to this
consumer without changing the prompt. [VERIFICATION.md](VERIFICATION.md)
records the source, local packed dependency setup, and test evidence. The
bundled onboarding and exercise documents are the original generated entry
documents used at the start of the exercise.

## Reproduce the packed consumer

This directory retains the generated source and formal tests. It is not an
installed Yarn project: it intentionally omits `yarn.lock`, `node_modules`,
build output, and packed tarballs. Run the complete commands in
[VERIFICATION.md](VERIFICATION.md) from the repository root. They create a
fresh, standalone Yarn consumer under project `tmp/`, install the locally
packed Framework packages, apply this fixture's source, and run its checks.
