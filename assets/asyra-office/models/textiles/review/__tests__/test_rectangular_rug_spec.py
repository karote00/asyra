"""Rectangular-rug construction checks; no production asset is exported."""
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]
BASELINE={'geometry': '54efc2ce9a3f6ef6857555557c67e7cb06a4d9d3f6c141cbe86737fa794c69b4', 'regions': '145beb52a03ebb8f641ade1468bae41e1339d5500eb8fc7954ae061ade1de211', 'images': {'01-rectangular-rug-v1.png': '21c58ef0b6b9e6bcda657ec5fbbaa52695294e5ecb3bfb8dffe424a14b8ef1ad'}}


def digest(v):return hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def outline(g,radius,n):
    cx=g['width']/2-g['planCornerRadius'];cy=g['depth']/2-g['planCornerRadius']
    points=[]
    for x,y,start in [(cx,cy,0),(-cx,cy,90),(-cx,-cy,180),(cx,-cy,270)]:
        for j in range(n+1):
            t=math.radians(start+90*j/n);points.append((x+radius*math.cos(t),y+radius*math.sin(t)))
    return points


def mesh(g,n,m):
    b=g['topBottomEdgeBevel'];r=g['planCornerRadius'];h=g['height'];rings=[]
    for j in range(m+1):
        t=j*math.pi/(2*m);rings.append((b-b*math.cos(t),r-b+b*math.sin(t)))
    for j in range(m+1):
        t=j*math.pi/(2*m);rings.append((h-b+b*math.sin(t),r-b+b*math.cos(t)))
    N=4*(n+1);points=[(x,y,z) for z,rho in rings for x,y in outline(g,rho,n)];faces=[]
    last=(len(rings)-1)*N
    for j in range(1,N-1):faces.extend([(0,j+1,j),(last,last+j,last+j+1)])
    for k in range(len(rings)-1):
        for j in range(N):
            a=k*N+j;b0=k*N+(j+1)%N;c=b0+N;d=a+N
            faces.extend([(a,b0,c),(a,c,d)])
    return points,faces


def mask_distance(x,y,g,mask):
    q=[abs(x)-(mask['width']/2-mask['radius']),abs(y)-(mask['depth']/2-mask['radius'])]
    return math.hypot(max(q[0],0),max(q[1],0))+min(max(q),0)-mask['radius']


class RectangularRugTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'textiles-model-spec.json').read_text());cls.rug=cls.data['modules'][0];cls.g=cls.rug['geometry']

    def test_original_rug_geometry_and_reference_preserved(self):
        self.assertEqual(digest(self.g),BASELINE['geometry'])
        self.assertEqual(digest(self.rug['surfaceRegions']),BASELINE['regions'])
        for name,checksum in BASELINE['images'].items():self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),checksum)

    def test_lod_closed_outward_mesh_counts_and_supports(self):
        g=self.g
        for tier in self.rug['lod']['tiers']:
            n=tier['segmentsPerCorner'];m=tier['bevelSegments'];points,faces=mesh(g,n,m);edges=Counter();volume=0
            self.assertEqual(len(faces),4*(4*(n+1))*(m+1)-4)
            self.assertEqual(len(faces),tier['triangleCount']);self.assertLessEqual(len(faces),tier['maxTriangles'])
            error=g['planCornerRadius']*(1-math.cos(math.pi/(4*n)))+g['topBottomEdgeBevel']*(1-math.cos(math.pi/(4*m)))
            self.assertLessEqual(error,tier['maxSurfaceError'])
            for i in range(3):
                self.assertAlmostEqual(min(p[i] for p in points),self.rug['bounds']['min'][i])
                self.assertAlmostEqual(max(p[i] for p in points),self.rug['bounds']['max'][i])
            for a,b,c in faces:
                p,q,r=[points[k] for k in [a,b,c]]
                u=[q[i]-p[i] for i in range(3)];v=[r[i]-p[i] for i in range(3)]
                normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
                middle=[(p[i]+q[i]+r[i])/3 for i in range(3)];middle[2]-=g['height']/2
                self.assertGreater(sum(a*b for a,b in zip(normal,middle)),0)
                volume+=sum(p[i]*normal[i] for i in range(3))/6
                for i,j in [(a,b),(b,c),(c,a)]:edges[i,j]+=1
            self.assertGreater(volume,0)
            for (i,j),count in edges.items():self.assertEqual((count,edges[j,i]),(1,1))
            self.assertEqual(len(points)-len(edges)//2+len(faces),2)

    def test_cap_geometry_and_binding_mask(self):
        g=self.g;mask=self.rug['appearance']['bindingMask'];b=g['topBottomEdgeBevel'];w=self.rug['surfaceRegions']['topBinding']['width']
        self.assertAlmostEqual(mask['width'],g['width']-2*w)
        self.assertAlmostEqual(mask['depth'],g['depth']-2*w)
        self.assertAlmostEqual(mask['radius'],g['planCornerRadius']-w)
        self.assertAlmostEqual((g['width']-2*b-mask['width'])/2,.011)
        self.assertLess(mask_distance(0,0,g,mask),0)
        for x,y in [(mask['width']/2,0),(0,mask['depth']/2)]:
            self.assertAlmostEqual(mask_distance(x,y,g,mask),0)
            self.assertLess(mask_distance(x*.999,y*.999,g,mask),0)
            self.assertGreater(mask_distance(x*1.001,y*1.001,g,mask),0)
        # Inner and cap arcs share their centres: the flat binding stays 11 mm wide.
        cx=g['width']/2-g['planCornerRadius'];cy=g['depth']/2-g['planCornerRadius']
        for j in range(13):
            t=j*math.pi/24
            x=cx+mask['radius']*math.cos(t);y=cy+mask['radius']*math.sin(t)
            self.assertAlmostEqual(mask_distance(x,y,g,mask),0)
        for target in [(2.8,.475,.016),(.7,1.9,.004)]:
            scale=[t/d for t,d in zip(target,self.rug['overallSize'])]
            self.assertAlmostEqual((g['width']-2*b)*scale[0],target[0]-2*b*scale[0])
            self.assertAlmostEqual(w*scale[0],.012*scale[0])
            self.assertEqual(0*scale[2],0)

    def test_derived_dimensions_and_default_appearance_are_consistent(self):
        g = self.g
        review = self.rug['constructionReview']
        edge = g['topBottomEdgeBevel']
        self.assertEqual(review['flatCapSize'], [g['width'] - 2*edge, g['depth'] - 2*edge])
        self.assertAlmostEqual(review['flatCapRadius'], g['planCornerRadius'] - edge)
        self.assertAlmostEqual(review['flatBindingWidth'], self.rug['surfaceRegions']['topBinding']['width'] - edge)
        self.assertEqual(review['verticalSideZ'], [edge, g['height'] - edge])
        self.assertEqual(self.rug['sizing']['defaultSize'], self.rug['overallSize'])
        self.assertEqual(self.rug['sizing']['applicationCount'], 1)
        self.assertEqual(self.rug['sizing']['origin'], [0, 0, 0])
        expected = {'top-body': 'sage', 'top-binding': 'sage-binding',
                    'sides-and-bevels': 'sage-binding', 'bottom-body': 'backing',
                    'bottom-binding': 'sage-binding'}
        for region in self.rug['appearance']['regions']:
            material = expected[region['id']]
            self.assertEqual(region['defaultMaterial'], material)
            self.assertEqual(region['defaultColorSRGB'], self.data['materials'][material]['baseColorSRGB'])
            self.assertEqual(region['defaultWeave'], region['id'] in ('top-body', 'bottom-body'))
        for target in [(2.8, .475, .016), (.7, 1.9, .004)]:
            scale = [t/d for t, d in zip(target, self.rug['overallSize'])]
            points, _ = mesh(g, 12, 3)
            for axis in range(3):
                values = [p[axis] * scale[axis] for p in points]
                self.assertAlmostEqual(max(values) - min(values), target[axis])
            self.assertEqual(min(p[2] * scale[2] for p in points), 0)
            # An inverse scale recovers the same band classification on a resized cap.
            for x, y in [(0, 0), (.69, 0), (.699, 0), (.68, .46)]:
                resized = (x*scale[0], y*scale[1])
                self.assertAlmostEqual(mask_distance(resized[0]/scale[0], resized[1]/scale[1], g, self.rug['appearance']['bindingMask']),
                                       mask_distance(x, y, g, self.rug['appearance']['bindingMask']))

    def test_doc_tables_links_and_region_contract(self):
        doc=(ROOT/'RECTANGULAR-RUG-SPEC.md').read_text()
        for target in re.findall(r'\[[^]]+\]\(([^)]+)\)',doc):self.assertTrue((ROOT/target.split('#')[0]).exists(),target)
        self.assertEqual(self.rug['constructionReview']['closedComponentCount'],1)
        self.assertFalse(self.rug['constructionReview']['modelVerified'])
        regions=self.rug['appearance']['regions']
        self.assertEqual(len(regions),5);self.assertEqual(len({r['id'] for r in regions}),5)
        self.assertEqual(self.rug['appearance']['bindingMask']['boundaryOwner'],'binding')
        self.assertIn('11 mm',doc)
        self.assertIn('per surface sample',doc)
        for tier in self.rug['lod']['tiers']:
            row=next(v for v in doc.splitlines() if re.match(r'\|\s*'+tier['id']+r'\s*\|',v))
            fields=[v.strip() for v in row.split('|')[1:-1]]
            self.assertEqual([int(v) for v in fields[1:5]],[tier['segmentsPerCorner'],tier['bevelSegments'],tier['triangleCount'],tier['maxTriangles']])
            self.assertAlmostEqual(float(fields[5])/1000,tier['maxSurfaceError'])


if __name__=='__main__':unittest.main(verbosity=2)
