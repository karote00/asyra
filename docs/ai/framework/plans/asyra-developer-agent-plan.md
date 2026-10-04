# Asyra Developer Agent Distribution and Maintenance

## Status

Implementation requested on 2026-10-04. The user has persistently excluded
Asyra developer Agent adoption work from Flow Inspector. This scope rule is
recorded in `AGENTS.md` and
`docs/ai/workflows/task-context.md#asyra-developer-agent-scope-exception`.
Codex V1 has completed local 0.1.4 installation and two reviewed product trials.
Task 4 prepares the first public candidate, 0.1.5, with the same Skill and guide
bytes. Local release preparation is separate from native 0.1.5 installation,
portal validation, approval and publication. See the developer-agent first-release
record for evidence and remaining steps. Ordinary ownership review, verification
and delivery permissions continue to apply.

This document defines a developer-facing assistant that helps people build
Asyra products in the established Asyra way. It does not
change the in-app `@asyra/ai-agent-runtime`, which remains an optional runtime
for App-composed AI interactions and registered App actions.

The first two delivery forms are in scope:

1. Guidance used from inside an Asyra project.
2. A reusable installation for supported AI coding tools.

A hosted service is deferred until sponsorship or sustained user demand makes
its operating cost worthwhile.

## Product Decisions

- **First installed tool:** Codex. Other AI coding tools are deferred until
  there is a clear user need.
- **Hosted service:** deferred until sponsorship or sustained user demand
  justifies the operating cost.
- **Proposed implementation default:** use a Codex Plugin containing one Asyra
  developer Skill, distributed through a repository marketplace. Codex owns
  installation and marketplace refresh. No new npm package or custom global
  installer is needed for V1. This is a technical choice under the implementation
  request, not a claim of completed installation or public availability.

## Product Outcome

A user describes one product outcome. The assistant helps identify the right
Asyra and App owners, finds the maintained contracts and examples, proposes a
bounded implementation, then follows the project's formal tests and review
expectations. It should make Asyra's existing best practices easy to apply,
not create a parallel architecture or duplicate the source documentation.

## Existing Sources to Reuse

| Existing source                                                         | Current responsibility                                                                    | Use in this plan                                                                           |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Root `AGENTS.md` and generated App `AGENTS.md`                          | Repository and generated-project guardrails                                               | Keep as the project's local policy entrypoints.                                            |
| `docs/ai/framework/GETTING_STARTED.md` and `docs/ai/apps/README.md`     | Route work to Framework or App owners                                                     | Use as the architecture and documentation map.                                             |
| `docs/ai/workflows/agent-task.md` and task workflows                    | Route requests, bound work, and define delivery                                           | Reuse rather than creating a second task lifecycle.                                        |
| `docs/ai/skills/`                                                       | On-demand specialist procedures                                                           | Keep specialist guidance modular and load it only when relevant.                           |
| `docs/ai/tools/agent-evals/` and `agent-improvement-eval`               | Capture and assess recurring agent failures                                               | Use for representative workflow evaluation when changing agent guidance.                   |
| `docs/public/start/extend-with-ai.md`                                   | Explain how to ask an AI coding agent to extend Asyra                                     | Keep as the public product-building guide and link it from the installer entry.            |
| `docs/ai/framework/plans/adoption-entry-and-onboarding-program-plan.md` | Own the wider adoption journey and retain the completed Starter coding-agent verification | Reference its completed evidence; do not reopen its bounded remaining website work.        |
| `scripts/install-skills.sh`                                             | Copy repository Skills into the local Codex skills directory                              | Treat as a Codex-specific local installer, not a cross-tool distribution or update system. |

Asyra Design's generated local Codex adapter and the Framework's
`@asyra/ai-agent-runtime` are separate in-app AI product capabilities. Their
provider, conversation, and action-execution work is outside this plan.

## Current Gaps

- The core workflow is already present, but users encounter it through several
  different entrypoints. There is no single concise install/use/update guide
  that routes to those maintained sources.
- The current Skills installer copies files into Codex's user-level directory.
  It does not record the installed Asyra guidance version, compare it with a
  newer release, or tell the user how to update.
- The existing installation path is Codex-specific. Other AI tools may need
  small adapters, but their instructions should point to the same Asyra-owned
  contracts rather than copy those contracts into separate prompt sets.
- The existing agent-eval cases cover a small set of repository tasks; they do
  not yet establish the assistant's quality across representative new-App and
  existing-App product-building tasks.

