# Taipei 101 - Purpose and Parameter Discovery - November 10, 2026

The bounded discovery and coordinate-handoff changes are implemented and pass their
focused regressions. One unchanged-prompt live run completed naturally with no
rejected input or failed tool. This is execution evidence, not a claim that all
search intents or visual requirements are solved. The live agent did not request
position changes, use inputFields, or exercise the new coordinate handoff.

## Implementation and reviewed boundaries

| Owner | Change | Evidence and limits |
|---|---|---|
| Capability metadata | Declaring operations expose purpose, vocabulary and applicability independently of names and incidental guidance. Candidate menus expose those boundaries. | Four recorded position queries now rank the general position setter first; explicit vector intent ranks the vector setter. Opaque a/b/c identities remain discoverable by purpose. This is metadata-based retrieval, not an unrestricted semantic model. |
| Parameter discovery | Optional inputFields matches declared input leaf names or paths, including reachable local references. | Unused definitions, forbidden fields, output-only fields and arbitrary open-record keys cannot establish support. Matching fields does not prove that arbitrary values or combinations are valid. |
| Identity and delivery | Unique registered Basic API method names resolve through the exact identity path; ambiguity still requires qualification. Metadata remains on discovery descriptors and is removed from execution admission schemas. | The actual native provider declaration and replies are covered, not only the raw schema. The live advertised inventory contains inputFields. The superseded query-selected summary helper was removed. |
| Coordinate owner | workspaceToElementLocal declares a point-or-null result. | Recorded coordinates produce x=327.2911929504098 and y=-26132.9503589912. No zero substitution or workspace/local confusion. |
| Runtime handoff | Request sequences can select declared fields from a nullable result, validating actual presence before a successor. | Real conversion followed by the existing typed position setter completes in one host call. Actual null prevents the write. Other union branches must still declare the field; saved recipes retain guaranteed-path admission. |

The plan, App API/spec, Runtime documentation, Inspector conditions and direct
regressions were updated together. No compatibility scorer, duplicate execution
entry, mandatory planning step or new App prompt requirement was introduced.
The conversion proof uses the typed position setter; it does not claim that an
arbitrary open property map supports individual undeclared field bindings.

## Validation

| Gate | Result |
|---|---|
| App owner regressions: capability metadata, recorded purpose/field discovery, existing operation discovery, Basic API contracts and real coordinate handoff | 197 tests passed across five files |
| Runtime recipe admission | 88 tests passed, including the demonstrated nullable-field regression and strict non-null/saved-recipe boundaries |
| Actual native provider declaration/replies | One focused test passed, including all four recorded searches and the nullable coordinate contract |
| Existing source-based selected-operation flow proof | One focused test passed |
| Naming | 15 checks passed |
| Types/build | App AI-server and App typecheck passed; Runtime build passed |
| Scoped lint and diff review | No lint errors; one pre-existing console warning in local-ai-provider.test.ts. Diff whitespace check passed. |

Only focused tests ran; no full local suite, CI or release gates were invoked.
The original recorded searches and nullable projection first failed on the old
behavior. Test harness corrections used the real one-request lifecycle and its
existing retained-receipt bridge, rather than adding product fallbacks.

## Live setup and integrity

- Run: taipei-101-fixed-1794244803070.
- Source baseline: 036f7f5dc457c6654dfc1eb43b4c3a49d6a65a82 plus the reviewed working changes.
- Drawing prompt SHA-256: 25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51.
- Fresh conversation without attachments; the immutable fixture was submitted unchanged.
- Drawing allowance: 1,800,000 ms. Original-thread reports and follow-up had no time limit.
- Natural drawing completion: 549,051 ms (9 minutes 9 seconds), not a deadline interruption.
- Original report: 366,222 ms (6 minutes 6 seconds). Total App request time includes reporting.
- Native thread: 01a1c153-1988-72e0-b853-223f53e151a0.
- Work turn: 01a1c153-19e7-7de0-b406-7b38ca015be9.
- Report turn: 01a1c15b-7358-7160-81e4-9e085d8f1f20.
- Follow-up turn: 01a1c163-2bc5-77e2-a9c9-7520f0dc1b00.
- Retained session: 11fd4562-19db-4ce7-b9eb-1c1c9e3a1b09; waiting after the follow-up.
- All 24 frozen source/document hashes matched after reporting. No manual edits occurred during drawing, reporting or the follow-up.
- Tool and evidence errors: none. Correctable-input continuation remained enabled but was not exercised.
- Document sequence and durable sequence both 812; reload preserved the document.
- Final tree: one workspace, five groups, 25,512 vectors and 27 ovals.

