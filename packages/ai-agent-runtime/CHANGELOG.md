# @asyra/ai-agent-runtime

## Pending selected retained information

```update-note
{
  "change": "selected-retained-information",
  "owner": "AI Agent Runtime",
  "summary": "Redisplay selected full Knowledge text or tool contracts from existing request-owned results, preserving original scope, dependencies, overrides and read-only recovery without repeated content reads or projection.",
  "sources": [
    "packages/ai-agent-runtime/src/knowledge.ts",
    "packages/ai-agent-runtime/src/knowledge-types.ts",
    "packages/ai-agent-runtime/src/__tests__/knowledge.test.ts"
  ],
  "impact": "integration",
  "guides": [
    "docs/public/updates/retained-information-r1.md"
  ],
  "reason": "Callers may opt into fromResult with exact targets; retain original result identities only within their valid request/session and recover stale selections without replay."
}
```

## Pending public provider activity recording

```update-note
{
  "change": "public-provider-activity-recording",
  "owner": "AI Agent Runtime",
  "summary": "Retain host-selected public provider notification payloads with the existing sanitized diagnostic sink and explicit storage failure accounting.",
  "sources": [
    "packages/ai-agent-runtime/src/node/payload.ts",
    "packages/ai-agent-runtime/src/profiler/recorder.ts",
    "packages/ai-agent-runtime/src/profiler/__tests__/records.test.ts"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Public profiler APIs and execution outcomes are unchanged. Hosts retain responsibility for selecting public activity; raw reasoning and provider prompts must not be passed to this diagnostic sink."
}
```

## Pending tool validation stage

```update-note
{
  "change": "tool-validation-stage",
  "owner": "AI Agent Runtime",
  "summary": "Supply input/output stage metadata through the existing validator callback and forward it through recipe invocation without changing settlement or replay behavior.",
  "sources": [
    "packages/ai-agent-runtime/src/__tests__/tool-contract.test.ts",
    "packages/ai-agent-runtime/src/index.ts",
    "packages/ai-agent-runtime/src/recipe-execution.ts",
    "packages/ai-agent-runtime/src/tool-contract.ts",
    "docs/public/generated/api-index.json",
    "docs/public/generated/package-reference.json",
    "docs/public/generated/source-map.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "The validator still receives the same value and schema; stage is optional diagnostic metadata. Existing two-argument validators remain valid, and schemas, outcomes, permissions and persistence are unchanged. Hosts may use the new context to label diagnostics accurately."
}
```

## 0.5.1

### Patch Changes

- Exceptional synchronized patch release for the fixed 19-package Framework set.

## 0.5.0

### Minor Changes

- Exceptional synchronized minor release for the fixed 19-package Framework set.
