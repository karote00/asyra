# Agentic Engineering System

The repository development loop connects four existing responsibilities:

```text
Skills -> Architecture -> Verification -> Evals -> improve the owning layer
```

The ordinary entry is [Repository Agent Task](agent-task.md). An implementation
or documentation request activates this route through `AGENTS.md`; the user does
not need to remember workflow commands. Read-only questions keep their existing
lightweight path. Execution is single-agent unless the user explicitly requests
otherwise.

## Four Layers and Their Owners

| Layer        | Repository owner                                                                                                                  | Observable result                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Skills       | Existing `docs/ai/skills/`, workflow commands, and the task routing guide                                                         | The agent selects a procedure and the minimum applicable source contracts from the requested outcome         |
| Architecture | Framework/App ownership contracts, bounded task scope, type/lint boundaries, existing safety hooks and applicable Flow Inspectors | Changes stay at the canonical owner and inside authorized scope; enforcement claims identify the actual gate |
| Verification | Formal tests, naming/lint/build gates, Inspector obligations and visual-review contracts                                          | The completion claim cites applicable executed evidence and preserves unresolved limits                      |
| Evals        | [Agent eval tool](../tools/agent-evals/README.md), permanent cases, retained attempts and exact-source reviews                    | Repeated task failures can be reproduced, classified, corrected at the owning layer, and compared            |

Rules describe obligations; architecture and executable checks enforce the
subset they own. A rule document or a passing adapter test does not prove a
native hook ran. Existing Flow Inspector execution remains limited by its own
contracts and accepted capabilities. This development loop adds no new provider,
agent dispatch, runtime dependency, or product authority.

## First Working Evaluation Loop

The pilot contains three isolated fixture tasks: documentation authority,
regression-first boundary repair, and display/model ownership. The
[tool guide](../tools/agent-evals/README.md) contains the exact commands.

1. Prepare a named task with a source revision, suite fingerprint, baseline
   tests, prompt, and allowed files.
2. Have the agent choose the workflow, owner, references, and scope. Admit that
   plan before it changes task files.
3. Capture an actual failing regression before a bug fix. Preserve the same
   regression through the correction.
4. Evaluate actual changed files, candidate tests and repository-owned behavior
   assertions against the same source snapshot.
5. Have a distinct reviewer judge intent, reasoning and handoff quality. Missing
   semantic review remains pending, even when all automated checks pass.
6. For an authorized improvement, freeze an experiment's hypothesis,
   baseline/candidate configurations, case partitions and sample count. Compare
   fresh runs using fixed expectations. Complete development evidence before
   releasing holdout cases and keep those results out of tuning. Scripted
   replays and observed agent runs remain separate populations.

The evaluator deliberately does not grade documentation semantics by keyword
presence or claim that a declared reference proves it was understood. Its
human-readable evidence and explicit semantic review cover those judgments.

## Apply the Feedback

| Observed failure                                    | Smallest useful correction                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| Wrong workflow or missed procedure                  | Improve the owning workflow or skill, retaining its source-of-truth links |
| Correct output obtained by changing the wrong owner | Correct the ownership boundary or its applicable guard                    |
| Passing tests conceal wrong behavior                | Strengthen the formal oracle and retain a failing regression              |
| Existing cases never exercise the failure           | Add a representative task and negative case to the eval suite             |

Use concrete recurring failures to drive changes. Do not add global rules,
scorecards, or additional process solely because a task was difficult. Normal
product work retains its own bounded scope; workflow improvements outside that
scope become explicit follow-ups.

## What Completion Means

For an ordinary task, completion requires the requested behavior, bounded review,
and applicable verification. For an eval run, completion additionally requires
current source evidence and an explicit semantic review. For a change to this
system, run its permanent suite, naming/lint gates and directly affected
repository contracts before committing and creating a PR.

The shipped replay tests prove that the evaluation machinery accepts correct
fixtures and rejects known failure modes. They do not establish an agent success
rate or prove that the entire repository workflow has improved. That conclusion
requires real comparable agent runs and independent review, using the same
retained cases and expectations.

The eval tool now retains explicit before/after experiments, including missing
samples, semantic-review state, failed attempts and case-level regressions. It
does not infer causality from a small pass-rate difference. The tool guide also
contains the assessment of bounded automatic rule proposals and unattended
retries; neither capability is implemented or activated. Agent dispatch is
outside this eval scope.
