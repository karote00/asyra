import { expect, it } from 'vitest'
import { createHttpDocumentPersistenceClient } from '../document-persistence-client'

it.each([undefined, null, -1, 0.5, Number.MAX_SAFE_INTEGER + 1])(
  'rejects backend generation %s before returning a bootstrap checkpoint',
  async (documentGeneration) => {
    const checkpoint = {
      checkpoint: {},
      durableSequence: 0,
      documentGeneration
    }

    if (documentGeneration === undefined) {
      Reflect.deleteProperty(checkpoint, 'documentGeneration')
    }

    const client = createHttpDocumentPersistenceClient({
      baseURL: 'http://document.test',

      fetchImplementation: async () => ({
        ok: true,
        status: 200,

        json: async () => checkpoint
      })
    })

    await expect(client.readCheckpoint('document')).rejects.toThrow(
      'checkpoint is invalid'
    )
  }
)

it.each([0, 3])(
  'preserves explicit backend generation %s',
  async (documentGeneration) => {
    const checkpoint = {
      checkpoint: {},
      durableSequence: 0,
      documentGeneration
    }
    const client = createHttpDocumentPersistenceClient({
      baseURL: 'http://document.test',

      fetchImplementation: async () => ({
        ok: true,
        status: 200,

        json: async () => checkpoint
      })
    })

    await expect(client.readCheckpoint('document')).resolves.toEqual(checkpoint)
  }
)
