"""Draw the street-sign specification as five orthographic reference views.

Analytic ray/primitive intersections supply visible drawing surfaces. This script
creates a reference PNG and measurement record, not model files or app code.
"""
from pathlib import Path
import json
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SPEC = json.loads((ROOT.parent / 'street-details-model-spec.json').read_text())
SIGN = next(a for a in SPEC['assets'] if a['name'] == 'street-sign')
PARTS = SIGN['parts']
WIDTH, HEIGHT, SS, SCALE = 3072, 2048, 2, 800
INK = '#101820'
METAL = SPEC['material']['baseColorSRGB']
REVIEW = SIGN['referenceReview']['display']
PAPER = Image.new('RGB', (WIDTH * SS, HEIGHT * SS), 'white')
DRAW = ImageDraw.Draw(PAPER)
FONTS = Path('/System/Library/Fonts/Supplemental')


def text(x, y, value, size=28, bold=False, anchor='lt'):
    font = ImageFont.truetype(str(FONTS / ('Arial Bold.ttf' if bold else 'Arial.ttf')), size * SS)
    DRAW.text((x * SS, y * SS), value, font=font, fill=INK, anchor=anchor)


def rgb(hex_value):
    return [int(hex_value[i:i + 2], 16) for i in (1, 3, 5)]


ANNOTATION = '#315D79'


def line(points, width=1.5):
    DRAW.line([(x * SS, y * SS) for x, y in points], fill=ANNOTATION,
              width=round(width * SS))


def arrow(tip, direction):
    tip, direction = np.array(tip), np.array(direction, dtype=float)
    direction /= np.linalg.norm(direction)
    normal = np.array([-direction[1], direction[0]])
    points = [tip, tip + direction * 9 + normal * 3,
              tip + direction * 9 - normal * 3]
    DRAW.polygon([tuple(p * SS) for p in points], fill=ANNOTATION)


def label(x, y, value, size=23):
    font = ImageFont.truetype(str(FONTS / 'Arial.ttf'), size * SS)
    box = DRAW.textbbox((x * SS, y * SS), value, font=font, anchor='mm')
    DRAW.rectangle((box[0] - 5 * SS, box[1] - 3 * SS,
                    box[2] + 5 * SS, box[3] + 3 * SS), fill='white')
    DRAW.text((x * SS, y * SS), value, font=font, fill=ANNOTATION, anchor='mm')


def dimension(a, b, offset, value):
    """Dimension actual projected endpoints with parallel extension lines."""
    a, b, offset = np.array(a), np.array(b), np.array(offset)
    p, q = a + offset, b + offset
    extension = offset / np.linalg.norm(offset) * 7
    line([a, p + extension])
    line([b, q + extension])
    line([p, q])
    arrow(p, q - p)
    arrow(q, p - q)
    midpoint = (p + q) / 2
    if abs(p[1] - q[1]) < 0.01:
        midpoint[1] -= 20
    label(*midpoint, value)


def leader(point, elbow, position, value):
    line([point, elbow, position])
    arrow(point, np.array(elbow) - point)
    label(*position, value)


