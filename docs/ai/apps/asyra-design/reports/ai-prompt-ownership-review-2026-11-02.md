# AI prompt ownership review - 2026-11-02

## Decision and scope

Review baseline: `d0075d16e0c01776211a8bd773c222a20e3d1422`, existing
`codex/ai-conversation-improvements` worktree. Associated product plan:
[Editable Design Agent](../plans/ai-design-agent-plan.md). This is a user-requested
review follow-up, not reopening accepted conversation corrections or closing the
parent plan.

The user wants domain knowledge to remain an on-demand reference, not a mandatory
production method. The proposed direction is a small always-present App contract,
optional design advice, and exact operational guidance delivered by its tool owner.
Do not replace the current material-first preference with a mandatory skeleton-first
or completeness-first pipeline.

The initial review deliverable was an ownership review and migration proposal only.
No production prompt, tool, knowledge, runtime, spec, Inspector or test was changed
during that review. The subsequent authorized implementation is recorded below. Discovery was
limited to the prompt exports, their immediate provider/image consumers, knowledge
entry and material topics, existing discovery descriptions, and direct prompt/spec
contracts. Validation is source-to-proposal review and local link validation.
No live model run, release workflow, dependency change, push or source rebase.

## Current injection paths

- [ai-domain-prompt.ts](../../../../../apps/asyra-design/server/ai-domain-prompt.ts)
  defines `AI_APP_PROMPT` (lines 66–266), `AI_OPERATION_INSTRUCTIONS` (268–320),
  image guidance (322–329), and conversation history instructions (331–340).
  Ranges below refer to this baseline, not a future edited file.
- [local-ai-provider.ts](../../../../../apps/asyra-design/server/local-ai-provider.ts)
  combines App prompt, conditional conversation history and conditional operation
  instructions plus scope instructions into base instructions. Its separate
  developer instructions also contain discovery, execution and recovery guidance.
  Editing AI_APP_PROMPT alone does not define the entire native model input.
- [ai-model-provider.ts](../../../../../apps/asyra-design/server/ai-model-provider.ts)
  supplies AI_APP_PROMPT to its systemPrompt path. Guidance removed from that text
  must remain reachable on each supported provider path where it is needed.
- [local-image-tools.ts](../../../../../apps/asyra-design/server/local-image-tools.ts)
  attaches image guidance to relevant tool descriptions. Its presence in the same
  source file does not mean it is globally injected. Preserve this scoped delivery.
- [local-knowledge.ts](../../../../../apps/asyra-design/server/local-knowledge.ts)
  already describes selective reads, optional children, context labels, rehydration
  and reuse. It loads shared domain advice and App-specific mappings separately.

## Paragraph disposition

"Move" means migrate the detailed material only after its destination is reachable
and complete. It does not authorize removing runtime obligations or hiding required
operational instructions in optional knowledge. Mixed paragraphs must be split.

