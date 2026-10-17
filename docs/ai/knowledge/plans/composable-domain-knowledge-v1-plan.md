# Composable Domain Knowledge V1

Status: Implemented; local delivery verification passed. PR delivery and user review pending.
Owner: Codex in the current task; user owns PR review and merge.
Base: `origin/main` at `6974bb0d94813a034e35b4598b51fbeb263727df`.
Branch: `codex/domain-knowledge-v1`.
Worktree: `.worktrees/domain-knowledge-v1` in the main repository.

## Objective and task association

Deliver V1 composable domain knowledge, optional agent-runtime knowledge access,
and initial Asyra Design integration in one reviewable PR. This task creates and
implements this plan in the same isolated branch; it is not a delegated child
task requiring a previously merged plan. No other worktree may be edited.
Push and PR creation are authorized. Merge, publication and deployment are not.

## Bounded scope

- A root-level independent `domain-knowledge/` workspace named
  `@asyra/domain-knowledge`, root workspace metadata and necessary admission gates.
- Optional knowledge contracts in `packages/ai-agent-runtime`, reusing existing
  registration, discovery, invocation and context boundaries where appropriate.
- Asyra Design's existing provider/tool composition, app-owned knowledge and
  their direct tests, documentation and flow contracts.
- Applicable workspace generation, lockfile, scoped Changesets and documentation.

Keep action authorization, transaction ownership, saved document formats,
existing tool composition, model selection and unrelated app behavior intact.
Discovery is bounded to these owners, their public consumers, workspace/release
configuration and the existing Flow Inspector workflow. After implementation
starts, review only this diff, direct consumers, defined cases and selected gates.

## Architecture contract

Knowledge is an independent domain alongside Framework and Apps. Its documentation
authority is `docs/ai/knowledge/`; Framework owns only its optional Runtime adapter.
See `../ARCHITECTURE.md` for ownership and `../README.md` for the context entry.

1. The shared workspace contains knowledge files and necessary package metadata
   only: no executable API, loader, parser, registry, runtime, service or dependency
   on Framework, Apps or models. Knowledge files are all at one level. The basename
   is the knowledge ID; dots do not imply directories or inheritance.
2. Shared documents use Markdown and YAML frontmatter. Each supplies useful
   What, Why, How, provenance and advisory Evaluation Guidance. Start with only
   content justified by the Design integration, such as typography, icons,
   colors, components.button and design.landing-page; do not generate empty topics.
3. References compose knowledge; extends adds targeted advice; overrides names
   its target explicitly. Resolution supports nested dependencies, deduplication,
   cycle detection, provenance and deterministic conflicts. Freeze the precise
   precedence and rejection semantics during design review before implementation.
4. Apps select and own loading, retrieval, content caches, specialized files and
   persistence. App-specific extensions need not adopt unnecessary shared-format
   restrictions. Apps and embedded Agents never write the shared source package.
5. Runtime access is opt-in and inert when absent. Discover bounded metadata,
   retrieve low-level knowledge on demand and resolve only relevant compositions.
   Multiple retrievals in one task are supported; docs-page and landing-page
   button advice remain distinguishable by task context.
6. The App explicitly registers, updates and unregisters metadata/revisions.
   Provider/App owns content caching; Runtime owns agent-context reuse. Revision
   changes invalidate dependent context consistently, including in-flight reads.
   Define all tenant, scope, task, intent and revision dimensions before reuse.
7. Knowledge and search results are untrusted advisory data. They cannot grant
   system-instruction, tool, authorization or write privileges. Separate read
   access from trusted App administration, enforce current authorization and
   tenant/scope isolation, reject unsafe references/paths and bound graph, bytes,
   depth and retrieval work. No model-selected filesystem path is trusted.
8. V1 has no Agent/search extraction, knowledge mutation or persistence route.
   App-supplied replacement files and explicit metadata updates are the only
   update path. Knowledge evolution, approval and automatic extraction are future
   work. No RAG, vector database, embedding/ranking engine or knowledge service.

## Task 1 - Audit and reviewed design

Before production edits, inspect current Runtime registration/context contracts,
Design Public API discovery and provider invocation, workspace admission and
release ownership. Record concrete reuse decisions here. Review the complete
flow, owners, handoffs, error paths and accepted behavior against current code.
Create and validate the applicable Flow Inspector contract using its supported
current workflow; do not fabricate readiness or execution evidence.

Expected flow: trusted App file admission and metadata registration -> scoped
metadata discovery -> authorized contextual read -> bounded dependency resolution
and provenance -> advisory provider context with Runtime reuse -> ordinary
existing authorized action execution. App administration is a separate route;
an update invalidates affected reads/reuse before a successor revision is served.

