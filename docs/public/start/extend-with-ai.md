# Extend Asyra with an AI coding agent

Asyra is designed so a product owner and an AI coding agent can work together:
you define the domain outcome and boundaries; the agent follows public
Framework contracts, existing app patterns, and formal product tests.

AI assistance does not make ownership optional. Within an Asyra-owned domain,
an agent must preserve canonical authority and the supported Feature/transaction
route. It must not expose server credentials or treat future roadmap APIs as
available contracts. Existing-product adoption starts with the assessment below.

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

## Find capabilities from a product problem

Use this index when assessing feasibility, improving an existing product or
considering Asyra adoption. These are investigation routes, not diagnoses or a
checklist of packages to install. Read the relevant route and its linked guide;
an ordinary feature request does not require reading every capability.

| Observed need or symptom                              | Candidate mechanism                                 | Decision guide                                        |
| ----------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Unrelated views or consumers update together          | Scoped observation and derived values               | [Localize updates](#localize-updates)                 |
| Repeated scans, parsing, geometry or conversions      | Shared projections and lifetime-owned results       | [Reuse computation](#reuse-computation)               |
| Several stores disagree, or invalid data spreads      | Canonical owners, schemas and admission             | [Establish data authority](#establish-data-authority) |
| Partial operations, fragmented Undo or cancellation   | Feature sessions and transactions                   | [Group intended actions](#group-intended-actions)     |
| New inputs or features duplicate business logic       | Registered Features and common APIs                 | [Extend behavior](#extend-behavior)                   |
| Saving, loading or synchronization loses meaning      | Publications, load hooks and App delivery policy    | [Preserve durable meaning](#preserve-durable-meaning) |
| Old callbacks or resources survive replacement        | Owned startup, cancellation and teardown            | [Bound runtime lifetime](#bound-runtime-lifetime)     |
| A new presentation or execution environment is needed | Projections and verified provider/runtime contracts | [Check environment fit](#check-environment-fit)       |

### Localize updates

**Use when:** the normal path broadcasts broad changes, rebuilds unchanged
snapshots or makes consumers read unrelated entities. Trace work before React
or another view layer: fewer renders can conceal unchanged upstream cost.

**Asyra support:** canonical change observations feed scoped projections;
registered UI properties expose reusable derived values. App composition owns
the source subscriptions and recompute triggers. UI Context does not generate
controls, field mappings or an automatic bridge from an arbitrary store.
Choose property/schema granularity from data meaning, then select observation
boundaries; do not split saved identities merely because a control is slow.

**App duties and limits:** identify consumers and dependencies, preserve stable
unchanged outputs, choose empty/mixed/selection policy when relevant, and own
cleanup. Keep incomplete input local. A UI property is not a second writable
document. Existing public subscriptions may suffice without UI Context. DOM
volume, layout cost and network delay may need improvements outside Asyra.

**Proof:** change one input and count canonical reads, projections,
notifications and consumer updates. Unrelated inputs do no unnecessary work;
relevant edits, load and Undo/Redo still refresh the correct outputs.

Read [composition and update boundaries](custom-composition.md#scope-updates-before-they-reach-react),
[UI Context](../reference/packages/ui-context.md), and the
[Starter observation example](../../../apps/starter-app/docs/ARCHITECTURE.md#listening-to-ui-properties-and-items).

### Reuse computation

**Use when:** several consumers rebuild the same result, or a frequent query
repeats invariant preparation. Examples include import preview and acceptance,
simulation geometry, derived lists and report generation; no UI is required.

**Asyra support:** owner publications and projections can identify relevant
changes and feed shared results. App code still owns domain computation and
its reuse policy. Calling the same helper or registering several UI properties
does not share the computed output automatically.

**App duties and limits:** trace the actual caller, including constructors and
helpers. Identify semantic inputs, producer, consumers and result lifetime.
Reuse valid admitted output before introducing a cache. If retention is needed,
define invalidation, memory bounds and disposal; include key construction and
lookup cost. A per-request cache cannot share work across requests. Preserve
validation at real import, worker and remote trust boundaries.

**Proof:** compare cold, unchanged-repeat and changed-dependency runs against
fresh computation; measure scans/builds/bytes as well as output equality.
Multiple consumers reuse the same valid result. Cancellation and replacement
cannot deliver stale results. An existing algorithm improvement may be enough
without adopting Framework state or history.

Read [computation ownership in composition](custom-composition.md#reuse-admitted-results-at-their-real-lifetime)
and [integration proofs](custom-composition.md#prove-the-integration-not-just-each-helper).

### Establish data authority

**Use when:** several mutation paths disagree, schema validation is duplicated,
or saved values and displayed values diverge.

**Asyra support:** canonical property/component owners and schema registration
provide data definitions, validation and relation contracts. They do not choose
the product's field meaning or migrate an existing database automatically.

**App duties and limits:** classify a value by its authoritative source,
persistence/history needs and whether it is authored, derived or an unfinished
draft. The same field name can represent any of these. Preserve stable IDs and
saved semantics; define admission and migrations before moving write authority.
A read-only projection is acceptable; two competing editable stores are not.
Do not migrate a working store solely to display an Asyra-shaped folder tree.

**Proof:** valid and invalid writes, legacy and invalid loads, unaffected fields,
Undo/Redo and all active mutation paths agree on the same owner.

Read [canonical state](../learn/canonical-state.md),
[property/schema registration](../build/custom-schema.md) and
[product migration](../build/persistence-migration.md).

### Group intended actions

**Use when:** one operation can leave partial state, produce accidental history
steps or fail to settle cancellation. This applies to bulk edits, imports,
drags and automation as well as forms.

**Asyra support:** Feature sessions coordinate interactions; Factory transactions
own canonical commit, rollback and history. App code defines what one intended
action means and how cancellation behaves. External writes, emails or network
side effects are not automatically reversed by canonical rollback.

**App duties and limits:** preserve the existing history route in an Asyra App.
For adoption, decide where old history ends and the new route begins; do not
mirror stacks. Use verified plural operations for bulk work where appropriate:
one transaction around many singular calls groups Undo but does not eliminate
repeated validation or preparation. Detached async work must not hold a
canonical transaction open while waiting for external results.

**Proof:** one accepted action has the intended commit; failure/cancel follows
the chosen policy; no-op and rejected work have no accidental history. Replay
updates all dependent consumers. Measure bulk work separately from commit count.

Read [Feature sessions](../build/feature-session.md),
[transaction ownership](../learn/transactions-and-durability.md) and
[complete data paths](custom-composition.md#build-one-complete-data-path).

### Extend behavior

**Use when:** UI, shortcuts, automation or AI reproduce the same mutation logic,
or interaction modes need explicit arbitration.

**Asyra support:** registered Features and named App APIs separate intent from
canonical changes; conditions, priority, exclusivity and session lifecycle
coordinate applicable actions. Optional AI actions can enter the same route.
This is not automatic business-rule discovery or arbitrary runtime hot-loading.

**App duties and limits:** retain domain permissions, command meaning and
unsupported-action handling. Verify registration timing and the target's public
exports. Reuse the existing owner instead of adding forwarding-only layers.
A simple independent function need not become a Feature just because it exists.
Adding AI providers is unnecessary when the request is only about maintainability.

**Proof:** each intended input reaches the same action owner; conflicting or
inactive actions follow their declared policy. Optional adapters can be absent
without a hidden fallback mutation path.

Read [Feature intent and arbitration](../learn/intent-and-features.md),
[Feature implementation](../build/feature-session.md) and, only when requested,
[registered AI actions](../build/ai-actions.md).

### Preserve durable meaning

**Use when:** load compatibility breaks, saves race, every small change captures
the whole document, or remote changes echo or bypass local rules.

**Asyra support:** transaction publications, Core load admission/hooks and
persistence/collaboration contracts provide integration boundaries. A committed
transaction is not an acknowledgement from durable storage or another actor.

**App duties and limits:** own schema versions, migration meaning, provider,
authentication, delivery order, acknowledgement, retries and recovery. Separate
canonical document changes from transient presence. Do not assume a provider
or an Undo boundary installs a backend, autosave queue or complete conflict
policy. Keep existing storage when it meets the requirement.

**Proof:** ordered pending writes, failures/retries, legacy load, invalid-load
preservation and restart recovery. Undo/Redo use the intended delivery path;
inbound changes do not echo. Measure captured bytes and write count when reducing
save cost; a faster empty-document save does not establish scaling.

Read [incremental persistence](custom-composition.md#persist-publications-not-repeated-full-snapshots),
[migration](../build/persistence-migration.md) and
[collaboration](../build/collaboration.md) when synchronization is required.

### Bound runtime lifetime

**Use when:** reopening a document duplicates subscriptions, startup races with
replacement, cancelled jobs publish late results or resources accumulate.

**Asyra support:** Core and composed owners expose lifecycle/cleanup boundaries.
App orchestration must connect its own subscriptions, providers and async work
to the correct document/runtime lifetime. Framework teardown cannot forcibly
terminate an arbitrary uncooperative Promise or guard every retained closure.

**App duties and limits:** identify resource ownership and retirement conditions;
await startup settlement and teardown before the successor starts. Reject stale
results using the relevant lifetime/identity. Cancellation, ordinary document
load and complete runtime replacement are different operations. A local effect
cleanup may solve the issue without changing the canonical architecture.

**Proof:** failed startup, cancellation during work, repeated disposal,
replacement and delayed callbacks; every owned resource is released and no old
callback mutates the successor.

Read [document lifetime](custom-composition.md#bind-everything-to-the-document-lifetime)
and [Starter startup/teardown](../../../apps/starter-app/docs/ARCHITECTURE.md#loading-startup-and-teardown).

### Check environment fit

**Use when:** the same information needs another presentation, renderer,
non-visible processing or a new deployment environment.

**Asyra support:** canonical owners and projections separate information from
visual output; render-engine providers define concrete rendering boundaries.
That separation does not establish that the entire Core runtime starts in Node,
a worker or an isolated second runtime.

**App duties and limits:** inspect the actual package exports, transitive
requirements, browser/provider assumptions and lifecycle. Distinguish public
capability, lower-level composition requiring proof and future roadmap. Do not
invent Headless Core, automatic worker isolation or an adapter for an arbitrary
legacy store. No canvas is not the same guarantee as no Render dependency.

**Proof:** a small representative run in the requested environment verifies
startup, real input/output, missing-provider failure and cleanup before broad
migration. Mark unsupported or unresolved boundaries explicitly.

Read [projection/provider ownership](../learn/projection-registration-replacement.md),
[render composition](../build/render-boundary.md) and
[current runtime limits](../learn/runtime-boundaries-roadmap.md).

## Assess an existing project before changing it

For an existing Asyra App, inspect its installed APIs and current owners; improve
the affected path without rebuilding the App from Starter. For a non-Asyra
product, first map its authoritative store, commands, history, persistence,
subscriptions and runtime constraints. The absence of an Asyra Feature is not
itself a defect. Starter is a reference for supported composition, not a mandate
to replace the target's whole architecture.

Compare only plausible options: improve the existing mechanism, selectively
adopt a verified Asyra capability, or migrate a bounded domain to Asyra canonical
owners. For each viable option explain benefit, dependency/lifecycle cost,
compatibility risks and proof needed. A lower-level package's public entrypoint
does not prove drop-in compatibility with the target runtime. Inspect its actual
contract; use Core facades for work coordinated by an existing Core lifetime.
Do not create another Core instance inside each widget.

For migration, identify the exact concern being transferred and its old/new
write authority, IDs, saved format, history and delivery boundaries. A staged
read-only adapter can coexist with the old owner. Before enabling new writes,
define the cutover and retire the competing old path. Establish a tested rollback
or an explicitly accepted one-way data migration; do not promise that reverting
code can read newly written data. Do not discard existing history silently.

A useful assessment reports the observed cause or missing evidence, candidate
capability and source, alternatives, the chosen boundary, integration costs and
the smallest proof. Distinguish confirmed fit, fit requiring an experiment and
unsupported behavior. If the user asked only for feasibility, stop at that
assessment. Do not install dependencies or implement a migration from the
assessment request alone.

## Find deeper guidance without copying an app

The linked guides provide public contracts and maintained source references.
Use the installed version's declarations/exports to verify a particular API.
Bundled references describe their recorded source snapshot; an online `main`
link may describe a different release. If a required API, example or environment
proof is unavailable, identify the gap rather than complete it from a guessed
method name. Ordinary consumers do not need an Asyra contributor checkout.

Use Starter for complete ownership/lifetime examples and larger apps for
specific concepts. An internal source example may depend on app-specific
providers, singleton state or teardown assumptions; trace these before reuse.
Do not copy internal governance, an entire app, a global signal cache or a
private package import into a consumer as a shortcut. The advice above adapts
Asyra's computation-reuse and update-boundary practices; the target retains its
own tooling, UI framework and coding conventions.

## The agent derives the technical plan

For the chosen Asyra implementation scope, the agent reads the project's instructions, architecture,
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

The collaboration with an AI coding agent happens in the target product
repository, whether generated from Starter or already established. The agent should edit the app-owned Feature, schema, common API,
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
