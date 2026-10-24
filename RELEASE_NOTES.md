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
