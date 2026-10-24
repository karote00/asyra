"""Numeric reference checks; these do not build or certify production meshes."""
import json
import math
from pathlib import Path
import unittest
from collections import Counter
ROOT = Path(__file__).resolve().parents[3]

def spec(batch):
    return json.loads((ROOT / batch / (batch + '-model-spec.json')).read_text())

def module(batch, name):
    return next((m for m in spec(batch)['modules'] if m['moduleId'] == name))

def part(module_value, name):
    return next((p for p in module_value['components'] if p['partId'] == name))

def box_bounds(p):
    return tuple((tuple((p['centre'][i] + sign * p['size'][i] / 2 for i in range(3))) for sign in (-1, 1)))

class EquipmentJoints(unittest.TestCase):

    def test_dispenser_taps_reach_back_panel(self):
        m = module('pantry', 'water-dispenser')
        front = box_bounds(part(m, 'bay-back'))[0][1]
        for name in ('tap--1', 'tap-1'):
            p = part(m, name)
            self.assertGreaterEqual(p['centre'][1] + p['length'] / 2, front)

    def test_dispenser_levers_have_connected_stems(self):
        m = module('pantry', 'water-dispenser')
        for suffix in ('--1', '-1'):
            stem = part(m, 'tap-lever-stem' + suffix)
            tap = part(m, 'tap' + suffix)
            lever = part(m, 'tap-lever' + suffix)
            self.assertLess(stem['centre'][2] - stem['length'] / 2, tap['centre'][2] + tap['radius'])
            self.assertGreater(stem['centre'][2] + stem['length'] / 2, box_bounds(lever)[0][2])

    def test_sink_handle_mounting_face_reaches_door_frame(self):
        m = module('pantry', 'sink-cabinet')
        for suffix in ('--1', '-1'):
            handle = part(m, 'handle' + suffix)
            door = part(m, 'door' + suffix)
            mounts = [part(m, 'handle-mount-' + label + suffix) for label in ('lower', 'upper')]
            for mount in mounts:
                self.assertGreater(box_bounds(mount)[1][1], box_bounds(door)[0][1] + door['panelRecess']['depth'])
                self.assertLess(box_bounds(mount)[0][1], box_bounds(handle)[1][1])
            self.assertLess(box_bounds(handle)[1][1], box_bounds(door)[0][1])

    def test_coffee_tray_top_is_above_bay_floor(self):
        m = module('pantry', 'coffee-machine')
        cutter = part(m, 'housing')['subtract'][0]
        tray = part(m, 'drip-tray')
        self.assertGreater(box_bounds(tray)[1][2], box_bounds(cutter)[0][2] + cutter['radius'])
        self.assertLess(box_bounds(tray)[0][2], box_bounds(cutter)[0][2])

    def test_mug_lower_handle_root_enters_wall(self):
        m = module('desk-items', 'ceramic-mug')
        h = part(m, 'handle')
        inset = h.get('lowerRootInset', 0)
        (x, z) = (0.038 - inset, 0.021)
        outer = 0.034 + 0.008 * (z - 0.003) / 0.0845
        inner = 0.029 + 0.008 * (z - 0.01) / 0.0775
        self.assertLess(x, outer)
        self.assertGreater(x, inner)

    def test_holder_bend_has_positive_inner_radius_and_fits_roll(self):
        h = spec('washroom-utilities')['assets'][0]
        rod = h['parts']['rod']
        r = rod['elbowCenterlineRadius']
        self.assertGreater(r, rod['radius'])
        self.assertLess(2 * r, 0.018)
        roll = spec('washroom-linen')['assets'][1]
        self.assertGreater(roll['coreInnerRadius'], rod['radius'])
        self.assertGreaterEqual(0.06 - roll['width'] / 2, r)
        self.assertLessEqual(0.06 + roll['width'] / 2, 0.12 - r)

    def test_toilet_hinges_have_body_support_and_reach_seat(self):
        a = spec('washroom-fixtures')['assets'][0]
        p = a['parts']
        supports = p['hingeSupports']
        self.assertEqual(len(supports), 2)
        for (hinge, support) in zip(p['hinges']['centers'], supports):
            self.assertLess(support['min'][2], 0.395)
            self.assertGreater(support['max'][2], hinge[2] - p['hinges']['radius'])
            # Sample the barrel's inward end inside both seat and barrel.
            x = math.copysign(abs(hinge[0]) - 0.01, hinge[0])
            (y, z) = (hinge[1] - 0.004, 0.4115)
            radial = (x / 0.188) ** 2 + ((y + 0.08) / 0.258) ** 2
            self.assertLess(radial, 1)
            self.assertLess((y - hinge[1]) ** 2 + (z - hinge[2]) ** 2, 0.01 ** 2)

    def test_plant_soil_is_clipped_to_cavity(self):
        for (b, names) in [('small-plants', ['potted-leaf-plant', 'potted-cactus']), ('planters', ['potted-small-tree'])]:
            for name in names:
                soil = part(module(b, name), 'soil')
                self.assertEqual(soil['cavityTrim'], 'Intersect the entire soil volume with the pot cavity; preserve the flat top.')

    def test_basin_spout_has_positive_inner_bend(self):
        p = spec('washroom-fixtures')['assets'][1]['parts']['spout']
        self.assertGreater(p['elbowRadius'], p['outerRadius'])
        self.assertLess(p['elbowRadius'], 0.02)

    def test_marker_cap_reaches_barrel_end(self):
        p = spec('meeting-stationery')['assets'][0]['parts']
        collar = p['cap'].get('retainingCollar', {'innerRadius': p['cap']['subtractBore']['radius']})
        self.assertLess(collar['innerRadius'], p['barrel']['radius'] - p['barrel']['edgeBevel'])

    def test_wall_vine_roots_enter_soil(self):
        m = module('planters', 'wall-planter')
        soil = part(m, 'soil')
        for path in part(m, 'vines')['paths']:
            self.assertLess(path['curves'][0][0][2], soil['zMax'])
            self.assertGreater(path['curves'][0][0][2], soil['zMin'])

