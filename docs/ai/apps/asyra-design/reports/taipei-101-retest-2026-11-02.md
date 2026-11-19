# Taipei 101 - ten-minute retest - 2026-11-02

## Outcome and scope

The single live run ended early with **partial execution at 279.253 seconds**. It produced two adjacent bamboo tiers, not the entire Taipei 101. Three image delivery failures prevented the agent from receiving its requested inspections. The agent reported the incomplete building and preserved its work. The ten-minute ceiling was not reached. Recorder exit 0 and provider outcome `completed` describe recording/transport completion, not task success.

This is a user-requested follow-up measurement associated with the [conversation improvements closeout](../plans/completed/ai-conversation-improvements-plan.md). Scope: one unchanged fixed-prompt run, retained evidence, detailed report and comparison. No production fixes, extra prompts, model assessment, automatic rerun, release work or remote push. Previous acceptance remains historical; this new outcome does not establish repeatable full-building completion.

## Reproduction

| Setting | Value |
| --- | --- |
| Run | `taipei-101-fixed-1793605813138` |
| Request | `569fdc1d-2248-4350-a048-1f9c933c6ba7` |
| Source | `50e153ff713da9f0748348e6bbd52464a6652b72` |
| Fingerprint | `1413bf1f8f7a5a7b2a66dbf6a9d58d1e23fa200c37e07304543fd7861ad8acf0` |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Provider / model / effort | local-codex / gpt-6-astra / medium |
| Submit, Taiwan time | 2026-11-02 15:50:19.099 |
| Provider finish, Taiwan time | 15:54:57.836 |
| Root submissions / receipt POSTs | 1 / 8 |
| Root request bytes | 457,711 |
| Input | Approved fixture, unchanged except final file newline; no attachments, prior history or extra hints |
| Deadline | 600,000 ms, normal early settlement allowed |
| Viewport | 1920 × 1080, DPR 1 |
| Runner | `yarn workspace @asyra/asyra-design test:live:taipei-101` |

[Fixed prompt](../../../../../apps/asyra-design/test-data/ai-drawing/taipei-101-full-building-prompt.txt). Recorder contract preflight: 3 tests passed. The offline report was generated without `--assess`; it made no additional model request. Agent-owned service ports 3045, 4145 and 4245 had no listeners after cleanup.

## Timeline

Time is relative to prompt submission. Tool starts use the recorded provider start offset of 330 ms; durations are inclusive and must not be added to exclusive owner totals.

| Tool | Start after submit (s) | Inclusive ms | Result | Code | Output evidence |
| --- | ---: | ---: | --- | --- | --- |
| `describe_design_apis` | 22.696 | 315.115 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/45-output.json) |
| `describe_design_apis` | 29.132 | 2.884 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/48-output.json) |
| `describe_design_apis` | 33.713 | 11.165 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/51-output.json) |
| `discover_knowledge` | 41.690 | 21.810 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/54-output.json) |
| `read_knowledge` | 46.009 | 7.856 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/56-output.json) |
| `import_reference_image` | 58.712 | 430.454 | partial | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/72-output.json) |
| `import_reference_image` | 66.294 | 144.610 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/78-output.json) |
| `import_reference_image` | 79.813 | 140.604 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/90-output.json) |
| `describe_design_apis` | 108.800 | 18.571 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/97-output.json) |
| `prepare_and_apply_design` | 198.550 | 3028.129 | partial | TOOL_RESULT_DELIVERY_FAILED | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/137-output.json) |
| `describe_design_apis` | 207.882 | 24.224 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/142-output.json) |
| `review_drawing` | 217.699 | 76.970 | partial | TOOL_RESULT_DELIVERY_FAILED | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/149-output.json) |
| `describe_design_apis` | 222.700 | 13.638 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/154-output.json) |
| `describe_design_apis` | 232.876 | 49.776 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/157-output.json) |
| `review_drawing` | 238.477 | 96.028 | partial | TOOL_RESULT_DELIVERY_FAILED | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/167-output.json) |
| `describe_design_apis` | 245.038 | 10.239 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/172-output.json) |
| `describe_design_apis` | 258.310 | 5.836 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/193-output.json) |
| `read_design_checks` | 266.541 | 22.655 | usable | - | [Payload](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/provider-records/569fdc1d-2248-4350-a048-1f9c933c6ba7.payloads/198-output.json) |


First paint opportunity: **199.362 seconds**. UI settlement: **279.253 seconds**. The longest recorded interval between App calls was 89.732 seconds, between contract discovery and preparation. Its attributed provider wait was 70.439 seconds; this is not a measurement of private reasoning.

## Tool and reference detail

| Tool | Calls | Input bytes | Output bytes | Inclusive ms |
| --- | ---: | ---: | ---: | ---: |
| `describe_design_apis` | 9 | 825 | 131,180 | 451.449 |
| `discover_knowledge` | 1 | 43 | 9,596 | 21.810 |
| `read_knowledge` | 1 | 104 | 21,851 | 7.856 |
| `import_reference_image` | 3 | 956 | 12,357 | 715.668 |
| `prepare_and_apply_design` | 1 | 7,466 | 2,373 | 3028.129 |
| `review_drawing` | 2 | 422 | 8,254 | 172.998 |
| `read_design_checks` | 1 | 2 | 206 | 22.655 |


