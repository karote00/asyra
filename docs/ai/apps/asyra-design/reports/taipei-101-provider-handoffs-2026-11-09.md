# Taipei 101 - Provider-visible handoff contracts

## Result and limits

The three planned contract changes passed their focused regressions, including
actual native provider declarations and dispatch. The single live drawing finished
in 13m 14.038s within the unchanged fifteen-minute limit. Its unlimited report
finished in 8m 57.018s on the original native thread, which remains available for
follow-up. No files were edited during drawing or reporting.

This is not a clean end-to-end handoff result. The run exposed an unresolved
execution-contract mismatch: a region-selected grouping operation cannot bind
its advertised groupId into subsequent captures. The AI attempted the correct
combined sequence, received an admission rejection, and split it to continue.
The current changes fix model delivery for target-bound actions; they do not fix
this Runtime dependency route. No post-observation implementation was made.

The artwork includes the whole tower and editable detail, but the original AI
qualified realism, estimated local dimensions and ornament fidelity. Native
drawing completion is not proof of complete visual acceptance. Final App
settlement is partial because of that retrospective qualification, not a drawing
deadline, persistence failure or report timeout.

## Evidence

All run-relative paths below refer to
`tmp/conversation-improvements/live/taipei-101-fixed-1794209667880/`.

| Evidence | Identity or file |
| --- | --- |
| Manifest | `run.json` |
| Original complete AI report, unchanged | `self-report.txt` - 458 lines, 35,343 bytes |
| Report summary and turn evidence | `self-report-summary.txt`, `self-report-turn.json`, `self-report-evidence.json` |
| Provider request | `d581c1f6-117c-40cb-af1e-f524055a9196` |
| Native thread | `01a1bf3a-f834-75c2-955a-aaee6caa01c2` |
| Drawing turn | `01a1bf3a-f889-7032-8a90-12a4b116457c` |
| Report turn | `01a1bf47-0f97-7ea2-9a9b-e886673b0418` |
| Retained session | `48ef5ee6-27f8-4b6f-a394-458e620d7eec` - waiting |
| Native declaration snapshot | `provider-records/d581c1f6-117c-40cb-af1e-f524055a9196.payloads/3-input.json` |
| Rejected dependent group sequence | Same payload directory, `352-input.json`, `353-output.json` |
| Images inspected | `final.png`, `native-detail.png`, `spire.png`, `base.png` |
| Other evidence | `tiers.png`, `reload.png`, `recording.webm` |

The prompt fixture hash remains
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
No prompt amendment or second drawing attempt was made. Local services on
3049/4249/4149 remain available for the retained session.

## Implementation and verification

1. One valid primary owner example now reaches both native declarations and
   ordinary usage through a shared selector. The host's primary example shows
   same-submission authored-input reuse. Schema compaction no longer silently
   removes the only delivered example.
2. Ordinary, stage and iteration target declarations use the admitted canonical
   region/filter schema. Missing resolver capability does not advertise support.
3. Outer inspection describes automatic versus explicit captures and its default.
   Deletion advertises narrow count/status selectors. Model selection resolves a
   single target-bound action through its actual model result owner. Portable
   model-only fields do not become invalid Runtime exports; real execution
   resource exports preserve query snapshot lifetimes.

Formal tests inspect the actual `thread/start` dynamicTools payload, execute its
example through the native dispatcher, and read actual native usage replies.
They do not stop at the unprojected owner schema. The recorded previous E5
region/suffix deletion uses real parameters: ten deletions, unrelated content
preserved, construction, one selected final image, and no context lookup.
Capture counts are one with defer and two with immediate. Subsequent query
snapshot reuse proves resource preservation rather than merely receipt shape.

| Focused check | Result |
| --- | --- |
| Handoff, host, delivery and integration files | 134 passed |
| Selected native provider cases | 7 passed |
| Current-source Flow Inspector cases | 89 passed |
| Naming | 15 passed |
| Server type check | Passed |
| Scoped lint | Zero errors; three existing console warnings |
| Scoped whitespace review | Passed |

