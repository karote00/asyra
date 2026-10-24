"""Daybed reference geometry checks; no production model is exported."""
from collections import Counter
import hashlib
import importlib.util
import itertools
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]
BASELINE={'parts': '1c8d994508ce2ad66796fc95d119bb751f720510b1982d737e00c7359a05bb34', 'pillow': '253c81542687f5ede8b748fcc6fd4069f050025dbffeac7136e15e1ac8fdb1f7', 'materials': 'fd7754a9d7c381e9fcbc3a32d189a6a55192496d3c5d71fad0c76935539d0710', 'images': {'02-ivory-sleeping-pillow-v1.png': 'd7da88ea24fd8175d013f18d81ea1121c8b11d9a9f156c70b5b38a5e65eaa0fa', '01-sage-nap-daybed-v1.png': '2cb79b2afa44051bb6cd4997410dd52f47a92e5a11c3f0ff677aa2bfad831872'}}
helper=importlib.util.spec_from_file_location('desk_math',ROOT.parent/'furniture/review/__tests__/test_writing_desk_spec.py')
desk=importlib.util.module_from_spec(helper);helper.loader.exec_module(desk)


def pad_mesh(pad,n):
    """Analytic patch tessellation for the documented reference, held in memory."""
    a=[v/2 for v in pad['innerBoxSize']];r=pad['roundingRadius'];centre=pad['center']
    points=[];indices={};faces=[]
    def index(p):
        key=tuple(round(v,12) for v in p)
        if key not in indices:
            indices[key]=len(points);points.append(tuple(p[i]+centre[i] for i in range(3)))
        return indices[key]
    def polygon(coords):
        ids=list(dict.fromkeys(index(p) for p in coords))
        if len(ids)<3:return
        p,q,s=[points[i] for i in ids[:3]]
        u=[q[i]-p[i] for i in range(3)];v=[s[i]-p[i] for i in range(3)]
        normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
        middle=[sum(points[k][i] for k in ids)/len(ids)-centre[i] for i in range(3)]
        if sum(x*y for x,y in zip(normal,middle))<0:ids.reverse()
        for j in range(1,len(ids)-1):faces.append((ids[0],ids[j],ids[j+1]))
    for axis in range(3):
        other=[i for i in range(3) if i!=axis]
        for sign in [-1,1]:
            coords=[]
            for s,t in [(-1,-1),(1,-1),(1,1),(-1,1)]:
                p=[0.,0.,0.];p[axis]=sign*(a[axis]+r)
                p[other[0]]=s*a[other[0]];p[other[1]]=t*a[other[1]];coords.append(p)
            polygon(coords)
        i,j=other
        for si,sj in itertools.product([-1,1],repeat=2):
            def edge(t,end):
                p=[0.,0.,0.];p[axis]=end*a[axis]
                p[i]=si*(a[i]+r*math.cos(t));p[j]=sj*(a[j]+r*math.sin(t));return p
            for k in range(n):
                t0=k*math.pi/(2*n);t1=(k+1)*math.pi/(2*n)
                polygon([edge(t0,-1),edge(t1,-1),edge(t1,1),edge(t0,1)])
    for signs in itertools.product([-1,1],repeat=3):
        def corner(i,j):
            phi=i*math.pi/(2*n);theta=j*math.pi/(2*n)
            unit=[math.sin(phi)*math.cos(theta),math.sin(phi)*math.sin(theta),math.cos(phi)]
            return [signs[k]*(a[k]+r*unit[k]) for k in range(3)]
        for i in range(n):
            for j in range(n):polygon([corner(i,j),corner(i+1,j),corner(i+1,j+1),corner(i,j+1)])
    return points,faces


class DaybedContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'rest-furniture-model-spec.json').read_text())
        cls.bed=cls.data['assets'][0];cls.p=cls.bed['parts']

    def test_existing_geometry_pillow_palette_and_images_preserved(self):
        self.assertEqual(desk.digest(self.p),BASELINE['parts'])
        # Pillow now has its own review; preserve its original numeric construction.
        self.assertEqual(desk.digest(self.data['assets'][1]['construction']),'ca92131076f04d7892c8dcad064549fc8c14e8eaa8baeae96f9c0ece8331f685')
        self.assertEqual(desk.digest(self.data['materials']),BASELINE['materials'])
        for name,checksum in BASELINE['images'].items():
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),checksum)

    def test_six_contacts_and_rounded_pad_flat_support(self):
        platform=self.p['platform'];head=self.p['headboard'];pad=self.p['pad'];legs=self.p['legs']
        self.assertEqual(legs['zRange'][1],platform['min'][2])
        self.assertEqual(head['min'][2],platform['max'][2])
        low=[c-d/2 for c,d in zip(pad['center'],pad['outerSize'])]
        self.assertAlmostEqual(low[2],platform['max'][2])
        for x,y in legs['centersXY']:
            self.assertGreater(x-legs['sizeXY'][0]/2,platform['min'][0])
            self.assertLess(x+legs['sizeXY'][0]/2,platform['max'][0])
            self.assertGreater(y-legs['sizeXY'][1]/2,platform['min'][1])
            self.assertLess(y+legs['sizeXY'][1]/2,platform['max'][1])
        for axis in range(2):
            self.assertGreater(pad['center'][axis]-pad['innerBoxSize'][axis]/2,platform['min'][axis])
            self.assertLess(pad['center'][axis]+pad['innerBoxSize'][axis]/2,platform['max'][axis])
        self.assertAlmostEqual(math.prod(legs['sizeXY']),.0036)
        self.assertAlmostEqual((head['max'][0]-head['min'][0])*(head['max'][1]-head['min'][1]),.03)
        self.assertAlmostEqual(pad['innerBoxSize'][0]*pad['innerBoxSize'][1],1.139)
        self.assertAlmostEqual(desk.rounded_field([.02,0,.34],pad['center'],pad['outerSize'],pad['roundingRadius']),0)
        # A bounding-box corner is not part of the rounded pad's contact footprint.
        self.assertGreater(desk.rounded_field([low[0],low[1],.34],pad['center'],pad['outerSize'],pad['roundingRadius']),.001)

    def test_bounds_clearances_and_whole_unit_scaling(self):
        p=self.p;pad=p['pad'];platform=p['platform'];head=p['headboard']
        lo=[c-d/2 for c,d in zip(pad['center'],pad['outerSize'])]
        hi=[c+d/2 for c,d in zip(pad['center'],pad['outerSize'])]
        self.assertAlmostEqual(lo[0]-head['max'][0],.01)
        self.assertAlmostEqual(platform['max'][0]-hi[0],.01)
        self.assertAlmostEqual(platform['max'][1]-hi[1],.02)
        self.assertAlmostEqual(hi[2],.42)
        for outer,inner in zip(pad['outerSize'],pad['innerBoxSize']):self.assertAlmostEqual(outer-inner,2*pad['roundingRadius'])
        self.assertEqual(self.bed['bounds'],[1.8,.75,.65])
        for target in [(3.6,.375,.975),(.9,1.5,.325)]:
            scale=[a/b for a,b in zip(target,self.bed['bounds'])]
            self.assertAlmostEqual((lo[0]-head['max'][0])*scale[0],.01*scale[0])
            self.assertAlmostEqual(hi[2]*scale[2],.42*scale[2])
            self.assertAlmostEqual(head['max'][2]*scale[2],target[2])

    def test_pad_tessellation_manifold_bounds_and_lod(self):
        pad=self.p['pad']
        for tier in self.bed['lod']['tiers']:
            n=tier['segmentsPerQuarter'];points,faces=pad_mesh(pad,n);edges=Counter()
            self.assertEqual(len(faces),16*n*n+16*n+12)
            self.assertEqual(len(faces)+6*12,tier['triangleCount'])
            self.assertLessEqual(len(faces)+72,tier['maxTriangles'])
            self.assertLessEqual(pad['roundingRadius']*(1-math.cos(math.pi/(2*n))),tier['maxSurfaceError'])
            for point in points:self.assertAlmostEqual(desk.rounded_field(point,pad['center'],pad['outerSize'],pad['roundingRadius']),0,places=11)
            for axis in range(3):
                self.assertAlmostEqual(max(v[axis] for v in points)-min(v[axis] for v in points),pad['outerSize'][axis])
            for a,b,c in faces:
                p,q,r=[points[k] for k in [a,b,c]]
                u=[q[i]-p[i] for i in range(3)];v=[r[i]-p[i] for i in range(3)]
                normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
                midpoint=[(p[i]+q[i]+r[i])/3 for i in range(3)]
                self.assertLessEqual(abs(desk.rounded_field(midpoint,pad['center'],pad['outerSize'],pad['roundingRadius'])),tier['maxSurfaceError'])
                self.assertGreater(sum(normal[i]*((p[i]+q[i]+r[i])/3-pad['center'][i]) for i in range(3)),0)
                for i,j in [(a,b),(b,c),(c,a)]:edges[i,j]+=1
            for (i,j),count in edges.items():self.assertEqual((count,edges[j,i]),(1,1))
            self.assertEqual(len(points)-len(edges)//2+len(faces),2)

    def test_document_tables_links_and_seven_regions(self):
        doc=(ROOT/'DAYBED-SPEC.md').read_text()
        for target in re.findall(r'\[[^]]+\]\(([^)]+)\)',doc):self.assertTrue((ROOT/target.split('#')[0]).exists(),target)
        rows={}
        legs=self.p['legs']
        for i,(x,y) in enumerate(legs['centersXY']):
            rows[f'leg-{i}']=([x,y,sum(legs['zRange'])/2],[*legs['sizeXY'],legs['zRange'][1]-legs['zRange'][0]],0)
        for name in ['platform','headboard']:
            part=self.p[name]
            rows[name]=([(a+b)/2 for a,b in zip(part['min'],part['max'])],[b-a for a,b in zip(part['min'],part['max'])],0)
        pad=self.p['pad'];rows['pad']=(pad['center'],pad['outerSize'],pad['roundingRadius'])
        for name,(center,size,radius) in rows.items():
            line=next(v for v in doc.splitlines() if re.match(r'\|\s*'+name+r'\s*\|',v))
            cells=[v.strip() for v in line.split('|')[1:-1]]
            for expected,actual in zip(center,[float(v) for v in cells[1].strip('()').split(',')]):self.assertAlmostEqual(expected*1000,actual)
            for expected,actual in zip(size,[float(v) for v in cells[2].split(' x ')]):self.assertAlmostEqual(expected*1000,actual)
            self.assertAlmostEqual(radius*1000,float(cells[3]))
        head=self.p['headboard']
        for name,count,area in [('leg/platform',4,math.prod(legs['sizeXY'])),
                                ('headboard/platform',1,(head['max'][0]-head['min'][0])*(head['max'][1]-head['min'][1])),
                                ('pad/platform',1,pad['innerBoxSize'][0]*pad['innerBoxSize'][1])]:
            line=next(v for v in doc.splitlines() if re.match(r'\|\s*'+re.escape(name)+r'\s*\|',v))
            cells=[v.strip() for v in line.split('|')[1:-1]]
            self.assertEqual(int(cells[1]),count)
            self.assertAlmostEqual(float(cells[3]),area*1e6)
        regions=self.bed['appearance']['regions']
        self.assertEqual(len(regions),7);self.assertEqual(len({v['id'] for v in regions}),7)
        self.assertEqual([v['id'] for v in regions if v['defaultMaterial']=='sage'],['pad'])
        self.assertEqual(self.bed['constructionReview']['contactCount'],6)
        self.assertFalse(self.bed['constructionReview']['modelVerified'])
        for tier in self.bed['lod']['tiers']:
            row=next(s for s in doc.splitlines() if re.match(r'\|\s*'+tier['id']+r'\s*\|',s))
            values=[v.strip() for v in row.split('|')[1:-1]]
            self.assertEqual(int(values[1]),tier['segmentsPerQuarter'])
            self.assertEqual(int(values[2]),tier['triangleCount'])
            self.assertEqual(int(values[3]),tier['maxTriangles'])
            self.assertAlmostEqual(float(values[4])/1000,tier['maxSurfaceError'])


if __name__=='__main__':unittest.main(verbosity=2)
