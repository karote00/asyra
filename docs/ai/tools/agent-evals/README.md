# Repository Agent Evals

This repository-owned Node.js tool evaluates a small, fixed set of development
tasks. Any agent can consume a prepared prompt. The tool captures task files,
runs formal tests and independent behavioral assertions, requires semantic
review, and groups failures by the layer that owns their correction.

Source: `scripts/agent-evals/`. No extra dependency, provider credential, or
model dispatch is required. Use the repository's declared Node.js 24 runtime.

## Three Permanent Cases

| Case                | Task                                                                                    | Automated evidence                                                                                                                          | Semantic review                                                            |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `docs-routing`      | Explain PR push authority while retaining validation, merge, and publication boundaries | Admitted workflow/owner, exact file scope, nonempty changed document, handoff                                                               | Correct interpretation of the actual Git policy; no weakened authorization |
| `bugfix-range`      | Include both endpoints and zero-width ranges                                            | Existing baseline tests, real assertion failure before runtime edits, identical regression tests after correction, external endpoint oracle | Regression quality and accuracy of the explanation                         |
| `feature-ownership` | Append display metadata while preserving saved user names                               | View-only mutation boundary, changed formal tests, external oracle for metadata and immutable model input                                   | Correct semantic owner and Inspector applicability reasoning               |

These deliberately small fixtures exercise repository procedures. They do not
prove competence across the full Framework, all products, or every real task.
The documentation oracle checks structure only; its semantic review is required.

## Run a Case

From the worktree root, use `yarn agent:eval` or its equivalent direct entrypoint:

```sh
node scripts/agent-evals/cli.mjs list
node scripts/agent-evals/cli.mjs prepare bugfix-range range-trial coder-1 agent
```

Preparation creates `tmp/agent-evals/range-trial/`, with a prompt, isolated
fixture workspace, baseline source hashes and test output. The run identity is
exclusive; existing runs are never overwritten. `coder-1` is the operator's
actor label, not an authenticated identity or verified model version. Supply
`replay` instead of `agent` for scripted, answer-informed, or demonstration
runs. Replays must never enter observed agent success totals.

Give the agent `PROMPT.md` and the candidate workspace. The agent reads the
repository task workflow, writes `PLAN.json` inside the workspace, then admits
the plan before editing any task file:

```sh
node scripts/agent-evals/cli.mjs admit range-trial
# Add the formal regression in the candidate workspace, before runtime edits.
node scripts/agent-evals/cli.mjs regression range-trial
# Repair the runtime owner and write HANDOFF.md, then evaluate.
node scripts/agent-evals/cli.mjs evaluate range-trial
```

`PLAN.json` contains `workflow`, `owner`, `references` and `scope`. Paths in
`scope` and `owner` are fixture-relative; `references` are repository-relative
source-of-truth documents. The prepared prompt defines the task's allowed files.
The admitted plan is immutable. An incorrect admission or changed task contract
needs a new run instead of silently widening the old run.

The regression command is specific to the bug case. It rejects unchanged tests,
runtime changes made before the checkpoint, syntax errors, crashes and timeouts.
Evaluation requires the same regression bytes to pass after the runtime fix.
The feature case also requires changed formal tests. Repository-owned behavior
oracles live outside the writable candidate fixture and are rerun on each
evaluation; green candidate tests alone cannot conceal the seeded bug.

Evaluation writes an immutable attempt and a review template. Exit status `1`
means failure, `2` means automatic checks passed and semantic review is pending,
and `0` means the requested operation succeeded or a report fully passed.
Preparation and admission returning zero do not mean the task passed.

## Review and Compare

A distinct reviewer inspects the prompt, source diff, tests, raw command evidence,
and HANDOFF.md. Fill the emitted review template's `reviewer`, boolean `pass`
decisions, and evidence-specific `reason` fields, then submit it:

```sh
node scripts/agent-evals/cli.mjs review range-trial tmp/agent-evals/range-trial/reviews/REPLACE-WITH-EVALUATION-ID.template.json
node scripts/agent-evals/cli.mjs report range-trial
node scripts/agent-evals/cli.mjs summary range-trial another-range-trial
```

