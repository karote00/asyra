# Asyra Agent

One Agent Skill for building and extending Asyra products. The same instructions,
offline references and release version are used by Codex, Claude Code and Grok
Build. Plugins are installation adapters around that Skill, not separate agents.
Use your host's account, model and project permissions. No hosted AI service or
API key is included.

## Release status and supported surfaces

**0.1.7 is an unpublished candidate.** The 0.1.6 release remains unchanged.
Use a checkout of this candidate for the local instructions below. Do not expect
the 0.1.6 ZIP or Git tag to include these new adapters.

| Surface                                                  | Installation path                            | Evidence for this candidate                             |
| -------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| Codex desktop and CLI                                    | Existing Codex plugin or standalone Skill    | Packaging checked; fresh native candidate trial pending |
| Claude Code                                              | Claude plugin or standalone Skill            | Official format implemented; fresh native trial pending |
| Grok Build                                               | Standalone Skill or local plugin directory   | Official format implemented; fresh native trial pending |
| General Claude/Grok chat, Cowork and hosted API sessions | Separate host capabilities and account setup | Not validated by this candidate                         |
| Cursor and Antigravity                                   | Future adapters if needed                    | Phase two                                               |

Packaging and relocation tests establish file correctness, not a host's loading
behavior or the quality of generated products. Claude Code and Grok Build are
the coding surfaces targeted in phase one. Uploading files to a general chat is
not evidence of local project access or successful installation.

## Start with the same Skill everywhere

From a checkout containing this candidate, copy the **entire**
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
3. Add the marketplace, select **Asyra**, find **Asyra Agent**, and install it.
   Adding the marketplace alone does not install the plugin.
4. Start a fresh conversation in your product folder and verify the bundle.

After a version is published, the GitHub source is `karote00/asyra`; use that
release's exact Git ref and leave sparse paths empty. A pinned ref does not
advance when you refresh the marketplace. Inspect an existing `asyra` source
before adding another; do not assume it is replaced automatically.

### CLI

From the candidate checkout, with a CLI supporting these commands:

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

After these changes are merged into the public repository, the marketplace can
also be added with `/plugin marketplace add karote00/asyra`. That tracks the
repository's selected source; it is not a promise of a pinned release version.
The `.claude-plugin/marketplace.json` catalog points to the same plugin folder
used by Codex, and both generated manifests use one release identity.

## Grok Build

The standalone Skill installation above is the direct path. For a session-only
plugin trial, Grok Build also documents this launch flag:

```sh
grok --plugin-dir /absolute/path/to/asyra-checkout/plugins/asyra-agent
```

Open `/skills` or `/plugins` to inspect the discovered extension, select the
Asyra Agent Skill, and verify it. A session-only plugin path is not a persistent
installation. Grok documents compatibility with Claude Code plugins and
marketplaces, so no separate Grok instruction fork or manifest is maintained.
Do not assume these instructions apply to the general grok.com chat interface.

## Verify and use

In a new session, ask:

```text
Load the installed Asyra Agent Skill. Read bundle.json beside that exact
SKILL.md. Report both full paths, pluginVersion, and whether the bundled
references/apps/starter-app/docs/ARCHITECTURE.md exists. Use only the installed
Skill files, not the Asyra development checkout. Do not modify files.
```

Expect **0.1.7** for this candidate. `pluginVersion` remains the compatibility
field for the shared Agent version even in standalone installations. The record
also contains the full plugin distribution inventory; entries outside the Skill
subtree do not need to exist beside a standalone Skill. Its hashes detect drift,
not authenticity. The host's listing version alone does not prove what loaded.

Then describe your actual product, for example:

```text
Use Asyra Agent to build a personal expense tracker in my chosen project folder.
Include monthly filters, exact totals, Undo/Redo and browser storage.
```

For an existing product:

```text
Use Asyra Agent to add tags and combined filters to this app. Preserve existing
data and history, and test the affected behavior.
```

Ordinary product requests do not need technical installation prompts. Specify
the destination for a new project. Review and test the generated product.

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
**Asyra Agent**. Product files and saved data do not need migration. Agent
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

- <a href="https://agentskills.io/specification" target="_blank" rel="noopener noreferrer">Agent Skills specification</a>
- <a href="https://learn.chatgpt.com/docs/build-skills" target="_blank" rel="noopener noreferrer">Codex Skill discovery</a>
- <a href="https://code.claude.com/docs/en/skills" target="_blank" rel="noopener noreferrer">Claude Code Skills</a>
- <a href="https://code.claude.com/docs/en/plugins/install" target="_blank" rel="noopener noreferrer">Claude Code plugin installation</a>
- <a href="https://docs.x.ai/build/features/skills-plugins-marketplaces" target="_blank" rel="noopener noreferrer">Grok Build Skills and plugin compatibility</a>
