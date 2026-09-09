# Asyra Sim

A local experiment workbench built on Asyra. The initial domain is a single
robot workcell: geometric interference and clearance, not equipment control or
industrial safety certification.

**Development checkpoint, not R0.** The current workbench can edit a synthetic
six-axis model with complete original parts, navigate in 3D, Undo/Redo, and automatically
persist and reopen local projects. The experiment panel accepts explicitly mapped
trajectories, runs preflight and isolated continuous-time analysis, and replays
frozen evidence. Completed runs are retained automatically, and can be compared, exported, and reopened
with portable projects. Independent A/B/C workcells can be duplicated and compared.
Restricted GLB parts can be previewed, attached, edited, and preserved with
historical runs. Run-linked field observations and opaque attachments preserve
real-world feedback separately from immutable evidence. Independent distribution
and validation remain under development. Do not use this
checkpoint to approve production operations.

**One supplied geometry for display and analysis.** The original-part method
uses every accepted source triangle, including holes and small features, with
static solid containment and bounded continuous joint-space queries. Conservative
bounding structures accelerate proof without replacing geometry. Unsupported
topology or missing sources block analysis; uncertain predicates and exhausted
budgets remain unresolved. New version-2 runs retain full geometry and source
provenance. Old proxy evidence keeps its original meaning. This is local software
verification, not independent numerical certification or manufacturer CAD accuracy.
See the [original-part contract](../../docs/ai/apps/asyra-sim/specs/original-part-method-v1.md).

## Local development

Use the repository's declared Node.js 24 and Yarn 4.3.1 environment. Set
`APP_URL` in this App's `.env` from `.env.example`, or explicitly export it,
before starting a dev or preview server or running browser tests. These use
the same local origin; there is no parallel test URL. Static production builds
do not require `.env` or `APP_URL` and retain relative asset URLs. For deployment
verification only, the browser runner also accepts an explicit HTTPS `APP_URL`
without starting a local server.

From the repository root:

```sh
yarn workspace @asyra/asyra-sim dev
yarn workspace @asyra/asyra-sim test:local
yarn workspace @asyra/asyra-sim typecheck
yarn workspace @asyra/asyra-sim lint
yarn turbo run react:build --filter=@asyra/asyra-sim
yarn workspace @asyra/asyra-sim test:e2e
```

Build the workspace dependencies before starting a clean checkout. Browser
tests use an existing Google Chrome installation and one worker, with browser
temporary files inside this App's `.artifacts/`. They do not install browsers.
The current visual suite uses SwiftShader for reproducible WebGL evidence;
this is not a hardware-GPU performance certification. Screenshots and traces
are written to `test-results/` and are not committed. The JSON report at
`.artifacts/browser-report.json` retains successful numerical, Worker, and
visual-state metadata. Browser proofs complement rather than replace complete
product E2E. See the [initial runtime profile](../../docs/ai/apps/asyra-sim/specs/runtime-profile-v0.md)
for the unverified ordinary-hardware target and delivery limits.

## Hosted development workbench

The permanent product domain is
<a href="https://asyra-sim.vercel.app" target="_blank" rel="noopener noreferrer">asyra-sim.vercel.app</a>.
It names the evolving product, not this milestone or an R0 release. See the
[hosted deployment contract](../../docs/ai/apps/asyra-sim/release/HOSTED_PREVIEW.md)
for Vercel configuration, PR verification and the release boundary.

Analysis and project storage remain browser-local. Hosted access downloads the
app; it is not the packaged offline distribution. Localhost, PR previews and
the permanent domain have separate browser storage. Transfer projects through
portable export/import and keep backups; changing the URL does not move saves.

## UI development boundaries

UI folders follow Sim responsibilities: shell, runtime, objects, experiments,
imports, results, observations, projects, viewport, and shared controls. Views
use Tailwind; `ui/styles/` contains only its entry/base and theme tokens.
Controllers own asynchronous UI orchestration and call existing Features.
Pure helpers and formal tests live with the relevant slice. Do not copy
Design's 2D or server architecture, create a parallel editable model, or split
files without checking the actual update boundary. Keep logical TSX sections
spaced and long utility lists wrapped for human review.

