# `@asyra/utils`

Pure shared types, ids, geometry and numeric helpers, registries, registration graph primitives, and diagnostics dispatch.

## Requirements

- Node.js 24.x
- Yarn 4.3.1 for this repository's maintained workflows

## Install

```bash
npm install @asyra/utils
```

```ts
import { isRecord } from '@asyra/utils'
```

Use only the package root and the explicitly documented public subpaths.

## Owns

- neutral low-level types, id helpers, pure calculations, shared registries, structured registry errors, and low-level diagnostics primitives

## Does not own

- runtime business policy, startup side effects, canonical App state, rendering, Feature decisions, or domain-specific meaning

## Start here

Import a public type or pure primitive when multiple Framework owners need the neutral contract; keep App-domain helpers in the App.

## Lifecycle and composition

Pure helpers return detached deterministic values. Registries own explicit registration and reverse-order retryable cleanup. Importing Utils creates no listener, timer, or mutable product runtime.

## Learn more

- [Complete package guide](https://github.com/karote00/asyra/blob/main/docs/public/reference/packages/utils.md)
- [Framework release support](https://github.com/karote00/asyra/blob/main/docs/ai/framework/RELEASE_SUPPORT.md)

## Support and policy

GitHub Discussions is the intended public channel for community conversation and
general help. Discussions is not enabled for this repository yet, so there is
currently no public community support destination. GitHub Issues are not a
general public support channel. External pull requests are not accepted by
default. Community participation creates no SLA or response deadline.

You may use, inspect, and fork the package under the [MIT License](https://github.com/karote00/asyra/blob/main/LICENSE).
Read the <a href="https://github.com/karote00/asyra/blob/main/SUPPORT.md" target="_blank" rel="noopener noreferrer">support policy</a>.
For suspected vulnerabilities, follow the <a href="https://github.com/karote00/asyra/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">security policy</a> and report privately.
