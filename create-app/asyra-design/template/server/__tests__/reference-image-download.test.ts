import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
const network = vi.hoisted(() => ({ request: vi.fn(), lookup: vi.fn() }))
vi.mock('node:https', () => ({ request: network.request }))
vi.mock('node:dns/promises', () => ({ lookup: network.lookup }))
afterEach(() => vi.resetAllMocks())
import {
  downloadReferenceImage,
  resolvePublicImageAddress,
  validateReferenceImageUrl
} from '../reference-image-download'

describe('public reference image admission', () => {
  it.each([
    'http://example.org/a.png',
    'https://user:secret@example.org/a.png',
    'https://example.org:8443/a.png',
    'file:///tmp/a.png',
    'https://localhost/a.png'
  ])('rejects unsupported or local URL %s', (value) => {
    expect(() => validateReferenceImageUrl(value)).toThrow()
  })
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '198.18.0.1'
  ])('rejects private/reserved DNS answers %s', async (address) => {
    await expect(
      resolvePublicImageAddress('example.org', async () => [
        { address, family: 4 }
      ])
    ).rejects.toThrow()
  })
  it('pins one validated public address and rejects mixed DNS answers', async () => {
    expect(
      await resolvePublicImageAddress('example.org', async () => [
        { address: '93.184.216.34', family: 4 }
      ])
    ).toBe('93.184.216.34')
    await expect(
      resolvePublicImageAddress('example.org', async () => [
        { address: '93.184.216.34', family: 4 },
        { address: '127.0.0.1', family: 4 }
      ])
    ).rejects.toThrow()
  })
})

describe('bounded image transport', () => {
  const reply = (
    statusCode: number,
    headers: Record<string, string>,
    body = 'image'
  ) => {
    network.request.mockImplementationOnce((_url, options, callback) => {
      expect(options.family).toBe(4)
      options.lookup('example.org', {}, (error: unknown, address: string) => {
        expect(error).toBeNull()
        expect(address).toBe('93.184.216.34')
      })
      const req = new EventEmitter() as EventEmitter & { end: () => void }
      req.end = () => {
        const response = Object.assign(new EventEmitter(), {
          statusCode,
          headers,
          destroy: vi.fn()
        })
        callback(response)
        queueMicrotask(() => {
          response.emit('data', Buffer.from(body))
          response.emit('end')
        })
      }
      return req
    })
  }
  it('pins public DNS once and bounds an admitted raster response', async () => {
    network.lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    reply(200, { 'content-type': 'image/png' })
    const response = await downloadReferenceImage(
      'https://example.org/image.png',
      new AbortController().signal
    )
    expect(await response.text()).toBe('image')
    expect(network.lookup).toHaveBeenCalledTimes(1)
    expect(network.request.mock.calls[0]?.[1].headers).not.toHaveProperty(
      'Authorization'
    )
  })
  it('revalidates a redirect and never connects to its private destination', async () => {
    network.lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    reply(302, { location: 'https://127.0.0.1/image.png' })
    await expect(
      downloadReferenceImage(
        'https://example.org/image.png',
        new AbortController().signal
      )
    ).rejects.toThrow()
    expect(network.request).toHaveBeenCalledTimes(1)
  })
  it('rejects oversize declared bodies and aborts before network work', async () => {
    network.lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    reply(200, { 'content-type': 'image/png', 'content-length': '999999999' })
    await expect(
      downloadReferenceImage(
        'https://example.org/image.png',
        new AbortController().signal
      )
    ).rejects.toThrow()
    const controller = new AbortController()
    controller.abort()
    await expect(
      downloadReferenceImage('https://example.org/image.png', controller.signal)
    ).rejects.toThrow()
    expect(network.request).toHaveBeenCalledTimes(1)
  })
})
