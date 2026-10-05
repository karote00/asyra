# Asyra Skill Delivery Plan

## Contract

Status: completed for bounded local delivery. Owner: the current single-agent task.
Base: `19caece61` (merged portable Skill PR #291).

Deliver Asyra-specific development capability to existing coding agents. The
public display name is **Asyra Skill**. The host owns reasoning, execution and
general product correctness; Asyra owns its guides, maintained Starter and
documented framework contracts. A Skill is not a hosted or autonomous agent.
Plugins are installation adapters; no MCP server is required by this scope.

Retain `asyra-agent` as the existing public installation identifier and paths,
including marketplace references and `pluginVersion`. Explain this explicitly;
do not create parallel aliases or strand installed users. Advance the candidate
to 0.1.8 and retain the merged 0.1.7 bundle as the comparison baseline.

## Scope and exclusions

Owners: `plugins/asyra-agent`, its bundle generator/fixtures if required,
`docs/ai/tools/developer-agent`, the tool index and repository README entry,
Starter `AGENTS.md` and its generated CLI copy. Supporting formal tests and
the normal changeset are included. Use existing generators and verification
commands. Do not add a speculative architecture linter or infer correctness
from text matching. No Framework or App runtime behavior changes, dependencies,
client upgrades, installed cache modifications, remote publication or push.
The persistent adoption-tooling Flow Inspector exemption applies.

Discovery is bounded to these owners, direct consumers, existing tests and
official host installation documentation. After implementation begins, review
only the diff, direct consumers and frozen checks. Stop dependent native trials
when authentication, unavailable quota or missing host access prevents evidence;
record them as unverified rather than changing account/billing settings.

## Stage 1 - Positioning and installation

Update the display name, capability description and public entry. Keep one
physical Skill tree and generated adapters. Document public GitHub installation
separately from unpublished local candidates. Include Claude Desktop Skill ZIP
upload as distinct from Claude Code plugin installation. Ordinary prompts use
product language; technical version probes are operator acceptance tools.

Acceptance: generated adapters share identity/version, references remain
self-contained, existing install coordinates remain valid, release comparison
passes, and installation documentation never implies that a private worktree
is needed by an external user.

## Stage 2 - Continuity and verification

In the Skill, route natural product requests through existing App contracts.
For new products, retain a project-local instruction entry pointing to actual
architecture and package scripts. For existing products, preserve user rules
and add only missing Asyra-specific context within authorized scope. Do not
embed host cache paths, force installation or prescribe unavailable APIs.

Starter's maintained `AGENTS.md` owns its continuation instructions and actual
test/type/lint/build commands. Synchronize the generated template through its
existing owner. Host-specific instruction discovery must be checked rather
than promised for every chat product. Reuse formal domain/history/projection/
lifecycle tests; no new duplicate checker is necessary for existing contracts.

Acceptance: a generated consumer retains the instruction entry and referenced
guides; documented commands exist in the generated package. Formal checks prove
packaging/continuity artifacts, not model obedience. Real creation and a fresh
conversation extension remain separately observed behavioral acceptance.

## Stage 3 - Support evidence and closure

Separate source discovery, installation, native loading, product creation,
fresh-conversation extension and verification execution. Keep host/model/version/
route/source evidence explicit. Record the observed 0.1.7 Grok CLI and Claude
Desktop loading trials as historical evidence, never as 0.1.8 acceptance.
Name-only discovery and public-GitHub self-installation have not passed merely
because manual local install or ZIP upload passed. Grok free quota is exhausted.

Permanent acceptance scenarios cover natural install, creation and continuation
requests, along with reviewer checks and failure attribution. Full development
support requires observed creation, extension and checks on that host. Publish
no blanket cross-tool guarantee. Unrun trials remain visible with their reason.

## Frozen checks

- Naming baseline before metadata/identifier changes and after the first slice.
- Bundle tests, freshness and version comparison against 0.1.7.
- Existing Starter template generation/freshness and consumer instruction tests.
- Focused formatting, ESLint when executable files change, changeset admission
  and `git diff --check`; applicable shared CI selection before delivery.
- Bounded self-review of claims, installation sources, references and actual
  validation outputs. No paid model/API calls or new account setup.

## Outcome and evidence

Stages 1-3 are implemented and reviewed locally. Candidate 0.1.8 keeps the
`asyra-agent` installation identity, shares one Skill across wrappers, adds
project continuity instructions and provides version-scoped support evidence.
Natural prompts remain product-oriented; the host derives technical contract
fields. The generated Starter retains its canonical guide and resolvable local
architecture/onboarding links with actual package scripts.

Validation on the completed slice:

- Naming baseline and post-slice gates: 15 tests passed each.
- Bundle and consumer CLI focused tests: 29 passed, including Yarn/npm product
  generation, instruction-byte preservation, local links and script availability.
- CI-selected shared checks: 83 repository tests, 15 naming tests and scoped
  ESLint passed; no unknown changed-path relationships.
- CI prerequisite: all 19 selected Framework declaration builds passed.
- Bundle freshness and version comparison against retained 0.1.7 passed.
- Skill frontmatter validation and standalone export passed. The export uses
  the canonical Skill bytes; no installed host cache was changed.
- Starter generation/freshness and package dry-run passed; the 56-file package
  includes `template/AGENTS.md` and `template/docs/ARCHITECTURE.md`.
- Focused formatting, changeset admission and diff whitespace checks passed.

Failure record: an initial plugin README link escaped the portable package;
the existing relocation test caught it and the source-checkout reference was
corrected. The first shared document run failed three freshness checks before
Framework declarations existed. Running the CI declaration prerequisite resolved
all three without editing public generated indexes. One CI wrapper invocation
lacked execution identity and was rejected before checks; subsequent runs use
an explicit local working-tree identity. No failed trial was counted as success.

Review was limited to the scoped diff, packaging consumers, project instruction
links and declared gates. No Framework/App runtime was changed. Public GitHub
CLI syntax was checked against local help and official developer commands;
that is documentation validation, not a public-source installation trial.

## Remaining external acceptance

Fresh 0.1.8 host loading, natural name-only/public-source installation, creation
and fresh-conversation extension remain unverified. The public-source trial
requires this candidate to be published; Grok product trials also require
available quota. See `support-evidence.md` and `acceptance.md`. These are separate
behavioral acceptance stages, not passing results inferred from local checks.
Publication, remote push and PR creation are separate actions. This plan closes
only the authorized local implementation and validation.
