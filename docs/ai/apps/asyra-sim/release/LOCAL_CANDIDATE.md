# Asyra Sim: Local Candidate Quick Start

This is a local developer candidate, not the R0 public release. It helps you
compare robot-workcell geometry experiments before performing independent
real-world validation. It does not approve equipment operation, predict forces
or dynamics, calibrate a real robot, or certify industrial safety.

We provide a trustworthy environment for executing experiments, not a guarantee
that users' experimental assumptions hold. Incomplete or unresolved analysis
never means clear. Official provenance is not independent validation.

## Start without the monorepo

The distributed folder contains a production `site/`, a loopback-only launcher,
documentation, examples and an optional source SDK. You need an existing Node.js
24.x and Google Chrome installation. No account, Yarn, paid service or network
connection is needed to run the workbench after obtaining the folder. Tools are
not installed or upgraded automatically.

Open Terminal in the extracted distribution folder:

```sh
node --version
node verify-files.mjs
node server.mjs
```

Open `http://127.0.0.1:3020` in Chrome. Keep Terminal open while using the App;
stop with Ctrl+C. Do not open `site/index.html` directly with `file://`.
Checksum verification detects changed, missing or added files against the
included manifest; it does not authenticate an untrusted publisher.
Included user guides and App contracts link locally. Optional Framework/Inspector
references not shipped here are labeled with their repository path and exact
commit; a local commit is not assumed to have been published online.

The current test environment is Apple Silicon macOS with Chrome; exact tool
versions and source identity are in `BUILD.json`. Windows, Linux, other browsers
and mobile devices are unverified. The reference Mac mini M1 / 8 GB performance
gate, independent pilot users and public maintenance policy are not yet verified.
See the [runtime profile](../specs/runtime-profile-v0.md).

## Your first experiment

1. Wait for **Local runtime ready**. The invented six-axis workcell includes a
   robot, gripper, workpiece, table and post. It is not a vendor CAD model.
2. Use the tree and object properties to inspect the shapes, dimensions and
   joints. Complete a text, numeric or color field with Enter or blur; selects
   and checkboxes update directly. No Apply button is needed. Undo/Redo reverses
   individual field edits. Original part placement affects display and analysis.
3. Choose **Experiments** in the right panel, then **Setup**. Review the
   selected candidate and experiment, **Analysis scope**, exclusions, interval
   and minimum clearance. Expand **Advanced settings** for method limitations,
   precision and **Numerical settings**. Complete edits with Enter or blur;
   existing studies have no Save button. Required resource acknowledgements do
   not override hard limits or improve precision.
4. Click **Run analysis** once near the experiment selector. It checks current
   inputs automatically. If blocked, use **Review input** to reach the owning
   field, correct it and run again. While running, **Cancel analysis** cancels
   the owned job. On completion click **View results** to enter **Results**;
   completion alone does not switch tabs. Read execution, coverage and findings
   separately. Partial, cancelled or unknown never means clear. Terminal results
   are retained automatically; wait for **Saved to this project**. On failure,
   use **Retry retention** and preserve the original result.
5. Click **Duplicate candidate** above the workbench and enter a name for B.
   Select **fixture post** in the left tree, change **Mount position (m) X**
   from `-0.75` to `-0.6`, and press Enter. Return to **Experiments**, run and
   view its result. Duplicate B to C, change the same field to `-0.45`, and run.
   Each candidate and run retains its own inputs. In Results, replay a finding
   with the available replay control; **Historical run replay** identifies frozen
   evidence. **Return to current preview** returns to current inputs. Sampled
   playback in **Preview** is not continuous collision proof.
6. Open **Runs & compare** in the header. Select the three retained run checkboxes
   in the intended order; verify the selected-run slots, then click **Compare
   selected runs (3/3)**. The button shows pending feedback and the dialog moves
   focus to **Run comparison**. Inspect candidate/revision/method declarations,
   scope/rule differences, verdict, execution and coverage. There is no automatic
   winner. Select a run for **Export JSON**, **Export CSV** or **Export HTML**.
7. Close the comparison dialog with Escape. Open **Projects**, wait for the local
   save acknowledgement and click **Export project** for a portable backup.
   Choose that download through **Choose project file** (accessible name
   **Portable project file**), inspect the preview, click **Import and replace
   current project** and accept the replacement confirmation. Reopen
   **Runs & compare**: all three runs and their original declarations must remain.
   Undo begins empty in the new document lifetime. A failed import must preserve
   the current document; missing runs or changed evidence fails this journey.

For your own study, create a blank project and add bodies/joints/proxies, or
edit an independent copy of the sample. New bodies need explicit scope roles.
One workcell is the supported analysis domain, not a whole-factory simulator.
The [user guide](../../../../../apps/asyra-sim/README.md) covers detailed controls,
visual imports, acceptance rules and separate field observations.

## Trajectory example and data formats

The [synthetic CSV](examples/synthetic-trajectory.csv) reproduces the sample's
three keyframes. In **Experiments → Setup**, expand the trajectory import section and use
**Load trajectory CSV**. Map `time` to seconds and every joint column to its
matching joint in radians; inspect the conversion preview and choose **Import
trajectory**. This explicit new-file action applies and persists the accepted input. A copied candidate has new IDs, so explicitly remap its
columns. Do not interpret vendor/controller data without checking units,
joint conventions, interpolation and geometry assumptions.

