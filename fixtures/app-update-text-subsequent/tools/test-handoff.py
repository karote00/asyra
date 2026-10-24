"""Validate the retained revision-2 delivery without extracting or changing files."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import posixpath
import re
import subprocess
import tarfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
DELIVERY = ROOT / 'delivery/revision-2'
ARCHIVE = DELIVERY / 'text-spacing-r2-independent.tar.gz'


class HandoffContract(unittest.TestCase):
    def archive_files(self):
        with tarfile.open(ARCHIVE) as archive:
            members = archive.getmembers()
            self.assertEqual(len(members), len({m.name for m in members}))
            for member in members:
                self.assertTrue(member.isfile(), member.name)
                self.assertFalse(PurePosixPath(member.name).is_absolute())
                self.assertNotIn('..', PurePosixPath(member.name).parts)
                self.assertTrue(member.name.startswith('consumer/'))
            return {m.name.removeprefix('consumer/'): archive.extractfile(m).read() for m in members}

    def test_retained_delivery_and_logs_are_not_git_ignored(self):
        paths = [ARCHIVE, ROOT / 'evidence/independent-test.log', ROOT / 'evidence/revision-2/context-rerun/logs/test.log']
        result = subprocess.run(['git', 'check-ignore', '--no-index', *map(str, paths)], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)

    def test_archive_identity_and_all_delivered_inputs(self):
        expected = (DELIVERY / 'text-spacing-r2-independent.tar.gz.sha256').read_text().split()[0]
        self.assertEqual(hashlib.sha256(ARCHIVE.read_bytes()).hexdigest(), expected)
        files = self.archive_files()
        manifest = json.loads(files['HANDOFF-SHA256.json'])
        self.assertEqual(set(files), set(manifest) | {'HANDOFF-SHA256.json'})
        self.assertEqual(len(manifest), 60)
        for name, digest in manifest.items():
            self.assertEqual(hashlib.sha256(files[name]).hexdigest(), digest, name)
        base = json.loads(files['updates/base-artifacts.json'])
        model = json.loads(files['updates/model-artifact.json'])
        self.assertEqual(len(base['packages']), 19)
        for record in [*base['packages'], model['to']]:
            self.assertEqual(hashlib.sha256(files['artifacts/' + record['file']]).hexdigest(), record['sha256'])

    def test_baseline_has_no_learned_solution_or_result(self):
        files = self.archive_files()
        baseline = json.loads((ROOT / 'evidence/input-files.json').read_text())['files']
        for name in files:
            self.assertFalse(name.startswith(('.git/', 'node_modules/', 'test-results/', 'evidence/', '.yarn/', 'dist/')))
            if name.startswith(('src/', 'test-data/')) or name in ('README.md', 'package.json', 'yarn.lock', '.yarnrc.yml'):
                self.assertEqual(hashlib.sha256(files[name]).hexdigest(), baseline[name], name)
        package = json.loads(files['package.json'])
        self.assertEqual(package['dependencies']['@asyra/preset'], '0.5.8')
        self.assertEqual((DELIVERY / 'TASK-PROMPT.md').read_bytes(), files['TASK.md'])
        self.assertNotIn('src/__tests__/revision-two-adoption.test.ts', files)

    def test_active_bundle_links_resolve_inside_the_delivery(self):
        files = self.archive_files()
        pages = ['updates/index.md', 'updates/sources/index.md'] + [p for p in files if p.startswith('updates/') and p.endswith('-r2.md')]
        for name in pages:
            for link in re.findall(r'\]\(([^)]+)\)|href="([^"]+)"', files[name].decode()):
                href = next(part for part in link if part)
                if '://' in href or href.startswith('#'):
                    continue
                target = posixpath.normpath(posixpath.join(posixpath.dirname(name), href.split('#')[0]))
                self.assertFalse(target.startswith('../'), (name, href))
                self.assertTrue(target in files or any(p.startswith(target.rstrip('/') + '/') for p in files), (name, href))


if __name__ == '__main__':
    unittest.main()
