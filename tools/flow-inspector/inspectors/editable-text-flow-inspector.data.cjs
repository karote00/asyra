;(function () {
  const data = {
    schema: {
      id: 'flow-inspector',
      version: 2
    },
    target: {
      id: 'editable-text',
      kind: 'feature',
      title: 'Editable Text Foundation',
      subtitle: 'Neutral text projection and engine-owned materialization'
    },
    authority: {
      specPath: 'docs/ai/apps/asyra-design/specs/editable-text.md',
      inspectorPath:
        'tools/flow-inspector/inspectors/editable-text-flow-inspector.data.cjs',
      semanticOwner: 'Editable text product contract',
      inspectorOwner: 'Native text owners'
    },
    links: [],
    lanes: [
      {
        id: 'text',
        title: 'Native text',
        order: 1
      }
    ],
    steps: [
      {
        id: 'project-native-text',
        order: 1,
        laneId: 'text',
        title: 'Project native text',
        ownerPackage: '@asyra/render and @asyra/render-engine',
        purpose: 'Project native text',
        inputs: ['validated plain text and layout box', 'typography values'],
        outputs: ['artifact:neutral-text-operation'],
        conditions: [
          'Plain text only; explicit typography and layout bounds; existing graphics remain compatible.'
        ],
        bypasses: ['No text operation for non-text components.'],
        allowedContributors: ['@asyra/render and @asyra/render-engine'],
        forbiddenContributors: [
          'Pixi or DOM types',
          'component semantics',
          'font measurement heuristics'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/render-engine/src/types.ts',
          'packages/render/src/types/render-object.ts',
          'packages/render/src/__tests__/native-text.test.ts'
        ],
        specRefs: ['#neutral-text-projection'],
        failureOwnerStepId: 'project-native-text'
      },
      {
        id: 'materialize-native-text',
        order: 2,
        laneId: 'text',
        title: 'Materialize native text',
        ownerPackage: '@asyra/render-engine-pixi',
        purpose: 'Materialize native text',
        inputs: ['artifact:neutral-text-operation'],
        outputs: ['artifact:rendered-native-text'],
        conditions: [
          'Snapshots use capture-relative text density and restore screen density even on failure; unrelated text is untouched.',
          'Coalesce screen text resolution from renderer density and world scale; stable flush and pan do no resolution work; bound texture allocation and release owned text tracking.',
          'Plain text only; explicit typography and layout bounds; existing graphics remain compatible.'
        ],
        bypasses: ['No text operation for non-text components.'],
        allowedContributors: ['@asyra/render-engine-pixi'],
        forbiddenContributors: [
          'HTML rendering',
          'canonical writes',
          'App decisions',
          'destroying unrelated scene children'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/render-engine-pixi/src/pixi-render-engine.ts',
          'packages/render-engine-pixi/src/__tests__/pixi-render-engine.test.ts'
        ],
        specRefs: ['#engine-text-materialization'],
        failureOwnerStepId: 'materialize-native-text'
      },
      {
        id: 'define-canonical-text',
        order: 3,
        laneId: 'text',
        title: 'Define canonical text',
        ownerPackage: '@asyra/preset',
        purpose:
          'Expose validated editable text definitions for explicit App installation',
        inputs: [
          'canonical property writes or persisted text fields',
          'position and dimension properties'
        ],
        outputs: ['artifact:canonical-text-definition'],
        conditions: [
          'Existing preset profiles remain unchanged; schema rejects invalid writes and defaults invalid loaded values'
        ],
        bypasses: ['Non-text components retain existing definitions'],
        allowedContributors: [
          'preset definitions',
          'public Core and utils contracts'
        ],
        forbiddenContributors: [
          'AI-owned document state',
          'vectorized glyphs',
          'App-specific content',
          'Pixi imports'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/preset/src/components/text.ts',
          'packages/preset/src/props/components/text-component.ts',
          'packages/preset/src/index.ts',
          'packages/preset/src/__tests__/native-text.test.ts'
        ],
        specRefs: ['#canonical-text-component'],
        failureOwnerStepId: 'define-canonical-text'
      },
      {
        id: 'install-and-edit-text',
        order: 4,
        laneId: 'text',
        title: 'Install and edit text in Design',
        ownerPackage: 'asyra-design',
        purpose:
          'Install canonical text definitions and expose selection-scoped manual editing',
        inputs: [
          'artifact:canonical-text-definition',
          'current selection typography',
          'user field edit'
        ],
        outputs: ['artifact:editable-text-app'],
        conditions: [
          'Register before core start; commit valid fields through canonical property transactions; scope subscriptions to typography'
        ],
        bypasses: ['No text section without a single selected text component'],
        allowedContributors: [
          'App startup',
          'UI property projection',
          'canonical element API'
        ],
        forbiddenContributors: [
          'direct renderer mutation',
          'per-keystroke document replacement',
          'AI-only text storage'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/src/init/capabilities/init-text.ts',
          'apps/asyra-design/src/init/init-app.ts',
          'apps/asyra-design/src/init/__tests__/init-text.test.ts',
          'apps/asyra-design/src/init/__tests__/init-app.test.ts',
          'apps/asyra-design/e2e/native-text.spec.ts',
          'apps/asyra-design/src/properties/text.tsx',
          'apps/asyra-design/src/properties/__tests__/text.test.tsx',
          'apps/asyra-design/src/properties/panels/element-properties-panel.tsx'
        ],
        specRefs: ['#canonical-text-component'],
        failureOwnerStepId: 'install-and-edit-text'
      }
      ,{
        id: 'query-native-content-bounds', order: 5, laneId: 'text',
        title: 'Observe native content bounds', ownerPackage: '@asyra/render-engine-pixi',
        purpose: 'Read native local content geometry without rasterization or layout decisions',
        inputs: ['owned engine object', 'local-content-bounds capability'], outputs: ['artifact:native-content-bounds'],
        conditions: ['Require owned live object', 'No image extraction', 'Independent of viewport zoom'],
        bypasses: ['Unsupported engine rejects measurement'],
        allowedContributors: ['Neutral query contract', 'Native engine local bounds'],
        forbiddenContributors: ['Font-size heuristics', 'Layout bounds as content evidence', 'Canonical writes', 'Raster capture'],
        cacheDimensions: [],
        implementationBoundary: ['packages/render-engine/src/types.ts', 'packages/render-engine/src/capabilities.ts', 'packages/render-engine/src/__tests__/contract.test.ts', 'packages/render-engine/src/testing/recording-render-engine.ts', 'packages/render-engine-pixi/src/pixi-render-engine.ts', 'packages/render-engine-pixi/src/__tests__/pixi-render-engine.test.ts'],
        specRefs: ['#native-content-measurement'], failureOwnerStepId: 'query-native-content-bounds'
      }
      ,{
        id: 'observe-rendered-content', order: 6, laneId: 'text',
        title: 'Observe a bounded batch of rendered content', ownerPackage: '@asyra/render',
        purpose: 'Flush once and expose actual content bounds through Core',
        inputs: ['1..200 unique element IDs', 'local-content-bounds engine', 'artifact:native-content-bounds'], outputs: ['artifact:measured-content-bounds'],
        conditions: ['Validate before flush', 'One flush per call', 'One native query per present target'], bypasses: ['Missing target returns null bounds'],
        allowedContributors: ['Render viewport handles', 'Neutral content query', 'Core forwarding'],
        forbiddenContributors: ['Canonical writes', 'Raster capture', 'Heuristic font measurement', 'Cross-call cache'], cacheDimensions: [],
        implementationBoundary: ['packages/render/src/render.ts', 'packages/render/src/index.ts', 'packages/render/src/__tests__/render.test.ts', 'packages/core/src/core.ts', 'packages/core/src/apis/create-apis.ts', 'packages/core/src/apis/render.ts', 'packages/core/src/types/render.ts', 'packages/core/src/__tests__/app-runtime-facade.test.ts', 'apps/asyra-design/e2e/native-text.spec.ts'],
        specRefs: ['#native-content-measurement'], failureOwnerStepId: 'observe-rendered-content'
      }
    ],
    routes: [
      { id: 'native-content-to-observation', from: 'query-native-content-bounds', to: 'observe-rendered-content', kind: 'handoff', predicate: 'Native content measurement requested', producedArtifacts: ['artifact:native-content-bounds'] },
      {
        id: 'project-to-engine',
        from: 'project-native-text',
        to: 'materialize-native-text',
        kind: 'handoff',
        predicate: 'A text operation is queued',
        producedArtifacts: ['artifact:neutral-text-operation']
      },
      {
        id: 'text-definition-to-app',
        from: 'define-canonical-text',
        to: 'install-and-edit-text',
        kind: 'handoff',
        predicate: 'Design starts',
        producedArtifacts: ['artifact:canonical-text-definition']
      }
    ],
    artifacts: [
      { id: 'artifact:native-content-bounds', ownerStepId: 'query-native-content-bounds', title: 'local native content bounds', channel: 'owner receipt', consumerStepIds: ['observe-rendered-content'], terminal: false, description: 'local native content bounds' },
      { id: 'artifact:measured-content-bounds', ownerStepId: 'observe-rendered-content', title: 'per-ID native local bounds or missing-target null', channel: 'owner receipt', consumerStepIds: [], terminal: true, description: 'per-ID native local bounds or missing-target null' },
      {
        id: 'artifact:neutral-text-operation',
        ownerStepId: 'project-native-text',
        title: 'Neutral text operation',
        channel: 'render command',
        consumerStepIds: ['materialize-native-text'],
        terminal: false,
        description: 'Owned plain text and typography snapshot'
      },
      {
        id: 'artifact:rendered-native-text',
        ownerStepId: 'materialize-native-text',
        title: 'Rendered native text',
        channel: 'scene',
        consumerStepIds: [],
        terminal: true,
        description: 'Engine-owned plain text projection'
      },
      {
        id: 'artifact:canonical-text-definition',
        ownerStepId: 'define-canonical-text',
        title: 'Canonical text definitions',
        channel: 'registration',
        consumerStepIds: ['install-and-edit-text'],
        terminal: false,
        description: 'Explicitly installed validated text schema and component'
      },
      {
        id: 'artifact:editable-text-app',
        ownerStepId: 'install-and-edit-text',
        title: 'Editable App text',
        channel: 'canonical document',
        consumerStepIds: [],
        terminal: true,
        description: 'Text definitions installed and manual edits committed'
      }
    ],
    invariants: [],
    acceptanceContracts: [
      {
        id: 'text-lifecycle',
        title: 'Native text lifecycle',
        assertions: [
          'Caller mutation does not change queued text',
          'Clear and destruction release engine-owned text only'
        ],
        stepIds: ['project-native-text', 'materialize-native-text'],
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
