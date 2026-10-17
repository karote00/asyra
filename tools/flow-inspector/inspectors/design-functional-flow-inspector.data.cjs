const data = {
  schema: {
    id: 'flow-inspector',
    version: 2
  },
  target: {
    id: 'design-functional',
    kind: 'app',
    title: 'Design Functional Responsibilities',
    subtitle: 'Recorded investigation entries for the functional test suite'
  },
  authority: {
    specPath:
      'docs/ai/apps/asyra-design/specs/functional-failure-responsibilities.md',
    inspectorPath:
      'tools/flow-inspector/inspectors/design-functional-flow-inspector.data.cjs',
    semanticOwner: 'Asyra Design and declared Framework owners',
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
      id: 'start-editor',
      order: 1,
      laneId: 'app',
      title: 'Start and reset the editor',
      ownerPackage: '@asyra/asyra-design',
      purpose: 'Compose the editor and expose its ready editable shell.',
      inputs: [
        'App composition and mount lifecycle',
        'Selected document identity and collaboration mode',
        'Core readiness and Reset request'
      ],
      outputs: ['artifact:start-editor-outcome'],
      conditions: [
        'Publish readiness only after Core starts; Reset reloads the selected document context.'
      ],
      bypasses: [
        'Failed startup remains unavailable; local-only mode must not start remote communication.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/init/init-app.ts',
        'apps/asyra-design/src/render-app/index.tsx',
        'apps/asyra-design/src/controllers/app.ts',
        'apps/asyra-design/index.html',
        'apps/asyra-design/src/app/index.tsx',
        'apps/asyra-design/src/contents/contents-panel.tsx',
        'apps/asyra-design/src/properties/index.tsx',
        'apps/asyra-design/src/toolbar/index.tsx',
        'apps/asyra-design/src/toolbar/tool-button.tsx',
        'apps/asyra-design/src/toolbar/reset-stored-document.ts',
        'apps/asyra-design/src/toolbar/zoom.tsx',
        'apps/asyra-design/src/collaboration/websocket-provider.ts',
        'apps/asyra-design/src/collaboration/collaboration-transport-worker.ts'
      ],
      specRefs: ['#start-editor'],
      failureOwnerStepId: 'start-editor'
    },
    {
      id: 'switch-tool',
      order: 2,
      laneId: 'app',
      title: 'Switch the primary tool',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Route toolbar and keyboard tool selection through the App feature.',
      inputs: [
        'Shortcut or toolbar primaryTool value',
        'Current pathEditingMode and path continuation state'
      ],
      outputs: ['artifact:switch-tool-outcome'],
      conditions: [
        'Apply the selected tool and its path-editing transition through system context.'
      ],
      bypasses: ['Missing tool input does not change state.'],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/switch-primary-tool/index.ts',
        'apps/asyra-design/src/common-apis/system-context.ts',
        'apps/asyra-design/src/toolbar/tool-button.tsx'
      ],
      specRefs: ['#switch-tool'],
      failureOwnerStepId: 'switch-tool'
    },
    {
      id: 'create-element',
      order: 3,
      laneId: 'app',
      title: 'Create an element gesture',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Create and update a rectangle or oval in one canonical pointer session.',
      inputs: [
        'Pointer start/current/end positions and active rectangle or oval tool',
        'Resolved canonical parent and current selection',
        'Session cancellation or finalization event'
      ],
      outputs: ['artifact:create-element-outcome'],
      conditions: [
        'Resolve the parent, project pointer samples immediately and commit one History entry.'
      ],
      bypasses: [
        'Ineligible tool or invalid parent does not create an element; failed sessions roll back.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/create-element/feature.ts',
        'apps/asyra-design/src/common-apis/element/apis.ts'
      ],
      specRefs: ['#create-element'],
      failureOwnerStepId: 'create-element'
    },
    {
      id: 'select-elements',
      order: 4,
      laneId: 'app',
      title: 'Select elements',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Resolve click, area and Contents selection through App selection APIs.',
      inputs: [
        'Pointer position, area-selection bounds and Shift modifier',
        'Current selection, registered container capabilities and raw render hit',
        'Canonical hierarchy and locked/hidden state'
      ],
      outputs: ['artifact:select-elements-outcome'],
      conditions: [
        'Use canonical target policy and project eligible selection without taking move ownership.'
      ],
      bypasses: [
        'Locked, hidden, stale and path-editing-ineligible targets do not become selected.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/selection/feature.ts',
        'apps/asyra-design/src/common-apis/selection.ts',
        'apps/asyra-design/src/controllers/canvas-hierarchy-target.ts',
        'apps/asyra-design/src/contents/contents-panel.tsx',
        'apps/asyra-design/src/contents/layer-selection.ts',
        'apps/asyra-design/src/ai/actions.ts'
      ],
      specRefs: ['#select-elements'],
      failureOwnerStepId: 'select-elements'
    },
    {
      id: 'hover-elements',
      order: 5,
      laneId: 'app',
      title: 'Resolve hover',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Project eligible render hover events into App interaction state.',
      inputs: [
        'Render hit at current pointer position or pointer leave',
        'mouseDragging, modifier keys and path-editing vector',
        'Canonical target hierarchy and locked/visible state'
      ],
      outputs: ['artifact:hover-elements-outcome'],
      conditions: [
        'Retain hover during dragging; otherwise resolve visible unlocked targets.'
      ],
      bypasses: [
        'Pointer leave clears eligible hover; drag-time events do not replace it.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/hover-element/index.ts',
        'apps/asyra-design/src/common-apis/system-context.ts'
      ],
      specRefs: ['#hover-elements'],
      failureOwnerStepId: 'hover-elements'
    },
    {
      id: 'move-elements',
      order: 6,
      laneId: 'app',
      title: 'Move elements',
      ownerPackage: '@asyra/asyra-design',
      purpose: 'Apply parent-local positions throughout one pointer gesture.',
      inputs: [
        'Drag start/current positions and modifiers',
        'Unlocked selected targets and parent-local start positions',
        'Finalization or cancellation of the pointer session'
      ],
      outputs: ['artifact:move-elements-outcome'],
      conditions: [
        'Project immediate position updates and retain one gesture History entry.'
      ],
      bypasses: [
        'Shift, path editing, locked targets and sub-threshold motion do not mutate positions.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/move-elements/feature.ts',
        'apps/asyra-design/src/common-apis/element/apis.ts'
      ],
      specRefs: ['#move-elements'],
      failureOwnerStepId: 'move-elements'
    },
    {
      id: 'delete-subtree',
      order: 7,
      laneId: 'app',
      title: 'Delete a selected subtree',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Delete a canonical element and its subtree through the App element API.',
      inputs: [
        'Delete shortcut and selected canonical element',
        'Path-editing mode and canonical subtree membership',
        'Current pointer position for post-delete hover'
      ],
      outputs: ['artifact:delete-subtree-outcome'],
      conditions: [
        'Clear selection and delete eligible subtree in one transaction with ordinary persistence.'
      ],
      bypasses: [
        'Invalid selection or path editing does not delete a subtree.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/delete-element/index.ts',
        'apps/asyra-design/src/common-apis/element/apis.ts'
      ],
      specRefs: ['#delete-subtree'],
      failureOwnerStepId: 'delete-subtree'
    },
    {
      id: 'delete-vector-point',
      order: 8,
      laneId: 'app',
      title: 'Delete a vector anchor',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Remove the selected editable anchor through the canonical topology operation.',
      inputs: [
        'Delete shortcut, editing vector ID and pathEditingMode',
        'Selected anchor on the editing vector and canonical path topology'
      ],
      outputs: ['artifact:delete-vector-point-outcome'],
      conditions: [
        'Delete eligible anchors, split an interior path and clear point selection in one transaction.'
      ],
      bypasses: [
        'Missing editing vector, mode or selected anchor leaves topology unchanged.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/delete-vector-point/index.ts',
        'apps/asyra-design/src/common-apis/element/vector-apis.ts'
      ],
      specRefs: ['#delete-vector-point'],
      failureOwnerStepId: 'delete-vector-point'
    },
    {
      id: 'replay-history',
      order: 9,
      laneId: 'app',
      title: 'Replay user actions',
      ownerPackage: '@asyra/asyra-design',
      purpose: 'Route user Undo and Redo through the App History API.',
      inputs: [
        'Undo/Redo intent and Shift direction',
        'Recorded canonical History and replay render policy'
      ],
      outputs: ['artifact:replay-history-outcome'],
      conditions: [
        'Replay the recorded action in the requested direction with its original grouping.'
      ],
      bypasses: [
        'Empty history and unavailable replay do not fabricate an action.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/undo-redo/index.ts',
        'apps/asyra-design/src/common-apis/history.ts',
        'apps/asyra-design/src/common-apis/transaction.ts'
      ],
      specRefs: ['#replay-history'],
      failureOwnerStepId: 'replay-history'
    },
    {
      id: 'edit-vector-path',
      order: 10,
      laneId: 'app',
      title: 'Edit vector paths',
      ownerPackage: '@asyra/asyra-design',
      purpose: 'Own pen continuation, anchor and segment editing sessions.',
      inputs: [
        'Pen or point/segment interaction and current editing vector',
        'Canonical anchors, segments, networks and continuation state',
        'Pointer coordinates, modifiers and session termination'
      ],
      outputs: ['artifact:edit-vector-path-outcome'],
      conditions: [
        'Apply structural and handle edits through canonical vector operations; preserve editing selection.'
      ],
      bypasses: [
        'Invalid continuation and ineligible editing state do not fabricate geometry.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/pen-tool/feature.ts',
        'apps/asyra-design/src/features/path-editing-intents.ts',
        'apps/asyra-design/src/common-apis/element/vector-apis.ts'
      ],
      specRefs: ['#edit-vector-path'],
      failureOwnerStepId: 'edit-vector-path'
    },
    {
      id: 'edit-properties',
      order: 11,
      laneId: 'app',
      title: 'Edit selected properties',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Project selected properties and route field edits through canonical App APIs.',
      inputs: [
        'Current selected element or vector point',
        'Current canonical properties and intended field value',
        'Field interaction start/update/end'
      ],
      outputs: ['artifact:edit-properties-outcome'],
      conditions: [
        'Display current selection and group an intended field interaction into one transaction.'
      ],
      bypasses: [
        'No selection exposes empty state; invalid field values do not create valid writes.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/properties/index.tsx',
        'apps/asyra-design/src/properties/interaction-transaction.ts',
        'apps/asyra-design/src/properties/position.tsx',
        'apps/asyra-design/src/properties/dimension.tsx',
        'apps/asyra-design/src/properties/rotation.tsx',
        'apps/asyra-design/src/properties/vector-point.tsx'
      ],
      specRefs: ['#edit-properties'],
      failureOwnerStepId: 'edit-properties'
    },
    {
      id: 'edit-fills',
      order: 12,
      laneId: 'app',
      title: 'Edit fills and strokes',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Apply field-preserving fill and stroke edits with canonical property identity.',
      inputs: [
        'Selected canonical fill/stroke references and field patches',
        'Current property values and intended target list',
        'Pointer interaction or finite API mutation scope'
      ],
      outputs: ['artifact:edit-fills-outcome'],
      conditions: [
        'Preserve unrelated fields, shared references and one intended interaction History entry.'
      ],
      bypasses: [
        'Invalid values reject; missing references and empty targets do not fabricate successful changes.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/common-apis/fills.ts',
        'apps/asyra-design/src/common-apis/property-patch.ts',
        'apps/asyra-design/src/properties/fills/use-fill-interactions.ts',
        'apps/asyra-design/src/properties/fills/use-gradient-interactions.ts',
        'apps/asyra-design/src/properties/strokes/use-stroke-interactions.ts'
      ],
      specRefs: ['#edit-fills'],
      failureOwnerStepId: 'edit-fills'
    },
    {
      id: 'drag-gradient-handles',
      order: 13,
      laneId: 'app',
      title: 'Drag gradient handles',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Convert canvas handle drags into normalized canonical gradient data.',
      inputs: [
        'Editable gradient and selected start/end handle or stop',
        'Pointer position and current canvas/element transform',
        'Gesture initial gradient and finalization/cancellation'
      ],
      outputs: ['artifact:drag-gradient-handles-outcome'],
      conditions: [
        'Use current transforms and retain unrestricted handle positions through one gesture.'
      ],
      bypasses: [
        'Absent editable gradient or invalid handle does not start a mutation.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/gradient-fill-handles/feature.ts',
        'apps/asyra-design/src/common-apis/gradient-handle-geometry.ts'
      ],
      specRefs: ['#drag-gradient-handles'],
      failureOwnerStepId: 'drag-gradient-handles'
    },
    {
      id: 'target-hierarchy',
      order: 14,
      laneId: 'app',
      title: 'Resolve hierarchy interactions',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Resolve Group/Frame interaction targets and child-level selection.',
      inputs: [
        'Raw render hit, pointer modifiers and current selection scope',
        'Canonical parent/children and registered container capabilities',
        'Locked/hidden state and path-editing mode'
      ],
      outputs: ['artifact:target-hierarchy-outcome'],
      conditions: [
        'Use canonical hierarchy and registered container capabilities; preserve identity and child-local geometry.'
      ],
      bypasses: [
        'Stale, outside or ineligible paths do not select an invented child.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/controllers/canvas-hierarchy-target.ts',
        'apps/asyra-design/src/features/selection/feature.ts',
        'apps/asyra-design/src/common-apis/hierarchy.ts'
      ],
      specRefs: ['#target-hierarchy'],
      failureOwnerStepId: 'target-hierarchy'
    },
    {
      id: 'group-elements',
      order: 15,
      laneId: 'app',
      title: 'Group and ungroup elements',
      ownerPackage: '@asyra/asyra-design',
      purpose: 'Route explicit grouping through canonical hierarchy APIs.',
      inputs: [
        'Explicit Group or Ungroup command',
        'Eligible selection and canonical hierarchy membership'
      ],
      outputs: ['artifact:group-elements-outcome'],
      conditions: [
        'Group or ungroup the complete eligible selection in one user action.'
      ],
      bypasses: [
        'Ineligible membership rejects without partial canonical changes.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/group-elements/index.ts',
        'apps/asyra-design/src/common-apis/hierarchy.ts'
      ],
      specRefs: ['#group-elements'],
      failureOwnerStepId: 'group-elements'
    },
    {
      id: 'move-layer-hierarchy',
      order: 16,
      laneId: 'app',
      title: 'Move Layers hierarchy',
      ownerPackage: '@asyra/asyra-design',
      purpose: 'Resolve Layers pointer intent and commit one canonical move.',
      inputs: [
        'Layers pointer source, modifiers and current selection',
        'Canonical source siblings and target parent/order',
        'Drop target and pointer release/cancellation'
      ],
      outputs: ['artifact:move-layer-hierarchy-outcome'],
      conditions: [
        'Keep drag feedback local until valid release; retain canonical identities and final selection.'
      ],
      bypasses: [
        'Invalid source/drop, cancellation or lost capture creates no hierarchy request.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/layer-hierarchy-move/index.ts',
        'apps/asyra-design/src/controllers/layer-pointer-session.ts',
        'apps/asyra-design/src/controllers/layer-move-session.ts',
        'apps/asyra-design/src/common-apis/hierarchy.ts'
      ],
      specRefs: ['#move-layer-hierarchy'],
      failureOwnerStepId: 'move-layer-hierarchy'
    },
    {
      id: 'navigate-viewport',
      order: 17,
      laneId: 'app',
      title: 'Navigate the viewport',
      ownerPackage: '@asyra/asyra-design',
      purpose: 'Apply pan, zoom and fit through App viewport APIs.',
      inputs: [
        'Wheel modifiers/delta or explicit zoom-fit request',
        'Current viewport position/scale and visible viewport bounds',
        'Current canonical content bounds'
      ],
      outputs: ['artifact:navigate-viewport-outcome'],
      conditions: [
        'Use wheel modifiers and current visible viewport bounds to preserve canonical camera semantics.'
      ],
      bypasses: ['Empty fit content or invalid input does not invent bounds.'],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/features/zoom/index.ts',
        'apps/asyra-design/src/features/pan/index.ts',
        'apps/asyra-design/src/features/zoom-fit/index.ts',
        'apps/asyra-design/src/common-apis/viewport.ts',
        'apps/asyra-design/src/toolbar/zoom.tsx'
      ],
      specRefs: ['#navigate-viewport'],
      failureOwnerStepId: 'navigate-viewport'
    },
    {
      id: 'present-conversation',
      order: 18,
      laneId: 'app',
      title: 'Present the conversation',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Retain conversation navigation, drafts, activity and composer context.',
      inputs: [
        'Current conversation, draft and active turn snapshots',
        'Composer text/attachment/navigation events',
        'Provider availability, confirmation and streamed activity'
      ],
      outputs: ['artifact:present-conversation-outcome'],
      conditions: [
        'Project current request state without canvas mutation from navigation or native text editing.'
      ],
      bypasses: [
        'Unavailable provider remains visible; empty or cancelled input cannot fabricate a successful response.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/app/ai-conversation-panel.tsx',
        'apps/asyra-design/src/app/ai-conversation-navigation.tsx',
        'apps/asyra-design/src/ai/conversation.ts',
        'apps/asyra-design/src/ai/activity-state.ts',
        'apps/asyra-design/src/ai/tool-library-management.ts'
      ],
      specRefs: ['#present-conversation'],
      failureOwnerStepId: 'present-conversation'
    },
    {
      id: 'execute-agent-request',
      order: 19,
      laneId: 'app',
      title: 'Execute an Agent request',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Route a prepared request through App permission, action and transaction owners.',
      inputs: [
        'User request and retained conversation context',
        'Admitted provider actions, permissions and confirmation decision',
        'Cancellation signal and canonical transaction/History outcome'
      ],
      outputs: ['artifact:execute-agent-request-outcome'],
      conditions: [
        'Keep dependent actions in the intended History group and expose actual completion or partial failure.',
        'Explicit document export retains immutable downloadable bytes outside model receipts. Export does not confirm persistence or add history; completion reports durable, local-only and unavailable independently.'
      ],
      bypasses: [
        'Denied, cancelled, unsupported or failed execution does not report completed drawing.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/ai/document-export.ts',
        'apps/asyra-design/src/ai/runtime-input.ts',
        'apps/asyra-design/src/features/ai-agent/index.ts',
        'apps/asyra-design/src/ai/startup.ts',
        'apps/asyra-design/src/ai/transaction.ts',
        'apps/asyra-design/src/ai/design-actions.ts',
        'apps/asyra-design/src/ai/actions.ts'
      ],
      specRefs: ['#execute-agent-request'],
      failureOwnerStepId: 'execute-agent-request'
    },
    {
      id: 'invoke-basic-api',
      order: 20,
      laneId: 'app',
      title: 'Invoke a registered public API',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Execute only catalogued basic actions through their explicit public owner.',
      inputs: [
        'Registered basic action contract and validated named arguments',
        'Public API owner and declared method/parameter list',
        'Invocation context, cancellation and mutation scope'
      ],
      outputs: ['artifact:invoke-basic-api-outcome'],
      conditions: [
        'Resolve declared owner/method/parameters and preserve read versus mutation semantics.'
      ],
      bypasses: [
        'Unregistered or unavailable methods reject; model-supplied method paths are never invoked.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/ai/basic-api-actions.ts',
        'apps/asyra-design/src/ai/basic-api-catalog.ts',
        'apps/asyra-design/src/ai/basic-api-results.ts',
        'apps/asyra-design/src/ai/basic-core-api-contracts.ts',
        'apps/asyra-design/src/ai/basic-design-api-contracts.ts',
        'apps/asyra-design/src/ai/basic-vector-api-contracts.ts'
      ],
      specRefs: ['#invoke-basic-api'],
      failureOwnerStepId: 'invoke-basic-api'
    },
    {
      id: 'apply-prepared-design',
      order: 21,
      laneId: 'app',
      title: 'Apply prepared design',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Admit and apply prepared editable content through ordinary design actions.',
      inputs: [
        'Provider-prepared native design or explicit design operation',
        'Current target hierarchy and component/property capabilities',
        'App action context and transaction scope'
      ],
      outputs: ['artifact:apply-prepared-design-outcome'],
      conditions: [
        'Preserve native component identity, hierarchy and ordered application within the intended action.'
      ],
      bypasses: [
        'Invalid or incomplete preparation cannot replace valid content as a successful result.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/ai/prepared-design.ts',
        'apps/asyra-design/src/ai/prepared-design-admission.ts',
        'apps/asyra-design/src/ai/design-actions.ts',
        'apps/asyra-design/src/ai/design-edit-action.ts',
        'apps/asyra-design/server/design-preparation.ts',
        'apps/asyra-design/src/ai/actions.ts'
      ],
      specRefs: ['#apply-prepared-design'],
      failureOwnerStepId: 'apply-prepared-design'
    },
    {
      id: 'inspect-design',
      order: 22,
      laneId: 'app',
      title: 'Inspect current design',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Capture canonical and rendered inspection evidence for the current design.',
      inputs: [
        'Canonical revision, required IDs and overview IDs',
        'Current render snapshot request, region and detail policy',
        'Canonical changes invalidating prior inspection stamps'
      ],
      outputs: ['artifact:inspect-design-outcome'],
      conditions: [
        'Bind observations to current canonical content and keep overview distinct from native detail.'
      ],
      bypasses: [
        'Unavailable capture and stale evidence remain explicit rather than proving current geometry.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/server/local-mechanical-checks.ts',
        'apps/asyra-design/server/local-operation-tools.ts',
        'apps/asyra-design/src/ai/prescribed-position-action.ts',
        'apps/asyra-design/src/common-apis/inspection.ts',
        'apps/asyra-design/src/common-apis/inspection-evidence.ts',
        'apps/asyra-design/src/ai/inspection.ts',
        'apps/asyra-design/server/local-design-review.ts',
        'apps/asyra-design/src/ai/review-action.ts'
      ],
      specRefs: ['#inspect-design'],
      failureOwnerStepId: 'inspect-design'
    },
    {
      id: 'query-design-context',
      order: 23,
      laneId: 'app',
      title: 'Query bounded design context',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Resolve current region queries and retained edit selections through canonical indexes.',
      inputs: [
        'Bounded region/field query or retained query selection',
        'Current canonical metadata, positions and hierarchy',
        'Relevant source invalidations and intended edit arguments'
      ],
      outputs: ['artifact:query-design-context-outcome'],
      conditions: [
        'Preserve current positions and invalidate retained queries when relevant canonical inputs change.'
      ],
      bypasses: ['Stale retained selection cannot authorize a new edit.'],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/common-apis/design-context.ts',
        'apps/asyra-design/src/common-apis/retained-design-context.ts',
        'apps/asyra-design/src/ai/context-action.ts',
        'apps/asyra-design/src/ai/retained-fill-action.ts'
      ],
      specRefs: ['#query-design-context'],
      failureOwnerStepId: 'query-design-context'
    },
    {
      id: 'project-vector-geometry',
      order: 24,
      laneId: 'framework',
      title: 'Project vector geometry',
      ownerPackage: '@asyra/preset',
      purpose:
        'Project canonical vector geometry and coverage to the renderer.',
      inputs: [
        'Canonical points, segments, networks and fill rule',
        'Current vector properties and neutral renderer capabilities'
      ],
      outputs: ['artifact:project-vector-geometry-outcome'],
      conditions: [
        'Derive geometry and coverage from canonical vector topology without changing source data.'
      ],
      bypasses: [
        'Empty or degenerate topology does not fabricate valid visible coverage.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'packages/preset/src/components/vector.ts',
        'packages/preset/src/components/vector-compound-fill.ts'
      ],
      specRefs: ['#project-vector-geometry'],
      failureOwnerStepId: 'project-vector-geometry'
    },
    {
      id: 'render-material',
      order: 25,
      laneId: 'framework',
      title: 'Render native materials',
      ownerPackage: '@asyra/render-engine-pixi',
      purpose:
        'Render canonical mesh and gradient material commands through the concrete engine.',
      inputs: [
        'Neutral geometry/material commands and ordered layers',
        'Color stops, alpha, coordinates and current engine resources',
        'Camera updates, material changes and batch limits'
      ],
      outputs: ['artifact:render-material-outcome'],
      conditions: [
        'Preserve ordered colors, stops, alpha and geometry across batching and camera changes.'
      ],
      bypasses: [
        'Empty or invalid material inputs do not become unrelated fallback imagery.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'packages/render-engine-pixi/src/mesh-material.ts',
        'packages/render-engine-pixi/src/mesh-material-batch.ts',
        'packages/render-engine-pixi/src/mesh-material-shader.ts'
      ],
      specRefs: ['#render-material'],
      failureOwnerStepId: 'render-material'
    },
    {
      id: 'retain-navigation',
      order: 26,
      laneId: 'framework',
      title: 'Retain navigation projections',
      ownerPackage: '@asyra/render-engine-pixi',
      purpose:
        'Reuse camera-independent geometry while applying current navigation and local changes.',
      inputs: [
        'Current camera update or local element edit',
        'Retained engine geometry, resources and interaction targets',
        'Render projection and input routing requests'
      ],
      outputs: ['artifact:retain-navigation-outcome'],
      conditions: [
        'Camera changes preserve canonical document identity and reuse unchanged geometry; edits invalidate affected projections.'
      ],
      bypasses: [
        'Missing renderer state remains unavailable rather than a valid profile.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'packages/render-engine-pixi/src/pixi-render-engine.ts',
        'packages/render-engine-pixi/src/pixi-batch-partitions.ts'
      ],
      specRefs: ['#retain-navigation'],
      failureOwnerStepId: 'retain-navigation'
    },
    {
      id: 'edit-native-text',
      order: 27,
      laneId: 'app',
      title: 'Edit native text',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Apply editable native text with canonical save and replay behavior.',
      inputs: [
        'Selected canonical native text element',
        'Text and typography field edits',
        'Save and History replay state'
      ],
      outputs: ['artifact:edit-native-text-outcome'],
      conditions: [
        'Keep native text properties editable and retain them through save, Undo and Redo.'
      ],
      bypasses: [
        'Invalid text preparation does not silently rasterize editable content.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/properties/text.tsx',
        'apps/asyra-design/src/ai/design-actions.ts'
      ],
      specRefs: ['#edit-native-text'],
      failureOwnerStepId: 'edit-native-text'
    },
    {
      id: 'show-session-status',
      order: 28,
      laneId: 'app',
      title: 'Show document session status',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Expose offline session state while preserving local editing and Reset.',
      inputs: [
        'Document session availability and stable notification identity',
        'App Reset and local editing state',
        'Toast dismissal and component lifecycle'
      ],
      outputs: ['artifact:show-session-status-outcome'],
      conditions: [
        'Show one initial unavailable-session notice and keep ordinary local editing usable.'
      ],
      bypasses: [
        'Unavailable transport does not mark the local editor unusable or fabricate remote persistence.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/render-app/index.tsx',
        'apps/asyra-design/src/render-app/status-toast-stack.tsx'
      ],
      specRefs: ['#show-session-status'],
      failureOwnerStepId: 'show-session-status'
    },
    {
      id: 'show-context-menu',
      order: 29,
      laneId: 'app',
      title: 'Present Group commands',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Present eligible Group commands without mutation until an explicit command.',
      inputs: [
        'Context-menu pointer position and eligible selection',
        'Platform shortcut policy and explicit command/dismissal',
        'Current Group/Frame capability state'
      ],
      outputs: ['artifact:show-context-menu-outcome'],
      conditions: [
        'Opening and closing the menu is read-only; an explicit eligible command uses the Group feature.'
      ],
      bypasses: ['Dismissal or unavailable command has no mutation.'],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/app/group-context-menu.tsx',
        'apps/asyra-design/src/app/context-menu-session.ts',
        'apps/asyra-design/src/features/group-elements/index.ts'
      ],
      specRefs: ['#show-context-menu'],
      failureOwnerStepId: 'show-context-menu'
    },
    {
      id: 'rollback-transaction',
      order: 30,
      laneId: 'framework',
      title: 'Rollback rejected mutations',
      ownerPackage: '@asyra/factory',
      purpose:
        'Reverse a failed transaction journal without creating committed History.',
      inputs: [
        'Transaction journal and owner-issued inverse data',
        'Commit validation rejection or rollback cancellation',
        'Previously committed History and publication state'
      ],
      outputs: ['artifact:rollback-transaction-outcome'],
      conditions: [
        'Rejected validation restores owner-issued before state and preserves prior committed history.'
      ],
      bypasses: [
        'Non-rollbackable effects retain their explicit failure contract; no successful commit is fabricated.'
      ],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: ['packages/factory/src/data-transact.ts'],
      specRefs: ['#rollback-transaction'],
      failureOwnerStepId: 'rollback-transaction'
    },
    {
      id: 'group-history-members',
      order: 31,
      laneId: 'framework',
      title: 'Group finite History members',
      ownerPackage: '@asyra/factory',
      purpose:
        'Commit finite canonical members while retaining one open History group.',
      inputs: [
        'Open History group handle and finite member callback',
        'Owner-issued canonical changes and publication boundaries',
        'Group closure and recorded action History'
      ],
      outputs: ['artifact:group-history-members-outcome'],
      conditions: [
        'Member transactions publish completed state before group closure; closure records one History action.'
      ],
      bypasses: ['A failed member cannot become a completed History action.'],
      allowedContributors: [
        'Declared public App or Framework APIs',
        'Current canonical state and registered capabilities'
      ],
      forbiddenContributors: [
        'Observation records or test assertions as canonical product state',
        'Guessed ownership or test-specific runtime output'
      ],
      cacheDimensions: [],
      implementationBoundary: ['packages/factory/src/data-transact.ts'],
      specRefs: ['#group-history-members'],
      failureOwnerStepId: 'group-history-members'
    },
    {
      id: 'present-layer-hierarchy',
      order: 32,
      laneId: 'app',
      title: 'Present canonical Layers hierarchy',
      ownerPackage: '@asyra/asyra-design',
      purpose:
        'Project canonical hierarchy as expandable Layers rows without changing document structure.',
      inputs: [
        'Canonical flattened element identities and element metadata',
        'Local expanded-container identities and disclosure toggle'
      ],
      outputs: ['artifact:present-layer-hierarchy-outcome'],
      conditions: [
        'Derive row visibility and depth from canonical hierarchy and local disclosure state; toggling a container changes only row visibility.'
      ],
      bypasses: [
        'Invalid canonical hierarchy reports a projection error rather than inventing rows; non-container rows have no disclosure control.'
      ],
      allowedContributors: [
        'Canonical element hierarchy projection',
        'Contents panel disclosure state and GroupDisclosure pointer input'
      ],
      forbiddenContributors: [
        'Document reparent or geometry writes from disclosure',
        'Canvas targeting as a replacement for Layers projection'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'apps/asyra-design/src/contents/contents-panel.tsx',
        'apps/asyra-design/src/contents/layer-hierarchy.ts',
        'apps/asyra-design/src/contents/Element.tsx',
        'apps/asyra-design/src/contents/GroupDisclosure.tsx'
      ],
      specRefs: ['#present-layer-hierarchy'],
      failureOwnerStepId: 'present-layer-hierarchy'
    },
    {
      id: 'project-ui-membership',
      order: 33,
      laneId: 'framework',
      title: 'Project canonical UI membership',
      ownerPackage: '@asyra/preset',
      purpose:
        'Publish ordered flattened UI membership from canonical scene changes without rereading unchanged rows.',
      inputs: [
        'Canonical element map and flattened identities',
        'Changed memberships and load/observer lifetime'
      ],
      outputs: ['artifact:project-ui-membership-outcome'],
      conditions: [
        'Preserve exact membership order through create, Undo, Redo and load; reuse unchanged membership within its valid observer and published-identity lifetime.'
      ],
      bypasses: [
        'Cold, replaced or invalidated canonical sources rebuild membership before reuse.'
      ],
      allowedContributors: [
        'Canonical scene publication and Preset data-channel projection'
      ],
      forbiddenContributors: [
        'Renderer geometry as canonical membership',
        'Diagnostics as product state'
      ],
      cacheDimensions: [
        'observer lifetime',
        'published element-map identity',
        'published flat identity'
      ],
      implementationBoundary: [
        'packages/preset/src/subscriptions/data-channel.ts'
      ],
      specRefs: ['#project-ui-membership'],
      failureOwnerStepId: 'project-ui-membership'
    }
  ],
  routes: [
    {
      id: 'start-editor-complete',
      from: 'start-editor',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:start-editor-outcome']
    },
    {
      id: 'switch-tool-complete',
      from: 'switch-tool',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:switch-tool-outcome']
    },
    {
      id: 'create-element-complete',
      from: 'create-element',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:create-element-outcome']
    },
    {
      id: 'select-elements-complete',
      from: 'select-elements',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:select-elements-outcome']
    },
    {
      id: 'hover-elements-complete',
      from: 'hover-elements',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:hover-elements-outcome']
    },
    {
      id: 'move-elements-complete',
      from: 'move-elements',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:move-elements-outcome']
    },
    {
      id: 'delete-subtree-complete',
      from: 'delete-subtree',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:delete-subtree-outcome']
    },
    {
      id: 'delete-vector-point-complete',
      from: 'delete-vector-point',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:delete-vector-point-outcome']
    },
    {
      id: 'replay-history-complete',
      from: 'replay-history',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:replay-history-outcome']
    },
    {
      id: 'edit-vector-path-complete',
      from: 'edit-vector-path',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:edit-vector-path-outcome']
    },
    {
      id: 'edit-properties-complete',
      from: 'edit-properties',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:edit-properties-outcome']
    },
    {
      id: 'edit-fills-complete',
      from: 'edit-fills',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:edit-fills-outcome']
    },
    {
      id: 'drag-gradient-handles-complete',
      from: 'drag-gradient-handles',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:drag-gradient-handles-outcome']
    },
    {
      id: 'target-hierarchy-complete',
      from: 'target-hierarchy',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:target-hierarchy-outcome']
    },
    {
      id: 'group-elements-complete',
      from: 'group-elements',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:group-elements-outcome']
    },
    {
      id: 'move-layer-hierarchy-complete',
      from: 'move-layer-hierarchy',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:move-layer-hierarchy-outcome']
    },
    {
      id: 'navigate-viewport-complete',
      from: 'navigate-viewport',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:navigate-viewport-outcome']
    },
    {
      id: 'present-conversation-complete',
      from: 'present-conversation',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:present-conversation-outcome']
    },
    {
      id: 'execute-agent-request-complete',
      from: 'execute-agent-request',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:execute-agent-request-outcome']
    },
    {
      id: 'invoke-basic-api-complete',
      from: 'invoke-basic-api',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:invoke-basic-api-outcome']
    },
    {
      id: 'apply-prepared-design-complete',
      from: 'apply-prepared-design',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:apply-prepared-design-outcome']
    },
    {
      id: 'inspect-design-complete',
      from: 'inspect-design',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:inspect-design-outcome']
    },
    {
      id: 'query-design-context-complete',
      from: 'query-design-context',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:query-design-context-outcome']
    },
    {
      id: 'project-vector-geometry-complete',
      from: 'project-vector-geometry',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:project-vector-geometry-outcome']
    },
    {
      id: 'render-material-complete',
      from: 'render-material',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:render-material-outcome']
    },
    {
      id: 'retain-navigation-complete',
      from: 'retain-navigation',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:retain-navigation-outcome']
    },
    {
      id: 'edit-native-text-complete',
      from: 'edit-native-text',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:edit-native-text-outcome']
    },
    {
      id: 'show-session-status-complete',
      from: 'show-session-status',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:show-session-status-outcome']
    },
    {
      id: 'show-context-menu-complete',
      from: 'show-context-menu',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:show-context-menu-outcome']
    },
    {
      id: 'rollback-transaction-complete',
      from: 'rollback-transaction',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:rollback-transaction-outcome']
    },
    {
      id: 'group-history-members-complete',
      from: 'group-history-members',
      kind: 'terminal',
      predicate:
        'The operation settles or explicitly bypasses according to its product contract.',
      producedArtifacts: ['artifact:group-history-members-outcome']
    },
    {
      id: 'project-ui-membership-complete',
      from: 'project-ui-membership',
      kind: 'terminal',
      predicate:
        'Canonical membership is published or its invalid source is rejected.',
      producedArtifacts: ['artifact:project-ui-membership-outcome']
    }
  ],
  artifacts: [
    {
      id: 'artifact:start-editor-outcome',
      ownerStepId: 'start-editor',
      channel: 'Start and reset the editor result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:switch-tool-outcome',
      ownerStepId: 'switch-tool',
      channel: 'Switch the primary tool result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:create-element-outcome',
      ownerStepId: 'create-element',
      channel: 'Create an element gesture result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:select-elements-outcome',
      ownerStepId: 'select-elements',
      channel: 'Select elements result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:hover-elements-outcome',
      ownerStepId: 'hover-elements',
      channel: 'Resolve hover result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:move-elements-outcome',
      ownerStepId: 'move-elements',
      channel: 'Move elements result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:delete-subtree-outcome',
      ownerStepId: 'delete-subtree',
      channel: 'Delete a selected subtree result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:delete-vector-point-outcome',
      ownerStepId: 'delete-vector-point',
      channel: 'Delete a vector anchor result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:replay-history-outcome',
      ownerStepId: 'replay-history',
      channel: 'Replay user actions result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:edit-vector-path-outcome',
      ownerStepId: 'edit-vector-path',
      channel: 'Edit vector paths result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:edit-properties-outcome',
      ownerStepId: 'edit-properties',
      channel: 'Edit selected properties result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:edit-fills-outcome',
      ownerStepId: 'edit-fills',
      channel: 'Edit fills and strokes result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:drag-gradient-handles-outcome',
      ownerStepId: 'drag-gradient-handles',
      channel: 'Drag gradient handles result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:target-hierarchy-outcome',
      ownerStepId: 'target-hierarchy',
      channel: 'Resolve hierarchy interactions result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:group-elements-outcome',
      ownerStepId: 'group-elements',
      channel: 'Group and ungroup elements result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:move-layer-hierarchy-outcome',
      ownerStepId: 'move-layer-hierarchy',
      channel: 'Move Layers hierarchy result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:navigate-viewport-outcome',
      ownerStepId: 'navigate-viewport',
      channel: 'Navigate the viewport result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:present-conversation-outcome',
      ownerStepId: 'present-conversation',
      channel: 'Present the conversation result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:execute-agent-request-outcome',
      ownerStepId: 'execute-agent-request',
      channel: 'Execute an Agent request result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:invoke-basic-api-outcome',
      ownerStepId: 'invoke-basic-api',
      channel: 'Invoke a registered public API result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:apply-prepared-design-outcome',
      ownerStepId: 'apply-prepared-design',
      channel: 'Apply prepared design result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:inspect-design-outcome',
      ownerStepId: 'inspect-design',
      channel: 'Inspect current design result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:query-design-context-outcome',
      ownerStepId: 'query-design-context',
      channel: 'Query bounded design context result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:project-vector-geometry-outcome',
      ownerStepId: 'project-vector-geometry',
      channel: 'Project vector geometry result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:render-material-outcome',
      ownerStepId: 'render-material',
      channel: 'Render native materials result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:retain-navigation-outcome',
      ownerStepId: 'retain-navigation',
      channel: 'Retain navigation projections result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:edit-native-text-outcome',
      ownerStepId: 'edit-native-text',
      channel: 'Edit native text result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:show-session-status-outcome',
      ownerStepId: 'show-session-status',
      channel: 'Show document session status result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:show-context-menu-outcome',
      ownerStepId: 'show-context-menu',
      channel: 'Present Group commands result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:rollback-transaction-outcome',
      ownerStepId: 'rollback-transaction',
      channel: 'Rollback rejected mutations result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:group-history-members-outcome',
      ownerStepId: 'group-history-members',
      channel: 'Group finite History members result',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:present-layer-hierarchy-outcome',
      ownerStepId: 'present-layer-hierarchy',
      channel: 'Visible Layers rows and disclosure state',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:project-ui-membership-outcome',
      ownerStepId: 'project-ui-membership',
      channel: 'Canonical UI context publication',
      consumerStepIds: [],
      terminal: true
    }
  ],
  invariants: [],
  acceptanceContracts: []
}

globalThis.FLOW_INSPECTOR_DATA = data
if (typeof module !== 'undefined') module.exports = data
