# Adopt canonical property and AI handoffs

## Scope and evidence

Pending guide revision 1, 2026-10-25. This records the accumulated development
branch delta from `180d93af5` to `c2f1a8e10fe7a762b06065d16148a74855a7dad7`; it is not a
published package range, deployment or release-readiness claim. The hosted Asyra
Design App and Framework package consumers are different owners. Before adoption,
compare the consumer's actual installed declarations and saved-data policy with
the selected release artifacts. No package upgrade or storage mutation is implied.

## Applicability and decisions

| Consumer | Candidate contract | Integration decision |
| --- | --- | --- |
| Core property editors | Public target read/update/reset/detach/share intents and mutation receipts distinguish accepted targets from actual changes. | Resolve current property targets through Core; decide instance override versus shared-source edit explicitly. Do not infer success from a void return, duplicate property registries or change independent fills into shared fills. |
| AI runtime hosts | Interrupted executions may preserve completed tool results; Knowledge results may reference caller-held complete results. | Retain actual completed receipts, report partial work, and retry only known unfinished operations. Resolve `retainedFrom` from the same valid session result, not an arbitrary cache. |
| Knowledge hosts | `children` navigates topics; `references`/`extends` compose required content. `reuseFrom` explicitly asserts retained complete results; `rehydrate` restores content. | Do not treat navigation children as mandatory reads. After context loss, invalidate the session context or rehydrate; never claim missing dependency text was delivered. Existing calls without reuse handles remain valid. |
| Scene/render/UI subscribers | Canonical batch and property changes preserve identity, ordering and immutable published snapshots; derived hierarchy work is shared. | Use public event and subscription types. Preserve complete batch membership; do not mutate published arrays or reproduce the hierarchy in another state store. |
| Geometry consumers | Shared bounds account for transformed analytic ovals; projected source data becomes ordinary editable elements. | Consume the existing geometry owner. Preserve rotations, source material coordinates, parent transforms and explicit polygon geometry; do not route creation directly to a renderer. |

Use public package exports. Retain App-owned field meanings, defaults, custom
Features, target selection and persistence/load hooks. Do not map similarly named
fields automatically, replace local data with computed values, or reset existing
extensions. No new saved-document migration is declared by these handoff changes;
verify real documents and any consumer-specific extensions before deciding that
an existing migration can be omitted. Uncertain receipts require reconciliation,
not replay. A transport success is neither a completed mutation nor visual approval.

Asyra Design's optional draft forms (motifs, patterns, analytic faces and face-bound
surface grids), retained-source partition recovery, compact receipts and review
handoffs are App-owned. Existing inline geometry remains legal. Obtain the current
selected tool contract through discovery; do not copy private App construction
code into Framework consumers. Face references select same-scope source geometry,
not persisted relationships or shared material identity.

## Verification and recovery

For adoption, exercise the consumer's real read/write and failure paths: shared
source edits versus independent overrides; valid no-op; rejected/stale target;
cancellation after partial work; remaining-only recovery; Undo/Redo; collaboration;
and save/reload with explicit values and App extensions intact. Test retained
Knowledge with complete, missing, stale and invalidated dependencies and refresh.
Compare geometry, paint, order and parents, not only object counts or invocation
success. Test immutable subscription snapshots and work counts at their owner.

The branch contains formal tests for these contracts. The current face-boundary
slice passed 1,706 server harness cases and its browser recovery/collaboration/
Undo/reload case; two unrelated opt-in cases were skipped. Those results do not
establish this consumer's adoption, public-registry compatibility or model behavior.
Keep failed/incomplete adoption pending, retain original documents and receipts,
and use the existing App migration/transaction mechanisms if an actual consumer
migration is required. Record tested source/artifact identities, selected behavior,
remaining differences and guide revision in the consumer's existing adoption note.

## Canonical sources

The following links identify the inspected development source, not an official
published package or supported upgrade range:

- <a href="https://github.com/karote00/asyra/blob/c2f1a8e10fe7a762b06065d16148a74855a7dad7/packages/core/src/types/property-intents.ts" target="_blank" rel="noopener noreferrer">Core property intents</a>
- <a href="https://github.com/karote00/asyra/blob/c2f1a8e10fe7a762b06065d16148a74855a7dad7/packages/core/src/types/property-mutation-receipt.ts" target="_blank" rel="noopener noreferrer">Canonical mutation receipts</a>
- <a href="https://github.com/karote00/asyra/blob/c2f1a8e10fe7a762b06065d16148a74855a7dad7/packages/ai-agent-runtime/src/knowledge-types.ts" target="_blank" rel="noopener noreferrer">Knowledge session, dependency and reuse contracts</a>
- <a href="https://github.com/karote00/asyra/blob/c2f1a8e10fe7a762b06065d16148a74855a7dad7/packages/ai-agent-runtime/src/provider.ts" target="_blank" rel="noopener noreferrer">Provider execution and interrupted results</a>
- <a href="https://github.com/karote00/asyra/blob/c2f1a8e10fe7a762b06065d16148a74855a7dad7/packages/utils/src/render/geometry-bounds.ts" target="_blank" rel="noopener noreferrer">Shared transformed geometry bounds</a>
- <a href="https://github.com/karote00/asyra/blob/c2f1a8e10fe7a762b06065d16148a74855a7dad7/packages/preset/src/subscriptions/data-channel.ts" target="_blank" rel="noopener noreferrer">Preset subscription projection</a>
- <a href="https://github.com/karote00/asyra/blob/c2f1a8e10fe7a762b06065d16148a74855a7dad7/apps/asyra-design/server/design-construction-schema.ts" target="_blank" rel="noopener noreferrer">App-owned construction contracts</a>
