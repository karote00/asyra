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
      type: 'frame',
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
  it('applies an expanded detail stage in ordered cooperative slices through one action', async () => {
    const design = prepareDesign(
      {
        type: 'group',
        name: 'Repeated facade',
        projection: {
          azimuth: 0,
          elevation: 0,
          scale: 1,
          originX: 0,
          originY: 20
        },
        children: [
          {
            type: 'pattern',
            key: 'panes',
            name: 'Panes',
            origin: { x: 0, y: 0, z: 0 },
            axes: [{ count: 1200, step: { x: 10, y: 0, z: 0 } }],
            faces: [
              {
                key: 'face',
                name: 'Face',
                fill: '#123456',
                vertices: [
                  { x: 0, y: 0, z: 0 },
                  { x: 8, y: 0, z: 0 },
                  { x: 8, y: 0, z: 8 },
                  { x: 0, y: 0, z: 8 }
                ]
              }
            ]
          }
        ]
      },
      'large-stage'
    )
    const api = apis(),
      paint = vi.fn(async () => undefined)
    const result = await createPreparedDesignAction(api, paint).execute(
      { design },
      context()
    )
    expect(result).toMatchObject({
      status: 'complete',
      timing: { elementCount: 1201, sliceCount: 39 }
    })
    const calls = vi.mocked(api.create).mock.calls
    expect(calls.flatMap(([entries]) => entries.map((e) => e.id))).toEqual(
      design.entries.map((e) => e.descriptor.id)
    )
    expect(calls.every(([entries]) => entries.length <= 32)).toBe(true)
    expect(api.select).toHaveBeenCalledExactlyOnceWith([design.rootId])
    expect(paint).toHaveBeenCalledTimes(39)
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
            type: 'frame',
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
      type: 'frame',
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

describe('mixed container prepared application', () => {
  it.each([false, true])(
    'applies a Group root (empty=%s) with ordinary canonical batches',
    async (empty) => {
      const design = prepareDesign({
        type: 'group',
        name: 'Artwork',
        children: empty
          ? []
          : [
              {
                key: 'region',
                type: 'frame',
                name: 'Region',
                width: 100,
                height: 80,
                children: [
                  {
                    key: 'parts',
                    type: 'group',
                    name: 'Parts',
                    children: [
                      {
                        key: 'shape',
                        type: 'rect',
                        name: 'Shape',
                        x: 10,
                        y: 20,
                        width: 30,
                        height: 40
                      }
                    ]
                  }
                ]
              }
            ]
      })
      const api = apis()
      await createPreparedDesignAction(api, async () => undefined).execute(
        { design },
        context()
      )
      expect(api.create).toHaveBeenCalled()
      expect(api.select).toHaveBeenCalledWith([design.rootId])
    }
  )
  it('rejects forged Group backgrounds rather than pretending they render', async () => {
    const design = JSON.parse(
      JSON.stringify(prepareDesign({ type: 'group', name: 'Empty' }))
    )
    design.entries[0].descriptor.fills = [
      {
        id: `${design.rootId}-fill`,
        type: 'fill',
        kind: 'solid',
        color: '#ffffff',
        opacity: 1,
        visible: true,
        colorFormat: 'hex',
        defaultColorFormat: 'hex',
        gradient: null
      }
    ]
    const api = apis()
    await expect(
      createPreparedDesignAction(api).execute({ design }, context())
    ).rejects.toThrow()
    expect(api.create).not.toHaveBeenCalled()
  })
})

it('measures canonical creation separately from cooperative paint waits', async () => {
  let clock = 0
  const api = apis()
  api.create = vi.fn((entries) => {
    clock += 3
    return entries.map((d) => d.id)
  })
  const paint = vi.fn(async () => {
    clock += 5
  })
  const action = createPreparedDesignAction(api, paint, () => clock)
  const result = await action.execute({ design: fixture() }, context())
  expect(result).toMatchObject({
    timing: {
      admissionMs: 0,
      createMs: 9,
      cooperativeYieldMs: 15,
      totalMs: 24,
      sliceCount: 3,
      elementCount: 3
    }
  })
})

it('yields to the host without requiring animation frames between prepared batches', async () => {
  const frame = vi.fn((callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  const yieldToHost = vi.fn(async () => undefined)
  vi.stubGlobal('requestAnimationFrame', frame)
  vi.stubGlobal('scheduler', { yield: yieldToHost })
  try {
    await createPreparedDesignAction(apis()).execute(
      { design: fixture() },
      context()
    )
    expect(frame).not.toHaveBeenCalled()
    expect(yieldToHost).toHaveBeenCalledTimes(3)
  } finally {
    vi.unstubAllGlobals()
  }
})

it('returns compact identity evidence without constructing full mapping receipts', async () => {
  const result = await createPreparedDesignAction(
    apis(),
    async () => undefined
  ).execute({ design: fixture(), response: 'compact' }, context())
  expect(result).toMatchObject({
    status: 'complete',
    compositionId: fixture().rootId,
    appliedElementCount: 3
  })
  expect(result).not.toHaveProperty('appliedElementIds')
  expect(result).not.toHaveProperty('keyToId')
  expect(result).not.toHaveProperty('roleToElementIds')
})
