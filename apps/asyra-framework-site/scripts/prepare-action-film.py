"""Create the reviewed film revision; never overwrite the approved source."""
import argparse
from pathlib import Path
import sys
import bpy

args_parser = argparse.ArgumentParser()
args_parser.add_argument('--output', required=True)
args = args_parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
output = Path(args.output).resolve()
assert output.is_relative_to(Path(__file__).resolve().parents[3])
assert not output.exists(), 'Keep previously saved authoring files'
scene = bpy.data.scenes['Action Factory - Short Preview']
bpy.context.window.scene = scene
scene.frame_set(1)
for obj in list(scene.objects):
    source = obj.get('source_object_name', obj.name)
    if source.startswith(('Processing caption', 'Factory strapline', 'Belt end label')):
        bpy.data.objects.remove(obj, do_unlink=True)
    elif source.startswith('Process ') and ' label' in source:
        obj.animation_data_clear()
        obj.scale = (1, 1, 1)
        obj.data.size = .25
        obj['station_label'] = True

shell = next(m for m in bpy.data.materials if m.name.startswith('Porcelain alloy'))

def box(name, location, dimensions, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    bevel = obj.modifiers.new('Manufactured edges', 'BEVEL')
    bevel.width = .035
    bevel.segments = 3
    return obj

for name, x in [('Input', -6.85), ('Output', 6.85)]:
    # Open portal: two outside posts and a lintel safely above the carrier.
    for y in [-2.32, -.48]:
        box(name + ' gate post', (x, y, 1.22), (.19, .19, 2.04), shell)
    top = box(name + ' gate lintel', (x, -1.4, 2.33), (.25, 2.06, .22), shell)
    top['portal'] = name.lower()
scene.eevee.shadow_ray_count = 4
scene.eevee.shadow_step_count = 12
scene.eevee.taa_render_samples = 64
scene['film_detail_revision'] = 2
scene.frame_set(1)
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(output), check_existing=False, compress=True)
print('SAVED_FILM_REVISION', output, flush=True)
