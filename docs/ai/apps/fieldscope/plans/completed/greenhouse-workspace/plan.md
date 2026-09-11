# Greenhouse workspace baseline - Retrospective closeout

Status: DONE
Implementation completed: 2026-09-09 (Asia/Taipei)
Closeout recorded: 2026-09-11

## Context and final decision

PR #170 merged at `2026-09-08T17:54:10Z` as `716c0da956db167aa665551dfea0a5ba0468cb30`, from reviewed head `aab20833475bb538e1994226a5579f398293955d`. This record backfills the missing closeout for already merged work. It is not a reconstructed pre-implementation plan or a new implementation request. The original [0.1.0 baseline decision](/docs/ai/apps/fieldscope/decisions/0.1.0.md) remains unchanged.

Decision: accept the initial private FieldScope 0.1.0 workspace as completed. Canonical record: [baseline closeout](/docs/ai/apps/fieldscope/plans/completed/greenhouse-workspace/plan.md).

## Delivered scope

- Four connected, dimension-driven greenhouses with circular arches, steel framing, exterior plastic film and end openings.
- Typed soil/drain strips, rounded channels, connecting passages and outer waterproof barriers.
- Growing poles, crossed-pipe spring clips, longitudinal climbing nets and cable ties.
- Editable dimensions, strip order, pole placement and net limits using Asyra Core configuration transactions and Undo/Redo.
- Collapsible layer/editor panels, camera flight, pan, look, dolly, optical zoom, fit and 100% reset.
- Private version 0.1.0 and a Vercel-compatible workspace build configuration following asyra-design.

## Exit evidence

The final PR head passed `validate`, `framework-release-readiness`, standard E2E and collaboration E2E. Attached Vercel checks also succeeded. The merged PR's validation record reports 56 FieldScope unit/integration tests, 10 browser tests in two batches, the filtered deployment build's 17 tasks, app lint/naming and repository script checks. These are historical results, not tests rerun for this documentation closeout. A dedicated FieldScope Vercel project was not deployed by PR #170.

## Subsequent work and boundaries

The baseline initially used an Apply action and had no crop population. The completed [water and crop population plan](/docs/ai/apps/fieldscope/plans/completed/water-and-crops/plan.md) subsequently corrected water ownership, added cultivars, replaced Apply with immediate editing, and refined performance, first-person/touch navigation and bilingual UI. Those later outcomes belong to PR #174, not this baseline. Current behavior is governed by the app specifications.

Robot hardware connections, harvesting simulation, collision/plant-damage physics and configuration persistence were outside this baseline. This retrospective closeout creates no remaining implementation task, version change, Changeset, tag, publication or deployment.
