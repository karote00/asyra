import { describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { createLocalReferenceTools } from '../local-reference-tools'
import { createLocalImageTools } from '../local-image-tools'
import { localToolContent } from '../local-operation-tools'

const candidate = {
  pageid: 1,
  title: 'File:Example.svg',
  imageinfo: [
    {
      thumburl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.svg/960px-Example.svg.png',
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example.svg',
      extmetadata: { LicenseShortName: { value: 'CC0' } }
    }
  ]
}

describe('reference research and import', () => {
  it('finds and imports a visual reference without an attachment, then traces and prepares it', async () => {
    const png = await sharp({
      create: { width: 8, height: 8, channels: 4, background: '#00aa00' }
    })
      .png()
      .toBuffer()
    const fetcher = vi.fn(async (url: string | URL) =>
      String(url).startsWith('https://upload.')
        ? new Response(png, { headers: { 'content-type': 'image/png' } })
        : Response.json({ query: { pages: [candidate] } })
    )
    const images = createLocalImageTools(
      {},
      vi.fn(
        async () =>
          '<svg width="8" height="8"><path d="M0,0L8,0L8,8Z" fill="#00aa00"/></svg>'
      )
    )
    const tools = createLocalReferenceTools(
      images.addReference,
      fetcher as typeof fetch
    )
    const signal = new AbortController().signal
    const search = JSON.parse(
      await tools.call(
        'search_reference_images',
        { query: 'Example logo' },
        signal
      )
    )
    expect(search.candidates[0].sourceUrl).toContain(
      'commons.wikimedia.org/wiki/'
    )
    const imported = await tools.call(
      'import_reference_image',
      { referenceId: search.candidates[0].referenceId },
      signal
    )
    const receipt = JSON.parse(imported)
    expect(receipt.attachmentIndex).toBe(0)
    expect(
      localToolContent(imported).some((item) => item.type === 'inputImage')
    ).toBe(true)
    const artifact = JSON.parse(
      await images.call(
        'vtracer',
        {
          attachmentIndex: 0,
          plan: { strategy: 'preserve-vectors', reason: 'Irregular foreground' }
        },
        signal
      )
    )
    expect(artifact.imageArtifactId).toBeTruthy()
    expect(
      images.modelActions([
        {
          name: 'insert_vector_composition',
          description: 'Draw',
          inputSchema: { type: 'object' }
        }
      ])[0]?.inputSchema
    ).toHaveProperty('anyOf')
  })

  it('rejects unselected URLs and private or redirected downloads', async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        query: {
          pages: [
            {
              ...candidate,
              imageinfo: [
                {
                  ...candidate.imageinfo[0],
                  thumburl: 'http://127.0.0.1/private'
                }
              ]
            }
          ]
        }
      })
    )
    const tools = createLocalReferenceTools(vi.fn(), fetcher as typeof fetch)
    const signal = new AbortController().signal
    expect(
      JSON.parse(
        await tools.call('search_reference_images', { query: 'logo' }, signal)
      ).candidates
    ).toEqual([])
    expect(
      JSON.parse(
        await tools.call(
          'import_reference_image',
          { referenceId: 'http://localhost' },
          signal
        )
      ).available
    ).toBe(false)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('bounds searches and surfaces network failure without inventing a reference', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('private network detail')
    })
    const tools = createLocalReferenceTools(vi.fn(), fetcher as typeof fetch)
    for (let i = 0; i < 5; i++) {
      const result = await tools.call(
        'search_reference_images',
        { query: 'logo' },
        new AbortController().signal
      )
      expect(result).not.toContain('private network detail')
    }
    expect(fetcher.mock.calls.length).toBeLessThanOrEqual(6)
  })
})

it('imports a native-research URL through the safe downloader once per request', async () => {
  const png = await sharp({
    create: { width: 8, height: 8, channels: 4, background: '#fff' }
  })
    .png()
    .toBuffer()
  const download = vi.fn(
    async () => new Response(png, { headers: { 'content-type': 'image/png' } })
  )
  const add = vi.fn(() => 0)
  const tools = createLocalReferenceTools(add, vi.fn(), download)
  const args = {
    imageUrl: 'https://brand.example/logo.png',
    sourceUrl: 'https://brand.example/brand'
  }
  const signal = new AbortController().signal
  const result = await tools.call('import_reference_image', args, signal)
  expect(JSON.parse(result).source.url).toBe(args.sourceUrl)
  expect(localToolContent(result)[1]?.type).toBe('inputImage')
  expect(await tools.call('import_reference_image', args, signal)).toBe(result)
  expect(download).toHaveBeenCalledOnce()
  expect(add).toHaveBeenCalledOnce()
})
