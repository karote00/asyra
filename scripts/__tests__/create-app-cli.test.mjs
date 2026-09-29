import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)

const starterCliPath = path.join(
  repositoryRoot,
  'create-app/starter-app/bin/index.js'
)

const makeTempDirectory = (prefix) => {
  fs.mkdirSync(path.join(repositoryRoot, 'tmp'), { recursive: true })
  return fs.mkdtempSync(path.join(repositoryRoot, 'tmp', prefix))
}

const createFakePackageManagers = (testDirectory) => {
  const fakeBinDirectory = path.join(testDirectory, 'bin')
  const logPath = path.join(testDirectory, 'package-manager-log.jsonl')
  fs.mkdirSync(fakeBinDirectory)

  for (const name of ['yarn', 'npm']) {
    const executable = path.join(fakeBinDirectory, name)
    fs.writeFileSync(
      executable,
      `#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify({
  name: ${JSON.stringify(name)},
  args: process.argv.slice(2),
  cwd: process.cwd()
}) + '\\n')

if (${JSON.stringify(name)} === 'npm') fs.writeFileSync(path.join(process.cwd(), 'package-lock.json'), '{}\\n')
`,
      { mode: 0o755 }
    )
  }

  return {
    fakeBinDirectory,
    readLog: () =>
      fs
        .readFileSync(logPath, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
  }
}

const runCli = ({ cwd, args, env = {} }) =>
  spawnSync(process.execPath, [starterCliPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env
    }
  })

const runRealPackageManagerVersion = ({ cwd, packageManager }) =>
  spawnSync(packageManager, ['--version'], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, COREPACK_ENABLE_NETWORK: '0' }
  })

test('the successor create-asyra-app surfaces replace retired starter assertions', () => {
  for (const requiredPath of [
    'apps/starter-app',
    'create-app/starter-app',
    'release-configs/starter-app.json'
  ]) {
    assert.equal(
      fs.existsSync(path.join(repositoryRoot, requiredPath)),
      true,
      requiredPath
    )
  }

  const rootReadme = fs.readFileSync(path.join(repositoryRoot, 'README.md'), {
    encoding: 'utf8'
  })
  assert.match(rootReadme, /npm install @asyra\/core/u)
  assert.match(rootReadme, /npx create-asyra-design-app my-product/u)
})

