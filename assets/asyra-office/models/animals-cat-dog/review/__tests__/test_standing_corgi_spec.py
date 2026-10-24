"""Corgi document checks. Analytic samples do not certify a rendered mesh."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import struct
import unittest

ROOT=Path(__file__).resolve().parents[2]
loader=importlib.util.spec_from_file_location('cat_numeric_helpers',Path(__file__).with_name('test_sleeping_cat_spec.py'))
helpers=importlib.util.module_from_spec(loader)
loader.loader.exec_module(helpers)


def surface_points(part):
    for i in range(25):
        theta=math.pi*i/24
        for j in range(48):
            phi=math.tau*j/48
            yield [part[1][0]+part[2][0]*math.sin(theta)*math.cos(phi),part[1][1]+part[2][1]*math.sin(theta)*math.sin(phi),part[1][2]+part[2][2]*math.cos(theta)]


def front_y(part,x,z):
    q=1-((x-part[1][0])/part[2][0])**2-((z-part[1][2])/part[2][2])**2
    return part[1][1]-part[2][1]*math.sqrt(q) if q>0 else math.inf


def first_ellipsoid_hit(parts,x,z):
    return min((front_y(part,x,z),part[0]) for part in parts)


class StandingCorgiSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.batch=json.loads((ROOT/'animals-model-spec.json').read_text())
        cls.dog=next(a for a in cls.batch['animals'] if a['id']=='standing-corgi')
        cls.parts={p[0]:p for p in cls.dog['ellipsoids']}

    def test_reference_and_cat_preservation(self):
        record=self.dog['review'];data=(ROOT/record['reference']).read_bytes()
        self.assertEqual(hashlib.sha256(data).hexdigest(),record['referenceSHA256'])
        self.assertEqual(list(struct.unpack('>II',data[16:24])),record['imagePixels'])
        cat=next(a for a in self.batch['animals'] if a['id']=='sleeping-orange-cat')
        self.assertEqual(hashlib.sha256(json.dumps(cat,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'41984ee63486c9fbcf0e533c5ce9aa93d3804c3e469d6aacab13e946512e01e3')
        self.assertFalse(record['modelVerified'])

    def test_size_and_transform_contract(self):
        self.assertEqual(self.dog['finalSize'],[.32,.62,.48])
        sizing=self.dog['sizing']
        self.assertTrue(sizing['includeSeparateNoseInBounds'])
        self.assertEqual(sizing['instanceScaleApplications'],1)
        self.assertEqual(sizing['invalidExtentPolicy'],'reject')
        self.assertEqual(sizing['defaultBoundsSource'],'complete-default-surface-including-nose')

    def test_component_counts_and_mirror_pairs(self):
        self.assertEqual(len(self.parts),12)
        self.assertEqual(sum('paw' in p for p in self.parts),4)
        self.assertEqual(sum('leg' in p for p in self.parts),4)
        self.assertEqual(len(self.dog['ears']),2)
        for stem in ('front-leg','front-paw','hind-leg','hind-paw'):
            left,right=self.parts[stem+'--1'],self.parts[stem+'-1']
            self.assertEqual([-left[1][0],*left[1][1:]],right[1]);self.assertEqual(left[2],right[2])
        for a,b in zip(self.dog['ears'][0]['rings'],self.dog['ears'][1]['rings']):self.assertEqual([-a[0],*a[1:]],b)

    def test_positive_volume_joins(self):
        pairs=[('chest','torso'),('head','chest'),('muzzle','head')]
        for side in ('-1','1'):
            pairs.extend([(f'front-leg-{side}','chest'),(f'hind-leg-{side}','torso'),
                          (f'front-paw-{side}',f'front-leg-{side}'),(f'hind-paw-{side}',f'hind-leg-{side}')])
        for child,parent in pairs:
            self.assertLess(min(helpers.ellipsoid_value(p,self.parts[parent]) for p in surface_points(self.parts[child])),1,child+' / '+parent)
        for ear in self.dog['ears']:
            rows=ear['rings'];self.assertTrue(all(a[2]<b[2] for a,b in zip(rows,rows[1:])))
            self.assertTrue(all(min(r[3:])>0 for r in rows))
            self.assertLess(helpers.ellipsoid_value(rows[0][:3],self.parts['head']),1)

    def test_standing_paws_share_ground_plane(self):
        for name,part in self.parts.items():
            bottom=part[1][2]-part[2][2]
            self.assertGreaterEqual(bottom,0,name)
            if 'paw' in name:self.assertAlmostEqual(bottom,0,msg=name)
        self.assertFalse(self.dog['pawUndersides']['pads'])
        self.assertFalse(self.dog['pawUndersides']['toeGrooves'])

    def test_nose_embeds_in_muzzle_and_remains_visible(self):
        nose=self.dog['nose'];muzzle=self.parts['muzzle']
        back=[nose['centre'][0],nose['centre'][1]+nose['radii'][1],nose['centre'][2]]
        front=[nose['centre'][0],nose['centre'][1]-nose['radii'][1],nose['centre'][2]]
        self.assertLess(helpers.ellipsoid_value(back,muzzle),1)
        self.assertGreater(helpers.ellipsoid_value(front,muzzle),1)
        self.assertEqual(self.dog['noseConstruction']['kind'],'separate-closed-ellipsoid')
        self.assertFalse(self.dog['noseConstruction']['bakedGraphic'])

    def test_eye_projection_accounts_for_muzzle_occlusion(self):
        policy=self.dog['facialProjection']
        self.assertEqual(policy['invalidDomainPolicy'],'reject')
        self.assertEqual(policy['allowedOwners'],['head','muzzle'])
        self.assertEqual(policy['unionHit'],'frontmost-allowed-owner')
        for cx,cz in self.dog['eyes']['centresXZ']:
            for ring in (0,.25,.5,.75,1):
                for j in range(128):
                    phi=math.tau*j/128
                    x=cx+ring*self.dog['eyes']['radiiXZ'][0]*math.cos(phi)
                    z=cz+ring*self.dog['eyes']['radiiXZ'][1]*math.sin(phi)
                    self.assertTrue(math.isfinite(helpers.head_front(self.parts['head'],x,z)))
                    y,owner=first_ellipsoid_hit(list(self.parts.values()),x,z)
                    self.assertTrue(math.isfinite(y));self.assertIn(owner,policy['allowedOwners'])
        # A head-only rule would paint behind the muzzle at the lower eye.
        x,z=.053,.292
        self.assertEqual(first_ellipsoid_hit(list(self.parts.values()),x,z)[1],'muzzle')
        self.assertLess(front_y(self.parts['muzzle'],x,z),front_y(self.parts['head'],x,z)-.018)
        with self.assertRaises(ValueError):helpers.head_front(self.parts['head'],1,.309)

    def test_tail_is_connected_and_centred(self):
        tail=self.dog['tail'];self.assertEqual(len(tail['centres']),len(tail['radii']))
        samples=helpers.tail_samples(tail,self.batch['construction']['tailSamplesPerSpan'])
        self.assertEqual(len(samples),65)
        self.assertLess(helpers.ellipsoid_value(samples[0][0],self.parts['torso']),1)
        for p,r in samples:
            self.assertAlmostEqual(p[0],0);self.assertGreater(r,0)
        for (a,ra),(b,rb) in zip(samples,samples[1:]):
            self.assertGreater(math.dist(a,b),0);self.assertLess(math.dist(a,b),min(ra,rb))

    def test_reference_side_label_maps_to_left_without_mirroring_model(self):
        mapping=self.dog['review']['sourceViewMapping']
        self.assertEqual(mapping['RIGHT']['canonicalView'],'LEFT')
        self.assertEqual(mapping['RIGHT']['lookDirection'],[1,0,0])
        self.assertEqual(mapping['RIGHT']['screenUp'],[0,0,1])
        self.assertEqual(mapping['RIGHT THREE-QUARTER']['canonicalView'],'FRONT-LEFT THREE-QUARTER')
        self.assertFalse(mapping['mirrorGeometry'])

    def test_appearance_regions_and_lod(self):
        appearance=self.dog['appearance'];self.assertFalse(appearance['bakedLighting'])
        self.assertTrue(appearance['independentInstanceOverrides'])
        ids=[r['id'] for r in appearance['regions']];self.assertEqual(len(set(ids)),len(ids))
        self.assertEqual(set(ids),{'orange-coat','cream-coat','ear-interiors','eyes','nose'})
        for region in appearance['regions']:self.assertIn(region['defaultMaterial'],self.batch['palette'])
        tiers=self.dog['lod']['tiers'];self.assertEqual([t['id'] for t in tiers],['lod0','lod1','lod2'])
        self.assertEqual([t['maxTriangles'] for t in tiers],[12000,6000,2000])
        self.assertEqual([t['maxSurfaceError'] for t in tiers],[.001,.002,.004])
        self.assertFalse(self.dog['lod']['verified'])

    def test_document_tables_match_dimensions(self):
        text=(ROOT/'STANDING-CORGI-SPEC.md').read_text();seen=set()
        records={**self.parts,'nose':['nose',self.dog['nose']['centre'],self.dog['nose']['radii']]}
        for line in text.splitlines():
            cells=[c.strip().strip('`') for c in line.split('|')[1:-1]]
            if len(cells)!=3 or cells[0] not in records:continue
            part=records[cells[0]];seen.add(cells[0])
            values=[[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cell)] for cell in cells[1:]]
            self.assertEqual(values[0],[round(v*1000,9) for v in part[1]])
            self.assertEqual(values[1],[round(v*2000,9) for v in part[2]])
        self.assertEqual(seen,set(records))

    def test_ear_tail_and_lod_tables_match_numeric_specification(self):
        text=(ROOT/'STANDING-CORGI-SPEC.md').read_text()
        sections=(
            ('| Ear row', next(ear['rings'] for ear in self.dog['ears'] if ear['rings'][0][0]>0), 'ear'),
            ('| Control', list(zip(self.dog['tail']['centres'],self.dog['tail']['radii'])), 'tail'),
            ('| LOD', self.dog['lod']['tiers'], 'lod'),
        )
        for heading,records,kind in sections:
            table=text[text.index(heading):].split('\n\n',1)[0].splitlines()[2:]
            self.assertEqual(len(table),len(records),kind)
            for line,record in zip(table,records):
                cells=[c.strip() for c in line.split('|')[1:-1]]
                values=[[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cell)] for cell in cells[1:]]
                if kind=='ear':expected=[[round(v*1000,9) for v in record[:3]],[round(v*1000,9) for v in record[3:]]]
                elif kind=='tail':expected=[[round(v*1000,9) for v in record[0]],[round(record[1]*1000,9)]]
                else:
                    self.assertEqual(cells[0].lower(),record['id'])
                    expected=[[record['maxTriangles']],[record['maxSurfaceError']]]
                self.assertEqual(values,expected,kind)

    def test_links_and_finite_data(self):
        for name in ('README.md','GEOMETRY-SUPPLEMENT.md','SURFACE-RECIPES.md','STANDING-CORGI-SPEC.md','review/README.md'):
            file=ROOT/name
            for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',file.read_text()):
                if '://' not in target and not target.startswith('#'):self.assertTrue((file.parent/target.split('#')[0]).is_file(),target)
        def walk(value):
            if isinstance(value,dict):
                for child in value.values():walk(child)
            elif isinstance(value,list):
                for child in value:walk(child)
            elif isinstance(value,(int,float)):self.assertTrue(math.isfinite(value))
        walk(self.dog)


if __name__=='__main__':unittest.main(verbosity=2)
