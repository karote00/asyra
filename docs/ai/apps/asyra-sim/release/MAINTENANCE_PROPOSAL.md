# Sim candidate maintenance proposal

Status: proposal only. This does not change repository policy, open an issue
channel, promise support, or authorize M6 outreach/publication.

For controlled pilots, propose one explicitly named coordinator and a privately
agreed reporting channel. Users share only the reviewed minimal synthetic
reproduction described in [the sharing preview](PILOT_REVIEW.md#diagnostic-sharing-preview).
Do not guess an email address or send confidential/security details to public
issues. The existing repository contribution and security policies remain in
force until an authorized decision changes them.

Before any pilot invitation, record the coordinator and actual channel with the
participants. Before R0, approve a maintenance owner, public reporting scope,
private vulnerability channel, and the relationship to the Framework policy of
not accepting external issues/PRs. A Sim-specific public channel is a proposed
exception requiring approval, not an implicit repository-wide change.

Proposed support covers reproduction within the documented platform/method
limits, candidate integrity and data recovery. It excludes equipment operation,
industrial safety certification, vendor calibration and guaranteed response
times. Free availability includes no SLA or unlimited immediate support.

For serious missed findings, corrupted evidence or data loss: stop recommending
the affected candidate, preserve original artifacts and backups, identify
affected source/artifact versions, and notify participants through the approved
channel with the uncertainty stated. Reproduce with a permanent regression,
correct the first responsible owner, rerun affected gates and produce a new
traceable candidate. Never silently replace old result evidence or a candidate
archive under the same checksum. Withdrawal and external notification still
require an accountable authorized maintainer.

Keep the exact source, checksums, dependency identities, notices, validation
records and original backups for each candidate. Later updates retain the prior
known-working version and explain limitations and migration/recovery steps.
Test restoration before recommending an update. Final retention duration and
hosting/distribution location require an owner decision; this proposal creates
no service or automatic cleanup job.
