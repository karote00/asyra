import { writeFile } from 'node:fs/promises'
import { test } from '@playwright/test'

export async function attachJsonEvidence(name: string, value: unknown) {
  const info = test.info()
  const path = info.outputPath(name + '.json')

  await writeFile(path, JSON.stringify(value))
  await info.attach(name, { contentType: 'application/json', path })
}
