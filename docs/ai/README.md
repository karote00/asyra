# AI Documentation Structure

This directory is the AI documentation root for framework, SDK, and app work.

## Directory Structure

### **[framework/](./framework/)**

Framework source-of-truth contracts:

- Architecture, package ownership, rules, and workflows.
- Planning and completed-plan archives.
- Framework-scoped decision history.
- **Entry point**: `framework/README.md`

### [SDK](sdk/README.md)

Embedding contracts, SDK plans, and verification for external consumers of the
Canvas, Design, Design UI, and Simulation packages.

### **[apps/](./apps/)**

App-level source-of-truth contracts:

- Per-app architecture, modules, features, BDD/PRD docs.
- App plans and app-scoped decision history.
- **Entry point**: `apps/README.md`

### **[decisions/](./decisions/)**

Global decision-history standard:

- Shared rules for framework/app decision history.
- Cross-cutting release decision log (repo-wide decisions).
- **Entry point**: `decisions/README.md`

### **[skills/](./skills/)**

Reusable AI capabilities and domain skills.

### **[workflows/](./workflows/)**

Executable development workflows (`/feature`, `/refactor`, `/bugfix`, `/docs`).
Includes the shared global retrieval/search policy used by all workflows.

### **[project/](./project/)**

Legacy reference docs.
Use as historical context only. Current contracts live under `framework/`,
`sdk/`, and `apps/`.
**Entry point**: `project/README.md`

## Getting Started

1. Framework work: start with `framework/README.md`
2. SDK work: start with [the SDK guide](sdk/README.md)
3. App work: start with `apps/<app>/README.md`
4. Cross-cutting governance/history: use `decisions/README.md`
