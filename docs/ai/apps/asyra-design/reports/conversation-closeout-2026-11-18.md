# AI conversation closeout - November 18, 2026

## Decision and limits

The user accepted the latest complete Taipei 101 drawing and asked to converge,
complete local validation, close the conversation work and push existing PR #365.
Recoverable lookup/input refusals, image-based dimension estimates and unused
optional saved values are not defects by themselves. Automated evidence records
facts; the reviewing agent makes the final behavioral judgment using the request,
actual recovery and current specifications. No new 101 is part of this closeout.

Implementation, current whole-feature execution and the bounded independent
semantic review are complete. The owner subsequently changed dependency audit
policy: transitive-only findings remain recorded without blocking delivery.
The final full local run passes all 37 selected checks with source identity
verified. The audit retains picomatch as a transitive finding. Earlier failed,
cancelled and unverified runs remain historical evidence; final delivery is
recorded separately below.

## Completed conversation changes

- One shared terminal-question interpretation keeps a valid final question
  answerable after earlier successful operations. Conflicting/malformed terminals
  remain rejected; presentation and continuation use the same interpretation.
- A report-storage notice no longer replaces a successful authored reply.
- Retry preserves original attachment identity. Actual Runtime pre-write
  cancellation can retry; executed or contradictory receipts cannot.
- Explicit Stop wins over a late successful reply.
- Drafts use Core's runtime-only system property and observation, rather than an
  independent store. Panel closure retains drafts; accepted send retires the
  draft, and App disposal clears state and subscriptions. Canonical document
  persistence and normal provider context exclude unsubmitted drafts.
- Progress updates the active message without reprojecting settled history.
  Escape closes history from its toggle or list and restores focus.

The existing provider, Knowledge, tools, saved context, single execution entry,
coordinate and media contracts remain authoritative. No compatibility layer,
relaxed validation, mandatory model procedure or new dependency was added.
Backend-persistent conversation history is not implemented or claimed.

