# Text update consumer

This is the permanent `custom-text-example-1` consumer for the Text update guide,
with the initial adoption and maintainer follow-up recorded below. It is a small App with local typography, approval metadata,
a chart that shares the typography property, and a versioned document loader.
Framework state remains canonical. UI projections read it; actions enter through
the App Feature and one transaction. Document conversion belongs to the loader.

`test-data/current.json` is the original document. Do not overwrite it with an
updated save. `test-data/multiplier.json` is the separately declared older format:
version 1 line height is a font-size multiplier, version 2 uses layout units.
Unknown versions or invalid metadata must fail before canonical load.

Install the explicitly supplied candidate artifacts before running this fixture.
The manifest versions alone do not identify the target build. Run `yarn test`,
`yarn typecheck`, `yarn lint` and `yarn build` from this directory. The preservation
suite describes existing behavior; integration must preserve its assertions.
Do not import workspace source or change Framework packages to satisfy a test.

This checkout is the consumer after intervening user edits, before its next update.

## Initial independent Text adoption - 2026-10-23

This section records the first acceptance turn. The later follow-up below changes
one default and panel availability; it is not part of that independent result.

Adopted `text-official-fields-example-1`, guide revision 2, for the equivalent
layout-unit fields case. Target source:
`7bf3655242e6adca9ac7d81ff57d17df9b310c9e`. Installed Core 0.5.7, Preset 0.5.8
and Utils 0.5.2 expose the required public APIs. The installed direct package
versions match
`updates/target-artifacts.json`; `yarn.lock` resolves the supplied local candidate
artifacts. The attachment also lists packages not installed in this consumer;
it is not a claim that every attached package is used. The attachment records
their SHA-256 identities;
archive digests were not independently recomputed because the archives are
outside this consumer. This is local-candidate adoption, not npm release
verification or a complete release-to-release dependency comparison.

`src/definitions.ts` now installs the official Text schema and property base,
redefines it before startup with the three original metadata fields, extends the
official component aliases and registers the official renderer once. Official
line-height/spacing validators and defaults are shared by Feature writes and the
loader through the composed schema. The renderer supplies layout bounds and hit
area behavior as well as drawing. No local typography definitions or duplicate
renderer remain.

Retained: `approvalStatus`, `sourceRecordId`, `labelCategory`, their validation and
persistence/projection policies, chart typography and source references, and all
existing actions in `src/runtime.ts`. The separate App projections and panel
remain type-scoped and preserve subscription cleanup. There is no equivalent
exported official App action to replace the local transaction/approval paths.
The official example's string-based selection projection is intentionally not
installed: charts also contain `text` and must keep their own controls. There
are no official field overrides. Rich text, IME, full canvas editing, the official
example's UI panel and any subsequent update remain outside this adoption.

Document schema remains version 2 with unchanged identities and representation.
The separately supported version 1 multiplier conversion in `src/documents.ts`
remains registered through `registerLoadHook`; 1.5 at font size 16 becomes 24
layout units exactly once. Invalid/overflowing conversions and invalid metadata
fail before apply. Original `test-data/current.json` and
`test-data/multiplier.json` are unchanged; no production storage was accessed.

Verification on the working source based on consumer commit
`719c414b7d8a80685ed042d1e1742bc32e09cb39` plus this uncommitted adoption diff:
`yarn test` passed 14 tests, `yarn typecheck`, `yarn lint` and `yarn build` passed.
The original 10-test baseline passed; the added adoption test failed against the
old local renderer before implementation. Permanent tests now also cover official
field contracts, fresh defaults, typography boundaries, renderer inputs/bounds/hit
area, conversion overflow and no repeated conversion. Existing preservation
assertions were retained. Logs are in `test-results/text-adoption/`.

Evidence limits: the suite uses jsdom canvas stubs, not browser pixel validation.
The pre-existing selection-overlay warning remains; the production build warns
about chunks above 500 kB. Guide source links were accessible and installed
composition APIs were inspected. No blocking guide information was missing for
this selected case; a verified historical release delta and published package
availability remain unspecified. No dependency upgrades, commits or pushes were
performed.

