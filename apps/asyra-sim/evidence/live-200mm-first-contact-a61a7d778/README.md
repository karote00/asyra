# Live playback 200 mm first-contact evidence

This stable evidence bundle was exported from the passing Playwright run recorded at 2026-09-29T08:46:21.494Z. The browser report and test-results output may be replaced by later test runs; this directory is outside both generated-output locations.

The E2E uses the built-in synthetic six-axis “Tool and table collision” example. It selects r1, sets minimum clearance to 200 mm, and verifies the resulting r2 at exact times 3.904, 3.920, and 4.000 seconds.

At 4.000 seconds, request 6 used 500 ms and completed 36/46 pairs before its 500 ms deadline, leaving 10 unchecked. Request 7 continued the same target on the same Worker and completed 46/46 pairs in 371 ms. The final Preview feedback was collision, the displayed pose matched 4.000 seconds, and the run created one live Worker.

## Scheduling and continuation limits

The existing live contract requires one in-flight foreground check, latest-only pending time, a 500 ms per-sample work window, and unknown coverage after incomplete work. It does not prescribe a continuation count. This change applies a global cap of two additional attempts to every unchanged latest exact target; it is not keyed to this example or its time. The observed 200 mm case needed one continuation. The second is one bounded retry margin: at most three slices, or 1,500 ms of Worker execution per unchanged target. Each slice reuses accepted complete pair evidence and checks only missing pairs.

If all three slices still leave missing pairs, the runner stops automatically retrying. It retains the incomplete exact sample and its accepted pair evidence; unresolved pairs remain unknown. A validated finding may still be shown at its exact witness, but missing coverage is never converted to clear. A newer target replaces the pending one. A user-issued discontinuous seek can start a fresh bounded sequence for that target.

A foreground target arriving during an optional interval waits for that interval to settle on a usable Worker. The method window is at most 500 ms and the runner response watchdog is 500 ms plus 250 ms grace; the existing sample pacing can add up to 50 ms before dispatch. If the interval Worker fails the watchdog, the runner retires it and the replacement Worker has a 10 s startup watchdog. These are code-level timers, not hard real-time promises if the browser event loop is stalled. The pose update does not wait: `LivePlayback.sample` sets the target pose and projects the Preview immediately while the last checked feedback retains its own checked time.

- [Full worker and runner diagnostics](./diagnostics.json)
- [Preview screenshot at 4.000 seconds](./preview-4s.png)
- Formal regression: [mixed-pair-feedback.spec.ts](../../e2e/__tests__/mixed-pair-feedback.spec.ts)