def annotate():
    """Use specification coordinates; annotation colour is not asset colour."""
    parts = {p['name']: p for p in PARTS}
    shaft, collar, ball = (parts[n] for n in ('shaft', 'collar', 'finial'))
    upper, lower = parts['board-1'], parts['board-2']
    def front(x, z):
        return (170 + x * SCALE, 1700 - z * SCALE)
    def right(y, z):
        return (850 + y * SCALE, 1700 - z * SCALE)
    def top(x, y):
        return (1810 + x * SCALE, 1050 + y * SCALE)
    half_post = shaft['size'][0] / 2
    tip = upper['center'][0] + upper['size'][0] / 2
    upper_top = upper['center'][2] + upper['size'][2] / 2
    upper_bottom = upper['center'][2] - upper['size'][2] / 2
    lower_top = lower['center'][2] + lower['size'][2] / 2
    mm = lambda m: f'{m * 1000:g}'
    dimension(front(0, 0), front(0, SIGN['boundsMax'][2]), (-90, 0),
              mm(SIGN['boundsMax'][2]))
    dimension(front(half_post, upper_top), front(tip, upper_top), (0, -45),
              mm(tip - half_post) + ' exposed')
    dimension(front(tip, upper_bottom), front(tip, upper_top), (52, 0),
              mm(upper['size'][2]))
    dimension(front(tip, lower_top), front(tip, upper_bottom), (52, 0),
              mm(upper_bottom - lower_top))
    dimension(front(-half_post, 0), front(half_post, 0), (0, 44), mm(half_post * 2))
    dimension(right(0, 0), right(0, upper['center'][2]), (-112, 0),
              mm(upper['center'][2]) + ' centre')
    dimension(right(0, 0), right(0, lower['center'][2]), (130, 0),
              mm(lower['center'][2]) + ' centre')
    leader(right(upper['size'][1] / 2, upper['center'][2]), (928, 532),
           (998, 492), mm(upper['size'][1]) + ' thick')
    leader(front(collar['size'][0] / 2, collar['center'][2]), (296, 359),
           (440, 359), mm(collar['size'][2]) + ' collar height')
    dimension(top(SIGN['boundsMin'][0], 0), top(SIGN['boundsMax'][0], 0),
              (0, -120), mm(SIGN['boundsMax'][0] - SIGN['boundsMin'][0]) + ' overall')
    radius = ball['radius']
    dimension(top(0, -radius), top(0, radius), (-115, 0), 'Dia. ' + mm(radius * 2))
    half_collar = collar['size'][0] / 2
    dimension(top(-half_collar, half_collar), top(half_collar, half_collar),
              (0, 93), mm(half_collar * 2))
    label(1840, 1210, 'Square collar - 52 x 52')
    leader(top(half_collar, half_collar), (1930, 1120), (2070, 1120),
           'Four exposed collar corners')
    label(2000, 1290, 'Blue lines are annotations only', 22)
    eye = np.array((4, -7, 3.2), dtype=float)
    eye /= np.linalg.norm(eye)
    screen_right = np.array((7, 4, 0), dtype=float)
    screen_right /= np.linalg.norm(screen_right)
    screen_up = np.cross(eye, screen_right)
    corner = np.array((half_post, -half_post, 0.65))
    projected_corner = (2530 + SCALE * np.dot(corner, screen_right),
                        1700 - SCALE * np.dot(corner, screen_up))
    leader(projected_corner, (2620, 1260), (2810, 1260),
           'Square post - 45 x 45')
    label(2810, 1310, 'Two flat faces meet at this edge', 22)


def load_reference_lettering():
    """Derive glyph coverage from the original drawing, not invented strokes."""
    spec = SPEC['lettering']
    source = ROOT.parent / spec['sourceDrawing']
    source_pixels = np.asarray(Image.open(source).convert('RGB'), dtype=float)
    recipe = spec['alphaExtraction']
    masks = []
    for left, top, right, bottom in spec['sourceCropsPixels']:
        luminance = source_pixels[top:bottom, left:right].mean(axis=2)
        alpha = np.clip((luminance - recipe['backgroundCutoff']) /
                        (recipe['fullOpacityAt'] - recipe['backgroundCutoff']), 0, 1)
        ys, xs = np.nonzero(alpha >= recipe['tightBoundsThreshold'])
        x0, x1 = max(0, xs.min() - 2), min(alpha.shape[1], xs.max() + 3)
        y0, y1 = max(0, ys.min() - 2), min(alpha.shape[0], ys.max() + 3)
        masks.append((alpha[y0:y1, x0:x1],
                      ((xs.min() + xs.max()) / 2 - x0,
                       (ys.min() + ys.max()) / 2 - y0)))
    return masks


LETTERING = load_reference_lettering()


def lettering_mask(x, z, board_index):
    """Project original glyph alpha onto the same physical board in every view."""
    spec = SPEC['lettering']
    alpha, centre = LETTERING[board_index]
    metres_per_pixel = spec['targetVisibleBoardWidth'] / spec['sourceVisibleBoardWidthPixels']
    u = (x - spec['boardCentreX']) / metres_per_pixel + centre[0]
    v = (spec['boardCentreZ'][board_index] - z) / metres_per_pixel + centre[1]
    valid = (u >= 0) & (v >= 0) & (u < alpha.shape[1] - 1) & (v < alpha.shape[0] - 1)
    ix = np.clip(np.floor(u).astype(int), 0, alpha.shape[1] - 2)
    iy = np.clip(np.floor(v).astype(int), 0, alpha.shape[0] - 2)
    fx, fy = np.clip(u - ix, 0, 1), np.clip(v - iy, 0, 1)
    sample = (alpha[iy, ix] * (1-fx) * (1-fy) + alpha[iy, ix+1] * fx * (1-fy)
              + alpha[iy+1, ix] * (1-fx) * fy + alpha[iy+1, ix+1] * fx * fy)
    coverage = spec['edgeCoverage']
    sample = np.clip((sample - coverage['lower']) / (coverage['upper'] - coverage['lower']), 0, 1)
    return np.where(valid, sample, 0)


