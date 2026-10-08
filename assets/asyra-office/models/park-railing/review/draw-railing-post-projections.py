"""Draw five orthographic reference projections from the post specification.

This produces a reference PNG and measurement record, not a mesh or 3D export.
"""

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
SPEC_PATH = ROOT.parent / 'park-railing-model-spec.json'
SPEC = json.loads(SPEC_PATH.read_text())
POST = next(asset for asset in SPEC['assets'] if asset['name'] == 'park-railing-post')
PARTS = POST['parts']
WIDTH, HEIGHT, SUPERSAMPLE, SCALE = 3072, 2048, 2, 2000
INK = '#17232C'
ANNOTATION = '#315D79'
PALETTE = {
    'shaft': ('#B7C7D3', '#D7E0E6', '#D7E0E6'),
    'collar': ('#899DAD', '#9DADB9', '#DCE5EC'),
    'finial': ('#D9D2C3',) * 3,
}
FONT_ROOT = Path('/System/Library/Fonts/Supplemental')
PAPER = Image.new('RGB', (WIDTH * SUPERSAMPLE, HEIGHT * SUPERSAMPLE), 'white')
DRAW = ImageDraw.Draw(PAPER)


def colour(value):
    return [int(value[index:index + 2], 16) for index in (1, 3, 5)]


def text(x, y, value, size=32, bold=False, anchor='lt', fill=INK):
    font = ImageFont.truetype(
        str(FONT_ROOT / ('Arial Bold.ttf' if bold else 'Arial.ttf')),
        size * SUPERSAMPLE,
    )
    DRAW.text((x * SUPERSAMPLE, y * SUPERSAMPLE), value, font=font,
              fill=fill, anchor=anchor)


def line(points, fill=ANNOTATION, width=2):
    DRAW.line([(x * SUPERSAMPLE, y * SUPERSAMPLE) for x, y in points],
              fill=fill, width=width * SUPERSAMPLE)


def basis(camera, right):
    eye = np.array(camera, dtype=float)
    eye /= np.linalg.norm(eye)
    right = np.array(right, dtype=float)
    right /= np.linalg.norm(right)
    return eye, right, np.cross(eye, right)


def project(point, camera, right, origin):
    _, horizontal, vertical = basis(camera, right)
    point = np.array(point)
    return (origin[0] + SCALE * np.dot(point, horizontal),
            origin[1] - SCALE * np.dot(point, vertical))


def box_vertices(part):
    half = np.array(part['size']) / 2
    centre = np.array(part['center'])
    return [centre + half * np.array((x, y, z))
            for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]


def expected_bounds(camera, right, origin):
    bounds = []
    for part in PARTS:
        if part['primitive'] == 'sphere':
            x, y = project(part['center'], camera, right, origin)
            radius = part['radius'] * SCALE
            bounds.append((x - radius, y - radius, x + radius, y + radius))
        else:
            vertices = np.array([project(v, camera, right, origin)
                                 for v in box_vertices(part)])
            bounds.append((*vertices.min(axis=0), *vertices.max(axis=0)))
    values = np.array(bounds)
    return [float(values[:, 0].min()), float(values[:, 1].min()),
            float(values[:, 2].max()), float(values[:, 3].max())]


