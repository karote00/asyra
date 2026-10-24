"""Work-chair numeric document checks, not production mesh validation."""
import copy
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]
loader=importlib.util.spec_from_file_location('desk_document_math',Path(__file__).with_name('test_writing_desk_spec.py'))
helpers=importlib.util.module_from_spec(loader);loader.loader.exec_module(helpers)


def rotated_extent(part,axis):
    a=math.radians(part.get('rotationXDegrees',0));c,s=math.cos(a),math.sin(a)
    h=[v/2-part['radius'] for v in part['size']];r=part['radius']
    return h[0]+r if axis==0 else (abs(c)*h[1]+abs(s)*h[2]+r if axis==1 else abs(s)*h[1]+abs(c)*h[2]+r)


def assembly_shift(chair):
    rule=chair['normalizeBackAssembly'];parts=[p for p in chair['components'] if p['partId'] in rule['parts']]
    return [0,rule['targetRearY']-max(p['centre'][1]+rotated_extent(p,1) for p in parts),rule['targetTopZ']-max(p['centre'][2]+rotated_extent(p,2) for p in parts)]


def placed_field(point,part,shift):
    q=[x-c-t for x,c,t in zip(point,part['centre'],shift)]
    angle=math.radians(part.get('rotationXDegrees',0));c,s=math.cos(angle),math.sin(angle)
    local=[q[0],c*q[1]+s*q[2],-s*q[1]+c*q[2]]
    return helpers.rounded_field(local,[0,0,0],part['size'],part['radius'])


class WorkChairSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'furniture-model-spec.json').read_text())
        cls.chair=next(m for m in cls.data['modules'] if m['moduleId']=='work-chair')
        cls.parts={p['partId']:p for p in cls.chair['components']};cls.shift=assembly_shift(cls.chair)

    def test_preservation(self):
        keys=('moduleId','name','reviewDrawing','size','components','seatDatum','source','hiddenDecisions','unitCount','normalizeBackAssembly')
        preserved=copy.deepcopy({k:self.chair[k] for k in keys})
        for p in preserved['components']:
            if p['partId'].startswith('back-post'):
                p['centre'][1:]=[.17,.4];p['size'][2]=.34
        self.assertEqual(helpers.digest(preserved),'20bd52c4cfdbe262630bafed5236c8bfd5ac22e3ee9846d36b89bad0bb1a9de3')
        self.assertEqual(helpers.digest([m for m in self.data['modules'] if m['moduleId']!='work-chair']),'5cf80993767479643050c2b77fd741033b1651c6469999de1f5a088cdfdd75db')
        self.assertEqual(hashlib.sha256((ROOT/self.chair['reviewDrawing']).read_bytes()).hexdigest(),'4cdf9460313c15887e8339d7ba83caa04ec218d2fa410ae09aa67faa51dff53b')

    def test_rounded_support_normalization(self):
        self.assertAlmostEqual(self.shift[1],.01918884921475039)
        self.assertAlmostEqual(self.shift[2],.0037677843499519525)
        parts=[self.parts[id] for id in self.chair['normalizeBackAssembly']['parts']]
        self.assertAlmostEqual(max(p['centre'][1]+self.shift[1]+rotated_extent(p,1) for p in parts),.24)
        self.assertAlmostEqual(max(p['centre'][2]+self.shift[2]+rotated_extent(p,2) for p in parts),.7)
        self.assertEqual(self.chair['constructionReview']['boundsAuthority'],'ideal-rounded-surface-support')
        # Rotating the unrounded box produces a different translation.
        p=self.parts['backrest'];a=math.radians(-7)
        wrong=.24-(p['centre'][1]+abs(math.cos(a))*p['size'][1]/2+abs(math.sin(a))*p['size'][2]/2)
        self.assertGreater(abs(wrong-self.shift[1]),.003)

    def test_back_posts_overlap_both_seat_and_backrest(self):
        for name in ('back-post--1','back-post-1'):
            post=self.parts[name];x=post['centre'][0]
            for point,target in [([x,.174,.320],'seat'),([x,.200,.500],'backrest')]:
                self.assertLess(placed_field(point,post,self.shift),0)
                self.assertLess(placed_field(point,self.parts[target],self.shift if target=='backrest' else [0,0,0]),0)
            low=post['centre'][2]+self.shift[2]-rotated_extent(post,2)
            self.assertAlmostEqual(low,.29)

    def test_back_posts_end_at_seat_bottom_without_dangling_stubs(self):
        # Reference BACK shows posts stopping at the seat lower edge, not below it.
        seat_bottom=self.parts['seat']['centre'][2]-self.parts['seat']['size'][2]/2
        for name in ('back-post--1','back-post-1'):
            post=self.parts[name]
            low=post['centre'][2]+self.shift[2]-rotated_extent(post,2)
            high=post['centre'][2]+self.shift[2]+rotated_extent(post,2)
            self.assertAlmostEqual(low,seat_bottom,places=9)
            self.assertAlmostEqual(high,.5734979464212939,places=9)
            # Keep the original upper local-axis endpoint, not only its Z bound.
            angle=math.radians(post['rotationXDegrees'])
            for axis,factor in ((1,-math.sin(angle)),(2,math.cos(angle))):
                self.assertAlmostEqual(post['centre'][axis]+factor*post['size'][2]/2,
                    [.0,.17,.4][axis]+factor*.34/2,places=9)

    def test_four_vertical_round_legs_and_seat(self):
        self.assertEqual(len(self.parts),8)
        legs=[p for p in self.parts.values() if p['primitive']=='tapered-round-leg'];self.assertEqual(len(legs),4)
        seat=self.parts['seat']
        self.assertEqual(self.chair['seatDatum'],[0,-.02,.36])
        self.assertAlmostEqual(seat['centre'][2]+seat['size'][2]/2,.36)
        for p in legs:
            self.assertEqual(p['bottomCentre'][:2],p['topCentre'][:2]);self.assertEqual(p['bottomCentre'][2],0)
            self.assertEqual(p['topWidth'],p['bottomWidth']);self.assertEqual(p['topWidth'],.025)
            point=[*p['topCentre'][:2],.297]
            self.assertLess(placed_field(point,seat,[0,0,0]),0)
            self.assertLess(point[2],p['topCentre'][2]-p['radius'])

    def test_sizing_appearance_and_lod(self):
        self.assertEqual(self.chair['size'],[.42,.46,.7])
        self.assertEqual(self.chair['sizing']['instanceScaleApplications'],1)
        self.assertEqual(self.chair['sizing']['invalidExtentPolicy'],'reject')
        self.assertFalse(self.chair['constructionReview']['modelVerified'])
        a=self.chair['appearance'];self.assertFalse(a['bakedLighting']);self.assertTrue(a['independentInstanceOverrides'])
        self.assertCountEqual([p for r in a['regions'] for p in r['parts']],self.parts)
        for r in a['regions']:self.assertIn(r['defaultMaterial'],self.data['materials'])
        self.assertFalse(self.chair['lod']['verified'])
        for tier in self.chair['lod']['tiers']:
            for name in ('seat','backrest'):
                count,error=helpers.sphere_corner(tier['cushionBevelSegments'],tier['cushionCornerTopology'])
                self.assertLessEqual(error*self.parts[name]['radius'],tier['maxSurfaceError'])
            angular=.0125*(1-math.cos(math.pi/tier['legRadialSegments']))
            bevel=.002*(1-math.cos(math.pi/(4*tier['legBevelSegments'])))
            self.assertLessEqual(angular+bevel,tier['maxSurfaceError'])

    def test_component_and_lod_tables(self):
        text=(ROOT/'WORK-CHAIR-SPEC.md').read_text()
        self.assertIn('`zOld=c0Z+tZ-(abs(sin(a))*hY+cos(a)*(L0/2-r)+r)`',text)
        seen=set();tiers={t['id'].upper():t for t in self.chair['lod']['tiers']}
        for line in text.splitlines():
            cells=[c.strip() for c in line.split('|')[1:-1]]
            if len(cells)==5 and cells[0] in self.parts:
                p=self.parts[cells[0]];seen.add(cells[0])
                if 'centre' in p:centre,size=p['centre'],p['size']
                else:centre=[(a+b)/2 for a,b in zip(p['bottomCentre'],p['topCentre'])];size=[p['topWidth'],p['topWidth'],p['topCentre'][2]-p['bottomCentre'][2]]
                values=[[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cell)] for cell in cells[1:]]
                expected=[[v*1000 for v in centre],[v*1000 for v in size],[p['radius']*1000],[p.get('rotationXDegrees',0)]]
                for actual_row,expected_row in zip(values,expected):
                    self.assertEqual(len(actual_row),len(expected_row))
                    for actual,wanted in zip(actual_row,expected_row):self.assertAlmostEqual(actual,wanted,places=6)
            if len(cells)==4 and cells[0] in tiers:
                tier=tiers[cells[0]];self.assertEqual([float(v) for v in cells[1:]],[tier['cushionBevelSegments'],tier['maxTriangles'],tier['maxSurfaceError']])
        self.assertEqual(seen,set(self.parts))

    def test_links(self):
        file=ROOT/'WORK-CHAIR-SPEC.md'
        for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',file.read_text()):
            if '://' not in target:self.assertTrue((file.parent/target.split('#')[0]).is_file(),target)


if __name__=='__main__':unittest.main(verbosity=2)
