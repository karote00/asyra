# `@asyra/selection`

Canonical named selection-channel state and explicit selection queries and operations.

## Requirements

- Node.js 24.x
- Yarn 4.3.1 for this repository's maintained workflows

## Install

```bash
npm install @asyra/selection
```

```ts
import selection from '@asyra/selection'
```

Use only the package root and the explicitly documented public subpaths.

## Owns

- selected entity ids per registered channel plus deterministic replace, add, remove, clear, and query semantics

## Does not own

- tool decisions, App eligibility, render overlays, entity mutation, UI state, or automatic builtin channel registrations

## Start here

Register the selection channels your product needs, or use the optional official defaults installed by Preset.

## Lifecycle and composition

Registration creates stable channel metadata. Selection operations update only that channel; duplicate or unknown registration and invalid input fail explicitly. Removing projection packages does not transfer selection ownership to UI state.

## Learn more

- [Complete package guide](https://github.com/karote00/asyra/blob/main/docs/public/reference/packages/selection.md)
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
