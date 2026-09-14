"""Run with background Blender against source or revised authoring file."""
import bpy
scene = bpy.data.scenes['Action Factory - Short Preview']
bpy.context.window.scene = scene
assert scene.eevee.shadow_ray_count >= 4, 'Soft shadows need sufficient ray sampling'
assert not any(o.type == 'FONT' and o.data.body in ['INPUT', 'OUTPUT'] for o in scene.objects)
assert not any('gate sign' in o.name for o in scene.objects)
assert sorted(o.get('portal') for o in scene.objects if o.get('portal')) == ['input', 'output']
assert not any(o.type == 'FONT' and o.data.body == 'ONE SHARED FLOW' for o in scene.objects)
assert not any(o.get('source_object_name', o.name).startswith('Processing caption') for o in scene.objects)
labels = [o for o in scene.objects if o.get('station_label')]
assert len(labels) == 4
for frame in [1, 60, 180, 300, 420, 480]:
    scene.frame_set(frame)
    assert all(min(o.scale) > .99 and not o.hide_render for o in labels)
assert scene.frame_end == 480 and scene.render.fps == 30
assert len([o for o in scene.objects if o.get('role') == 'action_carrier']) == 1
print('FILM_SCENE_ACCEPTANCE_PASS')

# Optional direct pose comparison with the previously approved authoring source.
import sys
from pathlib import Path
if '--reference' in sys.argv:
    reference_path = Path(sys.argv[sys.argv.index('--reference') + 1])
    with bpy.data.libraries.load(str(reference_path), link=False) as (available, loaded):
        loaded.scenes = ['Action Factory - Short Preview']
    reference = loaded.scenes[0]
    reference_objects = {o.get('source_object_name', o.name): o for o in reference.objects}
    compared = 0
    for frame in [1, 16, 28, 42, 62, 82, 95, 109, 150, 190, 217, 258, 298, 325, 366, 407, 451, 480]:
        bpy.context.window.scene = reference
        reference.frame_set(frame)
        bpy.context.view_layer.update()
        matrices = {name: obj.matrix_world.copy() for name, obj in reference_objects.items()}
        bpy.context.window.scene = scene
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        for obj in scene.objects:
            key = obj.get('source_object_name')
            if key not in matrices or obj.type == 'FONT':
                continue
            delta = max(abs(obj.matrix_world[r][c] - matrices[key][r][c]) for r in range(4) for c in range(4))
            assert delta < .0001, (frame, obj.name, delta)
            compared += 1
    print('UNCHANGED_MECHANICAL_AND_CAMERA_POSES', compared)
