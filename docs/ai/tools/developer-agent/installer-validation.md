# Skill installer validation

## Task contract

Continuation of PR #321, approved on 2026-10-12. Base: `dd6757567` on
`origin/main`; one writer in `codex/skill-installers`.
Unify active public identifiers and paths as `asyra-skill`. Make default Vercel
Skills repository discovery expose only that Skill, so users can run
`npx skills add karote00/asyra`. Preserve contributor Skills using the installer's
supported internal metadata. Preserve historical release evidence verbatim.

Scope: plugin source/registries/generator; discovery metadata of the ten existing
Claude contributor Skills; direct bundle/naming/CI tests and CI path ownership;
installation README/public guide/site links and generated content; this task's
evidence and maintenance docs. No Framework/App runtime, global installations,
account changes, release publication, model trials or new root dependencies.
Explicitly document the one-time identity transition without retaining aliases.

Real published CLIs must prove single-Skill root discovery, installation,
changed-source updates, all bundled resources and unrelated consumer-file
preservation. Before merge, distinguish public baseline trials from candidate
Git-source trials; a local Git URL rewrite is not a live GitHub release.
Keep all test homes, caches and sources inside this worktree; never replace
HOME or CODEX_HOME. Ordinary tests remain offline; real installer tests opt in.

Required gates: naming before/after identifiers; test-first discovery regression;
real installer trials; bundle integrity/offline links; public generators;
resolved shared/site/production CI checks; Changeset and bounded diff review.
Stop unsupported routes rather than documenting success. Validate the exact
version before updating the existing English PR. Do not publish or merge.

## Previous installer evidence (before the identity rename)

The following observations concern the historical `asyra-agent` identity.
Current rename/discovery evidence is recorded separately below.

## Results

Tested on 2026-10-12 with the published `skills@1.7.2` and
`openskills@1.5.0` CLIs, macOS arm64 and Node.js 24.13.0. Public GitHub `main` was
`dd6757567fcda182c68370569e54f3a6cb7add3c` before and after the public trials.

| Check                                  | Vercel Skills                                   | OpenSkills                                                         |
| -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| Public GitHub installation             | 0.1.11, passed                                  | 0.1.11, passed                                                     |
| Public unchanged-source update         | Passed                                          | Passed                                                             |
| Controlled Git source update           | 0.1.11 to 0.1.12, passed                        | 0.1.11 to 0.1.12, passed                                           |
| Complete Skill files and offline links | All 19 references, passed                       | All 19 references, passed                                          |
| Existing consumer data                 | Preserved                                       | Preserved                                                          |
| Tool-specific loading path             | Claude Code symlink resolves to canonical Skill | `read` succeeds; `sync` preserves existing prose and is idempotent |

The complete bundle suite passed 24 tests with the live installer gate enabled.
Public baseline digest:
`bcb08aa797c68583ae84f903e4db3fb9b19bb324d763d3979b6a603aca1d460e`.
Candidate digest:
`ecdde3c058b464af713efecf32c95007a2bafc391466a9cea0176fe6799f956a`.
The test compares installed files with the archived reviewed commit and then
with the generated candidate, rather than trusting CLI success messages.

No new public version was pushed to simulate an update. The changed-source
trial uses a real local Git repository and the unmodified CLI update commands;
public network fetching is exercised separately. Native model loading and
product implementation quality were not retested. A project-files installer
does not grant access to Claude Desktop's cloud Skill settings.

## Reproduce

From a fresh task worktree, install the already declared repository dependencies,
then prepare the explicitly approved third-party test tools inside the project:

```sh
npm --cache ./tmp/npm-cache install --prefix ./tmp/skill-installers/tools --no-audit --no-fund --ignore-scripts skills@1.7.2 openskills@1.5.0
```

Generate/check the candidate through the normal public-doc and bundle workflow.
Select the full reviewed pre-rename public `main` SHA as `INSTALLER_BASE_REF`.
The historical public check expects the old installation identity; the controlled
update uses a synthetic older-version fixture with the new identity. The trial fails if public `main` changes
during execution, or if the README/public guide commands drift from the tested
arguments. Run:

```sh
RUN_SKILL_INSTALLER_TESTS=1 INSTALLER_BASE_REF=dd6757567fcda182c68370569e54f3a6cb7add3c node --test scripts/__tests__/developer-agent-bundle.test.mjs
```

The test prints `tmp/developer-agent-tests/installers-*/report.json`; sibling
logs retain each real command's output. Standard tests skip this opt-in network
gate. After main changes, deliberately refresh the public baseline route and assertion
before repeating the public check. Do not rewrite historical evidence.

The permanent test embeds its home/temp isolation fixture and preloads it into
the real Node CLIs and their children. `os.homedir()` and `os.tmpdir()` resolve
inside the test directory, with project-local XDG state and temporary paths;
HOME and CODEX_HOME are not reassigned. This keeps installer-owned state and
Git clones out of the maintainer's installed plugins and personal skills.
Only installer-owned `.openskills.json` is omitted from the copied hash-inspection
snapshot; the actual installed folder retains its source metadata for updating.

The installer package versions are pinned for reproducibility. Their upstream
documentation is linked from the public installation guide. Updating those
pins requires repeating this gate; file integrity does not certify arbitrary
future installer versions or native host discovery.

## Rename and repository discovery results

The current 0.1.12 candidate uses `asyra-skill` for both plugin manifests,
marketplace entries, Skill frontmatter, source/export paths and invocation.
Previous evidence above remains a historical record of the old identity.

- Test-first metadata/identity regression failed on the original contributor
  Skills, then passed after the supported `metadata.internal: true` annotations.
- Skills 1.7.2 default `add karote00/asyra --list` found exactly one Skill,
  `asyra-skill`, with all ten actual contributor Skills present in the source.
- The unmodified CLI installed from `add karote00/asyra`; noninteractive tests
  append `--agent codex claude-code --yes` to answer tool/scope prompts.
- OpenSkills 1.5.0 installed from the exact new public Skill subdirectory.
- Both tools updated a synthetic 0.1.11 fixture using the new identity to the
  reviewed 0.1.12 candidate. Every Skill file, 19 references and offline links
  matched; unrelated consumer data remained intact. Claude Code's link resolved
  to the installed Skill. OpenSkills read and repeated sync passed and preserved
  existing AGENTS.md prose.
- The separate live GitHub baseline installation and no-change update still
  passed for the actual released 0.1.11 old identity.

Candidate source transport was redirected with process-local Git `insteadOf`
configuration to repository-local fixtures. This tests the real shorthand parser,
marketplace discovery, installers and update commands without publishing a
candidate. It does not establish availability on public `main` before merge or
exercise native model loading. No global installation or host settings changed.
The Vercel source fixture contains the marketplace and contributor catalog; the
OpenSkills exact-subdirectory route does not rely on internal metadata support.

The live installer gate passed all 25 bundle tests. Candidate bundle digest:
`6730b8707cf4fbdb4fa339c618a2f0e75f02514e24f15dd9fdbba453dd114efb`.
Local report: `tmp/developer-agent-tests/installers-cLZMEg/report.json`.
The two source fixtures deliberately change both bundle version and reference
bytes, so an updater that merely exits successfully cannot pass.
