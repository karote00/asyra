"""Reproducible annotation layer; preserve the source raster without resampling."""
from pathlib import Path
import hashlib
import html
import json
import math
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / '07-street-lantern-v2.png'
OUTPUT = ROOT / '07-street-lantern-dimensioned-v2.png'
LAYER = ROOT / '07-street-lantern-annotation-layer-v2.svg'
SPEC = json.loads((ROOT.parent / 'street-model-spec.json').read_text())
LANTERN = next(m for m in SPEC['modules'] if m['moduleId'] == 'streetlight-vintage-lantern')
WIDTH, HEIGHT = 2560, 2120
SOURCE_X, SOURCE_Y = 64, 168
INK = '#18364D'
MUTED = '#506778'
RULE = '#A5B8C5'
METAL = '#D4DDE2'
AMBER = '#EAC579'
FONT_DIR = Path('/System/Library/Fonts/Supplemental')
OVERLAY = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
DRAW = ImageDraw.Draw(OVERLAY)
SVG = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
       '<title>Street lantern - independent annotation layer</title>',
       '<desc>Place the unchanged 1536 x 1024 original at (64,168). This layer does not cover that rectangle. All lengths are millimetres unless stated.</desc>',
       '<defs><pattern id="cut-hatch" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#D4DDE2"/><path d="M-7,14 L7,0 M7,14 L21,0" stroke="#91A4B1" stroke-width="1"/></pattern></defs>']


def text(x, y, value, size=28, bold=False, colour=INK, align='left'):
    font = ImageFont.truetype(str(FONT_DIR / ('Arial Bold.ttf' if bold else 'Arial.ttf')), size)
    anchor = {'left': 'lt', 'center': 'mt', 'right': 'rt'}[align]
    DRAW.text((x, y), value, font=font, fill=colour, anchor=anchor)
    svg_anchor = {'left': 'start', 'center': 'middle', 'right': 'end'}[align]
    SVG.append(f'<text x="{x}" y="{y}" font-family="Arial,sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{colour}" text-anchor="{svg_anchor}" dominant-baseline="hanging">{html.escape(value)}</text>')


def line(points, colour=INK, width=2, dashed=False):
    if dashed:
        for start, end in zip(points, points[1:]):
            dx, dy = end[0]-start[0], end[1]-start[1]
            length = math.hypot(dx, dy)
            for offset in range(0, math.ceil(length), 18):
                finish = min(offset+10, length)
                DRAW.line([(start[0]+dx*offset/length, start[1]+dy*offset/length),
                           (start[0]+dx*finish/length, start[1]+dy*finish/length)], fill=colour, width=width)
    else:
        DRAW.line(points, fill=colour, width=width, joint='curve')
    attrs = ' stroke-dasharray="10 8"' if dashed else ''
    SVG.append(f'<polyline points="{" ".join(f"{x:.3f},{y:.3f}" for x,y in points)}" fill="none" stroke="{colour}" stroke-width="{width}"{attrs}/>')


def polygon(points, fill, stroke=INK, width=2):
    DRAW.polygon(points, fill=fill)
    if stroke:
        DRAW.line(points+[points[0]], fill=stroke, width=width, joint='curve')
    SVG.append(f'<polygon points="{" ".join(f"{x:.3f},{y:.3f}" for x,y in points)}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="{width}"/>')


def arrow(tip, toward, size=9):
    dx, dy = tip[0]-toward[0], tip[1]-toward[1]
    length = math.hypot(dx, dy)
    ux, uy = dx/length, dy/length
    polygon([tip, (tip[0]-size*ux+size*.42*uy, tip[1]-size*uy-size*.42*ux),
             (tip[0]-size*ux-size*.42*uy, tip[1]-size*uy+size*.42*ux)], INK, None)


def leader(points):
    line(points)
    arrow(points[-1], points[-2])


def dimension(start, end, label, label_pos):
    line([start, end])
    arrow(start, end, 8)
    arrow(end, start, 8)
    if label:
        text(*label_pos, label, 25, align='center')


