"""Replace only SIDE with the numeric Y/Z profile; preserve other sheet pixels."""

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
SPEC = json.loads((ROOT.parent / "architecture-model-spec.json").read_text())
PARTITION = next(item for item in SPEC["modules"] if item["moduleId"] == "partition-segment")
BODY, CAP = PARTITION["components"]
SOURCE = Image.open(ROOT / "03-partition-v3.png").convert("RGB")
INK = "#423D37"
FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
ZOOM = 4


def bounds(part):
    return [(c - s / 2, c + s / 2) for c, s in zip(part["centreMetres"], part["sizeMetres"])]


def profile(part, scale, centre, baseline):
    """True +X orthographic projection with the prescribed 4 mm upper bevel."""
    _, (low_y, high_y), (low_z, high_z) = bounds(part)
    left, right = centre + low_y * scale, centre + high_y * scale
    top, bottom = baseline - high_z * scale, baseline - low_z * scale
    radius = 0.004 * scale
    points = [(left, bottom), (left, top + radius)]
    for angle in (180, 225, 270):
        radians = math.radians(angle)
        points.append((left + radius + radius * math.cos(radians), top + radius + radius * math.sin(radians)))
    for angle in (270, 315, 360):
        radians = math.radians(angle)
        points.append((right - radius + radius * math.cos(radians), top + radius + radius * math.sin(radians)))
    points.append((right, bottom))
    return points, (left, top, right, bottom)


def paint(part, image, scale, centre, baseline, swatch):
    points, box = profile(part, scale, centre, baseline)
    draw = ImageDraw.Draw(image)
    # Cropped intrinsic plaster colour from the existing sheet, without edges.
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    left, top, right, bottom = box
    layer = Image.new("RGB", image.size, "white")
    pixel_box = (math.floor(left), math.floor(top), math.ceil(right), math.ceil(bottom))
    patch = ImageOps.fit(swatch, (pixel_box[2] - pixel_box[0], pixel_box[3] - pixel_box[1]), method=Image.Resampling.LANCZOS)
    layer.paste(patch, pixel_box[:2])
    image.paste(layer, (0, 0), mask)
    draw.line(points + [points[0]], fill=INK, width=max(1, min(5, round(scale / 240))), joint="curve")
    return box


def label(draw, x, y, value, size=22):
    draw.text((x, y), value, fill=INK, font=ImageFont.truetype(FONT, size), anchor="mt")


def main():
    body_swatch = SOURCE.crop((1139, 155, 1191, 440))
    cap_swatch = SOURCE.crop((185, 128, 700, 137))
    # Replace the old tilted SIDE only, retaining title and all other views.
    region = (1090, 90, 1240, 490)
    width, height = region[2] - region[0], region[3] - region[1]
    local = Image.new("RGB", (width * ZOOM, height * ZOOM), "white")
    total_height = PARTITION["overallSizeMetres"][2]
    scale = 364 / total_height
    centre, baseline = 1163, 477
    local_centre, local_base = (centre - region[0]) * ZOOM, (baseline - region[1]) * ZOOM
    body_box = paint(BODY, local, scale * ZOOM, local_centre, local_base, body_swatch)
    cap_box = paint(CAP, local, scale * ZOOM, local_centre, local_base, cap_swatch)
    result = SOURCE.copy()
    result.paste(local.resize((width, height), Image.Resampling.LANCZOS), region[:2])
    result.save(ROOT / "03-partition-v5.png")

    # Independent same-projection magnification of the top junction.
    detail = Image.new("RGB", (840, 570), "white")
    detail_scale = 3000
    detail_centre = 420
    detail_base = 140 + total_height * detail_scale
    paint(BODY, detail, detail_scale, detail_centre, detail_base, body_swatch)
    paint(CAP, detail, detail_scale, detail_centre, detail_base, cap_swatch)
    draw = ImageDraw.Draw(detail)
    label(draw, 420, 20, "SIDE - ORTHOGRAPHIC TOP DETAIL", 25)
    label(draw, 420, 64, "170 mm cap - 140 mm body", 23)
    label(draw, 420, 99, "15 mm overhang on each side", 22)
    for x, end in [(165, 210), (630, 675)]:
        draw.line([(x, 370), (end, 370)], fill=INK, width=2)
        for boundary in [x, end]:
            draw.line([(boundary, 357), (boundary, 383)], fill=INK, width=2)
    label(draw, 113, 394, "15 mm", 21)
    label(draw, 727, 394, "15 mm", 21)
    detail.save(ROOT / "03-partition-v5-side-detail.png")
    data = {
        "status": "drawing approved by user on 2026-10-06; no model approval",
        "sourceSheet": "03-partition-v3.png",
        "replacedRegionPixels": list(region),
        "projection": "+X axis orthographic; horizontal +Y, vertical +Z",
        "bodyBoundsMetres": bounds(BODY),
        "capBoundsMetres": bounds(CAP),
        "overhangPerSideMetres": (CAP["sizeMetres"][1] - BODY["sizeMetres"][1]) / 2,
        "upperBevelRadiusMetres": 0.004,
        "upperBevelSegments": 2,
        "bodyBoundsSupersampledPixels": body_box,
        "capBoundsSupersampledPixels": cap_box,
        "pixelScalePerMetre": scale,
        "materials": "appearance swatches cropped from v3; no new material design or lighting",
    }
    (ROOT / "03-partition-v5-side.json").write_text(json.dumps(data, indent=2) + "\n")
    print("Wrote partition v5 sheet, true SIDE detail and projection data.")


if __name__ == "__main__":
    main()
