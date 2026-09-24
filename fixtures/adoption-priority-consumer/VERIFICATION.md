# Independent priority onboarding verification

- Source: `origin/main` at `e550e87b29824f72a1430eb34eac98f18c33235d`.
- Generator: local `create-app/starter-app/bin/index.js priority-consumer --package-manager=yarn` in project `tmp/adoption-onboarding/`. This did not publish or install the CLI from npm.
- Read before editing: this generated project's `AGENTS.md`, `docs/ONBOARDING.md`, `docs/PRIORITY_AGENT_PROMPT.md`, then the referenced Item domain, runtime, projection, storage, UI, and opt-in priority example/test. The priority prompt was used unchanged. No separate human hint was needed.
- Kept source: this complete generated consumer, including its default-on priority edit and permanent tests. `node_modules`, lockfile, build output, and tarballs are omitted.

For the local packed proof, `yarn release:packages` produced 19 tarballs under
project `tmp/framework-release-artifacts/`. The CLI-generated copy under
`tmp/adoption-onboarding/priority-consumer/` then used Yarn `file:`
resolutions for all 19 `@asyra/*` tarballs, following the existing
`scripts/release-template-readiness.js` consumer convention. The generated
consumer's `package.json` kept its `yarn@4.3.1` declaration; no workspace
dependency or source alias was added. Its installed `@asyra/*` packages were
ordinary directories, and `@asyra/core` resolved from a file tarball in the
lockfile. Copy this fixture's `src/` into that generated copy to reproduce the
post-change checks.

Before implementation, the new runtime and UI tests failed in three cases:
the default App rejected a priority field as `Unsupported Item field` in two
runtime cases, and the UI had no Priority control. After implementation,
`yarn test` passed 21/21 tests across five files, including the unchanged
opt-in example and title/status/drag tests. `yarn typecheck`, `yarn lint`,
and `yarn react:build` passed. The added rejection case also proves a pending
Redo remains usable after invalid saved data is rejected. A live local page showed Normal on creation,
High after editing, Normal after Undo, High after Redo, and saved High after
changing to Low then Reloading. The visible layout was inspected.

No blocker in the documented public App path required a Framework or canonical
Starter change. This is a local CLI generation and packed Framework consumer
verification. It does not prove an npm-registry-installed `create-asyra-app`,
registry distribution of this edited consumer, publication, or deployment.
