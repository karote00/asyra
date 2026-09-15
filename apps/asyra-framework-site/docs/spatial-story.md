# Spatial story - continuous infrastructure narrative

## Current homepage contract

The accepted six-chapter green story is the only homepage at `/`. Remove the
`/story` route entirely; it returns 404. Keep the story choreography and building
example intact. Follow it with the real Asyra Design product evidence, three
practical documentation/Atlas entry points, the closing invitation, and the
shared navigation footer. The primary menu is native HTML and remains usable
without JavaScript. Do not repeat the retired film, five-chapter narrative,
PoC comic or separate architecture explainer on the homepage.

The scope is the website route composition, story shell, resource sections,
direct tests, current landing contract and its existing Inspector. Framework
and Design behavior, supporting pages and dependencies are unchanged. Reuse the
existing feature worktree and PR; remote CI must pass before requesting review.
Never merge. No additional artwork is needed for this integration.

The owner gap is the narrative timeline: chapter boundaries previously reset
object identity, camera and composition. One persistent desktop scene now owns
all six chapters. Native text sections advance one cumulative timeline, with
identical outgoing and incoming boundary frames. Mobile and reduced motion use
readable static snapshots with the same continuing subject.

## Story and self-review before implementation

A fictional drawing composition is a concrete example of app-owned information,
not a claim that Asyra is a drawing tool. One architectural footprint remains
recognizable throughout. Asyra's role is explicitly software infrastructure.

1. **An idea worth building.** A person imagines a building. A paper notebook
   overlays the real page, then becomes the persistent subject. Human illustration
   recedes, while the notebook remains.
2. **Give it a foundation.** Sketch marks become the same notebook's interface.
   The surface tilts and lifts: Feature, Transaction and State planes are revealed
   beneath it. A typed data definition connects the metaphor to software.
3. **One action. A connected process. One result.** Draw house enters the
   Feature, crosses the transaction boundary, changes authoritative State, then
   updates the notebook projection. A trace and before/after status make the
   causal sequence visible. No pretend autonomous backend or persistence claim.
4. **Change the rule. Keep the work.** Replace only the app-owned behavior with
   a compatible tower-drawing implementation. State and the site footprint remain. The rule
   card slides through its own slot; surrounding planes do not reset.
5. **Build on what already works.** Keep the same notebook, created building,
   feature and state. Add history and another derived view. The composition
   returns toward a front view; a collection view reuses the same building. This is
   the same implementation evolving, not a PoC export/rebuild.
6. **Your work. Your possibilities.** The expanded notebook resolves as a useful
   output above its still-visible foundation. Pull back to a workshop and other
   compositions; the original remains foreground. Documentation CTA is visible.

Self-review: avoid turning the subject into a domain product by labeling the
notebook as one illustrative example and making the infrastructure reveal the
longest signature sequence. Avoid arbitrary stacked blocks by giving each plane
its actual software responsibility and an observable part in Draw. Avoid six
slide changes by retaining the same DOM notebook and common boundary poses.
Use illustration, overlay registration, CSS 3D planes with thickness, restrained
color/line filters, signal tracing and reframing for different explanatory jobs.
No floating touch/release hands, lids, whole-stage fades or wheel hijacking.

## Ownership and fixed gates

The module owns immutable authored stops and deterministic cumulative frame
sampling. The mounted controller measures section positions and scene size on
resize, coalesces pending scroll work in one RAF, and updates transforms/opacity
directly without React scroll renders. No idle loop. Internal presentation IDs
have no persisted or wire compatibility. Existing chapter anchors are retained.

Before implementation: prove current scene boundary discontinuity with a formal
regression. After implementation: test continuity across all five boundaries,
retained specimen/state, action order, isolated replacement, finite/reversible
frames, complete static snapshots and exact scheduler work counts/disposal.
Then naming, scoped lint, build and live Playwright at 1440×900 and 390×900:
all chapter midpoints and seams, reverse scroll, idle stability, responsive
resize, anchors, reduced motion and no JS. Inspect actual route screenshots and
run the installed skill's five-profile runtime verifier. Acceptance by the user
is separate from these checks.

## Local review evidence

Live route: `http://127.0.0.1:3035/`. All changes run from the existing
`codex/site-scroll-architecture` worktree. The main homepage is unchanged.

- 16 focused unit tests pass, including exact five-boundary continuity, action
  order, preserved published result, local replacement, alpha and scheduler work.