def draw_view(name, camera, right, origin, rect):
    eye, horizontal, vertical = basis(camera, right)
    direction = -eye
    left, top, right_edge, bottom = rect
    ys, xs = np.mgrid[top * SUPERSAMPLE:bottom * SUPERSAMPLE,
                      left * SUPERSAMPLE:right_edge * SUPERSAMPLE]
    h = ((xs + 0.5) / SUPERSAMPLE - origin[0]) / SCALE
    v = (origin[1] - (ys + 0.5) / SUPERSAMPLE) / SCALE
    rays = h[..., None] * horizontal + v[..., None] * vertical + eye * 10
    depth = np.full(h.shape, np.inf)
    owner = np.full(h.shape, -1, dtype=np.int8)
    face_owner = np.full(h.shape, -1, dtype=np.int8)

    for index, part in enumerate(PARTS):
        face = np.zeros(h.shape, dtype=np.int8)
        if part['primitive'] == 'sphere':
            relative = rays - np.array(part['center'])
            b = np.sum(relative * direction, axis=2)
            c = np.sum(relative * relative, axis=2) - part['radius'] ** 2
            discriminant = b * b - c
            distance = -b - np.sqrt(np.maximum(discriminant, 0))
            hit = np.where((discriminant >= 0) & (distance >= 0), distance, np.inf)
        else:
            centre = np.array(part['center'])
            half = np.array(part['size']) / 2
            near = np.full(h.shape, -np.inf)
            far = np.full(h.shape, np.inf)
            valid = np.ones(h.shape, dtype=bool)
            for axis in range(3):
                low, high = centre[axis] - half[axis], centre[axis] + half[axis]
                if abs(direction[axis]) < 1e-12:
                    valid &= (rays[..., axis] >= low) & (rays[..., axis] <= high)
                    continue
                a = (low - rays[..., axis]) / direction[axis]
                b = (high - rays[..., axis]) / direction[axis]
                entry, leave = np.minimum(a, b), np.maximum(a, b)
                face[entry > near] = axis
                near = np.maximum(near, entry)
                far = np.minimum(far, leave)
            hit = np.where(valid & (near <= far) & (near >= 0), near, np.inf)
        visible = hit < depth
        depth[visible] = hit[visible]
        owner[visible] = index
        face_owner[visible] = index * 3 + face[visible]

    pixels = np.full((*h.shape, 3), 255, dtype=np.uint8)
    for index, part in enumerate(PARTS):
        for axis in range(3):
            # Principal elevations share the same flat review face colour.
            palette_axis = 1 if name in ('FRONT', 'RIGHT', 'BACK') else axis
            pixels[face_owner == index * 3 + axis] = colour(PALETTE[part['name']][palette_axis])
    edge = np.zeros(h.shape, dtype=bool)
    for distance in range(1, 2 * SUPERSAMPLE + 1):
        edge[distance:] |= face_owner[distance:] != face_owner[:-distance]
        edge[:-distance] |= face_owner[:-distance] != face_owner[distance:]
        edge[:, distance:] |= face_owner[:, distance:] != face_owner[:, :-distance]
        edge[:, :-distance] |= face_owner[:, :-distance] != face_owner[:, distance:]
    pixels[edge & (owner >= 0)] = colour(INK)
    PAPER.paste(Image.fromarray(pixels), (left * SUPERSAMPLE, top * SUPERSAMPLE))

    occupied = owner >= 0
    measured = [float(xs[occupied].min() / SUPERSAMPLE),
                float(ys[occupied].min() / SUPERSAMPLE),
                float((xs[occupied].max() + 1) / SUPERSAMPLE),
                float((ys[occupied].max() + 1) / SUPERSAMPLE)]
    expected = expected_bounds(camera, right, origin)
    residual = max(abs(a - b) for a, b in zip(measured, expected))
    assert residual <= 1, (name, measured, expected)
    spans = {}
    for index, part in enumerate(PARTS):
        selected = owner == index
        spans[part['name']] = (
            float((xs[selected].max() - xs[selected].min() + 1) / SUPERSAMPLE)
            if selected.any() else None
        )
    if name in ('FRONT', 'RIGHT', 'BACK', 'TOP'):
        assert abs(spans['finial'] - 2 * PARTS[2]['radius'] * SCALE) <= 1
        assert abs(spans['collar'] - PARTS[1]['size'][0] * SCALE) <= 1
    if name in ('FRONT', 'RIGHT', 'BACK'):
        assert abs(spans['shaft'] - PARTS[0]['size'][0] * SCALE) <= 1
        assert abs((measured[3] - measured[1]) - POST['bounds'][2] * SCALE) <= 1
    return {'view': name, 'cameraDirection': list(camera), 'screenRight': horizontal.tolist(),
            'screenUp': vertical.tolist(), 'originPixels': list(origin), 'clipPixels': list(rect),
            'expectedBoundsPixels': expected, 'measuredBoundsPixels': measured,
            'maximumBoundaryErrorPixels': residual, 'visiblePartWidthsPixels': spans}


VIEWS = [
    ('FRONT', (0, -1, 0), (1, 0, 0), (320, 1740), (220, 280, 420, 1760)),
    ('RIGHT', (1, 0, 0), (0, 1, 0), (920, 1740), (820, 280, 1020, 1760)),
    ('BACK', (0, 1, 0), (-1, 0, 0), (1520, 1740), (1420, 280, 1620, 1760)),
    ('TOP', (0, 0, 1), (1, 0, 0), (2020, 1000), (1920, 900, 2120, 1100)),
    ('THREE-QUARTER', (1, -1, .8), (1, 1, 0), (2490, 1740), (2350, 420, 2630, 1810)),
]
records = [draw_view(*view) for view in VIEWS]
shaft, collar, sphere = PARTS
mm = lambda value: f'{value * 1000:g}'
text(80, 60, 'PARK RAILING POST - SINGLE UNIT', 64, True)
text(80, 164, 'REVIEW COLOURS ONLY - DEFAULT METAL: ' + SPEC['material']['baseColorSRGB'], 38)
for view in VIEWS:
    text(view[3][0], 1815, view[0], 37, anchor='mt')

# Dimensions and leaders use the same geometry-to-page projection as the views.
height_top = VIEWS[0][3][1] - POST['bounds'][2] * SCALE
height_bottom = VIEWS[0][3][1]
line([(195, height_top), (145, height_top), (145, height_bottom), (195, height_bottom)])
line([(135, height_top + 10), (155, height_top - 10)])
line([(135, height_bottom + 10), (155, height_bottom - 10)])
text(125, (height_top + height_bottom) / 2, mm(POST['bounds'][2]), 30,
     anchor='rm', fill=ANNOTATION)
