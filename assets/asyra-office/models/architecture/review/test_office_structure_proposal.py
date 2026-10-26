"""Permanent semantic checks for the separate structural review drawing."""
import json
import math
from lounge_proportion_geometry import project, wall_corners
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent


class StructureProposalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((HERE / 'office-single-floor-structure-proposal-v1.json').read_text())
        cls.walls = {w['id']: w for w in cls.data['walls']}

    def test_dividers_are_nearly_equal_height_and_cream_is_lowered(self):
        a, b = (self.walls[n] for n in ['A - cream divider', 'B - green divider'])
        self.assertEqual(a['cross'], b['cross'])
        self.assertEqual(a['base'], b['base'])
        self.assertLess(a['top'], 2.5537089432640605)
        ratio = (b['top'] - b['base']) / (a['top'] - a['base'])
        self.assertGreaterEqual(ratio, .85)
        self.assertLess(ratio, 1)

    def test_whole_door_uses_one_scale_and_keeps_both_panels(self):
        entry = self.data['entryAssembly']
        spec = json.loads((HERE.parent / 'architecture-model-spec.json').read_text())
        door = next(m for m in spec['modules'] if m['moduleId'] == 'entry-door-set')
        scale = entry['scale']
        for expected, actual in zip(door['mounting']['roughOpeningSizeMetres'], entry['roughOpening']):
            self.assertAlmostEqual(actual, expected * scale)
        for part in ['fixed-left-panel', 'right-main-leaf']:
            expected = next(c for c in door['components'] if c['partId'] == part)
            actual = next(c for c in entry['components'] if c['partId'] == part)
            for a, e in zip(actual['size'], expected['sizeMetres']):
                self.assertAlmostEqual(a, e * scale)
        self.assertLess(self.walls['thin front section']['thickness'], self.walls['front facade']['thickness'])
        opening_right = self.data['parameters']['doorX'] + entry['roughOpening'][0] / 2
        side = self.walls['lounge left low']
        self.assertLessEqual(opening_right, side['cross'] - side['thickness'] / 2)

    def test_lounge_has_two_left_and_three_rear_height_sections(self):
        rear = [self.walls[n] for n in ['lounge rear left', 'lounge rear middle', 'lounge rear right']]
        self.assertLess(rear[0]['top'], rear[1]['top'])
        self.assertLess(rear[1]['top'], rear[2]['top'])
        self.assertEqual(rear[0]['end'], rear[1]['start'])
        self.assertEqual(rear[1]['end'], rear[2]['start'])
        low, high = (self.walls[n] for n in ['lounge left low', 'lounge left return'])
        self.assertEqual(low['end'], high['start'])
        self.assertLess(low['top'], high['top'])
        for wall in rear + [low, high]:
            self.assertEqual(wall['top'], wall['endTop'])

    def test_lounge_lengths_follow_source_crown_spans(self):
        trace = json.loads((HERE / 'lounge-proportion-measurements.json').read_text())['points']
        low, high = (self.walls[n] for n in ['lounge left low', 'lounge left return'])
        rear = [self.walls[n] for n in ['lounge rear left', 'lounge rear middle', 'lounge rear right']]
        high_length = high['end'] - high['thickness']/2 - high['start']
        expected_ratio = (trace['leftHighFront'][0]-trace['leftLowFront'][0]) / (trace['leftHighRear'][0]-trace['leftHighFront'][0])
        self.assertAlmostEqual((low['end']-low['start']) / high_length, expected_ratio, places=5)
        visible_width = rear[-1]['end'] - rear[0]['start'] - high['thickness']/2
        source_width = trace['rearRightEnd'][0] - trace['rearLeft'][0]
        for wall, a, b in zip(rear, ['rearLeft','rearMiddleStart','rearRightStart'], ['rearLeftEnd','rearMiddleEnd','rearRightEnd']):
            actual = wall['end']-wall['start'] - (high['thickness']/2 if a == 'rearLeft' else 0)
            self.assertAlmostEqual(actual/visible_width, (trace[b][0]-trace[a][0])/source_width, places=5)

    def test_white_pantry_connection_is_floor_not_wall(self):
        self.assertNotIn('pantry low side', self.walls)
        band = next(s for s in self.data['solids'] if s['id'] == 'white pantry floor band')
        self.assertAlmostEqual(max(v[2] for v in band['vertices']), self.data['sharedFloor'])
        self.assertLess(max(v[2] for v in band['vertices']) - min(v[2] for v in band['vertices']), .05)

    def test_emitted_wall_corners_match_source_pick_uncertainty(self):
        trace = json.loads((HERE / 'lounge-proportion-measurements.json').read_text())['points']
        basis = self.data['loungeReconstruction']['projection']
        self.assertEqual(set(wall_corners(self.data['walls'])), set(trace))
        for name, corner in wall_corners(self.data['walls']).items():
            with self.subTest(corner=name):
                self.assertLessEqual(math.dist(project(corner,basis), trace[name]), 8)


if __name__ == '__main__':
    unittest.main()
