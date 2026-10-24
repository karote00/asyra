"""Cockatiel document checks; analytic inputs do not certify final mesh likeness."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
loader = importlib.util.spec_from_file_location('bird_document_helpers', Path(__file__).with_name('test_tree_sparrow_spec.py'))
helpers = importlib.util.module_from_spec(loader)
loader.loader.exec_module(helpers)


def upper_beak_value(point, rows):
    x,y,z = point
    for a,b in zip(rows,rows[1:]):
        if b[0] <= z <= a[0]:
            t = (z-a[0])/(b[0]-a[0])
            cy,rx,ry = [a[i]+t*(b[i]-a[i]) for i in (1,2,3)]
            return (x/rx)**2+((y-cy)/ry)**2
    return math.inf


def document_tables():
    text = (ROOT/'COCKATIEL-SPEC.md').read_text()
    tables = {}
    for block in text.split('\n\n'):
        if block.startswith('|'):
            rows = [[c.strip() for c in line.split('|')[1:-1]] for line in block.splitlines()]
            tables[rows[0][0]] = rows[2:]
    return tables


def numbers(cell):
    return [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cell)]


def mm(values):
    return [round(v*1000,9) for v in values]


class CockatielSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT/'birds-model-spec.json').read_text())
        cls.bird = cls.data['birds'][1]
        cls.body,cls.head = cls.bird['ellipsoids']

    def test_preserved_inputs_and_references(self):
        keys = ('id','finalSize','reviewDrawing','ellipsoids','wings','tail','legs','toes','eyes','beak','masks','crest')
        self.assertEqual(helpers.digest({k:self.bird[k] for k in keys}),'0df41d9d8e0941bcfcde6604e223184f393a5ab4d9cee580265b46f5549e2293')
        self.assertEqual(helpers.digest(self.data['birds'][0]),'dcdfa7a1ea79259d51cc0517f3e2f42389871931e633795abac136014d0165ee')
        for name,expected in [('01-tree-sparrow-v2.png','2d54c849192b3af59b70e431570c5b688ed313e6613f623604fde9a23563d18d'),('02-cockatiel-v2.png','b5a92e9746f073b5af599459225aa325ffc5ea61ab6d91106a583eeb12ae0168')]:
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),expected)

    def test_positive_body_wing_tail_and_leg_attachments(self):
        p=[(a+b)/2 for a,b in zip(self.body[1],self.head[1])]
        for part in (self.body,self.head):self.assertLess(helpers.field(p,part),0)
        wings=self.bird['wings'];a,b=wings['centres']
        self.assertEqual([-a[0],*a[1:]],b)
        self.assertEqual(wings['rotationXDegrees'],-25)
        for p in wings['centres']:self.assertLess(helpers.field(p,self.body),0)
        y,z,_,_=self.bird['tail']['rings'][0]
        self.assertLess(helpers.field([0,y,z],self.body),0)
        legs=self.bird['legs']
        for x in legs['centresX']:self.assertLess(helpers.field([x,legs['y'],legs['zRange'][1]],self.body),0)

    def test_upper_and_lower_beak_overlap_and_hook_returns(self):
        beak=self.bird['beak'];rows=beak['rings'];lower=beak['lowerMandible']
        self.assertTrue(all(a[0]>b[0] for a,b in zip(rows,rows[1:])))
        self.assertTrue(all(min(r[2:])>0 for r in rows))
        z,y,_,_=rows[0];self.assertLess(helpers.field([0,y,z],self.head),0)
        self.assertLess(helpers.field(lower['centre'],self.head),0)
        point=[0,-.09,.16]
        self.assertLess(upper_beak_value(point,rows),1)
        self.assertLess(helpers.field(point,['lower',lower['centre'],lower['radii']]),0)
        self.assertGreater(rows[-1][1]-rows[-1][3],min(r[1]-r[3] for r in rows[:-1]))
        self.assertLess(upper_beak_value([0,-.09,.16],rows),upper_beak_value([.1,-.09,.16],rows))

    def test_three_separate_crest_feathers_attach_to_head(self):
        feathers=self.bird['crest']['feathers'];self.assertEqual(len(feathers),3)
        for f in feathers:
            rows=f['rings'];z,x,y,_,_=rows[0]
            self.assertLess(helpers.field([x,y,z],self.head),0)
            self.assertTrue(all(a[0]<b[0] and a[2]<b[2] for a,b in zip(rows,rows[1:])))
            self.assertTrue(all(min(row[3:])>0 for row in rows))
        # X stays constant per feather. Disjoint X intervals prove no 3D overlap.
        intervals=[]
        for f in feathers:
            self.assertEqual(len({r[1] for r in f['rings']}),1)
            intervals.append((min(r[1]-r[3] for r in f['rings']),max(r[1]+r[3] for r in f['rings'])))
        intervals.sort()
        for a,b in zip(intervals,intervals[1:]):self.assertAlmostEqual(b[0]-a[1],.002)
        self.assertIn('three independent head-attached lofts',self.bird['crestConstruction']['topology'])
        self.assertNotIn('Three independent overlapping feather lofts',(ROOT/'GEOMETRY-SUPPLEMENT.md').read_text())

    def test_eight_toes_with_two_forward_two_rear(self):
        legs=self.bird['legs'];toes=self.bird['toes'];lines=toes['relativePolylines'];r=toes['radius']
        self.assertEqual(len(legs['centresX'])*len(lines),8)
        self.assertEqual(sum(p[-1][1]<0 for p in lines),2)
        self.assertEqual(sum(p[-1][1]>0 for p in lines),2)
        tips=[]
        for x in legs['centresX']:
            for line in lines:
                self.assertEqual(line[0],[0,0,.01])
                self.assertLess(abs(line[0][2]-legs['zRange'][0]),r+legs['radius'])
                self.assertTrue(all(math.dist(a,b)>0 for a,b in zip(line,line[1:])))
                tips.append([x+line[-1][0],legs['y']+line[-1][1],line[-1][2]])
        for i,p in enumerate(tips):
            self.assertAlmostEqual(p[2]-r,.0005)
            for q in tips[i+1:]:self.assertGreater(math.dist(p,q),2*r)

    def test_head_masks_and_local_wing_patch(self):
        for mask in (self.bird['eyes'],self.bird['masks']['headCheeks']):
            for lon in mask['longitudeDegrees']:
                v=helpers.direction(lon,mask['latitudeDegrees'])
                p=[c+r*q for c,r,q in zip(self.head[1],self.head[2],v)]
                self.assertLess(helpers.field(p,self.head),helpers.field(p,self.body))
        patch=self.bird['masks']['wingPatch'];r=self.bird['wings']['radii']
        self.assertTrue(all((y/r[1])**2+(z/r[2])**2<1 for y in patch['localYRange'] for z in patch['localZRange']))
        angle=math.radians(-25);c,s=math.cos(angle),math.sin(angle)
        for y in patch['localYRange']:
            for z in patch['localZRange']:
                ry,rz=c*y-s*z,s*y+c*z
                self.assertAlmostEqual(c*ry+s*rz,y);self.assertAlmostEqual(-s*ry+c*rz,z)

    def test_size_views_appearance_and_lod(self):
        self.assertEqual(self.bird['finalSize'],[.18,.36,.32])
        self.assertEqual(self.bird['sizing']['instanceScaleApplications'],1)
        self.assertEqual(self.bird['sizing']['invalidExtentPolicy'],'reject')
        mapping=self.bird['review']['sourceViewMapping']
        self.assertEqual(mapping['RIGHT'],'LEFT')
        self.assertEqual(mapping['RIGHT THREE-QUARTER'],'FRONT-LEFT THREE-QUARTER')
        self.assertFalse(self.bird['review']['modelVerified'])
        regions=self.bird['appearance']['regions']
        self.assertEqual(len(regions),len({r['id'] for r in regions}))
        for region in regions:self.assertIn(region['defaultMaterial'],self.data['palette'])
        self.assertTrue({'upper-beak','lower-beak','crest','cheeks','wing-patches','eyes','feet'}.issubset({r['id'] for r in regions}))
        self.assertFalse(self.bird['appearance']['bakedLighting'])
        self.assertTrue(self.bird['appearance']['independentInstanceOverrides'])
        tiers=self.bird['lod']['tiers']
        self.assertEqual([t['maxTriangles'] for t in tiers],[16000,8000,4000])
        self.assertEqual([t['maxSurfaceError'] for t in tiers],[.0005,.001,.002])
        self.assertFalse(self.bird['lod']['verified'])

    def test_component_and_loft_tables(self):
        tables=document_tables();parts={p[0]:p for p in self.bird['ellipsoids']}
        for i,c in enumerate(self.bird['wings']['centres']):parts['wing-'+str(i)]=['wing',c,self.bird['wings']['radii']]
        lower=self.bird['beak']['lowerMandible'];parts['lower-beak']=['lower',lower['centre'],lower['radii']]
        self.assertEqual(len(tables['Part']),len(parts))
        for row in tables['Part']:
            part=parts[row[0]]
            self.assertEqual(numbers(row[1]),mm(part[1]));self.assertEqual(numbers(row[2]),mm([2*r for r in part[2]]))
        for heading,rows in [('Tail row',self.bird['tail']['rings']),('Upper-beak row',self.bird['beak']['rings'])]:
            self.assertEqual(len(tables[heading]),len(rows))
            for a,b in zip(tables[heading],rows):self.assertEqual([v for c in a[1:] for v in numbers(c)],mm(b))
        self.assertEqual(len(tables['Crest row']),9)
        for a,b in zip(tables['Crest row'],[r for f in self.bird['crest']['feathers'] for r in f['rings']]):
            self.assertEqual([v for c in a[1:] for v in numbers(c)],mm(b))

    def test_toe_palette_and_lod_tables(self):
        tables=document_tables()
        self.assertEqual(len(tables['Toe']),4)
        for a,b in zip(tables['Toe'],self.bird['toes']['relativePolylines']):
            for cell,point in zip(a[1:],b):self.assertEqual(numbers(cell),mm(point))
        regions=self.bird['appearance']['regions'];self.assertEqual(len(tables['Region']),len(regions))
        for a,b in zip(tables['Region'],regions):
            self.assertEqual(a[1],b['defaultMaterial']);self.assertEqual(a[2],self.data['palette'][b['defaultMaterial']])
        self.assertEqual(len(tables['LOD']),len(self.bird['lod']['tiers']))
        for a,b in zip(tables['LOD'],self.bird['lod']['tiers']):
            self.assertEqual(a[0].lower(),b['id']);self.assertEqual(int(a[1]),b['maxTriangles']);self.assertEqual(float(a[2]),b['maxSurfaceError'])

    def test_links_and_finite_inputs(self):
        for name in ('COCKATIEL-SPEC.md','README.md','GEOMETRY-SUPPLEMENT.md','SURFACE-RECIPES.md','review/README.md'):
            file=ROOT/name
            for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',file.read_text()):
                if '://' not in target and not target.startswith('#'):self.assertTrue((file.parent/target.split('#')[0]).is_file(),target)
        def walk(value):
            if isinstance(value,dict):
                for child in value.values():walk(child)
            elif isinstance(value,list):
                for child in value:walk(child)
            elif isinstance(value,(int,float)):self.assertTrue(math.isfinite(value))
        walk(self.bird)


if __name__=='__main__':unittest.main(verbosity=2)
