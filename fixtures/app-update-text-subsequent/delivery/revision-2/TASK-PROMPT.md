# Independent adoption task - revision 2

Work only inside the extracted `consumer` directory containing this file. Read
its `AGENTS.md`, existing `README.md`, `updates/index.md` and
`updates/text-spacing-example-2-r2.md`. This is a standalone consumer acceptance
from the pre-update state, with no prior conversation context. Do not inspect a
parent repository, other chats, packaging-validation outputs or private maintainer
evidence. Do not use subagents.

Integrate the selected `text-spacing-example-2` update using revision 2 and the
supplied candidate artifacts and public sources. The user selects official spacing
0.5 for new typography while retaining explicit saved values and all current App
extensions: rejected approval and its action, all three metadata field paths,
the shared gray override, chart behavior and deferred adoption. Inspect actual
code rather than assuming an older adoption note is current.

Verify `HANDOFF-SHA256.json` and candidate digests before changes. No Git metadata
is supplied. Before Git operations, initialize an isolated repository here with
`git init -b codex/text-spacing-r2-adoption`; never discover or operate a parent
repository. Keep writes, package caches, temporary files and logs inside this
consumer. Use the declared Node/Yarn versions without upgrading tools. If required
prerequisites are unavailable, report the blocker rather than installing new tools.

Install the already-declared baseline packages with the supplied local resolutions
and unchanged lockfile, then run the existing baseline tests before selecting the
next candidate. Use project-local Yarn cache/global/tmp directories; the revision-2
guide describes these settings. You may then select and install only the supplied
next candidate for the already-declared Preset dependency. Preserve all unrelated
dependencies and resolutions. Do not edit Framework source or candidate archives.

Add meaningful permanent verification required by the guide, proving the selected
new-default expectation fails on the baseline before integration. Retain existing
preservation assertions and immutable saved fixtures. Complete test, typecheck,
lint and build; keep logs and exit statuses under
`test-results/subsequent-adoption/`. Do not report adoption merely because install
succeeds. Record actual adoption, warnings, remaining limitations and any guide
gaps in the existing README without overwriting dated history. If required
information is unavailable, report it instead of guessing or consulting outside
maintainer context. Do not publish, push, deploy or create a remote PR.
