"""Export only original body-local material triangles; never a second rig."""
import argparse
import hashlib
import json
from fractions import Fraction
from pathlib import Path
import sys
import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--template', required=True)
parser.add_argument('--manifest', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
project = Path(__file__).resolve().parents[3]
template_path = Path(args.template).resolve()
manifest_path = Path(args.manifest).resolve()
source_path = Path(bpy.data.filepath).resolve()
assert all(path.is_relative_to(project) for path in (template_path,manifest_path,source_path))

def module_record(obj):
    mesh = obj.data
    mesh.calc_loop_triangles()
    positions = [float(coordinate) for vertex in mesh.vertices for coordinate in vertex.co]
    regions, indices, patches = [], [], []
    polygon_start = 0
    for cell_index, count in enumerate(json.loads(obj['cell_face_counts'])):
        triangles = [triangle for triangle in mesh.loop_triangles if polygon_start <= triangle.polygon_index < polygon_start+count]
        region = {'id':f'material-cell-{cell_index}','kind':'closed-solid','indexStart':len(indices),'indexCount':3*len(triangles),'convex':True}
        regions.append(region)
        for triangle in triangles:
            start = len(indices)
            indices.extend(triangle.vertices)
            polygon = mesh.polygons[triangle.polygon_index]
            if triangle.polygon_index in json.loads(obj.get('cavity_faces','[]')):
                patches.append({'id':'cavity-'+str(start//3),'regionId':region['id'],'ranges':[{'indexStart':start,'indexCount':3}],'witnessTriangle':start//3})
            points = [tuple(float(value) for value in mesh.vertices[index].co) for index in triangle.vertices]
            u = [Fraction(points[1][axis])-Fraction(points[0][axis]) for axis in range(3)]
            v = [Fraction(points[2][axis])-Fraction(points[0][axis]) for axis in range(3)]
            normal = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]
            # Original coordinates are authoritative; Blender's normalized float
            # polygon normal can be slightly below one even for an axis face.
            for axis, label in enumerate(('x','y','z')):
                if points[0][axis] == points[1][axis] == points[2][axis] and normal[axis] != 0:
                    tag = label + ('-high' if normal[axis] > 0 else '-low')
                    patches.append({'id':tag+'-'+str(start//3),'regionId':region['id'],'ranges':[{'indexStart':start,'indexCount':3}],'witnessTriangle':start//3})
        polygon_start += count
    ports = json.loads(obj['ports'])
    for axis,label in enumerate(('x','y','z')):
        values = positions[axis::3]
        for bound,suffix in [(min(values),'low'),(max(values),'high')]:
            point = [0,0,0]
            point[axis] = bound
            port = {'id':label+'-'+suffix,'position':point}
            if 'axial_weights' in obj:
                port['axialWeight'] = int(axis == 2 and suffix == 'high')
            ports.append(port)
    record = {'id':obj['module_id'],'material':obj['material_id'],'size':json.loads(obj['size']),
            'dimensions':json.loads(obj['dimensions']),'positions':positions,'indices':indices,'regions':regions,
            'patches':patches,'ports':ports,'maxRepeat':64}
    if 'axial_weights' in obj:
        record['axialWeights'] = json.loads(obj['axial_weights'])
    return record

modules = sorted((module_record(obj) for obj in bpy.data.collections['SOURCE_MODULES'].objects),key=lambda value:value['id'])
template = {
    'format':'quadruped-source-template/2','templateId':'side-stage-articulation-2','sourceProfile':'side-stage-articulation/2',
    'units':{'linear':'metre','angular':'radian','scale':1},
    'axes':{'handedness':'right','lateral':'+X','up':'+Y','longitudinal':'+Z','quaternion':'xyzw'},
    'evidence':{'kind':'synthetic','id':'industrial-quadruped-materials','label':'Synthetic material design - hardware capability unverified'},
    'modules':modules,
}
template_bytes = (json.dumps(template,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode()
manifest = {'format':'quadruped-source-manifest/2','templateId':template['templateId'],
            'templateSha256':hashlib.sha256(template_bytes).hexdigest(),
            'blendSha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),
            'generator':'scripts/fieldscope/blender/build-quadruped-source.py',
            'exporter':'scripts/fieldscope/blender/export-quadruped-source.py',
            'blenderVersion':bpy.app.version_string}
for path in (template_path,manifest_path):
    path.parent.mkdir(parents=True,exist_ok=True)
template_path.write_bytes(template_bytes)
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'moduleCount':len(modules),'triangleCount':sum(len(module['indices'])//3 for module in modules),
                  'templateSha256':manifest['templateSha256']}))