for (const packageManager of ['yarn', 'npm']) {
  test(`create-asyra-app safely creates a ${packageManager} project`, () => {
    const testDirectory = makeTempDirectory(`starter-cli-${packageManager}-`)
    const { fakeBinDirectory, readLog } =
      createFakePackageManagers(testDirectory)
    const projectName = `${packageManager}-starter`

    try {
      const result = runCli({
        cwd: testDirectory,
        args: [projectName, `--package-manager=${packageManager}`],
        env: {
          PATH: `${fakeBinDirectory}${path.delimiter}${process.env.PATH ?? ''}`
        }
      })

      assert.equal(result.status, 0, result.stderr)
      const projectDirectory = path.join(testDirectory, projectName)
      const log = readLog()
      assert.equal(log.length, 1)
      assert.equal(log[0].name, packageManager)
      assert.equal(log[0].cwd, projectDirectory)
      assert.deepEqual(
        log[0].args,
        {
          yarn: ['install', '--no-immutable'],
          npm: ['install']
        }[packageManager]
      )

      assert.equal(
        fs.existsSync(path.join(projectDirectory, 'src/main.tsx')),
        true
      )
      assert.equal(
        fs.existsSync(path.join(projectDirectory, 'README.md')),
        true
      )
      for (const guide of [
        'AGENTS.md',
        'docs/ONBOARDING.md',
        'docs/PRIORITY_AGENT_PROMPT.md',
        'docs/PRIORITY_EXERCISE.md'
      ]) {
        const guidePath = path.join(projectDirectory, guide)
        assert.equal(fs.existsSync(guidePath), true, guide)
        assert.doesNotMatch(
          fs.readFileSync(guidePath, 'utf8'),
          /\.\.\/\.\.\/packages|apps\/starter-app|yarn workspace|yarn release:app|tmp\/framework/u,
          guide
        )
      }
      for (const guide of [
        'AGENTS.md',
        'docs/ONBOARDING.md',
        'docs/PRIORITY_AGENT_PROMPT.md'
      ]) {
        assert.match(
          fs.readFileSync(path.join(projectDirectory, guide), 'utf8'),
          /package manager declared in `package\.json`/u,
          `${guide} must use the generated project's package manager`
        )
      }
      const agentGuide = fs.readFileSync(
        path.join(projectDirectory, 'AGENTS.md'),
        'utf8'
      )
      for (const script of ['test', 'typecheck', 'lint', 'react:build']) {
        assert.match(agentGuide, new RegExp(`yarn ${script}`, 'u'))
        assert.match(agentGuide, new RegExp(`npm run ${script}`, 'u'))
      }
      assert.equal(
        fs.existsSync(
          path.join(
            projectDirectory,
            {
              yarn: 'yarn.lock',
              npm: 'package-lock.json'
            }[packageManager]
          )
        ),
        true
      )
      if (packageManager === 'yarn') {
        assert.equal(
          fs.readFileSync(path.join(projectDirectory, '.yarnrc.yml'), 'utf8'),
          'nodeLinker: node-modules\nenableTransparentWorkspaces: false\n'
        )
      }

      const manifest = JSON.parse(
        fs.readFileSync(path.join(projectDirectory, 'package.json'), 'utf8')
      )
      assert.equal(
        manifest.scripts['react:build'],
        {
          yarn: 'yarn build',
          npm: 'npm run build'
        }[packageManager]
      )
      if (packageManager === 'yarn') {
        assert.equal(manifest.packageManager, 'yarn@4.3.1')
      } else {
        assert.equal(manifest.packageManager, 'npm@10.8.2')
      }
      assert.doesNotMatch(
        JSON.stringify(manifest),
        /workspace:|(?:link|portal|patch):/
      )
      const readme = fs.readFileSync(
        path.join(projectDirectory, 'README.md'),
        'utf8'
      )
      assert.doesNotMatch(readme, /pnpm/u)
      for (const command of {
        yarn: [
          'yarn install',
          'yarn test',
          'yarn typecheck',
          'yarn lint',
          'yarn react:build',
          'yarn start'
        ],
        npm: [
          'npm install',
          'npm test',
          'npm run typecheck',
          'npm run lint',
          'npm run react:build',
          'npm run start'
        ]
      }[packageManager]) {
        assert.match(readme, new RegExp(command.replaceAll(' ', '\\s+'), 'u'))
      }
      if (packageManager !== 'yarn') {
        const versionResult = runRealPackageManagerVersion({
          cwd: projectDirectory,
          packageManager
        })
        assert.equal(
          versionResult.status,
          0,
          `${packageManager} --version failed:\n${versionResult.stderr}`
        )
      }
      assert.match(result.stdout, new RegExp(`cd ${projectName}`, 'u'))
      assert.match(
        result.stdout,
        new RegExp(
          {
            yarn: 'yarn start',
            npm: 'npm run start'
          }[packageManager],
          'u'
        )
      )
      assert.match(result.stdout, /http:\/\/localhost:5192/u)
    } finally {
      fs.rmSync(testDirectory, { recursive: true, force: true })
    }
  })
}

test('create-asyra-app rejects pnpm before creating a project', () => {
  const testDirectory = makeTempDirectory('starter-cli-pnpm-unsupported-')
  try {
    const help = runCli({ cwd: testDirectory, args: ['--help'] })
    assert.equal(help.status, 0, help.stderr)
    assert.match(help.stdout, /--package-manager=yarn\|npm/u)
    assert.doesNotMatch(help.stdout, /pnpm/u)
    const cliReadme = fs.readFileSync(
      path.join(repositoryRoot, 'create-app/starter-app/README.md'),
      'utf8'
    )
    assert.match(cliReadme, /`yarn` and `npm`/u)
    assert.doesNotMatch(cliReadme, /pnpm/u)

    const result = runCli({
      cwd: testDirectory,
      args: ['starter', '--package-manager=pnpm']
    })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /Unsupported package manager "pnpm"/u)
    assert.match(result.stderr, /Choose yarn or npm/u)
    assert.deepEqual(fs.readdirSync(testDirectory), [])
  } finally {
    fs.rmSync(testDirectory, { recursive: true, force: true })
  }
})

