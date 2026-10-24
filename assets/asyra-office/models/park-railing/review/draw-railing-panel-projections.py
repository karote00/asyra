"""Draw the panel reference from its numeric specification; export no model."""

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
SPEC_PATH = ROOT.parent / 'park-railing-model-spec.json'
SPEC = json.loads(SPEC_PATH.read_text())
PANEL = next(a for a in SPEC['assets'] if a['name'] == 'park-railing-panel')
PARTS = PANEL['parts']
WIDTH, HEIGHT, SCALE, SS = 3072, 2048, 1100, 2
INK, ANNOTATION = '#17232C', '#315D79'
RAIL_COLOURS = ('#899DAD', '#9DADB9', '#DCE5EC')
PICKET_COLOURS = ('#B7C7D3', '#D7E0E6', '#C1D0DD')
FONT_ROOT = Path('/System/Library/Fonts/Supplemental')
PAPER = Image.new('RGB', (WIDTH * SS, HEIGHT * SS), 'white')
DRAW = ImageDraw.Draw(PAPER)


def text(x, y, value, size=32, bold=False, anchor='lt', fill=INK):
    font = ImageFont.truetype(str(FONT_ROOT / ('Arial Bold.ttf' if bold else 'Arial.ttf')), size * SS)
    DRAW.text((x * SS, y * SS), value, font=font, anchor=anchor, fill=fill)


def line(points, fill=ANNOTATION):
    DRAW.line([(x * SS, y * SS) for x, y in points], fill=fill, width=2 * SS)


def rgb(value):
    return [int(value[i:i + 2], 16) for i in (1, 3, 5)]


def basis(camera, right):
    camera = np.array(camera, dtype=float)
    camera /= np.linalg.norm(camera)
    right = np.array(right, dtype=float)
    right /= np.linalg.norm(right)
    return camera, right, np.cross(camera, right)


def projection_bounds(camera, right, origin):
    _, horizontal, vertical = basis(camera, right)
    points = []
    for part in PARTS:
        for x in (-1, 1):
            for y in (-1, 1):
                for z in (-1, 1):
                    p = np.array(part['center']) + np.array(part['size']) * (x, y, z) / 2
                    points.append((origin[0] + SCALE * np.dot(p, horizontal),
                                   origin[1] - SCALE * np.dot(p, vertical)))
    points = np.array(points)
    return [*points.min(axis=0).tolist(), *points.max(axis=0).tolist()]


