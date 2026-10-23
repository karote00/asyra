// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { DEFAULT_WALKING_RUNTIME_SELECTION } from '../../domain/walking-runtime-selection'
import type { FarmRuntime } from '../../runtime/bootstrap'
import { LocaleProvider } from '../i18n/locale'
import { WalkingRuntimeSelector } from '../walking-runtime-selector'

it('routes explicit model choices to the canonical walking runtime selection', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const host = document.createElement('div')
  const root = createRoot(host)
  const setWalkingRuntimeSelection = vi.fn(
    async (_selection: ReturnType<FarmRuntime['getWalkingRuntimeSelection']>) =>
      undefined
  )
  const runtime = { setWalkingRuntimeSelection } as unknown as FarmRuntime
  const render = async (
    selection: ReturnType<FarmRuntime['getWalkingRuntimeSelection']>
  ) =>
    act(async () =>
      root.render(
        <LocaleProvider>
          <WalkingRuntimeSelector runtime={runtime} selection={selection} />
        </LocaleProvider>
      )
    )

  try {
    await render(DEFAULT_WALKING_RUNTIME_SELECTION)
    const [legacy, walking] = host.querySelectorAll('button')
    expect(legacy.ariaPressed).toBe('true')
    expect(walking.ariaPressed).toBe('false')

    await act(async () => walking.click())
    expect(setWalkingRuntimeSelection).toHaveBeenCalledTimes(1)
    const selected = setWalkingRuntimeSelection.mock.calls[0][0]
    expect(selected).toMatchObject({
      format: 'walking-runtime-selection/1',
      mode: 'walking-active',
      definition: {
        format: 'walking-robot-definition/2',
        definitionId: 'synthetic-harvest-walker-v2',
        topology: 'four-arm-six-leg',
        sourceModel: { kind: 'solid-articulation/2' }
      }
    })
    if (selected.mode !== 'walking-active') throw new Error('Expected walking')
    expect(selected.definition.legs).toHaveLength(6)
    expect(
      selected.definition.arms.map(({ side, role }) => `${side}-${role}`)
    ).toEqual(['left-support', 'left-cutter', 'right-support', 'right-cutter'])

    await render(selected)
    expect(walking.ariaPressed).toBe('true')
    expect(host.textContent).toContain('0.58 m')
    expect(host.textContent).toContain('目前僅供模型外觀與通行粗篩')
    expect(host.textContent).not.toContain('source/2')

    await act(async () => legacy.click())
    expect(setWalkingRuntimeSelection).toHaveBeenLastCalledWith(
      DEFAULT_WALKING_RUNTIME_SELECTION
    )
  } finally {
    await act(async () => root.unmount())
    vi.unstubAllGlobals()
    localStorage.clear()
  }
})
