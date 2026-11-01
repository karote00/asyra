import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { WorkspaceApp } from '../App'
import type { WorkspaceBundle } from '../types'
import flow from '../../../../docs/ai/tools/flow-inspector/plans/react-presentation-migration/presentation.flow.json'

it('mounts the selected architecture directly in the workspace React tree', () => {
  const bundle: WorkspaceBundle = {
    schema: { id: 'flow-inspector-workspace-bundle', version: 1 },
    generatedFrom: { discoveryRoots: [], candidatePaths: [] },
    exclusions: [],
    entries: [
      {
        id: 'react-presentation-migration',
        slug: 'react-presentation',
        title: 'React presentation',
        kind: 'flow-v2',
        group: 'Tools',
        subgroup: 'Flow Inspector',
        lifecycle: 'current',
        sourcePath:
          'tools/flow-inspector/inspectors/react-presentation.data.cjs',
        labels: [],
        data: {
          ...flow.definition.architecture,
          links: [
            {
              id: 'spec',
              kind: 'authority',
              label: 'Contract source',
              href: '../../../docs/contract.md'
            }
          ]
        }
      }
    ]
  }
  const { container } = render(
    <WorkspaceApp
      bundle={bundle}
      initialHash="#inspector=react-presentation-migration"
    />
  )

  expect(container.querySelector('iframe')).toBeNull()
  expect(
    screen.getByRole('button', { name: /React architecture presentation/ })
  ).toBeTruthy()
  expect(
    screen
      .getAllByRole('link', { name: 'Contract source' })[0]
      .getAttribute('href')
  ).toBe(new URL('/docs/contract.md', window.location.href).href)
})

it('renders explicitly registered contract documents without a version adapter', () => {
  const bundle: WorkspaceBundle = {
    schema: { id: 'flow-inspector-workspace-bundle', version: 1 },
    generatedFrom: { discoveryRoots: [], candidatePaths: [] },
    exclusions: [],
    entries: [
      {
        id: 'document',
        slug: 'document',
        title: 'Declared contract',
        kind: 'contract-document',
        group: 'Tools',
        subgroup: 'Contracts',
        lifecycle: 'current',
        sourcePath: 'docs/contract.cjs',
        labels: [],
        data: {
          purpose: 'Keep the declared meaning.',
          cases: [{ id: 'manual', summary: 'Human acceptance is required.' }]
        }
      }
    ]
  }
  const { container } = render(
    <WorkspaceApp bundle={bundle} initialHash="#inspector=document" />
  )

  expect(container.querySelector('iframe')).toBeNull()
  expect(
    screen.getByRole('article', { name: 'Contract document' }).textContent
  ).toContain('Human acceptance is required.')
  expect(
    screen.getByRole('heading', { name: 'Declared contract' })
  ).toBeTruthy()
})
