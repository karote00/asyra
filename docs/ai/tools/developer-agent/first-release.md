# First public release preparation

## Candidate

- Plugin: `asyra-developer` 0.1.5, displayed as Asyra Developer.
- Source base: `46c7d8f19c1ff9418c551654181ebbbfc4138579` (PR #288).
- Target: Codex desktop first; one Skill, offline reference guides, no MCP server.
- Publisher metadata: existing author Asa Tsai; verified dashboard identity must
  be selected by the publisher and must agree with the listing.
- Scope: listing metadata, existing website icon, install/update copy and package
  preparation. Skill instructions and all reference bytes remain those of 0.1.4.
- Version 0.1.5 is a candidate, not an assertion of upload, approval or publication.

## Product evidence reviewed on 2026-10-05

The user confirmed the installed 0.1.4 Skill and bundle identity in a fresh Codex
conversation. Desktop client build and exact model identity were not captured;
these trials are not reproducible cross-model benchmarks or holdout experiments.

- Feedback board extension: source conversation
  `01a107a5-7765-7ea1-8ad7-75a5698a8044`. Tags, combined filtering, history and
  persistence followed the intended owners. Review found redundant ID comparisons
  in App code. A permanent regression recorded 6,000 comparisons before the fix
  and zero afterward, while equal-length membership changes still updated.
  Recorded final gates: 52 unit/integration and 10 browser tests passed.
- Expense tracker creation: source conversation
  `01a107c1-9a95-7173-9ff2-05b4427c2191`. Reviewed integer money, BigInt aggregation,
  civil dates, local drafts, history, save failure and incremental projections.
  Recorded gates: 15 unit/integration and 8 browser tests, types, lint and build
  passed. 5,000-record work-count evidence covers note edits and shared statistics.
  Review identified a destination-folder instruction miss; no App repair or move
  is part of this release. Mobile evidence is browser emulation.

Both reviews inspected source and existing execution evidence without rerunning
the external Apps. Neither trial proves that every generated product is correct.
The remaining folder instruction miss belongs to model execution, not a new
Asyra architecture rule. The published Starter CLI may predate the bundled
architecture; the unchanged Skill explicitly requires checking and aligning it.

## Local checks and deliverables

Run the permanent packaging and naming contracts, freshness check, and release
comparison against `baselines/0.1.4.bundle.json`. Package only the plugin directory
with `.codex-plugin/plugin.json` at the ZIP root. Include every bundle-recorded
file plus `skills/asyra-developer/bundle.json`. Exclude marketplace configuration,
worktrees, caches, consumer Apps and submission credentials.

The prepared ZIP, SHA-256 and file inventory belong under the ignored
`tmp/release/` directory. Round-trip extraction must match every packaged byte and
pass the existing standalone inspector. Record the source commit after local
validation. Regenerate these artifacts if any shipped file changes.

### Preparation results

- 27 packaging/naming tests passed, including the new listing regression that
  failed before the metadata was added.
- Bundle freshness and version comparison against 0.1.4 passed.
- Skill/reference file hashes and canonical input hashes match 0.1.4 exactly.
- ZIP round-trip verified 22 files (59,843 bytes) and standalone inspection passed.
- ZIP SHA-256: `f951378f1d87e47b042959b3bd3a276f7c58b89a4759f076ea26dc7718064968`.
- Diff whitespace check passed. The fresh worktree lacks Yarn's install-state
  file; naming checks ran through the exact two Node test files in the registered
  `lint:naming` command, without installing or upgrading dependencies.

## Remaining publication steps

1. Review the candidate ZIP and source changes. Install 0.1.5 through the local
   marketplace and verify its bundle from a fresh desktop conversation; record
   the desktop build. This has not yet been performed for 0.1.5.
2. With publication authorization, select the owning OpenAI organization/project
   and verified publisher identity in the submission portal. Upload the ZIP.
3. Resolve actual metadata/Skill scan findings. Local tests do not substitute
   for portal validation. Skills-only plugins do not require MCP review cases or
   a demo recording. Confirm any required policy attestations as the publisher.
4. Submit for review. After approval and publication authorization, publish the
   approved package and record its real listing URL. No listing URL is invented.
5. Share the listing, release notes and installed-version check. Future Skill
   or metadata changes require a new version and ZIP; no background update
   schedule is promised. Git source push, tags and releases are separate actions.

## Official sources

Checked 2026-10-05:

- <a href="https://developers.openai.com/plugins/deploy/submission" target="_blank" rel="noopener noreferrer">Submission, required metadata and publication</a>
- <a href="https://developers.openai.com/plugins/build/plugins" target="_blank" rel="noopener noreferrer">Package layout and marketplace distribution</a>
