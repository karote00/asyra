# @asyra/ai-agent-runtime

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
