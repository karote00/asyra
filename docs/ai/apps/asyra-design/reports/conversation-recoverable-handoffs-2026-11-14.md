# Recoverable execution and meaningful tool handoffs

Date: November 14, 2026.

The approved five-stage implementation and complete automated AI conversation
verification are finished. The separate parent review of every current spec clause
remains unaccepted. This report does not equate automated success with universal
correctness or autonomous model performance.

Plan: [Recoverable execution and meaningful tool handoffs](../plans/agent-context-and-report-continuity-plan.md#recoverable-execution-and-meaningful-tool-handoffs).

## Resulting behavior

| Boundary | Change | Preserved constraint |
| --- | --- | --- |
| Evaluation controller and native provider | Removed the correctable-input allowlist and tool-failure-triggered interruption. Failed tool results reach the same native work turn for correction. | Explicit cancellation, operator stop, deadline and unusable transport remain terminal. Dependent work does not consume failed results. |
| Common API to Runtime to Host | Explicit semantic input rejections carry field/target details through the existing Runtime input-error contract. Read and mutation paths share the adapter. Host projects the complete failure envelope. | Unexpected errors are not guessed to be input errors. Actual settlement and successful prefixes remain authoritative; no automatic write replay. |
| Read output to dependent operation | All 90 registered common-API reads declare meaningful value contracts. Fill-target results bind to removal through field selection in one Host invocation. | Producer and consumer schemas need not be identical. Actual selected/constructed inputs must satisfy the consumer contract. Dynamic registered values remain explicitly dynamic. |
| Schema transformation and saved results | Root-relative references retain their meaning through native conversion; target binding, projection and retention resolve legal root/array/escaped pointers consistently. | Invalid/external references, incompatible values and request-owned capabilities cannot pass as portable saved data. Canonical data is retained independently from model delivery. |
| Knowledge and formal verification | Removed obsolete mandatory review obligations from the Knowledge correction guide and active specs. Formal native tests include input repair, unavailable Knowledge and save-only recovery. | No new mandatory planning, review or correction-permission workflow. Formal assertion failures still block verification. |

The explicit output conversions are small and owner-specific: DOMRect accessors
become declared JSON fields, and optional undefined object properties become JSON
omission. Missing required fields, invalid types, non-JSON array members and cyclic
data are not repaired with fabricated values. System context contains only currently
registered properties; known properties retain their type constraints when present.

## Defects found while reviewing and validating

| Finding | Evidence and correction |
| --- | --- |
| Recorder stopped a native task after a recoverable storage failure | The native RED run recorded an interruption. The current regression prepares once, retries storage in the original work turn and never replays drawing. |
| Semantic error adaptation covered writes but missed reads | A real invalid fill-target read exposed the gap. Adaptation now surrounds the shared common-API call. Nonfinite rejected indices remain textual diagnostics. A read without transaction settlement evidence remains unknown rather than claiming rollback. |
| Host treated nested failed execution data as another complete invocation | The canonical Core/Runtime/native fill regression exposed a fabricated delivery failure. The owner now receives its complete failure envelope for projection. |
| Declared read outputs did not match real owner values | Browser catalog checks caught an accidentally removed export, inherited DOMRect fields and optional undefined values. The export was restored and conversions were fixed; all 90 real-owner read cases subsequently passed. |
| Initial system context was incorrectly required to contain preset properties | The whole App gate returned a valid empty Core snapshot and correctly rejected the new, inaccurate schema. The contract now describes registration-dependent presence. Empty, partial and populated values pass; malformed present fields fail. The real Core integration assertion was preserved. |
| Native projection changed reference scope; target and retention consumers disagreed about legal references | Permanent inline/referenced, root-reference and array-segment cases failed before the shared traversal/normalization correction. Invalid-reference and lifetime counterexamples remain. |
| Full Server fixtures did not describe current canonical data | Six mechanical-iteration fixtures supplied only metadata id/type. They now supply real Core metadata fields while retaining repair, stuck, decision, cancellation, partial and unconfirmed-result assertions. A prefix fixture now requires the whole failure envelope and uses production projection. |
| Public failure validation required an intentionally hidden internal counter | The real browser/native permission test received TOOL_DELIVERY_INVALID because public checks omitted internal visitedResults. Canonical failure validation still runs first; public delivery and registered recovery now use the model schema derived from that same canonical declaration. Public required fields and acknowledgement consistency remain strict. |
| Whole-batch permission rejection became an unknown mutation-scope warning | Runtime rejects the complete batch before dispatch, with zero acknowledgements, null member identities and not-started settlement. Scope reconciliation now honors that exact receipt. Execution-stage or unknown-settlement counterexamples still require observation. |

The final browser defect was not fixed by accepting either failed or partial status.
The original failed/not-started assertion remains. Additional assertions reject
fabricated delivery failures and unknown-scope warnings, and the document digest
must remain unchanged. The actual native successor must receive the same reply.

Two fixture type errors were also corrected by using the public recording environment
rather than an unsupported backend option. The independently required Knowledge
selector was updated to its current input-repair and owner-failure tests; missing
selectors remain failures. A new registered-route test explicitly declares its
composition capability instead of bypassing control-plane admission.

## Verification

Final command:

```sh
node apps/asyra-design/scripts/verify-conversation.mjs
```

Final evidence: [summary](../../../../../tmp/conversation-proof-lQiTeK/summary.json),
[selection](../../../../../tmp/conversation-proof-lQiTeK/selection.json), and
[process records](../../../../../tmp/conversation-proof-lQiTeK/processes.json).

| Group | Test files | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: | ---: |
| Server | 101 | 3,704 | 0 | 0 |
| App | 137 | 1,489 | 0 | 0 |
| Runtime | 34 | 524 | 0 | 0 |
| Node, Knowledge and verification tooling | 51 | 597 | 0 | 0 |
| Browser | 24 | 335 | 0 | 0 |
| Total | 347 | 6,649 | 0 | 0 |

Browser flaky count is zero. All 64 independently required handoff cases are
satisfied. All 45 tracked build/type/test processes exited successfully. The frozen
source comparison covers 2,180 source files, 2,443 compiled files and the required
definition; all three comparisons are identical before and after execution.

Source revision digest:

```text
d8583c98a6c349deb5d1c50f228f97899a4e0527c64cfaa4b42544465a7bdeee
```

The summary reports `executionStatus: passed` and an empty issue list. The top-level
command intentionally exits **2**, not 0: Flow remains `awaiting-manual` because
`spec-coverage-review` is missing. No manual acceptance was created from test counts.

Focused validation includes the real 90-read browser catalog, actual native
same-turn recovery, real Core fill-target-to-removal composition, 224 schema/adapter
cases, 41 Runtime contract cases, the final 344 affected owner cases and the actual
browser/native permission regression. Scoped lint, naming, fixture type checks and
the final diff check pass. Interrupted and failed runs are not completion evidence.

Historical evidence retained for comparison:

- `tmp/conversation-proof-JYQObg`: seven Server fixture failures before corrections.
- `tmp/conversation-proof-aFhEUH`: the real App system-context contract failure.
- `tmp/conversation-proof-ywsF45`: 334/335 browser cases; the permission delivery
  failure that exposed canonical/public schema and scope handoff defects.
- `tmp/conversation-failure-view-red.log`,
  `tmp/conversation-failure-validation-red.log` and
  `tmp/conversation-admission-scope-red.log`: permanent final-boundary RED cases.
- `tmp/conversation-boundary-owner-suite.log` and
  `tmp/conversation-permission-browser.log`: focused GREEN evidence before the
  final complete run.

## Limits and remaining acceptance

The native tests use the real native process and protocol against controlled local
model responses. They prove what the provider receives and that a corrected tool
call can continue in the same work turn. They do not prove how an autonomous model
will reason about every future failure. No 101 or live drawing test was performed.

The parent requirement to independently review every current spec clause and
capability profile remains open. This task closes the approved handoff corrections
and complete automated verification, not that broader acceptance. No repository-wide
full local gate, dependency upgrade, compatibility route, commit or push was made.
