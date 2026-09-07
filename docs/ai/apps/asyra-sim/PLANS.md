# Asyra Sim Plans

## Current Status

- **Development workbench implementation: complete for PR #156 review
  (2026-09-07).** Original-part geometry, six starter experiments, live collision
  feedback, formal analysis, comparison, local/portable projects, extensions,
  and the hosted development workbench are implemented. The bounded completion
  record is [development-workbench.md](plans/completed/development-workbench.md).
- Normal composition uses `original-part-clearance-v1@1.0.1`. Complete supplied
  geometry is shared by rendering and analysis. Clearance witnesses cannot hide
  later established penetration; historical method evidence is not rewritten.
- **Hosting:** the permanent product domain is `asyra-sim.vercel.app`.
  PRs receive Vercel checks/previews; `main` is the production branch. See
  [HOSTED_PREVIEW.md](release/HOSTED_PREVIEW.md) for configuration, browser-local
  data boundaries and verification.
- **R0 Public Alpha: not released.** Independent numerical review, representative
  resource/reference-hardware evidence, refreshed offline distribution,
  independent pilots and public maintenance/support policy remain open.
  Hosting and this PR closeout do not waive any first-release gate.

## Active Work

1. [Asyra Sim first-release roadmap](plans/asyra-sim-roadmap.md)
   - The remaining sequence is M5 quality/delivery and M6 independent pilot/release
     review, including any M2-M4 acceptance gaps identified by those gates.
   - The earlier `125a09c0e` exact-source package is a historical assembly
     checkpoint, not an offline package of this completed workbench. Its record
     remains in roadmap section 1.2 and [LOCAL_CANDIDATE.md](release/LOCAL_CANDIDATE.md).
   - Next work requires its own bounded task: a refreshed exact-source package,
     packaged offline workflows, the permanent six-axis / 30-fixed-shape /
     200-keyframe / three-candidate benchmark, then the remaining release gates.
     Reference M1/8 GB hardware, independent pilots and public policy need
     external evidence or user decisions; development-host tests are not substitutes.
   - Keep the engine App-owned. Extracting generic 3D defaults into Preset and
     precise contact-region inspection are separate tasks, not unfinished scope
     of this PR. No new Framework 3D profile is enabled by closeout.

## Completed Work

- [Development workbench and original-part refactor](plans/completed/development-workbench.md)
  - Completed 2026-09-07: one executable local/hosted experiment workbench, with
    source-faithful rigid geometry and immutable evidence. Ready for PR review
    after the current-head CI gates pass; not an R0 release approval.

## Unscheduled Directions

### Precise contact regions and inspection

Requested follow-up to live whole-part highlighting: show only established
contact/intersection regions where the method can provide them. When playback
is paused, clicking a region should open its details in the existing right
inspector. This is planned, not implemented by whole-part highlighting.

Prerequisites: a method-owned, versioned region artifact tied to exact source
part/triangle identities, placements and checked time; explicit semantics for
surface contact versus solid overlap, numerical uncertainty and multiple
disconnected regions; renderer-neutral projection/picking identities; and a
read-only inspector showing both parts, checked time, method, bounds and
limitations. A witness point, bounding box or estimated screen marker is not a
contact region. Unsupported methods retain clearly labelled whole-part
highlights rather than fabricating regions.

Validation must cover concave and contained parts, multiple contacts, uncertain
boundaries, source edits and stale picks, paused/resumed playback, unchanged
Undo/reports and normal-App close-up screenshots. Freeze a bounded geometry
contract and Inspector owner handoff before implementing this extension.

Choose based on pilot needs: additional geometry and importers, more complex
mechanisms, additional analysis methods, batch experiments, and field-data
alignment. TCAD, whole-factory scheduling, AI, and cloud services are not a
committed implementation backlog.

## Related Authorities

- User value: [PRODUCT.md](PRODUCT.md).
- Sole source of first-release gates:
  [FIRST_RELEASE.md](release/FIRST_RELEASE.md).
- Planning assumptions and open decisions are centralized in the
  [roadmap](plans/asyra-sim-roadmap.md), not separate readiness matrices, audit
  ledgers, or parallel plans.
