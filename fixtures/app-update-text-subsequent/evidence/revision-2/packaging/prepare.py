"""Prepare an isolated pre-update consumer; never include adoption outputs."""
from pathlib import Path
import hashlib
import io
import json
import re
import shutil
import subprocess
import tarfile
import urllib.request

root = Path.cwd()
out = root / 'delivery/text-spacing-r2-independent'
consumer = out / 'consumer'
consumer.mkdir(exist_ok=False)
tracked = subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0')
protected = {p: hashlib.sha256((root / p).read_bytes()).hexdigest()
             for p in tracked if p and (root / p).is_file()}
protected.update({str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
                  for p in (root / 'updates').glob('*-r2.md')})
(out / 'protected-files.json').write_text(json.dumps(protected, indent=2) + '\n')
# The consumer's own committed input is the source; no parent history is read.
archive = subprocess.check_output(['git', 'archive', 'HEAD'])
with tarfile.open(fileobj=io.BytesIO(archive)) as source:
    for entry in source.getmembers():
        if not entry.isfile():
            continue
        target = consumer / entry.name
        assert target.resolve().is_relative_to(consumer.resolve())
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source.extractfile(entry).read())

base = json.loads((consumer / 'updates/base-artifacts.json').read_text())
model = json.loads((consumer / 'updates/model-artifact.json').read_text())
(consumer / 'artifacts').mkdir()
for item in [*base['packages'], model['to']]:
    source = root / 'artifacts' / item['file']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == item['sha256']
    shutil.copyfile(source, consumer / 'artifacts' / item['file'])

# Preserve revision-2 behavior verbatim; replace outcome-bearing delivery prose.
guide = (root / 'updates/text-spacing-example-2-r2.md').read_text()
guide = guide.replace(
    'Revision 1 completed independent consumer acceptance; revision 2 is a\ndocumentation clarification, not a fresh independent acceptance run.',
    'This independent handoff starts before the selected update. Adoption is pending.')
guide = guide[:guide.index('## Revision 2 - installation warnings and standalone delivery')]
guide += '''## Revision 2 - independent handoff edition

This is an explicitly labeled delivery edition of revision 2. Package identities,
behavioral requirements and required verification are unchanged. Outcome-bearing
status and log references are omitted to keep this run independent; no prior
subsequent-adoption result or solution patch is included. The original revision-1
guide and migration attachment are retained as history. Use the
[handoff inventory](handoff-inventory-r2.md) and [task prompt](../TASK.md).

Yarn may report `YN0066` for its optional built-in TypeScript compatibility patch,
including `Cannot apply hunk #1`. A warning is neither automatic success nor
proof of failure. Retain the install log and command exit status, verify the
resolved candidate identity and run test, typecheck, lint and build. Failed
installation, wrong identity or a failed required gate leaves adoption pending.
Do not suppress warnings or upgrade unrelated dependencies/tools to force success.
Canvas-stub/selection-overlay and large-bundle warnings likewise do not establish
browser rendering correctness.

Use project-local caches and logs. The existing `.yarnrc.yml` disables the global
cache. For installation, set `YARN_GLOBAL_FOLDER="$PWD/.yarn/global"` and
`TMPDIR="$PWD/.yarn/tmp"`, creating those directories first. Keep new logs under
`test-results/subsequent-adoption/` and retain failed attempts. Test organization
and lint-compliant fixture manipulation are execution decisions, not new product
requirements. Install the existing baseline before selecting the next candidate.

The [public-source attachment index](sources/index.md) supplies pinned source
copies for offline reference. These are read-only evidence, never runtime import
paths or authorization to modify Framework code. Third-party dependencies still
require registry access on a clean install; this is not an offline Yarn cache.
'''
(consumer / 'updates/text-spacing-example-2-r2.md').write_text(guide)
shutil.copyfile(root / 'updates/persistence-migration-r2.md',
                consumer / 'updates/persistence-migration-r2.md')
# Fetch only the four explicitly linked public canonical files, pinned by commit.
source_paths = [
    'packages/preset/src/props/components/text-component.ts',
    'packages/preset/src/components/text.ts',
    'packages/core/src/core.ts',
    'packages/utils/src/propsManager/fills.ts',
]
sources = consumer / 'updates/sources'
sources.mkdir()
rows = []
for i, path in enumerate(source_paths, 1):
    url = f'https://raw.githubusercontent.com/karote00/asyra/{base["sourceCommit"]}/{path}'
    with urllib.request.urlopen(url, timeout=30) as response:
        data = response.read()
    assert data and b'<html' not in data[:200].lower()
    filename = f'{i}-{Path(path).name}.txt'
    (sources / filename).write_bytes(data)
    rows.append(f'| [{path}]({filename}) | `{hashlib.sha256(data).hexdigest()}` |')
