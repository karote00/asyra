;(function () {
  const data = {
    schema: {
      id: 'flow-inspector',
      version: 2
    },
    target: {
      id: 'ai-execution-flow',
      kind: 'feature',
      title: 'AI Design Execution',
      subtitle: 'Brief to registered operations and verified outcome'
    },
    authority: {
      specPath: 'docs/ai/apps/asyra-design/specs/ai-execution-flow.md',
      inspectorPath:
        'tools/flow-inspector/inspectors/ai-execution-flow-inspector.data.cjs',
      semanticOwner: 'Asyra Design execution',
      inspectorOwner: 'Asyra Design orchestration'
    },
    links: [],
    lanes: [
      {
        id: 'execution',
        title: 'Design execution',
        order: 1
      }
    ],
    steps: [
      {
        id: 'request',
        order: 1,
        laneId: 'execution',
        title: 'Request and continuity',
        ownerPackage: '@asyra/asyra-design',
        purpose: 'request-adapter',
        inputs: [
          'brief and attachments',
          'bounded canonical context',
          'conversation target references'
        ],
        outputs: ['artifact:request-context'],
        conditions: ['Resolve references against current document identity'],
        bypasses: ['New conversations omit prior targets'],
        allowedContributors: [
          'conversation lifecycle',
          'public canonical observations'
        ],
        forbiddenContributors: [
          'renderer state as authority',
          'cross-request geometry cache'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/src/ai/conversation.ts',
          'apps/asyra-design/src/ai/__tests__/conversation.test.ts',
          'apps/asyra-design/src/ai/runtime-input.ts',
          'apps/asyra-design/src/ai/action-failure.ts',
          'apps/asyra-design/src/ai/action-batch-protocol.ts'
        ],
        specRefs: ['#request-and-continuity'],
        failureOwnerStepId: 'request'
      },
      {
        id: 'compose',
        order: 2,
        laneId: 'execution',
        title: 'Discover and compose',
        ownerPackage: '@asyra/asyra-design',
        purpose: 'provider',
        inputs: [
          'artifact:request-context',
          'registered capability definitions',
          'read-only effective native provider configuration',
          'artifact:inspection-evidence',
          'artifact:execution-receipt'
        ],
        outputs: ['artifact:tool-program'],
        conditions: [
          'Preserve all registered capabilities and exact tool identities',
          'Validate the advertised input including nullable unions and unique-item constraints at one invocation boundary before dispatch; preserve specific preparation rejection reasons without calling the canvas owner',
          'Use one failure receipt boundary for every registered owner, never owner opt-ins, tool-name recovery lists or automatic replay of uncertain writes',
          'Return admission, execution, decoding and delivery failures to the model without aborting the turn; preserve acknowledged work and unknown settlement explicitly; Stop and broken transport or provider protocol remain terminal',
          'Deliver original PNG, JPEG and WebP reference bytes at admitted dimensions; advertise and verify the actual Code Mode string-result forwarding contract without MCP content-array assumptions or base64 text output; verify actual model image visibility independently of acquisition; keep canvas snapshot limits scoped to inspection',
          'Distinguish usable output, unavailable preparation and partial receipts from transport completion',
          'Resolve exact semantic operation identities and categories against current admitted schemas; never infer an adapter from lexical similarity',
          'Advertise registry-derived category choices and return current recovery choices on unknown lookup without a canvas exchange',
          'Classify redundant model routes with explicit replacements while preserving public UI methods and primitive capability coverage',
          'Distinguish computed projections from canonical value and record mutations in registered descriptors',
          'Resolve prepared target identities at the unique registered argument path; reject conflicts and ambiguity before dispatch; preserve reference order for aligned new-value patches',
          'Validate supplied union discriminators and report only the applicable branch when uniquely selected; preserve ambiguous alternatives',
          'Use native discovery and Code Mode; configured model and effort remain unchanged',
          'Keep shared guidance concise and expose task-specific image procedures through discovered tool definitions',
          'Startup guidance defers stage procedures to tool contracts; a ready first part requires no model-authored plan, and chosen spatial projection uses the existing preparation owner without prescribing a viewpoint',
          'The existing combined workflow owns deterministic handoffs, preserves prepared identities and completed step outcomes on later failure, observes each internal call and never replays uncertain writes',
          'Compose optional first-write criteria through the existing review owner after preparation and before mutation; reject invalid criteria without canvas writes',
          'Explain construction choices from supplied coordinate and repetition semantics; preserve direct edits and arbitrary 2D paths, with executable examples and no forced camera or subject-based routing',
          'Preserve original request terms and constraints when organizing the existing plan; separate assumptions without an extra translation call',
          'Initial decisions need no execution or inspection receipt; later decisions consume only receipts actually produced',
          'Research missing information after reusing available evidence; batch independent gaps and emit retained coherent parts before completing detail planning',
          'Allow category-scoped schema retrieval in one call while keeping default discovery compact',
          'Provide exact usage and schema-pointer fragments with local reference closure without consuming full-definition delivery; reject unknown paths recoverably and distinguish response coverage from prior delivery',
          'Compact only equivalent redundant native constraints; preserve oneOf multiplicity, contradictions and common union fields',
          'Return full action definitions once per request and exact revision, then references with explicit refresh after context loss or delivery failure; compact menus do not consume delivery',
          'Distribute common union fields for native declarations without changing admission; exact native lookup returns canonical schemas and definitions once per request revision with explicit refresh when Code Mode abbreviates nested fields; never maintain a separate schema copy',
          'Apply the same isolation policy at child launch and thread creation: disable personal hooks, legacy notification commands and both multi-agent variants without modifying user configuration',
          'Read effective native configuration once per invocation and disable each inherited MCP server for the ephemeral thread without writing user config; invalid configuration stops before inference',
          'Resolve mixed exact action and native tool lookups from actual registered groups with distinct execution routes; preserve known matches when another name is missing',
          'Review ready retained parts with partial visual checks; leave other criteria pending without waiting for whole-structure approval'
        ],
        bypasses: ['Simple edits and advice omit research and preparation'],
        allowedContributors: [
          'native app-server protocol',
          'registered tool schemas',
          'domain guidance'
        ],
        forbiddenContributors: [
          'App evaluation of generated code',
          'fixed subject or style classifier'
        ],
        cacheDimensions: [
          'request-local admitted action identity and exact definition revision; explicit refresh bypasses delivery reuse'
        ],
        implementationBoundary: [
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/server/local-ai-provider.ts',
          'apps/asyra-design/server/local-design-workflow.ts',
          'apps/asyra-design/server/__tests__/local-design-workflow.test.ts',
          'apps/asyra-design/server/local-tool-invocation.ts',
          'apps/asyra-design/server/__tests__/local-tool-invocation.test.ts',
          'apps/asyra-design/server/__tests__/local-ai-provider.test.ts',
          'apps/asyra-design/server/__tests__/local-ai-live.test.ts',
          'apps/asyra-design/server/local-operation-tools.ts',
          'apps/asyra-design/server/__tests__/local-operation-tools.test.ts',
          'apps/asyra-design/src/ai/basic-design-api-contracts.ts',
          'apps/asyra-design/src/ai/basic-core-api-contracts.ts',
          'apps/asyra-design/src/ai/basic-vector-api-contracts.ts',
          'apps/asyra-design/src/ai/basic-api-catalog.ts',
          'apps/asyra-design/src/ai/basic-api-dispositions.ts',
          'apps/asyra-design/src/ai/basic-api-contracts.ts',
          'apps/asyra-design/server/__tests__/basic-api-contracts.test.ts',
          'apps/asyra-design/e2e/local-ai-provider.spec.ts',
          'apps/asyra-design/server/operation-input-schema.ts',
          'apps/asyra-design/server/local-operation-batch.ts',
          'apps/asyra-design/server/__tests__/operation-input-schema.test.ts',
          'apps/asyra-design/server/ai-domain-prompt.ts',
          'apps/asyra-design/server/local-image-tools.ts',
          'apps/asyra-design/server/local-design-tools.ts',
          'apps/asyra-design/server/design-preparation-examples.ts',
          'apps/asyra-design/server/__tests__/local-design-tools.test.ts',
          'apps/asyra-design/server/local-reference-tools.ts',
          'apps/asyra-design/server/__tests__/ai-domain-prompt.test.ts'
        ],
        specRefs: ['#capability-discovery-and-composition'],
        failureOwnerStepId: 'compose'
      },
      {
        id: 'prepare',
        order: 3,
        laneId: 'execution',
        title: 'Prepare deterministic artifacts',
        ownerPackage: '@asyra/asyra-design',
        purpose: 'artifact-owners',
        inputs: [
          'artifact:tool-program',
          'validated semantic parameters',
          'request-local immutable handles'
        ],
        outputs: ['artifact:prepared-artifact'],
        conditions: [
          'Use existing preparation owners and retain original resolution',
          'Resolve source-page image declarations and linked-image relationships through bounded DNS-pinned acquisition; prefer the declared linked resource over its preview without site rules or URL rewriting; retain selected candidate identity and actual dimensions, distinguish redisplay from acquisition, and leave subject suitability to the model',
          'Derive vector dimensions from admitted rings when both dimensions are omitted; preserve explicit bounds assertions, exact geometry and per-preparation measurement reuse',
          'Observe per-source acquisition and reuse with parent-linked input/output evidence; concurrent completion is not visual suitability',
          'Compile explicit draft-local shared Fill definitions once at first use and emit canonical child-ID references thereafter; equal inline values remain independent and missing definitions reject before apply',
          'Preserve supported original raster encoding after decode validation, use decoder-default pixel safety consistently in import and direct image consumers, and retain byte limits without PNG inflation or resampling',
          'Compile ready repeated geometry independently of whole-structure review; final review requirements remain owned by inspect',
          'Partition cumulative source work into bounded preparation windows inside one artifact; preserve global keys, hierarchy, layout, relations and painter order; reject expanded geometry/depth excess or indivisible oversized primitives without simplifying detail',
          'An explicit preserve-vectors image region extracts oriented source pixels without resampling, returns region-local coordinates and source region; oversized conversion reports observed and allowed bytes, not an unavailable converter; successful request-local reuse distinguishes attachment and region',
          'Admit signed curve controls against measured curve bounds and report malformed pairs by semantic node and edge',
          'Draft keys are optional root selectors, never canonical IDs; unnamed roots use the generated element ID and no root name is reserved',
          'Reference reuse preserves the current source attribution and exposes source-local rejection stages',
          'Acquire candidate image URLs in one batch with bounded concurrent I/O, ordered per-source receipts, original images and request-local in-flight reuse; one source failure does not discard siblings; cancellation prevents attachment admission',
          'No cross-request retention without measured reuse and equivalence',
          'Expand request-local vector templates and placements without losing geometry, painter order or stable keys'
        ],
        bypasses: ['Advice and direct edits require no prepared artifact'],
        allowedContributors: [
          'design preparation',
          'image artifact owner',
          'public pure geometry APIs'
        ],
        forbiddenContributors: [
          'model calls inside geometry expansion',
          'canonical writes',
          'automatic detail removal'
        ],
        cacheDimensions: [
          'request-local source-page candidate relationships and current selected image URL; validated byte digest reuses decoding and attachment identity; in-flight URL reuse for the same cancellation scope; attribution projected per caller; failures removed; original image delivery once per attachment with explicit refresh'
        ],
        implementationBoundary: [
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/server/local-design-tools.ts',
          'apps/asyra-design/server/local-image-tools.ts',
          'apps/asyra-design/server/local-image-layer-separation.ts',
          'apps/asyra-design/server/__tests__/local-image-layer-separation.test.ts',
          'apps/asyra-design/server/__tests__/local-image-tools.test.ts',
          'apps/asyra-design/server/design-preparation.ts',
          'apps/asyra-design/src/ai/design-fill.ts',
          'apps/asyra-design/server/design-budget.ts',
          'apps/asyra-design/server/local-reference-tools.ts',
          'apps/asyra-design/server/__tests__/local-reference-tools.test.ts',
          'apps/asyra-design/server/reference-image-download.ts',
          'apps/asyra-design/server/reference-page-images.ts',
          'apps/asyra-design/server/__tests__/reference-page-images.test.ts',
          'apps/asyra-design/server/__tests__/fixtures/reference-linked-image.html',
          'apps/asyra-design/server/__tests__/reference-image-download.test.ts',
          'apps/asyra-design/server/design-construction.ts',
          'apps/asyra-design/server/design-construction-schema.ts',
          'apps/asyra-design/server/design-preparation-examples.ts',
          'apps/asyra-design/server/__tests__/design-patterns.test.ts',
          'apps/asyra-design/server/__tests__/local-design-tools.test.ts',
          'apps/asyra-design/server/__tests__/design-preparation.test.ts'
        ],
        specRefs: ['#preparation-and-execution'],
        failureOwnerStepId: 'prepare'
      },
      {
        id: 'apply',
        order: 4,
        laneId: 'execution',
        title: 'Schedule and apply',
        ownerPackage: '@asyra/asyra-design',
        purpose: 'operation-adapter',
        inputs: [
          'artifact:tool-program',
          'artifact:prepared-artifact',
          'registered action effects',
          'registered tool-owner access declarations',
          'current canonical permissions'
        ],
        outputs: ['artifact:execution-receipt'],
        conditions: [
          'Reject duplicate Fill-row destination IDs before reads or writes; resolve each current row and apply aligned or uniform new patches in one batch; plural visibility reports ordered changed/unchanged/unavailable outcomes in one receipt',
          'Status-item receipts validate input/output alignment and emit reviewElementIds only for changed or unchanged targets without additional canonical reads',
          'Overlap only proven independent access',
          'Preserve ordered writes and read-after-write dependencies',
          'Cancelled queued work cannot write',
          'Declared return contracts preserve ordered item results; failed creations cannot be reported as complete, and void acknowledgements never assert measured mutations',
          'Compact native receipts aggregate only successful valueless basic mutations; retain query data, returned identities and uncertain results, with explicit full receipts available',
          'The App owns one lazy Factory history group per invocation. Every synchronous member publishes normally; research and waits hold no transaction or interaction lock. Admission observes the Core instance idle boundary and rechecks after settlement; user and remote edits are not enrolled. Stop/failure seals successful members, and only a nonempty own seal is correlated as AI history.',
          'Fill row patches share input data without linking ownership; distinct Fill collections may reference the same canonical child ID; share/detach reuses those relationships and ordinary Undo',
          'Stroke field batches consume new fields only, validate all targets before mutation and retain omitted fields; per-call bounds preparation is shared for repeated targets without retaining state across calls',
          'Prepared artifacts are required only for prepared operations; direct registered edits use their own admitted parameters',
          'Optional parentId attaches ready parts in parent-local coordinates to a current workspace container; canonical capability, membership and locks are rechecked at each write; compact receipts retain real part identities',
          'A browser batch rejection is acknowledged without closing the stream; runtime returns completed actions, failure stage and unknown settlement, refreshes context before later permission decisions and never replays failed batches'
        ],
        bypasses: ['Read-only requests do not mutate'],
        allowedContributors: [
          'tool scheduler',
          'tool factories and provider dispatch',
          'operation adapter',
          'registered Feature and common APIs'
        ],
        forbiddenContributors: [
          'tool-name concurrency whitelist',
          'direct renderer writes',
          'second transaction manager'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/server/local-tool-scheduler.ts',
          'apps/asyra-design/server/__tests__/local-tool-scheduler.test.ts',
          'apps/asyra-design/server/local-ai-provider.ts',
          'apps/asyra-design/server/__tests__/local-ai-provider.test.ts',
          'apps/asyra-design/server/__tests__/local-ai-live.test.ts',
          'apps/asyra-design/server/local-image-tools.ts',
          'apps/asyra-design/server/local-design-tools.ts',
          'apps/asyra-design/server/local-operation-tools.ts',
          'apps/asyra-design/server/local-operation-batch.ts',
          'apps/asyra-design/server/local-design-workflow.ts',
          'apps/asyra-design/server/__tests__/local-design-workflow.test.ts',
          'packages/ai-agent-runtime/src/provider.ts',
          'packages/ai-agent-runtime/src/runtime.ts',
          'packages/ai-agent-runtime/src/__tests__/multi-batch.test.ts',
          'apps/asyra-design/server/batch-exchange.ts',
          'apps/asyra-design/server/__tests__/batch-exchange.test.ts',
          'apps/asyra-design/src/ai/action-batch-protocol.ts',
          'apps/asyra-design/src/ai/action-failure.ts',
          'apps/asyra-design/src/ai/server-action-batch-provider.ts',
          'apps/asyra-design/src/ai/__tests__/server-action-batch-provider.test.ts',
          'apps/asyra-design/src/ai/actions.ts',
          'apps/asyra-design/src/ai/__tests__/actions.test.ts',
          'apps/asyra-design/src/ai/basic-api-actions.ts',
          'apps/asyra-design/src/ai/basic-api-results.ts',
          'apps/asyra-design/src/ai/__tests__/basic-api-actions.test.ts',
          'apps/asyra-design/src/ai/design-actions.ts',
          'apps/asyra-design/src/ai/prepared-design-admission.ts',
          'apps/asyra-design/src/ai/__tests__/design-actions.test.ts',
          'apps/asyra-design/src/ai/design-edit-action.ts',
          'apps/asyra-design/src/ai/__tests__/design-edit-action.test.ts',
          'apps/asyra-design/src/ai/organization-action.ts',
          'apps/asyra-design/src/ai/__tests__/organization-action.test.ts',
          'apps/asyra-design/src/ai/arrangement-action.ts',
          'apps/asyra-design/src/ai/__tests__/arrangement-action.test.ts',
          'apps/asyra-design/src/ai/__tests__/composition-actions.test.ts',
          'apps/asyra-design/src/ai/transaction.ts',
          'apps/asyra-design/src/ai/__tests__/transaction.test.ts',
          'apps/asyra-design/src/ai/__tests__/runtime-integration.test.ts',
          'apps/asyra-design/e2e/local-ai-provider.spec.ts',
          'apps/asyra-design/e2e/ai-conversation-flow.spec.ts',
          'apps/asyra-design/e2e/ai-inspection-evidence.spec.ts',
          'apps/asyra-design/src/common-apis/transaction.ts',
          'apps/asyra-design/src/common-apis/fills.ts',
          'apps/asyra-design/src/common-apis/gradient-handle-geometry.ts',
          'apps/asyra-design/src/features/gradient-fill-handles/feature.ts',
          'apps/asyra-design/src/features/gradient-fill-handles/__tests__/canonical-drag-history.test.ts',
          'packages/preset/src/props/components/strokes-component.ts',
          'packages/preset/src/__tests__/children-map-property-component.test.ts',
          'apps/asyra-design/src/common-apis/element/apis.ts',
          'apps/asyra-design/src/common-apis/element/__tests__/create-element.test.ts',
          'apps/asyra-design/src/common-apis/strokes.ts',
          'apps/asyra-design/src/common-apis/index.ts',
          'apps/asyra-design/src/common-apis/__tests__/strokes.test.ts',
          'apps/asyra-design/src/properties/strokes/use-stroke-interactions.ts',
          'apps/asyra-design/src/common-apis/__tests__/fills.test.ts',
          'apps/asyra-design/src/ai/basic-design-api-contracts.ts',
          'apps/asyra-design/e2e/fill-patch.spec.ts',
          'apps/asyra-design/e2e/basic-api-actions.spec.ts',
          'apps/asyra-design/e2e/fixtures/basic-api-cases.ts'
        ],
        specRefs: ['#preparation-and-execution'],
        failureOwnerStepId: 'apply'
      },
      {
        id: 'inspect',
        order: 5,
        laneId: 'execution',
        title: 'Inspect current stage',
        ownerPackage: '@asyra/asyra-design',
        purpose: 'review-coordinator',
        inputs: [
          'artifact:execution-receipt',
          'canonical change observations',
          'current rendered evidence',
          'requested requirements',
          'selected original reference attachments and fresh read-only model findings',
          'prior independent visual findings retained as revision questions, never proof',
          'evidence-backed source facts and explicit dependency changes'
        ],
        outputs: ['artifact:inspection-evidence'],
        conditions: [
          'Consume confirmed plural receipt reviewElementIds into request-owned scope, including direct edits without a prior composition; exclude unavailable targets and retain ordinary evidence requirements',
          'Expose one strict plan schema and executable guidance for standalone and composed first-write admission; allow first criteria after partial drawing while retaining the original request; lock established criteria after mutation and require current full review before approval',
          'Acknowledge plan storage with IDs and fact validity only; retain full request-local criteria and facts for review without echoing submitted narrative or implying visual acceptance',
          'Coalesce intermediate checks only within a coherent stage',
          'Route explicitly declared visual criteria to image assessment; retain data criteria in ordinary numeric/canonical review; no criterion-name heuristic or pixel proof for data; preserve explicit reference selection on partial plan resubmission',
          'At structure and final boundaries compare selected references and current images in a fresh tool-free model request without self-ratings; missing or failed findings cannot approve; revalidate canonical evidence after assessment',
          'Treat optional polish as advisory; user-requested quality and explicit acceptance govern the relevant scope, never model-authored extra requirements or reference fidelity absent a request',
          'Require whole-request visual agreement as well as named criteria; judge the user-requested style and structural relationships, retain all visible contradictions together, and resolve prior findings only with fresh evidence',
          'Return completed visual findings with their freshness or coverage failure when evidence changes during assessment; stale findings remain diagnostic only and never authorize detail or completion',
          'Expose self-contained phase schemas with only applicable inputs; retain cross-field and current-evidence checks without repairing model arguments',
          'Retain request-linked named criterion descriptions through structure and final review; bind facts and checks by criterion ID',
          'Return images and evidence without implicit subtree summaries; explicit context queries own object retrieval',
          'All implicit drawing inspections use overview; explicit regions or detail remain native-resolution',
          'Reject mixed-generation evidence and conservatively invalidate unknown effects',
          'Validate request-owned scope against current canonical containment; regrouping must neither lose scope nor accept unrelated overview targets',
          'Allow focused intermediate assessments without final approval; require all criteria and current overall/detail evidence before completion',
          'Capture source facts at first adoption; bind them to planned criteria and canonical targets, attaching known fact references to checks and requiring current target coverage',
          'Retain verified source facts with explicit source and requirement dependencies for one invocation; scoped dependency changes invalidate only affected facts; canvas evidence retains its separate current-generation checks'
        ],
        bypasses: ['Read-only advice has no drawing inspection'],
        allowedContributors: [
          'existing App inspection and measurement',
          'isolated local-provider visual assessment',
          'public Scene Tree and Props observations',
          'document load lifecycle'
        ],
        forbiddenContributors: [
          'receipt success as visual proof',
          'server-local revision as external-change proof',
          'unproven target-local cache'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/server/local-design-review.ts',
          'apps/asyra-design/server/local-visual-assessment.ts',
          'apps/asyra-design/server/local-image-tools.ts',
          'apps/asyra-design/server/__tests__/local-visual-assessment.test.ts',
          'apps/asyra-design/server/__tests__/local-visual-assessment-live.test.ts',
          'apps/asyra-design/test-data/ai-drawing/visual-assessment',
          'apps/asyra-design/server/local-design-facts.ts',
          'apps/asyra-design/server/__tests__/design-review-stages.test.ts',
          'apps/asyra-design/server/local-operation-tools.ts',
          'apps/asyra-design/src/common-apis/design-review.ts',
          'apps/asyra-design/src/common-apis/inspection.ts',
          'apps/asyra-design/src/ai/inspection.ts',
          'apps/asyra-design/src/ai/review-action.ts',
          'apps/asyra-design/src/ai/__tests__/review-action.test.ts',
          'apps/asyra-design/src/common-apis/inspection-evidence.ts',
          'apps/asyra-design/src/common-apis/__tests__/inspection-evidence.test.ts',
          'apps/asyra-design/e2e/ai-inspection-evidence.spec.ts',
          'apps/asyra-design/src/ai/inspection-evidence.ts',
          'apps/asyra-design/src/ai/__tests__/inspection.test.ts',
          'apps/asyra-design/src/ai/__tests__/runtime-input.test.ts',
          'apps/asyra-design/src/constants/ai-actions.ts',
          'apps/asyra-design/src/ai/runtime-input.ts',
          'apps/asyra-design/src/ai/action-failure.ts',
          'apps/asyra-design/src/ai/startup.ts',
          'apps/asyra-design/server/local-ai-provider.ts',
          'apps/asyra-design/server/__tests__/local-ai-provider.test.ts',
          'apps/asyra-design/server/__tests__/local-ai-live.test.ts',
          'apps/asyra-design/server/__tests__/local-operation-tools.test.ts'
        ],
        specRefs: ['#evidence-and-completion'],
        failureOwnerStepId: 'inspect'
      },
      {
        id: 'settle',
        order: 6,
        laneId: 'execution',
        title: 'Settle and explain',
        ownerPackage: '@asyra/asyra-design',
        purpose: 'conversation-lifecycle',
        inputs: [
          'artifact:inspection-evidence',
          'artifact:execution-receipt',
          'clarification or classified failure'
        ],
        outputs: ['artifact:visible-outcome'],
        conditions: [
          'Preserve successful work and intended Undo commits',
          'Questions pause a segment; answers start the next',
          'Accurately report partial work and unresolved failure',
          'Read-only answers and clarification bypass visual evidence; mutated outcomes require current review or explicit partial/failure status'
        ],
        bypasses: ['A pending question is not completed drawing work'],
        allowedContributors: [
          'provider result adapter',
          'conversation presentation'
        ],
        forbiddenContributors: [
          'raw provider dumps',
          'activity spam',
          'silent rollback of successful work'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/server/local-ai-provider.ts',
          'apps/asyra-design/src/ai/conversation.ts',
          'apps/asyra-design/src/ai/__tests__/conversation.test.ts',
          'apps/asyra-design/src/ai/presentation.ts',
          'apps/asyra-design/src/ai/__tests__/presentation.test.ts',
          'apps/asyra-design/src/ai/__tests__/document-interaction-lock.integration.test.ts'
        ],
        specRefs: ['#evidence-and-completion'],
        failureOwnerStepId: 'settle'
      },
      {
        id: 'observe',
        order: 7,
        laneId: 'execution',
        title: 'Observe execution',
        ownerPackage: '@asyra/asyra-design',
        purpose: 'trace-owner',
        inputs: [
          'observed provider lifecycle events',
          'tool queue and execution spans',
          'App tool inputs, outputs and receipt summaries',
          'saved execution records, explicit period filters and optional user feedback',
          'explicit post-run assessment request and named criteria',
          'isolated visual comparison evidence metadata and parent request identity'
        ],
        outputs: ['artifact:execution-trace'],
        conditions: [
          'Record continuous App invocation and provider delegation spans; partition child AI waits, App exchanges, tools and provider events without claiming hidden reasoning; missing historical coverage remains a recording defect',
          'Attribute observed native calls and inner App actions with actor, parent, contract identity, purpose, expectation and distinct execution/correctness evidence',
          'Retain per-call input shape and summary, explicit omissions, feedback and receipt-based output usability',
          'Use interval unions for overlapping spans',
          'Expose public native orchestration names, notification metadata and longest App-call gaps; join child assessment request, parent tool and span identities; report inclusive calls separately from exclusive ownership',
          'Retain process and matching-thread MCP startup names, states, structured failure reasons and classified warnings before inference; explicitly omit private diagnostic text',
          'Retain public native retry/error kinds, willRetry and numeric HTTP/RPC status without free text; observations never alter native retry or turn settlement',
          'Record required-stream failure and optional diagnostic-stream loss as bounded transport metadata; raw error text stays omitted and diagnostics cannot change drawing settlement',
          'Distinguish wire bytes, eager schema bytes and reported usage',
          'Persist ordered sanitized records locally; incomplete streams never imply success',
          'Retain bounded summaries and separate sanitized App tool payload snapshots locally, with digest, bytes and explicit redactions',
          'Project evidence-linked reports without certifying visuals or inferring missing facts',
          'Extract exact retained plan-echo candidates before grouping tool/phase/failure/configuration evidence for offline investigation; truncation and missing evidence remain unknown, and frequency is not root cause or model improvement'
        ],
        bypasses: ['Missing provider fields remain unavailable'],
        allowedContributors: [
          'usage instrumentation',
          'bounded receipt timings',
          'read-only record projection and separately attributed feedback',
          'isolated native provider transport for an explicit post-run assessment'
        ],
        forbiddenContributors: [
          'private reasoning inference',
          'raw prompts or credentials',
          'diagnostics controlling output',
          'App tools or web access in post-run assessment'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/e2e/local-ai-provider.spec.ts',
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/server/__tests__/local-ai-provider.test.ts',
          'apps/asyra-design/server/__tests__/local-ai-live.test.ts',
          'apps/asyra-design/server/local-ai-usage.ts',
          'apps/asyra-design/server/local-ai-records.ts',
          'apps/asyra-design/server/local-execution-timing.ts',
          'apps/asyra-design/server/local-action-observation.ts',
          'apps/asyra-design/src/ai/runtime-input.ts',
          'apps/asyra-design/src/ai/action-failure.ts',
          'apps/asyra-design/src/ai/__tests__/runtime-input.test.ts',
          'apps/asyra-design/server/__tests__/local-action-observation.test.ts',
          'apps/asyra-design/server/local-tool-payload.ts',
          'apps/asyra-design/server/local-ai-evaluation.ts',
          'apps/asyra-design/server/local-ai-assessment.ts',
          'apps/asyra-design/server/__tests__/local-ai-assessment.test.ts',
          'apps/asyra-design/server/execution-report-cli.ts',
          'apps/asyra-design/server/__tests__/execution-report-cli.test.ts',
          'apps/asyra-design/vite.execution-report.config.ts',
          'apps/asyra-design/server/__tests__/local-ai-evaluation.test.ts',
          'apps/asyra-design/server/__tests__/local-ai-records.test.ts',
          'apps/asyra-design/server/ai-model-provider.ts',
          'apps/asyra-design/server/__tests__/ai-model-provider.test.ts',
          'apps/asyra-design/server/local-ai-provider.ts'
        ],
        specRefs: [
          '#ownership-and-diagnostics',
          '#execution-recording',
          '#execution-evaluation'
        ],
        failureOwnerStepId: 'observe'
      }
    ],
    artifacts: [
      {
        id: 'artifact:request-context',
        ownerStepId: 'request',
        consumerStepIds: ['compose'],
        terminal: false,
        title: 'request context',
        channel: 'App execution',
        description:
          'Owned by request and consumed only through the declared route.'
      },
      {
        id: 'artifact:tool-program',
        ownerStepId: 'compose',
        consumerStepIds: ['prepare', 'apply'],
        terminal: false,
        title: 'tool program',
        channel: 'App execution',
        description:
          'Owned by compose and consumed only through the declared route.'
      },
      {
        id: 'artifact:prepared-artifact',
        ownerStepId: 'prepare',
        consumerStepIds: ['apply'],
        terminal: false,
        title: 'prepared artifact',
        channel: 'App execution',
        description:
          'Owned by prepare and consumed only through the declared route.'
      },
      {
        id: 'artifact:execution-receipt',
        ownerStepId: 'apply',
        consumerStepIds: ['compose', 'inspect', 'settle'],
        terminal: false,
        title: 'execution receipt',
        channel: 'App execution',
        description:
          'Owned by apply and consumed only through the declared route.'
      },
      {
        id: 'artifact:inspection-evidence',
        ownerStepId: 'inspect',
        consumerStepIds: ['compose', 'settle'],
        terminal: false,
        title: 'inspection evidence',
        channel: 'App execution',
        description:
          'Owned by inspect and consumed only through the declared route.'
      },
      {
        id: 'artifact:visible-outcome',
        ownerStepId: 'settle',
        consumerStepIds: [],
        terminal: true,
        title: 'visible outcome',
        channel: 'App execution',
        description:
          'Owned by settle and consumed only through the declared route.'
      },
      {
        id: 'artifact:execution-trace',
        ownerStepId: 'observe',
        consumerStepIds: [],
        terminal: true,
        title: 'execution trace',
        channel: 'App execution',
        description:
          'Owned by observe and consumed only through the declared route.'
      }
    ],
    routes: [
      {
        id: 'request-to-compose',
        to: 'compose',
        producedArtifacts: ['artifact:request-context'],
        predicate: 'A valid brief and current context are ready.',
        from: 'request',
        kind: 'feedback'
      },
      {
        id: 'compose-to-prepare',
        to: 'prepare',
        producedArtifacts: ['artifact:tool-program'],
        predicate: 'The selected method needs deterministic preparation.',
        from: 'compose',
        kind: 'handoff'
      },
      {
        id: 'compose-to-apply',
        to: 'apply',
        producedArtifacts: ['artifact:tool-program'],
        predicate:
          'A registered direct edit/read or admitted prepared operation is ready.',
        from: 'compose',
        kind: 'bypass'
      },
      {
        id: 'prepare-to-apply',
        to: 'apply',
        producedArtifacts: ['artifact:prepared-artifact'],
        predicate:
          'Preparation succeeds and the chosen operation consumes its handle.',
        from: 'prepare',
        kind: 'handoff'
      },
      {
        id: 'apply-to-compose',
        to: 'compose',
        producedArtifacts: ['artifact:execution-receipt'],
        predicate:
          'A receipt supplies the next decision or recoverable correction.',
        from: 'apply',
        kind: 'feedback'
      },
      {
        id: 'apply-to-inspect',
        to: 'inspect',
        producedArtifacts: ['artifact:execution-receipt'],
        predicate:
          'The coherent stage requires inspection or an explicit inspection was requested.',
        from: 'apply',
        kind: 'handoff'
      },
      {
        id: 'apply-to-settle',
        to: 'settle',
        producedArtifacts: ['artifact:execution-receipt'],
        predicate:
          'Execution failed, was cancelled, or completed a read-only request.',
        from: 'apply',
        kind: 'handoff'
      },
      {
        id: 'inspect-to-compose',
        to: 'compose',
        producedArtifacts: ['artifact:inspection-evidence'],
        predicate:
          'Requirements remain unresolved and supported correction can continue.',
        from: 'inspect',
        kind: 'feedback'
      },
      {
        id: 'inspect-to-settle',
        to: 'settle',
        producedArtifacts: ['artifact:inspection-evidence'],
        predicate:
          'Current overall evidence permits completion, or unresolved issues must be reported.',
        from: 'inspect',
        kind: 'handoff'
      },
      {
        id: 'settle-to-result',
        to: null,
        producedArtifacts: ['artifact:visible-outcome'],
        predicate:
          'Emit the independent answer, question or accurate retained-progress outcome.',
        from: 'settle',
        kind: 'handoff'
      },
      {
        id: 'observe-to-result',
        to: null,
        producedArtifacts: ['artifact:execution-trace'],
        predicate:
          'Deliver bounded diagnostic evidence without controlling product execution.',
        from: 'observe',
        kind: 'handoff'
      }
    ],
    invariants: [
      {
        id: 'canonical-ownership',
        title: 'Canonical ownership',
        stepIds: ['apply'],
        specRefs: ['#preparation-and-execution'],
        statement:
          'All mutations use registered App operations and existing transactions.',
        artifactIds: ['artifact:execution-receipt']
      }
    ],
    acceptanceContracts: []
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