Readiness requires concrete public API contracts, deterministic conflict rules,
resource limits, lifetime/invalidation dimensions and formal test locations.
Stop the affected segment for unresolved ownership or unsupported required gates;
resolve in-scope gaps without changing unrelated tooling or weakening checks.

## Task 2 - Shared content and Runtime access

Implement the reviewed data-only workspace and optional Runtime contracts.
Use permanent tests in existing `__tests__` conventions. Run the naming gate
before identifiers spread and after the first implementation slice. Validate
this owner before wiring Design consumers.

Acceptance tests:

- Flat package archive contains only knowledge Markdown and required metadata;
  no executable entry point or runtime dependency.
- Nested references and diamond dependencies resolve once with provenance;
  extends and explicit overrides produce deterministic output regardless of
  registration order; invalid, ambiguous or cyclic graphs fail explicitly.
- Context filters exclude unrelated specializations, while two distinct intent
  lookups in one task return the applicable advice without losing either result.
- Repeated equivalent reads reuse valid context; changed direct/transitive
  revisions, unregister, task/scope changes and disposal invalidate reuse.
  Assert operation counts and output correctness, including in-flight updates.
- Unauthorized reads/administration fail closed; tenants/scopes do not share
  context; traversal, oversized input, graph exhaustion and malicious content
  cannot trigger writes, tool execution or privilege escalation.

## Task 3 - Asyra Design integration

Compose the read capability through existing model-facing discovery and invocation.
Select a small actual document set and app-owned specialization. Keep loading and
content cache in the App, and expose no knowledge administration tool to Agents.

Acceptance tests:

- The normal provider path advertises knowledge metadata without injecting all
  content, and performs multiple authorized reads during a single task.
- Docs-page versus landing-page button intent selects appropriate shared and
  specialized advice; unrelated specializations are absent.
- App replacement/update/unregister produces fresh metadata and context; failure
  and request teardown cannot leak retained state into another task or tenant.
- Existing Public API tool discovery, invocation permissions and transaction
  behavior remain covered on the same source. Knowledge-only reads never create
  document changes or Undo entries.

## Task 4 - Verification and PR delivery

Run focused Runtime and Design tests, affected package builds/types, applicable
lint, naming, test placement, workspace/Turbo generation, dependency admission,
documentation and Changeset checks. Select exact commands from current manifests
and CI routing during Task 1; record actual results here, including unavailable
checks. Use existing applicable integration/E2E gates and current flow evidence.

Review the bounded diff, fetch main again, incorporate any newer base under the
Git policy and repeat affected gates. Commit validated work, run commit-dependent
admission checks, push and create a PR with task context, architecture, changes,
test results and limitations. Inspect CI for the exact head and report pending
or failed results truthfully. Leave the plan active until reviewed closeout;
do not equate implementation delivery with user approval.

## Initial preparation evidence (historical)

- Fetched latest main and created the isolated branch/worktree listed above.
- Inspected repository entry, task-context, Git policy, Runtime registry/provider
  surfaces and current Flow Inspector authoring guidance.
- No production implementation or tests have been changed.
- `yarn lint:naming` could not start because the new worktree has no installed
  dependency state. Install only existing declared dependencies inside the project
  before retrying; no new third-party dependency is authorized.
- Next: complete Task 1 audit and record reviewed design and exact gates before
  starting Task 2.

## Task 1 findings and implementation decisions

- Runtime `action-registry.ts` registers executable tools, not passive knowledge.
  Reusing its action definitions for documents would incorrectly grant execution
  semantics. A separate optional knowledge adapter will expose passive metadata
  and resolution; existing invokers and Design tool registration remain the only
  model-facing tool route. No Core dependency or automatic global installation.
- Design `server/local-ai-provider.ts` builds request-owned tool groups through
  `createLocalToolHost`; native declarations are deferred. Add a read-only
  knowledge group there, with the same schema validation and invocation path.
  Request teardown disposes knowledge context alongside the existing host.
- `local-operation-tools.ts` already offers detailed API discovery; keep its
  catalog unchanged. Knowledge discovery returns IDs, descriptions, contexts and
  revisions, never the full content set. Read calls select IDs and task context.
- The existing Runtime context provider reads canonical App state for action
  batches. Passive knowledge context is separately owned and cannot replace that
  state or the permission/transaction pipeline.
- Root workspace patterns currently omit literal root directories. Turbo's
  discovery assumes `/*`; extend that scanner and its permanent tests for the
  explicit `domain-knowledge` entry. Do not add fake build scripts to the package.
- The new worktree installed existing lockfile dependencies successfully, with
  existing Yarn peer/optional TypeScript patch warnings. Naming baseline: 15/15.

### Public knowledge contract and conflict policy

