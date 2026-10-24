"""Validate and archive only independently supplied inputs; evidence stays outside."""
from pathlib import Path
import hashlib,json,re,subprocess,tarfile
root=Path.cwd()
out=root/'delivery/text-spacing-r2-independent'
consumer=out/'consumer'
manifest=json.loads((consumer/'HANDOFF-SHA256.json').read_text())
for path,digest in manifest.items():
    assert hashlib.sha256((consumer/path).read_bytes()).hexdigest()==digest,path
# App, baseline tests, fixtures, package selection, lockfile and README are exact baseline.
baseline_paths=[p for p in manifest if p.startswith(('src/','test-data/')) or p in
                ['README.md','package.json','yarn.lock','.yarnrc.yml']]
for path in baseline_paths:
    assert (consumer/path).read_bytes()==subprocess.check_output(['git','show',f'HEAD:{path}']),path
package=json.loads((consumer/'package.json').read_text())
assert package['dependencies']['@asyra/preset']=='0.5.8'
assert package['resolutions']['@asyra/preset']=='file:./artifacts/asyra-preset-0.5.8.tgz'
links=0
for p in [consumer/'updates/index.md', *consumer.glob('updates/*-r2.md'),consumer/'updates/sources/index.md']:
    text=p.read_text()
    for link in re.findall(r'\]\(([^)]+)\)',text):
        if '://' in link: continue
        dest=(p.parent/link.split('#')[0]).resolve()
        assert dest.is_relative_to(consumer.resolve()) and dest.exists(),(p,link)
        links+=1
# Handoff excludes new acceptance results, solutions, local history and machine paths.
for path in manifest:
    assert not path.startswith(('.git/','node_modules/','test-results/','evidence/','dist/','.yarn/')),path
    if path.endswith(('.md','.json','.ts','.js','.yml','.py')):
        text=(consumer/path).read_text()
        for forbidden in ['29 tests','29 permanent','29 passing','two expected failures',
                          'Revision 1 completed independent consumer acceptance',
                          'Subsequent independent Text adoption -','/Users/asa/',
                          'old-candidate-regression.log','docs-r2-test.log']:
            assert forbidden not in text,(path,forbidden)
base=json.loads((consumer/'updates/base-artifacts.json').read_text())
model=json.loads((consumer/'updates/model-artifact.json').read_text())
for entry in [*base['packages'],model['to']]:
    assert hashlib.sha256((consumer/'artifacts'/entry['file']).read_bytes()).hexdigest()==entry['sha256']
archive=out/'text-spacing-r2-independent.tar.gz'
with tarfile.open(archive,'w:gz') as tar:
    for path in [*manifest,'HANDOFF-SHA256.json']:
        tar.add(consumer/path,arcname='consumer/'+path,recursive=False)
with tarfile.open(archive) as tar:
    expected={'consumer/'+p for p in [*manifest,'HANDOFF-SHA256.json']}
    assert {m.name for m in tar.getmembers()}==expected
    for path,digest in manifest.items():
        assert hashlib.sha256(tar.extractfile('consumer/'+path).read()).hexdigest()==digest
    validation=out/'validation'
    validation.mkdir(exist_ok=True)
    for member in tar.getmembers():
        assert member.isfile()
        target=validation/member.name
        assert target.resolve().is_relative_to(validation.resolve())
        assert not target.exists()
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(tar.extractfile(member).read())
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
(out/'text-spacing-r2-independent.tar.gz.sha256').write_text(f'{digest}  {archive.name}\n')
for path,digest in json.loads((out/'protected-files.json').read_text()).items():
    assert hashlib.sha256((root/path).read_bytes()).hexdigest()==digest,path
(out/'packaging-verification.txt').write_text(
    f'Validated {len(manifest)+1} archive members, {len(baseline_paths)} exact baseline files, '
    f'{links} active local links, and 20 candidate digests.\n'
    'Baseline package selection is Preset 0.5.8. Current consumer protected files unchanged.\n'
    'No current adoption outputs, solution tests, Git history or machine paths included.\n'
    'Public pinned source copies included; third-party install still needs registry access.\n')
print((out/'packaging-verification.txt').read_text())
print(f'Archive size: {archive.stat().st_size} bytes')
