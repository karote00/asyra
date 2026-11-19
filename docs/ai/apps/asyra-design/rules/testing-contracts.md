# Rule: Testing Contracts

## E2E Selector Contract

Keep these stable where possible:

- `data-testid="toolbar"`
- `data-testid="contents-panel"`
- `data-testid="properties-panel"`
- `data-testid="tool-select|tool-rectangle|tool-oval|tool-pen"`
- `data-testid="zoom-level"`

## State Exposure Contract

- Tool active state should remain readable via `data-active` attributes on tool buttons.
- Content items should expose stable row selectors (`data-layer-element`).

## Behavior Contract

Rectangle creation helpers must acknowledge the real handoff before returning:
the requested tool is active before pointer input, a new rectangle is the single
canonical selection, the creation transaction is idle, the product has restored
Select, and the position controls are visible. Fixed sleeps and a compensating
Select shortcut are not completion evidence. Use bounded state assertions; never
retry a creation mutation to satisfy a wait. Keep delayed-queue and rejected-input
counterexamples in `e2e/rectangle-handoff.spec.ts`, using the real App runtime.
An ordinary failure must retain input/tool/identity observations so a missing
mutation is distinguishable from an incomplete display update.

Behavior coverage source-of-truth:

- `docs/ai/apps/asyra-design/bdd-features/README.md`

## Test Suite Partitioning Contract

Tests must be grouped by behavior contract and scenario family, not by
accidental implementation file size.

Rules:

- Do not let one test file accumulate dozens or hundreds of unrelated small
  cases.
- Split tests when a file mixes distinct scenario families, runtime paths, or
  performance budgets.
- A passing test name must make the verified behavior clear without requiring a
  second investigation pass.
- Long-running tests must be isolated into narrowly named files or describe
  blocks so the slow contract is identifiable from the command output.
- Regression tests must name the scenario family they protect; historical issue
  names alone are not enough.
- When a test batch takes too long to report progress, split the batch before
  continuing broader verification.

Done means the command output itself explains what passed: the feature area,
the scenario family, and the contract under test must be visible in file names,
describe names, or test names.

## Offline native-client evidence

The server-response harness must exercise App discovery, paging, recovery and
image-content construction without an installed AI client. Native successor-request
and native unfinished-output observation tests are additional protocol evidence:
set `NATIVE_DELIVERY_CODEX` to an absolute executable path matching
`scripts/native-client-admission.mjs` (`codex-cli 0.160.0`) to enable them.
The fixture validates once before allocating listeners or directories. These tests
use the existing loopback scripted provider,
not a real model. An explicitly configured missing or wrong-version executable
fails; do not silently skip it or simulate native success. Without that setting,
the runner reports these native-only cases as skipped. This does not establish
native delivery correctness; run the same cases with the configured executable
for changes to that handoff. Complete `verify:conversation` rejects missing native
configuration before running gates; `--list` remains available without a client.
The admitted path is shared by native fixtures and the browser provider protocol.
App contract and pixel assertions remain mandatory.

Large saved-input tests retain their complete inputs and correctness assertions.
Separate preparation, equivalence and repeated timing measurements into bounded
cases while preserving their existing guards and sample counts. Test doubles
should mirror indexed owner lookup instead of adding quadratic array searches.
