# Asyra Office

A local-first implementation slice of the [Office product plan](../../docs/ai/apps/asyra-office/asyra-office-product-plan.md). The complete plan remains open.

## Run

Use the repository's declared Node 24 and Yarn 4.3.1:

```sh
yarn install --immutable
yarn turbo run build:preset --filter @asyra/preset
yarn start:asyra-office
```

The local workbench opens on port 5194. No provider credentials are configured.
Start the explicitly labeled synthetic task, then use Sources to finish/fail it,
Places to focus the camera, and Park break or Coffee walk for ambient movement.
Layout offers half-unit desk placement, wall finishes, an attributed synthetic
proposal preview, Undo/Redo and explicit local Save/Load. Task and movement state
are separate from the canonical layout. Logs survive reload after storage
acknowledgement. Cooperative JSON imports remain labeled as reported evidence;
imported agents have no assigned avatar in this slice.

```sh
yarn workspace @asyra/asyra-office test:local
yarn workspace @asyra/asyra-office build
yarn workspace @asyra/asyra-office test:e2e
```

The E2E suite uses Chromium. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` only when an
existing approved installation supplies a non-default executable. Native
browser launch, screenshots, provider integrations, target-device performance,
multiple floors and progression must be verified separately; green unit tests
are not evidence of those product outcomes.

The framework does not save secrets or raw prompts. This initial single-user
workspace uses explicit localStorage snapshots for layout and bounded event
batches for a maximum of 10000 retained events. It is not a collaboration server,
incremental document outbox, live Dots connection or provider task executor.
