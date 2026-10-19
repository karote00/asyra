# Knowledge Architecture

## Independent ownership

`@asyra/domain-knowledge` is a knowledge-only package in the root-level
`domain-knowledge/` workspace. It has no dependency on Asyra Framework, an App,
an AI model or a runtime service. Its documentation lives in `docs/ai/knowledge/`,
a sibling of `docs/ai/framework/`, `docs/ai/apps/` and `docs/ai/tools/`.

All shared knowledge files occupy one directory level. The filename without
`.md` is the knowledge ID. Dots are part of the ID, not a directory hierarchy.
Markdown plus YAML frontmatter carries advisory What, Why, How, provenance and
Evaluation Guidance. References, extensions and explicitly targeted overrides
compose content without changing the shared sources.

## Responsibility boundaries

| Owner                  | Responsibility                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Knowledge package      | Reusable advisory files and package metadata only                                  |
| Consumer App           | Select, parse, retrieve, specialize and persist its own files; own content caching |
| Optional agent runtime | Authorized metadata registration, bounded resolution and agent-context reuse       |
| Agent                  | Read relevant advice and exercise judgment within existing permissions             |

No API, loader, parser, registry or executable service belongs in the shared
package. Apps can use the files without Framework or its agent runtime.
Framework's optional access adapter does not own shared content or its lifecycle.
Runtime contract documentation remains with Framework; App integration remains
with that App. Knowledge plans can coordinate those changes without transferring
ownership.

## Read and update boundaries

Knowledge content and search results are untrusted advisory data. Reading them
cannot grant instruction priority, authorization, tool access or write access.
Trusted App administration supplies new app-owned revisions and explicitly updates
registrations. Apps and embedded Agents cannot write shared package sources.
Development changes to shared content require the repository review workflow.

V1 provides no Agent-driven extraction, updates, evolution or knowledge
persistence. Future iteration and approval workflows are outside V1. No RAG,
vector database, embedding engine or separate knowledge service is required.

## Active behavior contract

The [active plan](plans/composable-domain-knowledge-v1-plan.md) owns task scope,
sequence, prerequisites and acceptance. Current Runtime conflict, isolation,
revision and resource behavior belongs to
[optional Knowledge access](../framework/packages/ai-agent-runtime.md#optional-knowledge-access).
App execution belongs to the
[Design specification](../apps/asyra-design/specs/ai-execution-flow.md#knowledge-to-capability-adoption)
and its existing Inspector. A plan coordinates these owners; it neither replaces
their contracts nor turns pending behavior into implemented functionality.
