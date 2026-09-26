Never record completed plans here.

# Framework Plans

This file tracks framework planning topics and points to detailed references.

## Completed Adoption and Onboarding Program

The [Adoption Entry and Onboarding Program](plans/completed/adoption-entry-and-onboarding-program-plan.md)
completed Tasks 1-8 and the overall adoption acceptance on 2026-09-26. Its
record retains the integration history, published Starter evidence, live
website routes, independent onboarding verification, full README gate result,
and links to the current desktop/narrow visual matrix. GitHub Discussions
settings remain user-owned and outside closeout; Sim maintenance and controlled
hardware benchmarks are independent follow-up work.

Tasks 1-6 have integrated child results through PR #252 at
`4b8015f6e01e5eaeba1227132e8dffbe076fa64b`; #254/#255 subsequently
integrated the Starter build-owner repair and approved visual/drag board at
`86674ccc21ead7ad73f1fe57cb602258efbc6f63`. PR #253 merged with all reported
checks successful, and parent PR #242 merged the adoption integration into main
at `e550e87b29824f72a1430eb34eac98f18c33235d`. The independent single-agent
priority onboarding run from main is complete and has a retained generated
consumer and formal tests.

Task 8 is complete: `create-asyra-app@0.1.0` is published; PR #260 integrated
the public README/AI discovery/homepage entry; and the website production
deployment and live Starter/documentation routes are verified in the adoption
plan. No Task 8 acceptance item remains open.

## Active Public Entry Experience Plans

These plans improve how new visitors understand and verify the existing public
Framework. They do not authorize Framework behavior changes, new public APIs,
or unsupported capability claims.

1. Website product and technical evidence

- Current homepage authority is the accepted six-chapter spatial story at `/`,
  with product evidence and three build/evaluate entries following it.
- Treat the older product-and-technical-evidence and five-chapter brand-story
  sections as version background unless a new homepage task explicitly changes
  the current spatial-story contract.
- Plan:
  `docs/ai/framework/plans/website-product-and-technical-evidence-plan.md`

## Completed Public Entry Plans

- [Root README Comprehension and Evidence](plans/completed/root-readme-comprehension-and-evidence-plan.md)
  completed on 2026-09-26. The composite README gate passed and the current
  desktop/narrow, media-loaded/unavailable evidence is committed with its plan.

## Active Pre-Release Blockers

None.

The Input System environment-neutrality prerequisite completed on 2026-08-10.
Its retained plan and Inspector are:

- `docs/ai/framework/plans/completed/input-system-environment-neutrality-plan.md`
- `tools/flow-inspector/inspectors/input-system-environment-neutrality-flow-inspector.data.cjs`

No active App persistence blocker remains. The completed
socket-authoritative document-session record is:

- App semantic authority:
  `../apps/asyra-design/specs/socket-authoritative-document-session.md`.
- Completed implementation plan:
  `../apps/asyra-design/plans/completed/socket-authoritative-document-persistence-plan.md`.
- Retained Inspector:
  `../apps/asyra-design/plans/socket-authoritative-document-persistence-flow-inspector.data.cjs`.

## Framework Release Gates

None.

Framework Release Gate 5 closed with a pre-publication artifact `READY` result
on 2026-08-05. Merge, Node.js 24 migration, registry publication, create-app
release, deployment, and the formal release remain separately owned work.

## Release and Distribution Sequence

Complete these plans in order unless a plan explicitly allows read-only
research to proceed without mutating the repository or an external system.

The Node.js 24 runtime prerequisite completed with local, CI, and Vercel
Preview `READY` evidence on 2026-08-05. The retained records are:

- Completed plan:
  `docs/ai/framework/plans/completed/node-24-runtime-upgrade-and-vercel-validation-plan.md`.
- Retained Inspector:
  `tools/flow-inspector/inspectors/node-24-runtime-upgrade-flow-inspector.data.cjs`.

1. Integrated public release candidate

- Completed on 2026-08-10 with all nine child workstreams, production website
  verification, and integration PR CI accepted.
- Completed plan:
  `docs/ai/framework/plans/completed/asyra-framework-website-plan.md`

