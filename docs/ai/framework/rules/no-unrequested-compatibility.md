# Rule: No Unrequested Compatibility Work

## Scope

This rule applies to every AI-assisted task in the repository, including
framework, app, tooling, documentation, tests, and workflow changes.

## Core Rule

Implement the current contract. Do not add behavior that preserves an older
version or old behavior merely for compatibility. When the task replaces an
old contract, remove the superseded behavior within the authorized task scope.

Compatibility handling is allowed only when the relevant owner already exists
specifically to provide compatibility or migration, or when the task explicitly
requests a workaround. Existing public compatibility contracts continue to
follow `deprecation-lifecycle.md`; old persisted data continues to follow the
declared load-migration contract. These paths do not authorize adding unrelated
compatibility behavior to another task.

## Required Handling

- Start from the current product, API, data, or workflow contract.
- Do not retain old branches, formats, defaults, or output paths solely to avoid
  removing old-version behavior.
- If the current task supersedes old behavior, remove that behavior and its
  now-unneeded helpers, flags, and routes within the frozen task scope.
- Keep intentional compatibility or migration handling inside its existing
  owner and lifecycle boundary.
- If removing a superseded path would require changes outside the authorized
  scope, stop and request direction instead of adding a compatibility bridge.
- Treat a workaround as an exception only when the task explicitly asks for
  it; name and bound that workaround in the owning contract.

## Review Checklist

- [ ] The implementation follows the current contract.
- [ ] No old-version behavior was added or retained just for compatibility.
- [ ] Any compatibility or migration handling belongs to an explicit owner.
- [ ] Any workaround was specifically requested and is bounded in the contract.
- [ ] Superseded behavior inside the task scope was removed.
