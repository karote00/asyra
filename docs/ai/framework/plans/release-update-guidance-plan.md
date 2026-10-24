# Release Update Summaries and Consumer Integration Guidance

## Status and bounded contract

IN PROGRESS - updated 2026-10-24. This revision replaces the Changeset-centered
proposal with the existing App and Framework release owners. Task 1 is complete;
Tasks 2-4 remain PLANNED. Closeout owner: the release update guidance coordinating
chat.

Inspected base: `5f6b0c51aa0dd3178e5a9de285b10141f4691e5e`.
Branch: `codex/release-update-guidance-plan`. Repository paths below are
root-relative. The reviewed planning stage was committed as
`92d25f4b7` before Task 1 implementation. Task 1 establishes the rule and
development checks only; no release command or publisher is changed. Future
workers must select a committed base containing this plan and their completed
prerequisites before starting an authorized task.

The completed `docs/ai/framework/plans/completed/app-cli-update-and-migration-plan.md`
remains complete. Its first independent acceptance, existing-context reruns and
permanent fixtures retain their separate meanings and original evidence.

Outcome: each covered App/Framework release has a usable update summary, with
integration guides where needed. A consumer can skip releases or resume partial
adoption without losing required changes, custom behavior or document meaning.

Scope: formal project rules and workflow routing, release-owned change notes,
summary/guide validation at existing release boundaries, public discovery and
preservation tests. No new publisher, update CLI, whole-App merge engine, hosted
lookup service, version policy, runtime API or production-data migration is
included. Keep existing deployment providers, permissions, triggers, recovery
and resource guards. Execution, push, merge and publication remain separately
authorized; this plan authorizes none of them.

## Existing owners and integration points

| Release owner                             | Current source and evidence                                                                                                                                                               | Planned connection                                                                                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework packages                        | `scripts/release-framework.js`, `scripts/framework-release-artifacts.js`, `scripts/publish-framework-release.js`; exact source, package versions, tarballs and registry-only verification | Compare the previous verified release set with the frozen target; validate its summary before publication and link actual registry results afterward.                                             |
| App templates and create-app distribution | `release-configs/`, `scripts/release-template.js`, `scripts/release-create-app.js`, `scripts/publish-create-app.js`                                                                       | Compare the same App's previously published distribution with its candidate, including Framework requirements; validate before package publication. Template generation alone is not publication. |
| Hosted Apps                               | `scripts/app-release.mjs`, `scripts/app-release-plan.mjs`, `scripts/app-release-service.mjs`; Cloudflare workflows and `scripts/app-cloudflare.mjs`                                       | Use that App/channel's actual successful deployment and source/artifact evidence. Connect documentation checks before the existing publication boundary, preserving the provider workflow.        |
| Public documentation                      | `docs/public/updates/index.md`, public content manifest/generator, website and `llms.txt`                                                                                                 | Expose release summaries, necessary guides and applicable history through existing entries.                                                                                                       |

The Vercel release planner already compares each App's successful baseline SHA
against the dispatch SHA with old/new dependency roots. Cloudflare delivery
records the deployed App/source SHA, but that marker alone is not a complete
historical release inventory. Recover the previous successful baseline from the
existing release workflow/provider evidence; if it cannot be established, report
a coverage gap or explicitly reviewed first-release boundary. Never invent it.

Keep a website deployment distinct from a Framework package release. A hosted
App and its create-app distribution can also have different release histories.
Preserve their existing identities/channels, exact source SHAs and artifact
versions; do not introduce a synchronized global version. An App summary links
to the required Framework releases rather than copying their guide text.

Changesets may continue serving existing package versioning. Their presence,
count, filenames or changelog output are not the authority for summary completeness.
The release owner's previous successful delivery, frozen target and actual
consumer-facing difference are the comparison boundary.

## Two public document levels

1. **Release summary:** owning App/Framework and delivery identity, previous and
   target release references, exact source/artifact versions, concise behavior
   differences, required actions or no-action reasons, prerequisites, guide links
   and verification/publication status. A Framework release set may contain
   different package patch versions; account for every delivered package change.
