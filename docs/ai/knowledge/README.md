# Knowledge Context

Knowledge is an independent repository domain, alongside Framework, Apps and
Tools. It is not a Framework subsystem. This folder owns shared knowledge
content contracts, composition semantics, plans and their decision history.

## Read order

1. [Architecture](ARCHITECTURE.md): ownership and dependency boundaries.
2. [Plans](PLANS.md): active work and acceptance contracts.
3. The selected plan and its direct implementation/test references.

The organization follows the Framework context's separation of architecture,
plans and completed records. Add further documents only when they have an actual
owner and purpose; do not copy Framework runtime rules into knowledge content.

## Source boundaries

- `domain-knowledge/`: independent root workspace `@asyra/domain-knowledge`.
  Only flat Markdown knowledge files and necessary package metadata belong here.
- `packages/ai-agent-runtime/`: optional Framework adapter contracts, owned by
  Framework documentation. It consumes normalized knowledge metadata and content.
- Apps: file selection, loading, parsing, retrieval, content caching, specialized
  knowledge and persistence, owned by each App's documentation.

Repository-wide instructions still apply to development. They do not turn
advisory knowledge into system instructions or make Framework its owner.
