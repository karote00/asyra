# `@asyra/ui-context`

Optional derived UI-property registration and aggregation runtime.

## Requirements

- Node.js 24.x
- Yarn 4.3.1 for this repository's maintained workflows

## Install

```bash
npm install @asyra/ui-context
```

```ts
import uiContext from '@asyra/ui-context'
```

Use only the package root and the explicitly documented public subpaths.

## Owns

- derived property definitions, compute callbacks, managed observables, aggregate/mixed/empty semantics, and cleanup

## Does not own

- canonical model state, mirror stores, automatic controls, field mappings, App command policy, or polling-based recompute

## Start here

Use it when panels and controls need reusable derived values. A custom App may derive directly from public owner subscriptions.

## Lifecycle and composition

Registration creates one managed derived source; canonical dependency changes request recompute and only the final derived value is published. Compute failure is a UI derivation failure and cannot replace or roll back canonical state.

## Learn more

- [Complete package guide](https://github.com/karote00/asyra/blob/main/docs/public/reference/packages/ui-context.md)
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
