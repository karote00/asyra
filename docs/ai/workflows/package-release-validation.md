# Package and Release Validation

This workflow owns the repository automation contract between workspace
manifests, Turbo, generated app templates, CI, and the explicit release
command.

## PR Checks and App Deployment

PR validation is independent of hosting. Ready PRs require `validate`,
`framework-release-readiness`, `e2e-tests`, `collaboration-e2e-tests`, and
`production-artifact-tests`. `validate` is the total aggregation check;
`shared-validation` supplies its common prerequisites and runs the conditional
create-app package archive check. Framework release readiness is selected for
affected Framework packages and release-validation owner scripts. Draft jobs
remain deferred until ready for review.
Vercel statuses from older Git-integrated deployments are historical evidence,
not merge prerequisites or proof that CI passed.

The three hosted Apps use the explicit [manual App release workflow](manual-app-release.md).
Their Git connections are removed during cutover, and repository configurations
also disable automatic Git deployment. A push, PR or merge does not request an
App deployment. Package registry publication remains a separate workflow.

## Workspace Build Graph and CI Scope

Each framework package keeps its canonical package-specific build command,
such as `build:factory` or `build:collaboration`. Asyra Design uses
`react:build`.

`scripts/gen-turbo.js` derives package-qualified Turbo tasks and exact
package-qualified dependencies from workspace manifests. A dependency edge has
the form:

```text
@asyra/asyra-design#react:build
-> @asyra/collaboration#build:collaboration
```

Package-specific task names must not use a `^build:<package>` dependency.
Turbo interprets `^` as the named task on every dependency package, which is
not the Asyra package-specific task contract.

`scripts/ci-relationships.json` is the single CI relationship policy.
`scripts/ci-scope.mjs` discovers first-level workspaces under `apps/`,
`packages/`, and `tools/`, and reads each workspace's declared dependencies and
canonical build/test scripts. The same versioned relationship map produces the
affected workspace matrix and the evidence consumed by the final `validate`
aggregate. Dependency edges from both the base and candidate revisions are
included, so a removed or renamed workspace still selects its former
downstream consumers. New workspace names do not require CI job or owner-list
edits.

Documentation roots are discovered at the first level under `docs/`. Public
documentation selects the configured website workspace; docs under app,
package, or tool roots map to their corresponding workspace when defined.
Other known documentation changes receive shared validation. Root shared
inputs select all discovered workspaces. `create-app/*` stays outside this
graph and retains its conditional package archive check. Framework release,
Design E2E, Flow Inspector, and release readiness remain specialized gates
selected by the same relationship map.

The workflow schedules selected workspaces through a dynamic matrix. Each
matrix entry executes its manifest-defined canonical build to completion and
then `test:ci` sequentially. It uploads a run-bound result record; the `validate`
aggregate checks the exact selected matrix, relationship-map digest, execution
identity, task order, and every required job outcome. A missing matrix result,
omitted workspace, failed task, or skipped selected gate cannot satisfy the
required aggregate.

CI runs each selected workspace's canonical build task and dependency closure
to completion before invoking `test:ci`. The test task has no build dependency,
so it must not be scheduled alongside the build task in a single Turbo run.

Commands:

```bash
yarn gen:turbo        # intentionally rewrite turbo.json
yarn gen:turbo:check  # verify the committed graph without changing files
yarn react:build      # check the graph, then build the app dependency closure
```

Any root, app, CI, E2E, or deployment command that directly depends on a
package-specific Turbo task must first pass `gen:turbo:check` or call a root
command that does.

`dev:all` discovers `packages/*` from their manifests and starts every package
`dev` command plus the Asyra Design dev server in parallel. It does not validate
the Turbo graph or build workspace packages; existing `dist` outputs are a
precondition. A fresh clone must use this sequence from the repository root:

```bash
yarn install
yarn react:build
yarn dev:all
```

After `yarn clean`, recreate the outputs before restarting the watchers:

```bash
yarn react:build
yarn dev:all
```

`clean` remains a Turbo workspace command; every package that emits `dist` must
provide `clean`.

## Script Tests

`yarn test:scripts` verifies:

- the committed Turbo graph against workspace manifests;
- root/CI/deployment command wiring;
- release command ordering and restoration behavior;
- that a committed generated template remains standalone with exact package
  pins without requiring Framework source-version parity between release
  stages;
