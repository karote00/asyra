# @asyra/asyra-design

## Pending bounded continuation evaluation

```update-note
{
  "change": "bounded-continuation-evaluation",
  "owner": "Asyra Design evaluation",
  "summary": "Observe ordinary two-turn continuation under one shared deadline, retain reports and documents, and keep the rejected Knowledge-consumer experiment covered by permanent cost regressions.",
  "sources": [
    "apps/asyra-design/package.json",
    "apps/asyra-design/server/__tests__/information-delivery.integration.test.ts",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/rejected-knowledge-consumer-20261025.json",
    "apps/asyra-design/test-data/knowledge-evaluation/__tests__/consultation.test.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/run-consultation.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "These are explicitly authorized diagnostic and deterministic test entrypoints. No App consumer migration or automatic model execution is introduced."
}
```

## Pending retained refinement delivery

```update-note
{
  "change": "retained-refinement-delivery",
  "owner": "Asyra Design context and tool validation",
  "summary": "Preserve element and identity result modes through retained refinement before output validation. Label output failures accurately without asking callers to replay completed operations.",
  "sources": [
    "apps/asyra-design/src/common-apis/retained-design-context.ts",
    "apps/asyra-design/src/ai/tool-schema.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "apps/asyra-design/server/__tests__/basic-api-contracts.test.ts",
    "apps/asyra-design/server/__tests__/local-tool-invocation.test.ts",
    "apps/asyra-design/server/__tests__/local-tool-library-tools.test.ts",
    "apps/asyra-design/server/__tests__/local-tool-library.test.ts",
    "apps/asyra-design/server/__tests__/operation-input-schema.test.ts",
    "apps/asyra-design/server/__tests__/tool-contract-assertions.ts",
    "apps/asyra-design/server/local-tool-host.ts",
    "apps/asyra-design/server/local-tool-invocation.ts",
    "apps/asyra-design/server/operation-input-schema.ts",
    "apps/asyra-design/src/ai/__tests__/runtime-input.test.ts",
    "apps/asyra-design/src/ai/runtime-input.ts",
    "apps/asyra-design/src/ai/tool-contract.ts",
    "apps/asyra-design/src/common-apis/__tests__/retained-design-context.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Existing query, paging, refinement and retained fill operations remain valid. No document format or user workflow migration is required."
}
```

## Pending settled conversation context

```update-note
{
  "change": "settled-conversation-context",
  "owner": "Asyra Design conversation",
  "summary": "Deliver bounded complete prior conversation messages to successor requests through the existing Feature and provider. Preserve actual outcomes, explicit omissions, current target validation and request-scoped tool sessions.",
  "sources": [
    "apps/asyra-design/src/ai/conversation.ts",
    "apps/asyra-design/src/ai/__tests__/conversation.test.ts",
    "apps/asyra-design/server/ai-domain-prompt.ts",
    "apps/asyra-design/server/local-ai-provider.ts",
    "apps/asyra-design/server/__tests__/local-ai-provider.test.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Existing conversations and tools remain in use. No new persisted format, native-thread reuse or document mutation is introduced; live model adoption remains unobserved."
}
```

## Pending attachment reference preparation

```update-note
{
  "change": "attachment-reference-preparation",
  "owner": "Asyra Design image owner",
  "summary": "Deliver retained attachment identity initially and prepare oriented pixels only when explicit reference uses consume them; reuse admitted results and preserve AI suitability judgments and failed-source recovery.",
  "sources": [
    "apps/asyra-design/server/local-image-tools.ts",
    "apps/asyra-design/server/local-ai-provider.ts",
    "apps/asyra-design/server/local-operation-tools.ts",
    "apps/asyra-design/server/local-design-review.ts",
    "apps/asyra-design/server/ai-domain-prompt.ts",
    "apps/asyra-design/server/__tests__/local-image-tools.test.ts",
    "apps/asyra-design/server/__tests__/local-ai-provider.test.ts",
    "apps/asyra-design/server/__tests__/local-operation-tools.test.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "apps/asyra-design/flow-contracts.json",
    "tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Existing App tools and request-local image ownership remain in use. Model-facing guidance describes automatic preparation and independent diagnostics; no new tool, persistent format or migration is required."
}
```

