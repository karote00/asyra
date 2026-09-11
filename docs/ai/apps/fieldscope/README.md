# FieldScope documentation

FieldScope is a private greenhouse planning and future harvesting-robot monitoring workspace. Version 0.1.0 was introduced by PR #170. All dimensions are metres.

Read [App essentials](APP_ESSENTIALS.md), [Architecture](ARCHITECTURE.md), [API surfaces](API_SURFACES.md), [Constraints](CONSTRAINTS.md), then the relevant specification. The structure follows Asyra Design's documentation routing, with only responsibilities that FieldScope actually owns.

## Routing

- [Coding standards](CODING_STANDARDS.md) and [Workflow](WORKFLOW.md)
- [Request routing](REQUEST_ROUTING.md) and [Best practices](BEST_PRACTICES.md)
- [Greenhouse specification](specs/greenhouse.md)
- [Configuration and history](specs/configuration.md)
- [Camera controls](specs/camera.md)
- [Water and crop specification](specs/water-and-crops.md)
- [Rendering module](modules/rendering.md)
- [Product scope](prd/overview.md)
- [Executable product scenarios](bdd-features/greenhouse.feature)
- [Plans](PLANS.md) and [0.1.0 baseline decision](decisions/0.1.0.md)

Specifications own behavior; modules own implementation boundaries; plans describe intended work and never override either. Framework documentation remains authoritative for Core, events, transactions, and rendering contracts.
