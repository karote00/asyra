# Pantry - Surface Recipes

All colours and roughness follow the [JSON](pantry-model-spec.json). alpha=1, transmission=0, emission=0, metallic=0; metal parts also start as stylized grey. No shadows, AO, highlights, reflection textures, normal maps, displacement, transparent liquid, or lights.

cream, grey, dark, counter, basin, bottle, red, and blue are solid colours, identical on front/back/undersides. Dark bay backs are material choices, not recess-depth shading. Image lighting, bright lines, and outlines are not textures.

Fixed cabinet wood grain: front/back u=Z,v=X; sides u=Z,v=Y; top/bottom plain oak. Set p=2π(v/0.025+0.035 sin(2πu/0.4)), g=((1+sin p)/2)^10, C=oak×(1−0.15g)+oak-grain×0.15g, mixing normalized sRGB. Convert to linear with c/12.92 when c≤0.04045, otherwise ((c+0.055)/1.055)^2.4. No random variants. Texture generation uses 1024 px per metre, pixel-centre sampling, and 8 px same-colour edge dilation.

Do not bake notes, magnets, logos, or labels into appliances. Build seams, handles, and slots as specified geometry; black lines cannot substitute for actual openings.
