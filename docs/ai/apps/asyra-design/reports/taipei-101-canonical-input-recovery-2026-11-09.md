# Taipei 101 - Canonical Input Recovery - November 9, 2026

The four-owner correction is implemented and focused tests pass. The recorded
rename failure now returns an actionable input rejection through the actual
Core, transaction, Runtime, host and native provider boundary. A corrected suffix
can continue in the same drawing turn without replaying the successful grouping.

The subsequent live run also continued after a correctable geometric input
rejection. Drawing ended at the requested fifteen-minute deadline. It did not
finish all visual refinements. The original AI completed an unlimited retrospective
in the same native thread, and that session remains open.

## Evidence and test identity

All run paths below are relative to the repository root. Evidence directory:
`tmp/conversation-improvements/live/taipei-101-fixed-1794235733611/`.

| Item | Value |
| --- | --- |
| Source HEAD, with scoped working changes | `71ff3fa09786160fe2c0902c04f98e40c3858441` |
| Drawing prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Drawing allowance | 900,000 ms |
| Recorded work elapsed | 899,644 ms |
| Stop owner and reason | Host evaluation deadline - `work-deadline` |
| Report elapsed | 450,469 ms, without a report timeout |
| Native thread | `01a1c0c8-b64b-7273-b699-b171e8c1c379` |
| Drawing turn | `01a1c0c8-b6a5-7971-b292-fd7ca5dd5b17` |
| Report turn | `01a1c0d6-68bc-71b0-a6c8-89d8004fd8c5` |
| Retained report session | `426e3e9e-0e21-47a9-9b66-6a6878679a27` - waiting |
| Provider request | `e77c763d-24ca-443d-a95f-fc4d90a82bc8` |
| Drawing and reporting document equality | Unchanged during reporting |
| Durable document sequence | 1015 of 1015 |
| Reload verification | Document unchanged |
| Collection errors | None |

The runner had one port preflight failure before any AI submission
(`taipei-101-fixed-1794235710189`). Selecting the dedicated service ports resolved
that setup issue. Only one actual drawing test was submitted; the prompt was not
modified. Services on 3051/4251/4151 remain available for the retained session.

Original evidence files:

- [Complete original AI report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794235733611/self-report.txt)
- [Report/thread evidence](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794235733611/self-report-evidence.json)
- [Run and persistence evidence](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794235733611/run.json)
- [Retained session](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794235733611/report-session.json)
- [Final overview](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794235733611/final.png)
- [Native-scale detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794235733611/native-detail.png)
- [Recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794235733611/recording.webm)

These are local retained artifacts, not a claim that ignored large run assets
are committed to Git. The recorder fitted the viewport during construction;
the recording is preserved without editing. All 25 frozen source/test/document
hashes matched after report completion, before this closeout was written.

## What changed and who owns it

| Owner | Accepted responsibility | Explicit boundary |
| --- | --- | --- |
| SceneTree | Resolve registered property targets; emit typed `ElementPropertyInputError` for unsupported authored keys before application | Does not infer rename intent, select another API or define AI recovery policy |
| Core facade and App action adapter | Expose the canonical error; translate only that recognized rejection into `AiActionInputError` | Does not maintain a duplicate property whitelist or turn generic faults into bad input |
| Runtime | Preserve `AI_ACTION_INPUT_INVALID` and detached `inputIssue`; report transaction settlement separately | A diagnostic does not prove rollback or safe retry |
| App host recovery | Return `correct_input` for this typed rejection only with fresh context and known no-write settlement; preserve successful-prefix results | Does not replay work, repair parameters or continue successors automatically |
| Provider evaluation | Keep correctable inputs in the drawing turn; for terminal failures close new write admission, deliver active host results, then interrupt | Deadline and cancellation can still interrupt immediately; genuine failures remain terminal |

The property action's current declaration explains the distinction between
registered properties and element metadata. `name`, `visible` and `lock` belong
to `core.updateElementData`. The action revision is updated. No compatibility
alias, automatic metadata rerouting, string-based exception classification or
new mandatory App prompt workflow was added.

