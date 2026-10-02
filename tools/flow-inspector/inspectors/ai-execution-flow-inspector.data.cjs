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
          'apps/asyra-design/src/ai/runtime-input.ts',
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
          'artifact:inspection-evidence',
          'artifact:execution-receipt'
        ],
        outputs: ['artifact:tool-program'],
        conditions: [
          'Preserve all registered capabilities and exact tool identities',
          'Use native discovery and Code Mode; configured model and effort remain unchanged',
          'Initial decisions need no execution or inspection receipt; later decisions consume only receipts actually produced'
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
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/server/local-ai-provider.ts',
          'apps/asyra-design/server/__tests__/local-ai-provider.test.ts',
          'apps/asyra-design/src/ai/basic-design-api-contracts.ts',
          'apps/asyra-design/server/__tests__/basic-api-contracts.test.ts',
          'apps/asyra-design/e2e/local-ai-provider.spec.ts',
          'apps/asyra-design/server/ai-domain-prompt.ts'
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
          'No cross-request retention without measured reuse and equivalence'
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
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/server/local-design-tools.ts',
          'apps/asyra-design/server/local-image-tools.ts',
          'apps/asyra-design/server/design-preparation.ts'
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
          'Overlap only proven independent access',
          'Preserve ordered writes and read-after-write dependencies',
          'Cancelled queued work cannot write',
          'Compact native receipts aggregate only successful valueless basic mutations; retain query data, returned identities and uncertain results, with explicit full receipts available',
          'The App owns one lazy Factory history group per invocation. Every synchronous member publishes normally; research and waits hold no transaction or interaction lock. Admission observes the Core instance idle boundary and rechecks after settlement; user and remote edits are not enrolled. Stop/failure seals successful members, and only a nonempty own seal is correlated as AI history.',
          'Prepared artifacts are required only for prepared operations; direct registered edits use their own admitted parameters'
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
          'apps/asyra-design/server/local-image-tools.ts',
          'apps/asyra-design/server/local-design-tools.ts',
          'apps/asyra-design/server/local-operation-tools.ts',
          'apps/asyra-design/server/local-operation-batch.ts',
          'apps/asyra-design/server/local-design-workflow.ts',
          'apps/asyra-design/server/__tests__/local-design-workflow.test.ts',
          'apps/asyra-design/server/batch-exchange.ts',
          'apps/asyra-design/src/ai/actions.ts',
          'apps/asyra-design/src/ai/__tests__/actions.test.ts',
          'apps/asyra-design/src/ai/basic-api-actions.ts',
          'apps/asyra-design/src/ai/__tests__/basic-api-actions.test.ts',
          'apps/asyra-design/src/ai/design-actions.ts',
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
          'apps/asyra-design/e2e/ai-conversation-flow.spec.ts',
          'apps/asyra-design/e2e/ai-inspection-evidence.spec.ts',
          'apps/asyra-design/src/common-apis/transaction.ts'
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
          'requested requirements'
        ],
        outputs: ['artifact:inspection-evidence'],
        conditions: [
          'Coalesce intermediate checks only within a coherent stage',
          'Reject mixed-generation evidence and conservatively invalidate unknown effects',
          'Validate request-owned scope against current canonical containment; regrouping must neither lose scope nor accept unrelated overview targets',
          'Require final overall inspection before completion'
        ],
        bypasses: ['Read-only advice has no drawing inspection'],
        allowedContributors: [
          'existing App inspection and measurement',
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
          'apps/asyra-design/server/local-operation-tools.ts',
          'apps/asyra-design/src/common-apis/design-review.ts',
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
          'apps/asyra-design/src/ai/startup.ts',
          'apps/asyra-design/server/local-ai-provider.ts',
          'apps/asyra-design/server/__tests__/local-ai-provider.test.ts',
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
          'receipt summaries',
          'saved execution records, explicit period filters and optional user feedback'
        ],
        outputs: ['artifact:execution-trace'],
        conditions: [
          'Keep missing time unattributed',
          'Use interval unions for overlapping spans',
          'Distinguish wire bytes, eager schema bytes and reported usage',
          'Persist ordered sanitized records locally; incomplete streams never imply success',
          'Retain exact bounded query selectors and explicit truncation without raw payloads',
          'Project evidence-linked reports without certifying visuals or inferring missing facts'
        ],
        bypasses: ['Missing provider fields remain unavailable'],
        allowedContributors: [
          'usage instrumentation',
          'bounded receipt timings',
          'read-only record projection and separately attributed feedback'
        ],
        forbiddenContributors: [
          'private reasoning inference',
          'raw prompts or credentials',
          'diagnostics controlling output'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'apps/asyra-design/server/__tests__/execution-flow-proof.test.ts',
          'apps/asyra-design/server/__tests__/local-ai-provider.test.ts',
          'apps/asyra-design/server/local-ai-usage.ts',
          'apps/asyra-design/server/local-ai-records.ts',
          'apps/asyra-design/server/local-ai-evaluation.ts',
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
