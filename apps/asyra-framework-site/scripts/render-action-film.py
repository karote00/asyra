"""Export the approved factory scene without opening the Blender UI.

Run with Blender --background <approved.blend> --threads 2 --python this_file
-- --output-dir <project-owned directory> [--probe] [--crf 26].
The input .blend is read-only. Probe output is separate from the final export.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import time

import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--output-dir', required=True)
parser.add_argument('--probe', action='store_true')
parser.add_argument('--review-stills', action='store_true')
parser.add_argument('--crf', type=int, default=26)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
output = Path(args.output_dir).resolve()
project = Path(__file__).resolve().parents[3]
assert output.is_relative_to(project), 'Output must remain inside the project'
assert 0 <= args.crf <= 51
output.mkdir(parents=True, exist_ok=True)
source = Path(bpy.data.filepath)
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
scene = bpy.data.scenes['Action Factory - Short Preview']
assert scene.frame_start == 1 and scene.frame_end == 480
assert scene.render.fps == 30
assert scene.get('source_pose_validated') and scene.get('same_carrier')
bpy.context.window.scene = scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 2560
scene.render.resolution_y = 1600
scene.render.resolution_percentage = 100
scene.render.threads_mode = 'FIXED'
scene.render.threads = 2
scene.eevee.taa_render_samples = 64
scene.render.use_file_extension = True
stem = 'probe' if args.probe else 'action-flow-hd'
scene.render.image_settings.media_type = 'IMAGE'
scene.render.image_settings.file_format = 'PNG'
if args.review_stills:
    for frame in [1, 60, 180, 300, 420, 480]:
        scene.frame_set(frame)
        scene.render.filepath = str(output / f'review-{frame}.png')
        bpy.ops.render.render(write_still=True)
    sys.exit(0)
scene.frame_set(180 if args.probe else 1)
scene.render.filepath = str(output / f'{stem}-poster.png')
bpy.ops.render.render(write_still=True)
scene.render.image_settings.media_type = 'VIDEO'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.ffmpeg.audio_codec = 'NONE'
scene.render.ffmpeg.constant_rate_factor = 'CUSTOM'
scene.render.ffmpeg.custom_constant_rate_factor = args.crf
scene.render.ffmpeg.ffmpeg_preset = 'BEST'
scene.render.ffmpeg.gopsize = 60
scene.render.ffmpeg.use_max_b_frames = True
scene.render.ffmpeg.max_b_frames = 2
scene.frame_start = 120 if args.probe else 1
scene.frame_end = 149 if args.probe else 480
scene.render.filepath = str(output / f'{stem}.mp4')
started = time.monotonic()

def report_progress(current_scene):
    if current_scene.frame_current % 30 == 0:
        print(f'EXPORT_PROGRESS frame={current_scene.frame_current} elapsed={time.monotonic()-started:.1f}s', flush=True)

bpy.app.handlers.render_post.append(report_progress)
try:
    bpy.ops.render.render(animation=True)
finally:
    bpy.app.handlers.render_post.remove(report_progress)
video = output / f'{stem}.mp4'
(output / f'{stem}.json').write_text(json.dumps({
    'sourceSha256': source_hash,
    'sourceScene': scene.name,
    'resolution': [2560, 1600],
    'samples': scene.eevee.taa_render_samples,
    'shadowRays': scene.eevee.shadow_ray_count,
    'shadowSteps': scene.eevee.shadow_step_count,
    'codec': 'H264',
    'crf': args.crf,
    'frames': [scene.frame_start, scene.frame_end],
    'fps': 30,
    'bytes': video.stat().st_size,
    'sha256': hashlib.sha256(video.read_bytes()).hexdigest(),
    'elapsedSeconds': round(time.monotonic() - started, 2)
}, indent=2) + '\n')
print(f'EXPORT_COMPLETE {video} bytes={video.stat().st_size}', flush=True)
