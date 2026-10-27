import { part, placeParts, type AssetPart } from './catalog'
import { box, cylinder, ellipsoid, lathe, tube } from './geometry'

/** Regular tabletop accessories, based at Z=0; each region remains recolorable. */
export function dishTray(): AssetPart[] {
  const metal = 0xaaafa9
  const parts = placeParts(
    [part('tray-base', box([0.24, 0.16, 0.008], 0.003), metal, 'metal', 0.65)],
    [0, 0, 0.004]
  )
  for (const side of [-1, 1]) {
    parts.push(
      ...placeParts(
        [
          part(
            'rim-x-' + side,
            box([0.008, 0.16, 0.022], 0.003),
            metal,
            'metal',
            0.65
          )
        ],
        [side * 0.116, 0, 0.011]
      )
    )
    parts.push(
      ...placeParts(
        [
          part(
            'rim-y-' + side,
            box([0.224, 0.008, 0.022], 0.003),
            metal,
            'metal',
            0.65
          )
        ],
        [0, side * 0.076, 0.011]
      )
    )
  }
  parts.push(
    ...placeParts(
      [part('upright', box([0.012, 0.105, 0.1], 0.002), metal, 'metal', 0.65)],
      [0.025, 0, 0.058]
    ),
    ...placeParts(
      [
        part(
          'upright-foot',
          box([0.057, 0.115, 0.009], 0.002),
          metal,
          'metal',
          0.65
        )
      ],
      [0.025, 0, 0.0125]
    )
  )
  return parts
}

export function utensilPair(): AssetPart[] {
  return [0, 1].flatMap((i) => {
    const x = i * 0.026 - 0.013,
      top = 0.17 + i * 0.025
    return [
      part(
        'handle-' + i,
        tube(
          [
            [x, 0, 0.012],
            [x + 0.01, 0.012, top - 0.018]
          ],
          0.003,
          8
        ),
        0x65523d,
        'wood'
      ),
      ...placeParts(
        [
          part(
            'spoon-' + i,
            ellipsoid([0.009, 0.004, 0.016], 12, 8),
            0x65523d,
            'wood'
          )
        ],
        [x + 0.01, 0.012, top]
      )
    ]
  })
}

export function soapPump(): AssetPart[] {
  return [
    part(
      'vessel',
      lathe(
        [
          [0, 0],
          [0.025, 0],
          [0.029, 0.004],
          [0.029, 0.083],
          [0.018, 0.092],
          [0, 0.092]
        ],
        32
      ),
      0xeee8d9,
      'ceramic'
    ),
    ...placeParts(
      [
        part('neck', cylinder(0.007, 0.026, 0.007, 16), 0xaaafa9, 'metal', 0.65)
      ],
      [0, 0, 0.102]
    ),
    ...placeParts(
      [
        part('spout', box([0.016, 0.042, 0.01], 0.003), 0xaaafa9, 'metal', 0.65)
      ],
      [0, -0.015, 0.115]
    )
  ]
}
