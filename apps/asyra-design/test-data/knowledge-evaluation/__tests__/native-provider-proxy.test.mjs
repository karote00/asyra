import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { setTimeout, clearTimeout } from 'node:timers'
import { resolve, join } from 'node:path'
import process from 'node:process'

const root = resolve(import.meta.dirname, '../../../../..')

test('native fixture propagates child exit while the App input pipe remains open', async () => {
  await mkdir(join(root, 'tmp'), { recursive: true })
  const directory = await mkdtemp(join(root, 'tmp/native-proxy-exit-'))
  const config = join(directory, 'proxy.json')

  await writeFile(
    config,
    JSON.stringify({
      executable: process.execPath,
      directory,
      protocol: join(directory, 'app.jsonl'),
      nativeProtocol: join(directory, 'native.jsonl'),
      processes: join(directory, 'processes.jsonl'),
      endpoint: 'http://127.0.0.1:1/v1'
    })
  )
  const child = spawn(
    process.execPath,
    [
      resolve(import.meta.dirname, '../native-provider-proxy.mjs'),
      config,
      'app-server'
    ],
    { stdio: ['pipe', 'pipe', 'pipe'] }
  )
  let timer

  try {
    child.stdout.resume()
    child.stderr.resume()
    const closed = new Promise((resolve) =>
      child.once('close', (code, signal) => resolve({ code, signal }))
    )
    const deadline = new Promise((resolve) => {
      timer = setTimeout(() => resolve('did-not-close'), 3000)
    })

    assert.deepEqual(await Promise.race([closed, deadline]), {
      code: 1,
      signal: null
    })
  } finally {
    clearTimeout(timer)
    if (child.exitCode === null && child.signalCode === null) {
      const closed = new Promise((resolve) => child.once('close', resolve))

      child.kill('SIGKILL')
      await closed
    }

    await rm(directory, { recursive: true, force: true })
  }
})

test('concurrent provider probes use request-owned native state directories', async () => {
  await mkdir(join(root, 'tmp'), { recursive: true })
  const directory = await mkdtemp(join(root, 'tmp/native-proxy-isolation-'))
  const config = join(directory, 'proxy.json')

  await writeFile(
    config,
    JSON.stringify({
      executable: process.execPath,
      directory,
      protocol: join(directory, 'app.jsonl'),
      nativeProtocol: join(directory, 'native.jsonl'),
      processes: join(directory, 'processes.jsonl'),
      endpoint: 'http://127.0.0.1:1/v1'
    })
  )
  const launches = [0, 1].map(() => {
    const child = spawn(
      process.execPath,
      [
        resolve(import.meta.dirname, '../native-provider-proxy.mjs'),
        config,
        '-e',
        'process.stdout.write(JSON.stringify({home:process.env.CODEX_HOME,cwd:process.cwd()}))'
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] }
    )
    let output = ''

    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.stderr.resume()
    child.stdin.end()

    return new Promise((accept, reject) => {
      child.on('error', reject)
      child.on('close', (code) => {
        try {
          assert.equal(code, 0)
          accept(JSON.parse(output))
        } catch (error) {
          reject(error)
        }
      })
    })
  })

  try {
    const states = await Promise.all(launches)

    assert.equal(new Set(states.map((state) => state.home)).size, 2)
    for (const state of states) {
      assert.ok(state.home.startsWith(directory + '/'))
      assert.equal(state.cwd, directory)
    }
  } finally {
    await Promise.allSettled(launches)
    await rm(directory, { recursive: true, force: true })
  }
})

test('native conversation processes retain history while separate fixtures remain isolated', async () => {
  await mkdir(join(root, 'tmp'), { recursive: true })
  const directories = await Promise.all(
    [0, 1].map(() => mkdtemp(join(root, 'tmp/native-proxy-history-')))
  )

  const launch = async (directory) => {
    const executable = join(directory, 'native-fixture.mjs')

    await writeFile(
      executable,
      `#!${process.execPath}\nprocess.stdout.write(JSON.stringify({ home: process.env.CODEX_HOME }) + '\\n')\n`,
      { mode: 0o700 }
    )
    const config = join(directory, 'proxy.json')

    await writeFile(
      config,
      JSON.stringify({
        executable,
        directory,
        protocol: join(directory, 'app.jsonl'),
        nativeProtocol: join(directory, 'native.jsonl'),
        processes: join(directory, 'processes.jsonl'),
        endpoint: 'http://127.0.0.1:1/v1'
      })
    )
    const child = spawn(
      process.execPath,
      [
        resolve(import.meta.dirname, '../native-provider-proxy.mjs'),
        config,
        'app-server'
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] }
    )
    let output = ''

    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.stderr.resume()
    const closed = new Promise((accept, reject) => {
      child.on('error', reject)
      child.on('close', (code) => {
        try {
          assert.equal(code, 0)
          accept(JSON.parse(output))
        } catch (error) {
          reject(error)
        }
      })
    })

    child.stdin.end()

    return closed
  }

  try {
    const first = await launch(directories[0])
    const second = await launch(directories[0])
    const unrelated = await launch(directories[1])

    assert.equal(first.home, second.home)
    assert.notEqual(first.home, unrelated.home)
    assert.equal(first.home, directories[0] + '/native-state')
  } finally {
    await Promise.all(
      directories.map((directory) =>
        rm(directory, { recursive: true, force: true })
      )
    )
  }
})