def draw_view(name, camera, right, origin, rect):
    eye, horizontal, vertical = basis(camera, right)
    direction = -eye
    left, top, right_edge, bottom = rect
    ys, xs = np.mgrid[top * SS:bottom * SS, left * SS:right_edge * SS]
    h = ((xs + .5) / SS - origin[0]) / SCALE
    v = (origin[1] - (ys + .5) / SS) / SCALE
    rays = h[..., None] * horizontal + v[..., None] * vertical + eye * 10
    depth = np.full(h.shape, np.inf)
    owner = np.full(h.shape, -1, dtype=np.int8)
    face_owner = np.full(h.shape, -1, dtype=np.int8)
    for index, part in enumerate(PARTS):
        centre, half = np.array(part['center']), np.array(part['size']) / 2
        near, far = np.full(h.shape, -np.inf), np.full(h.shape, np.inf)
        valid = np.ones(h.shape, dtype=bool)
        face = np.zeros(h.shape, dtype=np.int8)
        for axis in range(3):
            low, high = centre[axis] - half[axis], centre[axis] + half[axis]
            if abs(direction[axis]) < 1e-12:
                valid &= (rays[..., axis] >= low) & (rays[..., axis] <= high)
                continue
            a = (low - rays[..., axis]) / direction[axis]
            b = (high - rays[..., axis]) / direction[axis]
            entry, leave = np.minimum(a, b), np.maximum(a, b)
            face[entry > near] = axis
            near, far = np.maximum(near, entry), np.minimum(far, leave)
        hit = np.where(valid & (near <= far) & (near >= 0), near, np.inf)
        visible = hit < depth
        depth[visible], owner[visible] = hit[visible], index
        face_owner[visible] = index * 3 + face[visible]
    pixels = np.full((*h.shape, 3), 255, dtype=np.uint8)
    for index, part in enumerate(PARTS):
        colours = RAIL_COLOURS if part['name'].endswith('-rail') else PICKET_COLOURS
        for axis in range(3):
            palette_axis = 1 if name in ('FRONT', 'RIGHT', 'BACK') else axis
            pixels[face_owner == index * 3 + axis] = rgb(colours[palette_axis])
    edge = np.zeros(h.shape, dtype=bool)
    for distance in range(1, SS + 1):
        edge[distance:] |= face_owner[distance:] != face_owner[:-distance]
        edge[:-distance] |= face_owner[:-distance] != face_owner[distance:]
        edge[:, distance:] |= face_owner[:, distance:] != face_owner[:, :-distance]
        edge[:, :-distance] |= face_owner[:, :-distance] != face_owner[:, distance:]
    pixels[edge & (owner >= 0)] = rgb(INK)
    PAPER.paste(Image.fromarray(pixels), (left * SS, top * SS))
    occupied = owner >= 0
    bounds = [float(xs[occupied].min() / SS), float(ys[occupied].min() / SS),
              float((xs[occupied].max() + 1) / SS), float((ys[occupied].max() + 1) / SS)]
    expected = projection_bounds(camera, right, origin)
    residual = max(abs(a - b) for a, b in zip(bounds, expected))
    assert residual <= 1, (name, bounds, expected)
    visible_parts = [part['name'] for i, part in enumerate(PARTS) if (owner == i).any()]
    cap_records = []
    if name == 'TOP':
        assert 'lower-rail' not in visible_parts
        for i, part in enumerate(PARTS):
            if not part['name'].startswith('picket-'):
                continue
            cap = owner == i
            cap_bounds = [float(xs[cap].min() / SS), float(ys[cap].min() / SS),
                          float((xs[cap].max() + 1) / SS), float((ys[cap].max() + 1) / SS)]
            margins = [cap_bounds[1] - bounds[1], bounds[3] - cap_bounds[3]]
            assert all(abs(margin - .0035 * SCALE) <= 1 for margin in margins)
            assert abs(cap_bounds[2] - cap_bounds[0] - part['size'][0] * SCALE) <= 1
            cap_records.append({'part': part['name'], 'boundsPixels': cap_bounds,
                                'depthMarginsPixels': margins})
        assert len(cap_records) == 5
    return {'view': name, 'cameraDirection': list(camera), 'screenRight': horizontal.tolist(),
            'screenUp': vertical.tolist(), 'originPixels': list(origin), 'clipPixels': list(rect),
            'analyticBoundsPixels': expected, 'rasterBoundsPixels': bounds,
            'maximumBoundaryErrorPixels': residual, 'visibleParts': visible_parts,
            'topCaps': cap_records}


VIEWS = [
    ('FRONT', (0, -1, 0), (1, 0, 0), (690, 900), (170, 270, 1210, 925)),
    ('RIGHT', (1, 0, 0), (0, 1, 0), (1536, 900), (1485, 270, 1585, 925)),
    ('BACK', (0, 1, 0), (-1, 0, 0), (2350, 900), (1830, 270, 2870, 925)),
    ('TOP', (0, 0, 1), (1, 0, 0), (690, 1440), (170, 1400, 1210, 1480)),
    ('THREE-QUARTER', (1, -1, .8), (1, 1, 0), (2360, 1690), (1980, 970, 2740, 1880)),
]
records = [draw_view(*view) for view in VIEWS]
mm = lambda value: f'{value * 1000:g}'
text(80, 55, 'PARK RAILING PANEL - SINGLE UNIT', 64, True)
text(80, 158, 'REVIEW COLOURS ONLY - DEFAULT METAL: ' + SPEC['material']['baseColorSRGB'], 36)
for view in VIEWS[:3]:
    text(view[3][0], 950, view[0], 39, True, 'mt')
