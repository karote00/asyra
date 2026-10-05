# Street markings - unit corrections

Built-in image_gen, 2026-10-04. User instructions: one crossing bar per asset;
one road-line segment per asset; no asphalt underlay because the receiving
surface may instead be red brick. Source style: approved v2 sheets.

## Revision intent

v3 changed the array to one marking, but retained an asphalt preview surface.
v4 removes that surface entirely and requests genuine alpha transparency.
No light, shadow, highlight, outline, backing slab or road texture belongs to
the marking. The straight stripe, curve, dash and crossing bar are independent.

## Generation brief

One single flat paint marking, true top view, centered with transparent padding.
Remove asphalt, road slab, stone texture, substrate, background, labels, other
views and shadows. Preserve ivory/ochre pigment. Wear holes and the entire
outside area are transparent; do not draw a checkerboard. Use no grey pixels
to imitate the receiving road. One-unit dimensions come from the JSON; PNG
pixel dimensions are illustrative only.

## Review status

The user approved all four transparent v4 unit drawings on 2026-10-04 and
requested documentation completion. This approves appearance, not verified
production textures or 3D models. Apply the alpha channel when displaying them;
RGB in fully transparent pixels is not a background or an emissive halo.
