# Asyra Release Notes

## Pending mechanical coverage selection

```update-note
{
  "change": "mechanical-coverage-selection-contract",
  "owner": "Repository Flow Inspector",
  "summary": "Record the inspect-owner scope selection contract and permanent regression fixture in the existing Inspector.",
  "sources": [
    "tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs",
    "tools/flow-inspector/workspace/workspace-bundle.data.js"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Internal review coordination and validation only. Existing review entry points, canonical writes and saved document formats require no consumer migration."
}
```

This file tracks releases for Asyra. Previous releases under Asyra (v0.1.0,
etc.) are not included here.

## Framework pre-publication candidate

The fixed 19-package Framework allowlist and current package manifests define
the candidate versions. Changesets materialization, not release documentation,
owns those values. The release decision remains `PENDING` until a clean exact
source commit reproduces the accepted artifacts, the publication checkpoint is
authorized, and the public-registry consumer passes. This candidate record does
not authorize merge, tagging, registry publication, deployment, or a formal
release.

The private root workspace `asyra`, private `@asyra/asyra-design`, and
`create-asyra-design-app` are excluded from this Framework release. The
committed create-app template is not regenerated or validated by this plan.

## Framework 0.2.5 pre-publication release readiness result: READY

Framework Release Gate 5 produced a reproducible pre-publication `READY` result
for the already-versioned `0.2.5` candidate. All 19 public packages can be
packed, installed, typechecked, built, and exercised by clean consumers and by
the generated Asyra Design template from project-local artifacts. Public
registry availability is not proven. This result does not authorize merge,
tagging, registry publication, deployment, or a formal release.

The candidate supports:

- Core and Preset 2D initialization through public ESM entrypoints;
- transaction, rollback, undo/redo, save, and app-owned load migration;
- Group group/ungroup through canonical public APIs;
- explicitly composed Collaboration and convergent remote apply;
- explicitly composed AI action plans through registered app actions;
- side-effect-free operation when Collaboration or AI is not enabled.

The supported runtime is Node.js 24.x with Yarn 4.3.1. Declarations are
validated with TypeScript 5.8.3, and the React surface targets React 19. The
formal browser evidence uses the current Chromium supplied by Playwright 1.57.

Production 3D and HYBRID profiles, auto-layout, and unit-aware aggregation are
not included. See
[`docs/ai/framework/RELEASE_SUPPORT.md`](docs/ai/framework/RELEASE_SUPPORT.md)
for the exact package set, support matrix, migration/deprecation table,
security boundaries, and reproducible readiness commands.

## Pending update guidance

Pending branch handoff notes below were added after integrating the release-guidance rule.
They describe source changes, not published availability.

