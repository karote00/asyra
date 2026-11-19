# Spec-derived conversation verification - November 14, 2026

## Outcome

The replacement verification path executed the complete selected conversation gate
on frozen source. The feature did **not** pass: **6,662 passed, 3 failed, 0 skipped**
across 347 files. The independent `spec-coverage-review` remains unaccepted.
The result proves specific handoffs and detects real defects; it does not certify
all conversation behavior from the number of passing assertions.

Task authority: [active replacement plan](../plans/completed/agent-context-and-report-continuity-record-2026-11-16.md#spec-derived-conversation-verification).
Current execution: `tmp/conversation-proof-dThnsW`; command:
`node apps/asyra-design/scripts/verify-conversation.mjs`.
This was offline verification, not a Taipei 101 drawing or repository-wide test.
No product implementation, compatibility route, prompt or validation rule was changed
in this verification-owner correction.

## Replacement and independence

The superseded verifier and synthetic native reply dispatcher were deleted before
replacement work. Their absence remains a permanent regression in
`apps/asyra-design/__tests__/framework-runtime-boundary.test.mjs`. Historical logs
and explicit deletion documentation do not provide alternate executable routes.

Current specs define twelve required handoff boundaries. Independently maintained
Flow criteria identify necessary semantic cases; maintained owner tests provide
broader execution. Neither directory selection nor successful execution accepts the
manual semantic criterion. The gate also reconciles actual browser discovery with
official functional responsibility mappings, and walks the verification entry's
literal module dependencies to detect omitted existing verifier-owner tests.
These checks supplement specification review; they cannot derive semantic coverage
from imports or approve their own scope.

The production-path fixtures replace external model decisions with a loopback
Responses service. The real App, controller, HTTP adapter, Host, Runtime, canonical
owners and native SDK produce and transport results. Assertions inspect the SDK's
actual successor request, not a synthetic reply submitted by a test dispatcher.
Browser cases use real Core mutations, captures, history and collaboration consumers.
Existing isolated owner tests remain useful, but are not relabeled as whole-chain
native or browser evidence.

## Deliberate corruption detection

Focused negative controls preceded complete feature execution. The final frozen
run includes the following controls and their corresponding normal paths:

| Boundary                                        | Deliberate fault                                                            | Observed detection                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| App instructions and tools to native consumer   | Remove instructions or alter the published schema                           | Actual model request assertions reject the corruption.                                  |
| Knowledge to native successor                   | Remove execution outcome or alter advice                                    | Exact advice and status assertions reject the damaged successor input.                  |
| Reference images and draft association          | Drop an image or exchange attachment association                            | Native image and source-association assertions reject the corruption.                   |
| App retained data to later native turn and Core | Alter a saved stage input or saved advice                                   | Consumer/canonical assertions reject the altered value; normal cross-turn reuse passes. |
| Canonical multi-capture result to native input  | Lose selected capture images                                                | The actual successor's image-delivery assertion rejects the loss.                       |
| Mechanical iteration to canonical consumer      | Replace a repairable verdict with a passing verdict                         | Canonical-state assertion rejects the result despite native success.                    |
| Evidence admission                              | Missing, duplicate, substituted, skipped, interrupted or stale observations | Formal runner/parser gates refuse complete passing evidence.                            |

Relevant permanent tests are `native-provider-handoff.integration.test.ts`,
`conversation-production-handoff.integration.test.ts`,
`e2e/conversation-provider-handoff.spec.ts`, the conversation scope/CLI tests and the
shared Flow Inspector runner, parser, source and publication tests. Expected faults
being caught are passing negative controls; they are distinct from the three
unexpected product failures below.

## Final execution

| Group                              | Files | Passed | Failed | Skipped |
| ---------------------------------- | ----: | -----: | -----: | ------: |
| Server and evaluation interception |   101 |  3,732 |      2 |       0 |
| App                                |   137 |  1,477 |      0 |       0 |
| AI Agent Runtime                   |    34 |    523 |      0 |       0 |
| Shared Knowledge and verification  |    51 |    596 |      0 |       0 |
| Browser                            |    24 |    334 |      1 |       0 |
| Total                              |   347 |  6,662 |      3 |       0 |

All 45 managed processes settled without cancellation or timeout. Source files,
compiled exports and Flow definitions are identical in `source-before.json` and
`source-after.json`. The command exits 1 and the Flow is failed. Its eighteen
diagnostics describe three product failures and their dependent evidence rejection;
they are not eighteen distinct defects.

The evidence directory retains original runner reports, normalized observations,
selection, process outcomes, source snapshots and browser artifacts. The root
`summary.json` records the failed result. No result was substituted from an earlier
run.

## Confirmed product failures

### 1. An input restriction disappears before the model receives it

Case: `preserves invalid empty result selection rejection in the actual native contract`.

The App declaration rejects `{ delivery: { fields: {} } }`. The actual native
model declaration no longer retains the necessary `minProperties` restriction and
accepts that shape. The permanent case observes both sides of the real SDK handoff.
Runtime validation still rejects the empty selection before writes; this evidence
does not show an illegal mutation. It shows inconsistent advertised and executable
contracts, with avoidable corrective interaction as a consequence.

Failure assertion: `server/__tests__/native-provider-handoff.integration.test.ts:132`.
No schema relaxation, compatibility path or fixture-specific replacement was added.

### 2. A legitimate acknowledged prefix becomes an invalid tool result

Case: `preserves the actual native partial receipt after canonical child creation fails`.

The real root creation succeeds; a controlled failure in the public child-creation
owner interrupts the next operation. The App output contract requires `timing`, but
the acknowledged-prefix catch branch omits it. The native successor therefore
receives `TOOL_RESULT_INVALID` instead of a valid partial receipt. The test checks
real canonical work, actual native output and no replay of acknowledged work.

The mismatch is in `src/ai/design-actions.ts`: required output fields near line 120
and the partial-result catch branch near line 582. The independent failing assertion
is in `server/__tests__/conversation-production-handoff.integration.test.ts:723`.
A legitimate partial outcome must be fixed at its producing owner, not admitted by
weakening downstream validation.

### 3. A produced composition ID cannot feed subsequent review and capture

Case: `executes real staged template reuse and mechanical repair before applying the next part`.

The sequence binds the preceding application output's `compositionId` to later
`elementId` inputs. The source contract declares an ordinary nonempty string;
review and capture require a document reference. Review also declares a string
length bound absent from the output. Runtime admission rejects both bindings at:

- `/checkpoints/0/iteration/check/input/fields/arguments/fields/elementId`
- `/steps/4/input/fields/arguments/fields/elementId`

The responsible contracts are `src/ai/design-actions.ts`, `src/ai/review-action.ts`
and `src/ai/inspection-schema.ts`; Runtime compares their structural/lifetime
requirements in `packages/ai-agent-runtime/src/recipe-schema.ts` and reports the
admission failure in `recipe-admission.ts`.

The browser receives `TOOL_CONTRACT_INVALID` with `settlement: not-started`.
The test does not inject a literal ID or bypass the binding to manufacture success.
Consequently, later staged template/repair/application effects in this scenario
remain **unproven**. A separate real existing-target host iteration passes, but
cannot establish this produced-ID staged handoff.

## Verification-owner corrections and review

The independent dependency check first failed on seven omitted shared-owner test
files. Selection now includes them and runs scope admission before expensive builds.
Their focused execution exposed two additional verification integration errors:

- The CLI interruption test expected one process even though scope admission now
  precedes the cancelled build. It now verifies the exact successful-preflight and
  cancelled-build prefix, completed process records and no successor dispatch.
- Ten new native browser cases lacked official functional responsibility mappings.
  They now map to `execute-agent-request` and its actual implementation owners.
  The existing complete-discovery assertion remains strict.

The shared parser file also mixed ordinary units with 44 guarded whole-App proof
runs. Those valid profiles were moved intact to `playwright-owner-proofs.test.cjs`;
no conversation case was skipped to pass the gate. The expensive whole-App profiles
remain outside this task and were not run. Their responsibility mapping check passes.
Their stale fixed count of 411 is replaced by exact maintained case identities;
permanent checks reject missing, duplicate and equal-count substituted identities.
The original raw-report outcome oracle is shared through the existing fixture,
not reimplemented as another executor.

Focused shared-owner checks passed (143 cases, no skips), followed by all 25 parser
cases, the separate profile mapping check, scoped lint, verification typecheck and
naming. The final complete run then included the current corrected shared tests.
Earlier intermittent structural/motif failures did not recur in either of the last
two frozen runs; their original evidence remains retained, without a claimed fix.

## Acceptance boundary and remaining work

Established evidence includes same-turn input correction, same-session reporting
and later questions, Knowledge paging/reuse/rehydration and unavailable-library
behavior, retained stage/advice reuse through the real App exchange, canonical
hierarchy/capture/history/collaboration, selected multi-image delivery and a real
host iteration. Their deliberate corruption controls detect damaged handoffs.

Whole-feature acceptance remains failed. The three product defects above are not
old tests and were not repaired in this verification-only task. The staged successor
work blocked by admission cannot be certified by other passing cases. The manual
specification-coverage criterion remains unaccepted; no automatic count or inventory
can turn these results into full correctness.

The next product slice must align native advertised restrictions, partial-result
production and document-reference output contracts with their consumers. After
owner corrections, the existing failing regressions and the same complete gate
must be rerun. This report does not authorize widening validators, adding aliases,
restoring superseded paths or claiming that future model choices are verified by
scripted offline scenarios.
