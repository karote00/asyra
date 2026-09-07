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
      id: 'review-contract-evolution',
      order: 0,
      laneId: 'proof',
      title: 'Review contract evolution',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Contract evolution',
      inputs: ['accepted version history', 'admitted candidate contract', 'observed selector identities and source digests', 'explicit successor relations and retirement request', 'actor capability and exact-base decision'],
      outputs: ['artifact:reviewed-contract-evolution'],
      conditions: ['Compare stable obligations and source observations once per requested review; preserve immutable accepted versions. Accept only exact current base and candidate inputs with authorized reason; removal requires separately authorized explicit retirement. Missing selectors and unknown evidence remain unresolved.'],
      bypasses: ['No implicit retirement, heuristic acceptance, or preserved green evidence after revision.'],
      allowedContributors: ['admitted contracts', 'registered selector observations', 'explicit actor decision'],
      forbiddenContributors: ['provider green status', 'client-side acceptance', 'candidate self-authorization'],
      cacheDimensions: [],
      implementationBoundary: ['tools/flow-inspector/control-plane/evolution.cjs', 'tools/flow-inspector/control-plane/__tests__/evolution.test.cjs'],
      specRefs: ['#contract-evolution'],
      failureOwnerStepId: 'review-contract-evolution'
    },
    {
      id: 'admit-proof-contract',
      order: 1,
      laneId: 'proof',
      title: 'Admit proof contract',
      ownerPackage: 'tools/flow-inspector/control-plane',
      purpose: 'Admission',
      inputs: ['product-owned proof manifest', 'target architecture Inspector', 'accepted mapping for explicit candidate comparison'],
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
      inputs: ['independently selected accepted contract and gate policy', 'admitted integration contract', 'trusted expected repository/source/base/head/integration identity', 'CI attempt envelope and raw report'],
      outputs: ['artifact:ci-aggregate-evidence'],
      conditions: ['Check complete supported obligation inventory, exact source and integration provenance, raw case outcomes and artifact fingerprint; retain both confirmed assertion failures and delivery blockers.'],
      bypasses: ['Missing protection is an explicit delivery blocker; provider green never substitutes for case evidence.'],
      allowedContributors: ['accepted-base policy', 'assess-proof-evidence raw report assessor', 'registered CI transport'],
      forbiddenContributors: ['candidate-selected trust base', 'provider summary as verification', 'candidate gate-policy authorization'],
      cacheDimensions: [],
      implementationBoundary: ['tools/flow-inspector/control-plane/ci-evidence.cjs', 'tools/flow-inspector/control-plane/__tests__/ci-evidence.test.cjs'],
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
        'authorized run identity',
        'declared source roots and dependency metadata',
        'server-selected accepted Git base and integration revision'
      ],
      outputs: ['artifact:proof-source-snapshot'],
      conditions: [
        'Read accepted-base contract and protected gate inputs once for CI admission; compare captured integration bytes with Git identity and preserve explicit policy drift blockers. Copy regular source files once into one attempt-owned tree, retain the immutable file manifest, bind source, mapping, architecture, configuration and lockfile digests, and reject symlinks.'
      ],
      bypasses: [
        'No previous snapshot or mutable checkout may replace the captured runtime source.'
      ],
      allowedContributors: [
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
      specRefs: ['#source-and-evidence'],
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
        'Run one registered Vitest process group against captured source; await settlement on success, error, deadline, or cancellation.'
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
      specRefs: ['#controlled-actions-and-retention'],
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
        'artifact:proof-runner-result'
      ],
      outputs: ['artifact:assessed-proof-evidence'],
      conditions: [
        'Exactly one passing observation per required case, successful exit, and no runner errors are necessary for pass; preserve observed step failures and verify source, contract, mapping, architecture, scenario, configuration, runner environment, and report identity. Retained current-contract evidence must preserve that inventory and version identity before admission.'
      ],
      bypasses: [
        'Missing or invalid reports produce an explicit non-pass, never inferred completion.'
      ],
      allowedContributors: ['validated Vitest JSON result'],
      forbiddenContributors: [
        'test-file existence as behavioral evidence',
        'exit code alone'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/control-plane/evidence.cjs',
        'tools/flow-inspector/control-plane/__tests__/evidence.test.cjs'
      ],
      specRefs: ['#source-and-evidence'],
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
        'registered local request',
        'attempt store',
        'existing static workspace and catalog-declared local resources',
        'artifact:reviewed-contract-evolution',
        'artifact:ci-aggregate-evidence',
        'server-selected accepted Git base'
      ],
      outputs: ['artifact:proof-board-state'],
      conditions: [
        'Keep reported step work completion independent from execution, verification and delivery. Separate candidate verification from accepted conformance, persist version decisions and accepted mapping atomically, admit CI results against a server-selected base, and produce baseline-bound read-only manager snapshots only at state changes. Authorize before work, admit one run against the explicitly accepted mapping, durably record state with audit, and expose immutable snapshot-bound evidence; restart interrupts incomplete attempts. Mapping prepare and decide actions bind the exact base revision and candidate digest, preserve all obligations, and atomically retain the decision with the accepted mapping. Duplicate request identities do not repeat execution; repeated reads consume already admitted evidence.',
        'Serve allowlisted existing workspace assets and compose the proof adapter into target documents; preserve static paths, target routing, and same-origin isolation. Serve Overview at root and catalog-slug pages with an explicit path-routing marker and workspace asset base; unknown public paths return a 404 route error without a selected target. Catalog-declared standalone HTML paths redirect to their exact short workspace target, and declared documentation/source links remain readable in a separate tab.'
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
      specRefs: ['#controlled-actions-and-retention', '#board'],
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
        'user-selected flow and scenario'
      ],
      outputs: ['artifact:proof-board-view'],
      conditions: [
        'Preserve the existing canvas cards, routes, geometry, controls, and details; project exact selected-flow results and actions into that surface without replacing the graph.',
        'On a newly selected failed attempt, select the first failing flow if the current flow has no failures; preserve subsequent manual selection. Show a persistent run-level failure alert with named owner navigation and geometry-preserving failed card highlights; clear them on recovery.',
        'Bind cards only after graph DOM replacement; unchanged polling rebuilds neither graph nor bindings and performs no source capture. Target retirement disconnects observers and aborts reads.',
        'Project explicit work reports separately from verification and delivery. Project candidate verification, exact version review with retirement, all-flow CI blockers and artifacts, retry, and baseline/time-labeled shared viewing through the same action service. Show every registered negative scenario, snapshot and version identity, runner environment, named artifact links, and retained attempts; unsupported targets and untested steps receive no successful evidence. Prepare and decide mapping reviews through the action service with an explicit reason; never accept mapping changes in the client.',
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
      specRefs: ['#board'],
      failureOwnerStepId: 'render-proof-board'
    }
  ],
  routes: [
    {
      id: 'ingest-ci-evidence-to-actions', from: 'ingest-ci-evidence', to: 'serve-proof-actions', kind: 'handoff',
      predicate: 'All-flow evidence is assessed with explicit delivery blockers.',
      producedArtifacts: ['artifact:ci-aggregate-evidence']
    },
    {
      id: 'review-contract-evolution-to-actions',
      from: 'review-contract-evolution',
      to: 'serve-proof-actions',
      kind: 'handoff',
      predicate: 'The version owner completed or explicitly blocked the review.',
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
      predicate: 'The producer completed its declared boundary.',
      producedArtifacts: ['artifact:assessed-proof-evidence']
    },
    {
      id: 'serve-proof-actions-to-render-proof-board',
      from: 'serve-proof-actions',
      to: 'render-proof-board',
      kind: 'handoff',
      predicate: 'The producer completed its declared boundary.',
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
    {
      id: 'artifact:ci-aggregate-evidence', title: 'CI aggregate evidence',
      ownerStepId: 'ingest-ci-evidence', channel: 'ci-evidence', consumerStepIds: ['serve-proof-actions']
    },
    {
      id: 'artifact:reviewed-contract-evolution',
      title: 'Reviewed contract evolution',
      ownerStepId: 'review-contract-evolution',
      channel: 'contract-evolution',
      consumerStepIds: ['serve-proof-actions']
    },
    {
      id: 'artifact:admitted-proof-contract',
      title: 'Admit proof contract output',
      ownerStepId: 'admit-proof-contract',
      channel: 'local-proof',
      consumerStepIds: [
        'capture-proof-source',
        'assess-proof-evidence',
        'serve-proof-actions'
      ]
    },
    {
      id: 'artifact:proof-source-snapshot',
      title: 'Capture proof source output',
      ownerStepId: 'capture-proof-source',
      channel: 'local-proof',
      consumerStepIds: ['execute-proof-run', 'assess-proof-evidence']
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
      consumerStepIds: ['serve-proof-actions']
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