(sources / 'index.md').write_text(
    '# Pinned public source attachments\n\n'
    f'Source commit: `{base["sourceCommit"]}`. Copies were retrieved from the public\n'
    'repository paths below at this commit. SHA-256 identifies the supplied bytes;\n'
    'the copies are reference material, not an installed package or private evidence.\n'
    'The base schema describes spacing 0; the target archive defines the selected 0.5.\n\n'
    '| Public repository path / local copy | SHA-256 |\n| --- | --- |\n'
    + '\n'.join(rows) + '\n')
(consumer / 'updates/index.md').write_text('''# Independent subsequent Text update

Start with the [revision-2 independent handoff guide](text-spacing-example-2-r2.md),
[attachment inventory](handoff-inventory-r2.md) and [task prompt](../TASK.md).
This consumer is before the selected update. Adoption is pending.

The [original revision-1 guide](text-spacing-example-2-r1.md) and
[original migration attachment](persistence-migration.md) are unchanged history.
Use the [portable migration reference](persistence-migration-r2.md) for active links.
''')
(consumer / 'updates/handoff-inventory-r2.md').write_text('''# Independent handoff inventory - revision 2

This bundle starts before `text-spacing-example-2`. No subsequent-adoption result,
patch, generated gate logs or private maintainer material is supplied. Inspect
actual code and installed identities rather than assuming adoption from history.

## Required supplied inputs

| Attachment | Purpose |
| --- | --- |
| [Instructions](../AGENTS.md), [task prompt](../TASK.md), [existing adoption record](../README.md) | Consumer scope and pre-update decisions |
| [Revision-2 independent guide](text-spacing-example-2-r2.md) | Selected change and required verification |
| [Revision-2 migration reference](persistence-migration-r2.md) | App ownership and portable references |
| [Base manifest](base-artifacts.json), [model report](model-artifact.json) | Exact identities and modeled artifact delta |
| [Artifacts](../artifacts/) | All 19 base archives plus the next Preset candidate |
| [Baseline Preset](../artifacts/asyra-preset-0.5.8.tgz), [next Preset](../artifacts/asyra-preset-0.5.8-task4.0.tgz) | Baseline installation and authorized later selection |
| [Manifest](../package.json), [lockfile](../yarn.lock), [Yarn settings](../.yarnrc.yml) | Baseline dependency resolution and local caching |
| [App and permanent tests](../src/) | Actual intervening extensions and behavior |
| [Original](../test-data/current.json), [multiplier](../test-data/multiplier.json), [intervening](../test-data/locally-extended.json) documents | Immutable saved inputs |
| [Public source copies](sources/index.md) | Pinned canonical source evidence, readable offline |
| [File checksums](../HANDOFF-SHA256.json) | Integrity of supplied files, excluding the checksum file itself |

All existing build, TypeScript, lint and test configuration is included. Node 24.x
and Yarn 4.3.1 are prerequisites; unrelated dependency installation uses the
existing lockfile and may require network access. `node_modules` and package
caches are not supplied. Do not substitute registry packages for local candidates.
Missing required files or identity mismatches block dependent integration.

## Optional history and provenance

The [original guide](text-spacing-example-2-r1.md),
[original migration reference](persistence-migration.md) and
[candidate builder](../tools/prepare-artifacts.py) are supplied unchanged.
Installing the provided target does not require running the builder. Never use
its output directory as its source directory. Original migration links into the
broader docs tree are historical only; use revision 2 for current navigation.

The pre-existing README mentions `VERIFICATION.md`, `evidence/`,
`updates/target-artifacts.json` and `test-results/text-adoption/`. These historical
attachments are not supplied or reconstructed. The existing record is context,
not fresh verification. No prior subsequent-adoption logs are included: generate
this run's own evidence under `test-results/subsequent-adoption/`.

Artifacts are Git-ignored but explicitly included in this bundle. A source-only
Git copy is insufficient. Do not inspect a parent checkout, earlier conversations
or unprovided maintainer evidence to fill gaps; report any required missing input.
''')
(consumer / 'TASK.md').write_text('''# Independent adoption task - revision 2

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
''')
# Additional isolation instruction, without altering original consumer rules.
with (consumer / 'AGENTS.md').open('a') as f:
    f.write('\nThis independent handoff is the entire task boundary. Do not inspect parent\n'
            'repositories or earlier chats. Initialize a local Git repository before Git\n'
            'operations as described in TASK.md; no parent repository is task context.\n')
# Preserve the baseline README byte-for-byte; all availability notes live above.
manifest = {str(p.relative_to(consumer)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(consumer.rglob('*')) if p.is_file()}
(consumer / 'HANDOFF-SHA256.json').write_text(json.dumps(manifest, indent=2) + '\n')
(out / 'TASK-PROMPT.md').write_text((consumer / 'TASK.md').read_text())
# Packaging evidence is intentionally outside the independent consumer input.
for p, digest in protected.items():
    assert hashlib.sha256((root / p).read_bytes()).hexdigest() == digest, p
print(f'Prepared {len(manifest) + 1} independent input files; original consumer unchanged.')