- the non-mutating generated-template synchronization command contract;
- monorepo unit, integration, and contract test placement through
  `scripts/__tests__/test-file-placement.test.mjs`.

The general `docs:readme:check` command checks package READMEs and public
documentation. It does not select an App or impose that App's generated
template version on unrelated work. Template synchronization belongs to the
explicit target release validation commands below.

`yarn deps:validate` separately verifies declared workspace dependencies for
source imports. It does not replace build, clean, generated-template, or
release validation.

Package tarball, entrypoint, and clean-consumer validation is deliberately
owned by Framework Release Gate 5. It must cover every published framework
package under one release contract rather than introducing a package-specific
publication rule for Collaboration.

Gate 5 uses these artifact-only commands:

```bash
yarn release:packages --prebuilt
yarn release:consumer
yarn release:template --prod=asyra-design
yarn release:records
```

`release:packages` creates and validates exactly 19 tarballs in the ignored
project-local artifact directory. `release:consumer` and `release:template`
install only those tarballs in isolated Yarn `node_modules` consumers; neither
may resolve monorepo workspaces, aliases, private source paths, or hoisted
dependencies. `release:records` freezes the candidate versions, public support
documents, package READMEs, Changesets configuration, and the distinction
between readiness and publication.

The version PR commits the Framework package manifests and changelogs computed
from its pending Changesets, including Changesets' dependency propagation. After
that PR merges, the separately authorized Framework stage uses the fixed
`packages/*` allowlist and each manifest's exact version as its release set. It
checks all exact versions in the registry before publishing any package, skips
versions already present, and publishes only missing versions from the same
validated tarballs used by the local packed-consumer gate. Registry errors other
than an exact-version `E404` fail the stage. The stage does not require pending
Changesets to remain after the version PR.

Historical prerequisite decisions are resolved from Framework
`decisions/releases/unreleased.md` and all direct `vX.Y.Z.md` archive files,
independently of the current root version. New unreleased entries never hide
older completion records. Each prerequisite returns its matching `decisionPaths`
for provenance; missing required decisions still fail. This checks the existence
of historical authority, not current test execution or fresh release approval.
General package validation does not require an empty `unreleased.md`; clearing
that file belongs only to the release-cut lifecycle. No manually maintained
summary duplicates the historical source.

The formal commands require Node.js 24.x to report `READY`. The explicit
`--allow-unsupported-node` option is local diagnostic evidence only and cannot
authorize the release decision.

After publication, `yarn release:consumer:registry` derives every Framework
version from the current package manifests and installs the fixed allowlist
directly from the public npm registry. It permits no workspace, tarball, link,
portal, patch, source-directory, or resolution substitution, and records the
registry lockfile checksums before running the same typecheck, build, and
behavior gates as the artifact consumer.

## Generated App Template

Only `create-app/<app>/template` is generated output. The surrounding CLI
package remains directly maintained source.

```bash
yarn release:app --prod=asyra-design
yarn release:app:check --prod=asyra-design
yarn release:app:build --prod=asyra-design
```

The first command synchronizes the committed template from the source app. The
second generates into project-local `tmp/`, compares it with the committed
template, removes the temporary output, and never changes the committed
template. The third builds the framework dependency graph, compiles that
generated template against those local builds, and removes its temporary build
output. General feature/refactor PR CI does not require current template parity;
that would expand ordinary source work into generated output contrary to the
generated-artifact rule. Exact dependency equality against the frozen
Framework release set is checked by `release:template` and the release
validation path when template/CLI readiness is required. A prior-stage template
may therefore retain older exact package pins; it cannot pass the later
readiness check until synchronized with the frozen release set.
App and CLI readiness own the synchronization check and reuse their immediately
preceding clean Framework build for the same template compilation. The
Framework-only validation path does not synchronize, compare, or build an app
template.

After the Framework versions are published, a Generic Starter registry
consumer check can use the actual `npm pack` CLI tarball before the CLI itself
is published. Run the packed CLI through both its npm and Yarn creation paths,
then verify each fresh consumer's Framework packages resolve from the public
npm registry in its lockfile and are installed as non-symlink package
directories. Run the consumer's formal tests, typecheck, lint, production
build, and applicable Starter interaction tests. Bind the recorded results to
the source SHA and CLI tarball SHA-256. An HTTP response or the Framework-only
registry consumer does not prove this generated Starter path.

