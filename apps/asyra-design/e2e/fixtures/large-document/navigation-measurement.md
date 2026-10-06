# Local continuous navigation measurement

The original ZIP is the only committed full-document copy:
`apps/asyra-design/e2e/fixtures/large-document/Taipei-101-full-document.zip`.
The duplicate `document.json.gz` is ignored by Git. Before the first local run,
prepare it from that archive at the repository root:

```sh
unzip -p apps/asyra-design/e2e/fixtures/large-document/Taipei-101-full-document.zip document.json | gzip > apps/asyra-design/e2e/fixtures/large-document/document.json.gz
```

The loader checks the decompressed document against `manifest.json` before use.
Run from the repository root. Use unused ports; this configuration refuses to
reuse a running server. The original document and review site are not modified.

```sh
APP_URL=http://127.0.0.1:3340 \
COLLABORATION_WS_PORT=4141 \
E2E_DOCUMENT_BACKEND_URL=http://127.0.0.1:4241 \
yarn workspace @asyra/asyra-design playwright test \
  --config playwright.navigation-local.config.ts \
  --output ../../tmp/navigation-performance/continuous-local
```

The dedicated configuration runs headlessly and serially at DPR 1 and DPR 2.
It is excluded from ordinary test discovery and refuses to load in CI. No FPS,
frame-time or elapsed-time success threshold is used. Assertions check that
real input reaches the app, pans a substantial distance, zooms by more than 2x,
and does not publish document changes. Functional and work-count CI tests remain
separate.

Each case loads the full saved 18,287-element document, fits it before each
measurement, and records an idle baseline followed by continuous pan and zoom.
The input source offers 300 native browser wheel events over five seconds,
first moving in one direction and then reversing. The pan path is 300 CSS pixels
horizontally and 150 vertically before reversing. Zoom uses the app's ordinary
Meta-wheel feature. Browser event coalescing is recorded, not assumed away.

`continuous-navigation.json` contains raw input timestamps, camera samples,
WebGL work counters, long tasks and summaries. Compare the idle callback cadence
with active callback cadence, frames with WebGL submissions, and camera changes.
rAF callbacks and WebGL submissions are not measurements of physical display
presentation. A 60 Hz callback stream alone does not establish 60 FPS navigation.
Keep offered and delivered event counts with every result.

For a separate CPU diagnostic, add `NAVIGATION_CPU_PROFILE=true` and choose a
new output directory. Profiles cover only the interaction measurement; fixture
loading and document serialization are excluded. Profiled timing must not be
compared as if it were the unprofiled baseline. Recording video and Playwright
traces are disabled for this measurement because they add overhead.

The existing `large-document-navigation.spec.ts` remains the opt-in correctness,
document-preservation and native-detail visual milestone. Its two-rAF settle
samples are not FPS evidence.