```update-note
{
  "change": "canonical-property-and-ai-handoffs",
  "owner": "Framework packages",
  "summary": "Canonical property receipts, retained Knowledge dependency delivery, interrupted results and shared geometry/projection contracts.",
  "sources": [
    "packages/ai-agent-runtime/src/__tests__/execution.test.ts",
    "packages/ai-agent-runtime/src/__tests__/interrupted-results.test.ts",
    "packages/ai-agent-runtime/src/__tests__/knowledge.test.ts",
    "packages/ai-agent-runtime/src/__tests__/multi-batch.test.ts",
    "packages/ai-agent-runtime/src/__tests__/progress.test.ts",
    "packages/ai-agent-runtime/src/knowledge-types.ts",
    "packages/ai-agent-runtime/src/knowledge.ts",
    "packages/ai-agent-runtime/src/profiler/__tests__/records.test.ts",
    "packages/ai-agent-runtime/src/profiler/recorder.ts",
    "packages/ai-agent-runtime/src/provider.ts",
    "packages/ai-agent-runtime/src/runtime.ts",
    "packages/core/src/__tests__/canonical-owner-coordination.test.ts",
    "packages/core/src/__tests__/element-property-api.test.ts",
    "packages/core/src/__tests__/hierarchy-transaction.test.ts",
    "packages/core/src/__tests__/property-intent-coordination.test.ts",
    "packages/core/src/__tests__/property-intent-history.test.ts",
    "packages/core/src/apis/__tests__/scene-bounds.test.ts",
    "packages/core/src/apis/create-apis.ts",
    "packages/core/src/apis/element-properties.ts",
    "packages/core/src/apis/property-intents.ts",
    "packages/core/src/apis/props.ts",
    "packages/core/src/apis/scene-bounds.ts",
    "packages/core/src/core.ts",
    "packages/core/src/index.ts",
    "packages/core/src/types/canonical-changes.ts",
    "packages/core/src/types/element-properties.ts",
    "packages/core/src/types/property-intents.ts",
    "packages/core/src/types/property-mutation-receipt.ts",
    "packages/core/src/types/props.ts",
    "packages/factory/src/__tests__/data-transact.test.ts",
    "packages/factory/src/data-transact.ts",
    "packages/preset/src/__tests__/children-map-property-component.test.ts",
    "packages/preset/src/__tests__/group-bounds.test.ts",
    "packages/preset/src/__tests__/group-operations.test.ts",
    "packages/preset/src/__tests__/oval-render-strategy.test.ts",
    "packages/preset/src/__tests__/selection-subscriptions.test.ts",
    "packages/preset/src/components/group.ts",
    "packages/preset/src/components/oval.ts",
    "packages/preset/src/group-bounds.ts",
    "packages/preset/src/subscriptions/data-channel.ts",
    "packages/props-manager/src/__tests__/property-inheritance.test.ts",
    "packages/props-manager/src/__tests__/props-manager.test.ts",
    "packages/props-manager/src/index.ts",
    "packages/props-manager/src/manager/component-accessor.ts",
    "packages/props-manager/src/manager/property-intents.ts",
    "packages/props-manager/src/manager/props-manager.ts",
    "packages/props-manager/src/manager/subscribes.ts",
    "packages/props-manager/src/registries/declarative-property-type.ts",
    "packages/props-manager/src/registries/property-inheritance.ts",
    "packages/props-manager/src/registries/property-value-kind.ts",
    "packages/reactive-events/src/scene-tree/events.ts",
    "packages/reactive-events/src/scene-tree/publish.ts",
    "packages/reactive-events/src/scene-tree/subscribes.ts",
    "packages/reactive-events/src/types.ts",
    "packages/render/src/__tests__/render.test.ts",
    "packages/render/src/__tests__/scene-tree-store.test.ts",
    "packages/render/src/layers/viewport/viewport-layer.ts",
    "packages/render/src/render.ts",
    "packages/render/src/stores/scene-tree.ts",
    "packages/scene-tree/src/__tests__/element-property-bindings.test.ts",
    "packages/scene-tree/src/__tests__/element-property-targets.test.ts",
    "packages/scene-tree/src/components/props.ts",
    "packages/scene-tree/src/create-dynamic-props.ts",
    "packages/scene-tree/src/element-mutation.ts",
    "packages/scene-tree/src/sceneTree.ts",
    "packages/scene-tree/src/subscribes.ts",
    "packages/utils/src/constants/scene-tree.ts",
    "packages/utils/src/propsManager/rawDataTypes.ts",
    "packages/utils/src/render/__tests__/geometry-bounds.test.ts",
    "packages/utils/src/render/geometry-bounds.ts",
    "packages/utils/src/sceneTree/instanceTypes.ts",
    "packages/utils/src/types/props-manager.ts",
    "packages/utils/src/types/scene-tree.ts"
  ],
  "impact": "integration",
  "guides": [
    "docs/public/updates/design-owner-handoffs-r1.md"
  ],
  "reason": "Custom Framework consumers must reconcile target ownership, retained-result availability, interruption and geometry/subscription assumptions using the candidate guide; no public release is claimed."
}
```