camera, horizontal, origin = VIEWS[-1][1:4]
for point, end, label in [
        (sphere['center'], (2710, 475), 'SPHERICAL FINIAL'),
        ((collar['size'][0] / 2, -collar['size'][1] * .1875, collar['center'][2]),
         (2710, 620), 'SQUARE COLLAR'),
        ((shaft['size'][0] / 2, 0, shaft['size'][2] * .55),
         (2710, 1160), 'SQUARE SHAFT')]:
    start = project(point, camera, horizontal, origin)
    line([start, (end[0] - 20, end[1] + 15)], fill=INK)
    x, y = start
    DRAW.ellipse(((x - 3) * SUPERSAMPLE, (y - 3) * SUPERSAMPLE,
                  (x + 3) * SUPERSAMPLE, (y + 3) * SUPERSAMPLE), fill=INK)
    text(*end, label, 28)

text(WIDTH / 2, 1900, 'DEFAULT HEIGHT: ' + mm(POST['bounds'][2]) + ' mm', 44, True, 'mt')
dimensions = ('SHAFT ' + ' x '.join(mm(v) for v in shaft['size'][:2]) + ' mm - COLLAR '
              + ' x '.join(mm(v) for v in collar['size']) + ' mm - SPHERE DIA. '
              + mm(sphere['radius'] * 2) + ' mm')
text(WIDTH / 2, 1960, dimensions, 32, anchor='mt')
text(WIDTH / 2, 2015, 'All views: 2000 px/m - Orthographic projection - Review colours only - No baked lighting', 25, anchor='mt')

OUTPUT = ROOT / '01-railing-post-v3.png'
PAPER.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS).save(OUTPUT)
saved = np.array(Image.open(OUTPUT).convert('RGB'))
png_checks = []
for view in VIEWS[:4]:
    name, camera, horizontal, origin, rect = view
    left, top, right, bottom = rect
    def dark_runs(y):
        hits = np.flatnonzero(np.max(saved[y, left:right], axis=1) < 100) + left
        groups = np.split(hits, np.flatnonzero(np.diff(hits) > 1) + 1)
        return [(int(group[0]), int(group[-1])) for group in groups if len(group)]
    if name == 'TOP':
        runs = dark_runs(origin[1])
        assert len(runs) == 4, (name, runs)
        # An internal contour is drawn on both adjacent surfaces; measure its
        # centreline rather than adding the outline thickness to the sphere.
        ball_pixels = sum(runs[2]) / 2 - sum(runs[1]) / 2
        collar_pixels = runs[3][1] - runs[0][0] + 1
    else:
        ball_y = round(project(sphere['center'], camera, horizontal, origin)[1])
        collar_y = round(project(collar['center'], camera, horizontal, origin)[1])
        ball_runs, collar_runs = dark_runs(ball_y), dark_runs(collar_y)
        ball_pixels = ball_runs[-1][1] - ball_runs[0][0] + 1
        collar_pixels = collar_runs[-1][1] - collar_runs[0][0] + 1
        vertical_ink = np.flatnonzero(np.max(saved[top:bottom, origin[0]], axis=1) < 100)
        height_pixels = int(vertical_ink[-1] - vertical_ink[0] + 1)
        assert abs(height_pixels - POST['bounds'][2] * SCALE) <= 2
    assert abs(ball_pixels - sphere['radius'] * 2 * SCALE) <= 2
    assert abs(collar_pixels - collar['size'][0] * SCALE) <= 2
    png_checks.append({'view': name, 'sphereDiameterPixels': ball_pixels,
                       'collarWidthPixels': collar_pixels,
                       'sphereToCollarRatio': ball_pixels / collar_pixels,
                       'heightPixels': None if name == 'TOP' else height_pixels})
report = {
    'drawing': OUTPUT.name,
    'sheetPixels': [WIDTH, HEIGHT],
    'pixelsPerMetre': SCALE,
    'sourceSpecification': '../' + SPEC_PATH.name,
    'sourceSHA256': hashlib.sha256(SPEC_PATH.read_bytes()).hexdigest(),
    'drawingSHA256': hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
    'views': records,
    'savedPNGChecks': png_checks,
    'savedPNGPixelTolerance': 2,
    'savedPNGMeasurementMethod': 'Outer silhouette pixel spans; internal TOP sphere uses contour stroke centrelines.',
    'scope': 'Reference diagram only. No mesh, model export, lighting or app validation.',
}
(ROOT / 'post-projection-measurements.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'drawing': str(OUTPUT), 'viewCount': len(records),
                  'maximumBoundaryErrorPixels': max(r['maximumBoundaryErrorPixels'] for r in records)}))
