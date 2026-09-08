# Flow Inspector

An open-source architecture viewer and local workflow control-plane toolkit.
Concrete step cards describe responsibility, implementation boundaries and
verification obligations. The canvas, navigation, zoom and detail panel are
shared by the static viewer and the local proof board.

## Distribution and current support

`@asyra/flow-inspector` is a public package with independent Changeset records.
The npm archive contains viewer assets, the prebuilt static workspace, Inspector
examples, control-plane source and permanent tests. It excludes local evidence,
task candidates, credentials and dependency installations. Repository-level
fixtures and dependencies are still required for the full test suite. The package uses the repository's MIT license.

After installing a published version, open
`node_modules/@asyra/flow-inspector/workspace/workspace.html` or a standalone HTML
example under `inspectors/`. The static examples are Asyra contracts; their
repository documentation links require the corresponding source checkout.
`viewer.js` and `viewer.css` can also be resolved as package assets for a page
that provides the existing Inspector data and DOM contract.

The dynamic control-plane and catalog generators currently require an Asyra
checkout with its source, formal tests, documentation and locked development
dependencies. Installing this archive alone does not provide a generic project
adapter or an independently runnable agent service. No npm executable or Node
library entry point is advertised. Real provider acceptance and protected remote
evidence remain unfinished.

## Contribute and verify

In the source repository, install locked dependencies with `yarn install --immutable`,
then run:

```sh
yarn workspace @asyra/flow-inspector test:local
yarn workspace @asyra/flow-inspector typecheck
yarn workspace @asyra/flow-inspector build
node tools/flow-inspector/control-plane/cli.cjs serve
```

The package contract test packs a real archive, resolves assets from an isolated
consumer directory and renders a shipped standalone Inspector. For source
operations, read `control-plane/README.md` and `workspace/README.md`.

## Record changes

Run ordinary `yarn changeset` at repository root. Select only affected packages;
Flow Inspector records use its own package identity and semantic version impact.
Changeset creation records future release intent. Maintainers separately review
and apply versions, publish and verify the registry. Framework bulk-release
scripts do not include this tool, and its version is independent of Framework
release families. No publication is performed by the test or pack command.
