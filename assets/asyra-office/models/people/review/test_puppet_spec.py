"""Numeric regression checks for the puppet documents; no model or image output.

Run directly with Python's standard library. These checks do not certify a
Blender mesh, Boolean result, complete-puppet budget, or reference-image match.
"""

import hashlib
import json
import math
from pathlib import Path
import unittest
from collections import Counter
from copy import deepcopy


ROOT = Path(__file__).resolve().parents[1]


def loft_row(rows, z):
    for a, b in zip(rows, rows[1:]):
        if a[0] - 1e-12 <= z <= b[0] + 1e-12:
            t = max(0.0, min(1.0, (z - a[0]) / (b[0] - a[0])))
            s = t * t * (3 - 2 * t)
            return [z] + [a[i] + s * (b[i] - a[i]) for i in range(1, 5)]
    raise ValueError(f"Height outside loft: {z}")


def ring_point(row, phi, inset=0):
    z, x, y, rx, ry = row
    normal = (math.sin(phi) / rx, -math.cos(phi) / ry)
    length = math.hypot(*normal)
    return (
        x + rx * math.sin(phi) - inset * normal[0] / length,
        y - ry * math.cos(phi) - inset * normal[1] / length,
        z,
    )


def groove_depth(seam, z):
    if seam is None:
        return 0
    u = (z - seam['zRange'][0]) / (seam['zRange'][1] - seam['zRange'][0])
    return seam['depth'] * (1 - math.cos(2 * math.pi * u)) / 2 if 0 <= u <= 1 else 0


def shoe_point(shoe, z, phi):
    return ring_point(loft_row(shoe['outerRings'], z), phi,
                      groove_depth(shoe['soleSeam'], z))


def chord_distance(point, a, b):
    v = [b[i] - a[i] for i in range(3)]
    length2 = sum(x * x for x in v)
    t = sum((point[i] - a[i]) * v[i] for i in range(3)) / length2 if length2 else 0
    t = max(0.0, min(1.0, t))
    return math.dist(point, [a[i] + t * v[i] for i in range(3)])


def triangle_distance(point, a, b, c):
    ab = [b[i] - a[i] for i in range(3)]
    ac = [c[i] - a[i] for i in range(3)]
    ap = [point[i] - a[i] for i in range(3)]
    dot = lambda x, y: sum(i * j for i, j in zip(x, y))
    aa, bb, cc = dot(ab, ab), dot(ab, ac), dot(ac, ac)
    d, e = dot(ap, ab), dot(ap, ac)
    det = aa * cc - bb * bb
    if det > 1e-24:
        u, v = (cc * d - bb * e) / det, (aa * e - bb * d) / det
        if u >= 0 and v >= 0 and u + v <= 1:
            return math.dist(point, [a[i] + u * ab[i] + v * ac[i] for i in range(3)])
    return min(chord_distance(point, a, b), chord_distance(point, b, c),
               chord_distance(point, c, a))


def sampled_cell_error(shoe, a, b, count, fractions):
    worst = 0
    for j in range(count):
        p0, p1 = j * 2 * math.pi / count, (j + 1) * 2 * math.pi / count
        v00, v01 = shoe_point(shoe, a, p0), shoe_point(shoe, a, p1)
        v10, v11 = shoe_point(shoe, b, p0), shoe_point(shoe, b, p1)
        for u in fractions:
            for v in fractions:
                point = shoe_point(shoe, a + (b - a) * u, p0 + (p1 - p0) * v)
                error = min(triangle_distance(point, v00, v10, v11),
                            triangle_distance(point, v00, v11, v01))
                worst = max(worst, error)
    return worst


def cell_interpolate(vertices, u, v):
    weights = (1 - u, u - v, v, 0) if u >= v else (1 - v, 0, u, v - u)
    return tuple(sum(w * p[i] for w, p in zip(weights, vertices)) for i in range(3))


def refine_shoe(shoe, spec, tier_index=0):
    seed = spec['lod']['tiers'][tier_index]
    rule = spec['construction']['meshSampling'] | seed['sampling']
    n = seed['bodyRadial']
    radius = max(max(r[3:]) for r in shoe['outerRings'])
    while radius * (1 - math.cos(math.pi / n)) > rule['angularChordTolerance']:
        n += 4
    heights = set()
    for a, b in zip(shoe['outerRings'], shoe['outerRings'][1:]):
        for i in range(seed['loftIntervals'] + 1):
            heights.add(a[0] + (b[0] - a[0]) * i / seed['loftIntervals'])
    seam = shoe['soleSeam']
    intervals = seed['sampling']['grooveProfileIntervals']
    if intervals:
        for i in range(intervals + 1):
            heights.add(seam['zRange'][0] + (seam['zRange'][1] - seam['zRange'][0]) * i / intervals)
    heights = sorted(heights)
    for _ in range(rule['maxRefinementPasses']):
        split = []
        for a, b in zip(heights, heights[1:]):
            if sampled_cell_error(shoe, a, b, n, rule['refinementProbes']) > rule['refinementThreshold']:
                split.append((a + b) / 2)
        if not split:
            return heights, n
        heights = sorted(heights + split)
    raise AssertionError('Refinement did not converge; do not relax precision or budget')


class PuppetSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec = json.loads((ROOT / 'man-puppet-model-spec.json').read_text())

    def test_segment_counts_are_seeds_not_caps(self):
        self.assertEqual(self.spec['construction'].get('segmentCountMeaning'), 'starting-samples')
        self.assertEqual([t['maxTriangles'] for t in self.spec['lod']['tiers']], [24000, 10000, 4000])

    def test_shoe_groove_is_part_of_the_same_surface(self):
        for shoe in self.spec['clothing']['shoes']:
            seam = shoe['soleSeam']
            self.assertEqual(seam['recipe'], 'integrated-loft-recess')
            self.assertNotIn('tubeRadius', seam)
            for phi in (0, 0.4, 1.8, 3.0):
                z = sum(seam['zRange']) / 2
                before = ring_point(loft_row(shoe['outerRings'], z), phi)
                after = shoe_point(shoe, z, phi)
                self.assertAlmostEqual(math.dist(before, after), seam['depth'], places=12)
                for edge in seam['zRange']:
                    self.assertEqual(shoe_point(shoe, edge, phi), ring_point(loft_row(shoe['outerRings'], edge), phi))

    def test_former_independent_cutter_misses_coarse_mesh(self):
        shoe = self.spec['clothing']['shoes'][0]
        row = loft_row(shoe['outerRings'], 0.013)
        a, b = ring_point(row, 0), ring_point(row, 2 * math.pi / 20)
        p = ring_point(row, math.pi / 20)
        # The old nominal 0.5 mm cut cannot bridge this 1.468 mm gap.
        self.assertGreater(chord_distance(p, a, b), 0.0014)

    def test_sleeve_curve_requires_more_than_four_segments(self):
        rows = self.spec['clothing']['shirt']['sleeves'][1]['rings'][-2:]
        def point(t):
            return ring_point(loft_row(rows, rows[0][0] + t * (rows[1][0] - rows[0][0])), math.pi / 2)
        def error(n):
            return max(chord_distance(point((j + k / 100) / n), point(j / n), point((j + 1) / n))
                       for j in range(n) for k in range(101))
        self.assertGreater(error(4), 0.0005)
        n = self.spec['lod']['tiers'][0]['loftIntervals']
        while error(n) > 0.0005:
            n *= 2
        self.assertLessEqual(error(n), 0.0005)
        print(f'Sleeve profile: {n} subdivisions, sampled error {error(n) * 1000:.4f} mm')

    def test_shoulder_join_and_interpolation_regression(self):
        shirt = self.spec['clothing']['shirt']
        def cavity_q(point, rows):
            try:
                r = loft_row(rows, point[2])
            except ValueError:
                return float('inf')
            return ((point[0] - r[1]) / (r[3] - shirt['wallThickness'])) ** 2 + ((point[1] - r[2]) / (r[4] - shirt['wallThickness'])) ** 2
        for sleeve in shirt['sleeves']:
            r = sleeve['rings'][-1]
            for j in range(360):
                self.assertLess(cavity_q(ring_point(r, j * math.pi / 180), shirt['bodyOuterRings']), 1)
        point = (0.1641967678956718, 0, 0.5194933905829343)
        self.assertLess(min(cavity_q(point, shirt['bodyOuterRings']),
                            cavity_q(point, shirt['sleeves'][1]['rings'])), 1)
        rows = shirt['sleeves'][1]['rings'][-2:]
        a, b = rows
        r = loft_row(rows, a[0] + 0.25 * (b[0] - a[0]))
        self.assertAlmostEqual((r[1] - a[1]) / (b[1] - a[1]), 0.15625)
        self.assertAlmostEqual((r[0] - a[0]) / (b[0] - a[0]), 0.25)

    def test_triangulated_shoe_surface_and_groove(self):
        for shoe in self.spec['clothing']['shoes']:
            self.assertEqual(shoe['soleSeam']['recipe'], 'integrated-loft-recess')
            heights, n = refine_shoe(shoe, self.spec)
            # Validation probes differ from the subdivision probes.
            error = max(sampled_cell_error(shoe, a, b, n, self.spec['construction']['meshSampling']['validationProbes'])
                        for a, b in zip(heights, heights[1:]))
            self.assertLessEqual(error, self.spec['lod']['tiers'][0]['sampling']['surfaceTolerance'])
            triangles = 2 * n * (len(heights) - 1)
            print(f"{shoe['id']}: {n} radial samples, {len(heights)} rings, "
                  f"{triangles} outer triangles, sampled error {error * 1000:.4f} mm")
            # Shared topology: only the top/bottom boundaries may have open edges.
            edges = Counter()
            depth_error = 0
            for i, (a, b) in enumerate(zip(heights, heights[1:])):
                for j in range(n):
                    ids = (i * n + j, (i + 1) * n + j,
                           (i + 1) * n + (j + 1) % n, i * n + (j + 1) % n)
                    for tri in ((ids[0], ids[1], ids[2]), (ids[0], ids[2], ids[3])):
                        for x, y in zip(tri, (tri[1], tri[2], tri[0])):
                            edges[tuple(sorted((x, y)))] += 1
                    p0, p1 = j * 2 * math.pi / n, (j + 1) * 2 * math.pi / n
                    parameters = ((a, p0), (b, p0), (b, p1), (a, p1))
                    grooved = [shoe_point(shoe, z, phi) for z, phi in parameters]
                    plain = [ring_point(loft_row(shoe['outerRings'], z), phi) for z, phi in parameters]
                    for u in (0, 0.125, 0.375, 0.625, 0.875, 1):
                        for v in (0, 0.25, 0.5, 0.75, 1):
                            point = cell_interpolate(grooved, u, v)
                            uncut = cell_interpolate(plain, u, v)
                            z = a + (b - a) * u
                            depth_error = max(depth_error, abs(math.dist(point, uncut) - groove_depth(shoe['soleSeam'], z)))
                            r = loft_row(shoe['outerRings'], z)
                            q = ((point[0] - r[1]) / (r[3] - shoe['wallThickness'])) ** 2
                            q += ((point[1] - r[2]) / (r[4] - shoe['wallThickness'])) ** 2
                            self.assertGreater(q, 1, 'Outer triangle enters inner cavity')
            self.assertTrue(all(count in (1, 2) for count in edges.values()))
            boundary = [edge for edge, count in edges.items() if count == 1]
            self.assertEqual(len(boundary), 2 * n)
            self.assertTrue(all((a < n and b < n) or
                                (a >= (len(heights) - 1) * n and b >= (len(heights) - 1) * n)
                                for a, b in boundary))
            self.assertLessEqual(depth_error, self.spec['lod']['tiers'][0]['sampling']['grooveDetailTolerance'])
            print(f"{shoe['id']}: sampled groove depth error {depth_error * 1000:.4f} mm; "
                  'no internal boundary edges or sampled cavity crossings')

    def test_lower_lod_uses_explicit_precision_and_detail(self):
        for tier_index in (1, 2):
            tier = self.spec['lod']['tiers'][tier_index]
            shoe = deepcopy(self.spec['clothing']['shoes'][0])
            if tier['sampling']['grooveProfileIntervals'] == 0:
                self.assertNotIn(tier['id'], shoe['soleSeam']['lodPresence'])
                shoe['soleSeam']['depth'] = 0
            heights, n = refine_shoe(shoe, self.spec, tier_index)
            error = max(sampled_cell_error(shoe, a, b, n, self.spec['construction']['meshSampling']['validationProbes'])
                        for a, b in zip(heights, heights[1:]))
            self.assertLessEqual(error, tier['sampling']['surfaceTolerance'])
            worst_depth_error = 0
            for a, b in zip(heights, heights[1:]):
                for j in range(n):
                    p0, p1 = j * 2 * math.pi / n, (j + 1) * 2 * math.pi / n
                    parameters = ((a, p0), (b, p0), (b, p1), (a, p1))
                    grooved = [shoe_point(shoe, z, phi) for z, phi in parameters]
                    plain = [ring_point(loft_row(shoe['outerRings'], z), phi) for z, phi in parameters]
                    for u, v in ((0.125, 0.25), (0.375, 0.75), (0.625, 0.25), (0.875, 0.75)):
                        point = cell_interpolate(grooved, u, v)
                        uncut = cell_interpolate(plain, u, v)
                        z = a + (b - a) * u
                        worst_depth_error = max(worst_depth_error, abs(math.dist(point, uncut) - groove_depth(shoe['soleSeam'], z)))
                        r = loft_row(shoe['outerRings'], z)
                        q = ((point[0] - r[1]) / (r[3] - shoe['wallThickness'])) ** 2
                        q += ((point[1] - r[2]) / (r[4] - shoe['wallThickness'])) ** 2
                        self.assertGreater(q, 1)
            self.assertLessEqual(worst_depth_error, tier['sampling']['grooveDetailTolerance'] + 1e-12)
            print(f"{tier['id']} shoe: sampled surface/depth errors "
                  f"{error * 1000:.4f}/{worst_depth_error * 1000:.4f} mm")

    def test_reference_and_measurements_remain_bound(self):
        m = json.loads((ROOT / 'man-reference-measurements.json').read_text())
        self.assertEqual(hashlib.sha256((ROOT / m['source']).read_bytes()).hexdigest(), m['sha256'])
        for a in m['anchors']:
            source = a['modelValueSource']
            if source.startswith('/'):
                value = self.spec
                for key in source.split('/')[1:]:
                    if isinstance(value, list):
                        value = value[int(key)] if key.lstrip('-').isdigit() else next(v for v in value if v['id'] == key)
                    else:
                        value = value[key]
            else:
                head = next(v for v in self.spec['bodyAndFaceParts'] if v['id'] == 'head')
                value = head['centre'][2] - head['radii'][2]
            self.assertAlmostEqual(value, a['modelDefaultMetres'])
            self.assertLessEqual(abs(value - a['measuredMetres']), m['modelDeviationToleranceMetres'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
