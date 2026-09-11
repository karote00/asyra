# M5: Controlled-Pilot Candidate

Status: active - preparation authorized 2026-09-12. User review precedes plan
closeout. M6 independent acceptance and R0 publication remain separate.

## Bounded task contract

Baseline: `4144a25d7` from fetched `origin/main`, PR #181 merge. Branch
`codex/asyra-sim-m5-controlled-pilot`; worktree
`.worktrees/asyra-sim-m5-controlled-pilot`. Preserve the original checkout's
untracked `docs/reports/` and every other worktree.

Outcome: a traceable local candidate with current operating instructions,
verified independent build, notices/checksums, offline packaged journeys,
measured resource evidence and explicit remaining hardware/external gaps.

Authority: roadmap section 8, FIRST_RELEASE G1-G6 and G8 preparation,
runtime-profile-v0, current workcell/method/extension contracts, and the R0
Inspector. Completed M3.5/M4 plans and old consumer logs are history, never
current-version passing evidence. The roadmap's earlier delivery iterations are
historical; this document records the newly authorized execution.

Discovery is fixed to App delivery scripts, current App UI and direct owner
callers/tests, shipped guides/examples, runtime/resource guards and existing
release gates. Search methods: file inventory, targeted text search, current
source/contract reads and formal test execution. No repository-wide repair.

Mutation scope: App delivery scripts and permanent tests, packaged-browser and
resource proofs, current App release/SDK/format/operation documents and this
plan/index. Necessary confirmed bugs remain within the corresponding existing
R0 owner allowlist, one owner at a time and test-first. No Framework refactor,
solver replacement, precision/budget relaxation, hidden fixture exception,
new dependencies, environment upgrade, deployment, release or merge.

Gates: delivery script tests; naming; App unit/method/integration/extension tests;
App lint/build/typecheck; Inspector contracts and test placement; clean exact
source consumer rebuild/pack/type and bundle isolation/assembly; checksums;
packaged ordinary E2E and inspected desktop/narrow screenshots; resources,
cancellation, missing method/source, corrupt project, persistence recovery and
network/output safety; current locked dependency audit. Keep five-minute child
and bounded browser/log guards. Execute existing applicable gates directly.

Stop conditions: a required out-of-scope owner or unresolved product decision;
new dependency/tool requirements; failed exact-source/integrity gate; unavailable
reference hardware or independent evidence. Hardware gaps block their claims,
not independent preparation work. Follow bounded replanning after repeated
failures. Do not close M5 until the user accepts; never advance to M6 or R0.

## Sequence and current findings

1. **UI delivery checkpoint:** verify existing generator/launcher tests, update
   stale quick start against accepted M3.5/M4 controls, prepare pilot script,
   diagnostic-sharing preview and policy proposal. Add missing formal delivery
   proofs. Commit validated tooling/docs before producing candidate evidence.
2. **Exact-source delivery:** from that clean commit run existing consumer
   producer unchanged unless a permanent failing gate proves a necessary defect.
   Retain its real evidence; never edit cached consumer inputs or assembled files.
3. **Packaged journeys:** run ordinary browser tests against the produced static
   launcher, prove offline startup/Worker execution/export/reopen and inspect
   screenshots. Source-module browser tests run separately on a source server;
   they cannot be mislabeled as packaged evidence.
4. **Resources and recovery:** retain full normal six-axis/~30-obstacle/
   ~200-keyframe/three-candidate workload, boundary and exceeded-budget outcomes,
   cancellation and measured resource limitations. Reuse permanent owner tests
   for historical data, missing dependencies/assets and save/recovery failures.
5. **Review delivery:** commit evidence summary and detailed acceptance steps,
   push/update M5 PR, follow all required CI at its exact newest head every five
   minutes, correct failures, then request user review. Rebuild when candidate
   inputs change; evidence-only later commits identify the tested source exactly.

Initial evidence: 20 delivery script tests and 11 naming checks pass at the new
baseline. Existing scripts already enforce clean source, offline locked inputs,
isolated consumer commands, same-process assembly and original notices. Preserve
them rather than recreate historical fixes. LOCAL_CANDIDATE still instructs
manual Save/Retain and old run/import actions; correct those against current UI.

Host: Mac15,9, 48 GiB, 16 logical CPUs, Node 24.13.0, Yarn 4.3.1. The specified
Mac mini M1/8 GB is unavailable here; its G4 evidence remains open. Neither
SwiftShader nor CPU throttling substitutes for that machine.

## Step Execution Card - UI delivery

