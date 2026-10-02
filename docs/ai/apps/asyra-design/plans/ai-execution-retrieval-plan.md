# AI precise retrieval and work reuse

Status: implementing registry discovery; recording is locally complete.
Parent: [improvement plan](ai-execution-improvement-plan.md).

## Outcome and scope

AI can find applicable registered operations and retrieve exact required scene
data without repeatedly rediscovering names or reading the whole scene. Extend
the existing API registry, descriptions, artifact targets and narrow queries.
No context-rag dependency, vector database, second editable model or extra model
call for routine data preparation.

## Tasks

1. Trace existing registry/discovery consumers; add bounded purpose/name search
   over current registered descriptions where missing. Retrieve complete current
   schema by exact name after discovery; never truncate required parameters.
   An empty search is not evidence that the App lacks a capability. Preserve
   access to the complete compact catalog and custom registrations.
2. Prove existing artifact target maps/plural operations and field selection in
   permanent caller tests. Repair demonstrated gaps; preserve current existence,
   permission, document identity and revision checks. Queries return requested
   data and explicit completeness; known IDs never require semantic guessing.
3. Inspect measured repeated source loading/analysis within a request. Route to
   existing immutable artifacts first. Introduce retained work only with proven
   repeated cost, exact validity/release and work-count/equivalence tests. Record
   intentional non-reuse when bytes/configuration/identity differ. No blanket
   cross-request reference cache or fixed search sources.

## Completion

Formal cases cover name/purpose discovery, custom registration, no-match recovery,
exact schema, plural targets, field selection, deleted/replaced/locked targets and
current-data invalidation. Record supported before/after work counts. Sync tools,
prompt guidance and their exact Inspector owner boundaries, then run focused
provider/operation/context tests, App type/build/lint and final live acceptance.


## Active step card - compose registry lookup

Spec: Capability discovery and composition. Inspector: compose. Input is the
current invocation's admitted basic-API descriptors and optional exact names or
lexical name/purpose query. Output is a complete compact matching index or full
current schemas by exact name. No match exposes an explicit path back to the
complete catalog; it cannot declare a capability unavailable. Exact names and
query are mutually exclusive. Custom descriptor schemas/descriptions supplied
for admitted API identities remain authoritative; this does not admit arbitrary
new operations or change execution permissions.

Owner files: local-operation-tools.ts discovery branch and its formal tests,
ai-domain-prompt.ts if guidance needs sync, execution proof. Allowed contributors
are existing registration/contract metadata; forbidden are scene traversal,
model classification, geometry, semantic guessing of IDs, and blanket caches.
Failure belongs to compose input admission. Existing query without arguments
retains the complete compact catalog. No retained derived cache is introduced;
the admitted descriptors live for one invocation. Tests prove purpose/name
matching, current descriptors, exact schemas, empty-result recovery, payload
reduction and unchanged capability access. Gates: operation/provider/proof,
App typecheck/build, lint/naming and source-bound contract review. Target maps,
query execution and reference analysis are separate later owner segments.


## Discovery checkpoint

The admitted basic-API registry now supports optional lexical name/purpose lookup,
complete compact results and explicit no-match recovery. Exact-name schemas
retain the current invocation's descriptors. Formal proof keeps all registered
capabilities reachable; a narrowed query has fewer response bytes than the full
catalog and makes no canvas calls. No speed claim is inferred from this proof.

Four focused suites passed 173 tests, three existing opt-in live cases skipped.
App typecheck/build, scoped lint/naming and Inspector contract checks passed.
Source-bound candidate `2c2cadfa-b803-4109-8df7-eb41314792c5` and contract review
`58fdcb19b27d03a363148d0f4141febb463141e3f90222ea32416f0e335786d7` passed/accepted.
Target/query/reuse proof and final live acceptance remain. Direct caller review
also identified a recording gap: batched operation selectors are currently
omitted by the diagnostic allowlist; repair at observe before final acceptance.
