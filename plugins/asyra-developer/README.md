# Asyra Agent for Codex

Describe the product you want to build. Asyra Agent helps Codex choose an
Asyra starting point, find the right public APIs, implement the change and
verify its behavior. The plugin includes one Skill and selected offline guides,
including the complete Starter App architecture: responsibility boundaries,
UI-property subscriptions, update isolation, history, persistence and teardown.
Use your existing Codex account; this plugin adds no model subscription or
Asyra-hosted service.

## Try this local version

This checkout contains a development candidate, not a published plugin release.
With a Codex client that supports repo marketplaces, from the Asyra checkout:

```sh
codex plugin marketplace add .
```

Open the plugin browser, choose the **Asyra** marketplace and install
**asyra-developer**. Start a new conversation in your product project. Installation
is a user action and writes Codex-managed files outside this repository.
For a locally changed plugin, update this checkout and restart the client so
it can pick up the new files. Review the installed version before proceeding.

In Codex CLI, mention `$asyra-developer`. For example:

> Use $asyra-developer to build an Asyra App for reviewing design proposals.
> Start with a small working version that can save and reload proposals.

For an existing product:

> Use $asyra-developer to add a review status to this App. Keep the current
> data model and prove the edit works with Undo and Reload.

For an early idea, describe the desired experience; the agent will identify
technical owners and ask for product choices only when needed. Project-local
instructions and your requested scope remain authoritative.

## Install after publication

Once this marketplace and plugin have been published in the Asyra repository,
users can add `karote00/asyra` as a Git marketplace and select a reviewed ref.
Do not run that remote path expecting this unmerged candidate to be available.
The first release announcement must state the exact tested installation ref.

## Versions and updates

The plugin's version appears in `.codex-plugin/plugin.json`; the Skill's
`bundle.json` records its content identity and the package versions behind its
guides. Ask Codex to read the installed Skill's bundle identity to see what you
are using. Resolve that bundle beside the Skill actually loaded by Codex; do not
construct a cache path or look for plugin files inside a consumer project.
Those package versions describe the reference snapshot; they are
not a guarantee that every Asyra project is compatible.

Asyra release notes announce Agent updates. After reviewing those notes, update
an already configured Git marketplace explicitly:

```sh
codex plugin marketplace list
codex plugin marketplace upgrade asyra
```

`upgrade` refreshes the marketplace and may refresh installed files. Start a
new session and check the installed version again. This plugin has no background
update notification. Updating it does not upgrade your product's dependencies.
A source ref pinned to an older release stays on that selected ref.

To return to a previous version, use a separate checkout of its reviewed
release and add it as the local marketplace source through the same procedure
above. Confirm the resolved root with `marketplace list`, then install/reload
that version. Keep project instructions and dependencies unchanged. Avoid
loading a second standalone Skill with the same name alongside the plugin.

## Maintainers

Edit the canonical guides in the repository, then regenerate and check:

```sh
node scripts/developer-agent-bundle.mjs --write
node scripts/developer-agent-bundle.mjs --check
node --test scripts/__tests__/developer-agent-bundle.test.mjs
```

The generated references preserve links among bundled guides. Other links
point to source documentation online and can describe a newer revision. Codex
must check the target project's actual public APIs before using them.
For release comparison, retain the prior release's `bundle.json` inside the
project and pass it to `--check --baseline path/to/bundle.json`. Changed content
requires a larger plugin version. See the repository's
`docs/ai/tools/developer-agent/README.md` for the release procedure.

<a href="https://developers.openai.com/plugins/build/plugins" target="_blank" rel="noopener noreferrer">Official Codex plugin setup and marketplace instructions</a>
