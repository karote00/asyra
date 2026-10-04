# Starter draft and action coordination

## Task and boundary

Fix the existing Starter draft interaction after the user's request to fix the
Starter finding and perform strict self-review. Continue the Starter plan-first,
direct App verification workflow accepted in the architecture-standard task.
No Inspector tooling changes or Framework runtime changes are required.

Owner: primary agent, single writer. Branch: codex/starter-draft-actions.
Scope: Starter controller/editor and their direct action consumers, permanent
unit/browser regressions, architecture/onboarding guidance, generated template
and relevant public-document outputs. Preserve persisted identities, Feature
transactions, rendering, single-step history and fine-grained subscriptions.
Do not modify the external proposal App or developer-Agent bundle, add packages,
push, publish or broaden the task into generic form infrastructure.

## Intended contract

- An editor owns incomplete field drafts. It registers one lifetime-scoped
  commit participant with the App controller; the controller coordinates actions
  without retaining an editable document or reading the DOM.
- Enter requests draft submission; blur preserves the draft until an admitted action or explicit cancellation. A rejected draft stays visible and
  its error is not replaced by a later action's success message.
- Save, selection changes, new Item, status/position changes and history/load
  operations must settle the active draft before their own action. Failure
  blocks the action. Successful draft settlement occurs once and preserves
  one transaction per intended edit. No delayed callback or blur timing is
  authoritative for admission.
- Explicit Cancel restores current canonical field values without creating a
  history entry. It permits the user to leave a rejected draft deliberately.
- Pending async actions prevent new editing/action admission; replacement and
  disposal release the participant. A stale editor cleanup must not remove a
  newer registration. Draft typing must not read or notify unrelated Items.
- Undo/Redo stays one Factory operation. A valid draft is committed before that
  operation; invalid drafts block it. Reload is explicit replacement after
  draft admission, retaining the existing saved-document semantics.

## Execution and fixed gates

1. Inspect existing coverage, add UI/controller regressions and record the
   expected failures before production edits. Run baseline naming tests.
2. Implement controller admission and editor lifetime/feedback/cancellation.
   Review all direct action callers, especially canvas pointer handling.
3. Run all Starter unit tests, typecheck, lint and build. Exercise browser tests
   at desktop/narrow sizes, including invalid Save/selection, correction/cancel,
   valid direct Save, pointer/keyboard interaction and actual error screenshots.
4. Synchronize maintained docs and regenerate the template. Run template
   freshness, CLI/generator tests and clean-consumer validation where applicable.
5. Strict self-review of the frozen diff/direct consumers: failure preservation,
   repeated actions, stale closures, async pending and teardown. Add permanent
   failing cases for any in-scope defect, fix and rerun affected gates. Multiple
   failed implementation iterations require a bounded replan, not more patches.

Completion requires the fixed cases passing and truthful evidence. Stop for an
unavailable required gate or a necessary out-of-scope runtime/tool change.

## Regression baseline

The three new mounted App regressions failed before production edits: invalid
Save wrote storage; corrected Save had two writes instead of one; explicit
cancellation was unavailable. Baseline naming gate passed all 12 cases.

## Review iteration

The first review added a permanent red case for creation immediately followed by
an async Save: pending admission blocked the delayed selection already accepted
by creation. The revised controller boundary separates public action admission
from completion of accepted selection; the projection callback finishes the
accepted selection without admitting a second action. This preserves pending
protection for all public entrypoints. Review remains restricted to the controller,
editor, canvas consumers and fixed gates. Unit coverage also checks save failures,
partial-field updates, registration replacement, same-tick Undo and pending locks.
The first browser pass passed both viewports; screenshot inspection identified an
unstyled new Cancel control, now sharing the existing button treatment.

### Bounded revision after the second review

The next regression proves a stale projection comparison can discard a submitted
value when a canonical write precedes publication. Rechecked the state ownership
contract and Item API: only the canonical command owner may decide whether a
submitted partial update is a no-op. Remove the editor's projection-equality
shortcut; all non-null drafts go through the existing Item command validator and
no-op detection. No extra canonical reads occur during typing. This changes only
the editor and its regression; rerun all fixed gates and regenerate the template.
Self-review confirms no new owner, cache, dependency, public Framework API or
Inspector scope is required. This replaces the earlier equality-shortcut design.

## Completion evidence

Status: completed locally on 2026-10-04; not pushed or published.

- `yarn workspace @asyra/starter-app test:local`: 39 tests passed, including
  11 draft/action regressions and the existing 30-Item update-boundary proof.
- `yarn workspace @asyra/starter-app typecheck` and `lint`: passed.
- `yarn workspace @asyra/starter-app react:build`: passed. Vite retains its
  existing large-chunk advisory; this task makes no bundle-size claim.
- `STARTER_APP_URL=http://127.0.0.1:5198 node node_modules/@playwright/test/cli.js test --config apps/starter-app/playwright.config.ts`:
  11 passed; one desktop case intentionally skips the narrow-only touch test.
  Both desktop and narrow rejected-draft screenshots were inspected under
  `apps/starter-app/test-results/`. The managed test server was cleaned up;
  port 5198 has no remaining listener.
- `node --test scripts/__tests__/release-template-readiness.test.mjs scripts/__tests__/release-clean-consumer.test.mjs scripts/__tests__/create-app-cli.test.mjs`:
  24 passed.
- `yarn lint:naming`: 12 passed before and after implementation.
- `yarn release:app --prod=starter-app` regenerated the distribution, followed
  by `yarn release:app:check --prod=starter-app`: synchronized.
- `node scripts/release-template-readiness.js --prod=starter-app`: READY across
  install, typecheck, lint, build, tests and startup smoke. Used the existing
  packed Framework artifacts from the completed Starter architecture worktree;
  the packages and packing/source contracts have no Git diff against that branch.
  Evidence: `tmp/framework-release-evidence/generated-template.json`.
- Public documentation generation/check, scoped Prettier and `git diff --check`:
  passed. Prettier retains the existing unknown `editorconfig` option warning.

Final bounded self-review covered public controller callers, editor lifetime,
async completion, failed persistence, invalid drafts, explicit cancellation,
same-tick history, stale projections, no-op corrections and typing work counts.
Two discovered timing defects received permanent failing regressions before
correction. No unresolved defect was found in that scope. No Framework behavior,
external consumer App or installed Agent bundle was changed. Consumers already
created from older templates still require their own update; regeneration does
not rewrite those projects.
