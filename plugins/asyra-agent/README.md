# Asyra Skill

Asyra Skill gives your existing coding agent Asyra-specific architecture,
implementation procedures and offline references. Describe the product you want;
the host agent uses this knowledge to plan, implement and verify it with its own
model and permissions. Plugins are installation wrappers around the same Skill.
No hosted AI service, independent execution engine or API key is included.

The display name is **Asyra Skill**. The installation identifier remains
`asyra-agent`, including commands, paths and marketplace entries. Existing
Asyra Agent installations do not require an identity migration.

## Release status and support

**0.1.8 is an unpublished local candidate.** These instructions describe its
source. The merged 0.1.7 is the portable baseline; a GitHub source on `main` may
contain a different version from a release archive or this candidate. Verify
`pluginVersion` after installing. Publication is a separate action.

| Surface                                 | Delivery                              | What is established                                                                             |
| --------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Codex desktop and CLI                   | Plugin or standalone Skill            | Existing installation routes; fresh 0.1.8 loading and product trials pending                    |
| Claude Code                             | Plugin or standalone Skill            | Shared packaging; fresh native trials pending                                                   |
| Claude Desktop                          | Skill ZIP upload                      | Local 0.1.7 upload and reference loading observed; no complete product trial                    |
| Grok Build CLI                          | Standalone Skill or compatible plugin | Local 0.1.7 plugin and reference loading observed; product trials pending, free quota exhausted |
| General Grok chat, Cowork, API sessions | Host-specific capabilities            | Not validated here                                                                              |
| Cursor and Antigravity                  | Future adapter if needed              | Phase two                                                                                       |

File validation proves packaging. Actual loading proves reference access. Only
an observed product creation, fresh-conversation extension and executed checks
establish that complete development workflow for the tested host/configuration.
See `docs/ai/tools/developer-agent/support-evidence.md` in the source checkout
for versioned support evidence.
Automatic installation from the name alone has not been verified.

## Public GitHub source and local candidates

External users can obtain the source from
<a href="https://github.com/karote00/asyra" target="_blank" rel="noopener noreferrer">karote00/asyra</a>.
No maintainer worktree is required. Use a reviewed release ref when available;
`main` follows merged development. Inspect its plugin version rather than
assuming the newest GitHub Release and `main` are identical. A source checkout
contains the complete Skill at `plugins/asyra-agent/skills/asyra-agent`.

For testing unpublished 0.1.8, use the local candidate checkout in the routes
below. Do not describe that private local path as a public installation source.

## Start with the same Skill everywhere

From the chosen source checkout, copy the **entire**
`plugins/asyra-agent/skills/asyra-agent` folder to one of these locations:

| Host        | Project installation                    | Personal installation           |
| ----------- | --------------------------------------- | ------------------------------- |
| Codex       | `<product>/.agents/skills/asyra-agent/` | `~/.agents/skills/asyra-agent/` |
| Claude Code | `<product>/.claude/skills/asyra-agent/` | `~/.claude/skills/asyra-agent/` |
| Grok Build  | `<product>/.grok/skills/asyra-agent/`   | `~/.grok/skills/asyra-agent/`   |

Keep `SKILL.md`, `bundle.json` and `references/` together. Copying only SKILL.md
loses the development guides. Choose one installation route per host to avoid
an old standalone copy shadowing a plugin. Installation is an explicit user
operation; do not overwrite an existing folder without reviewing it first.

Start a new session in your product folder. Select the Skill from the host's
catalog, use `$asyra-agent` in Codex, or `/asyra-agent` for a standalone Claude
Code/Grok Build Skill. Verify the actual bundle with the prompt below.
Grok Build also documents Claude Code and personal `.agents/skills` discovery;
if you already use one of those routes, avoid making another copy.

Maintainers can export the exact same Skill into a new project-relative folder:

```sh
node scripts/developer-agent-bundle.mjs --export-skill dist/asyra-agent
```

