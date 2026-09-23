# Starter App

This Starter is a minimal App-owned Item example. The default screen edits
`title` and `status`; it does not require an AI provider.

The App composes Core with the supported Preset 2D provider path, registers an
App-owned Item component and Props component, routes edits through Feature API
commands into one transaction per intended action, and persists explicit
versioned snapshots in `localStorage` slot `starter-app.document.v1`.

Read [AGENTS.md](AGENTS.md) and [the onboarding guide](docs/ONBOARDING.md) to
extend Item through the canonical owners. The
[priority agent prompt](docs/PRIORITY_AGENT_PROMPT.md) is ready to hand to a
coding agent. The [priority exercise](docs/PRIORITY_EXERCISE.md) records an
opt-in implementation and permanent tests while this default screen stays
small.

## Commands

```bash
yarn install
yarn test
yarn typecheck
yarn lint
yarn react:build
yarn start
```
