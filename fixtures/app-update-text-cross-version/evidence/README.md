# Task 4 evidence

The top-level preparation logs were produced by the coordinating maintainer,
not an independent AI.
`preparation-status.json` records commands and exits: preservation, type, lint and
build pass; target acceptance intentionally fails before integration.

`original-evidence-sha256.json` protects every tracked file in the two prior Text
fixtures. The delivery check verifies these original bytes remain unchanged.
`../delivery/input-v1.tar.gz` freezes the unsolved consumer and public documents;
it contains no maintainer results, original acceptance evidence or solution.

Independent integration was dispatched on 2026-10-24 to chat
`01a16e30-e3d0-7fa3-b7aa-f33e5f14c82a` after explicit user authorization.
The chat receives only the extracted input-v1 consumer and its TASK.md, with
no prior discussion or maintainer evidence supplied. The delivery SHA-256 is
`813956d75793ac9871685cda2862353e2edd5ac88d8710113f3adce4e145cb48`.
The independent chat completed with 31 passing tests and successful typecheck,
lint and build. Its result is frozen in `independent-v1.tar.gz`; its later
read-only review did not change that integration. See `ERRATA.md` for the digest
comparison correction. Its commands and outcome remain distinct from maintainer replay.
Retained candidate artifacts prove only this modeled local scenario, not registry
availability, production delivery or pixel rendering.

Preparation checks also passed: 36 public-document/Inspector cases, 23 content
contract/release-guidance cases, 15 naming cases, the root delivery gate (four
Python checks), and all four existing website update-discovery browser cases.
The browser run used the local documentation website at port 3048 and stopped
its server afterward. These are discovery/preparation results, not successful
consumer integration or a rendered-consumer visual acceptance.

Public generation, structure/link/API validation, update-note coverage, scoped
ESLint and diff whitespace checks passed. The original fixtures were not edited.
The frozen input-v1 consumer remains before integration; its target suite
intentionally fails. The permanent fixture now contains the completed integration.

## Permanent fixture replay - 2026-10-24

The existing root fixture gate restores input-v1 candidates and runs the integrated
consumer. It passed 31 tests, typecheck, lint and build; all seven delivery/evidence
checks passed before and after execution. Logs and exit statuses are retained in
`permanent-replay/`. The test-first integration log retains 10 failures/21 passes
before copying the independent implementation; the original 31 assertions were
kept. The public revision-2 regression first failed because that guide was absent.

This is a maintainer replay with prior context, not a fresh AI acceptance.
Independent v1, its subsequent read-only review, original input v1, preparation,
and this replay are separate evidence. The original two Text fixtures and frozen
revision-1 guide/release records are byte-identical. Task 4 is complete.

Final integration checks also passed: 36 public-document/Inspector cases,
15 naming cases, scoped ESLint, generated-document freshness, validation of
53 public pages and all four website update-discovery browser cases. The local
website test server was stopped afterward. These checks validate the final
entries and fixture integration; they do not alter the original consumer result.
