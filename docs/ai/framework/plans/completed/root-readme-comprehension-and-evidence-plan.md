# Root README Comprehension and Evidence Plan

## Status

Completed on 2026-09-26. At main source commit
<a href="https://github.com/karote00/asyra/blob/3e9bdc0488a0d1b53430abb44fc7cfbf79bff043/README.md"
target="_blank" rel="noopener noreferrer">`3e9bdc0488a0d1b53430abb44fc7cfbf79bff043`</a>,
the root `README.md` contains the
product-first composition, published Generic Starter path, current product
evidence, ownership boundaries, support policy, and explicit non-capabilities.
The required composite `yarn docs:readme:check` passed against that source on
2026-09-26. Its output confirmed 19 public package READMEs, 23 valid README
surfaces with 119 links, and current public documentation across 41 pages and
19 packages.

The visual matrix was regenerated from GitHub's GFM rendering of that exact
commit with installed Chrome in headless mode. Desktop (1200x1000) and narrow
(390x844) captures cover media loaded and unavailable, with top, entry-path,
and product-evidence views. The media-loaded views had all three README images
loaded; media-unavailable views showed image alt text. The document width
matched each viewport, with no page-level horizontal overflow. All twelve
inspected PNGs are retained beside this completed plan under
[`root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/`](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/).

The earlier Task 5 gate result below is historical: it reported 15 Design
template differences on that run. The 2026-09-26 composite gate passed, so the
historical count is not a current failure or a repair estimate. Future README
changes must renew the gate and visual review for their own source diff. The
[Adoption Entry and Onboarding Program](adoption-entry-and-onboarding-program-plan.md)
owns the overall adoption journey.

| View                                 | Top                                                                                                           | Entry path                                                                                                      | Product evidence                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Desktop 1200x1000, media loaded      | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-desktop-media-top.png)    | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-desktop-media-entry.png)    | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-desktop-media-evidence.png)    |
| Desktop 1200x1000, media unavailable | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-desktop-no-media-top.png) | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-desktop-no-media-entry.png) | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-desktop-no-media-evidence.png) |
| Narrow 390x844, media loaded         | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-narrow-media-top.png)     | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-narrow-media-entry.png)     | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-narrow-media-evidence.png)     |
| Narrow 390x844, media unavailable    | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-narrow-no-media-top.png)  | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-narrow-no-media-entry.png)  | [PNG](root-readme-comprehension-and-evidence/visual-evidence/3e9bdc0/current-readme-narrow-no-media-evidence.png)  |

## Completion record

- **Decision:** close this plan after the composite README gate and current
  visual evidence both passed for the integrated README source.
- **Outcome:** the README entry hierarchy, product evidence, links and
  media-unavailable alt text were reviewed at desktop and narrow widths. The
  full README gate passed; all twelve current-source screenshots are linked
  above and stored with this completed record.
- **Exit criteria:** the required composite gate passed; the four desktop/
  narrow and media-loaded/unavailable cases were captured and inspected; the
  page did not overflow either viewport; the evidence paths resolve.
- Future README layout or media edits still require the same checks for their
  own source diff.

This plan follows the completed
[Asyra Public README and Entrypoint Alignment Plan](asyra-public-readme-and-entrypoint-alignment-plan.md).
That plan remains the authority for the public README inventory, owner mapping,
generated surfaces, link validation, support facts, and contribution policy.
This plan changes only the root README's communication design within those
accepted contracts.

## Goal

Turn the root `README.md` from a precise but predominantly textual Framework
contract into a fast, evidence-backed public entry point. A first-time visitor
should be able to understand what Asyra is, what kind of product it helps build,
which infrastructure it replaces, how one App-owned Feature looks in practice,
and which supported starting path to choose without reading the full public
documentation first.

The README must remain technically truthful and compact. Visual and structural
variety exists to reduce the cognitive cost of understanding invisible
infrastructure, not to imitate a marketing site or add decoration.

## Problem Statement

The current root README accurately explains Framework, Preset, App, transaction,
rollback, canonical state, projection, persistence, and support boundaries. Its
first half nevertheless asks a new reader to understand several abstract
concepts primarily through prose and Mermaid diagrams.

The original missing communication layers were:

- direct product evidence showing a real product built with Asyra;
- a concrete comparison between repeated conventional product plumbing and one
  bounded Asyra Feature owner;
- a minimal code proof of the Feature authoring model;
- a clearer separation between capabilities demonstrated today, domains that
  can be composed by an App, and turnkey domain modules Asyra does not provide;
  and
- a shorter reader journey from first impression to the correct supported
  starting point.

At the adoption baseline, the current README implements each layer above with
existing product evidence and public-entry constraints. Remaining work is
review, integration tracking, and later updates for adoption artifacts that do
not exist yet, especially the generic `create-asyra-app` path. Do not revert to
the older "not started" status merely because later adoption tasks remain open.

## Bounded Task Contract