def revolve(profile, n):
    (vertices, rings, triangles) = ([], [], [])
    for (r, z) in profile:
        ring = []
        for i in range(1 if r == 0 else n):
            a = 2 * math.pi * i / n
            ring.append(len(vertices))
            vertices.append((r * math.cos(a), r * math.sin(a), z))
        rings.append(ring)
    for (i, left) in enumerate(rings):
        right = rings[(i + 1) % len(rings)]
        if len(left) == len(right) == 1:
            continue
        for j in range(n):
            k = (j + 1) % n
            if len(left) == 1:
                triangles.append((left[0], right[j], right[k]))
            elif len(right) == 1:
                triangles.append((left[j], right[0], left[k]))
            else:
                triangles.extend(((left[j], right[j], right[k]), (left[j], right[k], left[k])))
    return (vertices, triangles)

def profile_cases():
    for b in ('empty-pots', 'serving-smallware', 'desktop-stationery', 'office-containers'):
        for a in spec(b)['assets']:
            c = a.get('construction', a)
            if 'profile' in c:
                yield (b + '/' + a.get('id', a.get('name')), c['profile'], 96, a.get('drainDiameter', 0) > 0)
    yield ('saucer', spec('tea-smallware')['saucer']['closedRadialProfile'], 96, False)
    yield ('magnet', spec('fridge-accessories')['magnet']['closedProfile'], 96, False)
    for m in spec('pantry-smallware')['modules']:
        for p in m['components']:
            if 'profile' in p:
                yield (m['moduleId'] + '/' + p['partId'], p['profile'], 96, False)
    for b in ('small-plants', 'planters'):
        for m in spec(b)['modules']:
            for p in m['components']:
                if 'profileRZ' in p:
                    yield (m['moduleId'] + '/' + p['partId'], p['profileRZ'], 96, False)
    a = spec('washroom-utilities')['assets'][1]['parts']['body']
    yield ('soap-bottle', a['profile'], a['segments'], False)
    yield ('desk-shade', spec('portable-lamps')['assets'][0]['parts']['shade']['profile'], 96, False)

