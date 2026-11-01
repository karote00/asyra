# Rule: Release Update Guidance

## Workflow ownership

Each workflow validates its own inputs and outputs:

| Workflow               | Responsibility                                                           | Completion                                              |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Development            | Source, types, lint, builds and behavior tests                           | Applicable checks pass                                  |
| Plan closeout          | Review the implementation, archive the plan, append the owner's decision | Completed plan and owner `unreleased.md` agree          |
| Package publication    | Selected versions, packed artifacts, consumers and registry results      | Selected artifacts are published and verified           |
| Create-app publication | CLI/template distribution and required published dependencies            | The selected distribution is published and verified     |
| Project release update | Owner decision streams, shipped changes and consumer guidance            | GitHub Release information reflects verified deliveries |

Changesets calculate package versions during release preparation.
`release-configs/<app>.json` configures template generation.
Flow Inspector evaluates the required criteria of the current contract from
current test results. All required criteria must pass for completion.

## Plan closeout

Follow [plan closeout](../../workflows/plan-done-closeout.md). Record the outcome
once in the owner's `decisions/releases/unreleased.md`, linking the completed
plan. If implementation is already merged, complete closeout in a follow-up
change that references the reviewed implementation.

## Project release updates

Read owner `unreleased.md` streams and their versioned archives. Review shipped
changes against verified package or app delivery results, then prepare the
GitHub Release description and any integration guides consumers need.

Use `yarn docs:updates:check` during release-update preparation to check retained
history and referenced guides. `UPDATE_GUIDANCE_BASE_SHA` and
`UPDATE_GUIDANCE_HEAD_SHA` select committed inputs; the default compares the
working tree with HEAD. Release cuts archive the previous owner stream intact.
Corrections append new information.

## Implemented release admission and retry boundaries

Publishers bind source, the per-delivery predecessor, dependency requirements
and artifact integrity before mutation. Generated admission evidence lives at:

- Framework: `tmp/framework-release-guidance.json`
- Create-app: `tmp/create-app-release-evidence/<app>/guidance.json`
- Cloudflare: `tmp/cloudflare-release-guidance/<app>.json`

npm retries require the same version and integrity. Cloudflare retries require
the same source, artifact bytes and deployment identity. Retained candidates
preserve the original predecessor. Newer deployments use verified predecessors.
Publication follows the explicit authorization in the
[Git policy](../../workflows/git-commit-push-policy.md).

## Durable public release records

Owner streams supply release prose; verified delivery results supply publication
identities. Keep the resulting GitHub Release and delivery evidence accessible.
Public documentation summaries use the existing `release-summary` format under
`docs/public/updates/releases/` and the public content manifest. The format and
reader are owned by `scripts/docs/release-history.mjs`.

Use `yarn docs:public` and `yarn docs:public:check` when updating public release
pages. Published records retain their identities and guide references; corrections
use a new record linked to the corrected release.

## Consumer guidance

Describe changes, affected consumers, necessary actions and verified versions.
Integration guides refer to current public APIs and preserve app-owned extensions.
Consumers review the relevant changes between their adopted and target releases.