| Baseline lines | Topic | Proposed disposition | Owner / reason |
| --- | --- | --- | --- |
| 67–75 | User scope, style, unsupported additions, unrelated content | Keep, consolidate | App contract; quality is the requested result, not an imposed realism target |
| 76 | Native editable output capability | Keep | App capability boundary; do not confuse reference images with raster insertion |
| 78–89 | Knowledge discovery, children, contexts, reuse | Keep one invitation and authority boundary; move lookup syntax | `discover_knowledge` / `read_knowledge` descriptions already own exact retrieval behavior |
| 90–91 | Known-value edits and unavailable knowledge | Keep concise | Knowledge must not become a prerequisite |
| 93–97 | Retrieved advice as default method, required representation/assumptions | Remove default-method mandate; split ownership | Knowledge may inform an unresolved decision; no requirement to adopt or acknowledge it. Preserve uncertainty handling only where relevant |
| 97–98 | Variation domains, fillTemplates, procedural representation | Move | Shared repetition/material advice for concepts; App preparation guidance for exact representation |
| 99–102 | Reuse, limitations, mechanical checks versus appearance | Keep principles; move field-specific details | Honest capability and evidence interpretation remain global; avoid prescribed design method |
| 103–108 | Representative route and reflective-material assessment | Remove from always-present prompt; adapt existing knowledge | Optional material-method choice, applicable to unresolved repeated surfaces, not a general execution sequence |
| 108–112 | acceptanceContext and local versus global pass | Keep distinction; move exact receipt interpretation | Review tools own fields and next arguments; a local pass cannot certify the whole task |
| 117–122 | Research gaps, discovery versus research, source failure | Keep concise; move query recipes | Reuse available evidence, research when needed. Knowledge is not a substitute for subject-specific facts or images |
| 123–128 | Reference IDs, import syntax, validation, source resolution | Keep attribution/fidelity boundaries; move invocation details | Reference acquisition/selection tools; do not impose a particular research source or repeated preflight |
| 130–131 | First-frame scheduling and no forced previews | Remove scheduling paragraph as a standing design directive | Neither fast preview nor delayed first paint should become a mandatory method. Keep test deadlines out of production policy |
| 132–135 | Preparation checks, concrete failures, computational ownership | Keep no-replay/correctness principle; move recipes | Preparation/review tool receipts own recovery and existing checks; no new assessor |
| 136–150 | Visual judgment, bindings, pagination, pixel checks | Keep truthful evidence-based completion; move detailed protocol | `review_drawing`, `read_design_checks`, `check_drawing_image`. Consolidate repetition with lines 213–238 |
| 151–155 | Ready parts, parent IDs, hidden-detail scheduling | Move API requirements; remove blanket hidden-detail strategy | Parent identity is technical; staging/deferral is optional design advice, never a lower final requirement |
| 157–161 | Linked fills, patterns, surface grids, world projection | Move | Shared concepts in knowledge, Asyra representation in preparation usage. Keep independence versus intentional linkage explicit |
| 163–171 | Discover and author reusable recipes | Keep capability discovery pointer; move recipe procedure | Tool-library descriptions and exact selected contracts |
| 172–198 | Iteration, recovery, save-only retry, fresh evidence | Keep no-blind-replay and current-evidence boundaries; move mechanics | Tool/runtime owners; operational safety is not optional domain advice |
| 199–205 | Drawing completion, persistence, export/download | Keep drawing-versus-saving distinction and required completion route | Preserve `report_outcome` discoverability and persistence obligation; export details belong to export tools |
| 208–214 | Source facts, calculations and numerical significance | Keep source honesty and requested precision; move procedures | Fact/calculation tools. Do not turn negligible narration differences into new drawing requirements |
| 215–238 | Criteria, image bindings, references and freshness | Keep user-linked completion; merge duplicate evidence rules | Operational details in criteria/review/reference tools; optional methods must not create additional acceptance demands |
| 240–251 | Editing authorization, cancellation/blockers, security, privacy | Keep, deduplicate | App safety and task control; no new total-duration or review quota |
| 252–265 | Clarification, activity messages and final answer | Keep concise public communication contract | Preserve intent-versus-observed-execution distinction; consolidate repeated status instructions, not add a per-tool narration gate |
| 268–291 | Operation discovery and context queries | Keep minimal bootstrap; move exact fields/recipes | A tool must be discoverable without already knowing its recipe. Audit existing scope instructions and tool usage before removal |
| 293–307 | Preparation sequences, deferred inspection, primitive choice | Keep receipt correctness; move syntax and optional representation advice | Preparation usage and App knowledge; do not globally prescribe when ready parts must be submitted |
| 309–319 | Retained targets, backend mapping, concurrency and recovery | Keep short dependency/no-replay principles; move details | Selected mutation/query contracts own leases, artifact IDs and recovery |
| 322–329 | Image-tool guidance | Keep scoped at tools; review method claims only if touched | Already delivered by relevant tool owner; not an always-on prompt reduction target |
| 331–340 | Conversation history interpretation | Keep | Current intent precedence, attachment provenance and stale-handle protection are session semantics |

## Knowledge changes required for genuine optionality

Do not duplicate an existing topic or move mandatory wording unchanged into a
knowledge document. Reuse these existing owners:

| Existing owner | Proposed change |
| --- | --- |
| [Shared architecture entry](../../../../../domain-knowledge/illustration.architecture.md) | Retain task applicability and optional selection. Do not add a compulsory stage list |
| [Shared material method](../../../../../domain-knowledge/illustration.architecture.materials.method.md) | Explain when a representative sample reduces costly rework, when known methods or a simple/local edit make it unnecessary, and the extra iteration cost. Replace unconditional sequencing with conditional advice |
| [Shared materials](../../../../../domain-knowledge/illustration.architecture.materials.md) | Keep material/lighting expertise; distinguish requested realism from optional elaboration and unsupported physical certainty |
| [App architecture entry](../../../../../apps/asyra-design/knowledge/design.architectural-illustration.md) | Remove "default planning reference" adoption pressure; preserve mapping to supported tools and user intent |
| [App material method](../../../../../apps/asyra-design/knowledge/design.architectural-illustration.materials.method.md) | Present the representative route as one usable option. Dependency concerns affect the dependent surface, not every other ready task |
| [App material review](../../../../../apps/asyra-design/knowledge/design.architectural-illustration.materials.review.md) | Keep executable example and binding correctness. Make sample criteria conditional on the chosen method; do not automatically add a material/join obligation to every drawing |

Keep exact fields, revisions, permissions and recovery outside shared domain
knowledge. Knowledge availability should help solve a decision, not prescribe a
lookup for every task. Advisory selection must also apply to descriptions and
transitively delivered dependencies, otherwise a softened body can still arrive
through a mandatory-looking catalog entry or parent reference.

## Concrete wording direction

Proposed compact knowledge invitation, not an implemented replacement:

> Use available domain knowledge when it helps resolve a design decision. Treat it
> as optional reference material, not a required method or an additional acceptance
> standard. Choose methods appropriate to the user's request and current tool
> capabilities; known-value edits do not require a knowledge lookup.

