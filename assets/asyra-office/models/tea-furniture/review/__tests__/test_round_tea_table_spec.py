"""Tea-table document geometry proofs; no production model is generated."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]

def load(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT.parent/'furniture/review/__tests__'/file)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

coffee=load('coffee_math','test_coffee_table_spec.py')
desk=load('desk_math','test_writing_desk_spec.py')
BASELINE={'chair': '7dba90b152ef4be60cf1c13e7aa43ed7c44c96c4e617e2153a1fcbef4d926077', 'materials': '9b195b33385396b9bedda5a08df81c563deeecf12ce58925638deec3c839fa79', 'top': 'e18ccd61feaf4cc37cb4037922992574e16e08b5cbf61060baac01bf41c8db63', 'images': {'01-round-tea-table-v1.png': 'a8e530fab320ba3eda3a34226a4fe2495e0824c66cbef529399c4b4507db9f46', '02-tea-chair-v1.png': '91665a295c1d3748fd7ea32b2089440ff421fb91cdf9bc359a2bec02f8d8ac80'}}


def legs(group):
    return [dict(bottomCentre=p['bottom'],topCentre=p['top'],bottomWidth=2*group['bottomRadius'],topWidth=2*group['topRadius'],radius=group['edgeBevel']) for p in group['endCentres']]


def rail_field(point,group,index):
    return desk.rounded_field(point,group['centres'][index],group['size'],group['bevel'])


def top_field(point,top):
    return desk.rounded_field([math.hypot(*point[:2]),0,point[2]],
                              [0,0,(top['zMin']+top['zMax'])/2],
                              [2*top['radius'],2*top['radius'],top['zMax']-top['zMin']],top['bevel'])


class RoundTeaTableSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'tea-furniture-model-spec.json').read_text())
        cls.table=cls.data['modules'][0];cls.p={p['partId']:p for p in cls.table['components']}

    def test_contact_only_dimensions_are_replaced(self):
        for name in ('apron-front-back','apron-sides'):
            rail=self.p[name]
            self.assertGreater(rail['centres'][0][2]+rail['size'][2]/2,self.p['top']['zMin'])
        self.assertGreater(self.p['apron-sides']['size'][1]/2,.17)
        for leg in legs(self.p['legs']):
            self.assertGreater(leg['topCentre'][2],self.p['top']['zMin'])

    def test_twenty_joints_have_interior_witnesses(self):
        top=self.p['top'];front=self.p['apron-front-back'];side=self.p['apron-sides']
        for group in (front,side):
            for i,c in enumerate(group['centres']):
                w=[*c[:2],.55]
                self.assertLess(rail_field(w,group,i),-.004)
                self.assertLess(top_field(w,top),-.004)
        for i,leg in enumerate(legs(self.p['legs'])):
            sx,sy=self.p['legs']['signPairs'][i]
            h,r0,r1,b,k,q,centres=coffee.leg_profile(leg)
            def center(z):return [a+(v-a)*z/h for a,v in zip(leg['bottomCentre'][:2],leg['topCentre'][:2])]
            self.assertLess(top_field([*center(.55),.55],top),-.004)
            self.assertGreater((h-.55)/coffee.shear_norm(leg),.004)
            # Both neighboring rails overlap each leg, below the rim bands.
            c=center(.52)
            for group,index,point in [(front,0 if sy<0 else 1,[c[0],sy*.179,.52]),(side,0 if sx<0 else 1,[sx*.179,c[1],.52])]:
                self.assertLess(rail_field(point,group,index),-.005)
                self.assertGreater(((r0+k*.52)-math.dist(point[:2],c))/q/coffee.shear_norm(leg),.005)
            w=[sx*.1825,sy*.1725,.52]
            self.assertLess(rail_field(w,front,0 if sy<0 else 1),-.0024)
            self.assertLess(rail_field(w,side,0 if sx<0 else 1),-.0024)

    def test_feet_flat_taper_tangent_and_overall_bounds(self):
        group=self.p['legs'];self.assertEqual(len(group['endCentres']),4)
        for (sx,sy),leg in zip(group['signPairs'],legs(group)):
            self.assertEqual(leg['bottomCentre'],[sx*.22,sy*.22,0])
            self.assertEqual(leg['topCentre'],[sx*.16,sy*.16,.555])
            h,r0,r1,b,k,q,centres=coffee.leg_profile(leg)
            alpha=-math.atan(k)
            for rc,zc in centres:
                self.assertAlmostEqual((r0+k*zc-rc)/q,b)
                radial=rc+b*math.cos(alpha);z=zc+b*math.sin(alpha)
                self.assertAlmostEqual(radial,r0+k*z)
                self.assertAlmostEqual(-math.tan(alpha),k)
                self.assertGreater(rc,0)
            self.assertAlmostEqual(centres[0][1]-b,0)
            self.assertAlmostEqual(centres[1][1]+b,h)
            self.assertLess(math.hypot(.22,.22)+r1,.334)
        self.assertEqual(self.table['overallSize'],[.68,.68,.58])
        self.assertEqual(self.p['top']['radius'],.34)
        self.assertEqual(self.p['top']['zMax'],.58)

    def test_frame_void_and_region_contract(self):
        for z in (.485,.52,.555):
            for name in ('apron-front-back','apron-sides'):
                for i in (0,1):self.assertGreater(rail_field([0,0,z],self.p[name],i),.16)
        self.assertEqual(self.table['constructionReview']['logicalPartCount'],9)
        self.assertEqual(self.table['constructionReview']['closedComponentCount'],6)
        self.assertEqual(len(self.table['appearance']['regions']),9)
        owners=[(r['part'],r.get('index')) for r in self.table['appearance']['regions']]
        self.assertCountEqual(owners,[('top',None)]+[(name,i) for name in ('apron-front-back','apron-sides') for i in (0,1)]+[('legs',i) for i in range(4)])
        self.assertEqual(self.table['sizing']['instanceScaleApplications'],1)
        self.assertFalse(self.table['constructionReview']['modelVerified'])

    def test_lod_error_bounds_and_pre_union_counts(self):
        for t in self.table['lod']['tiers']:
            n=t['topRadialSegments'];m=t['rimSegments'];ln=t['legRadialSegments'];rn=t['railCornerSegments']
            self.assertEqual(n%4,0)
            count=(n+4*ln)*(4*m+4)+4*(12+24*rn+8*rn*rn)
            self.assertEqual(count,t['preUnionTriangles']);self.assertLess(count,t['maxTriangles'])
            top_error=.34*(1-math.cos(math.pi/n))+.006*(1-math.cos(math.pi/(4*m)))
            self.assertLessEqual(top_error,t['maxTopSurfaceError'])
            _,box_error=desk.sphere_corner(rn,'normalized-barycentric-grid')
            self.assertLessEqual(.002*box_error,t['maxRailSurfaceError'])
            for leg in legs(self.p['legs']):
                h,r0,r1,b,k,q,centres=coffee.leg_profile(leg)
                angle=math.pi/2+math.atan(k)
                error=coffee.shear_norm(leg)*(r1*(1-math.cos(math.pi/ln))+b*(1-math.cos(angle/(2*m))))
                self.assertLessEqual(error,t['maxLegSurfaceError'])
            self.assertLess(t['maxRailSurfaceError'],.0024)
            self.assertLess(t['maxTopSurfaceError'],.004)
            self.assertLess(t['maxLegSurfaceError'],.004)

    def test_document_tables_and_links(self):
        doc=(ROOT/'ROUND-TEA-TABLE-SPEC.md').read_text()
        for path in re.findall(r'\]\(([^)#]+)(?:#[^)]*)?\)',doc):
            if '://' not in path:self.assertTrue((ROOT/path).exists(),path)
        for t in self.table['lod']['tiers']:
            row=next(s for s in doc.splitlines() if re.match(r'\|\s*'+t['id'].upper()+r'\s*\|',s))
            cells=[s.strip() for s in row.split('|')[1:-1]]
            self.assertEqual(list(map(float,cells[1:])),[t['topRadialSegments'],t['legRadialSegments'],t['rimSegments'],t['railCornerSegments'],t['preUnionTriangles'],t['maxTriangles'],t['maxTopSurfaceError']*1000,t['maxLegSurfaceError']*1000,t['maxRailSurfaceError']*1000])
        for name in ('apron-front-back','apron-sides'):
            row=next(s for s in doc.splitlines() if re.match(r'\|\s*'+name+r'\s*\|',s))
            cells=[s.strip() for s in row.split('|')[1:-1]]
            self.assertEqual(list(map(float,cells[1].split(','))),[v*1000 for v in self.p[name]['size']])
            points=re.findall(r'\(([^)]+)\)',cells[2])
            self.assertEqual(len(points),2)
            for text,centre in zip(points,self.p[name]['centres']):
                self.assertEqual(list(map(float,text.split(','))),[v*1000 for v in centre])
            self.assertEqual(float(cells[3]),self.p[name]['bevel']*1000)
        for i,leg in enumerate(legs(self.p['legs'])):
            row=next(s for s in doc.splitlines() if re.match(r'\|\s*'+str(i)+r'\s*\|',s))
            cells=[s.strip() for s in row.split('|')[1:-1]]
            self.assertEqual(list(map(int,cells[1].split(','))),self.p['legs']['signPairs'][i])
            for cell,point in zip(cells[2:],[leg['bottomCentre'],leg['topCentre']]):
                self.assertEqual(list(map(float,cell.split(','))),[v*1000 for v in point])
        h,r0,r1,b,k,q,c=coffee.leg_profile(legs(self.p['legs'])[0])
        self.assertTrue(f'{2*c[0][0]*1000:.6f}/{2*c[1][0]*1000:.6f} mm' in doc,'Flat cap diameters must match the tangent profile.')

    def test_unrelated_chair_palette_and_references_preserved(self):
        # The chair has its own current review; retain the approved chair source image.
        self.assertEqual(hashlib.sha256((ROOT/'review/02-tea-chair-v1.png').read_bytes()).hexdigest(),BASELINE['images']['02-tea-chair-v1.png'])
        self.assertEqual(coffee.digest(self.data['materials']),BASELINE['materials'])
        self.assertEqual(coffee.digest(self.p['top']),BASELINE['top'])
        for name,digest in BASELINE['images'].items():
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),digest)


if __name__=='__main__':unittest.main(verbosity=2)
