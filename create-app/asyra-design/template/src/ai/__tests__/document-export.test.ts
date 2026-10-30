import { Blob as NodeBlob } from 'node:buffer'
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createDocumentExport } from '../document-export'
import { operationInputIssue } from '../tool-schema'
import { AiActionNames } from '../../constants'

beforeEach(() => vi.stubGlobal('Blob', NodeBlob))
afterEach(() => vi.unstubAllGlobals())

const fixture = (maximumBytes = 10000) => {
  let changed: () => void = () => undefined
  let identity: object = {}
  const unsubscribe = vi.fn()
  const source = {
    save: vi.fn(async (): Promise<unknown> => ({
      version: '1.0.0',
      sceneTree: { title: 'Editable drawing' },
      props: {}
    })),
    identity: () => identity,
    documentId: () => 'document-1',
    workspaceId: () => 'workspace-1',
    observe: (listener: () => void) => {
      changed = listener
      return unsubscribe
    }
  }
  const blobs = new Map<string, NodeBlob>()
  const output = {
    create: vi.fn((blob: Blob) => {
      const url = `blob:${blobs.size}`
      blobs.set(url, blob as unknown as NodeBlob)
      return url
    }),
    release: vi.fn((url: string) => {
      blobs.delete(url)
    }),
    download: vi.fn(),
    digest: vi.fn(async (bytes: Uint8Array) =>
      createHash('sha256').update(bytes).digest('hex')
    )
  }
  const owner = createDocumentExport(source, output, maximumBytes)
  const invoke = async (
    name: string,
    input = {},
    signal = new AbortController().signal
  ) => {
    const action = owner.actions.find((entry) => entry.name === name)
    if (!action) throw new Error(`Missing export action: ${name}`)
    expect(operationInputIssue(input, action.inputSchema)).toBeUndefined()
    const result = await action.execute(input, { signal })
    expect(operationInputIssue(result, action.outputSchema)).toBeUndefined()
    return result as {
      artifact: {
        artifactId: string
        bytes: number
        sha256: string
        revision: number
      }
      delivery?: string
      released?: boolean
    }
  }
  return {
    owner,
    invoke,
    source,
    output,
    blobs,
    unsubscribe,
    change: () => changed(),
    replace: () => {
      identity = {}
    }
  }
}

it('retains exact downloadable bytes across request cancellation and retries without reserializing', async () => {
  const f = fixture()
  const request = new AbortController()
  try {
    const result = await f.invoke(
      AiActionNames.EXPORT_DOCUMENT,
      {},
      request.signal
    )
    expect(result.artifact.bytes).toBeGreaterThan(0)
    const bytes = await [...f.blobs.values()][0].text()
    expect(JSON.parse(bytes)).toEqual(await f.source.save.mock.results[0].value)
    expect(result.artifact.sha256).toBe(
      createHash('sha256').update(bytes).digest('hex')
    )
    expect(JSON.stringify(result)).not.toContain('sceneTree')
    request.abort()
    for (let i = 0; i < 2; i++) {
      expect(
        (
          await f.invoke(AiActionNames.DOWNLOAD_DOCUMENT_EXPORT, {
            artifactId: result.artifact.artifactId
          })
        ).delivery
      ).toBe('download-requested')
    }
    expect(f.output.download).toHaveBeenCalledTimes(2)
    expect(f.source.save).toHaveBeenCalledOnce()
    expect(
      (
        await f.invoke(AiActionNames.RELEASE_DOCUMENT_EXPORT, {
          artifactId: result.artifact.artifactId
        })
      ).released
    ).toBe(true)
    await expect(
      f.invoke(AiActionNames.DOWNLOAD_DOCUMENT_EXPORT, {
        artifactId: result.artifact.artifactId
      })
    ).rejects.toThrow('unavailable')
    expect(
      (
        await f.invoke(AiActionNames.RELEASE_DOCUMENT_EXPORT, {
          artifactId: result.artifact.artifactId
        })
      ).released
    ).toBe(false)
  } finally {
    f.owner.dispose()
  }
  expect(f.unsubscribe).toHaveBeenCalledOnce()
  expect(f.output.release).toHaveBeenCalledOnce()
})

