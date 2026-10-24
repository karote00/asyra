"""Build a deterministic TEST-ONLY next candidate; never edits Framework source."""
import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path
import shutil
import tarfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path, help='Directory of the 19 first-candidate archives')
args = parser.parse_args()
consumer = Path(__file__).resolve().parents[1]
base = json.loads((consumer / 'updates/base-artifacts.json').read_text())
output = consumer / 'artifacts'
output.mkdir(exist_ok=True)
for record in base['packages']:
    archive = args.source / record['file']
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == record['sha256'], record['file']
    shutil.copyfile(archive, output / record['file'])
record = next(p for p in base['packages'] if p['name'] == '@asyra/preset')
js_path = 'package/dist/props/components/text-component.js'
map_path = js_path + '.map'
changed = []
buffer = io.BytesIO()
with tarfile.open(output / record['file'], 'r:gz') as source, tarfile.open(fileobj=buffer, mode='w') as target:
    for member in sorted(source.getmembers(), key=lambda m: m.name):
        if member.name == map_path:
            changed.append({'path': member.name, 'change': 'removed obsolete source map'})
            continue
        data = source.extractfile(member).read() if member.isfile() else b''
        if member.name == 'package/package.json':
            package = json.loads(data)
            package.update(version='0.5.8-task4.0', private=True)
            data = (json.dumps(package, indent=2) + '\n').encode()
            changed.append({'path': member.name, 'change': 'test-only prerelease identity and private flag'})
        elif member.name == js_path:
            code = data.decode()
            assert code.count('letterSpacing: 0,') == 1
            code = code.replace('letterSpacing: 0,', 'letterSpacing: 0.5,')
            code = '\n'.join(line for line in code.splitlines() if not line.startswith('//# sourceMappingURL=')) + '\n'
            data = code.encode()
            changed.append({'path': member.name, 'change': 'default 0 to 0.5; remove obsolete source map link'})
        member.size = len(data)
        member.mtime = 0
        member.uid = member.gid = 0
        member.uname = member.gname = ''
        member.pax_headers = {}
        target.addfile(member, io.BytesIO(data) if member.isfile() else None)
assert len(changed) == 3
filename = 'asyra-preset-0.5.8-task4.0.tgz'
result = gzip.compress(buffer.getvalue(), mtime=0)
(output / filename).write_bytes(result)
manifest = {
    'changeId': 'text-spacing-example-2',
    'status': 'modeled-test-artifact-not-an-official-release',
    'sourceCommit': base['sourceCommit'],
    'from': record,
    'to': {'name': '@asyra/preset', 'version': '0.5.8-task4.0', 'file': filename,
           'sha256': hashlib.sha256(result).hexdigest()},
    'archiveChanges': changed,
    'otherPackages': 'Exactly the unchanged base-artifacts.json candidates; no registry upgrade.'
}
manifest_path = consumer / 'updates/model-artifact.json'
if manifest_path.exists():
    assert json.loads(manifest_path.read_text()) == manifest, 'Rebuild differs from retained target identity'
else:
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest['to']))
