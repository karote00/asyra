# Lounge Armchair - Approved Reference Reconciliation

The approved appearance remains `source/side-source-reset/five-views-v3-wider.png`.
The former 620 mm numeric width and upright U shell did not describe that revision.
On 2026-10-26 the user selected a 15% wider default: **713 x 610 x 690 mm**.
Depth and height are unchanged. The numeric component definition in
`furniture-model-spec.json` now carries this revision.

One chair contains two independently rounded upholstered side panels, a reclining
backrest, a front base, one cushion, and four outward-splayed wooden feet. The
side panels follow explicit cubic YZ curves. Their 80 mm thickness is rounded
inward by up to 27 mm, limited to 80% of the local circumcircle radius to prevent contour folds; the upper centreline tapers inward by 35 mm between Z=400 and
690 mm. These are authored reconstruction parameters guided by the approved
side/front/top silhouettes, not uniquely measured 3D data.

The backrest reclines 10 degrees. Its centre height is derived from the support
function of the rounded box so its highest point is Z=690 mm. The seat top is
360 mm. The 160 mm tapered feet overlap the base; there is no extra underside
platform, transverse back groove or floating rear insert. Each component retains
an independent surface region. Whole-unit XYZ sizing applies after construction,
followed by replaceable colour/material resolution. Default orange and dark wood
remain in the shared furniture palette. No lighting is baked into the asset.

## Foot-contact correction from the approved side image

Reference geometry takes precedence over a conflicting earlier numeric recipe.
In the 1374 x 1145 approved sheet, the SIDE body spans approximately X=494..913
pixels; its ground-contact centres are X=521 (front) and X=842 (rear). Mapping
that 419 px span onto the 610 mm body depth with front Y=-305 mm gives
`Y=-305+(pixelX-494)*610/419`. Rounded to millimetres, the front feet now contact
at Y=-266 mm and the rear feet at Y=202 mm. Upper centres are Y=-225/161 mm,
preserving the observed outward rake of about 41 mm. X positions, Z contacts,
foot widths and the 713 x 610 x 690 mm default envelope remain unchanged.

The old rear contact Y=254 mm left only about 29 mm between the rear foot rim
and the backrest envelope, contrary to the visible side view. The revised gap
is about 80 mm. Named-part regressions check that relationship. These are traced
image ratios with millimetre rounding, not a physical survey.

The full office image separately controls the placed instance's XYZ extents and
pose. Its visible front-left contact and uncertainty boxes for the two
plant-occluded foot tips are recorded in the app's
`scene/reference/interior-landmarks.json`; the fitted dimensions and projections
are retained in `interior-fit.json`. A matching whole-object bounding box alone
cannot determine chair orientation and must not override those contacts.

The near-front and rear-right tips are partly hidden by border plants in the
complete reference. Their visible dark endpoints are not precise ground contacts.
Preserve uncertainty boxes instead of treating inferred endpoints as measured
exact pixels. The visible orange rear silhouette reaches X=815 at rows 478..485;
the former X=818 bound included background.

The existing `construction.test.ts` shell-only assertion is superseded by the
approved widened multi-panel topology and the reference regression in
`furniture-reference.test.ts`. Five-view live-app review and close inspection are
still required; numeric defaults and width approval do not certify visual fidelity.
