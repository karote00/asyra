#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supportedPackageManagers = ['yarn', 'npm']
const lockfileByPackageManager = {
  yarn: 'yarn.lock',
  npm: 'package-lock.json'
}
const installArgumentsByPackageManager = {
  yarn: ['install', '--no-immutable'],
  npm: ['install']
}
const installCommandByPackageManager = {
  yarn: 'yarn install',
  npm: 'npm install'
}
const startCommandByPackageManager = {
  yarn: 'yarn start',
  npm: 'npm run start'
}
const reactBuildScriptByPackageManager = {
  yarn: 'yarn build',
  npm: 'npm run build'
}
const manifestPackageManagerByPackageManager = {
  yarn: 'yarn@4.3.1',
  npm: 'npm@10.8.2'
}
const readmeCommandsByPackageManager = {
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
}

const usage = `Usage: create-asyra-app <project-name> [--package-manager=yarn|npm]

Creates one standalone Starter App directory from the bundled template.`

function parseArguments(argv) {
  const args = argv.slice(2)
  let packageManager
  let targetName

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--help' || argument === '-h') {
      return { help: true }
    }
    if (argument === '--package-manager') {
      packageManager = args[index + 1]
      index += 1
      continue
    }
    if (argument?.startsWith('--package-manager=')) {
      packageManager = argument.slice('--package-manager='.length)
      continue
    }
    if (argument?.startsWith('-')) {
      return { error: `Unknown option: ${argument}` }
    }
    if (targetName !== undefined) {
      return { error: 'Expected exactly one project directory name.' }
    }
    targetName = argument
  }

  return { packageManager, targetName }
}

function isSafeTargetName(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim() &&
    value !== '.' &&
    value !== '..' &&
    !path.isAbsolute(value) &&
    path.basename(value) === value &&
    !value.includes('/') &&
    !value.includes('\\')
  )
}

async function promptForTargetName() {
  const prompt = createInterface({ input, output })
  try {
    return await prompt.question('Project name: ')
  } finally {
    prompt.close()
  }
}

function assertPackageManager(packageManager) {
  if (supportedPackageManagers.includes(packageManager)) return
  throw new Error(
    `Unsupported package manager "${packageManager}". Choose yarn or npm.`
  )
}

function writePackageManagerFiles(targetDir, packageManager) {
  const manifestPath = path.join(targetDir, 'package.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.scripts = {
    ...manifest.scripts,
    'react:build': reactBuildScriptByPackageManager[packageManager]
  }
  manifest.packageManager =
    manifestPackageManagerByPackageManager[packageManager]
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const readmePath = path.join(targetDir, 'README.md')
  if (fs.existsSync(readmePath)) {
    const commands = readmeCommandsByPackageManager[packageManager].join('\n')
    const readme = fs
      .readFileSync(readmePath, 'utf8')
      .replace(
        /```bash\n(?:yarn|npm)[\s\S]*?(?:yarn|npm run) start\n```/u,
        `\`\`\`bash\n${commands}\n\`\`\``
      )
    fs.writeFileSync(readmePath, readme)
  }

  const packableGitignorePath = path.join(targetDir, 'gitignore')
  const gitignorePath = path.join(targetDir, '.gitignore')
  if (!fs.existsSync(gitignorePath) && fs.existsSync(packableGitignorePath)) {
    fs.copyFileSync(packableGitignorePath, gitignorePath)
  }
  if (fs.existsSync(packableGitignorePath)) {
    fs.rmSync(packableGitignorePath)
  }

  if (packageManager === 'yarn') {
    fs.writeFileSync(
      path.join(targetDir, lockfileByPackageManager[packageManager]),
      ''
    )
    fs.writeFileSync(
      path.join(targetDir, '.yarnrc.yml'),
      'nodeLinker: node-modules\nenableTransparentWorkspaces: false\n'
    )
  }
}

function copyTemplateContents(templateDir, targetDir) {
  for (const entry of fs.readdirSync(templateDir, { withFileTypes: true })) {
    fs.cpSync(
      path.join(templateDir, entry.name),
      path.join(targetDir, entry.name),
      {
        recursive: true,
        force: false,
        errorOnExist: true
      }
    )
  }
}

function installDependencies(targetDir, packageManager) {
  const result = spawnSync(
    packageManager,
    installArgumentsByPackageManager[packageManager],
    {
      cwd: targetDir,
      stdio: 'inherit'
    }
  )

  if (result.error) {
    throw new Error(result.error.message)
  }
  if (result.status !== 0) {
    throw new Error(`${installCommandByPackageManager[packageManager]} failed`)
  }
}

async function main() {
  const parsed = parseArguments(process.argv)
  if (parsed.help) {
    console.log(usage)
    return
  }
  if (parsed.error) {
    console.error(`Error: ${parsed.error}`)
    console.error(usage)
    process.exit(1)
  }

  let { packageManager = 'yarn', targetName } = parsed
  if (!targetName) targetName = await promptForTargetName()

  if (!isSafeTargetName(targetName)) {
    console.error('Error: project name must be one new directory name.')
    process.exit(1)
  }

  try {
    assertPackageManager(packageManager)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }

  const cwd = process.cwd()
  const targetDir = path.resolve(cwd, targetName)
  const templateDir = path.resolve(__dirname, '../template')

  if (!fs.existsSync(templateDir)) {
    console.error(`Error: template directory not found: ${templateDir}`)
    process.exit(1)
  }
  console.log(`Creating Asyra Starter App in ${targetName}`)
  let ownsTarget = false
  try {
    fs.mkdirSync(targetDir, { mode: 0o755 })
    ownsTarget = true
    if (process.env.STARTER_APP_TEST_FAIL_AFTER_RESERVE === '1') {
      throw new Error('test copy failure after target reservation')
    }
    copyTemplateContents(templateDir, targetDir)
    writePackageManagerFiles(targetDir, packageManager)
  } catch (error) {
    if (ownsTarget) {
      fs.rmSync(targetDir, { recursive: true, force: true })
    }
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error.code === 'EEXIST' || error.code === 'ENOTDIR')
    ) {
      console.error(`Error: directory "${targetName}" already exists.`)
      process.exit(1)
    }
    console.error(`Error: failed to create project files: ${error.message}`)
    process.exit(1)
  }

  try {
    console.log(`Installing dependencies with ${packageManager}`)
    installDependencies(targetDir, packageManager)
  } catch (error) {
    console.error(`Error: failed to install dependencies: ${error.message}`)
    console.error('You can retry manually:')
    console.error(`  cd ${targetName}`)
    console.error(`  ${installCommandByPackageManager[packageManager]}`)
    process.exit(1)
  }

  console.log('\nStarter App is ready.\n')
  console.log('Next steps:')
  console.log(`  cd ${targetName}`)
  console.log(`  ${startCommandByPackageManager[packageManager]}`)
  console.log('  Open http://localhost:5192')
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
