# Five-stage Knowledge handoff refactor - 2026-10-19

## Result and scope

The five current engineering stages are complete locally, subject to the explicit
limits below. The existing active plan is the authority; no completed/archived plan
was edited or moved. No new model inference, 101 generation, push, PR or monitoring
was performed. Saved drawings, raw input/output and previous failures remain intact.

This verifies current tool contracts and recovery. It does **not** establish better
AI decisions, less real-agent rework, shorter generation or improved artwork. No new
before/after drawing or reference image exists for this offline change.

## Changes and end-to-end evidence

| Stage | Confirmed problem and current correction | Verified handoff and failure behavior |
| --- | --- | --- |
| 1 - Mechanical geometry | The reviewer treated Group dimensions as a containment boundary even though they are operation snapshots. Group content now uses the existing Preset bounds derivation; only Frame establishes rectangular containment. Cached traversal also includes actual parent identity. | Saved initial/attached 101 drafts retain their identities and geometry without false Group overflow. Genuine Frame overflow remains detected. Hidden, missing and rotated geometry have explicit semantics; read-only checks do not normalize canonical geometry. Warm unchanged review performs zero metadata/computed reads. |
| 2 - Acquisition and receipts | Empty direct target fields conflict with retained targets; stale review revisions are genuinely invalid. Advice now gives executable exclusive inputs. Successful captures followed by rejected check binding previously lost actionable recovery behind a generic failure. | Original rejected input performs no query/write; corrected input dispatches one plural operation. Binding failure returns partial actual images and current bind recovery, without recording a verdict or repeating captures/edits. Independent passes survive. Review tool revision is 10. |
| 3 - Reconciliation to durability | Preserve existing precise dependency and settlement owners rather than adding a second evidence store. Two historical reload callers omitted current requiredUnits and bypassed current visual binding; those callers were replaced, not accepted through compatibility. | Root/child reconciliation, local/independent passes, late and incomplete evidence, cancellation, exact final proposal/save distinction, actual document digest, peer sync, Undo/Redo and reload. After reload both Group/Frame cases make a further edit, save, Undo/Redo, synchronize and reload again. Saved large-101 review reuse performs no additional canonical reads. |
| 4 - Actual material parameters | Portable principles already describe the relevant method; no new missing principle was established. The App solid-only example did not demonstrate the continuous-domain conversion. | Revision 8 delivers a real two-part gradient example. Real read -> preparation -> canonical browser admission proves common parent-space endpoints/stops, independent Fill identities and separate metal paint. Wrong templates preserve prior artifacts and recover through current repair. Existing mapper tests preserve gradient fields and reject incompatible shared/parent/stale targets. |
| 5 - Whole-chain closure | An existing runtime fixture expected generic Rectangle containment; the current contract requires type-specific boundaries. An old evaluation Flow still authorized a live run. | Runtime integration now covers Frame, Group and Rectangle with unchanged reuse/disposal assertions. The old live authorization and obsolete current acceptance were removed. Current source proof captures the portable architectural module; generated Inspector catalog matches source. Existing status, provider, persistence, diagnostics and evidence gates remain enforced. |

## Verification

Counts below are suite results, not a sum of unique cases: some owners appear in
more than one required integration gate.

