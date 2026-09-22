# `@asyra/factory`

Canonical transaction grouping, rollback, Undo/Redo history, replay, and local shared-publication infrastructure.

## Requirements

- Node.js 24.x
- Yarn 4.3.1 for this repository's maintained workflows

## Install

```bash
npm install @asyra/factory
```

```ts
import factory from '@asyra/factory'
```

Use only the package root and the explicitly documented public subpaths.

## Owns

- the active transaction journal, one outer commit, validation, rollback, history, replay, and publication evidence

## Does not own

- product command meaning, package invariants, persistence durability, collaboration transport, or App conflict policy

## Start here

Use Factory whenever one intended canonical action needs atomicity, rollback, history, or shared publication. Core already coordinates the common App instance.

## Lifecycle and composition

Nested starts join one outer journal. A valid outer end creates at most one Undo entry; failure or rejected validation runs inverses in reverse order. Undo/Redo replays owner-issued evidence without creating a parallel mutation route.

## Learn more

- [Complete package guide](https://github.com/karote00/asyra/blob/main/docs/public/reference/packages/factory.md)
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