## Pending Knowledge source delivery

```update-note
{
  "change": "knowledge-source-delivery",
  "owner": "Asyra Design Knowledge delivery",
  "summary": "Deliver exact source identities with one complete same-reply provenance catalog; preserve overrides, canonical retained results, paging and read-only recovery.",
  "sources": [
    "apps/asyra-design/server/local-knowledge.ts",
    "apps/asyra-design/server/__tests__/local-knowledge.test.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/knowledge-source-delivery-20261025.json",
    "apps/asyra-design/flow-contracts.json",
    "tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "The revised App read tool ships same-reply resolution guidance. Framework source results, document state and execution inputs remain unchanged; no additional query or migration is required."
}
```

## Pending selected review usage

```update-note
{
  "change": "selected-review-usage",
  "owner": "Asyra Design tool discovery",
  "summary": "Deliver canonical capture, bind and record contracts through existing selected usage, with owner examples and retained next-invocation recovery; preserve full and field discovery and existing review semantics.",
  "sources": [
    "apps/asyra-design/flow-contracts.json",
    "apps/asyra-design/package.json",
    "apps/asyra-design/server/__tests__/design-review-stages.test.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/review-usage-20261025.json",
    "apps/asyra-design/server/__tests__/local-design-workflow.test.ts",
    "apps/asyra-design/server/__tests__/review-usage.integration.test.ts",
    "apps/asyra-design/server/design-workflow-discovery.ts",
    "apps/asyra-design/server/local-design-review.ts",
    "apps/asyra-design/server/local-operation-tools.ts",
    "tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Internal App tool discovery now accepts owner operations without construction nodes. Existing execution inputs, evidence lifetimes, document data and independent discovery paths remain valid; no consumer migration is required."
}
```

## Pending ordinary creation input normalization

```update-note
{
  "change": "ordinary-creation-input-normalization",
  "owner": "Asyra Design creation integration",
  "summary": "Remove unused creation input envelopes and the second projection while retaining the existing Core normalization owner, defaults, supplied/generated IDs, input isolation and complete owner results.",
  "sources": [
    "apps/asyra-design/server/__tests__/creation-results.integration.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Public creation inputs and output, validation, geometry, history and retained-source recovery remain unchanged. No migration, new cache or additional model exchange is required."
}
```

## Pending ordinary creation result handoff

```update-note
{
  "change": "ordinary-creation-result-handoff",
  "owner": "Asyra Design creation results",
  "summary": "Forward the existing Scene Tree frozen ordered creation result through Core and App without redundant ID array copies; verify actual saved-input flows and immutable receipts.",
  "sources": [
    "apps/asyra-design/src/common-apis/element/apis.ts",
    "apps/asyra-design/src/common-apis/element/__tests__/create-element.test.ts",
    "apps/asyra-design/server/__tests__/creation-results.integration.test.ts",
    "apps/asyra-design/package.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Creation inputs, ordered IDs, frozen isolation, history and retained-source recovery are unchanged. No migration or new model exchange is required."
}
```

## Pending computed snapshot selection

```update-note
{
  "change": "computed-snapshot-selection",
  "owner": "Asyra Design mechanical inspection",
  "summary": "Carry computed field selection to the existing snapshot owner before materialization, avoiding omitted-field copies while retaining detached full reads and mechanical evidence behavior.",
  "sources": [
    "apps/asyra-design/server/__tests__/mechanical-inspection.integration.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Existing Core query inputs and outputs, persistence and transaction behavior are unchanged. No new cache, model exchange or migration is required."
}
```

## Pending mechanical review structural reads

