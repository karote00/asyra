# Revision-2 delivery inventory

This permanent fixture is already updated. The separate archive starts before
the spacing update. Keep those states and their evidence separate.

| Use | Retained entry |
| --- | --- |
| New AI input | [Pre-update archive](../delivery/revision-2/text-spacing-r2-independent.tar.gz), [checksum](../delivery/revision-2/text-spacing-r2-independent.tar.gz.sha256), [task prompt](../delivery/revision-2/TASK-PROMPT.md) |
| Current consumer | [Adoption record](../README.md), [code and tests](../src/), [saved inputs](../test-data/) |
| Active guidance | [Update guide](text-spacing-example-2-r2.md), [portable migration reference](persistence-migration-r2.md), [pinned public sources](sources/index.md) |
| Package identity | [Base manifest](base-artifacts.json), [modeled target](model-artifact.json) |
| Evidence and replay | [Verification](../VERIFICATION.md), [first independent evidence](../evidence/), [context rerun record](../evidence/revision-2/context-rerun/README.md), [rerun logs](../evidence/revision-2/context-rerun/logs/) |

The archive contains 60 hashed inputs plus its checksum manifest: baseline code,
22 tests, original documents, configuration, 19 base archives, the next Preset
archive and four pinned public source copies. It excludes node_modules, caches,
Git history, prior subsequent-adoption outcomes, solution tests and private
maintainer evidence. Its inner inventory lists every required attachment and the
explicitly omitted historical material. Installation may need registry access
for already-declared third-party dependencies; this is not an offline cache.

Use the attached archive directly. Do not run the old packaging scripts retained
as provenance; they refer to the original staging location. Validate the retained
package with `python3 tools/test-handoff.py` from this fixture.

The original revision-1 guide and migration attachment remain historical inputs.
Use the portable revision-2 migration reference for active links. The standalone
archive omits the first adoption's private verification/evidence/logs; it does not
claim to reconstruct them. In this repository those earlier records remain in
the [first fixture](../../app-update-text-consumer/VERIFICATION.md). The older
README name `updates/target-artifacts.json` corresponds to the retained
[base manifest](base-artifacts.json), not a new unavailable package.

Do not give evidence directories or the completed consumer to a new independent
AI. Supply only the archive and prompt. The existing-context rerun cannot certify
that a fresh conversation will require no further guidance.
