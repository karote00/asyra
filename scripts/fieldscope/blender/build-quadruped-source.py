"""Author body-local material only. The TypeScript source owns every rig frame."""
import argparse
import json
import math
from pathlib import Path
import sys
import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--blend', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
project = Path(__file__).resolve().parents[3]
destination = Path(args.blend).resolve()
assert destination.is_relative_to(project)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = 'Quadruped Source Materials'
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
scene['template_format'] = 'quadruped-source-template/2'
scene['template_id'] = 'side-stage-articulation-2'
collection = bpy.data.collections.new('SOURCE_MODULES')
scene.collection.children.link(collection)

def material(name, color):
    item = bpy.data.materials.new(name)
    item.diffuse_color = (*color, 1)
    return item
materials = {
    'structural-cover': material('structural-cover', (0.73, 0.76, 0.72)),
    'structural-metal': material('structural-metal', (0.07, 0.085, 0.09)),
    'joint-housing': material('joint-housing', (0.045, 0.055, 0.05)),
    'soft-contact': material('soft-contact', (0.10, 0.12, 0.10)),
    'cutting-edge': material('cutting-edge', (0.55, 0.59, 0.60)),
    'basket-material': material('basket-material', (0.60, 0.61, 0.51)),
}
faces_box = [(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(3,7,6,2),(0,1,5,4)]
def cuboid(center, size):
    x,y,z = center
    a,b,c = (value/2 for value in size)
    return [(x-a,y-b,z-c),(x+a,y-b,z-c),(x+a,y+b,z-c),(x-a,y+b,z-c),
            (x-a,y-b,z+c),(x+a,y-b,z+c),(x+a,y+b,z+c),(x-a,y+b,z+c)]

def module(name, cells, size, material_id='structural-cover', bevel=0, axes=(), low=None, high=None, ports=None):
    vertices, faces, counts = [], [], []
    for points, polygons in cells:
        start = len(vertices)
        vertices.extend(points)
        faces.extend([tuple(start+i for i in face) for face in polygons])
        counts.append(len(polygons))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.data.materials.append(materials[material_id])
    if bevel:
        assert len(cells) == 1
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        modifier = obj.modifiers.new('Authored edge chamfer', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 1
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(False)
        counts = [len(obj.data.polygons)]
    obj['module_id'] = name
    # Author the actual mesh on a binary grid before export. This keeps the
    # original planar material faces exactly representable in Blender float32.
    for vertex in obj.data.vertices:
        vertex.co = tuple(round(float(value) * 262144) / 262144 for value in vertex.co)
    obj.data.update()
    obj['material_id'] = material_id
    obj['size'] = json.dumps(size)
    obj['cell_face_counts'] = json.dumps(counts)
    kind = 'rigid'
    if axes:
        kind = 'axial-span' if tuple(axes) == (2,) else 'panel'
    obj['dimensions'] = json.dumps({'kind':kind,'axes':list(axes),'min':low or size,'max':high or size})
    obj['ports'] = json.dumps(ports or [])
    return obj

def box(name, size, material_id='structural-cover', bevel=0, axes=(), low=None, high=None):
    return module(name, [(cuboid((0,0,0),size),faces_box)], size, material_id, bevel, axes, low, high)

box('chassis-shell', [0.54,0.18,0.82], bevel=0.025)
box('platform-deck', [0.6,0.04,0.72], 'structural-metal')
box('platform-outrigger', [0.04,0.04,0.04], 'structural-metal')
box('stage-base-bridge', [0.028,0.04,0.14], 'structural-metal')
box('latch-housing', [0.04,0.06,0.08], 'structural-metal', bevel=0.006)
def assembly(name, boxes, size):
    return module(name, [(cuboid(center,extent),faces_box) for center,extent in boxes], size, 'structural-metal')

# One enclosed shoulder deck connects the two root pods to the inner telescope.
for side, sign in [('left',-1),('right',1)]:
    module('shoulder-deck-'+side, [(cuboid((sign*0.10,0,0),(0.24,0.04,0.86)),faces_box)],
           [0.24,0.04,0.86], bevel=0.0078125)
box('shoulder-plug', [0.024,0.055,0.134], 'structural-metal')
shoulder = assembly('shoulder-yoke', [
    ((-0.0275,0.041,0.0925),(0.145,0.030,0.265)),
    ((-0.0825,0.1305,0.16),(0.035,0.149,0.13)),
], [0.145,0.179,0.265])
shoulder['ports'] = json.dumps([
    {'id':'next-joint','position':[0,0.14,0.16]},
    {'id':'root-contact','position':[0,round(0.026*262144)/262144,0]},
    {'id':'tip-contact','position':[round(-0.065*262144)/262144,0.14,0.16]},
])
for sign in (-1,1):
    assembly('hip-base-mount-'+str(sign), [
        ((sign*0.0325,0.03,-0.05875),(0.065,0.06,0.02)),
    ], [0.065,0.06,0.02])
for sign in (-1,1):
    offset = sign*0.07
    tip = offset-0.065
    low = tip-0.035
    hip = assembly('hip-yoke-'+str(sign), [
        (((low+0.045)/2,0,0.03725),(0.045-low,0.08,0.0355)),
        ((tip-0.0175,0,0.1175),(0.035,0.10,0.125)),
    ], [0.045-low,0.10,0.1605])
    hip['ports'] = json.dumps([{'id':'next-joint','position':[(round(tip*262144)-round(-0.065*262144))/262144,0,0.12]}])
wrist_pitch = assembly('wrist-pitch-carrier', [
    ((0.0265,-0.0125,0),(0.027,0.075,0.036)),
    ((0.00375,-0.04125,0.05175),(0.0725,0.0175,0.0675)),
], [0.0725,0.075,0.0855])
wrist_pitch['ports'] = json.dumps([{'id':'next-joint','position':[0,0,round(0.0675*262144)/262144]}])
wrist_yaw = assembly('wrist-yaw-carrier', [
    ((0,0.0265,0.008),(0.036,0.027,0.052)),
    ((0,0.00375,0.0345),(0.036,0.0725,0.001)),
], [0.036,0.0725,0.053])
wrist_yaw['ports'] = json.dumps([{'id':'next-joint','position':[0,0,(round(0.035*262144)-round(-0.0325*262144))/262144]}])
box('wrist-tool-carrier', [0.05,0.05,0.002], 'structural-metal')
assembly('ankle-carrier', [
    ((0.03345,0,0.0275),(0.0331,0.07,0.055)),
], [0.0331,0.07,0.055])

def cross_section(center, width, depth):
    bevel = 0.0078125
    x,y = width/2,depth/2
    return [(center-x,-y+bevel),(center-x+bevel,-y),(center+x-bevel,-y),(center+x,-y+bevel),
            (center+x,y-bevel),(center+x-bevel,y),(center-x+bevel,y),(center-x,y-bevel)]

def link_cell(z0,z1,x0,x1,w0,w1):
    first,second = cross_section(x0,w0,0.08),cross_section(x1,w1,0.08)
    points = [(x,y,z0) for x,y in first]+[(x,y,z1) for x,y in second]
    polygons = [tuple(reversed(range(8))),tuple(range(8,16))]
    polygons += [(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
    return points,polygons

# Each link has unchanged rigid ends; only its middle axial span changes.
for name,tip_face in [('link-assembly',-0.065),('forearm-link',-0.0325),('lower-leg-link',-0.04225)]:
    tip_center = tip_face-0.01
    cells = [link_cell(-0.025,0.09,0.0405,0.0405,0.029,0.029),
             link_cell(0.09,0.31,0.0405,tip_center,0.029,0.02),
             link_cell(0.31,0.425,tip_center,tip_center,0.02,0.02)]
    link = module(name,cells,[0.14,0.08,0.4])
    link['dimensions'] = json.dumps({'kind':'axial-span','axes':[2],'min':[0.14,0.08,0.2],'max':[0.14,0.08,1.14]})
    link['axial_weights'] = json.dumps([int(vertex.co.z > 0.2) for vertex in link.data.vertices])
    link['ports'] = json.dumps([{'id':'root','position':[0,0,0],'axialWeight':0},
                              {'id':'tip','position':[0,0,0.4],'axialWeight':1}])
box('foot-pad', [0.2,0.05,0.24], 'soft-contact', bevel=0.008)
box('holder-palm', [0.08,0.06,0.02], 'soft-contact', bevel=0.003)
box('holder-finger', [0.014,0.03,0.12-0.02], 'soft-contact', bevel=0.002)
box('foliage-guide', [0.008,0.012,0.12], 'soft-contact', bevel=0.002)
# Fixed tool interfaces use the same binary-grid planes as their original cells.
def q(value):
    return round(value*262144)/262144

def bounded_box(low, high):
    return (cuboid(tuple((a+b)/2 for a,b in zip(low,high)),
                   tuple(b-a for a,b in zip(low,high))), faces_box)

fork_gap = 2*q(0.003)
module('cutter-palm', [
    bounded_box((-q(0.04),-q(0.03),0),(q(0.04),q(0.03),q(0.016))),
    bounded_box((-q(0.02),fork_gap,q(0.016)),(q(0.02),q(0.03),q(0.032))),
    bounded_box((-q(0.02),-q(0.03),q(0.016)),(q(0.02),-fork_gap,q(0.032))),
], [0.08,0.06,0.032], 'structural-metal', ports=[
    {'id':'guard--1','position':[-q(0.04),0,q(0.008)]},
    {'id':'guard-1','position':[q(0.04),0,q(0.008)]},
    {'id':'blade-axis--1','position':[-q(0.003),0,q(0.02)]},
    {'id':'blade-axis-1','position':[q(0.003),0,q(0.02)]},
])
for sign,name in [(1,'cutter-guard'),(-1,'cutter-guard-left')]:
    flange_x = sorted((sign*-q(0.01),sign*-q(0.005)))
    module(name, [
        bounded_box((-q(0.005),-q(0.04),-q(0.07)),(q(0.005),q(0.04),q(0.07))),
        bounded_box((flange_x[0],-q(0.024),q(0.002)-q(0.06)),
                    (flange_x[1],q(0.024),q(0.014)-q(0.06))),
    ], [0.015,0.08,0.14], ports=[
        {'id':'attachment','position':[sign*-q(0.01),0,q(0.008)-q(0.06)]},
    ])
box('cutter-blade', [0.012,0.006,0.12-0.02], 'cutting-edge')
box('basket-panel', [1,0.125,1], 'basket-material', axes=(0,1,2), low=[0.001,0.001,0.001], high=[1.14,0.3,1.14])
box('basket-stop', [0.015,0.025,0.06], 'structural-metal')
box('basket-latch', [0.05,0.02,0.015], 'structural-metal', axes=(1,), low=[0.05,0.005,0.015], high=[0.05,0.03,0.015])
box('basket-support', [0.04,0.02,0.04], 'soft-contact')
for index in range(8):
    width = 0.07-2*index*(0.002+0.001)
    depth = 0.18-2*index*(0.002+0.001)
    wall, height = 0.002,0.24
    cells = []
    for sign in (-1,1):
        cells.append((cuboid((sign*(width-wall)/2,0,0),(wall,height,depth)),faces_box))
        cells.append((cuboid((0,0,sign*(depth-wall)/2),(width-2*wall,height,wall)),faces_box))
    stage = module('stage-housing' if index == 0 else f'stage-segment-{index}', cells, [width,height,depth], 'structural-metal')
    stage['cavity_faces'] = json.dumps([3,7,14,18])

# Polygonal rings use shared evaluated points at the seam, with each convex
# material sector closed independently. The cavity remains empty.
for label, scale in [('main',1),('wrist',0.5),('ankle',0.65),('hip',0.75)]:
    for role, inner, outer, low, high in [
        ('housing',0.05,0.065,-0.045,0.015),
        ('race',0.012,0.046,-0.045,-0.025),
        ('sleeve',0.012,0.046,-0.025,0.015),
        ('back-cap',0,0.065,-0.065,-0.045),
        ('outer-cap',0,0.049,0.015,0.026),
    ]:
        count = 16
        circle = [(math.cos(2*math.pi*i/count),math.sin(2*math.pi*i/count)) for i in range(count)]
        cells = []
        for i in range(count):
            u,v = circle[i], circle[(i+1)%count]
            section = [(inner*u[0]*scale,inner*u[1]*scale),(outer*u[0]*scale,outer*u[1]*scale),
                       (outer*v[0]*scale,outer*v[1]*scale),(inner*v[0]*scale,inner*v[1]*scale)]
            if inner == 0:
                section = section[:3]
            n = len(section)
            points = [(low*scale,y,z) for y,z in section] + [(high*scale,y,z) for y,z in section]
            polygons = [tuple(reversed(range(n))),tuple(range(n,2*n))]
            polygons += [(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
            cells.append((points,polygons))
        bearing = module(f'bearing-{label}-{role}', cells, [(high-low)*scale,outer*2*scale,outer*2*scale], 'joint-housing')
        if inner:
            bearing['cavity_faces'] = json.dumps([i*6+5 for i in range(count)])
destination.parent.mkdir(parents=True, exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(destination))
print(json.dumps({'modules':len(collection.objects),'blend':str(destination)}))
