"""Draw one geometry-backed structural proposal; never modify production inputs."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image, ImageDraw, ImageFont
from lounge_proportion_geometry import reconstruct, project as source_project, wall_corners

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
LIVE = ROOT / 'apps/asyra-office/src/scene/reference/interior-fit.json'
REFERENCE = HERE / 'approved-office-reference.jpg'
SPEC = HERE.parent / 'architecture-model-spec.json'
source = json.loads(LIVE.read_text())
architecture = json.loads(SPEC.read_text())
p = source['parameters'].copy()
shell = source['shell']
floor = source['floors']['work']
door = next(m for m in architecture['modules'] if m['moduleId'] == 'entry-door-set')
cream_start = shell['westX'] + shell['exteriorThickness'] / 2
cream_length = p['creamEnd'] - cream_start
source_gap = cream_length * 22 / 101
# Preserve the complete approved door's proportions, not just its active leaf.
door_scale = p['doorHeight'] / door['mounting']['roughOpeningSizeMetres'][1]
p['doorWidth'] = door_scale * door['mounting']['roughOpeningSizeMetres'][0]
# The entrance pier terminates at the lounge side, as in owner crops 2 and 3.
# Place the entire opening to its left so the side wall cannot obstruct the door.
p['facadeEnd'] = p['loungeX'] + shell['partitionThickness'] / 2
p['doorX'] = p['facadeEnd'] - shell['facadeThickness'] - p['doorWidth'] / 2
passage = door_scale * door['mainLeafWidthMetres']
# The source opening is not widened to a future gameplay/circulation standard.
gap = source_gap
# Visual estimates under the owner's common-floor correction, not module heights.
p['creamTop'] = floor + (p['rearTop'] - floor) * 0.75
p['greenStart'] = p['creamEnd'] + gap
p['greenEnd'] = p['greenStart'] + cream_length * 71 / 101
p['greenTop'] = floor + (p['creamTop'] - floor) * 0.90
p.pop('greenY')
trace_path = HERE / 'lounge-proportion-measurements.json'
lounge_trace = json.loads(trace_path.read_text())
lounge = reconstruct(p, shell, floor, lounge_trace)

proposal = {
    'status': 'proposal-awaiting-owner-review',
    'sourceReference': str(REFERENCE.relative_to(ROOT)),
    'sourceReferenceSha256': hashlib.sha256(REFERENCE.read_bytes()).hexdigest(),
    'productionInputSha256': hashlib.sha256(LIVE.read_bytes()).hexdigest(),
    'units': 'Normalized scene units; total footprint width 6.2 is a similarity datum, not a surveyed metre dimension.',
    'parameters': p,
    'sharedFloor': floor,
    'westDivider': {
        'commonY': p['creamY'], 'creamStart': cream_start, 'creamEnd': p['creamEnd'],
        'creamHeightAboveFloor': p['creamTop'] - floor,
        'greenStart': p['greenStart'], 'greenEnd': p['greenEnd'],
        'greenHeightAboveFloor': p['greenTop'] - floor,
        'clearGap': gap, 'sourceRatioGap': source_gap, 'mainDoorLeafSpan': passage,
        'lengthRatioFromSource': '71 / 101',
        'heightInference': 'Cream/rear 0.75; green/cream 0.90. Approximate visual interpretation of owner crop 1 on a common floor, pending review; not measured or module-derived.',
        'gapRule': 'source gap/span ratio 22 / 101; no future gameplay clearance normalization'
    },
    'limitations': ['A correction proposal, not an accepted reconstruction.',
                    'Green member image position and height intentionally change.',
                    'Remaining shell is contextual baseline, not newly approved.',
                    'Orthographic review views are not actual-app screenshots.']
}

# Closed planar solids. Faces in all views come from these exact shared vertices.
solids = []
wall_records = []
CREAM = (222, 213, 192)
GREEN = (132, 157, 125)
CAP = (245, 238, 222)
FLOOR = (227, 237, 232)
INK = '#2d3e45'
BLUE = '#237b91'

def box(name, minimum, maximum, color):
    vertices = [[x, y, z] for z in [minimum[2], maximum[2]]
                for x, y in [(minimum[0], minimum[1]), (maximum[0], minimum[1]),
                             (maximum[0], maximum[1]), (minimum[0], maximum[1])]]
    solids.append({'id': name, 'vertices': vertices, 'color': color})

def wall(name, start, end, cross, top, thickness, along_y=False,
         start_offset=0, end_offset=0, start_slope=0, end_slope=0,
         cap_start_offset=None, end_top=None, base=floor, color=CREAM, cap_height=None):
    if end_top is None: end_top = top
    assert end > start and min(top, end_top) > base and thickness > 0
    wall_records.append({'id': name, 'start': start, 'end': end, 'cross': cross,
                         'base': base, 'top': top, 'endTop': end_top,
                         'thickness': thickness, 'alongY': along_y})
    for cap in [False, True]:
        depth = thickness * (shell['capDepthRatio'] if cap else 1)
        lower, upper = ((2.42 / 2.5, 1) if cap else (0, 2.42 / 2.5))
        vertices = []
        for level in [lower, upper]:
            for far, side in [(False,-1),(True,-1),(True,1),(False,1)]:
                y = side * depth / 2
                x = end if far else start
                offset = end_offset if far else (cap_start_offset if cap and cap_start_offset is not None else start_offset)
                x += offset + (end_slope if far else start_slope) * y
                height = top - base + (x - start) / (end - start) * (end_top - top)
                local_cap_height = cap_height if cap_height is not None else height * (1 - 2.42 / 2.5)
                z = (base + height if level == 1 else base + height - local_cap_height if level != 0 else base)
                vertices.append([cross-y, x, z] if along_y else [x, cross+y, z])
        solids.append({'id': name + ('-cap' if cap else ''), 'vertices': vertices,
                       'color': CAP if cap else color})

ext = shell['exteriorThickness']
part = shell['partitionThickness']
xwest, xeast, front = shell['westX'], shell['eastX'], shell['frontY']
wall('west wall', front, p['rearY'], xwest, p['rearTop'], ext, True,
     start_offset=-shell['facadeThickness']/2, end_slope=1)
wall('discussion rear', xwest, p['discussionEnd'], p['rearY'], p['rearTop'], ext, start_slope=-1)
wall('pantry rear', p['pantryX'], xeast+ext/2, p['rearY'], p['pantryTop'], ext, start_slope=-1)
wall('A - cream divider', xwest, p['creamEnd'], p['creamY'], p['creamTop'], ext, start_offset=ext/2)
wall('B - green divider', p['greenStart'], p['greenEnd'], p['creamY'], p['greenTop'], part, color=GREEN)
wall('pantry divider', p['pantryFront'], p['rearY'], p['pantryX'], p['pantryTop'], ext, True, end_slope=1)
branch = source['loungeRearBranch']
right_step = lounge['rightStep']
middle_top = lounge['middleTop']
branch = dict(branch, centerX=right_step+branch['thickness']/2, length=lounge['branchLength'])
wall('lounge rear left', p['loungeX'], p['loungeSplit'], p['loungeY'], p['loungeTop'], part, start_offset=part/2)
wall('lounge rear middle', p['loungeSplit'], right_step, p['loungeY'], middle_top, part)
wall('lounge rear right', right_step, xeast+ext/2, p['loungeY'], p['loungeRightTop'], part)
wall('lounge T return', p['loungeY'], p['loungeY']+branch['length'], branch['centerX'], p['loungeRightTop'], branch['thickness'], True,
     start_offset=part/2, cap_start_offset=part*shell['capDepthRatio']/2)
return_start = p['loungeY'] - p['returnLength']
wall('lounge left low', front + shell['facadeThickness']/2, return_start, p['loungeX'],
     lounge['leftLowTop'], part, True)
wall('lounge left return', return_start, p['loungeY'], p['loungeX'], p['returnTop'], part, True, end_offset=part/2)
# Owner crop 4: this is horizontal floor, not a sloping parapet wall.
box('white pantry floor band', [xeast-ext/2, p['loungeY']+part/2, floor-.025],
    [xeast+ext/2, p['rearY']-ext/2, floor], (248, 246, 237))
left=p['doorX']-p['doorWidth']/2
right=p['doorX']+p['doorWidth']/2
# Crop 2: the thin frontage ends before the sign-bearing entrance block.
front_join = cream_start + (p['facadeEnd']-cream_start) * 280 / 1280
wall('thin front section', cream_start, front_join, front, p['facadeTop'], shell['facadeThickness']/2)
wall('front facade', front_join, left, front, p['facadeTop'], shell['facadeThickness'])
wall('entry pier', right, p['facadeEnd'], front, p['facadeTop'], shell['facadeThickness'])
wall('entry header', left, right, front, p['facadeTop'], shell['facadeThickness'], base=floor+p['doorHeight'], cap_height=(p['facadeTop']-floor)*(1-2.42/2.5))
entry_components = []
for component in door['components']:
    size = [v*door_scale for v in component['sizeMetres']]
    local = component['centreMetres']
    center = [p['doorX']+local[0]*door_scale, front+local[1]*door_scale, floor+local[2]*door_scale]
    color = (186, 116, 51) if component['material'] == 'door-wood' else (151, 99, 51)
    if component['material'] == 'iron': color = (66, 64, 55)
    box('entry '+component['partId'], [center[i]-size[i]/2 for i in range(3)],
        [center[i]+size[i]/2 for i in range(3)], color)
    entry_components.append({'partId': component['partId'], 'center': center, 'size': size})
proposal['entryAssembly'] = {'scale': door_scale, 'roughOpening': [p['doorWidth'], p['doorHeight']],
                            'components': entry_components, 'spec': 'entry-door-set',
                            'display': 'Structural occupancy; panel mouldings and hinge animation are not rendered.'}
proposal['interpretations'] = {
    'frontage': 'thin left section 280/1280 of frontage span; half entrance-wall depth from crop 2; approximate',
    'entryPosition': 'Entrance pier aligns with the lounge side boundary; the complete opening lies to its left, not behind that wall.',
    'lounge': 'Three ascending rear levels and measured left low/high spans from lounge-proportion-measurements.json; local weak-perspective reconstruction, not surveyed dimensions.',
    'pantryEast': 'White floor band at the common finished floor; no raised parapet.'}
outline=source['foundation']['outline']
slab_bottom=source['foundation']['bottom']
slab_vertices=[[x,y,z] for z in [slab_bottom,floor] for x,y in outline]
proposal['walls']=wall_records
proposal['solids']=solids
proposal['foundation']={'vertices':slab_vertices}
proposal['loungeReconstruction'] = lounge
corners = wall_corners(wall_records)
residuals = {name: math.dist(source_project(point,lounge['projection']), lounge_trace['points'][name])
             for name,point in corners.items()}
proposal['loungeSourceResidualPixels'] = residuals
assert max(residuals.values()) <= 8, residuals


# Geometry checks apply before either view is drawn.
assert all(abs(w['base']-floor)<1e-10 for w in wall_records if w['id']!='entry header')
a=next(w for w in wall_records if w['id']=='A - cream divider')
b=next(w for w in wall_records if w['id']=='B - green divider')
assert a['cross']==b['cross'] and not a['alongY'] and not b['alongY']
assert b['start']>a['end'] and abs(b['start']-a['end']-gap)<1e-10
assert b['top']<a['top'] and gap>0
assert all(len(s['vertices'])==8 for s in solids)
header_cap=next(s for s in solids if s['id']=='entry header-cap')
facade_cap=next(s for s in solids if s['id']=='front facade-cap')
assert abs(min(v[2] for v in header_cap['vertices'])-min(v[2] for v in facade_cap['vertices']))<1e-10
assert abs(max(v[2] for v in header_cap['vertices'])-max(v[2] for v in facade_cap['vertices']))<1e-10
assert all(math.isfinite(v) for s in solids for point in s['vertices'] for v in point)
proposal['checks']={'sharedFloor':True,'samePartitionLine':True,'orderedMembers':True,
                    'openWestGap':True,'positiveSolids':True,'viewsShareVertices':True,'continuousFacadeCap':True}

WIDTH, HEIGHT, AA = 2200, 1760, 2
canvas=Image.new('RGB',(WIDTH*AA,HEIGHT*AA),'#f8faf8')
draw=ImageDraw.Draw(canvas)
FONT=Path('/System/Library/Fonts/Supplemental/Arial.ttf')
BOLD=Path('/System/Library/Fonts/Supplemental/Arial Bold.ttf')
def text(x,y,value,size=25,fill=INK,bold=False,anchor='lt'):
    draw.text((x*AA,y*AA),value,font=ImageFont.truetype(str(BOLD if bold else FONT),size*AA),fill=fill,anchor=anchor)
def line(points,fill=INK,width=2):
    draw.line([(x*AA,y*AA) for x,y in points],fill=fill,width=width*AA)
def polygon(points,fill,outline_color='#78817c',width=1):
    pts=[(x*AA,y*AA) for x,y in points];draw.polygon(pts,fill=fill)
    if outline_color: draw.line(pts+[pts[0]],fill=outline_color,width=width*AA,joint='curve')
def panel(box):
    draw.rounded_rectangle(tuple(v*AA for v in box),radius=20*AA,fill='white',outline='#dce4df',width=2*AA)

def projection(box, azimuth, elevation, items):
    az,el=map(math.radians,[azimuth,elevation])
    right=[math.cos(az),math.sin(az),0]
    up=[-math.sin(az)*math.sin(el),math.cos(az)*math.sin(el),math.cos(el)]
    toward=[math.sin(az)*math.cos(el),-math.cos(az)*math.cos(el),math.sin(el)]
    dot=lambda v,b:sum(x*y for x,y in zip(v,b))
    vertices=[v for s in items for v in s['vertices']]
    xy=[(dot(v,right),-dot(v,up)) for v in vertices]
    lo=[min(v[a] for v in xy) for a in [0,1]];hi=[max(v[a] for v in xy) for a in [0,1]]
    scale=min((box[2]-box[0])/(hi[0]-lo[0]),(box[3]-box[1])/(hi[1]-lo[1]))
    ox=(box[0]+box[2])/2-scale*(lo[0]+hi[0])/2
    oy=(box[1]+box[3])/2-scale*(lo[1]+hi[1])/2
    return lambda v:(ox+scale*dot(v,right),oy-scale*dot(v,up)),toward

faces=[([0,3,2,1],.76),([0,1,5,4],.91),([1,2,6,5],.79),([2,3,7,6],.87),([3,0,4,7],.83),([4,5,6,7],1.04)]
slab={'id':'common floor','vertices':slab_vertices,'color':FLOOR}
def render(box, az,el,items,project_override=None):
    project,toward=projection(box,az,el,items)
    if project_override is not None:
        project = project_override
    queue=[]
    for solid in items:
        for ids,shade in faces:
            pts=[solid['vertices'][i] for i in ids]
            u=[pts[1][i]-pts[0][i] for i in range(3)]
            v=[pts[2][i]-pts[0][i] for i in range(3)]
            normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
            if sum(normal[i]*toward[i] for i in range(3))<=0:continue
            depth=sum(sum(q[i]*toward[i] for i in range(3)) for q in pts)/len(pts)
            color=tuple(min(255,round(c*shade)) for c in solid['color'])
            queue.append((depth,pts,color))
    for _,pts,color in sorted(queue,key=lambda f:f[0]): polygon([project(v) for v in pts],color)
    return project

text(62,42,'OFFICE STRUCTURE - CORRECTION PROPOSAL',46,bold=True)
text(64,105,'One floor. One west-room partition line. Review proposal only - not applied to the app.',27)
panel((45,165,1405,1190));panel((1430,165,2155,920));panel((1430,945,2155,1685));panel((45,1210,1405,1685))
text(75,190,'01  STRUCTURE VIEW',26,bold=True)
project=render((80,255,1370,1090),lounge['viewAzimuth'],lounge['viewElevation'],[slab]+solids)
for label,wall_id in [('A','A - cream divider'),('B','B - green divider')]:
    w=next(w for w in wall_records if w['id']==wall_id)
    q=project([(w['start']+w['end'])/2,w['cross'],w['top']+.13])
    draw.ellipse(((q[0]-20)*AA,(q[1]-20)*AA,(q[0]+20)*AA,(q[1]+20)*AA),fill=BLUE)
    text(q[0],q[1],label,25,'white',True,'mm')
text(80,1120,'A  Cream divider     B  Green divider - slightly lower',26,bold=True)
text(80,1156,'Continuous floor beneath every room; no interior platforms or stairs.',23)

text(1460,190,'02  TOP VIEW - SAME GEOMETRY',25,bold=True)
project_top=render((1475,255,2110,815),0,90,[slab]+solids)
# The centerline is overlaid explicitly; it is not another wall.
x0,y0=project_top([cream_start,p['creamY'],floor]);x1,y1=project_top([p['greenEnd'],p['creamY'],floor])
for x in range(round(x0),round(x1),15): line([(x,y0),(min(x+9,x1),y0)],BLUE,3)
for label,x,y in [('DISCUSSION',-1.7,1.65),('PANTRY',1.4,1.8),('WORK',-1.7,-1.6),('LOUNGE',1.6,-1.45)]:
    q=project_top([x,y,floor]);text(*q,label,20,'#536c6b',True,'mm')
text(1460,847,'Blue dashed line: shared center plane',22,BLUE,bold=True)
text(1460,880,'Floor datum +0.000 throughout',22)

text(1460,976,'03  FOUR STRUCTURAL CORRECTIONS',24,bold=True)
notes=[('1  Lower A; B only slightly lower', ['Same line and same floor.', 'No standard module height imposed.']),
       ('2  Thin front + thick entrance wall', ['Complete door: fixed left + operable right.', 'One scale preserves the approved door ratio.']),
       ('3  Measured lounge proportions', ['Rear: three ascending horizontal levels.', 'Left low/high lengths follow source corners.']),
       ('4  White pantry edge is floor', ['Floor finish at the shared datum.', 'The mistaken raised side wall is removed.'])]
for i,(title,bodies) in enumerate(notes):
    y=1030+i*145;text(1460,y,title,23,bold=True)
    for j,body in enumerate(bodies):text(1460,y+36+j*28,body,20)
text(75,1235,'04  ENTRANCE - COMPLETE ASSEMBLY',25,bold=True)
# Elevation uses exactly the same door solids, with real frame and panel gaps.
entry_solids=[s for s in solids if s['id'].startswith('entry ') and 'header' not in s['id'] and 'pier' not in s['id']]
render((95,1290,405,1625),0,0,entry_solids)
text(470,1300,'Fixed left panel 600 mm + right leaf 900 mm',25,bold=True)
text(470,1342,'Rough opening: 1660 x 2170 mm before scene scaling.',23)
text(470,1380,'Frame, gaps and both panels follow entry-door-set.',23)
text(470,1440,f'Common-floor heights: A {p["creamTop"]-floor:.3f} / B {p["greenTop"]-floor:.3f}',23)
text(470,1478,'A/rear = 0.75; B/A = 0.90 - visual estimates for review.',22)
text(470,1516,f'Clear divider gap {gap:.3f} - source ratio; not widened.',22)
text(470,1565,'Scene values are normalized units, not surveyed metres.',21)
text(470,1600,'No modular grid or uniform wall thickness is imposed.',21)
text(65,1710,'Review proposal only. Original image and app unchanged. Furniture omitted. Estimated proportions await review.',23)

output=HERE/'office-single-floor-structure-proposal-v1.png'
canvas.resize((WIDTH,HEIGHT),Image.Resampling.LANCZOS).save(output)
(HERE/'office-single-floor-structure-proposal-v1.json').write_text(json.dumps(proposal,indent=2)+'\n')
assert hashlib.sha256(LIVE.read_bytes()).hexdigest()==proposal['productionInputSha256']
assert hashlib.sha256(REFERENCE.read_bytes()).hexdigest()==proposal['sourceReferenceSha256']
print(json.dumps({'image':str(output),'checks':proposal['checks'],'westDivider':proposal['westDivider']},indent=2))

# One focused review sheet: identical source framing and scale in both panels.
WIDTH, HEIGHT = 2480, 1180
canvas=Image.new('RGB',(WIDTH*AA,HEIGHT*AA),'#f8faf8')
draw=ImageDraw.Draw(canvas)
text(45,30,'LOUNGE WALLS - SOURCE-ALIGNED PROPORTIONS',40,bold=True)
text(45,87,'Same view and image scale. Structure only; furniture omitted. Drawing proposal, not applied to the app.',23)
factor=.64
original=Image.open(HERE/lounge_trace['source']).convert('RGB')
original_size=(round(original.width*factor*AA),round(original.height*factor*AA))
canvas.paste(original.resize(original_size,Image.Resampling.LANCZOS),(45*AA,180*AA))
text(45,140,'ORIGINAL REFERENCE',25,bold=True)
text(1260,140,'REVISED WALL GEOMETRY',25,bold=True)
panel((1245,175,2440,1005))
def aligned_projection(point):
    x,y=source_project(point,lounge['projection'])
    return (1260+x*factor,180+y*factor)
room_solids=[s for s in solids if s['id'].startswith('lounge ')]
render((1260,180,2430,992),lounge['viewAzimuth'],lounge['viewElevation'],room_solids,aligned_projection)
for label,key in [('R1','rearLeftEnd'),('R2','rearMiddleEnd'),('R3','rearRightEnd'),('L1','leftLowFront'),('L2','leftHighFront')]:
    q=aligned_projection(corners[key])
    text(q[0],q[1]-20,label,20,BLUE,True,'mb')
text(45,1030,f'Left low / high lengths: {lounge["lowLength"]:.3f} / {lounge["highLength"]:.3f} = {lounge["lowLength"]/lounge["highLength"]:.2f} : 1',24,bold=True)
text(1260,1030,f'{len(residuals)} picked corners: maximum residual {max(residuals.values()):.1f} source pixels',23,bold=True)
text(45,1080,'Rear levels rise in three steps after perspective is accounted for. All bases share one floor.',23)
text(45,1123,'Source picks: +/-8 px; partly occluded foot: +/-20 px. This is a local proportion fit, not full-building approval.',22)
canvas.resize((WIDTH,HEIGHT),Image.Resampling.LANCZOS).save(HERE/'lounge-wall-proportions-review.png')
