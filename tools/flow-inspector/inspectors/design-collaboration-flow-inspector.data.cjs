const data = {
  schema: {
    id: 'flow-inspector',
    version: 2
  },
  target: {
    id: 'design-collaboration',
    kind: 'app',
    title: 'Design Collaboration Responsibilities',
    subtitle: 'Original participant evidence and declared investigation entries'
  },
  authority: {
    specPath:
      'docs/ai/apps/asyra-design/specs/collaboration-failure-responsibilities.md',
    inspectorPath:
      'tools/flow-inspector/inspectors/design-collaboration-flow-inspector.data.cjs',
    semanticOwner: 'Asyra Design and Factory',
    inspectorOwner: 'Asyra Design'
  },
  links: [],
  lanes: [
    {
      id: 'app',
      title: 'App operations',
      order: 1
    },
    {
      id: 'framework',
      title: 'Framework projections and transactions',
      order: 2
    }
  ],
  steps: [
    {
      id: 'observe-session-state',
      order: 1,
      laneId: 'app',
      title: 'Observe session transitions',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Publish connection transitions once without treating initial connection as recovery.',
      inputs: [
        'Previous connection state (none, connected or disconnected)',
        'Next settled connection state (connected or disconnected)'
      ],
      outputs: ['artifact:observe-session-state-outcome'],
      conditions: [
        'An unchanged state emits no notification. Initial none-to-connected is silent; none/connected-to-disconnected emits disconnected and disconnected-to-connected emits reconnected. Returning to none is invalid.'
      ],
      bypasses: [
        'An unchanged connection state returns changed=false and no notification.'
      ],
      allowedContributors: [
        'Session connection transitions from the lifecycle controller',
        'Status toast rendering of the declared notification'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/collaboration/lifecycle.ts',
        'apps/asyra-design/src/render-app/status-toast-stack.tsx'
      ],
      specRefs: ['#observe-session-state'],
      failureOwnerStepId: 'observe-session-state'
    },
    {
      id: 'recover-document-session',
      order: 2,
      laneId: 'app',
      title: 'Recover document session',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Reconcile the file-scoped outbox against the authoritative checkpoint and generation while retaining local edits.',
      inputs: [
        'Active document, actor and generation identity',
        'Authoritative server checkpoint and generation',
        'File-scoped pending publication outbox and recovery cutoff'
      ],
      outputs: ['artifact:recover-document-session-outcome'],
      conditions: [
        'Recovery restores the authoritative checkpoint before replaying eligible local outbox records. Reset changes generation; a prior-generation removal must not replay. Retained stale sources cannot apply during recovery and separate document rooms remain isolated.'
      ],
      bypasses: [
        'Stale document/generation sources and ineligible outbox entries cannot apply; disconnected sessions retain pending local work for reconciliation.'
      ],
      allowedContributors: [
        'Document lifecycle controller',
        'File-scoped publication outbox',
        'WebSocket provider and authoritative document checkpoint'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/collaboration/lifecycle.ts',
        'apps/asyra-design/src/collaboration/publication-outbox.ts',
        'apps/asyra-design/src/collaboration/websocket-provider.ts'
      ],
      specRefs: ['#recover-document-session'],
      failureOwnerStepId: 'recover-document-session'
    },
    {
      id: 'publish-history-members',
      order: 3,
      laneId: 'framework',
      title: 'Publish finite History members',
      ownerPackage: '@asyra/factory',
      purpose:
        'Publish canonical finite members while preserving one local Undo and Redo action.',
      inputs: [
        'Factory-owned active HistoryGroupHandle',
        'Finite canonical member callback and its transaction journal/delivery evidence'
      ],
      outputs: ['artifact:publish-history-members-outcome'],
      conditions: [
        'Enroll each finite member at an idle group boundary. Members publish through the ordinary transaction path while the completed local group supplies one Undo/Redo action with original member order. Group handles must belong to the active Factory owner.'
      ],
      bypasses: [
        'Invalid or unavailable group handles and non-idle boundaries reject enrollment; observation evidence cannot create a History entry.'
      ],
      allowedContributors: [
        'DataTransact History group lifecycle',
        'Canonical transaction journals and shared delivery records'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: ['packages/factory/src/data-transact.ts'],
      specRefs: ['#publish-history-members'],
      failureOwnerStepId: 'publish-history-members'
    },
    {
      id: 'apply-remote-publication',
      order: 4,
      laneId: 'app',
      title: 'Apply remote canonical publication',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Validate received publications and apply canonical slices through Core without adding receiver History or echo publications.',
      inputs: [
        'Received SharedPublication with explicit slice, batch and delivery order',
        'Active document session and generation',
        'Canonical Core state and public remote-apply APIs'
      ],
      outputs: ['artifact:apply-remote-publication-outcome'],
      conditions: [
        'Validate slice/batch/delivery evidence before canonical application. Preserve peer hierarchy, geometry and partial property fields; remote application creates no receiver-local History action or echo publication.'
      ],
      bypasses: [
        'Invalid publication evidence is rejected; stale session sources cannot apply.'
      ],
      allowedContributors: [
        'Remote publication organizer and apply owner',
        'Current document lifecycle admission',
        'Core public canonical apply APIs'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/collaboration/operations.ts',
        'apps/asyra-design/src/collaboration/lifecycle.ts'
      ],
      specRefs: ['#apply-remote-publication'],
      failureOwnerStepId: 'apply-remote-publication'
    },
    {
      id: 'forward-live-publication',
      order: 5,
      laneId: 'app',
      title: 'Forward live canonical publication',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Forward committed document-channel publications while preserving immediate gesture frames and canonical order.',
      inputs: [
        'Factory SharedPublication subscription',
        'Scene-tree and props channel slices, ordered batches and deliveries'
      ],
      outputs: ['artifact:forward-live-publication-outcome'],
      conditions: [
        'Retain document-channel deliveries and their order; skip empty output. Atomic multi-slice publications collapse to one transport slice. Immediate gesture publications reach peers before pointer-up; local-only computed projections cannot enter shared transport.'
      ],
      bypasses: [
        'A publication with no document-channel deliveries is not forwarded. Computed projection events are rejected.'
      ],
      allowedContributors: [
        'Factory shared-publication subscription',
        'Document publication source adapter',
        'Active document lifecycle transport'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/collaboration/factory-adapter.ts',
        'apps/asyra-design/src/collaboration/lifecycle.ts'
      ],
      specRefs: ['#forward-live-publication'],
      failureOwnerStepId: 'forward-live-publication'
    }
  ],
  routes: [
    {
      id: 'observe-session-state-complete',
      from: 'observe-session-state',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:observe-session-state-outcome']
    },
    {
      id: 'recover-document-session-complete',
      from: 'recover-document-session',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:recover-document-session-outcome']
    },
    {
      id: 'publish-history-members-complete',
      from: 'publish-history-members',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:publish-history-members-outcome']
    },
    {
      id: 'apply-remote-publication-complete',
      from: 'apply-remote-publication',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:apply-remote-publication-outcome']
    },
    {
      id: 'forward-live-publication-complete',
      from: 'forward-live-publication',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:forward-live-publication-outcome']
    }
  ],
  artifacts: [
    {
      id: 'artifact:observe-session-state-outcome',
      ownerStepId: 'observe-session-state',
      channel: 'Start and reset the editor result',
      consumerStepIds: [],
      terminal: true,
      title: 'Observe session transitions outcome',
      description:
        'Publish connection transitions once without treating initial connection as recovery.'
    },
    {
      id: 'artifact:recover-document-session-outcome',
      ownerStepId: 'recover-document-session',
      channel: 'Start and reset the editor result',
      consumerStepIds: [],
      terminal: true,
      title: 'Recover document session outcome',
      description:
        'Reconcile the file-scoped outbox against the authoritative checkpoint and generation while retaining local edits.'
    },
    {
      id: 'artifact:publish-history-members-outcome',
      ownerStepId: 'publish-history-members',
      channel: 'Start and reset the editor result',
      consumerStepIds: [],
      terminal: true,
      title: 'Publish finite History members outcome',
      description:
        'Publish canonical finite members while preserving one local Undo and Redo action.'
    },
    {
      id: 'artifact:apply-remote-publication-outcome',
      ownerStepId: 'apply-remote-publication',
      channel: 'Start and reset the editor result',
      consumerStepIds: [],
      terminal: true,
      title: 'Apply remote canonical publication outcome',
      description:
        'Validate received publications and apply canonical slices through Core without adding receiver History or echo publications.'
    },
    {
      id: 'artifact:forward-live-publication-outcome',
      ownerStepId: 'forward-live-publication',
      channel: 'Start and reset the editor result',
      consumerStepIds: [],
      terminal: true,
      title: 'Forward live canonical publication outcome',
      description:
        'Forward committed document-channel publications while preserving immediate gesture frames and canonical order.'
    }
  ],
  invariants: [],
  acceptanceContracts: []
}

globalThis.FLOW_INSPECTOR_DATA = data
if (typeof module !== 'undefined') {module.exports = data}
