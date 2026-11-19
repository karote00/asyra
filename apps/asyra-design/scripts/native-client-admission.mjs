import process from 'node:process'
import { accessSync, constants } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { isAbsolute } from 'node:path'

// This version owns the native protocol fixtures, not the production provider.
export const nativeTestClientVersion = 'codex-cli 0.160.0'

/** @param {{ NATIVE_DELIVERY_CODEX?: string }} environment */
export function resolveNativeTestExecutable(environment = process.env) {
  const executable = environment.NATIVE_DELIVERY_CODEX?.trim()

  if (!executable) {
    return
  }

  if (!isAbsolute(executable)) {
    throw Error(
      'Native test executable is unavailable: use an explicit absolute path'
    )
  }

  try {
    accessSync(executable, constants.X_OK)
  } catch (cause) {
    throw Error('Native test executable is unavailable: ' + executable, {
      cause
    })
  }

  let version

  try {
    version = execFileSync(executable, ['--version'], {
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 65536,
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  } catch (cause) {
    throw Error('Native test executable version check failed: ' + executable, {
      cause
    })
  }

  if (version !== nativeTestClientVersion) {
    throw Error(
      `Native test executable version mismatch: expected ${nativeTestClientVersion}, received ${version}`
    )
  }

  return executable
}
