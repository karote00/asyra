import { act, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { InspectionDependencyChange } from '../../common-apis/inspection-dependencies'
import { NodeNumberInput } from '../node-number-input'

const source = vi.hoisted(() => ({
  id: 'first',
  value: 7,
  read: vi.fn(),
  stop: vi.fn(),
  changed: undefined as
    ((change?: InspectionDependencyChange) => void) | undefined
}))

vi.mock('../../providers', () => ({
  useElementSelection: () => new Set([source.id])
}))
vi.mock('../../contexts', () => ({
  default: {
    getElementMetadata: () => ({ type: 'marker' }),

    getElementComputedData: (id: string, keys: string[]) => {
      source.read(id, keys)

      return { abc: source.value }
    }
  }
}))
vi.mock('../../common-apis/inspection-evidence', () => ({
  observeInspectionChanges(
    notify: (change?: InspectionDependencyChange) => void
  ) {
    source.changed = notify

    return source.stop
  }
}))
vi.mock('../../common-apis/element', () => ({ elementApis: {} }))
vi.mock('../../common-apis/selection', () => ({ selectionApis: {} }))
vi.mock('../geometry-input', () => ({
  InspectorNumberInput: ({ value }: { value: number }) => (
    <output>{value}</output>
  )
}))

it('reads the selected numeric field only for relevant element changes and releases its subscriptions', () => {
  const item = {
    kind: 'node-number',
    id: 'marker.abc',
    nodeId: 'marker',
    field: 'abc',
    label: 'Z'
  } as const
  const view = render(<NodeNumberInput item={item} />)

  expect(screen.getByText('7')).toBeTruthy()
  source.read.mockClear()
  act(() => source.changed?.({ elementIds: ['other'] }))
  expect(source.read).not.toHaveBeenCalled()
  source.value = 8
  act(() => source.changed?.({ elementIds: ['first'] }))
  expect(screen.getByText('8')).toBeTruthy()
  expect(source.read).toHaveBeenCalledWith('first', ['abc'])
  source.id = 'second'
  view.rerender(<NodeNumberInput item={item} />)
  expect(source.stop).toHaveBeenCalledTimes(1)
  source.read.mockClear()
  act(() => source.changed?.({ elementIds: ['first'] }))
  expect(source.read).not.toHaveBeenCalled()
  view.unmount()
  expect(source.stop).toHaveBeenCalledTimes(2)
})
