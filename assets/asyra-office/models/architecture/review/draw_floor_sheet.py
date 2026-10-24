"""Draw a dimension-driven review sheet, not a model or production texture."""

import base64
import io
import json
import math
import os
from pathlib import Path
from xml.sax.saxutils import escape

import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
SPEC_PATH = ROOT.parent / "architecture-model-spec.json"
SPEC = json.loads(SPEC_PATH.read_text())
PLANK = next(item for item in SPEC["modules"] if item["moduleId"] == "floor-plank")
LENGTH, WIDTH, HEIGHT = PLANK["overallSizeMetres"]
SCALE = 900  # Shared pixels per metre in all views.
SUPERSAMPLE = 3
SIZE = (2400, 1240)
INK = "#635747"
TEXT = "#4C535D"
CANVAS = Image.new("RGB", tuple(v * SUPERSAMPLE for v in SIZE), "white")
DRAW = ImageDraw.Draw(CANVAS)
SVG = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE[0]}" height="{SIZE[1]}" viewBox="0 0 {SIZE[0]} {SIZE[1]}">', '<rect width="100%" height="100%" fill="white"/>']
FONT_PATH = os.environ.get("DRAWING_FONT_PATH", "/System/Library/Fonts/Supplemental/Arial.ttf")
ALBEDO_PATH = ROOT.parent / "materials/floor-natural-oak-v1.png"
ALBEDO = np.asarray(Image.open(ALBEDO_PATH).convert("RGB"), dtype=np.float32)
PLAIN_OAK = ALBEDO.mean(axis=(0, 1))


def text(x, y, value, size=25, centered=False):
    font = ImageFont.truetype(FONT_PATH, size * SUPERSAMPLE)
    anchor = "mt" if centered else "lt"
    DRAW.text((x * SUPERSAMPLE, y * SUPERSAMPLE), value, font=font, fill=TEXT, anchor=anchor)
    alignment = "middle" if centered else "start"
    SVG.append(f'<text x="{x}" y="{y}" font-family="Arial, sans-serif" font-size="{size}" fill="{TEXT}" text-anchor="{alignment}" dominant-baseline="text-before-edge">{escape(value)}</text>')


def texture(u, v, grain):
    """Sample the selected natural albedo in physical face coordinates."""
    if not grain:
        return np.broadcast_to(PLAIN_OAK, (*u.shape, 3)).copy()
    height, width = ALBEDO.shape[:2]
    x = np.clip((u + LENGTH / 2) / LENGTH * (width - 1), 0, width - 1)
    y = np.clip((0.5 - v / WIDTH) * (height - 1), 0, height - 1)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    x1, y1 = np.minimum(x0 + 1, width - 1), np.minimum(y0 + 1, height - 1)
    dx, dy = (x - x0)[..., None], (y - y0)[..., None]
    upper = ALBEDO[y0, x0] * (1 - dx) + ALBEDO[y0, x1] * dx
    lower = ALBEDO[y1, x0] * (1 - dx) + ALBEDO[y1, x1] * dx
    return upper * (1 - dy) + lower * dy


def face(origin, u_axis, v_axis, u_range, v_range, grain):
    """Project a rectangular physical face through an affine map in metres."""
    origin = np.array(origin, dtype=float)
    matrix = np.column_stack([u_axis, v_axis])
    corners = np.array([origin + matrix @ np.array([u, v]) for u, v in [(u_range[0], v_range[0]), (u_range[1], v_range[0]), (u_range[1], v_range[1]), (u_range[0], v_range[1])]])
    lower = np.floor(corners.min(axis=0) - 2).astype(int)
    upper = np.ceil(corners.max(axis=0) + 2).astype(int)
    width, height = (upper - lower) * SUPERSAMPLE
    py, px = np.mgrid[:height, :width]
    samples = np.stack([(px + 0.5) / SUPERSAMPLE + lower[0] - origin[0], (py + 0.5) / SUPERSAMPLE + lower[1] - origin[1]])
    uv = np.einsum("ij,jkl->ikl", np.linalg.inv(matrix), samples)
    pixels = np.uint8(np.clip(texture(uv[0], uv[1], grain), 0, 255))
    patch = Image.fromarray(pixels)
    mask = Image.new("L", (width, height), 0)
    points = [tuple((p - lower) * SUPERSAMPLE) for p in corners]
    ImageDraw.Draw(mask).polygon(points, fill=255)
    CANVAS.paste(patch, tuple(lower * SUPERSAMPLE), mask)
    DRAW.line([tuple(p * SUPERSAMPLE) for p in [*corners, corners[0]]], fill=INK, width=2, joint="curve")
    # Preserve exact vector boundaries; embed only the intrinsic texture patch.
    png = io.BytesIO()
    patch.save(png, format="PNG")
    data = base64.b64encode(png.getvalue()).decode("ascii")
    identifier = f"face-{len(SVG)}"
    polygon = " ".join(f"{x:.8f},{y:.8f}" for x, y in corners)
    SVG.append(f'<defs><clipPath id="{identifier}"><polygon points="{polygon}"/></clipPath></defs>')
    SVG.append(f'<image x="{lower[0]}" y="{lower[1]}" width="{width / SUPERSAMPLE}" height="{height / SUPERSAMPLE}" href="data:image/png;base64,{data}" clip-path="url(#{identifier})"/>')
    SVG.append(f'<polygon points="{polygon}" fill="none" stroke="{INK}" stroke-width="{2 / SUPERSAMPLE}"/>')
    return corners.tolist()