- Six Playwright tests pass against the live production build: desktop 1440×900,
  mobile 390×900, native links, resize, live reduced motion, no JS and exposed
  architecture labels. Scroll reversal returns the same mounted DOM and poses;
  an idle scene makes zero observed attribute mutations over the sample window.
- Scoped ESLint, naming and production build pass. Test and build logs are in
  the worktree's `work/spatial-story-*.log` files.
- Actual route captures under `apps/asyra-framework-site/test-results/platform/`
  were inspected at opening, foundation, action, replacement, growth and ending,
  with intermediate desktop poses and mobile snapshots. This is browser evidence,
  not a claim of physical-device performance or user design acceptance.

Mobile and reduced-motion/no-JS modes intentionally use complete natural-flow
snapshots. The desktop is continuous, scroll-driven CSS 3D plane geometry with
illustration overlays; it is not a video or a WebGL model. The notebook is an
illustrative example, not a functioning app or a claim about Asyra's default UI.

New generated illustration sources and exact built-in prompts are recorded in
`work/visualizations/spatial-story-artwork/continuous-story-prompts.md`.
Production assets are `thinker.webp` and `fern.webp` under the site's
`public/illustrations/spatial-story/`; both retain genuine alpha.

The cinematic-scroll final runtime page-proof matrix also passes all five
profiles (desktop, mobile, reduced motion, mobile reduced motion and no JS).
Evidence is in `.verify/proof/`; the preview listener for this review is PID 18154. No remote CI, publishing, push or merge is claimed.

## Current refinement contract - visible building replacement

Preserve the accepted six-chapter story and green visual treatment. Replace the
shape example with a plan that rises into a two-storey home, then an eight-storey
tower after `drawHouse(input)` is replaced by `drawTower(input)`. The site plan,
state, transaction and surrounding composition remain in place. Keep the left
reading column stable and preserve reversible scrolling and static fallbacks.

Scope is the story component, geometry and timeline libraries, matching types,
formal narrative and browser tests, and this document. No dependency, framework or Design app changes. Validation covers fixed footprint, staged
construction, dock-before-growth ordering, intermediate geometry, persistence in
derived views and reverse scrolling, plus existing responsive and motion checks.

## Building example

The illustrative output uses a single isometric footprint, first a plan, then a
two-storey home with pitched roof, then an eight-storey building with a flat roof.
`drawHouse(input)` becomes `drawTower(input)` only after replacement docks.
The module `story-building.mjs` owns deterministic projected faces; one geometry
result per scheduled scroll frame updates all mounted output views. No video,
WebGL, background loop, additional image download or React scroll render.
The ground remains fixed. Each storey unfolds a slab with visible thickness,
raises its walls and inner partition, then reveals fixed-size glazing. The house
roof forms last; during replacement it withdraws before new storeys assemble.
The original two storeys remain unchanged while six new storeys grow above them.
The tower finishes with its roof and rooftop garden. Reverse scrolling samples the identical geometry. Mobile,
reduced motion and no-JavaScript show complete plan/house/tower snapshots.

Verified with 18 focused unit tests, 6 browser tests, scoped ESLint, naming checks
and a production build. Desktop plan, house, intermediate tower and completed
tower states plus the mobile replacement view were visually reviewed. The local
preview remains on port 3035.

Motion reference: https://illoca.com/ - observed the plan-to-volume transition
and staggered storey formation. This adaptation retains the original green house
and tower geometry; no reference assets or source code are used. A permanent
regression test proves slab-before-wall-before-glazing ordering and unchanged
lower storeys; the browser test samples the first unfolded slab.

## Homepage integration verification

The homepage at `/` is the sole story route; `/story` returns 404. Product proof
and build/evaluate links follow the six chapters, with one shared footer.
The native menu works at 320px and with JavaScript disabled. The original story
clock and static snapshots are unchanged by the server-rendered resource sections.
Retired homepage-specific tests are replaced by current homepage composition,
responsive, native-navigation, route-removal and no-film-request cases. Supporting
page tests retain their original owners and visual contracts.

### Responsive composition

The story bounds its desktop composition to 1800px and scales headings with
available width. Static tablet chapters place copy beside the illustration;
phone chapters stack them with artwork-height reservations derived from the
container width. Focused architecture snapshots retain enough height to keep
the state plane clear of their captions. Resizing changes the layout as well as
the illustration scale, without changing the story clock or authored poses.