## Maintainer follow-up - 2026-10-23

The same acceptance chat later received explicit user requests to fix new-Text
color and approval availability. Its completed consumer fixes are now integrated
here. This is assisted follow-up, not another independent guide acceptance.

The one intentional official-field override is now `textColor.defaultValue`:
startup `redefinePropertyType` uses public Utils `createDefaultFill().color`
(currently `#cccccc`). All other official field contracts, including the color
validator, are retained. This shared property definition also supplies defaults
to charts using typography. Explicit persisted colors remain unchanged, including
the original Text and chart's black. The validation-only composed schema retains
the official schema; it does not create values or apply defaults.

The approval button subscribes to the existing Text-only metadata projection. It
is disabled for chart/empty selection, enabled for Text, and unsubscribes on panel
disposal. Feature validation and transaction ownership are unchanged.

All 18 retained tests pass, including fresh-runtime assertions for all five
adoption fields, metadata/typography/chart projections, complete saved properties
and scene structure, approval with one history entry, Undo/Redo, and subsequent
custom edits/save. New regressions also cover shared gray through serialization,
fresh load and history, unchanged original properties, invalid-target button
clicks, and subscription cleanup. Typecheck, lint and build pass.

The immutable initial guide, five-file patch and test outputs remain under
`updates/` and `evidence/`. See `VERIFICATION.md` for the separate follow-up patch,
results and baseline reconstruction. This fixture uses local candidate packages;
these checks do not prove published package support, browser pixels, restoration
of an old undo stack, or a subsequent official update. Task 4 remains unstarted.

## Intervening user changes - 2026-10-24

The App now allows `rejected` as well as `draft` and `approved`, through its
existing metadata action and a dedicated `reject` Feature action.
`test-data/locally-extended.json` is a saved document with rejected approval,
source record `record-42` and category `general`. Preserve this document and the
original documents. The three custom fields and the intentional shared-gray
override remain App-owned. The official example UI panel is still deferred;
its string-based selection would include charts. Rich text and IME remain
outside the available target. These are not adopted by a package update.

The prior dated sections are history. Current state is the first local candidate
plus the maintainer follow-up and the intervening changes above. The next
`text-spacing-example-2` change is pending. The document schema is still 2.
Run the current tests before selecting the supplied next artifact. Keep failed
or partial adoption pending and retain the previous artifact and saved inputs.


## Revision 2 isolated rerun - 2026-10-24

Status: adopted in this isolated copy. This is an existing-context rerun explicitly
requested by the user, not a fresh-conversation independent acceptance. The agent
already knew the previous adoption and guide findings. The independent wording
in the supplied TASK.md describes the original handoff intent, not the methodology
of this rerun. No conclusion about independence is inferred from passing checks.
The completed consumer and immutable handoff archive were not overwritten.

Starting state was the extracted pre-update consumer: Preset 0.5.8, the original
permanent tests and saved inputs, intervening rejected approval and the shared-gray
follow-up. All handoff checksums matched before changes. Used
`text-spacing-example-2`, revision 2, independent handoff edition, including its
public source attachments and migration reference. Both candidate digests and the
three-entry archive delta match the supplied report. Target Preset is the private,
test-only `0.5.8-task4.0`, SHA-256
`60ba8503161a1f88adfbe17a5c136e4d202df987b07b14452a3b4e9047db32b7`;
source SHA-256 is
`465e4e330d272162dc627b9004b109e7b15529eef4699366451697ca86085291`.
Installed target files match every corresponding archive member. Core and Utils
remain on the supplied candidates; only Preset selection changed.

New Text and chart typography now inherit spacing 0.5. Explicit saved spacing
including 0 and 1.5, saved colors, shared gray, all three metadata fields and their
validation/projections, rejected approval, approve/reject history, chart behavior
and source references remain retained. The existing public composition already
inherits the correct default, so no runtime or Framework source changes were
needed. App document version remains 2; multiplier conversion occurs once.
The official example panel, rich text and IME remain deferred/unadopted.

