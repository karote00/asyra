# Subsequent Text update verification

Task 4 of `docs/ai/framework/plans/app-cli-update-and-migration-plan.md`.
Status: complete within the modeled local-candidate scope. The first independent
acceptance satisfied Task 4's fresh-AI requirement. The revision-2 existing-context
rerun and permanent fixture checks confirm subsequent revisions and integration;
they neither replace that result nor create a pending independent acceptance.
No additional independent run is required to complete Task 4.

This is a separate permanent fixture. The first fixture and its initial
independent acceptance remain unchanged. No publication was performed.

## Exact inputs and independent result

The fresh chat `Text subsequent update independent acceptance`
(`01a1699d-b07e-7312-986c-86678a5e5e8d`) started from consumer commit
`39bda3cfcd89e5dfd9b0bd4dc4b084e867d83359`. It was created, not forked.
It received the current consumer, README adoption record, the revision-1 guide
under `updates/`, candidate archives and linked public sources, and the exact
request retained in `evidence/request.md`. It received no first-run chat,
maintainer plan, suggested patch or follow-up technical hints.

`evidence/independent-session.json` retains the exposed command/source-access
records for its first completed turn. Later user-directed turns are recorded
separately below; they do not change that first independent result. All 15 exposed shell commands used the
isolated consumer directory; the recorded web request opens the guide's pinned
Text source. The audit found no access to the parent repository or another chat.
The README's source-reachability statement is the consumer's report, not an
independent audit of every external URL. Installed declarations and exact target
archive contents were inspected. The coordinator did not message the chat after
dispatch. Its six-file diff is retained as `evidence/integration.patch`.

| Gate | Independent result | Retained replay |
| --- | --- | --- |
| Before update | 22 tests passed | Same prepared baseline |
| New expectations on old artifact | 2 failed, 27 passed: expected 0.5, actual 0 | Original fail log retained |
| After update | 29 tests passed | 29 passed on copied source |
| Typecheck / lint / build | Passed | Passed |
| Model archive and installed contents | Digests, exact delta and installed files checked | 3 artifact tests passed |

The first lint attempt failed on dynamic deletion in a newly added test. The
same AI corrected the test and passed the gates without extra guidance. The
failed lint and old-artifact logs are retained; they are not hidden retries of
independent acceptance. Existing jsdom render warnings and the large-chunk build
warning remain. Logs with `independent-` belong to that chat; `retained-` logs
belong to the coordinator's replay. `baseline-` logs describe prepared input.

## What the evidence proves

V1/V2/V3 identify custom Text, first adoption and subsequent adoption. They do
not replace App document versions. The supplied data covers older version-1
multiplier input, the unchanged version-2 representation used through first
adoption, and version-2 input after local enum widening and saved metadata edits.
The loader remains the single owner: line height becomes 24 once and stays 24
through two storage/fresh-runtime round trips. No format bump was needed.

The 29 tests preserve explicit spacing 0 and 1.5, all three custom field
read/write/projection/storage paths, the new reject Feature and approval history,
shared-gray defaults, Text-only controls, chart references, IDs and hierarchy.
New Text and chart typography inherit 0.5. Missing required fields, invalid
metadata and unsupported versions fail without mutating canonical or input data.
The official UI remains deferred in the updated adoption record. App source did
not change during the independent update; only package selection, tests, README
and the consumer update index changed.

This verifies the particular modeled next candidate. It does not establish a
published release-to-release delta, arbitrary skipped releases, renamed/removed
fields, browser pixels, production storage or restoration of old undo history.
The Task 3 browser evidence still belongs to its previous candidate. The website
browser gate only proves guide discovery/navigation and source-link rendering.

## Reproduce

Run from the repository worktree. Use Node 24 and the already-declared Yarn
version/dependencies. Python's standard library prepares the modeled artifact.

```sh
python3 fixtures/app-update-text-subsequent/tools/test-handoff.py
mkdir -p fixtures/app-update-text-subsequent/artifacts
tar -xzf fixtures/app-update-text-subsequent/delivery/revision-2/text-spacing-r2-independent.tar.gz --strip-components=2 -C fixtures/app-update-text-subsequent/artifacts consumer/artifacts
yarn --cwd fixtures/app-update-text-subsequent install --immutable
python3 fixtures/app-update-text-subsequent/tools/test-artifacts.py
yarn --cwd fixtures/app-update-text-subsequent test
yarn --cwd fixtures/app-update-text-subsequent typecheck
yarn --cwd fixtures/app-update-text-subsequent lint
yarn --cwd fixtures/app-update-text-subsequent build
```

