# Live playback 200 mm first-contact evidence

This stable evidence bundle was exported from the passing Playwright run recorded at 2026-09-29T08:46:21.494Z. The browser report and test-results output may be replaced by later test runs; this directory is outside both generated-output locations.

The E2E uses the built-in synthetic six-axis “Tool and table collision” example. It selects r1, sets minimum clearance to 200 mm, and verifies the resulting r2 at exact times 3.904, 3.920, and 4.000 seconds.

At 4.000 seconds, request 6 used 500 ms and completed 36/46 pairs before its 500 ms deadline, leaving 10 unchecked. Request 7 continued the same target on the same Worker and completed 46/46 pairs in 371 ms. The final Preview feedback was collision, the displayed pose matched 4.000 seconds, and the run created one live Worker.

## Scheduling and continuation limits

This bundle records the prior multi-target run and its trace; its sequence starts at 3.904 seconds and does not represent a cold first seek. The formal cold-first regression now opens Preview and seeks directly to 4.000 seconds, requiring collision feedback and a matching pose.

The live contract continues an unchanged exact target only when the accepted sample materially gains validated evidence and the original aggregate evaluation budget has capacity. Each attempt keeps the 500 ms per-sample work window and reuses complete pair proofs. If an attempt adds no accepted evidence or the aggregate evaluation budget is exhausted, the runner retains incomplete evidence and unresolved pairs remain unknown. A newer target supersedes pending continuation.

A foreground target arriving during an optional interval waits for that interval to settle on a usable Worker. The method window is at most 500 ms and the runner response watchdog is 500 ms plus 250 ms grace; the existing sample pacing can add up to 50 ms before dispatch. If the interval Worker fails the watchdog, the runner retires it and the replacement Worker has a 10 s startup watchdog. These are code-level timers, not hard real-time promises if the browser event loop is stalled. The pose update does not wait: `LivePlayback.sample` sets the target pose and projects the Preview immediately while the last checked feedback retains its own checked time.

- [Full worker and runner diagnostics](./diagnostics.json)
- [Preview screenshot at 4.000 seconds](./preview-4s.png)
- Formal regression: [mixed-pair-feedback.spec.ts](../../e2e/__tests__/mixed-pair-feedback.spec.ts)
