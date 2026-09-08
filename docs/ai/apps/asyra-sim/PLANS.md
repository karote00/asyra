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

- **Core integration follow-up requested on 2026-09-08.** The
  [baseline review](validation/CORE_INTEGRATION_REVIEW.md) is complete as a
  source/test audit, not a production correction. It found status-driven full
  snapshot autosave, an interaction-cancelling capture inlet and broad upstream
  read invalidation. Property representation needs feasibility assessment,
  not an automatic schema migration. Freeze the projection, local publication
  and resource-recovery contracts before their respective implementation slices.
  Reconcile affected specs/Inspectors first; no backend, solver or M3-M6 work
  is included.
  - The requirements/capability follow-up preserves CUSTOM rendering and the
    current object schemas. Schema size is not a confirmed defect. Proposed
    order: prove CUSTOM channel/property/UI Context wiring, replace broad read
    consumers, implement publication persistence with local resource recovery,
    then run full workflow/work-count gates. See the same review's feasibility
    section. The first composition slice now registers Core local document
    channels. The normal-runtime regression first failed with zero publications,
    then passed with distinct edit/Undo/Redo publications and no publication
    for no-op or rollback. Runtime subscribers now receive the original
    publication instead of transaction status. All 40 composition/lifecycle
    tests, the complete 613-test Sim suite, and three ordinary
    editing/replacement/reload browser cases pass at port 3020; the generated
    editing screenshot was inspected. Build, lint, naming and all 97 Inspector
    contracts pass. Registered
    UI consumers and incremental persistence remain unfinished; this is not
    closure of the integration follow-up.

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

- **Automatic persistence and editing consistency (2026-09-08).**
  - This completed UX slice removed manual Save, but its snapshot-based storage
    is not complete incremental Core integration. The follow-up above records
    the newly identified architectural gaps without claiming they are fixed.
  - Valid completed object, experiment and observation edits persist locally
    without Save controls. New experiment creation, import Apply, attachment
    acceptance, copy/export and failure retry remain explicit actions.
  - One bounded storage queue coalesces captures/writes, drains changes arriving
    during writes or copies, flushes before replacement, and restores the same
    project identity on reload. Missing-target retry cannot overwrite its URL
    identity with the startup example. Failures remain unacknowledged/retryable.
  - Terminal formal results retain automatically; progress stays noncanonical.
    Import parsing/conversion reuse, edited-source lifetime, field write ordering,
    Undo/Redo, opaque attachments and full original geometry remain covered.
  - Verified: 612 App tests, 53 distinct affected UI/E2E cases in bounded batches
    at `http://127.0.0.1:3020`, reviewed project/observation/import/toolbar images,
    App lint/build/typecheck, naming, Inspector/catalog and test-placement gates.
    The initial combined browser run reached its unchanged three-minute limit;
    remaining and corrected cases passed in focused batches.
  - This is an editing/persistence follow-up to accepted M2, not M3-M6 acceptance.
    The next milestone remains the separately bounded M3 review in the roadmap.

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

  - Apply and save follow-up: a valid trajectory and the latest experiment draft
    now save in one Feature action. Verified with 57 related UI tests and eight
    scoped browser cases, including combined setting/trajectory Undo and Redo,
    plus build/typecheck, lint, naming and Inspector contracts.

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
