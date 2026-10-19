# Whole-flow evidence handoff - implementation verification

## Follow-up full-chain review

The subsequent user-requested review found one concrete defect in the previous
correction: a child receipt projected from a complete root review had no standalone
digest yet. Explicitly reviewing that unchanged child compared only its digest,
replaced the receipt identity, advanced the server check revision and invalidated
dependent passes. The earlier cases covered root reconciliation and later reads,
but omitted this alternate explicit acquisition of the same proof. Previous green
gates therefore did not establish this order-independent identity requirement.

The canonical reviewer now uses the same supported rule-input normalization for
capture, validation and reconciliation. An equal projected receipt becomes a
standalone receipt without changing its identity; its standalone digest and
coverage replace the projection metadata. Real input changes still replace it.
No compatibility branch, second owner, new cache or relaxed completion check was
introduced.

The new producer regression and existing real-owner integration both failed before
the correction (`tmp/whole-flow-rereview-red.log`). Permanent cases now cover a
leaf and a subtree, projection -> explicit capture -> broader reconciliation,
actual descendant edits, old-receipt rejection and preservation of dependent
primary judgments. The existing real-browser whole-chain case also explicitly
rechecks a projected child before local edits and after primary visual acceptance,
then continues through completion, durable persistence and reload.

The review also traced existing consumers rather than only these assertions:
revision-bound detail access, complete internal pending queries, unsupported and
interrupted coverage, cancellation/competing publications, primary visual admission,
provider finalization errors, persistence partial outcomes, collaboration compensation
and retry. Portable Knowledge and the App advisory boundary remain unchanged.
The follow-up verification results are recorded in the plan's current outcome.

## Scope and conclusion

The authorized correction closes the reproduced App evidence handoff through real
browser edits, result reconciliation, reuse, completion, durable save and reload.
It does not claim a new real-agent quality or speed improvement. No model execution,
new 101 drawing, push, monitoring, dependency or infrastructure was introduced.

Worktree: `.worktrees/design-knowledge-evaluation`, branch
`codex/design-knowledge-evaluation`, based on
`3d503aa714336946839374dc948e9c171cfb8182`. Changes remain local and uncommitted,
including pre-existing authorized evaluation changes. This report describes only
the current whole-flow correction, not every dirty file's original work.

## Diagnosis and correction

| Confirmed problem | Corrected owner and behavior | Preserved failure boundary |
| --- | --- | --- |
| A complete root review left old child obligations stale | The canonical reviewer proves compatible supported-rule/subtree coverage. The existing server check owner reconciles exact acknowledged results with captured revision and receipt guards. | Uncovered, unsupported, partial, cancelled or superseded results never become passes. Mechanical coverage cannot clear visual or prepared-source obligations. |
| Replacing a still-equal pass could invalidate its dependent visual judgment | Retained normalized rule inputs preserve unchanged child receipt identity and revision, including after unrelated root refresh. | Actual local/shared changes still invalidate their real dependents. Reload does not restore old request/browser receipt authority. |
| Common-store replies serialized all unresolved rows | One owner-produced default summary returns counts, first pending ID and ledger revision. Exact IDs and revision-bound detail pages expose full requested records. | Changed page revisions reject before mixing versions. Complete internal evidence still controls request completion. Summary projection is bounded; currency validation is not claimed to be constant-time. |
| The saved final-response lookup was routed as an unknown callable search | Discovery uses the actual provided final-action definition and identifies its final-response route. Acquisition guidance distinguishes known complete contracts from missing information. | Final actions remain unavailable to native/batch/recipe execution. No alternate tool registry was introduced. |
| Provider finalization could label an App failure invalid model JSON | JSON decoding, envelope admission and App completion retain separate failure ownership. | Cancellation and completion errors propagate without claiming success or replaying drawing writes. |
| Material intent, actual fill domains and judgment granularity disagreed | App-owned guidance maps optional material methods to existing normalized handles, useful joined portions and independent material/detail judgments. | Portable knowledge contains no new App API details. Tools accept valid inputs without advice adoption. No mandatory sample gate or extra AI reviewer exists. |
| Saved traces could not explain result replacement | Existing observation records bounded selected revisions, actual acknowledgements, successor revisions and retained/updated/unavailable/superseded dispositions. | Recording failures do not alter product results; aborted dispatch is recorded without mutation replay or extra activity chatter. |

The recurring process gap was also corrected: owner-local tests and envelope
validity cannot prove a missing product handoff. The plan, active specification,
Inspector contract and permanent cross-owner cases now describe the same complete
chain. Inspector is still not an oracle for requirements omitted from its contract.

## Saved evidence and real integration

