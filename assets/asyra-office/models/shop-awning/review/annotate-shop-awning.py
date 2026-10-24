"""Add profile-derived elevation edges and annotations to the original sheet."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / '01-striped-shop-awning-v2.png'
OUTPUT = ROOT / '01-striped-shop-awning-annotated-v1.png'
LAYER = ROOT / '01-striped-shop-awning-annotation-layer.png'
SPEC = ROOT.parent / 'shop-awning-model-spec.json'
FONTS = Path('/System/Library/Fonts/Supplemental')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    source = Image.open(SOURCE).convert('RGBA')
    if source.size != (1536, 1024):
        raise ValueError('Expected unchanged 1536 x 1024 source.')
    spec = json.loads(SPEC.read_text())
    params = spec['parameters']
    layer = Image.new('RGBA', source.size)
    draw = ImageDraw.Draw(layer)
    # Replace only the obsolete single-unit heading and its size subtitle.
    draw.rectangle((0, 0, 1535, 113), fill='white')
    boxes = []
    # FRONT/BACK are structural axis views; dimensions belong to LEFT.
    removed_front_height_bounds = (0, 250, 78, 416)
    draw.rectangle(removed_front_height_bounds, fill='white')

    def label(y, value, size=24, bold=False, colour='#245C7D'):
        font = ImageFont.truetype(str(FONTS / ('Arial Bold.ttf' if bold else 'Arial.ttf')), size)
        bounds = draw.textbbox((768, y), value, font=font, anchor='mt')
        if min(bounds[:2]) < 0 or bounds[2] > 1536 or bounds[3] > 1024:
            raise ValueError(f'Annotation outside sheet: {value}')
        draw.text((768, y), value, font=font, anchor='mt', fill=colour)
        boxes.append({'text': value, 'bounds': list(bounds)})

    label(24, 'SHOP AWNING - 8-MODULE ASSEMBLY EXAMPLE', 39, True, '#15262F')
    label(78, 'DEFAULT ASSEMBLY: 2.00 x 0.80 x 0.42 m', 28, True, '#15262F')
    label(128, 'ONE MODULE = ONE STRIP  |  DEFAULT WIDTH: 250 mm', 25, True)
    length = params['canopyLength']['default'] * 1000
    angle = params['canopyAngleDegrees']['default']
    valance = params['valanceLength']['default'] * 1000
    label(166, f'DEFAULTS: L = {length:.3f} mm  |  ANGLE = {angle:.3f} deg  |  V = {valance:.0f} mm', 24, True)
    label(486, 'FRONT: outer fold. BACK: rear thickness + inner fold. LEFT: unchanged side profile.', 23)
    label(523, 'L follows slope; angle from horizontal; V always vertical. All three are adjustable.', 23, True)
    label(953, '5.3 MODULES = 5 x 250 mm + 75 mm = 1325 mm TOTAL WIDTH', 25, True)
    label(990, 'COLOUR MODE: SOLID or TWO-COLOUR ALTERNATING  |  Dimensions shown are defaults.', 22)

    # Correct the camera label without touching the original side geometry.
    side_label_bounds = (730, 431, 859, 467)
    draw.rectangle(side_label_bounds, fill='white')
    side_font = ImageFont.truetype(str(FONTS / 'Arial Bold.ttf'), 30)
    draw.text((794, 438), 'LEFT', font=side_font, anchor='mt', fill='#090B09')
    boxes.append({'text': 'LEFT', 'bounds': list(draw.textbbox((794, 438), 'LEFT', font=side_font, anchor='mt'))})

    # The added edges are projections of the numeric profile, not new parts.
    theta = math.radians(params['canopyAngleDegrees']['default'])
    height = params['valanceLength']['default'] + params['canopyLength']['default'] * math.sin(theta)
    vertical_thickness = params['profileThickness']['canopyVertical']
    depth = params['profileThickness']['valanceDepth']
    elevations = [
        ('front', (82, 263, 526, 403), [('outer fold', params['valanceLength']['default'])]),
        ('back', (1044, 263, 1499, 404), [
            ('rear lower edge', height - vertical_thickness),
            ('inner fold', params['valanceLength']['default'] - vertical_thickness + depth * math.tan(theta)),
        ]),
    ]
    edges = []
    for view, bounds, boundaries in elevations:
        left, top, right, bottom = bounds
        for name, z in boundaries:
            pixel_y = bottom - z / height * (bottom - top)
            draw.line([(left + 1, round(pixel_y)), (right - 1, round(pixel_y))], fill='#29291F', width=2)
            edges.append({'view': view, 'edge': name, 'heightMetres': z,
                          'pixelY': pixel_y, 'strokePixelY': round(pixel_y), 'strokeWidth': 2,
                          'sourceViewBounds': list(bounds)})

    # BOTTOM looks along +Z with +Y up: the front edge is at the sheet bottom.
    # AB is the valance bottom face; BC projects to its boundary at Y=-P+d.
    projection = params['canopyLength']['default'] * math.cos(theta)
    bottom_bounds = (603, 623, 1004, 798)
    left, top, right, bottom = bottom_bounds
    pixel_y = bottom - depth / projection * (bottom - top)
    draw.line([(left + 1, round(pixel_y)), (right - 1, round(pixel_y))], fill='#29291F', width=1)
    edges.append({'view': 'bottom', 'edge': 'valance bottom face / canopy underside',
                  'localYMetres': -projection + depth, 'valanceDepthMetres': depth,
                  'pixelY': pixel_y, 'strokePixelY': round(pixel_y), 'strokeWidth': 1,
                  'sourceViewBounds': list(bottom_bounds)})

    layer.save(LAYER)
    Image.alpha_composite(source, layer).convert('RGB').save(OUTPUT)
    saved = Image.open(OUTPUT).convert('RGB')
    difference = ImageChops.difference(source.convert('RGB'), saved)
    protected = [(580, 195, 1015, 424), (0, 555, 580, 940), (1020, 555, 1536, 940)]
    for bounds in protected:
        if difference.crop(bounds).getbbox() is not None:
            raise ValueError(f'Original object view or dimension changed: {bounds}')
    outside = layer.getchannel('A').point(lambda a: 255 if a == 0 else 0)
    if ImageChops.multiply(difference, Image.merge('RGB', (outside, outside, outside))).getbbox():
        raise ValueError('Pixels outside annotation layer changed.')
    record = {
        'source': SOURCE.name, 'sourceSHA256': digest(SOURCE),
        'output': OUTPUT.name, 'outputSHA256': digest(OUTPUT),
        'specificationSHA256': digest(SPEC),
        'annotationLayer': LAYER.name, 'annotationLayerSHA256': digest(LAYER),
        'sheetPixels': list(source.size), 'sourceOffset': [0, 0], 'sourceScale': 1,
        'resampling': 'none', 'redrawnObjectViews': 0,
        'correctedViews': ['front', 'back', 'bottom'], 'addedSurfaceEdges': edges,
        'removedDimensions': [{'view': 'front', 'label': '0.42 m',
                               'bounds': list(removed_front_height_bounds),
                               'includesDimensionLineAndArrows': True}],
        'sideLabelCorrection': {'from': 'RIGHT', 'to': 'LEFT', 'profilePixelsUnchanged': True},
        'protectedOriginalViewBands': protected, 'originalViewBandsUnchanged': True,
        'unchangedOutsideAnnotations': True, 'textBoxes': boxes,
        'scope': 'Original side/TOP/THREE-QUARTER geometry preserved; profile-derived FRONT/BACK/BOTTOM surface lines added; side label and parameter notes corrected. No generated model validation.'
    }
    (ROOT / 'awning-annotation-record.json').write_text(json.dumps(record, indent=2)+'\n')
    print(f'{OUTPUT.name}: 4 profile-derived edges added; side, TOP and THREE-QUARTER preserved; LEFT label corrected.')


if __name__ == '__main__':
    main()
