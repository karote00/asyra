"""Snack-cabinet assembly contracts; no production model is generated."""
import itertools
import json
import math
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT.parent/'furniture/review/__tests__'))
from test_writing_desk_spec import rounded_field


def bounds(part):
    return ([c-s/2 for c,s in zip(part['centre'],part['size'])],
            [c+s/2 for c,s in zip(part['centre'],part['size'])])


def overlap(a,b):
    lo,hi = bounds(a)
    other_lo,other_hi = bounds(b)
    return [min(hi[i],other_hi[i])-max(lo[i],other_lo[i]) for i in range(3)]


class SnackCabinetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'storage-model-spec.json').read_text())
        cls.cabinet=cls.data['modules'][0]
        cls.parts={p['partId']:p for p in cls.cabinet['components']}

    def test_overall_bounds_and_origin(self):
        boxes=[bounds(p) for p in self.parts.values()]
        lo=[min(b[0][i] for b in boxes) for i in range(3)]
        hi=[max(b[1][i] for b in boxes) for i in range(3)]
        for i,(a,b) in enumerate(zip(lo,hi)):
            self.assertAlmostEqual(b-a,self.cabinet['overallSize'][i])
        for a,b in zip(lo,[-.35,-.208,0]):self.assertAlmostEqual(a,b)
        for a,b in zip(hi,[.35,.17,1]):self.assertAlmostEqual(a,b)
        self.assertAlmostEqual(bounds(self.parts['plinth'])[0][2],0)
        self.assertEqual(self.cabinet['sizing']['origin'],[0,0,0])
        self.assertEqual(self.cabinet['sizing']['applicationCount'],1)
        for target in [(1.4,.567,1.5),(.35,.189,.8)]:
            scale=[t/d for t,d in zip(target,self.cabinet['overallSize'])]
            for i in range(3):self.assertAlmostEqual((hi[i]-lo[i])*scale[i],target[i])
            self.assertEqual(lo[2]*scale[2],0)

    def test_full_width_cap_and_connected_carcass(self):
        p=self.parts
        self.assertAlmostEqual(p['top']['size'][0],self.cabinet['bodySize'][0])
        for side in ['side-left','side-right']:
            self.assertAlmostEqual(bounds(p[side])[1][2],bounds(p['top'])[0][2])
        names=['side-left','side-right','top','bottom','back','plinth','shelf-1','shelf-2']
        adjacency={n:set() for n in names}
        for a,b in itertools.combinations(names,2):
            distances=overlap(p[a],p[b])
            self.assertFalse(all(v>1e-9 for v in distances),f'Unexpected solid overlap: {a}/{b}')
            if min(distances)>=-1e-9 and sum(v>1e-9 for v in distances)>=2:
                adjacency[a].add(b);adjacency[b].add(a)
        seen={names[0]};pending=list(seen)
        while pending:
            for n in adjacency[pending.pop()]-seen:seen.add(n);pending.append(n)
        self.assertEqual(seen,set(names))

    def test_door_clearances_and_no_carcass_intersection(self):
        p=self.parts
        inner_left=bounds(p['side-left'])[1][0]
        inner_right=bounds(p['side-right'])[0][0]
        z0,z1=bounds(p['bottom'])[1][2],bounds(p['shelf-1'])[0][2]
        left_lo,left_hi=bounds(p['door--1']);right_lo,right_hi=bounds(p['door-1'])
        self.assertAlmostEqual(left_lo[0]-inner_left,.002)
        self.assertAlmostEqual(inner_right-right_hi[0],.002)
        self.assertAlmostEqual(right_lo[0]-left_hi[0],.008)
        for name in ['door--1','door-1']:
            lo,hi=bounds(p[name])
            self.assertAlmostEqual(lo[2]-z0,.002)
            self.assertAlmostEqual(z1-hi[2],.002)
            for other in ['side-left','side-right','top','bottom','back','shelf-1','shelf-2']:
                self.assertFalse(all(v>1e-9 for v in overlap(p[name],p[other])),name+'/'+other)

    def test_open_compartments_are_real_voids(self):
        p=self.parts;c=self.cabinet['compartments']
        expected=[(bounds(p['shelf-1'])[1][2],bounds(p['shelf-2'])[0][2]),
                  (bounds(p['shelf-2'])[1][2],bounds(p['top'])[0][2])]
        for actual,target in zip(c['clearIntervalsZ'],expected):
            for a,b in zip(actual,target):self.assertAlmostEqual(a,b)
        self.assertAlmostEqual(c['clearWidth'],bounds(p['side-right'])[0][0]-bounds(p['side-left'])[1][0])
        self.assertAlmostEqual(c['clearDepth'],bounds(p['back'])[0][1]+.17)
        for z0,z1 in expected:
            for point in itertools.product([-.32,0,.32],[-.169,0,.151],[z0+.001,(z0+z1)/2,z1-.001]):
                for part in p.values():
                    lo,hi=bounds(part)
                    self.assertFalse(all(a<q<b for q,a,b in zip(point,lo,hi)),f'Blocked cavity: {part["partId"]}')

    def test_recess_depth_frame_and_mount_connections(self):
        p=self.parts
        for suffix in ['-1','1']:
            door=p['door-'+suffix];r=door['recess'];front=bounds(door)[0][1]
            self.assertAlmostEqual((door['size'][0]-r['width'])/2,.03)
            self.assertAlmostEqual((door['size'][2]-r['height'])/2,.03)
            self.assertAlmostEqual(door['size'][1]-r['depth'],.016)
            self.assertAlmostEqual(r['floorSize'][0],r['width']-2*r['transition'])
            self.assertAlmostEqual(r['floorSize'][1],r['height']-2*r['transition'])
            self.assertAlmostEqual(r['slopeDegrees'],math.degrees(math.atan(r['depth']/r['transition'])))
            handle=p['handle-'+suffix]
            for height in ['-1','1']:
                mount=p['handle-mount-'+suffix+'-'+height]
                self.assertAlmostEqual(bounds(mount)[1][1],front)
                self.assertEqual(mount['flatContactFace'],'+Y')
                for axis,extent in zip([0,2],mount['contactPatchSize']):
                    self.assertAlmostEqual(extent,mount['size'][axis]-2*mount['radius'])
                contact=[mount['centre'][0],front,mount['centre'][2]]
                self.assertAlmostEqual(rounded_field(contact,mount['centre'],mount['size'],mount['radius']),0)
                sample=[mount['centre'][0],-.190,mount['centre'][2]]
                self.assertLess(rounded_field(sample,handle['centre'],handle['size'],handle['radius']),0)
                # Full rounded-box field is conservative for the flat contact variant.
                self.assertLess(rounded_field(sample,mount['centre'],mount['size'],mount['radius']),0)
                x=mount['centre'][0];half=mount['size'][0]/2
                field_min=door['centre'][0]-r['width']/2
                field_max=door['centre'][0]+r['width']/2
                self.assertTrue(x+half<=field_min+1e-9 or x-half>=field_max-1e-9)

    def test_regions_lod_and_document_contract(self):
        c=self.cabinet
        self.assertFalse(c['constructionReview']['modelVerified'])
        self.assertEqual(c['constructionReview']['outputSolidCount'],5)
        self.assertLess(c['constructionReview']['gapTolerance'],min(c['constructionReview']['doorGaps'].values()))
        self.assertLess(c['constructionReview']['mountContactTolerance'],c['constructionReview']['gapTolerance'])
        for part in c['components']:
            appearance=c['appearance']['parts'][part['partId']]
            self.assertEqual(appearance['defaultMaterial'],part['material'])
            self.assertEqual(appearance['defaultColorSRGB'],self.data['materials'][part['material']]['baseColorSRGB'])
        self.assertEqual(c['appearance']['colorFallback'],'selected material color')
        for tier in c['lod']['tiers']:
            self.assertIsNone(tier['actualTriangleCount'])
            self.assertFalse(tier['verified'])
        doc=(ROOT/'SNACK-CABINET-SPEC.md').read_text()
        for target in re.findall(r'\[[^]]+\]\(([^)]+)\)',doc):self.assertTrue((ROOT/target.split('#')[0]).exists(),target)
        for part in c['components']:
            row=next(line for line in doc.splitlines() if re.match(r'\|\s*'+re.escape(part['partId'])+r'\s*\|',line))
            cells=[v.strip() for v in row.split('|')[1:-1]]
            for text,values in [(cells[1],part['size']),(cells[2],part['centre'])]:
                numbers=[float(v.strip())/1000 for v in text.split(',')]
                for a,b in zip(numbers,values):self.assertAlmostEqual(a,b)


if __name__=='__main__':unittest.main(verbosity=2)
