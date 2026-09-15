import { describe, expect, it, vi } from 'vitest'
import { createLocalImageTools } from '../local-image-tools'

describe('local provider image tools', () => {
  const attachment = {
    dataUrl: 'data:image/png;base64,YQ==',
    mediaType: 'image/png',
    size: 1
  }
  it('vectorizes only the referenced submitted image through the existing converter', async () => {
    const convert = vi.fn(async () => '<svg width="1" height="1"></svg>')
    const tools = createLocalImageTools(
      { metadata: { imageAttachments: [attachment] } },
      convert
    )
    expect(tools.definitions).toHaveLength(1)
    const signal = new AbortController().signal
    expect(
      await tools.call('vtracer', { attachmentIndex: 0 }, signal)
    ).toContain('<svg')
    expect(convert).toHaveBeenCalledOnce()
    expect(convert.mock.calls[0]).toEqual([
      {
        bytes: Buffer.from('a'),
        contentType: 'image/png',
        profile: 'photo-faithful',
        signal
      }
    ])
  })
  it.each([
    ['shell', { attachmentIndex: 0 }],
    ['vtracer', { attachmentIndex: 1 }],
    ['vtracer', { attachmentIndex: 0, path: '/private/file.png' }]
  ])(
    'rejects unregistered capability or attachment input',
    async (name, args) => {
      const convert = vi.fn()
      const tools = createLocalImageTools(
        { metadata: { imageAttachments: [attachment] } },
        convert
      )
      await expect(
        tools.call(name as string, args, new AbortController().signal)
      ).rejects.toThrow()
      expect(convert).not.toHaveBeenCalled()
    }
  )
  it('does not advertise image generation or vectorization without a compatible attachment', () => {
    expect(createLocalImageTools({}).definitions).toEqual([])
    expect(
      createLocalImageTools({
        metadata: {
          imageAttachments: [{ ...attachment, mediaType: 'image/webp' }]
        }
      }).definitions
    ).toEqual([])
  })
})
