# Taipei 101 - second retest - 2026-11-02

## Result

**Incomplete.** The user requested another full-building test with the unchanged prompt and a ten-minute limit. The App agent stopped after 198.153 seconds with `partial / executed`, leaving two tiers. No complete-run performance comparison is valid or provided. The previous incomplete-versus-complete comparison is withdrawn as a completion benchmark.

Scope: one live run and evidence/reporting associated with the conversation improvements task. No product edits, prompt edits, coaching, attachments, seeded geometry, automatic retries, publication or release work. The same validated source and built services were used.

## Configuration

| Item | Value |
| --- | --- |
| Run | `taipei-101-fixed-1793607609164` |
| Request | `bd56c3e2-8f5a-4103-9e80-a2408ca5d286` |
| Source | `50e153ff713da9f0748348e6bbd52464a6652b72` |
| Source fingerprint | `1413bf1f8f7a5a7b2a66dbf6a9d58d1e23fa200c37e07304543fd7861ad8acf0` |
| Prompt SHA-256 | `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51` |
| Model | gpt-6-astra / medium |
| Base URL | `http://127.0.0.1:3045` |
| Visual scope | Permanent full-building Taipei 101 live recorder |
| Command | `yarn workspace @asyra/asyra-design test:live:taipei-101` |
| Viewport | 1920 × 1080, DPR 1 |
| Deadline | 600 seconds; normal early settlement permitted |
| First paint opportunity | 140.230 seconds |
| App settlement | 198.153 seconds |
| Provider duration | 197344.335 ms |
| Root requests | 1, submitted intent matches fixture exactly |

## Failure and recovery

The agent researched external references and architectural guidance, then chose to build two adjacent tiers before extending the building. The construction's immediate inspection, a `review_drawing` attempt and an `inspect_drawing` attempt each returned `TOOL_RESULT_DELIVERY_FAILED`, stage `delivery`, settlement `unknown`, with `Invalid drawing snapshot dimensions`.

The returned warning explicitly said completed writes were not undone and mutations must not be replayed. The agent preserved existing geometry, attempted alternative inspection, read checks and disclosed that the base, remaining tiers, crown and spire were incomplete. It did not reach the ten-minute timeout. The exact first faulty implementation owner has not been diagnosed by this test.

Final check counts: 1 pass, 0 fail, 6 unverified, 3 stale. Recorder exit 0 and provider `completed` are not evidence of complete-building success.

## Calls

| Tool | Calls | Input bytes | Output bytes | Inclusive ms |
| --- | ---: | ---: | ---: | ---: |
| `describe_design_apis` | 9 | 962 | 128,083 | 418.988 |
| `discover_knowledge` | 1 | 43 | 9,596 | 8.252 |
| `read_knowledge` | 1 | 104 | 21,851 | 12.765 |
| `import_reference_image` | 1 | 276 | 3,643 | 2186.693 |
| `prepare_and_apply_design` | 1 | 6,433 | 2,270 | 1928.062 |
| `review_drawing` | 1 | 390 | 4,676 | 96.014 |
| `inspect_drawing` | 1 | 109 | 1,034 | 61.492 |
| `read_design_checks` | 1 | 2 | 206 | 7.396 |


16 App calls: 13 usable and 3 partial. Two additional native research outcomes have unknown App usability; they are not additional App failures. Inclusive tool times cannot be summed with exclusive owner times.

| Tool, in recorded completion order | Inclusive ms | Outcome | Evidence |
| --- | ---: | --- | --- |
| `describe_design_apis` | 317.050 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/42-output.json) |
| `describe_design_apis` | 2.592 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/45-output.json) |
| `describe_design_apis` | 4.215 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/48-output.json) |
| `discover_knowledge` | 8.252 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/51-output.json) |
| `read_knowledge` | 12.765 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/53-output.json) |
| `describe_design_apis` | 6.883 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/59-output.json) |
| `describe_design_apis` | 6.724 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/65-output.json) |
| `import_reference_image` | 2186.693 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/76-output.json) |
| `prepare_and_apply_design` | 1928.062 | partial | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/107-output.json) |
| `describe_design_apis` | 14.270 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/112-output.json) |
| `review_drawing` | 96.014 | partial | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/126-output.json) |
| `describe_design_apis` | 11.660 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/131-output.json) |
| `describe_design_apis` | 8.716 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/134-output.json) |
| `describe_design_apis` | 46.878 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/137-output.json) |
| `inspect_drawing` | 61.492 | partial | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/162-output.json) |
| `read_design_checks` | 7.396 | usable | [Output](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/provider-records/bd56c3e2-8f5a-4103-9e80-a2408ca5d286.payloads/169-output.json) |

## Usage and integrity

| Metric | Value |
| --- | ---: |
| Input tokens | 1,294,091 |
| Cached input tokens | 1,207,680 |
| Noncached input tokens | 86,411 |
| Output tokens | 4,142 |
| Reasoning output tokens | 504 |
| Total tokens | 1,298,233 |
| Sent / received bytes | 2,305,118 / 1,905,593 |
| Exclusive provider time | 191,707.721 ms |
| Exclusive App time | 2,812.062 ms |
| Exclusive tool time | 2,824.553 ms |
| Attributed recording gap | 0 ms |
| Offline report issues | 0 |
| App payload hashes verified | 32 |

The offline report was generated without model assessment. Tokens are provider usage, not credit cost. Credit was checked once at the scheduled interval, with a balance of 30,084.1460065; no repeated checks were performed during this short run.

## Persistence and visual review

The source contains 2,894 vectors, one group and one workspace. Durable sequence is 92/92, generation 0. The source document, durable checkpoint and reloaded document match exactly.

Final, native-detail and reload screenshots were inspected. They show two stacked tiers with dense window grids, two differently shaded facades and pale projecting ledges. Flat material treatment and incomplete architecture do not satisfy the full-building request. Final view is 11% with selection outline and conversation panel; native detail is 100%; reload view has no selection. Capture filenames such as `spire` or `base` do not prove the missing architecture exists.

All owned service ports (3045, 4145, 4245) were clear after runner cleanup. Product completion failed; persistence verification passed. No completed-run speed or quality comparison is made.

## Evidence

- [Run metadata](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/run.json)
- [Execution report](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/execution-report.json)
- [Final screenshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/final.png)
- [Native detail](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/native-detail.png)
- [Reload screenshot](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/reload.png)
- [Recording](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/recording.webm)
- [Source document](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/source-snapshot.json.gz)
- [Reload document](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/reload-snapshot.json.gz)
- [Checkpoint](../../../../../tmp/conversation-improvements/live/taipei-101-fixed-1793607609164/checkpoint.json)

Raw artifacts are retained in project-local ignored `tmp` and are not Git-tracked. The report is local and has not been pushed.
