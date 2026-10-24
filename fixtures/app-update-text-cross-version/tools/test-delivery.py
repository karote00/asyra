"""Validate the frozen public-only inputs and retained original evidence."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import tarfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent.parent


class DeliveryContract(unittest.TestCase):
    def files(self):
        archive_path = ROOT / 'delivery/input-v1.tar.gz'
        digest = archive_path.with_suffix('.gz.sha256').read_text().split()[0]
        self.assertEqual(hashlib.sha256(archive_path.read_bytes()).hexdigest(), digest)
        with tarfile.open(archive_path) as archive:
            members = archive.getmembers()
            self.assertEqual(len(members), len({m.name for m in members}))
            for member in members:
                self.assertTrue(member.isfile())
                self.assertTrue(member.name.startswith('consumer/'))
                self.assertNotIn('..', PurePosixPath(member.name).parts)
            return {m.name.removeprefix('consumer/'): archive.extractfile(m).read() for m in members}

    def test_delivery_contains_only_intended_inputs_with_exact_hashes(self):
        files = self.files()
        hashes = json.loads(files['HANDOFF-SHA256.json'])
        self.assertEqual(set(files), set(hashes) | {'HANDOFF-SHA256.json'})
        for name, digest in hashes.items():
            self.assertEqual(hashlib.sha256(files[name]).hexdigest(), digest, name)
            self.assertFalse(name.startswith(('evidence/', 'test-results/', '.git/',
                                             'node_modules/', '.yarn/', 'docs/ai/')))
        artifacts = json.loads(files['artifacts.json'])
        for name, digest in artifacts['files'].items():
            self.assertEqual(hashlib.sha256(files['artifacts/' + name]).hexdigest(), digest)

    def test_inputs_keep_unintegrated_behavior_and_stale_note(self):
        files = self.files()
        self.assertIn(b'localTypographyFields', files['src/definitions.ts'])
        self.assertIn(b'documentVersion: 2', files['src/runtime.ts'])
        self.assertIn(b'reviewNote', files['src/runtime.ts'])
        self.assertIn(b'partially adopted', files['ADOPTION.md'])
        self.assertNotIn(b'New adoption completed', files['ADOPTION.md'])
        for name in ['baseline-preservation.test.ts', 'cross-version-acceptance.test.ts']:
            self.assertIn('src/__tests__/' + name, files)

    def test_public_discovery_and_modeled_records_survive_offline(self):
        files = self.files()
        self.assertIn(b'updates/history.md', files['docs/public/llms.txt'])
        guide = 'updates/text-cross-version-example-3.md'
        self.assertIn(guide.encode(), files['docs/public/llms.txt'])
        records = []
        for name, data in files.items():
            if name.startswith('docs/public/updates/releases/model-text-'):
                record = json.loads(re.search(rb'```release-summary\s*\n(.*?)\n```', data, re.S)[1])
                self.assertEqual(record['status'], 'modeled')
                self.assertEqual(record['changes'][0]['guides'], [guide])
                records.append(record)
        self.assertEqual(len(records), 4)
        by_id = {record['id']: record for record in records}
        self.assertEqual(by_id['model-text-app-3']['previous'], 'model-text-app-2')
        self.assertEqual(by_id['model-text-app-2']['previous'], 'model-text-app-1')
        self.assertEqual(by_id['model-text-app-2']['requires'], ['model-text-framework'])

    def test_release_guide_hashes_use_json_encoded_text_not_file_bytes(self):
        files = self.files()
        for name, data in files.items():
            if name.startswith('docs/public/updates/releases/model-text-'):
                record = json.loads(re.search(rb'```release-summary\s*\n(.*?)\n```', data, re.S)[1])
                for guide, digest in record['guideHashes'].items():
                    source = files['docs/public/' + guide]
                    encoded = json.dumps(source.decode(), ensure_ascii=False, separators=(',', ':')).encode()
                    self.assertEqual(hashlib.sha256(encoded).hexdigest(), digest)
                    self.assertNotEqual(hashlib.sha256(source).hexdigest(), digest)

    def test_current_entry_explains_digest_and_composition_corrections(self):
        guide = 'updates/text-cross-version-example-3-r2.md'
        public = REPO / 'docs/public'
        source = (public / guide).read_text()
        self.assertIn('JSON.stringify(source)', source)
        self.assertIn('HANDOFF-SHA256.json', source)
        self.assertIn('app.definition', source)
        self.assertIn('before startup', source)
        self.assertIn('31 tests', source)
        self.assertIn(guide.removeprefix('updates/'), (public / 'updates/index.md').read_text())
        self.assertIn(guide, (public / 'llms.txt').read_text())
        pages = json.loads((public / 'content-manifest.json').read_text())['pages']
        self.assertTrue(any(page['path'] == guide for page in pages))
        frozen = self.files()
        original = 'updates/text-cross-version-example-3.md'
        self.assertEqual((public / original).read_bytes(), frozen['docs/public/' + original])
        for name, data in frozen.items():
            if name.startswith('docs/public/updates/releases/model-text-'):
                self.assertEqual((REPO / name).read_bytes(), data)

    def test_independent_result_preserves_original_notes_logs_and_implementation(self):
        archive = ROOT / 'evidence/independent-v1.tar.gz'
        expected = archive.with_suffix('.gz.sha256').read_text().split()[0]
        self.assertEqual(hashlib.sha256(archive.read_bytes()).hexdigest(), expected)
        with tarfile.open(archive) as result:
            files = {entry.name: result.extractfile(entry).read() for entry in result.getmembers()}
        hashes = json.loads(files['RESULT-SHA256.json'])
        self.assertEqual(set(files), set(hashes) | {'RESULT-SHA256.json'})
        for name, digest in hashes.items():
            self.assertEqual(hashlib.sha256(files[name]).hexdigest(), digest, name)
        original_note = files['ADOPTION.md']
        self.assertIn(b'This documentation inconsistency is unresolved', original_note)
        self.assertTrue((ROOT / 'ADOPTION.md').read_bytes().startswith(original_note))
        for gate in ['test', 'typecheck', 'lint', 'build']:
            self.assertEqual(files[f'test-results/cross-version/final-{gate}.exit'].strip(), b'0')
        self.assertIn(b'31 passed', files['test-results/cross-version/final-test.log'])
        conversation = json.loads(files['conversation.json'])
        self.assertEqual(conversation['threadId'], '01a16e30-e3d0-7fa3-b7aa-f33e5f14c82a')
        for name in ['src/definitions.ts', 'src/documents.ts', 'src/runtime.ts',
                     'src/__tests__/migration-boundaries.test.ts']:
            self.assertIn(name, files)
        self.assertIn('both original values are correct', (ROOT / 'ADOPTION.md').read_text())

    def test_original_acceptance_evidence_is_byte_identical(self):
        protected = json.loads((ROOT / 'evidence/original-evidence-sha256.json').read_text())
        self.assertGreater(len(protected), 0)
        for name, digest in protected.items():
            self.assertEqual(hashlib.sha256((REPO / name).read_bytes()).hexdigest(), digest, name)


if __name__ == '__main__':
    unittest.main()
