"""Whiteboard construction checks; analytic evidence, not a production asset."""
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
BASELINE = {'table': '1ae1134e931ab7dd295ec82d4059c73e7f73dbda3bc007af594a8c68ed3a5400', 'whiteboardParts': '18e3847642b6582c4ce37815a4a97e1c148e2dfa6538f856ba305200f01a5de4', 'materials': '675d4d04aff1faa64c40470b8838ff13213e01c43bb14724bc32796910fe6122', 'images': {'02-blank-whiteboard-v1.png': 'aa589326789353b62406d60a26e84e6ead66d48e0914bb250bf88da3b5599318', '01-wooden-meeting-table-v1.png': '2e4eb9a4e2995f0a82cc2757321f1123c0fc6489c38a9de293004a810013da5d'}}


def digest(v):
    return hashlib.sha256(json.dumps(v, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def area(poly):
    return sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(poly, poly[1:]+poly[:1]))/2


def prism(poly, yrange):
    n=len(poly)
    points=[(x,y,z) for y in yrange for x,z in poly]
    faces=[]
    for j in range(1,n-1):
        faces.extend([(0,j,j+1),(n,n+j+1,n+j)])
    for j in range(n):
        k=(j+1)%n
        faces.extend([(j,n+j,n+k),(j,n+k,k)])
    return points,faces


class WhiteboardContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'meeting-furniture-model-spec.json').read_text())
        cls.board=cls.data['assets'][1]
        cls.parts=cls.board['parts']

    def test_preserved_sources_dimensions_palette_and_approved_table(self):
        self.assertEqual(digest(self.data['assets'][0]),BASELINE['table'])
        self.assertEqual(digest(self.parts),BASELINE['whiteboardParts'])
        self.assertEqual(digest(self.data['materials']),BASELINE['materials'])
        for name,checksum in BASELINE['images'].items():
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),checksum)

    def test_miter_profiles_tile_ring_and_share_four_diagonals(self):
        profiles=[m['polygonXZ'] for m in self.board['frameMembers']]
        self.assertEqual(len(profiles),4)
        expected=self.parts['frame']['outer'][0]*self.parts['frame']['outer'][1]-self.parts['frame']['inner'][0]*self.parts['frame']['inner'][1]
        self.assertAlmostEqual(sum(area(p) for p in profiles),expected)
        diagonal=[]
        for poly in profiles:
            self.assertGreater(area(poly),0)
            for a,b in zip(poly,poly[1:]+poly[:1]):
                dx,dz=b[0]-a[0],b[1]-a[1]
                if abs(dx)>1e-9 and abs(dz)>1e-9:
                    self.assertAlmostEqual(abs(dx),.025)
                    self.assertAlmostEqual(abs(dz),.025)
                    diagonal.append((tuple(a),tuple(b)))
        self.assertEqual(len(diagonal),8)
        for a,b in diagonal:
            self.assertEqual(diagonal.count((b,a)),1)
        # Include boundary points: a shared miter belongs to both closed prisms.
        def inside(p,x,z):
            return all((b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0])>=-1e-12 for a,b in zip(p,p[1:]+p[:1]))
        for x in [-.443,-.431,-.411,-.109,.107,.409,.433,.447]:
            for z in [-.293,-.281,-.269,-.103,.109,.271,.283,.297]:
                count=sum(inside(p,x,z) for p in profiles)
                ring=abs(x)<.45 and abs(z)<.3 and not(abs(x)<.425 and abs(z)<.275)
                self.assertEqual(count>0,ring)
                if count>1:
                    self.assertEqual(count,2)
                    self.assertAlmostEqual(abs(x)-abs(z),.15)
        # Convex clipping proves pairwise zero-area intersection, not just samples.
        def cross(a,b,p):
            return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
        def clipped(subject,clip):
            result=subject[:]
            for a,b in zip(clip,clip[1:]+clip[:1]):
                old=result;result=[]
                if not old:break
                for p,q in zip(old,old[1:]+old[:1]):
                    dp,dq=cross(a,b,p),cross(a,b,q)
                    if dp>=-1e-12:result.append(p)
                    if (dp < -1e-12) != (dq < -1e-12):
                        t=dp/(dp-dq)
                        result.append([p[k]+t*(q[k]-p[k]) for k in range(2)])
            return result
        for i,p in enumerate(profiles):
            for q in profiles[i+1:]:
                intersection=clipped(p,q)
                self.assertAlmostEqual(abs(area(intersection)) if intersection else 0,0)

    def test_frame_meshes_are_closed_outward_and_counted(self):
        count=0
        for member in self.board['frameMembers']:
            poly=member['polygonXZ'];points,faces=prism(poly,self.parts['frame']['yRange'])
            edges=Counter();volume=0.
            for a,b,c in faces:
                for u,v in [(a,b),(b,c),(c,a)]:edges[(u,v)]+=1
                p,q,r=points[a],points[b],points[c]
                u=[q[i]-p[i] for i in range(3)];v=[r[i]-p[i] for i in range(3)]
                normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
                self.assertGreater(sum(c*c for c in normal),1e-18)
                volume+=sum(p[i]*normal[i] for i in range(3))/6
            for (u,v),n in edges.items():
                self.assertEqual(n,1);self.assertEqual(edges[(v,u)],1)
            self.assertAlmostEqual(volume,area(poly)*.025)
            self.assertEqual(len(points)-len(edges)//2+len(faces),2)
            count+=len(faces)
        count+=3*12
        self.assertEqual(count,84)
        for tier in self.board['lod']['tiers']:
            self.assertEqual(tier['triangleCount'],count)
            self.assertEqual(tier['maxSurfaceError'],0)

    def test_bounds_recess_cavity_projection_and_thirteen_contacts(self):
        p=self.parts;f=p['frame'];panel=p['writingPanel'];back=p['backing'];tray=p['tray']
        self.assertAlmostEqual(panel['min'][1]-f['yRange'][0],.004)
        self.assertAlmostEqual(back['min'][1]-panel['max'][1],.012)
        self.assertEqual(back['max'][1],0)
        for part in [panel,back]:
            self.assertEqual([part['min'][0],part['max'][0]],[-f['inner'][0]/2,f['inner'][0]/2])
            self.assertEqual([part['min'][2],part['max'][2]],[-f['inner'][1]/2,f['inner'][1]/2])
            self.assertGreater(part['min'][1],f['yRange'][0]);self.assertLessEqual(part['max'][1],f['yRange'][1])
        self.assertEqual(tray['max'][2],-f['outer'][1]/2)
        self.assertAlmostEqual(f['yRange'][0]-tray['min'][1],.035)
        self.assertAlmostEqual((tray['max'][0]-tray['min'][0])*.025,.015)
        self.assertEqual(self.board['constructionReview']['contactCount'],4+4+4+1)
        self.assertEqual(self.board['bounds'],{'x':[-.45,.45],'y':[-.06,0],'z':[-.312,.3]})
        # Canonical RIGHT screen-right is +Y: the forward tray tip is on screen-left.
        self.assertLess(tray['min'][1],f['yRange'][0])
        for target in [(1.8,.03,.918),(.45,.12,.306)]:
            default=[.9,.06,.612];scale=[t/d for t,d in zip(target,default)]
            for i,axis in enumerate('xyz'):
                lo,hi=self.board['bounds'][axis]
                self.assertAlmostEqual((hi-lo)*scale[i],target[i])
            self.assertEqual(0*scale[1],0)

    def test_current_side_drawing_matches_geometry_and_preserves_other_views(self):
        import subprocess
        import sys
        subprocess.run([sys.executable,'-B',str(ROOT/'review/draw_whiteboard_side.py'),'--check'],check=True,capture_output=True,text=True)
        record=json.loads((ROOT/'review/whiteboard-side-record.json').read_text())
        frame,tray=record['frameRectXYWH'],record['trayRectXYWH']
        self.assertAlmostEqual(frame[1]+frame[3],tray[1])
        self.assertAlmostEqual(frame[0]+frame[2],tray[0]+tray[2])
        self.assertAlmostEqual((frame[0]-tray[0])/record['pixelsPerMetre'],.035)
        self.assertAlmostEqual(tray[3]/record['pixelsPerMetre'],.012)
        self.assertEqual(record['pixelVerification']['outsidePatchChangedPixels'],0)
        self.assertEqual(self.board['constructionReview']['referenceSheet'],'review/'+record['current'])

    def test_handoff_axes_and_non_rendered_frame_envelope(self):
        # Handoff prose must not silently permute Y depth and Z height.
        gallery=(ROOT/'review/README.md').read_text()
        geometry=(ROOT/'GEOMETRY-SUPPLEMENT.md').read_text()
        overview=(ROOT/'README.md').read_text()
        expected=self.board['sizing']['defaultExtentsXYZ']
        match=re.search(r'Overall XYZ size: ([0-9.]+) x ([0-9.]+) x ([0-9.]+) m',gallery)
        self.assertIsNotNone(match,'Gallery must explicitly label XYZ order')
        self.assertEqual([float(v) for v in match.groups()],expected)
        frame=self.parts['frame']
        match=re.search(r'Frame XYZ size: ([0-9.]+) x ([0-9.]+) x ([0-9.]+) m',geometry)
        self.assertIsNotNone(match,'Geometry overview must explicitly label frame XYZ order')
        actual=[frame['outer'][0],frame['yRange'][1]-frame['yRange'][0],frame['outer'][1]]
        self.assertEqual([float(v) for v in match.groups()],actual)
        self.assertNotIn('Approved for this reference handoff',gallery)
        self.assertNotIn('Approved for this reference handoff',overview)
        self.assertIn('Do not emit parts.frame as an additional mesh',self.board['constructionReview']['rule'])
        doc=(ROOT/'WHITEBOARD-SPEC.md').read_text()
        self.assertIn('Do not emit `parts.frame` as an additional mesh',doc)

    def test_document_dimensions_regions_and_authority(self):
        doc=(ROOT/'WHITEBOARD-SPEC.md').read_text()
        for target in re.findall(r'\[[^]]+\]\(([^)]+)\)',doc):
            self.assertTrue((ROOT/target.split('#')[0]).exists(),target)
        for name,key in [('writing-panel','writingPanel'),('backing','backing'),('tray','tray')]:
            row=next(s for s in doc.splitlines() if re.match(r'\|\s*'+name+r'\s*\|',s))
            fields=[c.strip() for c in row.split('|')[1:-1]]
            for col,endpoint in [(1,'min'),(2,'max')]:
                nums=[float(v) for v in fields[col].strip('()').split(',')]
                for n,actual in zip(nums,self.parts[key][endpoint]):self.assertAlmostEqual(n,actual*1000)
        regions=self.board['appearance']['regions']
        self.assertEqual(len(regions),7);self.assertEqual(len({r['id'] for r in regions}),7)
        self.assertEqual(sum(r['defaultMaterial']=='ivory' for r in regions),1)
        self.assertIn('RIGHT',doc);self.assertIn('mirrored',doc)
        self.assertFalse(self.board['constructionReview']['modelVerified'])
        self.assertEqual(self.board['sizing']['instanceScaleApplications'],1)
        for member in self.board['frameMembers']:
            row=next(line for line in doc.splitlines() if re.match(r'\|\s*'+member['id']+r'\s*\|',line))
            pairs=re.findall(r'\((-?[0-9.]+),(-?[0-9.]+)\)',row)
            self.assertEqual(len(pairs),4)
            for pair,point in zip(pairs,member['polygonXZ']):
                for value,expected in zip(pair,point):self.assertAlmostEqual(float(value),expected*1000)
        for tier in self.board['lod']['tiers']:
            row=next(line for line in doc.splitlines() if re.match(r'\|\s*'+tier['id']+r'\s*\|',line))
            fields=[v.strip() for v in row.split('|')[1:-1]]
            self.assertEqual(int(fields[1]),7)
            self.assertEqual(int(fields[2]),tier['triangleCount'])
            self.assertEqual(int(fields[3]),tier['maxTriangles'])
            self.assertEqual(float(fields[4]),tier['maxSurfaceError'])



if __name__=='__main__':
    unittest.main(verbosity=2)
