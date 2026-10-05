import { expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { createLocalReferenceTools } from '../local-reference-tools'
import { createLocalImageTools } from '../local-image-tools'
import { localToolContent } from '../local-operation-tools'
import { invokeLocalTool, localToolOutcome } from '../local-tool-invocation'

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
  expect((await localToolContent(result))[1]?.type).toBe('inputImage')
  const repeated = await tools.call('import_reference_image', args, signal)
  expect(
    (await localToolContent(repeated)).filter(
      (item) => item.type === 'inputImage'
    )
  ).toHaveLength(0)
  expect(JSON.parse(repeated)).toMatchObject({
    attachmentIndex: 0,
    delivery: 'reference'
  })
  const refreshed = await tools.call(
    'import_reference_image',
    { ...args, refresh: true },
    signal
  )
  expect(
    (await localToolContent(refreshed)).filter(
      (item) => item.type === 'inputImage'
    )
  ).toHaveLength(1)
  expect(download).toHaveBeenCalledOnce()
  expect(add).toHaveBeenCalledOnce()
  const otherSource = JSON.parse(
    await tools.call(
      'import_reference_image',
      {
        ...args,
        sourceUrl: 'https://brand.example/updated-attribution'
      },
      signal
    )
  )
  expect(otherSource.source.url).toBe(
    'https://brand.example/updated-attribution'
  )
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
    (await localToolContent(result)).filter(
      (item) => item.type === 'inputImage'
    )
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
  expect(failed.message).toContain('HTTP 404')
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

it('offers generic reference acquisition without source-specific search tools', () => {
  const tools = createLocalReferenceTools(vi.fn(), vi.fn())
  expect(tools.definitions.map((tool) => tool.name)).toEqual([
    'import_reference_image'
  ])
  expect(tools.definitions[0].inputSchema).toMatchObject({
    oneOf: [{ required: ['references'] }, { required: ['sourceUrl'] }]
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

it('imports originals larger than four megapixels without resizing', async () => {
  const png = await sharp({
    create: { width: 2001, height: 2000, channels: 3, background: '#fff' }
  })
    .png()
    .toBuffer()
  const add = vi.fn()
  const tools = createLocalReferenceTools(
    add,
    async () => new Response(png, { headers: { 'content-type': 'image/png' } })
  )
  const receipt = JSON.parse(
    await tools.call(
      'import_reference_image',
      {
        imageUrl: 'https://example.com/large.png',
        sourceUrl: 'https://example.com/source'
      },
      new AbortController().signal
    )
  )
  expect(receipt.actionResults?.[0].result.image).toMatchObject({
    width: 2001,
    height: 2000
  })
  expect(add).toHaveBeenCalledOnce()
  expect(
    Buffer.from(add.mock.calls[0][0].dataUrl.split(',')[1], 'base64')
  ).toEqual(png)
})

it('preserves compressed JPEG bytes and display orientation instead of inflating to PNG', async () => {
  const bytes = await sharp({
    create: { width: 2001, height: 2000, channels: 3, background: '#123456' }
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer()
  const add = vi.fn(() => 0)
  const tools = createLocalReferenceTools(
    add,
    async () =>
      new Response(bytes, { headers: { 'content-type': 'image/jpeg' } })
  )
  const receipt = JSON.parse(
    await tools.call(
      'import_reference_image',
      {
        imageUrl: 'https://example.com/photo.jpg',
        sourceUrl: 'https://example.com/'
      },
      new AbortController().signal
    )
  )
  expect(receipt.actionResults?.[0].result.image).toMatchObject({
    width: 2000,
    height: 2001
  })
  expect(add.mock.calls[0]?.[0]).toEqual({
    dataUrl: `data:image/jpeg;base64,${bytes.toString('base64')}`,
    mediaType: 'image/jpeg',
    size: bytes.length
  })
})

it('rejects corrupt raster data without registering a reference', async () => {
  const bytes = Buffer.from([255, 216, 255, 0, 0, 0])
  const add = vi.fn()
  const tools = createLocalReferenceTools(
    add,
    async () =>
      new Response(bytes, { headers: { 'content-type': 'image/jpeg' } })
  )
  const receipt = JSON.parse(
    await tools.call(
      'import_reference_image',
      {
        imageUrl: 'https://example.com/broken.jpg',
        sourceUrl: 'https://example.com/'
      },
      new AbortController().signal
    )
  )
  expect(receipt).toMatchObject({
    available: false,
    recoverable: true,
    code: 'REFERENCE_DECODE_FAILED'
  })
  expect(add).not.toHaveBeenCalled()
})

it('keeps the imported display orientation through whole-image vector conversion', async () => {
  const bytes = await sharp({
    create: { width: 12, height: 24, channels: 3, background: '#123456' }
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer()
  const images = createLocalImageTools({})
  const references = createLocalReferenceTools(
    images.addReference,
    async () =>
      new Response(bytes, { headers: { 'content-type': 'image/jpeg' } })
  )
  const signal = new AbortController().signal
  const imported = JSON.parse(
    await references.call(
      'import_reference_image',
      {
        imageUrl: 'https://example.com/oriented.jpg',
        sourceUrl: 'https://example.com/'
      },
      signal
    )
  )
  const result = JSON.parse(
    await images.call(
      'vtracer',
      {
        attachmentIndex: imported.attachmentIndex,
        plan: {
          strategy: 'preserve-vectors',
          reason: 'Preserve this reference as displayed'
        }
      },
      signal
    )
  )
  expect(result).toMatchObject({ width: 24, height: 12 })
})

it.each(['png', 'jpeg', 'webp'] as const)(
  'delivers admitted original %s references above four megapixels to the model',
  async (format) => {
    const bytes = await sharp({
      create: { width: 2100, height: 2000, channels: 3, background: '#abcdef' }
    })
      .toFormat(format)
      .toBuffer()
    const tools = createLocalReferenceTools(
      vi.fn(() => 0),
      async () =>
        new Response(bytes, { headers: { 'content-type': `image/${format}` } })
    )
    const result = await tools.call(
      'import_reference_image',
      {
        imageUrl: `https://example.com/original.${format}`,
        sourceUrl: 'https://example.com/article'
      },
      new AbortController().signal
    )
    const content = await localToolContent(result)
    expect(content).toContainEqual({
      type: 'inputImage',
      imageUrl: `data:image/${format};base64,${bytes.toString('base64')}`
    })
    expect(
      JSON.parse(content[0].type === 'inputText' ? content[0].text : '{}')
        .actionResults[0].result.image
    ).toMatchObject({ width: 2100, height: 2000 })
  }
)

it('delivers an EXIF-oriented original JPEG without changing bytes and rejects mismatched dimensions', async () => {
  const bytes = await sharp({
    create: { width: 16, height: 8, channels: 3, background: '#abcdef' }
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer()
  const tools = createLocalReferenceTools(
    vi.fn(() => 0),
    async () =>
      new Response(bytes, { headers: { 'content-type': 'image/jpeg' } })
  )
  const result = await tools.call(
    'import_reference_image',
    {
      imageUrl: 'https://example.com/original.jpg',
      sourceUrl: 'https://example.com/page'
    },
    new AbortController().signal
  )
  expect(await localToolContent(result)).toContainEqual({
    type: 'inputImage',
    imageUrl: `data:image/jpeg;base64,${bytes.toString('base64')}`
  })
  const invalid = JSON.parse(result)
  invalid.actionResults[0].result.image.width = 999
  await expect(localToolContent(JSON.stringify(invalid))).rejects.toThrow(
    'metadata'
  )
})

it('acquires candidates concurrently once per URL and preserves ordered partial results', async () => {
  const bytes = await sharp({
    create: { width: 8, height: 8, channels: 4, background: '#fff' }
  })
    .png()
    .toBuffer()
  let release!: () => void
  const ready = new Promise<void>((resolve) => {
    release = resolve
  })
  const download = vi.fn(async (url: string) => {
    await ready
    return url.endsWith('missing.png')
      ? new Response('', { status: 404 })
      : new Response(bytes, { headers: { 'content-type': 'image/png' } })
  })
  const add = vi.fn(() => 0)
  const tools = createLocalReferenceTools(add, download)
  const references = [
    {
      imageUrl: 'https://brand.example/image.png',
      sourceUrl: 'https://brand.example/one'
    },
    {
      imageUrl: 'https://brand.example/missing.png',
      sourceUrl: 'https://brand.example/two'
    },
    {
      imageUrl: 'https://brand.example/image.png',
      sourceUrl: 'https://brand.example/three'
    }
  ]
  const result = tools.call(
    'import_reference_image',
    { references },
    new AbortController().signal
  )
  try {
    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(2))
  } finally {
    release()
  }
  const receipt = JSON.parse(await result)
  expect(
    receipt.references.map((entry: { available: boolean }) => entry.available)
  ).toEqual([true, false, true])
  expect(receipt.references[0].source.url).toBe(references[0].sourceUrl)
  expect(receipt.references[2].source.url).toBe(references[2].sourceUrl)
  expect(receipt.references[1]).toMatchObject({
    recoverable: true,
    code: 'REFERENCE_DOWNLOAD_FAILED'
  })
  expect(localToolOutcome(receipt)).toMatchObject({
    status: 'partial',
    issues: expect.arrayContaining([
      expect.objectContaining({ code: 'REFERENCE_DOWNLOAD_FAILED' })
    ])
  })
  expect(add).toHaveBeenCalledOnce()
  // The same retained image is not sent twice in a single native reply.
  expect(
    (await localToolContent(JSON.stringify(receipt))).filter(
      (entry) => entry.type === 'inputImage'
    )
  ).toHaveLength(1)
})

it('coalesces simultaneous singular imports but retries failed sources and stops before admission', async () => {
  const bytes = await sharp({
    create: { width: 8, height: 8, channels: 4, background: '#fff' }
  })
    .png()
    .toBuffer()
  const download = vi.fn(
    async () =>
      new Response(bytes, { headers: { 'content-type': 'image/png' } })
  )
  const add = vi.fn(() => 0)
  const tools = createLocalReferenceTools(add, download)
  const args = {
    imageUrl: 'https://brand.example/image.png',
    sourceUrl: 'https://brand.example/source'
  }
  const controller = new AbortController()
  await Promise.all([
    tools.call('import_reference_image', args, controller.signal),
    tools.call('import_reference_image', args, controller.signal)
  ])
  expect(download).toHaveBeenCalledOnce()
  expect(add).toHaveBeenCalledOnce()
  controller.abort()
  await expect(
    tools.call('import_reference_image', args, controller.signal)
  ).rejects.toThrow()
})

it('retries a failed acquisition without replaying successful siblings', async () => {
  const bytes = await sharp({
    create: { width: 2, height: 2, channels: 4, background: '#fff' }
  })
    .png()
    .toBuffer()
  const download = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValueOnce(
      new Response(bytes, { headers: { 'content-type': 'image/png' } })
    )
  const add = vi.fn(() => 0)
  const tools = createLocalReferenceTools(add, download)
  const args = {
    references: [
      {
        imageUrl: 'https://brand.example/image.png',
        sourceUrl: 'https://brand.example/source'
      }
    ]
  }
  const signal = new AbortController().signal
  const failed = JSON.parse(
    await tools.call('import_reference_image', args, signal)
  )
  expect(failed.references[0].available).toBe(false)
  expect(localToolOutcome(failed).status).toBe('unavailable')
  expect(
    JSON.parse(await tools.call('import_reference_image', args, signal))
      .references[0].available
  ).toBe(true)
  expect(download).toHaveBeenCalledTimes(2)
  expect(add).toHaveBeenCalledOnce()
})

it('admits batch reference input at the shared native boundary and delivers source failures as recoverable receipts', async () => {
  const download = vi.fn(async () => new Response('', { status: 404 }))
  const tools = createLocalReferenceTools(vi.fn(), download)
  const args = {
    references: [
      {
        imageUrl: 'https://brand.example/missing.png',
        sourceUrl: 'https://brand.example/source'
      }
    ]
  }
  const signal = new AbortController().signal
  const result = await invokeLocalTool(
    tools,
    tools.definitions[0],
    args,
    signal
  )
  expect(download).toHaveBeenCalledOnce()
  expect(JSON.parse(result.text)).toMatchObject({
    available: false,
    recoverable: true,
    toolOutcome: {
      status: 'unavailable',
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'REFERENCE_DOWNLOAD_FAILED' })
      ])
    }
  })
  const invalid = await invokeLocalTool(
    tools,
    tools.definitions[0],
    { references: args.references, ...args.references[0] },
    signal
  )
  expect(JSON.parse(invalid.text).code).toBe('PREPARATION_REJECTED')
  expect(download).toHaveBeenCalledOnce()
})

it('deduplicates image delivery across batch calls and restores it explicitly', async () => {
  const bytes = await sharp({
    create: { width: 8, height: 8, channels: 4, background: '#fff' }
  })
    .png()
    .toBuffer()
  const download = vi.fn(
    async () =>
      new Response(bytes, { headers: { 'content-type': 'image/png' } })
  )
  const add = vi.fn(() => 0)
  const tools = createLocalReferenceTools(add, download)
  const references = [
    {
      imageUrl: 'https://brand.example/a.png',
      sourceUrl: 'https://brand.example'
    }
  ]
  const signal = new AbortController().signal
  const imageCount = async (result: string) =>
    (await localToolContent(result)).filter(
      (item) => item.type === 'inputImage'
    ).length
  const first = await tools.call(
    'import_reference_image',
    { references },
    signal
  )
  const second = await tools.call(
    'import_reference_image',
    { references },
    signal
  )
  expect(await imageCount(first)).toBe(1)
  expect(await imageCount(second)).toBe(0)
  expect(JSON.parse(second).references[0]).toMatchObject({
    attachmentIndex: 0,
    delivery: 'reference'
  })
  const restored = await tools.call(
    'import_reference_image',
    { references, refresh: true },
    signal
  )
  expect(await imageCount(restored)).toBe(1)
  expect(download).toHaveBeenCalledOnce()
  expect(add).toHaveBeenCalledOnce()
  const successor = createLocalReferenceTools(add, download)
  expect(
    await imageCount(
      await successor.call('import_reference_image', { references }, signal)
    )
  ).toBe(1)
})

it('records each candidate result before a slower sibling finishes without downloading it again', async () => {
  const png = await sharp({
    create: { width: 4, height: 4, channels: 4, background: '#fff' }
  })
    .png()
    .toBuffer()
  let release!: () => void
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  const download = vi.fn(async (url: string) => {
    if (url.includes('slow')) {
      await wait
      throw new Error('network unavailable')
    }
    return new Response(png, { headers: { 'content-type': 'image/png' } })
  })
  const events: Record<string, unknown>[] = []
  const tools = createLocalReferenceTools(
    vi.fn(() => 0),
    download,
    {
      parentCallId: () => 'parent-call',
      trace: (stage, evidence) => events.push({ stage, ...evidence })
    }
  )
  const reference = {
    imageUrl: 'https://example.com/fast.png',
    sourceUrl: 'https://example.com/source'
  }
  const run = tools.call(
    'import_reference_image',
    {
      references: [
        reference,
        { ...reference, imageUrl: 'https://example.com/slow.png' }
      ]
    },
    new AbortController().signal
  )
  try {
    await vi.waitFor(() =>
      expect(events.filter((e) => e.stage === 'action_completed')).toHaveLength(
        1
      )
    )
    expect(events[0]).toMatchObject({
      parentCallId: 'parent-call',
      actor: 'app-server',
      executor: 'app-server'
    })
  } finally {
    release()
    await run
  }
  expect(events.filter((e) => e.stage === 'action_failed')).toHaveLength(1)
  await tools.call(
    'import_reference_image',
    reference,
    new AbortController().signal
  )
  expect(download).toHaveBeenCalledTimes(2)
  expect(events.filter((e) => e.stage === 'action_completed')).toHaveLength(2)
})

it('reuses admitted identical bytes across URL aliases without decoding or attaching them again', async () => {
  const png = await sharp({
    create: { width: 8, height: 10, channels: 4, background: '#123456' }
  })
    .png()
    .toBuffer()
  const decode = vi.spyOn(sharp.prototype, 'stats')
  const add = vi.fn(() => 0)
  const download = vi.fn(
    async () => new Response(png, { headers: { 'content-type': 'image/png' } })
  )
  const tools = createLocalReferenceTools(add, download)
  try {
    for (const suffix of ['?a=1', '?a=2'])
      await tools.call(
        'import_reference_image',
        {
          sourceUrl: 'https://example.com/page',
          imageUrl: 'https://example.com/image.png' + suffix
        },
        new AbortController().signal
      )
    expect(download).toHaveBeenCalledTimes(2)
    expect(decode).toHaveBeenCalledOnce()
    expect(add).toHaveBeenCalledOnce()
  } finally {
    decode.mockRestore()
  }
})

it('shares concurrent alias decoding and attachment admission, but keeps different same-size images distinct', async () => {
  const image = (background: string) =>
    sharp({ create: { width: 8, height: 10, channels: 4, background } })
      .png()
      .toBuffer()
  const first = await image('#123456')
  const second = await image('#654321')
  const decode = vi.spyOn(sharp.prototype, 'stats')
  let index = 0
  const add = vi.fn(() => index++)
  const download = vi.fn(
    async (url: string) =>
      new Response(url.endsWith('other.png') ? second : first, {
        headers: { 'content-type': 'image/png' }
      })
  )
  const tools = createLocalReferenceTools(add, download)
  try {
    const receipts = await Promise.all(
      ['a.png', 'b.png', 'other.png'].map(async (path) =>
        JSON.parse(
          await tools.call(
            'import_reference_image',
            {
              sourceUrl: 'https://example.com/page',
              imageUrl: 'https://example.com/' + path
            },
            new AbortController().signal
          )
        )
      )
    )
    expect(receipts[0].attachmentIndex).toBe(receipts[1].attachmentIndex)
    expect(receipts[2].attachmentIndex).not.toBe(receipts[0].attachmentIndex)
    expect(decode).toHaveBeenCalledTimes(2)
    expect(add).toHaveBeenCalledTimes(2)
    expect(download).toHaveBeenCalledTimes(3)
  } finally {
    decode.mockRestore()
  }
})
