import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { WorkspaceApp } from '../App'
import { parseWorkspaceRoute } from '../routing'
import type { InspectorGroup, WorkspaceBundle } from '../types'
import flow from '../../../../docs/ai/tools/flow-inspector/plans/react-presentation-migration/presentation.flow.json'

const groups: InspectorGroup[] = ['Apps', 'Framework', 'Release', 'Tools']
const names = ['app', 'framework', 'release', 'tool']
const bundle: WorkspaceBundle = {
  schema: { id: 'flow-inspector-workspace-bundle', version: 1 },
  generatedFrom: { discoveryRoots: [], candidatePaths: [] },
  exclusions: [
    { path: 'docs/retired-flow-inspector.data.cjs', reason: 'superseded' }
  ],
  entries: names.map((name, index) => ({
    id: `${name}-flow`,
    slug: name,
    title: `${name} Flow`,
    kind: 'flow-v2',
    group: groups[index],
    subgroup: groups[index],
    lifecycle: 'current',
    sourcePath: `docs/${name}-flow-inspector.data.cjs`,
    labels: [name],
    data: {
      ...flow.definition.architecture,
      target: {
        ...flow.definition.architecture.target,
        id: `${name}-flow`,
        title: `${name} architecture`
      }
    }
  }))
}

afterEach(() => window.history.replaceState(null, '', '/'))

describe('workspace routing contract', () => {
  it('selects exact hash and short-route identities without fallback', () => {
    expect(parseWorkspaceRoute('', bundle)).toEqual({ kind: 'overview' })
    expect(parseWorkspaceRoute('#inspector=app-flow', bundle)).toMatchObject({
      kind: 'selected',
      entry: bundle.entries[0]
    })
    expect(parseWorkspaceRoute('', bundle, '/app')).toMatchObject({
      kind: 'selected',
      entry: bundle.entries[0]
    })

    for (const pathname of ['/missing', '/retired', '/app/extra', '/%2Fapp']) {
      expect(
        parseWorkspaceRoute('#inspector=app-flow', bundle, pathname)
      ).toMatchObject({ kind: 'error' })
    }

    expect(parseWorkspaceRoute('#inspector=retired', bundle)).toMatchObject({
      kind: 'error',
      excluded: true
    })
  })

  it('replaces a workspace hash with the hosted slug without adding history', () => {
    window.history.replaceState(
      null,
      '',
      '/tools/flow-inspector/workspace/workspace.html#inspector=app-flow'
    )
    const length = window.history.length
    render(<WorkspaceApp bundle={bundle} routingMode="path" />)

    expect(window.location.pathname).toBe('/app')
    expect(window.location.hash).toBe('')
    expect(window.history.length).toBe(length)
    expect(
      screen.getByRole('heading', { name: 'app architecture' })
    ).toBeTruthy()
  })
})

describe('React workspace', () => {
  it('renders all catalog groups without claiming runtime status', () => {
    render(<WorkspaceApp bundle={bundle} initialHash="" />)

    expect(screen.getByRole('heading', { name: /one place/i })).toBeTruthy()
    expect(screen.getAllByTestId('inspector-entry')).toHaveLength(4)

    for (const group of groups) {
      expect(screen.getByTestId(`group-${group}`)).toBeTruthy()
    }

    expect(document.body.textContent).not.toMatch(/runtime healthy/i)
  })

  it('keeps the selected canvas and its selection during search and panel toggles', () => {
    render(<WorkspaceApp bundle={bundle} initialHash="#inspector=app-flow" />)
    const viewport = screen.getByRole('region', { name: 'Inspector flow' })
    fireEvent.click(
      screen.getByRole('button', { name: /Direct React workspace composition/ })
    )
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'framework' }
    })

    expect(screen.getAllByTestId('inspector-entry')).toHaveLength(1)
    expect(screen.getByRole('region', { name: 'Inspector flow' })).toBe(
      viewport
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Close Inspector catalog' })
    )

    expect(
      screen.queryByRole('complementary', { name: 'Inspector catalog' })
    ).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'Open Inspector catalog' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }))

    expect(
      screen.queryByRole('complementary', { name: 'Step contract' })
    ).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show details' }))

    expect(
      within(
        screen.getByRole('complementary', { name: 'Step contract' })
      ).getByRole('heading', { name: 'Direct React workspace composition' })
    ).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Inspector flow' })).toBe(
      viewport
    )
  })

  it('collapses and restores groups without changing membership', () => {
    render(<WorkspaceApp bundle={bundle} initialHash="" />)
    const group = screen.getByTestId('group-Framework')
    fireEvent.click(
      within(group).getByRole('button', { name: 'Collapse Framework' })
    )

    expect(within(group).queryByTestId('inspector-entry')).toBeNull()
    fireEvent.click(
      within(group).getByRole('button', { name: 'Expand Framework' })
    )

    expect(within(group).getByTestId('inspector-entry')).toBeTruthy()
  })

  it('navigates and restores browser history using fresh target state', () => {
    window.history.replaceState(null, '', '/app')
    render(<WorkspaceApp bundle={bundle} routingMode="path" />)
    const original = screen.getByRole('region', { name: 'Inspector flow' })
    fireEvent.click(screen.getByRole('button', { name: /framework Flow/ }))

    expect(window.location.pathname).toBe('/framework')
    expect(screen.getByRole('region', { name: 'Inspector flow' })).not.toBe(
      original
    )
    window.history.replaceState(null, '', '/app')
    fireEvent.popState(window)

    expect(
      screen.getByRole('heading', { name: 'app architecture' })
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }))

    expect(window.location.pathname).toBe('/')
    expect(screen.queryByRole('region', { name: 'Inspector flow' })).toBeNull()
  })

  it('does not accept obsolete cross-document panel messages', () => {
    render(<WorkspaceApp bundle={bundle} initialHash="#inspector=app-flow" />)
    fireEvent(
      window,
      new MessageEvent('message', {
        data: {
          type: 'flow-inspector:panel-visibility',
          panel: 'catalog',
          visible: false
        }
      })
    )

    expect(
      screen.getByRole('complementary', { name: 'Inspector catalog' })
    ).toBeTruthy()
  })
})
