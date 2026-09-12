# Controlled pilot review script

Preparation for M6, not independent acceptance. Record the candidate's
`BUILD.json` source commit and archive checksum before testing. A maintainer
running this script does not count as either independent pilot user.

## Preparation and launch

Use an extracted, unmodified candidate, existing Node 24.x and Chrome. Keep a
copy of the archive and original portable projects. In Terminal at the extracted
folder run `node --version`, `node verify-files.mjs`, then `node server.mjs`.
Open `http://127.0.0.1:3020`. Leave Terminal running. Record OS, hardware/RAM,
Chrome and Node versions. Disable external connectivity after obtaining the
folder; loopback must remain available. No account or package install is needed.

Success: verification completes, the page shows **Local runtime ready**, and the
synthetic workcell is visible. Failure: checksum error, blank page, network
requirement, unsupported runtime, or port conflict. Preserve the exact message.
Do not repair the package or silently choose another port during acceptance.

## First user - supplied workcell

Follow [Your first experiment](LOCAL_CANDIDATE.md#your-first-experiment) without
private instructions: inspect scope/units, run A, duplicate/edit/run B and C,
compare, export a report and portable project, import the backup and compare
again. Use Setup, Preview and Results and explain their different meanings.
Use a finding example from the Experiment selector to inspect a pair and replay
its frozen evidence. Return to current preview and change a completed input;
old evidence must keep its declarations and be identified as historical.

Success: three distinct candidate runs, visible comparison differences, unchanged
run declarations after reopen, empty new-lifetime Undo and no unexplained error.
Record each action, expected/actual result, interruptions and elapsed time.
Screenshots should show the relevant panel and labels, not just the viewport.

## Second user - independently mapped input

Use synthetic or de-identified geometry and trajectory. In **Projects**, create
an independent project/copy before editing. In **Experiments → Setup**, load CSV
through the trajectory import section, explicitly map time and each joint unit,
review first/middle/last converted values and click **Import trajectory**.
Alternatively follow the versioned JSON format in the workcell specification.
Document the data convention and assumptions; do not guess vendor units.

Change the intended scope and clearance rule, complete edits, then repeat
analysis, A/B/C comparison, report export and portable reopen. Unsupported
topology or invalid mappings must block analysis with actionable diagnostics,
not run the previous valid input. No live equipment connection is part of this
script. At least one pilot user must have equipment/workcell experience.

## Failure and recovery review

Use disposable synthetic copies and preserve original backups.

1. Start analysis, wait for progress, click **Cancel analysis**, then **View
   results**. Cancellation/partial coverage must not be presented as complete
   clearance. Record responsiveness and the resulting status.
2. Edit an input after a retained run. Inspect Results/history: original evidence
   remains available and is distinguished from current inputs.
3. In **Projects**, choose malformed project JSON. Preview must reject it while
   the current project remains usable. A portable file with missing/corrupt
   assets must likewise reject replacement. Never manually repair production data.
4. Missing private methods permit historical reading, but rerun must explain
   the missing method. Use the coordinator's synthetic missing-method fixture;
   do not install unknown code from a project file.
5. For naturally occurring storage failure, preserve the message, export a
   portable backup, and use the offered retry only after the storage condition
   is addressed. Saved is valid only after acknowledgement. A post-retirement
   failure requires the offered recovery download before restart. Maintainers
   exercise forced failures through formal tests; users need not modify browser
   internals to simulate them.

Failure includes hidden missing evidence, false Saved, lost current data after
rejected import, success after incomplete execution, or needing developer repair.
Record a failed attempt as failed; correct the product/docs and repeat the
affected journey before accepting it.

## Understanding and completion

Ask users to explain in their own words: full supplied geometry still depends on
model validity; historical proxy results keep their original limitations;
unresolved is not clear; no issue found is not site safety approval; preview is
not formal analysis; official provenance is not independent certification.

M6 requires two non-developer users and the separate FIRST_RELEASE G7 review.
Record observer assistance explicitly. Code changes, manual data repair or
privately supplied missing critical instructions invalidate that attempt.
Do not send outreach or files on behalf of users without authorization.

## Diagnostic sharing preview

This is a manual preview template, not an upload feature. Prepare text locally
and inspect every field before giving it to the agreed coordinator:

```text
Candidate source commit / archive SHA-256:
OS / hardware model / RAM / Chrome / Node:
Workflow step and exact control:
Expected behavior:
Actual behavior and exact visible error:
Execution / coverage / verdict (if relevant):
Synthetic reproduction steps:
Attachments I explicitly chose to include:
Redactions I checked:
```

By default exclude projects, geometry, trajectories, field attachments, browser
storage, console dumps, credentials, private filesystem paths and company/customer
names. Screenshots and project/report exports can reveal those details. Prefer
a newly created synthetic reproduction. A checksum identifies bytes; it does
not anonymize the accompanying file. Share only the reviewed selection. There
is no automatic transmission or implied permission to collect confidential data.

Finish by exporting backups and stopping the launcher with Ctrl+C. Verify that
its port is released. Changing origin or clearing site data does not migrate
saved projects.