See the [App architecture](../../docs/ai/apps/asyra-sim/ARCHITECTURE.md#3-source-organization)
for the owner map and render-boundary contracts.

## Local projects

Valid completed edits and Undo/Redo persist automatically in browser-local IndexedDB.
Use **Projects** to rename the current project, **Copy project** to create a separate
project before making independent edits, or open another project. The URL preserves
the current project identity across reload. Clearing site data removes projects;
use **Export project** for a portable backup. Only acknowledged writes report Saved.
Failures remain visible and retryable. Pending changes are flushed before replacement.
Opening starts a fresh App/Core lifetime with empty Undo/Redo and reset selection/camera.
Invalid targets preserve the current document; failure after runtime retirement
provides a detached recovery download. Load-review diagnostics remain visible.

**Choose project file** validates and previews a portable file before replacement
acceptance. Accepted imports persist automatically under a new identity. They do
not overwrite another project. Portable projects include retained runs and original
sources, but no private method binaries. Invalid historical evidence is rejected
before the current runtime retires.

## Experiments

Choose **Experiments** to configure a saved study or create a new one. Expand
**Analysis scope** to select primary and influencing bodies and describe any
excluded pairs. Edit clearance thresholds and time ranges, or preview a CSV or
versioned JSON trajectory before accepting it into the draft. External CSV files
require an explicit time unit and each joint's angle or length unit, even when
suggested columns and values appear valid. App-generated CSV has known canonical
units; strict JSON keeps its declared units. Editing the current text retains
existing units without an additional notice or confirmation.
Review the source fields, units and first/middle/last values against their
canonical conversions before acceptance. The scrollable review shares the
validated result with **Apply**, which commits the trajectory through one Feature
transaction and automatically persists it. Source,
mapping, unit or workcell changes invalidate it; Discard preview makes no edit.
Other valid study fields apply when editing completes (blur or Enter), with one Undo
action per edit. Incomplete numerical text stays in the field. CSV accepts up to 8 MiB and JSON
up to 1 MiB; both require 1–2,000 keyframes. CSV parsing stops at 256 columns or
2,000 data rows. Selecting another file invalidates the previous preview
immediately, including when the new file cannot be read. Complete edits before
**Run analysis**; invalid current inputs remain saveable but cannot execute.

Expand **GLB original part**, choose a self-contained static GLB, and verify its
dimensions, source units, digest, and appearance limitations. Select the target
body, set a body-local position/rotation and positive scale, then choose **Preview
placement in 3D**. Only **Accept original part** creates an undoable binding.
Cancellation, another source, leaving the import panel, or changed workcell inputs
invalidates the transient preview. Accepted references can be adjusted or removed
under the selected object's **Original parts**; each completed field updates
directly. The viewport's **Wireframe** switch shows the same original triangles.
Acceptance retires previous primitive shapes in one Undo action. Removing the
last source leaves an empty body; it does not revive a simplified substitute.
Formal solid analysis requires closed, consistently oriented manifold components;
open surfaces may be displayed but block **Run analysis** during its automatic
preflight admission, before Worker allocation and again at Worker entry.
Sources above 8 MiB require explicit memory-warning acknowledgement before
placement preview and acceptance. Another source resets that acknowledgement;
hard byte, geometry and instance limits cannot be overridden.

Native projects include original sources referenced by current candidates or
retained runs. Removing today's visual does not remove a historical run's source.
Every source is decoded and its digest verified before document replacement
pauses the current runtime. Missing, corrupted or unsupported sources reject the
replacement; historical-only references still render after a successful reopen.

New studies use the published 100,000-interval / 30-second budget. Existing saved
studies keep their explicit settings; updating the App does not rewrite them.

**Play**, **Pause**, and **Restart** animate the saved trajectory at real-time
speed without editing joint values or adding history. **Edit pose** returns to
the canonical pose. Playback stops at the interval end and on draft/model,
candidate, document, panel or browser-visibility changes. It owns one cancellable
browser frame callback, never an always-on renderer loop. Preview is not analysis.

The sun/moon icon in the header switches between light and dark mode. The first
visit follows the system preference; an explicit choice is remembered locally
when browser storage permits. Theme changes never edit documents or history.

New examples include original detailed mechanical main-body GLB assets: housings,
joint covers, flanges, fasteners, table legs and gripper. All supplied triangles
participate when their body is selected for analysis. These are
synthetic, uncalibrated parts, not vendor CAD. See [sample provenance](samples/README.md).

The sampled pose slider changes only the view. Formal analysis freezes inputs,
runs in an owned Worker, and separates execution, coverage, findings, bounds,
and the rule verdict. Partial or cancelled results retain their unknowns.
While a run is active, its progress card shows validated received pair records,
evaluated intervals, retained evidence leaves, and the frozen wall-time budget.
Use **Cancel analysis** directly in that card. These counts are not a safety
conclusion or an estimated time to completion. Worker startup counts against the
deadline; cancellation permits at most 250 ms of cooperative grace before owned
Worker termination. Contradictory terminal evidence fails without replacing
previously validated findings.
Replay consumes the run's frozen model and trajectory, including after edits.
Terminal results are retained automatically through one Undo action and persisted
with the project. Partial or cancelled records keep their explicit status. If
retention fails, the same immutable result remains available for **Retry retention**;
unretained evidence is excluded from portable exports and replacement warns before
losing it. Undoing retention does not automatically reapply it.

Admission enforces 16 colliders per body, 256 per workcell, 4,096 expanded pairs,
and 500,000 pair/segment combinations in the requested interval. Larger scopes
cannot bypass hard limits through acknowledgement. Retained evidence is capped
globally, including partial progress; reaching a resource limit never means clear.
GLB preview rejects files above 16 MiB before reading and terminates decoding
after its five-second deadline. See the runtime profile for remaining validation
targets; these input caps are not a total-memory guarantee.

## Understandable workflow review

**Setup** contains authored inputs, scope, trajectory and clearance requirements.
**Advanced settings** holds the unchanged method, precision and budgets.
**Preview** contains sampled playback/time and feedback; leaving it stops its
owned playback. **Results** contains the formal verdict, execution, coverage,
evidence and replay. Use arrow keys, Home and End within the tab list. Tabs keep
unfinished text and completed edits; navigation alone creates no Undo action.
The entire experiment panel scrolls together, including candidate/experiment
context, Run/cancel/progress, tabs and content. Run stays near the experiment
selector in document order; there is no fixed footer. Preflight remains below
the tabs so completing an edit does not move a tab during activation.
Trajectory CSV mapping uses name, target CSV column and unit columns without a
visible heading row. Time and each joint occupy one row; longer names wrap. Minimum
clearance uses an inline label/input. Keyboard field names and completed-edit
semantics are unchanged.
Object inspection remains available by selecting a body or choosing **Object**.

Press **Run analysis** once. Current-input preflight runs automatically. Errors
remain visible with **Review input** or a blocker-specific review action that
opens Setup and the relevant field/section. Required assumptions and resource
warnings still need acknowledgement; changed inputs invalidate admission and
resource acknowledgements. Successful preflight without warnings becomes an
expandable resource summary after execution, preserving narrow-screen reading space.

Completion offers **View results** without switching tabs or taking editor focus.
Read verdict, execution and coverage separately: partial/unknown does not pass.
Finding/unresolved pairs appear first; **Show all pairs** and pagination expose
every original record. Missing-evidence pairs are explicitly listed. Replay keeps
Results and the selected evidence open while changing the central scene/time.
**Historical run replay** uses frozen inputs; **Return to current preview** leaves
that history view. Changed authored inputs mark old results as historical and
expose **Rerun analysis with current inputs** through the same admission action.
**Browse run history** opens the existing history library; comparison is unchanged.

Results distinguish **Saving to this project**, **Saved to this project** only
after the existing storage session acknowledges, and **Saving failed** with
**Retry saving**. A failed canonical retention has **Retry retention** instead.
Retry uses the original owner and preserves snapshot, method, sources and findings.

To review this milestone in the ordinary App:

1. Open Experiments and select **Tool and table collision** (revision depends on
   existing edits). In Setup set Start time to **3.8**, End time to **4.2**, and
   leave clearance at **20 mm**. Complete each field with Enter.
2. Press Run analysis, then keep editing/focus in Setup. Completion must not
   switch tabs. Choose View results: expect **Issue found**, **does not meet**,
   **completed**, **complete**, and two finding pairs among 46 total records.
3. Expand **gripper - fixture table**, choose Replay pair, and expect historical
   time **3.8000 s** with the selected pair still open in Results. Show all pairs
   to inspect all 46 identities. Return to current preview restores current inputs.
4. Change minimum clearance to **30 mm**, complete the edit, and return to Results.
   Expect **Historical inputs differ** and rerun. Undo/Redo restores the old/new
   input and freshness state. Wait for Saved locally, refresh, and select the same
   experiment to verify the authored value survived.
5. In Setup expand Trajectory input and replace the final CSV joint value with
   **100**. Complete the edit, press Run analysis: a persistent error must block
   execution. Review input focuses the source. Undo restores the valid source.
   Changing Time unit to its empty choice similarly persists and focuses that unit.
6. Review at **576x690**, **600x960** and desktop. Scroll within the experiment
   panel: its heading and Run must move with content while the scene stays put. Scroll Results to inspect verdict,
   pair details, historical return and saving status; Run remains reachable.
   **Synthetic clearance study** demonstrates a complete no-issue result. Cancel
   a run to inspect explicit partial cancellation. Worker/storage fault and
   timeout proofs are permanent E2E cases, not alternative product controls.

Browser gates must use the same explicit APP_URL as the running service. Put
trace outputs outside the App's watched root, for example
`--output=../../.artifacts/m3-5-review`, to avoid Vite reloading on generated HTML.

## Installed methods and trust

The method selector lists the trusted modules compiled into this local deployment.
The **Original-part continuous clearance** method supports complete source meshes
and native boxes, spheres and capsules. New detailed-example studies select it
explicitly. The historical continuous primitive method keeps its identity for
old evidence and genuinely native primitive studies; it rejects meshes. The
independent analytical sphere example supports one static keyframe and sphere
pairs only; it is not a replacement for the continuous method. **Method capabilities
and trust** shows origin, units, bounds, limits, declared validation and services.
Registration is not numerical validation or a safety endorsement.

Select a method and review its parameter defaults. Completed valid parameter
edits apply automatically. Switching methods resets method-specific parameters, not historical
results. The sphere example's `additionalError` widens its distance bounds; it
does not estimate measurement error or improve accuracy. Numerical uncertainty
and unsupported inputs remain visible. A new empty-workcell draft may still have
an empty scope after bodies are added: explicitly select primary/influencing
roles and the pair policy, or start **New experiment** from the completed model.

Results retain the method declaration used for that snapshot. A missing module
blocks only dependent execution; its existing results remain readable and
exportable. Project files cannot install executable code. Private developers
configure reviewed modules before building/starting the App, using the
[local extension guide](../../docs/ai/apps/asyra-sim/specs/extensions-sdk-v0.md).
No hot swapping, plugin marketplace or untrusted-code sandbox is provided.

## Your acceptance rules

Open **User acceptance rules** in Experiments to add minimum-clearance or
penetration-evidence conditions and combine them with nested AND/OR groups.
Thresholds are shown in millimeters; stored inputs use meters. Groups allow
two to eight children, up to four levels and 31 total nodes. Use **Create
experiment** for a new study; completed edits to existing studies apply
automatically, with one Undo action per edit. **Use baseline verdict only** removes the optional expression.

The ordinary minimum-clearance field still controls the method's baseline
finding/refinement threshold. Extra conditions do not silently retune the solver.
Insufficient bounds remain unknown. Conditions apply to the full selected pair
scope; use separate experiments for different scopes. Arbitrary scripts, force
metrics and per-condition pair selectors are not provided.

Results show the original method summary, the separate **User** verdict and
each retained condition's truth value and reason. For example, a study deliberately
requiring penetration can meet your condition while still showing **Issue found**.
This never means equipment is safe to operate. Incomplete execution or coverage
prevents a successful user verdict even when an OR branch is true. Changing
conditions creates new rule/run provenance, and comparisons disclose the change.
JSON, CSV and HTML exports preserve the same evaluation without recomputing it.
See the [typed acceptance contract](../../docs/ai/apps/asyra-sim/specs/decision-rules-v0.md).

## Retained evidence and comparison

Fresh startup includes six experiments: the original base-yaw clearance study,
shoulder reach, elbow folding, wrist orientation, a local tool/table sweep, and
a deliberate tool/table collision.
Choose one from **Experiment** after opening **Experiments**, then use **Preview**
for sampled playback or **Run analysis** for formal evidence. Each has an independent
eight-second trajectory and explicit scope. Current starter studies retain the
complete modeled workcell scope; inspect the saved scope of an existing project. The collision study
demonstrates **Issue found** and **does not meet** with a replayable penetration
witness at 4 s, calculated from unchanged original parts. Existing saved projects
retain their own experiments unchanged. See the [sample catalog](samples/README.md).

The two top toolbars use icon-only buttons with 24 x 24 px SVGs and 36 x 36 px
click targets. Hover titles and accessible names identify each action, including
Undo/Redo shortcuts. There is no development badge beside the logo. The folder
icon (**Projects**) opens local project management for saving, saving copies,
opening stored projects, and importing/exporting project files. These saves are
private to the current browser origin, not cloud backups; clearing site data
removes them. Dialog and side-panel actions retain their text labels.

Use **Duplicate candidate** beneath the candidate selector to copy committed model
and experiment inputs into an independently editable workcell. Enter a name for B
or C. Copies get new canonical identities, remap all references, and preserve
explicit body correspondence for comparison. Historical runs and unsaved drafts
are not copied. Each complete duplication is one Undo action. Numeric property
fields commit on Enter or blur, without an **Apply changes** button. Object name
and color fields use the same completion convention; selects and checkboxes
update directly. Each changed field is one Undo action. Escape discards the
active input; rejected values restore the canonical value. Mount and original
part rotation fields also update without a separate Set button. Unit choices,
focus and expanded sections survive ordinary edits and Undo/Redo. These Object
controls do not change explicit experiment saving or import acceptance.

Navigate with left or middle drag to orbit, **Shift + middle drag** to pan
(Blender convention), or **Shift + left drag**. **Two-finger vertical scrolling**,
**mouse wheel scrolling** and **pinch** all zoom about the current camera target.
Horizontal scrolling does not pan. There is no Trackpad / Mouse mode switch;
previously saved input preferences no longer affect navigation.
Camera navigation updates only the camera, not model or result projections.
Playback reuses complete local geometry and updates shared domain poses; it
does not simplify parts or add Undo history. The ordinary navigation/playback
CPU profile can be reproduced with
`yarn workspace @asyra/asyra-sim test:e2e e2e/__tests__/navigation-performance.spec.ts`.
Reports and screenshots are written to the App's `.artifacts/browser-report.json`
and `test-results/`. Test-renderer timings are not a hardware-independent FPS
promise; formal unit tests additionally enforce the work-count boundaries.
An unmodified left click selects. **⌘1** / **Ctrl+1** or **Fit all**
centers all visible parts in the current pose, keeps the viewing angle and
leaves at least 32 px around them inside the viewport. Grid/floor decorations
are excluded. **Reset view** restores the default camera. These view operations
do not change model data or Undo history.

Use **⌘Z** / **⌘⇧Z** on macOS, or **Ctrl+Z** / **Ctrl+Shift+Z**, for model
Undo/Redo. These shortcuts use the same history as the toolbar buttons. While
an input, textarea, select or editable text area has focus, native field editing
keeps its own shortcuts. Press Enter or Escape to leave an Object input before
undoing a model action. Holding the shortcut does not replay multiple actions.

**Runs & compare** lists temporary and retained results across the current project.
Inspect a run, export JSON/CSV/self-contained HTML, replay its frozen geometry, or
select its source candidate. Missing method modules do not prevent reading history;
they do block reruns. The UI pages large evidence collections without truncating
the saved or exported records.

Select two or three run checkboxes to compare their execution, findings, unknowns,
scope, method, rule and input differences. Incompatible settings are disclosed as
not directly comparable. No automatic winner is chosen. Changed current inputs do
not rewrite earlier evidence, including cancelled and partial results.
Comparison uses recorded body origins across A/B/C copies, not name matching;
changes to geometry and parameters still appear. Original identities and lineage
are retained in reports. Pair labels use the frozen model's names, with raw IDs
available in the expanded evidence.

### M4 hands-on review

Use a separate local project or a copy of your current project for this review.
Do not clear browser data. In the starter workcell, choose **A - Baseline
workcell**, open **Experiments**, select **Synthetic clearance study - r1**,
and leave minimum clearance at **20 mm** and the interval at **0–8 s**.

1. Run analysis and open **Results**. Wait for **Saved to this project**;
   execution completion and durable saving are separate states.
2. Duplicate A as **B - fixture revision**. Select **fixture post** in the
   hierarchy; set **Mount position (m) X** to **-0.6** and press Enter.
   Run the copied Synthetic clearance study and wait for saving.
3. Duplicate B as **C - further revision**. Set its fixture post X to
   **-0.45**, then run and wait for saving. A remains at **-0.75**.
   Copies have independent identities; copying does not copy or create runs.
4. Open **Runs & compare** and check C, B, then A. **Selected comparison runs**
   assigns slots 1, 2 and 3 in that order. Remove a slot to compare two, or
   reselect it to append it. Click **Compare selected runs** explicitly.
   Expect matching method/scope/rule/interval and a `workcell.bodies` input
   difference. This example reports complete coverage; compare its stored
   bounds and findings without treating a method verdict as equipment approval.
5. Expand **Original source identities** to inspect the frozen candidate,
   experiment, run, snapshot and available copied origin. Experiment revision
   and rule revision are shown separately from method version. Body placement
   edits change model inputs; they do not themselves increment the experiment
   definition revision. Selection, inspection and comparison never rerun analysis.
6. Close the dialog with Escape; focus returns to **Runs & compare**. For C,
   change minimum clearance to **35 mm** and complete the edit. The study advances
   to a new revision; its old run remains historical. Run again, then compare
   the old and new C runs. Expect the decision-rule difference and a reason why
   they are not directly comparable. Undo/Redo edits do not rewrite either run.
7. Select an individual run and export JSON, CSV and HTML. Use **Projects** to
   export the portable project, then choose that file, review its preview and
   explicitly accept import. Reopen the saved project or refresh the same
   project URL. Retained reports and identities remain unchanged; transient
   comparison slots are selected again. Keep the exported file as your backup.

The formal three-candidate browser test exports the portable project as
`three-candidates.json` in its report attachments. This allows the same three
completed runs to be reviewed without reconstructing model inputs. Choose it
through **Projects → Choose project file**, inspect the preview and confirm
replacement only in your review project. Run reports alone are not project files.
At **576 × 690**, history and comparison cards stack in the dialog's natural
scroll region. Execution, coverage and verdict remain separate labels, including
partial or cancelled evidence. Removed canonical runs lose their selected slot;
Undoing their removal does not silently reselect them.

For developer installation, exact schema/capability/version admission and the
independent sphere example, follow the reproducible M4 commands in the
[SDK guide](../../docs/ai/apps/asyra-sim/specs/extensions-sdk-v0.md#reproduce-the-m4-sdk-and-ui-path).
Field observations below remain separate from these immutable run reports.

## Field observations

In **Runs & compare**, select a retained result and scroll to **Field observations**.
Choose **Add field observation**, describe what was actually measured, include
units and context, and optionally select supporting files. Review the filenames,
declared types, byte lengths and SHA-256 identities before **Apply attachments**.
Valid title/text edits apply when editing finishes; the same note remains open
for further edits.
The note is a user report, not a validation certificate or automatic calibration.
It never changes the experiment's original findings, uncertainty or verdict.

Each run allows 20 notes (200 per project), with a 120-character title and
8,000-character body. Each note allows four TXT/CSV/JSON/PNG/JPG/JPEG/PDF files,
up to 2 MiB each; the runtime archive allows 64 distinct sources and 16 MiB of
original bytes. Attachments are opaque: the App does not open, parse, render,
execute, scan, align or certify them. Downloads do not automatically open them.
Changing a run, closing the library or replacing a file selection discards the
transient preparation. Unsupported and oversized selections are rejected before
reading. Identical contents cannot appear twice in one note.

**Edit observation** keeps its identity and advances its revision for material
changes. Stale drafts cannot overwrite a changed note. **Remove observation**
requires confirmation. These metadata changes use the ordinary Undo/Redo owner;
accepted source bytes remain available for Undo within the runtime limit. The
project session persists changes automatically and reports acknowledgement
separately. Browser storage is not a backup.

Native projects carry only currently referenced observation sources. Every
source is integrity-checked before an imported project can replace the current
runtime, and again during startup. **Export field observations** creates a
separate JSON bundle with the run/snapshot identity, current notes and files.
The run's existing JSON/CSV/HTML reports remain unchanged. See the
[field observation contract](../../docs/ai/apps/asyra-sim/specs/field-observations-v0.md).

## Local distribution launcher

The candidate distribution's `node server.mjs` command serves its own `site`
directory at `http://127.0.0.1:3020`. Open that exact address in an installed
Chrome. Stop with Ctrl+C. An occupied port is an error, not an automatic port
change. `node server.mjs --port=3021` is an explicit alternative, but a different
origin has different browser saves. Always export portable backups before
changing origins or clearing browser data. Do not use `file://` or expose this
launcher as a network service. It offers no uploads or remote-control API.

The launcher is tested independently with
`node --test apps/asyra-sim/scripts/__tests__/local-server.test.mjs` from the
repository root. A launcher alone is not a verified distribution; packaging,
clean-consumer and packaged-browser evidence are still required.

From a clean source commit, maintainers can run
`node apps/asyra-sim/scripts/build-consumer.mjs` to rebuild and validate an
independent App against packed Framework packages. This uses only the existing
project-local dependency cache; run the ordinary declared dependency installation
first if the cache is incomplete. It does not install a new runtime or publish
anything. Bounded command logs and the exact consumer, packed dependencies and
source archive remain under `.artifacts/consumers/`. A passing consumer is an
input to distribution assembly, not a replacement for packaged offline testing.
The same successful producer invocation also assembles a versioned local folder
and tarball, its static site and launcher, App documentation, source SDK, original
dependency notices and file/archive checksums. It stages partial output under
`tmp/` and finalizes only after verifying that the source stayed unchanged.
The SDK keeps packed Framework inputs beside its consumer App; neither is served
by the launcher. See the [local candidate quick start](../../docs/ai/apps/asyra-sim/release/LOCAL_CANDIDATE.md).
Assembly does not mark packaged offline use, reference hardware, independent
pilots or public support policy as passed.

## Architecture

The App-owned CUSTOM engine is composed before Core startup and renders through
the ordinary Core/Render/custom-layer path. Scene Tree and Props remain the
editable authority. The renderer and numerical methods share domain poses;
neither owns a second editable robot graph. No generic 3D Preset is enabled.

See the dedicated [App documentation](../../docs/ai/apps/asyra-sim/README.md),
[numerical contract](../../docs/ai/apps/asyra-sim/specs/numerical-method-v0.md),
and [release gates](../../docs/ai/apps/asyra-sim/release/FIRST_RELEASE.md).

We provide a trustworthy environment for executing experiments, not a guarantee
that users' experimental assumptions hold. Independent pilot acceptance and
all first-release gates are required before R0.