This requires only Node.js and a current checked bundle. It refuses an existing
destination, traversal or symlinks; it does not install anything or alter host
settings. The export can be distributed as a folder or zipped with
`asyra-agent/` at its root. Future release artifacts must be generated from the
same reviewed source as the plugin package, never edited separately.

## Codex plugin

### Desktop - no terminal required

1. Open **Plugins > Add > Add a marketplace**.
2. For this unpublished candidate, use the absolute path of its checkout as
   **Source**. Git ref and sparse paths do not apply to a local source.
3. Add the marketplace, select **Asyra**, find **Asyra Skill**, and install it.
   Adding the marketplace alone does not install the plugin.
4. Start a fresh conversation in your product folder and verify the bundle.

For the public GitHub source, enter `karote00/asyra`; use a reviewed Git ref
and leave sparse paths empty. A pinned ref does not
advance when you refresh the marketplace. Inspect an existing `asyra` source
before adding another; do not assume it is replaced automatically.

### CLI

For the merged public source, with a CLI supporting these commands:

```sh
codex plugin marketplace add karote00/asyra --ref main
codex plugin add asyra-agent@asyra
```

For an unpublished local candidate, run from its checkout instead:

```sh
codex plugin marketplace add .
codex plugin add asyra-agent@asyra
```

The syntax was checked with Codex CLI 0.160.0. Use `codex --version` and
`codex plugin add --help` to check your CLI. A desktop update does not establish
the version of a separately installed CLI. Then start `codex` in the intended
product folder and invoke `$asyra-agent` in a fresh conversation.

## Claude Code plugin

Use a Claude Code version supporting plugins. In a Claude Code session, add
the candidate checkout by its absolute path, then select and install the plugin:

```text
/plugin marketplace add /absolute/path/to/asyra-checkout
/plugin install asyra-agent@asyra
```

Choose the intended installation scope in the plugin panel. Follow the client's
reload instructions, or start a fresh session. Invoke
`/asyra-agent:asyra-agent`, then verify the bundle below. The namespace comes
from the plugin name followed by the Skill name.

For the merged public source, the marketplace can also be added with
`/plugin marketplace add karote00/asyra`. That tracks the
repository's selected source; it is not a promise of a pinned release version.
The `.claude-plugin/marketplace.json` catalog points to the same plugin folder
used by Codex, and both generated manifests use one release identity.

## Claude Desktop Skill upload

The observed local 0.1.7 route was **Customize > Skills > Add skill > Upload
skill**. Export the complete Skill using the command above and ZIP it with
`asyra-agent/SKILL.md`, `asyra-agent/bundle.json` and `asyra-agent/references/`
under the same root. Upload and enable that Skill, then start a new conversation.
Use a standalone Skill archive when one is provided by a reviewed release;
a full plugin/source archive is a different artifact.

This trial established uploaded reference access in Claude Desktop, not local
repository editing, arbitrary command execution or GitHub self-installation.
Check the capabilities available in the actual session before requesting product
implementation. Account/client capabilities may differ; do not purchase access
merely to satisfy a packaging check.

## Grok Build

The standalone Skill installation above is the direct path. For a session-only
plugin trial, Grok Build also documents this launch flag:

```sh
grok --plugin-dir /absolute/path/to/asyra-checkout/plugins/asyra-agent
```

Open `/skills` or `/plugins` to inspect the discovered extension, select the
Asyra Skill, and verify it. A session-only plugin path is not a persistent
installation. Grok documents compatibility with Claude Code plugins and
marketplaces, so no separate Grok instruction fork or manifest is maintained.
Do not assume these instructions apply to the general grok.com chat interface.

## Verify and use

In a new session, ask:

```text
Load the installed Asyra Skill. Read bundle.json beside that exact
SKILL.md. Report both full paths, pluginVersion, and whether the bundled
references/apps/starter-app/docs/ARCHITECTURE.md exists. Use only the installed
Skill files, not the Asyra development checkout. Do not modify files.
```