test('create-asyra-app rejects unsafe names before creating files', () => {
  const emptyNameDirectory = makeTempDirectory('starter-cli-empty-name-')
  try {
    const result = spawnSync(process.execPath, [starterCliPath], {
      cwd: emptyNameDirectory,
      encoding: 'utf8',
      input: '\n'
    })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /project name/u)
    assert.deepEqual(fs.readdirSync(emptyNameDirectory), [])
  } finally {
    fs.rmSync(emptyNameDirectory, { recursive: true, force: true })
  }

  const invalidNames = ['.', '..', '../escape', 'nested/app']

  for (const invalidName of invalidNames) {
    const testDirectory = makeTempDirectory('starter-cli-invalid-')
    try {
      const result = runCli({
        cwd: testDirectory,
        args: [invalidName, '--package-manager=yarn']
      })
      assert.notEqual(result.status, 0, invalidName)
      assert.match(result.stderr, /project name/u)
      assert.deepEqual(fs.readdirSync(testDirectory), [])
    } finally {
      fs.rmSync(testDirectory, { recursive: true, force: true })
    }
  }

  const absoluteNameDirectory = makeTempDirectory('starter-cli-absolute-name-')
  try {
    const result = runCli({
      cwd: absoluteNameDirectory,
      args: [
        path.join(absoluteNameDirectory, 'absolute'),
        '--package-manager=yarn'
      ]
    })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /project name/u)
    assert.deepEqual(fs.readdirSync(absoluteNameDirectory), [])
  } finally {
    fs.rmSync(absoluteNameDirectory, { recursive: true, force: true })
  }
})

test('create-asyra-app never overwrites existing targets', () => {
  for (const targetType of ['directory', 'file', 'symlink']) {
    const testDirectory = makeTempDirectory(
      `starter-cli-existing-${targetType}-`
    )
    const projectName = 'already-here'
    const target = path.join(testDirectory, projectName)
    const foreignDirectory = path.join(testDirectory, 'foreign-owner')
    const foreignSentinel = path.join(foreignDirectory, 'sentinel.txt')

    try {
      if (targetType === 'directory') {
        fs.mkdirSync(target)
        fs.writeFileSync(path.join(target, 'sentinel.txt'), 'keep me\n')
      } else if (targetType === 'file') {
        fs.writeFileSync(target, 'keep me\n')
      } else {
        fs.mkdirSync(foreignDirectory)
        fs.writeFileSync(foreignSentinel, 'keep foreign target\n')
        fs.symlinkSync(foreignDirectory, target, 'dir')
      }

      const result = runCli({
        cwd: testDirectory,
        args: [projectName, '--package-manager=yarn']
      })

      assert.notEqual(result.status, 0, targetType)
      assert.match(result.stderr, /already exists/u)
      if (targetType === 'directory') {
        assert.equal(
          fs.readFileSync(path.join(target, 'sentinel.txt'), 'utf8'),
          'keep me\n'
        )
        assert.equal(fs.existsSync(path.join(target, 'package.json')), false)
      } else if (targetType === 'file') {
        assert.equal(fs.readFileSync(target, 'utf8'), 'keep me\n')
      } else {
        assert.equal(
          fs.readFileSync(foreignSentinel, 'utf8'),
          'keep foreign target\n'
        )
      }
    } finally {
      fs.rmSync(testDirectory, { recursive: true, force: true })
    }
  }
})

test('create-asyra-app cleans up only its owned reservation after copy failures', () => {
  const testDirectory = makeTempDirectory('starter-cli-copy-failure-')
  const foreignDirectory = path.join(testDirectory, 'foreign-owner')
  const foreignSentinel = path.join(foreignDirectory, 'sentinel.txt')

  try {
    fs.mkdirSync(foreignDirectory)
    fs.writeFileSync(foreignSentinel, 'keep foreign owner\n')
    const result = runCli({
      cwd: testDirectory,
      args: ['starter', '--package-manager=yarn'],
      env: {
        STARTER_APP_TEST_FAIL_AFTER_RESERVE: '1'
      }
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /failed to create project files/u)
    assert.equal(fs.existsSync(path.join(testDirectory, 'starter')), false)
    assert.equal(
      fs.readFileSync(foreignSentinel, 'utf8'),
      'keep foreign owner\n'
    )
  } finally {
    fs.rmSync(testDirectory, { recursive: true, force: true })
  }
})

test('create-asyra-app reports unsupported package managers and install failures', () => {
  const unsupportedDirectory = makeTempDirectory('starter-cli-unsupported-')
  try {
    const result = runCli({
      cwd: unsupportedDirectory,
      args: ['starter', '--package-manager=bun']
    })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /Unsupported package manager/u)
    assert.equal(
      fs.existsSync(path.join(unsupportedDirectory, 'starter')),
      false
    )
  } finally {
    fs.rmSync(unsupportedDirectory, { recursive: true, force: true })
  }

  const installDirectory = makeTempDirectory('starter-cli-install-fails-')
  const fakeBinDirectory = path.join(installDirectory, 'bin')
  fs.mkdirSync(fakeBinDirectory)
  fs.writeFileSync(
    path.join(fakeBinDirectory, 'yarn'),
    '#!/usr/bin/env node\nprocess.exit(42)\n',
    { mode: 0o755 }
  )
  try {
    const result = runCli({
      cwd: installDirectory,
      args: ['starter', '--package-manager=yarn'],
      env: {
        PATH: `${fakeBinDirectory}${path.delimiter}${process.env.PATH ?? ''}`
      }
    })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /failed to install dependencies/u)
    assert.match(result.stderr, /yarn install/u)
    assert.equal(fs.existsSync(path.join(installDirectory, 'starter')), true)
  } finally {
    fs.rmSync(installDirectory, { recursive: true, force: true })
  }
})