Owner: `ui`, R0 Inspector `implementationBoundary` App scripts, E2E, README and
their direct current release contracts. Inputs: clean exact source commit,
existing lockfile/validated packed Framework inputs, versioned static files,
ordinary authoritative runtime/retained artifacts. Output: `artifact:user-workbench`
with reproducible local distribution and accurate instructions.

Conditions: read-only loopback launcher; existing isolated consumer gates before
same-invocation assembly; unchanged source identity; actual original notices;
checksums for all files; current Setup/Preview/Results, automatic retention and
durable acknowledgement. Bypass: failure produces explicit error, no passing
candidate. Allowed contributors: ordinary UI and versioned local distribution.
Forbidden: fixture-specific success, equipment commands, automatic publication,
mutable cache evidence, downstream reconstruction of method conclusions.

References: runtime profile Environment and Delivery; workcell Understandable
experiment workflow and sections 9/12; FIRST_RELEASE G3/G5/G6. Failure owner: ui.
No new persisted identity or runtime cache. New test names remain neutral and
test-local; existing public distribution/package identities are preserved.

Cases/DoD: launch, hostile paths, missing/changed/additional files, exact original
notices, portable docs, current control sequence, offline ordinary analysis and
export/reopen. Focused gates are the delivery script suite, naming, App lint,
Inspector contracts and placement, followed by clean consumer and packaged E2E.
Self-review: the declared ui delivery boundary already covers this work; no
Inspector expansion or product semantic change is required. Preserve solver,
canonical state, persistence and extension ownership.

### UI delivery checkpoint evidence

The new network-restricted comparison is preventive coverage of existing correct
behavior, not a production bug fix. Both formal comparison cases pass (29 s).
App tests pass 678/678 across 119 files; build/typecheck and lint pass; delivery
scripts 20/20, naming 11/11, Inspector contracts 100/100 and placement 2/2 pass.
Logs: `.artifacts/m5/`. Source server: 3020, PID 10622. Desktop 1440 x 960 and
narrow 576 x 690 comparison screenshots were inspected: declarations, verdict,
coverage and focused comparison destination are visible. This proves the source
workflow only; packaged delivery and resource/reference gates remain open.
Bounded review confirms no production runtime change and unchanged ui contract.

### UI delivery correction - complete test inputs

The exact-source producer at `8c6cc4472` failed 2/678 packed tests because
`src/init/__tests__/vercel-deployment.test.ts` reads the existing `vercel.json`,
which the consumer omitted. This is the formal red oracle; no candidate exists
for that run. Failure/logs remain in App `.artifacts/consumers/8c6cc4472942-H7vvqL`.
Also strengthen assembly's permanent SDK test before correction.

Step card: same ui delivery inputs, output, conditions, contributors, boundary,
references and failure owner as above, re-read before this correction. Only add
the exact existing config to consumer/SDK file collection; preserve its disabled
automatic deployment and test assertions. No deployment/config semantic change.
Gates: SDK regression red/green, delivery suite/lint/naming/Inspector/placement,
commit, then a fresh clean producer invocation. Existing consumer remains failed
and unmodified. Local browser/log evidence was preserved under `tmp/m5/` because
root `.artifacts/` is not ignored; this corrects the earlier evidence location.

### Run resource proof card

UI delivery correction is validated: 20 delivery, 11 naming, 100 Inspector and
2 placement tests pass; App lint and root lint pass (79 existing warnings).
Fresh exact source `48cc7f93aea1b46a2059b00ce204792999e3eb9c` rebuilds 19
Framework tarballs, preserves 387 registry records and passes all 678 App tests,
type and bundle fences, assembly and checksum verification. Its archive SHA-256
is `3f822f47fa268b4fc6a8f910c35733eab01eb262d0b2cddd561b84afcf4ef03a`.
Candidate is under App `.artifacts/consumers/48cc7f93aea1-sCaqBh/`.

Next owner is `run`, re-read R0 runner contract. Inputs: admitted frozen snapshot,
method evidence/catalog and abort signal. Output: validated bounded result/progress.
Conditions: one Worker, exact registered method, admission before allocation,
validated source/pair/time/terminal evidence, owned cancel/termination and no late
messages. Bypass: malformed evidence fails. Contributors: Worker, versioned
protocol and result validator; forbidden canonical writes, unbounded concurrency
and Promise-only cancellation. Failure owner: run; cache dimensions remain empty.
References: workcell sections 8/11, runtime profile Initial Admission and Execution
Limits and FIRST_RELEASE G4. Boundary: `src/analysis/__tests__/**` only.

