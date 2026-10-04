# Developer Agent acceptance scenarios

These are permanent manual product trials for the installed candidate. They are
not packaging assertions or evidence that a model has already complied. Run in
fresh Codex conversations with the candidate version confirmed from the actual
loaded Skill's `bundle.json`. Keep each project inside the user's selected
workspace. Use an empty directory for the first trial; never overwrite a product.

## New product prompt

```text
Use $asyra-developer to create a proposal-review App in a new project directory
inside my workspace. Let me add proposals with a title and description, edit
those fields, select a proposal, save and reload the document, and perform one
Undo or Redo at a time. Use the maintained Generic Starter App architecture.
Do not add collaboration, accounts or an embedded AI chat. Read the installed
Skill and report its actual loaded path and bundle version before implementation.
Confirm the target directory from this conversation/project context; ask if it
is unavailable. Keep project files and documentation in English. Follow project
instructions, write a short plan first, then implement and run the project's
applicable tests, typecheck, lint and build. Report what was actually verified.
```

## Existing product prompt

Open the same product in a new conversation after recording the first result.

```text
Use $asyra-developer to extend this proposal-review App with a review status:
draft, in-review or approved. Existing saved proposals without the new field
should load as draft; present invalid values must reject before load. Let me
change the selected proposal's status. Undo and Redo must each perform one
operation, and Save/Reload must preserve the accepted status. Keep the App's
existing architecture, edit owners and UI subscription boundaries. Read the
installed Skill from its actual location and report the bundle version. Write
a short plan, then implement with permanent tests for the new behavior and
preserved behavior. Keep project files and documentation in English and report
which checks ran and which remain unverified.
```

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

Version 0.1.0 has user-reported desktop discovery and explicit Skill-loading
evidence. Earlier product trials exposed history/architecture problems and do
not accept the new standard. Version 0.1.1 is a local candidate: independent
fresh-conversation product trials and installation/update acceptance are pending.