test('create-asyra-app reports a missing bundled template', () => {
  const testDirectory = makeTempDirectory('starter-cli-missing-template-')
  const packageDirectory = path.join(testDirectory, 'package')
  const binDirectory = path.join(packageDirectory, 'bin')

  try {
    fs.mkdirSync(binDirectory, { recursive: true })
    fs.copyFileSync(starterCliPath, path.join(binDirectory, 'index.js'))
    const result = spawnSync(
      process.execPath,
      [path.join(binDirectory, 'index.js'), 'starter'],
      {
        cwd: testDirectory,
        encoding: 'utf8'
      }
    )
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /template directory not found/u)
    assert.equal(fs.existsSync(path.join(testDirectory, 'starter')), false)
  } finally {
    fs.rmSync(testDirectory, { recursive: true, force: true })
  }
})

test('packed create-asyra-app restores the packable gitignore asset', () => {
  const testDirectory = makeTempDirectory('starter-cli-packed-')
  const packDirectory = path.join(testDirectory, 'pack')
  const extractDirectory = path.join(testDirectory, 'extract')
  const generateDirectory = path.join(testDirectory, 'generated')
  const { fakeBinDirectory } = createFakePackageManagers(testDirectory)

  try {
    fs.mkdirSync(packDirectory)
    fs.mkdirSync(extractDirectory)
    fs.mkdirSync(generateDirectory)

    const packResult = spawnSync(
      'npm',
      [
        'pack',
        path.join(repositoryRoot, 'create-app/starter-app'),
        '--json',
        '--pack-destination',
        packDirectory
      ],
      {
        cwd: testDirectory,
        encoding: 'utf8'
      }
    )
    assert.equal(packResult.status, 0, packResult.stderr)
    const [packRecord] = JSON.parse(packResult.stdout)
    assert.ok(
      packRecord.files.some((file) => file.path === 'template/gitignore')
    )
    assert.ok(
      packRecord.files.some((file) => file.path === 'template/AGENTS.md')
    )
    assert.ok(
      packRecord.files.some(
        (file) => file.path === 'template/docs/PRIORITY_AGENT_PROMPT.md'
      )
    )
    assert.equal(
      packRecord.files.some((file) => file.path === 'template/.gitignore'),
      false
    )

    const tarballPath = path.join(packDirectory, packRecord.filename)
    const tarResult = spawnSync(
      'tar',
      ['-xzf', tarballPath, '-C', extractDirectory],
      {
        encoding: 'utf8'
      }
    )
    assert.equal(tarResult.status, 0, tarResult.stderr)

    const packedCliPath = path.join(extractDirectory, 'package/bin/index.js')
    const result = spawnSync(
      process.execPath,
      [packedCliPath, 'packed-starter', '--package-manager=yarn'],
      {
        cwd: generateDirectory,
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${fakeBinDirectory}${path.delimiter}${process.env.PATH ?? ''}`
        }
      }
    )
    assert.equal(result.status, 0, result.stderr)

    const generatedProject = path.join(generateDirectory, 'packed-starter')
    assert.equal(
      fs.readFileSync(path.join(generatedProject, '.gitignore'), 'utf8'),
      fs.readFileSync(
        path.join(repositoryRoot, 'apps/starter-app/.gitignore'),
        'utf8'
      )
    )
    assert.equal(fs.existsSync(path.join(generatedProject, 'gitignore')), false)
  } finally {
    fs.rmSync(testDirectory, { recursive: true, force: true })
  }
})
