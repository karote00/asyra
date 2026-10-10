# Asyra Skill maintenance

## Purpose and boundaries

Asyra Skill helps users build products with Asyra in Codex,
Claude Code and Grok Build. Plugins provide host-specific installation. Its public entry is
[installation and usage](../../../../plugins/asyra-agent/README.md).
Its instruction owner is the plugin's `skills/asyra-agent/SKILL.md`.
Canonical Framework and App documentation stays authoritative.

The [persistent scope exception](../../workflows/task-context.md#asyra-developer-agent-scope-exception)
excludes this adoption tooling from Flow Inspector admission, readiness and
execution. Future conversations do not need renewed permission for that
exception. Framework/App runtime work, including `@asyra/ai-agent-runtime`,
retains the ordinary rules. This exception does not grant remote publication,
dependency upgrades or writes outside the project.

## Source and packaging owners

- `.agents/plugins/marketplace.json` registers the local plugin with Codex.
- `plugins/asyra-agent/bundle.config.json` owns the shared release identity.
- Codex and Claude plugin manifests are generated from that identity.
- `.claude-plugin/marketplace.json` exposes the same plugin tree to Claude Code.
- `bundle.config.json` lists the exact public guides to distribute.
- `scripts/developer-agent-bundle.mjs` produces references and `bundle.json`.
- `bundle.json` records bundled guide source hashes, file hashes and sorted
  reference package versions. The complete package catalog is not hashed: its
  descriptions, export listings, formatting and ordering are not Skill inputs.
  These are reproducibility records, not signatures or compatibility promises.

The plugin contains its required guides, so consumer projects do not need the
Asyra checkout. Unbundled source links are optional online provenance and can
show newer content. Always inspect the consumer's installed public APIs.

## Maintain and release

1. Change canonical documentation or the Skill for the intended behavior.
2. When public documentation changes, run its existing generator first:
   `node scripts/docs/public-documentation.mjs --write`.
3. Run `node scripts/developer-agent-bundle.mjs --write`, then `--check`.
   Generated references are never edited directly.
4. Run `node --test scripts/__tests__/developer-agent-bundle.test.mjs` and
   `yarn lint:naming`, plus the affected public-document checks.
5. For a release, retain the previous released `bundle.json` inside the project
   and run `node scripts/developer-agent-bundle.mjs --check --baseline <path>`.
   Changed plugin contents require a higher three-part plugin version. Ordinary
   development checks do not imply a release comparison was performed.
6. Update the changelog, test discovery in each claimed host and both product scenarios
   below, and record the client version, source revision, package versions and
   actual results. Obtain the ordinary publication authorization before release.

An unrelated App change need not bump the plugin. A guide/API change affecting
its bundled behavior does. Update the reference allowlist deliberately; the
script rejects missing sources, stale files, traversal, symlinks and unknown
plugin files. Hashes detect drift; they do not authenticate an untrusted bundle.

## Native and behavioral acceptance

Packaging tests prove reproducibility, release version checks and standalone
reference resolution. They cannot prove that a model follows the instructions
or that a particular Codex client discovers the plugin.

Use the permanent [acceptance scenarios](acceptance.md) for new-product creation
and a subsequent feature extension in a fresh conversation. Review the delivered
owners, UI subscriptions, measured updates, history, persistence and lifecycle;
API usage alone is insufficient. Record actual loaded Skill location and bundle
version. The packaging relocation test proves relative resource resolution, not
that the host or model always uses the correct path.

Current candidate: 0.1.10, with public display name **Asyra Skill** and retained
installation identity `asyra-agent`. See the [capability guidance plan](capability-guidance-plan.md)
and [support evidence](support-evidence.md). Previous native loading trials are
versioned historical observations, not acceptance of this candidate. A plugin
is an installation wrapper; the host agent owns execution and product quality.

The standalone export generates current guide bytes and a matching bundle record
from canonical sources. It does not require a prior `--write`, read retained
reference copies as authority, or mutate the maintained plugin. With synchronized
sources its output is byte-identical to the maintained Skill. Missing or unsafe
inputs fail before the destination is created; existing destinations are refused.
Export is preparation, not release admission: before publishing, synchronize the
maintained plugin and run `--check --baseline` with the previous release record.

`--check` remains read-only and rejects real source drift. PR selection consumes
`bundleInputPaths` from the packaging owner, so allowlisted guide and inventory
changes run the same packaging checks before merge, alongside existing document
checks. Unrelated catalog metadata requires no bundle update or version bump.

Cloudflare delivery validates its own production artifacts and dependencies;
its publication does not depend on this adoption tool's packaging tests.
The repository CI still runs them and reports failures normally.

`inspectSkill` verifies only the record's Skill subtree; `inspectPlugin` verifies
the full distribution. `pluginVersion` remains the shared release version for
compatibility with existing version-check prompts. A standalone Skill does not
need sibling plugin metadata. Export to a new project-relative directory with
`--export-skill dist/asyra-agent`; the command never writes host settings.

## Capability decision guidance

The canonical problem-oriented entry is
`docs/public/start/extend-with-ai.md`. Keep diagnosis routes independent of a
particular widget: applicability, supported capability, App duties, limits,
source contract and proof belong together. SKILL.md routes tasks to that guide;
it does not duplicate every capability contract. Bundle decision-critical public
references so standalone users need no contributor checkout.

Distill public guidance from maintained ownership and computation rules. Do not
ship internal governance or require a consumer to copy another App's structure.
Existing non-Asyra products need an adoption assessment before composition.
Record no-adoption and unsupported outcomes in the acceptance scenarios, and
keep model decision quality separate from deterministic bundle/link checks.

## Responsibility and failure attribution

The model owns requirement interpretation, implementation choices and review.
The plugin supplies Asyra-specific contracts and routes to maintained Starter
and verification resources. Starter and Framework owners supply correct source
behavior. Keep generic development advice out of the Skill unless an observed
failure demonstrates a missing Asyra-specific decision aid.

Use the acceptance protocol to separate source defects, stale knowledge, model
execution and verification gaps. Preserve uncertainty when evidence cannot
identify the cause. Synchronizing a reference proves freshness; it does not prove
better model decisions. Exposed product scenarios are acceptance exercises, not
independent holdout evidence. Do not substitute the eval tool's unrelated toy
cases for real Asyra product trials or add new infrastructure for this sync.

The retained `baselines/0.1.1.bundle.json` is the local installed-candidate
identity, not a public release claim. Compare a candidate with:

```sh
node scripts/developer-agent-bundle.mjs --check --baseline docs/ai/tools/developer-agent/baselines/0.1.1.bundle.json
```

For the approved standard and current evidence, see Tasks 2 and 3 in
`docs/ai/framework/plans/asyra-developer-agent-plan.md`. Required sources include
`apps/starter-app/docs/ARCHITECTURE.md` and `ONBOARDING.md`; update those canonical
owners first when App behavior changes, then regenerate the plugin. Never edit
bundled copies or the installed cache to conceal source drift.