class SectionAndFitChecks(unittest.TestCase):

    def test_revolved_material_shells_have_no_boundary_or_degenerate_faces(self):
        for (name, profile, n, has_drain) in profile_cases():
            with self.subTest(asset=name):
                (verts, faces) = revolve(profile, n)
                edges = Counter()
                for (a, b, c) in faces:
                    u = tuple((verts[b][i] - verts[a][i] for i in range(3)))
                    v = tuple((verts[c][i] - verts[a][i] for i in range(3)))
                    cross = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
                    self.assertGreater(sum((x * x for x in cross)), 1e-26)
                    for e in ((a, b), (b, c), (c, a)):
                        edges[tuple(sorted(e))] += 1
                self.assertEqual(set(edges.values()), {2})
                self.assertEqual(len(verts) - len(edges) + len(faces), 0 if has_drain else 2)

    def test_revolved_profile_segments_do_not_cross(self):

        def orient(a, b, c):
            return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        for (name, profile, _, _) in profile_cases():
            with self.subTest(asset=name):
                for (i, a) in enumerate(profile):
                    b = profile[(i + 1) % len(profile)]
                    for j in range(i + 2, len(profile)):
                        if i == 0 and j == len(profile) - 1:
                            continue
                        (c, d) = (profile[j], profile[(j + 1) % len(profile)])
                        self.assertFalse(orient(a, b, c) * orient(a, b, d) < -1e-20 and orient(c, d, a) * orient(c, d, b) < -1e-20)

    def test_default_pot_dimensions_and_open_drain(self):
        for a in spec('empty-pots')['assets']:
            p = a['profile']
            self.assertAlmostEqual(min((r for (r, z) in p)) * 2, a['drainDiameter'])
            self.assertAlmostEqual(max((r for (r, z) in p)) * 2, a['bounds'][0])
            self.assertAlmostEqual(max((z for (r, z) in p)), a['bounds'][2])
            self.assertEqual(p[-1][0], p[0][0])
            self.assertEqual(p[-1][1], a['innerFloorZ'])

    def test_planter_soil_fit_survives_common_nonuniform_scale(self):
        d = spec('planter-inserts')
        (a, b) = d['assets']
        c = a['construction']['subtractCavity']
        s = b['construction']['box']
        o = d['assemblyReference']['soilOriginInPlanter']
        for scale in ((1, 1, 1), (1.7, 0.65, 2.1)):
            for axis in (0, 1):
                self.assertAlmostEqual((s['min'][axis] + o[axis] - c['min'][axis]) * scale[axis], 0.002 * scale[axis])
                self.assertAlmostEqual((c['max'][axis] - s['max'][axis] - o[axis]) * scale[axis], 0.002 * scale[axis])
            self.assertAlmostEqual(s['min'][2] + o[2], c['min'][2])
            self.assertAlmostEqual((0.24 - s['max'][2] - o[2]) * scale[2], 0.025 * scale[2])

    def test_towel_unfolded_length_and_rail_fit(self):
        a = spec('washroom-linen')['assets'][0]
        f = a['fold']
        self.assertAlmostEqual(f['frontPanelLength'] + f['rearPanelLength'] + math.pi * f['midSurfaceRadius'], a['unfoldedMidSurfaceLength'])
        rail = spec('washroom-accessories')['assets'][1]['parts']['bar']
        self.assertAlmostEqual(f['innerRadius'], rail['radius'])
        self.assertAlmostEqual(f['outerRadius'] - f['innerRadius'], a['thickness'])

    def test_tissue_slot_connects_to_cavity_without_hollowing_bottom(self):
        c = spec('office-containers')['assets'][1]['construction']
        self.assertLess(c['opening']['zRange'][0], c['cavity']['max'][2])
        self.assertGreater(c['opening']['zRange'][1], c['outer']['max'][2])
        self.assertGreater(c['cavity']['min'][2], c['outer']['min'][2])
        self.assertAlmostEqual(c['opening']['endCenterX'][1] - c['opening']['endCenterX'][0] + 2 * c['opening']['radius'], c['opening']['totalLength'])

    def test_spoon_positive_thickness_and_station_extents(self):
        s = spec('tea-smallware')['spoon']
        rows = s['stations']
        h = s['verticalThickness']
        self.assertTrue(all((rows[i][0] < rows[i + 1][0] for i in range(len(rows) - 1))))
        self.assertEqual(min((z for (y, w, z) in rows)) - h, 0)
        self.assertEqual(2 * max((w for (y, w, z) in rows)), s['bounds'][0])
        self.assertAlmostEqual(s['handleEnd']['centerY'] + s['handleEnd']['radius'] - rows[0][0], s['bounds'][1])
        self.assertGreater(h, 0)

    def test_canister_lid_fit_and_takeaway_hole_clearance(self):
        (a, b) = spec('pantry-smallware')['modules']
        body = part(a, 'body')['profile']
        lid = part(a, 'lid')['profile']
        self.assertAlmostEqual(body[6][0] - lid[1][0], 0.0005)
        self.assertEqual(lid[2][1], body[5][1])
        hole = part(b, 'sip-opening')
        self.assertLess(math.hypot(*hole['centreXY']) + max(hole['semiAxesXY']), 0.0335)
        self.assertLess(hole['zBounds'][0], 0.111)
        self.assertGreater(hole['zBounds'][1], 0.12)

    def test_laptop_basis_keyboard_and_support_planes(self):
        m = module('desk-items', 'laptop')
        lid = part(m, 'lid')
        (u, n) = (lid['basisUp'], lid['basisFront'])
        self.assertAlmostEqual(sum((a * b for (a, b) in zip(u, n))), 0)
        self.assertAlmostEqual(sum((a * a for a in u)), 1)
        self.assertAlmostEqual(sum((a * a for a in n)), 1)
        keys = part(m, 'standard-keys')
        last = part(m, 'bottom-row')
        self.assertEqual(len(keys['rowsY']) * keys['columns'] + len(last['smallKeyCentresX']) + 1, 77)
        base = part(m, 'base')
        pads = [p for p in m['components'] if p['partId'].startswith('underside-pad-')]
        self.assertEqual(len(pads), 4)
        for p in pads:
            self.assertAlmostEqual(box_bounds(p)[0][2], 0)
            self.assertAlmostEqual(box_bounds(p)[1][2], box_bounds(base)[0][2])

    def test_appliance_complete_depth_and_feet(self):
        for m in spec('pantry')['modules']:
            if m['moduleId'] == 'sink-cabinet':
                continue
            intervals = [box_bounds(p) for p in m['components'] if p['primitive'] == 'rounded-box']
            self.assertAlmostEqual(max((b[1][1] for b in intervals)) - min((b[0][1] for b in intervals)), m['overallSize'][1])
            feet = [p for p in m['components'] if p['partId'].startswith('foot-')]
            self.assertEqual(len(feet), 4)
            for p in feet:
                self.assertAlmostEqual(p['centre'][2] - p['length'] / 2, 0)

    def test_cookie_masks_fit_flat_disk(self):
        d = spec('cookie')
        r = d['topSpots']['radius']
        limit = d['object']['flatFaceRadius']
        for (x, y) in d['topSpots']['centresXY']:
            self.assertLess(math.hypot(x, y) + r, limit)
        self.assertEqual(len(d['topSpots']['centresXY']), 5)

    def test_shrub_and_flowers_retain_counts_and_connections(self):
        d = spec('garden-greenery')['assets'][0]
        self.assertEqual(sum((r['count'] for r in d['construction']['rings'])) + 1, d['construction']['totalLeaves'])
        self.assertAlmostEqual(d['construction']['topLeaf']['center'][2] + d['construction']['leafShape']['radii'][2], d['height'])
        for a in spec('garden-flowers')['assets']:
            self.assertEqual(len(a['leaves']), 2)
            self.assertAlmostEqual(a['headZ'] + a['center']['radii'][2], a['height'])
            self.assertLess(a['petals']['centerRadius'] - a['petals']['radii'][0], a['center']['radii'][0])
            for leaf in a['leaves']:
                angle = math.radians(leaf['tiltYDegrees'])
                reach = math.sqrt((0.008 * math.cos(angle)) ** 2 + (0.025 * math.sin(angle)) ** 2)
                self.assertLess(abs(leaf['center'][0]) - reach, a['stemRadius'])

    def test_tree_leaf_frames_and_petioles(self):
        m = module('planters', 'potted-small-tree')
        leaves = part(m, 'leaves')['instances']
        branches = part(m, 'branches')
        self.assertEqual(len(leaves), 30)
        self.assertEqual(Counter((l['cluster'] for l in leaves)), {0: 10, 1: 10, 2: 10})
        for leaf in leaves:
            v = leaf['majorDirection']
            self.assertAlmostEqual(sum((x * x for x in v)), 1)
            self.assertLess(abs(v[1]), 0.999)
            tip = [leaf['centre'][i] - 0.055 * v[i] for i in range(3)]
            root = branches['endPoints'][leaf['cluster']]
            self.assertGreater(math.dist(tip, root), 0)
            self.assertLess(math.dist(tip, root), 0.04)

    def test_clock_hands_clear_indices_and_each_other(self):
        clock = module('wall-decor', 'wall-clock')
        dial = part(clock, 'dial')
        indices = part(clock, 'hour-indices')
        hour = part(clock, 'hour-hand')
        minute = part(clock, 'minute-hand')
        pin = part(clock, 'centre-pin')
        rim = part(clock, 'front-rim')
        self.assertEqual(indices['count'], 12)
        self.assertEqual(indices['count'] * indices['angleStep'], 360)
        self.assertEqual(indices['yMax'], dial['yMin'])
        self.assertLess(hour['yMax'], indices['yMin'])
        self.assertLess(minute['yMax'], hour['yMin'])
        self.assertGreater(pin['yMin'], rim['yMin'])
        for hand in (hour, minute):
            self.assertLess(pin['yMin'], hand['yMin'])
            self.assertGreater(pin['yMax'], hand['yMax'])
            reach = max((math.hypot(*v) for v in hand['vertices']))
            self.assertLess(reach, rim['innerRadius'])
        self.assertEqual(minute['angle'], 35 * 6)
        self.assertEqual(hour['angle'], 30 + 35 * 0.5)

    def test_wallpaper_repeat_preserves_default_and_partial_cycles(self):
        for m in spec('wall-decor')['modules'][1:]:
            pattern = m['resizedPattern']
            period = pattern['repeatMetres']
            self.assertEqual(period, 0.4)
            self.assertEqual(pattern['sageFraction'], [0.25, 0.75])
            (low, high) = pattern['sageFraction']
            sage = lambda distance: low <= distance / period % 1 < high
            self.assertFalse(sage(0.05))
            self.assertTrue(sage(0.2))
            self.assertFalse(sage(0.35))
            self.assertTrue(sage(0.6))
            self.assertFalse(sage(0.85))
if __name__ == '__main__':
    unittest.main()