## Proposed Organization

Keep one canonical source for Asyra behavior in the repository. Provide one
short developer-agent entry page that routes to the existing task workflow,
Framework/App maps, public build guides, specialist Skills, and evaluation
procedure. Tool-specific adapters should contain only the format and setup
needed by that tool; Asyra ownership rules and implementation guidance remain
in the canonical sources.

Support two usage modes through the same plugin:

- **Inside the Asyra repository:** a repo marketplace points to the local
  plugin. The Skill routes implementation to the checkout's existing project
  instructions, owner documents and workflows.
- **Inside a consumer project:** the installed plugin includes a bounded
  snapshot of public Asyra build guides. It reads the consumer project's own
  instructions, installed packages and declarations before proposing APIs.
  It does not assume private monorepo paths or contributor-only tools exist.

The plugin has its own version. Its bundled source record identifies the
source document hashes and package versions represented by those documents.
Asyra changes that affect API guidance, workflows or the bundle require a new
plugin version; an unrelated App change does not. A newer plugin must not
silently upgrade the user's project dependencies. V1 claims only tested
package versions; broader compatibility needs explicit evidence.

Codex owns installed-plugin state. The public guide will explain how to view
its version, read Asyra release notes, and explicitly refresh the marketplace
with `codex plugin marketplace upgrade <marketplace-name>`. That command can
refresh installed files and is an update operation, not a read-only check.
A local development plugin requires updating its source and restarting the
client according to the official instructions. The guide must distinguish
these paths. No periodic check, automatic notification or silent upgrade is
promised. A rollback selects a previously reviewed source revision and follows
the same documented installation path; it never rewrites the user's project.

The official documentation establishes repo marketplace discovery at
`.agents/plugins/marketplace.json`, plugin folders under `plugins/`, and
versioned plugin metadata. A configured Git marketplace can also select a
source ref. These are current host contracts, not Asyra-owned APIs:

- <a href="https://developers.openai.com/plugins/build/plugins" target="_blank" rel="noopener noreferrer">OpenAI - Package your plugin</a>
- <a href="https://learn.chatgpt.com/docs/build-skills" target="_blank" rel="noopener noreferrer">OpenAI - Build skills</a>

## Delivery Stages

### Stage 1: Curate the shared entry

- Write the concise developer-agent entry and installation overview by linking
  existing sources rather than restating their rules.
- Define the Codex setup and the project-local usage path.
- Separate project-local use from user-level installation in setup guidance.

### Stage 2: Define release and update behavior

- Choose the distribution form for the first tool adapter.
- Record installed source version, adapter version, and compatibility range.
- Define `check`, explicit `update`, rollback/reinstall, and release-note paths.
- Explain when project-local guidance takes precedence over installed global
  guidance.
- Keep the update flow useful without a hosted Asyra service.

### Stage 3: Validate real product-building tasks

- Evaluate one new-App task and one existing-App feature task using the shared
  guidance and the selected tool adapter.
- Reuse the agent-eval framework where its cases fit; add permanent cases only
  when evidence identifies a recurring behavior that needs an oracle.
- Check that the assistant routes users to the correct owner and public API,
  honors task scope, selects formal proof, and reports remaining limitations.
- Record observed failures at their owning layer: source contract, workflow,
  Skill, tool adapter, or evaluation case.

### Stage 4: Add tool adapters as needed

- Add one adapter at a time when users need another supported AI tool.
- Keep adapters thin and verify that each resolves to the same canonical
  guidance version and update path.
- Reconsider hosted service work only after user demand or funding justifies
  ongoing operations.

## Task 1 - Codex V1

### Bounded contract

Outcome: deliver one locally reviewable Codex Plugin that can guide new Asyra
product work and existing App changes, using the existing authoritative
contracts. Include install, version, update and rollback instructions and
permanent packaging tests. Remote publication remains a separate operation.

Base: `origin/main` at `85e88319f3659c5048966146c039c88ad22142c4`.
Working branch: `codex/asyra-agent-plan` in the main repository's
`.worktrees/asyra-agent-plan`. Plan and closeout owner: this task's primary agent.
This task selects this exact heading; it does not close the wider plan merely
by finishing a package.

Frozen mutation boundary (including the subsequent user-requested persistent rule):