Both host browser-error paths use the same recovery classifier. A generic
`recoverable: true`, stale context, missing typed diagnostic, committed write or
unknown settlement cannot authorize this safe-input recovery route.

## Recorded rename regression

Permanent fixture:
`apps/asyra-design/server/__tests__/fixtures/recorded-101/canonical-input-recovery-20261109.json`.
It preserves the previous run's exact failed rename, captures and result selection.

The integrated regression creates a small real Core drawing, groups it once,
submits `core.updateElementProperties` with `values.name`, and verifies that the
name is not changed. It reads the new group ID from the delivered successful
assembly receipt, submits the corrected metadata update and capture suffix, and
receives two image blocks in the same strict native turn. Grouping executes once.
Only the generated group ID binding is substituted into the recorded suffix.

The test uses a simulated provider peer and mocked pixel acquisition, with real
Core property resolution, transaction handling, Runtime, host composition and
native transport. It proves the handoff and delivery; it does not prove model
choice or visual quality. A separate regression proves terminal tool result
delivery precedes interruption. Both regressions were observed failing before
their implementation changes.

## Live sequence and actual recovery

Counts below use outer provider calls, not private host exchanges. Response text
bytes are telemetry values, not tokens or total wire bytes; image bytes are excluded.

| Call | Work and handoff | Text bytes | Images | Outcome |
| --- | --- | ---: | ---: | --- |
| E1 | Base, lower tiers, upper tiers and overview in one sequence | 2,817 | 1 | Success; image exposed a parent-coordinate placement mistake |
| E2 | Known-ID coordinates plus root children | 6,314 | 0 | Success; needed lower-tier group identification |
| E3 | Filter the existing snapshot for the lower group | 843 | 0 | Success |
| E4 | Set both tier positions and capture | 919 | 1 | Success |
| E5 | Crown, ornaments and overview | 3,086 | 0 | Crown preparation rejected; later steps did not run |
| E6 | Repair retained crown input, build ornaments and capture | 1,815 | 1 | Success in the original drawing turn |
| E7 | Delete old bands, map glass fills, add details and capture | 2,842 | 2 | Success |
| E8 | Group, read bounds, capture overview and detail | 1,454 | 2 | Success |
| E9 | Redisplay an existing overview | 944 | 1 | Success; no new drawing or capture |
| Total | Nine outer calls | 21,034 | 8 | Eight successes, one corrected rejection |

The unique live rejected input was `needle.vertices`, not the previous name
update. `NONPLANAR_FACE` identified `/children/32/vertices`: maximum deviation
11.266934979621716 exceeded tolerance 0.000019011133580089323. The result reported
`correct_input`, `not-started` and retained draft
`83b5490b-55b4-4aaf-83f9-17f9aae8139d`. E6 replaced that vertices array with a
coplanar array and completed the remaining crown/ornament sequence. The base and
tiers were not rebuilt. Provider payloads 306, 310-313 and 323 establish the
rejected input, failure handoff and corrected submission; its successful outer
completion occurred at about 538.7 seconds.

Thus the live observation proves an actual correctable rejection did not trigger
strict termination. It does not independently exercise the newly typed canonical
name rejection; that evidence remains the formal recorded-parameter regression.

At about 865.6 seconds, the AI publicly planned another ornament refinement, but
submitted no following operation before the deadline. Payload 694 records the
deadline stop; payload 695 starts reporting in the same native thread. The drawing
was interrupted by the requested deadline, not by the earlier input error or an
AI declaration that the complete artwork was finished.

## Original AI assessment, checked against observable evidence

