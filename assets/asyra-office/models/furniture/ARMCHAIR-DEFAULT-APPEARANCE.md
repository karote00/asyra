# Lounge Armchair - Default Appearance

Default appearance when no colour or material override is supplied:

| Region | Default material | sRGB base colour | Roughness | Metallic |
| --- | --- | --- | --- | --- |
| Upholstered shell, cushion and upholstered lower support | Orange upholstery | `#BF753D` | 0.93 | 0 |
| Four wooden feet | Dark wood | `#584333` | 0.82 | 0 |

These values match `materials.orange` and `materials.dark-wood` in the
furniture numeric JSON; alpha is 1 and emission is 0. They are replaceable
defaults, not fixed appearance restrictions. A colour override retains the
chosen material's other properties. An explicit material override can replace
the surface, without altering geometry or other instances. Do not sample the
reference's illumination or review face tones as additional default colours.

These are the existing material defaults, not new geometry or model approval.
