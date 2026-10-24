# Browser follow-up evidence

These files were copied byte-for-byte (logs use `.txt` to remain tracked) from
the completed follow-up turns of
`Text guide independent consumer acceptance`
(`01a1694c-9166-7d91-b124-79f9517fc2eb`) on 2026-10-23. They are not evidence from
the first independent guide-acceptance turn. The browser ran the standalone
consumer with the same candidate packages; this is not a new browser run against
the permanent fixture. Its definitions, panel, runtime and document loader match
this fixture byte-for-byte. The permanent fixture has additional assertions.

`original-review.md` retains the chat's report unchanged. Its original paths
refer to that standalone consumer. This folder keeps the necessary subset:

- `consumer-adoption.md`: exact final consumer README from completed turn
  `01a1696b-dcde-7920-b577-4ab81a61708b`. Its 17-test result includes later user-directed
  fixes; it is not the initial 14-test independent result or this fixture's
  18-test maintainer result. Its relative paths refer to the original consumer.
- `fixed-new-text.png`: new Text with the shared-gray default.
- `fixed-chart-approved.png`: visible shared-gray Text and disabled chart approval.
- `memory-reloaded.png`, `memory-history.png`: content and color after fresh-runtime
  load and later history operations.
- `fixed-console.json`: recorded error-level console output for the approval run.
- `memory-final-state.txt`: final browser state, runtime generation and colors.
- `memory-*.txt`: the 17-test consumer suite, typecheck, lint and build results.
  Empty typecheck/lint logs are retained as captured; successful exit status was
  confirmed from the chat's completed command records.

The browser page is retained at `../../e2e/text-review.html`. From the fixture,
run `yarn dev --host 127.0.0.1` and open `/e2e/text-review.html` on its reported URL.
Select new Text, saved Text, chart and empty selection to inspect approval and
projection behavior. Reload the page before the persistence sequence, because
approving original Text intentionally changes its metadata.

Run Edit new Text, Undo, Redo, Save to memory, Reload memory in fresh runtime,
then Edit new Text, Undo, Redo and Save to memory again. Every memory save compares
all original properties. New gray comes from Utils; old explicit black remains
black, even when unreadable against the black canvas. The page uses only in-memory
JSON from `core.save()`, never the App save wrapper or production storage.

This checks history operations before and after load, not persistence of the old
undo stack. jsdom data tests are separate from the retained visual evidence.
No subsequent official update or published-package acceptance is implied.
