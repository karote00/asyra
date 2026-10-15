/* global module */
;(function () {
  const data = {
    schema: {
      id: 'flow-inspector',
      version: 2
    },
    target: {
      id: 'reusable-tool-composition',
      kind: 'feature',
      title: 'Reusable Tool Composition',
      subtitle: 'Typed admission to durable reuse'
    },
    authority: {
      specPath: 'packages/ai-agent-runtime/TOOL_SPECIFICATION.md',
      inspectorPath:
        'tools/flow-inspector/inspectors/reusable-tool-composition-flow-inspector.data.cjs',
      semanticOwner: '@asyra/ai-agent-runtime',
      inspectorOwner: '@asyra/ai-agent-runtime'
    },
    links: [],
    lanes: [
      {
        id: 'runtime',
        title: 'Runtime composition',
        order: 1
      }
    ],
    steps: [
      {
        id: 'admit',
        order: 1,
        laneId: 'runtime',
        title: 'Typed recipe admission',
        ownerPackage: '@asyra/ai-agent-runtime',
        purpose:
          'Prove finite typed bindings and exact eligible dependencies without executing operations.',
        inputs: [
          'artifact:saved-recipe',
          'JSON proposal',
          'current canonical dependency contracts',
          'host limits and schema validator'
        ],
        outputs: ['artifact:admitted-recipe'],
        conditions: [
          'Distinguish transient request values from request-artifact lease handles. Both forbid captured literals/defaults and require compatible typed bindings; host leases inspect only explicit artifact annotations, including nested handles. Exact dependency fingerprints reject saved recipes with superseded schemas.',

          'Prove finite typed bindings and exact eligible dependencies without executing operations.',
          'Admit optional bounded repair iteration only with owner-declared read/prepare verification paths, required typed status/progress, closed state and guaranteed final receipt. Prove every possible repair dependency and worst-case step budget; reject forward/internal-output escape and captured state before writes.',
          'Project only guaranteed registered output fields; unused opaque siblings do not invalidate known fields. Preserve open-object, union discriminator, ordered prefixItems with minItems presence, uniqueness and runtime-value constraints; reject ambiguous or opaque used bindings before writes. Intersect common object constraints and every closed property set; resolve local $defs lazily within one schema graph, preserve strict bounds and patterns, and reject uncertain recursive proofs. Undeclared fields of open registered objects require fresh typed input; they cannot hide captured literal runtime state.'
        ],
        bypasses: ['Invalid proposals return bounded repair issues.'],
        allowedContributors: [
          'canonical tool registry',
          'host-injected validators and lifecycle adapters'
        ],
        forbiddenContributors: [
          'No model-authored permission or effect overrides',
          'No arbitrary code evaluation or ID-string heuristics'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/ai-agent-runtime/src/recipe-types.ts',
          'packages/ai-agent-runtime/src/recipe-schema.ts',
          'packages/ai-agent-runtime/src/recipe-admission.ts',
          'packages/ai-agent-runtime/src/recipe-format.ts',
          'packages/ai-agent-runtime/src/tool-contract.ts',
          'packages/ai-agent-runtime/src/index.ts',
          'packages/ai-agent-runtime/src/__tests__/recipe-admission.test.ts',
          'packages/ai-agent-runtime/src/__tests__/recipe-flow.test.ts',
          'packages/ai-agent-runtime/src/__tests__/tool-contract.test.ts'
        ],
        specRefs: ['#typed-recipe-admission'],
        failureOwnerStepId: 'admit'
      },
      {
        id: 'register',
        order: 2,
        laneId: 'runtime',
        title: 'Candidate registration',
        ownerPackage: '@asyra/ai-agent-runtime',
        purpose:
          'Register immutable revisions in the same registry; expose candidates only to their owner and saved eligible entries to other requests.',
        inputs: [
          'artifact:admitted-recipe',
          'creating request identity',
          'submission identity and expected prior revision'
        ],
        outputs: ['artifact:registered-recipe'],
        conditions: [
          'Register immutable revisions in the same registry; expose candidates only to their owner and saved eligible entries to other requests.',
          'Use the canonical weighted recipe inventory to inspect all initial/check/repair dependencies and nested worst-case expansion before publication.'
        ],
        bypasses: [
          'Identical replay returns the original receipt; conflicting content does not overwrite.'
        ],
        allowedContributors: [
          'canonical tool registry',
          'host-injected validators and lifecycle adapters'
        ],
        forbiddenContributors: [
          'No second capability catalog',
          'No product execution during registration'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/ai-agent-runtime/src/action-registry.ts',
          'packages/ai-agent-runtime/src/types.ts',
          'packages/ai-agent-runtime/src/tool-library.ts',
          'packages/ai-agent-runtime/src/recipe-format.ts',
          'packages/ai-agent-runtime/src/index.ts',
          'packages/ai-agent-runtime/src/__tests__/tool-library.test.ts',
          'packages/ai-agent-runtime/src/__tests__/recipe-flow.test.ts',
          'packages/ai-agent-runtime/src/__tests__/action-registry.test.ts'
        ],
        specRefs: ['#embedded-ai-authoring-lifecycle'],
        failureOwnerStepId: 'register'
      },
      {
        id: 'invoke',
        order: 3,
        laneId: 'runtime',
        title: 'Pinned recipe invocation',
        ownerPackage: '@asyra/ai-agent-runtime',
        purpose:
          'Pin the admitted graph and invoke each node through the common middleware; host schedules only leaves. Transfer exported references before child cleanup. Supply pinned input and selected output schemas to host lease ownership; never infer references by field names.',
        inputs: [
          'artifact:registered-recipe',
          'fresh arguments and request context',
          'secured host leaf executor and artifact lease adapter'
        ],
        outputs: ['artifact:recipe-receipt'],
        conditions: [
          'The host owns aggregate mechanical verdict semantics. Consume only registered verification status/nonempty string progress and admitted finite repairs; host repair owners guard actual domain capability coverage before writes; partial results never enter success bindings. No-progress, unsupported findings and cancellation stop successors without model calls or product-write replay.',
          'Pin the admitted graph and invoke each node through the common middleware; host schedules only leaves. Transfer exported references before child cleanup. Supply pinned input and selected output schemas to host lease ownership; never infer references by field names.',
          'Execute admitted bounded repair with initial writes once, typed current state, owner check verdict and actual iteration provenance. Count nested worst-case work before writes; stop on decision, repeated progress, budget, cancellation or non-success, exporting actual validated recovery without replay or eligibility.',
          'Observe pinned tool revision and admitted parent recipe name/revision/step ID on child lifecycle events. Do not invent admitted provenance for a rejected root; diagnostic metadata does not change execution authority.',
          'Validate successful output only against outputSchema; partial uses declared partialOutputSchema or the same shape. Host outcome selects the schema; partial validation never rescues malformed success and partial results never feed successor bindings.',
          'Failed/unknown results export resources only through a validated declared recoveryOutputSchema. Preserve exact outcome and settlement; nested recovery receipts transfer pinned references before ancestor cleanup without feeding successful bindings or granting save eligibility.'
        ],
        bypasses: [
          'Cancellation or non-success settlement stops successors without replaying progress.'
        ],
        allowedContributors: [
          'canonical tool registry',
          'host-injected validators and lifecycle adapters'
        ],
        forbiddenContributors: [
          'No parent scheduler barrier',
          'No parallel mutation queue',
          'No cleanup of borrowed or sibling leases'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/ai-agent-runtime/src/recipe-execution.ts',
          'packages/ai-agent-runtime/src/recipe-format.ts',
          'packages/ai-agent-runtime/src/tool-contract.ts',
          'packages/ai-agent-runtime/src/__tests__/tool-contract.test.ts',
          'packages/ai-agent-runtime/src/recipe-types.ts',
          'packages/ai-agent-runtime/src/invocation.ts',
          'packages/ai-agent-runtime/src/index.ts',
          'packages/ai-agent-runtime/src/__tests__/recipe-execution.test.ts',
          'packages/ai-agent-runtime/src/__tests__/recipe-flow.test.ts'
        ],
        specRefs: ['#execution-variants'],
        failureOwnerStepId: 'invoke'
      },
      {
        id: 'persist',
        order: 4,
        laneId: 'runtime',
        title: 'Durable tool library',
        ownerPackage: '@asyra/ai-agent-runtime',
        purpose:
          'Save exact immutable definition and eligibility atomically; validate reload through admission and isolate corrupt entries.',
        inputs: [
          'artifact:admitted-recipe',
          'artifact:registered-recipe',
          'artifact:recipe-receipt',
          'host atomic store acknowledgement and current dependencies'
        ],
        outputs: ['artifact:saved-recipe'],
        conditions: [
          'Save exact immutable definition and eligibility atomically; validate reload through admission and isolate corrupt entries.',
          'Persist and compare the full optional iteration body with steps/output; reload and resume re-enter canonical bounded admission, and only verified success can grant eligibility. Save-only recovery never executes the graph.',
          'Host management projects compact canonical stored metadata without registration or execution. State-only suspend/retire uses the observed storage version, preserves immutable definitions and rejects stale writes; runtime availability changes only after exact durable acknowledgement.'
        ],
        bypasses: [
          'Save-only retry never repeats product work; missing evidence retains candidate state.'
        ],
        allowedContributors: [
          'canonical tool registry',
          'host-injected validators and lifecycle adapters'
        ],
        forbiddenContributors: [
          'No filesystem or network side effects at import',
          'No captured per-run values or automatic execution on reload'
        ],
        cacheDimensions: [],
        implementationBoundary: [
          'packages/ai-agent-runtime/src/tool-store.ts',
          'packages/ai-agent-runtime/src/action-registry.ts',
          'packages/ai-agent-runtime/src/types.ts',
          'packages/ai-agent-runtime/src/tool-library.ts',
          'packages/ai-agent-runtime/src/recipe-format.ts',
          'packages/ai-agent-runtime/src/index.ts',
          'packages/ai-agent-runtime/src/__tests__/tool-store.test.ts',
          'packages/ai-agent-runtime/src/__tests__/fixtures/recipe-host.ts',
          'packages/ai-agent-runtime/src/__tests__/recipe-flow.test.ts'
        ],
        specRefs: ['#what-is-saved'],
        failureOwnerStepId: 'persist'
      }
    ],
    artifacts: [
      {
        id: 'artifact:admitted-recipe',
        ownerStepId: 'admit',
        consumerStepIds: ['register', 'persist'],
        terminal: false,
        title: 'admitted-recipe',
        channel: 'Runtime',
        description:
          'Prove finite typed bindings and exact eligible dependencies without executing operations.'
      },
      {
        id: 'artifact:registered-recipe',
        ownerStepId: 'register',
        consumerStepIds: ['invoke', 'persist'],
        terminal: false,
        title: 'registered-recipe',
        channel: 'Runtime',
        description:
          'Register immutable revisions after finite graph admission; expose candidates only to their owner and saved eligible entries to other requests.'
      },
      {
        id: 'artifact:recipe-receipt',
        ownerStepId: 'invoke',
        consumerStepIds: ['persist'],
        terminal: false,
        title: 'recipe-receipt',
        channel: 'Runtime',
        description:
          'Pin the admitted graph and invoke each node through the common middleware; host schedules only leaves. Transfer exported references before child cleanup. Supply pinned input and selected output schemas to host lease ownership; never infer references by field names.'
      },
      {
        id: 'artifact:saved-recipe',
        ownerStepId: 'persist',
        consumerStepIds: ['admit'],
        terminal: false,
        title: 'saved-recipe',
        channel: 'Runtime',
        description:
          'Save exact immutable definition and eligibility atomically; validate reload through admission and isolate corrupt entries.'
      }
    ],
    routes: [
      {
        id: 'admit-to-register',
        from: 'admit',
        to: 'register',
        kind: 'handoff',
        producedArtifacts: ['artifact:admitted-recipe'],
        predicate:
          'Prove finite typed bindings and exact eligible dependencies without executing operations.'
      },
      {
        id: 'admit-to-persist',
        from: 'admit',
        to: 'persist',
        kind: 'handoff',
        producedArtifacts: ['artifact:admitted-recipe'],
        predicate:
          'Prove finite typed bindings and exact eligible dependencies without executing operations.'
      },
      {
        id: 'register-to-invoke',
        from: 'register',
        to: 'invoke',
        kind: 'handoff',
        producedArtifacts: ['artifact:registered-recipe'],
        predicate:
          'Register immutable revisions after finite graph admission; expose candidates only to their owner and saved eligible entries to other requests.'
      },
      {
        id: 'register-to-persist',
        from: 'register',
        to: 'persist',
        kind: 'handoff',
        producedArtifacts: ['artifact:registered-recipe'],
        predicate:
          'Register immutable revisions after finite graph admission; expose candidates only to their owner and saved eligible entries to other requests.'
      },
      {
        id: 'invoke-to-persist',
        from: 'invoke',
        to: 'persist',
        kind: 'handoff',
        producedArtifacts: ['artifact:recipe-receipt'],
        predicate:
          'Pin the admitted graph and invoke each node through the common middleware; host schedules only leaves. Transfer exported references before child cleanup. Supply pinned input and selected output schemas to host lease ownership; never infer references by field names.'
      },
      {
        id: 'persist-to-admit',
        from: 'persist',
        to: 'admit',
        kind: 'handoff',
        producedArtifacts: ['artifact:saved-recipe'],
        predicate:
          'Save exact immutable definition and eligibility atomically; validate reload through admission and isolate corrupt entries.'
      }
    ],
    invariants: [],
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