- this plan and its entry in `docs/ai/framework/PLANS.md`;
- `plugins/asyra-developer/` for plugin metadata, Skill and bundled references;
- `.agents/plugins/marketplace.json` for local discovery;
- `scripts/developer-agent-bundle.mjs` and its adjacent `__tests__` file for
  deterministic bundling and validation;
- `docs/ai/tools/developer-agent/README.md` for maintainer operations, plus its
  tools index entry;
- a bounded addition to `docs/public/start/extend-with-ai.md` for the user entry,
  with the existing public-doc generator outputs and applicable gates;
- `AGENTS.md`, the canonical task-context exception and the two Inspector rule
  scope references, as explicitly requested by the user;
- the root script test command to include the permanent packaging tests;
- the existing naming test owner, solely to recognize exact public plugin
  distribution identities as quoted data and retain negative runtime cases.

No dependency or runtime upgrade is required. App runtime, the existing Skills
installer, contributor workflows, unrelated App assets and public release state
remain outside this task. All local build/test output stays within this
worktree. Real installation would write Codex's user-level files, so this task
uses project-contained artifacts and fixtures; it does not install into the
user's home directory under the current filesystem constraint.

### Proposed complete flow

| Step and owner                       | Inputs and conditions                                                                                       | Outputs and next consumer                                             | Failure and bypass                                                                                                                      | Implementation boundary                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Assemble guidance - bundle script    | Explicit public-document allowlist, canonical Skill, plugin version and package manifests from one checkout | Self-contained plugin with source record, consumed by Codex discovery | Missing sources or mismatched generated bytes reject; no latest-document fallback                                                       | `scripts/developer-agent-bundle.mjs`, `plugins/asyra-developer/`                                            |
| Discover and update - Codex host     | Valid plugin and explicit marketplace setup/update request                                                  | Installed plugin available to Skill invocation                        | Host installation errors are reported; no Asyra service or home-directory writes by the bundle script                                   | `.agents/plugins/marketplace.json`, plugin metadata, installation guide; host implementation is external    |
| Route product work - developer Skill | User outcome, project instructions, installed package facts and relevant reference snapshot                 | A bounded owner/API/test plan consumed by the coding task             | Missing version evidence or unavailable API requires a concrete resolution before API-dependent edits; read-only questions bypass edits | Plugin Skill                                                                                                |
| Implement and verify - coding task   | Bounded plan and target project's current public APIs/tests                                                 | Product change plus actual test evidence and limitations              | Failed checks remain failed; unsupported framework work is reported rather than hidden by private imports                               | User-selected product project, governed by its own instructions; no product changes during plugin packaging |

For every step, only the stated inputs and declared project tools may
contribute; model-provider credentials, private consumer state mutation,
App-embedded AI execution and unrelated task dispatch are forbidden
contributors. Each step owns its failure. No retained computation cache is
introduced. This table is a design proposal; it is not an admitted Inspector
or evidence of successful execution.

### Acceptance cases and gates

- A packaged plugin is usable without the Asyra checkout: its required local
  references resolve from the copied plugin, and runtime APIs are checked in
  the target project. Maintainer provenance links are not required local files.
- New-App and existing-App requests choose the appropriate existing public
  guide. A generic non-Asyra request does not acquire Asyra-specific rules.
- Existing project instructions and user choices retain precedence. An
  incompatible package version is surfaced before relying on unavailable APIs.
- Document changes make the bundle freshness check fail until regenerated;
  source identity changes and plugin release-version policy are visible.
- Unknown versions, missing inputs and incomplete packaging fail clearly;
  unrelated files, secrets and user instructions are never bundled or replaced.
- A copied plugin and marketplace pass format/path checks. Tests use only
  project-contained fixture directories and exercise source/reference integrity.
- Run the naming gate, focused permanent bundle tests, applicable public-doc
  checks and bounded diff review. Native Codex discovery and real product-task
  acceptance are separate checks; packaging tests cannot stand in for them.
- Reuse the retained Starter priority-extension evidence as background only.
  Any new replay is labelled as replay. Fresh independent agent trials require
  the user's existing single-agent constraint to be respected; no subagent is
  dispatched by this task.

### Readiness review

The user explicitly classified developer Agent adoption work outside Flow
Inspector and requested a persistent project rule for future conversations.
The exception covers this plugin's delivery lifecycle and supporting tests/docs;
Framework/App runtime changes still use their ordinary applicability checks.
No Inspector artifact or control-plane runtime change is part of this task.

