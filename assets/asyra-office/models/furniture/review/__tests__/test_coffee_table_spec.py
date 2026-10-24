"""Coffee-table document geometry and sampling proofs, not mesh acceptance."""
import hashlib
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]


def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def leg_profile(leg):
    h=leg['topCentre'][2];r0=leg['bottomWidth']/2;r1=leg['topWidth']/2;b=leg['radius']
    k=(r1-r0)/h;q=math.sqrt(1+k*k)
    return h,r0,r1,b,k,q,[(r0+k*b-b*q,b),(r1-k*b-b*q,h-b)]


def shear_norm(leg):
    h=leg['topCentre'][2];s=math.dist(leg['bottomCentre'][:2],leg['topCentre'][:2])/h
    return (math.sqrt(4+s*s)+s)/2


class CoffeeTableSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'furniture-model-spec.json').read_text())
        cls.table=next(m for m in cls.data['modules'] if m['moduleId']=='round-coffee-table')
        cls.parts={p['partId']:p for p in cls.table['components']}
        cls.top=cls.parts['top'];cls.legs=[p for p in cls.parts.values() if p['partId']!='top']

    def test_three_equal_splayed_legs_embed_and_stay_under_top(self):
        self.assertEqual(len(self.parts),4)
        for leg,angle in zip(self.legs,[-90,30,150]):
            for key,r,z in [('bottomCentre',.24,0),('topCentre',.18,.295)]:
                expected=[r*math.cos(math.radians(angle)),r*math.sin(math.radians(angle)),z]
                for actual,wanted in zip(leg[key],expected):self.assertAlmostEqual(actual,wanted,places=9)
            underside=self.top['centre'][2]-self.top['height']/2
            self.assertAlmostEqual(leg['topCentre'][2]-underside,.01)
            self.assertLess(.24+max(leg['bottomWidth'],leg['topWidth'])/2,self.top['radius']-self.top['edgeRadius'])
        self.assertEqual(self.table['size'],[.62,.62,.32])
        self.assertAlmostEqual(self.top['centre'][2]+self.top['height']/2,.32)

    def test_fillets_are_tangent_and_caps_are_horizontal(self):
        for leg in self.legs:
            h,r0,r1,b,k,q,centres=leg_profile(leg);alpha=-math.atan(k)
            for rc,zc in centres:
                rho=rc+b*math.cos(alpha);z=zc+b*math.sin(alpha)
                self.assertAlmostEqual(rho,r0+k*z)
                self.assertAlmostEqual((rc-k*zc-r0)/q,-b)
            self.assertAlmostEqual(centres[0][1]-b,0)
            self.assertAlmostEqual(centres[1][1]+b,h)
            self.assertTrue(0<centres[0][0]<r0);self.assertTrue(0<centres[1][0]<r1)
            # Horizontal cap circles remain horizontal under the defined XY shear.
            for z,(rc,_) in zip((0,h),centres):
                for i in range(12):
                    t=z/h;c=[a+(b0-a)*t for a,b0 in zip(leg['bottomCentre'][:2],leg['topCentre'][:2])]
                    point=[c[0]+rc*math.cos(i*math.pi/6),c[1]+rc*math.sin(i*math.pi/6),z]
                    self.assertEqual(point[2],z)

    def test_lod_errors_contacts_and_counts(self):
        for tier in self.table['lod']['tiers']:
            n=tier['topRadialSegments'];bseg=tier['rimSegments'];ln=tier['legRadialSegments']
            top_error=.31*(1-math.cos(math.pi/n))+.006*(1-math.cos(math.pi/(4*bseg)))
            self.assertLessEqual(top_error,tier['maxTopSurfaceError'])
            self.assertEqual(n%4,0)
            count=(n+3*ln)*(4*bseg+4)
            self.assertEqual(count,tier['baseTriangles']);self.assertLessEqual(count,tier['maxTriangles'])
            for leg in self.legs:
                h,r0,r1,b,k,q,_=leg_profile(leg)
                angle=math.pi/2+math.atan(k)
                error=shear_norm(leg)*(r1*(1-math.cos(math.pi/ln))+b*(1-math.cos(angle/(2*bseg))))
                self.assertLessEqual(error,tier['maxLegSurfaceError'])
                # Axis witness Z=.292 lies in the straight core, away from both rim bands.
                z=.292;self.assertGreater(h-b-b*k/q,z)
                canonical_margin=min(z,h-z,(r0+k*z)/q)
                self.assertGreater(canonical_margin/shear_norm(leg),tier['maxLegSurfaceError'])
                self.assertGreater(z-.285,tier['maxTopSurfaceError'])

    def test_document_tables_and_replacement(self):
        text=(ROOT/'COFFEE-TABLE-SPEC.md').read_text()
        for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',text):self.assertTrue((ROOT/target.split('#')[0]).is_file(),target)
        seen=set();leg_rows=set();tiers={t['id'].upper():t for t in self.table['lod']['tiers']}
        for line in text.splitlines():
            cells=[v.strip() for v in line.split('|')[1:-1]]
            if len(cells)==8 and cells[0] in tiers:
                t=tiers[cells[0]];seen.add(cells[0])
                self.assertEqual([float(v) for v in cells[1:]],[t['topRadialSegments'],t['legRadialSegments'],t['rimSegments'],t['baseTriangles'],t['maxTriangles'],t['maxTopSurfaceError']*1000,t['maxLegSurfaceError']*1000])
            if len(cells)==5 and cells[0] in self.parts and cells[0]!='top':
                p=self.parts[cells[0]];leg_rows.add(cells[0])
                for cell,point in zip(cells[1:3],[p['bottomCentre'],p['topCentre']]):
                    values=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cell)]
                    self.assertEqual(len(values),3)
                    for a,b in zip(values,point):self.assertAlmostEqual(a,b*1000,places=6)
                self.assertEqual(float(cells[3]),p['bottomWidth']*1000);self.assertEqual(float(cells[4]),p['topWidth']*1000)
        self.assertEqual(seen,set(tiers))
        self.assertEqual(leg_rows,{p['partId'] for p in self.legs})
        h,r0,r1,b,k,q,centres=leg_profile(self.legs[0])
        self.assertIn(f'{2*centres[0][0]*1000:.6f}/{2*centres[1][0]*1000:.6f} mm',text)
        for formula in ('`k=(r1-r0)/H`','`q=sqrt(1+k*k)`','`alpha=-atan(k)`','`p=(Cxy.x+rho*cos(phi), Cxy.y+rho*sin(phi), z)`'):
            self.assertIn(formula,text)
        for region in self.table['appearance']['regions']:
            self.assertIn(region['defaultMaterial'],self.data['materials'])
        for material in ('oak','oak-grain','dark-wood'):
            self.assertIn(self.data['materials'][material]['baseColorSRGB'],text)
        self.assertCountEqual([p for region in self.table['appearance']['regions'] for p in region['parts']],self.parts)
        self.assertEqual(self.table['sizing']['instanceScaleApplications'],1)
        self.assertFalse(self.table['constructionReview']['modelVerified']);self.assertFalse(self.table['lod']['verified'])

    def test_other_assets_and_sheet_preserved(self):
        self.assertEqual(digest([m for m in self.data['modules'] if m['moduleId']!='round-coffee-table']),'b46e76553d1d2ad4fab8012fcbfedb668f0ae488f3f0335cdfb3fb308fa865eb')
        self.assertEqual(hashlib.sha256((ROOT/self.table['reviewDrawing']).read_bytes()).hexdigest(),'25ec2051ff18e3c11e0d8e7968fbd54d42acc6eabb234674cd5ff52c90c77b77')


if __name__=='__main__':unittest.main(verbosity=2)
