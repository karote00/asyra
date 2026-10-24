"""Sleeping-pillow reference checks; analytic geometry is held in memory only."""
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]
BASELINE={'daybed': '404079b07549be03db929c5f1a07e5dd3d9123b7894e2be9754311cc0d8f8285', 'construction': 'ca92131076f04d7892c8dcad064549fc8c14e8eaa8baeae96f9c0ece8331f685', 'materials': 'fd7754a9d7c381e9fcbc3a32d189a6a55192496d3c5d71fad0c76935539d0710', 'images': {'02-ivory-sleeping-pillow-v1.png': 'd7da88ea24fd8175d013f18d81ea1121c8b11d9a9f156c70b5b38a5e65eaa0fa', '01-sage-nap-daybed-v1.png': '2cb79b2afa44051bb6cd4997410dd52f47a92e5a11c3f0ff677aa2bfad831872'}}
source=importlib.util.spec_from_file_location('daybed_checks',Path(__file__).with_name('test_daybed_spec.py'))
daybed=importlib.util.module_from_spec(source);source.loader.exec_module(daybed)


class SleepingPillowContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'rest-furniture-model-spec.json').read_text())
        cls.pillow=cls.data['assets'][1];cls.shape=cls.pillow['construction']

    def test_approved_daybed_dimensions_palette_and_sources_preserved(self):
        self.assertEqual(daybed.desk.digest(self.data['assets'][0]),BASELINE['daybed'])
        self.assertEqual(daybed.desk.digest(self.shape),BASELINE['construction'])
        self.assertEqual(daybed.desk.digest(self.data['materials']),BASELINE['materials'])
        for name,checksum in BASELINE['images'].items():
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),checksum)

    def test_flat_support_bounds_and_scaling_origin(self):
        p=self.shape;r=p['roundingRadius']
        self.assertEqual(self.pillow['bounds'],p['outerSize'])
        for outer,inner in zip(p['outerSize'],p['innerBoxSize']):self.assertAlmostEqual(outer-inner,2*r)
        self.assertAlmostEqual(p['center'][2]-p['outerSize'][2]/2,0)
        self.assertAlmostEqual(p['innerBoxSize'][0]*p['innerBoxSize'][1],.1008)
        for x,y in [(-.21,-.12),(.21,-.12),(.21,.12),(-.21,.12),(0,0)]:
            self.assertAlmostEqual(daybed.desk.rounded_field([x,y,0],p['center'],p['outerSize'],r),0)
        self.assertGreater(daybed.desk.rounded_field([.25,.16,0],p['center'],p['outerSize'],r),.001)
        for target in [(1,.16,.15),(.25,.64,.05)]:
            scale=[t/d for t,d in zip(target,p['outerSize'])]
            center=[c*s for c,s in zip(p['center'],scale)]
            self.assertAlmostEqual(center[2]-target[2]/2,0)
            self.assertAlmostEqual(center[2]+target[2]/2,target[2])
            self.assertAlmostEqual((2*r)*scale[2],.08*scale[2])

    def test_closed_patch_topology_support_and_lod_error(self):
        p=self.shape
        for tier in self.pillow['lod']['tiers']:
            n=tier['segmentsPerQuarter'];points,faces=daybed.pad_mesh(p,n);edges=Counter()
            self.assertEqual(len(faces),16*n*n+16*n+12)
            self.assertEqual(len(faces),tier['triangleCount'])
            self.assertLessEqual(len(faces),tier['maxTriangles'])
            self.assertLessEqual(p['roundingRadius']*(1-math.cos(math.pi/(2*n))),tier['maxSurfaceError'])
            for i in range(3):
                self.assertAlmostEqual(min(q[i] for q in points),p['center'][i]-p['outerSize'][i]/2)
                self.assertAlmostEqual(max(q[i] for q in points),p['center'][i]+p['outerSize'][i]/2)
            for q in points:self.assertAlmostEqual(daybed.desk.rounded_field(q,p['center'],p['outerSize'],p['roundingRadius']),0)
            bottom_area=0
            for a,b,c in faces:
                v,w,q=[points[k] for k in (a,b,c)]
                u=[w[i]-v[i] for i in range(3)];t=[q[i]-v[i] for i in range(3)]
                normal=[u[1]*t[2]-u[2]*t[1],u[2]*t[0]-u[0]*t[2],u[0]*t[1]-u[1]*t[0]]
                center=[(v[i]+w[i]+q[i])/3 for i in range(3)]
                self.assertGreater(sum(normal[i]*(center[i]-p['center'][i]) for i in range(3)),0)
                if all(abs(point[2])<1e-12 for point in [v,w,q]):bottom_area+=abs(normal[2])/2
                self.assertLessEqual(abs(daybed.desk.rounded_field(center,p['center'],p['outerSize'],p['roundingRadius'])),tier['maxSurfaceError'])
                for i,j in [(a,b),(b,c),(c,a)]:edges[i,j]+=1
            for (i,j),count in edges.items():self.assertEqual((count,edges[j,i]),(1,1))
            self.assertEqual(len(points)-len(edges)//2+len(faces),2)
            self.assertAlmostEqual(bottom_area,.1008)

    def test_document_dimensions_projections_regions_and_links(self):
        doc=(ROOT/'SLEEPING-PILLOW-SPEC.md').read_text()
        for target in re.findall(r'\[[^]]+\]\(([^)]+)\)',doc):self.assertTrue((ROOT/target.split('#')[0]).exists(),target)
        for label,expected in [('Outside size XYZ',self.shape['outerSize']),('Inner box size XYZ',self.shape['innerBoxSize']),('Centre XYZ',self.shape['center'])]:
            row=next(v for v in doc.splitlines() if re.match(r'\|\s*'+label+r'\s*\|',v))
            values=[float(v) for v in row.split('|')[2].strip().split(' x ')]
            for value,want in zip(values,expected):self.assertAlmostEqual(value,want*1000)
        axes={'FRONT / BACK':(0,2),'RIGHT':(1,2),'TOP / BOTTOM':(0,1)}
        for label,(i,j) in axes.items():
            row=next(v for v in doc.splitlines() if re.match(r'\|\s*'+re.escape(label)+r'\s*\|',v))
            values=[float(v) for v in row.split('|')[2].strip().split(' x ')]
            self.assertEqual(values,[self.shape['outerSize'][i]*1000,self.shape['outerSize'][j]*1000])
        self.assertEqual(self.pillow['appearance']['regions'],[{'id':'body','defaultMaterial':'ivory'}])
        self.assertFalse(self.pillow['constructionReview']['modelVerified'])
        self.assertEqual(self.pillow['constructionReview']['closedComponentCount'],1)
        for tier in self.pillow['lod']['tiers']:
            row=next(v for v in doc.splitlines() if re.match(r'\|\s*'+tier['id']+r'\s*\|',v))
            values=[v.strip() for v in row.split('|')[1:-1]]
            self.assertEqual([int(v) for v in values[1:4]],[tier['segmentsPerQuarter'],tier['triangleCount'],tier['maxTriangles']])
            self.assertAlmostEqual(float(values[4])/1000,tier['maxSurfaceError'])


if __name__=='__main__':unittest.main(verbosity=2)