Runtime exports an opt-in knowledge controller with trusted administration and
request-bound read sessions. Construction takes a mandatory host authorization
callback and a host content provider. There is no filesystem access in Runtime.
The callback receives an operation, trusted session identity and document metadata;
exceptions or false results deny access. Model arguments cannot set tenant, scope,
principal or task identity. A host creates the session from authenticated context.
A controller belongs to one tenant/scope; another scope requires another instance.

Metadata contains ID, monotonic revision, description, provenance, optional context
labels, references, extends targets and explicit override target declarations.
IDs are bounded dot-separated alphanumeric/hyphen identifiers, never paths or URLs.
An update requires an exact previous revision and a newer successor; unregister
also compares revision. Admin credentials are closure-held host values and never
serialized in tool metadata. Revocation is checked on every read and discovery,
including reuse, and after asynchronous provider settlement.

The provider returns the requested revision and text. Runtime rejects mismatches,
empty/oversized content and stale graph generations. Content remains advisory text;
no evaluation, interpolation, callback construction or execution is supported.
App parses shared Markdown/frontmatter into metadata and content; Runtime accepts
normalized descriptors so other Apps can retain their own file format extensions.

References include dependencies. Extends includes its target plus additive advice.
An override explicitly replaces the target's advice in the resolved view, retaining
both source identities in provenance. Higher numeric override priority wins;
equal-priority competing replacements fail explicitly. Independent contributions
sort by ID; dependencies precede dependents. Shared files are never mutated.
Specialized descriptors apply only when their context labels intersect the current
query labels. Missing or inapplicable required dependencies fail rather than
silently changing meaning. Discovery filters before returning metadata.

One session supports multiple distinct queries. Runtime tracks delivered document
ID/revision and resolved context signatures only for that task. A repeated read
can report already-delivered advice without repeating its text, but must still
recheck authorization and graph validity. Provider/App may reuse parsed immutable
file contents; Runtime does not own a second content cache. Any registration change
invalidates delivery reuse and in-flight reads conservatively. Bound registered
entries, session deliveries, query IDs, graph depth/nodes and returned text bytes.
Dispose prevents late delivery and releases session context.

### Design integration and file admission

Design selects five shared documents and an app-owned docs-page composition.
The App loads only an explicit allowlist of package-exported Markdown paths;
model-supplied IDs are looked up in admitted metadata and never joined to paths.
Shared documents use YAML's JSON-compatible subset in frontmatter, parsed with
JSON parsing after strict delimiter/size checks. This is valid YAML without a new
third-party parser; arbitrary YAML syntax is not promised by the initial App loader.
The data package itself imposes no executable parser or API on consumers.

Read tools offer metadata discovery and contextual resolution. Their descriptions
and results state that content is untrusted advice and grants no tool privileges.
No admin/update/save tool is registered. The local host owns its trusted scope and
request identity; future multi-tenant hosts must supply their own authenticated
boundary. Tests exercise independent scopes and live authorization changes.

### Frozen verification commands

- `yarn lint:naming`; `yarn gen:turbo:check`; `yarn deps:validate`.
- Runtime `test:local` and `build:ai-agent-runtime`.
- Design focused knowledge tests and normal-provider integration, then
  `test:server-response-harness`, `test:ai`, `typecheck`, and `react:build`.
- Workspace automation, test-file placement and knowledge archive tests under
  `scripts/__tests__`; affected CI-scope/Changeset tests if admission changes.
- `yarn lint:workspaces:ci`, applicable public documentation generation/checks,
  `git diff --check`, and `changeset:pr:check` against the committed exact head.
- Current Flow Inspector contract validation and evidence for the same source.
  Rendering geometry and collaboration transport are unchanged; their expensive
  geometry/performance suites are not evidence for knowledge resolution.

### Current owner step

Task 2a, shared content and workspace admission: inputs are reviewed knowledge
content and existing workspace manifests; outputs are the flat data-only archive
and discoverable workspace. Allowed contributors are package metadata, shared
Markdown, root workspace configuration and directly affected workspace scanners
and tests. Forbidden contributors are executable files in domain-knowledge,
framework/app/model dependencies and writes to other worktrees. Failure belongs
to workspace admission. Gates are archive/content tests, workspace generation,
placement, naming and dependency validation. Stop on a required new third-party
dependency or unrelated release topology change. Runtime and App edits follow only
after this segment's bounded verification.

### Task 2a evidence

Flat content workspace implemented. Workspace/content/placement tests: 45 passed.
Naming: 15 passed. Dependency validation: passed, 29 workspaces. Turbo check:
passed without adding a build task for the data-only workspace. Actual Yarn pack
contains exactly five Markdown files and package.json. No executable package
entry or runtime dependency exists. Existing dependency installation warnings do
not affect these passing gates.

