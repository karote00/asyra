# Taipei 101 - knowledge value guidance - fifteen-minute run - 2026-11-03

## Outcome

One user-authorized fifteen-minute-budget run used the unchanged canonical prompt.
The recorder exited 0, confirmed persistence and reloaded the exact same canonical
document. The drawing visibly spans the base, eight projecting tiers, crown and
spire, with facade grids, entrance, coins and repeated ornaments.

The model did not complete final visual acceptance. The test driver stopped work
at 886.043 seconds under the existing 885-second soft-stop threshold and 900-second
hard limit. The provider outcome is cancelled, not model-authored completion or
an App decision that the design was finished. The last recorded judgment was a
failed crown-connection check; later corrections and final captures did not receive
a new recorded final judgment before cancellation.

**Knowledge discovery/read calls: zero.** The new value explanation was present in
the source used for the run, but the agent did not consult knowledge. This run does
not show that the wording reliably causes consultation, nor establish why it was
skipped. It does not justify inferring model confidence or knowledge inadequacy.

## Conditions and source

| Item | Value |
| --- | --- |
| Run | `taipei-101-fixed-1793638204793` |
| Source | `e1f4a0008d1d94856c64a9c197f714e3dcd5a444` |
| Source fingerprint | `ff9b33483219af3081bbcfb8356fd0faa78e6c5e5c43638e1654df3bf2593e0f` |
| Provider request | `0761adb8-c522-4c2a-914b-1d4a98d5b9e5` |
| Source request | `2a35ad67-db77-49a8-8bc8-91fc439e7b70` |
| Submission | 2026-11-03 00:50:11.267 Taiwan time |
| Provider / model / effort | local-codex / gpt-6-astra / medium |
| Command | `yarn workspace @asyra/asyra-design test:live:taipei-101 --minutes=15` |
| App URL | `http://127.0.0.1:3045` |
| Viewport / DPR | 1920 x 1080 / 1 |
| Scope | Existing full-building live recorder, real App snapshots and reload |
| User submissions / receipt POSTs | 1 / 31 |
| Initial submission | 457,963 bytes, including ordinary App context |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| First paint opportunity | 187,952.100 ms |
| Browser work duration | 886,043 ms |
| Provider lifecycle duration | 886,117.635 ms |
| Stop | Recorder deadline cancellation; hard-deadline worker finished normally |
| Recorder | Exit 0; no recorded page errors |

The four existing recorder contract tests passed before launch. Prompt fixture,
composer and submission checks passed. Fresh document and conversation; no user
attachments, extra instructions, model assessment or rerun. Only this invocation's
time ceiling changed. Source stayed fixed during execution. Post-stop evidence
collection is separate from AI work time.