18 App calls: 14 usable, 4 partial, no rejected or failed App outcomes. Two additional native research calls have unknown App usability and together took 10,562.411 ms; unknown native outcomes are not App failures.

Knowledge discovery requested `architectural-illustration`; reading selected `design.architectural-illustration.materials.method`. Six composed documents were returned: `design.architectural-illustration` revision 18, its `contracts` revision 2, `illustration.architecture` revision 5, its `materials` and `materials.method` revision 1, and the selected Design method revision 3. Discovery and read output totaled 31,447 bytes. This is observed use, not proof of improved quality or a causal explanation of latency.

Three reference imports attempted six references: five succeeded, one failed with `REFERENCE_PAGE_DOWNLOAD_FAILED` for a generic Public Domain Pictures page. The first successful image was the Oneness page's representative metadata image with unverified source resolution. Later calls imported four direct Oneness images. The construction plan selected reference indexes 2, 3 and 4. Engineering PDF information was cited for 508 m height; this report does not independently certify its dimensional interpretation or unseen geometry.

## Failure and recovery

| Operation | Observed result | Subsequent behavior |
| --- | --- | --- |
| Reference acquisition | One page download failed; other reference succeeded | Agent acquired four direct images in two later calls |
| Prepare and apply | `TOOL_RESULT_DELIVERY_FAILED`, stage `delivery`, settlement `unknown`, recoverable | Mutations survived; agent did not replay construction |
| Overview review | Same invalid snapshot dimensions error | Agent discovered review contracts and attempted a local region |
| Region review | Same error for a 1024 × 1024 requested region | Agent read unresolved checks, then reported partial completion |

Exact delivery message: “Invalid drawing snapshot dimensions. The tool returned an execution result but its content could not be delivered. This does not undo completed work. Do not replay mutations; inspect current state or use another acquisition method.”

The failure is observed at the result-delivery boundary; this report does not establish the first incorrect implementation owner. Nested inspection execution returned evidence identities, but delivery failed. A screenshot visible to the test recorder is not proof that the model received an inspection image. No duplicate construction or automatic second user request was issued.

Final `read_design_checks`: 1 pass, 0 fail, 7 unverified, 2 stale at revision 12; first pending `visual:overall`. The failed visual review receipt had 9 required coverage units and zero passed. These are different scopes and must not be conflated. Offline model review was unavailable, `current=false`, `certifiesVisuals=false`; no final accepted visual review exists.

## Persistence and visual inspection

| Check | Result |
| --- | --- |
| Scene | 5,058 vectors + 1 group + 1 workspace = 5,060 nodes |
| Durable write position | sequence 160 / durable sequence 160, generation 0 |
| Checkpoint vs final document | Exact equality |
| Reload vs final document | Exact equality; reload image inspected |
| Whole building | Missing base, remaining tiers, crown and spire |
| Actual visible work | Two adjacent tiers, two facade faces, visible upper surfaces and projecting ledges |
| Native-scale detail | Separate dense window frames, teal glazing and dark bands; largely flat shading |
| Realism and ornament | Not demonstrated at requested whole-building quality; no complete ornament treatment |
| Scale | Plan declares centimeters, scale 1 and 35°/25° projection; final building dimensional correctness unverified |

Final, first, reload and 100% native-detail images were inspected. Automated filenames `spire.png`, `tiers.png` and `base.png` describe capture positions within the existing bounds, **not proof that those architectural regions exist**. Preserved window geometry does not satisfy the complete-building request.

## Timing, usage and recording

| Metric | Value |
| --- | ---: |
| Provider duration | 278,422.916 ms |
| Exclusive provider owner | 273,095.141 ms |
| Exclusive App owner | 3,845.754 ms |
| Exclusive tool owner | 1,482.021 ms |
| Recording gap attribution | 0 ms |
| Provider wait | 189,766.858 ms |
| Input tokens | 1,327,560 |
| Cached input tokens | 1,247,360 |
| Noncached input tokens | 80,200 |
| Output tokens | 5,226 |
| Reported reasoning output tokens | 956 |
| Total tokens | 1,332,786 |
| Transport sent / received | 2,633,210 / 2,245,938 bytes |
| Recording failures / report issues | 0 / 0 |
| Verified App input/output payload hashes | 36 / 36 |
| Video | 19,862,261 bytes |

Token counts are cumulative provider usage, not account credit cost. Timing categories are exclusive only in the owner table. Payloads may intentionally redact image bytes; hash verification proves retained payload integrity, not unredacted image delivery.

## Evidence

- [Run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/run.json)
- [Offline execution report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/execution-report.json)
- [Derived metrics](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/comparison-metrics.json)
- [Final image](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/final.png), [native-scale detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/native-detail.png), [reload image](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/reload.png)
- [Recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/recording.webm)
- [Source snapshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/source-snapshot.json.gz), [reload snapshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/reload-snapshot.json.gz), [checkpoint](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793605813138/checkpoint.json)
- [Comparison](taipei-101-retest-comparison-2026-11-02.md)

Large raw evidence remains in the project-local ignored `tmp` directory; it is not included in Git. These local links require that directory to remain available.
