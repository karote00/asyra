const data = {
  schema: {
    id: 'flow-inspector',
    version: 2
  },
  target: {
    id: 'design-deletion',
    kind: 'app',
    title: 'Design Deletion',
    subtitle: 'Single-selection deletion responsibility'
  },
  authority: {
    specPath: 'docs/ai/apps/asyra-design/features/delete-element.md',
    inspectorPath:
      'tools/flow-inspector/inspectors/design-deletion-flow-inspector.data.cjs',
    semanticOwner: 'Asyra Design',
    inspectorOwner: 'Asyra Design'
  },
  links: [
    {
      id: 'product-contract',
      kind: 'authority',
      label: 'Delete behavior',
      href: '../../../docs/ai/apps/asyra-design/features/delete-element.md'
    }
  ],
  lanes: [
    {
      id: 'app',
      title: 'App Deletion',
      order: 1
    }
  ],
  steps: [
    {
      id: 'delete-selected-element',
      order: 1,
      laneId: 'app',
      title: 'Delete the selected element',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Route an eligible single-selection Delete action through the App element API in one transaction.',
      inputs: [
        'Delete shortcut snapshot',
        'current path-editing state and selected IDs',
        'App element, selection and system-context APIs'
      ],
      outputs: ['artifact:deletion-outcome'],
      conditions: [
        'For exactly one selected element outside path-editing mode, clear selection and invoke element deletion within the transaction.',
        'After successful deletion, reevaluate the hovered element at the current pointer position.'
      ],
      bypasses: [
        'Path editing or selection count other than one leaves element deletion unchanged.',
        'An unsuccessful element API deletion has no successful deletion result.'
      ],
      allowedContributors: [
        'App deletion feature',
        'App common APIs',
        'Core transaction API'
      ],
      forbiddenContributors: [
        'test observations as product state',
        'direct test-driven mutation of runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/delete-element/index.ts',
        'apps/asyra-design/src/common-apis/element/apis.ts',
        'apps/asyra-design/src/common-apis/selection.ts',
        'apps/asyra-design/src/common-apis/system-context.ts',
        'apps/asyra-design/e2e/test-utils.ts'
      ],
      specRefs: ['#behavior'],
      failureOwnerStepId: 'delete-selected-element'
    }
  ],
  routes: [
    {
      id: 'deletion-complete',
      from: 'delete-selected-element',
      kind: 'terminal',
      predicate: 'The eligible action settles or is bypassed.',
      producedArtifacts: ['artifact:deletion-outcome']
    }
  ],
  artifacts: [
    {
      id: 'artifact:deletion-outcome',
      ownerStepId: 'delete-selected-element',
      channel: 'App feature result',
      consumerStepIds: [],
      terminal: true
    }
  ],
  invariants: [],
  acceptanceContracts: []
}

globalThis.FLOW_INSPECTOR_DATA = data
if (typeof module !== 'undefined') module.exports = data
