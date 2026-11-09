# Reference receipt and discovery - implementation and observation

## Outcome

The approved receipt/discovery corrections and focused regressions are complete.
The original drawing prompt was unchanged. One bootstrap failed before provider
creation; after correcting the report fixture, one actual drawing session finished
in 669,592 ms (11m 09.592s), within the 15-minute ceiling. Its original native
thread then completed a 440,215 ms (7m 20.215s) report without a report timeout.
The session remains waiting for questions. No agent file edits occurred during
that drawing/report interval. Documentation below was written after settlement.

The live run does **not** prove adoption of reference receipt chaining: the model
used web images but never imported or selected them in the App. That capability
is proven by the real-parameter regression, not by this model run. Total live
contract delivery also did not fall: 13 calls delivered 154,026 text bytes.

## Changes and regression evidence

| Boundary | Correction | Evidence and limits |
| --- | --- | --- |
| Reference producer | Publish typed decision/use snapshots with canonical receipt and pixel schemas | Four saved-result selections previously admitted request data; they now reject before owner dispatch |
| Correction output | Use the same snapshot schema in review correction | Self-review found this second outlet; its nonportable-output regression failed before correction |
| Host/discovery | Preserve owner result navigation and derive structures/lifetime from canonical schemas | Actual discovery exposes `/referenceDecisions`; request receipts/indexes cannot be retained |
| Portable context | Store authored decisions through `source:"input"`; revalidate on future requests | Selected/status delivery both preserve authored inputs; output receipts are not made durable |
| Same-request composition | Bind newly produced receipts plus newly created root ID into capture | Actual prior-run criteria, decisions, base draft and whole-view check execute in one host call; no receipt removal or old request receipt replay |
| Search ranking | Weighted metadata relevance precedes all-term completeness | Opaque `a` purpose beats `b` incidental output vocabulary; missing terms stay visible |
| Automatic acquisition | A sole complete match must also rank first | Red test previously selected incidental `b` despite stronger `a`; now returns a choice menu |
| Candidate delivery | Defer full representation prose until exact navigation | Candidate retains operation/type/optional-input choices and usable qualified route |
| Selected contracts | Preserve actual requested scope; verify narrow alternative | Broad recorded scope: 32,615 bytes / 2 responses. Narrow scope: 20,997 / 1; actual base arguments remain legal, with identical results/retention/recovery |
| Incorrect tests | Retention no longer endorses request snapshots; candidate test follows exact route; representation fixture explicitly selects its optional fields | Reference-free crown capture remains a separate test and is not cited as reference-backed proof |

Canonical schema factoring and selected input scopes already existed; the review
did not justify another blanket schema reduction. Unused requested vector or plan
fields must not be silently omitted. No App prompt, drawing prompt, renderer,
third-party dependency, release workflow or mandatory Knowledge flow was added.

Focused gates: 114 reference/discovery cases passed; five final discovery cases
(including the additional automatic-selection regression), two real construction/
capture cases, and two source execution-flow cases passed. Existing reference
owner cases cover stale/foreign/revised uses. The recorder's 12 cases, report
parser's 27 cases, 15 naming checks, scoped ESLint, server TypeScript and required
collaboration-service build passed. No full-local or release tests ran.

## Observation identities and evidence

| Item | Value |
| --- | --- |
| Failed bootstrap | `taipei-101-fixed-1794133924121` |
| Drawing run | `taipei-101-fixed-1794134061041` |
| Provider request | `9c56f7a8-2b7e-466f-a5e7-967a9eb9b4a9` |
| Native thread, drawing and report | `01a1bab9-4972-7623-9949-8359a8f7522b` |
| Drawing turn | `01a1bab9-49cc-7ea1-ab49-441f58d84428` |
| Report turn | `01a1bac3-7b2a-7981-9616-864542945c39` |
| Retained session | `008b212b-60e1-4871-b434-c7e9fabc8043`, waiting |
| Fixed prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Drawing stop | Native completion; not deadline or strict-policy interruption |
| Report document mutation | None; collector comparison passed |
| Persistence | Sequence 483, durable sequence 483; reload unchanged |
| Final contents | 15,031 vectors, 178 ovals, 5 groups, 1 workspace |
| First paint opportunity | 141,781 ms; this is instrumentation, not a claimed first perceived pixel |
| Recorder fitting | Successful fits at 144,375 / 236,041 / 346,297 ms |
| Video | 100,460,140 bytes |
| Evidence/browser errors | None in completed run |

