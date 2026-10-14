const data = {
  schema: {
    id: 'flow-inspector',
    version: 2
  },
  target: {
    id: 'history-replay',
    kind: 'system',
    title: 'History Replay',
    subtitle: 'Factory action order and inverse values'
  },
  authority: {
    specPath: 'docs/ai/framework/packages/factory.md',
    inspectorPath:
      'tools/flow-inspector/inspectors/history-replay-flow-inspector.data.cjs',
    semanticOwner: '@asyra/factory',
    inspectorOwner: 'Asyra Framework'
  },
  links: [
    {
      id: 'product-contract',
      kind: 'authority',
      label: 'Factory replay contract',
      href: '../../../docs/ai/framework/packages/factory.md'
    }
  ],
  lanes: [
    {
      id: 'factory',
      title: 'Factory',
      order: 1
    }
  ],
  steps: [
    {
      id: 'replay-history-action',
      order: 1,
      laneId: 'factory',
      title: 'Replay the committed History action',
      ownerPackage: '@asyra/factory',
      purpose:
        'Replay one committed action through its owning Factory with inverse Undo and forward Redo.',
      inputs: [
        'committed local History action',
        'requested Undo or Redo direction',
        'registered transaction replay handlers'
      ],
      outputs: ['artifact:history-replay-outcome'],
      conditions: [
        'Undo delivers inverse events in reverse order; Redo delivers forward events in original order.',
        'A staged gesture replays its first-before/latest-after values as one action.',
        'Successful replay moves the source entry between stacks without creating another ordinary action.'
      ],
      bypasses: [
        'An empty source stack produces no replay; rejected or failed replay cannot claim successful settlement.'
      ],
      allowedContributors: [
        'Factory instance routing',
        'DataTransact history and replay',
        'registered state-owner replay handlers'
      ],
      forbiddenContributors: [
        'App shortcut policy',
        'Flow Inspector observations as runtime state',
        'inferred payload semantics'
      ],
      cacheDimensions: [],
      implementationBoundary: ['packages/factory/src/**'],
      specRefs: ['#current-runtime-contracts', '#instance-contract'],
      failureOwnerStepId: 'replay-history-action'
    }
  ],
  routes: [
    {
      id: 'history-replay-complete',
      from: 'replay-history-action',
      kind: 'terminal',
      predicate: 'The requested replay settles successfully.',
      producedArtifacts: ['artifact:history-replay-outcome']
    }
  ],
  artifacts: [
    {
      id: 'artifact:history-replay-outcome',
      ownerStepId: 'replay-history-action',
      channel: 'Factory replay completion and owner events',
      consumerStepIds: [],
      terminal: true
    }
  ],
  invariants: [],
  acceptanceContracts: []
}

globalThis.FLOW_INSPECTOR_DATA = data
if (typeof module !== 'undefined') module.exports = data
