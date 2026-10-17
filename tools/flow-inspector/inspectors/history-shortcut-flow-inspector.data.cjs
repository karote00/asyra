const data = {
  schema: {
    id: 'flow-inspector',
    version: 2
  },
  target: {
    id: 'history-shortcut',
    kind: 'app',
    title: 'History Shortcut',
    subtitle: 'App Undo/Redo routing and completion'
  },
  authority: {
    specPath: 'docs/ai/apps/asyra-design/features/undo-redo.md',
    inspectorPath:
      'tools/flow-inspector/inspectors/history-shortcut-flow-inspector.data.cjs',
    semanticOwner: 'Asyra Design',
    inspectorOwner: 'Asyra Design'
  },
  links: [
    {
      id: 'product-contract',
      kind: 'authority',
      label: 'Undo/Redo behavior',
      href: '../../../docs/ai/apps/asyra-design/features/undo-redo.md'
    }
  ],
  lanes: [
    {
      id: 'app',
      title: 'App Shortcut',
      order: 1
    }
  ],
  steps: [
    {
      id: 'select-history-replay',
      order: 1,
      laneId: 'app',
      title: 'Select and await history replay',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Choose Undo or Redo from the shortcut and await the App history API.',
      inputs: ['Captured detail.historyDirection intent', 'App history API completion'],
      outputs: ['artifact:history-shortcut-outcome'],
      conditions: [
        'Consume captured undo or redo intent; later modifier state cannot reverse it.',
        'Missing or invalid captured intent invokes neither direction.',
        'Keep exclusive execution pending until the requested replay settles.'
      ],
      bypasses: [
        'No alternate replay direction or early success is permitted.'
      ],
      allowedContributors: ['App shortcut definition', 'App history API'],
      forbiddenContributors: [
        'direct Factory stack mutation',
        'test output as product state'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/undo-redo/index.ts',
        'apps/asyra-design/src/common-apis/history.ts',
        'apps/asyra-design/src/features/undo-redo/__tests__/feature.test.ts'
      ],
      specRefs: ['#behavior', '#contract'],
      failureOwnerStepId: 'select-history-replay'
    }
  ],
  routes: [
    {
      id: 'shortcut-complete',
      from: 'select-history-replay',
      kind: 'terminal',
      predicate: 'The selected replay completes.',
      producedArtifacts: ['artifact:history-shortcut-outcome']
    }
  ],
  artifacts: [
    {
      id: 'artifact:history-shortcut-outcome',
      ownerStepId: 'select-history-replay',
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