```update-note
{
  "change": "design-handoff-validation-and-documents",
  "owner": "Repository development tooling",
  "summary": "Keep direct consumer tests, Inspector mapping, task context and generated public references aligned.",
  "sources": [
    "apps/asyra-framework-site/public/llms.txt",
    "docs/public/content-manifest.json",
    "docs/public/generated/api-index.json",
    "docs/public/generated/content-index.json",
    "docs/public/generated/package-reference.json",
    "docs/public/generated/source-map.json",
    "docs/public/llms.txt",
    "package.json",
    "scripts/__tests__/domain-knowledge.test.mjs",
    "scripts/__tests__/local-validation.test.mjs",
    "scripts/__tests__/task-context.test.mjs",
    "scripts/task-context.mjs",
    "tools/flow-inspector/inspectors/__tests__/canonical-projection-and-collaboration-contract-flow-inspector.contract.test.cjs",
    "tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/canonical-projection-and-collaboration-contract-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/design-functional-flow-inspector.data.cjs",
    "tools/flow-inspector/workspace/workspace-bundle.data.js"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Repository-only validation and generated documentation changes require no downstream runtime integration and do not authorize publication."
}
```


These development notes are not published release summaries.

```update-note
{
  "change": "release-guidance-authoring",
  "owner": "Repository development tooling",
  "summary": "Require pending impact notes and guide references through normal development entries and PR document checks.",
  "sources": [
    "scripts/docs/release-update-guidance.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs",
    "package.json",
    ".github/workflows/main.yml",
    "scripts/ci-relationships.json",
    "scripts/__tests__/ci-scope.test.mjs",
    "docs/public/generated/source-map.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Repository authoring checks only; App runtime, consumer data, package versions and publishers are unchanged."
}
```

```update-note
{
  "change": "release-guidance-integrity-fixes",
  "owner": "Repository development tooling",
  "summary": "Validate retained note identities and guide references; check source existence without loading source payloads.",
  "sources": [
    "scripts/docs/release-update-guidance.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Development document validation only; preserve Markdown exemptions and leave consumer runtime, data and publishers unchanged."
}
```

```update-note
{
  "change": "cloudflare-release-guidance-routing",
  "owner": "Repository development tooling",
  "summary": "Route hosted release guidance to the current Cloudflare Pages App and website workflows.",
  "sources": [
    "scripts/docs/__tests__/release-update-guidance.test.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Correct project workflow routing only; publication, providers, runtime and consumer data remain unchanged."
}
```

```update-note
{
  "change": "release-guidance-admission",
  "owner": "Repository release tooling",
  "summary": "Require artifact-bound update summaries and valid integration guides in the existing npm and Cloudflare Pages release flows.",
  "sources": [
    ".github/__tests__/app-cloudflare.test.mjs",
    ".github/__tests__/site-cloudflare.test.mjs",
    ".github/workflows/app-cloudflare.yml",
    ".github/workflows/site-cloudflare.yml",
    "docs/public/generated/source-map.json",
    "package.json",
    "scripts/__tests__/app-cloudflare.test.mjs",
    "scripts/__tests__/fixtures/release-guidance.mjs",
    "scripts/__tests__/framework-release-publisher.test.mjs",
    "scripts/__tests__/release-automation.test.mjs",
    "scripts/__tests__/release-guidance.test.mjs",
    "scripts/app-cloudflare.mjs",
    "scripts/ci-relationships.json",
    "scripts/cloudflare-release-guidance.mjs",
    "scripts/create-app-release-artifacts.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs",
    "scripts/docs/release-update-guidance.mjs",
    "scripts/framework-release-artifacts.js",
    "scripts/publish-create-app.js",
    "scripts/publish-framework-release.js",
    "scripts/release-create-app.js",
    "scripts/release-framework.js",
    "scripts/release-guidance.mjs",
    "tools/flow-inspector/inspectors/__tests__/framework-package-release-flow-inspector.contract.test.cjs",
    "tools/flow-inspector/inspectors/create-asyra-design-app-release-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/framework-package-release-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/framework-release-readiness-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/release-update-guidance.flow.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Repository release tooling only; consumer runtime, App customizations and stored data remain unchanged. Maintainers use the existing release entries and the documented guidance/recovery checks."
}
```