Artifacts are under
`tmp/conversation-improvements/live/taipei-101-fixed-1794134061041/`.
The original complete public report is `self-report.txt`; `self-report-evidence.json`
links both native turns. `run.json`, `source-snapshot.json.gz`, `checkpoint.json`,
`reload-snapshot.json.gz`, provider payloads, `final.png`, `native-detail.png` and
`recording.webm` preserve the evidence. These are observations, not rewritten AI
answers. The retained report service remains at `http://127.0.0.1:3045`.

## Failures and settlement interpretation

| Event | Actual cause | Recovery and proof |
| --- | --- | --- |
| Bootstrap, 107 ms | This task's appended report questions exceeded the production 8,000-character report-instruction limit. `getMutationDeadline` parsed it before provider creation; the App surfaced a generic transaction failure | A permanent test loading the maintained report fixture through the production parser failed first. Condensed only the added report question to a 7,915-character total. All 27 parser cases passed. No drawing prompt or production limit changed. No AI session/report existed for this failed bootstrap |
| External PDF | Model reported a web source returned 404 | Continued with other available sources; not an App tool outage |
| E9 delivery selection | `/dataEvidence` was conditional, not guaranteed; whole sequence rejected before execution | Removed invalid custom delivery and resubmitted a corrected sequence in the same drawing turn. No existing geometry replayed; later reviews succeeded |
| Final App outcome is partial | Drawing turn declared completed; retrospective final action declared unsupported because it would not recertify full realism/precision or unseen persistence | Distinguish drawing completion from retrospective judgment. This was not a timeout, failed save, lost report or tool-driven stop |

The model's lack of visible final persistence evidence is accurate about its
context, but does not establish a save failure. Independent collector evidence
confirms durable sequence and identical reload. Changing terminal report outcome
presentation is not part of this implementation.

## Contract delivery, measured at the provider boundary

Bytes are `tool_completed.evidence.responseTextBytes`: actual model-visible tool
text, including delivery envelopes, excluding image bytes and native declarations.
They differ from the AI report's payload-body `totalBytes` totals.

| Query | Subject | Bytes |
| --- | --- | ---: |
| D1 | Construction scope, first page | 23,072 |
| D2 | Construction scope, continuation | 9,652 |
| D3 | Facts/calculations/reference/review/checks, first page | 23,072 |
| D4 | Same requested bundle, continuation | 5,692 |
| D5 | Import-reference purpose search | 11,712 |
| D6 | Capture usage | 10,517 |
| D7 | Fill mapping and retained targets | 13,442 |
| D8 | Existing-face world-material purpose search | 12,260 |
| D9 | Data review usage | 9,779 |
| D10 | Group-elements purpose search | 11,124 |
| D11 | Exact group operation | 5,092 |
| D12 | Bind usage | 8,800 |
| D13 | Record usage | 9,812 |
| Total | 13 calls | 154,026 |

The original prior-run D8 query replay returned 11,288 bytes in the focused
fixture. The live model changed its query to `apply world material field existing
faces`, omitting `projected`, and ran against the complete live registry. These
are different measurements, not a controlled byte comparison. Its three purpose
queries had qualified continuation routes, no missing-name recovery, and explicit
candidate status. Import selection and material revision were not used. The model
used plan but not authored vector rings; its initial combined reference contract
was also unused. These choices explain part of the load, not all of it. Candidate
menus around 11-12 KB remain a future investigation opportunity, not a claim that
all discovery overhead is solved.

## Execution, retention and return boundaries

