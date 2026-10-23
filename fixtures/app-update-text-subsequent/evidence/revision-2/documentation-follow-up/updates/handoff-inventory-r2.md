# Standalone consumer handoff inventory - revision 2

All local links are relative to this file. Inventory describes this delivered
checkout on 2026-10-24, after revision-1 adoption. It is not a pristine old-candidate
baseline or proof of a fresh revision-2 acceptance. Never infer baseline identity
from an old README paragraph: inspect the manifest, lockfile and installed package.

## Required current inputs

| Attachment | Purpose |
| --- | --- |
| [Consumer instructions](../AGENTS.md) and [adoption record](../README.md) | Scope, current decisions and dated evidence |
| [Revision-2 update guide](text-spacing-example-2-r2.md) | Selected behavior, installation and verification |
| [Revision-2 migration reference](persistence-migration-r2.md) | Portable references and App-version distinction |
| [Model artifact report](model-artifact.json) | Exact source/target digests and three-entry delta |
| [Base artifact manifest](base-artifacts.json) | Names and digests of all 19 base archives |
| [Previous Preset archive](../artifacts/asyra-preset-0.5.8.tgz) and [target Preset archive](../artifacts/asyra-preset-0.5.8-task4.0.tgz) | Retained source and selected private test candidate |
| [Artifact directory](../artifacts/) | All 19 base archives plus target; do not substitute registry packages |
| [Package manifest](../package.json), [lockfile](../yarn.lock), [Yarn settings](../.yarnrc.yml) | Existing dependency selection and local-cache policy |
| [Application and tests](../src/) | Actual composition, Features, projections, loader and permanent verification |
| [Original document](../test-data/current.json), [multiplier document](../test-data/multiplier.json), [intervening document](../test-data/locally-extended.json) | Immutable saved inputs |

Preserve the consumer's existing build, lint, TypeScript and test configuration
when delivering the project. Required pinned Framework source links are in the
update guide; they were reachable during revision-1 acceptance but are online
references, not bundled offline copies. Supply verified copies for offline work.
Missing required artifacts or unreachable required evidence block dependent work.

## Included supporting evidence

- [Subsequent adoption logs](../test-results/subsequent-adoption/): baseline,
  old-candidate failures, artifact verification, installation, formatting,
  first/final lint, final tests, typecheck and build.
- [Candidate builder](../tools/prepare-artifacts.py): optional provenance tool;
  not required to install the supplied archive. Do not rerun it during routine
  adoption or use its output directory as its source archive directory.
- [Original revision-1 guide](text-spacing-example-2-r1.md) and
  [original migration attachment](persistence-migration.md): historical inputs,
  preserved unchanged. The original attachment retains obsolete relative links;
  use revision 2 for navigable standalone guidance.

The artifact and test-result directories are Git-ignored. A source-only Git
checkout does not deliver them: explicitly include them in the handoff and check
manifest digests and log presence before claiming a complete evidence bundle.
Logs document the completed run; they do not replace new checks after code changes.

## Historical material not included

The dated README refers to `VERIFICATION.md`, `evidence/`,
`updates/target-artifacts.json` and `test-results/text-adoption/`. These earlier
attachments are not included in this handoff. They are not links to current
required evidence, and their historical contents have not been reconstructed.
Supply them separately if reproducing the initial adoption/follow-up is required;
otherwise retain the historical statements with this availability annotation.

The original migration attachment also references a broader documentation tree
(Persistence, Props Manager and validation/migration learning guides) that is not
bundled here. Revision 2 links to actual consumer sources and explicitly labels
the limits; it does not claim those sources replace every Framework contract.

## Packaging checks

Confirm every required local path exists inside the consumer, verify each archive
against the base/model manifests, and check active revision-2 links. Preserve the
original guide and fixtures. Include the Git-ignored evidence explicitly when
sharing this handoff. Do not rewrite history or mark revision 2 independently
accepted solely because its documentation links validate.
