import { readFile } from 'node:fs/promises'
import { expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { createLocalReferenceTools } from '../local-reference-tools'
import { invokeLocalTool } from '../local-tool-invocation'

const sourceUrl = 'https://publisher.example/building'
const signal = () => new AbortController().signal
const fixture = async (html: string) => {
  const bytes = await sharp({
    create: { width: 12, height: 18, channels: 4, background: '#123456' }
  })
    .png()
    .toBuffer()
  const download = vi.fn(
    async () =>
      new Response(bytes, { headers: { 'content-type': 'image/png' } })
  )
  const page = vi.fn(async () => ({
    url: 'https://publisher.example/gallery/building',
    response: new Response(html, { headers: { 'content-type': 'text/html' } })
  }))
  let nextAttachment = 0
  const add = vi.fn((_image: { dataUrl: string }) => nextAttachment++)
  const tools = createLocalReferenceTools(add, download, {}, page)
  return { tools, download, page, add, bytes }
}

it('accepts a source page and internally acquires declared original bytes once for duplicate candidates', async () => {
  const { tools, download, page, add, bytes } = await fixture(
    '<meta property="og:image" content="../original.png?a=1&amp;b=2">'
  )
  const result = await invokeLocalTool(
    tools,
    tools.definitions[0],
    { references: [{ sourceUrl }, { sourceUrl }] },
    signal()
  )
  expect(result.success, result.text).toBe(true)
  const receipt = JSON.parse(result.text)
  expect(receipt.references).toHaveLength(2)
  expect(receipt.references[0]).toMatchObject({
    available: true,
    attachmentIndex: 0,
    source: { url: sourceUrl },
    imageUrl: 'https://publisher.example/original.png?a=1&b=2'
  })
  expect(receipt.references[0].sourceResolution).toBe('unverified')
  expect(receipt.references[0].nextStep).not.toContain(
    'retains its original resolution'
  )
  expect(page).toHaveBeenCalledOnce()
  expect(download).toHaveBeenCalledOnce()
  expect(add).toHaveBeenCalledOnce()
  expect(add.mock.calls[0][0].dataUrl).toBe(
    `data:image/png;base64,${bytes.toString('base64')}`
  )
  const again = JSON.parse(
    await tools.call('import_reference_image', { sourceUrl }, signal())
  )
  expect(again.delivery).toBe('reference')
  expect(page).toHaveBeenCalledOnce()
  expect(download).toHaveBeenCalledOnce()
})

it('tries the next declared image after a source-local failure without another model call', async () => {
  const { tools, download } = await fixture(
    '<meta property="og:image" content="https://images.example/broken.png"><meta name="twitter:image" content="https://images.example/good.png">'
  )
  download.mockRejectedValueOnce(new Error('unavailable'))
  const result = JSON.parse(
    await tools.call('import_reference_image', { sourceUrl }, signal())
  )
  expect(result.available).toBe(true)
  expect(result.pageAcquisition.attempts).toEqual([
    {
      imageUrl: 'https://images.example/broken.png',
      available: false,
      code: 'REFERENCE_DOWNLOAD_FAILED'
    },
    { imageUrl: 'https://images.example/good.png', available: true }
  ])
  expect(download).toHaveBeenCalledTimes(2)
})

it('does not interpret scripts, comments or arbitrary body images as representative metadata', async () => {
  const { tools, download, page } = await fixture(
    `<script>const x='<meta property="og:image" content="https://images.example/script.png">'</script><!-- <meta property="og:image" content="https://images.example/comment.png"> --><img src="https://images.example/ad.png">`
  )
  for (let i = 0; i < 2; i++) {
    const result = JSON.parse(
      await tools.call('import_reference_image', { sourceUrl }, signal())
    )
    expect(result).toMatchObject({
      available: false,
      recoverable: true,
      code: 'REFERENCE_PAGE_IMAGES_UNAVAILABLE'
    })
  }
  expect(download).not.toHaveBeenCalled()
  expect(page).toHaveBeenCalledTimes(2)
})

it('resolves link image_src and rejects local or credential URLs before downloading', async () => {
  const { tools, download } = await fixture(
    `<meta property="og:image" content="http://localhost/a.png"><meta property="og:image" content="https://user:secret@host.example/a.png"><link rel="image_src" href="/original.png">`
  )
  const result = JSON.parse(
    await tools.call('import_reference_image', { sourceUrl }, signal())
  )
  expect(result.available).toBe(true)
  expect(download).toHaveBeenCalledOnce()
  expect(download.mock.calls[0][0]).toBe(
    'https://publisher.example/original.png'
  )
})

it('cancels page acquisition before any image can be admitted', async () => {
  const { tools, page, add, download } = await fixture(
    '<meta property="og:image" content="/original.png">'
  )
  const controller = new AbortController()
  page.mockImplementationOnce(async () => {
    controller.abort()
    return {
      url: sourceUrl,
      response: new Response(
        '<meta property="og:image" content="/original.png">'
      )
    }
  })
  await expect(
    tools.call('import_reference_image', { sourceUrl }, controller.signal)
  ).rejects.toThrow()
  expect(add).not.toHaveBeenCalled()
  expect(download).not.toHaveBeenCalled()
})

it('direct image acquisition bypasses page resolution', async () => {
  const { tools, page } = await fixture('')
  expect(
    JSON.parse(
      await tools.call(
        'import_reference_image',
        { sourceUrl, imageUrl: 'https://images.example/original.png' },
        signal()
      )
    ).available
  ).toBe(true)
  expect(page).not.toHaveBeenCalled()
})

it('imports the linked resource from the recorded page instead of its social preview', async () => {
  const html = await readFile(
    new URL('./fixtures/reference-linked-image.html', import.meta.url),
    'utf8'
  )
  const { tools, download, page, add } = await fixture(html)
  const receipt = JSON.parse(
    await tools.call('import_reference_image', { sourceUrl }, signal())
  )
  const expected =
    'https://upload.wikimedia.org/wikipedia/commons/f/fb/Taipei_Taiwan_Taipei-101-Tower-02.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original'
  expect(receipt.imageUrl).toBe(expected)
  expect(download).toHaveBeenCalledExactlyOnceWith(
    expected,
    expect.any(AbortSignal)
  )
  expect(receipt.image).toMatchObject({ width: 12, height: 18 })
  expect(receipt.acquisition).toBe('downloaded')
  const displayed = JSON.parse(
    await tools.call(
      'import_reference_image',
      { sourceUrl, refresh: true },
      signal()
    )
  )
  expect(displayed).toMatchObject({
    attachmentIndex: 0,
    acquisition: 'reused',
    delivery: 'image',
    imageUrl: expected
  })
  expect(page).toHaveBeenCalledOnce()
  expect(download).toHaveBeenCalledOnce()
  expect(add).toHaveBeenCalledOnce()
})

it('uses an explicit linked image on another host without rewriting signed URL parameters', async () => {
  const { tools, download } = await fixture(
    '<meta property="og:image" content="https://cdn.example/preview.jpg?asset=hero"><a href="https://media.example/file.jpg?signature=keep%2Bexact&amp;size=original"><img src="https://cdn.example/preview.jpg?asset=hero&amp;v=2"></a><a href="https://media.example/logo.jpg"><img src="https://cdn.example/preview.jpg?asset=logo"></a>'
  )
  const result = JSON.parse(
    await tools.call('import_reference_image', { sourceUrl }, signal())
  )
  expect(result.imageUrl).toBe(
    'https://media.example/file.jpg?signature=keep%2Bexact&size=original'
  )
  expect(download).toHaveBeenCalledOnce()
})

it('does not downgrade a failed linked resource to its preview', async () => {
  const { tools, download } = await fixture(
    '<meta property="og:image" content="/preview.jpg"><a href="/original.jpg"><img src="/preview.jpg"></a>'
  )
  download.mockRejectedValueOnce(new Error('source unavailable'))
  const result = JSON.parse(
    await tools.call('import_reference_image', { sourceUrl }, signal())
  )
  expect(result).toMatchObject({ available: false, recoverable: true })
  expect(download).toHaveBeenCalledOnce()
  expect(result.pageAcquisition.attempts[0].imageUrl).toBe(
    'https://publisher.example/original.jpg'
  )
})

it('updates the selected page asset after an explicit known-candidate acquisition', async () => {
  const { tools, download, page } = await fixture(
    '<meta property="og:image" content="/first.jpg"><meta name="twitter:image" content="/second.jpg">'
  )
  await tools.call('import_reference_image', { sourceUrl }, signal())
  const other = await sharp({
    create: { width: 24, height: 36, channels: 4, background: '#456789' }
  })
    .png()
    .toBuffer()
  download.mockResolvedValueOnce(
    new Response(other, { headers: { 'content-type': 'image/png' } })
  )
  const direct = JSON.parse(
    await tools.call(
      'import_reference_image',
      { sourceUrl, imageUrl: 'https://publisher.example/second.jpg' },
      signal()
    )
  )
  const repeated = JSON.parse(
    await tools.call(
      'import_reference_image',
      { sourceUrl, refresh: true },
      signal()
    )
  )
  expect(repeated.attachmentIndex).toBe(direct.attachmentIndex)
  expect(repeated.imageUrl).toBe('https://publisher.example/second.jpg')
  expect(repeated.image).toMatchObject({ width: 24, height: 36 })
  expect(download).toHaveBeenCalledTimes(2)
  expect(page).toHaveBeenCalledOnce()
})

it('reads an ImageObject contentUrl relationship as data without executing scripts', async () => {
  const { tools, download } = await fixture(
    '<meta property="og:image" content="/preview.jpg"><script type="application/ld+json">{"@type":"ImageObject","contentUrl":"/original.jpg","thumbnailUrl":"/preview.jpg"}</script><script>throw new Error("must not execute")</script>'
  )
  const result = JSON.parse(
    await tools.call('import_reference_image', { sourceUrl }, signal())
  )
  expect(result.imageUrl).toBe('https://publisher.example/original.jpg')
  expect(download).toHaveBeenCalledOnce()
})
