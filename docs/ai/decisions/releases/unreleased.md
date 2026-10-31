## 2026-09-04 — Approved App Reset Ownership

Asyra Sim project replacement will orchestrate complete Framework runtime
termination and fresh composition through Core, with App storage/UI resources
remaining App-owned. Feature quiescence is the first implemented owner slice;
the complete reset remains in progress. Ordinary load and destroy retain their
contracts. See the [App decision](../../apps/asyra-sim/decisions/releases/unreleased.md#2026-09-04--replace-projects-through-complete-app-runtime-reset).

## 2026-11-01 - Independent workflow validation

Development validates source and behavior, package and create-app publishers
validate their artifacts, and project release updates use owner decision streams.
Changesets prepare package versions. Plan closeout records the reviewed outcome
and can follow an earlier implementation merge. Flow Inspector completion uses
current contract results.

Removed PR release-note/Changeset admission, the development CI package-readiness
job, repeated Inspector proof commands, and prose-based readiness assertions.
Artifact integrity, retry correctness, current test results and execution resource
guards remain covered by formal tests. Local validation passed; PR delivery and
remote CI verification follow separately.

Completed plan: [Workflow Validation Simplification](../../plans/completed/release-record-workflow-unification-plan.md).