def panel(name, camera, right, origin, rect):
    """Cast parallel rays; nearest surface of the union owns each sample."""
    eye = np.array(camera, dtype=float)
    eye /= np.linalg.norm(eye)
    right = np.array(right, dtype=float)
    right /= np.linalg.norm(right)
    up = np.cross(eye, right)
    direction = -eye
    x0, y0, x1, y1 = rect
    ys, xs = np.mgrid[y0 * SS:y1 * SS, x0 * SS:x1 * SS]
    horizontal = ((xs + 0.5) / SS - origin[0]) / SCALE
    vertical = (origin[1] - (ys + 0.5) / SS) / SCALE
    rays = horizontal[..., None] * right + vertical[..., None] * up + eye * 10
    depth = np.full(horizontal.shape, np.inf)
    owner = np.full(horizontal.shape, -1, dtype=np.int16)
    faces = np.full(horizontal.shape, -1, dtype=np.int16)
    for index, part in enumerate(PARTS):
        centre = np.array(part['center'])
        if part['shape'] == 'sphere':
            offset = rays - centre
            b = np.sum(offset * direction, axis=2)
            c = np.sum(offset * offset, axis=2) - part['radius'] ** 2
            disc = b * b - c
            hit = -b - np.sqrt(np.maximum(disc, 0))
            hit[disc < 0] = np.inf
            hit_face = np.full(horizontal.shape, 6, dtype=np.int16)
        else:
            half = np.array(part['size']) / 2
            lower, upper = centre - half, centre + half
            near = np.full(horizontal.shape, -np.inf)
            far = np.full(horizontal.shape, np.inf)
            hit_face = np.full(horizontal.shape, -1, dtype=np.int16)
            for axis in range(3):
                d = direction[axis]
                if abs(d) < 1e-12:
                    far[(rays[..., axis] < lower[axis]) | (rays[..., axis] > upper[axis])] = -np.inf
                    continue
                a = (lower[axis] - rays[..., axis]) / d
                b = (upper[axis] - rays[..., axis]) / d
                entry, leave = np.minimum(a, b), np.maximum(a, b)
                nearer = entry > near
                hit_face[nearer] = axis * 2 + (1 if d < 0 else 0)
                near = np.maximum(near, entry)
                far = np.minimum(far, leave)
            hit = np.where((far >= near) & (near >= 0), near, np.inf)
        visible = hit < depth
        depth[visible], owner[visible], faces[visible] = hit[visible], index, hit_face[visible]
    occupied = owner >= 0
    pixels = np.full((*owner.shape, 3), 255, dtype=np.uint8)
    # Fixed axis colours distinguish flat faces without baking illumination.
    for axis, key in enumerate(('X', 'Y', 'Z')):
        pixels[occupied & ((faces // 2) == axis)] = rgb(REVIEW['boxFaceColoursSRGB'][key])
    pixels[occupied & (faces == 6)] = rgb(REVIEW['finialColourSRGB'])
    # Surface boundaries are diagram contours, not lights, shadows or textures.
    surface = owner * 8 + faces
    edge = np.zeros(owner.shape, dtype=bool)
    edge[1:, :] |= surface[1:, :] != surface[:-1, :]
    edge[:, 1:] |= surface[:, 1:] != surface[:, :-1]
    edge[:-1, :] |= surface[:-1, :] != surface[1:, :]
    edge[:, :-1] |= surface[:, :-1] != surface[:, 1:]
    pixels[edge & occupied] = rgb(REVIEW['outlineColourSRGB'])
    for index, part in enumerate(PARTS):
        if not part['name'].startswith('board-'):
            continue
        front = (owner == index) & (faces == 2)
        if not np.any(front):
            continue
        hit_points = rays[front] + depth[front, None] * direction
        mask = lettering_mask(hit_points[:, 0], hit_points[:, 2], int(part['name'][-1]) - 1)
        painted = pixels[front]
        painted = np.rint(painted * (1 - mask[:, None]) +
                           np.array(rgb(REVIEW['letteringColourSRGB'])) * mask[:, None]).astype(np.uint8)
        pixels[front] = painted
    PAPER.paste(Image.fromarray(pixels), (x0 * SS, y0 * SS))
    return {'view': name, 'cameraDirectionFromOrigin': eye.tolist(), 'screenRight': right.tolist(),
            'screenUp': up.tolist(), 'pixelsPerMetre': SCALE,
            'occupiedPixelBoundsAtSupersampling': [int(xs[occupied].min()), int(ys[occupied].min()),
                                                   int(xs[occupied].max()), int(ys[occupied].max())]}


text(64, 50, 'STREET SIGN - ONE COMPLETE UNIT', 52, True)
text(64, 128, 'Dimensions in mm - five orthographic projections of one numeric specification', 28)
text(64, 192, 'Height 1650     Post 45 x 45     Finial diameter 60     Collar 52 x 52', 26)
text(64, 237, 'Boards: 480 exposed x 180 x 18     Board centres: 1390 / 1160     Clear gap: 50', 26)
text(64, 286, f'REVIEW COLOURS ONLY - Default metal: {METAL} - Default lettering: #EEE9DD - Square post, not cylindrical', 26, True)
views = [
    ('FRONT', (0, -1, 0), (1, 0, 0), (170, 1700), (100, 350, 610, 1710), 355),
    ('RIGHT', (1, 0, 0), (0, 1, 0), (850, 1700), (800, 350, 900, 1710), 850),
    ('BACK', (0, 1, 0), (-1, 0, 0), (1530, 1700), (1110, 350, 1580, 1710), 1340),
    ('TOP', (0, 0, 1), (1, 0, 0), (1810, 1050), (1770, 990, 2230, 1110), 2000),
    ('THREE-QUARTER', (4, -7, 3.2), (7, 4, 0), (2530, 1700), (2460, 350, 2990, 1740), 2710),
]
records = []
for name, eye, right, origin, rect, label_x in views:
    records.append(panel(name, eye, right, origin, rect))
    text(label_x, 1780, name, 31, True, 'mt')
annotate()
text(64, 1900, 'All views: 800 px/m at this sheet size. TOP is not enlarged. Colour and material remain replaceable.', 25)
text(64, 1950, 'Numeric drawing only - no shadows or lighting baked in. Model construction and app validation remain separate.', 24)
PAPER.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS).save(ROOT / '01-street-sign-v6.png')
parts = {p['name']: p for p in PARTS}
post = parts['shaft']['size'][0]
board = parts['board-1']
exposed = board['center'][0] + board['size'][0] / 2 - post / 2
sphere = parts['finial']['radius'] * 2
measurements = {
    'sheetPixels': [WIDTH, HEIGHT], 'supersampling': SS,
    'source': '../street-details-model-spec.json', 'geometry': SIGN['parts'],
    'ratios': {'exposedBoardToPost': exposed / post, 'boardThicknessToPost': board['size'][1] / post,
               'finialToPost': sphere / post, 'topTotalWidthToFinial': (SIGN['boundsMax'][0] - SIGN['boundsMin'][0]) / sphere},
    'expectedProjectedLengthsPixels': {'postWidth': post * SCALE, 'exposedBoardLength': exposed * SCALE,
                                       'boardThickness': board['size'][1] * SCALE, 'finialDiameter': sphere * SCALE,
                                       'topTotalWidth': (SIGN['boundsMax'][0] - SIGN['boundsMin'][0]) * SCALE},
    'views': records,
    'boundary': 'Measurements describe numeric drawing projections, not an exported or app-validated model.'
}
(ROOT / 'street-sign-projection-measurements.json').write_text(json.dumps(measurements, indent=2) + '\n')
print(json.dumps({'output': '01-street-sign-v6.png', 'size': [WIDTH, HEIGHT], 'ratios': measurements['ratios']}))
