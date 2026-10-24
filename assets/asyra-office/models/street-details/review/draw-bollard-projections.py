"""Draw one calibrated bollard reference sheet; no 3D model is exported."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
SPEC = json.loads((ROOT.parent / 'street-details-model-spec.json').read_text())
ASSET = next(a for a in SPEC['assets'] if a['name'] == 'roadside-bollard')
PARTS = {p['name']: p for p in ASSET['parts']}
PALETTE = ASSET['referenceReview']['reviewTargetColoursSRGB']
WIDTH, HEIGHT, SS, SCALE = 3072, 2048, 2, 1500
PAPER = Image.new('RGB', (WIDTH * SS, HEIGHT * SS), 'white')
DRAW = ImageDraw.Draw(PAPER)
FONT_ROOT = Path('/System/Library/Fonts/Supplemental')
INK, BLUE = '#17232C', '#315D79'


def rgb(value):
    return [int(value[i:i+2], 16) for i in (1, 3, 5)]


def text(x, y, value, size=30, bold=False, anchor='lt', colour=INK):
    font = ImageFont.truetype(str(FONT_ROOT / ('Arial Bold.ttf' if bold else 'Arial.ttf')), size * SS)
    DRAW.text((x * SS, y * SS), value, font=font, fill=colour, anchor=anchor)


def line(points):
    DRAW.line([(x*SS, y*SS) for x, y in points], fill=BLUE, width=3)


def label(x, y, value):
    font = ImageFont.truetype(str(FONT_ROOT / 'Arial.ttf'), 28 * SS)
    box = DRAW.textbbox((x*SS, y*SS), value, font=font, anchor='mm')
    DRAW.rectangle((box[0]-6*SS, box[1]-4*SS, box[2]+6*SS, box[3]+4*SS), fill='white')
    DRAW.text((x*SS,y*SS),value,font=font,anchor='mm',fill=BLUE)


def arrow(tip, toward):
    p = np.array(tip, dtype=float)
    d = np.array(toward, dtype=float) - p
    d /= np.linalg.norm(d)
    n = np.array([-d[1], d[0]])
    DRAW.polygon([tuple(t*SS) for t in [p,p+d*12+n*4,p+d*12-n*4]],fill=BLUE)


def dimension(a,b,offset,value):
    a,b,o = np.array(a),np.array(b),np.array(offset)
    p,q = a+o,b+o
    extra=o/np.linalg.norm(o)*8
    line([a,p+extra]);line([b,q+extra]);line([p,q])
    arrow(p,q);arrow(q,p)
    mid=(p+q)/2
    if abs(p[1]-q[1])<.01:mid[1]-=25
    label(*mid,value)


def leader(point,elbow,end,value):
    line([point,elbow,end]);arrow(point,elbow);label(*end,value)


def draw_view(name, camera, right, origin, rect):
    eye=np.array(camera,dtype=float);eye/=np.linalg.norm(eye)
    right=np.array(right,dtype=float);right/=np.linalg.norm(right)
    up=np.cross(eye,right);direction=-eye
    x0,y0,x1,y1=rect
    ys,xs=np.mgrid[y0*SS:y1*SS,x0*SS:x1*SS]
    h=((xs+.5)/SS-origin[0])/SCALE
    v=(origin[1]-(ys+.5)/SS)/SCALE
    rays=h[...,None]*right+v[...,None]*up+eye*10
    depth=np.full(h.shape,np.inf);owner=np.full(h.shape,-1,dtype=int)
    surface=np.full(h.shape,-1,dtype=int)
    for index,part in enumerate(PARTS.values()):
        hit=np.full(h.shape,np.inf);face=np.zeros(h.shape,dtype=int)
        if part['shape']=='sphere':
            o=rays-np.array(part['center'])
            b=np.sum(o*direction,axis=2)
            c=np.sum(o*o,axis=2)-part['radius']**2
            disc=b*b-c
            t=-b-np.sqrt(np.maximum(disc,0))
            hit=np.where((disc>=0)&(t>=0),t,np.inf)
        else:
            radius=part['radius'];z0=part['zMin'];z1=part['zMax']
            a=np.dot(direction[:2],direction[:2])
            if a>1e-12:
                b=rays[...,0]*direction[0]+rays[...,1]*direction[1]
                c=rays[...,0]**2+rays[...,1]**2-radius**2
                disc=b*b-a*c
                for sign in (-1,1):
                    t=(-b+sign*np.sqrt(np.maximum(disc,0)))/a
                    z=rays[...,2]+t*direction[2]
                    valid=(disc>=0)&(t>=0)&(z>=z0)&(z<=z1)&(t<hit)
                    hit[valid]=t[valid]
            if abs(direction[2])>1e-12:
                for face_id,z in ((1,z0),(2,z1)):
                    t=(z-rays[...,2])/direction[2]
                    xy=rays[...,:2]+t[...,None]*direction[:2]
                    valid=(t>=0)&(np.sum(xy*xy,axis=2)<=radius**2)&(t<hit)
                    hit[valid]=t[valid];face[valid]=face_id
        visible=hit<depth
        depth[visible]=hit[visible];owner[visible]=index
        surface[visible]=index*3+face[visible]
    pixels=np.full((*h.shape,3),255,dtype=np.uint8)
    for index,name_part in enumerate(PARTS):pixels[owner==index]=rgb(PALETTE[name_part])
    edge=np.zeros(h.shape,dtype=bool)
    edge[1:] |= surface[1:] != surface[:-1]
    edge[:-1] |= surface[:-1] != surface[1:]
    edge[:,1:] |= surface[:,1:] != surface[:,:-1]
    edge[:,:-1] |= surface[:,:-1] != surface[:,1:]
    pixels[edge&(owner>=0)]=rgb(INK)
    PAPER.paste(Image.fromarray(pixels),(x0*SS,y0*SS))
    occupied=owner>=0
    return {'view':name,'cameraDirectionFromOrigin':eye.tolist(),'screenRight':right.tolist(),
            'screenUp':up.tolist(),'originPixels':list(origin),'pixelsPerMetre':SCALE,
            'occupiedPixelBounds':[float((xs[occupied].min()+.5)/SS),float((ys[occupied].min()+.5)/SS),
                                   float((xs[occupied].max()+.5)/SS),float((ys[occupied].max()+.5)/SS)]}


text(WIDTH/2,52,'ROADSIDE BOLLARD - SINGLE UNIT',54,True,'mt')
text(WIDTH/2,132,'HEIGHT 480 mm - FIVE ORTHOGRAPHIC VIEWS',32,False,'mt')
text(WIDTH/2,187,'REVIEW COLOURS ONLY - DEFAULT METAL: '+SPEC['material']['baseColorSRGB']+' - CYLINDRICAL SHAFT',29,False,'mt')
VIEWS=[
    ('FRONT',(0,-1,0),(1,0,0),(650,1030),(500,295,800,1045)),
    ('RIGHT',(1,0,0),(0,1,0),(1540,1030),(1390,295,1690,1045)),
    ('BACK',(0,1,0),(-1,0,0),(2410,1030),(2260,295,2560,1045)),
    ('TOP',(0,0,1),(1,0,0),(650,1530),(540,1420,760,1640)),
    ('THREE-QUARTER',(4,-7,3),(7,4,0),(1540,1850),(1300,1080,1780,1890)),
]
records=[draw_view(*v) for v in VIEWS]
for x in (650,1540,2410):text(x,1130,('FRONT','RIGHT','BACK')[(650,1540,2410).index(x)],35,True,'mt')
text(650,1740,'TOP',35,True,'mt');text(1540,1920,'THREE-QUARTER',35,True,'mt')
shaft,collar,ball=(PARTS[k] for k in ('shaft','collar','finial'))
mm=lambda value:f'{value*1000:g}'
front=lambda x,z:(650+x*SCALE,1030-z*SCALE)
right=lambda x,z:(1540+x*SCALE,1030-z*SCALE)
height=ASSET['boundsMax'][2]
dimension(front(0,0),front(0,height),(-245,0),mm(height))
dimension(front(-shaft['radius'],0),front(shaft['radius'],0),(0,51),'Dia. '+mm(shaft['radius']*2))
dimension(front(-ball['radius'],ball['center'][2]),front(ball['radius'],ball['center'][2]),(0,-139),'Dia. '+mm(ball['radius']*2))
dimension(right(collar['radius'],collar['zMin']),right(collar['radius'],collar['zMax']),(95,0),mm(collar['zMax']-collar['zMin']))
dimension(right(-shaft['radius'],0),right(-shaft['radius'],collar['zMin']),(-140,0),mm(collar['zMin'])+' exposed')
leader(right(collar['radius'],(collar['zMin']+collar['zMax'])/2),(1820,405),(1930,405),'Collar dia. '+mm(collar['radius']*2))
dimension((650-ball['radius']*SCALE,1530),(650+ball['radius']*SCALE,1530),(0,-147),'Dia. '+mm(ball['radius']*2))
text(2025,1300,'CONSTRUCTION DIMENSIONS - mm',32,True)
rows=[('Total height',mm(height)),('Shaft diameter',mm(shaft['radius']*2)),
      ('Shaft construction height',mm(shaft['zMax']-shaft['zMin'])),
      ('Collar diameter',mm(collar['radius']*2)),('Collar height',mm(collar['zMax']-collar['zMin'])),
      ('Sphere diameter',mm(ball['radius']*2)),('Shaft embed',mm(ASSET['derivedDimensions']['shaftCollarOverlap'])),('Sphere embed',mm(ASSET['derivedDimensions']['finialCollarOverlap']))]
for i,(key,value) in enumerate(rows):
    text(2025,1370+i*53,key,29);text(2680,1370+i*53,value,29)
text(2025,1820,'Round shaft - flat closed bottom',27)
text(70,1990,'All views: 1500 px/m. Review colours and outlines are not materials. No baked lighting or shadows.',25)
out=ROOT/'02-roadside-bollard-v3.png'
PAPER.resize((WIDTH,HEIGHT),Image.Resampling.LANCZOS).save(out)
measurement={'drawing':out.name,'sheetPixels':[WIDTH,HEIGHT],'source':'../street-details-model-spec.json',
             'geometry':ASSET['parts'],'views':records,'dimensions':ASSET['derivedDimensions'],
             'boundary':'Reference projections only; no model export or app validation.'}
(ROOT/'bollard-projection-measurements.json').write_text(json.dumps(measurement,indent=2)+'\n')
print(json.dumps({'output':out.name,'size':[WIDTH,HEIGHT],'views':len(records)}))