text(690, 1550, 'TOP', 39, True, 'mt')
text(2360, 1900, 'THREE-QUARTER', 39, True, 'mt')
width, depth, height = PANEL['bounds']
x0, x1 = 690 - width * SCALE / 2, 690 + width * SCALE / 2
y0 = 900 - height * SCALE
line([(x0, y0 - 12), (x0, 246), (x1, 246), (x1, y0 - 12)])
for x in (x0, x1):
    line([(x - 7, 253), (x + 7, 239)])
text(690, 216, mm(width) + ' mm', 29, anchor='mt', fill=ANNOTATION)
line([(x0 - 10, y0), (130, y0), (130, 900), (x0 - 10, 900)])
text(110, (y0 + 900) / 2, mm(height), 29, anchor='rm', fill=ANNOTATION)
for y in (y0, 900):
    line([(123, y + 7), (137, y - 7)])

# Spacing dimensions are derived from the same part coordinates as the views.
# Annotate one typical horizontal interval, not every repeated opening.
lower, upper, *pickets = PARTS
pitch = pickets[1]['center'][0] - pickets[0]['center'][0]
gap = (pickets[2]['center'][0] - pickets[2]['size'][0] / 2
       - pickets[1]['center'][0] - pickets[1]['size'][0] / 2)
opening = (upper['center'][2] - upper['size'][2] / 2
           - lower['center'][2] - lower['size'][2] / 2)
assert all(np.isclose(pickets[i + 1]['center'][0] - pickets[i]['center'][0], pitch)
           for i in range(len(pickets) - 1))
front_x = lambda x: 690 + x * SCALE
front_y = lambda z: 900 - z * SCALE
pitch_points = [front_x(p['center'][0]) for p in pickets[:2]]
gap_points = [front_x(pickets[1]['center'][0] + pickets[1]['size'][0] / 2),
              front_x(pickets[2]['center'][0] - pickets[2]['size'][0] / 2)]
for endpoints, y, value in [(pitch_points, 425, pitch), (gap_points, 550, gap)]:
    line([(endpoints[0], y), (endpoints[1], y)])
    for x in endpoints:
        line([(x, y - 17), (x, y + 17)])
        line([(x - 6, y + 6), (x + 6, y - 6)])
    text(sum(endpoints) / 2, y - 38, mm(value), 29, anchor='mt', fill=ANNOTATION)
opening_x = front_x((pickets[3]['center'][0] + pickets[4]['center'][0]) / 2)
opening_y = [front_y(upper['center'][2] - upper['size'][2] / 2),
             front_y(lower['center'][2] + lower['size'][2] / 2)]
line([(opening_x, opening_y[0]), (opening_x, opening_y[1])])
for y in opening_y:
    line([(opening_x - 16, y), (opening_x + 16, y)])
    line([(opening_x - 6, y + 6), (opening_x + 6, y - 6)])
text(opening_x + 18, sum(opening_y) / 2, mm(opening), 29, anchor='lm', fill=ANNOTATION)
text(190, 1040, 'DEFAULT SPACING - mm', 30, True, fill=ANNOTATION)
text(190, 1095, mm(pitch) + ' centre-to-centre - 5 equally spaced pickets', 29, fill=ANNOTATION)
text(190, 1145, mm(gap) + ' clear between pickets - ' + mm(opening) + ' clear between rails', 29, fill=ANNOTATION)
text(190, 1195, 'Spacing follows overall XYZ sizing.', 27, fill=ANNOTATION)
text(190, 1250, '5 PICKET CAPS INSIDE THE RAIL FOOTPRINT', 30, True)
text(190, 1305, 'Rail depth: 25 mm - Picket depth: 18 mm', 29)
text(190, 1355, 'Setback: 3.5 mm on each side', 29)
text(190, 1640, '2 horizontal rails - 5 vertical pickets', 30)
text(190, 1690, 'One panel - end posts excluded', 30)
text(190, 1750, 'Flat review colours identify parts and faces.', 27)
text(190, 1795, 'No shadows, lighting or texture baked in.', 27)
text(WIDTH / 2, 1980,
     'DEFAULT SIZE: ' + ' x '.join(mm(v) for v in PANEL['bounds'])
     + ' mm - All views: 1100 px/m - Orthographic projection', 31, True, 'mt')

