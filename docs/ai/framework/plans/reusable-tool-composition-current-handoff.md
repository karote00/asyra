# Reusable Tool Composition - Current Handoff

## Current status and authority

Stage 1 integration closure and the explicitly authorized history/persistence fix are
complete locally. Stop here. Do not start Stage 2, run live Taipei 101, call a model,
push, resume monitoring or use subagents. No automatic PR/merge goal remains active.
App model and effort remain unchanged. No old compatibility path is authorized.

- Repository: `/Users/asa/Desktop/workspace/asra`.
- Worktree: `/Users/asa/Desktop/workspace/asra/.worktrees/ai-reusable-tool-design`.
- Branch: `codex/ai-reusable-tool-design`.
- HEAD: `844a5d27c8251d961761973eb348b3124ab36af9`; changes remain uncommitted.
- Observed origin/main: `09e9efd6d64b56dd81ee451c6d8b89e5e463a4e7`.
- Reuse this dirty worktree and preserve prior task changes and local `.env` files.
- Active plan: `reusable-tool-composition-plan.md`, Current authority, Stage 1
  integration closure card, authorized history correction card and final outcome.
- Task context: `tmp/task-context.json`. No fetch/rebase/push occurred in this slice.

## Effective contracts

- Primary AI owns creative decisions and visual judgments of delivered evidence.
- Tools own deterministic checks, canonical dependency validation and retained results.
  Preparation and drawing-review tools cannot start an independent AI assessor.
- Deferred screenshots still run mechanical checks. Actual public tools and browser
  actions use the common registry/invoke and canonical result store.
- Partial review retains other pending findings and exact unrelated passed results.
  Local dependency changes invalidate affected evidence only; pan/zoom does not.
- Later failed structure judgment revokes final acceptance. Structure recovery alone
  is insufficient; primary judgment must close current obligations, including when
  reviewing existing content without an earlier mutation.
- Validation-only, rejected and cancelled work cannot publish approval. Unavailable
  capture requires corrected evidence; retry does not replay prior document writes.
- Vector conversion uses `componentMappings` and eligible analysis receipts only.
- Stage 2 `verify_design_checks` remains a future specified contract, not an implemented
  tool or permission to begin another stage.
- Factory owns History and replay. Successful local no-op replay still settles the
  retained shared-delivery obligation; only actual mutation needs local restoration.
  Thrown owner failure cannot settle that failed delivery. App translates publication
  evidence and backend validates ordered document changes; neither fabricates history.

## Root cause and correction

Escape had already cleared selection. Undo therefore returned a successful local
no-op for selection while removing the rectangle correctly. Factory gated shared
readiness on `applied`, blocking the same source slice's element removal publication.
Redo then published same-ID creation and backend correctly rejected it with 422.
The fix separates replay success/shared delivery from mutation-only restoration in
`packages/factory/src/data-transact.ts`. No backend validation was relaxed.

## Formal integration and verification

`apps/asyra-design/e2e/ai-inspection-evidence.spec.ts` exercises real host/registry,
browser runtime, rendered receipts, canonical check store, partial review, failure,
cancellation, local invalidation and durable completion. Scripted primary-agent
responses replace only the model boundary; middle owners are production code.

The history case uses actual UI create/Escape/Undo/Redo, a second collaboration
client, real persistence confirmation, exact backend/local digest comparison and
actual reload. Factory tests prove synchronous/progressive no-op handoffs plus failure,
rollback and retry. Existing batching, compensation and History suites also pass.

Evidence under `tmp/stage1-integration/`:

- `browser-built-history.log`: whole evidence file, 7 passed / 2 existing opt-in skips.
- `browser-history-peer.log`: extended two-client history/save/reload case passed.
- `factory-final.log`: full Factory suite, 299 passed.
- `core-history-consumers.log`: 36 passed.
- `persistence-browser-consumers.log`: 123 passed using the declared jsdom environment.
- `owners.log`: review, operation and check store, 285 passed.
- `types-final.log`, `factory-build.log`, `lint-final-correction.log`,
  `history-test-lint.log`, `naming-final-correction.log`: applicable checks passed.
- `inspector-readiness-closed.log`: 53 catalog/admission tests passed.
- `history-closeout-proof.log`: same-source baseline, three exact defect injections,
  recovery, 17 obligations. Old no-op defect is detected by all three new cases.
- `design-final-candidate.log`: current Design source proof, 31 cases passed.
- `inspection-lifecycle-publications.json`: preserved original failing wire evidence.

The first post-fix browser attempt still used old Factory dist; build preceded the
successful actual-browser verification. A preliminary browser-consumer run used the
wrong Node environment; corrected jsdom run passed. Those earlier failures remain
failures. An exploratory legacy E2E typing command still has pre-existing errors;
only the declared production TypeScript gate is claimed green. No full CI or live101
was run. Test-owned 3300/3401/4401 services were cleaned up.

## Latest Factory follow-up review

The subsequent complete bounded review passed locally. No additional production
change was required. Fixed the persistence Inspector bypass wording to distinguish
ordinary no-op mutation from retained History settlement, then regenerated the catalog.
Added permanent published-prefix/no-op compensation, retry and Redo coverage in
`packages/factory/src/__tests__/shared-publication.test.ts`.

Latest evidence is `tmp/stage1-integration/review-*`: Factory 300, Core 36,
publication/collaboration/lifecycle 123, backend 24, real socket retry 2,
Stage 1 browser 7 plus 2 existing opt-in skips, collaboration browser 10,
Inspector catalog/admission 53. Production types, Factory build, lint, naming
and task context passed. The browser runs include actual peers, failure recovery,
subsequent editing, persistence confirmation and reload. No 409/422 was present
in the successful browser logs. See the latest plan outcome for exact files and
non-product setup failures; do not treat earlier failed attempts as successful.
No new model request, Stage 2, push or monitoring occurred.

## Next conversation

Read this file, the current plan boundary, current AGENTS and exact Inspector owner
before editing. Stage 1 is finished; obtain the user's next-stage instruction. Do not
resume historical full-goal automations, repeat live101, or reinterpret old plan cards
as new authorization. Preserve all existing local work.
