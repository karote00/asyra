# Candidate limitations and update notes

Status: internal candidate for development/review. Not R0 Public Alpha or an
independently accepted pilot release. M5 stage closeout does not waive the
remaining FIRST_RELEASE gates. M6 independent acceptance is still open.

## Identify the files you are reviewing

Use the candidate's `BUILD.json` for its exact source commit and App/tool
versions, and preserve the original archive checksum. The current App version
is `0.1.0-alpha.0`; that version label alone cannot distinguish development
candidates. Run `node verify-files.mjs` in the extracted directory before launch.
Never replace files in an existing candidate to represent an update.

This delivery adds the self-contained missing-method recovery project and
instructions in [PILOT_REVIEW.md](PILOT_REVIEW.md#missing-method-recovery-exercise).
The same fixture is included with the optional SDK. It is intentionally synthetic
and models an unavailable method; it does not establish a private method's
correctness or supply either required independent pilot's acceptance.

## Known limits that still block release

- The full representative workload (39 bodies, 30 fixtures, 200 keyframes,
  40,388 triangles and 298 pairs) exhausted the original-triangle logical work
  budget in the M5 development measurement. All 298 pairs remained unresolved
  after about 1.4 seconds. That is a failed useful-capacity gate, not clearance
  evidence. This delivery does not change the solver, precision or budgets and
  does not claim that failure is corrected. The default small example passing
  does not establish this larger capacity.
- Mac mini M1 / 8 GB reference-hardware evidence is absent. Existing M3 Max /
  48 GiB developer results and SwiftShader screenshots do not substitute for it.
  Windows, Linux, other browsers and mobile platforms remain unverified.
- Independent numerical review, two non-developer pilots, and an approved
  maintenance owner/reporting policy remain outstanding. See
  [FIRST_RELEASE.md](FIRST_RELEASE.md) and the
  [maintenance proposal](MAINTENANCE_PROPOSAL.md). Do not invent a support address
  or submit confidential data to public issues.
- Historical results retain their original method, geometry and limits.
  Missing methods may be read but cannot rerun. Preview is sampled feedback;
  partial, unknown or cancelled never means clear. Model validity and on-site
  safety are separate from software execution.

The current browser origin owns its IndexedDB data. Neither file checksums nor
browser-local saving replace a portable backup. There is no account, automatic
upload, cloud backup, automatic updater or equipment-control path.

## Review an update without losing the prior state

1. In the running prior candidate, open **Projects**, wait for the save
   acknowledgement and select **Export project**. Keep this pre-update portable
   file separately from its original archive, checksum and `BUILD.json`. Also
   export important retained run reports from **Runs & compare**. Preserve the
   previous build you actually validated for your own workflow.
2. Stop its Terminal launcher with Ctrl+C. Extract the new candidate into a
   different directory, verify its files, and read its notes before starting
   `node server.mjs`. Use the same loopback address and port for a normal update;
   do not run both launchers on that port or edit the package to bypass errors.
3. Reload the App in Chrome. In **Projects**, inspect the existing project and
   load diagnostics. If testing portable recovery, choose a copy of the backup,
   inspect the preview, then **Import and replace current project** and confirm.
   Do not repair the JSON or clear site data to make an import appear successful.
4. In **Runs & compare**, verify the original run identities, method declarations,
   execution and coverage against the saved report. Confirm the expected scene,
   sources and authored inputs. Imported documents begin with empty Undo history;
   a changed run, missing evidence, hidden repair or false Saved fails the review.
5. Before considering a rollback, stop the new launcher and preserve any new
   portable data separately. An older candidate is not guaranteed to read a
   newer database or format. Use the pre-update backup with the prior candidate
   in a separate Chrome profile so the newer profile remains intact. Use only
   that version's documented import support; stop on an unsupported format.

Passing an update rehearsal is not approval to distribute or publish. Report
issues only through the agreed coordinator/channel, after checking the
[diagnostic sharing preview](PILOT_REVIEW.md#diagnostic-sharing-preview).
