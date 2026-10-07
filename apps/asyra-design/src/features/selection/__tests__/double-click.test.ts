import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SystemContextSnapshot } from '@asyra/utils'
import core from '@asyra/core'
import { GROUP_COMPONENT_DEFINITION } from '@asyra/preset'

const mocks = vi.hoisted(() => ({
  definitions: new Map<
    string,
    {
      priority: number
      exclusive: boolean
      execution: (snapshot: SystemContextSnapshot) => unknown
    }
  >(),
  getSelectedIds: vi.fn(() => ['container']),
  getElementType: vi.fn(() => 'custom-group'),
  isContainerType: vi.fn(() => true),
  getPathEditingMode: vi.fn(() => false),
  resolveChild: vi.fn(() => 'child' as string | null),
  selectElements: vi.fn()
}))
vi.mock('@asyra/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@asyra/core')>()),
  defineFeature: (name: string, _event: string, definition: never) => {
    mocks.definitions.set(name, definition)
    return { api: {}, dispose: vi.fn() }
  }
}))
vi.mock('../../../common-apis', () => ({
  elementApis: {
    getElementType: mocks.getElementType,
    isContainerType: mocks.isContainerType
  },
  selectionApis: {
    getSelectedIds: mocks.getSelectedIds,
    selectElements: mocks.selectElements
  },
  systemContextApis: { getPathEditingMode: mocks.getPathEditingMode },
  transactionApis: {}
}))
vi.mock('../../../controllers/canvas-hierarchy-target', () => ({
  resolveCanvasHierarchyTargetAtClientPos: vi.fn(),
  resolveContainerChildAtClientPos: mocks.resolveChild
}))
import { FeatureNames, PrimaryToolType } from '../../../constants'
import '../feature'

const snapshot = {
  primaryTool: PrimaryToolType.SELECT,
  mousePosition: { x: 30, y: 40 },
  keyShift: false,
  keyMeta: false,
  keyCtrl: false,
  keyAlt: false
} as SystemContextSnapshot
const definition = () => {
  const feature = mocks.definitions.get(FeatureNames.SELECT_CONTAINER_CHILD)
  expect(feature, 'registered container double-click Feature').toBeDefined()
  if (!feature) throw new Error('Missing container double-click Feature')
  return feature
}

describe('container double-click selection Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSelectedIds.mockReturnValue(['container'])
    mocks.getElementType.mockReturnValue('custom-group')
    mocks.isContainerType.mockReturnValue(true)
    mocks.getPathEditingMode.mockReturnValue(false)
    mocks.resolveChild.mockReturnValue('child')
  })

  it('uses registered container capability and consumes the event before vector editing', () => {
    const feature = definition()
    expect(feature.priority).toBeGreaterThan(90)
    expect(feature.exclusive).toBe(true)
    expect(feature.execution(snapshot)).not.toBeNull()
    expect(mocks.isContainerType).toHaveBeenCalledWith('custom-group')
    expect(mocks.resolveChild).toHaveBeenCalledWith(
      'container',
      snapshot.mousePosition
    )
    expect(mocks.selectElements).toHaveBeenCalledExactlyOnceWith(['child'])
  })

  it('recognizes a custom registration derived from the Group definition', () => {
    const type = 'selection-test-container'
    core.defineComponent({
      ...GROUP_COMPONENT_DEFINITION,
      type,
      idPrefix: 'selection-test',
      namePrefix: 'Selection test container',
      properties: [],
      registration: undefined
    })
    try {
      mocks.getElementType.mockReturnValue(type)
      mocks.isContainerType.mockImplementation((type) =>
        core.isContainerType(type)
      )
      expect(definition().execution(snapshot)).not.toBeNull()
      expect(mocks.selectElements).toHaveBeenCalledExactlyOnceWith(['child'])
    } finally {
      core.unregisterComponent(type)
    }
  })

  it.each(['keyShift', 'keyMeta', 'keyCtrl', 'keyAlt'])(
    'preserves modifier %s',
    (modifier) => {
      expect(
        definition().execution({ ...snapshot, [modifier]: true })
      ).toBeNull()
      expect(mocks.resolveChild).not.toHaveBeenCalled()
    }
  )

  it('preserves other tools and path editing', () => {
    expect(
      definition().execution({ ...snapshot, primaryTool: PrimaryToolType.PEN })
    ).toBeNull()
    mocks.getPathEditingMode.mockReturnValue(true)
    expect(definition().execution(snapshot)).toBeNull()
    expect(mocks.selectElements).not.toHaveBeenCalled()
  })

  it('requires a single container and leaves leaf double-click handling available', () => {
    for (const ids of [[], ['a', 'b']]) {
      mocks.getSelectedIds.mockReturnValue(ids)
      expect(definition().execution(snapshot)).toBeNull()
    }
    mocks.getSelectedIds.mockReturnValue(['vector'])
    mocks.isContainerType.mockReturnValue(false)
    expect(definition().execution(snapshot)).toBeNull()
    expect(mocks.resolveChild).not.toHaveBeenCalled()
  })

  it('leaves selection unchanged when the controller rejects the hit', () => {
    mocks.resolveChild.mockReturnValue(null)
    expect(definition().execution(snapshot)).toBeNull()
    expect(mocks.selectElements).not.toHaveBeenCalled()
  })
})
