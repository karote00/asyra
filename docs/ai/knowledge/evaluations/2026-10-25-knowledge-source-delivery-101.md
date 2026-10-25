# Knowledge source delivery - local proof and bounded 101 observation

The source-metadata duplication correction is locally verified and observed in one
live run. The artwork outcome is partial, not accepted. No CI, push, second model
run, Knowledge body change or unrelated owner correction was performed.

## Scope and source

- Task 3 in the active composable-domain-knowledge-v1 plan.
- Worktree: `.worktrees/design-knowledge-evaluation`; branch: `codex/design-knowledge-evaluation`.
- Base HEAD: `b06fe350720d8f7c6ba51d2344e11a2a9ac8b2f2`, with the reviewed local correction.
- Inspector verify: `04409d9a-9093-48ba-9167-be9781a31977`; revision 123; 79 cases passed.
- Inspector source: `eccd1d1771ced800d3eb38d40da0e2c351dbdb2c1ebbdee8706045151891ee1f`.
- Run: `knowledge-quality-knowledge-taipei-101-1792929336384`.
- Run source digest before/after: `faf3cf432575f44b1c4ed6e11e1ee066adb745055a5ea973b72cd439fb41988e`.
- Actual provider: local Codex, `gpt-6-astra`, `medium`.
- No video; production ceiling 10,000; work allowance 540 seconds and reporting
  allowance 60 seconds inside a hard 600-second outer guard. The work turn ended
  naturally, so forced cutoff was not exercised.

## What changed and what remains protected

App `local-knowledge.ts` projects document `source` and `replacedSource` to ID and
revision only when their provenance exactly equals one unambiguous same-reply
source. The complete `sources` catalog remains. Missing, ambiguous or different
metadata stays explicit. Runtime immutable results and retained advice are intact.
The read contract revision is 4; its published executable example resolves source
identities from the same reply after complete page assembly. No new tool, persistent
cache, prerequisite, compatibility route, larger limit or mutation replay was added.

The permanent saved-input case first failed on repeated document provenance. Local
verification includes actual invocation, paging, the delivered resolution/recovery
examples, override semantics, unchanged source results, reuse/rehydrate, cancellation,
invalid/foreign/stale references, permission and disposal protections. Projection
and published resolution work scale linearly with metadata; bodies are forwarded.

| Deterministic gate | Result |
| --- | --- |
| Eight direct-consumer suites | 391 passed, then the installed native registration probe separately passed without inference; 392 covered |
| Final source-delivery suite | 29 passed |
| Runtime Knowledge | 47 passed |
| Inspector | 79 passed |
| Naming | 15 passed |
| Architecture and update guidance | 32 passed |
| Evaluation preflight | 18 passed |
| Production types, App/backend/collaboration builds | Passed |
| Scoped lint | Zero errors; one unchanged proof-file console warning |

| Fixed saved-input total, including requests, page envelopes and new guide | Before | After | Calls |
| --- | ---: | ---: | --- |
| Two selected reads | 25,499 B | 24,923 B | 2 -> 2 |
| One combined read across two pages | 34,419 B | 33,473 B | 2 -> 2 |

The 365-byte resolution guide is charged once in both totals. A tiny isolated read
can cost more after guidance. The fixed DoD concerns the recorded compositions,
not a universal claim about every possible read or latency.

## Live source-delivery observation

| Observation | Evidence and limit |
| --- | --- |
| First selection | Root, material method and repetition; 9 documents and 9 complete sources, delivered in two pages |
| Body size | 32,305 B with repeated provenance -> 31,030 B with identities; exact reconstructed metadata difference 1,275 B |
| Later selection | Material review; 5 sources, with 4 prior bodies explicitly retained via reuseFrom/retainedFrom |
| Later body size | 13,602 B with repeated provenance -> 12,938 B; difference 664 B |
| Total logical content | 1,939 B removed; 1,574 B after charging the 365-byte guide, excluding page-envelope differences |
| Actual read payload traffic | 46,276 B including three recorded read inputs/outputs; one initial composition continuation and one later topic read |
| Contract | Advertised read description contains the exact same-reply resolution guide |
| Errors/retries | No Knowledge read failure, source-resolution error, refresh or extra provenance lookup observed |
| Recovery | No live Knowledge failure occurred; its failure recovery remains a local-test conclusion |
| AI understanding | No explicit provenance-resolution/citation action establishes internal source understanding. Successful delivery is not evidence of a particular internal interpretation. |

