"""Throw-pillow analytic document checks; no production mesh is exported."""
from collections import Counter, defaultdict
from itertools import product
import hashlib
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]


def bezier(c, t):
    return tuple((1-t)**3*c[0][i]+3*(1-t)**2*t*c[1][i]+3*(1-t)*t*t*c[2][i]+t**3*c[3][i] for i in range(2))


def mesh(g, intervals, radial):
    outline = [bezier(c, j/n) for c, n in zip(g['outlineCubicSegments'], intervals) for j in range(n)]
    n = len(outline)
    centre, h = g['centre'], .055
    points = [(x, 0, centre[2]+z) for x, z in outline]
    faces = []
    for sign in [-1, 1]:
        pole = len(points)
        points.append((0, sign*h, centre[2]))
        rings = []
        for j in range(1, radial):
            angle = math.pi*j/(2*radial)
            ring = list(range(len(points), len(points)+n))
            points.extend((math.sin(angle)*x, sign*h*math.cos(angle), centre[2]+math.sin(angle)*z) for x, z in outline)
            rings.append(ring)
        rings.append(list(range(n)))
        local = [(pole, rings[0][(i+1)%n], rings[0][i]) for i in range(n)]
        for inner, outer in zip(rings, rings[1:]):
            for i in range(n):
                j = (i+1)%n
                local.extend([(inner[i], inner[j], outer[j]), (inner[i], outer[j], outer[i])])
        # The supplied XZ outline is clockwise. Reverse the back hemisphere.
        faces.extend((a, c, b) if sign == 1 else (a, b, c) for a, b, c in local)
    return points, faces


def error_bound(g, intervals, radial):
    angle_step = math.pi/(2*radial)
    errors = []
    for c, n in zip(g['outlineCubicSegments'], intervals):
        q = max(math.hypot(*p) for p in c)
        m1 = max(3*math.dist(c[i], c[i+1]) for i in range(3))
        m2 = max(6*math.hypot(*(c[i+2][k]-2*c[i+1][k]+c[i][k] for k in range(2))) for i in range(2))
        errors.append(m2/(8*n*n)+max(q,.055)*angle_step**2/8+m1*angle_step/(4*n))
    return max(errors)


class ThrowPillowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT/'textiles-model-spec.json').read_text())
        cls.pillow = next(m for m in cls.data['modules'] if m['moduleId']=='throw-pillow')
        cls.g = cls.pillow['geometry']

    def test_original_reference_outline_and_landmarks(self):
        self.assertEqual(hashlib.sha256((ROOT/self.pillow['reviewDrawing']).read_bytes()).hexdigest(),
                         'c782e061aabe5b8d8ffb9b978166fae675c8e476254276de92d786c1b9df8fe9')
        curves = self.g['outlineCubicSegments']
        self.assertEqual(len(curves), 8)
        for c, following in zip(curves, curves[1:]+curves[:1]):
            self.assertEqual(c[-1], following[0])
        self.assertEqual(self.pillow['overallSize'], [.32,.11,.32])
        for i in [0,2,4,6]:
            middle = bezier(curves[i], .5)
            self.assertAlmostEqual(max(abs(v) for v in middle), .151)
        for i in [1,3,5,7]:
            middle = bezier(curves[i], .5)
            self.assertAlmostEqual(abs(middle[0]), .155875)
            self.assertAlmostEqual(abs(middle[1]), .155875)

    def test_all_lods_closed_outward_and_within_budget(self):
        for tier in self.pillow['lod']['tiers']:
            intervals, radial = tier['outlineIntervals'], tier['radialIntervals']
            self.assertEqual(len(intervals), 8)
            self.assertTrue(all(n>=2 and n%2==0 for n in intervals))
            points, faces = mesh(self.g, intervals, radial)
            self.assertEqual(len(faces), sum(intervals)*(4*radial-2))
            self.assertEqual(len(faces), tier['triangleCount'])
            self.assertLessEqual(len(faces), tier['maxTriangles'])
            self.assertLessEqual(error_bound(self.g, intervals, radial), tier['maxSurfaceError'])
            edges, volume = Counter(), 0
            for axis in range(3):
                self.assertAlmostEqual(min(p[axis] for p in points), self.pillow['bounds']['min'][axis])
                self.assertAlmostEqual(max(p[axis] for p in points), self.pillow['bounds']['max'][axis])
            for a,b,c in faces:
                p,q,r = (points[i] for i in (a,b,c))
                u,v = [q[i]-p[i] for i in range(3)], [r[i]-p[i] for i in range(3)]
                normal = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
                relative = [(p[i]+q[i]+r[i])/3-self.g['centre'][i] for i in range(3)]
                self.assertGreater(sum(x*y for x,y in zip(normal,relative)),0)
                volume += sum(p[i]*normal[i] for i in range(3))/6
                for x,y in [(a,b),(b,c),(c,a)]: edges[x,y]+=1
            self.assertGreater(volume, 0)
            self.assertLess(volume, .32*.11*.32)
            for (a,b),count in edges.items(): self.assertEqual((count,edges[b,a]),(1,1))
            self.assertEqual(len(points)-len(edges)//2+len(faces),2)
            # Coordinate rounding at a half-step can split mathematically equal
            # reflections. Compare nearby buckets within an explicit tolerance.
            tolerance = 1e-10
            buckets = defaultdict(list)
            centred = [(x,y,z-.16) for x,y,z in points]
            for point in centred:
                buckets[tuple(math.floor(v/tolerance) for v in point)].append(point)
            for x,y,z in centred:
                for target in [(-x,y,z),(x,-y,z),(x,y,-z)]:
                    key = tuple(math.floor(v/tolerance) for v in target)
                    found = any(math.dist(p,target)<=tolerance
                                for offset in product((-1,0,1),repeat=3)
                                for p in buckets.get(tuple(key[i]+offset[i] for i in range(3)),()))
                    self.assertTrue(found, f'Missing reflected point near {target}')

    def test_triangle_interpolation_against_analytic_surface(self):
        # Test the actual diagonal interpolation, including collapsed pole cells.
        def surface(c, t, angle):
            x,z = bezier(c,t)
            return (math.sin(angle)*x, -.055*math.cos(angle), .16+math.sin(angle)*z)

        for tier in self.pillow['lod']['tiers']:
            radial = tier['radialIntervals']
            worst = 0
            for c,n in zip(self.g['outlineCubicSegments'],tier['outlineIntervals']):
                for i in range(n):
                    for j in range(radial):
                        a0,a1 = math.pi*j/(2*radial),math.pi*(j+1)/(2*radial)
                        p00,p10 = surface(c,i/n,a0),surface(c,(i+1)/n,a0)
                        p01,p11 = surface(c,i/n,a1),surface(c,(i+1)/n,a1)
                        for t in (.25,.5,.75):
                            for a in (.25,.5,.75):
                                if t>=a:
                                    corners,weights = (p00,p10,p11),(1-t,t-a,a)
                                else:
                                    corners,weights = (p00,p11,p01),(1-a,t,a-t)
                                approximation = tuple(sum(w*p[k] for w,p in zip(weights,corners)) for k in range(3))
                                exact = surface(c,(i+t)/n,a0+a*(a1-a0))
                                worst = max(worst,math.dist(exact,approximation))
            self.assertLessEqual(worst,tier['maxSurfaceError'],tier['id'])

    def test_seam_and_nonuniform_scaling(self):
        seam = self.pillow['appearance']['seamMask']
        half = seam['halfWidthY']
        self.assertEqual(half,.00075)
        self.assertEqual(seam['boundaryOwner'],'seam')
        threshold = math.sqrt(1-(half/.055)**2)
        self.assertAlmostEqual(self.pillow['constructionReview']['seamRadialThreshold'],threshold)
        self.assertEqual(self.pillow['sizing']['applicationCount'],1)
        points,_ = mesh(self.g,[6,2]*4,8)
        for size in [(.64,.055,.48),(.16,.22,.16)]:
            scale = [a/b for a,b in zip(size,self.pillow['overallSize'])]
            for axis in range(3):
                values = [p[axis]*scale[axis] for p in points]
                self.assertAlmostEqual(max(values)-min(values),size[axis])
            self.assertEqual(min(p[2]*scale[2] for p in points),0)
            for y in [0,half,half*.99,half*1.01,.055]:
                self.assertEqual(abs(y*scale[1]/scale[1])<=half,abs(y)<=half)

    def test_defaults_documents_and_mesh_state(self):
        a = self.pillow['appearance']
        self.assertEqual(a['colorFallback'],'selected material color')
        self.assertEqual({r['id']:r['defaultMaterial'] for r in a['regions']}, {'body':'mustard','seam':'mustard-seam'})
        for region in a['regions']:
            self.assertEqual(region['defaultColorSRGB'],self.data['materials'][region['defaultMaterial']]['baseColorSRGB'])
        self.assertEqual(self.pillow['constructionReview']['closedComponentCount'],1)
        self.assertFalse(self.pillow['constructionReview']['modelVerified'])
        doc = (ROOT/'THROW-PILLOW-SPEC.md').read_text()
        for target in re.findall(r'\[[^]]+\]\(([^)]+)\)',doc):
            self.assertTrue((ROOT/target.split('#')[0]).exists(),target)
        self.assertIn('9 mm',doc)
        self.assertIn('per surface sample',doc)
        self.assertEqual(self.g['outlineIntervals'],self.pillow['lod']['tiers'][0]['outlineIntervals'])
        self.assertEqual(self.g['radialIntervals'],self.pillow['lod']['tiers'][0]['radialIntervals'])
        for tier in self.pillow['lod']['tiers']:
            row=next(v for v in doc.splitlines() if re.match(r'\|\s*'+tier['id']+r'\s*\|',v))
            cells=[v.strip() for v in row.split('|')[1:-1]]
            self.assertEqual([int(v) for v in cells[1:6]], [tier['outlineIntervals'][0],tier['outlineIntervals'][1],tier['radialIntervals'],tier['triangleCount'],tier['maxTriangles']])
            self.assertAlmostEqual(float(cells[6])/1000,tier['maxSurfaceError'])


if __name__=='__main__': unittest.main(verbosity=2)
