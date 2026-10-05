# Portable Agent - Phase One

## Contract

Deliver one Asyra Agent Skill and version, with installation paths for Codex,
Claude Code and Grok Build. Keep the existing public identity `asyra-agent`
and maintained reference documents. Plugin manifests are generated adapters,
not separate instruction owners. General Claude/Grok chat interfaces are not
equivalent to their coding clients; no unverified chat upload support is claimed.

Scope: `plugins/asyra-agent`, the two marketplace catalogs, the existing bundle
generator and tests, directly affected CI/naming registrations, and
developer-agent maintenance/installation documentation.
The existing adoption-tooling Inspector exemption applies. No Framework/App
behavior, logo, dependencies, installed user configuration or public release
changes are authorized. Cursor and Antigravity remain phase two.

## Design and sequence

1. Put shared release metadata in `bundle.config.json`; generate Codex and
   Claude manifests from it. Keep the existing Skill path to avoid breaking
   consumers. Both plugins point at the same physical Skill tree.
2. Remove plugin-only assumptions from Skill resource discovery and updates.
   Export that exact Skill tree independently, with its existing `bundle.json`
   and offline references. Preserve `pluginVersion` as the compatibility field
   for the single Agent version; it does not require plugin installation.
3. Add Claude marketplace metadata and document native plugin installation,
   standalone Skill installation and Grok Build's documented discovery paths.
   A caller chooses the target directory; packaging never edits host settings.
4. Validate deterministic generation, adapter identity equality, standalone
   relocation/integrity, destination safety, version advancement and naming.
   Review the bounded diff and create an English PR.

Names: `asyra-agent` and marketplace `asyra` are retained public distribution
identities. Internal helpers remain semantic and brand-neutral. Candidate 0.1.7
advances the released 0.1.6 identity without changing product persisted data.

## Evidence and stop conditions

Inspect the existing generator/consumers and official host documentation only.
Run bundle tests, naming checks, bundle freshness and 0.1.6 release comparison,
focused formatting and the selected shared CI gates. Do not expand to App tests.
No new packages or client upgrades without approval. Missing client access or
authentication is recorded as a native acceptance gap, never a passing result.
Packaging proofs do not establish model behavior. Native acceptance follows
`acceptance.md`: version discovery, new product and subsequent extension.

Initial environment: Codex CLI 0.160.0; Claude Code 1.0.35 (before the documented
plugin support); Grok executable unavailable. Native Claude/Grok acceptance
requires suitable clients and account access. This PR can deliver packaging and
installation support without claiming those acceptance runs passed.

## Status

Packaging implementation and bounded self-review complete. Checks passed:

- 201 selected repository tests, including 19 bundle tests and CI scope checks.
- 15 naming tests, focused ESLint and Prettier checks.
- Skill frontmatter validation and real CLI standalone export.
- Bundle freshness and release comparison against retained 0.1.6.
- Regression-first rejection of exports inside the source plugin directory.

The three relocated host-directory fixtures have identical Skill and reference
bytes. These are filesystem proofs, not native host discovery or product trials.
Native 0.1.7 trials remain pending for all three hosts. Claude/Grok tool installation
or upgrade needs user approval; none was performed. No release/tag publication
is part of this task. Phase-one native acceptance is still open.
