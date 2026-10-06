---
name: asyra-agent
description: Build or extend an Asyra product, turn a product idea into an Asyra App, assess Asyra adoption or optimization in an existing project, or diagnose Asyra integration and ownership problems. Use for Asyra development and feasibility requests; exclude unrelated development and operating the in-app AI chat.
---

# Asyra Skill

Help the user turn a product outcome into a working Asyra implementation.
Determine the technical owners yourself from the project; the user should not
need to know Framework internals to describe their idea.

This Skill supplies Asyra-specific knowledge and procedures to the host agent.
The host remains responsible for reasoning, execution and general product quality.

## Trigger Signals

Use for creating an Asyra App, extending an existing Asyra project, integrating
its public packages, assessing whether Asyra fits an existing product problem,
or repairing an Asyra-specific behavior.

## Do Not Use When

The task is unrelated to Asyra, or the user only wants to operate an App's
embedded AI conversation. `@asyra/ai-agent-runtime` is an App capability,
not this developer Skill.

## Required Inputs

The desired product outcome and target project. Infer constraints, package
manager, existing owners and tests from that project. Ask only for missing
product choices that materially affect the result; do not ask the user to
supply package names or an architecture design you can establish yourself.

## Preflight

1. Read the target project's instructions and current changes. Establish the
   authorized task boundary and preserve unrelated work.
2. Resolve this Skill from the exact location supplied by the host's Skill
   catalog or explicit user-selected Skill folder. Resolve `bundle.json` and
   `references/` relative to that loaded
   `SKILL.md`; never reconstruct a cache path from a marketplace or version.
   An independent product is not expected to contain these Skill files. If the
   supplied path is missing, report that lookup failure and use the host's
   Skill or plugin inventory to locate the installed Skill; a missing path alone
   is not
   evidence of a version mismatch. A host without filesystem/tool access cannot
   implement or verify a local product; state the limitation rather than claim
   files or checks were completed. Read [bundle identity](bundle.json). Its
   `pluginVersion` is the shared Skill release version, including standalone
   Skill installs. Its `referenceVersions` identify the package versions used by these guides, not a promise of compatibility with
   every project. Inspect the target's installed versions, public exports and
   declarations before using an API. If versions differ, confirm the needed
   API against that installation; resolve unavailable APIs before dependent
   edits. Do not upgrade dependencies just to match the bundle.
3. Distinguish an Asyra contributor checkout from an independent consumer.
   In a checkout with `docs/ai/workflows/agent-task.md`, use that workflow and
   current owner documents. In a consumer, use its own instructions and the
   bundled public guides below. Do not require monorepo tools or Flow Inspector
   in someone else's product. Project and user instructions retain precedence.

## Deterministic Procedure

