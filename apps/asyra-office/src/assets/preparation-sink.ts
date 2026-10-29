import { part, placeParts, type AssetPart } from './catalog'
import {
  append,
  box,
  cylinder,
  emptyMesh,
  tube,
  type Mesh,
  type Vec
} from './geometry'
import { subtractSolid } from './solid-subtraction'
import { COUNTERTOP_REFERENCE } from './pantry-counterware'

/** Counter contact is Z=0; the bowl goes below it, with a narrow fitting on its right. */
export function preparationSink(): AssetPart[] {
  const s = COUNTERTOP_REFERENCE.preparationSink
  const outer = emptyMesh(),
    cutter = emptyMesh()
  append(outer, box([s.width, s.depth, s.drop + s.rimRise], 0.012), [
    0,
    0,
    (s.rimRise - s.drop) / 2
  ])
  append(
    cutter,
    box(
      [s.width - 2 * s.rimWidth, s.depth - 2 * s.rimWidth, s.drop + 0.03],
      0.009
    ),
    [0, 0, -s.drop + s.floorThickness + (s.drop + 0.03) / 2]
  )
  const color = Number.parseInt(s.color.slice(1), 16)
  const x = s.width / 2 - s.rimWidth / 2,
    y = 0.028
  const h = s.faucetHeight
  return [
    part('basin', subtractSolid(outer, cutter), color, 'metal', 0.48),
    ...placeParts(
      [
        part(
          'faucet-foot',
          cylinder(0.012, 0.01, 0.012, 32),
          color,
          'metal',
          0.4
        )
      ],
      [x, y, s.rimRise + 0.005]
    ),
    part(
      'faucet',
      tube(
        [
          [x, y, s.rimRise],
          [x, y, h - 0.016],
          [x - 0.004, y, h - 0.004],
          [x - 0.016, y, h],
          [x - 0.055, y, h],
          [x - 0.065, y, h - 0.01]
        ],
        s.faucetRadius,
        16
      ),
      color,
      'metal',
      0.4
    )
  ]
}

/** Remove the actual basin envelope from both the countertop and cabinet body. */
export function cutPreparationOpening(mesh: Mesh, relativeSink: Vec): Mesh {
  const s = COUNTERTOP_REFERENCE.preparationSink
  const cutter = emptyMesh()
  append(
    cutter,
    box([s.width - 0.018, s.depth - 0.018, s.drop + 0.04], 0.009),
    [relativeSink[0], relativeSink[1], relativeSink[2] + (0.03 - s.drop) / 2]
  )
  return subtractSolid(mesh, cutter)
}
