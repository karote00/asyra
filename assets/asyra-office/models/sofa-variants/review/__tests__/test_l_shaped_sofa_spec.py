"""L-sofa document geometry proofs, not production-mesh or visual acceptance."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]
s=importlib.util.spec_from_file_location('chair_math',ROOT.parent/'furniture/review/__tests__/test_work_chair_spec.py')
chair=importlib.util.module_from_spec(s);s.loader.exec_module(chair)


def box(part):
    return dict(part,radius=part['bevel'])


def outline(poly,b,d,n=16):
    points=[];arcs=[]
    for i,p in enumerate(poly):
        prev=poly[i-1];nxt=poly[(i+1)%len(poly)]
        u=[p[j]-prev[j] for j in (0,1)];v=[nxt[j]-p[j] for j in (0,1)]
        u=[x/math.hypot(*u) for x in u];v=[x/math.hypot(*v) for x in v]
        sign=1 if u[0]*v[1]-u[1]*v[0]>0 else -1
        a=[-u[1],u[0]];c=[-v[1],v[0]]
        centre=[p[j]+sign*b*(a[j]+c[j]) for j in (0,1)]
        radius=b-sign*d;angle=math.atan2(-sign*a[1],-sign*a[0])
        arc=[[centre[0]+radius*math.cos(angle+sign*math.pi*k/(2*n)),centre[1]+radius*math.sin(angle+sign*math.pi*k/(2*n))] for k in range(n+1)]
        arcs.append((arc[0],arc[-1],v))
        for q in arc:
            if not points or math.dist(points[-1],q)>1e-12:points.append(q)
    for i,(_,end,v) in enumerate(arcs):
        start=arcs[(i+1)%len(arcs)][0]
        if sum((start[j]-end[j])*v[j] for j in (0,1)) < -1e-10:raise ValueError('Overlapping corner arcs')
    return points


def area(poly):
    return sum(p[0]*poly[(i+1)%len(poly)][1]-p[1]*poly[(i+1)%len(poly)][0] for i,p in enumerate(poly))/2


def inside(point,poly):
    result=False;x,y=point
    for i,a in enumerate(poly):
        b=poly[(i+1)%len(poly)];v=[b[j]-a[j] for j in (0,1)];length=sum(q*q for q in v)
        if length>0:
            t=max(0,min(1,sum((point[j]-a[j])*v[j] for j in (0,1))/length))
            if math.dist(point,[a[j]+t*v[j] for j in (0,1)])<1e-9:return True
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:result=not result
    return result


def cross(a,b,c):
    return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])


def core(size,centre,r):
    return {'size':size,'centre':centre,'radius':r}


class LShapedSofaSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'sofa-variants-model-spec.json').read_text())
        cls.sofa=cls.data['modules'][0];cls.parts={p['partId']:p for p in cls.sofa['components']}

    def test_revised_connections_and_reference_relationships(self):
        p=self.parts
        self.assertGreater(p['base']['zMax'],p['chaise-seat']['zMin'])
        self.assertLessEqual(p['rear-shell']['centre'][2]-p['rear-shell']['size'][2]/2,.09)
        self.assertLess(max(x for x,y in p['base']['polygonXY'] if y>0),.9)
        for name in ('left-back-cushion','right-back-cushion'):
            b=box(p[name]);self.assertEqual(b['rotationXDegrees'],-10)
            self.assertAlmostEqual(b['centre'][2]+chair.rotated_extent(b,2),.7)
            self.assertLess(b['centre'][2]-chair.rotated_extent(b,2),.34)
        rear_core=core([1.7,.615,.18],[0,.2325,.16],.018)
        front_core=core([.9,.5,.18],[.45,-.325,.16],.018)
        chaise_core=core([.78,.945,.105],[.395,-.0825,.2875],.025)
        joins=[(rear_core,box(p['rear-shell']),[0,.49,.23]),
               (rear_core,box(p['left-arm']),[-.8,.25,.2]),
               (rear_core,box(p['right-arm']),[.8,.25,.2]),
               (rear_core,box(p['left-seat']),[-.395,.1675,.2425]),
               (front_core,chaise_core,[.395,-.3,.2425]),
               (box(p['left-seat']),box(p['left-back-cushion']),[-.395,.37,.322]),
               (chaise_core,box(p['right-back-cushion']),[.395,.37,.322])]
        for sign,name in [(-1,'left-back-cushion'),(1,'right-back-cushion')]:
            joins.append((box(p['rear-shell']),box(p[name]),[sign*.395,.5,.54]))
        for a,b,point in joins:
            for shape in (a,b):self.assertLess(chair.placed_field(point,shape,[0,0,0]),-.003)
        feet=p['feet'];self.assertEqual(len(feet['centresXY']),6)
        for x,y in feet['centresXY']:
            base=rear_core if y>=-.075 else front_core
            self.assertLess(chair.placed_field([x,y,.08],base,[0,0,0]),-.003)
            self.assertGreater(feet['zMax']-.08,.003)
            self.assertFalse(x<0 and y<-.075)
        self.assertEqual(feet['zMin'],0);self.assertEqual(feet['zMax'],.09)

    def test_polygon_profiles_preserve_notches_and_bounds(self):
        for name in ('base','chaise-seat'):
            p=self.parts[name];poly=p['polygonXY'];b=p['bevel']
            self.assertGreater(area(poly),0)
            low=[min(q[i] for q in poly) for i in (0,1)];high=[max(q[i] for q in poly) for i in (0,1)]
            previous=None
            for step in range(21):
                points=outline(poly,b,b*step/20)
                for q in points:
                    for i in (0,1):self.assertTrue(low[i]-1e-10<=q[i]<=high[i]+1e-10)
                self.assertLess(area(points),(high[0]-low[0])*(high[1]-low[1]))
                if previous is not None:self.assertLessEqual(area(points),previous+1e-10)
                previous=area(points)
            self.assertGreater(p['zMax']-p['zMin'],2*b)
        # Visible unit bounds remain owned by arms/rear shell/base/back cushions.
        self.assertEqual(self.sofa['overallSize'],[1.8,1.15,.7])
        extents=[]
        for part in self.parts.values():
            if part['primitive']=='rounded-box':
                q=box(part);e=[chair.rotated_extent(q,i) for i in range(3)]
                extents.append(([q['centre'][i]-e[i] for i in range(3)],[q['centre'][i]+e[i] for i in range(3)]))
            elif 'polygonXY' in part:
                q=outline(part['polygonXY'],part['bevel'],0)
                extents.append(([min(v[0] for v in q),min(v[1] for v in q),part['zMin']],[max(v[0] for v in q),max(v[1] for v in q),part['zMax']]))
            else:
                for x,y in part['centresXY']:extents.append(([x-part['radius'],y-part['radius'],part['zMin']],[x+part['radius'],y+part['radius'],part['zMax']]))
        for i in range(3):
            self.assertAlmostEqual(min(a[i] for a,b in extents),self.sofa['bounds']['min'][i])
            self.assertAlmostEqual(max(b[i] for a,b in extents),self.sofa['bounds']['max'][i])
        self.assertEqual(self.parts['right-arm']['size'][1],.65)
        self.assertEqual(self.parts['right-arm']['centre'][1],.25)
        self.assertEqual(self.parts['chaise-seat']['polygonXY'][0],[.005,-.555])

    def test_profiles_are_simple_and_contain_attachment_cores(self):
        cores={'base':[[[-.85,-.075],[.85,-.075],[.85,.54],[-.85,.54]],[[0,-.575],[.9,-.575],[.9,-.075],[0,-.075]]],
               'chaise-seat':[[[.005,-.555],[.785,-.555],[.785,.39],[.005,.39]]]}
        for name,rectangles in cores.items():
            p=self.parts[name];b=p['bevel']
            for fraction in (0,.25,.5,.75,1):
                boundary=outline(p['polygonXY'],b,b*fraction)
                for rectangle in rectangles:
                    for q in outline(rectangle,b,b*fraction):self.assertTrue(inside(q,boundary),(name,fraction,q))
                for i,a in enumerate(boundary):
                    b0=boundary[(i+1)%len(boundary)]
                    for j in range(i+2,len(boundary)):
                        if i==0 and j==len(boundary)-1:continue
                        c=boundary[j];d=boundary[(j+1)%len(boundary)]
                        self.assertFalse(cross(a,b0,c)*cross(a,b0,d)<-1e-15 and cross(c,d,a)*cross(c,d,b0)<-1e-15)
        self.assertEqual((self.parts['base']['zMin'],self.parts['base']['zMax']),(.07,.25))
        self.assertEqual((self.parts['chaise-seat']['zMin'],self.parts['chaise-seat']['zMax']),(.235,.34))

    def test_document_and_lod_contract(self):
        text=(ROOT/'L-SHAPED-SOFA-SPEC.md').read_text()
        for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',text):self.assertTrue((ROOT/target.split('#')[0]).is_file(),target)
        polygons=re.findall(r'```text\n([\s\S]*?)```',text)
        self.assertEqual(len(polygons),2)
        for block,name in zip(polygons,('base','chaise-seat')):
            values=[[float(a)/1000,float(b)/1000] for a,b in re.findall(r'\((-?\d+),(-?\d+)\)',block)]
            self.assertEqual(values,self.parts[name]['polygonXY'])
        seen=set();tiers={t['id'].upper():t for t in self.sofa['lod']['tiers']};seen_tiers=set()
        for line in text.splitlines():
            cells=[x.strip() for x in line.split('|')[1:-1]]
            if len(cells)==5 and cells[0] in self.parts and self.parts[cells[0]]['primitive']=='rounded-box':
                p=self.parts[cells[0]];seen.add(cells[0])
                values=[[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',c)] for c in cells[1:]]
                expected=[[v*1000 for v in p['centre']],[v*1000 for v in p['size']],[p['bevel']*1000],[p.get('rotationXDegrees',0)]]
                for a,b in zip(values,expected):
                    self.assertEqual(len(a),len(b))
                    for x,y in zip(a,b):self.assertAlmostEqual(x,y,places=6)
            if len(cells)==7 and cells[0] in tiers:
                t=tiers[cells[0]];seen_tiers.add(cells[0])
                self.assertEqual([float(cells[i]) for i in (1,2,4,5,6)],[t['boxSegments'],t['polygonSegments'],t['maxTriangles'],t['maxSurfaceError']*1000,t['maxFootSurfaceError']*1000])
                self.assertEqual([int(x) for x in cells[3].split('/')],[t['footRadialSegments'],t['footRimSegments']])
        self.assertEqual(seen,{p['partId'] for p in self.parts.values() if p['primitive']=='rounded-box'})
        self.assertEqual(seen_tiers,set(tiers))
        self.assertEqual(self.sofa['sizing']['instanceScaleApplications'],1)
        self.assertFalse(self.sofa['constructionReview']['modelVerified']);self.assertFalse(self.sofa['lod']['verified'])
        for t in self.sofa['lod']['tiers']:
            corner_count,err=chair.helpers.sphere_corner(t['boxSegments'],t['cornerTopology'])
            bound=6*(12+24*t['boxSegments']+8*corner_count)+6*t['footRadialSegments']*(4*t['footRimSegments']+4)+56*(t['polygonSegments']+1)**2-8
            self.assertLess(bound,t['maxTriangles'])
            self.assertLessEqual(.045*err,t['maxSurfaceError'])
            for name in ('base','chaise-seat'):
                b=self.parts[name]['bevel']
                estimate=3*b*(1-math.cos(math.pi/(4*t['polygonSegments'])))
                self.assertLessEqual(estimate,t['maxSurfaceError'])
            feet=self.parts['feet'];err=feet['radius']*(1-math.cos(math.pi/t['footRadialSegments']))+feet['bevel']*(1-math.cos(math.pi/(4*t['footRimSegments'])))
            self.assertLessEqual(err,t['maxFootSurfaceError'])
        regions=self.sofa['appearance']['regions']
        self.assertCountEqual([x for r in regions for x in r['parts']],self.parts)

    def test_unrelated_asset_palette_and_reference_preserved(self):
        self.assertEqual(chair.helpers.digest(self.data['modules'][1]),'d0fd2eef5609a63b7ef42c350e9b649f9130f03a9bf49dc0e1007c0f2e7dce3d')
        self.assertEqual(chair.helpers.digest(self.data['materials']),'338ee1984fc2fc5ee550865c5d626fac8c05860ebbb36011a33814e493dbd625')
        self.assertEqual(hashlib.sha256((ROOT/self.sofa['reviewDrawing']).read_bytes()).hexdigest(),'164f81b55fb46eee19d676ff8097d72ef3e6001c22a96f871a918c5165884130')


if __name__=='__main__':unittest.main(verbosity=2)
