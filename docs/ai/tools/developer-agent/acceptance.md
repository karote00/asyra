# Developer Agent acceptance scenarios

These are permanent manual product trials for the installed candidate. They are
not packaging assertions or evidence that a model has already complied. Run in
fresh Codex conversations with the candidate version confirmed from the actual
loaded Skill's `bundle.json`. Keep each project inside the user's selected
workspace. Use an empty directory for the first trial; never overwrite a product.

## Trial setup (operator, outside the product prompt)

Use a fresh conversation and empty project for each creation trial. Confirm the
actually loaded Skill path and `bundle.json` version, not the plugin page label.
Record the model and reasoning setting actually selected, project location,
Starter source/CLI version and installed package versions. Keep the model and
settings fixed when comparing bundles; do not guess them from an actor label.
No terminal installation or installed-cache modification is required by this
protocol. Use the desktop installation route already accepted by the user.

The baseline is the retained 0.1.1 bundle; the candidate is 0.1.2. Both contain
identical Skill instructions. Their canonical references differ. A fresh trial
must receive its chosen bundle only, not prior answers or the review findings.
This round budgets one creation and one subsequent extension per configuration.
It is a small descriptive comparison, not a statistical or causal claim. Do not
run the older bundle in an existing user product. The scenarios are exposed
acceptance cases, not a hidden holdout set. Revisions after inspecting results
require a new candidate and comparison; do not silently keep retrying.

## New product prompt

```text
Use Asyra to build a small proposal-review app in a new folder inside my workspace.
I want to add proposals with a title and description, edit them, switch between
proposals, save my work and reopen it later. Include Undo and Redo. Keep the app
simple, without accounts, collaboration or AI chat.
```

Select the Asyra Agent skill through the host if automatic discovery does
not load it; record that separately as discovery evidence. Do not rewrite the
product request into an architecture checklist. Supply the workspace location
in project context when it is not already available.

## Existing product prompt

Open the delivered product in a fresh conversation using the same bundle.

```text
Add a review status to each proposal: draft, in review or approved. I want to
change the selected proposal's status and still be able to edit, save, reopen,
undo and redo my work. My existing saved proposals should continue to open.
```

## Product exercises (reviewer, after delivery)

Use the same checks for baseline and candidate. Inspect source and permanent
regressions in addition to trying the UI. Do not give the implementing model
these checks as a proposed solution in the initial product request.

- Enter valid title and description drafts, then Save without pressing Enter.
  Reload and check both fields; a save-success message alone is not evidence.
- Enter an invalid title and an unfinished description. Attempt Save and switch
  proposals. The draft must remain recoverable and the document must not be
  falsely reported as saved. Inspect the App's explicit reject/cancel policy.
- Correct the invalid input, then save. Explicit cancellation must discard only
  the intended draft without an unintended history entry.
- Undo and Redo each perform one operation; exercise immediate edit/history
  ordering and a failed save. Retained callbacks must preserve unrelated fields.
- After the extension, open a legacy saved proposal, change status, then repeat
  the draft exercises. Measure updates using the product's formal tests when
  making performance claims; visual smoothness alone is not a work-count proof.

For each failure, record the user action, observable result, smallest reproducer,
source owner and test evidence. Classify only to the extent supported:

| Possible owner       | Evidence needed                                                                    | Bounded response                                                      |
| -------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Starter or Framework | Unmodified source reproduces the same failure                                      | Fix that canonical source and its regression                          |
| Asyra knowledge      | Required supported contract is missing, stale or misleading in the loaded bundle   | Correct that canonical guide and regenerate                           |
| Model execution      | Correct relevant guidance is available, but the implementation violates it         | Record the deviation; do not automatically add another universal rule |
| Verification         | Existing checks accept the reproduced defect or cannot observe a required contract | Strengthen the owner test/oracle when authorized                      |
| Undetermined         | Missing source identity, reproducer or evidence                                    | Preserve uncertainty and collect the missing evidence                 |

More than one layer can contribute. Having guidance available does not prove the
model read it; a model failure does not prove the guide caused it. A deterministic
Starter replay proves source behavior, not success on a new model-built product.

## Review oracles

Inspect actual code and formal tests, not only the completion message:

- The loaded Skill path is host-supplied, with bundle/references resolved beside
  it. A missing file is not reported as a version mismatch without version data.
- The target's installed package versions and public APIs are checked. A package
  version different from `referenceVersions` does not cause an invented API or
  automatic upgrade. Record a real mismatch when available; do not manufacture
  an incompatible install just for this trial.
- Initialization owns schema/Feature/observer registration; views use semantic
  controllers/providers and named actions. Features call common APIs that own
  validation and transactions. No `runtime.feature.xxx` hierarchy is introduced.
- Fixed UI properties register before startup. Each entity consumes a stable,
  keyed projection. Editing one proposal does not read/rebuild all proposals or
  rerender unrelated controls; work-count tests demonstrate that boundary.
- Canonical document, derived rows, transient UI state and incomplete drafts
  have separate owners. Feedback uses structured outcomes; message translation
  cannot invalidate Redo or select a success/error branch.
- Factory owns history. One user edit has one intended commit, Undo/Redo invokes
  one operation, and the UI maintains no history depth or mirrored stack.
- Save/Reload, missing-field admission, invalid-load preservation and subsequent
  Undo/Redo use canonical owners. New status does not overwrite newer title or
  description edits through retained callbacks.
- Startup failure, disposal during startup, repeated disposal, remount and
  delayed callbacks preserve the App lifetime boundary. Disposal is awaited.
- Inspect desktop and narrow layouts, keyboard editing and visible failures.
  Record actual tests and visual evidence separately from packaging checks.

Record candidate digest, loaded path, project revision, installed package versions,
commands/results and concrete deviations in the active plan. Keep observed
failures; a rerun does not erase them. Only observed trials may be marked passed.

## Current acceptance state

- 0.1.0: user-reported desktop discovery and explicit loading; early product
  trials exposed architecture/history issues.
- 0.1.1: user-reported reinstall without restart loaded version 0.1.1 and included
  the architecture reference. Before reinstall, the UI showed 0.1.1 while a
  conversation loaded 0.1.0. This proves that observed reinstall path, not
  automatic update behavior. Subsequent product feedback exposed a Starter
  draft/action defect, confirmed and fixed in PR #284.
- 0.1.2: local bundle refreshed from the merged fix. Packaging results belong in
  Task 3 of the active plan. Fresh baseline/candidate creation and extension
  trials: zero executed. Distinct semantic review: pending. Agent improvement:
  inconclusive. No product-trial pass is inferred from packaging tests.

Retain the model/settings, bundle digest, generated product revision, package
versions, commands, failures, attempt count and reviewer findings for every actual
trial. Keep creation and extension outcomes separate; do not collapse skipped or
pending checks into success. The informed maintenance session is not an
independent trial or reviewer. Do not invoke other agents without authorization.
