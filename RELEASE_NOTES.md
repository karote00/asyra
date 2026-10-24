# Asyra Release Notes

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
  "summary": "Retain exact cross-version evidence in CI, execute registered Cloudflare workflow tests, and synchronize persistent rule references and Inspector snapshots before archival.",
  "sources": [
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
