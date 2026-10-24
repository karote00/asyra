# Release History and Update Coverage

This page is generated from registered, committed release summaries. It is available through the same repository and website documentation entries; it does not depend on CI artifact retention.

Start with [the update guide](index.md). Identify the owner/channel and actual adopted baseline, then follow predecessor links to the requested target. Read every intervening summary and its guides in order. A version number alone does not establish coverage.

## Covered deliveries

No verified release summaries are registered yet. There is no supported release-to-release range to claim. Existing Text guides are modeled integration examples, not evidence that any published version introduced Text.

## Gaps and partial adoption

- Stop if a predecessor or guide is missing, the baseline is outside the stated boundary, the target is unavailable, or a prerequisite does not match the selected dependency. Do not infer missing releases from adjacent version numbers.
- Inspect installed packages, actual definitions and Features, stored document schemas and the adoption note separately. Without a note, inspect the App and sample data before deciding what is already adopted.
- Keep the exact adopted guide revision in that note. A later correction must be read and checked even when its original release is already adopted; resolving a correction does not mark it adopted.
- For each prerequisite owner/channel, identify its own adopted baseline, selected target and deferred changes, then follow its entire predecessor chain and nested prerequisites. A matching installed or target version is not adoption evidence. Report missing or incompatible baselines, unavailable intermediate releases and unresolved targets before integrating.
- Revisit earlier summaries for retained or deferred changes even when packages are already at the target. Resolve guide corrections without dropping required conversions; retain custom fields, read/write paths, projections, Features and saved data.
- Apply required migrations in their documented order; intermediate package installation is needed only when a guide explicitly requires it. Mark each change adopted, already satisfied, retained, deferred or inapplicable with a reason, and preserve that note for the next update.

## Canonical sources

- [Release guidance rule](../../ai/framework/rules/release-update-guidance.md)
- [App-owned migration](../build/persistence-migration.md)
