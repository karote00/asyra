# Tool selection curriculum

This is an offline evaluation protocol for the Design harness. It does not run
inside a drawing and does not prescribe a camera, style or mandatory tool route.
Baseline evidence: `d8b70145-757c-4403-bacb-435e4a2b7e7b`, source `c6506a16`
plus its recorded local configuration. Preserve that run; it is not a matched
baseline for the new scenarios below.

## Development cases

| Case                 | Brief / setup                                                                                              | Behavioral oracle                                                                                 | Failure under investigation                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Plan acknowledgement | Save a supplied short plan, then the same plan with longer descriptions; perform partial and final reviews | Same compact receipt size for identical IDs/statuses; original criteria/facts still govern review | Echo of caller-owned narrative                                                 |
| Supplied world faces | Draw two supplied planar faces from explicit world coordinates and a supplied orthographic camera          | Native vertices match the specified projection; visible face order preserved                      | Model enumerates derived coordinates although backend projection is applicable |
| Repeated world motif | Draw a translated grid of supplied four-corner panes in one fixed view                                     | Exact count, spacing, faces and requested colors; no missing detail                               | Expanded repeated source data                                                  |
| Curved 2D motif      | Repeat a supplied Bezier mark at three nonuniform 2D positions                                             | Exact curve/control geometry and order, without invented depth                                    | Unsuitable projection or loss of curve data                                    |
| Existing fill edit   | With target IDs supplied, change only their fill colors                                                    | Correct new colors, same geometry/identities, no reconstruction                                   | Preparation chosen for a direct edit                                           |

Contract proofs live in `server/__tests__/design-review-stages.test.ts`,
`local-design-tools.test.ts`, `design-patterns.test.ts`,
`local-design-workflow.test.ts`, `local-operation-tools.test.ts` and
`local-ai-evaluation.test.ts`. Use their executable source fixtures for deterministic
checks. These supplied-input tests do not test model choices.

## Reserved model validation cases

Keep these out of candidate prompt/examples. Do not tune the candidate from their
results. No live trial has run for this curriculum yet.

- "Draw an intentionally ugly, uneven five-point star in flat 2D. Keep the uneven outline."
  Require an editable irregular shape; detailed rendering or invented depth fails.
- "Design a simple 720 px landing-page hero with a heading and two buttons."
  Check requested layout/text, editability and actual overlap; projection is optional
  only if justified by the request, never required to pass.
- Existing selected elements: "Move these 12 px to the right; keep everything else."
  Check only position deltas, stable identity and no unnecessary reconstruction.

Taipei 101 upper-two-sections recording remains the integration scenario with the
existing elevated-view brief. First-output testing stops ten seconds after first
visible output and must not certify final quality. Recording-only fit does not
change normal App behavior.

## Comparison and next-case selection

Before live trials, freeze baseline/candidate source, prompt/tool definitions,
model/effort, starting document, attachments and sample count. Use fresh contexts
and the same input for both versions. A source commit alone is insufficient for a
dirty working tree; retain the exact source snapshot or hashes. Keep failed runs
and retries, actual call inputs/outputs and expected/result observations.

First extract concrete symptoms from each trace without forcing an old category.
Then match failures by mechanism and evidence. The saved-record report groups
tool/phase/error/configuration observations to aid investigation, not to prove
that all members share a root cause. Assess severity, fixability, applicability to
other cases and regression risk before selecting the next development case.
Revisit actionable failures; add an unseen scenario when existing ones no longer
exercise the unresolved problem. Fixed acceptance cases still run after changes.

Report requested-result correctness, recoverable input errors, repeated narrative,
avoidable calls, usable receipts and first-visible timing separately. Tool choice
alone is not a quality oracle. Compare cases as fixed, still-failing, regressed,
still-passing or unmeasured; never count an unrun case as passed. Small live samples
are descriptive, not statistical proof. A byte reduction is not a token or latency
claim. Do not lower quality to improve time.

Use the existing `ai:report` CLI for run/period evidence. JSON includes
`investigationTargets` with source configuration and call/sequence links; reports
do not automatically edit prompts, dispatch models or rank frequency as severity.

Concept sources:
<a href="https://arxiv.org/abs/2610.00906" target="_blank" rel="noopener noreferrer">ActiveSaddler paper</a>
and <a href="https://github.com/microsoft/AutoSaddler/tree/feat/activesaddler" target="_blank" rel="noopener noreferrer">official implementation</a>.
