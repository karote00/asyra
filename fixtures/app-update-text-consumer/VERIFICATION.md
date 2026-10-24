# Text guide consumer verification

Plan association: `docs/ai/framework/plans/app-cli-update-and-migration-plan.md`,
Task 3. Source target: `7bf3655242e6adca9ac7d81ff57d17df9b310c9e`.
Task 4 and subsequent-update claims are excluded.

## Artifact prerequisite

On 2026-10-23 the npm artifact `@asyra/core@0.5.7` exposed the redefinition APIs,
but `@asyra/preset@0.5.8` did not contain the guide's Text exports in its public
declarations or JavaScript. The inspected Preset tarball SHA256 was
`1e135095d529f615102ab9bccc8bd532e9135dc92ee7e3ebbb846c7b295d47aa`.
Manifest version equality is not proof of source or capability equality.

The existing `yarn release:packages --out=tmp/text-update-artifacts` command built,
packed and validated all 19 Framework packages from the pinned source. The
consumer uses these local candidates through lockfile resolutions. No package
was published and no Framework runtime source was changed. This acceptance
cannot establish npm release readiness or a historical release-to-release delta.

## Baseline and independent input

The modeled pre-adoption consumer passed 10 tests, type checking, lint and a Vite
production build. The nine preservation cases exercise real Core, Feature,
registry, UI projection, transaction/history, localStorage and load-hook paths.
The other test checks installed public target exports. jsdom canvas shims supply
browser primitives only; canonical state and transactions are not mocked.
These tests do not establish glyph geometry or pixel rendering fidelity.

The baseline emitted an existing Pixi container deprecation warning and a
selection-overlay cleanup warning; neither was suppressed or fixed. Build output
also reported large chunks. No rendering-correctness claim follows from a green
data-preservation test.

A fresh consumer copy was created at `tmp/text-update-ai-consumer`, with its own
Git boundary and baseline commit `719c414b7d8a80685ed042d1e1742bc32e09cb39`.
The independently created chat is `01a1694c-9166-7d91-b124-79f9517fc2eb`.
It received the consumer, the request in `evidence/request.md`, public update
index/guide, installed candidate packages and `updates/target-artifacts.json`.
It was not forked and received no planning conversation or integration patch.
The parent repository was only the launch location; the request confines source
inspection and writes to the standalone consumer and the guide's public sources.

The exact delivered revision-2 guide is retained under `updates/` and includes a
local artifact attachment; its SHA256 is
`a5fc59aef8813e36add06be679f954f249f9e4939983bd8a99be1944a03d70b9`.
Artifact delivery metadata adds no integration algorithm beyond the public guide.
After acceptance, the public guide/index status was updated to report this local
candidate result and the observed npm limitation. The captured input remains
unchanged. Public revision 3 later added the follow-up clarifications described
below; it was not used in the first trial.

## Result

The fresh chat completed without follow-up hints or guide corrections. Its 30
shell commands used only the consumer working directory; inspected code was the
consumer, installed packages and public source URLs from the guide. Its exact
five-file diff is retained in `evidence/integration.patch`. The original tests,
documents, dependency manifests/lockfile and delivered guide were not weakened or
changed. The added renderer-adoption test failed before the implementation and
passed afterward; the failing output is `evidence/independent-adoption-before.txt`.
This result is bound to the completed first turn
`01a1694c-935f-7a31-8064-b97200a77f65`. The chat subsequently started another turn;
its live working directory is no longer the acceptance snapshot. Retained files
were checked against the saved patch's Git blob identities, and unchanged inputs
against baseline digests. Later chat changes are outside this initial independent result. The separate
maintainer follow-up below identifies the changes subsequently integrated here.

The AI adopted official Text definitions/rendering with three retained metadata
fields, kept App Features/projections and chart references, and retained the
existing version 1 multiplier conversion without adding a new document version.
It recorded actual adoption and exclusions in the README. All 14 independent
tests, typecheck, lint and build passed; raw results are in `evidence/independent-*`.
No technical integration information had to be supplied outside the guide.

At initial acceptance, the exact resulting App source was copied back into this permanent fixture.
Maintainer verification additionally checks a selected chart's panel updates when
its referenced Text changes, without reselecting the chart. All 15 retained tests,
typecheck, lint and build passed on that source. All 19 supplied archive digests
were independently recomputed, and installed direct packages are ordinary package
directories, not workspace-source symlinks. Actual direct versions are Core 0.5.7,
Preset 0.5.8 and Utils 0.5.2; resolutions select the candidate versions even where
the original manifest requests an older version.

This is one independent acceptance of the modeled equivalent-fields case with
local candidate artifacts. Task 3 passes within that boundary. Published-package
support, arbitrary customer Apps, browser pixels and subsequent updates are not
proven. Task 4 has not been started.

## Maintainer follow-up

The user subsequently requested complete post-reload assertions and integration
of the independent chat's later consumer fixes. The source changes in
`src/definitions.ts` and `src/panel.ts` match the chat's completed fixes exactly.
The initial turn was not rerun or relabeled: its prompt, guide, integration patch,
baseline hashes and logs remain byte-for-byte unchanged. Follow-up changes are in
`evidence/maintainer-follow-up.patch`, separate from `evidence/integration.patch`.
The former contains only the README, definitions, panel and preservation tests;
this verification record is never input to an independent trial.

