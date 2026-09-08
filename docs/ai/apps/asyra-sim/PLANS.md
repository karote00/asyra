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

- [M2 executable experiments and import contract](plans/completed/m2-import-contract.md)
  - Closed 2026-09-08, including Core integration, automatic persistence and
    independent authored-input validation. All five M2 owners are accepted;
    no in-scope blocker remains. M3-M6 retain separate gates.

- **History feedback correction (2026-09-08).**
  - The user's open page contained an out-of-limit J6 value of 100 radians and
    zero Undo entries. Empty History actions incorrectly reported applied.
    The shared toolbar/shortcut completion now checks canonical history depth
    and reports Nothing to undo/redo when no replay occurred.
  - Permanent browser tests cover direct edit-to-toolbar replay for trajectory,
    clearance and object name, plus an invalid source alongside independent valid
    field edits. The empty-history test failed before the fix; valid replay passed.
    The authored-input follow-up in the completed M2 record subsequently identified and corrected
    trajectory, exclusions, interval and observation coupling; this earlier
    slice alone did not resolve those input semantics.
  - Verified: 11 affected browser cases at port 3020 and inspected empty-history
    screenshot; shell/shortcut tests, App build/lint, naming, Inspector contracts
    and test placement. M2 acceptance and M3-M6 scope remain unchanged.


- **Completed-edit UX follow-up (2026-09-08).**
  - A bounded review of existing Sim UI controls found two remaining editing
    exceptions: inline trajectory Apply and observation metadata blocked by
    prepared attachments. Object fields, ordinary experiment settings and project
    names already commit completed edits. Create/import/run/copy/export/retry are
    distinct actions, not second saves for existing data.
  - Inline trajectory text, mapping and unit edits now validate and commit on
    field blur through the existing Feature. Review reuses the exact conversion
    result. Own acknowledgements preserve edited text and units; invalid input
    was transient in that slice; the authored-input follow-up in the completed M2 record supersedes
    this limitation and preserves invalid input in Core. New file
    imports still require explicit Import trajectory acceptance.
  - Observation text and accepted attachment removal commit independently of
    pending files. Explicit attachment acceptance includes the current fields in
    one action without losing the click to a preceding blur submission.
  - Regression tests first reproduced both original omissions. Browser verification
    also exposed and corrected the blur/attachment action conflict. Final evidence:
    626 Sim tests, 26 affected browser cases at port 3020, inspected live-app
    trajectory and observation screenshots, App build/typecheck/lint, naming,
    all 97 Inspector contracts and test placement. The combined adjacent browser
    batch had one detached-page timeout before the resource scenario began; the
    complete three-case resource file passed on focused replay without another
    production change.
  - This closes the editing exceptions found after the Core integration review;
    its earlier evidence was not proof that every editing control was consistent.
    M2 remains accepted. M3-M6 and public release remain outside this follow-up.

- **Core integration follow-up (2026-09-08).**
  - Completed all four approved stages: normal CUSTOM document publications,
    registered Core UI projections and scoped consumers, immediate ordered local
    journal/resource persistence, and integrated recovery/workflow verification.
  - Every ordinary canonical publication persists without debounce or full project
    capture. Undo/Redo remain immediate. Saving a previous action cannot cancel a
    later interaction. Explicit checkpoint/copy/export retains its stable capture
    boundary; a rejected tail can be recovered into a new copy.
  - Preserved scene components, whole-object schemas, full original geometry,
    immutable evidence, source units and CUSTOM rendering. The only dependency
    addition was the explicitly approved direct `@asyra/utils` dependency.
  - Verified: 624 Sim tests, 49 distinct UI/E2E cases at port 3020, inspected
    screenshots, App build/typecheck/lint, naming, all 97 Inspector contracts and
    test placement. The bounded integration has no remaining acceptance blocker.
  - See [the completed integration review](validation/CORE_INTEGRATION_REVIEW.md)
    for ownership, implementation boundaries and final evidence. This closes the
    accepted integration follow-up; it does not advance M3-M6 or approve release.

- **Automatic persistence and editing consistency (2026-09-08).**
  - This completed UX slice removed manual Save, but its snapshot-based storage
    was not incremental Core integration. The completed Core integration follow-up above replaces
    that transport while preserving the accepted editing UX.
  - Valid completed object, experiment and observation edits persist locally
    without Save controls. New experiment creation, import Apply, attachment
    acceptance, copy/export and failure retry remain explicit actions.
  - At that UX baseline, one bounded storage queue coalesced captures/writes.
    The completed integration above supersedes that transport. The UX drains changes arriving
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

- [M2 experiments and import acceptance](plans/completed/m2-import-contract.md)
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