The counterfactual byte counts above reconstruct metadata from the same saved
results. They are not another model run. Source identities, revisions, provenance,
text order, required dependencies and retained-body links remain present. No
improvement in drawing time is attributed to the metadata projection.

## Timeline

Times below are seconds from Send, including the provider's 0.289-second start
offset. First frame is the browser observer/screenshot time, not tool completion.

| Interval/event | Duration | Observation |
| --- | ---: | --- |
| 0.000-12.272 | 12.272 s | Startup to first Knowledge discovery |
| 12.272-26.062 | 13.790 s | Discovery and two-page selected Knowledge read |
| 26.062-74.755 | 48.693 s | Drawing/review contracts, references and material-review topic |
| 74.755-128.530 | 53.774 s | Last pre-drawing contract to first submission; no App tool executing; not attributed solely to model thinking |
| 128.530-131.336 | 2.807 s | First creation: 5,029 elements |
| **131.483** | **2 min 11.483 s from Send** | **First visible frame: podium and two tower sections; screenshot inspected** |
| 131.483-201.174 | 69.691 s | Representative review, material correction and recapture |
| 201.174-357.246 | 156.072 s | Further tower/details, a rejected nonplanar face and retained-draft repair |
| 357.246-486.946 | 129.700 s | Further visual checks, facts and check-status read |
| 486.946-498.301 | 11.355 s | Work turn finishes naturally |
| 498.301-518.776 | 20.475 s | Same-thread tool-free report |
| 519.221 | - | UI partial outcome and report capture complete |
| 519.221-527.065 | 7.844 s | Final view, durable checkpoint, reload, source verification and browser cleanup |

There were 35 completed App tool invocations with approximately 9.641 seconds of
aggregate tool duration. This is not total host work or a model-only latency measure;
other time includes native execution/program composition, model/network waits and
UI/publication boundaries. No tools ran in the report phase. The first frame was
6.253 seconds later than the previous full run's 125.230 seconds; the runs are not
controlled experiments, and the source-delivery correction does not establish a
first-frame speedup.

## Failures, recovery and visual outcome

| Item | Confirmed evidence | Limit/conclusion |
| --- | --- | --- |
| Review supersession | At 184.169 s, the two captures used different reason strings for the same criterion/unit/revision. Rejected with empty execution batches, but settlement unknown. At 191.594 s the same reason was used for both and capture succeeded. | Conflict protection stayed active; unknown classification remains an independent handoff issue. Recovery did not redraw. No unrelated fix made. |
| Nonplanar face | At 339.438 s, preparation rejected a nonplanar face as not-started and returned retained draft 7a89efba-ff0b-4028-bf45-8e66c70c712f. At 357.110 s the AI submitted repair replacements against that draft; it completed with 57 elements. | Correct rejection and retained-source repair observed; no full geometry resend or replay of prior successful drafts. |
| Image forwarding | The AI self-report mentions a forwarding parameter error. Ten submitted images are fully retained and verified. | The extracted App tool failures do not establish the native forwarding error's exact input/exception; retain this as self-report, not a confirmed root cause. |
| Final acceptance | accepted=false. Required visual coverage: 1 passed of 6; overall, ornament and crown failed; material stale; base unverified. Final full check counts: 20 pass, 3 fail, 1 unverified, 2 stale. | Tool completion was not promoted to visual acceptance. Counts refer to different scopes. |
| Self-report | It says the durable receipt was unavailable to the AI. | The post-run collector subsequently confirmed sequence=durableSequence=418. Do not rewrite the AI's historical knowledge from later evidence. |

First/final/reload screenshots were inspected. They establish visible content and
successful overview restoration, not precise geometry/material acceptance. The
renderer remained editable; no broad visual-quality success claim is made.