- **Objective:** restructure and enrich only the root README so its public value
  proposition is understandable through product, comparison, code, and
  architecture evidence.
- **Implementation owner:** root `README.md`, its directly referenced committed
  README media when approved, the root README assertions in
  `scripts/docs/__tests__/public-readme-inputs.test.mjs`, and only the generated
  public-documentation freshness record required by the existing README
  validation workflow.
- **Fixed discovery:** the current root README, current public support and
  release guide, current public package inventory, the maintained Asyra Design
  demo and case study, verified public Feature guides and executable source, and
  the accepted README validation scripts.
- **Required evidence:** every product image, code example, capability statement,
  package count, command, URL, and support statement resolves to a maintained
  current owner.
- **Required gates:** focused root README contract tests, the full public
  README check, public-documentation freshness, link validation, copy-style
  validation, GitHub-compatible desktop/narrow rendering with media loaded and
  unavailable, and a final bounded diff review. The composite README check
  passed on 2026-09-26; the completed visual matrix is linked above. New README
  layout or media edits require renewed rendering review for their source diff.
- **Excluded:** package README rewrites, App or CLI README rewrites, Framework or
  App behavior changes, new public APIs, new packages, website implementation,
  production deployment, and unsupported future capability claims.
- **Stop:** a proposed proof has no maintained source, a minimal example cannot
  use a verified public entrypoint, GitHub rendering makes the intended hierarchy
  unreliable, or the new structure conflicts with current support or release
  facts.

## Audience and Reader Jobs

The README serves four primary readers in this order:

1. **Technical evaluator:** determine within one screen what Asyra is and why it
   exists.
2. **Product or domain builder:** recognize whether Asyra can support the kind of
   tool they need without assuming that Asyra supplies their domain logic.
3. **Framework adopter:** see one credible product and one credible code path,
   then choose package-first composition or the ready-to-use design product.
4. **Reviewer or maintainer:** verify current support, ownership, documentation,
   contribution policy, security, and license without searching the repository.

## Target Reader Journey

The revised README should read in this order:

```text
See one real result
-> understand the infrastructure problem
-> compare conventional ownership with one bounded Feature
-> inspect one minimal public Feature
-> choose a supported starting point
-> understand ownership and runtime flow
-> distinguish current proof from composable directions
-> verify support, documentation, and project policy
```

The first screen must answer "what is this?", "what can it help me build?", and
"where is the proof?" without requiring Framework terminology.

## Planned Information Architecture

### 1. Identity, positioning, and primary actions

- Keep `Asyra` and the product-first positioning, but compress the opening into
  one definition and one outcome statement.
- Expose the maintained documentation, live demo, and supported install or
  starter action near the top.
- Use badges only for compact verified facts that help adoption. Do not add
  vanity, activity, or decorative badges.

### 2. Product proof: built with Asyra today

- Present Asyra Design as the maintained complete product implementation.
- Use one high-information product image, short motion asset, or compact montage
  only after the asset is reviewed for authenticity, legibility, repository
  weight, accessibility, and GitHub rendering.
- State which current contracts the product demonstrates: App-owned Features,
  editable information, rendering, Undo/Redo, persistence, and optional
  collaboration or AI only where the maintained product path proves them.
- Link directly to the demo and case study.
- Make clear that the product UI and design-domain behavior belong to the App,
  not to Framework Core.

### 3. Concrete value comparison

- Replace part of the long opening explanation with one compact, accessible
  comparison.
- The conventional side shows the same behavior separately entering product UI,
  AI or automation, saved work, Undo/Redo, and synchronization concerns.
- The Asyra side shows one App-owned Feature entering established transaction,
  validation, rollback, projection, and persistence boundaries.
- Avoid claims that every product change literally edits one file. The promise
  is one explicit behavior owner and one governed path, not an artificial line
  or file-count guarantee.

### 4. Minimal Feature proof

- Add one short, verified, copyable example from a maintained public Feature
  path.
- The example must show the App-owned intent and registration boundary without
  teaching private internals or requiring unrelated setup.
- Accompany the example with no more than three annotations: what the App owns,
  which correctness infrastructure is reused, and how multiple callers reach
  the same action boundary.
- The example is a comprehension proof, not a replacement for the complete
  Feature session guide.
- If no existing public example is concise and executable enough, stop and
  resolve that documentation prerequisite as a separately authorized task
  instead of inventing pseudo-API for the README.

### 5. Supported starting paths

- Preserve the two truthful entrances:
  - package-first composition through `@asyra/core`; and
  - the complete Asyra Design product through `create-asyra-design-app`.
- Make the choice scannable through reader intent rather than long explanatory
  paragraphs.
- Keep install commands exact and preserve Yarn, npm, and pnpm claims only where
  their current owners verify them.

### 6. How Asyra works and who owns what

- Retain one compact runtime flow because it explains a relationship that prose
  alone cannot communicate efficiently.
- Retain the Framework, Preset, App, and backend ownership boundaries, but move
  them after the product and code proofs.
