import { expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { createLocalReferenceTools } from '../local-reference-tools'
import { createLocalImageTools } from '../local-image-tools'
import { localToolContent } from '../local-operation-tools'

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
  const tools = createLocalReferenceTools(add, download)
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

it('does not authorize an invented approximation after reference import fails', async () => {
  const tools = createLocalReferenceTools(vi.fn(), vi.fn())
  const result = JSON.parse(
    await tools.call(
      'import_reference_image',
      { referenceId: 'missing' },
      new AbortController().signal
    )
  )
  expect(result.available).toBe(false)
  expect(result.message).toContain(
    'do not substitute an invented or inspired drawing'
  )
})

it('does not replace an SVG source with a publisher raster thumbnail', async () => {
  const download = vi.fn()
  const tools = createLocalReferenceTools(vi.fn(), download)
  const receipt = JSON.parse(
    await tools.call(
      'import_reference_image',
      {
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.svg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.svg'
      },
      new AbortController().signal
    )
  )
  expect(receipt.available).toBe(false)
  expect(receipt.message).toContain('SVG')
  expect(download).not.toHaveBeenCalled()
})

it('preserves original reference dimensions through import and native image delivery', async () => {
  const png = await sharp({
    create: { width: 1800, height: 1200, channels: 4, background: '#123456' }
  })
    .png()
    .toBuffer()
  const addReference = vi.fn((_image: { dataUrl: string }) => 0)
  const tools = createLocalReferenceTools(
    addReference,
    async () => new Response(png, { headers: { 'content-type': 'image/png' } })
  )
  const result = await tools.call(
    'import_reference_image',
    {
      imageUrl: 'https://example.com/original.png',
      sourceUrl: 'https://example.com/source'
    },
    new AbortController().signal
  )
  const receipt = JSON.parse(result)
  expect(receipt.actionResults[0].result.image).toMatchObject({
    width: 1800,
    height: 1200
  })
  expect(
    localToolContent(result).filter((item) => item.type === 'inputImage')
  ).toHaveLength(1)
  const bytes = Buffer.from(
    addReference.mock.calls[0][0].dataUrl.split(',')[1],
    'base64'
  )
  expect(await sharp(bytes).metadata()).toMatchObject({
    width: 1800,
    height: 1200
  })
})

it('keeps source failure recoverable and permits a different public source in the same request', async () => {
  const png = await sharp({
    create: { width: 8, height: 8, channels: 4, background: '#fff' }
  })
    .png()
    .toBuffer()
  const download = vi
    .fn()
    .mockResolvedValueOnce(new Response('missing', { status: 404 }))
    .mockResolvedValueOnce(
      new Response(png, { headers: { 'content-type': 'image/png' } })
    )
  const addReference = vi.fn(() => 0)
  const tools = createLocalReferenceTools(addReference, download)
  const signal = new AbortController().signal
  const failed = JSON.parse(
    await tools.call(
      'import_reference_image',
      {
        imageUrl: 'https://first.example/image.png',
        sourceUrl: 'https://first.example/'
      },
      signal
    )
  )
  expect(failed).toMatchObject({
    available: false,
    recoverable: true,
    code: 'REFERENCE_DOWNLOAD_FAILED'
  })
  expect(failed.nextStep).toContain('different source')
  expect(addReference).not.toHaveBeenCalled()
  const success = JSON.parse(
    await tools.call(
      'import_reference_image',
      {
        imageUrl: 'https://second.example/image.png',
        sourceUrl: 'https://second.example/'
      },
      signal
    )
  )
  expect(success.attachmentIndex).toBe(0)
  expect(success.nextStep).toContain('unsuitable')
  expect(success.nextStep).toContain('continue research')
})

it('offers direct import only and has no source-specific search tool', () => {
  const tools = createLocalReferenceTools(vi.fn(), vi.fn())
  expect(tools.definitions.map((tool) => tool.name)).toEqual([
    'import_reference_image'
  ])
  expect(tools.definitions[0].inputSchema).toMatchObject({
    required: ['imageUrl', 'sourceUrl']
  })
})

it('imports and traces an original public reference without source-specific lookup', async () => {
  const png = await sharp({
    create: { width: 8, height: 8, channels: 4, background: '#fff' }
  })
    .png()
    .toBuffer()
  const convert = vi.fn(
    async () =>
      '<svg width="8" height="8"><path d="M0,0L8,0L8,8Z" fill="#00aa00"/></svg>'
  )
  const images = createLocalImageTools({}, convert)
  const download = vi.fn(
    async () => new Response(png, { headers: { 'content-type': 'image/png' } })
  )
  const tools = createLocalReferenceTools(images.addReference, download)
  const signal = new AbortController().signal
  const receipt = JSON.parse(
    await tools.call(
      'import_reference_image',
      {
        imageUrl: 'https://publisher.example/original.png',
        sourceUrl: 'https://publisher.example/reference'
      },
      signal
    )
  )
  expect(receipt.attachmentIndex).toBe(0)
  expect(download).toHaveBeenCalledWith(
    'https://publisher.example/original.png',
    signal
  )
  const result = JSON.parse(
    await images.call(
      'vtracer',
      {
        attachmentIndex: 0,
        plan: {
          strategy: 'preserve-vectors',
          reason: 'Preserve the source artwork.'
        }
      },
      signal
    )
  )
  expect(result.imageArtifactId).toBeDefined()
  expect(convert).toHaveBeenCalledOnce()
})
