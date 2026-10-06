"""Create the handrail's technical diagram from its numeric geometry contract.

This creates a new diagram, without modifying or repainting a reference raster.
No model, scene lighting, Blender execution or runtime asset is produced.
"""
from pathlib import Path
import json
import math
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
spec = json.loads((ROOT.parent / 'stair-railing-model-spec.json').read_text())
rail = next(o for o in spec['objects'] if o['id'] == 'sloped-handrail')
poly = rail['xzPolygon']
y0, y1 = rail['bounds']['min'][1], rail['bounds']['max'][1]
vertices = [(x,y,z) for y in (y0,y1) for x,z in poly]
image = Image.new('RGB', (1800,1200), 'white')
draw = ImageDraw.Draw(image)
font_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
def text(p, s, size=26, color='#202020'):
    draw.text(p,s,font=ImageFont.truetype(font_path,size),fill=color)
def line(points, color='#252525', width=3):
    draw.line(points,fill=color,width=width)
def face(points, fill='#626662'):
    draw.polygon(points,fill=fill)
    line(points+[points[0]])
def arrow(a,b,label=None,at=None):
    line([a,b],width=2)
    for p,q in ((a,b),(b,a)):
        dx,dy=q[0]-p[0],q[1]-p[1]; n=math.hypot(dx,dy); ux,uy=dx/n,dy/n
        draw.polygon([p,(p[0]+ux*11-uy*4,p[1]+uy*11+ux*4),(p[0]+ux*11+uy*4,p[1]+uy*11-ux*4)],fill='#252525')
    if label: text(at,label,23)
def dashed(a,b,color='#727272'):
    n=math.hypot(b[0]-a[0],b[1]-a[1]); count=max(2,int(n/9))
    for i in range(0,count,2):
        line([(a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count),(a[0]+(b[0]-a[0])*min(i+1,count)/count,a[1]+(b[1]-a[1])*min(i+1,count)/count)],color,2)

text((415,24),'SLOPED HANDRAIL - SINGLE SEGMENT',44)
text((430,85),'RUN 0.30 m - RISE 0.15 m - DEPTH 0.04 m',30)
text((440,131),'Calculated projections - vertical end cuts',24)
scale=1400
front=lambda x,z:(110+x*scale,475-z*scale)
back=lambda x,z:(1690-x*scale,475-z*scale)
face([front(x,z) for x,z in poly]); face([back(x,z) for x,z in poly])
arrow((110,515),(530,515),'0.30 m',(267,525))
arrow((1270,515),(1690,515),'0.30 m',(1425,525))
arrow((72,475),(72,419),'0.04 m',(6,370))
arrow((577,475),(577,209),'0.19 m',(585,315))
arrow((1225,475),(1225,209),'0.19 m',(1123,315))
# The corner angles belong to the true XZ side face, not screen angles of 3D views.
text((115,237),'63.435 / 116.565 deg',23)
text((115,268),'side-face interior angles',21)
text((260,570),'FRONT',30); text((1420,570),'BACK',30)
face([(858,209),(914,209),(914,475),(858,475)])
arrow((952,475),(952,209),'0.19 m',(969,315))
arrow((858,515),(914,515),'0.04 m',(841,525))
text((838,570),'RIGHT',30)
text((757,617),'Full projected silhouette',20)
text((788,646),'not one end face',20)
for top,label in ((730,'TOP'),(963,'BOTTOM')):
    face([(110,top),(530,top),(530,top+56),(110,top+56)])
    arrow((110,top+88),(530,top+88),'0.30 m',(267,top+97))
    arrow((72,top),(72,top+56),'0.04 m',(7,top+4))
    text((255 if label=='TOP' else 220,top+140),label,30)
# Orthographic camera at negative X, negative Y, positive Z.
# Screen right and up are perpendicular unit vectors; no shear is in the camera.
right=(2/math.sqrt(5),-1/math.sqrt(5),0)
up=(1/math.sqrt(30),2/math.sqrt(30),5/math.sqrt(30))
assert abs(sum(right[i]*up[i] for i in range(3)))<1e-12
assert abs(sum(c*c for c in right)-1)<1e-12
assert abs(sum(c*c for c in up)-1)<1e-12
s=1800; origin=(1100,1065)
def project(v):
    return (origin[0]+s*sum(v[i]*right[i] for i in range(3)),origin[1]-s*sum(v[i]*up[i] for i in range(3)))
p=[project(v) for v in vertices]
# Top, low vertical end, front parallelogram side: exactly the same eight vertices.
face([p[i] for i in (3,2,6,7)],'#858985')
face([p[i] for i in (0,4,7,3)],'#4f534f')
face([p[i] for i in (0,1,2,3)],'#666a66')
text((770,710),'VERTICAL CUT',24); text((770,742),'X = 0',22)
line([(950,757),p[7]],width=2)
text((1630,628),'VERTICAL',20); text((1630,653),'CUT',20); text((1630,678),'X = 0.30',20)
line([(1624,710),(p[2][0]+7,p[2][1]+16)],width=2)
# A construction triangle exposes rise separately from ground-plane projection.
base=project((.30,y0,0)); low=p[0]; high=p[1]
dashed(low,base); dashed(base,high)
text((1250,1060),'RUN 0.30 m',22)
text((1616,843),'RISE',21); text((1616,870),'0.15 m',21)
text((1080,1140),'THREE-QUARTER',30)
text((650,1180),'All views derive from the same numeric vertices. Colours are diagram defaults.',18)
image.save(ROOT/'02-sloped-handrail-v3.png')
# Direct inspection export, without changing the diagram's geometry.
image.crop((1060,610,1745,1175)).save(ROOT/'02-sloped-handrail-v3-detail.png')
print('Created calculated 1800 x 1200 sheet and 685 x 565 detail.')