Expect **0.1.8** for this candidate. `pluginVersion` remains the compatibility
field for the shared Skill version even in standalone installations. The record
also contains the full plugin distribution inventory; entries outside the Skill
subtree do not need to exist beside a standalone Skill. Its hashes detect drift,
not authenticity. The host's listing version alone does not prove what loaded.

Then describe your actual product, for example:

```text
Use Asyra to build a personal expense tracker in my chosen project folder.
Include monthly filters, exact totals, Undo/Redo and browser storage.
```

For an existing product:

```text
Use Asyra to add tags and combined filters to this app. Preserve existing
data and history, and test the affected behavior.
```

Ordinary product requests do not need technical installation prompts. Specify
the destination for a new project. Review and test the generated product.

## Continue developing the same product

The delivered product keeps its own `AGENTS.md`, architecture guide and real
validation commands. In a fresh conversation, open that product and describe the
next change. If the host does not discover its instructions, ask it to read
`AGENTS.md` first. Installing a Skill does not grant filesystem access or guarantee
automatic discovery in every tool. Avoid multiple stale instruction copies.

The Skill guides Asyra ownership, subscriptions, history and persistence. The
host agent still owns product implementation, general UI quality and testing.
Review what was actually built and tested; do not treat documentation access as
a correctness certificate. Technical version probes above are acceptance tools,
not the everyday way to ask for product work.

## Updates and replacement

- Standalone Skill: obtain the intended reviewed version, replace the complete
  installed Skill folder deliberately, and verify in a new session. Preserve
  local customizations separately; do not merge old and new reference files.
  There is no standalone background updater.
- Codex plugin: inspect `codex plugin marketplace list`, refresh the intended
  source with `codex plugin marketplace upgrade asyra`, and use the plugin UI
  to reinstall when necessary. Refreshing a pinned ref does not change it.
- Claude Code plugin: use `/plugin` to manage marketplace updates and installed
  plugins. Follow the host's reload/update result and verify the loaded bundle.
- Grok Build: update the selected Skill/plugin source; a `--plugin-dir` session
  reads that source. Restart the session and verify. Do not infer an automatic
  update schedule from format compatibility.

For 0.1.5 **Asyra Developer** users, uninstall that old identity and install
**Asyra Skill**. Product files and saved data do not need migration. Skill
updates do not update product dependencies. Reference package versions identify
the guide snapshot, not universal API compatibility. Do not edit plugin caches
or bundled references to conceal a stale installation.

## Maintainers and sources

`bundle.config.json` owns shared identity and Codex presentation metadata.
`skills/asyra-agent/SKILL.md` owns the host-neutral development instructions.
Generated references and both host manifests are never edited directly.

```sh
node scripts/developer-agent-bundle.mjs --write
node scripts/developer-agent-bundle.mjs --check
node --test scripts/__tests__/developer-agent-bundle.test.mjs
```

See `docs/ai/tools/developer-agent/README.md` in the source checkout for release
checks and native product acceptance. Publishing remains a separate action.

- <a href="https://learn.chatgpt.com/docs/developer-commands" target="_blank" rel="noopener noreferrer">Codex plugin and marketplace commands</a>
- <a href="https://agentskills.io/specification" target="_blank" rel="noopener noreferrer">Agent Skills specification</a>
- <a href="https://learn.chatgpt.com/docs/build-skills" target="_blank" rel="noopener noreferrer">Codex Skill discovery</a>
- <a href="https://code.claude.com/docs/en/skills" target="_blank" rel="noopener noreferrer">Claude Code Skills</a>
- <a href="https://code.claude.com/docs/en/plugins/install" target="_blank" rel="noopener noreferrer">Claude Code plugin installation</a>
- <a href="https://docs.x.ai/build/features/skills-plugins-marketplaces" target="_blank" rel="noopener noreferrer">Grok Build Skills and plugin compatibility</a>