Proposed material-method advice, for the existing knowledge topic rather than
startup instructions:

> When an uncertain material choice will be repeated widely, a representative
> section can expose mistakes before expansion. Use it when the likely rework
> justifies that check. Known methods and independent parts need not wait for it.
> Evaluate the section against the requested finish; optional refinement does not
> create an additional delivery requirement.

These are directional excerpts. A later implementation must verify the full
assembled instructions, not merely paste these next to contradictory wording.
Do not introduce a new "always establish a skeleton first" sentence, fixed sample
size, refinement quota, speed target, or special Taipei 101 behavior.

## Contracts that prevent a text-only shortcut

The current [execution spec](../specs/ai-execution-flow.md) describes the chosen
representative route around lines 87–107. It also explicitly permits no-Knowledge
work, independent ready work and alternative methods. The current
[prompt tests](../../../../../apps/asyra-design/server/__tests__/ai-domain-prompt.test.ts)
assert `default method reference` in global guidance. Those expectations must be
revised with a changed product contract, not bypassed or retained by relocating the
same mandatory wording elsewhere.

Preserve the existing formal knowledge handoff tests for image delivery, returned
bindings, wrong-crop recovery, retained result reuse and independent judgments.
They demonstrate a supported optional route; they need not mandate choosing it.
Before implementation, review the matching Inspector compose/knowledge/review
contracts and affected executable cases. This audit neither changes those
contracts nor asserts readiness of a production patch.

## Bounded implementation proposal

1. Update the relevant spec/Inspector contract to separate optional methods from
   mandatory execution/evidence semantics. Adapt formal prompt tests to this
   distinction before production edits; retain direct handoff regressions.
2. Remove global material-method/default-adoption mandates and revise their
   existing knowledge owners together. Consolidate duplicate completion rules
   without changing tool validation, required persistence or truthful reporting.
3. Move remaining operational detail only where equivalent selected tool guidance
   is verified reachable before invocation. Keep minimal startup discovery and
   completion pointers. Inspect native developer/scope instructions and the
   systemPrompt consumer for residual duplication or missing coverage.
4. Review the complete delivered instructions and run focused prompt/provider,
   knowledge discovery/handoff, review/recovery and conversation regressions.
   Apply the existing applicable type/lint and current-source Inspector checks.

Do not replace behavior tests with a shorter-prompt string count. Do not add a
second knowledge catalog, planning tool, stage state machine or review model.
No runtime changes are proposed by this review. If moving a necessary instruction
would require such a change, retain that instruction and report the dependency.

## Evaluation after implementation

Preserve the exact frozen Taipei 101 user prompt and existing test guard. Report
completion status, missing requested parts, visible quality, time to first paint,
phase/tool time, unnecessary lookups, correction/replay counts, token accounting
limits and persistence separately. An unfinished result is not equivalent to a
completed benchmark. Faster output is not improvement if required quality drops;
more ornament is not improvement if it was unrequested or prevents completion.

Use existing formal coverage for known-value color/style edits, deliberately flat
or simple work, optional knowledge absence, material-method selection, evidence
reuse, cancellation and clarification. For empirical prompt comparison, preserve
source/model/effort and input conditions and record both arms explicitly; one
stochastic run cannot isolate the effect of guidance. This review authorizes no
additional paid run or automatic rerun and changes no baseline evidence.

## Review outcome

The primary candidate is over-prescriptive, duplicated always-present guidance,
not a missing drawing pipeline. The recommended first implementation is optional
method ownership plus consolidated completion semantics, followed by verified
relocation of technical details. Current evidence supports reviewing these
instructions; it does not prove a particular speedup or guarantee equal visual
quality after removal. At the review checkpoint, production behavior remained unchanged.


## Subsequent authorized implementation

The user subsequently authorized implementation in this conversation. The
[plan task](../plans/ai-design-agent-plan.md#optional-design-guidance---2026-11-02)
records the bounded change and validation. Global default-method and representative
sequence mandates were removed; existing shared/App knowledge now explains the
optional method, cost and applicability. Review and reference invocation details
remain available from their owning tools. Safety, current evidence, no-replay,
clarification, cancellation and persistence responsibilities remain global.

The separate native developer instructions were inspected and tested as part of
actual composed delivery; they contain no conflicting material-method mandate and
were not rewritten unnecessarily. Exact operation bootstrap is retained for scope
acquisition and safe execution. This is an explicit disposition of those rows,
not a claim that every technical sentence moved out of startup instructions.
The spec, compose Inspector contract, direct tests and four knowledge revisions
were synchronized. Existing handoff scenarios still execute the optional route.

AI_APP_PROMPT is 7,413 UTF-8 bytes versus 21,180 at the review baseline. Formal
provider/knowledge tests and current-source Inspector evidence pass; no live model
run has measured drawing speed or quality for the new instructions. The 101 user
prompt and all prior benchmark evidence are unchanged. See the plan for exact
counts, opt-in skips, warnings and candidate evidence identity.
