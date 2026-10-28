import { part, placeParts, type AssetPart } from './catalog'
import { box, cylinder, ellipsoid, lathe, tube } from './geometry'

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
