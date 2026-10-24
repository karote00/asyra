"""Document and analytic-input checks; these do not validate a finished bird mesh."""
import hashlib
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def field(point, part):
    return (math.sqrt(sum(((p-c)/r)**2 for p,c,r in zip(point,part[1],part[2]))) - 1) * min(part[2])


def direction(longitude, latitude):
    lon, lat = map(math.radians, (longitude, latitude))
    return (math.sin(lon)*math.cos(lat), -math.cos(lon)*math.cos(lat), math.sin(lat))


class TreeSparrowSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT/'birds-model-spec.json').read_text())
        cls.bird = cls.data['birds'][0]
        cls.body, cls.head = cls.bird['ellipsoids']

    def test_preserved_reference_and_geometry(self):
        keys = ('id','finalSize','reviewDrawing','ellipsoids','wings','tail','legs','toes','eyes','beak','masks')
        self.assertEqual(digest({k:self.bird[k] for k in keys}), '139db984d0c3a88ae9962bdef45b2e859d11c78f9b1c7b967928eba51366cb8b')
        cockatiel=self.data['birds'][1]
        baseline={k:cockatiel[k] for k in (*keys,'crest')}
        self.assertEqual(digest(baseline), '0df41d9d8e0941bcfcde6604e223184f393a5ab4d9cee580265b46f5549e2293')
        for name, expected in [('01-tree-sparrow-v2.png','2d54c849192b3af59b70e431570c5b688ed313e6613f623604fde9a23563d18d'),('02-cockatiel-v2.png','b5a92e9746f073b5af599459225aa325ffc5ea61ab6d91106a583eeb12ae0168')]:
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(), expected)

    def test_body_and_attached_parts_have_positive_overlap(self):
        midpoint = [(a+b)/2 for a,b in zip(self.body[1],self.head[1])]
        for part in (self.body,self.head): self.assertLess(field(midpoint,part), 0)
        for centre in self.bird['wings']['centres']: self.assertLess(field(centre,self.body), 0)
        for part, parent in [('tail',self.body),('beak',self.head)]:
            y,z,_,_ = self.bird[part]['rings'][0]
            self.assertLess(field([0,y,z],parent),0,part)
        legs=self.bird['legs']
        for x in legs['centresX']: self.assertLess(field([x,legs['y'],legs['zRange'][1]],self.body),0)

    def test_wings_are_mirrored_and_rotated_locally(self):
        wings=self.bird['wings'];a,b=wings['centres']
        self.assertEqual([-a[0],*a[1:]],b)
        self.assertEqual(wings['rotationXDegrees'],-25)
        self.assertGreater(min(wings['radii']),0)
        angle=math.radians(wings['rotationXDegrees']);c,s=math.cos(angle),math.sin(angle)
        y,z=wings['radii'][1],wings['radii'][2]
        ry,rz=c*y-s*z,s*y+c*z
        self.assertAlmostEqual(c*ry+s*rz,y)
        self.assertAlmostEqual(-s*ry+c*rz,z)

    def test_lofts_have_positive_sections_and_consistent_direction(self):
        for key,sign in [('tail',1),('beak',-1)]:
            rows=self.bird[key]['rings']
            self.assertEqual(len(rows),3)
            self.assertTrue(all(min(row[2:])>0 for row in rows))
            self.assertTrue(all(sign*(b[0]-a[0])>0 for a,b in zip(rows,rows[1:])))
            self.assertLess(rows[-1][2],rows[0][2])

    def test_eight_toes_with_three_forward_and_one_backward(self):
        toes=self.bird['toes'];lines=toes['relativePolylines'];r=toes['radius'];legs=self.bird['legs']
        self.assertEqual(len(legs['centresX'])*len(lines),8)
        self.assertEqual(sum(line[-1][1]<0 for line in lines),3)
        self.assertEqual(sum(line[-1][1]>0 for line in lines),1)
        tips=[]
        for x in legs['centresX']:
            for line in lines:
                self.assertEqual(line[0],[0,0,.009])
                self.assertLess(abs(line[0][2]-legs['zRange'][0]),r+legs['radius'])
                self.assertTrue(all(math.dist(a,b)>0 for a,b in zip(line,line[1:])))
                tips.append([x+line[-1][0],legs['y']+line[-1][1],line[-1][2]])
        for i,a in enumerate(tips):
            self.assertAlmostEqual(a[2]-r,.0005)
            for b in tips[i+1:]: self.assertGreater(math.dist(a,b),2*r)

    def test_mask_centres_are_head_owned_and_cheek_spots_fit(self):
        masks=self.bird['masks']
        for mask in (self.bird['eyes'],masks['headCheeks'],masks['cheekSpots'],masks['throatBib']):
            for lon in mask['longitudeDegrees']:
                v=direction(lon,mask['latitudeDegrees'])
                p=[c+r*q for c,r,q in zip(self.head[1],self.head[2],v)]
                self.assertLess(field(p,self.head),field(p,self.body))
        for a,b in zip(masks['headCheeks']['longitudeDegrees'],masks['cheekSpots']['longitudeDegrees']):
            u=direction(a,masks['headCheeks']['latitudeDegrees']);v=direction(b,masks['cheekSpots']['latitudeDegrees'])
            separation=math.degrees(math.acos(sum(x*y for x,y in zip(u,v))))
            self.assertLess(separation+masks['cheekSpots']['angularRadiusDegrees'],masks['headCheeks']['angularRadiusDegrees'])
        intervals=masks['wingBars']['yIntervals']
        self.assertTrue(all(a<b for a,b in intervals));self.assertLess(intervals[0][1],intervals[1][0])

    def test_sizing_and_source_camera_contract(self):
        self.assertEqual(self.bird['finalSize'],[.16,.23,.20])
        sizing=self.bird['sizing']
        self.assertEqual(sizing['instanceScaleApplications'],1)
        self.assertEqual(sizing['invalidExtentPolicy'],'reject')
        mapping=self.bird['review']['sourceViewMapping']
        self.assertEqual(mapping['RIGHT'],'LEFT')
        self.assertEqual(mapping['RIGHT THREE-QUARTER'],'FRONT-LEFT THREE-QUARTER')
        self.assertFalse(self.bird['review']['modelVerified'])

    def test_regions_and_lod_contract(self):
        appearance=self.bird['appearance']
        self.assertFalse(appearance['bakedLighting']);self.assertTrue(appearance['independentInstanceOverrides'])
        regions=appearance['regions'];self.assertEqual(len(regions),len({r['id'] for r in regions}))
        for region in regions:self.assertIn(region['defaultMaterial'],self.data['palette'])
        self.assertTrue({'eyes','cheek-spots','throat-bib','beak','wing-bars','feet'}.issubset({r['id'] for r in regions}))
        tiers=self.bird['lod']['tiers']
        self.assertEqual([t['maxTriangles'] for t in tiers],[12000,6000,3000])
        self.assertEqual([t['maxSurfaceError'] for t in tiers],[.0005,.001,.002])
        self.assertFalse(self.bird['lod']['verified'])

    def test_document_component_and_loft_tables(self):
        text=(ROOT/'TREE-SPARROW-SPEC.md').read_text()
        tables={}
        for block in text.split('\n\n'):
            if block.startswith('|'):
                rows=[[c.strip() for c in line.split('|')[1:-1]] for line in block.splitlines()]
                tables[rows[0][0]]=rows[2:]
        parts={p[0]:p for p in self.bird['ellipsoids']}
        for i,c in enumerate(self.bird['wings']['centres']):parts['wing-'+str(i)]=['wing',c,self.bird['wings']['radii']]
        def numbers(cell):return [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cell)]
        self.assertEqual(len(tables['Part']),len(parts))
        for row in tables['Part']:
            p=parts[row[0]]
            self.assertEqual(numbers(row[1]),[round(v*1000,9) for v in p[1]])
            self.assertEqual(numbers(row[2]),[round(v*2000,9) for v in p[2]])
        for heading,key in [('Tail row','tail'),('Beak row','beak')]:
            rows=tables[heading];self.assertEqual(len(rows),len(self.bird[key]['rings']))
            for row,record in zip(rows,self.bird[key]['rings']):
                self.assertEqual([v for cell in row[1:] for v in numbers(cell)],[round(v*1000,9) for v in record])

    def test_toe_palette_and_lod_tables(self):
        text=(ROOT/'TREE-SPARROW-SPEC.md').read_text();tables={}
        for block in text.split('\n\n'):
            if block.startswith('|'):
                rows=[[c.strip() for c in line.split('|')[1:-1]] for line in block.splitlines()]
                tables[rows[0][0]]=rows[2:]
        toe_rows=tables['Toe'];self.assertEqual(len(toe_rows),4)
        for row,points in zip(toe_rows,self.bird['toes']['relativePolylines']):
            for cell,point in zip(row[1:],points):
                self.assertEqual([float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cell)],[round(v*1000,9) for v in point])
        regions=self.bird['appearance']['regions']
        self.assertEqual(len(tables['Region']),len(regions))
        for row,region in zip(tables['Region'],regions):
            self.assertEqual(row[1],region['defaultMaterial'])
            self.assertEqual(row[2],self.data['palette'][region['defaultMaterial']])
        self.assertEqual(len(tables['LOD']),len(self.bird['lod']['tiers']))
        for row,tier in zip(tables['LOD'],self.bird['lod']['tiers']):
            self.assertEqual(row[0].lower(),tier['id'])
            self.assertEqual(int(row[1]),tier['maxTriangles'])
            self.assertEqual(float(row[2]),tier['maxSurfaceError'])

    def test_links_and_finite_inputs(self):
        for name in ('TREE-SPARROW-SPEC.md','README.md','GEOMETRY-SUPPLEMENT.md','SURFACE-RECIPES.md','review/README.md'):
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
