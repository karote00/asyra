# Local Hierarchy Work Verification - November 10, 2026

## Result and scope

The four approved owner steps are implemented. Known-ID grouping no longer
serializes the full scene, move admission checks affected memberships/ancestry,
official Groups retain independent render domains, and UI/region projections
reuse valid derived state. No AI prompt, provider contract, compatibility path,
dependency, release flow or original drawing prompt changed in this task.

This is a replay of retained drawing evidence, not a new AI drawing test. The
original report session remains available. Existing unrelated discovery changes
in the worktree were preserved. Nothing was committed or pushed.

## Who performed the full-tree read

In `taipei-101-fixed-1794244803070`, the agent supplied four exact saved root IDs
to `api_hierarchy_groupElements`. The App forwarded them to Preset. Preset's old
read interface used `sceneTreeSaveData` to prepare the selection and parent order.
That save serialized every element and validated the complete hierarchy. The
SceneTree move then repeated complete hierarchy validation. The agent did not
request this scan; the framework adapter selected it. Older Preset tests expected
the complete save and therefore protected the expensive implementation.

The replacement uses the existing Core `getElementData` API with an
invocation-local read scope. Before-image positions/ancestry are acquired before
the move; after-image reads use a new scope. Old whole-snapshot preparation and
its test expectations are removed. SceneTree local and replay moves share
validation of affected direct memberships and ancestor paths before any write.
Missing nodes, duplicate membership, stale replay and cycles still reject.
Complete save/load validation remains at its own boundary.

## Pixi behavior

The official invisible Group strategy now sets the existing engine-neutral
`transformGroup` property. The Pixi adapter already maps this to `isRenderGroup`.
No Pixi dependency or SDK code changed, and ordinary Graphics/custom containers
are not all promoted to render groups.

Previously, changing a Graphics Group's parent registered the root and every
descendant in the destination render group. Transform propagation also descended
into them. A Group now forms an independent transform domain: the parent receives
the group, while its existing descendants retain their internal registration and
local geometry. Child changes still invalidate the appropriate child normally.

The permanent native Pixi regression uses the original four subtree sizes
6,150 / 9,400 / 1,189 / 8,800 and executes actual SDK reparent/transform methods:

| Measured SDK work | Previous policy | Independent Group domain |
| --- | ---: | ---: |
| Destination render-group `addChild` calls | 25,543 | 4 |
| Descendant `updateLocalTransform` calls | 25,539 | 0 |
| Descendant count and order | Preserved | Preserved |
| Sample world position after compensated reparent | Preserved | Preserved |

These are SDK work counts, not frame counts, GPU draw calls or a timing claim.
Pixi still executes visible render instructions when a frame is requested.
Render-group boundaries can split batches; this is not a texture cache or a
partial-frame redraw implementation. Normal frame rendering, group transform
updates and genuinely edited descendants remain necessary.

## Full recorded-scene proof

Permanent fixture: `apps/asyra-design/test-data/ai-drawing/fixtures/hierarchy-20261110.json.gz`.
Its adjacent JSON records source/document SHA-256 and the four exact IDs. It is
the completed snapshot after 48 ornaments were moved out of the original tower
subtree, not an invented pre-assembly snapshot. All 25,539 drawable elements and
user-authored names are preserved. The four original roots remain siblings.

Permanent browser test: `apps/asyra-design/e2e/hierarchy-recorded-scene.spec.ts`.
It loads the actual scene, groups the exact roots, compares every drawable's
world matrix and native handle, performs undo/redo, then applies the captured
publication through the production publication decoder and Core remote boundary.
It verifies one publication, no remote echo, child/sibling order and final pixels.
This exercises accepted remote replay; it does not claim network transport or
concurrent conflict coverage.

| Recorded grouping result | Value |
| --- | ---: |
| Whole-scene save reads | 0 |
| Changed drawable native handles | 0 / 25,539 |
| Maximum drawable world-matrix difference | 0 |
| UI hierarchy nodes visited | 2 |
| UI membership rows read / replaced | 6 / 6 |
| Unchanged flattened IDs copied | 25,543 |
| Complete flattened output IDs | 25,545 |
| UI transaction flushes | 1 |
| App document publications | 1 |
| Render frames during measured grouping | 1 |
| Remote replay echo publications | 0 |

