/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { loadContract } = require('../contracts.cjs')

// Proof inputs only: runtime modules are captured from the actual repository.
function appRuntimeFixture(root, directory) {
  const prefix = path.relative(root, directory)
  const files = {
    manifestPath: prefix + '/flow-contracts.json',
    architecturePath: prefix + '/architecture.cjs',
    specPath: prefix + '/spec.md',
    testFile: prefix + '/app-proof.test.ts',
    configFile: prefix + '/config.ts'
  }
  const schedulerFile = 'apps/asyra-design/server/local-tool-scheduler.ts'
  const validatorFile = 'apps/asyra-design/src/ai/design-fill.ts'
  const constantsFile = 'packages/utils/src/propsManager/fills.ts'
  const stepOrder = { schedule: 1, metadata: 2, validate: 3 }
  const step = (id, ownerPackage, file, inputs, outputs) => ({
    id,
    order: stepOrder[id],
    laneId: 'runtime',
    title: id,
    ownerPackage,
    purpose: 'Verify captured ' + id + ' behavior.',
    inputs,
    outputs,
    conditions: ['Use the actual captured module.'],
    bypasses: ['Missing runtime cannot pass.'],
    allowedContributors: ['Captured runtime and installed dependencies'],
    forbiddenContributors: ['Mocks and mutable dist output'],
    implementationBoundary: [file],
    specRefs: ['#app-source-proof'],
    failureOwnerStepId: id
  })
  const architecture = {
    schema: { id: 'flow-inspector', version: 2 },
    target: {
      id: 'app-source-proof',
      kind: 'app',
      title: 'App Source Proof',
      subtitle: 'Private App server and package integration'
    },
    authority: {
      specPath: files.specPath,
      inspectorPath: files.architecturePath,
      semanticOwner: 'App Source Proof',
      inspectorOwner: 'Flow Inspector tests'
    },
    links: [],
    lanes: [{ id: 'runtime', title: 'Runtime', order: 1 }],
    steps: [
      step(
        'schedule',
        '@asyra/asyra-design',
        schedulerFile,
        ['queued work'],
        ['artifact:scheduled']
      ),
      step(
        'metadata',
        '@asyra/utils',
        constantsFile,
        ['gradient kind'],
        ['artifact:gradient-kind']
      ),
      step(
        'validate',
        '@asyra/asyra-design',
        validatorFile,
        ['artifact:gradient-kind'],
        ['artifact:validated']
      )
    ],
    artifacts: [
      {
        id: 'artifact:scheduled',
        ownerStepId: 'schedule',
        consumerStepIds: [],
        terminal: true
      },
      {
        id: 'artifact:gradient-kind',
        ownerStepId: 'metadata',
        consumerStepIds: ['validate']
      },
      {
        id: 'artifact:validated',
        ownerStepId: 'validate',
        consumerStepIds: [],
        terminal: true
      }
    ],
    routes: [
      {
        id: 'scheduled',
        from: 'schedule',
        to: null,
        producedArtifacts: ['artifact:scheduled'],
        predicate: 'Queued work settles.'
      },
      {
        id: 'metadata-to-validator',
        from: 'metadata',
        to: 'validate',
        producedArtifacts: ['artifact:gradient-kind'],
        predicate: 'Canonical kind reaches App validation.'
      },
      {
        id: 'validated',
        from: 'validate',
        to: null,
        producedArtifacts: ['artifact:validated'],
        predicate: 'Validation settles.'
      }
    ],
    invariants: [],
    acceptanceContracts: []
  }
  const manifest = {
    version: 2,
    ...files,
    targetId: architecture.target.id,
    negativeCaseIds: ['app.gradient'],
    externalInputs: [],
    workspaceSources: [
      {
        name: '@asyra/asyra-design',
        inputs: ['src/**', 'server/**'],
        entry: null
      },
      {
        name: '@asyra/design-system',
        inputs: ['src/**'],
        entry: 'src/index.tsx'
      }
    ],
    flows: [
      {
        id: 'app-source-integration',
        title: 'Execute App source integration',
        goal: 'Server scheduling and Utils-backed App validation execute from one captured source.',
        stepIds: ['schedule', 'metadata', 'validate'],
        cases: [
          {
            id: 'app.schedule',
            stepId: 'schedule',
            testName: 'App source proof server scheduling'
          },
          {
            id: 'package.kind',
            stepId: 'metadata',
            testName: 'App source proof canonical gradient kind'
          },
          {
            id: 'app.gradient',
            stepId: 'validate',
            testName: 'App source proof gradient admission'
          }
        ],
        handoffs: [
          {
            routeId: 'metadata-to-validator',
            decision: 'required',
            caseIds: ['app.gradient']
          }
        ]
      }
    ],
    defaultNegativeScenario: 'reject-gradient',
    scenarios: [
      { id: 'baseline', title: 'Actual runtime', expectedFailedCaseIds: [] },
      {
        id: 'reject-gradient',
        title: 'Reject valid gradient',
        expectedFailedCaseIds: ['app.gradient'],
        mutation: {
          file: validatorFile,
          from: 'const gradientTypes = [FillGradientTypes.LINEAR]',
          to: 'const gradientTypes = []'
        }
      }
    ]
  }
  const relativeImport = (file) =>
    JSON.stringify(path.relative(directory, path.join(root, file)))
  const tests = `import { describe, expect, it } from 'vitest';
import { createLocalToolScheduler } from ${relativeImport(schedulerFile)};
import { isDesignGradient } from ${relativeImport(validatorFile)};
import { FillGradientTypes } from '@asyra/utils';
describe('App source proof', () => {
  it('server scheduling', async () => {
    const schedule = createLocalToolScheduler(new AbortController().signal);
    const seen = [];
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const first = schedule(false, async () => { seen.push('start'); await gate; seen.push('end'); });
    const second = schedule(true, async () => { seen.push('read'); });
    await Promise.resolve(); await Promise.resolve();
    expect(seen).toEqual(['start']);
    release(); await Promise.all([first, second]);
    expect(seen).toEqual(['start', 'end', 'read']);
  });
  it('canonical gradient kind', () => { expect(FillGradientTypes.LINEAR).toBe('linear'); });
  it('gradient admission', () => {
    const input = { gradientType: FillGradientTypes.LINEAR,
      gradientHandles: [{x:0,y:0},{x:1,y:1}],
      gradientStops: [{position:0,color:'#112233',opacity:1},{position:1,color:'#ffffff',opacity:1}] };
    expect(isDesignGradient(input)).toBe(true);
    expect(isDesignGradient({...input,gradientType:'unsupported'})).toBe(false);
  });
});`
  const configuration = `import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.env.FLOW_PROOF_SOURCE;
const manifest = JSON.parse(readFileSync(resolve(root, ${JSON.stringify(files.manifestPath)}), 'utf8'));
const scenario = manifest.scenarios.find(s => s.id === process.env.FLOW_PROOF_SCENARIO);
if (!scenario) throw new Error('Unknown scenario');
export default {
 plugins: [{name:'registered-runtime-mutation',enforce:'pre',transform(code,id) {
   const mutation = scenario.mutation;
   if (!mutation || id !== resolve(root, mutation.file)) return;
   if (code.split(mutation.from).length !== 2) throw new Error('Mutation site changed');
   return {code:code.replace(mutation.from,mutation.to),map:null};
 }}],
 test: { environment:'node',include:[resolve(root,${JSON.stringify(files.testFile)})],fileParallelism:false }
};`
  const write = (file, content) =>
    fs.writeFileSync(path.join(root, file), content)
  write(files.manifestPath, JSON.stringify(manifest))
  write(
    files.architecturePath,
    'module.exports = ' + JSON.stringify(architecture)
  )
  write(
    files.specPath,
    '# App source proof\nActual App scheduling and Utils-backed gradient validation.\n'
  )
  write(files.testFile, tests)
  write(files.configFile, configuration)
  return loadContract(root, undefined, files.manifestPath)
}

module.exports = { appRuntimeFixture }
