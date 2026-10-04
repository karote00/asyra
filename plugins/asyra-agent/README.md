# Asyra Agent for Codex

Describe the product you want to build. Asyra Agent helps Codex choose an
Asyra starting point, apply the maintained Starter architecture, implement changes
and verify behavior. It bundles one Skill and offline guides for canonical data,
Features, UI subscriptions, transactions, persistence and lifecycle ownership.
Use your existing Codex account and project permissions. No Asyra-hosted AI
service, API key or additional model subscription is supplied by this plugin.

## Release status

Version 0.1.6 prepares the unified **Asyra Agent** name and `asyra-agent`
Plugin/Skill identity. The previous 0.1.5 GitHub release used Asyra Developer.
This rename is not yet published. Official directory submission remains deferred.

## Install and start in Codex desktop

From a checkout containing this version, register its marketplace using the local
command below, then select **Asyra Agent** in the desktop Plugins browser.
Open or select your intended product folder and start a new conversation.
For a new project, specify the complete destination path in your request.

> Use Asyra Agent to build an expense tracker in my chosen project folder.
> Include monthly filters, exact totals, Undo/Redo and browser storage.

For an existing product:

> Use Asyra Agent to add tags and combined filters to this App. Preserve
> existing data and history, and test the affected behavior.

You can describe the product in ordinary language. Technical diagnostic prompts
are needed only when verifying installation or investigating a problem. Project
instructions and your requested scope remain authoritative. The model owns
implementation choices and review; inspect and test generated products.

## Local testing before publication

From a checkout containing this candidate, a maintainer can register the source:

```sh
codex plugin marketplace add .
```

Then use the desktop plugin browser, select the **Asyra** marketplace and install
**asyra-agent**. Installation writes Codex-managed files and is a user action.
In Codex CLI, explicitly invoke `$asyra-agent`. A Git marketplace is another
distribution source; it is separate from the public directory. This candidate has
not been assigned a public release ref.

## Replace the previous installation

Version 0.1.5 was published with Plugin/Skill identity `asyra-developer` and
label **Asyra Developer**. Version 0.1.6 uses `asyra-agent` and **Asyra Agent**.
This is a different plugin identity, not an automatic update of the old entry.
Uninstall **Asyra Developer** in the desktop Plugins page, select a marketplace
source containing this version, and install **Asyra Agent**. Start a fresh
conversation and verify version 0.1.6 with the prompt below. Product files and
saved data require no migration. Do not manually edit the installed cache.

## Verify and update

The plugin version and your product's package versions are independent. Updating
the plugin does not update your product dependencies. Bundled package versions
identify the reference snapshot, not universal API compatibility.

After installing or updating, start a new conversation and ask:

> Load the installed Asyra Agent Skill. Read bundle.json beside that exact
> SKILL.md and report both full paths and pluginVersion. Do not read an Asyra
> development checkout or change any files.

The result for this candidate must report **0.1.6**. A version displayed on the
plugin page alone does not establish which Skill an existing conversation loaded.
If a fresh conversation still loads an old local copy, use the desktop plugin
page to uninstall and reinstall from the updated source, then verify again. This
worked during our local trials without restarting; it is not a guarantee for
every client version. Restart the client if source refresh is still not visible.

For a configured Git marketplace, maintainers can explicitly refresh it:

```sh
codex plugin marketplace list
codex plugin marketplace upgrade asyra
```

A pinned Git ref remains pinned. Public directory package updates are released by
uploading a new ZIP and completing the applicable review/publication process.
The plugin itself has no background updater, and no promise is made about host
automatic-update timing. Verify the installed bundle after any update.

For local rollback, select a checkout of the prior reviewed version as the
marketplace source and reinstall; verify its actual bundle identity in a new
conversation. Avoid installing a duplicate standalone Skill of the same name.

## Maintainers

Edit canonical guides first, then regenerate and validate:

```sh
node scripts/developer-agent-bundle.mjs --write
node scripts/developer-agent-bundle.mjs --check
node --test scripts/__tests__/developer-agent-bundle.test.mjs
```

Retain the previous bundle identity and use `--check --baseline <path>` for release
comparison. See `docs/ai/tools/developer-agent/README.md` in the source repository
for maintenance and `first-release.md` in that directory for this candidate's
evidence and remaining submission steps. The plugin includes no MCP server,
credentials, telemetry service or in-app AI runtime. Host data handling and
project permissions still apply.

<a href="https://developers.openai.com/plugins/deploy/submission" target="_blank" rel="noopener noreferrer">Official plugin submission and update process</a>

<a href="https://developers.openai.com/plugins/build/plugins" target="_blank" rel="noopener noreferrer">Official plugin packaging and marketplaces</a>