Copying the immutable ordered ID output is still linear. It is reported
separately from hierarchy discovery and element-data reads. Region queries reuse
exact workspace-relative transforms to avoid remeasuring unchanged descendants;
changed order still invalidates the ordering index. Independently dirty nested
children, insertions, removals and reinsertion remain covered by regression tests.

## Pixel and microscope review

Under the new policy, before/after grouping is byte-identical in the overview
and crown/tier/base detail views. Remote replay is byte-identical in the overview.
Every source/world matrix remains unchanged. Images were inspected at overview
and eight times the fit scale (detail scale approximately 0.106688; 800 by 680
visible viewport, device scale 1).

Adopting the new render domain is not bit-identical to the previous GPU transform
composition. The measured old/new differences are:

| View | Different pixels / 544,000 | Maximum channel difference / 255 |
| --- | ---: | ---: |
| Overview | 25 | 22 |
| Crown | 132 | 43 |
| Tiers | 59 | 43 |
| Base | 83 | 17 |

These sparse edge differences are consistent with floating-point rasterization
when transforms move between batched vertex coordinates and group uniforms;
there is no source-space displacement. The native renderer still evaluates the
same visible instructions. The test retains exact equality for reparenting and
separately bounds policy adoption to fewer than 0.05% changed pixels, mean channel
error below 0.01/255, and maximum difference 64/255. It also requires foreground
content so empty views cannot pass. No image mask or geometry adjustment is used.

Current artifacts live under
`apps/asyra-design/test-results/hierarchy-recorded-scene-r-7c680-ed-replay-with-bounded-work-chromium/`:
`work-counts.json`, `render-policy-pixels.json`, `detail-views.json`,
`recorded-before.png`, `recorded-isolated.png`, `recorded-after.png`,
`recorded-remote.png`, and the baseline/isolated/grouped detail PNGs.

## Review and iteration

- Formal failures first exposed the complete Preset save, unrelated SceneTree
  reads, missing Group transform isolation, UI subtree walks and region bounds
  rereads. The corrected owner tests now pass.
- The recorded scene exposed a further upstream handoff: file load published UI
  maps/order but did not retain their reusable preparation. Load now derives both
  publications and parent/order/subtree-size preparation from the same loaded
  rows. The old test expecting two saves of each leaf now expects one. This
  fixes the first edit after load, not only subsequent warm edits.
- The first fixture transfer exceeded Chromium's 100 MiB protocol response
  capacity. The permanent fixture is now gzip-streamed and decoded in the browser;
  no scene geometry or detail was removed.
- Publication evidence must be read before its capture is disposed. The test now
  retains that evidence before cleanup and uses the real publication processor.
- The first screenshot oracle included the Layers UI over the full-screen canvas.
  Grouping correctly changes that UI. The test now captures the visible drawing
  viewport and separately checks canonical/UI order.
- Microscope capture initially used rectangle field names for a min/max bounds
  value. Visual inspection caught the blank views. The test now uses the actual
  bounds contract, records view metadata and rejects empty captures.

## Focused validation

| Formal test file / gate | Result |
| --- | --- |
| Preset Group operations | 22 passed |
| Preset Group bounds | 4 passed |
| Preset selection subscriptions | 38 passed |
| Core hierarchy transactions | 26 passed |
| SceneTree hierarchy operations | 25 passed |
| Render region queries | 9 passed |
| Render owner tests | 53 passed |
| Render scene-tree store | 76 passed |
| Native Pixi batch partitions / reparent work | 3 passed |
| Group/hierarchy Inspector contract | 12 passed |
| Recorded-scene Playwright scenario | 1 passed |
| Naming gate | 15 passed |
| Preset / Render / SceneTree production type checks | Passed |
| Changed-file ESLint and whitespace diff check | Passed |

The extra standalone E2E TypeScript probe reports 16 existing errors in
`e2e/test-utils.ts` (untyped computed properties and private history fields).
It reports no error in the new scenario. That helper was not changed or covered
up; the Playwright scenario compiles and runs successfully. The normal production
owner checks above pass. No full local suite, CI or release check was run.

Reproduce the recorded-scene scenario against owned App/backend/collaboration
services with `APP_URL`, `E2E_DOCUMENT_BACKEND_URL` and `COLLABORATION_WS_PORT` set:

```sh
yarn workspace @asyra/asyra-design exec playwright test \
  e2e/hierarchy-recorded-scene.spec.ts --workers=1 --max-failures=1 --reporter=line
```