The immutable source is
`tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792342207875`.
Its calls 60-63 record a complete root check, root-only verification, 5,459 stale
records in a 2,800,599-byte reply, then the misdirected `report_outcome` lookup.
The permanent fixture retains exact inputs and original output facts/hashes:
`apps/asyra-design/server/__tests__/fixtures/recorded-101/whole-flow-closure-20261019.json`.
Eight original payload hashes were checked against preserved provider payloads.
Replays use current document/receipt identities rather than treating historical
IDs as valid evidence.

The real-owner integration runs the canonical reviewer, browser validation action
and server operation/check owners together. It covers interrupted delivery and
retry, local/sibling edits, competing updates, cancellation, unchanged dependent
judgments and observer failure. Existing direct, batch and composition suites
verify the changed descriptors and delivery consumers.

The browser acceptance uses actual App modification, checks, peer collaboration,
Undo/Redo and document persistence. Completion without the required primary
judgment is rejected. Explicit capture/binding and a controlled valid primary
judgment then permit actual `report_outcome`, durable acknowledgement and reload
with equal document content. The controlled verdict tests the contract only; it
does not substitute for an agent's visual assessment.

A separate existing saved Taipei101 checkpoint is hash-verified and loaded through
the normal App session. After its root review, 128 covered targets are reconciled
in two bounded batches, then reconciled again. Both phases add zero canonical
reads, computations or measurements; repeat evidence identities and document
content stay equal. This is a work-count oracle, not an artwork-quality score or
a model latency prediction.

## Verification results

All log paths below are repository-local under this worktree.

| Gate | Result | Evidence |
| --- | --- | --- |
| Existing AI/browser-owner unit and integration suite | 619 passed | `tmp/whole-flow-ai-verified.log` |
| Existing server response harness suite | 1,324 passed, 2 conditional skips | `tmp/whole-flow-server-verified.log` |
| Evidence-chain browser integration | 4 passed | `tmp/whole-flow-browser-verified.log` |
| Existing collaboration/save failure recovery | 3 passed | `tmp/whole-flow-persistence-recovery-2.log` |
| Saved large-document coverage reuse | 1 passed | `tmp/whole-flow-saved-geometry.log` |
| App method/prompt handoff | 40 passed | `tmp/whole-flow-method-handoff-2.log` |
| Production typecheck | Passed | `tmp/whole-flow-types-verified.log` |
| Focused final lint | 0 errors, 3 existing console warnings | `tmp/whole-flow-observation-lint-final.log` |
| Naming | 15 passed | `tmp/whole-flow-naming-verified.log` |
| Inspector catalog | 8 passed | `tmp/whole-flow-catalog-verified.log` |
| Inspector source proof | 41 obligations, 9 exact negative scenarios and recovery passed | `tmp/whole-flow-proof-final.log` |

The two conditional server skips are the installed-native registration probe
(`LOCAL_AI_PROTOCOL_EXECUTABLE`, not configured) and saved checkpoint encoding
benchmark (`E2E_LARGE_DOCUMENT`, not enabled in that server suite). They are not
reported as passes. The actual large saved-document browser gate was separately
enabled and passed. Test totals overlap across targeted and broad runs; they must
not be summed into a unique-case coverage claim.

Inspector structural admission covers the AI execution and functional manifests.
The final source proof uses digest
`1ecc8845f05063da4998e546ffada4ae90868d32b48e5fba07f19694ff9fb0fc`;
its final baseline recovery is `4c4f54d7-2905-462c-83cc-052a783b9715`.
Local contract evolution review
`89d244b5dbd575e706823e253b7084e954dfa02ad2a3e109facdc63edb68171e`
accepted the reviewed contract without retiring obligations. The source proof and
selected real-browser cases have different scopes and are both necessary. This is
not a protected-delivery assessment, CI result or claim that every repository
flow was executed.

Earlier logs retain failed detail-view assumptions, the missing visual delivery
schema declaration, the test-only lint error and the unaccepted mapping attempt.
Assertions were corrected to request explicit details without removing their
behavioral expectations; the schema was declared and revision advanced. The
architecture change required the supported contract-evolution path rather than
the narrower mapping-only review. Corrected gates passed; historical failures
were not relabeled successful.

## Limits and next decision

- Deterministic evidence establishes tool correctness, scoped reuse and recovery.
  It does not prove fewer model queries, earlier material decisions, less rework
  or better podium composition.
- Portable Domain Knowledge was not changed by this correction. App advice is
  executable through existing tools but remains advisory. Agent adoption has not
  been re-evaluated with the changed source.
- Mechanical passes cannot certify aesthetics. Primary-agent judgment, product
  completion and durable persistence remain distinct.
- Old request/browser receipts remain invalid after reload. The verified persistent
  artifact is the document; cross-request proof persistence was not added.
- The saved run identifies this incident's cross-owner defect. Generic old stale
  flags cannot establish the individual cause of every historical stale record.
- No new model evaluation is needed to establish these deterministic contracts.
  A future efficacy claim would require separately authorized controlled agent
  evidence under the fixed rubric.
