const data = {
  schema: {
    id: 'flow-inspector',
    version: 2
  },
  target: {
    id: 'flow-inspector-core-proof',
    kind: 'tool',
    title: 'Flow Inspector Core Proof',
    subtitle: 'Two real Factory flows with controlled local verification'
  },
  authority: {
    specPath: 'docs/ai/tools/flow-inspector/CORE_PROOF.md',
    inspectorPath:
      'tools/flow-inspector/inspectors/flow-inspector-core-proof-flow-inspector.data.cjs',
    semanticOwner: 'Flow Inspector Core Proof',
    inspectorOwner: 'Flow Inspector Tool'
  },
  links: [
    {
      id: 'product-contract',
      kind: 'authority',
      label: 'Core Proof Contract',
      href: '../../../docs/ai/tools/flow-inspector/CORE_PROOF.md'
    },
    {
      id: 'agent-execution',
      kind: 'authority',
      label: 'Local Agent Execution',
      href: '../../../docs/ai/tools/flow-inspector/AGENT_EXECUTION.md'
    },
    {
      id: 'ci-trial-workflow',
      kind: 'source',
      label: 'CI trial workflow - not required-check enforcement',
      href: '../../../.github/workflows/main.yml'
    }
  ],
  lanes: [
    {
      id: 'proof',
      title: 'Contract and Execution',
      order: 1
    },
    {
      id: 'interaction',
      title: 'Actions and Board',
      order: 2
    }
  ],
  steps: [
    {
      id: 'assess-target-source',
      order: 17,
      laneId: 'proof',
      title: 'Assess target at one source',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Target source assessment',
      inputs: [
        'artifact:flow-target-state',
        'artifact:admitted-proof-contract',
        'artifact:proof-source-snapshot',
        'artifact:admitted-runtime-source',
        'artifact:assessed-proof-evidence',
        'trusted current accepted revision and selected target allocation revision',
        'complete service-owned proof request inventory and admitted completed records',
        'exact accepted-version and target-review verification source identities',
        'trusted current target allocation and source identity for staleness'
      ],
      outputs: ['artifact:target-source-assessment'],
      conditions: [
        'Consume the exact target history revision, frozen work coverage and admitted case-backed handoffs. Consume the complete trusted request inventory without choosing only green producers; Only identical accepted/target contract and admitted verification-source identities share observations once, with full source, runtime, configuration and request bindings intact; same-contract different verification bytes remain distinct proof roles. Consume combined source-owner verification admission without rehashing source or reports. Current identity changes only staleness and eligibility, not historical verdicts. The assessment owner provides a currentness-only projection from retained result identities, reusing exact verdict objects without walking obligations or evidence; consumers cache it at identity changes and never recompute it on reads or replay. Assess accepted preservation, bounded work and complete integration separately against one captured runtime source and each admitted verification contract. Required producers must settle; missing or contradictory identities never pass. Preserve failed obligations and pending work. Full integration grants eligibility only; source, allocation or accepted-base changes make its current use stale.'
      ],
      bypasses: [
        'Only an admitted case-backed route bypass may satisfy a handoff. Historical records without source-bound evidence remain readable but cannot grant readiness.'
      ],
      allowedContributors: [
        'trusted local service resolving retained owner artifacts',
        'source owner runtime identity',
        'proof evidence owner completed observations',
        'target owner frozen allocation and obligation coverage'
      ],
      forbiddenContributors: [
        'caller-supplied pass or source equivalence',
        'PR merge or provider status as handoff proof',
        'natural-language handoff interpretation',
        'raw source reads or raw report reassessment',
        'task execution or accepted history mutation'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/target-evidence.cjs',
        'tools/flow-inspector/control-plane/__tests__/target-evidence.test.cjs'
      ],
      specRefs: ['#target-source-assessment'],
      failureOwnerStepId: 'assess-target-source'
    },
    {
      id: 'manage-flow-target',
      order: 16,
      laneId: 'proof',
      title: 'Manage flow target and work commitments',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Flow targets and work decomposition',
      inputs: [
        'artifact:admitted-proof-contract',
        'artifact:reviewed-contract-evolution',
        'retained accepted versions and prepared evolution contracts',
        'explicit local actor decision and expected target revision',
        'artifact:agent-task-state',
        'artifact:pr-review-record',
        'retained completed baseline proof and source identity'
      ],
      outputs: ['artifact:flow-target-state', 'artifact:work-admission'],
      conditions: [
        'Bind one flow and exact target revision and accepted baseline. A new targetReviewId resolves the exact trusted reviewed candidate and verification reference once at creation; the target-owned callback context requires availability only for a new creation after replay checking, while retained loading requests metadata only and replay invokes no resolver; retain its reviewId/candidateDigest pin immutably, check that same review on load, and reject missing or conflicting identity before writes. Preserve legacy absence without new authority and never replace a pin using latest/green status. Keep acceptedBaseline mapping revision separate from an additive acceptedVersion history pin supplied by the trusted service. On new creation retain the exact version metadata at top level and in the first owner audit entry; load cross-checks both and resolves the saved revision, later actions preserve it, and replay does no lookup. Callback absence preserves unpinned standalone compatibility without assessment authority; configured invalid metadata fails closed. Never select by equal mapping revision, contract digest or latest version. Require complete assigned-or-pending coverage, exact references, disjoint responsibility and acyclic explicit handoffs. Persist immutable revisions and audit atomically under the existing store lock. Link only exact admitted task scope. Project task and PR observations separately; prerequisites remain unconfirmed and full target pending. Reserve exact task, work promise, actor and baseline source before execution; unresolved prerequisites reject. Admitted commitments cannot be removed. Validate linked task execution against retained admission; bounded candidate assessments never complete the target.'
      ],
      bypasses: [
        'Exact request replay returns the original revision without writes. Invalid, stale or conflicting decisions have no effects. No partial verification bypass or automatic acceptance.'
      ],
      allowedContributors: [
        'trusted local action service',
        'retained admitted contracts and task/review records',
        'existing exclusive store ownership'
      ],
      forbiddenContributors: [
        'candidate self-authorization',
        'PR status as prerequisite evidence',
        'client-side conformance',
        'model or remote dispatch',
        'accepted history mutation'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/flow-target.cjs',
        'tools/flow-inspector/control-plane/__tests__/flow-target.test.cjs'
      ],
      specRefs: ['#flow-targets-and-work-decomposition', '#work-admission-before-execution'],
      failureOwnerStepId: 'manage-flow-target'
    },
    {
      id: 'aggregate-workflow-results',
      order: 15,
      laneId: 'proof',
      title: 'Aggregate completed workflow results',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Observational CI aggregation',
      inputs: [
        'completed validate and Design E2E job results',
        'fixed Design Delete case inventory',
        'Playwright raw case reports',
        'GitHub repository, base, head, integration, run and attempt identity'
      ],
      outputs: ['artifact:workflow-result-summary'],
      conditions: [
        'Wait for all declared producer jobs even on failure. Validate exact case inventory, all attempt outcomes and matching execution identity. Preserve confirmed failures; missing or invalid evidence is unverified. Job success is not case evidence or accepted conformance. Preserve existing required E2E check names by forwarding only exact successful producer results; missing, failed, cancelled or skipped results cannot pass.'
      ],
      bypasses: [
        'No skipped, missing, mismatched or failed evidence becomes a pass.'
      ],
      allowedContributors: [
        'GitHub Actions job dependencies and outputs',
        'existing Playwright JSON reporter'
      ],
      forbiddenContributors: [
        'runtime source analysis',
        'candidate-selected case inventory',
        'accepted baseline mutation',
        'provider success substituted for assertions'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/workflow-results.cjs',
        'tools/flow-inspector/control-plane/__tests__/workflow-results.test.cjs',
        'tools/flow-inspector/control-plane/__tests__/board.test.cjs',
        '.github/workflows/main.yml',
        '.github/workflows/e2e.yml',
        'scripts/run-e2e.sh',
        'scripts/__tests__/workspace-automation.test.mjs'
      ],
      specRefs: ['#final-workflow-aggregation'],
      failureOwnerStepId: 'aggregate-workflow-results'
    },
    {
      id: 'prepare-pr-review',
      order: 12,
      laneId: 'interaction',
      title: 'Prepare candidate PR review',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Prepare candidate PR review',
      inputs: [
        'artifact:agent-task-state',
        'artifact:agent-candidate-verdict',
        'current accepted revision and trusted delivery policy',
        'digest-checked candidate and captured source',
        'captured package manifest and fixed Factory patch metadata policy',
        'artifact:github-review-observation'
      ],
      outputs: ['artifact:pr-review-record'],
      conditions: [
        'Admit only exact passing latest candidate source with unambiguous captured Factory ownership. Prepare one fixed patch Changeset separately from source verification; bind all metadata, source, policy and PR content to explicit actor confirmation. Persist preview and intent before effects; uncertain operations reconcile by query only; ordinary reads do no remote or source work.'
      ],
      bypasses: [
        'Disabled integration has no effects. Missing, stale, denied or uncertain inputs cannot grant success.'
      ],
      allowedContributors: [
        'trusted local action service',
        'retained task evidence',
        'fixed GitHub delivery adapter'
      ],
      forbiddenContributors: [
        'candidate execution or self-authorization',
        'PR content as permission',
        'candidate-authored metadata or arbitrary package, release type or path',
        'accepted baseline mutation',
        'raw credentials or transport errors in output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/pr-review.cjs',
        'tools/flow-inspector/control-plane/__tests__/pr-review.test.cjs'
      ],
      specRefs: [
        '../../../docs/ai/tools/flow-inspector/PR_REVIEW.md#candidate-preview'
      ],
      failureOwnerStepId: 'prepare-pr-review'
    },
    {
      id: 'deliver-github-review',
      order: 13,
      laneId: 'interaction',
      title: 'Deliver and observe GitHub review',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Deliver and observe GitHub review',
      inputs: [
        'artifact:pr-review-record',
        'trusted fixed repository and base configuration',
        'digest-checked candidate changes and baseline files',
        'completed trusted Changeset and metadata validation in the review record',
        'explicit effect checkpoint from review owner'
      ],
      outputs: ['artifact:github-review-observation'],
      conditions: [
        'Check clean checkout and exact remote base source before effects. Reject existing metadata paths, symlink ancestors and conflicting package ownership. Only confirmed frozen source and validated Changeset bytes may create a new branch and ready-for-review PR. Read current PR and HEAD-bound checks; unknown transport effects never become failure proof or authorize blind retry.'
      ],
      bypasses: [
        'Disabled integration has no effects. Missing, stale, denied or uncertain inputs cannot grant success.'
      ],
      allowedContributors: [
        'trusted local action service',
        'retained task evidence',
        'fixed GitHub delivery adapter'
      ],
      forbiddenContributors: [
        'candidate execution or self-authorization',
        'PR content as permission',
        'candidate-authored metadata or arbitrary package, release type or path',
        'accepted baseline mutation',
        'raw credentials or transport errors in output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/github-delivery.cjs',
        'tools/flow-inspector/control-plane/__tests__/github-delivery.test.cjs'
      ],
      specRefs: [
        '../../../docs/ai/tools/flow-inspector/PR_REVIEW.md#confirmed-delivery'
      ],
      failureOwnerStepId: 'deliver-github-review'
    },
    {
      id: 'admit-agent-task',
      order: 9,
      laneId: 'proof',
      title: 'Admit bounded agent task',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Task admission',
      inputs: [
        'artifact:admitted-proof-contract',
        'human task request and accepted revision',
        'trusted non-secret provider authorization when selecting a real adapter',
        'declared source snapshot',
        'artifact:work-admission'
      ],
      outputs: ['artifact:admitted-agent-task'],
      conditions: [
        'Reject unknown capabilities, hard token claims, non-runtime scope and incomplete owner contracts before effects. Bind exact step, actor, source, budgets and required retained obligations. Real provider admission requires matching service-owned authorization, exact model, billing mode, expiry and request ceiling; caller or model data cannot authorize itself.'
      ],
      bypasses: [
        'Unlinked legacy tasks require no work admission. A reserved or linked task cannot bypass the source-bound work admission. No unknown, stale, denied or missing input may become success.'
      ],
      allowedContributors: [
        'trusted action service',
        'registered broker adapter',
        'admitted immutable source and contracts'
      ],
      forbiddenContributors: [
        'agent self-authorization',
        'ambient secrets',
        'unregistered tools',
        'candidate-selected verifier or accepted baseline'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/agent-contract.cjs',
        'tools/flow-inspector/control-plane/__tests__/agent-contract.test.cjs'
      ],
      specRefs: [
        '../../../docs/ai/tools/flow-inspector/AGENT_EXECUTION.md#task-admission'
      ],
      failureOwnerStepId: 'admit-agent-task'
    },
    {
      id: 'execute-agent-task',
      order: 10,
      laneId: 'proof',
      title: 'Execute bounded agent task',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Controlled execution',
      inputs: [
        'artifact:admitted-agent-task',
        'registered adapter operation data',
        'trusted provider transport settlement and usage observations',
        'human stop, cancel, resume, revoke or handoff request',
        'artifact:agent-candidate-verdict',
        'artifact:assessed-proof-evidence',
        'artifact:work-admission',
        'source-owned retained snapshot byte verification and direct evidence admission for the fixed retained attempt'
      ],
      outputs: ['artifact:agent-task-state', 'artifact:agent-candidate-source'],
      conditions: [
        'New task records use format 2; load only formats 1 and 2. Format-2 passing latest verdicts require all three exact source descriptors even when all are missing; format-1 descriptor presence also uses new admission, while true historical absence retains its previous validation. Upgrade a format-1 task only when an explicit new candidate proof completes and is saved, preserving older attempts. New admission requires fixed last-attempt UUID source/report locations, baseline/full/configuration binding, actual retained bytes verified once by the source owner and one direct evidence admission with trusted context. Reads and identical replay do no source work.',
        'Broker operations before effects; persist cumulative budgets and audit with task state. Reserve adapter turns before dispatch against the authorization lifetime; internal HTTP retries remain unmeasured and are not a supported hard limit; retain unknown usage and unresolved remote requests across cancellation and restart and block replay until trusted reconciliation. Preserve partial source and history across cancellation and restart. Finish requires actual source progress; candidate verdict never authorizes baseline acceptance. Consume the target owner admission check before capture, after capture, and on resume before any operation or provider reservation.'
      ],
      bypasses: [
        'No unknown, stale, denied or missing input may become success.'
      ],
      allowedContributors: [
        'trusted action service',
        'registered broker adapter',
        'admitted immutable source and contracts'
      ],
      forbiddenContributors: [
        'agent self-authorization',
        'ambient secrets',
        'unregistered tools',
        'candidate-selected verifier or accepted baseline'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/agent-task.cjs',
        'tools/flow-inspector/control-plane/agent-adapter.cjs',
        'tools/flow-inspector/control-plane/agent-provider.cjs',
        'tools/flow-inspector/control-plane/agent-transport.cjs',
        'tools/flow-inspector/control-plane/__tests__/agent-provider.test.cjs',
        'tools/flow-inspector/control-plane/__tests__/agent-transport.test.cjs',
        'tools/flow-inspector/control-plane/__tests__/agent-task.test.cjs'
      ],
      specRefs: [
        '../../../docs/ai/tools/flow-inspector/AGENT_EXECUTION.md#controlled-execution',
        '../../../docs/ai/tools/flow-inspector/AGENT_EXECUTION.md#retained-candidate-admission'
      ],
      failureOwnerStepId: 'execute-agent-task'
    },
    {
      id: 'verify-agent-candidate',
      order: 11,
      laneId: 'proof',
      title: 'Verify isolated candidate',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Candidate verification',
      inputs: [
        'artifact:agent-candidate-source',
        'artifact:admitted-agent-task',
        'artifact:proof-source-snapshot',
        'artifact:assessed-proof-evidence',
        'source-owned fixed derived files and execution descriptor for the trusted candidate attempt',
        'abort signal and remaining deadline'
      ],
      outputs: ['artifact:agent-candidate-verdict'],
      conditions: [
        'Freeze candidate source; execute every retained obligation inside enforced OS containment using trusted captured assertions and existing evidence owner. Recheck source integrity after settlement; unknown containment refuses execution.',
        'Match the full captured baseline manifest and contract identities before new candidate production. Preserve present verification identity; only genuine historical absence permits constructing this new proof descriptor from verified captured role bytes. Write source-owned fixed generated files, execute their actual configuration and bootstrap, and pass the complete candidate snapshot plus trusted context to one direct evidence admission. Retain all three source descriptors in the verdict without granting historical replay authority.'
      ],
      bypasses: [
        'No unknown, stale, denied or missing input may become success.'
      ],
      allowedContributors: [
        'trusted action service',
        'registered broker adapter',
        'admitted immutable source and contracts'
      ],
      forbiddenContributors: [
        'agent self-authorization',
        'ambient secrets',
        'unregistered tools',
        'candidate-selected verifier or accepted baseline'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/agent-verifier.cjs',
        'tools/flow-inspector/control-plane/__tests__/agent-verifier.test.cjs'
      ],
      specRefs: [
        '../../../docs/ai/tools/flow-inspector/AGENT_EXECUTION.md#candidate-verification',
        '#derived-execution-source',
        '#direct-derived-evidence-admission'
      ],
      failureOwnerStepId: 'verify-agent-candidate'
    },

    {
      id: 'review-contract-evolution',
      order: 0,
      laneId: 'proof',
      title: 'Review contract evolution',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Contract evolution',
      inputs: [
        'accepted version history',
        'artifact:admitted-verification-source',
        'admitted candidate contract',
        'observed selector identities and source digests',
        'explicit successor relations and retirement request',
        'actor capability and exact-base decision'
      ],
      outputs: ['artifact:reviewed-contract-evolution'],
      conditions: [
        'Compare stable obligations and source observations once per requested review; preserve immutable accepted versions. Accept only exact current base and candidate inputs with authorized reason; removal requires separately authorized explicit retirement. Missing selectors and unknown evidence remain unresolved. When a service-admitted verification reference is supplied, bind its exact source tuple, descriptor and execution configuration into review and immutable history without source reads or revalidation. Expose verification-content changes, forbid accepting removal of existing verification authority, and preserve legacy absence without granting new authority.'
      ],
      bypasses: [
        'No implicit retirement, heuristic acceptance, or preserved green evidence after revision.'
      ],
      allowedContributors: [
        'admitted contracts',
        'registered selector observations',
        'explicit actor decision'
      ],
      forbiddenContributors: [
        'provider green status',
        'client-side acceptance',
        'candidate self-authorization'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/evolution.cjs',
        'tools/flow-inspector/control-plane/__tests__/evolution.test.cjs'
      ],
      specRefs: ['#contract-evolution', '#version-verification-references'],
      failureOwnerStepId: 'review-contract-evolution'
    },
    {
      id: 'admit-proof-contract',
      order: 1,
      laneId: 'proof',
      title: 'Admit proof contract',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Admission',
      inputs: [
        'product-owned proof manifest',
        'target architecture Inspector',
        'accepted mapping for explicit candidate comparison'
      ],
      outputs: ['artifact:admitted-proof-contract'],
      conditions: [
        'Retain a detached immutable architecture definition with each admitted contract for exact historical reconstruction. Every required case resolves to a concrete selected step; all incoming artifact routes have explicit, case-backed required or bypassed decisions. Producers, consumers, predicates, and external inputs resolve without contradictory ownership.'
      ],
      bypasses: [
        'No missing, ambiguous, empty, or contradictory contract may be bypassed.'
      ],
      allowedContributors: [
        'packages/factory/flow-contracts.json',
        'tools/flow-inspector/inspectors/transaction-flow-inspector.data.cjs'
      ],
      forbiddenContributors: [
        'runtime result guessing',
        'UI-authored step semantics'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'packages/factory/flow-contracts.json',
        'tools/flow-inspector/control-plane/contracts.cjs',
        'tools/flow-inspector/control-plane/__tests__/contracts.test.cjs'
      ],
      specRefs: ['#admission'],
      failureOwnerStepId: 'admit-proof-contract'
    },
    {
      id: 'ingest-ci-evidence',
      order: 8,
      laneId: 'proof',
      title: 'Ingest CI evidence',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Accepted-base CI',
      inputs: [
        'independently selected accepted contract and gate policy',
        'admitted integration contract',
        'trusted expected repository/source/base/head/integration identity',
        'CI attempt envelope and raw report'
      ],
      outputs: ['artifact:ci-aggregate-evidence'],
      conditions: [
        'Check complete supported obligation inventory, exact source and integration provenance, raw case outcomes and artifact fingerprint; retain both confirmed assertion failures and delivery blockers.'
      ],
      bypasses: [
        'Missing protection is an explicit delivery blocker; provider green never substitutes for case evidence.'
      ],
      allowedContributors: [
        'accepted-base policy',
        'assess-proof-evidence raw report assessor',
        'registered CI transport'
      ],
      forbiddenContributors: [
        'candidate-selected trust base',
        'provider summary as verification',
        'candidate gate-policy authorization'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/ci-evidence.cjs',
        'tools/flow-inspector/control-plane/__tests__/ci-evidence.test.cjs'
      ],
      specRefs: ['#accepted-base-ci'],
      failureOwnerStepId: 'ingest-ci-evidence'
    },
    {
      id: 'capture-proof-source',
      order: 2,
      laneId: 'proof',
      title: 'Capture proof source',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Source and Evidence',
      inputs: [
        'artifact:admitted-proof-contract',
        'artifact:admitted-runtime-source',
        'authorized run identity',
        'complete retained snapshot manifest and task-owned fixed canonical source location for read-only byte verification',
        'declared source roots and dependency metadata',
        'completed source-owned verification descriptor and trusted canonical candidate attempt source location for fixed derived execution generation/admission',
        'server-selected accepted Git base and integration revision'
      ],
      outputs: ['artifact:proof-source-snapshot'],
      conditions: [
        'Explicit derived composition alone may select a previously full-source-admitted derived runtime tuple; a candidate verdict or client path cannot replace that authority. Both APIs require the exact ordinary verification bundle and reject its execution descriptor presence. Ordinary composition also rejects runtime execution descriptor presence. Recheck selected actual bytes once, generate the fixed two files at the new trusted root with reused entry metadata, preserve runtime/verifier identities and bind a new execution/full identity. Keep all immutable output/alias guards; downstream candidate execution must use containment, and service handoff remains a separate prerequisite.',
        'For retained candidate admission, verify every actual full-manifest entry once through the source-owned safe path, regular file, size and hash boundary at its trusted fixed source root. Write nothing and return no identity or authority flag; descriptor/full-inventory admission remains a separate single direct evidence operation in the same startup lifetime, with neither operation repeated by reads or replay.',
        'For the fixed contained-native-typescript-v1 derived execution policy, generate the exact configuration/bootstrap bytes and canonical executionSource identity from the original admitted verification descriptor and trusted attempt source location. Construction alone grants no authority. A present descriptor requires one shared full/runtime/verification admission plus exact fixed-byte/full-inventory/configuration binding, with the location supplied separately by its trusted owner; never trust a saved sourceRoot or caller-selected policy, paths or contents. Missing, changed, extra, unsupported or overlapping inputs fail closed. Historical absence is not upgraded, ordinary composition remains restricted, and actual runner/containment use must be proved by later producer consumers.',
        'Before an ordinary verification reference handoff, the source owner may validate its already admitted retained runtime and exact five-role bytes through a read-only operation. Require the same canonical repository/attempt/source tree and configuration authority; read each entry once, write nothing, and return no new source identity or persistent verified status. Later composition must still validate the bytes it actually uses.',
        'For explicit ordinary composition, consume two already admitted service-owned source artifacts and their fixed retained attempt trees in the same repository. Require exact verification contract and configuration authority, read and verify each selected runtime or verification entry once, and produce a complete immutable snapshot preserving selected runtime HEAD/digest and chosen verification digest with a new full identity. Undeclared generated execution closure, missing or changed bytes, unsafe paths and cross-repository inputs fail before runner dispatch. This later composition route does not gate initial capture or its admission.',
        'Read accepted-base contract and protected gate inputs once for CI admission; compare captured integration bytes with Git identity and preserve explicit policy drift blockers. Copy regular source files once into one attempt-owned tree, retain the immutable file manifest, bind source, mapping, architecture, configuration and lockfile digests, and reject symlinks. For target assessment, also identify the captured runtime file inventory independently of the admitted verification metadata; preserve full snapshot identity and never infer equivalence by stripping historical digests. Construct a frozen verificationSource descriptor for the admitted contract’s exact five metadata roles from captured entries, with no extra reads; validate both source descriptors against the complete full manifest. Descriptor presence alone does not prove retained bytes, replay readiness or accepted-version authority.'
      ],
      bypasses: [
        'No previous snapshot or mutable checkout may replace the captured runtime source.'
      ],
      allowedContributors: [
        'trusted candidate/service owner supplying completed source artifacts and a canonical attempt location',
        'filesystem reads inside declared repository roots'
      ],
      forbiddenContributors: ['arbitrary paths', 'ambient secret files'],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/snapshot.cjs',
        'tools/flow-inspector/control-plane/__tests__/snapshot.test.cjs',
        'tools/flow-inspector/control-plane/ci-context.cjs',
        'tools/flow-inspector/control-plane/__tests__/ci-context.test.cjs'
      ],
      specRefs: ['#source-and-evidence', '#runtime-identity-producer-contract', '#frozen-verification-source', '#derived-execution-source', '#retained-snapshot-byte-verification', '#derived-source-composition'],
      failureOwnerStepId: 'capture-proof-source'
    },
    {
      id: 'execute-proof-run',
      order: 3,
      laneId: 'proof',
      title: 'Execute proof run',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Controlled Actions and Retention',
      inputs: [
        'artifact:proof-source-snapshot',
        'registered scenario',
        'deadline and cancellation signal'
      ],
      outputs: ['artifact:proof-runner-result'],
      conditions: [
        'Run one registered Vitest process group against captured source; await settlement on success, error, deadline, or cancellation. Bind the source owner runtime digest into runner identity without recomputing it, alongside the existing full verification identity.'
      ],
      bypasses: [
        'Denied requests never reach execution; a process failure produces a non-passing runner result.'
      ],
      allowedContributors: [
        'installed Vitest',
        'product-owned Factory proof tests and negative transform'
      ],
      forbiddenContributors: [
        'shell command input',
        'source writes outside the attempt directory',
        'unbounded output'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'packages/factory/src/__tests__/flow-proof.config.ts',
        'tools/flow-inspector/control-plane/runner.cjs',
        'tools/flow-inspector/control-plane/__tests__/runner.test.cjs'
      ],
      specRefs: ['#controlled-actions-and-retention', '#runtime-identity-producer-contract'],
      failureOwnerStepId: 'execute-proof-run'
    },
    {
      id: 'assess-proof-evidence',
      order: 4,
      laneId: 'proof',
      title: 'Assess proof evidence',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Source and Evidence',
      inputs: [
        'artifact:admitted-proof-contract',
        'artifact:proof-source-snapshot',
        'artifact:proof-runner-result',
        'artifact:admitted-runtime-source',
        'trusted candidate-owned canonical execution context for direct derived snapshots'
      ],
      outputs: ['artifact:assessed-proof-evidence'],
      conditions: [
        'Exactly one passing observation per required case, successful exit, and no runner errors are necessary for pass; preserve observed step failures and verify source, contract, mapping, architecture, scenario, configuration, runner environment, and report identity. Retained current-contract evidence must preserve that inventory and version identity before admission. For target evidence, validate and retain the runner runtime digest against its source owner snapshot; missing or mismatched runtime provenance never grants target eligibility, while unchanged historical standalone proof remains readable.',
        'Any own executionSource field requires exactly one direct source-owner combined admission with a trusted execution context, even when runtime identity is missing. Reuse its runtime descriptor for evidence comparisons. Missing context or invalid closure is non-pass; runtime-only service artifacts cannot admit derived execution, and retained derived admission remains unavailable without its declared trusted location handoff.'
      ],
      bypasses: [
        'Missing or invalid reports produce an explicit non-pass, never inferred completion.'
      ],
      allowedContributors: [
        'validated Vitest JSON result',
        'source owner validation of a complete captured manifest',
        'service-retained full-source-bound admission'
      ],
      forbiddenContributors: [
        'test-file existence as behavioral evidence',
        'exit code alone'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/evidence.cjs',
        'tools/flow-inspector/control-plane/__tests__/evidence.test.cjs'
      ],
      specRefs: ['#source-and-evidence', '#runtime-identity-producer-contract', '#frozen-verification-source', '#direct-derived-evidence-admission'],
      failureOwnerStepId: 'assess-proof-evidence'
    },
    {
      id: 'serve-proof-actions',
      order: 5,
      laneId: 'interaction',
      title: 'Serve proof actions',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Controlled Actions and Retention',
      inputs: [
        'artifact:admitted-proof-contract',
        'artifact:assessed-proof-evidence',
        'artifact:proof-source-snapshot',
        'registered local request',
        'attempt store',
        'existing static workspace and catalog-declared local resources',
        'artifact:reviewed-contract-evolution',
        'artifact:ci-aggregate-evidence',
        'artifact:agent-task-state',
        'artifact:pr-review-record',
        'artifact:flow-target-state',
        'artifact:target-source-assessment',
        'server-selected accepted Git base'
      ],
      outputs: ['artifact:proof-board-state', 'artifact:admitted-runtime-source', 'artifact:admitted-verification-source'],
      conditions: [
        'Register a complete immutable target-assessment producer inventory before dispatch, resolving both exact role references independently and sharing only identical ordinary verification identities. Hold one private orchestration lifetime, preserve every slot and confirmed observation through cancellation or interruption, and never auto-resume on startup. Consume assessed results only after registration or producer settlement; they are never an initial source-admission prerequisite. Retain historical verdicts and cache currentness-only projections at actual owner identity changes, with no computation on reads or replay.',
        'Explicit target-proof production selects an exact target allocation, accepted-version or target-review reference and service-owned runtime attempt. Compose ordinary frozen bytes through the source owner and consume the selected contract through the existing runner and evidence lifecycle. Exact request replay precedes idle and availability checks; new unavailable authority has no attempt side effects, and admitted failures, cancellation and restart interruption never auto-retry. This mode cannot become ordinary accepted conformance or candidate version preparation. Assessment inventory and eligibility remain separate consumers.',
        'Admit retained review metadata once through the version owner against its exact immutable history prefix and compare every owner field before supplying a target callback pair. Keep metadata integrity separate from retained-byte availability: historical pins remain readable, while new pinned target creation requires the exact reference to be available. Public review candidateDigest remains the version-owned fingerprint, with contract identity projected separately. No latest-review substitution or read-time re-admission is permitted.',
        'Source-aware version preparation uses that attempt’s retained contract, test-role identity and registered report. Verify retained bytes once at first reference handoff per attempt/service lifetime, bind the exact tuple privately, and re-admit retained references once on startup. Missing source-tree bytes preserve history but forbid new handoffs; reference presence alone is not availability. Review replay requires the version owner’s full current-base/candidate/relations identity and does not repeat source or report IO. Legacy preparation cannot acquire reference authority.',
        'New attempts retain the exact server-admitted sourceContract definitions. Restore them through the contract owner on restart and bind attempt and snapshot contract, mapping and architecture identities. Present malformed or conflicting sourceContract rejects admission; historical absence remains runtime-only and grants no verification authority. Paired new verification descriptors use one combined source-owner manifest admission; retain the verification descriptor and execution configuration in the same immutable attempt artifact. Reads and replay do not repeat it. Descriptor admission alone does not prove retained source-tree bytes or enable composition.',
        'Before supplying a verification reference to the version owner, resolve and admit that attempt’s source descriptor and actual execution configuration within this repository. Retain the exact reference and immutable bytes; absent historical descriptors grant no new verification authority. This source admission is independent of version acceptance and does not imply target eligibility.',
        'Before runner dispatch or evidence assessment, admit runtime sources through the source owner once per attempt and immutable source identity using only the trusted attempt and captured source. Completed evidence is a later persistence/projection input, never a source admission prerequisite. Live capture uses its complete manifest without IO; restart reads the bounded server-owned attempt manifest once. Retain the full-source-bound admission for evidence consumers; failed or changed identities cannot reuse it. Legacy absence grants no runtime identity and reads or request replay never redo admission.',
        'Keep reported step work completion independent from execution, verification and delivery. Separate candidate verification from accepted conformance, persist version decisions and accepted mapping atomically, admit CI results against a server-selected base, and produce baseline-bound read-only manager snapshots only at state changes. Authorize before work, admit ordinary conformance runs against the explicitly accepted mapping, durably record state with audit, and expose immutable snapshot-bound evidence; restart interrupts incomplete attempts. Mapping prepare and decide actions bind the exact base revision and candidate digest, preserve all obligations, and atomically retain the decision with the accepted mapping. Duplicate request identities do not repeat execution; repeated reads consume already admitted evidence.',
        'Expose registered target-assessment list/detail/start/cancel through the existing loopback request and capability boundary and matching local/remote CLI adapters; CLI start waits for settlement before closing its local service, and reports eligibility separately from successful inspection/control, consuming service-retained results without transport-side assessment or private producer dispatch. Serve allowlisted existing workspace assets and compose the proof adapter into target documents; preserve static paths, target routing, and same-origin isolation. Serve Overview at root and catalog-slug pages with an explicit path-routing marker and workspace asset base; unknown public paths return a 404 route error without a selected target. Catalog-declared standalone HTML paths redirect to their exact short workspace target, and declared documentation/source links remain readable in a separate tab.'
      ],
      bypasses: [
        'Unauthorized, conflicting, oversized, malformed, or unknown actions have no runner side effects.'
      ],
      allowedContributors: [
        'local CLI',
        'loopback HTTP capability',
        'atomic filesystem attempt records',
        'generated workspace bundle and its declared local documentation/source links'
      ],
      forbiddenContributors: [
        'unregistered external delivery mutations',
        'arbitrary commands',
        'implicit current-source or deployment claims'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/service.cjs',
        'tools/flow-inspector/control-plane/store.cjs',
        'tools/flow-inspector/control-plane/server.cjs',
        'tools/flow-inspector/control-plane/cli.cjs',
        '.github/workflows/main.yml',
        'tools/flow-inspector/control-plane/__tests__/service.test.cjs',
        'tools/flow-inspector/control-plane/__tests__/operations.test.cjs',
        'tools/flow-inspector/control-plane/__tests__/mapping.test.cjs',
        'tools/flow-inspector/control-plane/__tests__/cli.test.cjs',
        'tools/flow-inspector/control-plane/__tests__/store.test.cjs',
        'tools/flow-inspector/control-plane/__tests__/server.test.cjs'
      ],
      specRefs: [
        '#controlled-actions-and-retention',
        '#source-admission-in-the-local-service',
        '#frozen-target-proof-production',
        '#retained-target-assessment-requests',
        '#target-assessment-http-transport',
        '#target-assessment-cli-transport',
        '#board',
        '#flow-targets-and-work-decomposition',
        '../../../docs/ai/tools/flow-inspector/PR_REVIEW.md#confirmed-delivery'
      ],
      failureOwnerStepId: 'serve-proof-actions'
    },
    {
      id: 'render-proof-board',
      order: 6,
      laneId: 'interaction',
      title: 'Render proof board',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Board',
      inputs: [
        'artifact:proof-board-state',
        'existing workspace canvas DOM and selected architecture target',
        'user-selected flow and scenario',
        'explicit user-selected retained review and source attempt; cached assessment records and projections supplied by the action service'
      ],
      outputs: ['artifact:proof-board-view'],
      conditions: [
        'Project retained assessment history, immutable target/accepted version pins, separate accepted/work-prerequisite/integration results, progress, blockers and currentness from the service. New target creation passes only an explicitly selected review id; new assessment passes the saved allocation and explicitly selected source attempt. Refresh never selects source or review authority. Legacy absence remains unavailable, errors stay visible, and eligibility never accepts history. Poll through producer gaps without reassessment or redundant detail reads; preserve unchanged work controls, drafts, focus and canvas state.',
        'Prepare target work through an explicit source-bound admission before filling the task form. Project pending reservations and bounded assessments without replacing work controls on task updates; unknown prerequisites cannot launch work.',
        'Preserve the existing canvas cards, routes, geometry, controls, and details; project exact selected-flow results and actions into that surface without replacing the graph.',
        'On a newly selected failed attempt, select the first failing flow if the current flow has no failures; request viewer-owned framing of that flow’s failed step IDs once per changed result; preserve subsequent manual selection, pan and zoom on unchanged refresh. Success and unknown results do not move the viewport. Show a persistent run-level failure alert with named owner navigation and geometry-preserving failed card highlights; clear them on recovery.',
        'Bind cards only after graph DOM replacement; unchanged polling rebuilds neither graph nor bindings and performs no source capture. Target retirement disconnects observers and aborts reads.',
        'Project explicit work reports separately from verification and delivery. Project candidate verification, exact version review with retirement, all-flow CI blockers and artifacts, retry, and baseline/time-labeled shared viewing through the same action service. Show every registered negative scenario, snapshot and version identity, runner environment, named artifact links, and retained attempts; unsupported targets and untested steps receive no successful evidence. Prepare and decide mapping reviews through the action service with an explicit reason; never accept mapping changes in the client.',
        'Project the selected task/attempt complete delivery preview with source evidence and trusted Changeset content/reason separately, exact confirmation, audit and GitHub HEAD-bound observations through the common action service. Never combine local verification with remote checks or accept baseline from a PR.',
        'Loaded canvas step contracts must match admitted verification steps before projecting evidence or enabling launch.'
      ],
      bypasses: [
        'Untested or failed data never renders as passed; absent data shows an error or unknown state.'
      ],
      allowedContributors: [
        'same-origin proof HTTP API',
        'existing static workspace and native browser DOM'
      ],
      forbiddenContributors: [
        'static architecture data or renderer mutation',
        'duplicate canvas model or replacement dashboard',
        'client-side conformance decisions'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/public/board.js',
        'tools/flow-inspector/control-plane/public/board.css',
        'tools/flow-inspector/control-plane/__tests__/board.test.cjs'
      ],
      specRefs: [
        '#board',
        '#target-assessment-board-consumer',
        '#flow-targets-and-work-decomposition',
        '../../../docs/ai/tools/flow-inspector/PR_REVIEW.md#review-observations'
      ],
      failureOwnerStepId: 'render-proof-board'
    }
  ],
  routes: [
    { id: 'reviewed-version-to-target-pin', from: 'review-contract-evolution', to: 'manage-flow-target', kind: 'conditional', predicate: 'A new target explicitly selects an exact version-owner-admitted review and an available verification reference; the trusted service supplies the immutable review/candidate pair, and the target pins its version-owned digest without rehashing. The target callback requests requireAvailable only for a new creation after exact replay checking; retained loading requests metadata only, and replay does not invoke the resolver.', producedArtifacts: ['artifact:reviewed-contract-evolution'] },
    { id: 'verification-admission-to-version', from: 'serve-proof-actions', to: 'review-contract-evolution', kind: 'conditional', predicate: 'A version review supplies a verification reference only after the service binds its own attempt, admitted source descriptor and execution configuration; historical absence cannot be promoted.', producedArtifacts: ['artifact:admitted-verification-source'] },
    { id: 'source-snapshot-to-service-admission', from: 'capture-proof-source', to: 'serve-proof-actions', kind: 'required', predicate: 'Before runner dispatch or evidence assessment, a trusted service-owned attempt captures or restores source with a runtime identity; no completed evidence is required.', producedArtifacts: ['artifact:proof-source-snapshot'] },
    { id: 'runtime-admission-to-composition', from: 'serve-proof-actions', to: 'capture-proof-source', kind: 'conditional', predicate: 'Only an explicit later composition consumes previously completed source admissions and fixed retained trees for its selected runtime and exact verification bundle; initial capture and admission never depend on composition or assessed evidence.', producedArtifacts: ['artifact:admitted-runtime-source'] },
    { id: 'source-derived-generation-to-candidate', from: 'capture-proof-source', to: 'verify-agent-candidate', kind: 'conditional', predicate: 'During explicit new candidate verification, source-owned construction supplies the fixed generated bytes and execution descriptor before runner dispatch; construction does not claim completed evidence or retained replayability.', producedArtifacts: ['artifact:proof-source-snapshot'] },
    { id: 'derived-evidence-to-candidate', from: 'assess-proof-evidence', to: 'verify-agent-candidate', kind: 'conditional', predicate: 'After actual runner settlement and before candidate verdict completion, direct evidence returns with one combined source admission using the candidate-owned trusted location parameter; no completed candidate verdict is a prerequisite.', producedArtifacts: ['artifact:assessed-proof-evidence'] },
    { id: 'retained-evidence-to-task', from: 'assess-proof-evidence', to: 'execute-agent-task', kind: 'conditional', predicate: 'At startup after the retained verdict and actual candidate bytes are available, return exact re-admitted evidence before publishing task needs-review; no completed task projection is a prerequisite.', producedArtifacts: ['artifact:assessed-proof-evidence'] },
    { id: 'runtime-admission-to-evidence', from: 'serve-proof-actions', to: 'assess-proof-evidence', kind: 'conditional', predicate: 'After source admission and before raw or retained evidence assessment, service-owned evidence consumes its full-source admission; direct full snapshots use source-owner admission and historical absence grants no runtime conformance.', producedArtifacts: ['artifact:admitted-runtime-source'] },
    { id: 'runtime-admission-to-target-assessment', from: 'serve-proof-actions', to: 'assess-target-source', kind: 'required', predicate: 'An explicit target assessment selects the service-owned admitted source and complete retained proof requests; source admission has completed independently of assessment.', producedArtifacts: ['artifact:admitted-runtime-source'] },
    { id: 'target-state-to-assessment', from: 'manage-flow-target', to: 'assess-target-source', kind: 'required', predicate: 'An explicit assessment selects a frozen target allocation.', producedArtifacts: ['artifact:flow-target-state'] },
    { id: 'target-contract-to-assessment', from: 'admit-proof-contract', to: 'assess-target-source', kind: 'required', predicate: 'Accepted and target verification contracts are admitted for the selected assessment.', producedArtifacts: ['artifact:admitted-proof-contract'] },
    { id: 'target-source-to-assessment', from: 'capture-proof-source', to: 'assess-target-source', kind: 'required', predicate: 'The source owner supplies one immutable runtime identity for all participating proofs.', producedArtifacts: ['artifact:proof-source-snapshot'] },
    { id: 'target-evidence-to-assessment', from: 'assess-proof-evidence', to: 'assess-target-source', kind: 'conditional', predicate: 'Consume completed source-bound observations only when they exist; the complete registered request inventory represents missing or unsettled slots as unknown and permits initial assessment before any observation exists.', producedArtifacts: ['artifact:assessed-proof-evidence'] },
    { id: 'target-assessment-result', from: 'assess-target-source', to: 'serve-proof-actions', kind: 'conditional', predicate: 'Only after complete request registration or a producer settlement, the service retains the separated assessment result without baseline mutation; this result never gates initial source admission or producer registration.', producedArtifacts: ['artifact:target-source-assessment'] },
    { id: 'work-admission-to-task', from: 'manage-flow-target', to: 'admit-agent-task', kind: 'required', predicate: 'Task references an admitted work commitment', producedArtifacts: ['artifact:work-admission'] },
    { id: 'work-admission-to-execution', from: 'manage-flow-target', to: 'execute-agent-task', kind: 'required', predicate: 'Start or resume a task associated with target work', producedArtifacts: ['artifact:work-admission'] },
    {
      id: 'admit-proof-contract-to-manage-flow-target',
      from: 'admit-proof-contract',
      to: 'manage-flow-target',
      kind: 'handoff',
      predicate:
        'The retained owner artifact is available for an explicit target decision or observation.',
      producedArtifacts: ['artifact:admitted-proof-contract']
    },
    {
      id: 'execute-agent-task-to-manage-flow-target',
      from: 'execute-agent-task',
      to: 'manage-flow-target',
      kind: 'handoff',
      predicate:
        'The retained owner artifact is available for an explicit target decision or observation.',
      producedArtifacts: ['artifact:agent-task-state']
    },
    {
      id: 'prepare-pr-review-to-manage-flow-target',
      from: 'prepare-pr-review',
      to: 'manage-flow-target',
      kind: 'handoff',
      predicate:
        'The retained owner artifact is available for an explicit target decision or observation.',
      producedArtifacts: ['artifact:pr-review-record']
    },
    {
      id: 'manage-flow-target-to-actions',
      from: 'manage-flow-target',
      to: 'serve-proof-actions',
      kind: 'handoff',
      predicate:
        'A target revision or read projection is available without granting conformance.',
      producedArtifacts: ['artifact:flow-target-state']
    },
    {
      id: 'aggregate-workflow-results-terminal',
      from: 'aggregate-workflow-results',
      kind: 'terminal',
      predicate:
        'Declared producer jobs have settled and their evidence has been assessed.',
      producedArtifacts: ['artifact:workflow-result-summary']
    },
    {
      id: 'execute-agent-task-to-prepare-pr-review',
      from: 'execute-agent-task',
      to: 'prepare-pr-review',
      kind: 'handoff',
      predicate: 'The producer completed the declared review boundary.',
      producedArtifacts: ['artifact:agent-task-state']
    },
    {
      id: 'verify-agent-candidate-to-prepare-pr-review',
      from: 'verify-agent-candidate',
      to: 'prepare-pr-review',
      kind: 'handoff',
      predicate: 'The producer completed the declared review boundary.',
      producedArtifacts: ['artifact:agent-candidate-verdict']
    },
    {
      id: 'prepare-pr-review-to-deliver-github-review',
      from: 'prepare-pr-review',
      to: 'deliver-github-review',
      kind: 'handoff',
      predicate: 'The producer completed the declared review boundary.',
      producedArtifacts: ['artifact:pr-review-record']
    },
    {
      id: 'deliver-github-review-to-prepare-pr-review',
      from: 'deliver-github-review',
      to: 'prepare-pr-review',
      kind: 'handoff',
      predicate: 'The producer completed the declared review boundary.',
      producedArtifacts: ['artifact:github-review-observation']
    },
    {
      id: 'prepare-pr-review-to-serve-proof-actions',
      from: 'prepare-pr-review',
      to: 'serve-proof-actions',
      kind: 'handoff',
      predicate: 'The producer completed the declared review boundary.',
      producedArtifacts: ['artifact:pr-review-record']
    },
    {
      id: 'admit-proof-contract-to-admit-agent-task',
      from: 'admit-proof-contract',
      to: 'admit-agent-task',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:admitted-proof-contract']
    },
    {
      id: 'admit-agent-task-to-execute-agent-task',
      from: 'admit-agent-task',
      to: 'execute-agent-task',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:admitted-agent-task']
    },
    {
      id: 'admit-agent-task-to-verify-agent-candidate',
      from: 'admit-agent-task',
      to: 'verify-agent-candidate',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:admitted-agent-task']
    },
    {
      id: 'execute-agent-task-to-verify-agent-candidate',
      from: 'execute-agent-task',
      to: 'verify-agent-candidate',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:agent-candidate-source']
    },
    {
      id: 'verify-agent-candidate-to-execute-agent-task',
      from: 'verify-agent-candidate',
      to: 'execute-agent-task',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:agent-candidate-verdict']
    },
    {
      id: 'execute-agent-task-to-serve-proof-actions',
      from: 'execute-agent-task',
      to: 'serve-proof-actions',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:agent-task-state']
    },
    {
      id: 'ingest-ci-evidence-to-actions',
      from: 'ingest-ci-evidence',
      to: 'serve-proof-actions',
      kind: 'handoff',
      predicate:
        'All-flow evidence is assessed with explicit delivery blockers.',
      producedArtifacts: ['artifact:ci-aggregate-evidence']
    },
    {
      id: 'review-contract-evolution-to-actions',
      from: 'review-contract-evolution',
      to: 'serve-proof-actions',
      kind: 'handoff',
      predicate:
        'The version owner completed or explicitly blocked the review.',
      producedArtifacts: ['artifact:reviewed-contract-evolution']
    },
    {
      id: 'admit-proof-contract-to-capture-proof-source',
      from: 'admit-proof-contract',
      to: 'capture-proof-source',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:admitted-proof-contract']
    },
    {
      id: 'admit-proof-contract-to-assess-proof-evidence',
      from: 'admit-proof-contract',
      to: 'assess-proof-evidence',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:admitted-proof-contract']
    },
    {
      id: 'admit-proof-contract-to-serve-proof-actions',
      from: 'admit-proof-contract',
      to: 'serve-proof-actions',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:admitted-proof-contract']
    },
    {
      id: 'capture-proof-source-to-execute-proof-run',
      from: 'capture-proof-source',
      to: 'execute-proof-run',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:proof-source-snapshot']
    },
    {
      id: 'capture-proof-source-to-assess-proof-evidence',
      from: 'capture-proof-source',
      to: 'assess-proof-evidence',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:proof-source-snapshot']
    },
    {
      id: 'execute-proof-run-to-assess-proof-evidence',
      from: 'execute-proof-run',
      to: 'assess-proof-evidence',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:proof-runner-result']
    },
    {
      id: 'assess-proof-evidence-to-serve-proof-actions',
      from: 'assess-proof-evidence',
      to: 'serve-proof-actions',
      kind: 'handoff',
      predicate: 'After source admission and runner settlement, completed evidence returns for persistence and projection only; it is not an input prerequisite for earlier source admission.',
      producedArtifacts: ['artifact:assessed-proof-evidence']
    },
    {
      id: 'serve-proof-actions-to-render-proof-board',
      from: 'serve-proof-actions',
      to: 'render-proof-board',
      kind: 'handoff',
      predicate: 'Consume service-owned board state, exact retained review/target pins and cached assessment records/currentness projections through public HTTP reads; explicit create/start/cancel actions return through the same service authority, without client assessment or private role dispatch.',
      producedArtifacts: ['artifact:proof-board-state']
    },
    {
      id: 'render-proof-board-terminal',
      from: 'render-proof-board',
      kind: 'terminal',
      predicate: 'The board has rendered the selected attempt.',
      producedArtifacts: ['artifact:proof-board-view']
    }
  ],
  artifacts: [
    { id: 'artifact:admitted-verification-source', ownerStepId: 'serve-proof-actions', channel: 'service-owned verification source reference', consumerStepIds: ['review-contract-evolution'] },
    { id: 'artifact:admitted-runtime-source', ownerStepId: 'serve-proof-actions', channel: 'service-owned source admission', consumerStepIds: ['assess-proof-evidence', 'assess-target-source', 'capture-proof-source'] },
    { id: 'artifact:target-source-assessment', ownerStepId: 'assess-target-source', channel: 'source-bound target assessment', consumerStepIds: ['serve-proof-actions'] },
    { id: 'artifact:work-admission', ownerStepId: 'manage-flow-target', channel: 'immutable source-bound work admission', consumerStepIds: ['admit-agent-task', 'execute-agent-task'] },
    {
      id: 'artifact:flow-target-state',
      title: 'Flow target revisions and work observations',
      ownerStepId: 'manage-flow-target',
      channel: 'local-target',
      consumerStepIds: ['serve-proof-actions', 'assess-target-source']
    },
    {
      id: 'artifact:workflow-result-summary',
      title: 'Workflow result summary',
      ownerStepId: 'aggregate-workflow-results',
      channel: 'github-check',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:pr-review-record',
      title: 'Candidate PR review',
      ownerStepId: 'prepare-pr-review',
      channel: 'local-delivery',
      consumerStepIds: [
        'deliver-github-review',
        'serve-proof-actions',
        'manage-flow-target'
      ]
    },
    {
      id: 'artifact:github-review-observation',
      title: 'GitHub review observation',
      ownerStepId: 'deliver-github-review',
      channel: 'github-delivery',
      consumerStepIds: ['prepare-pr-review']
    },
    {
      id: 'artifact:admitted-agent-task',
      title: 'admitted-agent-task',
      ownerStepId: 'admit-agent-task',
      channel: 'local-agent',
      consumerStepIds: ['execute-agent-task', 'verify-agent-candidate']
    },
    {
      id: 'artifact:agent-candidate-source',
      title: 'agent-candidate-source',
      ownerStepId: 'execute-agent-task',
      channel: 'local-agent',
      consumerStepIds: ['verify-agent-candidate']
    },
    {
      id: 'artifact:agent-candidate-verdict',
      title: 'agent-candidate-verdict',
      ownerStepId: 'verify-agent-candidate',
      channel: 'local-agent',
      consumerStepIds: ['execute-agent-task', 'prepare-pr-review']
    },
    {
      id: 'artifact:agent-task-state',
      title: 'agent-task-state',
      ownerStepId: 'execute-agent-task',
      channel: 'local-agent',
      consumerStepIds: [
        'serve-proof-actions',
        'prepare-pr-review',
        'manage-flow-target'
      ]
    },
    {
      id: 'artifact:ci-aggregate-evidence',
      title: 'CI aggregate evidence',
      ownerStepId: 'ingest-ci-evidence',
      channel: 'ci-evidence',
      consumerStepIds: ['serve-proof-actions']
    },
    {
      id: 'artifact:reviewed-contract-evolution',
      title: 'Reviewed contract evolution',
      ownerStepId: 'review-contract-evolution',
      channel: 'contract-evolution',
      consumerStepIds: ['serve-proof-actions', 'manage-flow-target']
    },
    {
      id: 'artifact:admitted-proof-contract',
      title: 'Admit proof contract output',
      ownerStepId: 'admit-proof-contract',
      channel: 'local-proof',
      consumerStepIds: [
        'capture-proof-source',
        'assess-proof-evidence',
        'serve-proof-actions',
        'admit-agent-task',
        'manage-flow-target',
        'assess-target-source'
      ]
    },
    {
      id: 'artifact:proof-source-snapshot',
      title: 'Capture proof source output',
      ownerStepId: 'capture-proof-source',
      channel: 'local-proof',
      consumerStepIds: ['execute-proof-run', 'assess-proof-evidence', 'assess-target-source', 'serve-proof-actions', 'verify-agent-candidate']
    },
    {
      id: 'artifact:proof-runner-result',
      title: 'Execute proof run output',
      ownerStepId: 'execute-proof-run',
      channel: 'local-proof',
      consumerStepIds: ['assess-proof-evidence']
    },
    {
      id: 'artifact:assessed-proof-evidence',
      title: 'Assess proof evidence output',
      ownerStepId: 'assess-proof-evidence',
      channel: 'local-proof',
      consumerStepIds: ['serve-proof-actions', 'assess-target-source', 'verify-agent-candidate', 'execute-agent-task']
    },
    {
      id: 'artifact:proof-board-state',
      title: 'Serve proof actions output',
      ownerStepId: 'serve-proof-actions',
      channel: 'local-proof',
      consumerStepIds: ['render-proof-board']
    },
    {
      id: 'artifact:proof-board-view',
      title: 'Render proof board output',
      ownerStepId: 'render-proof-board',
      channel: 'local-proof',
      consumerStepIds: [],
      terminal: true
    }
  ],
  invariants: [
    {
      id: 'snapshot-bound-pass',
      statement:
        'A pass describes complete observed obligations for one captured source, never a deployment or an untested flow.',
      stepIds: [
        'admit-proof-contract',
        'capture-proof-source',
        'execute-proof-run',
        'assess-proof-evidence',
        'serve-proof-actions',
        'render-proof-board'
      ],
      artifactIds: ['artifact:assessed-proof-evidence'],
      specRefs: ['#source-and-evidence']
    }
  ],
  acceptanceContracts: [
    {
      id: 'bounded-core-proof',
      title: 'Core proof cases and completion',
      stepIds: [
        'admit-proof-contract',
        'capture-proof-source',
        'execute-proof-run',
        'assess-proof-evidence',
        'serve-proof-actions',
        'render-proof-board'
      ],
      assertions: [
        'Baseline passes both flows, all five registered isolated violations fail exactly their declared obligations, and a new baseline recovers.',
        'Incomplete or inconsistent evidence and unauthorized actions cannot pass or execute; exact-base mapping decisions preserve obligations and request retries preserve attempt identity.'
      ],
      specRefs: ['#cases-and-completion']
    }
  ]
}

globalThis.FLOW_INSPECTOR_DATA = data
if (typeof module !== 'undefined') module.exports = data
