"""Background Blender preparation of approved side panels; no runtime remeshing."""
import bpy
import bmesh
import json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

root = Path(__file__).resolve().parents[3]
data = json.loads((root / 'tmp/blender/armchair-panels-input.json').read_text())
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
result = {'sourceSha256': data['sourceSha256'], 'voxelSize': .003, 'relaxation': {'factor': .8, 'iterations': 25}, 'panels': {}}

def export_mesh(obj):
    obj.data.calc_loop_triangles()
    return {
        'positions': [round(v, 8) for p in obj.data.vertices for v in p.co],
        'indices': [i for t in obj.data.loop_triangles for i in t.vertices],
        'uvs': [v for p in obj.data.vertices for v in (round(p.co.y,8),round(p.co.z,8))]
    }

for panel in data['panels']:
    config=next(c for c in data['components'] if c['partId']==panel['id'])
    outline=[]
    for control in config['outlineControlYZ']:
        for step in range(16):
            t=step/16
            p=[Vector(v) for v in control]
            while len(p)>1: p=[a*(1-t)+b*t for a,b in zip(p,p[1:])]
            outline.append(p[0])
    half=config['thickness']/2
    vertices=[(config['centreX']+side*half,p.x,p.y) for side in [-1,1] for p in outline]
    n=len(outline)
    faces=[list(range(n-1,-1,-1)),list(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(panel['id'])
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    bm=bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh); bm.free()
    obj=bpy.data.objects.new(panel['id'],mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active=obj
    obj.select_set(True)
    # Round the closed extrusion on a uniform volumetric grid, before taper.
    obj.data.remesh_voxel_size=.003
    bpy.ops.object.voxel_remesh()
    smooth=obj.modifiers.new('Upholstery roundover','SMOOTH')
    smooth.factor=.8
    smooth.iterations=25
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    obj.data.calc_loop_triangles()
    simplify=obj.modifiers.new('Master topology','DECIMATE')
    simplify.ratio=min(1,6000/len(obj.data.loop_triangles))
    bpy.ops.object.modifier_apply(modifier=simplify.name)
    for p in obj.data.vertices:
        t=max(0,min(1,(p.co.z-config['taperStartZ'])/(config['taperEndZ']-config['taperStartZ'])))
        p.co.x -= (-1 if config['centreX']<0 else 1)*config['taperX']*t*t*(3-2*t)
    for polygon in obj.data.polygons: polygon.use_smooth=True
    triangulate=obj.modifiers.new('Stable master triangles','TRIANGULATE')
    bpy.ops.object.modifier_apply(modifier=triangulate.name)
    near=export_mesh(obj)
    # Each separate part retains its authoring origin and original physical pose.
    distant=obj.copy()
    distant.data=obj.data.copy()
    bpy.context.collection.objects.link(distant)
    bpy.context.view_layer.objects.active=distant
    modifier=distant.modifiers.new('Distant topology','DECIMATE')
    modifier.ratio=.7
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    far=export_mesh(distant)
    def tree(m):
        pts=[Vector(m['positions'][i:i+3]) for i in range(0,len(m['positions']),3)]
        tris=[m['indices'][i:i+3] for i in range(0,len(m['indices']),3)]
        return pts,tris,BVHTree.FromPolygons(pts,tris,all_triangles=True)
    np,nt,nb=tree(near)
    fp,ft,fb=tree(far)
    error=0
    certificate=0
    def certify(a,b,c,target,depth=0):
        global error, certificate
        centre=(a+b+c)/3
        distance=target.find_nearest(centre)[3]
        radius=max((v-centre).length for v in (a,b,c))
        error=max(error,distance)
        upper=distance+radius
        if upper <= .003:
            certificate=max(certificate,upper)
            return
        if distance>.003 or depth>=12:
            raise RuntimeError(f'Cannot certify LoD: {panel["id"]} distance={distance} radius={radius} depth={depth}')
        ab,bc,ca=(a+b)/2,(b+c)/2,(c+a)/2
        for tri in [(a,ab,ca),(ab,b,bc),(ca,bc,c),(ab,bc,ca)]:
            certify(*tri,target,depth+1)
    # Distance to a closed triangle mesh is 1-Lipschitz. Subdivide each triangle
    # until centre distance + covering radius proves the complete triangle bound.
    for pts,tris,target in [(np,nt,fb),(fp,ft,nb)]:
        for tri in tris: certify(*(pts[i] for i in tri),target)
    result['panels'][panel['id']]={'mesh':near,'distant':{'mesh':far,'maxError':.003},'sampledError':error,'certifiedUpperBound':certificate}
    bpy.data.objects.remove(distant,do_unlink=True)
    obj.select_set(False)
    print(panel['id'],len(near['indices'])//3,len(far['indices'])//3,'sampled error',error)
output=root/'apps/asyra-office/src/assets/generated/armchair-panels.json'
output.write_text(json.dumps(result,separators=(',',':'))+'\n')
model_path=root/'tmp/office-authoring/armchair-panels.blend'
model_path.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(model_path))
