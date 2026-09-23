# Starter App

`@asyra/starter-app` is the minimal canonical App source for the adoption
program. It is intentionally scoped to one App-owned Item domain and does not
create the public CLI, generated template, release config, or publication
surface.

The App composes Core with the supported Preset 2D provider path, registers an
App-owned Item component and Props component, routes edits through Feature API
commands into one transaction per intended action, and persists explicit
versioned snapshots in `localStorage` slot `starter-app.document.v1`.

## Commands

```bash
yarn workspace @asyra/starter-app test
yarn workspace @asyra/starter-app typecheck
yarn workspace @asyra/starter-app lint
yarn workspace @asyra/starter-app react:build
yarn workspace @asyra/starter-app test:e2e
```
