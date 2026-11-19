# Conversation contract repairs - November 14, 2026

## Outcome and scope

The three demonstrated product defects are repaired at their declaring owners and
formal consumers. The complete automated conversation gate then exposed a separate
publication-scope defect in the verifier; that defect was reproduced, repaired and
followed by another complete run.

Final evidence: `tmp/conversation-proof-JnVY1o`.
Command: `node apps/asyra-design/scripts/verify-conversation.mjs`.
Task authority: [verified producer and consumer contract repairs](../plans/completed/agent-context-and-report-continuity-record-2026-11-16.md#verified-producer-and-consumer-contract-repairs).

**6,673 passed, 0 failed, 0 skipped across 347 files.** All twelve automated Flow
nodes are done and all publication warnings are resolved. The independent
`spec-coverage-review` remains unaccepted, so the Flow is `awaiting-manual` and the
CLI exits 2. Passing execution does not automatically accept that manual criterion.
There is no remaining failed automated criterion in this run. Whole-spec semantic
acceptance remains separate from this bounded repair task.

This was offline feature verification through the actual native SDK and App
services. External model decisions were scripted by the existing loopback fixture.
It was not a live-model drawing, Taipei 101 test, release check or repository-wide
test. No dependencies, environment tools, Runtime validators or shared publication
semantics were changed in this repair slice. No commit or push was performed.

## Product repairs

| Defect                                                                               | Authoritative correction                                                                                                                                                                                        | Preserved behavior and proof                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native declarations lost the nonempty result-selection restriction                   | The existing `nativeToolInputSchema` projection expresses the same nonempty-object constraint using supported intersection/exclusive alternatives. Canonical input validation retains its original restriction. | Actual SDK declarations reject empty selection, malformed selectors and arrays, while accepting valid named selection. Projection tests preserve current local definition references, unions, idempotence and source immutability. |
| A real acknowledged prefix omitted required `timing`, becoming `TOOL_RESULT_INVALID` | `createPreparedDesignAction` creates its terminal timing snapshot for complete and partial results. Failed creation and settlement work is measured through `finally` without inventing acknowledged members.   | Real Core child-creation failure preserves the actual root, partial settlement and native receipt. Completed writes are not replayed; required output fields remain required.                                                      |
| Produced composition IDs could not bind into review, later attachment and capture    | Prepared output IDs now declare document lifetime and the already enforced 256-character bound. Canonical and model-facing application `parentId` inputs both retain document-reference semantics.              | Existing preparation admission is unchanged. Produced IDs flow through real checks, repair, next-part application and native capture. Current parent capability, membership and lock checks remain in force.                       |

The third repair uses the existing prepared identity limit at its semantic owner;
it does not introduce a new arbitrary document-ID limit. The destination parent
contract remains an existing-document reference without adding that preparation
length bound. Request-owned artifacts remain request-owned. Internal material
member IDs refer to pending prepared entries and were not mechanically relabeled
as existing document targets.

Relevant implementation owners are:

- `apps/asyra-design/server/operation-input-schema.ts`
- `apps/asyra-design/src/ai/design-actions.ts`
- `apps/asyra-design/src/ai/prepared-design.ts`
- `apps/asyra-design/src/ai/prepared-design-admission.ts`
- `apps/asyra-design/server/local-design-tools.ts`

The local-provider and design-preparation specs and matching AI execution Inspector
conditions were updated with the current contract. No alias, compatibility branch,
validator widening, literal-ID substitution or new mandatory model workflow was added.

## Test assumptions corrected without weakening the product

The staged browser regression initially stopped at contract admission. Once its
produced-ID bindings were admitted, two previously unreachable oracle errors became
visible:

1. It prepared a Frame whose child already overflowed, although preparation must
   reject unresolved deterministic findings. The scenario now prepares a valid
   140-pixel Frame, applies it, then resizes it to 100 pixels through the real bound-ID
   action. That legitimate document edit creates the overflow needed to test repair.
   Preparation rejection was retained.
2. Its expected action sequence omitted the formal step-time region selection.
   The expected sequence now includes `resolve_design_targets` and checks that its
   selected ID equals the canonical child accepted by the repair action.

The test still requires repairable -> actual repair -> passing review, retained
motif reuse, later parent attachment, expected canonical colors/positions, image
arrival in the actual native successor, and one reversible Undo/Redo group. It does
not inject a passing verdict or replace generated IDs with literals.

Focused evidence:

| Evidence                                        | Observed result                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| `tmp/conversation-native-selection-red.json`    | Actual native empty-selection restriction failed before correction.             |
| `tmp/conversation-native-selection-green.json`  | Ten selected native/projection checks passed.                                   |
| `tmp/conversation-native-projection-all.json`   | All 28 projection checks passed.                                                |
| `tmp/conversation-partial-red.json`             | Three strengthened partial receipt/timing regressions failed before correction. |
| `tmp/conversation-partial-green.json`           | All 65 application/consumer/transaction checks passed.                          |
| `tmp/conversation-partial-native-green.json`    | Original real Core-to-native partial receipt case passed.                       |
| `tmp/conversation-identity-red-admitted.json`   | Actual identity boundary cases passed; missing output metadata failed.          |
| `tmp/conversation-parent-reference-red.json`    | Both canonical and model-facing parent-reference declarations failed.           |
| `tmp/conversation-parent-reference-green.json`  | All 192 application/preparation/created-target checks passed.                   |
| `tmp/conversation-repair-staged-browser.json`   | Exposed the missing downstream parent-reference declaration.                    |
| `tmp/conversation-repair-staged-browser-2.json` | Correctly rejected the invalid initial preparation fixture.                     |
| `tmp/conversation-repair-staged-browser-3.json` | Completed owner work and exposed the omitted selection receipt assertion.       |
| `tmp/conversation-repair-staged-browser-4.json` | Entire staged browser sequence, native delivery and Undo/Redo passed.           |

Selected runs are focused evidence, not complete coverage counts. The complete
feature run below executes the maintained owner files without those title filters.

## Verifier publication correction

The first complete run after product repairs, `tmp/conversation-proof-x2FJj8`,
passed 6,672 tests. Final review nevertheless found **33 false missing-result
warnings affecting ten automated nodes**. This was a verifier defect, not a product
failure or an absent manual review alone.

Server and App batches share the Vitest producer and working directory. The CLI
captured both batches' criteria, then published only the current batch's results.
The later App publication consequently marked completed server criteria as missing.
The raw-record completeness checks did not inspect the final formal warning state,
so `executionStatus` misleadingly said passed while automated nodes were blocked.

The correction is at the pre-execution scope owner:

- `captureConversationGroup` delegates to formal capture with the group's declared
  files as well as producer and working directory.
- Formal normalization and publication remain the shared owners. Missing records
  within a selected batch remain failures; executed-only publication is not used.
- The final CLI summary also consumes the formal evaluator's unsatisfied automated
  criteria and unresolved warnings. It does not construct a substitute Flow verdict
  or accept manual criteria.

The permanent scope regression runs two real Vitest subprocesses through the shared
managed-process owner, normalizes their actual reports and publishes them through
formal capture/publication. It reproduces the cross-batch warning before the fix,
then proves valid publication and rejection of absent, duplicate and source-stale
results. Valid current evidence resolves only the relevant warning. Independent
manual acceptance remains false throughout.

RED evidence: `tmp/conversation-publication-red.log` and
`tmp/conversation-publication-state-red.log`. The final 32 focused scope, CLI and
shared-adapter regressions passed in `tmp/conversation-publication-green-3.log`.
The same permanent regression is included in the final full feature run. Shared
publication code was not weakened, and old warnings were not manually deleted.

## Final complete execution

| Group                              | Files | Passed | Failed | Skipped |
| ---------------------------------- | ----: | -----: | -----: | ------: |
| Server and evaluation interception |   101 |  3,736 |      0 |       0 |
| App                                |   137 |  1,482 |      0 |       0 |
| AI Agent Runtime                   |    34 |    523 |      0 |       0 |
| Shared Knowledge and verification  |    51 |    597 |      0 |       0 |
| Browser                            |    24 |    335 |      0 |       0 |
| Total                              |   347 |  6,673 |      0 |       0 |

All 45 managed top-level processes finished with code 0 and no cancellation or
timeout. Browser results have no unexpected, skipped or flaky cases. Source files,
compiled exports and Flow definitions match exactly in `source-before.json` and
`source-after.json`. The final summary has no execution issues or publication warnings.

All twelve automated nodes are done: request, instructions, discovery, Knowledge,
admission, composition, canonical state, results, retention, media, lifecycle and
evidence. The final run includes deliberate corruption controls for instructions,
contracts, Knowledge data/status, attachment association, retained values, media,
mechanical verdicts and execution evidence. These inspect actual consumer input or
canonical state; they are not synthetic model-success receipts.

Scoped lint, the 15 naming checks, App type checking and verification-fixture type
checking passed. Historical reports and failed evidence remain unchanged. The only
unaccepted Flow criterion is the independent current-spec coverage review; automatic
execution and this bounded defect repair do not substitute for that review.
