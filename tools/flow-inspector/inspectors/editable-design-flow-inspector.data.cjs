;(function () {
  const data = {
    schema: {
      id: 'flow-inspector',
      version: 2
    },
    target: {
      id: 'editable-design',
      kind: 'feature',
      title: 'Editable Design Preparation',
      subtitle: 'Model decisions to validated native design artifacts'
    },
    authority: {
      specPath: 'docs/ai/apps/asyra-design/specs/design-preparation.md',
      inspectorPath:
        'tools/flow-inspector/inspectors/editable-design-flow-inspector.data.cjs',
      semanticOwner: 'General editable design preparation',
      inspectorOwner: 'Design preparation and execution owners'
    },
    links: [],
    lanes: [
      {
        id: 'preparation',
        title: 'Design preparation',
        order: 1
      }
    ],
    steps: [
      {
        id: 'prepare-semantic-design',
        order: 1,
        laneId: 'preparation',
        title: 'Prepare semantic design',
        ownerPackage: 'asyra-design server',
        purpose:
          'Resolve declared layout and native descriptor identities without inventing design content',
        inputs: ['bounded semantic draft', 'request-local artifact session'],
        outputs: ['artifact:prepared-design'],
        conditions: [
          'Validate the complete draft before compiling',
          'AI owns content and style',
          'Text fit requires actual browser metrics',
          'Retain analysis only for its immutable request-local artifact'
        ],
        bypasses: ['Read-only advice does not prepare a design'],
        allowedContributors: [
          'server layout compiler',
          'App-owned native descriptor protocol',
          'request-local artifact owner'
        ],
        forbiddenContributors: [
          'Framework or Preset runtime imports',
          'model calls inside preparation',
          'remote fetch',
          'browser writes',
          'subject-specific layouts',
          'font-fit claims from estimates'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/server/design-preparation.ts',
          'apps/asyra-design/tsconfig.ai-server.json',
          'apps/asyra-design/package.json',
          'apps/asyra-design/server/__tests__/design-preparation.test.ts',
          'apps/asyra-design/src/ai/prepared-design.ts'
        ],
        specRefs: ['#semantic-preparation'],
        failureOwnerStepId: 'prepare-semantic-design'
      },
      {
        id: 'resolve-design-operations',
        order: 2,
        laneId: 'preparation',
        title: 'Resolve model design operations',
        ownerPackage: 'asyra-design server',
        purpose:
          'Expose semantic preparation and resolve opaque references into canonical App batches',
        inputs: [
          'registered actions',
          'semantic draft call',
          'artifact:prepared-design',
          'operation receipts'
        ],
        outputs: ['artifact:resolved-design-operation'],
        conditions: [
          'Require registered apply action',
          'Keep artifacts request-local',
          'Bound invalid attempts',
          'Recover invalid draft/reference inputs without writes',
          'Use the same resolver for dynamic and final batches'
        ],
        bypasses: ['No preparation capability when apply action is absent'],
        allowedContributors: [
          'preparation session',
          'native provider tool transport',
          'existing operation review'
        ],
        forbiddenContributors: [
          'raw model canonical descriptors',
          'reference-image prerequisite',
          'network fetch',
          'canvas mutation during preparation',
          'new credentials'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/server/local-design-tools.ts',
          'apps/asyra-design/tsconfig.ai-server.json',
          'apps/asyra-design/server/local-operation-tools.ts',
          'apps/asyra-design/server/local-ai-provider.ts',
          'apps/asyra-design/server/ai-domain-prompt.ts',
          'apps/asyra-design/server/__tests__/local-design-tools.test.ts',
          'apps/asyra-design/server/__tests__/local-operation-tools.test.ts',
          'apps/asyra-design/server/__tests__/local-ai-provider.test.ts',
          'apps/asyra-design/server/__tests__/ai-domain-prompt.test.ts',
          'apps/asyra-design/src/constants/ai-design.ts',
          'apps/asyra-design/src/ai/presentation.ts',
          'apps/asyra-design/src/ai/__tests__/presentation.test.ts',
          'apps/asyra-design/package.json'
        ],
        specRefs: ['#provider-handoff'],
        failureOwnerStepId: 'resolve-design-operations'
      },
      {
        id: 'apply-prepared-design',
        order: 3,
        laneId: 'preparation',
        title: 'Apply prepared editable design',
        ownerPackage: 'asyra-design App',
        purpose:
          'Admit complete server artifacts and create editable hierarchy through canonical APIs',
        inputs: [
          'artifact:resolved-design-operation',
          'current workspace',
          'abort signal',
          'action permission'
        ],
        outputs: ['artifact:applied-design'],
        conditions: [
          'Admit all entries before writes',
          'Preserve parent order and IDs',
          'Yield between bounded chunks',
          'Use invocation transaction; retain progress on ordinary failure'
        ],
        bypasses: ['Read-only advice'],
        allowedContributors: [
          'App admission',
          'common element and hierarchy APIs',
          'invocation transaction'
        ],
        forbiddenContributors: [
          'model-authored executable code',
          'geometry reconstruction',
          'renderer writes',
          'permission bypass',
          'custom Undo'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/e2e/editable-design-variants.spec.ts',
          'apps/asyra-design/src/ai/prepared-design-admission.ts',
          'apps/asyra-design/src/ai/design-actions.ts',
          'apps/asyra-design/src/ai/__tests__/design-actions.test.ts',
          'apps/asyra-design/e2e/editable-design.spec.ts',
          'apps/asyra-design/src/ai/runtime-input.ts',
          'apps/asyra-design/src/ai/startup.ts',
          'apps/asyra-design/src/constants/ai-actions.ts',
          'apps/asyra-design/package.json'
        ],
        specRefs: ['#canonical-execution'],
        failureOwnerStepId: 'apply-prepared-design'
      },
      {
        id: 'read-design-fields',
        order: 4,
        laneId: 'preparation',
        title: 'Read selected canonical fields',
        ownerPackage: '@asyra/core',
        purpose:
          'Detach requested computed fields without cloning omitted geometry',
        inputs: [
          'element ID',
          'optional flat field selection',
          'current computed projection'
        ],
        outputs: ['artifact:selected-design-fields'],
        conditions: [
          'Validate field budget before source read',
          'Read once per call',
          'Clone selected own values only',
          'No selection preserves existing whole observation'
        ],
        bypasses: ['Missing element returns undefined'],
        allowedContributors: [
          'Core observation facade',
          'existing shallow computed projection'
        ],
        forbiddenContributors: [
          'cross-call caches',
          'nested omitted-field traversal',
          'canonical writes',
          'AI-specific field names'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/core/src/apis/scene-tree.ts',
          'packages/core/src/types/scene-tree.ts',
          'packages/core/src/__tests__/scene-tree-api.test.ts',
          'docs/ai/framework/API_SURFACES.md',
          '.changeset/selective-computed-observation.md'
        ],
        specRefs: ['#context-and-targeted-operations'],
        failureOwnerStepId: 'read-design-fields'
      },
      {
        id: 'read-document-context', order: 5, laneId: 'preparation',
        title: 'Read bounded document context', ownerPackage: 'asyra-design App',
        purpose: 'Observe fresh editable metadata without vector geometry',
        inputs: ['selection or direct children', 'offset and limit', 'artifact:selected-design-fields'],
        outputs: ['artifact:document-context'],
        conditions: ['Validate before reads', 'Page size at most 200', 'Explicit preview truncation', 'One source read per page object'],
        bypasses: ['Unavailable parent returns no objects'],
        allowedContributors: ['Common API observation', 'Core selected-field observation'],
        forbiddenContributors: ['Document writes', 'Recursive traversal', 'Visual capture', 'Cross-call cache'],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-design/src/common-apis/design-context.ts', 'apps/asyra-design/src/common-apis/__tests__/design-context.test.ts', 'apps/asyra-design/package.json'],
        specRefs: ['#context-and-targeted-operations'],
        failureOwnerStepId: 'read-document-context'
      },
      {
        id: 'expose-document-context', order: 6, laneId: 'preparation',
        title: 'Expose read-only document action', ownerPackage: 'asyra-design App and provider',
        purpose: 'Provide bounded context without mutation review',
        inputs: ['page query', 'abort signal', 'artifact:document-context'],
        outputs: ['artifact:context-action-receipt'],
        conditions: ['Registered permission', 'No automatic inspection', 'No correction budget consumed'],
        bypasses: ['Abort before observation'],
        allowedContributors: ['Document context reader', 'Existing action transport'],
        forbiddenContributors: ['Canvas writes', 'Screenshot capture', 'New transaction semantics'],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-design/src/ai/context-action.ts', 'apps/asyra-design/src/ai/__tests__/context-action.test.ts', 'apps/asyra-design/src/ai/runtime-input.ts', 'apps/asyra-design/src/ai/startup.ts', 'apps/asyra-design/src/constants/ai-actions.ts', 'apps/asyra-design/src/ai/presentation.ts', 'apps/asyra-design/server/local-operation-tools.ts', 'apps/asyra-design/server/__tests__/local-operation-tools.test.ts', 'apps/asyra-design/server/ai-domain-prompt.ts', 'apps/asyra-design/package.json'],
        specRefs: ['#context-and-targeted-operations'], failureOwnerStepId: 'expose-document-context'
      },
      {
        id: 'revise-design-element', order: 7, laneId: 'preparation',
        title: 'Revise a current design element', ownerPackage: 'asyra-design App',
        purpose: 'Admit targeted native edits without replacing other objects',
        inputs: ['current element ID', 'bounded property/style/name patch', 'abort signal'],
        outputs: ['artifact:edited-design-receipt'],
        conditions: ['Whole input validation before writes', 'Target and ancestor locks', 'Existing native property support', 'Invocation Undo and partial retention'],
        bypasses: ['Unchanged values emit no writes'],
        allowedContributors: ['Native text schema', 'Common geometry and style APIs', 'Core metadata API'],
        forbiddenContributors: ['Custom rollback', 'Raw vector point patches', 'Unrelated element replacement', 'Permission bypass'],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/e2e/editable-design.spec.ts','apps/asyra-design/src/common-apis/design-edit.ts', 'apps/asyra-design/src/common-apis/__tests__/design-edit.test.ts', 'apps/asyra-design/src/ai/design-edit-action.ts', 'apps/asyra-design/src/ai/__tests__/design-edit-action.test.ts', 'apps/asyra-design/src/constants/ai-actions.ts', 'apps/asyra-design/src/ai/runtime-input.ts', 'apps/asyra-design/src/ai/startup.ts', 'apps/asyra-design/src/ai/presentation.ts', 'apps/asyra-design/server/ai-domain-prompt.ts', 'apps/asyra-design/package.json'],
        specRefs: ['#context-and-targeted-operations'], failureOwnerStepId: 'revise-design-element'
      },
      {
        id: 'organize-design-hierarchy', order: 8, laneId: 'preparation',
        title: 'Organize current design hierarchy', ownerPackage: 'asyra-design App',
        purpose: 'Group, ungroup or reorder current editable objects through native owners',
        inputs: ['operation', 'bounded current IDs', 'optional name or reorder index'],
        outputs: ['artifact:organized-hierarchy-receipt'],
        conditions: ['Complete admission before writes', 'Inherited locks', 'One raw read per touched node per call', 'Existing invocation Undo', 'Structural receipt review'],
        bypasses: ['Unchanged reorder is a no-change result'],
        allowedContributors: ['Common hierarchy APIs', 'Core metadata reads and rename'],
        forbiddenContributors: ['Arbitrary reparent', 'Deleting children', 'Fabricated component instances', 'Custom geometry or rollback', 'Cross-call cache'],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-design/src/common-apis/design-organization.ts', 'apps/asyra-design/src/common-apis/__tests__/design-organization.test.ts', 'apps/asyra-design/src/ai/organization-action.ts', 'apps/asyra-design/src/ai/__tests__/organization-action.test.ts', 'apps/asyra-design/src/ai/runtime-input.ts', 'apps/asyra-design/src/ai/startup.ts', 'apps/asyra-design/src/constants/ai-actions.ts', 'apps/asyra-design/src/ai/presentation.ts', 'apps/asyra-design/server/local-operation-tools.ts', 'apps/asyra-design/server/__tests__/local-operation-tools.test.ts', 'apps/asyra-design/server/ai-domain-prompt.ts', 'apps/asyra-design/package.json', 'apps/asyra-design/e2e/design-organization.spec.ts'],
        specRefs: ['#context-and-targeted-operations'], failureOwnerStepId: 'organize-design-hierarchy'
      }
      ,{
        id: 'arrange-design-elements', order: 9, laneId: 'preparation',
        title: 'Arrange current design elements', ownerPackage: 'asyra-design App',
        purpose: 'Align or distribute native projected bounds through canonical positions',
        inputs: ['bounded sibling IDs', 'axis', 'alignment or optional gap', 'current native projection'],
        outputs: ['artifact:arrangement-receipt'],
        conditions: ['Complete admission before writes', 'Inherited locks', 'Four projected corners per target', 'One request-local observation per node', 'One plural write', 'Existing invocation Undo'],
        bypasses: ['Unchanged arrangement performs no write'],
        allowedContributors: ['Core native coordinate conversion', 'Preset group geometry projection', 'Core plural property update'],
        forbiddenContributors: ['Path reconstruction', 'Renderer writes', 'Reparenting', 'Cross-call cache', 'Custom rollback'],
        cacheDimensions: [],
        implementationBoundary: ['apps/asyra-design/src/common-apis/design-arrangement.ts', 'apps/asyra-design/src/common-apis/__tests__/design-arrangement.test.ts', 'apps/asyra-design/src/ai/arrangement-action.ts', 'apps/asyra-design/src/ai/__tests__/arrangement-action.test.ts', 'apps/asyra-design/src/ai/runtime-input.ts', 'apps/asyra-design/src/ai/startup.ts', 'apps/asyra-design/src/constants/ai-actions.ts', 'apps/asyra-design/src/ai/presentation.ts', 'apps/asyra-design/server/ai-domain-prompt.ts', 'apps/asyra-design/package.json', 'apps/asyra-design/e2e/design-organization.spec.ts'],
        specRefs: ['#arrangement'], failureOwnerStepId: 'arrange-design-elements'
      }
      ,{
        id: 'review-current-design', order: 10, laneId: 'preparation',
        title: 'Review current design measurements', ownerPackage: 'asyra-design App',
        purpose: 'Report deterministic fit and bounds findings before visual judgment',
        inputs: ['root ID', 'bounded current metadata', 'native content measurements'], outputs: ['artifact:design-review-findings'],
        conditions: ['At most 200 nodes', 'One selected observation per node', 'One text measurement batch', 'No screenshot'],
        bypasses: ['Hidden text is not measured', 'Rotated parent-box checks report unavailable'],
        allowedContributors: ['Core selected fields', 'Core native content observation'],
        forbiddenContributors: ['Vector payload cloning', 'Font heuristics', 'Canonical writes', 'Visual-quality claims', 'Cross-call cache'], cacheDimensions: [],
        implementationBoundary: ['apps/asyra-design/src/common-apis/design-review.ts', 'apps/asyra-design/src/common-apis/__tests__/design-review.test.ts', 'apps/asyra-design/src/ai/review-action.ts', 'apps/asyra-design/src/ai/__tests__/review-action.test.ts', 'apps/asyra-design/src/ai/runtime-input.ts', 'apps/asyra-design/src/ai/startup.ts', 'apps/asyra-design/src/ai/presentation.ts', 'apps/asyra-design/src/constants/ai-actions.ts', 'apps/asyra-design/server/local-operation-tools.ts', 'apps/asyra-design/server/__tests__/local-operation-tools.test.ts', 'apps/asyra-design/server/ai-domain-prompt.ts', 'apps/asyra-design/package.json', 'apps/asyra-design/e2e/native-text.spec.ts'],
        specRefs: ['#deterministic-current-design-review'], failureOwnerStepId: 'review-current-design'
      }
    ],
    routes: [],
    artifacts: [
      { id: 'artifact:context-action-receipt', ownerStepId: 'expose-document-context', title: 'read-only action receipt', channel: 'owner receipt', consumerStepIds: [], terminal: true, description: 'read-only action receipt' },
      { id: 'artifact:edited-design-receipt', ownerStepId: 'revise-design-element', title: 'edited element ID and review target', channel: 'owner receipt', consumerStepIds: [], terminal: true, description: 'edited element ID and review target' },
      { id: 'artifact:organized-hierarchy-receipt', ownerStepId: 'organize-design-hierarchy', title: 'canonical hierarchy receipt', channel: 'owner receipt', consumerStepIds: [], terminal: true, description: 'canonical hierarchy receipt' },
      { id: 'artifact:arrangement-receipt', ownerStepId: 'arrange-design-elements', title: 'canonical positions and changed IDs', channel: 'owner receipt', consumerStepIds: [], terminal: true, description: 'canonical positions and changed IDs' },
      { id: 'artifact:design-review-findings', ownerStepId: 'review-current-design', title: 'findings and explicit completeness', channel: 'owner receipt', consumerStepIds: [], terminal: true, description: 'findings and explicit completeness' },
      { id: 'artifact:document-context', ownerStepId: 'read-document-context',
        title: 'Document context page', channel: 'read-only action receipt',
        consumerStepIds: ['expose-document-context'], terminal: false,
        description: 'Canonical summaries and pagination without geometry' },
      {
        id: 'artifact:selected-design-fields',
        ownerStepId: 'read-design-fields',
        title: 'Selected canonical fields',
        channel: 'Core detached observation',
        consumerStepIds: ['read-document-context'],
        terminal: false,
        description: 'Fresh requested fields; no omitted vector payload'
      },

      {
        id: 'artifact:prepared-design',
        ownerStepId: 'prepare-semantic-design',
        title: 'Prepared editable design',
        channel: 'request-local artifact',
        consumerStepIds: ['resolve-design-operations'],
        terminal: false,
        description:
          'Ordered canonical descriptors, semantic IDs and deterministic findings'
      },
      {
        id: 'artifact:resolved-design-operation',
        ownerStepId: 'resolve-design-operations',
        title: 'Resolved design operation',
        channel: 'App batch transport',
        consumerStepIds: ['apply-prepared-design'],
        terminal: false,
        description:
          'Original validated canonical artifact resolved from the model receipt ID'
      },
      {
        id: 'artifact:applied-design',
        ownerStepId: 'apply-prepared-design',
        title: 'Applied editable design',
        channel: 'canonical document and action result',
        consumerStepIds: [],
        terminal: true,
        description:
          'Created root and semantic IDs for targeted edits and rendered review'
      }
    ],
    invariants: [],
    acceptanceContracts: [
      {
        id: 'bounded-design-preparation',
        title: 'Bounded design preparation',
        assertions: [
          'Drafts preserve literal content and declared styles',
          'Bounds and IDs are validated',
          'Preparation emits no canvas mutation',
          'Reads reuse immutable findings'
        ],
        stepIds: ['prepare-semantic-design'],
        specRefs: ['#product-cases-and-gates']
      }
    ]
  }
  const freeze = (value) => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze)
      Object.freeze(value)
    }
  }
  freeze(data)
  globalThis.FLOW_INSPECTOR_DATA = data
  if (typeof module !== 'undefined') module.exports = data
})()