Flow attempt: `f446f53a-3ce0-43ef-926a-9fb90aa4d75b`.
Accepted contract review:
`5f6cc91942eee486ea9d6b720bf002d74feccdb6b5762013a4e4e5ac9b289545`.
Logs are under `tmp/conversation-improvements/provider-handoff-*.log`.
No full-local, release or CI run, commit or push occurred.

The live model received the primary reuse example, canonical target contract and
inspection semantics. It did not use same-submission input aliases or deletion,
so those behaviors have connected formal proof but no adoption proof in this
drawing. Cross-call named reuse was exercised successfully.

## Discovery and execution

Recorded output sizes below are serialized evidence payload bytes, not tokens,
network bytes, image bytes or latency. Ten discovery replies totaled 101,837
bytes; nine execute_design replies totaled 13,282 bytes. The two eager native
declarations totaled 20,234 bytes, versus 16,894 in the preceding observation.
The increase includes the missing usable contract information. Do not claim an
overall payload reduction or compare different artwork duration as causality.

| Query | Acquired purpose or operation | Reply bytes | Use |
| --- | --- | ---: | --- |
| D1 | prepare_and_apply_design, projected faces/grids/patterns | 19,437 | Construction |
| D2 | inspect_drawing | 6,460 | Seven delivered captures |
| D3 | project vector path onto plane curves | 13,168 | Partial candidates; not adopted |
| D4 | prepare_and_apply_design repair | 5,881 | Retained crown repair |
| D5 | map_retained_fills | 9,656 | 11,280 fill targets |
| D6 | read_design_context | 11,108 | Actual base/tier bounds |
| D7 | group elements | 10,821 | Purpose discovery |
| D8 | hierarchy.groupElements | 5,109 | Exact grouping contract |
| D9 | hierarchy.moveElementsRelative | 6,180 | Occlusion correction |
| D10 | prepare_and_apply_design vector-pattern | 14,017 | Unused exploration |

No discovery pagination or exact-name miss recovery occurred. D7 followed by D8
is purpose discovery followed by exact usage, not a failed name lookup. D3's
partial candidates do not establish a missing general-purpose capability.

| Call | Submitted work | Result and reason for returning | Reply bytes |
| --- | --- | --- | ---: |
| E1 | Base then tiers | Success; status plus named saves | 2,279 |
| E2 | Crown then overview | Nonplanar face rejected before application; repair needed | 2,779 |
| E3 | Repair retained crown then overview | Success; visual decision | 546 |
| E4 | Tier and base canonical bounds | Success; geometry needed for material mapping | 1,279 |
| E5 | Glass mapping, ornaments, entry, overview | Success; combined work then visual decision | 2,721 |
| E6 | Details, region-selected group, overview, detail | Entire admission rejected on groupId dependency; no writes | 849 |
| E7 | Details then region-selected group | Success; returns groupId for blocked continuation | 1,574 |
| E8 | Overview, ornament and corner captures | Success; three images, reveals occlusion | 733 |
| E9 | Layer order correction, final detail, final overview | Success; two explicitly selected images | 522 |

Seven successful submissions contained eighteen authored operation steps. These
are not counts of every internal resolver or browser exchange. Seven App images
were delivered. Explicit captures were selected intentionally; there is no
evidence of an extra automatically delivered intermediate image in this run.
The final correction and both final captures were combined in E9.

Eleven names received save acknowledgements. Six distinct saved names were
consumed through nine named bindings in successful submissions. Failed E2 and
E6 also resolved named inputs but did not apply their planned construction.
Twelve names were requested in total; crownInputs was not acknowledged after
E2 failed. No full saved-value retrieval call or shape-navigation call occurred.
Unused saves remain valid precautionary context. Actual reuse covered projection,
material templates and target IDs; no future user-turn consumption is claimed.

## Failure attribution and remaining gap

### Nonplanar crown input - correctable authoring error

