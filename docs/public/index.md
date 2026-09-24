# Asyra Framework

Asyra is infrastructure for building products around app-owned information and
rules. A product may project that information as a design tool, whiteboard,
BIM environment, simulation system, or another domain product. The Framework
does not own the meaning of a building, manufacturing rule, chemical
constraint, design object, or AI task. That meaning remains in your product.

The same separation points toward future non-visible, machine-facing
information products. That direction is documented as a roadmap, not as a
supported Headless Core API in the current release.

## Choose your path

Begin with the small Generic Starter source if you want one editable Item path,
use the complete Design product when you want a working design tool, or move
to advanced composition when your product needs a different Framework assembly.
The remaining Concepts, Extend, and Reference sections explain the owners
behind each path.

### Generic Starter source

The [Starter source](../../apps/starter-app/README.md) is a small App-owned Item
example with title/status editing, Undo/Redo, and explicit Save/Reload. Its
[onboarding guide](../../apps/starter-app/docs/ONBOARDING.md) and
[opt-in priority exercise](../../apps/starter-app/docs/PRIORITY_EXERCISE.md)
show a coding agent changing App source through the existing Feature, API,
transaction, projection, and persistence owners. The App does not include an AI
runtime or provider for that exercise.

`create-asyra-app` is not yet published to the public npm registry. The source
and generated template can be inspected in this repository; a public Starter
installation command is not active.

### Complete Design product

Use [create-asyra-design-app](start/create-design-app.md) for an immediately
editable design tool whose App-owned behavior you can replace. The
[Asyra Design case study](cases/asyra-design.md) identifies the Framework,
Preset, App, and backend owners of that product.

### Advanced composition

Use [custom composition](start/custom-composition.md#build-one-complete-data-path)
when you deliberately need a different Core App assembly. That guide covers
transaction publications, persistence, scoped UI subscriptions, computation
reuse, and runtime lifecycle. The [official 2D Preset](start/preset-2d.md)
is a selectable baseline, not a universal product behavior.

The public documentation also uses five sections so readers can find the
architecture, app extensions, and exact package contracts after choosing a
starting path.

### Start

Use the source-available Generic Starter above for a small editable example,
or [create-asyra-design-app](start/create-design-app.md) for a published,
complete design-tool product. Use the
[official 2D Preset](start/preset-2d.md) when you are building a visual product
from Framework packages and want Asyra's maintained baseline. Read the
[Asyra Design case study](cases/asyra-design.md) to see how the official app
uses Framework owners without becoming the only supported product shape.

### Concepts

Concepts explain how Asyra works before asking you to write implementation
code. Begin with [information models](learn/information-models.md), then learn
how Features accept intent, canonical owners settle state, transactions stay
durable, load boundaries validate data, and projections remain separate from
providers. Concept pages describe the architecture and link to the appropriate
implementation path instead of mixing both levels in one guide.

### Extend

Extend is the normal path for adding app-owned product behavior. It covers
schemas, Feature sessions, hierarchy and Group policy, persistence migration,
collaboration, AI actions, and app-owned retrieval. Use it when the Framework
composition is correct and your product needs more domain meaning or behavior.
The [custom schema guide](build/custom-schema.md) is a practical first step.

### Customize

Customize is the advanced path for changing the Framework composition itself.
Use [custom composition](start/custom-composition.md) to construct only the
current owners your runtime needs, or the
[custom render-boundary guide](build/render-boundary.md) to replace a provider
through its public contract. These guides assume you deliberately need a
different lower-level composition, not merely another product feature.

### Reference

Reference documents each public package, supported entrypoint, lifecycle,
replacement behavior, and disabled state. Use it after choosing a path when you
need the exact contract for a package or API. See
[Support and release boundaries](reference/support-release.md) before making
environment or roadmap claims.

## The owner model

Asyra stays extensible by assigning each concern one owner:

- your app owns domain schemas, product rules, commands, permissions, migration
  meaning, retrieval, and service policy;
- Core coordinates public Framework capabilities and lifecycle;
- canonical packages own state, transactions, hierarchy, validation, and
  typed communication within their declared boundaries;
- Preset optionally installs an official, selectable design-tool baseline;
- Render projects canonical information without becoming its owner; and
- optional Collaboration and AI packages participate only when the app
  composes and configures them.

The website presents these Markdown sources rather than maintaining a second
documentation owner. Every implementation guide links back to canonical
Framework contracts and forward to the next maintained path.

## Current support

The initial release supports the current browser/Core composition and the
official `2D` Preset profile. Production `3D`, `HYBRID`, auto layout,
unit-aware aggregation, a public `createHeadlessCore()`, and an independent
Core Kernel are not current capabilities. See
[Current runtime and future Core Kernel](learn/runtime-boundaries-roadmap.md)
for the researched direction and present boundary.

Runtime Atlas lets you operate six current owner flows in the browser. Concepts
explain why those boundaries exist, Extend guides show how app-owned behavior
enters them, Customize guides cover intentional provider or composition
replacement, and Reference pages state the exact public package contracts.

## Canonical sources

- [Framework Essentials](../ai/framework/FRAMEWORK_ESSENTIALS.md)
- [Framework Architecture](../ai/framework/ARCHITECTURE.md)
- [Framework Workflow](../ai/framework/WORKFLOW.md)
