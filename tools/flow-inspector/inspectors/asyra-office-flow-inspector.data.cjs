/* Static architecture only; dynamic Office admission is not implemented by the Factory-specific proof service. */
;(function () {
  const data = {
    schema: {
      id: 'flow-inspector',
      version: 2
    },
    target: {
      id: 'asyra-office',
      kind: 'application',
      title: 'Asyra Office interaction flow',
      subtitle:
        'Source evidence, canonical layout, transient spatial presentation'
    },
    authority: {
      specPath: 'docs/ai/apps/asyra-office/implementation.md',
      inspectorPath:
        'tools/flow-inspector/inspectors/asyra-office-flow-inspector.data.cjs',
      semanticOwner: 'Asyra Office and Preset owners',
      inspectorOwner: 'Flow Inspector'
    },
    links: [],
    lanes: [
      {
        id: 'product',
        title: 'Office owners',
        order: 1
      }
    ],
    steps: [
      {
        id: 'admit-source',
        order: 1,
        laneId: 'product',
        title: 'Validate source evidence and retain accepted activity',
        purpose: 'Validate source evidence and retain accepted activity',
        ownerPackage: '@asyra/preset',
        inputs: [
          'versioned provider events',
          'connection fidelity',
          'archive acknowledgement'
        ],
        outputs: ['artifact:activity'],
        conditions: [
          'Reject invalid batches atomically; source sequence deduplicates replay; archive failure publishes no state.'
        ],
        bypasses: ['No unvalidated input may bypass the owner.'],
        allowedContributors: ['@asyra/preset'],
        forbiddenContributors: [
          'React editable copies',
          'raw provider tokens in scene',
          'renderer-owned document writes'
        ],
        cacheDimensions: [],
        implementationBoundary: ['packages/preset/src/agent-activity.ts'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#integration-and-projections'
        ],
        failureOwnerStepId: 'admit-source'
      },
      {
        id: 'project-agent',
        order: 2,
        laneId: 'product',
        title: 'Publish bounded per-agent semantic projections',
        purpose: 'Publish bounded per-agent semantic projections',
        ownerPackage: '@asyra/preset',
        inputs: ['artifact:activity'],
        outputs: ['artifact:agent-projection'],
        conditions: [
          'New attempts supersede old attempts; unrelated agents receive zero notifications; history remains retained.'
        ],
        bypasses: ['No unvalidated input may bypass the owner.'],
        allowedContributors: ['@asyra/preset'],
        forbiddenContributors: [
          'React editable copies',
          'raw provider tokens in scene',
          'renderer-owned document writes'
        ],
        cacheDimensions: [],
        implementationBoundary: ['packages/preset/src/agent-activity.ts'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#integration-and-projections'
        ],
        failureOwnerStepId: 'project-agent'
      },
      {
        id: 'validate-layout',
        order: 3,
        laneId: 'product',
        title: 'Admit attributed human or agent layout proposal',
        purpose: 'Admit attributed human or agent layout proposal',
        ownerPackage: '@asyra/asyra-office',
        inputs: ['user intent', 'expected revision', 'canonical room'],
        outputs: ['artifact:layout-intent'],
        conditions: [
          'Use one Feature/API path; invalid placement or stale proposal rejects before mutation.'
        ],
        bypasses: ['No unvalidated input may bypass the owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'React editable copies',
          'raw provider tokens in scene',
          'renderer-owned document writes'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-office/src/domain/layout.ts',
          'apps/asyra-office/src/runtime/layout-controller.ts'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#layout-and-persistence'
        ],
        failureOwnerStepId: 'validate-layout'
      },
      {
        id: 'commit-layout',
        order: 4,
        laneId: 'product',
        title: 'Commit canonical layout and project publication',
        purpose: 'Commit canonical layout and project publication',
        ownerPackage: '@asyra/core',
        inputs: ['artifact:layout-intent'],
        outputs: ['artifact:layout'],
        conditions: [
          'One accepted finite edit has one Undo boundary; load and history use canonical apply.'
        ],
        bypasses: ['No unvalidated input may bypass the owner.'],
        allowedContributors: ['@asyra/core'],
        forbiddenContributors: [
          'React editable copies',
          'raw provider tokens in scene',
          'renderer-owned document writes'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/core/src/core.ts',
          'apps/asyra-office/src/runtime/layout-controller.ts'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#layout-and-persistence'
        ],
        failureOwnerStepId: 'commit-layout'
      },
      {
        id: 'retain-layout',
        order: 5,
        laneId: 'product',
        title: 'Acknowledge versioned local layout checkpoint',
        purpose: 'Acknowledge versioned local layout checkpoint',
        ownerPackage: '@asyra/asyra-office',
        inputs: ['artifact:layout'],
        outputs: ['artifact:saved-layout'],
        conditions: [
          'Explicit snapshot storage; reject malformed load and failed writes without claiming saved.'
        ],
        bypasses: ['No unvalidated input may bypass the owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'React editable copies',
          'raw provider tokens in scene',
          'renderer-owned document writes'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-office/src/runtime/layout-controller.ts'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#layout-and-persistence'
        ],
        failureOwnerStepId: 'retain-layout'
      },
      {
        id: 'compose-office',
        order: 6,
        laneId: 'product',
        title: 'Compose room, chibi, pet and waypoint presentation',
        purpose: 'Compose room, chibi, pet and waypoint presentation',
        ownerPackage: '@asyra/asyra-office',
        inputs: [
          'artifact:layout',
          'artifact:agent-projection',
          'camera and waypoint intent'
        ],
        outputs: ['artifact:spatial-scene'],
        conditions: [
          'Camera and interpolation never write layout; task working returns to anchor; ambient movement remains simulated.'
        ],
        bypasses: ['No unvalidated input may bypass the owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'React editable copies',
          'raw provider tokens in scene',
          'renderer-owned document writes'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-office/src/scene/office-scene.ts',
          'apps/asyra-office/src/ui/OfficeApp.tsx'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#office-interaction'
        ],
        failureOwnerStepId: 'compose-office'
      },
      {
        id: 'render-spatial',
        order: 7,
        laneId: 'product',
        title: 'Render shared spatial scene through CUSTOM provider',
        purpose: 'Render shared spatial scene through CUSTOM provider',
        ownerPackage: '@asyra/preset',
        inputs: ['artifact:spatial-scene'],
        outputs: ['artifact:visible-office'],
        conditions: [
          'Optional shared Three.js adapter retains lifecycle, resource disposal and app-selected lighting/capability.'
        ],
        bypasses: ['No unvalidated input may bypass the owner.'],
        allowedContributors: ['@asyra/preset'],
        forbiddenContributors: [
          'React editable copies',
          'raw provider tokens in scene',
          'renderer-owned document writes'
        ],
        cacheDimensions: [],
        implementationBoundary: ['packages/preset/src/spatial/'],
        specRefs: ['docs/ai/apps/asyra-office/implementation.md#foundation'],
        failureOwnerStepId: 'render-spatial'
      }
    ],
    routes: [
      {
        id: 'admit-source-to-project-agent',
        from: 'admit-source',
        to: 'project-agent',
        kind: 'required',
        predicate:
          'The producing owner has admitted the input and completed its output.',
        producedArtifacts: ['artifact:activity']
      },
      {
        id: 'project-agent-to-compose-office',
        from: 'project-agent',
        to: 'compose-office',
        kind: 'required',
        predicate:
          'The producing owner has admitted the input and completed its output.',
        producedArtifacts: ['artifact:agent-projection']
      },
      {
        id: 'validate-layout-to-commit-layout',
        from: 'validate-layout',
        to: 'commit-layout',
        kind: 'required',
        predicate:
          'The producing owner has admitted the input and completed its output.',
        producedArtifacts: ['artifact:layout-intent']
      },
      {
        id: 'commit-layout-to-retain-layout',
        from: 'commit-layout',
        to: 'retain-layout',
        kind: 'required',
        predicate:
          'The producing owner has admitted the input and completed its output.',
        producedArtifacts: ['artifact:layout']
      },
      {
        id: 'commit-layout-to-compose-office',
        from: 'commit-layout',
        to: 'compose-office',
        kind: 'required',
        predicate:
          'The producing owner has admitted the input and completed its output.',
        producedArtifacts: ['artifact:layout']
      },
      {
        id: 'retain-layout-complete',
        from: 'retain-layout',
        kind: 'terminal',
        predicate:
          'The exact output is available; no broader completion is implied.',
        producedArtifacts: ['artifact:saved-layout']
      },
      {
        id: 'compose-office-to-render-spatial',
        from: 'compose-office',
        to: 'render-spatial',
        kind: 'required',
        predicate:
          'The producing owner has admitted the input and completed its output.',
        producedArtifacts: ['artifact:spatial-scene']
      },
      {
        id: 'render-spatial-complete',
        from: 'render-spatial',
        kind: 'terminal',
        predicate:
          'The exact output is available; no broader completion is implied.',
        producedArtifacts: ['artifact:visible-office']
      }
    ],
    artifacts: [
      {
        id: 'artifact:activity',
        ownerStepId: 'admit-source',
        channel: 'projection',
        consumerStepIds: ['project-agent']
      },
      {
        id: 'artifact:agent-projection',
        ownerStepId: 'project-agent',
        channel: 'projection',
        consumerStepIds: ['compose-office']
      },
      {
        id: 'artifact:layout-intent',
        ownerStepId: 'validate-layout',
        channel: 'projection',
        consumerStepIds: ['commit-layout']
      },
      {
        id: 'artifact:layout',
        ownerStepId: 'commit-layout',
        channel: 'projection',
        consumerStepIds: ['retain-layout', 'compose-office']
      },
      {
        id: 'artifact:saved-layout',
        ownerStepId: 'retain-layout',
        channel: 'projection',
        consumerStepIds: [],
        terminal: true
      },
      {
        id: 'artifact:spatial-scene',
        ownerStepId: 'compose-office',
        channel: 'projection',
        consumerStepIds: ['render-spatial']
      },
      {
        id: 'artifact:visible-office',
        ownerStepId: 'render-spatial',
        channel: 'projection',
        consumerStepIds: [],
        terminal: true
      }
    ],
    invariants: [
      {
        id: 'independent-authority',
        statement:
          'Runtime task evidence, canonical layout and transient movement have separate owners.',
        stepIds: [
          'admit-source',
          'project-agent',
          'validate-layout',
          'commit-layout',
          'retain-layout',
          'compose-office',
          'render-spatial'
        ],
        artifactIds: [
          'artifact:activity',
          'artifact:agent-projection',
          'artifact:layout-intent',
          'artifact:layout',
          'artifact:saved-layout',
          'artifact:spatial-scene',
          'artifact:visible-office'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#integration-and-projections'
        ]
      }
    ],
    acceptanceContracts: [
      {
        id: 'office-path',
        assertions: [
          'A retained semantic event updates only its agent; one validated layout edit supports Undo, save/load; scene motion never becomes document state.'
        ],
        stepIds: [
          'admit-source',
          'project-agent',
          'validate-layout',
          'commit-layout',
          'retain-layout',
          'compose-office',
          'render-spatial'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#cases-and-verification'
        ]
      }
    ]
  }
  if (typeof module !== 'undefined') module.exports = data
  if (typeof globalThis !== 'undefined') globalThis.FLOW_INSPECTOR_DATA = data
})()