2. Framework package publication process

- Begin only after the integrated pre-publication Release Candidate is
  accepted.
- Record the historical partial public inventory without reconstructing or
  publishing an old package version from the current source.
- Let the reviewed Changeset plan and fixed-allowlist manifests own every
  selected Framework target version; active plans and validators must not
  duplicate numeric package versions.
- Freeze a clean exact source commit on `main` or the release feature branch,
  rebuild the accepted artifacts from that commit, and revalidate the
  publication manifest. Merge is not a publication prerequisite.
- Publish the manifest-derived Framework selection through one canonical
  Changesets publication operation after explicit authorization.
- Treat the all-package generator as exceptional. Normal development must add
  ordinary scoped patch Changesets as changes are made.
- Keep root `asyra`, private `@asyra/asyra-design`, CLI packages, and generated
  templates outside Framework Changesets.
- This is an operational release process, not an unimplemented Framework
  feature or active plan.
- Canonical workflow:
  `docs/ai/workflows/package-release-validation.md`
- Version authority:
  `docs/ai/framework/rules/release-version-topology.md`
- Executable owner:
  `scripts/release-full.js`

3. Applicable CLI/generated-app publication and root alignment

- If the integrated candidate changes the public CLI artifact or generated
  app, freeze a new bounded CLI release execution through the retained
  create-app Inspector before publication. A completed historical execution is
  evidence, not automatic authority for a new release.
- Obtain explicit CLI version and publication authorization before any registry
  write, then repeat the complete public-command generated-app proof.
- Begin root `asyra` family alignment only after the applicable Framework
  packages and corresponding create-app CLI are publicly verified.
- Manually align root `asyra` to `a.b.0`; never place root in a Changeset.
- Root versioning, CLI publication, tags, and pushes retain their own explicit
  authorization boundaries.
- Reference: `docs/ai/framework/rules/release-version-topology.md`

4. Public fact reconciliation and website launch

- Replace only generated/provisional package versions, commands, support facts,
  and verified URLs after their public owners resolve.
- Repeat registry-only examples, generated-app onboarding, public links,
  search, release inventory, affected visual cases, and final Preview gates.
- Obtain separate website production-deployment authorization, deploy the exact
  final candidate, and verify production.
- Close the overall release train only when every child workstream and every
  applicable external release owner is complete.

## Post-Release Roadmap

1. Headless Core and Core Kernel (unscheduled)

- Research a truthful non-visible runtime, optional adapter boundary, and
  runtime-owner model before adding any public API or support claim.
- The future task must distinguish Node-safe import, one process-scoped
  non-visible runtime, dependency-neutral kernel composition, and multi-runtime
  isolation rather than treating all four as “headless.”
- Future plan:
  `docs/ai/framework/plans/headless-core-and-core-kernel-future-plan.md`.
- Research index:
  `docs/ai/framework/research/headless-core-and-core-kernel-architecture-research.md`.

2. Official 2D/3D/hybrid preset profiles

- Publish a render-mode profile only after its concrete engine and canonical
  feature/property/schema/render/input default modules exist and pass the engine
  boundary contract.
- `3d` requires a supported 3D engine; `hybrid` additionally requires an
  explicit multi-engine composition and interaction contract.
- Do not expose empty, placeholder, or capability-incomplete profiles.
- Reference: `docs/ai/framework/plans/preset-2d-3d-init-profile-plan.md`

3. Auto-layout behavior engine (lowest-priority roadmap family)

- Advanced optional Preset behavior for design tools; it is not a first-release
  framework requirement.
- Reference: `docs/ai/framework/plans/auto-layout-behavior-engine-plan.md`

4. Unit-aware property model (auto-layout-oriented)

- Support value+unit semantics in schema/aggregates.
- Keep auto-layout implementation out of this phase.
- Reference: `docs/ai/framework/plans/unit-conversion-and-ui-aggregation-plan.md`

5. UI aggregate helpers (lowest priority, auto-layout-related)

- Mixed values and mixed units (`MIX`) helpers.
- App-level registration remains first-class.
- Reference: `docs/ai/framework/plans/unit-conversion-and-ui-aggregation-plan.md`
