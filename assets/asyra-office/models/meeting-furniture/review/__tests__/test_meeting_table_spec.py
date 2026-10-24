"""Analytic meeting-table document checks; no production model is generated."""
import hashlib
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
BASELINE = {'parts': 'c7e9d05c4e2a0dffe1aec0fef24c2054766b92565c4b01616b4624c25bfb9f27', 'whiteboard': '055c380da2c920267edfc1cfc890061bd128b58e7bc0b4f51ee72acd98dc0f6d', 'materials': '675d4d04aff1faa64c40470b8838ff13213e01c43bb14724bc32796910fe6122', 'images': {'02-blank-whiteboard-v1.png': 'aa589326789353b62406d60a26e84e6ead66d48e0914bb250bf88da3b5599318', '01-wooden-meeting-table-v1.png': '2e4eb9a4e2995f0a82cc2757321f1123c0fc6489c38a9de293004a810013da5d'}}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def box(center, size):
    return tuple(tuple(center[i] + sign * size[i] / 2 for i in range(3)) for sign in (-1, 1))


def assembly(parts):
    legs = [box([x, y, sum(parts['legs']['zRange']) / 2],
                [*parts['legs']['crossSection'], parts['legs']['zRange'][1]-parts['legs']['zRange'][0]])
            for x, y in parts['legs']['centersXY']]
    long = [((parts['longAprons']['xRange'][0], y-parts['longAprons']['thicknessY']/2, parts['longAprons']['zRange'][0]),
             (parts['longAprons']['xRange'][1], y+parts['longAprons']['thicknessY']/2, parts['longAprons']['zRange'][1]))
            for y in parts['longAprons']['centerY']]
    short = [((x-parts['shortAprons']['thicknessX']/2, parts['shortAprons']['yRange'][0], parts['shortAprons']['zRange'][0]),
              (x+parts['shortAprons']['thicknessX']/2, parts['shortAprons']['yRange'][1], parts['shortAprons']['zRange'][1]))
             for x in parts['shortAprons']['centerX']]
    return legs, long, short


def intersection(a, b):
    return [min(a[1][i], b[1][i])-max(a[0][i], b[0][i]) for i in range(3)]


def outline(top, n):
    w, d, r = top['width'], top['depth'], top['cornerRadius']
    result = []
    for cx, cy, start in [(w/2-r, d/2-r, 0), (-w/2+r, d/2-r, 90),
                           (-w/2+r, -d/2+r, 180), (w/2-r, -d/2+r, 270)]:
        for j in range(n+1):
            angle = math.radians(start+90*j/n)
            result.append((cx+r*math.cos(angle), cy+r*math.sin(angle)))
    return result


class MeetingTableContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT/'meeting-furniture-model-spec.json').read_text())
        cls.table = cls.data['assets'][0]
        cls.parts = cls.table['parts']

    def test_original_geometry_whiteboard_materials_and_images_preserved(self):
        self.assertEqual(digest(self.parts), BASELINE['parts'])
        self.assertEqual(digest(self.data['assets'][1]), BASELINE['whiteboard'])
        self.assertEqual(digest(self.data['materials']), BASELINE['materials'])
        for name, checksum in BASELINE['images'].items():
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(), checksum)

    def test_sixteen_flush_contacts_and_no_stray_intersections(self):
        legs, long, short = assembly(self.parts)
        top = ((-.7, -.375, .7), (.7, .375, .74))
        count = 0
        for part, expected_area in [(v, .003025) for v in legs] + [(v, .02431) for v in long] + [(v, .01001) for v in short]:
            ext = intersection(part, top)
            self.assertAlmostEqual(ext[2], 0)
            self.assertAlmostEqual(ext[0]*ext[1], expected_area)
            # Every contact is inside the straight central XY rectangle of the rounded top.
            self.assertGreaterEqual(part[0][0], -.675)
            self.assertLessEqual(part[1][0], .675)
            self.assertGreaterEqual(part[0][1], -.35)
            self.assertLessEqual(part[1][1], .35)
            count += 1
        for leg in legs:
            neighbors = 0
            for rail in long+short:
                ext = intersection(leg, rail)
                if min(ext) < -1e-12:
                    continue
                self.assertEqual(sum(abs(v) < 1e-12 for v in ext), 1)
                self.assertAlmostEqual(math.prod(v for v in ext if abs(v) >= 1e-12), .00176)
                count += 1
                neighbors += 1
            self.assertEqual(neighbors, 2)
        self.assertEqual(count, 16)
        for a in long:
            for b in short:
                self.assertLess(min(intersection(a, b)), 0)

    def test_bounds_flat_feet_clearances_and_scaling(self):
        legs, long, short = assembly(self.parts)
        self.assertEqual(self.table['bounds'], [1.4, .75, .74])
        for leg in legs:
            self.assertEqual(leg[0][2], 0)
            self.assertAlmostEqual(leg[1][2], .7)
        self.assertAlmostEqual(.7-max(v[1][0] for v in legs), .0925)
        self.assertAlmostEqual(.375-max(v[1][1] for v in legs), .0925)
        self.assertEqual(self.parts['longAprons']['xRange'], [-.5525, .5525])
        self.assertEqual(self.parts['shortAprons']['yRange'], [-.2275, .2275])
        for target in [(2.8, .375, 1.11), (.7, 1.5, .37)]:
            scale = [t/d for t, d in zip(target, self.table['bounds'])]
            for src in legs+long+short:
                transformed = [[v*s for v, s in zip(point, scale)] for point in src]
                self.assertAlmostEqual(transformed[1][2], .7*scale[2])
            self.assertEqual([d*s for d, s in zip(self.table['bounds'], scale)], list(target))

    def test_lod_polygon_error_counts_and_supports(self):
        top = self.parts['top']
        for tier in self.table['lod']['tiers']:
            n = tier['segmentsPerCorner']
            points = outline(top, n)
            self.assertEqual(len(points), 4*(n+1))
            area = sum(a[0]*b[1]-b[0]*a[1] for a, b in zip(points, points[1:]+points[:1]))/2
            self.assertGreater(area, 0)
            for i, bound in [(0, .7), (1, .375)]:
                self.assertAlmostEqual(max(p[i] for p in points), bound)
                self.assertAlmostEqual(min(p[i] for p in points), -bound)
            error = top['cornerRadius']*(1-math.cos(math.pi/(4*n)))
            self.assertLessEqual(error, tier['maxSurfaceError'])
            triangles = 2*(len(points)-2)+2*len(points)+8*12
            self.assertEqual(triangles, tier['triangleCount'])
            self.assertLessEqual(triangles, tier['maxTriangles'])
        self.assertEqual(top['segmentsPerCorner'], self.table['lod']['tiers'][0]['segmentsPerCorner'])

    def test_closed_oriented_tabletop_at_every_lod(self):
        # Construct an analytic test mesh only; no asset export or runtime generator.
        from collections import Counter
        for tier in self.table['lod']['tiers']:
            contour = outline(self.parts['top'], tier['segmentsPerCorner'])
            n = len(contour)
            vertices = [(x, y, z) for z in self.parts['top']['zRange'] for x, y in contour]
            faces = []
            for j in range(1, n-1):
                faces.extend([(0, j+1, j), (n, n+j, n+j+1)])
            for j in range(n):
                k = (j+1) % n
                faces.extend([(j, k, n+k), (j, n+k, n+j)])
            edges = Counter()
            volume = 0.
            for a, b, c in faces:
                for u, v in [(a, b), (b, c), (c, a)]:
                    edges[(u, v)] += 1
                p, q, r = vertices[a], vertices[b], vertices[c]
                u = [q[i]-p[i] for i in range(3)]
                v = [r[i]-p[i] for i in range(3)]
                normal = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]
                self.assertGreater(sum(x*x for x in normal), 1e-18)
                volume += sum(p[i]*normal[i] for i in range(3))/6
            for (u, v), count in edges.items():
                self.assertEqual(count, 1)
                self.assertEqual(edges[(v, u)], 1)
            self.assertEqual(len(vertices)-len(edges)//2+len(faces), 2)
            area = sum(a[0]*b[1]-b[0]*a[1] for a, b in zip(contour, contour[1:]+contour[:1]))/2
            self.assertAlmostEqual(volume, area*(self.parts['top']['zRange'][1]-self.parts['top']['zRange'][0]))
            self.assertEqual(len(faces)+96, tier['triangleCount'])

    def test_document_tables_links_and_appearance_regions(self):
        doc = (ROOT/'MEETING-TABLE-SPEC.md').read_text()
        self.assertIn('1400 x 750 x 740', doc)
        self.assertIn('1105 x 22 x 80', doc)
        self.assertIn('22 x 455 x 80', doc)
        self.assertIn('16 contact', doc)
        for target in re.findall(r'\[[^]]+\]\(([^)]+)\)', doc):
            self.assertTrue((ROOT/target.split('#')[0]).exists(), target)
        # Compare every centre and size in the Markdown table to source part bounds.
        legs, long, short = assembly(self.parts)
        top = self.parts['top']
        bounds = [box([0, 0, sum(top['zRange'])/2],
                      [top['width'], top['depth'], top['zRange'][1]-top['zRange'][0]]), *legs, *long, *short]
        names = ['top', 'leg-0', 'leg-1', 'leg-2', 'leg-3', 'front-apron', 'back-apron', 'left-apron', 'right-apron']
        for name, (lo, hi) in zip(names, bounds):
            row = next(line for line in doc.splitlines() if re.match(r'\|\s*'+re.escape(name)+r'\s*\|', line))
            cells = [v.strip() for v in row.split('|')[1:-1]]
            center = [float(v) for v in cells[1].strip('()').split(',')]
            size = [float(v) for v in cells[2].split(' x ')]
            for i in range(3):
                self.assertAlmostEqual(center[i], (lo[i]+hi[i])*500)
                self.assertAlmostEqual(size[i], (hi[i]-lo[i])*1000)
        for tier in self.table['lod']['tiers']:
            row = next(line for line in doc.splitlines() if re.match(r'\|\s*'+tier['id']+r'\s*\|', line))
            values = [v.strip() for v in row.split('|')[1:-1]]
            self.assertEqual(int(values[1]), tier['segmentsPerCorner'])
            self.assertEqual(int(values[2]), 4*(tier['segmentsPerCorner']+1))
            self.assertEqual(int(values[3]), tier['triangleCount'])
            self.assertEqual(int(values[4]), tier['maxTriangles'])
            self.assertAlmostEqual(float(values[5])/1000, tier['maxSurfaceError'])
        regions = self.table['appearance']['regions']
        self.assertEqual(len(regions), 9)
        self.assertEqual(len({v['id'] for v in regions}), 9)
        for v in regions:
            self.assertIn(v['part'], self.parts)
            self.assertEqual(v['defaultMaterial'], 'honey-wood')
        for v in self.table['lod']['tiers']:
            self.assertIn(str(v['triangleCount']), doc)
        self.assertFalse(self.table['constructionReview']['modelVerified'])
        self.assertEqual(self.table['sizing']['instanceScaleApplications'], 1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