2. **Integration guide:** use the required-information list already defined in
   `docs/public/updates/index.md`. Explain affected definitions and behavior,
   overlap with customization, source/target conditions, public APIs, data impact
   and preservation checks. Write one when the consumer needs integration or
   migration decisions, including significant patch-level default/behavior fixes.

A small internal-only release needs only a concise no-action summary. Do not
require a long guide for every release or author every possible version pair.
Keep stable change references within release notes and guides so shared changes
can be recognized across App/Framework summaries; no separate change database
or global registration service is required.

Published summaries and guide revisions remain immutable. Corrections receive
a reason and supersedes reference, preserve old links and retain still-required
migration obligations. Guide revisions are separate from package and App schema
versions. Durable public history must not depend solely on expiring CI artifacts
or private maintainer files.

## Development and release flow

1. **During development:** the feature owner adds a short pending change note to
   the owning release's existing notes/changelog. Where that owner has no such
   surface, use a small pending Markdown section alongside its update summaries.
   Record behavior impact, source references and a guide link when needed. The
   reviewer checks defaults, validation, units, shared dependencies and data meaning.
   AI can draft; a diff or exported-name scan cannot establish semantic completeness.
2. **At release preparation:** freeze the previous successful release and target
   using the current owner's records. Review the actual source and artifact delta,
   including accumulated changes since that owner's last release and old/new
   dependencies. Reconcile notes against this delta: add omitted changes, exclude
   changes that did not ship, and explain no-action categories. Missing notes
   cannot make an actual change disappear. Produce one candidate summary.
3. **Before publication:** run the same bounded summary/guide validator in the
   existing preparation/verification path. Its passing evidence must identify the
   frozen baseline, target, artifacts and guide revisions. The actual publisher
   must require matching evidence before its first mutation, including direct
   publisher entrypoints. A changed candidate or online baseline invalidates it.
   Merely adding a standalone documentation check is insufficient. Reuse existing
   artifact handoffs and release results, not a second approval system.
4. **After delivery verification:** link the actual successful registry/deployment
   result from the public release entry. Keep candidate validation and public
   availability distinct. A failed or partial release does not advance the whole
   batch's successful baseline; preserve per-owner outcomes and use existing
   recovery. Do not rewrite a frozen guide to change its availability status.

Automated checks establish identity, references, declared coverage and evidence
consistency. The release owner reviews whether the summary describes all relevant
behavior; a complete file list is not proof of that judgment. Guide discovery and
summary generation should reuse the frozen release inputs. Do not add a persistent
cache unless a measured need justifies one under existing computation rules.

## Permanent rule and workflow deliverables

Task 1 established the authoritative
[release update guidance rule](../rules/release-update-guidance.md). It defines:

- when a development change needs a pending note or detailed integration guide;
- each release owner's responsibility to compare actual previous/target delivery,
  account for consumer impact and verify guidance before publishing;
- durable history, corrections, partial releases and explicit coverage gaps;
- preservation of consumer extensions/data and accurate verification claims.

Reference that rule from `AGENTS.md` and `docs/ai/workflows/agent-task.md`, and from
applicable development/release workflows. Keep those entries short and avoid
copying the complete rule into each workflow. The plan coordinates delivery;
future work must find the permanent rule without opening this plan or chat.

Reuse the existing `docs-contract-sync` skill for authoring instructions where
helpful. It may link to the rule; a new standalone skill is not required. Skills
teach the procedure, project rules own obligations, and PR/release checks enforce
what can be checked objectively. Preserve documentation-only exemptions and the
current release/version authorization rules.

## Cross-release and partial-adoption selection

The public entry declares covered products/channels and the earliest verified
release boundary. Each successful release links its verified predecessor. Reconcile
coverage with actual release history; do not assume consecutive version numbers
or treat missing history as no change. Maintenance/backport applicability must
be explicit; unsupported or ambiguous paths are reported as gaps.

