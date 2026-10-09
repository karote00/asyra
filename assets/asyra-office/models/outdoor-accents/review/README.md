# Group 4J - Outdoor Accent Review

Status: **V4 failed visual review; procedural generation selected for the bench**.
Shared construction checks passed for the retained proposal, not source fidelity.
The user approved the annotated entry chalkboard reference and revised
construction documents on 2026-10-10. No model or app implementation is included in this documentation stage.

- [Rejected V4 bench candidate - retained evidence](01-park-bench-v4.png)
- [Original appearance reference](01-park-bench-v1.png)
- [Entry chalkboard - annotated sheet](02-entry-chalkboard-annotated-v1.png)
- [Entry chalkboard - unchanged original](02-entry-chalkboard-v1.png)

## Bounded revision contract

Current disposition: documentation-only production-method designation. Defer
further illustrated redraws and do not generate a model or implement runtime
behavior in this step. Keep original v1 and rejected evidence. The construction
and reproduction instructions below document the prior attempt; they do not
certify its dimensions or shapes for production. The JSON status and recorded
review reports retain the prior run metadata for reproducibility; this review
disposition supersedes their pending-review wording.

Latest review found a protruding rear arm tip, an overly tight front bend,
insufficiently rounded under-seat support contours, and an uncalibrated height
estimate. The eight checks assert construction consistency and authored defaults;
they do not establish appearance fidelity. Future procedural output must resolve
these findings and undergo multi-view and enlarged-detail review against v1.

Association: ongoing Office asset reference/specification review, park bench
only. This replaces the TOP-only plan retained under
`historical/top-only-v3/`; it does not implement or prove a runtime/Inspector
step. Preserve source v1, other assets, default material regions and overall
sizing behavior. Correct this bench's construction, reference projection and
direct documentation only. No model generation or runtime implementation.

Every candidate view must use the same geometry. No copied candidate views,
independent part placement or nonuniform image stretch. Required gates cover
bounds, source BACK width ratios, slat counts, all intended joins, forbidden
arm/wood intersections, camera bases and saved-artifact/input identity. Visual
review compares all five views and enlarged joins; a technical pass cannot
substitute for source fidelity. User approval remains separate.

## One construction, five projections

`bench_geometry.py` owns the numeric construction and analytic checks.
`bench_projection.py` draws the same primitives through five explicit cameras.
`compose-bench-reference.py` supplies annotations, preserves hashes and saves
an immutable run under `bench-review-runs/<input-and-generator-digest>/`.
Each retained run includes the specification, generator text, per-view PNGs,
final sheet and report. The active filenames point to the latest candidate.

```sh
OPENBLAS_NUM_THREADS=1 python3 compose-bench-reference.py
python3 compare_bench_reference.py
OPENBLAS_NUM_THREADS=1 python3 test_bench_reference.py
```

All views use 800 px/m and 2x antialiasing. FRONT, RIGHT and BACK are true
orthographic elevations; TOP is overhead; THREE-QUARTER uses
25-degree azimuth and 23-degree elevation. These are explicit authored cameras,
not verified source-camera calibration. The colour family and interior wood
samples come from v1. Contours identify geometric face/cap boundaries without
adding shadows, AO or directional illumination. No new texture assets are made.

## Completed technical checks

- Old pipeline fails the permanent five-view construction test at FRONT: it
  used a copied image rather than shared geometry.
- Eight focused tests cover shared geometry, orthonormal camera bases, the
  previous penetrating arm, descending arm profile, source-proportion defaults
  and back/seat gap, construction contacts and bounds, geometry response in
  every view, and input/output hashes.
- Six back/post contacts, sixteen frame/seat contacts and two arm/metal joins
  pass. Fourteen complete arm/wood exclusion bounds pass the 2 mm minimum;
  the smallest conservative bound is 7.648688 mm.
- Removing the back slats changes every projection. No view can remain an
  unchanged source crop while the numeric construction changes.
- The original flat arm route failed source profile review. After default-size reconciliation, the crown is
  460 mm and the rear attachment descends to 410 mm. The rear turn is shortened
  from Y=260 to 240 mm. Metal joins and wood exclusion still pass.

## Source-proportion reconciliation

Whole-view inspection invalidated keeping the previous 730 mm height and
360 mm seat default. The source FRONT bounds have 556:302 width/height ratio;
at width 1200 mm this suggests 651.8 mm. The reconciled authored height is
650 mm. Seat top 340 mm leaves a 17.549553 mm back/seat gap with the same back
slat sizes and pitch. Rear caps, bend, arm elevations, supports, crossrails,
depth and ground-centred origin are recalculated together. Defaults are now
1200 x 508.955165475 x 650 mm. These are proposed construction defaults, not
physical measurements recovered from calibrated cameras.

