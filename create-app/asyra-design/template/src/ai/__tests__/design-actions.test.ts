import { describe, expect, it, vi } from 'vitest'
import { prepareDesign } from '../../../server/design-preparation'
import {
  createPreparedDesignAction,
  type PreparedDesignApis
} from '../design-actions'
import type { PreparedDesign } from '../prepared-design'

const fixture = () =>
  prepareDesign(
    {
      name: 'Editorial page',
      width: 800,
      height: 600,
      children: [
        {
          key: 'section',
          name: 'Section',
          type: 'frame',
          width: 700,
          height: 500,
          children: [
            {
              key: 'heading',
              name: 'Heading',
              type: 'text',
              width: 600,
              height: 60,
              text: 'Editable 世界',
              fontSize: 32,
              lineHeight: 40
            }
          ]
        }
      ]
    },
    'application'
  )
const apis = (): PreparedDesignApis => ({
  getWorkspaceId: () => 'workspace',
  isLocked: () => false,
  getElementType: () => undefined,
  create: vi.fn((entries) => entries.map((d) => d.id)),
  select: vi.fn()
})
const context = () => ({ signal: new AbortController().signal }) as never
const mutable = () => JSON.parse(JSON.stringify(fixture()))

describe('prepared editable design application', () => {
  it('creates ordered native hierarchy, preserves literal text and returns semantic IDs', async () => {
    const api = apis(),
      paint = vi.fn(async () => undefined)
    const design = fixture()
    const result = await createPreparedDesignAction(api, paint).execute(
      { design },
      context()
    )
    expect(api.create).toHaveBeenNthCalledWith(
      1,
      [design.entries[0].descriptor],
      'workspace'
    )
    expect(api.create).toHaveBeenNthCalledWith(
      2,
      [design.entries[1].descriptor],
      design.rootId
    )
    expect(api.create).toHaveBeenNthCalledWith(
      3,
      [design.entries[2].descriptor],
      design.entries[1].descriptor.id
    )
    expect(result).toMatchObject({
      status: 'complete',
      compositionId: design.rootId,
      keyToId: design.keyToId
    })
    expect(paint).toHaveBeenCalledTimes(3)
  })
  it.each([
    (d: ReturnType<typeof mutable>) => {
      d.version = 99
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[1].parentId = d.entries[2].descriptor.id
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.id = d.rootId
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.width = Infinity
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.type = 'image'
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.fontSize = -2
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[2].descriptor.props.typography = 'existing-property'
    },
    (d: ReturnType<typeof mutable>) => {
      d.keyToId.heading = 'unrelated'
    },
    (d: ReturnType<typeof mutable>) => {
      d.entries[0].descriptor.children = ['existing']
    }
  ])('rejects malformed whole artifacts before writing', async (change) => {
    const design = mutable()
    change(design)
    const api = apis()
    await expect(
      createPreparedDesignAction(api).execute({ design }, context())
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
  it('admits native cubic topology and rejects disconnected or foreign controls before writes', async () => {
    const make = () =>
      JSON.parse(
        JSON.stringify(
          prepareDesign({
            name: 'Illustration',
            width: 200,
            height: 200,
            children: [
              {
                key: 'petal',
                name: 'Petal',
                type: 'vector',
                width: 100,
                height: 100,
                fill: '#ff8800',
                rings: [
                  [
                    { x: 0, y: 50, outControl: { x: 0, y: 0 } },
                    { x: 100, y: 50, inControl: { x: 100, y: 0 } },
                    { x: 50, y: 100 }
                  ]
                ]
              }
            ]
          })
        )
      )
    const api = apis(),
      action = createPreparedDesignAction(api, async () => undefined)
    await expect(
      action.execute({ design: make() }, context())
    ).resolves.toMatchObject({ status: 'complete' })
    vi.mocked(api.create).mockClear()
    const broken = make(),
      d = broken.entries[1].descriptor
    const segment = Object.keys(d.segments)[0]
    d.segments[segment].inControlId = 'foreign-control'
    await expect(
      action.execute({ design: broken }, context())
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
  it('consumes an isolated snapshot across yields and stops if the target workspace changes', async () => {
    const source = mutable(),
      api = apis()
    const paint = vi.fn(async () => {
      source.entries[2].descriptor.text = 'tampered'
    })
    await createPreparedDesignAction(api, paint).execute(
      { design: source },
      context()
    )
    expect(vi.mocked(api.create).mock.calls[2][0][0].text).toBe('Editable 世界')
    vi.mocked(api.create).mockClear()
    const switchWorkspace = async () => {
      api.getWorkspaceId = () => 'other-workspace'
    }
    await expect(
      createPreparedDesignAction(api, switchWorkspace).execute(
        { design: fixture() },
        context()
      )
    ).rejects.toThrow('no longer available')
    expect(api.create).toHaveBeenCalledTimes(1)
  })
  it('rejects collisions and locked workspaces before creating anything', async () => {
    const api = apis(),
      design = fixture()
    api.getElementType = () => 'rect'
    await expect(
      createPreparedDesignAction(api).execute({ design }, context())
    ).rejects.toThrow()
    api.getElementType = () => undefined
    api.isLocked = () => true
    await expect(
      createPreparedDesignAction(api).execute({ design }, context())
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
  it('does not remove completed work when a later creation fails', async () => {
    const api = apis(),
      design = fixture()
    api.create = vi
      .fn()
      .mockReturnValueOnce([design.rootId])
      .mockImplementationOnce(() => {
        throw new Error('creation failed')
      })
    await expect(
      createPreparedDesignAction(api, async () => undefined).execute(
        { design },
        context()
      )
    ).rejects.toThrow('creation failed')
    expect(api.create).toHaveBeenCalledTimes(2)
    expect(api.select).not.toHaveBeenCalled()
  })
  it('honors abort before mutation and between chunks', async () => {
    const controller = new AbortController(),
      api = apis(),
      design = fixture()
    const action = createPreparedDesignAction(api, async () =>
      controller.abort()
    )
    await expect(
      action.execute({ design }, { signal: controller.signal } as never)
    ).rejects.toThrow()
    expect(api.create).toHaveBeenCalledTimes(1)
    vi.mocked(api.create).mockClear()
    await expect(
      action.execute({ design }, { signal: controller.signal } as never)
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
  it('batches wide siblings and yields without copying or changing canonical IDs', async () => {
    const api = apis(),
      paint = vi.fn(async () => undefined)
    const design: PreparedDesign = prepareDesign({
      name: 'Library',
      width: 1000,
      height: 1000,
      children: Array.from({ length: 70 }, (_, i) => ({
        key: `item-${i}`,
        name: `Item ${i}`,
        type: 'rect',
        width: 10,
        height: 10,
        fill: '#ffffff'
      }))
    })
    await createPreparedDesignAction(api, paint).execute({ design }, context())
    expect(vi.mocked(api.create).mock.calls.map(([ds]) => ds.length)).toEqual([
      1, 32, 32, 6
    ])
    expect(paint).toHaveBeenCalledTimes(4)
  })
})

it('registers prepared application with the conversation runtime', async () => {
  const { createAiRuntimeInput } = await import('../runtime-input')
  const input = createAiRuntimeInput({
    provider: { requestActionBatch: vi.fn() },
    permissionRules: { apply_prepared_design: 'allow' }
  })
  expect(
    input.actionDefinitions.some((a) => a.name === 'apply_prepared_design')
  ).toBe(true)
})