```update-note
{
  "change": "mechanical-review-structural-reads",
  "owner": "Asyra Design mechanical review",
  "summary": "Use existing metadata and complete child queries for mechanical review, proving fewer canonical saves and unused property-reference copies while preserving verdicts and evidence recovery.",
  "sources": [
    "apps/asyra-design/src/common-apis/design-review.ts",
    "apps/asyra-design/server/__tests__/mechanical-inspection.integration.test.ts",
    "apps/asyra-design/package.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Tool inputs, outputs, geometry, saved data and existing full-data APIs are unchanged; no migration, new cache or model-facing exchange."
}
```

## Pending architecture regression coverage

```update-note
{
  "change": "architecture-regression-coverage",
  "owner": "Asyra Design validation",
  "summary": "Verify the exact pure Group bounds bundle and run every maintained server regression through ordinary validation, including offline native handoff cases.",
  "sources": [
    "apps/asyra-design/__tests__/framework-runtime-boundary.test.mjs",
    "apps/asyra-design/package.json",
    "apps/asyra-design/server/__tests__/execution-flow.config.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Validation coverage and captured-source resolution change; App tools, execution, cancellation and persisted data do not. Existing pinned offline native prerequisites remain enforced."
}
```

## Pending inspection target preflight

```update-note
{
  "change": "inspection-target-preflight",
  "owner": "Asyra Design inspection",
  "summary": "Use one canonical metadata observation for capture eligibility instead of copying complete target data; preserve framing, evidence and failed-only capture recovery.",
  "sources": [
    "apps/asyra-design/src/common-apis/inspection.ts",
    "apps/asyra-design/src/ai/__tests__/inspection.test.ts",
    "apps/asyra-design/server/__tests__/workspace-inspection.integration.test.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Existing tool inputs, image outputs, snapshot behavior and full-data APIs remain unchanged; no persisted data or consumer migration."
}
```

## Pending metadata child counts

```update-note
{
  "change": "metadata-child-count",
  "owner": "Asyra Design inspection integration",
  "summary": "Exercise saved construction inputs with live inspection dependencies and prove reduced copying while preserving scope invalidation, ordered membership, history and reload.",
  "sources": [
    "apps/asyra-design/server/__tests__/metadata-inspection.integration.test.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "apps/asyra-design/package.json",
    "apps/asyra-design/flow-contracts.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Existing public metadata values and membership ownership remain unchanged. No persisted format or consumer migration is required."
}
```

## Pending vector delivery identities

```update-note
{
  "change": "vector-delivery-identities",
  "owner": "Asyra Design prepared delivery",
  "summary": "Omit verified duplicate vector record IDs in the internal wire format, restore exact keys before canonical admission and preserve recovery and document identity.",
  "sources": [
    "apps/asyra-design/src/ai/prepared-design.ts",
    "apps/asyra-design/src/ai/prepared-design-admission.ts",
    "apps/asyra-design/server/__tests__/prepared-delivery.integration.test.ts",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/vector-delivery-20261025.json",
    "apps/asyra-design/server/__tests__/local-design-tools.test.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "apps/asyra-design/src/ai/__tests__/interrupted-design.integration.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Internal App delivery changes atomically; no persisted schema or public consumer migration. Canonical documents and independent conversions remain unchanged."
}
```

## Pending E2E execution continuity

```update-note
{
  "change": "e2e-execution-continuity",
  "owner": "Asyra Design E2E harness",
  "summary": "Distinguish unexpected runtime replacements and source drift from strict save, history and collaboration failures with phase evidence.",
  "sources": [
    "apps/asyra-design/flow-contracts.json",
    "apps/asyra-design/e2e/execution-evidence.ts",
    "apps/asyra-design/e2e/test-utils.ts",
    "apps/asyra-design/e2e/ai-inspection-evidence.spec.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "apps/asyra-design/e2e/fixtures/execution-continuity.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Internal validation only; no product API, document schema, persistence or consumer migration changes."
}
```

## Pending mechanical coverage selection

