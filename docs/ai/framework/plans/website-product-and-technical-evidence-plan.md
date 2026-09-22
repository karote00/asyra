# Website homepage - accepted continuous story

## Current contract

At adoption baseline `b44be9e77b6a742ad8094da008b4122c06d51a2a` on
2026-09-23, the current homepage implementation is
`apps/asyra-framework-site/app/page.tsx`, which composes `SpatialStory`,
`HomeResources`, and `SiteFooter`. The product owner approved replacing the
former homepage with the six-chapter green spatial story. The current visual,
content, ownership and verification contract is
[the homepage contract](../../../../apps/asyra-framework-site/docs/spatial-story.md#current-homepage-contract).
It supersedes the older composition requirements recorded below: the factory
film, five brand chapters, separate architecture explainer and PoC comparison
are no longer homepage requirements. `/story` is removed, not redirected.
Supporting documentation, product case, Runtime Atlas, releases and roadmap
retain their independent owners. Existing SEO/indexing environment policy is
preserved. Product evidence and the three build/evaluate entry points follow
the story without repeating it.

Direct evidence at this baseline:

- `apps/asyra-framework-site/docs/spatial-story.md` defines the accepted
  six-chapter story, `/` route ownership, `/story` removal, product evidence,
  build/evaluate entries, native menu, responsive, reduced-motion and
  no-JavaScript contracts.
- `apps/asyra-framework-site/__tests__/home-integration.test.mjs` asserts one
  six-chapter story, `HomeResources`, footer composition, old preview route
  removal, product evidence, and the current resource routes.
- `apps/asyra-framework-site/__tests__/spatial-story.test.mjs`,
  `spatial-story-continuity.test.mjs`, and
  `__tests__/e2e/spatial-story.spec.ts` cover continuity, finite/reversible
  frames, static snapshots, desktop, mobile, reduced-motion, no-JavaScript, and
  the building-replacement story.
- `apps/asyra-framework-site/components/home-resources.tsx` currently routes
  homepage CTAs to the live Asyra Design product, `/asyra-design`,
  `/docs/start/custom-composition`, `/docs/start/create-design-app`, and
  `/atlas`.

Task 5's local entry revision keeps the same six-chapter story, product proof,
three-card resource structure, and Atlas link. The cards now route in order to
`/docs#generic-starter-source`, `/docs/start/create-design-app`, and
`/docs/start/custom-composition`. The Starter card identifies source and
onboarding availability while its public CLI remains unpublished. Direct
homepage tests, 46-route smoke, and 18 desktop/mobile browser cases passed;
entry screenshots remain under the Task 5 worktree's
`apps/asyra-framework-site/test-results/platform/`. This is local review
evidence, not deployment or product-owner acceptance.

This records the current implemented and formally covered homepage baseline. It
does not claim final product-owner acceptance of every visual detail, integrated
CI completion, deployment, or future adoption-entry readiness. If that
acceptance state is unclear, keep the spatial-story contract authoritative and
record the review gap instead of declaring another homepage contract current.

## Prior composition record - superseded

# Website Product and Technical Evidence Plan

## Status

Historical implementation candidate completed on 2026-09-01. At the adoption
baseline, this record is superseded for current homepage authority by the
six-chapter spatial-story contract above. Keep the historical product-first
thesis, Asyra Design, Feature/runtime, ownership and readiness observations as
background only; do not use them to override the current `/` implementation or
to resurrect the retired factory film, five brand chapters, separate
architecture explainer, or PoC comparison.

Final completion of the current homepage still depends on the review,
integration and deployment states owned by the website/homepage workflow and the
adoption program. A page existing at `/` is implementation evidence, not proof
that every adoption journey task is complete.

This plan follows the completed
[Asyra Result-First Landing Page Plan](completed/asyra-website-landing-page-plan.md)
and the completed
[Asyra Framework Website Program](completed/asyra-framework-website-plan.md).
Those records remain historical authorities for the accepted launch,
platform, routes, visual system, and verified product contracts. This plan
preserves the current result-first identity while adding the evidence needed to
move a visitor from conceptual belief to technical confidence.

## Goal

Make `Build product features, not infrastructure.` the landing page's central
product thesis, then prove that thesis with real product evidence, a minimal
code proof, and an explicit Framework-versus-App ownership bridge. The page
should continue to lead with the result and remain visually distinctive, but it
should no longer ask conceptual illustrations alone to prove that Asyra is
implemented, adoptable, and correctly bounded.

The intended result is not a longer marketing page. It is a better evidence
sequence in which every major visitor question has the right kind of proof.
Every major section should advance one coherent argument: the visitor owns the
product's information, rules, workflows, and experience; Asyra supplies the
reusable infrastructure that keeps those product features governed, reversible,
persistable, and extensible.

## Problem Statement

The current landing page already communicates the product thesis through a
strong, coherent visual system:

- one foundation for many domains;
- PoC-to-product continuity;
- one explicit Feature owner instead of repeated product plumbing;
- modular growth;
- one governed path for people and AI; and
- one source of truth across features and views.

Its remaining gap is proof density. Most visual evidence is conceptual. A
visitor can understand what Asyra believes without seeing enough of:

- the maintained product built with it;
- the public code model behind one bounded Feature;
- the exact boundary between Framework infrastructure and App-owned domain
  behavior; and
- the current support and maturity facts that distinguish implemented
  capability from roadmap direction.

## Bounded Task Contract

- **Objective:** revise the `/` landing-page content architecture so conceptual
  claims are organized around `Build product features, not infrastructure.` and
  followed by current product, code, ownership, and support evidence.
- **Implementation owner:** `apps/asyra-framework-site/app/page.tsx`, its
  landing-only styles and components, approved landing media under
  `apps/asyra-framework-site/public`, directly affected landing semantic and
  visual tests, this plan, and the Landing Inspector only when its governed
  content or flow contract must change.
- **Fixed discovery:** current production landing behavior, the completed landing
  and website plans, current Asyra Design route and demo, current public case
  study, a verified public Feature example, current support and release pages,
  existing landing tests, and the current visual-review viewports.
- **Required evidence:** every new product frame, code sample, ownership claim,
  support fact, action, and destination is current, maintained, and attributable
  to a canonical owner.
- **Required gates:** Inspector readiness before applicable implementation,
  semantic landing regression tests, copy style, site lint, strict typecheck,
  production build, route smoke, no-JavaScript reading, reduced motion,
  keyboard and focus review, link validation, and synchronized section-level
  plus full-page visual review at the accepted desktop, tablet, and phone widths.
- **Excluded:** redesigning the complete visual identity, replacing accepted
  mechanical artwork without product-owner approval, changing supporting route
  semantics, Framework or Asyra Design behavior changes, new packages,
  analytics, production deployment, and claiming future 3D, hybrid, headless,
  or multi-runtime support.
- **Stop:** no authentic current product evidence is suitable for the landing
  page, no concise public Feature example can support the claim, the additional
  evidence makes the page materially harder to scan, a new dependency is
  required, or a visual decision conflicts with the accepted landing authority
  without product-owner approval.

## Audience and Conversion Questions

The landing page must answer these questions in order:

1. **Value:** Why should I spend product effort on Asyra rather than rebuilding
   infrastructure?
2. **Possibility:** What kind of tool could I build?
3. **Reality:** Is there a complete product built on this architecture today?
4. **Mechanism:** What does one bounded Feature look like in code and flow?
5. **Boundary:** What does Asyra own, and what remains mine?
6. **Readiness:** What can I use now, and where do I start?

The current page answers the first two strongly. This plan adds explicit answers
for the remaining four.

## Target Evidence Sequence

```text
Build product features, not infrastructure
-> the product outcome this makes possible
-> why the same foundation applies across domains
-> one concrete maintenance-cost comparison
-> real product proof
-> one Feature in code and in the governed action path
-> Framework versus App ownership
-> supporting conceptual proofs
-> current support and starting paths
-> domain-owned closing
```

The final implementation may consolidate or reorder existing sections, but it
must not duplicate the same claim in product, conceptual, and code forms unless
each form answers a different reader question.

## Planned Content Architecture

### 1. Preserve the result-first hero

- Use `Build product features, not infrastructure.` as the primary Hero
  headline and stable positioning statement.
- Retain the result-first meaning of `Build the tool your world needs.` as a
  supporting line, transition, or later outcome statement rather than a
  competing headline. Its final placement must make the hierarchy unambiguous:
  Asyra removes repeated infrastructure work so builders can create the tool
  their domain needs.
- Follow the headline with one concise explanation that names both sides of the
  contract: the App owns product information, rules, workflows, services, and
  UI; Asyra coordinates intent routing, transactions, rollback, Undo/Redo,
  validation, persistence boundaries, and downstream projections.
- Keep one primary build action and one direct product-demo action.
- Add a compact category clarification near the hero or immediately after it so
  visitors understand that Asyra is a composable Framework, not a hosted AI app
  builder, no-code platform, canvas widget, or bundle of industry solutions.
- Review `AI builds with Asyra` for ambiguity. Preserve its meaning only with
  nearby language that retains engineering review, testing, security, and
  performance ownership.

### 2. Explain why many domains share one foundation

- Preserve the broad domain imagination of `One foundation. Any field.`
- Add one concise bridge explaining the shared infrastructure beneath visibly
  different products: editable information, governed actions, transaction and
  Undo/Redo boundaries, persistence, projections, and replaceable providers.
- Keep domain examples framed as App compositions, not current turnkey Asyra
  modules.
- Do not add more domain icons merely to imply breadth.

### 3. Keep one concrete value comparison

- Preserve the maintenance-cost comparison because it gives an accessible
  answer to why the Framework matters.
- Make the comparison the first direct proof of the Hero thesis rather than a
  separate campaign idea.
- Ensure it promises one explicit Feature owner and one governed action path,
  not one literal file or zero integration work.
- Remove any nearby explanation that repeats the comparison without adding
  product or technical evidence.

### 4. Add a first-class "Built with Asyra" product proof

- Promote Asyra Design from a navigation destination and CTA target to an
  in-page evidence section.
- Use authentic, current product frames or a restrained current-product motion
  sequence. Do not use conceptual mockups as product screenshots.
- Show a small set of verifiable capabilities rather than a general feature
  list: editable information, App-owned Features, rendering, Undo/Redo,
  persistence, and only the optional collaboration or AI paths proved by the
  maintained product.
- Connect each capability to either the live demo, Asyra Design route, or public
  case study.
- State explicitly that the interface and design-domain rules are App-owned;
  the Framework supplies reusable correctness and composition boundaries.
- Frame the proof as the visible result of the Hero promise: the product work is
  the editable design experience, while the repeated infrastructure is shared
  through Asyra rather than rebuilt around each caller and state path.

### 5. Add a code-to-runtime bridge

- Present one short, syntax-highlighted, verified public Feature example.
- Pair it with a compact flow showing UI, human input, automation, device, or AI
  callers entering the same Feature/API boundary, then transaction, canonical
  owner, and downstream projections.
- Keep one selected human caller and one selected automated or AI caller in the
  visible example. The page does not need to enumerate every possible source.
- Annotate only the essential distinction:
  - the App owns the behavior and domain rule;
  - Asyra provides the governed execution and correctness boundaries; and
  - callers do not create parallel product-decision implementations.
- Link to the complete Feature session guide. The landing page must not become
  API documentation.
- If a faithful example cannot remain short, use a truthful pseudostructure only
  if it is clearly labelled non-copyable. Prefer stopping for a separately
  authorized public-example improvement over publishing misleading code.

### 6. Make ownership visible

- Add or consolidate one simple ownership map for Framework, Preset, App, and
  backend or external services.
- Use visitor language first and architecture terms second.
- The ownership map must clarify that:
  - Framework owns deterministic runtime and correctness boundaries;
  - Preset owns selectable official defaults;
  - the App owns schemas, domain rules, workflows, product UI, permissions, and
    specialized engines; and
  - backend or external services own transport, authorization, durability, and
    operational policy without becoming a second canonical product owner.
- Reuse the canonical ownership facts already presented on maintained supporting
  surfaces rather than creating a conflicting landing-only model.

### 7. Rebalance conceptual proof sections

- Retain Grow, Same Path, and One Source only where they add a distinct concept
  after real product and technical proof.
- Consider merging the current Same Path conceptual illustration with the new
  code-to-runtime section so the same claim is not explained twice.
- Preserve the accepted visual language and spacious rhythm; evidence sections
  should use the same layout system without pretending that screenshots and code
  are mechanical illustrations.
- Keep the PoC-to-product story only if its position continues to help the reader
  understand product continuity rather than delaying all concrete proof.

### 8. Add a compact readiness and starting-point strip

- Surface only verified adoption facts, such as current browser/Core support,
  official 2D Preset, engine-neutral custom composition, Node.js support,
  package-first entry, complete-product starter, documentation, and Runtime
  Atlas.
- Separate current support from roadmap direction through wording and visual
  treatment.
- Do not use GitHub stars, download counts, or unsupported social proof as a
  substitute for product evidence.
- Provide distinct actions for experienced Framework composers and visitors who
  want a working product foundation.

### 9. Preserve the domain-owned closing

- Keep `Bring your domain. Keep its logic.` as the closing conclusion unless the
  product owner changes the campaign direction.
- Make the closing complete the Hero argument rather than introduce a second
  positioning system: build product features, bring the domain, keep its logic,
  and reuse Asyra's infrastructure boundaries.
- Ensure the final action follows naturally from the evidence sequence and does
  not send both reader types to the same destination without explanation.

## Evidence Hierarchy

The landing page uses evidence in this order of trust:

1. live maintained product behavior;
2. executable public code and formal tests;
3. current public support, release, and ownership contracts;
4. explanatory diagrams derived from those contracts; and
5. conceptual illustrations used only to make the model memorable.

Conceptual artwork may explain a verified capability but must not establish the
capability by itself.

## Visual and Asset Direction

- Preserve the warm paper, near-black, restrained signal colors, mechanical
  topology, and editorial spacing of the accepted landing visual system.
- Give real product evidence a visibly authentic frame: product chrome, readable
  UI detail, truthful caption, and direct action.
- Avoid placing product screenshots inside decorative devices that obscure
  whether the interface is real.
- Use motion only when it proves a state transition such as editing, Undo/Redo,
  or a shared caller path. Respect reduced motion and provide an equivalent
  static state.
- Any new committed raster or video asset requires an explicit canonical source,
  reproducible export or update process, responsive derivatives where needed,
  alt text, size budget, and visual review.
- Do not reuse README media automatically. Website and README assets may share a
  canonical source, but each surface owns its crop, density, and reading context.

## Execution Stages

### Stage 1: Evidence and contract readiness

- Re-read the applicable Landing Inspector and active public contracts.
- Select the exact Asyra Design states and exact public Feature example.
- Map every proposed statement to its current owner.
- Produce the required Step Execution Card before changes to an Inspector-owned
  landing step.
- Stop if the product or code evidence cannot truthfully support the intended
  story.

### Stage 2: Text-first information architecture

- Prototype the final section order without producing new artwork.
- Remove or merge repeated claims before adding new sections.
- Confirm that the semantic, no-JavaScript reading answers all six conversion
  questions.
- Update formal semantic tests first when the new accepted contract is not
  detected by existing tests.

### Stage 3: Real product evidence

- Add the approved Asyra Design proof with accessible captions and destinations.
- Verify that each visible product claim is reproducible in the current demo or
  maintained product path.
- Review desktop, tablet, and phone crops before advancing.

### Stage 4: Code, flow, and ownership bridge

- Add the verified Feature excerpt and paired runtime path.
- Add or consolidate the Framework-versus-App ownership map.
- Validate syntax highlighting, text selection, no-JavaScript output, narrow
  reflow, copyability, and links to complete guides.

### Stage 5: Visual rebalance and closure

- Rebalance spacing and conceptual sections around the new evidence without
  redesigning unrelated routes.
- Run synchronized full-page and section-level visual review at every accepted
  viewport, including reduced-motion and focus states.
- Run all semantic, type, lint, build, smoke, link, accessibility, and visual
  gates owned by the final diff.
- Production deployment remains a separately authorized operation after the
  complete candidate is accepted.

## Acceptance Cases

1. The first viewport presents `Build product features, not infrastructure.` as
   the unmistakable primary headline and explains the result before
   implementation terminology.
2. A visitor can identify Asyra's software category without assuming a hosted
   builder, no-code platform, or canvas-only SDK.
3. Broad domain applicability is explained through shared infrastructure rather
   than domain icons alone.
4. A current Asyra Design product proof appears in the landing journey and links
   to a live or maintained verification path.
5. One real public Feature connects code ownership to the governed runtime path.
6. Framework, Preset, App, and backend responsibilities cannot be confused.
7. Current support and roadmap direction are visibly distinct.
8. Product, code, ownership, and conceptual sections do not repeat the same
   claim without adding a new kind of evidence.
9. The full page remains coherent without JavaScript, images, or motion.
10. Desktop, tablet, and phone layouts preserve the accepted visual identity,
    readable product detail, natural DOM order, and keyboard accessibility.
11. Hero, comparison, Asyra Design proof, Feature proof, ownership map,
    readiness strip, and closing each advance the same product-versus-
    infrastructure thesis without repeating the headline as filler.

## Definition of Done

- The landing page retains its approved result-first identity and gains direct
  product, code, ownership, and readiness evidence.
- `Build product features, not infrastructure.` is the canonical landing-page
  thesis, while `Build the tool your world needs.` is retained only in a clear
  supporting role.
- Every major conceptual claim is either supported by current evidence or
  explicitly framed as a composable direction rather than a shipped domain
  solution.
- Asyra Design is visible as a maintained proof, not only a navigation item or
  external demo link.
- One concise, current Feature example demonstrates the App-owned behavior
  boundary without duplicating the documentation manual.
- The final page answers all six conversion questions and contains no redundant
  proof section.
- All affected semantic, accessibility, type, lint, build, smoke, link, and
  synchronized visual-review gates pass.
- No Framework behavior, Asyra Design behavior, supporting-route contract,
  external dependency, or production deployment is included.

## Approved factory action film

The product owner approved the 16-second Blender factory animation on
2026-09-14. Add it within the existing Code to runtime section, before the
Feature code and exact runtime path. It explains staged handoffs through a
shared architecture; the existing code and runtime path explain the real
software owners. A–D are illustrative stations, not package names, mandatory
execution stages, or a robotics capability claim.

Use a native high-definition render of the approved scene, a lightweight WebP poster,
and one concise architecture description: "Each package has a clear responsibility.
Together, they carry one action from intent to result." Keep the approved heading; omit the mechanical
play-by-play and separate metaphor explanation. The film is an explicit exception to the
six retained true-alpha illustration assets; their identity remains unchanged.
Keep authoring sources local under ignored artwork; public media and provenance
must be sufficient for default CI without Blender.

Render native video controls with preload="none", no autoplay, no loop, and
inline playback. The poster and description remain available without JavaScript
and with reduced motion. User-initiated playback may animate in either mode.
Do not load a 3D runtime, create a timer, or re-render the animation in the
browser. Keep the video below 6 MiB and poster below 160 KiB.

The product owner requested responsive wide-screen composition and improved
clarity. Preserve the approved 16-second timing, camera path, mechanical geometry,
and materials while rendering at 2560×1600 instead of enlarging the preview pixels.
The figure shares the adjacent section heading’s content edges. At widths of
1280 CSS px and above, place the description beside the video with at least
24px separation; below that breakpoint, use full-width stacked media. Keep the
complete frame at its original 8:5 aspect ratio and never crop the process.
A headless export script owns render resolution, sampling, encoding, and
provenance; it reads the local approved scene without overwriting it.

The approved detail revision adds open entrance/exit portals without text signs, keeps station labels
fixed beside their worktables throughout the camera move, removes the switching
camera captions and the small strapline above Asyra, and increases shadow-ray
sampling to reduce grain. Keep carrier clearance and existing mechanical poses.
Save a separate editable Blender revision; close all rendering processes when done.

DoD: verify media hashes and budgets, 16-second browser playback, keyboard
play/pause, paused initial state, no video request before interaction, no-JS and
reduced-motion reading, and film screenshots at 3840, 2560, 1920, 1440, 1280, 1279, 1024, 820, 390,
and 320 CSS px. Assert matching content edges, column/row separation, the 8:5
frame, and decoded high-definition dimensions.
Run the existing landing gates and PR CI; completion requires owner review,
and this task does not authorize merge or production deployment.

## Scroll-driven architecture story

The product owner approved a bounded scroll-driven prototype on 2026-09-15.
Replace the static runtime list with one architecture story between the film
and Feature code. Preserve the accepted film, native controls, illustrations,
public Feature example, supporting routes, and all Framework behavior.

- Explain person or AI intent, App Feature and public API, transaction and
  canonical owner, then projections. These are responsibility boundaries, not
  the factory film's illustrative A–D stations or four mandatory packages.
- On wide, sufficiently tall screens, keep the complete architecture diagram
  beside four short reading stages. Highlight the corresponding boundary as
  its explanation crosses the reading area. Ordinary page scrolling remains
  native, reversible, and skippable through a link to the code example.
- Mobile, short viewports, reduced-motion preferences, and browsers without
  named view-timeline support receive compact, complete content in DOM order.
  No text depends on motion, JavaScript, hover, color, or video playback.
- Use a server-rendered story with native CSS timelines. Its only changing
  input is scroll geometry, owned by the browser. No client component, scroll
  listener, observer, timer, frame loop, cache, or video seeking is introduced.
  The existing Feature runtime remains descriptive evidence, not a simulation.
- Keep the animated section to roughly three desktop viewport heights or less.
  All four diagram nodes stay readable, and scroll position never hides copy.
- Formal browser cases cover forward/reverse scrolling, skipping to code,
  stationary scroll progress, responsive edges, live preference/viewport
  changes, no JavaScript, unsupported timelines, idle video, and screenshots.
  Unit/contract, naming, lint, type, build, route smoke, film regression, and
  the PR's required CI gates complete this bounded delivery.

## Brand story chapters

Historical note: this five-chapter brand story records a prior approved
composition direction. It is not the current homepage contract after the
six-chapter spatial story was accepted and implemented. Preserve it as version
background only.

The product owner expanded the prototype on 2026-09-15 into a complete brand
story and authorized removing repeated information before final review. This
chapter contract supersedes the previous section order, while preserving the
approved visual identity, product truth, public code, media, and route owners.

1. **Imagine:** the product-first Hero and the open-ended domain possibilities.
2. **Build:** validated ideas continue into products, followed by the actual
   Asyra Design proof and its live destination.
3. **Evolve:** one Feature owns a behavior change; modular growth and shared
   information explain how the product can keep developing.
4. **Inside:** the accepted film, exact architecture story, real Feature
   example, and the Framework/Preset/App/Service composition responsibilities.
5. **Begin:** current starting paths and the domain-owned closing invitation.

A compact chapter navigation follows normal page scrolling and provides
ordinary anchor links. Native CSS may emphasize the chapter being read, but
never gates content, intercepts scrolling, or starts media. Reduced-motion and
unsupported browsers keep the same chapter links and complete reading. All
previous section IDs and supporting routes remain available.

Copy should speak to the product builder first, avoid defensive lists and
repeated infrastructure summaries, and use the live product as evidence. Keep
current availability distinct from roadmap, with a clear roadmap destination.
Do not promise universal backend or runtime support, shipped industry apps,
or production readiness without engineering review.

Verification extends the bounded gates above with complete chapter order,
all five anchor destinations, keyboard skipping, sticky navigation bounds,
mobile/reduced-motion/no-JavaScript reading, current support copy, and actual
full-page plus chapter screenshots. New source identifiers remain site-owned
and do not alter persisted data or Framework APIs.