The provider delivered 12 outer execute calls (28,230 text bytes, 11 images),
including one admission rejection, plus one 177-byte check-summary read. The model
identifies 18 successfully executed top-level steps. Nested host/batch activity is
not counted as extra AI dispatches. The model used no Knowledge, reusable recipes,
formal stages, or automatic repair iterations.

| Sequence | Actual behavior | Assessment |
| --- | --- | --- |
| E1 | Facts, calculation, planned base construction together | Decided work combined; no separate criteria call |
| E2 / E3 | Separate tier and crown construction; no intermediate images | Inputs were written in stages. Not proven to be host incapacity; do not infer all parameters existed earlier |
| E3 to E4 | Crown then separate capture of known roots/workspace | Model explicitly identifies a preventable handoff; current step-ID binding already supports it |
| E4 | Four overview images | Real visual decision: repeated local gradients and missing decorations |
| E5 to E6 | Read root bounds; map eight fill sets and add ornaments together | Bounds informed authoring. Mapping and construction shared one handoff; no per-window ID transfer |
| E7 to E8 | Group, automatic overview, then bind and six captures | Images support visual decisions; E8 omitted delivery of the earlier bind result |
| E9 to E10 | Invalid conditional-field selection, corrected sequence | Correctable input continued; no tool-induced stop |
| E10 to E11 | Read current geometry, then record scale and rebind overview | Data judgment is legitimate; repeated overview binding was caused by earlier output selection, not expired images |
| E12 | Final visual record, then summary read | Accepted 6/6 is the model's own judgment, not independent quality certification |

Eleven names were acknowledged as saved. Two names were actually consumed:
`baseTargets` and `crownTargets`, through three key-to-ID leaves. No full target
mapping or separate shape query was returned to the model. Four drafts and four
root-ID sets were retained for possible continuation; unused retention is not
itself a defect. The shared projection was rewritten in four drafts despite an
available named-input path. There were zero standalone value-only reads. A
separate capture is not classified wholesale as a data-only forwarding call.

## Original AI assessment versus confirmed facts

The full original report contains fifteen sections and detailed tables. Its
high-level explanation for waits is preparation of base/tier/crown geometry,
reading contracts, preparing eight mappings and interpreting images/data. It
does not claim private timing or network knowledge. Measured tool durations and
outside-tool intervals must remain separate; no speed comparison across different
artwork is used as proof of improved tools.

The model identifies repeated gradients as its authoring choice: the acquired
contract described per-window restart, and it already used world fields elsewhere.
Missing ornaments and later replacement are design iteration, not App failures.
Its suggestions to add preflight validation or construction/capture chaining
partly request capabilities already implemented. Existing conditional-field
admission worked; richer multi-review result handling merits tracing before any
new change. Do not automatically implement its suggestions or add prompt rules.

The model admits its original visual/scale acceptance was too permissive. It also
explicitly records no formal reference import/selection, no `referenceUses`, no
receipt binding and no reference redisplay. This observation cannot close that
adoption question. It does prove saved key-to-ID reuse and combined decided
mapping/construction. Final, native-detail and base screenshots were inspected:
complete tower silhouette and editable window detail are visible, while materials
remain graphic rather than independently certified photorealism. The final image
contains the App panel and a selection outline; native detail is at 100%.

## Remaining bounded follow-up candidates

1. Trace real E8/E9/E11 result delivery through the selected capture/data/bind
   schemas before deciding whether conditional-result navigation needs changes.
   Whole-step selected delivery already exists; distinguish non-use from a gap.
2. Analyze candidate menus and unnecessarily broad bundles using the thirteen
   actual queries, without dropping requested fields or forcing more reading.
3. Keep formal reference-backed composition proof separate from live adoption.
   Do not force reference/Knowledge use merely to obtain a passing metric.
4. Treat retrospective quality qualification and missing model-visible terminal
   receipts separately from actual persistence. No additional production changes
   were made after this observation.

The worktree remains uncommitted and unpushed. Pre-existing changes were preserved.
