# Package Version Preparation

Use Changesets when preparing a release for the allowlisted Framework packages
under `packages/*` or the independently versioned `@asyra/flow-inspector` tool.
Each entry declares the selected packages and version increments. Run the version
step to apply those increments and dependency propagation, then validate the
resulting package artifacts through the publication workflow.

Root, private app, create-app CLI and generated-template versions follow their
respective owners in
[Release Version Topology](../docs/ai/framework/rules/release-version-topology.md).

Plan closeout writes the owner's `unreleased.md`. Those decision streams supply
project release updates. Changelog generation is disabled in Changesets.