CSV allows up to 8 MiB, JSON 1 MiB, and either format 2,000 keyframes. JSON uses
the strict versioned trajectory envelope; portable projects use the App's own
versioned document format. They are different file types. Unsupported formats
fail explicitly rather than being guessed or partially imported. See the
[workcell/input contract](../specs/robot-workcell-v0.md) and
[numerical method limits](../specs/numerical-method-v0.md).

## Backups, privacy and recovery

Browser IndexedDB is not a backup. Clearing site data removes local saves;
changing the port, hostname, browser profile or browser does not migrate them.
Export portable projects before changes. Keep original backups separate from
candidate experiments. In-progress previews are temporary. A terminal result whose retention failed is
not included in exports until **Retry retention** succeeds. A save is acknowledged only after local storage commits.

If storage is unavailable, editing remains usable and portable export is the
fallback. Invalid imports preserve the open document. A failure after retirement
disables editing and offers detached recovery; preserve that download and the
original backup before restarting. Do not manually repair private evidence.

The official local workflows do not upload project data. Project files cannot
install code. Compiled private extensions are trusted code, not a security
sandbox: their author must review services, dependencies and disclosure risks.
Field-observation attachments are opaque, not scanned or certified; download
does not automatically open them. Review exported project/report contents before
sharing. Prefer a minimal synthetic reproduction without factory secrets.

## Optional developer SDK

Non-developers do not need this section. The distribution includes `sdk/app`
with App sources, tests and a consumer manifest, plus `sdk/framework` with the
exact packed Framework inputs. Node 24.x and Yarn 4.3.1 are needed for development;
the first dependency installation may require registry access unless you already
have the matching package cache. No tools are installed automatically.

```sh
cd sdk/app
yarn install --immutable
yarn typecheck
yarn test:local
yarn build
node scripts/run-e2e.mjs e2e/__tests__
```

Follow the [local SDK guide](../specs/extensions-sdk-v0.md). Its repository-root
commands correspond to the local consumer commands above. Register reviewed
modules in `src/extensions/installed-methods.ts` before rebuilding; do not edit
Core or import a plugin through project JSON. Private methods need their own
mathematical and conformance tests. A private rebuild is a new deployment, not
the original verified binary; preserve original artifacts and label it clearly.

## Troubleshooting and candidate limits

- **Node version rejected:** use an existing compatible Node 24 installation.
  This package does not automatically upgrade your environment.
- **Port occupied:** stop the process you own that uses 3020, or explicitly use
  `node server.mjs --port=3021`. A changed origin has separate browser saves.
- **Blank/error viewport:** use Chrome with WebGL 2 enabled; record the browser,
  OS and error. Do not substitute a screenshot for a failed numerical result.
- **Analysis blocked:** review invalid model/scope, missing modules, joint
  units, excluded pairs and hard limits. Reduce the intended scope explicitly;
  do not suppress unknowns or alter precision merely to get a passing label.
- **Unknown/partial result:** inspect unresolved intervals and the actual
  evaluation/time budget. More computation may help, but cannot validate a bad
  model or guarantee convergence.
- **Large download/build warning:** the current main bundle is about 1.9 MB
  uncompressed. Its chunk-size warning is retained, not hidden by a raised limit.

Use `BUILD.json`, `DEPENDENCIES.json`, `THIRD_PARTY_NOTICES.txt` and `SHA256SUMS`
to identify this candidate. Provide version, OS/browser, minimal synthetic input,
expected/actual behavior and reproducible steps to the person coordinating your
local review. A public issue/security channel, maintenance owner and response
policy have not been authorized; do not send secrets to a guessed address.
Free software does not promise an SLA or unlimited immediate support.

The 2026-09-12 audit of the exact-source independent consumer lock at
`8c6cc4472942b69c5ac369c788de3a84634571b5` returned three moderate records:
`vitest@3.2.7` and `@vitest/mocker@3.2.7` share
<a href="https://github.com/advisories/GHSA-82fw-gwwq-j7x9" target="_blank" rel="noopener noreferrer">GHSA-82fw-gwwq-j7x9</a>,
and `glob@10.5.0` has a deprecation record. No high/critical record was returned.
This dated registry result is not proof of vulnerability absence. The Vitest
advisory concerns development-server mock path access; the official App config
uses Vitest's Node test mode and does not install the public mocker server plugin.
The ordinary candidate launcher serves static files only. The optional SDK is
trusted development tooling: do not expose test/dev servers or process untrusted
source. Dependency upgrades require separate approval. Runtime bundle membership
and notices are recorded by the producer; this audit does not turn a failed
consumer build into passing evidence. Preserve that distinction when reviewing
updated artifacts.

The [pilot review script and sharing preview](PILOT_REVIEW.md) provide detailed
review steps without requesting confidential files. The [maintenance proposal](MAINTENANCE_PROPOSAL.md)
requires a separate owner/channel decision before becoming policy.

Publication, independent pilots and all [first-release gates](FIRST_RELEASE.md)
remain separate decisions. Do not use this candidate as the sole basis for
production, equipment motion or worker safety.
