"""Annotate calibrated app/reference captures at identical pixel scale.

Run measure-seating-placement.ts and the measured-reference Playwright case first.
This diagnostic does not warp either image or manufacture rendered furniture.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[3]
report = json.loads((root / 'tmp/setup/seating-placement-measurements.json').read_text())
reference = Image.open(root / report['source']).convert('RGB').crop((220, 44, 1065, 800))
actual = Image.open(root / sys.argv[1]).convert('RGB')
assert reference.size == actual.size == (845, 756)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 20)
small = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 16)
sheet = Image.new('RGB', (1690, 930), 'white')
draw = ImageDraw.Draw(sheet)
colors = ['#d83b16', '#9b209b', '#007693', '#0b793f', '#b26c00', '#234cce', '#cd2164']
for col, (title, picture, key) in enumerate([
    ('Original reference - visible envelopes', reference, 'historicalSourceBounds'),
    ('Current app - projected mesh bounds', actual, 'projectedBounds')
]):
    sheet.paste(picture, (col * 845, 40))
    draw.text((col * 845 + 16, 9), title, font=font, fill='#18232e')
    for index, item in enumerate(report['measurements']):
        x0, y0, x1, y1 = item[key]
        x0, x1 = x0 - 220 + col * 845, x1 - 220 + col * 845
        y0, y1 = y0 - 44 + 40, y1 - 44 + 40
        color = colors[index]
        draw.rectangle((x0, y0, x1, y1), outline=color, width=2)
        draw.rectangle((x0, y0 - 24, x0 + 23, y0), fill='white')
        draw.text((x0 + 3, y0 - 24), chr(65 + index), font=font, fill=color)
for index, item in enumerate(report['measurements']):
    col, row = index % 4, index // 4
    draw.text((12 + col * 420, 811 + row * 28), chr(65 + index) + ' - ' + item['id'], font=small, fill=colors[index])
draw.text((12, 875), 'Identical canvas dimensions; no image warping. Bounds include occlusion uncertainty and the accepted structural correction.', font=small, fill='#18232e')
draw.text((12, 901), 'Work-chair silhouette is largely hidden by the person and desk; these boxes are not complete 3D dimensions.', font=small, fill='#18232e')
out = root / 'apps/asyra-office/test-results/seating-placement-comparison.png'
sheet.save(out)
print(out)