The consumer AI inspects the current App, resolved packages, actual adopted
capabilities, saved document schemas and adoption note. Its required inputs are
all of the following, not only an installed-package version range:

- summaries between the consumer's relevant official release baselines and target;
- earlier deferred or retained implementations that the user now wants to adopt;
- prerequisite changes and migration steps required by the actual code/data state,
  even when they predate an already installed package version;
- applicable guide corrections and shared Framework effects, including effects
  of a package upgrade when an optional Feature remains unregistered.

Account for each item as adopted, already satisfied, deliberately retained,
deferred or inapplicable with a reason. Resolve superseding instructions without
dropping required data conversions. Reuse shared change references to avoid
performing the same integration twice. Missing evidence or an incompatible
same-name field requires an explicit decision before dependent edits.

Integrate the target official definitions while retaining App-owned extensions.
Do not install every intermediate release unless a documented prerequisite needs
it. Execute necessary App-owned data migrations in order before owner validation
can discard/default old values. Keep package, adoption and document schema state
separate. Record target versions/releases, guide revisions, custom overrides,
deferred obligations, migration state and results for the next update.

## Task 1 - Establish the permanent rule and authoring entry

Status: DONE - 2026-10-24. Executed from the reviewed plan in `92d25f4b7`.
Deliver the rule and entry references above, the minimal release-owned pending
note format and the guide decision criteria. Route existing feature, API, App
and bug-fix workflows to the same rule. Add scoped PR/document checks for required
impact declarations and valid guide references without using Changeset presence
as the coverage oracle. Review semantic accuracy against actual source/tests.

Acceptance: a later contributor following the normal project entry finds the
rule without this plan; optional features, behavioral patches, internal-only
changes and App releases receive the appropriate notes/guides. Missing required
information fails; ordinary documentation work keeps its existing exemptions.

Task 1 completion: the permanent rule is linked from `AGENTS.md`, the normal
agent entry, feature/API/App/bug-fix/refactor workflows and the three existing
release workflow documents. Pending `update-note` declarations live in existing
release notes; `yarn docs:updates:check` checks changed-file coverage and public
guide references locally and in PR CI. Markdown-only changes remain exempt from
new declarations, while added/revised declarations are validated. Changesets
retain their separate versioning admission; they are not this check's input.

Verification: 149 focused tests passed across release guidance (12 cases), agent
eval machinery, task context, release records, Changeset admission, CI selection,
App release/Cloudflare contracts and test placement. The new Git fixture proves
that PR reads use the selected commit, not uncommitted notes, and that local
checks include untracked changes. Entry/link checks need no plan/chat context;
they are deterministic contract tests, not a new independent AI acceptance.
Naming, scoped ESLint, public generation and public validation passed (46 pages,
19 package guides, 314 local links, 160 API references). The generated source map
changed only the root manifest hash. Existing Text guides, fixtures and original
acceptance evidence were not modified.

The new check enforces declared structure, not semantic completeness or release
artifact admission. Publisher wiring, release history and preservation exercises
remain Tasks 2-4. No publication, deployment or remote push occurred.

## Task 2 - Connect guidance to each existing release boundary

Status: PLANNED. Prerequisite: Task 1.
Add summary preparation, validation and result references at the owners in the
integration table. Keep each owner's previous successful baseline authoritative.
Reuse `scripts/release-records.js` where applicable, but do not assume it already
runs in the release commands or covers App publishers. Do not change versioning,
providers or publication authority.

Before implementing shared release gating, review the existing release Inspector
contracts and adjust only the affected preparation, documentation, versioning and
publication handoffs with their formal tests. Guide authoring's developer Agent
exception does not exempt shared publication behavior. No new generic Inspector
system is needed.

Acceptance: an omitted note is found during actual-delta reconciliation; missing
summary/guide or stale evidence stops the actual publisher before mutation;
independent App baselines, shared Framework changes, dependency-only releases,
no-action releases, reverts, retries and partial failures are represented correctly.
Use existing publisher/provider stubs for tests; do not publish to prove the gate.

