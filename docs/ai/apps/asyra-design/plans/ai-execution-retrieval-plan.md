# AI precise retrieval and work reuse

Status: planned; depends on [recording](ai-execution-recording-plan.md).
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