1. Translate the request into an observable product behavior. Identify what
   data must be saved, who can change it and the interactions to support.
   Distinguish assessment from implementation. For feasibility, optimization or
   adoption, start with the [problem-to-capability guide](references/docs/public/start/extend-with-ai.md#find-capabilities-from-a-product-problem).
   Trace the actual cause, compare existing-architecture improvements with
   selective Asyra adoption, and state benefits, costs, limits and missing proof.
   An assessment-only request ends with recommendations; it does not authorize
   installation or project changes. For implementation, state a short plan and
   proceed within existing authorization.
   When a reference requests a bounded task contract, derive its technical
   owner, route and proof fields yourself; do not require the user to supply
   them before describing a product in ordinary language.
2. Select the starting path. For a new product, read the bundled
   [public entry](references/docs/public/index.md) for the Generic Starter.
   Read the bundled [complete App architecture](references/apps/starter-app/docs/ARCHITECTURE.md)
   and [composition guide](references/docs/public/start/custom-composition.md)
   before the first implementation slice. Starter is the maintained App standard;
   Asyra Design supplies its architectural lineage, not a product to copy and
   strip down. Use the complete Design starter only when its existing product fits;
   use [custom composition](references/docs/public/start/custom-composition.md)
   when the required runtime composition calls for it. Honor an existing
   project or a user-selected starting point. Confirm a documented CLI version
   is available before invoking it; a source snapshot is not registry proof.
   Inspect the generated App's architecture: a published CLI may still contain
   an older template. For a new product, include any required standard alignment
   in the plan and implement it using verified installed APIs. Do not assume
   that installing the newest Skill also updates the CLI or product packages.
3. For existing work, read the target's architecture and trace its actual data,
   command, history, persistence and observation owners. An existing Asyra App
   should also use the complete App architecture above to locate its maintained
   Feature, common API, schema and projection. A non-Asyra project does not need
   those structures just to be assessed: follow the decision guide's bounded
   adoption and cutover rules, and read composition before implementing a chosen
   Asyra slice. Preserve one write authority per concern; verify public package
   dependencies and environment support before proposing a drop-in replacement.
   Read only the relevant guides:

   | Need                                          | Guide                                                                                                                                   |
   | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
   | Canonical data and ownership                  | [Canonical state](references/docs/public/learn/canonical-state.md)                                                                      |
   | Intent, transaction, cancel and Undo          | [Feature](references/docs/public/build/feature-session.md), [transactions](references/docs/public/learn/transactions-and-durability.md) |
   | Domain values and loading                     | [Schema](references/docs/public/build/custom-schema.md), [migration](references/docs/public/build/persistence-migration.md)             |
   | Views, subscriptions and engines              | [Composition](references/docs/public/start/custom-composition.md), [render](references/docs/public/build/render-boundary.md)            |
   | Collaboration or in-app AI, only if requested | [Collaboration](references/docs/public/build/collaboration.md), [AI actions](references/docs/public/build/ai-actions.md)                |
   | Generated Starter Item extension              | [Starter onboarding](references/apps/starter-app/docs/ONBOARDING.md)                                                                    |
   | Complete Design product extension             | [Design starter](references/docs/public/start/create-design-app.md)                                                                     |

4. Assign each concern to Framework mechanics, optional Preset defaults,
   App domain or backend policy. Reuse the existing owner and supported public
   API. For document-changing intent in an Asyra Core composition, follow the
   Feature, App/Core API and intended transaction route. Views read canonical data; incomplete UI drafts remain local.
   For the Asyra-owned slice, apply the whole-App boundaries below and consult
   the architecture guide for their rationale. Preserve an existing product's owner contracts; do not turn
   a feature request into an unrequested architecture migration.
5. Implement a bounded behavior with its formal proof. For a bug, first confirm
   an existing test detects it, or add a permanent regression and demonstrate
   failure before changing runtime behavior. Follow the target's commands and
   conventions. Include failure, Undo/Redo and saved-data cases when those
   contracts are affected. Do not turn every small task into a framework audit.
6. Review the diff and run applicable target tests, types, lint and build.
   Report unavailable checks accurately and leave the product ready for review.

## Project Continuity

For a new product, retain the Starter's project-local `AGENTS.md` and architecture
and onboarding guides. Adapt their owner paths and validation commands to the
actual delivered product; remove obsolete example-specific guidance when those
owners are replaced. Keep one authoritative project entry rather than copying
this entire Skill into the product. Do not embed installed Skill/cache paths.

At handoff, record only durable product decisions, real owner locations and
available verification commands in the project's existing instruction/docs
structure. For an existing product, preserve user rules and update missing
Asyra context only within the authorized change. Never overwrite instructions
or add a second competing architecture guide. A Skill update does not migrate
product code or project instructions automatically.

A fresh conversation starts by reading those project instructions and actual
installed packages. If the host does not discover the project entry, ask it to
read that file explicitly; do not promise universal automatic loading. Missing
Skill installation does not justify silently installing extensions. Select
existing project tests for affected Asyra contracts; add a permanent regression
only when needed. Report checks actually executed separately from suggested
checks and host capability limitations.

## Whole-App Standard

These are Asyra composition boundaries, not a mandate to rewrite an unrelated
product. Apply only the capabilities selected for the authorized scope.

- Compose Core context, initialization, registered Features, common APIs,
  controllers, semantic providers/hooks, views and render layers as separate
  responsibilities. Expose readable named actions; avoid `runtime.feature.xxx`
  call chains and forwarding-only modules. Initialization owns their wiring.
- Register fixed UI properties before Core startup. Read them through Core's
  observation facade and a lifecycle-owned adapter. Dynamic entities use keyed
  projection subscriptions and stable snapshots; subscribe in the component that
  consumes the value. Prove canonical reads and notification/render counts, not
  only component splitting. Do not use `React.memo` to conceal broad updates.
- Keep canonical document data in its Core owners, read-only rows in projections,
  transient selection/pending/feedback in UI properties, and incomplete input in
  local drafts. Controllers coordinate actions and structured outcomes; never
  infer success or history changes from display text, including translations.
- Undo/Redo performs one supported operation per request. Factory owns stacks
  and redo invalidation. Use availability/count queries only if the installed
  public API supports them; do not maintain UI depths, mirror stacks, invent
  `canUndo`/`canRedo`, or introduce multi-step replay controls.
- Admit saved data before canonical load and preserve documented persisted
  identities. Own subscriptions, projections, rendering and async work for one
  App lifetime. Await startup settlement and complete teardown before replacement;
  repeated disposal shares completion, and retired callbacks cannot mutate the
  next session. Follow the architecture guide's lifecycle and extension paths.

## Validation Matrix

- Assessment: distinguish observed causes from hypotheses; identify the public
  capability, App responsibilities, compatibility limits and smallest proof for
  each recommendation. No adoption and unsupported outcomes are valid.
- Optimization: compare equivalent behavior at representative data sizes; count
  source computation and downstream notifications, including invalidation and
  cleanup. Shared helpers or fewer React renders alone do not prove less work.
- Adoption: preserve existing behavior, saved identities and one write authority;
  verify the bounded cutover and rollback or explicitly accepted one-way path.
- New App: supported composition starts and one meaningful product interaction
  crosses the intended canonical route; affected persistence/history works.
- New App architecture: identify each owner in the delivered source, inspect
  UI-property subscriptions and update scopes, and verify startup/unmount/remount
  cleanup. An API demonstration or a folder tree alone is insufficient.
- Existing feature: new behavior and its rejected-input path pass, existing
  behavior remains covered, one intended edit retains its history boundary.
- Bug: the same regression fails before and passes after the owner correction.
- Visual claim: inspect the actual rendered result at the relevant scale;
  a build or screenshot file existing is not a visual review.
- Unsupported API/version: report the missing public contract and a bounded
  next step rather than inventing an API or importing private package source.

## Required Output Format

Use the user's language for conversation. Author project files, documentation,
commit messages and GitHub content in English; Traditional Chinese is limited to
required i18n resources/parameters and genuinely necessary test data. Explain
what the product now does, which owner changed,
checks actually run, and remaining limitations. Give local artifact links when
useful. Keep implementation details out of the product's own user interface.

## Guardrails

Keep canonical state, transaction, load and projection owners intact. Use
public `@asyra/*` imports. Do not add a second editable document store or patch
output to conceal an owner bug. Optional capabilities stay optional. Preserve
user data and project instructions. This Skill grants no publishing, remote
push, dependency-upgrade, installation or multi-agent permissions.

The included references are generated from maintained Asyra documents. Links
between bundled guides work offline. External source links provide provenance
or further reading and may describe a different revision; inspect installed
APIs before relying on them. For maintenance, use the installation source to
update the complete Skill or
plugin, then verify its bundle in a fresh session. Do not rewrite the installed
reference snapshot during a task. Tool-specific installation and invocation
syntax belongs to the host; these development instructions are shared.

## Failure Policy

Report the first unresolved owner/API/check failure with concrete evidence.
Continue independent in-scope work, but do not claim completed product behavior
from failed or skipped checks. If the solution needs an unsupported Framework
change, explain that boundary rather than silently expanding the task.
