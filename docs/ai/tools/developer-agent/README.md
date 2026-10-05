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
- `bundle.json` records source hashes, file hashes and reference package versions.
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

Current candidate: 0.1.8, with public display name **Asyra Skill** and retained
installation identity `asyra-agent`. See the [delivery plan](skill-delivery-plan.md)
and [support evidence](support-evidence.md). Previous native loading trials are
versioned historical observations, not acceptance of this candidate. A plugin
is an installation wrapper; the host agent owns execution and product quality.

The standalone export uses the exact same Skill bytes and bundle record.
`inspectSkill` verifies only the record's Skill subtree; `inspectPlugin` verifies
the full distribution. `pluginVersion` remains the shared release version for
compatibility with existing version-check prompts. A standalone Skill does not
need sibling plugin metadata. Export to a new project-relative directory with
`--export-skill dist/asyra-agent`; the command never writes host settings.

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
