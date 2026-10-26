"""Map measured seating groups into accepted rooms without refitting sizes.

Source image measurements and fixed whole-unit scales live in seating-measurements.
Default is report-only; --apply updates the canonical admitted-instance pose layout.
"""
import argparse
import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()
data_dir = root / 'apps/asyra-office/src/scene/reference'
evidence = json.loads((data_dir / 'seating-measurements.json').read_text())
structure = json.loads((data_dir / 'office-structure.json').read_text())
p, shell = structure['parameters'], structure['shell']
front = shell['frontY'] + shell['facadeThickness'] / 2
rear = p['rearY'] - shell['exteriorThickness'] / 2
bounds = {
    'work': [front, p['creamY'] - shell['exteriorThickness'] / 2],
    'discussion': [p['creamY'] + shell['exteriorThickness'] / 2, rear],
    'lounge': [front, p['loungeY'] - shell['partitionThickness'] / 2],
}
instances = {}
for room, source in evidence['roomPlacement']['rooms'].items():
    low, high = source['sourceBoundsY']
    fraction = (source['sourceAnchor'][1] - low) / (high - low)
    if not 0 < fraction < 1 or bounds[room][1] <= bounds[room][0]:
        raise ValueError('Invalid source anchor or current room bounds: ' + room)
    y = bounds[room][0] + fraction * (bounds[room][1] - bounds[room][0])
    for ident, member in source['members'].items():
        item = dict(id=ident, asset=member['asset'], room=room,
                    position=[source['sourceAnchor'][0] + member['offset'][0], y + member['offset'][1]],
                    scale=member['scale'], rotation=member['rotation'])
        instances[ident] = item
result = {'authority': 'Source-relative seating groups inside the owner-accepted deeper rooms. Reproduce with scripts/fit-room-seating.py; uniform source-width scales preserve approved shapes; rejected upholstery is omitted.',
          'instances': list(instances.values())}
if args.apply:
    (data_dir / 'office-seating.json').write_text(json.dumps(result, indent=2) + '\n')
for item in result['instances']:
    print(item['id'], 'position', [round(n, 4) for n in item['position']], 'yaw', round(item['rotation'], 2))
