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
For a planned before/after comparison, use the experiment commands below. They
retain the hypothesis and declared configurations before admitting fresh runs.
Small pilot samples are descriptive, not statistical proof.

## Run an Improvement Experiment

The [agent-improvement-eval skill](../../skills/agent-improvement-eval/SKILL.md)
guides failure analysis, case selection, experiments and interpretation. Invoke
it with `$agent-improvement-eval` or an improvement-assessment request. Install
repository skills with `./scripts/install-skills.sh`; this does not start an
experiment or enable automatic rule changes or retries.

Use one experiment for one improvement hypothesis. Write a definition inside the
project, for example `tmp/agent-evals/owner-comparison.json`:

```json
{
  "formatVersion": 1,
  "hypothesis": "An explicit owner lookup reminder reduces incorrect-owner edits.",
  "failureEvidence": "Illustrative pilot only. Replace with a sanitized real failure and evidence reference before drawing conclusions.",
  "change": {
    "layer": "skills",
    "description": "Add an owner lookup reminder to the task workflow.",
    "files": ["docs/ai/workflows/agent-task.md"]
  },
  "configurations": {
    "baseline": "Record exact model, settings and original instruction configuration here.",
    "candidate": "Record the same model/settings and the proposed instruction change here."
  },
  "mode": "agent",
  "samplesPerCase": 2,
  "development": ["docs-routing", "bugfix-range"],
  "holdout": ["feature-ownership"]
}
```

These three existing cases illustrate the mechanism; this split is not evidence
that the cases represent a particular real-world failure. Choose representative
cases and the sample count before observing results. Configurations are operator
attestations: record model/settings/context and apply them to the executing
session yourself. The CLI neither configures nor invokes a model. Answer-informed
or scripted executions must use `replay`, including demonstrations of this guide.

```sh
yarn agent:eval experiment owner-comparison tmp/agent-evals/owner-comparison.json
yarn agent:eval trial owner-comparison baseline docs-routing owner-before-1 coder-1
```

The trial command prepares a fresh run and returns its prompt, workspace,
configuration, partition and sample number. Use the existing `admit`,
`regression` where applicable, `evaluate` and `review` commands for that run.
Repeat for the declared development cases and sample count in both variants.
Use a fresh execution context per independent sample. Retries within a run stay
one sample; reports disclose the number of evaluation attempts.

The baseline instruction sources are frozen at experiment creation. Only the
listed captured instruction files may differ in the candidate. The candidate's
complete source set is frozen at its first trial. Run each variant with its exact
source configuration; switching variants may require explicitly restoring that
variant's instruction files in the isolated project worktree. The tool never
rewrites those files. Complete semantic reviews while the run's suite is current.
Historical reviewed baseline results can then be compared with the candidate.
Use `change.files: []` for a configuration-only experiment with unchanged files.

After every planned development sample has a terminal result, holdout trials
become available. An automatic failure or a rejected semantic review is terminal;
a missing evaluation or pending review is not. The first holdout release freezes
the development evaluation IDs and snapshots. Revising that evidence, tuning the
candidate again, or exceeding the planned sample count requires a new experiment.

```sh
yarn agent:eval trial owner-comparison candidate feature-ownership owner-holdout-1 coder-1
yarn agent:eval compare owner-comparison
```

Holdout is a procedural partition, not a secret test store: the repository's
cases are readable, and the CLI cannot enforce an agent's memory or prevent
someone using `prepare` outside an experiment. Do not use holdout feedback to
retune the same experiment. Record prior exposure and retire exposed cases from
claims of unseen generalization; future improvement needs fresh reserved cases.

`compare` saves an immutable result under
`tmp/agent-evals/.experiments/<id>/comparisons/`. It includes the frozen hypothesis,
configurations, changed instruction paths, exact run/evaluation references,
source revisions, and per-case/per-partition counts:

- passed, failed, pending, missing, planned samples and evaluation attempts;
- candidate minus baseline pass rate only when both groups are complete;
- improved, regressed, unchanged or incomplete outcomes for each case.

No aggregate rate pools unlike cases. The overall outcome is incomplete while
any group is incomplete; otherwise any regression takes precedence over gains
elsewhere. Inspect all groups even when the overall outcome is incomplete.
Failed runs cannot be replaced with fresh runs in a filled slot. Existing runs
cannot be imported retroactively. All runs inherit the experiment's one mode,
so replay and observed-agent results cannot mix. Local actor labels and evidence
remain unauthenticated, as with individual runs.

Comparison exit status is `2` for incomplete, `1` for a complete comparison with
regressions or an invalid operation, and `0` for a complete improved/unchanged
comparison. Zero does not mean all tasks passed or prove the hypothesis: equal
failure rates are unchanged, and a small observed gain is descriptive. Review
failures, exposure, configuration fidelity, attempt counts and confounders before
deciding whether to retain a proposed change.

Fixtures, evaluation code, oracles and rubrics must stay fixed within an
experiment. Improvements to those owners create a new benchmark; they cannot
be presented as an agent gain against the old benchmark. Historical reports
remain readable. Add representative cases using [case authoring](case-authoring.md).

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
- `experiments.mjs` owns version-1 experiment definitions, fresh trial assignment,
  frozen variant sources, holdout release and comparison artifacts. It consumes
  the engine's reports instead of rerunning tests or interpreting raw test output.
  Each comparison snapshots each evaluated run once and reads shared current
  contract sources once per invocation; a later comparison refreshes evidence.
  Experiment versioning is separate from existing version-1 run records.
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

### Automation Assessment - Not Implemented

Automatic rule changes could be useful for producing a bounded candidate patch
from repeated failure evidence. A future implementation would need an explicit
instruction-file allowlist, fixed expectations, comparison against untouched
holdout cases, and review before adoption. It must not change its own grading
rules, authorization boundaries or acceptance criteria to obtain a pass. For
now, an agent may propose or implement an improvement only within the user's
authorized task scope; experiment results never authorize a global rule change.

Unattended retries could be useful for transient infrastructure failures or a
bounded correction within one already-authorized task. A future implementation
would need explicit attempt/time/cost limits, a fixed task scope, owned process
cleanup, an interruption path, preserved failed attempts and a stop on repeated
nonprogress or required input. Semantic rejection must not silently turn into
infinite retries. The current tool records attempts but does not schedule,
retry, dispatch agents, merge changes or continue work in the background.

Both capabilities remain assessment-only. Agent dispatch is excluded from this
eval improvement scope.

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
and timeout cleanup. Experiment coverage includes frozen definitions and
variants, pending and missing samples, sample-budget enforcement, holdout
release, regression detection, stale evidence, immutable comparisons, CLI exit
states and shared-read/snapshot work counts. It is
included in `test:scripts` and therefore the existing CI test job. These are
tests of the evaluation machinery; observed model quality requires actual agent
runs and an independent review.
