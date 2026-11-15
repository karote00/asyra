/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const path = require('node:path')
const test = require('node:test')
const { loadContract } = require('../contracts.cjs')
const { sourceManifestPaths } = require('../playwright-results.cjs')
const {
  verifyOriginalFunctionalOutcomes,
  verifyDeclaredFunctionalCases
} = require('./playwright-results-fixture.cjs')
const root = path.resolve(__dirname, '../../../..')

test(
  'the complete functional command retains all Stage A cases and isolated status evidence',
  {
    skip: process.env.FLOW_DESIGN_FUNCTIONAL_PROOF !== 'true',
    timeout: 2700000
  },
  async (t) => {
    const fs = require('node:fs')
    const { runProcess } = require('../runner.cjs')
    const {
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const evidence = path.join(
      root,
      'tmp/flow-inspector/stage-a/full-' + require('node:crypto').randomUUID()
    )

    fs.mkdirSync(path.join(evidence, 'browser'), { recursive: true })
    const reportPath = path.join(evidence, 'functional.json')
    const result = await runProcess({
      executable: '/bin/bash',
      args: ['scripts/run-e2e.sh'],
      cwd: root,
      env: {
        ...process.env,
        CI: 'true',
        GITHUB_EVENT_NAME: 'pull_request',
        E2E_SUITE: 'functional',
        FLOW_CI_REPORT: reportPath,
        APP_URL: process.env.APP_URL || 'http://127.0.0.1:4317',
        COLLABORATION_WS_PORT: process.env.COLLABORATION_WS_PORT || '4318',
        TMPDIR: process.env.RUNNER_TEMP || path.join(evidence, 'browser')
      },
      signal: t.signal,
      timeoutMs: 2640000,
      maxOutputBytes: 2 * 1024 * 1024,

      onSpawn: (pid) =>
        fs.writeFileSync(
          path.join(evidence, 'process.json'),
          JSON.stringify({ pid, reportPath })
        )
    })

    fs.writeFileSync(path.join(evidence, 'run.log'), result.output)
    t.diagnostic('Full functional evidence: ' + evidence)
    assert.equal(result.reason, null, result.output.slice(-4000))
    assert.equal(result.code, 0, result.output.slice(-4000))
    const reader = createObservationReader(observationDirectory(root))

    for (const [file, source] of [
      [reportPath, 'functional'],
      [reportPath.replace(/\.json$/, '-status.json'), 'status']
    ]) {
      const { id } = JSON.parse(fs.readFileSync(file + '.context.json', 'utf8'))
      const observation = reader.get(id)

      assert.equal(observation.phase, 'completed')
      verifyDeclaredFunctionalCases(observation, source)
      assert.ok(
        observation.cases.every((item) => item.resolution === 'mapped'),
        JSON.stringify(observation.issues)
      )
      verifyOriginalFunctionalOutcomes(observation)
      const original = JSON.parse(fs.readFileSync(file, 'utf8'))

      assert.deepEqual(observation.report, original)
      fs.writeFileSync(
        path.join(
          evidence,
          source === 'status'
            ? 'status-summary.json'
            : 'functional-summary.json'
        ),
        JSON.stringify(
          {
            id,
            cases: observation.cases.length,
            passed: observation.cases.filter((item) => item.status === 'passed')
              .length,
            skipped: observation.cases
              .filter((item) => item.status === 'skipped')
              .map((item) => ({ file: item.file, testName: item.testName })),
            issues: observation.issues
          },
          null,
          2
        )
      )
    }
  }
)

// Faults disable canonical owner operations in an isolated copy. The original
// product cases and their assertions remain unchanged throughout all three runs.
const functionalOwnerProofs = [
  [
    'project-ui-membership',
    'functional.large-document-navigation.c877f564233e',
    'packages/preset/src/subscriptions/data-channel.ts',
    {
      from: 'const retained = lifetime.hierarchy',
      to: 'const retained = undefined',
      transpile: true
    },
    { isolateWorkspaces: true, largeDocument: true }
  ],
  [
    'start-editor',
    'functional.app.a38c2cc25dac',
    'toolbar/reset-stored-document.ts',
    {
      from: 'await (options.resetDocument ?? resetCollaborationDocument)(fileId)',
      to: 'void fileId'
    }
  ],
  [
    'switch-tool',
    'functional.tool-switching.8d9711a252ce',
    'toolbar/tool-button.tsx',
    {
      from: 'switchPrimaryTool(PrimaryToolType.RECTANGLE)',
      to: 'void PrimaryToolType.RECTANGLE'
    }
  ],
  [
    'navigate-viewport',
    'functional.viewport-navigation.349637b54b83',
    'toolbar/zoom.tsx',
    { from: '{(zoom * 100).toFixed(0)}%', to: '{(zoom * 100).toFixed(0)}x' }
  ],
  [
    'start-editor',
    'functional.app.0ed5202f90ef',
    'apps/asyra-design/index.html',
    {
      from: '<title>Asyra Design</title>',
      to: '<title>Unavailable editor</title>'
    }
  ],
  [
    'select-elements',
    'functional.selection.6822ac93b278',
    'contents/layer-selection.ts',
    'getVisibleRangeSelection'
  ],
  [
    'edit-fills',
    'functional.fill-patch.d43e8512336a',
    'common-apis/fills.ts',
    'fillApis.updateFillFields'
  ],
  [
    'edit-vector-path',
    'functional.basic-api-actions.11b963104ba2',
    'common-apis/element/vector-apis.ts',
    'vectorApis.updateVectorAnchorPointPosition'
  ],
  [
    'inspect-design',
    'functional.drawing-inspection.be7218fc660c',
    'common-apis/inspection.ts',
    'inspectionApis.inspect'
  ],
  [
    'replay-history',
    'functional.undo-redo.3ef9814e7f9f',
    'features/undo-redo/index.ts',
    'undoRedoFeature.execution'
  ],
  [
    'delete-subtree',
    'functional.delete-element.e873bdf40a7b',
    'features/delete-element/index.ts',
    'deleteElementFeature.execution'
  ],
  [
    'target-hierarchy',
    'functional.group-hierarchy.dc75cefb2ff0',
    'controllers/canvas-hierarchy-target.ts',
    'resolveContainerChildTarget'
  ],
  [
    'project-vector-geometry',
    'functional.vector-render-invariants.2e069d2c2be4',
    'packages/preset/src/components/vector.ts',
    'renderVectorGraphic',
    { isolateWorkspaces: true }
  ],
  [
    'render-material',
    'functional.mesh-material.bf559278744a',
    'packages/render-engine-pixi/src/mesh-material.ts',
    'encodeMeshMaterial',
    { isolateWorkspaces: true }
  ],
  [
    'retain-navigation',
    'functional.retained-navigation.9c63e382e1fe',
    'packages/render-engine-pixi/src/pixi-render-engine.ts',
    {
      from: 'eventFeatures: { wheel: false }',
      to: 'eventFeatures: { wheel: true }'
    },
    { isolateWorkspaces: true }
  ],
  [
    'rollback-transaction',
    'functional.delete-element.05b69c2318a3',
    'packages/factory/src/data-transact.ts',
    'settleRollback',
    { isolateWorkspaces: true }
  ],
  [
    'group-history-members',
    'functional.transaction-history-groups.d56462fd928a',
    'packages/factory/src/data-transact.ts',
    'withHistoryGroup',
    { isolateWorkspaces: true }
  ],
  [
    'show-session-status',
    'functional.session-status',
    'render-app/status-toast-stack.tsx',
    'StatusToastStack',
    { source: 'status' }
  ],
  [
    'present-layer-hierarchy',
    'functional.group-hierarchy.caf2f297812e',
    'contents/GroupDisclosure.tsx',
    'GroupDisclosure.handleClick'
  ],
  [
    'start-editor',
    'functional.app.fb7b866d4b66',
    'render-app/index.tsx',
    'RenderApp'
  ],
  [
    'edit-properties',
    'functional.properties.e79a06577eba',
    'properties/position.tsx',
    {
      from: "updateSelectedElementProperties('x', nextValue)",
      to: 'void nextValue'
    }
  ],
  [
    'edit-fills',
    'functional.properties.ee7ea52ee1d0',
    'common-apis/fills.ts',
    'fillApis.addFills'
  ],
  [
    'present-conversation',
    'functional.ai-composer-layout.8ad3189fe559',
    'app/ai-conversation-panel.tsx',
    'AiConversationPanel'
  ],
  [
    'execute-agent-request',
    'functional.ai-conversation-flow.cdb75707ec99',
    'features/ai-agent/index.ts',
    'registerAiAgentFeature.api.execute'
  ],
  [
    'invoke-basic-api',
    'functional.basic-api-actions.803332ede82f',
    'ai/basic-api-actions.ts',
    'createBasicApiActions.execute'
  ],
  [
    'apply-prepared-design',
    'functional.design-construction.6317e5763e37',
    'ai/design-actions.ts',
    'createPreparedDesignAction.execute'
  ],
  [
    'inspect-design',
    'functional.ai-inspection-evidence.29d7c8fe685d',
    'common-apis/inspection-evidence.ts',
    'createInspectionEvidence.capture'
  ],
  [
    'query-design-context',
    'functional.indexed-design-query.d8098ca29a69',
    'common-apis/design-context.ts',
    {
      from: '(query: DesignContextQuery) => {',
      to: "(query: DesignContextQuery) => { throw new Error('Isolated query fault');"
    }
  ],
  [
    'edit-native-text',
    'functional.native-text.27b2b5daa8f1',
    'properties/text.tsx',
    'TextField.commit'
  ],
  [
    'show-context-menu',
    'functional.context-menu.36c22a73a6c4',
    'app/group-context-menu.tsx',
    'GroupContextMenu'
  ],
  [
    'switch-tool',
    'functional.oval.35187e9c8c85',
    'features/switch-primary-tool/index.ts',
    'api.switch'
  ],
  [
    'create-element',
    'functional.element-creation.972c55b3a8a5',
    'features/create-element/feature.ts',
    'createElementSession.onStart'
  ],
  [
    'select-elements',
    'functional.selection.65d2395ec2dd',
    'features/selection/feature.ts',
    'selectionFeature.session.onUpdate'
  ],
  [
    'hover-elements',
    'functional.selection.2e58d1642f60',
    'features/hover-element/index.ts',
    'publishHoveredElementId'
  ],
  [
    'move-elements',
    'functional.selection.5b2869cee128',
    'features/move-elements/feature.ts',
    'moveElementsSession.onUpdate'
  ],
  [
    'delete-vector-point',
    'functional.delete-element.d754de456719',
    'features/delete-vector-point/index.ts',
    'deleteVectorPointFeature.execution'
  ],
  [
    'replay-history',
    'functional.undo-redo.16e8eb3faacf',
    'features/undo-redo/index.ts',
    'undoRedoFeature.execution'
  ],
  [
    'edit-vector-path',
    'functional.pen-tool.77d70b602c9f',
    'features/pen-tool/feature.ts',
    'penFeature.session.onStart'
  ],
  [
    'drag-gradient-handles',
    'functional.gradient-fill-handles.10fe841ccb7b',
    'features/gradient-fill-handles/feature.ts',
    'dragGradientHandleFeature.session.onUpdate'
  ],
  [
    'group-elements',
    'functional.group-interaction.61aff3d7b873',
    'features/group-elements/index.ts',
    'executeGroupCommandRequest'
  ],
  [
    'move-layer-hierarchy',
    'functional.layer-tree-reparent-reorder.63841ee3ab7a',
    'features/layer-hierarchy-move/index.ts',
    'layerHierarchyMoveSession.onEnd'
  ],
  [
    'navigate-viewport',
    'functional.viewport-navigation.0615b9da5e57',
    'common-apis/viewport.ts',
    'viewportApis.zoomToCenter'
  ]
]

for (const [
  stepId,
  caseId,
  relativeFile,
  operation,
  fixtureOptions
] of functionalOwnerProofs) {
  test(
    'Stage A original owner fault and recovery - ' + stepId + ' - ' + caseId,
    {
      skip: process.env.FLOW_DESIGN_OWNER_PROOF !== 'true',
      timeout: 240000
    },
    async (t) => {
      const fs = require('node:fs')
      const { playwrightFixture } = require('./playwright-results-fixture.cjs')
      const {
        createObservationReader,
        observationDirectory
      } = require('../localization.cjs')
      const fixture = await playwrightFixture(t, fixtureOptions)

      t.diagnostic('Original owner evidence: ' + fixture.repository)
      const item = fixture.cases.find((item) => item.id === caseId)

      assert.equal(item.stepId, stepId)
      const testFile = path.join(fixture.repository, item.testFile)
      const unchangedAssertions = fs.readFileSync(testFile, 'utf8')

      const verify = (run, status, code) => {
        assert.equal(run.result.reason, null, run.result.output.slice(-3000))
        assert.equal(run.result.code, code, run.result.output.slice(-3000))
        assert.equal(
          run.record.cases.length,
          1,
          JSON.stringify(run.record.issues)
        )
        const observed = run.record.cases[0]

        assert.equal(observed.status, status)
        assert.equal(
          observed.resolution,
          'mapped',
          JSON.stringify(run.record.issues)
        )
        assert.equal(observed.locations[0].stepId, stepId)
        assert.equal(observed.locations[0].caseId, caseId)
        assert.equal(fs.readFileSync(testFile, 'utf8'), unchangedAssertions)

        return observed
      }

      verify(await fixture.run([caseId]), 'passed', 0)
      const file = /^(packages|apps)\//.test(relativeFile)
        ? relativeFile
        : 'apps/asyra-design/src/' + relativeFile

      if (typeof operation === 'string') {
        fixture.faultOperation(caseId, file, operation)
      } else {
        fixture.faultCase(caseId, { file, ...operation })
      }

      const failed = await fixture.run([caseId])
      const observed = verify(failed, 'failed', 1)

      assert.ok(observed.failures.length)
      const originalFailure = JSON.stringify(failed.record)

      fixture.restore()
      verify(await fixture.run([caseId]), 'passed', 0)
      assert.equal(
        JSON.stringify(
          createObservationReader(observationDirectory(fixture.repository)).get(
            failed.record.id
          )
        ),
        originalFailure
      )
    }
  )
}

test('original owner proofs cover every declared functional responsibility', () => {
  const contracts = ['functional', 'status'].flatMap((source) =>
    sourceManifestPaths(source).map((file) =>
      loadContract(root, undefined, file)
    )
  )
  const functional = contracts.filter(
    (item) => item.targetId === 'design-functional'
  )
  const steps = new Set(
    functional.flatMap((item) => item.cases.map((item) => item.stepId))
  )

  assert.deepEqual(
    [...new Set(functionalOwnerProofs.map(([step]) => step))].sort(),
    [...steps].sort()
  )
  for (const [step, id, relative] of functionalOwnerProofs) {
    const item = functional
      .flatMap((contract) => contract.cases)
      .find((item) => item.id === id)

    assert.equal(item?.stepId, step, id)
    const file = /^(packages|apps)\//.test(relative)
      ? relative
      : 'apps/asyra-design/src/' + relative

    assert.ok(item.implementationPaths.includes(file), file)
  }
})

test(
  'retained complete functional evidence preserves original expected failures',
  {
    skip: !process.env.FLOW_DESIGN_RETAINED_REPORT
  },
  () => {
    const fs = require('node:fs')
    const {
      createObservationReader,
      observationDirectory
    } = require('../localization.cjs')
    const reportPath = path.resolve(
      root,
      process.env.FLOW_DESIGN_RETAINED_REPORT
    )

    assert.ok(reportPath.startsWith(path.join(root, 'tmp') + path.sep))
    const reader = createObservationReader(observationDirectory(root))

    for (const [file, source] of [
      [reportPath, 'functional'],
      [reportPath.replace(/\.json$/, '-status.json'), 'status']
    ]) {
      const context = JSON.parse(
        fs.readFileSync(file + '.context.json', 'utf8')
      )
      const observation = reader.get(context.id)

      assert.equal(observation.phase, 'completed')
      verifyDeclaredFunctionalCases(observation, source)
      assert.ok(observation.cases.every((item) => item.resolution === 'mapped'))
      assert.deepEqual(
        observation.report,
        JSON.parse(fs.readFileSync(file, 'utf8'))
      )
      verifyOriginalFunctionalOutcomes(observation)
    }
  }
)
