# Knowledge adoption and completion - saved-run root causes

## Scope and evidence

Analysis only. No product edits, tests, model execution, push or monitoring.
Source is the preserved run `knowledge-quality-knowledge-taipei-101-1792342207875`:
`generation-analysis.json`, immutable provider event/payload files, source snapshot
and the previous evaluation report. Twelve relevant current owner/advice files
were byte-compared with the recorded source snapshot; all match. Call indexes in
this report are zero-based. Times are relative to provider start, 259 ms after Send.

Read-only discovery followed advice -> actual chosen method/input -> discovery ->
browser review/evidence -> server check store -> final-response/persistence routes.
Current source, specs and existing tests were inspected; tests were not executed.
No private model reasoning is inferred from elapsed time. Observed choices do not
establish why the model internally preferred them.

## 1. Fourteen queries are not fourteen duplicate lookups

| Calls                        | What actually happened                                                                                  | Diagnosis                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 2, 5, 12, 22, 33, 36, 43, 59 | First full acquisitions for selected contracts, sometimes several names in one call                     | Normal acquisition cannot be removed merely to lower a count                                                                         |
| 3                            | `prepare_and_apply_design` full refresh 2.5 s after first delivery, reason `delivery-failure`; 65,110 B | Redelivery is observed; actual loss inside the provider/model is not proven by the server receipt                                    |
| 16 -> 23                     | `read_design_context` usage, then its qualified full contract                                           | Two acquisition stages for the same tool; usage explicitly omits executable schemas                                                  |
| 20 -> 22                     | Broad `fill update` usage search, then exact fill/batch schemas                                         | Search works: relevant fill API is included, among nine basic actions and one native descriptor. This is not failure to find the API |
| 34                           | `map_retained_fills` usage; no subsequent invocation                                                    | Exploratory acquisition with no demonstrated use                                                                                     |
| 63                           | `report_outcome` queried in callable catalog                                                            | Wrong route; addressed separately below                                                                                              |

There are nine new/full acquisition calls (including the usage-to-full upgrade),
four usage calls and one refresh. The fourteen query handlers together take only
0.0645 s. The observed cost concern is extra information transfer and agent
interaction, not a slow lookup algorithm. Query output totals 331,541 B.

The shared Knowledge correctly contains no App tool lookup policy. The App
mapping already explains missing-contract acquisition, direct known-contract use,
partial fields, complete recipe dependencies and genuine recovery. However,
`ai-domain-prompt.ts` still says both "Known current contracts need no lookup" in
the composed guidance and "For known APIs request view=usage or needed
schemaPaths" in its lookup section. The latter does not qualify that information
must be missing. This is a real instruction ambiguity, not proof that it caused
every query. The previously removed blanket full-schema instruction was not the
only acquisition-policy inconsistency.

The existing read owner correctly makes usage and full different representations.
It cannot know that the agent needs an executable schema next, or that a server
reply remained in model context. Do not prohibit full reads/refreshes, enforce a
query quota, force every first lookup to be partial, or silently discard useful
schemas. Improve the single App acquisition policy and route feedback; count
first acquisitions, upgrades, recoveries, unused explorations and wrong routes
separately in later evaluation.

Sources: `server/ai-domain-prompt.ts` acquisition section;
`server/local-operation-tools.ts` `deliverDefinition`, `nativeDefinition`, query
normalization/matching and representation handling; App architectural mapping's
contract acquisition table. Paths are relative to `apps/asyra-design`.

## 2. Material knowledge was read, but the chosen method was not enacted

Call 1 returns the shared architectural content through the App module. The
advice already distinguishes material family, continuous coordinate domain and
edit coupling, and says to assess a suitable representative before repetition.
It also distinguishes existing material quality from unfinished details.

The recorded handoff contradicts those decisions at three points:

1. Call 6's method declares continuous glass fields, but defines only `overall`,
   `detail` (base/tiers/crown/ornament) and `scale`. Material appearance and missing
   ornamentation share one result identity; no separate material decision is kept.
2. Call 17 creates **all eight tiers** as four prepared parts before call 18's
   first tier-material inspection. Each part repeats the same `glassX/glassY`
   local handles `(0,0.1)` to `(1,0.9)` and stops. Reusing equal Fill templates
   does not produce one continuous world-space lighting field. The tool implements
   the submitted local values correctly; prose in `method` is not executable.
3. Call 19 at 185.684 s identifies uniform reflection and missing ornaments in
   the same failed `detail/tiers` check. The agent immediately discovers fill
   capabilities, but calls 21 and 26-28 continue crown, base and ornament work.
   Only call 30 at 305.959 s repairs glass. Its per-tier handles now differ, for
   example y `-6.42857..1.19048` versus `-5.53571..2.08333`, demonstrating that
   the existing tools can express the cross-tier domain when given those values.

Confirmed cause: decision/representation/evaluation granularity did not agree.
This is not missing gradient capability and not evidence that shared Knowledge
needs more material theory. The App accepts valid inputs independently of advice,
as required; it does not and must not infer visual intent from prose. The agent
scheduled unrelated work before fixing an observed issue. Its internal motivation
is unknown. The previous plan proved that separate checks _can_ work, not that the
agent actually declares and uses them.

The adjustment should use existing brief/method and criterion/unit mechanisms:
when the agent chooses an uncertain repeated material strategy, first implement
one useful real portion with the relevant orientations/join, carry that actual
domain into its Fill parameters, judge appearance separately from unfinished
detail, and expand only the still-valid chosen representation. Unrelated work may
continue; tools must not enforce a universal serial schedule or require a new
sample object, mandatory Knowledge receipt, extra model or per-object review.
Known-value edits and deliberately repeated/stylized appearance remain valid.

