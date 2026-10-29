import { expect, it } from 'vitest'
import * as puppets from '../puppets'
import spec from '../../../../../assets/asyra-office/models/animals-cat-dog/animals-model-spec.json'

it('removes the rejected procedural animal factory while retaining approved Blender inputs', () => {
  expect(puppets).not.toHaveProperty('companion')
  expect(spec.animals.map((a) => [a.id, a.finalSize])).toEqual([
    ['sleeping-orange-cat', [0.38, 0.5, 0.26]],
    ['standing-corgi', [0.32, 0.62, 0.48]]
  ])
})