## Release Validation and Publication Boundary

```bash
yarn release:validate --framework
yarn release:validate --prod=asyra-design
yarn release:framework
yarn release:create-app --prod=asyra-design
yarn release:full --prod=asyra-design
```

`release:validate --framework` runs the shared installation, graph, Framework
build, lint, formal tests, and workspace dependency gates. It stops before
app-specific browser E2E and template gates. `release:validate --prod=<app>`
adds the selected app's browser E2E, template synchronization, and generated
template production build after those shared gates.

The full validation runs, in order:

1. copy repository sources and version-controlled environment defaults into an
   ignored project-local isolated workspace, excluding `.git`, dependencies,
   build/test output, local `.env.local` overrides, and other temporary state;
2. immutable dependency installation;
3. Turbo graph check;
4. clean workspace build;
5. root production build;
6. lint and formal tests;
7. workspace dependency validation;
8. app-specific collaboration browser E2E on isolated ports, when an app is
   selected;
9. generated-template synchronization check, when an app is selected;
10. generated-template production build, when an app is selected;
11. remove the isolated workspace whether validation passes or fails.

Release validation never cleans or builds the developer's active workspace, so
an active `dev:all`, app server, or package watcher is not interrupted and
cannot rewrite artifacts during validation.

`release:framework` validates Framework packages without entering an App or
template stage. It preserves the isolated validation workspace, builds and packs
the Framework packages there, checks workspace dependency ranges, and runs the
packed consumer against those tarballs. After a separate invocation following
merge and publication authorization, it publishes those exact validated
tarballs in dependency order and proves the versions through the registry-only
consumer. On failure it retains the isolated artifacts for diagnosis; successful
registry verification cleans them up.

`release:create-app` begins with that registry-only Framework proof, regenerates
and validates the selected app template, verifies the CLI pack inventory, and
publishes only `create-app/<app>`. It never discovers or publishes Framework
workspaces. `release:full` is the explicit synchronized orchestration: it runs
the Framework stage first and enters the create-app stage only after Framework
publication and registry verification succeed. This app stage remains separate
from the Framework version PR and Framework package publication stage.

The generic unscoped `changeset publish` command is not a project release
entrypoint because it would also select any unrelated unpublished public
workspace, including a manually versioned create-app CLI.

These commands do not create changesets and do not authorize a push, tag,
registry publication, or deployment unless the user explicitly invokes and
authorizes the corresponding remote operation.

## Release Version Topology

Changesets version only fixed-allowlist Framework packages under `packages/*`.
Root `asyra`, private apps, `create-app/*` CLI packages, and generated templates
must never appear as Changeset release entries. A non-Framework code PR may use
an empty Changeset as its closeout record. Pure Markdown documentation pull requests do not require a Changeset.
All changed paths, including deleted files and both sides of a rename, must
end in `.md` and be outside `.changeset/` to qualify. Executable documentation
(such as `.mdx`), scripts, configuration, and mixed changes retain the pending
record requirement before completion. CI accepts a release pull request after
`changeset version` consumes its pending records only when at least one
allowlisted Framework package has both its generated manifest version and
changelog committed; deleting a Changeset alone never satisfies the gate.

Root `asyra` is the `a.b.0` main release identity. Framework packages iterate
within that family as `a.b.n`. Changing `a` or `b` requires explicit user
authorization and runs in the fixed order: public Framework packages and
registry proof, then the manually versioned create-app CLI, then root `asyra`.
The complete authority is
`docs/ai/framework/rules/release-version-topology.md`.

The full ordinary app E2E suite remains an independent CI workflow because its
product-wide browser contract is broader than package publication. The
Collaboration E2E suite runs in a separate CI job so an ordinary-suite failure
cannot prevent the package-specific collaboration gate from reporting its own
result.

Both PR workflows skip all jobs while a pull request is Draft. Opening or
updating a ready PR and marking a Draft PR ready for review trigger validation;
CI also retains its label-change triggers. Draft runs may appear as skipped in
GitHub Actions. Main-branch push validation, scheduled E2E, and manual E2E
dispatch remain enabled independently of PR readiness. Converting an already
running PR back to Draft does not cancel its existing run.
