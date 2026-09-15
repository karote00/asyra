"""Render the completed runtime FK packet, with no authored replacement material."""
import argparse
import json
import math
from pathlib import Path
import sys
import bpy
from mathutils import Matrix, Quaternion, Vector

parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
project = Path(__file__).resolve().parents[3]
source_path, output = Path(args.input).resolve(), Path(args.output).resolve()
assert source_path.is_relative_to(project) and output.is_relative_to(project)
packet = json.loads(source_path.read_text())
assert packet['format'] == 'quadruped-source-review/1'
assert packet['axes'] == {'lateral':'+X','up':'+Y','longitudinal':'+Z','quaternion':'xyzw'}
assert [pose['name'] for pose in packet['poses']] == ['travel','bilateralHarvest','basketPlacement']
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 1100
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('Review World')
scene.world.color = (0.4,0.4,0.4)
palette = {'structural-cover':(0.72,0.75,0.70),'structural-metal':(0.09,0.10,0.09),
           'joint-housing':(0.05,0.065,0.055),'soft-contact':(0.1,0.12,0.1),
           'cutting-edge':(0.55,0.61,0.62),'basket-material':(0.65,0.64,0.54)}
materials = {}
for name,color in palette.items():
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color,1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color,1)
    shader.inputs['Roughness'].default_value = 0.45
    shader.inputs['Metallic'].default_value = 0.45 if name in ('structural-metal','joint-housing','cutting-edge') else 0.0
    materials[name] = material

def frame(value):
    x,y,z,w = value['rotation']
    return Matrix.Translation(Vector(value['position'])) @ Quaternion((w,x,y,z)).to_matrix().to_4x4()

def look_at(obj, target):
    forward = (Vector(target)-obj.location).normalized()
    up = Vector((0,1,0)) if abs(forward.y) < 0.999 else Vector((0,0,1))
    right = forward.cross(up).normalized()
    corrected_up = right.cross(forward).normalized()
    obj.rotation_euler = Matrix((right,corrected_up,-forward)).transposed().to_euler()

objects = {}
for part in packet['parts']:
    mesh = bpy.data.meshes.new(part['id'])
    p,i = part['shape']['positions'],part['shape']['indices']
    mesh.from_pydata([p[n:n+3] for n in range(0,len(p),3)],[],[i[n:n+3] for n in range(0,len(i),3)])
    mesh.update()
    obj = bpy.data.objects.new(part['id'],mesh)
    scene.collection.objects.link(obj)
    obj.data.materials.append(materials[part['material']])
    objects[part['id']] = obj
ground = bpy.data.meshes.new('Review Ground - XZ')
ground.from_pydata([(-4,0,-4),(-4,0,4),(4,0,4),(4,0,-4)],[],[(0,1,2,3)])
ground_obj = bpy.data.objects.new('Review Ground - XZ',ground)
scene.collection.objects.link(ground_obj)
for name,position,energy in [('Key',(3,5,-4),900),('Fill',(-4,3,-2),650),('Rim',(0,4,4),800)]:
    light = bpy.data.lights.new(name,'AREA')
    light.energy,light.shape,light.size = energy,'DISK',4
    obj = bpy.data.objects.new(name,light)
    scene.collection.objects.link(obj)
    obj.location = position
    look_at(obj, (0,1,0))
camera = bpy.data.objects.new('Review Camera',bpy.data.cameras.new('Review Camera'))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 3.6
output.mkdir(parents=True,exist_ok=True)
views = {'three-quarter':(4,2.5,-4),'front':(0,0,-5),'side':(5,0,0),'top':(0,6,0)}
records = []
focus_views = {
    'travel': {
        'shoulder-closeup': ['left-holder-rootYaw','left-holder-rootPitch','left-holder-root-yoke'],
        'leg-closeup': ['left-front-hip','left-front-knee','left-front-ankle','left-front-foot'],
    },
    'bilateralHarvest': {
        'holder-closeup': ['left-holder-wrist','left-holder-tool'],
        'cutter-closeup': ['left-cutter-wrist','left-cutter-tool'],
    },
    'basketPlacement': {'holder-closeup': ['left-holder-wrist','left-holder-tool']},
}
for pose in packet['poses']:
    transforms = {item['id']:frame(item['transform']) for item in pose['bodyTransforms']}
    for part in packet['parts']:
        objects[part['id']].matrix_world = transforms[part['bodyId']] @ frame(part['localFrame'])
    selected_views = [(name, offset, list(objects)) for name, offset in views.items()]
    for name, prefixes in focus_views[pose['name']].items():
        selected = [name for name in objects if any(name.startswith(prefix) for prefix in prefixes)]
        assert selected
        offset = (-4,1.5,4) if name == 'leg-closeup' else (-4,5,4) if name == 'cutter-closeup' else (4,2.5,-4)
        selected_views.append((name, offset, selected))
    for name,offset,selected in selected_views:
        points = [objects[id].matrix_world @ vertex.co for id in selected for vertex in objects[id].data.vertices]
        lower = Vector(tuple(min(point[axis] for point in points) for axis in range(3)))
        upper = Vector(tuple(max(point[axis] for point in points) for axis in range(3)))
        target = (lower+upper)/2
        corners = [Vector((x,y,z)) for x in (lower.x,upper.x) for y in (lower.y,upper.y) for z in (lower.z,upper.z)]
        camera.location = target+Vector(offset)
        look_at(camera, target)
        inverse = camera.rotation_euler.to_matrix().transposed()
        projected = [inverse @ (point-target) for point in corners]
        camera.data.ortho_scale = 1.15 * max(max(p[axis] for p in projected)-min(p[axis] for p in projected) for axis in (0,1))
        path = output/(pose['name']+'-'+name+'.png')
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        records.append({'pose':pose['name'],'view':name,'path':str(path.relative_to(project)),
                        'orthographicScale':camera.data.ortho_scale,'resolution':[1100,1100],
                        'focusPartIds':selected,'focusBounds':{'min':list(lower),'max':list(upper)}})
(output/'views.json').write_text(json.dumps({'source':str(source_path.relative_to(project)),'parts':len(packet['parts']),'views':records},indent=2)+'\n')