```update-note
{
  "change": "mechanical-coverage-selection",
  "owner": "Asyra Design hosted App",
  "summary": "Select old mechanical checks from exact captured coverage before requesting reconciliation; preserve independent receipts and failures.",
  "sources": [
    "apps/asyra-design/e2e/ai-inspection-evidence.spec.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "apps/asyra-design/server/__tests__/local-operation-tools.test.ts",
    "apps/asyra-design/server/__tests__/mechanical-closure.integration.test.ts",
    "apps/asyra-design/server/local-operation-tools.ts",
    "apps/asyra-design/src/ai/__tests__/review-action.test.ts",
    "apps/asyra-design/src/ai/review-action.ts",
    "apps/asyra-design/src/common-apis/__tests__/design-review.test.ts",
    "apps/asyra-design/src/common-apis/design-review.ts",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/mechanical-coverage-20261025.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Internal review coordination and validation only. Existing review entry points, canonical writes and saved document formats require no consumer migration."
}
```

## Unreleased

- Keep the preparation-failure E2E switch disabled across recovery reloads,
  independent of whether the browser retains the instrumented module. Runtime
  behavior and test deadlines are unchanged.

```update-note
{
  "change": "recovery-fault-release-across-reloads",
  "owner": "@asyra/asyra-design",
  "summary": "Make recovery E2E fault release independent of module cache eviction.",
  "reason": "The old page initialization re-enabled the injected fault after recovery when an instrumented module remained available.",
  "impact": "no-action",
  "sources": ["apps/asyra-design/e2e/collaboration.spec.ts"],
  "guides": []
}
```

## Pending tool handoffs

Development-source changes only; no deployment or model adoption is claimed.

