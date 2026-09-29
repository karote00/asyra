# Asyra Design Agent Guide

These instructions apply to this App and are copied into every project created
by `create-asyra-design-app`.

## Read before editing

1. Read [`docs/README.md`](docs/README.md).
2. Read the guide for the area you will change.
3. Identify the Framework, Preset, App, and backend owners involved.
4. State one bounded objective, mutation scope, unchanged behavior, and checks.

In the upstream Asyra monorepo, the root `AGENTS.md` and the
[App source-of-truth](https://github.com/karote00/asyra/blob/main/docs/ai/apps/asyra-design/README.md)
also apply. In a generated standalone project, use the stable upstream links
in [`docs/framework.md`](docs/framework.md) for Framework contracts.

## Required boundaries

- Product intent enters through `src/features`.
- Reusable App mutations and queries belong in `src/common-apis`.
- Canonical mutations use public Asyra APIs and one intended transaction.
- UI and rendering are projections, not canonical state owners.
- App domain rules do not belong in Framework packages or Preset defaults.
- Backend transport, authorization, durability, and model-provider policy stay
  outside browser canonical state.
- Cross-package imports use public `@asyra/package-name` entrypoints; do not use
  package internals or deep relative paths.

## Group and Frame semantics

Keep both registered. Group organizes children and derives its bounds from their
geometry. Frame owns independent dimensions and may supply its own background.
Choose by intent, never by hierarchy depth; either may contain either. AI tools
must expose this choice explicitly. Do not promise unsupported clipping,
constraints, live Auto Layout, borders or corner radii. Current semantic
row/column/grid preparation computes positions once, not a live layout engine.
See `docs/architecture.md` and the upstream design-preparation specification.

## Change discipline

- Before adding behavior or capability checks, identify the semantic owner and
  inspect existing public APIs, App APIs, utils, and registries. Use authoritative
  capability queries instead of local component-type lists; preserve intentionally
  type-specific behavior and test custom capability providers.

- For a bug fix, first prove whether a formal test detects the failure. Add or
  strengthen that test before changing production code when it does not.
- Fix the first incorrect owner step. Do not hide defects with fallback UI,
  patch rendering, fixture exceptions, or alternate state paths.
- Keep event, feature, tool, and property identifiers in their existing
  registries under `src/constants` or `src/config`.
- Do not commit secrets, generated browser evidence, test reports, or local
  service data.

## Local environment files

- Local `.env` files are persistent local configuration: use and preserve them.
  Never delete or clear them as test/task cleanup, and never stage, commit, or
  push them to Git. If missing, create `.env` from `.env.example`; never overwrite
  an existing local file with the example.
- Keep non-secret, portable configuration synchronized to `.env.example`.
  For real secrets such as API keys, include only the variable name and an empty
  value in `.env.example`; retain the actual value in local `.env` for continued
  use. Keep machine-specific paths in local `.env`. Treat `.env.example` as a
  setup template, not a test fixture.

## Verification

Run the narrow test for the changed owner first, then the standalone gates:

```bash
yarn typecheck
yarn react:build
yarn test
```

Use the documented E2E commands only when the affected behavior requires the
browser or complete collaboration services.
