"""Round-rug document and analytic construction checks; no asset is exported."""
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]


def mesh(radius, height, bevel, radial_segments, bevel_segments):
    """Revolve the specified edge profile, then close both planar caps."""
    profile = []
    for j in range(bevel_segments + 1):
        angle = j * math.pi / (2 * bevel_segments)
        profile.append((radius - bevel + bevel * math.sin(angle),
                        bevel - bevel * math.cos(angle)))
    for j in range(bevel_segments + 1):
        angle = j * math.pi / (2 * bevel_segments)
        profile.append((radius - bevel + bevel * math.cos(angle),
                        height - bevel + bevel * math.sin(angle)))
    n = radial_segments
    vertices = [(r * math.cos(2 * math.pi * j / n),
                 r * math.sin(2 * math.pi * j / n), z)
                for r, z in profile for j in range(n)]
    faces = []
    last = (len(profile) - 1) * n
    for j in range(1, n - 1):
        faces.extend([(0, j + 1, j), (last, last + j, last + j + 1)])
    for k in range(len(profile) - 1):
        for j in range(n):
            a = k * n + j
            b = k * n + (j + 1) % n
            faces.extend([(a, b, b + n), (a, b + n, a + n)])
    return vertices, faces


def binding(x, y, radius):
    return math.hypot(x, y) >= radius


class RoundRugTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'textiles-model-spec.json').read_text())
        cls.rug = next(m for m in cls.data['modules'] if m['moduleId'] == 'round-rug')
        cls.g = cls.rug['geometry']

    def test_original_shape_and_reference_preserved(self):
        self.assertEqual(self.rug['overallSize'], [1.2, 1.2, .008])
        self.assertEqual(self.g, {'primitive': 'cylinder', 'axis': 'Z', 'radius': .6,
                                 'zMin': 0, 'zMax': .008, 'radialSegments': 192,
                                 'topBottomEdgeBevel': .001, 'bevelSegments': 3,
                                 'bevelExpandsBounds': False})
        self.assertEqual(hashlib.sha256((ROOT / self.rug['reviewDrawing']).read_bytes()).hexdigest(),
                         '8f6a8fa15468ad1f8fdb8817ac8018d46925e6a203c54325275b5c94484e43f2')

    def test_cap_and_binding_dimensions(self):
        g = self.g
        r, b, h = g['radius'], g['topBottomEdgeBevel'], g['zMax'] - g['zMin']
        c = self.rug['constructionReview']
        mask = self.rug['appearance']['bindingMask']
        self.assertAlmostEqual(c['flatCapRadius'], r - b)
        self.assertAlmostEqual(c['flatCapDiameter'], 2 * (r - b))
        self.assertEqual(c['verticalSideZ'], [b, h - b])
        self.assertAlmostEqual(mask['radius'], r - self.rug['surfaceRegions']['topBinding']['width'])
        self.assertAlmostEqual(c['flatBindingWidth'], r - b - mask['radius'])
        self.assertEqual(mask['boundaryOwner'], 'binding')
        self.assertFalse(binding(0, 0, mask['radius']))
        self.assertTrue(binding(mask['radius'], 0, mask['radius']))
        self.assertTrue(binding(0, -mask['radius'], mask['radius']))
        for j in range(32):
            angle = 2 * math.pi * j / 32
            for delta, expected in [(-1e-6, False), (1e-6, True)]:
                radial = mask['radius'] + delta
                self.assertEqual(binding(radial * math.cos(angle), radial * math.sin(angle), mask['radius']), expected)

    def test_lod_closed_outward_mesh_bounds_and_error(self):
        g = self.g
        r, b, h = g['radius'], g['topBottomEdgeBevel'], g['zMax'] - g['zMin']
        for tier in self.rug['lod']['tiers']:
            n, m = tier['radialSegments'], tier['bevelSegments']
            self.assertEqual(n % 4, 0)
            points, faces = mesh(r, h, b, n, m)
            self.assertEqual(len(faces), 4 * n * (m + 1) - 4)
            self.assertEqual(len(faces), tier['triangleCount'])
            self.assertLessEqual(len(faces), tier['maxTriangles'])
            error = r * (1 - math.cos(math.pi / n)) + b * (1 - math.cos(math.pi / (4 * m)))
            self.assertLessEqual(error, tier['maxSurfaceError'])
            for axis in range(3):
                self.assertAlmostEqual(min(p[axis] for p in points), self.rug['bounds']['min'][axis])
                self.assertAlmostEqual(max(p[axis] for p in points), self.rug['bounds']['max'][axis])
            edges, volume = Counter(), 0
            for a, b0, c in faces:
                p, q, s = [points[k] for k in (a, b0, c)]
                u, v = [q[i] - p[i] for i in range(3)], [s[i] - p[i] for i in range(3)]
                normal = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]
                centre = [(p[i] + q[i] + s[i])/3 for i in range(3)]
                centre[2] -= h/2
                self.assertGreater(sum(x*y for x, y in zip(normal, centre)), 0)
                volume += sum(p[i]*normal[i] for i in range(3))/6
                for x, y in [(a, b0), (b0, c), (c, a)]:
                    edges[x, y] += 1
            self.assertGreater(volume, 0)
            self.assertLess(volume, math.pi*r*r*h)
            for (a, b0), count in edges.items():
                self.assertEqual((count, edges[b0, a]), (1, 1))
            self.assertEqual(len(points) - len(edges)//2 + len(faces), 2)
            # Both caps remain coplanar with radius r-b; no extra base layer.
            for ring in (points[:n], points[-n:]):
                self.assertEqual(len({p[2] for p in ring}), 1)
                for x, y, _ in ring:
                    self.assertAlmostEqual(math.hypot(x, y), r-b)

    def test_scaling_preserves_contact_and_region_identity(self):
        g = self.g
        sizing = self.rug['sizing']
        self.assertEqual(sizing['defaultSize'], self.rug['overallSize'])
        self.assertEqual(sizing['applicationCount'], 1)
        self.assertEqual(sizing['origin'], [0, 0, 0])
        points, _ = mesh(g['radius'], .008, g['topBottomEdgeBevel'], 48, 1)
        radius = self.rug['appearance']['bindingMask']['radius']
        for target in [(2.4, .6, .016), (.6, 1.8, .004)]:
            scale = [t/d for t, d in zip(target, self.rug['overallSize'])]
            for axis in range(3):
                values = [p[axis] * scale[axis] for p in points]
                self.assertAlmostEqual(max(values) - min(values), target[axis])
            self.assertEqual(min(p[2]*scale[2] for p in points), 0)
            for x, y in [(0, 0), (.574, 0), (.576, 0), (0, .59)]:
                final = (x*scale[0], y*scale[1])
                self.assertEqual(binding(final[0]/scale[0], final[1]/scale[1], radius), binding(x, y, radius))

    def test_defaults_match_materials_and_shared_override_rule(self):
        appearance = self.rug['appearance']
        expected = {'top-body': 'lavender', 'top-binding': 'lavender-binding',
                    'sides-and-bevels': 'lavender-binding', 'bottom-body': 'backing',
                    'bottom-binding': 'lavender-binding'}
        self.assertEqual({r['id']: r['defaultMaterial'] for r in appearance['regions']}, expected)
        for region in appearance['regions']:
            material = self.data['materials'][region['defaultMaterial']]
            self.assertEqual(region['defaultColorSRGB'], material['baseColorSRGB'])
            self.assertEqual(region['defaultWeave'], region['id'] in ('top-body', 'bottom-body'))
        self.assertEqual(appearance['colorFallback'], 'selected material color')
        self.assertEqual(appearance['overrideOrder']['material'], ['region', 'whole-rug', 'preset'])
        self.assertEqual(appearance['overrideOrder']['color'], ['region', 'whole-rug', 'selected material color'])

    def test_document_tables_and_links(self):
        doc = (ROOT / 'ROUND-RUG-SPEC.md').read_text()
        for target in re.findall(r'\[[^]]+\]\(([^)]+)\)', doc):
            self.assertTrue((ROOT / target.split('#')[0]).exists(), target)
        self.assertIn('24 mm', doc)
        self.assertIn('per surface sample', doc)
        self.assertEqual(self.rug['constructionReview']['closedComponentCount'], 1)
        self.assertFalse(self.rug['constructionReview']['modelVerified'])
        for tier in self.rug['lod']['tiers']:
            row = next(line for line in doc.splitlines() if re.match(r'\|\s*' + tier['id'] + r'\s*\|', line))
            cells = [v.strip() for v in row.split('|')[1:-1]]
            self.assertEqual([int(v) for v in cells[1:5]], [tier['radialSegments'], tier['bevelSegments'], tier['triangleCount'], tier['maxTriangles']])
            self.assertAlmostEqual(float(cells[5])/1000, tier['maxSurfaceError'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
