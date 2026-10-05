# Surface Recipes

Wood base sRGB #B9864E, grain sRGB #A77945, metallic 0, roughness 0.80. Writing panel uniform sRGB #EEE9DB, metallic 0, roughness 0.75. Emission and transmission are zero.

For subtle wood pigment, use metre coordinates u along grain and v across grain:
q = sin(2*pi*(v/0.003 + 0.10*sin(2*pi*u/0.060))).
Mix base toward grain by 0.08*max(0,q)^8 in linear RGB after converting the sRGB values.

Tabletop horizontal faces use u=X,v=Y; long edges and long rails use u=X,v=Z; short edges and short rails use u=Y,v=Z. Legs use u=Z and v=X on front/back or v=Y on side faces. Their end caps use u=X,v=Y.

Whiteboard horizontal frame members and tray use u=X,v=Z on vertical faces, u=X,v=Y on horizontal faces. Vertical frame members and backing use u=Z,v=X on front/back and u=Z,v=Y on depth faces. At frame corners, vertical members own the corner squares; the grain split creates no groove. No additional join lines or fasteners.

No grain on the writing surface. No bump, normal, displacement, or occlusion maps. All hidden faces use their assigned material. Do not bake shadows, AO, highlights, gradients, reflections, handwriting, or marker dust. Sheet outlines are annotations, not texture artwork. Runtime scene lighting supplies shading.
