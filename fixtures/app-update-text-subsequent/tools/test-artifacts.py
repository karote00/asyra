"""Verify the exact bounded model delta; no install or network is performed."""
import hashlib
import json
from pathlib import Path
import tarfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
REPORT = json.loads((ROOT / 'updates/model-artifact.json').read_text())


def entries(name):
    with tarfile.open(ROOT / 'artifacts' / name, 'r:gz') as archive:
        return {m.name: archive.extractfile(m).read() for m in archive if m.isfile()}


class ArtifactContract(unittest.TestCase):
    def test_digests_and_only_declared_entries_change(self):
        for record in [REPORT['from'], REPORT['to']]:
            data = (ROOT / 'artifacts' / record['file']).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(), record['sha256'])
        before = entries(REPORT['from']['file'])
        after = entries(REPORT['to']['file'])
        changed = {p for p in before.keys() | after.keys() if before.get(p) != after.get(p)}
        self.assertEqual(changed, {entry['path'] for entry in REPORT['archiveChanges']})
        path = 'package/dist/props/components/text-component.js'
        expected = before[path].decode().replace('letterSpacing: 0,', 'letterSpacing: 0.5,')
        expected = '\n'.join(line for line in expected.splitlines() if not line.startswith('//# sourceMappingURL=')) + '\n'
        self.assertEqual(after[path].decode(), expected)
        package = json.loads(before['package/package.json'])
        package.update(version='0.5.8-task4.0', private=True)
        self.assertEqual(json.loads(after['package/package.json']), package)
        self.assertNotIn(path + '.map', after)

    def test_installed_target_matches_the_supplied_archive(self):
        installed = ROOT / 'node_modules/@asyra/preset'
        self.assertFalse(installed.is_symlink())
        for name, content in entries(REPORT['to']['file']).items():
            self.assertEqual((installed / name.removeprefix('package/')).read_bytes(), content, name)

    def test_other_candidates_are_unchanged(self):
        base = json.loads((ROOT / 'updates/base-artifacts.json').read_text())
        self.assertEqual(len(base['packages']), 19)
        for record in base['packages']:
            data = (ROOT / 'artifacts' / record['file']).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(), record['sha256'])


if __name__ == '__main__':
    unittest.main()
