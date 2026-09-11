# Unreleased decisions

## 2026-09-11 - Water and crop population plan closeout

Context: PR #174 merged on 2026-09-11 as `59c8c1d36ffb4cc95683616d931ca4407607ed8c`. Its final head `5918a2526ef2943170d581781450fe3f41797635` passed all five CI jobs. Local validation passed 172 unit tests and the build; the completed visual review passed 31 browser cases and the expanded bilingual layout checks.

Decision: accept the implementation as DONE and archive the [plan](/docs/ai/apps/fieldscope/plans/completed/water-and-crops/plan.md) and its [Inspector flow](/docs/ai/apps/fieldscope/plans/completed/water-and-crops/inspector-flow.md). This supersedes the plan's interim status that PR validation remained outstanding; historical execution notes are retained unchanged apart from relocated links.

Consequences: water/crop geometry, natural cultivar variation, performance ownership, immediate editing/history, camera gestures and bilingual presentation are maintained through the current app specifications and formal tests. No active implementation task remains in this plan. Robot behavior, harvesting physics and load/clearance validation were not delivered by this plan.

Release boundary: documentation closeout only. FieldScope remains private at version 0.1.0. No Changeset, version bump, tag, package publication or deployment is created or required.

## 2026-09-11 - Backfill earlier FieldScope closeout records

Context: the user requested closing earlier completed FieldScope work that lacked records. Repository and merged-PR history identify PR #170 (initial workspace) and PR #174 (subsequent crop/workbench work). The initial 0.1.0 decision existed, but its completed-plan record was missing.

Decision: add the [retrospective baseline closeout](/docs/ai/apps/fieldscope/plans/completed/greenhouse-workspace/plan.md), recording the actual merge time and the historical validation evidence. Retain the original baseline decision unchanged. Add explicit links to the completed PR #174 stages in [the plan index](/docs/ai/apps/fieldscope/PLANS.md); those stages remain part of the existing archived plan rather than being presented as newly invented plans.

Consequences: both merged implementation batches and their completed follow-up stages are discoverable. The earlier statement that baseline documentation was backfilled remains true; this entry supplies the missing closeout record. No implementation, deployment, version change or release action is introduced.