it.each(['change', 'replace', 'abort', 'dispose'] as const)(
  'rejects a snapshot invalidated during digest by %s without publishing it',
  async (event) => {
    const f = fixture()
    const request = new AbortController()
    f.output.digest.mockImplementationOnce(async () => {
      if (event === 'change') f.change()
      if (event === 'replace') f.replace()
      if (event === 'abort') request.abort()
      if (event === 'dispose') f.owner.dispose()
      return 'a'.repeat(64)
    })
    try {
      await expect(
        f.invoke(AiActionNames.EXPORT_DOCUMENT, {}, request.signal)
      ).rejects.toBeDefined()
      expect(f.output.create).not.toHaveBeenCalled()
      expect(f.blobs.size).toBe(0)
    } finally {
      f.owner.dispose()
    }
  }
)

it('preserves issued exports on capacity rejection and recovers only after explicit release', async () => {
  const f = fixture(100)
  try {
    const first = await f.invoke(AiActionNames.EXPORT_DOCUMENT)
    await expect(f.invoke(AiActionNames.EXPORT_DOCUMENT)).rejects.toThrow(
      'capacity'
    )
    await f.invoke(AiActionNames.DOWNLOAD_DOCUMENT_EXPORT, {
      artifactId: first.artifact.artifactId
    })
    await f.invoke(AiActionNames.RELEASE_DOCUMENT_EXPORT, {
      artifactId: first.artifact.artifactId
    })
    expect(
      (await f.invoke(AiActionNames.EXPORT_DOCUMENT)).artifact.artifactId
    ).not.toBe(first.artifact.artifactId)
  } finally {
    f.owner.dispose()
  }
  expect(f.blobs.size).toBe(0)
})

it('rejects overlapping snapshot work without queuing or duplicating serialization', async () => {
  const f = fixture()
  let finish!: (value: unknown) => void
  f.source.save.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      })
  )
  try {
    const first = f.invoke(AiActionNames.EXPORT_DOCUMENT)
    await expect(f.invoke(AiActionNames.EXPORT_DOCUMENT)).rejects.toThrow(
      'already'
    )
    finish({ version: '1.0.0' })
    await first
    expect(f.source.save).toHaveBeenCalledOnce()
  } finally {
    f.owner.dispose()
  }
})

it('keeps the original artifact after a download error and refuses foreign handles', async () => {
  const f = fixture()
  const other = fixture()
  try {
    const { artifact } = await f.invoke(AiActionNames.EXPORT_DOCUMENT)
    f.output.download.mockImplementationOnce(() => {
      throw new Error('blocked')
    })
    await expect(
      f.invoke(AiActionNames.DOWNLOAD_DOCUMENT_EXPORT, {
        artifactId: artifact.artifactId
      })
    ).rejects.toThrow('blocked')
    await expect(
      other.invoke(AiActionNames.DOWNLOAD_DOCUMENT_EXPORT, {
        artifactId: artifact.artifactId
      })
    ).rejects.toThrow('unavailable')
    await f.invoke(AiActionNames.DOWNLOAD_DOCUMENT_EXPORT, {
      artifactId: artifact.artifactId
    })
    expect(f.source.save).toHaveBeenCalledOnce()
  } finally {
    f.owner.dispose()
    other.owner.dispose()
  }
})

it('attempts every artifact release after a cleanup failure and retries only unreleased resources', async () => {
  const f = fixture()
  await f.invoke(AiActionNames.EXPORT_DOCUMENT)
  await f.invoke(AiActionNames.EXPORT_DOCUMENT)
  f.output.release.mockImplementationOnce(() => {
    throw new Error('release failed')
  })
  expect(() => f.owner.dispose()).toThrow('release failed')
  expect(f.output.release).toHaveBeenCalledTimes(2)
  expect(f.blobs.size).toBe(1)
  await expect(f.invoke(AiActionNames.EXPORT_DOCUMENT)).rejects.toThrow(
    'disposed'
  )
  f.owner.dispose()
  expect(f.output.release).toHaveBeenCalledTimes(3)
  expect(f.unsubscribe).toHaveBeenCalledOnce()
  expect(f.blobs.size).toBe(0)
})