Review binds to the latest exact source snapshot and evaluation. Missing
criteria, empty reasons, the candidate's own actor label, stale source, automatic
failures, and duplicate review submissions reject. A rejected semantic review
is a failed task; a new corrected evaluation can receive a new review. A named
reviewer is an explicit local attestation, not authentication. Tool tests use
labelled replay reviews and cannot claim independent human acceptance.

The summary admits each distinct run once and uses its latest evaluation. It
groups by case, suite fingerprint, and mode, with passed, failed, and pending
counts plus failures by layer and criterion. It does not pool unlike cases or
mix replay and agent results. Pending reviews remain in the denominator and are
never passes. Repeated attempts within one run are not independent samples.
Comparative experiments use fresh runs with the same cases and suite revision,
record the changed instruction/model configuration externally, and report the
sample counts. Small pilot samples are descriptive, not statistical proof.

## Architecture and Evidence Ownership

The data flow is:

```text
versioned case + repository contracts
-> exclusive prepared workspace + baseline evidence
-> pre-edit plan admission
-> candidate edits + optional failing regression checkpoint
-> frozen source snapshot + candidate tests + trusted behavior oracle
-> exact-snapshot semantic review
-> grouped failure report -> bounded correction -> new comparable run
```

- `catalog.mjs` owns case identities, prompts, allowed files, expected routing,
  and review criteria. Format `1` is a new tool-local persisted contract;
  unsupported versions reject. It does not migrate other tool histories.
- `engine.mjs` owns preparation, evidence, snapshot identity, subprocess lifetime,
  review admission and aggregation. Each evaluation captures source before and
  after its checks and rejects concurrent mutation. It does not cache mutable
  candidate output. Summary validates each run once, then aggregates that result.
- `__tests__/behavior-oracle.mjs` owns independent behavior assertions. Candidate
  test success and the agent's prose cannot replace these assertions.
- `cli.mjs` exposes these operations and exit states. It never dispatches a model,
  starts another agent, changes a source checkout, or merges a PR.
- Existing Framework/App owners and Flow Inspector contracts remain semantic
  authorities for real product work. This pilot neither extends the Inspector
  execution broker nor closes its deferred provider or remote-verification work.

Source evidence includes the repository commit, retained suite and contract
source bytes in `suite.json`, and fingerprints of those bytes and the candidate
files. Dirty suite edits therefore identify a different benchmark revision.
Historical reports remain queryable with `currentSuite: false`, grouped under
their retained fingerprint and interpreted with their original review rubric.
They cannot receive new verification or review
against changed rules. Any candidate edit makes its previous evaluation stale.
Local reports and prepared workspaces stay under ignored `tmp/agent-evals/`.
Do not commit task transcripts, credentials, or local run artifacts.

Each verification subprocess has a five-second timeout, bounded output, recorded
PID and exit state. Node permissions allow reads of the candidate and the exact
oracle as needed, deny writes, and do not grant network, child-process or worker
capabilities. Tests run without process isolation so they need no child-process
grant. These limits constrain accidental effects; Node permissions and local
hashes are not an OS sandbox or independent protection against hostile code or
a same-user actor rewriting the runner and its records. Do not use this pilot
to execute hostile third-party candidates or to authorize deployment.

## Improve the Owning Layer

Use the summary's failed criterion and evidence to choose one bounded change:
Skills for missed routing/procedures, Architecture for boundary errors,
Verification for ineffective tests, or Evals for a missing representative case.
Retain the failing case and its original expected outcome. After changing the
owning layer, run the same case set again. A changed suite fingerprint begins a
new group; compare the actual changed contract before interpreting the outcome.
No automatic rule editing or unbounded retry loop is part of this tool.

## Permanent Verification

```sh
yarn test:agent-evals
# Equivalent without an installed worktree dependency state:
node --test scripts/agent-evals/__tests__/engine.test.mjs
```

The suite executes all three corrected fixture replays and real negative cases:
wrong owners, edits before admission, scope violations despite correct output,
weak tests hiding the bug, broken or weakened regressions, stale/self reviews,
invalid identities/versions, retained historical suites, separate replay/agent
counts, shared contract-read counts, CLI exit states, symlinks, write denial,
and timeout cleanup. It is
included in `test:scripts` and therefore the existing CI test job. These are
tests of the evaluation machinery; observed model quality requires actual agent
runs and an independent review.
