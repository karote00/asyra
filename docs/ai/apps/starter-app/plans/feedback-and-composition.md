# Starter feedback and composition repair

## Bounded plan

Baseline: 7d988d65d, including the local developer-Agent candidate and merged
Starter draft coordination. Single writer on codex/starter-feedback-ime.

Correct Starter's operation-feedback semantics and its own title input handling.
The existing status object describes the last operation, not document dirty
state. Rename the misleading save-state presentation to operation-feedback,
remove the unsaved tone and unconditional unsaved claims from edit messages,
and label the status for assistive technology. Save acknowledgement remains an
operation result. A product requiring a persistent dirty indicator must define
its document/storage acknowledgement owner separately; this repair does not
invent a document mirror, revision counter or history stack.

The title editor ignores Enter/Escape while native composition is active,
including keyCode 229 compatibility events. Ordinary Enter and Escape retain
submission/cancellation behavior after composition ends. These events perform
no canonical reads, writes or unrelated notifications.

Scope: Starter editor, controller feedback, status presentation, permanent
regressions, maintained architecture guide, generated Starter and bundled Agent
references. No external proposal App edits, generic model-behavior rules,
Framework APIs, dependencies, installed plugin cache, push or publication.
No Inspector semantic change is involved; continue the approved plan-first
Starter workflow and existing developer-Agent tooling exception.

Names are App-owned transient UI identities; persisted fields/slots and existing
UI property keys remain unchanged. Discovery is bounded to these source owners,
existing tests and direct consumers. Final review covers only the diff, those
consumers, and the gates below. Stop if a required correction needs another owner
or an unavailable gate; revise the plan after repeated failed implementations.

## Sequence and gates

1. Run baseline naming and existing tests. Add permanent failing composition and
   feedback tests before production edits.
2. Fix the owning handlers/feedback and rerun all Starter unit tests, naming,
   typecheck, lint and build. Preserve localized read/notification evidence.
3. Update architecture documentation, regenerate template and Agent references
   with a higher candidate version. Run template freshness, clean consumer,
   packaging/release tests and documentation checks.
4. Run existing desktop/narrow browser checks, inspect screenshots, and review
   completion/failure/no-op/Undo/Redo and composition boundaries. Report actual
   evidence without claiming physical IME testing from synthetic browser events.

## Results - 2026-10-04

Implementation and bounded review are complete locally. No commit, push,
publication, installed-cache change or external App edit was performed.

- Added four composition cases and one operation-feedback sequence. The initial
  run had 5 failures and 39 passes. Corrected the no-op test to actually edit and
  restore text (React does not emit a change for the same DOM value), then replayed
  the baseline handlers: 6 failures, including the strengthened localized-feedback
  assertion. All 44 current tests pass. Composition causes zero canonical reads,
  history entries and projection notifications; ordinary submission/cancellation
  works afterward. Input tests synthesize native event metadata, not a physical
  operating-system IME session.
- Starter lint and production build (including typecheck) pass. Existing Vite
  chunk-size advice remains; no bundle-size improvement is claimed.
- All 37 bundle, CLI, template and clean-consumer script tests pass. Their first
  run lacked packed artifacts; rerun passed after reusing the unchanged Framework
  artifacts from starter-draft-actions (no package/source packing diff).
- Template generation/freshness passes. Clean consumer is READY for install,
  typecheck, lint, build, tests and startup smoke. Evidence:
  tmp/framework-release-evidence/generated-template.json.
- Browser suite at STARTER_APP_URL=http://127.0.0.1:5198: 11 passed, one
  narrow-only touch case skipped on desktop. Desktop full-board and narrow
  rejected-draft screenshots were inspected: feedback styling and error text
  remain readable. Screenshots live in apps/starter-app/test-results. The managed
  server was cleaned up and port 5198 has no listener.
- Agent 0.1.3 bundle freshness/version check passes against retained 0.1.1.
  Skill instructions remain unchanged. Product-trial acceptance is still separate.
- Final review covers handler composition admission, post-composition actions,
  no-op acceptance, failure feedback, history, CSS consumers and generated copies.
  No unresolved finding caused by this diff was found. git diff --check passes.

Two existing repository checks remain unresolved outside this repair:

1. Naming baseline and post-edit gate both flag
   docs/ai/framework/plans/asyra-developer-agent-plan.md:502, which quotes an
   obsolete product alias in an earlier completion note. This task did not add it.
2. Public-document freshness reports docs/public/generated/api-index.json stale.
   Regeneration adds memberCount, warningChangeCount and warningReached to the
   unrelated Core API inventory. The generated change was not retained because
   no Framework/public API source changed in this repair.

These are explicitly failed checks, not a claim of a completely green repository.
They prevent a fully green integration handoff; do not hide them in a commit or
expand this repair into unrelated documentation cleanup.

## PR integration follow-up

The user authorized PR creation. Comparing the full PR against origin/main
showed both previously deferred document failures originate in inherited Agent
commits that are part of this PR. Their correction is now inside the integration
scope: remove the obsolete alias from the Agent plan completion note and
regenerate the public API index to restore its three existing fields. Re-run
naming, document freshness, bundle freshness and the applicable PR gates before
commit/push. Earlier no-commit/no-push statements record the prior local handoff.

Integration validation: naming passes all 13 tests; public documentation is
current (41 pages, 19 packages); all 24 scoped documentation/task-context/test
placement contracts pass. Template and Agent freshness checks pass. Both formerly
failed document checks are resolved. Starter implementation and generated
artifact inputs are unchanged from the successful App and clean-consumer gates.
