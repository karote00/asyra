import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { ArchitectureView } from '../architecture/ArchitectureView'
import type { ArchitectureData } from '../architecture/types'
import { validateArchitecture } from '../architecture/validate'
import flow from '../../../../docs/ai/tools/flow-inspector/plans/react-presentation-migration/presentation.flow.json'

describe('React architecture presentation', () => {
  it('admits every published architecture in the workspace catalog', () => {
    const context: {
      FLOW_INSPECTOR_WORKSPACE_BUNDLE?: {
        entries: { id: string; kind: string; data: ArchitectureData }[]
      }
    } = {}
    runInNewContext(
      readFileSync('workspace/workspace-bundle.data.js', 'utf8'),
      context
    )

    for (const entry of context.FLOW_INSPECTOR_WORKSPACE_BUNDLE?.entries ??
      []) {
      if (entry.kind === 'flow-v2') {
        expect(validateArchitecture(entry.data), entry.id).toEqual([])
      }
    }
  })

  it('rejects inconsistent artifact ownership before presenting a runnable canvas', () => {
    const data = structuredClone(flow.definition.architecture)
    const artifact = data.artifacts[0]
    const owner = data.steps.find((step) => step.id !== artifact.ownerStepId)
    expect(owner).toBeDefined()
    artifact.ownerStepId = owner?.id ?? ''

    const { container } = render(<ArchitectureView data={data} />)

    expect(screen.getByRole('alert').textContent).toContain(
      `${artifact.id}:owner-output`
    )
    expect(container.querySelectorAll('[data-step-id]')).toHaveLength(0)
  })

  it('renders and selects admitted steps without a frame or legacy viewer', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <ArchitectureView
        data={flow.definition.architecture}
        onSelect={onSelect}
      />
    )

    expect(container.querySelector('iframe')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelectorAll('[data-step-id]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-route-id]')).toHaveLength(4)
    fireEvent.click(
      screen.getByRole('button', { name: /React workspace composition/ })
    )

    expect(onSelect).toHaveBeenLastCalledWith('workspace')
    const detail = screen.getByRole('complementary', { name: 'Step contract' })

    expect(
      within(detail).getByRole('heading', {
        name: 'Direct React workspace composition'
      })
    ).toBeTruthy()
    expect(within(detail).getByText('Incoming routes')).toBeTruthy()
    expect(within(detail).getByText('Forbidden contributors')).toBeTruthy()
  })

  it('filters steps and routes together and moves selection into the visible lane', () => {
    const data = structuredClone(flow.definition.architecture)
    data.lanes.push({ id: 'delivery', title: 'Delivery', order: 2 })
    data.steps[3].laneId = 'delivery'
    const onSelect = vi.fn()
    const { container } = render(
      <ArchitectureView data={data} onSelect={onSelect} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delivery' }))

    expect(container.querySelectorAll('[data-step-id]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-route-id]')).toHaveLength(0)
    expect(onSelect).toHaveBeenLastCalledWith('delivery')
    fireEvent.click(screen.getByRole('button', { name: 'All' }))

    expect(container.querySelectorAll('[data-step-id]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-route-id]')).toHaveLength(4)
    expect(
      container
        .querySelector('[data-route-id="workspace-to-delivery"]')
        ?.getAttribute('d')
    ).toBe('M 350 404 C 470 404, 410 152, 530 152')
  })

  it('fits all lanes and supports scoped reset shortcuts', () => {
    render(<ArchitectureView data={flow.definition.architecture} />)
    const viewport = screen.getByRole('region', { name: 'Inspector flow' })
    Object.defineProperties(viewport, {
      clientWidth: { value: 800, configurable: true },
      clientHeight: { value: 600, configurable: true }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Fit all' }))

    expect(Number(viewport.getAttribute('data-zoom-scale'))).toBeLessThan(1)
    fireEvent.keyDown(viewport, { key: '0', code: 'Digit0', shiftKey: true })

    expect(viewport.getAttribute('data-zoom-scale')).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'Fit all' }))
    fireEvent.keyDown(document, { key: '0', metaKey: true })

    expect(viewport.getAttribute('data-zoom-scale')).toBe('1')
  })

  it('preserves selection across snapshot refresh and shows current contract content', () => {
    const { rerender } = render(
      <ArchitectureView data={flow.definition.architecture} />
    )
    fireEvent.click(
      screen.getByRole('button', { name: /React workspace composition/ })
    )
    const refreshed = structuredClone(flow.definition.architecture)
    refreshed.steps[1].purpose = 'The refreshed current contract.'
    rerender(<ArchitectureView data={refreshed} />)
    const detail = screen.getByRole('complementary', { name: 'Step contract' })

    expect(
      within(detail).getByText('The refreshed current contract.')
    ).toBeTruthy()
    expect(
      within(detail).getByRole('heading', {
        name: 'Direct React workspace composition'
      })
    ).toBeTruthy()
  })

  it('supports authoritative selection without replacing the caller task panel', () => {
    render(
      <ArchitectureView
        data={flow.definition.architecture}
        selectedStepId="services"
        renderTask={(id) => (
          <label>
            Task note
            <input aria-label="Task note" defaultValue={id} />
          </label>
        )}
      />
    )
    const detail = screen.getByRole('complementary', { name: 'Step contract' })

    expect(
      within(detail).getByRole('heading', {
        name: 'React live service presentation'
      })
    ).toBeTruthy()
    expect(
      (screen.getByRole('textbox', { name: 'Task note' }) as HTMLInputElement)
        .value
    ).toBe('services')
  })

  it('keeps authored content inert and opens reference links safely', () => {
    const data: ArchitectureData = structuredClone(flow.definition.architecture)
    data.target.title = '<img src=x onerror=alert(1)>'
    data.links.push({
      id: 'reference',
      kind: 'authority',
      label: 'Specification',
      href: 'https://example.com/spec'
    })
    const { container } = render(<ArchitectureView data={data} />)

    expect(
      screen.getByRole('heading', { name: data.target.title })
    ).toBeTruthy()
    expect(container.querySelector('img')).toBeNull()
    const link = screen.getAllByRole('link', { name: 'Specification' })[0]

    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('renders an empty admitted architecture without manufacturing a step', () => {
    const data = {
      ...flow.definition.architecture,
      steps: [],
      routes: [],
      artifacts: []
    }
    const { container } = render(<ArchitectureView data={data} />)

    expect(screen.getByText('No steps are declared.')).toBeTruthy()
    expect(container.querySelectorAll('[data-step-id]')).toHaveLength(0)
  })

  it('zooms around the pointer without rebuilding the architecture and removes its listener on unmount', () => {
    const data = { ...flow.definition.architecture }
    const steps = vi.fn(() => flow.definition.architecture.steps)
    Object.defineProperty(data, 'steps', { get: steps })
    const { unmount } = render(<ArchitectureView data={data} />)
    const viewport = screen.getByRole('region', { name: 'Inspector flow' })
    viewport.scrollLeft = 100
    viewport.scrollTop = 200
    const reads = steps.mock.calls.length
    const wheel = new WheelEvent('wheel', {
      ctrlKey: true,
      deltaY: -100,
      clientX: 50,
      clientY: 60,
      cancelable: true,
      bubbles: true
    })
    fireEvent(viewport, wheel)
    const scale = Number(viewport.getAttribute('data-zoom-scale'))

    expect(wheel.defaultPrevented).toBe(true)
    expect((viewport.scrollLeft + 50) / scale).toBeCloseTo(150)
    expect((viewport.scrollTop + 60) / scale).toBeCloseTo(260)
    expect(steps).toHaveBeenCalledTimes(reads)
    unmount()
    const afterUnmount = new WheelEvent('wheel', {
      ctrlKey: true,
      deltaY: -100,
      cancelable: true
    })
    viewport.dispatchEvent(afterUnmount)

    expect(afterUnmount.defaultPrevented).toBe(false)
  })
})