Revision 2 retains the exact pre-update delivery archive in Git, including all
19 base candidates and the derived target. The commands above verify the archive
before restoring its package inputs. Individual `artifacts/` and node_modules
remain ignored; third-party installation may require network access. Do not
substitute npm Preset 0.5.8 or accept an archive with different digests.
The original `tools/prepare-artifacts.py` remains an optional model-rebuild tool:
supply the verified base archives from a different directory, never its output
folder. It checks hashes and never edits Framework source. Its earlier repeat
build reproduced the retained target digest.

The target changes exactly three archive entries: one JS default (and its map
link), removal of that obsolete source map, and a private prerelease manifest.
All other entries, declarations and dependencies are byte-identical. The source
and target package identities are separate from App adoption/document versions.

To reconstruct the first revision-1 independent input, copy only the 31 paths
listed in `evidence/input-files.json` into a fresh project-local directory.
Initialize an isolated Git repository there. Reverse-apply
`evidence/revision-2/retained-records.patch` first, then the original
`evidence/integration.patch`. All 31 resulting input hashes were verified again.
The records patch reverses only the later README and update-index edits; all
new revision-2 files and maintainer evidence are excluded from this replay.
Supply verified package archives separately and reinstall the baseline.

If a future task explicitly requests a new revision-2 run, use the retained
delivery archive and its prompt instead. This is an optional replay path, not
remaining Task 4 work. It already contains the baseline consumer and its own
60-file checksum manifest. Do not provide the completed fixture or any
evidence/results directory.

The captured input guide remains unchanged, including pending-at-start status.
The public guide adds the observed outcome; its integration instructions are
unchanged. The captured migration-reference link is adjusted for the standalone
handoff. `evidence/replay-and-history.txt` also records all 59 snapshotted Task 3
files unchanged. Nothing in this record retroactively broadens the original
Task 3 acceptance or claims that its revision 3 was independently re-tested.

## Revision 2 retention - 2026-10-24

The same chat later clarified warning handling, required attachments and active
links, prepared a pre-update delivery, and reran adoption in an isolated copy.
That rerun had existing context and is not a fresh independent acceptance. The
original revision-1 input, patch, result logs and session record are unchanged.
Task 3's initial acceptance and browser records also remain unchanged.

| Evidence | Result and provenance |
| --- | --- |
| Revision 1 first independent acceptance | 22 baseline; 2 expected failures; 29 final tests; typecheck/lint/build passed |
| Revision 2 existing-context rerun | 22 baseline; 2 expected failures; 34 final tests; typecheck/lint/build passed |
| Current permanent fixture | Original 29 plus 12 rerun cases: 41 tests; typecheck/lint/build passed |
| Retained delivery checks | Four checks cover archive/input digests, exact baseline, active links and Git retention |

The rerun is retained under `evidence/revision-2/context-rerun/`: its unedited
README, logs and exit statuses. `documentation-follow-up/` and `packaging/`
retain the chat's preceding documentation and packaging records. Their source
paths and old relative links are historical evidence, not the current navigation
entry. The active entry is `updates/index.md`; its inventory links to the local
archive and current records. Archived packaging scripts are provenance only and
should not be run against this retained fixture.

`src/__tests__/revision-two-adoption.test.ts` is copied byte-for-byte from the
context rerun. It adds complete-document round trips, shared defaults, explicit
spacing, missing-field rejection and custom actions after reload. The original
29-test source is retained, hence 41 here rather than the rerun's 34. Retained
checks have their own `evidence/revision-2/retained-*` logs. Prior outputs were
not overwritten. Evidence `.log` files are explicitly exempted from the root
ignore rule so both first and later records are versioned.

The optional TypeScript patch warning appeared in the rerun's baseline install
but not its target install. It is explained, not fixed. Necessary adoption inputs
are present in the delivery; excluded historical records have not been recovered
inside that bundle. Active revision-2 references resolve, while original archived
attachments keep old links. Both limits are explicit in the new inventory.

The public guide is a navigation-adapted edition: supported Markdown links and
repository paths replace standalone links. The archive retains its exact
outcome-free independent handoff edition. Neither the public summary nor this
retention turns the existing-context rerun into an independent acceptance. No
new chat, publication, registry release, browser-pixel validation or production
storage migration was performed by this integration.
