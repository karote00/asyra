import { expect, it, vi } from 'vitest'
import { prepareArtwork, sampleArtwork } from '../artwork'

it('maps only the selected picture corners and rejects out-of-source regions', () => {
  const source = { width: 4, height: 4, data: new Uint8ClampedArray(64) }
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++)
      source.data.set([x * 50, y * 50, 20, 255], (y * 4 + x) * 4)
  const result = sampleArtwork(
    source,
    [
      [1, 1],
      [2, 1],
      [2, 3],
      [1, 3]
    ],
    2
  )
  expect(result.albedo).toEqual([
    50, 50, 20, 255, 100, 50, 20, 255, 50, 150, 20, 255, 100, 150, 20, 255
  ])
  expect(() =>
    sampleArtwork(source, [
      [-1, 0],
      [2, 0],
      [2, 2],
      [0, 2]
    ])
  ).toThrow('within the source')
})

it('decodes one shared source once for six printed surfaces during scene preparation', async () => {
  const decode = vi.fn().mockResolvedValue(undefined),
    drawImage = vi.fn()
  vi.stubGlobal(
    'Image',
    class {
      src = ''
      naturalWidth = 4
      naturalHeight = 4
      decode = decode
    }
  )
  const spy = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({
      drawImage,
      getImageData: () => ({ data: new Uint8ClampedArray(64) })
    } as unknown as CanvasRenderingContext2D)
  try {
    const result = await prepareArtwork(
      Array.from({ length: 6 }, () => ({
        artwork: {
          source: '/approved.jpg',
          corners: [
            [0, 0],
            [3, 0],
            [3, 3],
            [0, 3]
          ]
        }
      }))
    )
    expect(result.size).toBe(1)
    expect(decode).toHaveBeenCalledOnce()
    expect(drawImage).toHaveBeenCalledOnce()
    const prepared = result.get('/approved.jpg')
    if (!prepared) throw new Error('Missing prepared artwork')
    for (let i = 0; i < 6; i++)
      sampleArtwork(
        prepared,
        [
          [0, 0],
          [3, 0],
          [3, 3],
          [0, 3]
        ],
        2
      )
    expect(decode).toHaveBeenCalledOnce()
  } finally {
    spy.mockRestore()
    vi.unstubAllGlobals()
  }
})
