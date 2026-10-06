# Asyra Skill Capability Guidance Plan

## Bounded contract

Status: active. Single-agent task in `codex/skill-capability-guidance`.
Deliver problem-oriented decision support for existing Asyra and non-Asyra
products, without privileging one UI or product category. Users describe needs;
the host investigates causes, compares options and proves the chosen change.

Canonical owner: extend the existing public `start/extend-with-ai.md` guide
with a problem-to-capability index, bounded capability decisions, adoption
boundaries and evidence requirements. Reuse existing public capability contracts
for details. Keep only task routing in SKILL.md. Preserve one shared Skill and
installation identity `asyra-agent`; advance the candidate to 0.1.9 and retain
the merged 0.1.8 bundle as a baseline. No runtime/API or installation changes.

Authorized files: that public guide and its content-manifest description;
`custom-composition.md` only for the reciprocal decision-guide link; their
existing generated public outputs; Skill instructions/config/manifests/bundle;
plugin README/changelog; developer-agent maintenance/acceptance/support docs;
existing bundle tests and a normal empty changeset. No new public page, schema,
Inspector contract, dependencies, validators, runtime or model service.

Discovery is limited to those owners, directly linked capability contracts,
internal optimization/computation rules, maintained source examples as needed
and selected formal checks. Adoption tooling retains its Inspector exemption.
Documented concepts must not import repository governance into consumer apps.

## Implementation and acceptance

1. Inventory existing guidance by problem: broad updates, repeated computation,
   competing state, action atomicity/history, extensibility, persistence/sync,
   lifecycle and environment constraints. For each route identify applicability,
   limits, App duties, existing guide and an observable proof. Explicitly allow
   improving the current architecture without adding Asyra.
2. Distinguish an existing Asyra extension from selective adoption into an
   unrelated architecture. Require one write authority per migrated concern,
   verified public dependencies/environment support, data/ID compatibility and
   bounded cutover/rollback; never promise arbitrary store adapters or Headless
   Core. Assessment requests stop at recommendations, not implementation.
3. Route through the existing public guide. Bundle the small set of missing
   public contracts needed for offline decisions; retain source/version evidence
   and distinguish internal examples from copy-ready consumer code.
4. Add permanent acceptance scenarios spanning several product types, including
   no-adoption and unsupported-runtime outcomes. These are future native trials,
   not claims of model improvement. Extend packaging checks for newly required
   decision references/links, not prose-matching model-behavior assertions.

## Frozen gates and delivery

Run naming before metadata changes and after the first slice, bundle/public
freshness and baseline comparison, Skill validation, generated-reference/link
and relocation tests, source formatting, changeset admission and bounded diff
review. Resolve shared and workspace CI checks for the full PR diff, including
required declarations and website checks when selected. No paid native model
calls; no new host installation. Finish local validation before push, recheck
main freshness and create an English PR from this worktree. Attach the PR and
report remote checks without calling pending CI a completed validation result.

Stop scope growth after the content inventory. Repairs may address this diff
and direct generated consumers only. Out-of-scope runtime defects remain
separate. Native decision quality is unverified until observed trials run.

## Implementation review

The eight problem routes, existing-project assessment and source/version lookup
are implemented in the existing public guide. SKILL.md now distinguishes
assessment from authorized implementation and scopes composition requirements to
the selected Asyra concern. Self-review corrected the old unconditional
existing-App route so it does not force a non-Asyra product into Starter.

Candidate 0.1.9 includes four additional public decision references (19 total).
The permanent relocation test first failed on the missing UI-context reference;
it now proves all four required links resolve with the original plugin removed.
The retained 0.1.8 bundle remains byte-identical to the merged baseline.
Six diverse acceptance cases are documented; none is claimed as a native trial.

Local focused evidence:

- Naming baseline and first metadata slice: 15 tests passed each.
- Framework declarations built before public-source generation.
- Bundle tests: 20 passed; freshness and 0.1.8 comparison passed.
- Skill frontmatter validation passed; public generation freshness passed.
- Public documentation validation: 41 pages, 290 local links, 129 API references.
- Selected shared repository checks: 74 tests and 15 naming tests passed;
  affected-file ESLint passed. Final committed-tree checks follow below.

The first website-runner invocation rejected incomplete local commit identities
before running any product checks. The committed-tree run will use full SHAs;
this invocation is not recorded as a product failure or a passing gate.
Website validation, final committed-tree checks and remote PR checks remain
pending at this implementation checkpoint. No runtime, dependency, release or
host installation changed.
