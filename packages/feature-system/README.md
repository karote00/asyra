# `@asyra/feature-system`

Deterministic Feature registration, priority, exclusivity, interaction sessions, cancellation, and non-mutating programmatic tasks.

## Requirements

- Node.js 24.x
- Yarn 4.3.1 for this repository's maintained workflows

## Install

```bash
npm install @asyra/feature-system
```

```ts
import { defineFeature, getFeature } from '@asyra/feature-system'
```

Use only the package root and the explicitly documented public subpaths.

## Owns

- Feature definitions, trigger arbitration, one serialized interaction queue, sessions, cancellation policy, and task abort ownership

## Does not own

- raw environment listeners, App command meaning, canonical package mutation, transaction history, or model-provider policy

## Start here

Compose it when inputs or commands require deterministic arbitration, a continuous session, or cancellable planning work.

## Lifecycle and composition

A session starts, updates, and then ends or cancels before conflicting work. Cancellation is explicit; handler errors and timeouts enter forced cleanup. Programmatic tasks are non-mutating and never replace canonical Feature/API execution.

## Learn more

- [Complete package guide](https://github.com/karote00/asyra/blob/main/docs/public/reference/packages/feature-system.md)
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
