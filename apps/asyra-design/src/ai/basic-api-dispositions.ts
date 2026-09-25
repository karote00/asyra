/** Explicit coverage decisions for public methods which are not task actions.
 * New public members must receive a contract or a reviewed entry here.
 * These lists are build/test metadata, never a dynamic execution allowlist.
 */
export const basicApiDispositions = [
  {
    owner: 'core',
    reason:
      'Runtime registration/lifecycle requires callbacks, renderer resources or composition ownership; it is not a document edit.',
    methods: [
      'version',
      'setupInputSystem',
      'initRender',
      'registerRenderLayer',
      'unregisterRenderLayer',
      'createRenderGradientFillStyle',
      'createEvenOddFillStyle',
      'createMeshProjection',
      'registerRenderInteractionTargets',
      'updateRenderInteractionTarget',
      'unregisterRenderInteractionTarget',
      'clearRenderInteractionTargets',
      'registerRenderInteractionHandler',
      'unregisterRenderInteractionHandler',
      'sceneTreeInit',
      'initFeatureSystem',
      'defineUIProperty',
      'registerUIProperty',
      'defineSystemProperty',
      'registerSystemProperty',
      'unregisterSystemProperty',
      'deps',
      'registerRuntimeCleanup',
      'resetRuntime',
      'setRenderer',
      'destroyRenderer',
      'registerCollaborationSession',
      'destroy',
      'registerInputKeyCombinations',
      'resizeRenderer',
      'getCanvas',
      'setCanvasCursor',
      'setRenderEngineProvider',
      'registerDataChannelObserver',
      'unregisterDataChannelObserver',
      'registerSharedDataChannel',
      'unregisterSharedDataChannel',
      'createLocalSharedDataChannel',
      'setLoadSource',
      'setPersistence',
      'registerSaveHook',
      'registerLoadHook',
      'registerLoadDiagnosticsHook',
      'start',
      'registerEvent',
      'unregisterEvent',
      'registerPropertySchema',
      'getPropertySchema',
      'definePropertyComponent',
      'registerPropertyComponent',
      'getPropertyComponent',
      'getPropertyTypeDefinition',
      'redefinePropertyType',
      'unregisterPropertyRegistration',
      'definePropertyChildRelation',
      'removePropertyChildRelation',
      'unregisterPropertyType',
      'defineComponent',
      'unregisterComponent',
      'defineComponentPropertyRelation',
      'removeComponentPropertyRelation',
      'defineFeature',
      'getFeature',
      'unregisterFeature',
      'registerRenderStrategy',
      'unregisterRenderStrategy',
      'unregisterUIProperty',
      'defineSelection',
      'registerSelection',
      'unregisterSelection',
      'getSelection',
      'getPresetDependencies'
    ]
  },
  {
    owner: 'core',
    reason:
      'Observable/callback subscription belongs to the host, not a serializable action result.',
    methods: [
      'getUIPropertySubject',
      'onUIPropertyChange',
      'getSystemPropertyObservable',
      'subscribeToFrameComplete',
      'subscribeToSharedPublication',
      'subscribeToTransactionStatus',
      'observeSharedDataChannel',
      'subscribeEvent'
    ]
  },
  {
    owner: 'core',
    reason:
      'Replay/load/projection entry needs canonical evidence or host transaction ownership. Ordinary edits use create, patch, move and remove APIs.',
    methods: [
      'propsLoadData',
      'preflightRestoreProperties',
      'applyRestoreProperties',
      'applyCanonicalChanges',
      'sceneTreeLoadData',
      'createElementsInParentFromCanonicalData',
      'applyHierarchyMoves',
      'applyElementDataChanges',
      'removeSubtreeFromCanonicalData',
      'removeElementsFromCanonicalData',
      'preflightRestoreSubtree',
      'applyRestoreSubtree',
      'updateLocalComputedData',
      'patchLocalComputedData',
      'projectLocalComputedDataFromPropertyIds',
      'projectLocalComputedDataForElements',
      'configureSharedDeliverySequence',
      'applyRemoteCanonicalChangeSlices',
      'load',
      'preflightLoad'
    ]
  },
  {
    owner: 'core',
    reason:
      'Generic UI/system writes can change active session ownership. Use the viewport and selection actions for user-facing operations.',
    methods: ['setSystemProperty', 'setUIProperty']
  },
  {
    owner: 'core',
    reason:
      'Equivalent serializable parent-ID API: api_core_createElementInParent. The original optional parent argument is a live Group instance.',
    methods: ['createElement']
  },
  {
    owner: 'core',
    reason:
      'Covered by inspect_drawing, which transports the actual image and native-detail/overview semantics.',
    methods: ['captureElementSnapshot']
  },
  {
    owner: 'element',
    reason:
      'Internal gesture preview/drag threshold and normalization owner. Normal document edits already invoke required normalization.',
    methods: [
      'discardTransientVectorPreviews',
      'normalizeGroupGeometryForElements',
      'hasMovedBeyondThreshold'
    ]
  },
  {
    owner: 'transaction',
    reason:
      'Runtime owns the invocation transaction and publication ordering. Model actions must not nest or settle it.',
    methods: [
      'startTransaction',
      'endTransaction',
      'rollbackTransaction',
      'runTransaction',
      'updateTransaction',
      'configureSharedDeliverySequence'
    ]
  },
  {
    owner: 'history',
    reason:
      'Undo/Redo replay executes outside an active drawing transaction through existing user history controls, never nested inside the model invocation.',
    methods: ['undo', 'redo']
  },
  {
    owner: 'inspection',
    reason:
      'Existing inspect_drawing action delegates to this API and transports images.',
    methods: ['inspect']
  },
  {
    owner: 'renderLayer',
    reason:
      'Host render registration requires render callbacks and lifecycle ownership.',
    methods: ['registerRenderLayer', 'unregisterRenderLayer']
  },
  {
    owner: 'cursor',
    reason:
      'Transient pointer presentation belongs to the active input feature.',
    methods: ['setCanvasCursor', 'resetCanvasCursor']
  },
  {
    owner: 'vectorGeometry',
    reason:
      'Pure topology helpers are already owned by the element vector actions; callers edit via those canonical adapters instead of constructing internal computed patches.',
    methods: [
      'validate',
      'addPoint',
      'movePoint',
      'splitSegment',
      'updatePoint',
      'removePoint',
      'connectEndpoints',
      'connectAnchors',
      'setHandleMode',
      'updateHandle',
      'buildPatch'
    ]
  },
  {
    owner: 'systemContext',
    reason:
      'Transient gesture/session/progress state is owned by input features and Runtime. Snapshot reads use api_core_getSystemContextSnapshot; persistent selection uses selection APIs.',
    methods: [
      'switchPrimaryTool',
      'getSystemContextSnapshot',
      'updateHoveredElementId',
      'getAreaSelection',
      'setAreaSelection',
      'clearAreaSelection',
      'getAiDrawingProgress',
      'setAiDrawingProgress',
      'clearAiDrawingProgress',
      'getPathEditingVectorId',
      'getPathEditingMode',
      'setPathEditingMode',
      'setPathEditingVectorId',
      'getPathEditingStartNewSubpath',
      'setPathEditingStartNewSubpath',
      'getSelectedVectorPoint',
      'setSelectedVectorPoint',
      'getHoveredVectorPoint',
      'setHoveredVectorPoint',
      'getSelectedVectorSegment',
      'setSelectedVectorSegment',
      'getHoveredVectorSegment',
      'setHoveredVectorSegment',
      'getHoveredVectorSegmentInsertPoint',
      'setHoveredVectorSegmentInsertPoint',
      'clearVectorPointState',
      'getActiveGradientFill',
      'setActiveGradientFill',
      'getHoveredGradientHandle',
      'setHoveredGradientHandle',
      'getSelectedGradientHandle',
      'setSelectedGradientHandle',
      'getHoveredGradientStop',
      'setHoveredGradientStop',
      'getSelectedGradientStop',
      'setSelectedGradientStop',
      'clearGradientFillEditingState',
      'enterPathEditingMode',
      'exitPathEditingMode',
      'getPathEditingContinuation',
      'setPathEditingContinuation'
    ]
  }
] as const
