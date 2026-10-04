# Tea Furniture - Surface Recipes

Reuse the existing furniture palette in JSON: oak #D5B587, oak grain #BD986B, dark wood #584333 and orange fabric #BF753D. Use declared roughness, metallic 0, alpha 1, transmission 0, emission 0 and no clearcoat. All colours are sRGB; convert to linear before interpolation. Backs and undersides retain the assigned materials.

Tabletop grain is aligned with X. In local coordinates, define f=0.5+0.5*sin(2*pi*(Y/0.004+0.12*sin(2*pi*X/0.16))). Mix linear oak with linear oak-grain using weight 0.15*f. Apply the same object-space function on rim and underside. Do not add planks, knots, rings, inlays or grooves. Dark apron and feet are uniform dark wood, with no painted highlights.

For chair cloth, select the dominant-normal projection: X/Z when abs(Ny) is largest, otherwise Y/Z when abs(Nx)>=abs(Nz), otherwise X/Y. Break ties in that order. In that coordinate pair q1,q2, use cell size 0.002 and F(q)=q-0.002*floor(q/0.002). Where F(q1)<0.00012 or F(q2)<0.00012, multiply linear orange RGB by 0.97; elsewhere use the base. No random seed, normal map, fuzz, bump or displacement. Weave is an intrinsic texture; normal filtering may average it out at distance.

Generated grain and weave are illustrative, not a calibrated texture source. Do not bake their directional shading or highlights. No cast-shadow plane, contact shading, ambient occlusion, edge-darkening, sheet labels or white backgrounds belong in materials. Scene lighting is owned by the app.
