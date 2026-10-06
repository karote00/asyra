# Asyra Skill support evidence

Keep source discovery, installation, native loading, creation, continuation and
verification as separate observations. Evidence is scoped to the actual bundle,
host and route; it does not transfer automatically to a later version.

## Historical native loading - 0.1.7

The following observations were recorded in the preceding maintenance session.
They are historical session evidence, not reproducible CI results or an
independent review. No new native trial is claimed by candidate 0.1.9.

| Host                                                      | Installation source and route                                                     | Observed result                                                                                                                              | Unverified                                                                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Grok Build CLI 1.0.46                                     | Local plugin directory; separate standalone discovery in isolated Skill directory | Plugin validation/discovery and model reads of SKILL.md, bundle.json and Starter architecture; reported 0.1.7 and relevant reference content | Name-only discovery, public GitHub self-installation, complete product creation and fresh-conversation extension |
| Claude Desktop 2.16120.0, Free account, Sonnet 5.5 Medium | Locally exported 17-file Skill ZIP; Customize > Skills upload                     | Enabled Skill, actual reads under `/mnt/skills/plugins/asyra-agent/`, 0.1.7 bundle and architecture answers                                  | GitHub self-installation, local product editing, complete creation/extension and product checks                  |

Claude trial:
<a href="https://claude.ai/chat/4d1ed2f3-54aa-46b8-92f2-697e1eba20dc" target="_blank" rel="noopener noreferrer">native loading conversation</a>
(account access may be required). Grok's historical loading response succeeded;
background requests also reported quota errors. Its free quota is now exhausted.
No paid calls or account changes are authorized by this plan.

Codex has earlier installed-version and product trials described in the project
history. They do not establish 0.1.8 behavior. Claude Code native acceptance is
still pending; Claude Desktop upload is not a substitute for it.

## User-reported Claude Desktop loading - 0.1.8

The user supplied two Claude responses in the maintenance conversation: Claude
obtained the Skill from `karote00/asyra`, produced a ZIP for manual upload, and
then read `/mnt/skills/plugins/asyra-agent/SKILL.md` and its adjacent bundle.
It reported `pluginVersion: 0.1.8` and the Starter architecture among 15 reference
files. The user performed the settings upload; Claude did not self-install into
the account. The precise source commit/digest, host/model version and product
creation/continuation checks were not supplied. This is user-reported loading
evidence, not an independently reproduced product trial or name-only discovery.

## Candidate 0.1.9

Packaging and capability-guidance checks are recorded in the
[capability guidance plan](capability-guidance-plan.md). Native candidate loading
and model decision quality remain **unverified**. The new acceptance scenarios
prepare existing-project assessments; passing resource checks does not prove
better diagnosis or implementation by a host model.

Use the permanent [acceptance scenarios](acceptance.md), recording:

- Exact source ref, bundle version/digest, host/client and model/settings.
- Discovery route, installation permissions and actual loaded paths.
- Created product revision, installed package versions and relevant owners.
- A fresh-conversation extension, saved-data/history behavior and actual checks.
- Failures, unavailable capabilities and manual intervention without erasing
  earlier attempts. Do not infer model obedience from passing packaging tests.