OUTPUT = ROOT / '02-railing-panel-v2.png'
PAPER.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS).save(OUTPUT)
saved = np.array(Image.open(OUTPUT).convert('RGB'))
png_checks = []
for view in VIEWS[:4]:
    name, camera, right, origin, rect = view
    # Exclude dimension leaders outside the object, with a three-pixel margin
    # that is larger than the fixed two-pixel image acceptance tolerance.
    expected = projection_bounds(camera, right, origin)
    left, top = [int(np.floor(v)) - 3 for v in expected[:2]]
    right_edge, bottom = [int(np.ceil(v)) + 3 for v in expected[2:]]
    region = saved[top:bottom, left:right_edge]
    # Measure the dark contour, not the pale antialias fringe outside it.
    yy, xx = np.where(np.max(region, axis=2) < 110)
    measured = [int(xx.max() - xx.min() + 1), int(yy.max() - yy.min() + 1)]
    target = ([width, height] if name in ('FRONT', 'BACK') else
              [depth, height] if name == 'RIGHT' else [width, depth])
    assert all(abs(actual - value * SCALE) <= 2 for actual, value in zip(measured, target)), (name, measured)
    png_checks.append({'view': name, 'envelopePixels': measured,
                       'targetPixels': [v * SCALE for v in target]})

top_caps = []
for part in PARTS[2:]:
    x = round(690 + part['center'][0] * SCALE)
    # Isolate the saved PNG's flat cap fill; outlines are reviewed separately.
    column = saved[1410:1470, x].astype(int)
    rows = np.flatnonzero(np.max(np.abs(column - np.array(rgb(PICKET_COLOURS[2]))), axis=1) <= 8) + 1410
    assert len(rows) > 0
    assert rows.min() > 1440 - depth * SCALE / 2
    assert rows.max() < 1440 + depth * SCALE / 2
    top_caps.append({'part': part['name'], 'columnPixels': x,
                     'capFillYRangePixels': [int(rows.min()), int(rows.max())]})

report = {'drawing': OUTPUT.name, 'sheetPixels': [WIDTH, HEIGHT], 'pixelsPerMetre': SCALE,
          'sourceSpecification': '../' + SPEC_PATH.name,
          'sourceSHA256': hashlib.sha256(SPEC_PATH.read_bytes()).hexdigest(),
          'drawingSHA256': hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
          'views': records, 'savedPNGChecks': png_checks, 'savedPNGTopCaps': top_caps,
          'spacingAnnotations': {
              'units': 'default millimetres; scaled with the complete unit',
              'picketCentrePitch': pitch * 1000,
              'picketClearGap': gap * 1000,
              'railClearOpening': opening * 1000,
              'equalPicketSpacing': True,
              'frontPitchEndpointsPixels': [[x, 425] for x in pitch_points],
              'frontGapEndpointsPixels': [[x, 550] for x in gap_points],
              'frontOpeningEndpointsPixels': [[opening_x, y] for y in opening_y],
          },
          'rasterTolerancePixels': 1, 'savedPNGTolerancePixels': 2,
          'savedPNGMethod': 'Dark contour envelope; pale resampling fringe excluded. Cap fill sampled separately.',
          'scope': 'Reference diagram only; no model, mesh export or app validation.'}
(ROOT / 'panel-projection-measurements.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'drawing': str(OUTPUT), 'pngChecks': png_checks,
                  'maximumBoundaryErrorPixels': max(r['maximumBoundaryErrorPixels'] for r in records)}))
