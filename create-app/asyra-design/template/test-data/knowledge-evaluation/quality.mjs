import fs from 'node:fs'

export function qualityScenario(cases, id) {
  const scenario = [...cases.development, ...cases.transfer].find(
    (item) => item.id === id
  )
  if (!scenario) throw new Error('Unknown quality case')
  return {
    ...scenario,
    deadlineMs: cases.deadlineMs,
    prompt:
      scenario.prompt +
      '\n\n' +
      cases.commonInstruction +
      '\nOptional Knowledge modules: ' +
      JSON.stringify(scenario.modules) +
      '\nOptional Knowledge contexts: ' +
      JSON.stringify(scenario.contexts)
  }
}

export function withoutAdvice(markdown) {
  const match = /^(---\r?\n[\s\S]*?\r?\n---\r?\n)/.exec(markdown)
  if (!match) throw new Error('Missing admitted frontmatter')
  const metadata = JSON.parse(match[1].split(/\r?\n/).slice(1, -2).join('\n'))
  if (metadata.overrides?.length)
    throw new Error('Targeted override requires an explicit content experiment')
  return (
    match[1] +
    '\nNo additional domain advice is supplied in this evaluation condition.\n'
  )
}

/** Evaluation-only ablation. Always restore exact bytes, including on runner failure. */
export async function withAdviceFixture(files, control, operation) {
  const originals = files.map((file) => [file, fs.readFileSync(file)])
  const replacements = originals.map(([file, bytes]) => [
    file,
    withoutAdvice(bytes.toString())
  ])
  try {
    if (control)
      for (const [file, text] of replacements) fs.writeFileSync(file, text)
    return await operation()
  } finally {
    if (control)
      for (const [file, bytes] of originals) fs.writeFileSync(file, bytes)
  }
}

/** Deterministic content receipt, separate from subjective visual quality. */
export function verifyQualitySnapshot(snapshot, expected) {
  const normalize = (value) => value.trim().replace(/\s+/g, ' ')
  const props = snapshot.document.props
  const actualText = Object.values(snapshot.elements)
    .filter((element) => element.type === 'text')
    .map((element) => props[element.props.typography]?.text)
  const exactText =
    actualText.every((value) => typeof value === 'string') &&
    JSON.stringify(actualText.map(normalize).sort()) ===
      JSON.stringify(expected.text.map(normalize).sort())
  const roots = Object.values(snapshot.elements).filter(
    (element) => element.parentId === 'workspace'
  )
  const dimension =
    roots.length === 1 ? props[roots[0].props?.dimension] : undefined
  return {
    exactText,
    exactDimensions:
      dimension?.width === expected.width &&
      dimension?.height === expected.height
  }
}