Before implementation, the existing 15 tests passed. The expanded suite then
failed four cases for the missing shared-gray default and enabled chart approval
button. After integrating both App-level fixes, all 18 tests, typecheck, lint and
build passed; the naming gate also passed. Separate raw outputs are retained as
`evidence/follow-up-before.txt`, `evidence/follow-up-test.txt`,
`evidence/follow-up-typecheck.txt`, `evidence/follow-up-lint.txt`,
`evidence/follow-up-build.txt` and `evidence/follow-up-naming.txt`.

The fresh-runtime test parses the bytes written to the fixture's localStorage
slot, disposes the runtime, starts a new runtime through the loader, and checks:

- Canonical `lineHeight`, `letterSpacing` and all three custom metadata fields;
  typography/metadata projections and the referenced chart's projection.
- Full saved property equality and scene-tree equality, covering IDs, property
  bindings, hierarchy, sibling order, chart reference and all original values.
- Approval through the mounted panel, exactly one new history entry, Undo/Redo,
  unchanged save after redo, and another custom edit/save with only its intended
  field changed.

The later chat's three regressions are retained: shared gray without rewriting
saved colors; button availability and cleanup; and memory serialization, fresh
load and Undo/Redo with all original properties unchanged. These are real Core
integration tests under jsdom, not fresh browser verification on this permanent
fixture. They prove history operations in the new runtime, not restoration of the
previous runtime's undo stack. The intentional `textColor` default override is
recorded in README for the next maintainer. Candidate package, publication and
Task 4 limitations remain unchanged.

## Retained browser follow-up and guide clarification

The browser page from the completed consumer chat is now retained unchanged in
`e2e/text-review.html` and `e2e/text-review.ts`. Necessary screenshots, command logs,
final browser state and the original report are in `evidence/browser-follow-up/`.
See that folder's README for provenance and the repeatable approval and memory
save/load/history sequences. These are later, user-directed consumer checks, not
part of the first independent acceptance or a new browser run on this fixture.
The imported page passes this fixture's typecheck/lint; all 18 integration tests
and the fixture build still pass. There is no new runtime or storage behavior.

The public guide now has revision 3, which supersedes revision 2 for shared
initial colors, shared-property effects, real-browser checks and the distinction
between new-runtime history and persistence of an old undo stack. The public
revision 2 and the exact delivered guide under `updates/` remain unchanged. No
fresh independent acceptance of revision 3 or subsequent-update test is claimed.
Final handoff validation on 2026-10-24: 18 fixture tests, 28 documentation/adapter
checks, the updated guide-discovery case, and five website discovery/source-link/
search browser checks pass. Fixture lint/build (including typecheck), site
typecheck, scoped lint, naming and generated-documentation freshness also pass.
The search trigger now gets its page count from the content owner; flattened
search records include headings and cannot supply that count. All 23 pre-existing
evidence/input/revision-2 files match their pre-handoff SHA256 values, and all ten
retained browser evidence files match the consumer originals byte-for-byte.


## Final review and completed consumer handoff

On 2026-10-24 the completed chat and all its changed/untracked source files were
compared with this worktree. The four runtime owners and two browser-page files
match exactly. The permanent preservation tests retain the consumer tests and
add stronger reload assertions; the separate live chart-projection test accounts
for 18 permanent tests versus the consumer's 17. The browser report and necessary
logs/screenshots were already retained. The final consumer README and its named
new-gray-Text screenshot are now also preserved under `evidence/browser-follow-up/`
as `consumer-adoption.md` and `fixed-new-text.png`, byte-for-byte from the consumer.
The original consumer directory is retained for traceability; no files there were
changed or deleted during this handoff.

The revision-2 summary now consistently reports the passed independent local
candidate acceptance and unverified publication/subsequent-update support in the
manifest, website content and both llms files. Revision 3 remains clarification
with no new independent acceptance claim. This final review reran 18 fixture
tests, 14 documentation/adapter tests and two website entry/source-link tests;
all passed. The permanent browser page and runtime are unchanged from the prior
review's successful actual memory reload/history and approval/chart replay.
The captured revision-2 input, initial five-file patch and original logs still
match their retained digests. Task 4 remains unstarted.

## Repeat the checks

From the repository containing the pinned Framework source, run
`yarn release:packages --out=tmp/text-update-artifacts`. From this fixture, run
`yarn install --immutable`, `yarn test`, `yarn typecheck`, `yarn lint` and
`yarn build`. Candidate archive identity may differ if the source, build inputs
or packing environment changes; record new digests rather than relabeling them
as the original acceptance artifacts. The lockfile and artifact manifest retain
the actual tested inputs.

For another independent trial, copy the consumer to a fresh project-local
directory. In that copy, first reverse `evidence/maintainer-follow-up.patch`
(`git apply -R` from the copy's root), then reverse `evidence/integration.patch`.
Omit maintainer evidence, this verification record and the post-acceptance
`text-shared-projection.test.ts`, plus the later `e2e/` browser page. Check every restored file against
`evidence/baseline-files.json` before omitting evidence. The two reversals and
baseline digests were verified after this follow-up. Supply the public
update index and the captured guide/artifact attachment under `updates/` as in
the original request. Use a new conversation. Do not give it this verification
record or an integration patch. Retain its own diff and results; a repeat run is
not implied by the existing success.
