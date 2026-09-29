# Turn a Real Failure into an Eval Case

Use this procedure when the user authorizes improving the workflow or evals.
Normal product tasks retain their own scope. The agent must not invent a real
incident or copy private transcripts into the repository to fill a benchmark.

## Preserve the Behavior

1. Describe the observed failure and expected outcome using existing task
   evidence. Record a sanitized evidence reference, the responsible owner and
   the relevant instruction revision. Separate observed facts from a proposed
   cause; a layer label does not establish causality.
2. Reduce the failure to a small deterministic fixture. Remove secrets, personal
   data and unrelated product code. Preserve the behavior that made the original
   attempt fail, including ownership or authorization boundaries when relevant.
3. State the prompt, editable files, expected owner/workflow and review criteria
   before running the candidate. Derive expectations from the authoritative
   behavior contract, never from the generated answer.

## Add Permanent Evidence

The case catalog is `scripts/agent-evals/catalog.mjs`. Add a stable, neutral case
ID, minimal source/test files, allowed scope and source-of-truth references there.
Use the existing workflow categories. Extending their meaning is a separate
bounded evaluator change, not a case-local exception.

Add independent assertions in
`scripts/agent-evals/__tests__/behavior-oracle.mjs`, outside the candidate's
editable workspace. Use semantic review for judgments that cannot be expressed
as reliable assertions; documentation keywords alone cannot prove correctness.

In `scripts/agent-evals/__tests__/engine.test.mjs`, retain both the reproducing
failure and a corrected replay. Prove the evaluator rejects the original failure
even if the candidate's weak tests pass. Cover meaningful near misses, such as
correct output obtained from the wrong owner. Keep process/output limits and
project-only writes intact. Label these deterministic tests as replay evidence.

Run `yarn test:agent-evals`, `yarn lint:naming`, scoped lint and affected contract
checks. A new catalog/oracle revision changes the suite fingerprint. Prepare
fresh runs; do not rewrite old results or pool scores from different rubrics.

## Use the Case to Evaluate an Improvement

Use the experiment definition in [the tool guide](README.md) to freeze one
hypothesis, evidence, baseline/candidate configurations, sample count and disjoint
development/holdout sets. A failure already inspected to design the improvement
belongs in development. Reserve other representative cases for evaluation.
Once holdout feedback influences a change, those cases are exposed and cannot
support a later claim of unseen generalization.

Keep the task expectations fixed. Record whether the proposed change was
supported, unchanged, regressed or inconclusive, citing the retained comparison.
Include failed, missing and unreviewed runs. Multiple attempts on one task are
one sample, with their attempt count disclosed. More passing replay tests prove
the evaluator's behavior; actual agent improvement needs fresh agent runs and
explicit independent semantic review.