```update-note
{
  "change": "release-guidance-retry-baselines",
  "owner": "Repository release tooling",
  "summary": "Restore frozen Cloudflare candidates across runners and distinguish unchanged npm members from partial publication retries.",
  "sources": [
    ".github/__tests__/app-cloudflare.test.mjs",
    ".github/__tests__/site-cloudflare.test.mjs",
    ".github/workflows/app-cloudflare.yml",
    ".github/workflows/site-cloudflare.yml",
    "scripts/__tests__/release-guidance.test.mjs",
    "scripts/cloudflare-release-guidance.mjs",
    "scripts/release-guidance.mjs",
    "tools/flow-inspector/inspectors/release-update-guidance.flow.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Release admission and recovery only; preserve consumer runtime, custom features and saved data, package versions, authorization and Markdown-only exemptions."
}
```

```update-note
{
  "change": "cloudflare-verified-deployment-retention",
  "owner": "Repository release tooling",
  "summary": "Preserve verified deployment outcomes when a later upload attempt fails, while recording that attempt separately.",
  "sources": [
    "scripts/cloudflare-release-guidance.mjs",
    "scripts/__tests__/release-guidance.test.mjs",
    "tools/flow-inspector/inspectors/release-update-guidance.flow.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Release result bookkeeping only; consumer runtime, custom behavior, saved data, versioning and Markdown-only exemptions are unchanged."
}
```

```update-note
{
  "change": "public-release-history-discovery",
  "owner": "Public release documentation",
  "summary": "Expose durable per-owner release summaries and cross-version guidance through the existing public document inventory, website and AI discovery entries.",
  "sources": [
    "apps/asyra-framework-site/__tests__/content.test.mjs",
    "apps/asyra-framework-site/__tests__/docs.test.mjs",
    "apps/asyra-framework-site/__tests__/e2e/supporting-routes.spec.ts",
    "apps/asyra-framework-site/__tests__/e2e/update-guides.spec.ts",
    "apps/asyra-framework-site/__tests__/static-delivery.test.mjs",
    "apps/asyra-framework-site/lib/content.mjs",
    "apps/asyra-framework-site/public/llms.txt",
    "docs/public/content-manifest.json",
    "docs/public/generated/content-index.json",
    "docs/public/generated/source-map.json",
    "docs/public/llms.txt",
    "docs/public/schema/content-manifest.schema.json",
    "scripts/docs/__tests__/public-content-contract.test.mjs",
    "scripts/docs/__tests__/public-documentation.test.mjs",
    "scripts/docs/__tests__/public-documentation-validation.test.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs",
    "scripts/docs/public-content-contract.mjs",
    "scripts/docs/public-documentation.mjs",
    "scripts/docs/release-update-guidance.mjs",
    "tools/flow-inspector/inspectors/__tests__/asyra-public-package-documentation-flow-inspector.contract.test.cjs",
    "tools/flow-inspector/inspectors/asyra-public-package-documentation-flow-inspector.data.cjs",
    "scripts/docs/release-history.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Documentation discovery and validation only; consumer runtime, custom features and stored data are unchanged. No historical release availability is inferred."
}
```

```update-note
{
  "change": "release-history-adoption-fixes",
  "owner": "Public release documentation",
  "summary": "Retain adopted guide revisions and include prerequisite cross-version guidance with explicit baseline gaps.",
  "sources": [
    "scripts/docs/release-history.mjs",
    "scripts/docs/__tests__/public-documentation.test.mjs",
    "docs/public/generated/content-index.json",
    "docs/public/generated/source-map.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Documentation discovery and regression checks only; no runtime, consumer data, package versions or publication changes."
}
```

```update-note
{
  "change": "release-history-test-inventory",
  "owner": "Public release documentation tests",
  "summary": "Verify existing release records survive fixture additions and resolve discovery links from declared paths.",
  "sources": [
    "scripts/docs/__tests__/public-documentation.test.mjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Test-only corrections; release discovery implementation, consumer behavior, stored data and publication are unchanged."
}
```