Focused evidence: 203 App/Runtime cases, nine actual provider/Knowledge handoff
cases and four browser cases passed, with scoped types, lint, naming and docs.
See the [completed continuity record](../plans/completed/agent-context-and-report-continuity-plan.md#cross-branch-conversation-repair-assessment)
for original failing regressions, owner reviews and exact artifact paths.

## Accepted live result retained unchanged

Run: `tmp/conversation-improvements/live/taipei-101-fixed-1794940085035`.
The fixed prompt SHA-256 is
`25b9ad1aeb523fdb590a39d090a37fdc65ed62ff081a27acfa92d946f9b2ff51`.
Drawing completed naturally in 595,690 ms (9m56s), not by forced termination.
The original provider session completed its unrestricted report in 318,746 ms.
The final document contains 23,628 vectors, 248 ovals, seven groups and a workspace.
Durable sequence 757 survives reload unchanged; the report did not change source
or drawing. The complete report, final screenshot, recording and run receipt
remain in that directory. The original session remains available for follow-up.

Two recovered input refusals did not block the drawing: an invalid `/unused`
binding was corrected, and an unavailable rename route was omitted. Four contract
reads returned 56,522 bytes; two searches returned 21,933 bytes; eight execution
calls returned 12,554 bytes. Twelve saved names include seven observed uses.
These observations do not establish universal speed or model behavior guarantees.

## Full local gate findings and corrections

Original failure receipts remain intact; passing corrections do not erase them.
All fixes below preserve the original behavioral assertions and invalid-input
rejection. No product fallback was added to admit an obsolete test fixture.

| Finding | Established cause and correction | Verification |
| --- | --- | --- |
| Unknown root Flow configuration | Scope classifier omitted the current conversation configuration. Declare its Design verification owner; retain unknown-file rejection. | New failing selection regression, then 81 scope cases pass. |
| Seven shared script failures | Collector fixture was outside the required test directory; generated docs/README were stale; workflow test required a retired gate. Move the unchanged fixture, regenerate current-source docs, synchronize README and assert current workflow. | Focused cases and complete shared check pass. |
| Website startup and caption | Initial server exit after a startup notice has no confirmed cause. Unchanged retry reaches one real defect: the development indicator covers the caption. Disable that indicator through the supported Next configuration. | Failing config regression, unchanged caption hit test and complete website check pass (168; five optional cases skipped). |
| Sim post-pan picking | Trace proves the test clicks a future projected position before the corresponding frame is presented. Capture the rendered pan before the unchanged independent projection/pick assertions. | Original middle/left cases pass three repetitions each; complete Sim check passes. |
| Four localization setup failures | Isolated proof omitted a current imported contract fixture. Declare it in the existing proof boundary so both preparation and source identity include it. | All four original cases and complete control-plane check pass; no fixture-only copy. |
| Reset recovery fixture | A manually seeded publication omitted required `documentGeneration`. Supply its known pre-Reset generation 0; product rejection remains strict. | Original browser case, 22 outbox cases and complete collaboration E2E pass. |
| Board owner highlights | Agent resumed checks after an Inspector edit without rebuilding its generated bundle. Recorded bundle and current contract digests differ. Regenerate through the existing build. | Equal digests; unchanged four-owner assertion and complete Board E2E pass. Failure-state evidence is now retained. |
| Provider follow-up fixture | A synthetic clarification result omitted its required action identity; the current reader correctly rejected it. Match the canonical action output. | The original provider/history/image assertion and 65 related App/real-Runtime cases pass; validation is unchanged. |
| Calculation audit case workload | The second final run exceeds the unchanged five-second case limit while doing both healthy and corrupted full Host reads. Split independently collected legal/fault controls; retain real discovery, source comparison, illegal-value probes and original corruption titles. | All four selected cases pass at 2.2–2.3 seconds each; the complete audit passes 1,394 cases with no skips. The final server group also passes all 3,807 cases. |
| Storage notice assertions | Two real-action cases still required a persistence warning to replace the authored reply. Current lifecycle semantics keep both independently. | Preserve output-schema admission, actual persistence status, partial outcome and no-retry checks; require the unchanged reply and the separate warning. All 168 action/presentation/panel cases pass. |
| Large-document storage environment | The backend reports ENOSPC during a recorded-document write. This is an observed disk-space failure, not a malformed tool result. | The unchanged large-document case passes after verified archival restores disk headroom; no product code, assertion or timeout changes. |

Formal `yarn validate:full` evidence:
`tmp/local-validation/de7d1bac-4163-43ab-a493-bcc7f60d3c01`.
It stops at the security audit. The unchanged remaining formal commands were run
independently with source-bound evidence under
`tmp/conversation-closeout-independent-checks` and
`tmp/conversation-closeout-independent-2` through `-9`.
After their bounded corrections, all remaining selected checks pass. Final
functional E2E reports 543 passed and 14 opt-in skips; render contracts report
three passed. Board reports 32 passed and two guarded skips. Skips are not passes.
These separate runs do not turn the original failed full command into a pass.

## Security and delivery boundary

The repeated security check still reports GHSA-fc5q-39xc-vjpf for picomatch
versions 2.3.2 and 4.0.7. The published advisory lists affected versions through
4.0.7 and no patched release. Picomatch is an indirect glob-matching dependency
of the existing Vite, Vitest, Rollup, ESLint, micromatch and tinyglobby toolchain;
it was not added by this task. No App exploitability conclusion is established
from package presence alone.

Evidence: `tmp/conversation-closeout-picomatch.log`,
`tmp/conversation-closeout-picomatch-registry.json` and
`tmp/conversation-closeout-security-recheck.log`.
<a href="https://github.com/advisories/GHSA-fc5q-39xc-vjpf" target="_blank" rel="noopener noreferrer">Published advisory</a>.
Do not suppress the audit, lower its severity threshold or claim a patched version.
The required pre-push check remains blocked; delivery needs a valid upstream fix
or an explicit owner decision on this specific gate. No release is involved.

## Whole-feature source and semantic review

The first final verifier, `tmp/conversation-proof-9xPt6C`, found one failing
provider fixture among 3,805 server cases. Seven admission diagnostics refer to
that same failure. It was intentionally interrupted before completing other groups
and cannot establish whole-feature acceptance. Focused correction evidence is
`tmp/conversation-closeout-history-fixture.json` (one selected case) and
`tmp/conversation-closeout-history-consumers-green.json` (65 cases). An initial
focused App command lacked jsdom and failed before setup; its zero-case result
is not a product failure or passing evidence.

The second final run, `tmp/conversation-proof-AVNOhw`, passes the repaired
provider case but retains one calculation-audit timeout (six derivative admission
diagnostics). It was also interrupted and is incomplete. Original durations and
the installed timeout wrapper establish the case-budget cause; no weakened
contract was accepted. The split controls pass in
`tmp/conversation-closeout-audit-controls-reached.json`. An earlier title-filter
miss selected zero cases and is explicitly not passing evidence.

The third complete run, `tmp/conversation-proof-c7f82U`, passes server, Runtime
and Node groups. Its two App failures are obsolete storage-message expectations;
the browser reports 334 passes and one backend ENOSPC failure. It is not passing
whole-feature evidence. The corrected real-action/presentation/panel selection
passes 168 cases in `tmp/conversation-closeout-storage-consumers-green.json`.
The first edit attempt failed test setup and was corrected before this reached
run; it is not product-failure evidence. The initial browser retry filter selected
zero cases, was rejected, and was corrected only after a list-only check selected
the original case.

Task-generated backend documents are preserved as verified gzip archives under
`tmp/conversation-closeout-document-backend-archive`, with original paths, byte
counts and SHA-256 in its manifest. Only documents written by the third verifier
and named with test identities were archived. Original drawings, recordings,
local configuration and retained-session data were not removed. Task-created
localization repository copies are archived in place as
`repository.closeout.tar.gz`; their screenshots and reports remain at the original
paths. These source copies can be restored by extracting beside the archive.
The verified manifests record 289 backend documents (about 925 MiB reclaimed)
and 113 repository copies (about 2,034 MiB reclaimed). Free disk space returns to
about 7.5 GiB. The unchanged large-document retry passes with no skips or flaky
result in `tmp/conversation-closeout-recorded-reload-reached.json`.

### Final execution and explicit correction

The final complete run is `tmp/conversation-proof-z1Oq2M`. All five execution
groups have empty admission issue lists; independently collected and executed
identities reconcile. Its source/build/definition snapshots are identical.

| Group | Files | Passed | Failed or skipped |
| --- | ---: | ---: | ---: |
| Server | 103 | 3,807 | 0 |
| App and direct consumers | 145 | 1,621 | 0 |
| Runtime | 34 | 534 | 0 |
| Knowledge, Node and verification owners | 62 | 716 | 0 |
| Browser | 24 | 335 | 0 |
| Total | 368 | 7,013 | 0 |

The original final summary remains unchanged: exit 1 records three earlier
unmapped warnings, not new failing cases. Explicitly associate those warnings
with five integration criteria: healthy/corrupted calculation parameters, authored
replies under unavailable/local storage, and durable recorded-document reload.
`tmp/conversation-closeout-warning-association.json` retains every original
warning, execution ID and exact case identity. Fresh focused execution confirms
all five. The unchanged producer and exact-coverage correction APIs retire only
the matching warnings. No warning is waived or discarded based on aggregate
success. Original case files, source and compiled exports remain byte-identical
to the complete run; only these additional required selector associations change.

The initial correction publication rejected a JSON-key-order comparison and then
a stale document revision after another group published. Neither attempt published
an incorrect pass. The App correction uses the supported exact-coverage correction
API after checking the original source fingerprint and unchanged criterion binding.
The browser correction uses a fresh capture and ordinary producer publication.

One extra focused browser attempt fails while collecting diagnostics during a
navigation (`Execution context was destroyed`, line 316 of the reload test).
The unchanged traced retry passes all original persistence, canonical digest,
inspection invalidation and Undo/Redo assertions. That earlier navigation failure
has no established root cause: it is retained in
`tmp/conversation-closeout-browser-correction.json` and is **not** described as
fixed or attributed to product behavior. The successful traced execution is
`tmp/conversation-closeout-browser-correction-trace.json`. This residual test
stability uncertainty is separate from the complete run's zero-failure result.
No diagnostic exception was suppressed and no test assertion was weakened.

### Independent semantic conclusion

The prior twelve-handoff specification review supplies the unchanged semantic
baseline; this closeout rechecks the current changes, direct consumers and all
formal failure corrections rather than claiming a new unrestricted audit.

- Request, instructions and lifecycle: one canonical terminal-question reader
  serves controller and UI, while actual native follow-ups retain history and
  original source images. Invalid/conflicting terminals remain rejected. Explicit
  Stop and real pre-write cancellation have distinct tested behavior.
- Drafts and UI: actual Core runtime-property validation, observation and disposal
  own drafts. Canonical save and provider-context tests exclude unsubmitted data.
  Accepted submission retires drafts; stable settled snapshots keep progress work
  on the active message. Browser navigation and focus checks exercise real UI.
- Result, retention and media: authored replies, storage notices and real action
  outcomes remain independent. Current full owner-value validation and selected
  delivery precede reuse. Real provider and browser tests preserve next-call
  status, images and retained values; negative controls detect lost handoffs.
- Discovery, Knowledge, admission, composition and canonical mutation retain the
  existing strict owners. The executable Knowledge corpus, actual native requests,
  Host/Runtime/Core sequences, corrected-input continuation and document/peer
  assertions execute on the final source. No tool contract or compatibility route
  was added by these closeout fixes.
- Verification: healthy and deliberately corrupted audit controls still use the
  real Host and independent canonical source. Splitting workload preserves their
  illegal-value probes and original rejection titles. The moved collector fixture
  remains executed. All group reports reconcile separately collected cases; zero
  selection, prior interruptions and setup failures were never counted as passes.

Accept the bounded conversation implementation and current handoff evidence,
with the recorded navigation-test uncertainty and ordinary model variability
explicitly retained. This is not a zero-bug guarantee, a finding that every earlier
failure has a known cause, or a pass of the separately blocked security gate.
The supported manual Flow observation is recorded separately as
`tmp/conversation-proof-z1Oq2M/manual-review.json`; the original execution summary
is not rewritten. PR delivery remains blocked until the security decision is
resolved. No commit or push has occurred.


### Final documentation and delivery checks

The final plan-closeout/Flow-document checks pass all 15 cases. Naming passes;
public documentation matches 57 pages and 19 packages; all 40 changed Markdown
files have valid local targets. Current Flow admission recognizes 162 explicit
handoff selectors (the original 157 plus the five correction criteria) and a
completed manual review. `git diff --check` passes. The final security rerun
`tmp/conversation-closeout-security-final.log` still exits 1 for picomatch.
The work remains uncommitted and unpushed on
`codex/ai-conversation-improvements`, pending the owner's explicit decision about
this failed required gate. No new PR was created and PR #365 was not changed.

## Owner-directed dependency audit policy follow-up

The owner changed the repository policy after closeout: retain transitive-only
advisories as visible evidence without blocking delivery; block on vulnerable
direct dependencies. This is an authorized policy change, not an advisory-specific
exception. The bounded work owns the security audit entry, permanent CLI tests,
its CI selection and policy documentation. Keep high/critical severity, all
workspaces and production/development dependency coverage. Reuse Yarn's direct
and recursive scopes, retain both raw reports, and reject registry/process/report
failures. Remove the superseded advisory-ignore configuration. No dependencies,
App behavior, release flow or verification threshold outside dependency scope
changes. Prove the old entry blocks transitive-only evidence, then verify direct
findings and scanner failures still block. Revalidate before delivery to PR #365.

### Policy implementation and focused evidence

The actual Yarn direct scan has no high/critical findings; its recursive scan
retains picomatch 2.3.2 and 4.0.7. The shared command now passes with visible
transitive findings and retains evidence in `tmp/security-audit/run-mA2ziZ`.
No package was upgraded, overridden or excluded. The earlier two advisory-ignore
entries were removed so future recursive findings remain visible.

The first test harness attempt used CommonJS inside the repository's ESM scope
and failed before the intended boundary; it is not valid RED evidence. After
correcting that fixture, `tmp/security-policy-red-reached.log` proves the original
command rejects the actual transitive-only scenario. The replacement passes
`tmp/security-policy-green-reached.log` (46 cases), with a subsequent expanded
focused run covering the recorded real advisory and CI/local selection. The old
security gate assertion was updated to the shared policy entry; direct findings,
registry errors, malformed/truncated output and inconsistent exit status remain
blocking. This policy supersedes the delivery blocker recorded earlier, without
rewriting its original failed receipts. Final full validation is rerun before push.


### Validation follow-up and owner-requested pause

The policy regression suite passes 149 cases and scoped lint/naming pass. The
first fresh full run (`tmp/local-validation/2f41b671-9fb8-455a-b8b7-0661fd8de738`)
found four stale public source-map checks after the package script changed.
The official `yarn docs:public` generator synchronized the artifacts; all 37
focused documentation cases pass (`tmp/security-policy-docs-focused.log`).

The next full run (`tmp/local-validation/34d7fd56-9897-45c2-abe6-3f845d557ab8`)
passed security, dependencies, build graph, declarations, shared checks, AI
runtime, Design and Fieldscope. Website browser setup stopped before executing
cases: Next.js emitted its upgrade reminder and exited. The installed CLI's
`allowNudgeRetry` permits an unchanged retry within five minutes. That retry
started the website successfully; no version, guard or assertion was changed.
This identifies this run's exit cause, not any earlier unexplained startup exit.
The shared high/critical direct dependency audit remains empty; retain the
separate Next.js startup notice without claiming it is resolved.

The final run (`tmp/local-validation/23872a0f-286a-4089-b0f1-ab2d2bd2ef8b`)
again passed security, dependencies, build graph, declarations, shared checks,
AI runtime and Design. The owner requested a pause to restart Codex. After
Design passed, the coordinator sent SIGINT to the official runner; Fieldscope,
which had just started, is cancelled. The aggregate exits 130 and remains
cancelled, not passed. Remaining full checks, final delivery documentation,
commit and push to existing PR #365 are pending. Preserve all original receipts.
Do not start another 101, upgrade dependencies or create a new PR on resumption.


### Resumed full-run source reconciliation

Run `tmp/local-validation/570870f3-9d46-4e97-8353-f4b2104ad08a` passes all 37
selected checks, including every workspace, profile group, control-plane test,
collaboration, Board, functional browser and render-contract check. Its aggregate
is nevertheless `unverified`: Next.js production build regenerated the tracked
`apps/asyra-framework-site/next-env.d.ts`, replacing `dist/dev/types` imports with
`dist/types` imports for routes and root parameters. The final source collector
identifies that as the only changed input; HEAD and index are unchanged.
Retain this raw outcome. Keep the canonical production-generated declarations
and rerun full validation from that fixed source; do not exempt generated files,
rewrite the receipt or weaken the input-identity check. No App behavior changed.


## Final full local acceptance

Run `tmp/local-validation/071d604c-671e-48d8-ab96-0d73267a1925` completed with
`status: passed`, `sourceVerified: true`, and all 37 selected checks passed.
This is the complete official `yarn validate:full` result, not a union of partial
runs. The source includes the canonical Next.js production-generated declarations.
No product, assertion, resource guard or validation rule changed during this run.

| Final check | Observed result |
| --- | --- |
| Shared security, dependencies, build graph and declarations | Passed |
| Shared checks and all selected workspaces | Passed |
| Fieldscope profile groups | Passed |
| Control-plane checks | 680 passed, 57 existing skips |
| Collaboration E2E | 19 passed, 3 existing skips |
| Inspector Board E2E | 32 passed, 2 existing skips |
| Functional E2E | 543 passed, 14 existing skips |
| Render contracts E2E | 3 passed |
| Final source identity | Unchanged from this run's input |

Existing guarded skips remain skips, not passes; their conditions were not
changed. The separate complete conversation proof remains 7,013 passing cases
with no skipped case across its five groups. Its bounded semantic acceptance,
original failures and warning associations remain as recorded earlier.

The dependency policy has 149 passing focused cases. Direct high/critical
findings and scanner failures remain blocking; the real recursive picomatch
finding is fully retained. Next.js emitted its separate startup upgrade notice;
no dependency upgrade or claim that this notice is resolved is included.

Accept the bounded closeout and proceed with the already authorized commit and
push to existing PR #365. No new PR, release or 101 run is included. Local success
does not certify remote CI or remove the previously documented uncertainties.


## Reviewed commit and delivery preparation

Reviewed implementation source: `8c870e6e845cbb09ce33a09035acda09ba2241dc`. The commit contains the validated
implementation, dependency policy and archived plan records. The only changes
after the complete full run are its acceptance documentation and these exact
source references; focused closeout/task-context checks pass all 23 cases.
The final live dependency audit also passes with transitive findings retained
in `tmp/security-audit/run-i4VBJT`. No ignored local artifacts or `.env` files
are part of the commit. Push targets the existing `codex/ai-conversation-improvements`
branch and PR #365; the actual remote result is reported after execution.

## CI follow-up - native admission and Board execution scope

This bounded follow-up belongs to the existing conversation closeout in PR #365.
Run `44345335529` at `514fa7c0770bb7ff28cf2a91983fd099aca1624c` exposed missing
CI native-client provisioning and a 30-second Board fixture process timeout.
The local full run remains valid local evidence, not remote acceptance.

1. Add a failing workflow regression for native admission before functional E2E.
   Install the approved Codex CLI version from the existing admission authority
   into project-local temporary storage and validate it before exporting its path.
   Preserve offline model responses, isolated credentials and strict version checks.
2. Trace Board proof execution without reducing registered coverage. The initial
   case-selection hypothesis was rejected: all 89 current cases are registered.
   A temporary sentinel confirmed file-wide selection but does not explain this
   timeout. CI shows cleanup from the evaluation case continuing during the next
   case. Its Date-only offset and real timeout can interrupt query setup before
   both leases exist. Add delayed-transport regression, then control the scripted
   deadline with one clock and retain cleanup before advancing cases.
3. Review the bounded diff; run workflow/native admission, actual native browser
   handoff and affected Board regressions through the actual runner/localization
   path, scoped lint, naming and dependency audit. Push to PR #365; the owner will check CI without agent polling.

Do not change product behavior, contract inventories, process/test deadlines,
assertions, skip rules or credentials. No 101 or full repository test rerun. Any
additional unrelated CI failure is reported separately before expanding repairs.

### CI follow-up validation

The missing setup regression failed before the workflow change. The exact new
workflow shell installed `@openai/codex@0.160.0` locally and passed canonical
version admission. The real browser/native handoff file passed all 8 cases using
that installation, including attachment corruption detection. No model account
or paid model service was used. Workflow and native admission tests passed all
53 cases; the final focused workflow checks passed both selected cases.

The delayed-transport regression reproduced premature cutoff: with an 800 ms
response delay, the old 700 ms real timer released the parent before the child
query existed. Date and timeout now share the same virtual clock. The proof
waits for both query receipts, checks no interrupt at 699 ms, then advances the
last millisecond. All existing release, sibling lease, capacity, cancellation,
disconnect, report-failure, retained mutation and failed-release assertions remain.
Cleanup is idempotent and registered with test completion as well as `finally`,
so an early test exit aborts and joins the request before another case starts.
No production implementation, test/process deadline or contract inventory changed.

Final Board evidence: `tmp/flow-inspector/localization-runtime-qzPBkC`. The actual
Board case passed, preserving the expected four injected failures among all 89
registered cases and then all 89 passing after recovery, with original failure
history retained. Both child invocations stayed within the unchanged 30-second
process guard. This is local evidence, not a guarantee of remote runner timing.

Evidence logs: `tmp/ci-native-red.log`, `tmp/ci-native-install.log`,
`tmp/ci-native-focused.log`, `tmp/ci-native-browser.log`,
`tmp/ci-board-clock-red.log`, `tmp/ci-board-clock-green.log`,
`tmp/ci-board-focused-final.log`, and `tmp/ci-workflow-final.log`. Flow-proof
typecheck and naming passed; scoped ESLint has no errors and retains its existing
console warning. Security audit passed with the recorded indirect picomatch
finding (`tmp/security-audit/run-ZpbBxQ`).

The owner explicitly cancelled agent-side CI waiting to conserve credits. Push
this bounded correction to PR #365; remote CI acceptance remains owner-reviewed.

## CI follow-up iteration - bounded preparation and history settlement

Run `44352672580` at `6fef5f69691305ba63d0d3aa4be6a305c46a9d5d` proves the
prior local Board pass did not resolve CI execution cost. Native installation
now succeeds; functional E2E reaches translated hierarchy undo before failing.
Board and four localization cases exceed the same 30-second process guard.

Revised bounded work: retain all 89 registered cases and the unchanged process
guards. CPU profiling of the cleanup proof (`tmp/ci-proof-profile`) attributes
most sampled CPU to JSON detachment and schema conversion, repeated for the
complete App tool inventory in five resource-lifecycle variants. Those variants
exercise four real actions, not every tool's model schema. Explicitly register
those four canonical App actions in that fixture; assert the exact admitted set
and preserve all five variants and existing handoff/cleanup assertions. Full
App declaration coverage remains in its existing dedicated cases and native E2E.
No product schema cache or validation bypass is authorized.

The E2E history helper returns after a fixed 500/1000 ms sleep, not observed
replay settlement. Inject delayed real history execution into the failing native
case to prove this race. Repair the shared helper's completion boundary using
canonical history state, keeping keyboard dispatch, continuity checks and exact
undo/redo output assertions. Inspect platform key handling without assuming it
is the cause: the App registers both Meta and Control.

Gates: failing regressions first, all cumulative execution-localization scenarios,
actual Board recovery, native browser handoff and ordinary undo/redo tests, scoped
type/lint/naming and security. This replaces the earlier sufficient-clock-fix
hypothesis. No longer timeouts, skipped cases, relaxed assertions, product changes,
101, full repository test or CI polling. Push the correction to PR #365.

### Iteration validation

The exact cleanup action-set assertion failed before narrowing fixture registration
(`tmp/ci2-cleanup-red.log`). The same five real Runtime/App/provider lifecycle
variants now pass in 1.63 seconds versus approximately 11 seconds in the profiled
full-inventory fixture. There is no stubbed schema validator or product cache.
Only the fixture's registered action set changed; canonical handlers, contracts,
query leases, publication, rejection and cleanup remain real.

All five selected Board/localization regressions pass, including cumulative
omission/classification/evidence faults and the captured runtime setup failure
(`tmp/ci2-execution-localization.log`). Board evidence is retained at
`tmp/flow-inspector/localization-runtime-Txlx9m`: four expected failures plus 85
passes, then 89 passes after recovery. The recovery child takes 11.98 seconds
locally, including all cases and source loading, within the unchanged 30-second
guard. Original failure history and owner mapping remain verified.

A 1200 ms delay before the real App history API reproduced the exact CI assertion:
the helper returned while the created hierarchy still existed
(`tmp/ci2-history-red.log`). The helper now dispatches the platform shortcut and
observes canonical history depth plus replay completion instead of sleeping.
Final document, peer convergence and capture assertions are unchanged. All eight
native browser cases pass with the new helper and delayed undo/redo regression.

The first combined browser run passed 18 cases and failed the ordinary durable
reload case before any undo/redo call. The local command supplied the unsupported
`COLLABORATION_HEALTH_URL` variable; environment resolution still selected port
4145 and reused a retained service while this run read backend port 4265. Preserve
that failed run (`tmp/ci2-history-green.log`). Correcting the execution environment
to explicit `COLLABORATION_WS_PORT=4165` and backend 4265 passed the exact durable
case with trace, then all 11 ordinary undo/redo cases
(`tmp/ci2-durable-recheck.log`, `tmp/ci2-history-isolated.log`). No product change
or assertion relaxation was used for this setup error; retained services remain.

App typecheck, scoped lint and naming pass. The existing console warning is
unchanged. Dependency audit passes (`tmp/security-audit/run-X1UlVp`). This is
bounded local verification, not remote CI acceptance. The owner will check CI
after the authorized push to existing PR #365; no agent CI waiting is scheduled.

## CI follow-up iteration - real browser history interaction

At `e147a0614f978f5512b1f0fd868f13ddf0e2930b`, run `44362414760` has one
observed failing producer: native hierarchy browser replay remains at history
depth 1 with replay active. The two failed summary jobs derive from that producer;
collaboration and Board producers pass. Other queued/running jobs are not passes.
The previous delayed-replay proof established a helper defect, but did not prove
the cause of the Linux runner's stalled replay. Do not treat matching symptoms
as causal evidence.

Trace the real history route from toolbar focus through keyboard input, progressive
Factory replay and the shared host/paint scheduler. The test creates another tab
before driving the first tab; establish whether its UI operations activate the
intended page. Add real-browser focus/foreground regression before changing the
interaction helper. Change product scheduling only if evidence independently
proves a product contract violation, not merely to make an inactive test page pass.
Preserve the same original source, peer convergence, captures, all history checks
and timeout limits.

Completion requires focused native replay/ordinary history tests followed by the
complete Design functional E2E selection, because the shared helper has many
consumers. Reconcile all failed jobs from this source, distinguish independent
failures from summaries and pending jobs, and address confirmed in-scope causes.
No full repository test, skipped/relaxed case, longer timeout or repeated CI
monitoring. Push to existing PR #365; the owner checks the new CI run.

### Browser interaction proof

The initial focus probe failed its own precondition: ordinary Playwright focus
emulation reports the source tab as focused even after activating its peer.
Disabling emulation in a second CDP session did not remove the original session's
override. Neither probe was evidence of a product defect. Explicit Control and
Meta history shortcuts both pass locally; platform key choice is not established
as the stalled replay's cause.

The permanent `history-foreground.spec.ts` uses the installed Chrome and public
CDP `noDefaults` option with a separately owned browser. It verifies genuine
inactive source focus before invoking the unchanged shared helper. The old helper
fails at toolbar click, waiting for stability on that inactive page
(`tmp/ci3-foreground-action-red.log`); activating the target tab first passes both
Undo and Redo and restores exact document digests. The helper keeps canonical
replay/depth assertions and the same timeout; no product scheduling changes or
compatibility route are introduced.

The native hierarchy proof now also exercises the alternate platform shortcut
and retains host-yield, paint-wait and API-exit phases. Recording is synchronous
inside the browser and delegates to the actual public scheduler functions; it
adds no extra awaited IPC boundary or substitute scheduler. Access uses the
existing test-only runtime module. An initial full-selection attempt exposed an
invalid bare package import in the diagnostic setup, after 218 cases passed
(`tmp/ci3-functional.json`); that setup error is corrected through the test module,
not counted as a product failure or completed suite.

The old CI evidence establishes active replay but does not distinguish its awaited
phase. Native-focus reproduction proves the missing interaction precondition;
it does not retrospectively prove the exact Linux scheduler phase. Retained phase
evidence and the complete local functional selection are required before delivery;
remote Linux acceptance remains pending until the owner checks CI.

### Held-replay consumer correction

The complete functional run reaches 503 passes before the 360px native Frame
revision case fails (`tmp/ci3-functional-final.json`). Its recorded lifecycle shows
two completed replays, then `undo-yield-held` with no release. This fixture waits
for the completion helper before releasing the very promise that completes replay.
The four history-admission variants have the same conflict, including commands
that must be ignored while replay is busy. This is a consumer mismatch introduced
when the shared helper changed from fixed-delay dispatch to settled completion.

Keep the settled `undo`/`redo` contract. Extract the shared real UI shortcut dispatch
for tests that explicitly own an in-flight pause, failure, or ignored command.
Those consumers must independently observe the held state, release it, then assert
canonical completion/compensation, exact history, durable state and reload. Keep
all original negative-input and publication checks; do not make the completion
helper silently accept pending or ignored transitions. Validate both Frame widths
and all four admission variants before repeating the complete functional gate.

The first corrected focused run passes the held 360px case, then loses the 1280px
conversation during a development-server reload. The browser trace records a
second document request at `2026-11-18T18:37:42.229Z`, matching this task's formatting
writes to E2E source at `18:37:42Z`. Preserve `tmp/ci3-held-green.log` and its trace;
this agent-caused reload invalidates that run, rather than demonstrating another
product failure. Freeze source writes during subsequent browser gates.

### Final bounded validation

The frozen-source focused run passes both Frame widths and all four history
admission variants (6 cases, `tmp/ci3-held-frozen.log`). The completed ordinary
functional selection contains 558 cases: 544 passed, 14 existing conditional skips,
zero failures and zero flaky results (`tmp/ci3-functional-complete.json`, 19.9
minutes). No case, assertion or timeout was removed or relaxed. Five direct
collaboration consumers also pass: finite publication, two-actor convergence,
nested Group Undo, Group Redo and partial Fill Undo/Redo
(`tmp/ci3-collaboration.json`). The isolated status-toast case passes, as do App
typechecks, scoped lint, naming and dependency audit (`tmp/security-audit/run-LJxCSK`).
The earlier 20-case focused browser run and all invalidated/failed attempts remain
recorded above rather than being replaced by the final passing result.

The completed original CI run has one independent failed producer (Design E2E)
and three derived failures (the two forwarders and final workflow validation).
Its workspace, Board, collaboration, render-contract and Inspector producer
checks pass. Final validation identifies only failed Design observations and
those dependent jobs as blockers; there is no separate unaddressed failed producer.

This delivery corrects real test interaction and held-replay consumer boundaries.
It does not change application history/render scheduling. The exact awaited phase
of the original Linux failure was not retained by that old run; new native phase
observations close that diagnostic gap. Local acceptance is complete for the
stated scope. The owner will check the new Linux CI run after push to PR #365;
no remote-pass claim or agent CI wait is part of this delivery.

## CI follow-up - consumer-owned history completion

Run `44376337605` at `a37f734dc` exposes two failed producers: Board localization
and collaboration. The preceding validation omitted the execution-proof fixture
and the 320-item history consumer; its passing selected consumers were insufficient.
This bounded revision repairs these test-owner handoffs, not production history.

1. Restore the continuity proof's Page fixture to the real interaction contract.
   The unchanged formal case fails with `page.bringToFront is not a function`
   instead of the intended runtime-replacement violation
   (`tmp/ci4-continuity-red.log`). Verify activation and the original continuity
   failure still prevent shortcut dispatch. Preserve Board's exact four deliberate
   failures and recovery history; do not add the accidental failure to its oracle.
2. Restore the 320-item test's ownership of cooperative history completion. CI
   records Redo still replaying when the shared helper's default five-second poll
   fails, before this case's existing 180-second completion poll. Use the existing
   real shortcut dispatcher; require canonical count, history depth and replay
   settlement together under the existing case-owned budget. Preserve both actors,
   exact snapshots, hierarchy, publication, navigation and measured timings.
3. Validate the complete execution-proof file, actual Board fault/recovery flow
   and complete collaboration selection, plus App types, scoped lint, naming and
   dependency audit. Freeze source writes during browser validation. Reconcile
   the failed CI producers once before delivery; pending checks are not passes.

No timeout increase, assertion relaxation, expected-failure expansion, product
change, dependency, compatibility path, 101 run or full-repository gate is in scope.
Commit and push to the existing PR #365 after bounded validation; the owner will
inspect the successor CI run without agent monitoring.

### Native peer observation investigation

The same run subsequently fails the native two-capture sequence at the final
peer digest after Redo (`conversation-provider-handoff.spec.ts:1069`), returning
null because the peer's element count is incomplete. The unmodified focused
local pair passes (`tmp/ci4-native-baseline.json`); that does not explain CI.
Remote publication processing explicitly awaits a cooperative paint before
advancing its queue, whereas the source history helper now activates the source
tab. Investigate this visibility precondition using real browser focus, retaining
the actual two-capture native sequence and its corruption negative case. Prove
the observation failure before changing the test's page-activation handoff; do
not remove remote convergence, substitute atomic replay or increase its timeout.
This direct failed consumer joins the bounded repair and native focused gates.

The first native pair with only a peer CDP focus override still passes
(`tmp/ci4-native-focus-red.json`); it is not a reproducer and that setup was
removed. Extending the existing genuinely native-focus browser proof with a
second participant reproduces a stalled peer after source Undo: expected zero
objects, received one (`tmp/ci4-peer-red.json`). This confirms a missing visible
observation handoff; the original Linux run did not retain its precise pending
phase. Explicitly activate the participant being observed, preserving ordinary
background behavior, exact peer digests and both Undo/Redo transitions. Apply the
same activation ownership to the native hierarchy/two-capture direct consumers;
retain the original source-activation proof and all corruption checks.

### Complete CI inventory follow-up

The final 44-job inventory includes an independent Inspector validation producer,
not merely an aggregate failure. Four of its failures share the already-proven
missing `bringToFront` fixture method. Its fifth failure correctly rejects the
unregistered `history-foreground.spec.ts` case. The unchanged complete-discovery
regression also fails locally (`tmp/ci4-inventory-red.log`). Register that existing
case under the current `replay-history` responsibility, whose inputs are user
history intent and recorded canonical history; its output is the original grouped
replay outcome. The current Inspector permits public App/Framework APIs and
forbids test-owned product state. This case uses the real shortcut, App history
and remote canonical state, so its investigation entry points are the existing
Undo/Redo feature and history/transaction APIs. Do not change the architecture,
invent a new product owner or weaken exact discovery equality. Validate the
complete contract suite and all four affected runtime-localization scenarios.

### Completed local validation

- The full execution proof passes all 89 cases (`tmp/ci4-execution-proof.log`).
  The actual Board fault/recovery test passes with exactly the original four
  injected failures (`tmp/ci4-board-ready.log`). The first local Board command
  omitted its required `FLOW_PROOF_URL`; retain `tmp/ci4-board.log` as an invalid
  invocation, not a product failure.
- All nine native handoff/focus cases pass with zero skips or flaky results
  (`tmp/ci4-native-green.json`), including both image-delivery corruption oracles.
- The complete collaboration selection passes 19 cases with three existing
  conditional skips and no failures/flaky results (`tmp/ci4-collaboration.json`).
  The 320-item cooperative Undo/Redo keeps the original completion budget and
  now proves history settlement together with the local canonical count.
- The complete functional selection passes 544 cases with 14 existing conditional
  skips, no failures and no flaky results (`tmp/ci4-functional.json`, 19.9 minutes).
  Its observation is retained by the formal recorder. Isolated unavailable-service
  status also passes (`tmp/ci4-status.json`). Source files were frozen during these
  browser runs. The subsequently added manifest row changes observation ownership,
  not the already-executed test or runtime; the full suite is not rerun for that
  metadata-only correction.
- All 50 contract tests pass, including independent complete discovery; all four
  previously failing runtime-localization cases pass with original failure history
  and recovery assertions (`tmp/ci4-contracts-green.log`, `tmp/ci4-localization.log`).
- App typechecks, naming, scoped lint and dependency audit pass. Scoped lint retains
  one pre-existing `no-console` warning outside the changed lines; no errors remain.
  Security evidence is `tmp/security-audit/run-vlxtCd`.

The completed 44-job CI inventory has four failed producers: Design functional,
Board, collaboration and Inspector validation. The two forwarding failures and
final `validate` failure are derived. All producer failure cases are accounted for
above. The final diff contains only test fixtures, real browser test handoffs,
case registration and this report. No product scheduler, timeout, compatibility
path or rejection condition changed. Native-focus reproduction proves the missing
observation precondition; it does not invent the original Linux wait phase.
Local validation is complete for this bounded correction. The owner will inspect
the successor PR #365 CI run; no remote-pass claim is made here.

## CI responsibility correction - run 44385457484

The complete 44-job inventory has two directly failing producers: the complete
mechanical-repair browser case and the Control Plane CLI authority case. Three
other red jobs forward or aggregate those results. Collaboration, Board, native
Codex delivery and workspace checks passed. The integration tree equals the PR
tree at `ab821dcce1e14094fc64d5da214eea637b3c84a0`.

The browser trace reaches its final reload at 29.539 seconds of a 30-second case;
four real persistence waits consume 13.475 seconds. The final readiness wait is
where the budget expires, not proof of a startup defect. The case combines
repair/history/durability, library save/reopen, and peer-driven invalidation.
The CLI authority test runs nine actual Factory verifications under a 20-second
transport test budget, duplicating the runner's nine-scenario proof. CI retained
no substep timing, so the exact pending CLI phase remains unknown.

### Bounded revised plan

1. **Mechanical browser proof.** Move the mechanical integration cases into
   `e2e/ai-mechanical-repair.spec.ts`. Preserve the real provider-to-host-to-browser
   bridge and the complete repair/peer/history/durable-reload chain. Give library
   save failure/reopen and peer invalidation their own cases using the same real
   setup. Keep all assertions and current per-case deadlines; do not shorten the
   production persistence interval. Register each case under the existing
   `inspect-design` responsibility, with no invented product owner.
2. **CLI proof ownership.** Keep the real HTTP/service authority test to one
   baseline action and read/denial parity. Consolidate the duplicated complete
   Factory proof into `cli-proof.test.cjs`: execute the real `prove` command over
   HTTP once and retain the runner proof's exact negative failures, unaffected
   passes, identities, and recovery checks. Preserve that proof's existing
   30-second budget and process guards. Record retained stages on failure; do
   not infer a specific original timeout phase.
3. **Result forwarding.** Each selected forwarding check owns its exported
   producer result, not a sibling's result. Add executable shell regressions
   for successful collaboration with a failed functional sibling, and rejection
   of missing, failed, skipped or cancelled selected results. Reject impossible
   skipped/cancelled workflow states. Keep overall workflow failure blocking
   `validate`. Report-error evidence stays unverified by the current spec;
   do not weaken it to make a passed representative case green.

The existing CI failures are the formal red browser/CLI evidence. Add forwarding
counterexamples before implementation. After each slice run its focused tests
and review retained assertions and consumers; then run complete Design functional
and Control Plane validation, exact discovery, App typechecks and scoped lint.
No product scheduler, model prompt, persistence policy, dependency, compatibility
path or 101 test changes are authorized. No full repository test is selected.
New names identify test responsibilities only; existing product and persisted
identities stay unchanged. Naming baseline passes. Final review is limited to
these owners, direct consumers and fixed gates. Push to the existing PR #365
after validation; the owner will inspect CI without agent polling.

The reviewed `inspect-design` flow consumes selected canonical targets and current
evidence, produces scoped inspection outcomes, and permits public App APIs while
forbidding test-owned product state. The cases continue to use those APIs. Core
Proof owns real runner execution and exact source-bound negative/recovery proof;
the forwarding contract in `CORE_PROOF.md` assigns each required check its actual
producer. File splitting changes test ownership, not product flow semantics.

### Focused outcomes and review

- All seven mechanical browser cases pass without retries, skips or extended
  deadlines (`tmp/ci6-mechanical.json`). Complete repair/history/reload takes
  21.403 seconds locally; save/reopen and peer invalidation take 14.805 and
  11.761 seconds. These local durations do not establish CI performance.
  Existing failure, no-progress, cancellation and interruption variants retain
  their original runtime and history assertions. Library recovery still verifies
  no canvas replay, stale receipt rejection and fresh-request mechanical checks;
  peer invalidation still proves exactly the affected root is remeasured.
- All 34 CLI/proof/runner tests pass (`tmp/ci6-cli.log`). One nine-run real
  CLI-to-HTTP-to-service proof retains every previous identity and exact-negative
  assertion. It takes 9.987 seconds locally; the one-action authority case takes
  1.098 seconds. The duplicated direct runner scenario loop is removed; runner
  isolation, cleanup and evidence rejection tests remain.
- The executable forwarding regression first fails on
  `true/failure/success` (`tmp/ci6-forward-red.log`), then all 50 forwarding and
  aggregation tests pass (`tmp/ci6-forward-green.log`). A successful collaboration
  forwarder does not conceal failed functional/overall results. Cancelled,
  missing and skipped selected outcomes remain rejected.
- Exact functional discovery passes all 50 contract cases, including the two new
  mechanical registrations (`tmp/ci6-contracts.log`). App typechecks and scoped
  lint pass (`tmp/ci6-types.log`, `tmp/ci6-lint.log`). No runtime behavior changed.

The fixed-boundary review preserves the original assertions at their new owners.
Report-error observations remain non-passing by specification, and the aggregate
still blocks unsuccessful required jobs. Complete producer validation follows;
focused success alone is not the final acceptance result.

### Complete bounded acceptance

The final test review adds explicit history-depth and transaction-idle equality
before/after library save and fresh-host reuse. This preserves the original
no-extra-history obligation without making that case repeat the independent
repair/history/reload sequence. The focused browser case passes again
(`tmp/ci6-library-history.json`).

- The exact CI Control Plane selection, independently compared with the formal
  command's top-level file inventory, includes all 36 files and the new CLI proof.
  It passes 681 cases with 57 existing conditional skips, zero failures and zero
  cancellations (`tmp/ci6-control-plane.log`, 738 total, 617.216 seconds).
- Complete Design functional validation passes 546 cases with 14 existing
  conditional skips, zero failures, zero retries/flaky outcomes and zero report
  errors (`tmp/ci6-functional.json`, 560 total, 1344.617 seconds). The complete
  mechanical chain takes 20.784 seconds; save/reopen takes 14.801 seconds and
  peer invalidation takes 11.768 seconds. All seven variants pass. Sources were
  frozen during this run, including the added history equality assertions.
- Isolated unavailable-service status passes its one case
  (`tmp/ci6-status.json`). Both complete producer reports are retained through
  the formal observation begin/complete paths, with no evidence collection error
  (`tmp/ci6-functional-observation.log`, `tmp/ci6-status-observation.log`).
- Final naming, scoped lint and changed code/contract formatting checks pass.
  App typechecks pass. Dependency audit passes with evidence retained at
  `tmp/security-audit/run-VH69UM`. Task-owned browser service ports are closed.

The final scope contains test responsibility separation, exact case registration,
producer-specific forwarding and their documentation. The aggregate's rejection
rules, product persistence window, process cleanup guards, ordinary browser
deadlines and existing complete-proof budget remain unchanged. No compatibility
path, new dependency, model call, 101 run or full repository test was introduced.
Historical failure evidence remains intact, including the unknown original CLI
timeout substep. Local acceptance is complete; successor remote CI is not claimed
to pass and will be inspected by the owner.
