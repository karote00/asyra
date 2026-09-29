# Support, security, and release boundaries

This guide explains the environment, security, migration, and compatibility
boundaries of the current project package set. It does not announce or
authorize publication, tagging, or deployment.

## Candidate package set

The Framework package set contains exactly 19 public ESM packages. Package
names, versions, exports, and dependencies are generated from the project
manifests so this reference stays synchronized with the code.

Consumers may import only package roots and explicitly exported subpaths.
Workspace aliases, `workspace:*`, hoisting assumptions, monorepo-only paths,
and package-private `src` imports are not public contracts.

## Supported environment

- Node.js `24.x` for package verification
- Yarn `4.3.1` for repository contributors and release verification
- public ESM entrypoints with TypeScript declarations
- React 19 for Asyra Design and `@asyra/design-system`
- Chromium through the current Playwright browser verification
- official `2D` and engine-neutral `CUSTOM` composition

Input System and default Core entries import without eager DOM access in the
supported Node runtime. That proves import safety, not a public Headless Core,
Core Kernel, server/worker lifecycle, no-Render dependency, or multi-runtime
isolation.

Production `3D`, `HYBRID`, auto layout, and unit-aware aggregation are not in
this candidate.

## Optional systems

Collaboration is opt-in. Without explicit composition, no provider, room,
connection, timer, Awareness runtime, or network side effect exists. Apps own
transport, authorization, persistence, recovery, and conflict policy.

AI is opt-in. Without explicit composition and invocation, no model provider,
credential access, network request, timer, listener, or Feature registration
exists. Apps own provider/backend policy, permissions, confirmation, action
executors, and transactions.

## Community and security reporting

GitHub Discussions is the intended public channel for community conversation and
general help. Discussions is not enabled for this repository yet, so there is
currently no public community support destination. GitHub Issues are not a
general public support channel. External pull requests are not accepted by
default. Community participation creates no SLA or response deadline.

For suspected vulnerabilities, follow the repository's
[security policy](../../../SECURITY.md) and submit a private GitHub security
advisory. Do not disclose vulnerability details, credentials, provider tokens,
document contents, or personal data publicly.

## Migration and deprecation

App documents enter through `core.setLoadSource(...)` and app-owned migration
before package-owner validation. These compatibility surfaces remain in the
current candidate family and are planned for removal in the next major release:

| Deprecated surface              | Replacement                          |
| ------------------------------- | ------------------------------------ |
| `core.setPersistence(provider)` | `core.setLoadSource(source)`         |
| `PixiJSRenderer`                | `RenderAdapter` from `@asyra/render` |
| `RenderStrategyGraphic`         | `RenderGraphics`                     |
| `RenderStrategy`                | `EngineNeutralRenderStrategy`        |

Runtime compatibility warns once where observable. Type-only aliases carry
deprecation and replacement in declarations. New code should use replacements
now; do not build new dependencies on compatibility names.

## Repository release verification

For maintainers validating the complete repository from a clean Node.js 24.x
checkout:

```shell
yarn install --immutable
yarn react:build
yarn release:packages --prebuilt
yarn release:consumer
yarn release:records
```

Complete release acceptance additionally requires the project-owned tests,
dependency checks, visual review, exact package artifacts, and registry-only
consumer verification. Successful verification shows candidate readiness; it
does not publish packages.

## License

Asyra Framework packages are released under the MIT License. Include the
copyright and permission notice in copies or substantial portions. The
software is provided without warranty under the terms in the repository
[LICENSE](../../../LICENSE).

## Canonical sources

- [Framework release support](../../ai/framework/RELEASE_SUPPORT.md)
- [Community and support policy](../../../SUPPORT.md)
- [Security policy](../../../SECURITY.md)
- [MIT License](../../../LICENSE)
- [Runtime roadmap](../learn/runtime-boundaries-roadmap.md)