```update-note
{
  "change": "cross-version-consumer-acceptance",
  "owner": "Public release documentation and modeled consumer tests",
  "summary": "Complete independent cross-version and partial-adoption Text integration, preserve original evidence, and clarify public digest algorithms and composition-time definition reads.",
  "sources": [
    "apps/asyra-framework-site/public/llms.txt",
    "docs/public/content-manifest.json",
    "docs/public/generated/content-index.json",
    "docs/public/generated/source-map.json",
    "docs/public/llms.txt",
    "fixtures/app-update-text-cross-version/.gitattributes",
    "fixtures/app-update-text-cross-version/.gitignore",
    "fixtures/app-update-text-cross-version/.prettierrc",
    "fixtures/app-update-text-cross-version/.yarnrc.yml",
    "fixtures/app-update-text-cross-version/artifacts.json",
    "fixtures/app-update-text-cross-version/delivery/input-v1.tar.gz",
    "fixtures/app-update-text-cross-version/delivery/input-v1.tar.gz.sha256",
    "fixtures/app-update-text-cross-version/eslint.config.js",
    "fixtures/app-update-text-cross-version/evidence/baseline-build.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-format.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-install.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-lint.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-test.log",
    "fixtures/app-update-text-cross-version/evidence/baseline-typecheck.log",
    "fixtures/app-update-text-cross-version/evidence/independent-v1.tar.gz",
    "fixtures/app-update-text-cross-version/evidence/independent-v1.tar.gz.sha256",
    "fixtures/app-update-text-cross-version/evidence/original-evidence-sha256.json",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/before-guide-correction.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/before-integration.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/build.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/evidence-after-replay.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/gate.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/install.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/lint.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/status.json",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/test.log",
    "fixtures/app-update-text-cross-version/evidence/permanent-replay/typecheck.log",
    "fixtures/app-update-text-cross-version/evidence/preparation-status.json",
    "fixtures/app-update-text-cross-version/evidence/target-before-integration.log",
    "fixtures/app-update-text-cross-version/index.html",
    "fixtures/app-update-text-cross-version/package.json",
    "fixtures/app-update-text-cross-version/sources/1-text-component.ts.txt",
    "fixtures/app-update-text-cross-version/sources/2-text.ts.txt",
    "fixtures/app-update-text-cross-version/sources/3-core.ts.txt",
    "fixtures/app-update-text-cross-version/sources/4-fills.ts.txt",
    "fixtures/app-update-text-cross-version/src/__tests__/baseline-preservation.test.ts",
    "fixtures/app-update-text-cross-version/src/__tests__/cross-version-acceptance.test.ts",
    "fixtures/app-update-text-cross-version/src/__tests__/helpers.ts",
    "fixtures/app-update-text-cross-version/src/__tests__/migration-boundaries.test.ts",
    "fixtures/app-update-text-cross-version/src/__tests__/setup-canvas.ts",
    "fixtures/app-update-text-cross-version/src/definitions.ts",
    "fixtures/app-update-text-cross-version/src/documents.ts",
    "fixtures/app-update-text-cross-version/src/main.ts",
    "fixtures/app-update-text-cross-version/src/panel.ts",
    "fixtures/app-update-text-cross-version/src/runtime.ts",
    "fixtures/app-update-text-cross-version/test-data/ambiguous-units.json",
    "fixtures/app-update-text-cross-version/test-data/current.json",
    "fixtures/app-update-text-cross-version/test-data/locally-extended.json",
    "fixtures/app-update-text-cross-version/test-data/multiplier.json",
    "fixtures/app-update-text-cross-version/tools/package-delivery.py",
    "fixtures/app-update-text-cross-version/tools/test-delivery.py",
    "fixtures/app-update-text-cross-version/tsconfig.json",
    "fixtures/app-update-text-cross-version/vite.config.ts",
    "fixtures/app-update-text-cross-version/vitest.config.ts",
    "fixtures/app-update-text-cross-version/yarn.lock",
    "scripts/__tests__/app-update-fixtures.test.mjs",
    "scripts/ci-relationships.json",
    "scripts/docs/__tests__/public-documentation-validation.test.mjs",
    "scripts/docs/public-documentation-validation.mjs",
    "tools/flow-inspector/inspectors/asyra-public-package-documentation-flow-inspector.data.cjs"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Modeled local candidate fixture and public documentation only; production runtime, published package versions and original acceptance evidence remain unchanged. Independent results and maintainer replay are recorded separately."
}
```