```update-note
{
  "change": "design-tool-owner-handoffs",
  "owner": "Asyra Design hosted App",
  "summary": "Improve deterministic construction, scope discovery, capture/review, partial recovery and evidence delivery while preserving independent geometry and saved documents.",
  "sources": [
    "apps/asyra-design/e2e/ai-conversation-flow.spec.ts",
    "apps/asyra-design/e2e/ai-inspection-evidence.spec.ts",
    "apps/asyra-design/e2e/ai-linear-material.spec.ts",
    "apps/asyra-design/e2e/ai-repeated-detail.spec.ts",
    "apps/asyra-design/e2e/ai-retained-anchor.spec.ts",
    "apps/asyra-design/e2e/basic-api-actions.spec.ts",
    "apps/asyra-design/e2e/design-construction.spec.ts",
    "apps/asyra-design/e2e/drawing-inspection.spec.ts",
    "apps/asyra-design/e2e/fill-patch.spec.ts",
    "apps/asyra-design/e2e/fixtures/basic-api-cases.ts",
    "apps/asyra-design/e2e/fixtures/receipt-provider.mjs",
    "apps/asyra-design/e2e/indexed-design-query.spec.ts",
    "apps/asyra-design/e2e/local-ai-provider.spec.ts",
    "apps/asyra-design/e2e/recorded-document-reload.spec.ts",
    "apps/asyra-design/flow-contracts.json",
    "apps/asyra-design/package.json",
    "apps/asyra-design/playwright-functional-flow-contracts.json",
    "apps/asyra-design/server/__tests__/action-batch.test.ts",
    "apps/asyra-design/server/__tests__/ai-domain-prompt.test.ts",
    "apps/asyra-design/server/__tests__/basic-api-contracts.test.ts",
    "apps/asyra-design/server/__tests__/design-check-results.test.ts",
    "apps/asyra-design/server/__tests__/design-draft-repair.test.ts",
    "apps/asyra-design/server/__tests__/design-linear-field.test.ts",
    "apps/asyra-design/server/__tests__/design-patterns.test.ts",
    "apps/asyra-design/server/__tests__/design-preparation.test.ts",
    "apps/asyra-design/server/__tests__/design-review-stages.test.ts",
    "apps/asyra-design/server/__tests__/discovery-delivery.integration.test.ts",
    "apps/asyra-design/server/__tests__/document-canonical-reducer.test.ts",
    "apps/asyra-design/server/__tests__/evaluation-budget.test.ts",
    "apps/asyra-design/server/__tests__/execution-flow-proof.test.ts",
    "apps/asyra-design/server/__tests__/execution-flow.config.ts",
    "apps/asyra-design/server/__tests__/face-boundary.test.ts",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/acceptance-context-20261020.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/acquisition-recovery-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/brief-capacity-20261024.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/compact-receipt-20261024.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/component-selection-20261022.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/composition-materials-20261022.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/context-discovery-20261023.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/context-query-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/correction-handoff-20261023.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/discovery-delivery-20261020.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/expansion-budget-20261022.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/face-boundary-20261025.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/group-containment-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/inspection-discovery-20261022.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/invalid-query-scope-20261022.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/knowledge-dependency-reuse-20261024.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/knowledge-topic-selection-20261021.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/layered-pattern-20261023.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/material-correction-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/material-field-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/mechanical-validity-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/operation-selection-20261022.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/ordered-preparation-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/ornament-input-20261019.json.gz",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/ornament-output-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/pattern-budget-recovery-20261023.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/prepared-delivery-20261023.json.gz",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/projected-ellipse-20261024.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/report-capture-20261023.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/representative-review-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/shared-motifs-20261023.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/shared-property-ui-undo.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/translated-component-20261022.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/whole-flow-closure-20261019.json",
    "apps/asyra-design/server/__tests__/fixtures/recorded-101/workspace-inspection-20261024.json",
    "apps/asyra-design/server/__tests__/image-delivery.integration.test.ts",
    "apps/asyra-design/server/__tests__/information-delivery.integration.test.ts",
    "apps/asyra-design/server/__tests__/layered-pattern-assertions.ts",
    "apps/asyra-design/server/__tests__/local-ai-provider.test.ts",
    "apps/asyra-design/server/__tests__/local-design-tools.test.ts",
    "apps/asyra-design/server/__tests__/local-design-workflow.test.ts",
    "apps/asyra-design/server/__tests__/local-information-delivery.test.ts",
    "apps/asyra-design/server/__tests__/local-knowledge.test.ts",
    "apps/asyra-design/server/__tests__/local-operation-tools.test.ts",
    "apps/asyra-design/server/__tests__/local-query-artifacts.test.ts",
    "apps/asyra-design/server/__tests__/local-tool-host.test.ts",
    "apps/asyra-design/server/__tests__/local-tool-invocation.test.ts",
    "apps/asyra-design/server/__tests__/local-tool-operation-composition.test.ts",
    "apps/asyra-design/server/__tests__/mechanical-closure.integration.test.ts",
    "apps/asyra-design/server/__tests__/native-output-observation.integration.test.ts",
    "apps/asyra-design/server/__tests__/operation-input-schema.test.ts",
    "apps/asyra-design/server/__tests__/prepared-delivery.integration.test.ts",
    "apps/asyra-design/server/__tests__/projected-ellipse.test.ts",
    "apps/asyra-design/server/__tests__/recorded-ornaments.ts",
    "apps/asyra-design/server/__tests__/shared-motifs.test.ts",
    "apps/asyra-design/server/__tests__/tool-contract-assertions.ts",
    "apps/asyra-design/server/__tests__/visual-correction.integration.test.ts",
    "apps/asyra-design/server/__tests__/workspace-inspection.integration.test.ts",
    "apps/asyra-design/server/ai-domain-prompt.ts",
    "apps/asyra-design/server/ai-model-provider.ts",
    "apps/asyra-design/server/design-budget.ts",
    "apps/asyra-design/server/design-check-results.ts",
    "apps/asyra-design/server/design-construction-schema.ts",
    "apps/asyra-design/server/design-construction.ts",
    "apps/asyra-design/server/design-draft-repair.ts",
    "apps/asyra-design/server/design-face.ts",
    "apps/asyra-design/server/design-linear-field.ts",
    "apps/asyra-design/server/design-preparation-examples.ts",
    "apps/asyra-design/server/design-preparation.ts",
    "apps/asyra-design/server/design-workflow-discovery.ts",
    "apps/asyra-design/server/document-canonical-reducer.ts",
    "apps/asyra-design/server/local-ai-provider.ts",
    "apps/asyra-design/server/local-design-review.ts",
    "apps/asyra-design/server/local-design-tools.ts",
    "apps/asyra-design/server/local-design-workflow.ts",
    "apps/asyra-design/server/local-information-delivery.ts",
    "apps/asyra-design/server/local-knowledge.ts",
    "apps/asyra-design/server/local-operation-batch.ts",
    "apps/asyra-design/server/local-operation-tools.ts",
    "apps/asyra-design/server/local-prepared-design-review.ts",
    "apps/asyra-design/server/local-tool-host.ts",
    "apps/asyra-design/server/local-tool-invocation.ts",
    "apps/asyra-design/server/operation-input-schema.ts",
    "apps/asyra-design/src/ai/__tests__/actions.test.ts",
    "apps/asyra-design/src/ai/__tests__/basic-api-actions.test.ts",
    "apps/asyra-design/src/ai/__tests__/composition-actions.test.ts",
    "apps/asyra-design/src/ai/__tests__/context-action.test.ts",
    "apps/asyra-design/src/ai/__tests__/conversation.test.ts",
    "apps/asyra-design/src/ai/__tests__/core-owner-results.integration.test.ts",
    "apps/asyra-design/src/ai/__tests__/design-actions.test.ts",
    "apps/asyra-design/src/ai/__tests__/evaluation-window.test.ts",
    "apps/asyra-design/src/ai/__tests__/inspection.test.ts",
    "apps/asyra-design/src/ai/__tests__/interrupted-design.integration.test.ts",
    "apps/asyra-design/src/ai/__tests__/knowledge-handoff.test.ts",
    "apps/asyra-design/src/ai/__tests__/non-core-owner-results.integration.test.ts",
    "apps/asyra-design/src/ai/__tests__/prepared-material-action.test.ts",
    "apps/asyra-design/src/ai/__tests__/prescribed-position-action.test.ts",
    "apps/asyra-design/src/ai/__tests__/presentation.test.ts",
    "apps/asyra-design/src/ai/__tests__/retained-fill-action.test.ts",
    "apps/asyra-design/src/ai/__tests__/review-action.test.ts",
    "apps/asyra-design/src/ai/__tests__/runtime-input.test.ts",
    "apps/asyra-design/src/ai/__tests__/runtime-integration.test.ts",
    "apps/asyra-design/src/ai/__tests__/server-action-batch-provider.test.ts",
    "apps/asyra-design/src/ai/__tests__/server-prepared-action-consumer.test.ts",
    "apps/asyra-design/src/ai/__tests__/structural-delivery.test.ts",
    "apps/asyra-design/src/ai/__tests__/transaction.test.ts",
    "apps/asyra-design/src/ai/actions.ts",
    "apps/asyra-design/src/ai/activity-state.ts",
    "apps/asyra-design/src/ai/arrangement-action.ts",
    "apps/asyra-design/src/ai/basic-api-actions.ts",
    "apps/asyra-design/src/ai/basic-api-contracts.ts",
    "apps/asyra-design/src/ai/basic-api-results.ts",
    "apps/asyra-design/src/ai/basic-core-api-contracts.ts",
    "apps/asyra-design/src/ai/basic-design-api-contracts.ts",
    "apps/asyra-design/src/ai/basic-vector-api-contracts.ts",
    "apps/asyra-design/src/ai/context-action.ts",
    "apps/asyra-design/src/ai/design-actions.ts",
    "apps/asyra-design/src/ai/design-edit-action.ts",
    "apps/asyra-design/src/ai/design-fill.ts",
    "apps/asyra-design/src/ai/evaluation-window.ts",
    "apps/asyra-design/src/ai/inspection-schema.ts",
    "apps/asyra-design/src/ai/inspection.ts",
    "apps/asyra-design/src/ai/organization-action.ts",
    "apps/asyra-design/src/ai/prepared-design-admission.ts",
    "apps/asyra-design/src/ai/prepared-design.ts",
    "apps/asyra-design/src/ai/prepared-material-action.ts",
    "apps/asyra-design/src/ai/prescribed-position-action.ts",
    "apps/asyra-design/src/ai/prescribed-position-contract.ts",
    "apps/asyra-design/src/ai/retained-fill-action.ts",
    "apps/asyra-design/src/ai/review-action.ts",
    "apps/asyra-design/src/ai/runtime-input.ts",
    "apps/asyra-design/src/ai/server-action-batch-provider.ts",
    "apps/asyra-design/src/ai/startup.ts",
    "apps/asyra-design/src/ai/tool-contract.ts",
    "apps/asyra-design/src/ai/transaction.ts",
    "apps/asyra-design/src/app/__tests__/ai-conversation-panel.test.tsx",
    "apps/asyra-design/src/app/ai-conversation-panel.tsx",
    "apps/asyra-design/src/collaboration/app-protocol-types.ts",
    "apps/asyra-design/src/collaboration/document-publication.ts",
    "apps/asyra-design/src/collaboration/operations.ts",
    "apps/asyra-design/src/common-apis/__tests__/design-review.test.ts",
    "apps/asyra-design/src/common-apis/__tests__/fills.test.ts",
    "apps/asyra-design/src/common-apis/__tests__/inspection-evidence.test.ts",
    "apps/asyra-design/src/common-apis/__tests__/retained-design-context.test.ts",
    "apps/asyra-design/src/common-apis/__tests__/strokes.test.ts",
    "apps/asyra-design/src/common-apis/design-context.ts",
    "apps/asyra-design/src/common-apis/design-review.ts",
    "apps/asyra-design/src/common-apis/element/__tests__/group-geometry-mutation.test.ts",
    "apps/asyra-design/src/common-apis/element/__tests__/transient-vector-preview.test.ts",
    "apps/asyra-design/src/common-apis/element/__tests__/vector-parent-creation.test.ts",
    "apps/asyra-design/src/common-apis/element/apis.ts",
    "apps/asyra-design/src/common-apis/element/update-element-properties.ts",
    "apps/asyra-design/src/common-apis/element/vector-apis.ts",
    "apps/asyra-design/src/common-apis/fills.ts",
    "apps/asyra-design/src/common-apis/inspection-evidence.ts",
    "apps/asyra-design/src/common-apis/inspection.ts",
    "apps/asyra-design/src/common-apis/mutation-receipt.ts",
    "apps/asyra-design/src/common-apis/retained-design-context.ts",
    "apps/asyra-design/src/common-apis/strokes.ts",
    "apps/asyra-design/src/constants/ai-actions.ts",
    "apps/asyra-design/src/constants/ai-design.ts",
    "apps/asyra-design/src/features/delete-vector-point/index.ts",
    "apps/asyra-design/src/features/pen-tool/__tests__/transient-preview-cancel.test.ts",
    "apps/asyra-design/src/features/pen-tool/feature.ts",
    "apps/asyra-design/src/init/__tests__/collaboration-factory.test.ts",
    "apps/asyra-design/src/init/__tests__/collaboration-operations.test.ts",
    "apps/asyra-design/src/init/__tests__/document-publication.test.ts",
    "apps/asyra-design/src/properties/vector-point.tsx",
    "apps/asyra-design/test-data/ai-drawing/__tests__/live-test-deadline.test.mjs",
    "apps/asyra-design/test-data/ai-drawing/live-test-deadline.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/__tests__/analysis.test.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/__tests__/architecture-protocol.test.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/__tests__/assessment.test.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/__tests__/capture-browser.test.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/__tests__/capture-reliability.test.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/__tests__/native-delivery.test.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/__tests__/representation.test.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/analyze.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/architecture-101.json",
    "apps/asyra-design/test-data/knowledge-evaluation/architecture-protocol.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/assessment.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/audit-quality.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/capture-browser.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/capture-lifecycle.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/capture-source.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/cases.json",
    "apps/asyra-design/test-data/knowledge-evaluation/checkpoint.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/compare-101-arm.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/2026-10-18.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/decision-evidence-replay.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/detail-capture.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/discovery-replay.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/final.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/first.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/material-role-replay.jsonl",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/metrics.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/native-base.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/native-ornament.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/native-tiers.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/reload-inspected.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/reload-inspection.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/representation-replay.jsonl",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/architecture-2026-10-18/run-summary.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/baseline-composition.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/candidate-composition.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/canonical-audit.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/gallery.html",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/index.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/recording-metadata.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/reference-0.jpg",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/reference-1.jpg",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-01.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-02.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-03.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-04.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-05.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-06.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-07.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-08.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-09.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-10.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-11.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-12.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-13.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-14.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-15.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/sample-16.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/taipei-101-control-first.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/taipei-101-control.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/taipei-101-knowledge-first.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/taipei-101-knowledge.png",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/taipei-101-spec.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/quality-2026-10-18/taipei-101.json",
    "apps/asyra-design/test-data/knowledge-evaluation/evidence/transfer-composition.png",
    "apps/asyra-design/test-data/knowledge-evaluation/fit-101.cjs",
    "apps/asyra-design/test-data/knowledge-evaluation/fixtures/native-delivery/describe_design_apis.txt",
    "apps/asyra-design/test-data/knowledge-evaluation/fixtures/native-delivery/inspection.json",
    "apps/asyra-design/test-data/knowledge-evaluation/fixtures/native-delivery/inspection.png",
    "apps/asyra-design/test-data/knowledge-evaluation/fixtures/native-delivery/manifest.json",
    "apps/asyra-design/test-data/knowledge-evaluation/fixtures/native-delivery/read_knowledge.txt",
    "apps/asyra-design/test-data/knowledge-evaluation/flow/design-knowledge-evaluation.flow.json",
    "apps/asyra-design/test-data/knowledge-evaluation/native-delivery.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/observer-101.cjs",
    "apps/asyra-design/test-data/knowledge-evaluation/quality-cases.json",
    "apps/asyra-design/test-data/knowledge-evaluation/quality-run.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/quality.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/replay-saved-document.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/representation.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/run-101.mjs",
    "apps/asyra-design/test-data/knowledge-evaluation/run.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "These changes are consumed by the hosted App through its own current registered tool schemas and owners. Users need no package integration or data migration; existing inline inputs remain valid. Optional forms are advertised through scoped discovery. Local correctness does not establish AI adoption."
}
```

## 0.2.5

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/core@0.2.5
  - @asyra/design-system@0.2.5
  - @asyra/reactive-events@0.2.5
  - @asyra/ui-context@0.2.5
  - @asyra/utils@0.2.5

## 0.2.4

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/core@0.2.4
  - @asyra/design-system@0.2.4
  - @asyra/reactive-events@0.2.4
  - @asyra/ui-context@0.2.4
  - @asyra/utils@0.2.4

## 0.2.3

### Patch Changes

- Auto-patch all packages.
- Updated dependencies
  - @asyra/core@0.2.3
  - @asyra/design-system@0.2.3
  - @asyra/reactive-events@0.2.3
  - @asyra/ui-context@0.2.3
  - @asyra/utils@0.2.3

## 0.2.2

### Patch Changes

- Updated dependencies
  - @asyra/core@0.2.2
  - @asyra/design-system@0.2.2
  - @asyra/reactive-events@0.2.2
  - @asyra/ui-context@0.2.2
  - @asyra/utils@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies
  - @asyra/core@0.2.1
  - @asyra/design-system@0.2.1
  - @asyra/reactive-events@0.2.1
  - @asyra/ui-context@0.2.1
  - @asyra/utils@0.2.1
