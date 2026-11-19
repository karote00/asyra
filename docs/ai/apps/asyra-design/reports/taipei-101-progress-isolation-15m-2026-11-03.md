# Taipei 101 - progress isolation - 15-minute test

## Result

The progress-admission fix passed focused validation and the drawing turn completed
normally at 849,931.464 ms (14 minutes 10 seconds), before the 15-minute deadline.
The original native thread then started the report turn. That report was interrupted
by the existing independent 300,000 ms report guard. The end-to-end request settled
`AI_PROVIDER_TIMEOUT`, partial/failed. Do not describe the complete benchmark or
full-report requirement as passed.

The original AI emitted 10,777 characters across 1,388 public text deltas. Its last
sentence is incomplete and no completed-message/final report receipt exists. The
verbatim concatenation is `self-report-partial.txt`; its exact identity, hash and
incomplete status are in `self-report-partial-evidence.json`. No private reasoning
was read or exported. No replacement session or automatic rerun was used.

## Identity and artifacts

Run directory: `tmp/conversation-improvements/live/taipei-101-fixed-1793697910007`.
Command: `yarn workspace @asyra/asyra-design test:live:taipei-101 --minutes=15`.
App URL: `http://127.0.0.1:3045`; viewport: 1920 x 1080.

- Fixed prompt SHA-256: `25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
- Native thread: `01a1a0ba-2906-7d02-94e8-82db5687e126`.
- Drawing turn: `01a1a0ba-296d-71d1-9387-015d903f5c55`.
- Report turn: `01a1a0c7-1b6f-7b21-bc5c-d53407b41d73`.
- Provider record: `50ea4c28-2cdd-4809-a49e-730a31f0b493.jsonl`.
- Work output payload: `76881-output.json`; report input: `76882-input.json`.
- The drawing model returned a completed outcome; this is distinct from independent
  visual acceptance and durable App settlement.
- Report-entry snapshot: one workspace, six groups, 22,049 vectors and 24 ovals.
- All 29 recorded changed source files matched the pre-live hashes afterward.

The original AI report contains stages, failure/recovery tables, delay explanations,
Knowledge/composition use and prioritized recommendations. It explicitly treats
its delay explanations as operational self-assessment rather than measured
provider/network attribution. It also questions the strength of its final visual
acceptance. These statements remain model claims, not verified recommendations.

The final screenshot was inspected as overview evidence only. The runner retained
work-snapshot and final/detail screenshots, but report timeout was followed by
`page.evaluate: Target page, context or browser has been closed` during artifact
finalization. The final metadata contains no persistence confirmation or completed
reload comparison. Do not claim full report-phase document equality, durable save,
reload verification or successful video export. Service ports 3045/4145/4245 were
clear after cleanup.

## Fix and focused validation

The browser now treats parsed activity as observation. Invalid fields do not
cancel execution; qualified tool names are preserved; progress after the final
result is ignored. Malformed JSON, unknown event kinds, invalid operation/result
frames, explicit backend failures, receipt failures and user cancellation retain
their existing behavior. No execution retry, reconnect or session fallback was added.

Six regression scenarios failed before their corrections. After self-review and
iteration, 41 browser adapter cases, six server/progress/same-thread report cases,
two Inspector checks and 15 naming checks passed. App typecheck, scoped lint and
diff checks passed. No full local test, prompt change, commit or push occurred.

## Remaining limitation

The requested complete original-session report was not delivered because the
report guard interrupted generation, not because progress admission killed the
drawing. The existing five-minute report policy and post-failure artifact-finalization
window require a separate correction before claiming reliable complete-report
collection. The captured partial report must remain labeled incomplete.
