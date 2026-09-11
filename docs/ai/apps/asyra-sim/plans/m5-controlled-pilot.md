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