The collector reports App settlement outcome partial because the retrospective
ends with unsupported for complete visual acceptance. This is distinct from the
work turn's completed status and the successful tool receipts. It is not evidence
of a failed tool or an interrupted drawing. The AI explicitly limits what its
self-report certifies.

## Discovery delivered to the provider

These are actual tool response text bytes, excluding images and initial provider
declarations. The thread/start request separately measured 275,628 protocol bytes;
that envelope is not the same metric as the selected contract responses below.

| Call | Selection | Response text bytes | Result and next action |
|---|---|---:|---|
| D1 | prepare_and_apply_design, scoped draft usage for projected-face/surface-grid/pattern | 20,834 | Executable scoped contract; used for all four construction drafts |
| D2 | inspect_drawing usage | 6,713 | Executable capture contract |
| D3 | Exact query map_retained_fills | 9,890 | Executable fill mapping; later used |
| D4 | read_design_context usage | 11,342 | Executable data access, including ancestorId |
| D5 | apply continuous gradient material across existing projected faces | 14,661 | Partial candidate menu; no new exact contract acquired |
| D6 | group elements | 14,096 | hierarchy.groupElements ranked first; agent selected it |
| D7 | hierarchy.groupElements usage | 5,343 | Executable grouping contract |
| D8 | hierarchy.moveElements usage | 5,624 | Executable indexed move; explicitly pointed to moveElementsRelative without a sibling read |
| Total | Eight calls, all successful | 88,503 | Six exact/scoped acquisitions and two purpose searches |

D5's leading candidates were apply_prepared_material, prepare_and_apply_design,
apply_prepared_design, prepare_material_revision and prepare_design. They were
not all irrelevant. The follow-up explains a distinct intent: recompiling a
continuous world material on existing faces, instead of mapping parent-local
positions to solid colors. The material revision candidate required an existing
world field/owned source, whereas the drawing started with fillTemplates.
General prepare/apply candidates did not establish that existing independent
fills could be upgraded without reconstruction. The agent did not acquire those
contracts or test that alternative. D5 supplied limited alternative information,
but was not a necessary dependency of the chosen fill operation.

No known parameter name expressed that lifecycle uncertainty. Not supplying
inputFields here was not an error. For known x/y changes, the deterministic and
native-provider regressions demonstrate the new filter. This live run cannot
establish that the agent would use it in a future position task.

## Host execution and data handoff

Recorded input bytes below are unredacted serialized owner arguments, not a
provider token count. Output bytes are actual text responses.

| Call | Authored sequence | Input bytes | Output text bytes | Images | Handoff reason |
|---|---|---:|---:|---:|---|
| E1 | Base construction | 10,392 | 1,300 | 0 | Continue authoring the tower/crown; source and IDs saved |
| E2 | Tower tiers, crown, overview | 16,642 | 3,356 | 1 | Visual material/detail judgment |
| E3 | Tower bounds and glass sample | 622 | 1,994 | 0 | Data for material and capture decisions |
| E4 | Other group bounds and local capture | 701 | 1,364 | 1 | Inspect the glass before choosing changes |
| E5 | Fill mapping, added profiles, overview | 8,479 | 1,995 | 1 | Visual judgment after the decided edits |
| E6 | Group, overview, detail | 1,225 | 1,209 | 2 | Detail revealed louver/ornament overlap |
| E7 | Read final group's current child count | 221 | 685 | 0 | Prepare indexed placement; avoidable with the existing relative route |
| E8 | Six ordered moves, corrected detail | 2,673 | 1,853 | 1 | Confirm the local occlusion fix |
| Total | Eight calls; 22 authored host steps | 40,955 | 13,756 | 6 | All successful |

Nine names were retained. Six distinct names were consumed through 25 named
references: base source, base/tier/crown/detail IDs and final group. The base
projection/material/motif templates were used directly in later drafts. Grouping
output fed both captures in E6 through step bindings, and both images were selected
for delivery. No dedicated read retrieved a saved value solely for forwarding.
Three precautionary saved drafts remained unused; this is valid, not a defect.

E3 and E4 include new data/visual decisions, not just copied data. The independent
base/crown bounds could have accompanied E3, but the chosen detail region still
required a judgment. E7 is a fresh canonical read with low information gain; it
is not an extra read of the named context store.

## Review of AI recommendations against implementation