Add a permanent production-Worker browser proof for the full supplied original
parts, six axes, 30 fixtures, 200 keyframes and three sequential candidates at
published defaults. Preserve all triangles, precision and scope. Measure runtime,
evaluation/leaf counts and browser heap (explicitly not total/Worker RSS).
Assert admitted workload, useful complete answers and numerical budgets; preserve
measured failure before any owner correction. Existing formal resource/runner
cases cover admission boundaries, exhaustion and forced cancellation. Stop for
an unapproved budget/product decision or out-of-scope algorithm change. This
proof does not claim reference M1/8 GB or independent pilot acceptance.

Resource proof blocks advancement: candidate 1 admits 39 bodies, 30 fixtures,
200 frames, 298 pairs and 40,388 original triangles, but returns completed /
partial / cannot-determine with all 298 pairs unresolved. At unchanged
100,000 intervals / 30 s, measured execution is 1,388 ms (confirmatory reason
capture 1,428 ms), 134 evaluations and 59,302 leaves. Page heap peak is about
114 MB, not total process/Worker memory. The retained reason is exactly
`Original-triangle work budget exhausted; complete source geometry was not simplified.`
The first-case fail-fast correctly leaves candidates 2/3 unrun. Artifacts:
`tmp/m5/representative-resource-report.json` and
`tmp/m5/representative-reasons-report.json`. This is a failed capacity gate,
not successful conservative usability. Keep its formal test uncommitted pending
the bounded method-owner decision; do not weaken it, change budgets or replace
geometry. M5 is not ready, independently of missing reference hardware.

### UI packaged fault-injection correction card

The run proof is stopped at its method-capacity boundary. Independently resume
ui delivery with the same ui card and unchanged contracts, re-read before edits.
Packaged journey passes A/B/C, retained history and primary workflow; the Worker
failure test incorrectly targets source `.ts` only, so its injection misses the
hashed static Worker and the expected failed assertion catches that omission.
Correct this test-only URL selector to support both real artifact forms and
assert exactly one request was intercepted. Preserve failed/partial/non-success
and retention assertions. Boundary: existing workbench-flow E2E, direct plan
record. Focused gates: source and packaged Worker failure plus packaged workflow,
App lint/typecheck/naming; no production changes or automatic deployment.

## Candidate reproduction and bounded verification

This is an internal reproduction artifact, **not a pilot-ready M5 completion**.
Do not distribute it as an accepted controlled-pilot build while the resource
gate above fails. No M6 participant or reference hardware is claimed.

Exact producer command, from a clean source checkout:
`node apps/asyra-sim/scripts/build-consumer.mjs`.
Actual passing source is `48cc7f93aea1b46a2059b00ce204792999e3eb9c`, not a later
evidence/test-only PR head. Existing failed `8c6cc4472` outputs remain failed.

Passing artifact directory relative to this worktree:
`apps/asyra-sim/.artifacts/consumers/48cc7f93aea1-sCaqBh/asyra-sim-0.1.0-alpha.0-48cc7f93aea1`.
The sibling `.tar.gz` is 2,749,872 bytes, with the checksum recorded above.
`consumer-evidence.json` records source/tarball/lock identities; `BUILD.json`,
`DEPENDENCIES.json`, `THIRD_PARTY_NOTICES.txt` and `SHA256SUMS` are inside.
All 31 runtime dependency records have original notices (0BSD, Apache-2.0,
BSD-3-Clause, ISC or MIT declarations). All 19 SDK Framework tarballs include
license files. Vitest, @vitest/mocker and glob are absent from main/Worker
bundle inputs. The dated consumer audit has three moderate records, including
two records for one Vitest advisory; root high-severity audit passes. No upgrade
or environment/tool change was performed. Optional SDK development remains
trusted and is not the ordinary launch path.

Local host: Apple M3 Max / Mac15,9, 48 GiB, 16 logical CPUs, macOS 26.6.2
(25G83), Chrome 152.0.7977.83, Node 24.13.0 and Yarn 4.3.1. Formal WebGL
screenshots use SwiftShader, not native-GPU certification. The independently
opened in-app browser view is visual-only evidence, not Chrome hardware proof.

Browser commands use `APP_URL=http://127.0.0.1:3020`, one worker, no retries,
`--max-failures=1`, existing per-case deadlines and 180-second batch deadline.
Examples (from repository root):

```sh
APP_URL=http://127.0.0.1:3020 yarn workspace @asyra/asyra-sim test:e2e e2e/__tests__/workbench-flow.spec.ts e2e/__tests__/formal-outcomes.spec.ts e2e/__tests__/resources.spec.ts --max-failures=1 --output=../../tmp/m5/packaged-failures
APP_URL=http://127.0.0.1:3020 yarn workspace @asyra/asyra-sim test:e2e e2e/__tests__/methods.spec.ts e2e/__tests__/field-observations.spec.ts e2e/__tests__/acceptance-rules.spec.ts e2e/__tests__/visual-references.spec.ts e2e/__tests__/trajectory-import.spec.ts --max-failures=1 --output=../../tmp/m5/packaged-data
```