## Remaining costs and limits

Full import/save validation, explicit subtree lifecycle operations, immutable ID
array materialization, ordering-index rebuild after membership changes, ordinary
frame drawing and changed-geometry work are still real costs. This task removes
unnecessary whole-scene preparation and descendant render-domain migration; it
does not promise every hierarchy-related operation is constant time. The
original grouping took about 155.726 ms, so these changes cannot explain or
eliminate model waits measured in tens of seconds. No AI planning requirement was
added to shift responsibility for tool-owned work onto the model.

## Follow-up Review - Child Updates and Invalidation

The follow-up reviewed the same owner changes and their direct consumers. It
added formal verification only; no further production behavior changed. Existing
search/provider work remains outside this review.

The native Pixi test now follows a compensated reparent with an actual child
position, alpha and visibility change. The changed child's local transform is
updated once; its untouched sibling is not updated. Child order and restored
visibility remain correct. A later parent position/alpha change updates the
independent group's world transform/alpha while both child local transforms
remain reusable and their world positions still change correctly.

The retained region-index test now compares each result with a freshly built
index across a sequence of nested reparenting, child edits, same-turn reorder,
authored geometry/dimension scaling, hiding/restoring, removal/reinsertion and
parent destruction after extracting its children. Existing coverage additionally
checks independent dirty descendants under a world-stable ancestor, runtime
retirement and translated workspaces. Matrix equality does not clear independent
child dirty state; membership ordering and ancestor-derived bounds are separate
invalidations.

The new browser scenario `e2e/hierarchy-projection-updates.spec.ts` creates
nested Groups with overlapping colored rectangles. Through production App/Core
APIs it reparents a populated Group, changes one child's position, width and
fill, reorders it, and hides its parent. It checks actual interior pixel colors,
region queries, native-handle identity, parent identity and flattened UI order.
Width is checked in the newly covered overlap area, not only an unchanged pixel.
Every undo and redo is compared byte-for-byte with its corresponding rendered
state and exact query/UI results. Four captured publications are replayed through
the production decoder/apply path **one at a time**, with the same checks after
each publication and zero outgoing echo. Checking only the final hidden state
would not detect missing intermediate geometry/style updates and is deliberately
insufficient here.

Current follow-up results: 4 native Pixi cases, 10 region-query cases and both
browser scenarios pass. The full retained 25,539-element scene remains green.
The changed tests pass ESLint and naming checks. The standalone browser-test type
probe still reports only the same 16 pre-existing shared `e2e/test-utils.ts`
errors documented above; none is in the new test. The first small-scene run used
an incorrect hardcoded background channel value (19 instead of the observed 20);
the oracle now compares against an untouched background pixel from the same
baseline, preserving exact foreground-color and pixel-equality checks.

Artifacts for the small scene are in
`apps/asyra-design/test-results/hierarchy-projection-updat-54c89-y-history-and-remote-replay-chromium/`:
`projection-review.json`, the initial/reparented/edited/reordered/hidden PNGs,
per-step undo/redo PNGs, and `remote-0.png` through `remote-3.png`.

No stale child update, painter-order or accepted replay defect was reproduced.
This does not prove every concurrency/transport case, and render-group boundaries
still prevent batching across those boundaries. In a document with many tiny
Groups, fewer reparent visits do not by themselves establish fewer GPU draw calls
or a faster whole frame. No additional caching or mandatory grouping heuristic
was introduced to address an unmeasured case.

The historical reason is bounded by available evidence: the existing native
partitioner explicitly bypasses Graphics/Mesh and its documented objective is
camera-motion/batch invalidation. Design Groups use Graphics, so that optimization
does not create their independent render domains. Existing tests established
identity and output but did not count this SDK descendant work. The code/history
does not establish that this specific Group-domain solution was previously
benchmarked and rejected; the present change connects the existing neutral
capability at the semantic Group owner.


## Small-Group Performance Follow-up

The subsequent [controlled browser benchmark](group-render-domain-benchmark-2026-11-10.md)
reopens render-policy performance acceptance. Ordinary frames with 1,000 small
vector Groups become slower in two independent ABBA runs. Draw counts stay
constant, but matrix uploads rise from 2 to 2,000. Earlier large-subtree work
savings and correctness evidence remain valid; they do not prove the policy
improves all scene workloads. No production optimization was changed during
that measurement task.
