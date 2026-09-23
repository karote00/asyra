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

  for (const name of ['yarn', 'npm', 'pnpm']) {
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
if (${JSON.stringify(name)} === 'pnpm') fs.writeFileSync(path.join(process.cwd(), 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\\n')
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

for (const packageManager of ['yarn', 'npm', 'pnpm']) {
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
          npm: ['install'],
          pnpm: ['install', '--no-frozen-lockfile']
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
      assert.equal(
        fs.existsSync(
          path.join(
            projectDirectory,
            {
              yarn: 'yarn.lock',
              npm: 'package-lock.json',
              pnpm: 'pnpm-lock.yaml'
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
      assert.equal(manifest.packageManager, 'yarn@4.3.1')
      assert.doesNotMatch(
        JSON.stringify(manifest),
        /workspace:|(?:link|portal|patch):/
      )
      assert.match(result.stdout, new RegExp(`cd ${projectName}`, 'u'))
      assert.match(
        result.stdout,
        new RegExp(
          {
            yarn: 'yarn start',
            npm: 'npm run start',
            pnpm: 'pnpm start'
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

test('create-asyra-app never overwrites an existing directory', () => {
  const testDirectory = makeTempDirectory('starter-cli-existing-')
  const projectName = 'already-here'
  const target = path.join(testDirectory, projectName)

  try {
    fs.mkdirSync(target)
    fs.writeFileSync(path.join(target, 'sentinel.txt'), 'keep me\n')

    const result = runCli({
      cwd: testDirectory,
      args: [projectName, '--package-manager=yarn']
    })

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /already exists/u)
    assert.equal(
      fs.readFileSync(path.join(target, 'sentinel.txt'), 'utf8'),
      'keep me\n'
    )
    assert.equal(fs.existsSync(path.join(target, 'package.json')), false)
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
