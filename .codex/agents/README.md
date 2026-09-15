# Project agent roles

These eight reusable role definitions are project-scoped. They do not represent
eight continuously running workers. The existing project configuration allows
seven subagent threads in addition to the leader; it has not been changed.

| Role                    | Model           | Effort   | Assignment                                                |
| ----------------------- | --------------- | -------- | --------------------------------------------------------- |
| `product_architect`     | `gpt-6-astra`   | `high`   | Complete product and owner design before implementation   |
| `algorithm_engineer`    | `gpt-6-astra`   | `high`   | Numerical, geometric and performance algorithms           |
| `correctness_reviewer`  | `gpt-6-astra`   | `high`   | Independent review of completed high-risk PRs             |
| `feature_engineer`      | `gpt-5.6-sol`   | `high`   | Complete feature or integration sub PR                    |
| `verification_engineer` | `gpt-5.6-sol`   | `medium` | Declared test and visual acceptance gates                 |
| `blender_operator`      | `gpt-5.6-sol`   | `medium` | Blender scenes, scripts, exports and rendered artifacts   |
| `git_integrator`        | `gpt-5.6-terra` | `medium` | Validated commits, PR metadata and authorized integration |
| `evidence_researcher`   | `gpt-5.6-terra` | `medium` | Bounded primary-source and repository evidence            |

## Leader coordination

Select the role, model and effort before dispatch. Read only the selected role
file, then provide the task objective, exact worktree/branch/source, necessary
current contract paths, trusted prior evidence, completion conditions and
exclusions. Do not inject the full conversation or every role definition.

External applications have separate tool-specific roles. The current catalog
contains only a Blender operator; do not expand it into a general external-tool
operator. Add a separately scoped role when another application is actually needed.

Continue the same agent for the same unfinished task when its model and context
remain appropriate. A reusable role is not a mandate to accumulate unrelated
projects in one permanent transcript. Use an isolated execution context when the
assignment changes substantially or its required model changes. Stable decisions
belong in the current project contract; transient logs are not global memory.

The leader owns dependencies, user decisions and delivery status. Workers own
complete bounded deliverables. Do not make every local edit or ordinary Git
command require a new handoff. Activate specialist review and integration when
the completed work actually requires them. Unrelated writers use separate
worktrees; no two workers own the same mutable files simultaneously.

Plan the complete sub PR before editing, then implement and run its consolidated
gates. One independent review returns the complete set of concrete findings.
Resolve that set coherently and rerun affected checks; do not restart open-ended
discovery or full validation after each tiny edit. Follow newer explicit user
instructions when they change this workflow.

Workers notify the leader directly on completion or a genuine blocker, with a
compact result, source/PR identity, evidence and remaining limitations. Do not
schedule status checks or poll other agents. When no independent work remains,
the leader may use the available message-event wait; this does not claim a new
background wake-up service for a stopped desktop task.

## Runtime binding and verification

The TOML role files are the authoritative definitions. This session's exposed
collaboration API accepts explicit model/effort values but has no custom-role
selector. Until native name-based loading is confirmed, the leader reads the
selected file and explicitly supplies its instructions, model and effort to the
delegation tool. Do not claim that a filename or task name alone activated a role.

All eight files passed TOML parsing and required-field checks. Native automatic
loading and live dispatch should be verified on the next necessary assignment,
not by creating an otherwise unnecessary model task. Existing running agents do
not change model merely because a role file changed.

No new SDK, model provider, API key, global configuration, dependency or runtime
was introduced. Role instructions do not grant new filesystem, Git, publication
or hardware permissions. The current goal PRs must not merge into main.

Official format reference:
<a href="https://learn.chatgpt.com/docs/agent-configuration/subagents#custom-agents" target="_blank" rel="noopener noreferrer">Codex Custom Agents</a>.
