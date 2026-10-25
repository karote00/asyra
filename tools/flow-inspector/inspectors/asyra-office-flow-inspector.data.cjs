;(function () {
  const data = {
    schema: {
      id: 'flow-inspector',
      version: 2
    },
    target: {
      id: 'asyra-office',
      kind: 'application',
      title: 'Asyra Office rebuild',
      subtitle:
        'Modular assets, retained work, canonical growth and independent presentation'
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
        title: 'Product owners',
        order: 1
      }
    ],
    steps: [
      {
        id: 'construct-asset',
        order: 1,
        laneId: 'product',
        title: 'Construct approved modular assets',
        purpose: 'Construct approved modular assets',
        ownerPackage: '@asyra/asyra-office',
        inputs: [
          'approved asset specification',
          'requested extents and appearance'
        ],
        outputs: ['artifact:asset'],
        conditions: [
          'Validate complete geometry before publication; retain named regions, physical UVs and LoD error. Unsupported capability stops production.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-office/src/assets/'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#asset-construction-boundary'
        ],
        failureOwnerStepId: 'construct-asset'
      },
      {
        id: 'preview-asset',
        order: 2,
        laneId: 'product',
        title: 'Review one asset through Core',
        purpose: 'Review one asset through Core',
        ownerPackage: '@asyra/asyra-office',
        inputs: ['artifact:asset', 'review camera intent'],
        outputs: ['artifact:preview-scene'],
        conditions: [
          'Read-only asset session; camera updates reuse completed meshes. Core startup, resize and cleanup are owned here.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-office/src/preview/',
          'apps/asyra-office/src/main.tsx'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#stage-1---wall-asset-harness'
        ],
        failureOwnerStepId: 'preview-asset'
      },
      {
        id: 'admit-source',
        order: 3,
        laneId: 'product',
        title: 'Retain validated provider evidence',
        purpose: 'Retain validated provider evidence',
        ownerPackage: '@asyra/asyra-office',
        inputs: [
          'provider events',
          'connection identity and fidelity',
          'archive acknowledgement'
        ],
        outputs: ['artifact:activity'],
        conditions: [
          'Admit whole batches atomically; explicit gaps do not prove streaks or rewards. Requires durable archive proof before execution.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-office/src/connections/'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#integration-and-projections'
        ],
        failureOwnerStepId: 'admit-source'
      },
      {
        id: 'project-agent',
        order: 4,
        laneId: 'product',
        title: 'Project keyed tasks and work',
        purpose: 'Project keyed tasks and work',
        ownerPackage: '@asyra/asyra-office',
        inputs: ['artifact:activity'],
        outputs: ['artifact:work'],
        conditions: [
          'Keep full task assignment separate from last activity. Updates notify only affected keys.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-office/src/work/'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#integration-and-projections'
        ],
        failureOwnerStepId: 'project-agent'
      },
      {
        id: 'membership',
        order: 5,
        laneId: 'product',
        title: 'Maintain stable membership and work anchors',
        purpose: 'Maintain stable membership and work anchors',
        ownerPackage: '@asyra/asyra-office',
        inputs: ['validated membership intent', 'canonical membership'],
        outputs: ['artifact:members'],
        conditions: [
          'Retain identity on departure; first join produces attributable onboarding evidence. Preview actors cannot earn grants.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-office/src/membership/'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#office-interaction'
        ],
        failureOwnerStepId: 'membership'
      },
      {
        id: 'life',
        order: 6,
        laneId: 'product',
        title: 'Choose bounded ambient routes',
        purpose: 'Choose bounded ambient routes',
        ownerPackage: '@asyra/asyra-office',
        inputs: ['artifact:work', 'artifact:members', 'artifact:layout'],
        outputs: ['artifact:pose'],
        conditions: [
          'Work is immediate even during walking. Validate traversal and occupancy; no provider completion from animation.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-office/src/life/'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#office-interaction'
        ],
        failureOwnerStepId: 'life'
      },
      {
        id: 'validate-layout',
        order: 7,
        laneId: 'product',
        title: 'Validate decorate, dress and expand intent',
        purpose: 'Validate decorate, dress and expand intent',
        ownerPackage: '@asyra/asyra-office',
        inputs: [
          'human or agent Feature intent',
          'expected revision',
          'canonical layout',
          'configured authority and balance'
        ],
        outputs: ['artifact:layout-intent'],
        conditions: [
          'Validate complete candidate, fit, contact, passages and funds before mutation; invalid or stale input commits nothing.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-office/src/layout/'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#layout-and-persistence'
        ],
        failureOwnerStepId: 'validate-layout'
      },
      {
        id: 'commit-layout',
        order: 8,
        laneId: 'product',
        title: 'Commit canonical layout and local spending',
        purpose: 'Commit canonical layout and local spending',
        ownerPackage: '@asyra/core',
        inputs: ['artifact:layout-intent'],
        outputs: ['artifact:layout'],
        conditions: [
          'Core transaction owns layout writes; spending and acquired benefits settle atomically. Undo cannot replay external rewards.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/core'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/core/src/',
          'apps/asyra-office/src/document/'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#layout-and-persistence'
        ],
        failureOwnerStepId: 'commit-layout'
      },
      {
        id: 'retain-layout',
        order: 9,
        laneId: 'product',
        title: 'Persist ordered publications and recover',
        purpose: 'Persist ordered publications and recover',
        ownerPackage: '@asyra/asyra-office',
        inputs: ['artifact:layout', 'canonical publication'],
        outputs: ['artifact:saved-layout'],
        conditions: [
          'Acknowledge only durable source-bound writes. Invalid restore preserves the previous valid document.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-office/src/persistence/'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#layout-and-persistence'
        ],
        failureOwnerStepId: 'retain-layout'
      },
      {
        id: 'reward',
        order: 10,
        laneId: 'product',
        title: 'Grant attributed personal and office achievements',
        purpose: 'Grant attributed personal and office achievements',
        ownerPackage: '@asyra/asyra-office',
        inputs: [
          'artifact:activity',
          'artifact:members',
          'artifact:pose',
          'accepted grant identities'
        ],
        outputs: ['artifact:awards'],
        conditions: [
          'First-agent recognition is immediate. Qualify and deduplicate evidence; learning achievements never farm currency.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-office/src/progression/'],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#office-interaction'
        ],
        failureOwnerStepId: 'reward'
      },
      {
        id: 'compose-office',
        order: 11,
        laneId: 'product',
        title: 'Compose full office and focused UI',
        purpose: 'Compose full office and focused UI',
        ownerPackage: '@asyra/asyra-office',
        inputs: [
          'artifact:asset',
          'artifact:layout',
          'artifact:work',
          'artifact:members',
          'artifact:pose',
          'artifact:awards',
          'place or agent camera intent'
        ],
        outputs: ['artifact:spatial-scene'],
        conditions: [
          'Full reference composition; task click only follows its agent. Simulation and work stay separate; hidden presentation does not stop canonical work.'
        ],
        bypasses: ['No invalid input bypasses this owner.'],
        allowedContributors: ['@asyra/asyra-office'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-office/src/scene/',
          'apps/asyra-office/src/ui/'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#office-interaction'
        ],
        failureOwnerStepId: 'compose-office'
      },
      {
        id: 'render-spatial',
        order: 12,
        laneId: 'product',
        title: 'Render through the official 3D provider',
        purpose: 'Render through the official 3D provider',
        ownerPackage: '@asyra/preset',
        inputs: ['artifact:preview-scene', 'artifact:spatial-scene'],
        outputs: ['artifact:visible-office'],
        conditions: [
          'Accept preview OR office scene through Core. Shared descriptor admission, projected-error LoD and resource lifecycle remain authoritative.'
        ],
        bypasses: [
          'Preview needs only preview-scene; full Office needs spatial-scene.'
        ],
        allowedContributors: ['@asyra/preset'],
        forbiddenContributors: [
          'renderer-owned canonical writes',
          'raw provider tokens in geometry',
          'independent React document copies'
        ],
        cacheDimensions: [],
        implementationBoundary: ['packages/preset/src/spatial/'],
        specRefs: ['docs/ai/apps/asyra-office/implementation.md#foundation'],
        failureOwnerStepId: 'render-spatial'
      }
    ],
    routes: [
      {
        id: 'construct-asset-to-preview-asset',
        from: 'construct-asset',
        to: 'preview-asset',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:asset']
      },
      {
        id: 'construct-asset-to-compose-office',
        from: 'construct-asset',
        to: 'compose-office',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:asset']
      },
      {
        id: 'preview-asset-to-render-spatial',
        from: 'preview-asset',
        to: 'render-spatial',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:preview-scene']
      },
      {
        id: 'admit-source-to-project-agent',
        from: 'admit-source',
        to: 'project-agent',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:activity']
      },
      {
        id: 'admit-source-to-reward',
        from: 'admit-source',
        to: 'reward',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:activity']
      },
      {
        id: 'project-agent-to-life',
        from: 'project-agent',
        to: 'life',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:work']
      },
      {
        id: 'project-agent-to-compose-office',
        from: 'project-agent',
        to: 'compose-office',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:work']
      },
      {
        id: 'membership-to-life',
        from: 'membership',
        to: 'life',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:members']
      },
      {
        id: 'membership-to-reward',
        from: 'membership',
        to: 'reward',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:members']
      },
      {
        id: 'membership-to-compose-office',
        from: 'membership',
        to: 'compose-office',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:members']
      },
      {
        id: 'life-to-reward',
        from: 'life',
        to: 'reward',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:pose']
      },
      {
        id: 'life-to-compose-office',
        from: 'life',
        to: 'compose-office',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:pose']
      },
      {
        id: 'validate-layout-to-commit-layout',
        from: 'validate-layout',
        to: 'commit-layout',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:layout-intent']
      },
      {
        id: 'commit-layout-to-life',
        from: 'commit-layout',
        to: 'life',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:layout']
      },
      {
        id: 'commit-layout-to-retain-layout',
        from: 'commit-layout',
        to: 'retain-layout',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:layout']
      },
      {
        id: 'commit-layout-to-compose-office',
        from: 'commit-layout',
        to: 'compose-office',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:layout']
      },
      {
        id: 'reward-to-compose-office',
        from: 'reward',
        to: 'compose-office',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:awards']
      },
      {
        id: 'compose-office-to-render-spatial',
        from: 'compose-office',
        to: 'render-spatial',
        kind: 'required',
        predicate:
          'Consumer receives completed admitted output; preview and full scene are alternative render inputs.',
        producedArtifacts: ['artifact:spatial-scene']
      }
    ],
    artifacts: [
      {
        id: 'artifact:asset',
        ownerStepId: 'construct-asset',
        channel: 'projection',
        consumerStepIds: ['preview-asset', 'compose-office']
      },
      {
        id: 'artifact:preview-scene',
        ownerStepId: 'preview-asset',
        channel: 'projection',
        consumerStepIds: ['render-spatial']
      },
      {
        id: 'artifact:activity',
        ownerStepId: 'admit-source',
        channel: 'projection',
        consumerStepIds: ['project-agent', 'reward']
      },
      {
        id: 'artifact:work',
        ownerStepId: 'project-agent',
        channel: 'projection',
        consumerStepIds: ['life', 'compose-office']
      },
      {
        id: 'artifact:members',
        ownerStepId: 'membership',
        channel: 'projection',
        consumerStepIds: ['life', 'reward', 'compose-office']
      },
      {
        id: 'artifact:pose',
        ownerStepId: 'life',
        channel: 'projection',
        consumerStepIds: ['reward', 'compose-office']
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
        consumerStepIds: ['life', 'retain-layout', 'compose-office']
      },
      {
        id: 'artifact:saved-layout',
        ownerStepId: 'retain-layout',
        channel: 'projection',
        consumerStepIds: [],
        terminal: true
      },
      {
        id: 'artifact:awards',
        ownerStepId: 'reward',
        channel: 'projection',
        consumerStepIds: ['compose-office']
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
        id: 'separate-authority',
        statement:
          'Asset preview, external work, canonical layout and ambient simulation have distinct authority.',
        stepIds: [
          'construct-asset',
          'preview-asset',
          'admit-source',
          'project-agent',
          'membership',
          'life',
          'validate-layout',
          'commit-layout',
          'retain-layout',
          'reward',
          'compose-office',
          'render-spatial'
        ],
        artifactIds: [
          'artifact:asset',
          'artifact:preview-scene',
          'artifact:activity',
          'artifact:work',
          'artifact:members',
          'artifact:pose',
          'artifact:layout-intent',
          'artifact:layout',
          'artifact:saved-layout',
          'artifact:awards',
          'artifact:spatial-scene',
          'artifact:visible-office'
        ],
        specRefs: ['docs/ai/apps/asyra-office/implementation.md']
      }
    ],
    acceptanceContracts: [
      {
        id: 'wall-harness',
        title: 'First wall asset acceptance',
        stepIds: ['construct-asset', 'preview-asset', 'render-spatial'],
        assertions: [
          'Numeric wall joins, winding, scaling, appearance isolation and LoD agree with approved specifications.',
          'Camera changes reuse generated geometry; disposal retires the full session.',
          'User accepts same-object multiviews and enlarged cap joins before the next asset.'
        ],
        specRefs: [
          'docs/ai/apps/asyra-office/implementation.md#stage-1---wall-asset-harness'
        ]
      }
    ]
  }
  if (typeof module !== 'undefined') module.exports = data
  if (typeof globalThis !== 'undefined') globalThis.FLOW_INSPECTOR_DATA = data
})()