The existing guides supply the engineering contracts. Codex owns discovery,
installation and marketplace refresh. The bundle script owns only reproducible
reference snapshots and validation inside the checkout. Tests cover missing or
stale references, version change enforcement and copied-plugin integrity.
No global installation, independent model trial or public release is implied
by a successful packaging check.

## Local candidate report - 2026-10-04

- Implemented one Codex plugin and marketplace entry, one developer Skill and
  14 explicitly selected reference guides. No dependency or runtime was added.
- Added deterministic bundle generation, drift detection, copied-plugin checks,
  release-baseline version enforcement and formal error-path tests.
- Recorded the permanent Flow Inspector scope exception in `AGENTS.md`, the
  canonical task-context workflow and both Inspector scope documents.
- Added public usage and maintainer guidance. Regenerated public documentation
  through its existing generator; its API index also removes three stale entries
  to match this checkout. No public API implementation changed.
- Validation: 35 focused tests passed (11 bundle cases, 13 naming/display cases,
  11 public-document cases). ESLint passed for the three changed scripts;
  public-document and bundle freshness checks passed; Skill quick validation
  and `git diff --check` passed.
- Commands used the Node entrypoints of the declared tools: this worktree has
  no Yarn installation-state file. No dependency installation was performed.
- Native Codex installation, a new-product trial and an existing-product trial
  are still pending. Packaging evidence does not establish model behavior.
  No global files were installed, no remote publication or push was performed.
- Review entry: `plugins/asyra-developer/README.md`. Maintainer operations and
  retained acceptance scenarios: `docs/ai/tools/developer-agent/README.md`.

The persistent rule is present in this feature worktree. Other checkouts receive
it when these changes are integrated; the task has not modified main.

## Native acceptance preflight - 2026-10-04

The user authorized local installation and the two fresh-conversation trials.
This extends the installation boundary to Codex-managed plugin files for this
candidate. It does not authorize a CLI/runtime upgrade or public release.
The next slice covers native discovery, installation and the retained new-App
and existing-App scenarios, with outputs confined to project-owned acceptance
fixtures except Codex's own installation/session state. Record actual host and
product evidence here; do not replace native acceptance with a packaging check.

Preflight found `codex-cli 0.40.0` at
`$HOME/.npm-global/bin/codex`; it has no plugin subcommand. The computer-use
tool explicitly rejects access to `com.openai.codex` for safety reasons. No UI
workaround was attempted. Installation has not occurred. The user is being
asked to choose explicit official CLI upgrade authorization or manual desktop
installation. The existing candidate still passes its bundle freshness check.

### CLI installation evidence

The user subsequently explicitly authorized upgrading the official Codex CLI.
`npm install -g @openai/codex@latest --registry=https://registry.npmjs.org/`
updated the existing npm installation from 0.40.0 to 0.160.0. Node and npm
versions were not changed.

Native commands successfully registered this worktree as marketplace `asyra`
and installed `asyra-developer@asyra` version 0.1.0. `codex plugin list
--marketplace asyra --json` reports installed and enabled. The installed copy at
`$HOME/.codex/plugins/cache/asyra/asyra-developer/0.1.0` passes the independent
bundle inspector: 19 hashed files, matching the source content digest.

Desktop App acceptance is a separate required result, explicitly requested by
the user. CLI installation does not prove desktop directory discovery or a
successful desktop installation interaction. A manual desktop check is pending
because the computer-use tool prohibits controlling Codex. A fresh CLI session
is checking installed Skill discovery; product implementation trials remain
pending and must not be reported as passed from that discovery check.

The fresh read-only CLI session successfully discovered the installed Skill at
the cache path, read its bundle and reported version 0.1.0 with content digest
`4d8fbf7ce93096391775337fef103c5935eb84b5784566d8ffb34e41b9278e9c`.
It distinguished Generic Starter selection from tracing existing App owners.
Local session output: `tmp/developer-agent/native-skill-check.md`.
This proves native CLI discovery only; desktop and product trials remain open.

### Desktop discovery and Skill loading - 2026-10-04

Evidence source: the user reported `asyra-developer` appearing in the desktop
Plugins page, then pasted the response from the requested fresh desktop chat.
That response reports reading the installed `SKILL.md` and `bundle.json` under
`$HOME/.codex/plugins/cache/asyra/asyra-developer/0.1.0/skills/asyra-developer/`.
It reports pluginVersion 0.1.0, reference versions Core 0.5.7 and Feature System
0.5.4, and distinguishes those reference versions from target-project API
compatibility. It reports no file mutations and no project-local substitute.