- Remove or consolidate any diagram or paragraph that repeats the same claim
  without adding a new decision.

### 7. Current proof, composable directions, and non-capabilities

Split the current broad domain story into three explicit levels:

- **Built and demonstrated today:** only maintained public products and verified
  runtime capabilities.
- **Compose your domain:** examples such as BIM, industrial, simulation, or
  research products, framed as App-owned information, rules, engines, services,
  and workflows that can use common Framework infrastructure.
- **Not turnkey modules:** clarify that Asyra does not bundle those industries'
  domain models or guarantee currently unsupported 3D, hybrid, headless, or
  multi-runtime capability.

### 8. Trust and continuation

- Preserve current support, documentation, security, contribution, and license
  sections.
- Keep exact support limitations prominent enough that the richer presentation
  cannot be mistaken for a broader capability claim.
- End with a small set of next actions rather than another value summary.

## Evidence and Asset Rules

- Prefer repository-owned, reproducible product evidence over conceptual stock
  imagery or generated domain mockups.
- A product image must represent the current public product and identify which
  claim it proves.
- Images need meaningful alternative text; decorative media use empty alt text.
- Media must remain legible in GitHub light and dark presentation and must not
  contain essential text that is unavailable in Markdown.
- Keep the README usable when images fail to load.
- Avoid oversized GIFs. Prefer an optimized still or short, lightweight format
  supported reliably by GitHub.
- Do not copy website-only artwork merely to create visual variety. A shared
  asset requires a clear canonical owner and update policy.

## Execution Stages

### Stage 1: Freeze claims and evidence

- Implemented at baseline: proposed sections map to current public support,
  release, Asyra Design, public Feature, and README validation owners.
- Implemented at baseline: the real-product proof is Asyra Design, including
  the 7,076-element sample and CRDT evidence; the minimal Feature proof is the
  maintained Undo/Redo Feature excerpt.
- Implemented at baseline: current README assertions are covered by
  `scripts/docs/__tests__/public-readme-inputs.test.mjs` and
  `scripts/docs/public-readme-validation.mjs`.
- Stop before composition if either proof is unavailable or misleading.

### Stage 2: Produce a text-first README composition

- Implemented at baseline: README opens with `Build product features, not
infrastructure`, provides product proof before internal architecture detail,
  and uses GitHub-safe Markdown/HTML for links and media.
- Implemented at baseline: comparison and supported-path sections are present.
- Verified at baseline by the existing focused README assertions and link
  validation. Generic Starter activation was outside this README slice at that
  time and was later delivered under Adoption Task 8.

### Stage 3: Add reviewed product evidence

- Implemented at baseline: committed Asyra Design product evidence appears in
  the README with meaningful alternative text and captions.
- Locally verified by focused README contract checks and direct public README
  validation entrypoints. Product-owner review and integration were completed
  later through PR #260, as recorded in the Adoption completion plan.
- Task 5 executed the GitHub-compatible desktop/narrow, media-present and
  media-unavailable matrix noted above. Future README layout or media changes
  require renewed rendering evidence for their own diff.

### Stage 4: Close contracts and validate

- Implemented at baseline: focused root README tests assert the new semantic
  anchors and reject retired entry surfaces.
- The #243 work ran focused Node checks for the README inputs/validation
  surface; those are not treated as the full gate. The complete
  `yarn docs:readme:check` passed on 2026-09-26 for source commit
  `3e9bdc0488a0d1b53430abb44fc7cfbf79bff043`.
- Product-owner review and merge completed through PR #260; the public release
  and later Generic Starter entry are recorded in the completed Adoption plan.

## Acceptance Cases

1. A new reader can identify Asyra as a composable Framework rather than a
   hosted AI builder, canvas widget, or design-tool-only SDK.
2. A real product appears before the reader must understand canonical state or
   projection terminology.
3. The conventional-versus-Asyra comparison communicates explicit ownership
   without claiming impossible one-file universality.
4. The minimal Feature uses current public API and links to the maintained full
   guide.
5. Package-first and complete-product starting paths remain distinct and
   executable.
6. Current product proof is visually and verbally separated from possible App
   domains and unsupported turnkey capabilities.
7. Current support, contribution, security, and license facts remain intact.
8. The README is understandable without images and does not duplicate the public
   documentation manual.

## Definition of Done

- Baseline implementation satisfies the target reader journey, distinct product,
  comparison, code, architecture and support evidence, and traceability to
  maintained current owners.
- All root and corpus-level public README gates must pass for any new change to
  this plan or README.
- GitHub-compatible rendering review passed for source commit
  `3e9bdc0488a0d1b53430abb44fc7cfbf79bff043`; the twelve committed captures are
  linked above. New README layout or media changes require renewed desktop and
  narrow review with media loaded and unavailable.
- Product-owner review and merge completed through PR #260. The public release
  and Generic Starter activation are verified in the completed Adoption plan.
- No package, App, CLI, Framework runtime, or website behavior changes are
  authorized by this plan.