## 3. Mechanical coverage, evidence validity and pending results disagree

### Observed sequence

- Call 35 groups 6,583 region-selected elements. Its automatic check tail records
  6,586 successful target checks. That count is diagnostic work, not design quality.
- The raw trace records 7,755 internal `review_design` starts and 15,570
  `validate_inspection_evidence` starts across the run, despite only 64 App-level
  model calls. These are tool/backend operations, not thousands of AI calls.
- Call 55 changes podium ordering and removes hidden details. Call 57 then reports
  5,460 stale measurement results. The exact browser reason per retired receipt
  is not retained: `current:false` combines changed and unavailable evidence.
- Call 60 fully checks the root with no findings. Call 61 verifies **only its
  returned root selection** and passes. Call 62 still returns 5,459 stale target
  measurements. This is not a contradictory verdict for the same selection.

### First incorrect ownership boundaries

**Validity domain mismatch.** `src/ai/review-action.ts` captures mechanical review
through the same `createInspectionEvidence` used for images.
`inspection-dependencies.ts` registers the target and its ancestor chain; visual
changes to an ancestor retire dependent receipts. That is defensible for rendered
appearance, but mechanical rules consume specific geometry, parent dimensions,
visibility and text metrics. Pure paint/order changes need not invalidate all
those rules. The existing browser reviewer already has rule-context-aware retained
verdicts, but its outward evidence stamp does not communicate that distinction.
The source proves this possible over-invalidation; the generic saved invalidity
reason does not prove every one of the 5,460 receipts was invalidated for the same
reason. A reproduction must retain those causal reasons.

**Granularity and coverage mismatch.** `finishInspection` measures each target
reported by mutation scope. `updateMeasurementState` records only
`measurement:<requested target>` and its stamp. A later subtree review still
updates only its requested root. `DesignCheckRecheck` carries a target/findings,
but no authoritative checked coverage or rule basis. The server therefore has no
proof permitting it to reconcile earlier descendant obligations with the new
complete subtree result. `verify_design_checks` correctly verifies its exact
selection; it is not whole-request completion. `pendingMeasurementCount`,
`mechanicalIssue` and final settlement still see all old pending measurements.

**Unbounded diagnostic delivery.** `results.read()` defaults to all pending items,
deep-cloning each with dependency stamps. `read_design_checks` without IDs first
validates all retained target stamps. Visual review also embeds `results.read()`.
Call 58 returns about 2.806 MB, call 62 about 2.801 MB. Compact mutation receipts do
not solve these other consumers. Increasing a limit or hiding stale rows would
leave the correctness failure intact.

### Necessary correction boundary

Use the current browser mechanical reviewer as the authority for rule validity
and exact completed coverage. Preserve the existing image-evidence authority for
visual judgments. Carry coherent coverage to the server so it can reconcile only
the matching tool-owned obligations, then give the model bounded pending summaries
and explicitly requested detail. All pending counts remain authoritative.

A root pass alone is insufficient: standalone and nested reviews may have
different parent/visibility contexts. Coverage must prove the same obligation was
actually evaluated at the current document identity and rule basis. Do not clear
visual checks, unsupported/unknown work, unrelated scopes or omitted hidden nodes.
Preserve check identity/revision lineage and invalidate true dependents; do not
fabricate passes by hierarchy membership. Partial failure/cancellation can settle
only completed coherent coverage. Existing Browser/Factory write and save owners
remain unchanged.

The existing 7,718-target test stubs every review and each stamp's `current`
boolean. It proves bounded exchange and one-target refresh, but cannot detect
visual-vs-mechanical dependency conflation, actual reparenting/context changes,
or descendant-to-root reconciliation. Separate inspection tests deliberately
expect ancestor visual changes to invalidate image receipts. Passing these two
suites separately never proved the combined mechanical contract.

## 4. Final-response routing has a recovery gap

`local-operation-tools.ts` deliberately filters `report_outcome`, clarification
and detail-choice actions out of the callable registered catalog. That is correct:
`local-ai-provider.ts` supplies `input.actions` and instructs the agent to return a
final JSON action batch. Browser `actions.ts` executes `report_outcome` and confirms
durable publication; it is not a native editing tool.

Call 63 asks the callable catalog for `report_outcome`. The generic zero-match
reply sends the agent back to categories and `describe_design_apis {}`. It neither
identifies the existing final-response route nor distinguishes wrong channel from
unknown capability. The agent chose the wrong channel despite instructions; the
App's recovery worsens that mistake. There is no evidence of missing save support
or a failed persistence call in this run: the final action was never submitted.

Expose a read-only route explanation derived from existing final-action definitions
when discovery receives one of those identities; do not create a new callable
`report_outcome`, duplicate registry, alias or automatic finalization. Preserve
permission, cancellation, actual pending checks and persistence failure. A route
answer means how to submit, not that completion has been verified. Include the
same behavior for other existing final-response actions rather than a hardcoded
single-name exception.

## Why earlier review did not establish the outcome

The earlier completion criteria primarily established optional Knowledge access,
valid tool input, scoped checks, and recovery under controlled agent choices. They
did not replay this whole mixed-granularity call chain through actual browser
dependencies, nor cover wrong-channel final-action discovery. Content presence
and string expectations did not establish an unambiguous complete acquisition
policy. Those are concrete gaps in prior verification, not a reason to make
Knowledge mandatory or claim a different model will certainly fix them.

The revised plan separates deterministic owner contracts from agent adoption.
Offline saved-I/O integration can prove route correctness, exact invalidation,
coverage reconciliation, compact/lossless detail access and failure recovery.
It cannot prove that the model will choose fewer calls, correct materials earlier
or produce a better composition. Those remain unproven until a separately
authorized real-agent evaluation. No such evaluation is authorized now.
