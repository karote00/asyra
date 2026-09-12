# Target Work Admission - Bounded Closeout

Date: 2026-09-12. Implementation delivered for review in
<a href="https://github.com/karote00/asyra/pull/193" target="_blank" rel="noopener noreferrer">PR 193</a>.
This closes the first target/work admission slice only. Merge is not authorized.
The [multi-PR plan](../flow-inspector-multi-pr-development-and-integration-plan.md)
remains active for integration verification and explicit acceptance.

## Delivered behavior

One local repository can retain a flow development target, complete assigned or
pending obligation coverage, immutable work promises and audited allocation
revisions. Multiple work items retain distinct task, attempt and candidate PR
observations across restart. Unknown references, cycles, responsibility overlap
and missing obligation coverage reject complete decisions.

A source-bound admission reserves a task UUID before work. It binds the work,
actor, accepted revision, complete existing baseline proof, source digest and
HEAD under the existing store lock. Start and resume consume the target owner's
check; mismatched source, scope or identity never reaches candidate operations.
Admitted commitments cannot be removed to hide failed work. Existing independent
tasks remain readable and executable; linked historical tasks require explicit
source admission before further execution and retain their original records.

Board preparation, API and CLI use the same owner. Reserved tasks are visible
before execution. Bounded assessment separates pending, unknown, failed, passed
and stale, preserves previous attempts, and never combines different HEADs into
a completed target. Unconfirmed prerequisites refuse admission; this slice adds
no handoff evidence issuer or manual confirmation bypass.

## Evidence and delivery gate

Permanent tests first failed on missing target admission, missing task binding,
missing execution enforcement and the Board preparation path. The corrected
owner and action cases cover source/actor/scope/identity refusal, immutable
admissions, process restart, rejected-source retry, multi-task failure visibility,
baseline invalidation and API/CLI parity. A macOS offline demonstration retains
real Factory inverse regression followed by a six-obligation correction in the
same admitted task without baseline acceptance.

The local delivery gates are the complete control-plane suite, seven-run Factory
proof, package React/static/consumer contracts, typecheck/build, naming/lint and
full Board suite. Desktop, tablet and narrow screenshots are inspected separately
from automated assertions. Two optional retained live-record browser replays
require historical external trial records; they are not replaced by new model
requests or reported as passing.

PR review readiness additionally requires every check on the latest pushed HEAD
to pass. The PR description records that exact HEAD and CI result after settlement;
old-HEAD checks cannot certify a later commit. Local raw reports and screenshots
remain under the worktree's `tmp/flow-inspector/` and are not published artifacts.

## Remaining work and release boundary

Source-bound prerequisite handoff verification, broader scoped verification,
complete multi-PR integration assessment and target acceptance remain open.
Required-check protection, independent verifier/issuer, provider reconciliation,
team/tenant/parallel scheduling and hosting remain deferred. A passed work item,
PR creation, passed checks or merge never accepts the baseline.

The implementation records only a Flow Inspector patch Changeset through the
existing CLI. No version command, publication, tag, protection, deployment or
merge operation is part of closeout. Existing candidate sandbox, broker tools,
all six Factory obligations and unresolved provider dispatch blocks remain intact.

Current authorities: [Core Proof](../../CORE_PROOF.md#work-admission-before-execution),
[Agent Execution](../../AGENT_EXECUTION.md#target-work-admission), and
[operation instructions](../../../../../../tools/flow-inspector/control-plane/README.md#admit-work-before-execution).
