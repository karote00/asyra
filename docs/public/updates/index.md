# Update your App with an AI coding agent

Use these guides to understand selected official changes and integrate them into
your existing App. Official definitions are the base; your fields, Features,
rendering choices and document meaning remain App-owned. Updating a generator
does not update an existing App. Reading a guide does not modify your project.

Start with [Release history and update coverage](history.md) for per-owner
release summaries, supported boundaries, prerequisites and guide corrections.
Select the complete predecessor chain and revisit any earlier deferred adoption;
installed package versions alone do not prove that local Features or data were
integrated. Missing history or unavailable targets are explicit coverage gaps.

## How to use

Choose an applicable guide below and give its link or complete Markdown file to
an AI working in your App project. Ask it to integrate the selected changes,
retain your custom behavior and data, and run the guide's preservation checks.
No particular agent, Skill, plugin or update CLI is required.

The documentation's `llms.txt` lists the guides: the repository copy links to
Markdown files, and the website copy links to documentation pages. For an offline
handoff, include the referenced source evidence and preserve relative links.
Missing target evidence blocks dependent edits; do not guess unavailable APIs.

## Available guides

| Guide                                                                           | Change and revision                          | From                                                  | To                                                                                 | Status                                                                                   |
| ------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Adopt official Text and keep extensions](text-official-fields-example-1-r3.md) | `text-official-fields-example-1`, revision 3 | Modeled `custom-text-example-1` contract in the guide | Text at source `7bf3655242e6adca9ac7d81ff57d17df9b310c9e` plus retained App fields | Worked example; revision 2 acceptance retained; revision 3 adds follow-up clarifications |

The [subsequent Text update](text-spacing-example-2-r2.md) now includes revision-2
installation guidance and a retained pre-update delivery package. Its original
[revision 1](text-spacing-example-2-r1.md) passed a fresh-AI acceptance with 29
tests. The revision-2 isolated rerun passed 34 tests with existing context; it
is not a new independent acceptance. Published-release support remains unverified.

The [cross-version and partial-adoption exercise](text-cross-version-example-3-r2.md)
models three App stages and a shared Framework prerequisite. Independent
revision-1 acceptance passed 31 tests plus typecheck, lint and build. Revision 2
clarifies hash algorithms and composition-time definition reads; its permanent
fixture replay is distinct from that original independent run. The frozen
[revision 1](text-cross-version-example-3.md) and original evidence remain intact.
This does not replace earlier Text results or establish a verified published range.

The prior [revision 2](text-official-fields-example-1-r2.md) remains available for
its original acceptance record. Revision 3 does not claim a second independent run.

The release history owns current availability and supported comparisons. The Text
guide demonstrates the delivery format and preservation requirements; it is not
an announcement that a particular release added Text or a command to install a
package. Its own metadata owns the precise scope and evidence limits.

## Select the current-to-target range

1. Inspect resolved dependencies, the actual local definitions and any previous
   adoption note. Keep the initial generator version, installed packages, adopted
   capabilities and App document schema version separate.
2. Select guides whose source conditions match that state and whose target is
   available. Include intermediate dependency changes, removals, renames and
   migrations when skipping releases; the latest guide alone may be insufficient.
3. Compare local extensions and overrides against each changed contract. Same
   names do not prove equivalent defaults, validation, units or behavior. Keep
   deferred capabilities visible, and check shared package effects even when
   only Text is selected.
4. If the range is not documented, report the missing comparison. Do not claim a
   complete version delta or mark the whole App updated from a partial example.

Keep the exact adopted guide revisions in the note. A newer correction to an
already-adopted release still needs review; it is not automatically adopted.
For each prerequisite package, select its own actual adoption baseline and target,
include its intermediate summaries and deferred changes, and repeat for nested
prerequisites. A matching installed version is insufficient. Report missing
baselines or unavailable intermediate releases before integration.

## Give the guide to your AI

Use this request in the App project with the selected guide attached or linked:

> Integrate the selected official changes described in this guide into my App.
> Start from the release history and inspect my actual adopted baseline, target
> and adoption note. Include every intervening summary, prerequisite and earlier
> deferred change. Follow guide corrections and stop on coverage gaps before edits.
> Check applicability and actual installed APIs first. Preserve my custom fields,
> Features, read/write paths, projections and saved data. Use existing Asyra
> composition and App migration APIs. Run the guide's preservation cases using
> my project's tests, review the diff and record actual adoption. Ask me about
> unresolved product choices. Do not discard data or modify production storage.

The agent should return the bounded changes, test results, remaining differences
and a short adoption note in existing project documentation. A successful build
alone does not prove preservation. Failed or incomplete integration stays pending.
For the next update, provide the next guide and the current project with that
note. The next agent must inspect intervening user changes; it must not reset
custom fields to an earlier example or require the previous chat history.

## Required guide information

Keep one Markdown guide per change revision and link to it from release summaries.
Register it in the existing public content manifest for navigation and discovery.
Cover the information below; combine sections and scale detail to the change.
Sections may be combined or reordered, while retaining the existing public
documentation requirement for a `Canonical sources` section.

- **Applicability:** change identity, revision/date, affected capability, exact
  source and target, prerequisites and evidence status. Distinguish available
  artifacts from inspected manifests and modeled examples.
- **What changed:** before/after behavior, affected definitions and dependencies,
  including defaults, validation, units, persistence and projection when relevant.
- **How to integrate:** public APIs and accessible source references, registration
  order, handling of overlaps and retained custom fields, Features and consumers.
- **Data impact and verification:** unchanged representation or the required
  App-owned migration; concrete checks for affected reads, writes, projections,
  actions and save/reload. Separate required checks from actual passing evidence.
- **Next update:** a short adoption note with retained extensions, overrides,
  deferred items and verification results, so another AI can continue without
  previous chat history. Include a handoff request when it helps the user.

Before listing a guide as a verified release comparison, compare both shipped
artifacts with the stated versions, public exports, definitions and behavior.
Verify source links are accessible to consumers and run the applicable
preservation checks. Source manifests alone do not establish registry
availability. Separate source review, package verification and actual independent
AI integration results; do not collapse them into a single "verified" label.

Published revisions remain immutable. Corrections get a new revision with the
reason and a supersedes reference; preserve previously published links. This
first Text example was promoted from an unpublished planning draft, so there is
no public revision 1 artifact to install or retrieve. Later release guides must
refer to actual artifacts and use the same delivery and validation process.

## Canonical sources

- [Core composition and public API contract](../../ai/framework/packages/core.md)
- [Property definitions and validation](../../ai/framework/packages/props-manager.md)
- [App-owned document migration](../build/persistence-migration.md)
- [Support and release boundaries](../reference/support-release.md)
