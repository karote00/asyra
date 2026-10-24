# Cross-version Text consumer

This is the completed permanent fixture for Task 4. The independent consumer
integrated the three modeled App stages and Framework prerequisite, retaining
custom fields, actions, projections and data. Its 31 tests plus typecheck, lint
and build passed. Read [the adoption record](ADOPTION.md) and the current
[public guide](../../docs/public/updates/text-cross-version-example-3-r2.md).

The source uses official typography definitions and spacing default 0.5, keeps
App metadata and gray defaults, and migrates document versions 1 and 2 to wire
version 3. Core still receives numeric layout-unit spacing. The em-spacing sample
is intentionally rejected; the optional official panel remains deferred.

## Reproduce the permanent fixture

From the repository root, run the existing focused gate:

```sh
node --test --test-name-pattern='cross-version delivery' scripts/__tests__/app-update-fixtures.test.mjs
```

It checks retained evidence, restores exact candidate archives from input-v1,
installs the declared lockfile and runs test, typecheck, lint and build. Caches,
temporary files and replay logs stay inside the project under
`tmp/app-update-cross-version-validation`. Existing tests use real candidate
Core APIs with a jsdom/canvas harness, not browser-pixel acceptance.

## Preserve the original run

`delivery/input-v1.tar.gz` is the frozen, unsolved consumer given to the independent
AI; it intentionally has four failing target tests. Its TASK.md applies only to
that extracted historical input. The permanent fixture is already integrated;
do not regenerate or overwrite input-v1 from it. `tools/package-delivery.py` is
the original authoring tool and rejects changed contents for that frozen name.

`evidence/independent-v1.tar.gz` preserves the independent implementation,
original adoption report, conversation outcomes and all command logs, including
failed test-authoring attempts. `evidence/ERRATA.md` corrects the report's digest
comparison without rewriting it. Maintainer replay is recorded separately in
`evidence/README.md`; the earlier two Text acceptance fixtures remain unchanged.

This is an explicitly modeled local candidate exercise. No published version
range, public registry availability or production-data migration is claimed.