def main():
    text(110, 70, "FLOOR - ONE PLANK", 42)
    length_mm, width_mm, height_mm = (f"{v * 1000:g}" for v in (LENGTH, WIDTH, HEIGHT))
    text(110, 133, f"{length_mm} x {width_mm} x {height_mm} mm", 26)
    front = face((110 + SCALE * LENGTH / 2, 355), (SCALE, 0), (0, -SCALE), (-LENGTH / 2, LENGTH / 2), (0, HEIGHT), True)
    side = face((1820, 355), (SCALE, 0), (0, -SCALE), (-WIDTH / 2, WIDTH / 2), (0, HEIGHT), False)
    top = face((110 + SCALE * LENGTH / 2, 755), (SCALE, 0), (0, -SCALE), (-LENGTH / 2, LENGTH / 2), (-WIDTH / 2, WIDTH / 2), True)
    for cx, y, label, dimension in [(650, 395, "FRONT", f"{length_mm} x {height_mm} mm"), (1820, 395, "SIDE", f"{width_mm} x {height_mm} mm"), (650, 880, "TOP", f"{length_mm} x {width_mm} mm")]:
        text(cx, y, label, 25, True)
        text(cx, y + 37, dimension, 20, True)

    # One orthographic camera: azimuth -60 degrees, elevation 35 degrees.
    azimuth, elevation = math.radians(-60), math.radians(35)
    right = np.array([-math.sin(azimuth), math.cos(azimuth), 0])
    up = np.array([-math.sin(elevation) * math.cos(azimuth), -math.sin(elevation) * math.sin(azimuth), math.cos(elevation)])
    projection = SCALE * np.array([right, -up])
    origin = np.array([1820, 780])
    x_axis, y_axis, z_axis = projection.T
    # Broad top, front long face and right short end use the same vertices.
    face(origin + z_axis * HEIGHT, x_axis, y_axis, (-LENGTH / 2, LENGTH / 2), (-WIDTH / 2, WIDTH / 2), True)
    face(origin - y_axis * WIDTH / 2, x_axis, z_axis, (-LENGTH / 2, LENGTH / 2), (0, HEIGHT), True)
    face(origin + x_axis * LENGTH / 2, y_axis, z_axis, (-WIDTH / 2, WIDTH / 2), (0, HEIGHT), False)
    text(1820, 1040, "THREE-QUARTER", 25, True)
    text(110, 1150, "Orthographic views share one scale. Outline shows the outer envelope.", 21)
    text(110, 1184, "Edge bevel: 1 mm, 2 segments. No shadows or baked lighting.", 21)
    SVG.append("</svg>")
    stem = ROOT / "02-floor-v7"
    CANVAS.resize(SIZE, Image.Resampling.LANCZOS).save(stem.with_suffix(".png"))
    stem.with_suffix(".svg").write_text("\n".join(SVG))
    summary = {
        "status": "dimension-driven drawing approved 2026-10-06; not a model",
        "specification": "../architecture-model-spec.json",
        "moduleId": PLANK["moduleId"],
        "sizeMetres": [LENGTH, WIDTH, HEIGHT],
        "pixelsPerMetre": SCALE,
        "orthographicBoundsPixels": {"front": front, "side": side, "top": top},
        "ratios": {"front": LENGTH / HEIGHT, "side": WIDTH / HEIGHT, "top": LENGTH / WIDTH},
        "obliqueProjection": {"azimuthDegrees": -60, "elevationDegrees": 35, "matrix": projection.tolist()},
        "bevelRepresentation": "outer-envelope drawing; the 1 mm bevel remains specified, not resolved as bevel facets",
        "material": "natural oak albedo approved 2026-10-06; plain oak short ends",
        "albedoSource": "../materials/" + ALBEDO_PATH.name,
        "plainOakSRGB": PLAIN_OAK.tolist(),
    }
    stem.with_suffix(".json").write_text(json.dumps(summary, indent=2) + "\n")
    print("Wrote 02-floor-v7.png, .svg and .json")


if __name__ == "__main__":
    main()