| Observation | Evidence and interpretation | Status |
| --- | --- | --- |
| Parent-local placement was misunderstood | E1 submits a shared projection under an existing parent; E2-E4 diagnose and repair positions. The AI explicitly attributes the mistake to its coordinate-space use | Real authoring error; no demonstrated projection-engine fault |
| Crown needle was nonplanar | Typed geometry rejection, retained draft and successful partial repair are recorded | Correctable input, recovered as intended |
| Fixed-width crown bands protruded | AI used a shrinking tower with constant-width repeated bands, then deleted 14 bands and used boundary-following geometry | Visual authoring correction; not a reason to stop the run |
| Glass reflection needed revision | E7 maps 6,144 fills after visual review | A design decision, not evidence that tool I/O failed |
| Ornament remained too simplified | Original AI report and inspected native-scale image show the simplified rounded motif | Known unfinished visual work at the deadline |
| Named storage was useful | Ten acknowledged names; seven distinct names appear in submitted named references | Actual adoption, not inferred from capability availability |
| Full overview needed redisplay | E8 delivered two image blocks; E9 reads an existing inspection. AI says the first overview was not clear enough to assess | Do not label capture/delivery failure without inspecting the original image presentation |
| Durable save was unconfirmed to the AI | The AI correctly lacked final persistence evidence while reporting; subsequent runner closure confirms sequence 1015 and unchanged reload | Later independent evidence resolves storage, not artistic acceptance |

The seven referenced names are `taipeiBase`, `taipeiRoot`, `taipeiLower`,
`taipeiUpper`, `taipeiCrown`, `taipeiOrnament` and `taipeiDetails`. The remaining
three successful saves are precautionary authoring data, not failures. E1 directly
reuses projection/templates and lower-tier members; E8 directly binds the group
result into subsequent reads/captures. No clear extra call exists solely to copy
an already produced value into a decided operation. This is supported by the
submitted calls, rather than treating every read as unnecessary forwarding.

Seventeen contract queries returned 166,280 text bytes (about 166.3 decimal KB).
The AI counts eleven exact acquisitions, four purpose searches and two category
pages. Position discovery used three purpose queries, an unsuitable composition
update contract, two category pages and finally the position API contract. This
is an observable discovery cost deserving a separate bounded investigation;
the present recovery fix does not solve or conceal it.

The original AI attributes action-free intervals at a high level to authoring
geometry, inspecting images, acquiring contracts and preparing repairs. It does
not have telemetry that separates inference, queueing and network latency.
Observed outer tool durations range from about 43 ms to 21.7 seconds; those are
not explanations of all gaps between submissions. This report does not assign
unmeasured delay to either the App or the provider, and does not compare different
drawings' completion times as a quality metric.

The AI recommends investigating coordinate-space usability, position search,
automatic versus requested capture, and multiple-image presentation. These are
self-assessment suggestions, not approved implementations. Its requests for more
guidance or compatibility are not adopted here. Existing reference/template,
repair and reuse capabilities must be checked before proposing new mechanisms.

## Validation and limitations

| Focused gate | Result |
| --- | --- |
| SceneTree property target resolution | 12 passed |
| Runtime multi-batch and settlement | 26 passed |
| App basic API actions and transaction | 51 passed |
| Local invocation, evaluation control and batch exchange | 99 passed |
| Selected native provider recovery/stop/report cases | 28 passed |
| Selected execution-flow proofs | 3 passed |
| Inspector contract | 2 passed |
| Naming | 15 passed |
| SceneTree and Core builds | Passed |
| Runtime production-entry strict types | Passed |
| App server types | Passed |
| Scoped ESLint | No errors; three existing console warnings |
| Scoped diff whitespace | Passed |

The broad Runtime build also includes an unrelated existing typing failure in
`src/__tests__/recipe-admission.test.ts:1736`: a literal-input fixture conflicts
with the inferred proposal input type. That unrelated test was not modified.
Do not interpret focused production type success as a clean full-package build.
No full local suite, CI, release gate, commit or push was run.

Current canvas counts are 31,813 vectors, 223 ovals and seven groups, excluding
the workspace. The original AI's 32,056 applied-element total describes cumulative
applications, not final object count after deletion/grouping. Overview and
native-scale screenshots were inspected; they do not establish full architectural
accuracy. The final ornament refinement remains unsubmitted.

The report finished without timeout, reporting did not alter the document, and
the retained session status was independently checked as waiting after the runner
returned. Evidence collection and implementation are complete for this bounded
task; the remaining visual and discovery observations are not silently converted
into additional implementation scope.