## Evidence and preservation

The run directory is `tmp/knowledge-evaluation/knowledge-quality-knowledge-taipei-101-1792929336384/`.
`run.json`, `source-snapshot.json.gz`, `checkpoint.json`, `first.png`, `final.png`,
`reload.png`, `self-report.txt`, `self-report.png`, `generation-analysis.json` and
`knowledge-source-metrics.json` are retained. `preserved-provider/` contains 288
hash-verified records/payloads/assets (46,078,979 bytes), including 10 image payloads.
Both drawing and conversation-publication records are complete, with no unfinished
App call. Existing diagnostic redactions and unobservable native internals remain
limits; no missing observation was synthesized as success.

Reload verified root order and durable receipt 418/418, not every saved property.
Source verification matched the pre-run digest. Owned services were stopped after
collection; environment files and user services were preserved. The 600-second
outer guard was armed; no expiry path was exercised because settlement was early.

## Complete App tool timeline

| # | Start s | End s | Duration ms | Tool | Owner result |
| ---: | ---: | ---: | ---: | --- | --- |
| 1 | 12.272 | 12.280 | 7.449 | discover_knowledge | success |
| 2 | 23.419 | 23.423 | 4.114 | read_knowledge | success |
| 3 | 26.060 | 26.062 | 2.275 | read_knowledge | success |
| 4 | 29.694 | 29.744 | 50.283 | describe_design_apis | success |
| 5 | 32.416 | 32.417 | 0.910 | describe_design_apis | success |
| 6 | 35.705 | 35.707 | 1.571 | describe_design_apis | success |
| 7 | 38.771 | 38.773 | 1.540 | describe_design_apis | success |
| 8 | 43.535 | 43.554 | 19.185 | validate_reference_images | success |
| 9 | 71.399 | 71.401 | 1.577 | read_knowledge | success |
| 10 | 74.751 | 74.755 | 4.838 | describe_design_apis | success |
| 11 | 128.530 | 131.336 | 2806.557 | prepare_and_apply_design | success |
| 12 | 136.970 | 137.073 | 103.109 | review_drawing | success |
| 13 | 150.788 | 150.802 | 14.254 | review_drawing | success |
| 14 | 155.033 | 155.038 | 5.416 | describe_design_apis | success |
| 15 | 158.085 | 158.088 | 3.475 | describe_design_apis | success |
| 16 | 173.944 | 174.086 | 141.624 | prepare_material_revision | success |
| 17 | 174.088 | 174.172 | 83.327 | prepare_material_revision | success |
| 18 | 179.277 | 179.328 | 51.115 | apply_prepared_material | success |
| 19 | 179.329 | 179.355 | 25.539 | apply_prepared_material | success |
| 20 | 184.169 | 184.172 | 2.988 | review_drawing | failed |
| 21 | 191.594 | 191.663 | 69.142 | review_drawing | success |
| 22 | 201.162 | 201.174 | 12.136 | review_drawing | success |
| 23 | 211.629 | 216.733 | 5104.386 | prepare_and_apply_design | success |
| 24 | 272.758 | 272.761 | 3.038 | select_design_references | success |
| 25 | 313.638 | 314.239 | 601.627 | prepare_and_apply_design | success |
| 26 | 339.438 | 339.458 | 20.262 | prepare_and_apply_design | failed |
| 27 | 348.843 | 348.849 | 5.507 | describe_design_apis | success |
| 28 | 357.110 | 357.246 | 136.637 | prepare_and_apply_design | success |
| 29 | 364.986 | 365.109 | 122.836 | review_drawing | success |
| 30 | 404.349 | 404.359 | 9.627 | review_drawing | success |
| 31 | 434.327 | 434.470 | 142.586 | review_drawing | success |
| 32 | 455.221 | 455.231 | 9.811 | review_drawing | success |
| 33 | 470.659 | 470.661 | 2.359 | describe_design_apis | success |
| 34 | 482.483 | 482.484 | 1.588 | record_design_facts | success |
| 35 | 486.878 | 486.946 | 68.287 | read_design_checks | success |
