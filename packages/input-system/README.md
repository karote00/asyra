# `@asyra/input-system`

Environment-neutral semantic input registration with explicit browser host attachment.

## Requirements

- Node.js 24.x
- Yarn 4.3.1 for this repository's maintained workflows

## Install

```bash
npm install @asyra/input-system
```

```ts
import inputSystem, { keyMap } from '@asyra/input-system'
```

Use only the package root and the explicitly documented public subpaths.

## Owns

- normalized keyboard, pointer, wheel, and mapped-event routing
- instance-owned browser attachment, switching, detach, reset, and disposal

## Does not own

- Feature decisions, scene mutations, render-layer behavior, context-menu policy, or unconditional native-menu suppression

## Start here

Import or construct it without browser globals; attach a browser host only when the runtime actually needs browser input.

## Lifecycle and composition

Attachment adds listeners to the selected host and target. Reattachment is idempotent and target switching removes prior listeners first. `reset()` preserves attachment; `dispose()` detaches and clears transient state. Node-safe construction does not imply Headless Core support.

## Learn more

- [Complete package guide](https://github.com/karote00/asyra/blob/main/docs/public/reference/packages/input-system.md)
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