Execution evidence is local to `test-results/subsequent-adoption/`, with command
exit status in matching `.exit` files. Baseline installation used the existing
lockfile with `--immutable`; the unchanged baseline passed 22 tests. Added permanent
revision-2 tests before installing the target: two new-default tests failed with
actual 0 versus expected 0.5 (Text and chart), while the other 32 passed. Only after
that proof was the obsolete original fresh-default assertion changed to 0.5 and
the target installed. Final results: 34 tests passed, typecheck passed, lint passed,
build passed. All final gate exit statuses are 0; the old-candidate proof exits 1.

New verification covers the entire saved Core document for all three generations
through two fresh-runtime storage reloads, explicit zero and 1.5 for both Text and
chart, shared gray on new objects across reload, each missing required metadata
field and spacing before apply, individual metadata Feature/projection paths,
and approve/reject Undo/Redo with exactly one entry after fresh reload. Existing
renderer, aliases, field uniqueness, invalid values and control-isolation tests
remain. Fixtures and runtime files retain their original hashes.

The baseline install emitted the documented optional Yarn TypeScript patch warning;
the target install completed without that warning. No tools or unrelated packages
were upgraded. Existing canvas-stub/selection-overlay and large-build-chunk warnings
remain. Results establish packaged behavior, not browser pixels, published release
support, production-storage migration or restoration of a previous session's undo
stack. Package caches, logs and all run changes stay inside this isolated consumer.

No additional blocking guide gap was encountered in this rerun. Revision 2 supplied
usable local references, missing-history annotations and installation-warning
handling. This conclusion is limited by the known prior context. The handoff hash
manifest records immutable input identity and intentionally no longer matches the
adopted files; it was not rewritten to disguise the changes. No publish, push,
deployment or remote PR was performed.


### Confirmation of the three documentation findings

This confirmation concerns the revision-2 isolated rerun above. No new blocking
guide omission or product-behavior ambiguity was encountered. It remains an
existing-context rerun, not a fresh-conversation independent verification; prior
knowledge may have helped interpretation. Passing checks do not establish that
a new conversation would need no additional information.

| Finding | What was addressed | What remains / what is not claimed |
| --- | --- | --- |
| Installation warning | Revision 2 explains warning interpretation, retaining logs and exit status, verifying identity, and keeping adoption pending when installation or a required gate fails. | The warning itself has not been eliminated. The baseline install again emitted `YN0066` / `Cannot apply hunk #1`; the target install did not emit it. Successful installation and final gates do not prove the underlying optional patch issue is fixed or that every similar warning is harmless. |
| Attachment inventory | Required inputs for this run were supplied: candidate archives, original saved data, configuration and pinned public-source copies. Handoff hashes matched before edits; unavailable historical attachments are explicitly identified. | Missing historical attachments remain unavailable. They were neither reconstructed nor newly verified. Completeness applies to this selected adoption, not reproduction of every historical adoption or an offline dependency installation. |
| Broken links | The active revision-2 paths provide usable consumer-local references and direct readers to the portable migration reference. Required information for this run was reachable through those paths. | The preserved original migration attachment still contains obsolete relative links. This was resolved for the current reading path, not by rewriting every historical document or guaranteeing future availability of external URLs. |

Installation evidence is retained in
`test-results/subsequent-adoption/baseline-install.log` and `target-install.log`,
with their corresponding exit-status files. Attachment integrity is recorded in
`test-results/subsequent-adoption/integrity.log`; the supplied inventory and
portable migration reference describe historical availability and link limits.
The rerun's 34 passing tests and passing typecheck, lint and build remain the
behavioral evidence recorded above, not proof that warnings or historical gaps
have disappeared.

For this rerun, the three findings were addressed through clearer instructions,
complete required delivery and usable active references. This statement does not
claim removal of all warnings, recovery of missing history or repair of all old
links. This follow-up only records the confirmation in the isolated README; it
does not change runtime, dependencies, guides, fixtures or the completed consumer.