The previous candidate fails the permanent revised-default and arm-height
checks; the reconciled candidate passes all eight checks. Original BACK width
ratios, four seat boards, three back boards, material defaults and sign remain
unchanged. This is a bounded revision of the failed height/spacing assumption,
not per-view shape deformation.

## Visual review and remaining approval boundary

The complete 3072 x 2048 sheet, five individual views and source comparisons
were inspected. Rear-return, arm/post, caps and seat/support crops were also
inspected. Source/candidate comparisons use uniform width alignment and a
common bottom datum; they are diagnostic overlays, not calibrated matches.
The report records native crop sizes and scaling. The 3x local crops enlarge
saved pixels; they do not claim new source detail.

At a common 780 px object width, current candidate-minus-source height
residuals are FRONT -2 px, RIGHT -30 px, BACK -10 px, TOP +24 px and
THREE-QUARTER -1 px. The former common-projection candidate was +95 / +61 /
+30 / +33 / +45 px respectively. These describe full-view image bounds, not
an overall similarity score or proof that every contour matches.

- The former excessive opening under the backrest is reduced. The candidate's
  rounded rise now descends at the rear, and the shortened return remains
  continuously connected without cutting through wood.
- All candidate views are projections of the same components. True elevations
  put coplanar feet on a common baseline and hide seat upper faces. The source
  illustrations use different, uncalibrated elevated/perspective conventions.
- TOP now includes the inclined backrest footprint rather than preserving the
  original TOP omission. It shares geometry with the other four views.
- The hidden rear arm return is an explicit authored construction completion;
  its contour is not claimed to be a recovered original hidden surface. User
  review rejected that contour; the completion and revised defaults are unapproved.
- Source wood and dark metal remain legible without recolouring or new shadows.
  The drawing's surface samples are not production texture assets.

Technical checks establish numeric coherence, contacts and nonpenetration.
They do not establish 100-percent source equivalence, calibrated original
cameras or production mesh quality. The candidate failed visual review. Selecting
procedural generation does not approve it or authorize model implementation.

## Historical evidence

`historical/top-only-v3/` preserves the outgoing mixed-view pipeline.
`historical/common-projection-before-arm-profile/` preserves the first common
projection before correcting the flat arm profile. Neither is an active
reference. Retained run directories are evidence, not extra review candidates.
Audit historical references at the user-requested end-of-all-assets checkpoint.

## Entry chalkboard specification review - 2026-10-09

Association: ongoing Office asset reference/specification review, entry
chalkboard only. This is a document revision, not model generation or runtime
implementation. The original PNG is unchanged. The geometry supplement and
JSON replace approximate overall dimensions with derived bounds and specify
the external hinge covers, two hinge heads, rounded spreaders and four visible
spreader fasteners. Hidden attachment dimensions are authored completions.

Default envelope: 420 x 362.319409848225 x 681.626227349194 mm. The source's
400 mm label describes the wooden frame; its 370 mm depth label is historical
approximation. Future generated geometry must be reviewed in all five views
and enlarged fitting details against the original. Document arithmetic is not
visual acceptance. Colour/material regions remain independently replaceable.

The preceding bench measurements describe the retained V4 run. Its input JSON
also contained the old chalkboard; the unchanged bench portion remains bound
to that run, while the current shared specification now includes this sign
revision. Immutable run snapshots retain the original file and hash.

The active bench report explicitly records this input rebind: its current-file
hash tracks the revised shared JSON, while `specificationRebind` retains the
render-time hash and immutable snapshot path. Bench module and material values
were compared with that snapshot and are unchanged. No bench pixels, generator
or immutable run evidence were altered; this is provenance maintenance only.

## Entry chalkboard annotations - 2026-10-10

Reproduce with `python3 annotate-entry-chalkboard.py` in this directory using
the existing Pillow environment. The script copies the source at native
1536 x 1024 pixels, without resizing, cropping, repositioning or generating
any object view. It adds only blue dimension notes, four RIGHT-view callouts
and the component legend. The transparent annotation layer is retained
separately; it is not another candidate drawing or a runtime texture.

[Annotation record](chalkboard-annotation-record.json) records source/output
hashes, label bounds and callout targets. Saved-image comparison confirms all
pixels outside the annotation layer are identical to the source. Inspection
of the saved full-resolution sheet confirms that callouts identify the outer
plate, its round head, the wooden spreader and a spreader fastener head, and
that dimension notes and legends are legible without covering the original
labels. This closes annotation review only; no model was built or accepted.

User acceptance - 2026-10-10: annotated sheet and corresponding document handoff approved for commit. Model generation, runtime behavior and rendered-model acceptance remain separate.