Result: desktop discovery and explicit Skill loading pass on user-supplied
session evidence. The plugin was installed through the CLI; installing it
from scratch through desktop buttons has not been tested. This is not proof
of automatic Skill selection or completed product-building behavior. The
new-product and existing-product trials remain pending.

### Reported Skill lookup issue - 2026-10-04

The user reported seeing a Skill version/path mismatch message twice. Read-only
inspection of the extension thread `01a105e5-5941-7e81-84b2-d71c9962766d`
confirms its first command omitted the plugin-name directory: it requested
`cache/asyra/0.1.0/skills/asyra-developer/SKILL.md`. That failed, then a bounded
cache search found `cache/asyra/asyra-developer/0.1.0/skills/asyra-developer/SKILL.md`,
and the next read succeeded. Native CLI inventory still reports installed,
enabled version 0.1.0; only that version directory is present. No version drift
is established by this error. The new-App thread's first recorded Skill read
used the correct path. The second reported occurrence has not been identified.

This establishes an initial lookup-path error and successful recovery. The
available thread output does not establish whether the incorrect path came
from host-injected metadata or model transcription; do not assign that root
cause without the initial Skill catalog. No plugin reinstall, cache alias,
consumer-project edit or instruction change was made for this observation.

## Task 2 - Adopt the complete Starter App standard

### Bounded contract and plan

The user authorized this update after PR #283 was merged. This task continues
Task 1 in `.worktrees/asyra-agent-plan`; the primary agent owns this plan.
Project and GitHub content is English; user-facing conversation may use
Traditional Chinese. The persistent developer-Agent Inspector exception applies.

Outcome: the distributable Skill resolves its own installed location and carries
the maintained complete Starter architecture, so new products and subsequent
extensions share initialization, Feature/common API, controller, UI-property,
projection, render, persistence, history and teardown ownership.

Authorized changes: synchronize this branch with current main while preserving
all existing V1 work; update this plan, plugin instructions/metadata/changelog,
bundle allowlist and generator/tests, and developer-Agent maintenance guidance.
Regenerate their existing derived public-document/bundle artifacts as needed.
Do not change Framework/App runtime behavior, publish, push, upgrade tools,
write outside the repository, or update the user's installed plugin in this task.

Execution order:

1. Preserve the complete existing V1 work, fast-forward the branch to fetched
   main, and reapply that work with reviewed conflict resolution. Retain a
   recoverable Git snapshot until the integration is validated.
2. Read the merged Starter architecture and public composition guide. Add a
   permanent packaging regression that requires the complete architecture guide
   in a standalone bundle; prove the current package misses it before repair.
3. Update the explicit source allowlist and Skill routing. Require the full App
   standard for new products and trace existing owners before extensions. Resolve
   relative resources from the actual loaded Skill path, never an invented cache
   path. Preserve version/API checks and the user's project instructions.
4. Prepare a locally versioned candidate with the previous installed bundle as
   release-comparison evidence. Regenerate references and validate standalone
   links, hashes, version progression, language, naming and affected docs/tests.
5. Review two permanent acceptance scenarios (new proposal App and later review
   status extension) against architecture, state, history and lifecycle oracles.
   Packaging/static checks are not proof of model behavior. Fresh independent
   model sessions require the user's explicit multi-agent authorization under
   current rules; if unavailable, prepare exact prompts and record those trials
   as pending rather than dispatching another agent implicitly.

Stop conditions: unresolved preservation conflicts, missing canonical sources,
failed required checks, or an external mutation outside this contract. Finish
with a locally reviewable candidate and explicit evidence/pending trial status;
no release or installed-version update is implied.

### Task 2 implementation and evidence - 2026-10-04

- Plan recorded before implementation. The original V1 work was preserved in a
  named Git stash, main was fast-forwarded to `fca27c8e7`, and V1 changes reapplied
  without conflicts. The snapshot remains available for recovery.
- Added the complete Starter architecture to the explicit source allowlist and
  routed both new Apps and extensions through it. The Skill covers the whole
  App, including actual UI observation/update boundaries and disposal semantics.
- The permanent standalone-consumer regression first failed with
  `Complete App architecture must be bundled`; it now resolves the guide from
  a relocated plugin root, compares its generated content, and detects source
  drift. A negative case rejects unrelated private App documentation.
