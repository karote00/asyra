# Independent acceptance errata - 2026-10-24

This is a maintainer correction after independent chat
`01a16e30-e3d0-7fa3-b7aa-f33e5f14c82a` completed its integration.
The original adoption note, 31-test result, logs, source and later read-only
findings remain unchanged inside `independent-v1.tar.gz`. No new independent
acceptance is claimed.

## Guide digests were correct

The original report compared the raw-file SHA-256 with a release-record digest.
The release contract hashes `JSON.stringify(source)` encoded as UTF-8, where
`source` is the complete UTF-8 guide text. The handoff hashes raw file bytes.
For the original guide those are, respectively:

- Release guide: `227135e30355aa0843af0bc853f678cdfa5e803094521cbd01622989273b5592`.
- Handoff file: `68f855f9e4649a541ca147cd20a48c5033a01ebd06f5083136f1d60b0ae65148`.

Both match their original records. The public instructions had not explained the
algorithm distinction; revision 2 now does. No record hash or original guide is
rewritten. A real mismatch under the correct algorithm still blocks integration.

## Definition reads belong before startup

The original acceptance test called `getPropertyTypeDefinition` after `open()`.
Core correctly rejects that read after composition closes. The independent AI
fixed the test to use the existing `app.definition` captured before startup;
all field, uniqueness and default assertions remain. The same correction and
23 added preservation/boundary cases are integrated into the permanent fixture.

The independent AI's added test initially assumed a new selected session has
zero history. It corrected that assumption by measuring a one-entry increment
and exact undo/redo state. This was a test-authoring correction, not persistent
history migration. The original failed and corrected test logs are retained.

## Evidence boundaries

The independent run used revision 1 and the original input-v1 archive. The
permanent fixture now contains its completed implementation; revision 2 is a
maintainer clarification, not a second independent run. Its replay uses the same
candidate bytes and tests. The em-spacing sample remains recoverable and rejected
pending a product decision; the optional official panel remains deferred.
Results do not prove registry availability, browser pixels or production migration.
