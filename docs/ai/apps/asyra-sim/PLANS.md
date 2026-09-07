# Asyra Sim Plans

## Current Status

- **Development workbench implementation: merged as PR #156.** Original-part geometry, six starter experiments, live collision
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
   - M1 is closed and M2 Import Contract Completion passed milestone acceptance
     on 2026-09-07. Next is a separately bounded M3 review of the existing
     static/continuous/clearance method contracts and evidence, starting with
     the first unproven owner. A completed PR is not acceptance of M2-M4.
   - M5 packaging and M6 independent pilot/release review remain later work.
     Historical packaging evidence remains in roadmap section 1.2 and
     [LOCAL_CANDIDATE.md](release/LOCAL_CANDIDATE.md).
   - Keep the engine App-owned. Extracting generic 3D defaults into Preset and
     precise contact-region inspection are separate tasks, not unfinished scope
     of this PR. No new Framework 3D profile is enabled by closeout.

## Completed Work

- [M2 experiments and import acceptance](plans/asyra-sim-roadmap.md#5-m2-executable-experiments-and-data-import)
  - Completed 2026-09-07: explicit external units, bounded conversion review,
    valid-result reuse and invalidation, and all five M2 owner exit criteria.
    593 App tests and 22 scoped browser cases pass; M3-M6 remain separate.
  - Follow-up 2026-09-08: retain explicit source-unit declarations during numeric
    edits while retiring old previews. Verified with 22 focused UI tests, four
    import browser cases at localhost port 3020, inspected conversion screenshots,
    build/typecheck, lint, naming and Inspector contracts. This is an M2 usability
    correction, not another milestone acceptance.
  - User verification exposed an initial-App-data case omitted above. The final
    correction retains existing units during text edits, including invalid or
    incomplete edits. Per user direction, the additional notice and confirmation
    action were removed. Verified with 25 focused UI tests, five
    import browser cases, and the same build/lint/naming/Inspector gates; the
    actual Chrome 3020 view was checked with the user-reported invalid value.

- [M1 workcell foundations](plans/completed/m1-workcell-foundations.md)
  - Closed 2026-09-07: canonical editing, acknowledged save/reopen and safe
    replacement; existing recorded evidence is preserved without a new release.

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
