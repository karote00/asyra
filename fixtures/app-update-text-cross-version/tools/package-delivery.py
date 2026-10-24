"""Freeze a reproducible input delivery without maintainer evidence or a solution."""
import gzip
import hashlib
import io
import json
from pathlib import Path
import tarfile

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent.parent
files = {}
for name in ['package.json', 'yarn.lock', '.yarnrc.yml', '.gitignore',
             '.prettierrc.json', '.prettierrc', '.prettierignore', 'tsconfig.json', 'vite.config.ts',
             'vitest.config.ts', 'eslint.config.js', 'index.html', 'AGENTS.md',
             'README.md', 'ADOPTION.md', 'TASK.md', 'artifacts.json']:
    source = ROOT / name
    if source.exists():
        files[name] = source.read_bytes()
for directory in ['src', 'test-data', 'artifacts', 'sources']:
    for source in sorted((ROOT / directory).rglob('*')):
        if source.is_file():
            files[source.relative_to(ROOT).as_posix()] = source.read_bytes()
for source in sorted((REPO / 'docs/public').rglob('*')):
    if source.is_file():
        files[source.relative_to(REPO).as_posix()] = source.read_bytes()
digests = {name: hashlib.sha256(data).hexdigest() for name, data in sorted(files.items())}
files['HANDOFF-SHA256.json'] = (json.dumps(digests, indent=2) + '\n').encode()
buffer = io.BytesIO()
with gzip.GzipFile(fileobj=buffer, mode='wb', mtime=0) as compressed:
    with tarfile.open(fileobj=compressed, mode='w') as archive:
        for name, data in sorted(files.items()):
            member = tarfile.TarInfo('consumer/' + name)
            member.size, member.mode, member.mtime = len(data), 0o644, 0
            archive.addfile(member, io.BytesIO(data))
output = ROOT / 'delivery/input-v1.tar.gz'
output.parent.mkdir(exist_ok=True)
payload = buffer.getvalue()
if output.exists() and output.read_bytes() != payload:
    raise SystemExit('Input delivery is frozen; create a separately named revision.')
output.write_bytes(payload)
output.with_suffix(output.suffix + '.sha256').write_text(
    hashlib.sha256(payload).hexdigest() + '  input-v1.tar.gz\n')
print(f'Frozen {len(digests)} input files; no acceptance result included.')