| Gate | Result | Evidence |
| --- | --- | --- |
| Complete existing server suites | 1,332 passed; two conditional cases initially skipped | `tmp/knowledge-refactor-final-server.log` |
| Complete existing App AI suites + corrected current-type runtime suite | 628 cases pass across the full run and affected-suite correction: 607 unchanged cases plus 21 runtime cases | `tmp/knowledge-refactor-final-ai.log`, `tmp/knowledge-refactor-final-runtime.log` |
| Persistence, collaboration, Factory/outbox and retained-query consumers | 215 passed | `tmp/knowledge-refactor-final-persistence.log` |
| Optional advice and current material handoff | 12 passed, including actual delivered example text equality and independent no-Knowledge operation | `tmp/knowledge-refactor-final-handoff.log` |
| Existing preparation/Knowledge/prompt owner coverage | 93 passed across the owner run and corrected handoff oracle; portable data/Inspector catalog contracts 11 passed | `tmp/knowledge-refactor-stage4-owners.log`, `tmp/knowledge-refactor-stage4-handoff-final.log`, `tmp/knowledge-refactor-final-contracts.log` |
| Evidence harness with real Chromium/controlled delayed transport | 35 Node cases, 28 browser-provider cases and 19 backend/receipt cases passed; no inference | `tmp/knowledge-refactor-final-evidence.log` |
| Scoped/browser evidence and saved large-file flow | Six original cases passed; two recorded reload cases passed with current caller contracts; Frame/Group post-reload continuation both passed | `tmp/knowledge-refactor-stage3-browser.log`, `tmp/knowledge-refactor-stage3-reload-current.log`, `tmp/knowledge-refactor-stage3-postreload-continued.log` |
| Same-source architecture proof | 41 obligations; all nine injected negative scenarios detect their required failures; final recovery passes | `tmp/knowledge-refactor-final-current-proof.log` |
| Typecheck, lint, naming | Passed; one existing no-console warning in the recorded-document test | `tmp/knowledge-refactor-final-{types,lint,naming}.log` |

The full AI run's obsolete-container assertion remains recorded as a failed run;
only its corrected affected suite supplies replacement evidence. Likewise initial
node/jsdom invocation mistakes, absent historical fields and the solid-fill null
oracle are retained as failures. Passing later evidence does not rewrite those logs.
The large bootstrap conditional case is enabled separately in
`tmp/knowledge-refactor-final-bootstrap.log`. The optional installed native-protocol
probe was not configured; controlled provider protocols passed, and no live-agent
improvement is claimed.

Captured source digest: `b3c4bea799fc97a7515ea30237bd5dbbd3b59f6d4021e870b519cb9f7feaf79d`.
Mapping revision 6: `8c8c9e4a039eab6b24773cd2d9f93b98013ed07211cd60de774bc09becb3c3e4`.
Final recovery candidate: `473a60dc-39c1-4464-99d9-bdbde9d7d58c`.
Accepted contract review: `2d827b6a1bfbd0fef835f39f5dee6f73b8abfc5436059808ae9d077dcedc2c4c`.

## Exact advisory treatment

These are admitted Markdown body identities (frontmatter excluded), not model
exposure in a new run. The App integration test compares actual delivered text
with the source body. Existing catalog tests prove dependency delivery, same-context
reuse, rehydration, cancellation and failed-read recovery.

| Source | Registered revision | Body UTF-8 bytes | Body SHA-256 |
| --- | --- | --- | --- |
| `domain-knowledge/illustration.architecture.md` | 4 | 12836 | `ec3b68032756cc659aa4ca27f1b5d6bb157658d4353bae7caf7a254dfe3e21c0` |
| `apps/asyra-design/knowledge/design.architectural-illustration.md` | 8 | 36297 | `3937aa3f86e7c51bedc437e424fb7ae776221c5a6a4305e8e4dfc6e173f3acf8` |

Portable architectural content remains revision 4 and is unchanged by this
five-stage implementation. App-only advice is revision 8. App tool names, coordinate
parameters, mapper limitations and recovery stay out of the portable module.
There is no Knowledge-read token, compliance gate, sample requirement, extra model
reviewer, new cache/registry, callback or legacy invocation alias.

## Remaining limitations

- Current retained color mapping is not an arbitrary continuous 2D gradient field.
  Independent nonperiodic gradients still need supported explicit parameters.
- Mechanical geometry checks do not certify appearance; incomplete/rotated cases
  stay explicit rather than becoming a visual pass.
- Reload restores the document, not prior request authority. New requests acquire
  current handles and judgments; no cross-request acceptance persistence is claimed.
- The offline profiler scalability issue noted by the plan is unchanged. Tests do
  not imply that processing every historical diagnostic stream is now faster.
- The fixed 101 quality rubric and ten-minute cutoff remain requirements for a
  **future separately authorized** evaluation. No historical comparison proves a
  causal Knowledge effect, and no further model run is scheduled.
