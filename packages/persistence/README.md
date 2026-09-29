# `@asyra/persistence`

Read-only load-source, replaceable provider, and synchronous load/save hook contracts with browser and memory references.

## Requirements

- Node.js 24.x
- Yarn 4.3.1 for this repository's maintained workflows

## Install

```bash
npm install @asyra/persistence
```

```ts
import type { DocumentLoadSource } from '@asyra/persistence'
```

Use only the package root and the explicitly documented public subpaths.

## Owns

- load-source/provider contracts, synchronous hook types, and explicit IndexedDB, Local Storage, and memory provider behavior

## Does not own

- Core save scheduling, canonical validation/apply, App version policy, collaboration logs, authorization, or production topology

## Start here

Compose a provider when the App needs a local or custom storage boundary; treat reference providers as examples rather than production backend policy.

## Lifecycle and composition

`load()` returns untrusted data. App migration and Core/package validation happen before canonical apply. Provider failure remains separate from runtime transaction settlement, and explicit save data goes only where the App sends it.

## Learn more

- [Complete package guide](https://github.com/karote00/asyra/blob/main/docs/public/reference/packages/persistence.md)
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