### Task 2b owner step

Owner: optional Runtime knowledge access. Input: normalized immutable metadata,
trusted scope/principal/task identity, current host authorization, revision-bound
content provider. Output: bounded discovery, dependency resolution with provenance
and request-local delivery reuse. Read sessions have no administration methods.
Admin authorization is required independently. Optional composition bypasses all
knowledge behavior when absent. Runtime may not load files, execute content,
persist advice or mutate App/document/shared sources. Implementation boundary:
`packages/ai-agent-runtime/src/knowledge*.ts`, their colocated `__tests__`, public
exports and Runtime contract documentation. Failure owner: knowledge controller;
all authorization/limit/revision failures reject before returning content. Tests
cover composition/conflicts, relevance, multiple reads, isolation, invalidation,
in-flight revisions, revocation, disposal and limits. Stop if this requires a new
execution authority, dependency, or change to canonical action transactions.

### Task 2b current evidence

Implemented the optional exported knowledge controller and passive metadata types.
The read session exposes only discovery/retrieval/disposal. Tenancy and scope are
controller-owned; current authorization is checked on reads and after provider
settlement. Metadata revisions invalidate per-task delivery context. Normalized
content never executes and the module has no filesystem or persistence imports.

Runtime suite: 31 files / 399 tests passed, including ten new knowledge tests.
A lower-priority override leaked as standalone advice in the first focused run;
the permanent priority test detected it and the owner correction passes.
After the subsequent lint-only correction, all ten focused knowledge tests,
Runtime TypeScript build and focused ESLint passed. Naming gate: 15 passed.

Remaining before delivery: strengthen adversarial/resource cases and actual
cross-tenant fixtures, complete Design file admission/tool integration and its
normal-provider tests, synchronize public contracts/Changeset, publish current
Flow Inspector evidence, run full selected gates and create the PR. No push or
PR has occurred. Runtime tests alone do not establish App integration.

### Task 3 owner step

Owner: Design knowledge adapter. Allowed inputs are allowlisted shared/App files,
trusted request identity and model-selected knowledge IDs/context labels. Output
is a deferred read-only tool group under the existing host; no browser mutation,
admin capability or persistence tool is introduced. Implementation boundary is
Design server knowledge modules/tests, provider wiring, App knowledge files,
AI tool constants, package dependency and relevant type/test configuration.
The App admits normalized descriptors and caches its source text; Runtime owns
revision checks and request delivery reuse. Invalid files fail at App admission;
unauthorized reads and stale revisions fail at Runtime. Cases cover both button
contexts, repeated calls, normal host validation, file replacement and poisoning.

## Integrated delivery evidence

The independent root workspace, optional Runtime controller and local Design
provider integration are implemented. Source ownership remains split between
Knowledge, Framework adapter and App as specified. CI now treats knowledge
Markdown as behavior input and propagates it to its consumer; content-only
workspaces do not receive fictitious executable build/test tasks. Permanent
regressions verify discovery, consumer invalidation and archive-content contracts.

Validation on the current candidate:

- Runtime: 31 test files, 406 tests passed; TypeScript build passed.
- Design server: 1,296 passed, two existing skipped cases; normal-provider and
  knowledge owner suite rerun after final Runtime changes: 189 passed, one skipped.
- Design AI: 50 files, 609 tests passed. Backend boundary: 13 passed.
- Design typecheck and Turbo production build passed. Existing large-chunk build
  warnings and test-environment canvas messages remain unchanged.
- Workspace/CI/content/placement/Changeset-policy tests: 126 passed.
- Naming: 15 passed; dependency validation passed across 29 workspaces; Turbo
  generation check passed. Actual package archive contains five Markdown files
  and package metadata only.
- Full ESLint: zero errors, 121 existing warnings. Final focused lint: zero errors,
  three existing provider console warnings.
- Public documentation generation/check and validation passed (41 pages,
  19 package guides, 291 local links, 135 API references).

The final review additionally retained regression coverage for equal-priority
conflicts across a stronger override, exact graph capacity with duplicate
references, and eight concurrent provider reads per session. No arbitrary
filesystem path, administration action or persistence tool is model-facing.

Explicit V1 limits: the initial Design loader accepts JSON-compatible YAML only;
context labels and selected IDs drive relevance rather than automatic ranking;
the local provider is integrated, while other providers may compose the optional
Runtime API separately. Provider I/O deadlines remain host-owned. Shared metadata
and body advice cannot grant privileges. Evolution, Agent extraction/persistence,
registry publication, merge and deployment are outside this delivery.

The remaining delivery actions are the exact-head Changeset check, fresh-main
confirmation, push, PR creation and CI observation. User review and plan closeout
remain distinct from implementation delivery.
