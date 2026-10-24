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
[Cloudflare App](../../workflows/app-cloudflare.md) or
[Cloudflare website](../../../../.github/workflows/site-cloudflare.yml) workflow.
Cloudflare Pages owns current hosted delivery. Reconcile pending
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

### Implemented release admission and retry boundaries

The existing Framework/create-app publishers and Cloudflare workflows require
artifact-bound candidate evidence before mutation, independently of the PR
check. Framework uses `tmp/framework-release-guidance.json`; create-app uses
`tmp/create-app-release-evidence/<app>/guidance.json`; Cloudflare uses
`tmp/cloudflare-release-guidance/<app>.json`. Each binds exact source, original
per-delivery baseline, artifact integrity, update notes and guide hashes. Missing
history or changed inputs stop admission. Ordinary Markdown-only changes still
need no new update note; revisions to referenced guides remain bound by hash.

For npm, an identical version/integrity published from an earlier source is an
unchanged member, using that published source as its baseline. A same-source
partial retry requires the retained candidate and preserves its original
predecessor. Missing registry source/tag evidence or same-candidate guidance is
not an unchanged-package exemption. Never repack different bytes under an
existing version to bypass the integrity check.

Cloudflare restores immutable candidate checkpoints and per-attempt results from
its existing Actions workflow, then checks the original baseline. An uploaded
retry is admitted only for the same candidate source/bytes and the recorded
production deployment ID. A newer source requires verified predecessor evidence;
resolve the previous verification failure first. Sources predating the guidance
protocol keep their existing provider/marker baseline admission. Missing or
expired protocol evidence is an explicit coverage gap, never an empty summary.
See [Cloudflare recovery](../../workflows/app-cloudflare.md#verification-and-recovery).

Publication and public verification remain separate outcomes. Local/CI candidate
files and expiring artifacts do not implement durable public release history or
consumer discovery; use the committed records below. No gate changes release authorization.

## Durable public release records

After delivery verification, copy the matching frozen candidate and per-owner
result into permanent, publicly accessible release evidence in the repository
or the owner's durable release assets. Check the candidate hash, owner, source
and registry integrity/deployment ID; use the recorded deployment's `verified`
result, not the latest attempt status. Do not infer availability from local
candidate tests. Actions artifacts alone are not durable evidence.

Author one English Markdown summary under `docs/public/updates/releases/`,
register it in `docs/public/content-manifest.json`, and include one
`release-summary` JSON fence. The surrounding prose explains what changed,
consumer actions and evidence limits. Use the necessary fields below; no new
service or update CLI is involved.

| Field                      | Required content                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`, `owner`, `channel`   | Stable record ID, actual delivery owner, and `npm` or `cloudflare`.                                                                                                                        |
| `target`                   | Frozen `sourceSha` and artifact `integrity`, plus npm `version` or Pages `deploymentId`.                                                                                                   |
| `previous`                 | Record ID matching the candidate's actual baseline; use `null` only with an explicit `boundary` describing the first supported release. Never infer a predecessor from version arithmetic. |
| `status`, `evidence`       | `verified`, `candidate` or `modeled`; durable public HTTPS evidence links. Only verified paths support adoption.                                                                           |
| `requires`                 | Exact prerequisite release IDs, including shared Framework requirements. A different selected dependency is a gap until its compatibility is explicitly documented.                        |
| `changes`                  | Candidate notes projected to `change`, `summary`, `impact`, `reason`, `guides`; retain stable change IDs and all required conversions. Guide paths are relative to `docs/public`.          |
| `guideHashes`              | Each referenced public guide path mapped to its frozen candidate guide hash (SHA-256 of the JSON-encoded UTF-8 text, the existing release-guidance hashing contract).                      |
| `supersedes`, `correction` | For a correction only: prior record ID and reason. Preserve target/predecessor identity and required changes/prerequisites; link a new guide revision rather than edit a frozen one.       |

The current public history intentionally has no verified releases. Do not backfill
old availability or promote the Text examples without actual release evidence.
Register modeled or candidate summaries only when their scope is useful and
explicit; they never count as a verified update range.

Run `yarn docs:public` and `yarn docs:public:check` to regenerate/check
`updates/history.md`, content/source indexes and both `llms.txt` entries. The
manifest owns additional update pages; no fixed page count is raised for each
release. The generator checks duplicate IDs, predecessor/prerequisite links,
cycles, corrections, registered guides and frozen guide hashes. The existing
`yarn docs:updates:check` also rejects editing/deleting published summary bytes
or removing retained release pages from discovery. Ordinary Markdown wording
changes remain exempt from new impact notes.

The history and each release page are Git-tracked public content, independent
of CI retention. Publish them through the normal authorized documentation release.
A locally generated page is not evidence of an online deployment. Consumers
follow every predecessor, revisit earlier pending adoption, and inspect actual
code/data when an adoption note is missing. Maintainer review still owns semantic
coverage and the truth of publication evidence; structural checks cannot prove
that a declared release occurred.

## Consumer preservation and subsequent updates

Preserve exact adopted record/guide revisions in the adoption note. Resolving
a newer correction never updates that evidence automatically: include its guide
and inspect adoption even when the original release is the comparison baseline.
Each prerequisite owner/channel has its own adoption baseline, selected target
and pending changes. Traverse its intervening summaries and nested prerequisites;
missing baselines and unavailable intermediate records remain explicit gaps.
The internal documentation selector accepts those dependency selections as
`{ from, to, pending }` per `channel:owner`; `from` is an actually adopted record,
not an installed package version. Unknown pending state requires inspection.
This is a documentation query, not a package compatibility solver or migration.

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

## Release admission commands and evidence

Existing release commands now enforce the guidance boundary:

- Framework: `yarn release:framework` prepares guidance with the artifact
  handoff, then the direct tarball publisher rechecks it. The registry consumer
  gate precedes verification recording and validation-workspace cleanup.
- create-app: `yarn release:create-app --prod=<app>` packs the generated CLI
  after the existing validation. Its direct publisher admits and publishes that
  exact tarball. A published record does not claim a public consumer smoke test.
- Cloudflare Apps and website: their existing manual workflows prepare guidance
  after downloading the tested artifact, inside the publication job. They read
  the provider's canonical successful production deployment and confirm its
  public source marker. A second check precedes upload; project creation also
  requires admission. Build jobs receive no deployment credentials.

Preparation reads update notes and registered guides from the frozen Git source,
compares each delivery's predecessor with that source, and includes old/new
workspace dependencies and shared build inputs. The candidate contains changed
paths, declared impacts, prerequisite package manifests, guide content hashes and
artifact integrity. Ordinary Markdown changes retain their declaration exemption;
referenced guide corrections are still included. Review semantic completeness:
these checks cannot decide whether a no-action explanation is truthful.

The npm predecessor is the actual `latest` registry version and integrity,
resolved to its registry source SHA or verified local release tag. Fetch missing
release tags before preparation. Cloudflare uses the canonical deployment ID and
full commit SHA, not a guessed version or the latest workflow run. Missing source,
non-ancestor history, a missing production marker/project, or an unestablished
first-release boundary is a coverage gap and blocks delivery. Task 2 supports
updates of existing releases; it does not invent a bootstrap baseline.

Candidates live in `tmp/framework-release-guidance.json`,
`tmp/create-app-release-evidence/<app>/guidance.json`, and
`tmp/cloudflare-release-guidance/<app>.json`. Do not edit these to bypass a failure.
Fix the source notes/guides, commit the correction and rerun the existing release
preparation and validation. For a changed online baseline, prepare again against
that baseline; an old downloaded artifact is not automatically accepted.
The original checkout supplies Git history for npm preparation, not the isolated
Framework validation workspace. create-app may regenerate its template as the
existing flow requires; other tracked source must remain clean.

Each direct npm publisher requires matching guidance even when invoked without
its orchestrator. Candidate source, roots, notes, guides, artifact and baseline
must still match before any registry write or local tag. A partial npm retry
retains the original predecessor and skips only an identical immutable artifact
already in the registry. Re-preparing that same candidate requires its retained
guidance. Unknown or different bytes never count as a successful retry.

Results have a candidate-specific hash in their filename and record outcomes per
package/App. A successful upload followed by failed public verification remains
failed with `published: true`; no whole-batch baseline is promoted. Preserve those
records when retrying. Existing recovery and publication authorization remain in
force. Cloudflare retains candidate/results with its workflow artifacts and links
the summary hash in the job summary. These local/CI records are not durable public
release history or a claim of comprehensive live acceptance. Public discovery and
durable history remain Task 3; existing consumer adoption/data evidence is unchanged.