| Observation or recommendation | Cross-check | Classification |
|---|---|---|
| Add cross-parent relative placement | basic-design-api-contracts.ts already declares moveElementsRelative; hierarchy.ts resolves anchor parent/index and delegates to geometry-preserving move. D8 delivered the alternative explicitly. | Existing ability not selected. The AI withdrew its proposed new tool. |
| Read child count before moving ornaments | Needed by the chosen indexed path, but the saved detail-group ID was an available anchor. Six relative moves require correct batch order. | Avoidable data handoff. If another usage lookup is needed, total public call count may stay unchanged. No timing saving is proven. |
| Glass samples came from the base | D4 provided ancestorId; E3 used a broad region and shared name suffix without the saved tower ancestor. | Agent query choice; tool followed the supplied filter. |
| Reuse every repeated facade boundary unchanged | Four later boundaries shift a coordinate by 5 or 6; four define new louver/guard regions. The source arrays are not identical. | Original report overgeneralized. Base-boundary binding plus existing motif offset is an untested alternative for four cases, not all eight. |
| Repeated per-window reflection needed correction | Initial scope already exposed linearFields; agent chose per-window fillTemplates, then mapped solid colors. | Design/material choice, not a failed mapping tool. |
| Louver covered an ornament | Added profiles had later painter order; local inspection identified and existing moves corrected it. | Permitted visual refinement, not a reason to abort. |
| A final overview was missing | Last post-correction drawing capture was detail only. The recorder later captured a full view. | Agent verification limitation; the independent screenshot is not retroactive evidence that the agent saw it. |
| Durable storage unknown | Agent had no visible durable receipt during drawing. Recorder later verified sequence 812 and unchanged reload. | Independent evidence resolves storage status; it does not certify visual accuracy. |
| Every purpose query should use inputFields | D5's uncertainty concerned material lifecycle, not known input field names. | Not justified; do not force unknown field filters. |

The follow-up contains the AI's correction in full. No new move tool, mandatory
ancestor rule, forced Knowledge read or mandatory review phase was added in
response to that report.

## Waiting and what the evidence can establish

The two substantial no-tool intervals were between E1 completion and E2 submission
(about 155 seconds) and D5 completion and E5 submission (about 91 seconds).
The next submissions contained 16,642 and 8,479 bytes of authored input respectively,
including repeat/grid descriptions rather than every expanded element. The AI
identifies preparation of tier/crown geometry, material parameters and detail
layouts as the corresponding high-level work. It also identifies image judgment
and contract reading between other submissions.

The eight discovery calls total about 0.79 seconds of measured host duration;
the eight execution calls total about 24.71 seconds. These host measurements do
not explain all intervals and must not be relabeled as complete model, network,
research or rendering telemetry. The record does not establish how much of an
unsubmitted interval is internal model processing versus generation/transport.
Do not compare individual drawing phases against another run with different
geometry/detail choices to infer improvement.

The most concrete avoidable handoff in this run is E7 when an already-known anchor
can express the intended order. D5 is optional exploration with limited realized
benefit. Known corrections were already combined with capture in E5/E8; data
storage/binding avoided pure forwarding calls. Further improvements should target
proven capability selection and actual missing handoffs rather than another
blanket prompt instruction.

## Visual evidence and retained session

Base URL: <a href="http://127.0.0.1:3053" target="_blank" rel="noopener noreferrer">local App</a> (run URL in run.json).
Visual scope: the existing Taipei 101 live recorder, final/reload parity and
native-detail inspection, not a general rendering-suite closure.
Command (from the App directory):

```sh
APP_URL=http://127.0.0.1:3053 DOCUMENT_BACKEND_PORT=4253 \
DOCUMENT_PERSISTENCE_BACKEND_URL=http://127.0.0.1:4253 COLLABORATION_WS_PORT=4153 \
VITE_COLLABORATION_WS_URL=ws://127.0.0.1:4153/collaboration \
TAIPEI_101_STRICT_STOP=1 node test-data/ai-drawing/taipei-101-live.mjs --minutes=30
```

The 1920x1080 recording automatically fit content at approximately 136.5, 298.3
and 299.4 seconds as bounds changed. Final overview and 100-percent detail were
inspected. The whole building is visible from base to spire; detail shows editable
window/frame geometry. Selection outlines and the App panel remain visible.
The result is a regular vector illustration; no claim of measured architectural
accuracy or photorealism follows. The original AI acknowledges estimated dimensions,
ornament simplification and the lack of its own post-fix overview.

The original native session remains waiting after the follow-up; its services are
retained at the recorded PIDs. No new drawing was performed during the follow-up.
Large local assets are retained evidence, not claimed to be committed to Git.

## Complete artifacts

- [Original AI report, unedited](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794244803070/self-report.txt)
- [Original AI follow-up, unedited](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794244803070/followup-01a1c163-2bc5-77e2-a9c9-7520f0dc1b00.txt)
- [Follow-up question](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794244803070/search-followup.txt)
- [Run and persistence evidence](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794244803070/run.json)
- [Same-thread report evidence](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794244803070/self-report-evidence.json)
- [Retained session](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794244803070/report-session.json)
- [Final overview](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794244803070/final.png)
- [Native detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794244803070/native-detail.png)
- [Recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1794244803070/recording.webm)
