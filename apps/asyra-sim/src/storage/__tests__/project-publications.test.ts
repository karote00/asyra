import { expect, it, vi } from 'vitest'
import { ProjectSession } from '../project-session'
import type { ProjectRepository, ProjectSnapshot } from '../project-format'

const snapshot: ProjectSnapshot = {
  document: {
    version: '1.0.0',
    sceneTree: { workspace: '', workspaceList: [], elements: {} },
    props: {}
  },
  loadIssues: []
}
const entry = (id: string) => ({
  version: 1 as const,
  publication: {
    publicationId: id,
    artifactId: id,
    transactionId: 1,
    origin: 'action' as const,
    mode: 'atomic' as const,
    slices: [
      {
        sliceId: id,
        orderedIds: [id],
        batches: [
          {
            batchId: id,
            channel: 'props',
            deliveries: [
              {
                deliveryId: id,
                orderedIds: [id],
                eventName: 'updateProperty',
                payload: {
                  action: 'updateProperty',
                  id: 'property',
                  key: 'value',
                  before: 0,
                  after: 1
                }
              }
            ]
          }
        ]
      }
    ]
  },
  resources: {}
})

it('queues every publication immediately, preserves blocked-write order and never captures ordinary edits', async () => {
  let release: () => void = () => undefined
  const blocked = new Promise<void>((resolve) => {
    release = resolve
  })
  const append = vi
    .fn()
    .mockImplementationOnce(() => blocked)
    .mockResolvedValue(undefined)
  const repository = {
    write: vi.fn(async () => undefined),
    append,
    close: vi.fn()
  } as unknown as ProjectRepository
  const capture = vi.fn(async () => snapshot)
  const session = new ProjectSession(repository, {
    capture,
    apply: vi.fn(async () => [])
  })
  await session.start()
  session.markEdited(entry('first'))
  await vi.waitFor(() => expect(append).toHaveBeenCalledOnce())
  session.markEdited(entry('second'))
  session.markEdited(entry('undo'))
  expect(capture).toHaveBeenCalledOnce()
  expect(session.getState().dirty).toBe(true)
  release()
  await session.flush()
  expect(
    append.mock.calls.map((call) => call[2].publication.publicationId)
  ).toEqual(['first', 'second', 'undo'])
  expect(capture).toHaveBeenCalledOnce()
  expect(session.getState().status).toBe('saved')
  session.close()
})

it('creates a current checkpoint copy after a rejected append without overwriting the acknowledged project', async () => {
  const repository = {
    write: vi.fn(async () => undefined),
    append: vi.fn(async () => {
      throw new Error('Project exceeds the journal budget')
    }),
    close: vi.fn()
  } as unknown as ProjectRepository
  const capture = vi.fn(async () => snapshot)
  const session = new ProjectSession(repository, {
    capture,
    apply: vi.fn(async () => [])
  })
  await session.start()
  const original = session.getState().project
  session.markEdited(entry('pending'))
  await expect(session.flush()).rejects.toThrow('budget')
  await session.copy('Recovered copy')
  expect(capture).toHaveBeenCalledTimes(2)
  expect(repository.write).toHaveBeenCalledTimes(2)
  expect(session.getState()).toMatchObject({
    dirty: false,
    status: 'saved',
    project: { name: 'Recovered copy' }
  })
  expect(session.getState().project?.id).not.toBe(original?.id)
  session.close()
})