Association: [Optional design guidance](../plans/ai-design-agent-plan.md#optional-design-guidance---2026-11-02),
value-before-discovery follow-up. The preceding source change was verified with
255 passing prompt/provider tests, one existing skip, typecheck, naming and
Inspector candidate `4130308f-554b-4fa1-a079-d25859c238b2`. Those checks establish
instruction delivery, not model adoption or visual quality.

## Timeline

| Approximate elapsed | Recorded activity |
| --- | --- |
| 0-135 s | Reference research and five initial API discovery calls; announces 508 m scale and estimated local dimensions |
| 186.711-189.988 s | Base/facade preparation and application |
| 187.952 s | First paint opportunity |
| 231.934 s | Announces eight tiers with continuous reflection, frames and shadows |
| 279.081-286.566 s | Eight-tier application |
| 308-309 s | Additional native research |
| 330.184 s | Announces crown/spire |
| 390.147 s | Crown input rejected for a nonplanar spire face before writes |
| 402.726-403.573 s | Corrected crown input applied |
| 408.591 s | Review API discovery |
| 412.436 s | First image review capture |
| 427.948 s | Judgment recording rejected for invalid evidence binding |
| 439.435 s | Corrected judgment recording succeeds; crown connection fails |
| 451.741-466.535 s | Four API lookups for correction |
| 494.401 s | Announces crown correction and ornaments |
| 496.111 s | Deletes detached crown ribs |
| 526.477 s | Applies fitted crown ribs, bracing and railings |
| 604.385 s | Applies repeated ornaments |
| 706.065 s | Applies entrance, base coins, columns and louvers |
| 719.642 s | Context-query discovery rejected for unsupported inputScope |
| 735.600 s | Corrected discovery succeeds |
| 754.034 s | Reads current group bounds |
| 762.906 s | Grouping API discovery |
| 773.970 s | Announces grouping and final inspection |
| 778.315 s | Groups existing building components |
| 816.263 s | Final image capture succeeds |
| 886.043 s | Recorder cancels; no final acceptance recorded |

| Action | Announcement to first related tool start | Tool inclusive duration |
| --- | ---: | ---: |
| Base/scale announcement to base write | approximately 51.8 s | 3.276 s |
| Eight tiers | approximately 47.1 s | 7.485 s |
| Crown/spire, first attempt | approximately 60.0 s | 0.023 s, rejected |
| Crown correction announcement to deletion | approximately 1.7 s | 0.327 s |
| Grouping announcement to grouping | approximately 4.3 s | 0.272 s |

Announcements are sampled browser observations; tool times use provider recording.
Clock/start differences make these delays approximate. Final capture completed
roughly 69 seconds before cancellation without a recorded final judgment. These
intervals are not proof of private reasoning duration or model argument generation.

## Tool activity and recovery

| Tool | Calls | Input bytes | Output bytes | Inclusive duration |
| --- | ---: | ---: | ---: | ---: |
| `describe_design_apis` | 13 | 1,558 | 198,071 | 0.573 s |
| `prepare_and_apply_design` | 7 | 38,018 | 8,353 | 12.577 s |
| `review_drawing` | 4 | 2,725 | 18,790 | 0.590 s |
| `execute_design_batch` | 3 | 1,269 | 2,844 | 0.613 s |

Twenty-seven App calls: 24 usable, two rejected, one failed, zero partial.
Five additional native research operations have unknown App usability, which does
not mean research failure. No discover_knowledge/read_knowledge call and no App
reference-image import occurred. Source research is not Knowledge consultation.

| Failure | Evidence | Subsequent recovery |
| --- | --- | --- |
| Nonplanar spire face | `needleY.vertices`, deviation 57.942956320550934 world units versus tolerance 0.00004408174225232029; settlement not-started | Corrected preparation begins 12.58 s later and succeeds |
| Invalid review binding | Owner reports foreign, modified or stale binding; rejects before recording the judgment | Corrected review begins 11.49 s later; crown fail judgment is recorded |
| Unsupported discovery scope | `read_design_context` owner does not publish inputScope choices; requests omission and full contract | Corrected lookup begins 15.96 s later, followed by successful bounds read |

The binding error does not identify which of foreign/modified/stale applies;
do not assert a particular cause beyond the recorded validation result. No
failure ended the design turn. A successful record is not a passing judgment.

The visual crown issue was separate from the nonplanar input: the model judged
fixed-width ribs to be floating, deleted them and added fitted replacements.
That correction received no final accepted visual judgment. Context reading and
grouping used existing IDs rather than rebuilding the entire building.

## Resource attribution and recording limits

| Exclusive owner | Seconds | Share |
| --- | ---: | ---: |
| Provider | 870.773 | 98.27% |
| App | 13.848 | 1.56% |
| Tool | 1.497 | 0.17% |
| Recording gap | 0.000 | 0.00% |

Recorded provider categories include 523.047 s waiting, 310.329 s observed
reasoning-event intervals, 18.668 s research, 18.250 s response-event intervals and
0.479 s request transport. Provider waiting is not measured thinking. Inclusive
tool times contain nested work and cannot be added to exclusive owner totals.

**Recording completeness is false:** the report retains one incomplete provider
span (`rs_0018f32ac8acf010016ae8c2a0334087d085d11cc093504eca`) at cancellation.
Lifecycle and tool records exist, but the provider interval breakdown has this
explicit limit. A zero attributed recording gap does not override the incomplete
span. The report was regenerated after the recorder exited and the issue remains.
Do not claim complete provider telemetry or diagnose the missing closure without
further evidence. No runtime patch or replacement evidence was introduced.

| Usage / transport | Recorded value |
| --- | ---: |
| Input tokens | 2,448,391 |
| Cached input tokens | 2,342,144 |
| Noncached input tokens | 106,247 |
| Output tokens | 20,980 |
| Reasoning output tokens | 3,462 |
| Total tokens | 2,469,371 |
| Transport sent / received | 2,410,895 / 2,215,912 bytes |

Usage is partial after cancellation. Tokens are not a credit charge estimate.
Credit was checked at approximately 00:49 Taiwan time: 27,805.676399; no repeated
credit polling was needed within the thirty-minute interval. No CPU/memory
profiling was used to infer provider performance.

## Visual evidence and acceptance

The reviewing agent inspected final.png, spire.png, tiers.png, base.png,
native-detail.png and reload.png from the actual App. Overview zoom is about 2%;
spire/tiers/base use scale 0.0621792, native detail uses scale 1. Panels and selected
object outlines are visible before reload; reload clears selection. Dark canvas
is the workspace, not proof of an authored background.

| Area | Visible result | Limit |
| --- | --- | --- |
| Whole building | Complete base-to-spire silhouette and eight projecting tiers | Silhouette coverage is not final architectural/realism acceptance |
| View | Two facade sides and top surfaces visible consistently | Exact geometry and dimensional fidelity were not independently surveyed |
| Facade | Dense repeated window grids, floor bands and contrasting side tones | At 100%, broad flat bands and uniform panes remain prominent; layered frame depth is limited |
| Crown/spire | Crown, lower observation enclosure, roof/platform and banded spire present | Broad surfaces remain simply shaded; repaired ribs are not finally certified |
| Ornaments | Repeated curled/pendant motifs and circular square-center base symbols | Motifs are visible but detailed real-world fidelity remains unverified |
| Base | Tapered base, entrance canopy, glazing, columns/louvers | Adjacent podium geometry is not established by this isolated composition |
| Reload | Same visible whole-building composition | Different panels/selection mean no pixel-identical screenshot claim |

The last model review is recorded but `current: false`, `accepted: false` and
`certifiesVisuals: false`. The only recorded judgment fails crown connectivity.
Later final capture is evidence acquisition, not a replacement judgment. The
user-requested detailed realism therefore remains unaccepted in this run.

## Durability and retained evidence

| Check | Result |
| --- | --- |
| Canonical nodes | 16,489: 16,247 vectors, 234 ovals, seven groups, one workspace |
| Persistence | generation 0; sequence = durableSequence = 528 |
| Source / checkpoint / reload | Exact canonical document equality |
| App payload hashes | 54 of 54 match |
| Retained image hashes | Six of six match |
| Video | recording.webm, 82,369,732 bytes; full playback not independently reviewed |
| Recorder errors | None recorded; exit 0 |
| Cleanup | Owned server PIDs 93574/93600/93601 stopped; ports 3045/4145/4245 clear |

Artifacts:
`tmp/conversation-improvements/live/taipei-101-fixed-1793638204793/`.
Includes run.json, execution-report.json, evidence-checks.json, source and reload
snapshots, checkpoint.json, recording.webm, first/final/detail/reload PNGs, service
logs and provider-records with original payloads/assets. Original records remain
unchanged; report/check files are derived evidence.

## Interpretation

This test proves that the revised instruction source can execute the existing
full drawing workflow through recovery, cancellation, persistence and reload.
It does not prove improved consultation, quality or completed-task speed. The
value wording alone did not lead to Knowledge use in this observed run, including
after geometric and visual problems. The trace cannot establish whether the model
judged consultation unnecessary, overlooked it or preferred another route.

The main observed delay still precedes tool execution, and additional time was
spent on correction, ornament construction, discovery and inspection. No new
prompt intervention, forced lookup or repeated benchmark was performed. This
unfinished acceptance state is not compared as equivalent to a previously
completed drawing.
