"""Desk document checks, including rounded-volume joint witnesses."""
import copy
import hashlib
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]


def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def rounded_field(p,centre,size,radius):
    q=[abs(a-b)-(s/2-radius) for a,b,s in zip(p,centre,size)]
    return math.sqrt(sum(max(v,0)**2 for v in q))+min(max(q),0)-radius


def leg_box(leg):
    a,b=leg['bottomCentre'],leg['topCentre']
    return [(x+y)/2 for x,y in zip(a,b)],[leg['topWidth'],leg['topWidth'],b[2]-a[2]]


def sphere_corner(segments, topology):
    def unit(p):
        length=math.sqrt(sum(v*v for v in p))
        return [v/length for v in p]
    if topology=='normalized-barycentric-grid':
        points={(i,j):unit([i,j,segments-i-j]) for i in range(segments+1) for j in range(segments-i+1)}
        triangles=[]
        for i in range(segments):
            for j in range(segments-i):
                triangles.append([points[i,j],points[i+1,j],points[i,j+1]])
                if i+j<segments-1:triangles.append([points[i+1,j],points[i+1,j+1],points[i,j+1]])
        angles=[math.atan2(j,segments-j) for j in range(segments+1)]
    else:
        angles=[math.pi*j/(2*segments) for j in range(segments+1)]
        ring=[]
        for a,b in ((0,1),(1,2),(2,0)):
            for angle in angles[:-1]:
                point=[0.,0.,0.];point[a]=math.cos(angle);point[b]=math.sin(angle);ring.append(point)
        if topology=='centre-fan':triangles=[[unit([1,1,1]),p,ring[(i+1)%len(ring)]] for i,p in enumerate(ring)]
        elif topology=='single-triangle' and segments==1:triangles=[ring]
        else:raise ValueError('Invalid corner topology')
    errors=[]
    for a,b,c in triangles:
        u=[y-x for x,y in zip(a,b)];v=[y-x for x,y in zip(a,c)]
        normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
        distance=abs(sum(x*y for x,y in zip(a,normal)))/math.sqrt(sum(x*x for x in normal))
        errors.append(1-distance)
    edge_error=max(1-math.cos((b-a)/2) for a,b in zip(angles,angles[1:]))
    return len(triangles),max([edge_error,*errors])


class WritingDeskSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'furniture-model-spec.json').read_text())
        cls.desk=next(m for m in cls.data['modules'] if m['moduleId']=='writing-desk')
        cls.parts={p['partId']:p for p in cls.desk['components']}

    def test_existing_geometry_and_other_furniture_preserved(self):
        keys=('moduleId','name','reviewDrawing','size','components','surfaceHeight','source','hiddenDecisions','unitCount')
        self.assertEqual(digest({k:self.desk[k] for k in keys}),'b2352471b83595f9b572a7c20363b940c9424dc09d3e2d1e756d6b28d0ffc155')
        others=[{k:v for k,v in m.items() if m['moduleId']!='work-chair' or k not in ('constructionReview','sizing','appearance','lod')} for m in self.data['modules'] if m['moduleId']!='writing-desk']
        others=copy.deepcopy(others)
        for module in others:
            if module['moduleId']=='work-chair':
                for p in module['components']:
                    if p['partId'].startswith('back-post'):
                        p['centre'][1:]=[.17,.4];p['size'][2]=.34
        self.assertEqual(digest(others),'ee4c70a6cb80985313bee06c995e7d1f7fe3127b9a4ddd1edc04dbf8fe2609a3')
        self.assertEqual(hashlib.sha256((ROOT/self.desk['reviewDrawing']).read_bytes()).hexdigest(),'16b8f058b57fc3d83aadd0985e619ea75f85615546607168aa690a468d21554c')

    def test_dimensions_and_ground_contact(self):
        self.assertEqual(len(self.parts),9)
        top=self.parts['top'];legs=[p for p in self.parts.values() if p['partId'].startswith('leg-')]
        self.assertEqual(len(legs),4)
        self.assertEqual(self.desk['size'],[1.2,.6,.65])
        self.assertAlmostEqual(top['centre'][2]+top['size'][2]/2,self.desk['surfaceHeight'])
        for leg in legs:
            self.assertEqual(leg['bottomCentre'][:2],leg['topCentre'][:2])
            self.assertEqual(leg['bottomWidth'],leg['topWidth'])
            self.assertEqual(leg['bottomCentre'][2],0)
            centre,size=leg_box(leg)
            self.assertAlmostEqual(rounded_field(leg['bottomCentre'],centre,size,leg['radius']),0)
            self.assertAlmostEqual(rounded_field(leg['topCentre'],centre,size,leg['radius']),0)
            self.assertAlmostEqual(rounded_field(leg['topCentre'],top['centre'],top['size'],top['radius']),0)
            for axis in (0,1):self.assertAlmostEqual(top['size'][axis]/2-abs(centre[axis])-size[axis]/2,.044)

    def test_all_eight_apron_leg_joints_survive_rounding(self):
        # Witnesses lie inside both flat face cores, not only intersecting AABBs.
        for leg in [p for p in self.parts.values() if p['partId'].startswith('leg-')]:
            x,y,_=leg['topCentre'];sx,sy=math.copysign(1,x),math.copysign(1,y)
            centre,size=leg_box(leg)
            for name,p in [('front-apron' if y<0 else 'back-apron',[sx*.527,sy*.238,.58]),('left-apron' if x<0 else 'right-apron',[sx*.538,sy*.2245,.58])]:
                apron=self.parts[name]
                self.assertLess(rounded_field(p,apron['centre'],apron['size'],apron['radius']),0,name)
                self.assertLess(rounded_field(p,centre,size,leg['radius']),0,leg['partId'])
        top=self.parts['top']
        for part in [p for p in self.parts.values() if 'apron' in p['partId']]:
            p=[*part['centre'][:2],part['centre'][2]+part['size'][2]/2]
            self.assertAlmostEqual(p[2],.61)
            self.assertAlmostEqual(rounded_field(p,part['centre'],part['size'],part['radius']),0)
            self.assertAlmostEqual(rounded_field(p,top['centre'],top['size'],top['radius']),0)
            self.assertAlmostEqual(part['centre'][2]-part['size'][2]/2,.555)

    def test_document_part_table_and_bevel_limits(self):
        text=(ROOT/'WRITING-DESK-SPEC.md').read_text();seen=set()
        for line in text.splitlines():
            cells=[c.strip() for c in line.split('|')[1:-1]]
            if len(cells)!=4 or cells[0] not in self.parts:continue
            part=self.parts[cells[0]];seen.add(cells[0])
            centre,size=leg_box(part) if part['partId'].startswith('leg-') else (part['centre'],part['size'])
            values=[[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cell)] for cell in cells[1:]]
            self.assertEqual(values,[[round(v*1000,9) for v in centre],[round(v*1000,9) for v in size],[part['radius']*1000]])
            self.assertGreater(part['radius'],0);self.assertLess(part['radius'],min(size)/2)
        self.assertEqual(seen,set(self.parts))

    def test_sizing_and_programmatic_route(self):
        self.assertEqual(self.desk['constructionReview']['productionRoute'],'programmatic-primitives')
        self.assertFalse(self.desk['constructionReview']['modelVerified'])
        self.assertEqual(self.desk['sizing']['instanceScaleApplications'],1)
        self.assertEqual(self.desk['sizing']['invalidExtentPolicy'],'reject')
        self.assertEqual(self.desk['sizing']['defaultNormalization'],'none')

    def test_appearance_and_lod_declarations(self):
        appearance=self.desk['appearance'];regions=appearance['regions']
        assigned=[p for r in regions for p in r['parts']]
        self.assertCountEqual(assigned,self.parts)
        self.assertFalse(appearance['bakedLighting'])
        self.assertTrue(appearance['independentInstanceOverrides'])
        for r in regions:self.assertIn(r['defaultMaterial'],self.data['materials'])
        self.assertEqual(appearance['woodMappingSpace'],'resized-local-metres-before-placement')
        tiers=self.desk['lod']['tiers'];self.assertFalse(self.desk['lod']['verified'])
        self.assertEqual([t['bevelSegments'] for t in tiers],[3,2,1])
        self.assertEqual([t['maxTriangles'] for t in tiers],[1600,1000,500])
        self.assertEqual([t['maxSurfaceError'] for t in tiers],[.0005,.001,.003])
        text=(ROOT/'WRITING-DESK-SPEC.md').read_text()
        for t in tiers:
            rows=[line for line in text.splitlines() if re.match(r'\|\s*'+t['id'].upper()+r'\s*\|',line)]
            self.assertEqual(len(rows),1)
            cells=[c.strip() for c in rows[0].split('|')[1:-1]]
            self.assertEqual([float(c) for c in cells[1:]],[t['bevelSegments'],t['maxTriangles'],t['maxSurfaceError']])

    def test_corner_topology_fits_existing_error_and_triangle_limits(self):
        # A single octant face violates the existing 3 mm LOD2 limit at radius 8 mm.
        _,bad_error=sphere_corner(1,'single-triangle')
        self.assertGreater(.008*bad_error,self.desk['lod']['tiers'][2]['maxSurfaceError'])
        totals=[];bounds=[]
        for tier in self.desk['lod']['tiers']:
            total=0;maximum_error=0
            for part in self.parts.values():
                top=part['partId']=='top'
                segments=tier['topBevelSegments'] if top else tier['bevelSegments']
                topology=tier['topCornerTopology'] if top else tier['otherCornerTopology']
                corner_count,error=sphere_corner(segments,topology)
                total+=12+24*segments+8*corner_count
                self.assertLessEqual(part['radius']*error,tier['maxSurfaceError'])
                maximum_error=max(maximum_error,part['radius']*error)
            self.assertLessEqual(total,tier['maxTriangles']);totals.append(total)
            bounds.append(math.ceil(maximum_error*1000*10000)/10000)
        self.assertEqual(totals,[1484,972,412])
        self.assertIn(' / '.join(f'{value:.4f}' for value in bounds),(ROOT/'WRITING-DESK-SPEC.md').read_text())

    def test_rounded_surface_grain_mapping_is_defined(self):
        mapping=self.desk['appearance']['roundedSurfaceMapping']
        self.assertEqual(mapping['normalSpace'],'default-local-geometric-normal')
        self.assertEqual(mapping['method'],'normalized-absolute-normal-blend')
        def weights(n):
            divisor=sum(abs(v) for v in n)
            return max(n[2],0)/divisor,abs(n[1])/divisor
        self.assertEqual(weights([0,0,1]),(1,0))
        self.assertEqual(weights([0,1,0]),(0,1))
        self.assertEqual(weights([1,0,0]),(0,0))
        self.assertEqual(weights([0,0,-1]),(0,0))
        self.assertEqual(weights([0,1,1]),(.5,.5))
        self.assertEqual(weights([1,1,1]),(1/3,1/3))
        self.assertAlmostEqual(sum(weights([0,1,1e-8])),1)

    def test_new_document_links_and_palette(self):
        file=ROOT/'WRITING-DESK-SPEC.md'
        for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',file.read_text()):
            if '://' not in target:self.assertTrue((file.parent/target.split('#')[0]).is_file(),target)
        for key in ('oak','oak-grain','dark-frame'):
            self.assertIn(self.data['materials'][key]['baseColorSRGB'],file.read_text())


if __name__=='__main__':unittest.main(verbosity=2)
