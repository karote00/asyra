# Surface Recipes

All colors below are sRGB base colors, uniform across the corresponding part.

| Surface | Color | Metallic | Roughness |
| --- | --- | --- | --- |
| Frame and backing | #B9864E | 0 | 0.80 |
| Mirror pane | #C6D1D2 | 1 | 0.08 |
| Rail, arms, disks | #999C99 | 0.35 | 0.65 |

Emission and transmission are zero for all parts. Only the intrinsic wood grain below modifies the wood base color. No bump, normal, displacement, or occlusion maps are specified. Hidden and visible faces use the same assigned color.

Review sheets use flat unlit colors. Do not bake shadows, ambient occlusion, highlights, reflected scenery, gradients, or diagonal mirror streaks. Thin contour lines describe boundaries; they are not painted onto the assets.

The mirror's material parameters describe a reflective surface for later scene rendering, not a supplied reflection implementation. The application owns any reflection capture, lighting, and performance policy. No such behavior is implemented or verified here.

## Intrinsic wood grain

Use grain color #A77945. With metre coordinates u along Z and v along X on front/back faces, compute q = sin(2*pi*(v/0.003 + 0.10*sin(2*pi*u/0.060))). Mix the wood base color toward grain color by 0.08*max(0,q)^8 in linear RGB after converting sRGB inputs. On narrow side faces use u=Z, v=Y; on top/bottom faces use u=X, v=Y. This low-contrast pigment variation is not lighting or relief.