- The candidate is 0.1.1. The retained 0.1.0 record matches the actually installed
  bundle digest `4d8fbf7ce93096391775337fef103c5935eb84b5784566d8ffb34e41b9278e9c`.
  Inspection of the installed copy was read-only; version-progression and bundle
  freshness checks passed. No installed plugin was updated.
- The 44 selected tests passed: bundling (13), naming (13), task-context and
  affected public-document contracts. The Skill validator, source-script ESLint,
  public documentation freshness and whitespace checks passed. The initial
  `yarn lint:naming` wrapper could not find a worktree-local node_modules state;
  its exact declared Node test command passed instead. No dependency install or
  environment upgrade was performed.
- Permanent new-product and subsequent-extension prompts and review oracles are
  in `docs/ai/tools/developer-agent/acceptance.md`. Fresh 0.1.1 product trials and
  native update acceptance remain pending. Static/packaging evidence does not
  claim model adherence or resolution of the unproven host-path root cause.

Task 2's local guidance and packaging slice is ready for review. Product-trial
acceptance remains open; this does not close the wider plan or authorize release.

## Task 3 - Refresh Starter knowledge and separate evaluation responsibilities

### Bounded plan - 2026-10-04

Owner: primary agent, single writer. Use the merged Starter fix at `bab1c2f6e`
and the retained local Agent candidate at `0b8cbde9a` in the new
`codex/developer-agent-starter-sync` worktree. The Agent candidate had not been
merged with the Starter PR; preserve it through a local cherry-pick.

Objective: distribute the corrected canonical Starter guidance and prepare
ordinary product prompts that distinguish source defects, missing Asyra knowledge,
model execution failures and missing verification. Model reasoning, planning and
review remain model responsibilities. Do not append general-purpose rules for
individual mistakes.

Scope: plugin version/changelog/generated references, retained 0.1.1 baseline,
Developer Agent maintenance/acceptance documents and this plan. Preserve the
Skill instructions, bundle allowlist, generator and Framework/App implementations.
No installed-cache writes, dependency upgrades, remote push or publication.
The persistent Developer Agent Inspector exception applies.

Steps and fixed gates:

1. Preserve the exact 0.1.1 bundle identity; record the current stale-reference
   failure before regeneration. Existing freshness tests already detect this
   mismatch; no new evaluator is needed for the packaging change.
2. Bump the local candidate to 0.1.2 and regenerate from current canonical docs.
   Run bundle tests, standalone inspection, release comparison with 0.1.1,
   naming and public-document freshness checks.
3. Replace engineering-heavy product prompts with normal user requests. Keep
   version/source capture and review oracles outside those prompts. Define
   observations and attribution criteria before obtaining new outcomes.
4. Retain the already observed 0.1.1 installation and Starter failure separately
   from hypotheses. Prepare fresh creation and extension trials. A fresh model
   context and distinct reviewer are required before any agent-improvement claim;
   this informed session may only verify packaging or replay mechanics.

The existing eval catalog has routing/range/display-ownership fixtures, not an
Asyra product creation case. Do not use their scores as a proxy or expand this
sync into a new evaluator implementation. Product trials follow the maintained
acceptance scenarios. Missing independent trials remain pending, with no invented
success rate, causal attribution or automatic agent dispatch.

Pre-change evidence: `node scripts/developer-agent-bundle.mjs --check` rejects
the stale bundled `apps/starter-app/docs/ARCHITECTURE.md`. This is a verified
source-synchronization defect, not evidence that the model lacks general skills.

### Task 3 local result - 2026-10-04

The local candidate is 0.1.2, digest
`f6af4d3612e622ff78f3ff16ae6779ac57754698c507578058c3a89f29ea1f2b`.
Only the two changed canonical guides, manifest and changelog differ in the
bundle. The Skill instruction hash and reference package versions are unchanged.
The retained 0.1.1 bundle was read-only compared with the installed cache and
matches exactly. The candidate does not include executable Starter source;
Starter source/template delivery remains owned by the merged App/CLI work.

Validation:

- The pre-change freshness check rejected the stale architecture reference.
- Bundle generation, freshness and version comparison against 0.1.1 passed.
- All 13 packaging tests passed, including relocated standalone reference
  resolution; all 13 current naming tests passed.
- Skill quick validation and public-document freshness passed (41 pages,
  19 packages). `git diff --check` passed.
