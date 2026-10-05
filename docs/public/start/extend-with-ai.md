# Extend Asyra with an AI coding agent

Asyra is designed so a product owner and an AI coding agent can work together:
you define the domain outcome and boundaries; the agent follows public
Framework contracts, existing app patterns, and formal product tests.

AI assistance does not make ownership optional. An agent should never invent a
second state store, mutate a package owner directly, bypass a Feature or
transaction, expose a server credential, or treat a future roadmap API as if
it already exists.

## Use Asyra Skill with your coding agent

Asyra Skill supplies shared development instructions and maintained reference
guides to your existing coding agent. Plugins provide tool-specific installation
wrappers around the same Skill. See the
[Asyra Skill installation guide](../../../plugins/asyra-agent/README.md) for
available routes, candidate versions and actual host validation status.
The host agent owns reasoning, implementation and verification. This development
Skill is separate from the optional in-app `@asyra/ai-agent-runtime`.

## Describe the product outcome

Tell the agent what you want the product to do, which project to work in, and
any constraints you already know. Describe the result you expect and existing
behavior or saved data that must remain usable. You do not need to name Asyra
packages, Features, canonical routes or test commands.

For example: “Add a review status to each proposal. Keep my saved proposals
working and let me undo and redo status changes. Keep the app simple, without
accounts, collaboration or AI chat.”

## The agent derives the technical plan

Before implementation, the agent reads the project's instructions, architecture,
installed public APIs and closest existing behavior. It derives a bounded plan:

1. **Outcome** - translate the request into observable app behavior.
2. **Owner** - identify the app module, Feature, schema or adapter to change.
3. **Canonical route** - trace the supported Core/common API and transaction
   boundary that owns the write.
4. **Composition** - inspect active optional capabilities and preserve the
   user's requested scope.
5. **Proof** - select the project's applicable tests, types, lint and build;
   add a permanent regression when the affected behavior lacks coverage.
6. **Exclusions** - preserve unrelated work and avoid private imports, duplicate
   state, UI-only fixes, secrets and unrelated refactors.

The agent asks about unresolved product choices that affect the result. It
should investigate technical details available in the project itself rather
than require the user to design the architecture.

## Where this runs

The collaboration with an AI coding agent happens in your generated app
repository. The agent should edit the app-owned Feature, schema, common API,
adapter, UI, and tests identified in the bounded implementation plan. Framework
package source is outside that boundary unless you are intentionally developing the Framework.

## Implementation

The agent identifies or defines an App-owned public boundary before connecting
UI or AI behavior. The following developer example illustrates a review-domain
action; the user does not need to provide this code:

```ts
import { defineFeature } from '@asyra/core'

type ReviewState = 'pending' | 'approved'
const state = new Map<string, ReviewState>([['review-1', 'pending']])

export const reviewActions = defineFeature('app.reviewActions', undefined, {
  priority: 30,
  exclusive: true,
  api: {
    setStatus(id: string, status: ReviewState) {
      if (!state.has(id)) throw new Error(`Unknown review: ${id}`)
      state.set(id, status)
      return { id, status }
    }
  }
})
```

In a real document-backed feature, the body calls the generated app's common
API so Factory can own the transaction and Undo evidence. The implementing agent
must reuse that route instead of preserving the illustrative local `Map`.

## Flow

1. You state the observable product outcome and constraints.
2. The agent finds the maintained app Feature and common API that already own
   the closest behavior.
3. It adds or extends one typed API, then connects UI or AI intent to it.
4. Formal tests prove success, rejected input, rollback, and disabled optional
   systems.
5. You review the product behavior and ownership boundary before accepting the
   change.

## Expected result

The change reads like an ordinary app feature: the same canonical API serves a
person, an automation, or an AI action; invalid work produces no partial
state; and removing an optional provider does not change the document owner.

## Start from maintained contracts

For a generated app extension, the agent reads the target's architecture guide
and closest existing Feature in `src/features`. For an existing Design product,
[Create a complete design app](create-design-app.md) provides the relevant
starting context. For Framework composition, the agent selects the applicable
task guide and preserves its owner, flow, failure behavior and public API
boundary. The user does not need to select technical guides in advance.

The agent should inspect current public entrypoints and declarations before
naming an API. Package-private source imports and cross-package relative paths
are not supported consumer contracts.

## Keep AI-created content canonical

When AI creates or edits product information at runtime, register bounded
actions through `@asyra/ai-agent-runtime`, check app-owned permission or
confirmation, enter the same Feature/common-API route a person uses, and commit
one intended transaction. That keeps the result editable, reversible,
collaborative, and persistable through the ordinary owner model.

See [Build registered AI actions](../build/ai-actions.md) and
[Build app-owned retrieval and action](../build/app-retrieval-action.md). Do not
send provider keys to the browser or let generated code call an unregistered
mutation surface.

## Review the result

Before accepting an AI-authored change, verify:

- the app-domain outcome is represented in a schema or product contract;
- public package imports are used;
- one intended action produces one intended undo commit;
- failure rolls back or returns the declared error;
- disabled optional systems remain genuinely absent;
- load, collaboration, and AI routes do not create alternate canonical owners;
  and
- focused tests, typecheck, lint, and the relevant build pass.

## Canonical sources

- [Framework workflow](../../ai/framework/WORKFLOW.md)
- [Asyra Design golden paths](../../ai/apps/asyra-design/golden-paths/README.md)
- [Generated Feature registry](../../../create-app/asyra-design/template/src/features/index.ts)

## Next

- [Learn canonical state ownership](../learn/canonical-state.md)
- [Build a transaction-safe Feature](../build/feature-session.md)
