# Birds - Surface Recipes

## Material contract

Palette values are sRGB hex colors in the JSON. All colors use roughness 0.90, metallic 0, alpha 1, IOR 1.5; emission, coat, transmission, subsurface and anisotropy are zero. No normal/displacement maps, feather strands, glints, gradients, painted reflections, cast/contact shadows or ambient occlusion. Scene lighting is external. Sheet outlines are explanatory and must not become texture outlines.

## Head masks

Evaluate masks in the head ellipsoid's raw normalized coordinates q=(p-centre)/radii, normalized to unit length. A mask centre at longitude L and latitude B has vector (sin(L)cos(B), -cos(L)cos(B), sin(B)), with angles converted from degrees. Paint points where acos(clamp(dot(q,centre),-1,1)) is less than the mask angular radius. This defines circular regions on the ellipsoid and works on hidden views without guessing an image projection.

Apply base head color, then headCheeks, cheekSpots (sparrow only), throatBib (sparrow only), then eyes. Eye circles are solid dark with no white highlights. For the blended head/body surface, head masks apply only where the head's pre-blend field is lower than the body's; equal values belong to the body. Cockatiel cheek patches are orange and must not become lighting blush gradients.

## Other parts

Body, tail, legs, toes and beak use their listed flat base materials. Sparrow back above raw Z=0.105 is chestnut; lower body remains tan. The two wings use brown for the sparrow, gray for the cockatiel. Sparrow ivory wing bars apply where raw world Y is inside either listed interval AND the wing normal points outward (normalX*sign(wingCentreX)>0). The masks cover only the outer wing face; no bars on belly or hidden wing roots. Cockatiel white wing patches use the listed wing-local Y and Z ranges on the outward face only; inverse-rotate the point around the wing centre before evaluating. Crest feathers are yellow. The cockatiel body and tail remain gray. Sparse drawn feather contour lines are illustration guides only, not required grooves or pigment.

There is no feather noise or color randomization. If baked base-color textures are required later, use one 2048 x 2048 atlas per bird, nonoverlapping islands and eight pixels of same-color padding. Evaluate all masks before final geometric normalization. Baking must contain intrinsic colors only. Review in an unlit material mode before any lit scene comparison.
