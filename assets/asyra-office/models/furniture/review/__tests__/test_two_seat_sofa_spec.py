"""Sofa document geometry checks; these do not validate a production mesh."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('chair_math',Path(__file__).with_name('test_work_chair_spec.py'))
chair=importlib.util.module_from_spec(spec);spec.loader.exec_module(chair)


def attachment_witnesses(parts):
    pairs=[('base','back-shell',[0,.21,.20])]
    for suffix,sign in (('--1',-1),('-1',1)):
        pairs.extend([
            ('base','arm'+suffix,[sign*.565,0,.24]),
            ('back-shell','arm'+suffix,[sign*.58,.24,.4]),
            ('base','seat-cushion'+suffix,[sign*.278,-.05,.265]),
            ('seat-cushion'+suffix,'back-cushion'+suffix,[sign*.278,.13,.33]),
            ('back-shell','back-cushion'+suffix,[sign*.278,.20,.55]),
        ])
    for p in parts.values():
        if p['primitive']=='tapered-round-leg':
            pairs.append((p['partId'],'arm--1' if p['topCentre'][0]<0 else 'arm-1',[*p['topCentre'][:2],.075]))
    return pairs


class TwoSeatSofaSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'furniture-model-spec.json').read_text())
        cls.sofa=next(m for m in cls.data['modules'] if m['moduleId']=='two-seat-sofa')
        cls.parts={p['partId']:p for p in cls.sofa['components']}

    def bounds(self,p,axis):
        e=chair.rotated_extent(p,axis)
        return p['centre'][axis]-e,p['centre'][axis]+e

    def test_reference_relationships_and_rounded_contacts(self):
        rear=self.parts['back-shell'];base=self.parts['base']
        self.assertLess(self.bounds(rear,2)[1],.7)
        self.assertLess(self.bounds(rear,2)[0],self.bounds(base,2)[1])
        for suffix in ('--1','-1'):
            back=self.parts['back-cushion'+suffix]
            self.assertAlmostEqual(self.bounds(back,2)[1],.7)
            self.assertLess(self.bounds(back,2)[0],.34)
        for a,b,point in attachment_witnesses(self.parts):
            for name in (a,b):
                if self.parts[name]['primitive']=='rounded-box':
                    self.assertLess(chair.placed_field(point,self.parts[name],[0,0,0]),-1e-5,(a,b,name))

    def test_four_short_grounded_feet_attach_to_arms(self):
        feet=[p for p in self.parts.values() if p['primitive']=='tapered-round-leg']
        self.assertEqual(len(feet),4)
        for foot in feet:
            self.assertEqual(foot['bottomCentre'][2],0)
            self.assertEqual(foot['bottomCentre'][:2],foot['topCentre'][:2])
            arm=self.parts['arm--1' if foot['topCentre'][0]<0 else 'arm-1']
            self.assertAlmostEqual(self.bounds(arm,2)[0],.06)
            point=[*foot['topCentre'][:2],.075]
            self.assertLess(point[2],foot['topCentre'][2]-foot['radius'])
            self.assertLess(chair.placed_field(point,arm,[0,0,0]),0)

    def test_bounds_seat_datums_and_two_divisions(self):
        self.assertEqual(len(self.parts),12)
        for axis,expected in enumerate([(-.675,.675),(-.325,.325),(0,.7)]):
            limits=[self.bounds(p,axis) for p in self.parts.values() if p['primitive']=='rounded-box']
            for p in self.parts.values():
                if p['primitive']=='tapered-round-leg':
                    limits.append((p['bottomCentre'][axis]-(p['bottomWidth']/2 if axis<2 else 0),p['topCentre'][axis]+(p['topWidth']/2 if axis<2 else 0)))
            self.assertAlmostEqual(min(v[0] for v in limits),expected[0])
            self.assertAlmostEqual(max(v[1] for v in limits),expected[1])
        for prefix in ('seat-cushion','back-cushion'):
            left=self.parts[prefix+'--1'];right=self.parts[prefix+'-1']
            self.assertAlmostEqual(self.bounds(right,0)[0]-self.bounds(left,0)[1],.011)
        for datum,suffix in zip(self.sofa['seatDatums'],('--1','-1')):
            self.assertAlmostEqual(self.bounds(self.parts['seat-cushion'+suffix],1)[0],self.bounds(self.parts['base'],1)[0])
            self.assertAlmostEqual(self.bounds(self.parts['seat-cushion'+suffix],2)[1],datum[2])
            self.assertEqual(self.parts['seat-cushion'+suffix]['centre'][:2],datum[:2])

    def test_lod_attachment_margins_and_triangle_headroom(self):
        pairs=attachment_witnesses(self.parts)
        self.assertEqual(len(pairs),15)
        for tier in reversed(self.sofa['lod']['tiers']):
            corner_count,_=chair.helpers.sphere_corner(tier['bevelSegments'],tier['cornerTopology'])
            baseline=8*(12+24*tier['bevelSegments']+8*corner_count)+4*tier['footRadialSegments']*(4*tier['footBevelSegments']+4)
            self.assertLess(baseline,tier['maxTriangles'])
            for a,b,point in pairs:
                for name in (a,b):
                    part=self.parts[name]
                    if part['primitive']=='rounded-box':
                        margin=-chair.placed_field(point,part,[0,0,0]);error=tier['maxSurfaceError']
                        self.assertGreater(margin,.009)
                    else:
                        margin=min(point[2]-part['bottomCentre'][2],part['topCentre'][2]-point[2],part['topWidth']/2)
                        error=tier['maxFootSurfaceError']
                        sample_error=part['topWidth']/2*(1-math.cos(math.pi/tier['footRadialSegments']))+part['radius']*(1-math.cos(math.pi/(4*tier['footBevelSegments'])))
                        self.assertLessEqual(sample_error,error)
                    self.assertGreater(margin,error,(tier['id'],a,b,name))

    def test_other_assets_and_reference_preserved(self):
        others=[m for m in self.data['modules'] if m['moduleId'] not in ('two-seat-sofa','round-coffee-table')]
        self.assertEqual(chair.helpers.digest(others),'5ac4338bb83ce1fa5fd89578c0c3dc9c02d9e2fbf71efb00de7c5cb66fb5b31f')
        self.assertEqual(hashlib.sha256((ROOT/self.sofa['reviewDrawing']).read_bytes()).hexdigest(),'16a16dc1cf5c6ea76944ba12db4267abffc81404147211e957f09b44a83a7a08')

    def test_document_tables_appearance_and_lod(self):
        text=(ROOT/'TWO-SEAT-SOFA-SPEC.md').read_text();seen=set()
        for line in text.splitlines():
            cells=[x.strip() for x in line.split('|')[1:-1]]
            if len(cells)!=5 or cells[0] not in self.parts:continue
            p=self.parts[cells[0]];seen.add(cells[0])
            if 'centre' in p:centre,size=p['centre'],p['size']
            else:
                centre=[(a+b)/2 for a,b in zip(p['bottomCentre'],p['topCentre'])]
                size=[p['topWidth'],p['topWidth'],p['topCentre'][2]]
            expected=[centre,size,[p['radius']],[p.get('rotationXDegrees',0)/1000]]
            for cell,row in zip(cells[1:],expected):
                values=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cell)]
                self.assertEqual(len(values),len(row))
                for a,b in zip(values,row):self.assertAlmostEqual(a,b*1000,places=6)
        self.assertEqual(seen,set(self.parts))
        tier_rows={t['id'].upper():t for t in self.sofa['lod']['tiers']}
        main_seen=set();foot_seen=set()
        for line in text.splitlines():
            cells=[x.strip() for x in line.split('|')[1:-1]]
            if not cells or cells[0] not in tier_rows:continue
            t=tier_rows[cells[0]]
            if len(cells)==6:
                main_seen.add(cells[0])
                self.assertEqual(int(cells[1]),t['bevelSegments'])
                expected_topology='normalized barycentric grid' if t['cornerTopology']=='normalized-barycentric-grid' else 'normalized centre fan'
                self.assertEqual(cells[2],expected_topology)
                self.assertEqual([int(v) for v in cells[3].split('/')],[t['footRadialSegments'],t['footBevelSegments']])
                self.assertEqual(int(cells[4]),t['maxTriangles'])
                self.assertAlmostEqual(float(cells[5].split()[0])/1000,t['maxSurfaceError'])
            elif len(cells)==4:
                foot_seen.add(cells[0])
                corner_count,_=chair.helpers.sphere_corner(t['bevelSegments'],t['cornerTopology'])
                baseline=8*(12+24*t['bevelSegments']+8*corner_count)+4*t['footRadialSegments']*(4*t['footBevelSegments']+4)
                self.assertAlmostEqual(float(cells[1].split()[0])/1000,t['maxFootSurfaceError'])
                self.assertEqual([int(cells[2]),int(cells[3])],[baseline,t['maxTriangles']-baseline])
        self.assertEqual(main_seen,set(tier_rows));self.assertEqual(foot_seen,set(tier_rows))
        self.assertIn('(+/-0.278,0.20,0.55)',text)

        for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',text):
            self.assertTrue((ROOT/target.split('#')[0]).is_file(),target)
        self.assertEqual(self.sofa['sizing']['instanceScaleApplications'],1)
        self.assertFalse(self.sofa['constructionReview']['modelVerified'])
        regions=self.sofa['appearance']['regions']
        self.assertCountEqual([p for r in regions for p in r['parts']],self.parts)
        for r in regions:self.assertIn(r['defaultMaterial'],self.data['materials'])
        for tier in self.sofa['lod']['tiers']:
            _,error=chair.helpers.sphere_corner(tier['bevelSegments'],tier['cornerTopology'])
            self.assertLessEqual(error*.048,tier['maxSurfaceError'])
        self.assertFalse(self.sofa['lod']['verified'])


if __name__=='__main__':unittest.main(verbosity=2)