def cut_shape(outer, holes=()):
    mask = Image.new('L', (WIDTH, HEIGHT), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(outer, fill=255)
    for hole in holes:
        draw.polygon(hole, fill=0)
    colour = Image.new('RGBA', (WIDTH, HEIGHT), METAL)
    hatch = ImageDraw.Draw(colour)
    for x in range(-HEIGHT, WIDTH, 14):
        hatch.line([(x, HEIGHT), (x+HEIGHT, 0)], fill='#91A4B1', width=1)
    OVERLAY.paste(colour, (0, 0), mask)
    def path(points):
        return 'M'+' L'.join(f'{x:.3f},{y:.3f}' for x,y in points)+' Z'
    SVG.append(f'<path d="{path(outer)} {" ".join(path(h) for h in holes)}" fill="url(#cut-hatch)" fill-rule="evenodd" stroke="{INK}" stroke-width="2"/>')
    for pts in [outer, *holes]:
        DRAW.line(pts+[pts[0]], fill=INK, width=2)


def box(x0, y0, x1, y1):
    line([(x0,y0),(x1,y0),(x1,y1),(x0,y1),(x0,y0)], RULE)


def arc(cx, cy, radius, theta0, theta1):
    # Mathematical angles: +X is zero; positive rotates upward on this sheet.
    points = [(cx+radius*math.cos(theta0+(theta1-theta0)*i/80),
               cy-radius*math.sin(theta0+(theta1-theta0)*i/80)) for i in range(81)]
    line(points, width=3)
    arrow(points[0], points[2], 7)
    arrow(points[-1], points[-3], 7)
    return points[len(points)//2]


frame = LANTERN['frame']
roof = LANTERN['roof']
glass = LANTERN['glass']
k = (frame['topOuterSideMetres']-frame['bottomOuterSideMetres'])/(2*(frame['zRangeMetres'][1]-frame['zRangeMetres'][0]))
frame_angle = math.atan(k)
a0, a1 = roof['eaveSideMetres']/2, roof['peakSideMetres']/2
ze, zt, zp = roof['eaveBottomZMetres'], roof['eaveTopZMetres'], roof['peakZMetres']
q = (a0-a1)/(zp-zt)
roof_angle = math.atan(1/q)
wall = roof['shellThicknessMetres']
A = lambda z: a0-q*(z-zt)
inner = lambda z: min(a0-wall, A(z)-wall*math.sqrt(1+q*q))

text(64, 44, 'STREET LANTERN - DIMENSIONED REFERENCE', 48, True)
text(64, 108, 'Original artwork preserved at native resolution. Units: mm. Diagrams follow the numeric specification.', 28, colour=MUTED)
line([(64,145),(2496,145)], RULE)
box(1640,168,2496,1192)
text(1672,200,'DIMENSIONS - FRONT PROPORTIONS',31,True)
notes = [('Overall height (base to tip)', f"{LANTERN['overallSizeMetres'][2]*1000:.0f}"),
         ('Roof eave width / depth', f"{roof['eaveSideMetres']*1000:.0f} / {roof['eaveSideMetres']*1000:.0f}"),
         ('Base maximum diameter', f"{2*max(p[1] for p in LANTERN['foot']['latheZRadiusMetres'])*1000:.0f}"),
         ('Shaft diameter - lower / upper', '160 / 150'),
         ('Frame outer side - bottom / top', '300 / 440'),
         ('Roof overhang - each side', '45')]
for i,(label,value) in enumerate(notes):
    y=268+i*49
    text(1672,y,label,27)
    text(2460,y,value,29,True,align='right')
line([(1672,581),(2460,581)],RULE)
text(1672,607,'FRAME FACE ANGLE',29,True)
# A side-face generator: 70 mm outwards over 460 mm height.
ox,oy=1730,1080
ray_length=420
sector=[(ox,oy)]+[(ox+220*math.cos(math.pi/2-frame_angle+frame_angle*i/80), oy-220*math.sin(math.pi/2-frame_angle+frame_angle*i/80)) for i in range(81)]
polygon(sector,'#E5F0F6',None)
text(1672,650,'Vertical',21,colour=MUTED)
text(1810,650,'Frame face',21,colour=MUTED)
line([(ox,oy),(ox,oy-ray_length)],MUTED,2,True)
line([(ox,oy),(ox+ray_length*k,oy-ray_length)],INK,3)
mid=arc(ox,oy,220,math.pi/2-frame_angle,math.pi/2)
text(1900,728,f'{math.degrees(frame_angle):.3f}° from vertical',31,True)
leader([(1900,772),(1840,772),mid])
text(1900,836,'70 mm outward / 460 mm upward',25)
text(1900,884,'True angle; vertical dashed baseline.',24,colour=MUTED)
text(1900,925,'The pane follows the same slope.',24,colour=MUTED)
text(1672,1132,'Section details below: A - pane seat; B - roof.',25,colour=MUTED)

# A: exact horizontal section of one frame corner at mid-pane height.
box(64,1250,1264,1980)
text(96,1278,'A - PANE / FRAME SEAT',32,True)
text(96,1323,'Plan section at Z = 2200. Sharp seats; metal hatched.',25,colour=MUTED)
scale=12  # pixels per millimetre
px,py=636,1440
P=lambda x,y:(px+x*scale,py+y*scale)
post_w=frame['postFaceWidthMetres']*1000
post_d=frame['wallDepthAlongXYMetres']*1000
embed=glass['edgeEmbedMetres']*1000
setback=glass['frontPlaneSetbackAlongXYMetres']*1000
plan_thickness=glass['wallThicknessMetres']*1000*math.sqrt(1+k*k)
outer=[P(0,0),P(post_w,0),P(post_w,post_w),P(post_w-post_d,post_w),P(post_w-post_d,post_d),P(0,post_d)]
seat=[P(0,setback),P(embed,setback),P(embed,setback+plan_thickness),P(0,setback+plan_thickness)]
cut_shape(outer,[seat])
polygon([P(-18,setback),P(embed,setback),P(embed,setback+plan_thickness),P(-18,setback+plan_thickness)],AMBER)
line([P(0,setback-0.5),(px,1385)],RULE)
line([P(embed,setback-0.5),(px+embed*scale,1385)],RULE)
dimension((px,1395),(px+embed*scale,1395),'4 mm embed',(px+embed*scale/2,1361))
line([P(0,0),P(-6,0)],RULE)
line([P(-18,setback),P(-6,setback)],RULE)
dimension(P(-4,0),P(-4,setback),'',(0,0))
text(358,1455,'8 mm setback',24)
text(358,1484,'in the XY plane',23,colour=MUTED)
text(105,1640,'3 mm normal thickness',27,True)
text(105,1678,'Measured normal to the sloped pane.',24)
leader([(445,1638),(480,1610),P(-9,setback+plan_thickness/2)])
text(704,1850,'Frame / fitted pane seat',25,align='center')
text(96,1898,f'Plan-cut thickness = {plan_thickness:.4f} mm; true normal thickness = 3 mm.',24,colour=MUTED)
text(96,1934,'The 4 mm dimension is insertion into metal, not an air gap.',24,colour=MUTED)

# B: exact centre plane through opposing face midlines, before exterior rounding.
box(1296,1250,2496,1980)
text(1328,1278,'B - ROOF CENTRE SECTION',32,True)
text(1328,1323,'Computed from wall planes; shown before 3 mm edge rounding.',25,colour=MUTED)
cx,ground,rs=1896,1880,1850
R=lambda x,z:(cx+x*rs,ground-(z-ze)*rs)
zi0=ze+roof['bottomLidThicknessMetres']
zi1=zp-roof['topCapThicknessMetres']
zjoin=zt-(wall*math.sqrt(1+q*q)-wall)/q
outer=[R(-a0,ze),R(-a0,zt),R(-a1,zp),R(a1,zp),R(a0,zt),R(a0,ze)]
cavity=[R(-inner(zi0),zi0),R(-inner(zjoin),zjoin),R(-inner(zi1),zi1),R(inner(zi1),zi1),R(inner(zjoin),zjoin),R(inner(zi0),zi0)]
cut_shape(outer,[cavity])
text(1760,1412,'12 mm top cap',26)
leader([(1880,1450),(1896,1498),R(0,(zp+zi1)/2)])
text(2162,1435,'12 mm wall',26)
text(2162,1471,'normal to slope',25)
z=2.505
outside=(A(z),z)
n=(1/math.sqrt(1+q*q),q/math.sqrt(1+q*q))
inside=(outside[0]-wall*n[0],outside[1]-wall*n[1])
ptout,ptin=R(*outside),R(*inside)
line([ptout,ptin],INK,3)
leader([(2240,1510),(2290,1580),((ptout[0]+ptin[0])/2,(ptout[1]+ptin[1])/2)])
# Exact angular sector between a horizontal reference ray and left roof slope.
eave=R(-a0,zt)
line([eave,(eave[0]+225,eave[1])],MUTED,2,True)
arc(*eave,150,0,roof_angle)
text(eave[0]+166,eave[1]-52,f'{math.degrees(roof_angle):.3f}°',25,True)
text(eave[0]+164,eave[1]-19,'from horizontal',22)
text(1774,1921,'12 mm bottom lid',26)
leader([(1903,1910),R(0,ze+wall/2)])
frame_half=frame['topOuterSideMetres']/2
for sign in (-1,1):
    outside_x=cx+sign*a0*rs
    frame_x=cx+sign*frame_half*rs
    line([(outside_x,ground+4),(outside_x,ground+60)],RULE)
    line([(frame_x,ground+4),(frame_x,ground+60)],MUTED,2,True)
    dimension((min(outside_x,frame_x),ground+43),(max(outside_x,frame_x),ground+43),'45',(outside_x/2+frame_x/2,ground+54))
text(1672,1366,'Roof pitch is measured across a face, not along a diagonal hip.',23,colour=MUTED)
line([(64,2012),(2496,2012)],RULE)
text(64,2043,'Reference art above is unchanged. Section colours identify parts; appearance remains replaceable.',28)
text(64,2084,'Exact geometry: LANTERN-SPEC.md and street-model-spec.json. No baked lighting. No model generated.',23,colour=MUTED)

# Permanent authoring invariants: no annotation pixel may cover the source block.
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
source=Image.open(SOURCE).convert('RGB')
assert source.size==(1536,1024)
rect=(SOURCE_X,SOURCE_Y,SOURCE_X+source.width,SOURCE_Y+source.height)
assert OVERLAY.getchannel('A').crop(rect).getbbox() is None, 'Annotation entered preserved source rectangle'
canvas=Image.new('RGB',(WIDTH,HEIGHT),'white')
canvas.paste(source,(SOURCE_X,SOURCE_Y))
canvas=Image.alpha_composite(canvas.convert('RGBA'),OVERLAY).convert('RGB')
assert ImageChops.difference(canvas.crop(rect),source).getbbox() is None
assert abs(math.tan(frame_angle)-k)<1e-12
assert abs(math.tan(roof_angle)*q-1)<1e-12
assert zi0<zjoin<zi1<zp and inner(zi1)>0
assert abs(plan_thickness/math.sqrt(1+k*k)-3)<1e-12
SVG.append('</svg>')
LAYER.write_text('\n'.join(SVG)+'\n')
canvas.save(OUTPUT)
with Image.open(OUTPUT) as saved:
    assert ImageChops.difference(saved.convert('RGB').crop(rect),source).getbbox() is None
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==source_hash
print('Saved:',OUTPUT.name,LAYER.name)
print('Source pixel mismatch count: 0; annotation/source overlap: 0; source SHA256:',source_hash)
print('Angles:',round(math.degrees(frame_angle),6),round(math.degrees(roof_angle),6))
print('Pane plan-cut thickness:',plan_thickness,'mm; true normal thickness: 3 mm; embed:',embed,'mm')
print('Roof cavity/closures and final PNG round-trip pixel preservation: PASS')
