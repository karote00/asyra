# Skill installer validation

## Task contract

Standalone installation/onboarding follow-up requested on 2026-10-12. Base:
`dd6757567` on `origin/main`. One writer in `codex/skill-installers`.
Validate OpenSkills and Vercel Skills public GitHub install/update with the real
published CLIs; compare every installed Skill resource with the expected bundle.
Also prove a changed-source update using a controlled Git source with the merged
bundle and this candidate, preserving unrelated consumer files and instructions.

Scope: the existing bundle test owner and its embedded installer-isolation fixture;
this evidence document and maintenance links; root README, plugin README/changelog/config and
generated bundle; the existing public AI guide, its generated site content and direct entry browser test;
an empty Changeset. No Framework/App runtime, global installations, account
changes, publication, host-model trials or new root dependencies. The existing
homepage links to the public guide and README, so no layout change is needed.

Use existing bundle identity/hashes as the integrity oracle. Preserve the
`asyra-agent` identity; the README/reference change advances 0.1.11 to 0.1.12.
The public network gate is opt-in and bounded, not an implicit network dependency
of ordinary repository tests. Keep CLI dependencies, temporary homes, clones,
logs and consumer fixtures under the worktree. Do not replace HOME or CODEX_HOME.

Required gates: naming before/after identifiers, actual installer trials,
byte/hash integrity and offline links after install/update, AGENTS.md preservation,
normal bundle regressions/freshness, public generators/validation, source lint,
resolved shared/site/production CI checks, changeset and bounded diff review.
Stop unsupported routes rather than documenting them as working; retain exact
installer versions, source revisions and limitations. Finish local gates before
pushing and creating an English PR. No remote CI result is assumed.

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
`5aa920b5d0655f4bb3cba5de70fb4e7ed781513cedcea3143383aa977742d5bd`.
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
Select the full reviewed public `main` SHA as `INSTALLER_BASE_REF`, with an older
bundle version than the candidate. The trial fails if public `main` changes
during execution, or if the README/public guide commands drift from the tested
arguments. Run:

```sh
RUN_SKILL_INSTALLER_TESTS=1 INSTALLER_BASE_REF=dd6757567fcda182c68370569e54f3a6cb7add3c node --test scripts/__tests__/developer-agent-bundle.test.mjs
```

The test prints `tmp/developer-agent-tests/installers-*/report.json`; sibling
logs retain each real command's output. Standard tests skip this opt-in network
gate. Re-running it after this candidate merges requires the next deliberately
versioned candidate; this is a release-transition proof, not a self-update from
a version to itself.

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