```update-note
{
  "change": "release-guidance-closeout-integration",
  "owner": "Release guidance verification",
  "summary": "Retain exact cross-version evidence in CI, execute registered Cloudflare workflow tests, keep sitemap and Pixi case-count assertions aligned with their current inventories, register existing Text browser responsibilities and the spatial-query and text-mask cases with the Pixi owner, and synchronize persistent rule references and Inspector snapshots before archival.",
  "sources": [
    "apps/asyra-design/playwright-functional-flow-contracts.json",
    "tools/flow-inspector/inspectors/design-functional-flow-inspector.data.cjs",
    "tools/flow-inspector/control-plane/__tests__/contracts.test.cjs",
    "packages/render-engine-pixi/navigation-flow-contracts.json",
    "tools/flow-inspector/control-plane/__tests__/localization-runtime.test.cjs",
    "apps/asyra-framework-site/__tests__/e2e/site-links.spec.ts",
    "docs/public/generated/source-map.json",
    "scripts/__tests__/ci-scope.test.mjs",
    "scripts/__tests__/fixtures/retained-app-update-evidence.json",
    "scripts/__tests__/workspace-automation.test.mjs",
    "scripts/docs/__tests__/release-update-guidance.test.mjs",
    "tools/flow-inspector/control-plane/ci-script-selection.cjs",
    "tools/flow-inspector/inspectors/asyra-public-package-documentation-flow-inspector.data.cjs",
    "tools/flow-inspector/inspectors/release-update-guidance.flow.json",
    "tools/flow-inspector/workspace/workspace-bundle.data.js"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Verification references and exact-byte evidence retention only; no consumer runtime, versions or publication changes."
}
```