- The inherited plan used an obsolete product alias; the naming gate
  detected it, and its existing source reference now says "Asyra Design".

The maintenance and acceptance guides now separate model responsibility from
Asyra knowledge/source/verification responsibilities. Ordinary product prompts
are separate from operator identity capture and reviewer oracles. No general
instruction was added to the Skill, no new evaluator was implemented, and no
installed cache, external product or remote branch was changed.

Independent comparison status: zero baseline trials, zero candidate trials,
zero independent semantic reviews. Creation and extension outcomes are pending;
there is no pass-rate or measured model-improvement result. The evaluation skill
requires fresh contexts and a distinct reviewer and explicitly does not authorize
agent dispatch. A fresh desktop conversation using the actual 0.1.2 installation
is the next product trial; the informed maintenance session cannot replace it.
This completes source synchronization and trial preparation only.

## Task 4 - First public release preparation

Requested on 2026-10-05. Base: `46c7d8f19c1ff9418c551654181ebbbfc4138579`.
Branch: `codex/agent-first-release`; worktree: `.worktrees/agent-first-release`.
The primary agent owns this bounded preparation task.

Plan: retain the tested 0.1.4 Skill and reference bytes, prepare version 0.1.5
with Codex directory metadata and the existing Asyra website icon, refresh
installation/update documentation and acceptance evidence, then validate and
produce a project-local ZIP with SHA-256 and an exact file inventory.

Mutation scope: plugin metadata/docs/generated bundle, its existing bundler and
formal packaging tests (only for the added icon), developer-agent maintenance
docs/baseline/release notes, this plan, and ignored local release artifacts.
The public identity stays `asyra-developer`; the display name is Asyra Developer.
No runtime, Skill instruction, reference-guide behavior, dependency, external App,
installed cache, or other product changes are included.

Gates: packaging contracts, source freshness, version comparison with retained
0.1.4 identity, naming checks, archive round-trip/standalone inspection, exact
archive inventory and diff review. Existing product trials are reviewed evidence,
not new executions or proof of every model outcome. Directory upload, verified
publisher selection, policy attestations, remote push, tags and publication remain
pending explicit authorization. Missing publisher access is a submission boundary,
not a reason to defer local packaging. The Agent Inspector exception applies.

Task 4 local preparation result: 0.1.5 listing, icon, documentation and archive
are prepared. All 27 selected packaging/naming checks, baseline freshness and
archive round-trip inspection passed. Native installation and portal submission
remain pending; this task does not close public publication or the wider plan.
See `docs/ai/tools/developer-agent/first-release.md`.

## Task 5 - Unify the public product as Asyra Agent

Requested on 2026-10-05; base e9809b674a13a7eb016ec9c9ad8e2489a6c5ae6f.
Reuse the clean agent-github-release worktree. Public distribution and Skill
identity become `asyra-agent`; display name becomes `Asyra Agent`. Version 0.1.6
distinguishes the rename from the immutable published 0.1.5 artifact. Existing
installation is replaced explicitly, with no alias or automatic cache migration.

Plan: rename plugin/Skill directories and their manifest, marketplace, bundler,
CI and naming consumers; update current installation docs; retain the 0.1.5
baseline and regenerate references. Preserve historical plans and release evidence.
Scope excludes Framework/App behavior, skill behavioral instructions, dependencies,
installed cache and rewriting published tags/assets. Flow Inspector exemption applies.
Checks: existing packaging, naming, CI scope and public-doc freshness gates,
0.1.5 baseline comparison and bounded diff review. Stop after a locally validated
change; remote publication and native installation are separate delivery steps.

Task 5 local result: renamed Plugin/Skill, marketplace, packaging and CI owners;
version 0.1.6 with explicit replacement instructions. All 80 selected packaging,
naming and CI scope tests passed; baseline freshness, Skill validation and diff
whitespace checks passed. Public documentation check reports a stale API index,
also reproduced in the unchanged agent-first-release worktree. Its unrelated
three-field regeneration was excluded. No remote push, new release or installed
cache modification occurred. Native renamed-plugin discovery remains unverified.

Task 5 CI correction: the PR diff contains removed `asyra-developer` paths,
which the renamed relationship map no longer classified. Scope failed before
product gates ran. Bound the correction to the CI input map, its regression
test and exact naming guard exceptions for these historical diff inputs.
The regression failed on the removed manifest path before the fix. Retain the
old path as an input owner alongside the new path, not as an installed alias.
