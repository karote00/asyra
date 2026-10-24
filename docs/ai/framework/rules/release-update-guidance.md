# Rule: Release Update Guidance

## Ownership and scope

App and Framework release owners maintain the explanation of what consumers
receive and how to integrate it. Use each owner's previous successful delivery
and exact target source/artifacts; Changesets and changelog filenames do not
prove coverage. Keep Framework packages, create-app distributions and hosted App
channels distinct. Template generation alone is not publication.

This rule applies during feature, API, App, bug-fix, refactor and release work.
Normal Markdown-only work needs no new impact declaration unless it changes
integration instructions. Existing version, review and publication permissions
remain unchanged. A note or passing document check never authorizes a release.

## During development

Add a short pending note in the owner's existing `CHANGELOG.md` or
`RELEASE_NOTES.md`. If no owner notes exist, use a pending section in the root
[release notes](../../../../RELEASE_NOTES.md), explicitly naming the owner/channel.
A future public summary collection may use `docs/public/updates/pending.md`.
Do not introduce another changelog or service merely to store a note.

Use an `update-note` JSON fence so the PR check can read the same information as
humans. Paths are exact repository-relative files, not directory globs. `change`
is a stable reference within that owner; retain it when summarizing the release.
List all affected owners in separate notes when they have different consumer
impact. Shared changes can reuse a reference and guide; do not copy guide text.

```update-note
{
  "change": "text-official-fields",
  "owner": "Framework packages",
  "summary": "Official Text adds fields that some consumers already define.",
  "sources": ["packages/preset/src/props.ts"],
  "impact": "integration",
  "guides": ["docs/public/updates/text-official-fields-example-1-r3.md"],
  "reason": "Compare field meaning, retain App extensions and verify saved data."
}
```

This illustrates the format, not an actual release claim; use the changed source
paths and applicable guide for the real change. The linked Text guide is a modeled
example, not verified release-to-release support.

Choose `integration` when consumers need adoption, composition or data decisions:
optional Features, overlaps, API changes, removals, defaults, validation, units,
projection and persistence changes can all qualify, including patch releases.
Supply at least one guide following the existing
[required guide information](../../../public/updates/index.md#required-guide-information),
including its `Canonical sources` section, and register it in the existing public
content manifest. Do not invent another guide schema.

Use `no-action` with `guides: []` and a concrete reason when no consumer integration
is needed, including internal-only changes and ordinary bug fixes that preserve
the integration contract. A short summary still explains the behavior change.
Review the classification; patch size, unchanged exported names or an optional
Feature remaining unregistered do not establish absence of impact.

Run `yarn docs:updates:check` before committing. It compares HEAD with the working
tree, including untracked files. For a committed PR comparison use:

```sh
UPDATE_GUIDANCE_BASE_SHA=<base-sha> UPDATE_GUIDANCE_HEAD_SHA=<head-sha> yarn docs:updates:check
```

The check requires a new or revised declaration covering each changed non-Markdown
file and validates added/revised notes even in documentation-only changes. All
retained `update-note` blocks in the target notes files participate in identity
and guide-reference checks, including when those files are unchanged. This does
not require a new declaration for ordinary Markdown-only changes. Use
one note for related code, configuration and tests; internal tooling needs only a
no-action reason. An unchanged historical note cannot cover new work. Deleted
and renamed source paths still need a disposition. Source references in changed
notes must exist in the compared source or baseline; check file metadata without
reading source payloads. Retained historical source references do not require
files removed by later work to be restored. Integration guides must exist in the
target, be registered publicly and retain the source section. Existing public-document
checks own full link and content validation.

PR CI runs this check independently of versioning admission. It verifies declared
coverage and references, not semantic completeness. Reviewers compare actual
source/tests with defaults, validation, units, dependency effects and saved-data
meaning. A plausible note, valid link or green test cannot replace that review.

## At each owner's release

Follow the existing [package](../../workflows/package-release-validation.md),
[App](../../workflows/app-cloudflare.md) or
[Cloudflare App](../../workflows/app-cloudflare.md) workflow. Reconcile pending
notes against the entire actual delta since that owner's last successful release,
including accumulated and dependency-only changes. Add omitted changes, remove
unshipped changes and explain no-action categories. Keep shared Framework
prerequisites linked from App summaries.

Produce a short summary for every covered delivery, with owner/channel, previous
and target identities, source/artifact versions, behavior changes, actions or
no-action reasons, guide/prerequisite links and evidence status. Detailed guides
are needed only for integration decisions; do not write every possible version
pair. Preserve stable change references to avoid applying shared work twice.

Missing or ambiguous history is a coverage gap, not proof of no change. Record
an explicitly reviewed first supported boundary if prior evidence is unavailable.
Keep predecessor links and durable published history; expiring CI artifacts alone
are insufficient. Maintenance/backport applicability must be explicit.

Before publication, reviewers verify guidance against the frozen release inputs.
After successful delivery verification, link the actual result. Candidate evidence
and availability are separate; partial failure does not advance an entire batch.
Published summaries/guide revisions stay immutable: corrections need a new
revision, reason and supersedes reference, preserving old links and required
migrations. Guide revisions are not package or document schema versions.

The implemented automatic check covers development PR declarations only. Binding
its evidence to frozen release artifacts and enforcing it in actual publishers
are not implemented yet. Existing release gates and permissions remain in force;
do not claim that a document check prevents direct publication.

## Consumer preservation and subsequent updates

Use official definitions as the base and keep App-owned extensions through
existing public define/register/update APIs. Inspect the actual API contract and
registration order; same names alone do not prove equivalent behavior. Remove
only semantically equivalent duplicates. Different units, defaults or meanings
require an explicit decision before dependent changes. Do not merge whole App
snapshots or discard unrelated Features, rendering, actions or fields.

Select summaries from actual App/package baselines to the target, plus older
deferred capabilities, required migrations and applicable guide corrections.
Installed package versions do not prove implementation adoption or data migration.
Inspect intervening customization even when an adoption note exists; if it is
missing, inspect code/data rather than assume full adoption. Account for each
change as adopted, already satisfied, retained, deferred or inapplicable with a
reason. Check shared Framework effects even for unregistered optional Features.

Guides must specify preservation checks for affected custom field reads/writes,
projections/UI, actions, IDs/content, save and fresh reload. Preserve explicit
saved values when defaults change; verify intended defaults on new objects.
Use existing [App-owned migration](../../../public/build/persistence-migration.md)
before owner validation can discard/default old representations. Required steps
run in order, remain safe on repeated loads, and leave original data recoverable
on failure. Verify supported session undo/redo without promising persistent
historical undo. Intermediate package installation is required only by documented
prerequisites, not simply because several releases were skipped.

Leave a short adoption note in the consumer's existing project documentation:
actual versions/releases, guide revisions, retained extensions/overrides, deferred
obligations, document migration state and verification results. The next AI must
be able to continue with that note, public guides, accessible exact source/artifacts
and the current App/data, without prior chat or maintainer-only paths. Separate
modeled fixtures, local candidate tests, registry availability and independent AI
acceptance; preserve original evidence and label contextual reruns accurately.