```update-note
{
  "change": "app-update-guidance-prerequisite",
  "owner": "App update documentation",
  "summary": "Provide public Text update guide entries and retain the original local-candidate integration fixtures and acceptance artifacts from the prerequisite App update guidance work.",
  "sources": [
    "apps/asyra-framework-site/__tests__/editorial-landing.test.mjs",
    "apps/asyra-framework-site/components/docs-page.tsx",
    "apps/asyra-framework-site/components/search-dialog.tsx",
    "fixtures/app-update-text-consumer/.gitignore",
    "fixtures/app-update-text-consumer/.prettierrc",
    "fixtures/app-update-text-consumer/.yarnrc.yml",
    "fixtures/app-update-text-consumer/e2e/text-review.html",
    "fixtures/app-update-text-consumer/e2e/text-review.ts",
    "fixtures/app-update-text-consumer/eslint.config.js",
    "fixtures/app-update-text-consumer/evidence/baseline-files.json",
    "fixtures/app-update-text-consumer/evidence/baseline-tests.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/fixed-chart-approved.png",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/fixed-console.json",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/fixed-new-text.png",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-build.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-final-state.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-history.png",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-lint.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-reloaded.png",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-test.txt",
    "fixtures/app-update-text-consumer/evidence/browser-follow-up/memory-typecheck.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-before.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-build.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-lint.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-naming.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-test.txt",
    "fixtures/app-update-text-consumer/evidence/follow-up-typecheck.txt",
    "fixtures/app-update-text-consumer/evidence/independent-adoption-before.txt",
    "fixtures/app-update-text-consumer/evidence/independent-build.txt",
    "fixtures/app-update-text-consumer/evidence/independent-lint.txt",
    "fixtures/app-update-text-consumer/evidence/independent-test.txt",
    "fixtures/app-update-text-consumer/evidence/independent-typecheck.txt",
    "fixtures/app-update-text-consumer/evidence/integration.patch",
    "fixtures/app-update-text-consumer/evidence/maintainer-follow-up.patch",
    "fixtures/app-update-text-consumer/evidence/retained-tests.txt",
    "fixtures/app-update-text-consumer/index.html",
    "fixtures/app-update-text-consumer/package.json",
    "fixtures/app-update-text-consumer/src/__tests__/setup-canvas.ts",
    "fixtures/app-update-text-consumer/src/__tests__/target-availability.test.ts",
    "fixtures/app-update-text-consumer/src/__tests__/text-preservation.test.ts",
    "fixtures/app-update-text-consumer/src/__tests__/text-shared-projection.test.ts",
    "fixtures/app-update-text-consumer/src/definitions.ts",
    "fixtures/app-update-text-consumer/src/documents.ts",
    "fixtures/app-update-text-consumer/src/main.ts",
    "fixtures/app-update-text-consumer/src/panel.ts",
    "fixtures/app-update-text-consumer/src/runtime.ts",
    "fixtures/app-update-text-consumer/test-data/current.json",
    "fixtures/app-update-text-consumer/test-data/multiplier.json",
    "fixtures/app-update-text-consumer/tsconfig.json",
    "fixtures/app-update-text-consumer/updates/target-artifacts.json",
    "fixtures/app-update-text-consumer/vite.config.ts",
    "fixtures/app-update-text-consumer/vitest.config.ts",
    "fixtures/app-update-text-consumer/yarn.lock",
    "fixtures/app-update-text-subsequent/.gitignore",
    "fixtures/app-update-text-subsequent/.prettierrc",
    "fixtures/app-update-text-subsequent/.yarnrc.yml",
    "fixtures/app-update-text-subsequent/delivery/revision-2/text-spacing-r2-independent.tar.gz",
    "fixtures/app-update-text-subsequent/delivery/revision-2/text-spacing-r2-independent.tar.gz.sha256",
    "fixtures/app-update-text-subsequent/eslint.config.js",
    "fixtures/app-update-text-subsequent/evidence/.gitignore",
    "fixtures/app-update-text-subsequent/evidence/artifact-contract.txt",
    "fixtures/app-update-text-subsequent/evidence/artifact-rebuild.txt",
    "fixtures/app-update-text-subsequent/evidence/baseline-build.txt",
    "fixtures/app-update-text-subsequent/evidence/baseline-lint.txt",
    "fixtures/app-update-text-subsequent/evidence/baseline-test.txt",
    "fixtures/app-update-text-subsequent/evidence/baseline-typecheck.txt",
    "fixtures/app-update-text-subsequent/evidence/documentation-tests.txt",
    "fixtures/app-update-text-subsequent/evidence/independent-artifact-verification.log",
    "fixtures/app-update-text-subsequent/evidence/independent-baseline.log",
    "fixtures/app-update-text-subsequent/evidence/independent-build.log",
    "fixtures/app-update-text-subsequent/evidence/independent-format.log",
    "fixtures/app-update-text-subsequent/evidence/independent-install.log",
    "fixtures/app-update-text-subsequent/evidence/independent-lint-first.log",
    "fixtures/app-update-text-subsequent/evidence/independent-lint.log",
    "fixtures/app-update-text-subsequent/evidence/independent-old-candidate-regression.log",
    "fixtures/app-update-text-subsequent/evidence/independent-session.json",
    "fixtures/app-update-text-subsequent/evidence/independent-test.log",
    "fixtures/app-update-text-subsequent/evidence/independent-typecheck.log",
    "fixtures/app-update-text-subsequent/evidence/input-files.json",
    "fixtures/app-update-text-subsequent/evidence/integration.patch",
    "fixtures/app-update-text-subsequent/evidence/previous-fixture-files.json",
    "fixtures/app-update-text-subsequent/evidence/replay-and-history.txt",
    "fixtures/app-update-text-subsequent/evidence/retained-build.txt",
    "fixtures/app-update-text-subsequent/evidence/retained-lint.txt",
    "fixtures/app-update-text-subsequent/evidence/retained-test.txt",
    "fixtures/app-update-text-subsequent/evidence/retained-typecheck.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/artifact-check.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/baseline-install.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/baseline-install.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/baseline.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/baseline.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/build.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/build.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/final-integrity.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/format.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/integrity.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/lint.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/lint.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/lockfile.diff",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/old-candidate.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/old-candidate.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/target-install.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/target-install.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/test.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/test.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/typecheck.exit",
    "fixtures/app-update-text-subsequent/evidence/revision-2/context-rerun/logs/typecheck.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/delivery-replay.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-follow-up/docs-r2-build.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-follow-up/docs-r2-lint.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-follow-up/docs-r2-test.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-follow-up/docs-r2-typecheck.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/documentation-tests.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/handoff-check.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/history-check.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/log-retention-before.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/naming.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/packaging-verification.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/prepare.py",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/protected-files.json",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/build.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/install.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/lint.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/test.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/validation/typecheck.log",
    "fixtures/app-update-text-subsequent/evidence/revision-2/packaging/verify-package.py",
    "fixtures/app-update-text-subsequent/evidence/revision-2/previous-evidence-files.json",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-build.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-lint.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-records.patch",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-test.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/retained-typecheck.txt",
    "fixtures/app-update-text-subsequent/evidence/revision-2/website-entry.txt",
    "fixtures/app-update-text-subsequent/evidence/website-entry.txt",
    "fixtures/app-update-text-subsequent/index.html",
    "fixtures/app-update-text-subsequent/package.json",
    "fixtures/app-update-text-subsequent/src/__tests__/revision-two-adoption.test.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/setup-canvas.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/subsequent-preservation.test.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/target-availability.test.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/text-preservation.test.ts",
    "fixtures/app-update-text-subsequent/src/__tests__/text-shared-projection.test.ts",
    "fixtures/app-update-text-subsequent/src/definitions.ts",
    "fixtures/app-update-text-subsequent/src/documents.ts",
    "fixtures/app-update-text-subsequent/src/main.ts",
    "fixtures/app-update-text-subsequent/src/panel.ts",
    "fixtures/app-update-text-subsequent/src/runtime.ts",
    "fixtures/app-update-text-subsequent/test-data/current.json",
    "fixtures/app-update-text-subsequent/test-data/locally-extended.json",
    "fixtures/app-update-text-subsequent/test-data/multiplier.json",
    "fixtures/app-update-text-subsequent/tools/prepare-artifacts.py",
    "fixtures/app-update-text-subsequent/tools/test-artifacts.py",
    "fixtures/app-update-text-subsequent/tools/test-handoff.py",
    "fixtures/app-update-text-subsequent/tsconfig.json",
    "fixtures/app-update-text-subsequent/updates/base-artifacts.json",
    "fixtures/app-update-text-subsequent/updates/model-artifact.json",
    "fixtures/app-update-text-subsequent/updates/sources/1-text-component.ts.txt",
    "fixtures/app-update-text-subsequent/updates/sources/2-text.ts.txt",
    "fixtures/app-update-text-subsequent/updates/sources/3-core.ts.txt",
    "fixtures/app-update-text-subsequent/updates/sources/4-fills.ts.txt",
    "fixtures/app-update-text-subsequent/vite.config.ts",
    "fixtures/app-update-text-subsequent/vitest.config.ts",
    "fixtures/app-update-text-subsequent/yarn.lock",
    "plugins/asyra-skill/skills/asyra-skill/bundle.json"
  ],
  "impact": "no-action",
  "guides": [],
  "reason": "Documentation discovery and retained consumer test assets only; no consumer runtime API or saved-data format changes. Original independent acceptance, contextual reruns and permanent fixture evidence remain distinct."
}
```