## Task 3 - Expose release history and applicable guides

Status: PLANNED. Prerequisite: Task 2.
Use the current public index, content manifest/generator, website and `llms.txt`.
Expose each owner's release summaries, predecessor references, Framework
prerequisites and guide corrections. Derive inventory checks from declared
content rather than adding a fixed page count for every release. No new lookup
service or update CLI is needed.

Acceptance: the public entry supports a direct multi-release update and reports
a missing middle release/guide, unsupported baseline, unavailable target or
incompatible dependency. Partial adoption retrieves earlier outstanding guides;
a missing adoption note triggers inspection of actual state rather than an
assumption of full adoption. Published history survives normal CI retention.

## Task 4 - Prove customization and data preservation

Status: PLANNED. Prerequisites: Tasks 1-3.
Reuse the Text fixture tooling with separate new scenarios and evidence. Model
three releases: official Text overlaps two custom fields; a later default changes
while the consumer adds another custom field/Feature; a later representation
requires an ordered App migration. Keep modeled artifacts explicitly labeled.

Required cases:

- Direct first-to-last adoption accounts for every applicable intermediate change,
  including an App release's shared Framework prerequisite.
- Packages are already newer while Text implementation/data remain older; resuming
  deferred adoption still retrieves old prerequisites and conversions.
- A subsequent update retains customization added after the previous adoption
  note; intentionally deferred optional features remain explicit.
- Same-name fields with different meaning stop for a decision. Equivalent overlaps
  adopt the official definition without duplicate Feature/registration behavior.
- Custom field reads/writes, projections/UI, approval actions, document IDs/content
  and values survive save and fresh reload. Explicit saved values are not replaced
  by newly changed defaults; new objects use the intended shared defaults.
- Migration order is correct, failed integration leaves original data recoverable,
  and repeated integration/load neither converts twice nor duplicates registration.
  Check supported session undo/redo without inventing persistent undo history.
- A consumer receives only public entries/guides, accessible exact artifacts/source,
  the current App, sample data and its adoption note. It can complete the update
  and leave a usable next note without this conversation or maintainer-only paths.

Keep all original independent acceptance records unchanged. New fixture tests and
consumer exercises report their own context and results; local candidate success
is not proof of registry availability or universal historical compatibility.

## Verification and completion

For the original planning stage: check only the plan/index diff, formatting and
referenced existing paths. Task 1 validation is recorded above; no release command
or external mutation was needed.

For authorized implementation: use failing regression cases for new admission/gate
behavior, existing owner tests for release/artifact/provider handoffs, relevant
Inspector contracts, document/discovery checks and Text preservation/browser
checks. Run applicable naming/lint/type/build checks and preserve resource guards.

Done means the permanent rule is reachable through normal project workflows;
each covered release route prepares and verifies guidance against its actual
baseline/target before publication; public history identifies gaps honestly;
and cross-release, partial-adoption and subsequent-update cases preserve custom
behavior and data. Automation cannot replace owner review of semantic completeness.
No actual release, deployment or historical backfill is required to implement this
flow; unverified old releases remain explicitly outside the supported window.

## Canonical sources

- `docs/public/updates/index.md`
- `docs/public/build/persistence-migration.md`
- `docs/ai/workflows/agent-task.md`
- `docs/ai/workflows/package-release-validation.md`
- `docs/ai/workflows/manual-app-release.md`
- `docs/ai/workflows/app-cloudflare.md`
- `docs/ai/framework/rules/release-version-topology.md`
- `scripts/release-framework.js`
- `scripts/framework-release-artifacts.js`
- `scripts/publish-framework-release.js`
- `scripts/release-template.js`
- `scripts/release-create-app.js`
- `scripts/publish-create-app.js`
- `scripts/app-release-plan.mjs`
- `scripts/app-release-service.mjs`
- `scripts/app-cloudflare.mjs`
