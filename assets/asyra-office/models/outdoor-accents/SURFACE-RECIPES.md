# Outdoor Accents - Surface Recipes

JSON supplies sRGB colours and material constants. Wood #B68050, grain #95683E, dark metal #343633, board #34332F and chalk #EBE6D6. Alpha 1, transmission 0, emission 0 and no clearcoat. Metal uses metallic 0.5 and roughness 0.85; all highlights come from scene lighting.

Wood grain follows each board or post's longest local axis L. Let W be the shorter local face coordinate across it. Compute f=0.5+0.5*sin(2*pi*(W/0.004+0.1*sin(2*pi*L/0.18))). Mix linear wood and grain colours with weight 0.15*f. No random knots, plank subdivisions, engraved grooves, normal map or displacement. Grain is intrinsic colour only; hidden wood undersides use the same rule.

Metal is uniform matte dark grey. Blackboard is uniform charcoal, front/back and edges; chalk is the flat vector stroke mask from JSON on front only. Use ordinary antialiasing, no blurred shadow, raised ink, glow, chalk dust or grunge. Handwriting in the generated sheet is illustrative; exact letter construction follows the vector contract.

Do not copy rendered highlights, cast/contact shadows, ambient occlusion, white backgrounds or sheet labels into any texture. No scene geometry, shadow plane or baked illumination is included. The app owns all lighting.