E2 supplied a nonplanar spire face at `/children/30/vertices`. The measured
deviation was approximately 14.581 world units, above the planar tolerance.
The tool returned a retained draft and precise location. E3 replaced the affected
faces with planar triangles and continued, preserving the existing base/tiers.
The guard should remain. This does not justify silently triangulating arbitrary
invalid geometry or attributing the error to a missing contract.

### Region-selected groupId dependency - unresolved App contract mismatch

E6 specified a workspace region, a root-name prefix and expectedCount six, with
selectAt step after detail creation. Both captures used the published binding
`/actionResults/0/result/value/groupId` from the group step. Admission rejected
that path as absent or not guaranteed; no part of E6 ran.

Current source establishes the route difference:

- `local-design-sequence.ts` compiles ready target-bound operations through
  `grouped([s], id)`, the private canvas batch.
- `basic-design-api-contracts.ts` advertises the real grouping result's groupId.
- The private batch's result schema exposes resource navigation but does not
  carry that action's groupId execution contract to Runtime dependency admission.
- This change's `modelStepOwner` in `local-tool-host.ts` selects the actual
  action for model-facing delivery. It does not change the contract Runtime uses
  when a later step binds an earlier target-bound action's result.

Therefore the AI's attempted route was reasonable and the rejection is a tool
handoff problem. Direct-ID grouping-to-read coverage and narrow model delivery
coverage do not prove region-targeted grouping-to-capture composition. The missing
combination escaped the focused regression set and was exposed by this live run.

E7 executed the previously unstarted details/group work. E8 used the returned
groupId. This introduced one avoidable value-handoff boundary. E8 also selected
an additional view, so its entire call should not be counted as pure data copying.
The failure remained recoverable and did not terminate drawing; recovery did not
repair the underlying contract.

The bounded follow-up is to preserve the actual action's execution result contract
through target resolution. Regress E6's exact create -> step-time select -> group
-> capture sequence, including failed/missing group results and preservation of
conditional paths. Do not add prompts, compatibility routes, broad guarantees for
unknown output fields, or a requirement to manually fetch IDs.

## Original AI recommendations checked against evidence

| Recommendation or observation | Assessment |
| --- | --- |
| Align advertised groupId and dependency admission | Confirmed product issue above; still open |
| Preserve precise repair receipts and completed work | Existing behavior worked in E2/E3 and E6/E7; retain it |
| Use world material fields earlier | Existing capability, authoring choice; no evidence for a mandatory workflow |
| Plan background pillar ordering before ornaments | Valid design consideration; E8 visual inspection found a real occlusion, E9 corrected it in one sequence |
| Add planar geometry knowledge | Possible aid, not proven necessary; do not replace input validation or force discovery |
| Improve curve-purpose search | D3/D10 were unadopted exploration; investigate capability/ranking before implementation |
| Make persistence visibility clearer | AI lacked its own confirmation; independent runner confirms durability. This is not evidence of a save failure or need for another completion gate |
| Explain long gaps | Public account supports geometry authoring, contract reading, visual decisions and recovery; precise provider/network/reasoning shares remain unknown |

The saved data was actually reused. read_design_context was actually consumed in
E4 for current bounds, rather than fetched only to discover target syntax. The
model already combined several decided sequences; the strongest avoidable split
was caused by the App rejecting its correct dependency attempt. No instruction
to force reuse, Knowledge or more planning follows from these observations.

## Evidence closeout

The final document contains 17,662 nodes including the workspace: seven groups,
17,345 vectors and 309 ovals. Six construction receipts total 17,660 additions;
the final grouping adds another container. These totals are different measures.
Durable sequence equals document sequence at 564; reload preserved the document.
Report-time document comparison also remained unchanged. Recorder errors and
evidence errors are empty; neither is a claim that tool calls had no failures.

The whole-tower screenshot, local detail, crown and base were inspected. They show
the full editable illustration and local detail but do not independently prove
every real-world dimension, ornament or photorealism requirement. The original
report's candid quality limitations remain part of the result.

The original AI report remains unedited in the run directory. The session is
waiting for follow-up; no additional drawing or implementation has been initiated.