The packaged failure batch passes 11 cases, including source/hashed Worker
fault interception, timeout, cancellation, oversize inputs, persistence failure
and retry. The packaged data batch passes 15. The first packaged batch passes
both A/B/C cases, retained portable history and main workflow before the
source-only injection omission; corrected workflow subsequently passes all
three cases. Do not count that initial batch as entirely passing.

Source-server-only evidence: nine Worker/IndexedDB browser contracts and seven
project migration/recovery cases pass. Their imports of source modules are not
packaged-static tests. Logs and preserved JSON reports are in `tmp/m5/`.
Unit/resource/security evidence is the full 678-test App suite and 20 script
tests, not a new release-capacity claim.

Agent screenshot review: packaged desktop comparison (1440 x 960), narrow
comparison (576 x 690), explicit Worker failure and save-error acknowledgement
were inspected against their normal App tests. Screenshot roots are
`tmp/m5/packaged-journey/` and `tmp/m5/packaged-failures/`. Interactive in-app
review at 1280 x 720 displayed the same packaged Setup/Preview/Results and
six-axis workcell at project `8f6e71b5-6c53-4629-8261-e5a036470589`; only tab
navigation was performed and Undo remained 7. The temporary review tab was closed.

## Human acceptance steps for the prepared delivery slice

1. Preserve the archive and original backups. Open Terminal in the candidate
   directory above (or extract its sibling archive into another local folder).
   Run `node --version` (must be 24.x), `node verify-files.mjs` (all checksums
   match), then `node server.mjs`. Keep Terminal running and open
   `http://127.0.0.1:3020` in Chrome. A version, checksum or occupied-port error
   is a failure to launch, not permission to alter the package.
2. Use the included README's **Your first experiment**, steps 1-7: select
   Experiments, Setup, then Run analysis; View results reveals Results; wait
   for Saved to this project. Duplicate A to B and C and change fixture post
   Mount position (m) X to -0.6 and -0.45, respectively, before rerunning.
   Open Runs & compare, select three checkboxes, verify order, and press Compare
   selected runs (3/3). Success shows focused comparison with all three frozen
   candidate/revision/method records and distinct geometry. No automatic winner
   or unknown-as-clear result is acceptable.
3. Select a retained run for JSON/CSV/HTML report export. Close with Escape,
   open Projects and Export project. Choose the downloaded portable project,
   inspect preview, click Import and replace current project and confirm.
   Reopen Runs & compare: all three original records remain; Undo is initially
   empty. Wrong identities, missing resources or changed evidence fail.
4. Follow the included **Trajectory example and data formats** section for a
   new CSV import: declare units and mappings, inspect conversion values and
   click Import trajectory. Existing fields persist on completion without a
   separate Save/Apply. Malformed or oversized inputs must expose an error and
   preserve current data; invalid current input must not run an older draft.
5. Run the formal failure/cancel and storage-retry scripts above against the
   launcher for controlled fault injection. The ordinary user recovery route
   is also documented in PILOT_REVIEW.md. Partial/cancelled/failed must remain
   separate from complete; Saved requires durable acknowledgement. Keep a
   portable backup and the offered detached recovery file before restarting.
6. Stop the launcher with Ctrl+C and confirm 3020 is released. Do not clear
   browser data as a cleanup or migrate data by changing origins. No pilot
   invitation, user acceptance, deployment, release or plan closeout follows
   automatically from this delivery-slice review.

The full representative-resource test remains a failing local formal test,
not a passing gate or a committed implementation checkpoint. The requested
method-owner direction and M1/8 GB evidence are still pending. Later changes
to candidate inputs require a new clean producer invocation and evidence.

Final independent delivery validation: the last packaged persistence/history/
original-part/theme batch passes 10 cases. Total distinct packaged cases: 39
(the main workflow repeated across batches is counted once). All ordinary
candidate files still pass checksum verification after testing. Final script,
Inspector and placement checks pass 20/100/2; typecheck, App lint and naming pass.
Source servers 10622/27602 and packaged launchers 27267/28287 were stopped;
3020 is released. Browser temporary profiles/artifacts remain under project-owned
paths. No user browser data or unrelated service was cleared.

This checkpoint commits only the passing UI fault-injection correction and
honest evidence record. The failing representative-resource browser file is
preserved uncommitted under its formal App test directory, consistent with the
policy against committing a known failing implementation stage. It is not
waived, deleted or reported as CI-covered. The prepared PR covers delivery
preparation and still blocks M5 acceptance on resource capacity and hardware.
