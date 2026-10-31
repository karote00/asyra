const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
module.exports = freeze({
  schema: {
    id: 'flow-inspector',
    version: 2
  },
  target: {
    id: 'flow-document-workflow',
    kind: 'tool',
    title: 'Flow Document Workflow',
    subtitle: 'Current-only project contracts, evidence and human actions'
  },
  authority: {
    specPath: 'docs/ai/tools/flow-inspector/FLOW_DOCUMENT.md',
    inspectorPath:
      'tools/flow-inspector/inspectors/flow-document-workflow-flow-inspector.data.cjs',
    semanticOwner: 'Flow Document Contract',
    inspectorOwner: 'Flow Inspector Tool'
  },
  links: [
    {
      id: 'contract',
      kind: 'authority',
      label: 'Flow Document Contract',
      href: '../../../docs/ai/tools/flow-inspector/FLOW_DOCUMENT.md'
    }
  ],
  lanes: [
    {
      id: 'workflow',
      title: 'Flow Document Owners',
      order: 1
    }
  ],
  steps: [
    {
      id: 'admit-flow-document',
      order: 1,
      laneId: 'workflow',
      title: 'Admit flow documents',
      ownerPackage: '@asyra/flow-inspector',
      purpose: 'Validate public data and preserve architecture boundaries.',
      inputs: [
        'untrusted JSON flow documents',
        'artifact:update-flow-document-to-admit-flow-document',
        'artifact:resolve-flow-project-to-admit-flow-document',
        'artifact:transfer-flow-current-to-admit-flow-document'
      ],
      outputs: ['artifact:admit-flow-document-to-evaluate-flow-document'],
      conditions: [
        'Schema version, identities, references and dependency cycles are valid.'
      ],
      bypasses: [
        'Invalid input returns file/field diagnostics; never substitutes a different flow.'
      ],
      allowedContributors: [
        'declared upstream artifacts',
        'local project-authorized intent'
      ],
      forbiddenContributors: [
        'implicit source scanning',
        'historical state as verdict authority',
        'consumer-local completion logic'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/flow-files/schema.cjs',
        'tools/flow-inspector/flow-files/flow.schema.json',
        'tools/flow-inspector/flow-files/__tests__/**'
      ],
      specRefs: [
        'docs/ai/tools/flow-inspector/FLOW_DOCUMENT.md#public-document'
      ],
      failureOwnerStepId: 'admit-flow-document'
    },
    {
      id: 'evaluate-flow-document',
      order: 2,
      laneId: 'workflow',
      title: 'Evaluate current acceptance',
      ownerPackage: '@asyra/flow-inspector',
      purpose:
        'Derive node and feature verdicts and compact context once from admitted current state.',
      inputs: [
        'admitted project graph',
        'artifact:admit-flow-document-to-evaluate-flow-document'
      ],
      outputs: ['artifact:evaluate-flow-document-to-present-flow-document'],
      conditions: [
        'All relevant criteria and dependencies bind to current definitions and source revisions.'
      ],
      bypasses: [
        'Missing, stale and manual-pending results remain unsatisfied.'
      ],
      allowedContributors: [
        'declared upstream artifacts',
        'local project-authorized intent'
      ],
      forbiddenContributors: [
        'implicit source scanning',
        'historical state as verdict authority',
        'consumer-local completion logic'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/flow-files/policy.cjs',
        'tools/flow-inspector/flow-files/context.cjs',
        'tools/flow-inspector/flow-files/__tests__/**'
      ],
      specRefs: [
        'docs/ai/tools/flow-inspector/FLOW_DOCUMENT.md#evaluation',
        'docs/ai/tools/flow-inspector/PROJECT_RUNTIME.md#headless-and-transfer-boundary'
      ],
      failureOwnerStepId: 'evaluate-flow-document'
    },
    {
      id: 'update-flow-document',
      order: 3,
      laneId: 'workflow',
      title: 'Publish bounded current state',
      ownerPackage: '@asyra/flow-inspector',
      purpose:
        'Apply authorized revision-checked updates without retaining histories.',
      inputs: [
        'validated update intent',
        'admitted project graph',
        'artifact:produce-flow-results-to-update-flow-document',
        'artifact:present-flow-document-to-update-flow-document'
      ],
      outputs: ['artifact:update-flow-document-to-admit-flow-document'],
      conditions: [
        'Expected document revision and affected bindings match under the writer lock.'
      ],
      bypasses: [
        'Identical current updates are no-ops; stale writes fail without mutation.'
      ],
      allowedContributors: [
        'declared upstream artifacts',
        'local project-authorized intent'
      ],
      forbiddenContributors: [
        'implicit source scanning',
        'historical state as verdict authority',
        'consumer-local completion logic'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/flow-files/store.cjs',
        'tools/flow-inspector/flow-files/artifacts.cjs',
        'tools/flow-inspector/flow-files/__tests__/**'
      ],
      specRefs: [
        'docs/ai/tools/flow-inspector/FLOW_DOCUMENT.md#current-writes'
      ],
      failureOwnerStepId: 'update-flow-document'
    },
    {
      id: 'produce-flow-results',
      order: 4,
      laneId: 'workflow',
      title: 'Translate existing test results',
      ownerPackage: '@asyra/flow-inspector',
      purpose:
        'Translate current admitted test observations and explicit old-state projection into flow files.',
      inputs: [
        'current mapped observation',
        'declared producer scope',
        'existing architecture',
        'artifact:resolve-flow-project-to-produce-flow-results'
      ],
      outputs: ['artifact:produce-flow-results-to-update-flow-document'],
      conditions: [
        'Preserve exact mapping, failure detail and warning coverage.'
      ],
      bypasses: [
        'Unknown or incomplete scope cannot retire warnings or clear failures.'
      ],
      allowedContributors: [
        'declared upstream artifacts',
        'local project-authorized intent'
      ],
      forbiddenContributors: [
        'implicit source scanning',
        'historical state as verdict authority',
        'consumer-local completion logic'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/flow-files/producers.cjs',
        'tools/flow-inspector/flow-files/producer-cli.cjs',
        'tools/flow-inspector/control-plane/runner.cjs',
        'tools/flow-inspector/control-plane/localization.cjs',
        'tools/flow-inspector/control-plane/playwright-results.cjs',
        'tools/flow-inspector/control-plane/observation-files.cjs',
        'tools/flow-inspector/control-plane/node-interactions.cjs',
        'tools/flow-inspector/flow-files/__tests__/**',
        'tools/flow-inspector/flow-files/adapters.cjs',
        'tools/flow-inspector/flow-files/portable-runner.cjs',
        'tools/flow-inspector/flow-files/reporters/**'
      ],
      specRefs: [
        'docs/ai/tools/flow-inspector/FLOW_DOCUMENT.md#producer-and-migration-boundary',
        'docs/ai/tools/flow-inspector/PROJECT_RUNTIME.md#portable-producers'
      ],
      failureOwnerStepId: 'produce-flow-results'
    },
    {
      id: 'present-flow-document',
      order: 5,
      laneId: 'workflow',
      title: 'Serve current flow and human actions',
      ownerPackage: '@asyra/flow-inspector',
      purpose:
        'Expose the shared snapshot and explicit actions through flow navigation and the existing canvas.',
      inputs: [
        'evaluated project snapshot',
        'local action intent',
        'artifact:evaluate-flow-document-to-present-flow-document',
        'artifact:resolve-flow-project-to-present-flow-document'
      ],
      outputs: [
        'artifact:present-flow-document-to-update-flow-document',
        'artifact:current-presentation'
      ],
      conditions: [
        'Read and watch never execute tests; preview binds action and revision.'
      ],
      bypasses: [
        'Invalid or removed file disables stale green verdict and writes.'
      ],
      allowedContributors: [
        'declared upstream artifacts',
        'local project-authorized intent'
      ],
      forbiddenContributors: [
        'implicit source scanning',
        'historical state as verdict authority',
        'consumer-local completion logic'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/flow-files/service.cjs',
        'tools/flow-inspector/flow-files/server.cjs',
        'tools/flow-inspector/flow-files/cli.cjs',
        'tools/flow-inspector/flow-files/view.cjs',
        'tools/flow-inspector/flow-files/public/**',
        'tools/flow-inspector/control-plane/server.cjs',
        'tools/flow-inspector/src/**',
        'tools/flow-inspector/src/architecture/styles.css',
        'tools/flow-inspector/flow-files/__tests__/**',
        'tools/flow-inspector/bin/**',
        'tools/flow-inspector/flow-files/api.cjs',
        'tools/flow-inspector/flow-files/commands.cjs'
      ],
      specRefs: [
        'docs/ai/tools/flow-inspector/FLOW_DOCUMENT.md#service-and-presentation'
      ],
      failureOwnerStepId: 'present-flow-document'
    },
    {
      id: 'resolve-flow-project',
      order: 6,
      laneId: 'workflow',
      title: 'Resolve consumer project',
      ownerPackage: '@asyra/flow-inspector',
      purpose:
        'Admit explicit consumer configuration and separate installed assets from writable project data.',
      inputs: [
        'explicit local project intent',
        'artifact:distribute-flow-runtime-to-resolve-flow-project'
      ],
      outputs: [
        'artifact:resolve-flow-project-to-admit-flow-document',
        'artifact:resolve-flow-project-to-present-flow-document',
        'artifact:resolve-flow-project-to-produce-flow-results',
        'artifact:resolve-flow-project-to-transfer-flow-current'
      ],
      conditions: [
        'All declared identities, boundaries and version contracts are valid.'
      ],
      bypasses: [
        'Invalid inputs fail explicitly without substituting another project.'
      ],
      allowedContributors: [
        'declared project files',
        'installed package assets'
      ],
      forbiddenContributors: [
        'implicit Asyra checkout discovery',
        'historical state as verdict authority',
        'unrequested product test execution'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/flow-files/project.cjs',
        'tools/flow-inspector/flow-files/__tests__/**'
      ],
      specRefs: ['docs/ai/tools/flow-inspector/PROJECT_RUNTIME.md'],
      failureOwnerStepId: 'resolve-flow-project'
    },
    {
      id: 'transfer-flow-current',
      order: 7,
      laneId: 'workflow',
      title: 'Transfer current evidence',
      ownerPackage: '@asyra/flow-inspector',
      purpose:
        'Validate portable current bundles and publish revision-safe current project files.',
      inputs: [
        'explicit local project intent',
        'artifact:resolve-flow-project-to-transfer-flow-current'
      ],
      outputs: ['artifact:transfer-flow-current-to-admit-flow-document'],
      conditions: [
        'All declared identities, boundaries and version contracts are valid.'
      ],
      bypasses: [
        'Invalid inputs fail explicitly without substituting another project.'
      ],
      allowedContributors: [
        'declared project files',
        'installed package assets'
      ],
      forbiddenContributors: [
        'implicit Asyra checkout discovery',
        'historical state as verdict authority',
        'unrequested product test execution'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/flow-files/bundles.cjs',
        'tools/flow-inspector/flow-files/__tests__/**'
      ],
      specRefs: ['docs/ai/tools/flow-inspector/PROJECT_RUNTIME.md'],
      failureOwnerStepId: 'transfer-flow-current'
    },
    {
      id: 'distribute-flow-runtime',
      order: 8,
      laneId: 'workflow',
      title: 'Distribute installed runtime',
      ownerPackage: '@asyra/flow-inspector',
      purpose:
        'Ship the runnable CLI, public API, docs and static assets with a verified manifest.',
      inputs: ['explicit local project intent'],
      outputs: ['artifact:distribute-flow-runtime-to-resolve-flow-project'],
      conditions: [
        'All declared identities, boundaries and version contracts are valid.'
      ],
      bypasses: [
        'Invalid inputs fail explicitly without substituting another project.'
      ],
      allowedContributors: [
        'declared project files',
        'installed package assets'
      ],
      forbiddenContributors: [
        'implicit Asyra checkout discovery',
        'historical state as verdict authority',
        'unrequested product test execution'
      ],
      cacheDimensions: [],
      implementationBoundary: [
        'tools/flow-inspector/flow-files/__tests__/**',
        'tools/flow-inspector/package.json',
        'tools/flow-inspector/README.md',
        'tools/flow-inspector/bin/**',
        'tools/flow-inspector/__tests__/**',
        '.github/workflows/main.yml'
      ],
      specRefs: ['docs/ai/tools/flow-inspector/PROJECT_RUNTIME.md'],
      failureOwnerStepId: 'distribute-flow-runtime'
    }
  ],
  routes: [
    {
      id: 'admit-flow-document-to-evaluate-flow-document',
      from: 'admit-flow-document',
      to: 'evaluate-flow-document',
      kind: 'handoff',
      predicate: 'The producer completed its declared output successfully.',
      producedArtifacts: [
        'artifact:admit-flow-document-to-evaluate-flow-document'
      ]
    },
    {
      id: 'evaluate-flow-document-to-present-flow-document',
      from: 'evaluate-flow-document',
      to: 'present-flow-document',
      kind: 'handoff',
      predicate: 'The producer completed its declared output successfully.',
      producedArtifacts: [
        'artifact:evaluate-flow-document-to-present-flow-document'
      ]
    },
    {
      id: 'produce-flow-results-to-update-flow-document',
      from: 'produce-flow-results',
      to: 'update-flow-document',
      kind: 'handoff',
      predicate: 'The producer completed its declared output successfully.',
      producedArtifacts: [
        'artifact:produce-flow-results-to-update-flow-document'
      ]
    },
    {
      id: 'update-flow-document-to-admit-flow-document',
      from: 'update-flow-document',
      to: 'admit-flow-document',
      kind: 'handoff',
      predicate: 'The producer completed its declared output successfully.',
      producedArtifacts: [
        'artifact:update-flow-document-to-admit-flow-document'
      ]
    },
    {
      id: 'present-flow-document-to-update-flow-document',
      from: 'present-flow-document',
      to: 'update-flow-document',
      kind: 'handoff',
      predicate: 'The producer completed its declared output successfully.',
      producedArtifacts: [
        'artifact:present-flow-document-to-update-flow-document'
      ]
    },
    {
      id: 'distribute-flow-runtime-to-resolve-flow-project',
      from: 'distribute-flow-runtime',
      to: 'resolve-flow-project',
      kind: 'handoff',
      predicate: 'The owner admitted the requested project input successfully.',
      producedArtifacts: [
        'artifact:distribute-flow-runtime-to-resolve-flow-project'
      ]
    },
    {
      id: 'resolve-flow-project-to-admit-flow-document',
      from: 'resolve-flow-project',
      to: 'admit-flow-document',
      kind: 'handoff',
      predicate: 'The owner admitted the requested project input successfully.',
      producedArtifacts: [
        'artifact:resolve-flow-project-to-admit-flow-document'
      ]
    },
    {
      id: 'resolve-flow-project-to-present-flow-document',
      from: 'resolve-flow-project',
      to: 'present-flow-document',
      kind: 'handoff',
      predicate: 'The owner admitted the requested project input successfully.',
      producedArtifacts: [
        'artifact:resolve-flow-project-to-present-flow-document'
      ]
    },
    {
      id: 'resolve-flow-project-to-produce-flow-results',
      from: 'resolve-flow-project',
      to: 'produce-flow-results',
      kind: 'handoff',
      predicate: 'The owner admitted the requested project input successfully.',
      producedArtifacts: [
        'artifact:resolve-flow-project-to-produce-flow-results'
      ]
    },
    {
      id: 'resolve-flow-project-to-transfer-flow-current',
      from: 'resolve-flow-project',
      to: 'transfer-flow-current',
      kind: 'handoff',
      predicate: 'The owner admitted the requested project input successfully.',
      producedArtifacts: [
        'artifact:resolve-flow-project-to-transfer-flow-current'
      ]
    },
    {
      id: 'transfer-flow-current-to-admit-flow-document',
      from: 'transfer-flow-current',
      to: 'admit-flow-document',
      kind: 'handoff',
      predicate: 'The owner admitted the requested project input successfully.',
      producedArtifacts: [
        'artifact:transfer-flow-current-to-admit-flow-document'
      ]
    }
  ],
  artifacts: [
    {
      id: 'artifact:admit-flow-document-to-evaluate-flow-document',
      ownerStepId: 'admit-flow-document',
      channel: 'validated local data',
      consumerStepIds: ['evaluate-flow-document']
    },
    {
      id: 'artifact:evaluate-flow-document-to-present-flow-document',
      ownerStepId: 'evaluate-flow-document',
      channel: 'validated local data',
      consumerStepIds: ['present-flow-document']
    },
    {
      id: 'artifact:produce-flow-results-to-update-flow-document',
      ownerStepId: 'produce-flow-results',
      channel: 'validated local data',
      consumerStepIds: ['update-flow-document']
    },
    {
      id: 'artifact:update-flow-document-to-admit-flow-document',
      ownerStepId: 'update-flow-document',
      channel: 'validated local data',
      consumerStepIds: ['admit-flow-document']
    },
    {
      id: 'artifact:present-flow-document-to-update-flow-document',
      ownerStepId: 'present-flow-document',
      channel: 'validated local data',
      consumerStepIds: ['update-flow-document']
    },
    {
      id: 'artifact:current-presentation',
      ownerStepId: 'present-flow-document',
      channel: 'human and machine presentation',
      consumerStepIds: [],
      terminal: true
    },
    {
      id: 'artifact:distribute-flow-runtime-to-resolve-flow-project',
      ownerStepId: 'distribute-flow-runtime',
      channel: 'admitted local project context',
      consumerStepIds: ['resolve-flow-project']
    },
    {
      id: 'artifact:resolve-flow-project-to-admit-flow-document',
      ownerStepId: 'resolve-flow-project',
      channel: 'admitted local project context',
      consumerStepIds: ['admit-flow-document']
    },
    {
      id: 'artifact:resolve-flow-project-to-present-flow-document',
      ownerStepId: 'resolve-flow-project',
      channel: 'admitted local project context',
      consumerStepIds: ['present-flow-document']
    },
    {
      id: 'artifact:resolve-flow-project-to-produce-flow-results',
      ownerStepId: 'resolve-flow-project',
      channel: 'admitted local project context',
      consumerStepIds: ['produce-flow-results']
    },
    {
      id: 'artifact:resolve-flow-project-to-transfer-flow-current',
      ownerStepId: 'resolve-flow-project',
      channel: 'admitted local project context',
      consumerStepIds: ['transfer-flow-current']
    },
    {
      id: 'artifact:transfer-flow-current-to-admit-flow-document',
      ownerStepId: 'transfer-flow-current',
      channel: 'admitted local project context',
      consumerStepIds: ['admit-flow-document']
    }
  ],
  invariants: [
    {
      id: 'file-authority',
      statement:
        'Only admitted current flow files establish task and feature verdicts.',
      stepIds: [
        'admit-flow-document',
        'evaluate-flow-document',
        'update-flow-document',
        'produce-flow-results',
        'present-flow-document'
      ],
      artifactIds: [
        'artifact:admit-flow-document-to-evaluate-flow-document',
        'artifact:evaluate-flow-document-to-present-flow-document',
        'artifact:produce-flow-results-to-update-flow-document',
        'artifact:update-flow-document-to-admit-flow-document',
        'artifact:present-flow-document-to-update-flow-document',
        'artifact:current-presentation'
      ],
      specRefs: ['docs/ai/tools/flow-inspector/FLOW_DOCUMENT.md']
    }
  ],
  acceptanceContracts: [
    {
      id: 'stage-one',
      title: 'Complete human task workflow',
      stepIds: [
        'admit-flow-document',
        'evaluate-flow-document',
        'update-flow-document',
        'produce-flow-results',
        'present-flow-document'
      ],
      assertions: [
        'Manual, automated and mixed flows share one evaluation policy.',
        'Current-only updates survive restart and do not replay histories.',
        'Explicit node actions and compact context preserve existing localization.'
      ],
      specRefs: [
        'docs/ai/tools/flow-inspector/FLOW_DOCUMENT.md#acceptance-and-delivery'
      ]
    },
    {
      id: 'stage-two',
      title: 'Independent installed project and CI',
      stepIds: [
        'admit-flow-document',
        'evaluate-flow-document',
        'update-flow-document',
        'produce-flow-results',
        'present-flow-document',
        'resolve-flow-project',
        'transfer-flow-current',
        'distribute-flow-runtime'
      ],
      assertions: [
        'Installed manual and automated consumers use the same current-file policy.',
        'Headless CI consumes evidence without rerunning tests.',
        'Current bundles preserve identities and reject stale or conflicting data.'
      ],
      specRefs: [
        'docs/ai/tools/flow-inspector/PROJECT_RUNTIME.md#delivery-acceptance'
      ]
    }
  ]
})
