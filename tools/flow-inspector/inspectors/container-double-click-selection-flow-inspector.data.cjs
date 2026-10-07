module.exports = {
  schema: {
    id: 'flow-inspector',
    version: 2
  },
  target: {
    id: 'container-double-click-selection',
    kind: 'feature',
    title: 'Container double-click selection',
    subtitle:
      'Canonical immediate-child selection through the App Feature boundary'
  },
  authority: {
    specPath: 'docs/ai/apps/asyra-design/prd/element-selection.md',
    inspectorPath:
      'tools/flow-inspector/inspectors/container-double-click-selection-flow-inspector.data.cjs',
    semanticOwner: 'Design selection',
    inspectorOwner: 'Design selection'
  },
  links: [],
  lanes: [
    {
      id: 'selection',
      title: 'App selection',
      order: 1
    }
  ],
  steps: [
    {
      id: 'select-container-child',
      order: 1,
      laneId: 'selection',
      title: 'Select the immediate child at the pointer',
      ownerPackage: 'asyra-design selection Feature and hierarchy controller',
      purpose:
        'Resolve a canonical immediate child from an identity-safe renderer hit and publish local selection.',
      inputs: [
        'current input and path-editing state',
        'current selected IDs',
        'Core container capability',
        'identity-safe renderer hit ID',
        'canonical hierarchy projection'
      ],
      outputs: ['artifact:container-child-selection'],
      conditions: [
        'Select tool, no modifiers or active path editing, exactly one selected registered container.',
        'The visible unlocked hit descends from that container; select only its immediate child.',
        'Successful priority 100 exclusive execution consumes the double-click before vector path editing.'
      ],
      bypasses: [
        'Invalid projection, no hit, self/outside hit, hidden or locked ancestry produces no drill-down selection.',
        'Other tools, modifiers, multiple selection and active path editing preserve existing handlers.'
      ],
      allowedContributors: [
        'Core container capability through elementApis',
        'renderer hit identity through elementApis',
        'canonical projection through hierarchyApis',
        'selectionApis and systemContextApis',
        'existing hierarchy projection validation'
      ],
      forbiddenContributors: [
        'hardcoded container type lists',
        'render display-object ancestry',
        'new gesture timers or cached hierarchy',
        'document geometry or parent writes',
        'raw leaf fallback after rejection'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/selection',
        'apps/asyra-design/package.json',
        'apps/asyra-design/src/controllers/canvas-hierarchy-target.ts',
        'apps/asyra-design/src/controllers/__tests__/canvas-hierarchy-target.test.ts',
        'apps/asyra-design/src/constants/feature-names.ts',
        'apps/asyra-design/e2e/group-hierarchy.spec.ts'
      ],
      specRefs: ['#container-double-click-selection'],
      failureOwnerStepId: 'select-container-child'
    },
    {
      id: 'resolve-element-point-bounds',
      order: 2,
      laneId: 'selection',
      title: 'Resolve a workspace point against local element bounds',
      ownerPackage: 'asyra-design element common API',
      purpose:
        'Keep the existing bounds query coordinate-correct for subsequent vector editing and public query callers.',
      inputs: [
        'caller element ID and workspace point',
        'computed element dimensions',
        'Core workspace-to-element-local conversion',
        'optional local padding'
      ],
      outputs: ['artifact:element-point-bounds'],
      conditions: [
        'Convert the workspace point through the identity-safe Core transform before comparing with zero-origin local width and height.',
        'Preserve local padding for empty-point vector editing.'
      ],
      bypasses: [
        'Missing element or projection, or non-finite coordinates, yields false.'
      ],
      allowedContributors: ['Core computed data and coordinate conversion'],
      forbiddenContributors: [
        'parent-local position treated as workspace bounds',
        'Pixi access',
        'canonical geometry writes'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/common-apis/element/apis.ts',
        'apps/asyra-design/src/common-apis/element/__tests__/group-geometry-mutation.test.ts'
      ],
      specRefs: ['#container-double-click-selection'],
      failureOwnerStepId: 'resolve-element-point-bounds'
    }
  ],
  routes: [
    {
      id: 'selection-to-ui',
      from: 'select-container-child',
      to: null,
      kind: 'terminal',
      predicate: 'Selected immediate child or unchanged local selection',
      producedArtifacts: ['artifact:container-child-selection']
    },
    {
      id: 'bounds-query-return',
      from: 'resolve-element-point-bounds',
      kind: 'terminal',
      predicate: 'Existing query caller receives the bounds result',
      producedArtifacts: ['artifact:element-point-bounds']
    }
  ],
  artifacts: [
    {
      id: 'artifact:container-child-selection',
      ownerStepId: 'select-container-child',
      channel: 'selection common API',
      consumerStepIds: [],
      terminal: true,
      description:
        'Existing selection channel updates the ordinary overlays and panels; canonical document is unchanged.'
    },
    {
      id: 'artifact:element-point-bounds',
      ownerStepId: 'resolve-element-point-bounds',
      channel: 'common API return',
      consumerStepIds: [],
      terminal: true
    }
  ],
  invariants: [],
  acceptanceContracts: [
    {
      id: 'container-double-click-cases',
      title: 'Container drill-down behavior',
      assertions: [
        'Group, Frame and custom Group inheritance',
        'Nested progression, frontmost hit and no child',
        'Locked, hidden, stale and outside targets',
        'Vector editing, modifier selection, dragging and save/load preservation'
      ],
      stepIds: ['select-container-child'],
      specRefs: ['#container-double-click-selection']
    }
  ]
}
