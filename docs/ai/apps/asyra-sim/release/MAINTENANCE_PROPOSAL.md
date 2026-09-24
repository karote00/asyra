# Sim candidate maintenance proposal

Status: proposal only. This does not open a Sim reporting channel, promise
support, or authorize M6 outreach/publication. The repository's intended
general-help channel is GitHub Discussions, which is not enabled yet; general
Issues and external PRs are not the default routes.

For controlled pilots, propose one explicitly named coordinator and a privately
agreed reporting channel. Users share only the reviewed minimal synthetic
reproduction described in [the sharing preview](PILOT_REVIEW.md#diagnostic-sharing-preview).
Do not guess an email address or send confidential/security details to public
issues. Follow [SECURITY.md](../../../../../SECURITY.md) for suspected
vulnerabilities; pilot coordination and security reporting remain separate.

Before any pilot invitation, record the coordinator and actual channel with the
participants. Before R0, approve a maintenance owner, public reporting scope,
private vulnerability channel, and how Sim reports use the repository's
[support policy](../../../../../SUPPORT.md). A future Discussions entry alone
does not name an owner or approve Sim's reporting and correction obligations.

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
