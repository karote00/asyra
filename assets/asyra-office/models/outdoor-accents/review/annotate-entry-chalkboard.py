"""Add approved dimension and part callouts without redrawing source geometry."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw, ImageFont, ImageChops

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / '02-entry-chalkboard-v1.png'
OUTPUT = ROOT / '02-entry-chalkboard-annotated-v1.png'
LAYER = ROOT / '02-entry-chalkboard-annotation-layer.png'
SPEC = ROOT.parent / 'outdoor-accents-model-spec.json'
FONT_DIR = Path('/System/Library/Fonts/Supplemental')
INK = '#245C7D'
MUTED = '#445F70'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    original = Image.open(SOURCE).convert('RGBA')
    if original.size != (1536, 1024):
        raise ValueError('The callout coordinates require the unchanged 1536 x 1024 source.')
    spec = json.loads(SPEC.read_text())
    sign = next(m for m in spec['modules'] if m['moduleId'] == 'entry-chalkboard')
    overlay = Image.new('RGBA', original.size)
    draw = ImageDraw.Draw(overlay)
    text_boxes = []

    def text(x, y, value, size=20, bold=False, anchor='lt', colour=INK):
        font = ImageFont.truetype(str(FONT_DIR / ('Arial Bold.ttf' if bold else 'Arial.ttf')), size)
        bounds = draw.textbbox((x, y), value, font=font, anchor=anchor)
        if bounds[0] < 0 or bounds[1] < 0 or bounds[2] > original.width or bounds[3] > original.height:
            raise ValueError(f'Text outside sheet: {value}')
        draw.text((x, y), value, font=font, fill=colour, anchor=anchor)
        text_boxes.append({'text': value, 'bounds': list(bounds)})

    dimensions = ' x '.join(f'{v*1000:.3f}'.rstrip('0').rstrip('.') for v in sign['nominalSize'])
    text(40, 113, f'DEFAULT OVERALL (W x D x H): {dimensions} mm', 25, True)
    text(40, 152, 'Original views preserved. Blue notes identify parts and clarify dimensions; they are not model geometry.', 19, colour=MUTED)

    callouts = [
        {'number': 1, 'partId': 'hinge-covers', 'centre': [430, 212], 'leader': [[440, 223], [461, 241], [485, 276]], 'target': [485, 276]},
        {'number': 2, 'partId': 'hinge-heads', 'centre': [560, 212], 'leader': [[550, 223], [531, 246], [497, 266]], 'target': [497, 266]},
        {'number': 3, 'partId': 'side-spreaders', 'centre': [356, 429], 'leader': [[367, 440], [398, 472], [496, 513]], 'target': [496, 513]},
        {'number': 4, 'partId': 'spreader-fastener-heads', 'centre': [623, 463], 'leader': [[613, 476], [587, 493], [563, 513]], 'target': [563, 513]},
    ]
    for callout in callouts:
        x, y = callout['centre']
        draw.line([tuple(p) for p in callout['leader']], fill=INK, width=2)
        tx, ty = callout['target']
        draw.ellipse((tx-3, ty-3, tx+3, ty+3), fill='white', outline=INK, width=2)
        draw.ellipse((x-15, y-15, x+15, y+15), fill='white', outline=INK, width=2)
        text(x, y, str(callout['number']), 19, True, 'mm')

    text(180, 798, 'WOODEN FRAME ONLY', 15, True, 'mt')
    text(496, 798, 'APPROX. - EXACT DEPTH ABOVE', 14, True, 'mt')
    draw.line([(40, 898), (1496, 898)], fill='#B6C7D1', width=1)
    legends = [
        (40, '1  HINGE COVER', 'hinge-covers', '2 outer tapered metal plates'),
        (418, '2  AXLE HEAD', 'hinge-heads', '2 visible circular heads'),
        (796, '3  SIDE SPREADER', 'side-spreaders', '2 rounded wooden support bars'),
        (1174, '4  FASTENER HEAD', 'spreader-fastener-heads', '4 total - 2 on each side'),
    ]
    for x, title, part, note in legends:
        text(x, 918, title, 20, True)
        text(x, 948, part, 16, colour=MUTED)
        text(x, 974, note, 16, colour=MUTED)
    overlay.save(LAYER)
    output = Image.alpha_composite(original, overlay).convert('RGB')
    output.save(OUTPUT)
    # Document preservation using the written file, excluding annotation pixels.
    saved = Image.open(OUTPUT).convert('RGB')
    difference = ImageChops.difference(original.convert('RGB'), saved)
    outside = overlay.getchannel('A').point(lambda a: 255 if a == 0 else 0)
    unchanged = ImageChops.multiply(difference, Image.merge('RGB', (outside, outside, outside))).getbbox() is None
    if not unchanged:
        raise ValueError('Pixels outside annotations changed.')
    report = {
        'source': SOURCE.name, 'sourceSHA256': digest(SOURCE),
        'output': OUTPUT.name, 'outputSHA256': digest(OUTPUT),
        'annotationLayer': LAYER.name, 'annotationLayerSHA256': digest(LAYER),
        'sheetPixels': list(original.size), 'sourceOffset': [0, 0], 'sourceScale': 1,
        'unchangedOutsideAnnotations': unchanged, 'resampling': 'none',
        'redrawnObjectViews': 0, 'defaultOverallMillimetres': [v*1000 for v in sign['nominalSize']],
        'callouts': callouts, 'textBoxes': text_boxes,
        'scope': 'Dimension clarification and part identification only; no geometry reconstruction or model acceptance.'
    }
    (ROOT / 'chalkboard-annotation-record.json').write_text(json.dumps(report, indent=2)+'\n')
    print(f'{OUTPUT.name}: original pixels preserved outside annotations; {len(callouts)} part callouts.')


if __name__ == '__main__':
    main()
