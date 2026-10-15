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
        'A successful local no-op settles retained History shared evidence so changed siblings can publish; it adds no local rollback restoration. A thrown owner failure cannot settle its delivery.',
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
    },
    {
      id: 'record-history-action',
      order: 2,
      laneId: 'factory',
      title: 'Record one canonical History action',
      ownerPackage: '@asyra/factory',
      purpose:
        'Record ordinary append-only events or owner-issued replace-latest candidates while preserving exact event order and metadata.',
      inputs: [
        'Canonical owner events, active transaction and staged delivery controller'
      ],
      outputs: ['artifact:record-history-action-outcome'],
      conditions: [
        'Record ordinary append-only events or owner-issued replace-latest candidates while preserving exact event order and metadata.'
      ],
      bypasses: [
        'Invalid or settled transaction/controller cannot fabricate an active action.'
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
      implementationBoundary: [
        'packages/factory/src/factory.ts',
        'packages/factory/src/data-transact.ts'
      ],
      specRefs: ['#current-runtime-contracts', '#instance-contract'],
      failureOwnerStepId: 'record-history-action'
    },
    {
      id: 'rollback-history-action',
      order: 3,
      laneId: 'factory',
      title: 'Roll back uncommitted History',
      ownerPackage: '@asyra/factory',
      purpose:
        'Reverse every applied journal entry on rollback without creating a committed History action; empty actions remain empty.',
      inputs: [
        'Canonical owner events, active transaction and staged delivery controller'
      ],
      outputs: ['artifact:rollback-history-action-outcome'],
      conditions: [
        'Reverse every applied journal entry on rollback without creating a committed History action; empty actions remain empty.'
      ],
      bypasses: [
        'Invalid or settled transaction/controller cannot fabricate an active action.'
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
      implementationBoundary: [
        'packages/factory/src/factory.ts',
        'packages/factory/src/data-transact.ts'
      ],
      specRefs: ['#current-runtime-contracts', '#instance-contract'],
      failureOwnerStepId: 'rollback-history-action'
    },
    {
      id: 'settle-staged-delivery',
      order: 4,
      laneId: 'factory',
      title: 'Settle staged delivery',
      ownerPackage: '@asyra/factory',
      purpose:
        'Publish the canonical staged sequence through a delivery-only handle and invalidate that handle after settlement.',
      inputs: [
        'Canonical owner events, active transaction and staged delivery controller'
      ],
      outputs: ['artifact:settle-staged-delivery-outcome'],
      conditions: [
        'Publish the canonical staged sequence through a delivery-only handle and invalidate that handle after settlement.'
      ],
      bypasses: [
        'Invalid or settled transaction/controller cannot fabricate an active action.'
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
      implementationBoundary: [
        'packages/factory/src/factory.ts',
        'packages/factory/src/data-transact.ts'
      ],
      specRefs: ['#current-runtime-contracts', '#instance-contract'],
      failureOwnerStepId: 'settle-staged-delivery'
    }
  ],
  routes: [
    {
      id: 'history-replay-complete',
      from: 'replay-history-action',
      kind: 'terminal',
      predicate: 'The requested replay settles successfully.',
      producedArtifacts: ['artifact:history-replay-outcome']
    },
    {
      id: 'record-history-action-complete',
      from: 'record-history-action',
      kind: 'terminal',
      predicate:
        'The canonical transaction settles or explicitly rejects the request.',
      producedArtifacts: ['artifact:record-history-action-outcome']
    },
    {
      id: 'rollback-history-action-complete',
      from: 'rollback-history-action',
      kind: 'terminal',
      predicate:
        'The canonical transaction settles or explicitly rejects the request.',
      producedArtifacts: ['artifact:rollback-history-action-outcome']
    },
    {
      id: 'settle-staged-delivery-complete',
      from: 'settle-staged-delivery',
      kind: 'terminal',
      predicate:
        'The canonical transaction settles or explicitly rejects the request.',
      producedArtifacts: ['artifact:settle-staged-delivery-outcome']
    }
  ],
  artifacts: [
    {
      id: 'artifact:history-replay-outcome',
      ownerStepId: 'replay-history-action',
      channel: 'Factory replay completion and owner events',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:record-history-action-outcome',
      ownerStepId: 'record-history-action',
      channel: 'Record one canonical History action outcome',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:rollback-history-action-outcome',
      ownerStepId: 'rollback-history-action',
      channel: 'Roll back uncommitted History outcome',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:settle-staged-delivery-outcome',
      ownerStepId: 'settle-staged-delivery',
      channel: 'Settle staged delivery outcome',
      consumerStepIds: [],
      terminal: true
    }
  ],
  invariants: [],
  acceptanceContracts: []
}

globalThis.FLOW_INSPECTOR_DATA = data
if (typeof module !== 'undefined') module.exports = data
