# File Tree Size

VS Code extensions that show you exactly where size hides in your JSON and XML files — think WinDirStat, but for payloads. Made by developers, for developers.

**Suggested GitHub topics/tags:**

`vscode-extension` `json` `xml` `soap` `payload-analysis` `tree-size` `visualizer` `developer-tools` `performance` `file-analysis`

## Repository Quality

[![SonarCloud Workflow](https://github.com/aruanoguate/file-tree-size/actions/workflows/sonarcloud.yml/badge.svg)](https://github.com/aruanoguate/file-tree-size/actions/workflows/sonarcloud.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=aruanoguate_file-tree-size&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=aruanoguate_file-tree-size)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=aruanoguate_file-tree-size&metric=coverage)](https://sonarcloud.io/summary/new_code?id=aruanoguate_file-tree-size)

This repository is a monorepo for a family of VS Code extensions focused on the same problem:

- Analyze hierarchical payloads quickly
- Surface where size is concentrated
- Let developers jump straight to the source location that matters

## Why This Is a Monorepo

The JSON and XML extensions share most of the product surface:

- Same interaction model (tree view + ranked breakdown)
- Same visualization techniques (size bars and heat map)
- Same UX conventions and localization strategy
- Same release and quality gates

Maintaining this as separate repositories would duplicate fixes, tests, and design decisions. A monorepo keeps those concerns centralized while preserving independent extension packages and release tracks.

This structure is intentional for maintainability and consistency:

- Shared logic is authored once
- Format-specific parsing stays isolated per extension
- CI/CD remains explicit for each deliverable

## Repository Structure

```text
.
├── packages/
│   ├── tree-size-core/      # Shared types, utilities, and webview helpers
│   ├── json-tree-size/      # JSON Tree Size extension package
│   └── xml-tree-size/       # XML Tree Size extension package
└── .github/workflows/       # Independent release + quality workflows
```

## Package Responsibilities

### `packages/tree-size-core`

Shared implementation used by multiple extensions:

- Domain-agnostic types and message contracts
- Shared utility helpers
- Shared webview color/format helpers

### `packages/json-tree-size`

Production extension currently on Marketplace.

- JSON parsing and source mapping
- JSON-specific command/configuration surface
- Existing user-facing release line

Marketplace listing badges:

| Extension | Version | Installs | Rating |
|---|---|---|---|
| JSON Tree Size | [![Version](https://vsmarketplacebadges.dev/version/AlvaroEnriqueRuano.json-treesize.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.json-treesize) | [![Installs](https://vsmarketplacebadges.dev/installs/AlvaroEnriqueRuano.json-treesize.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.json-treesize) | [![Rating](https://vsmarketplacebadges.dev/rating/AlvaroEnriqueRuano.json-treesize.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.json-treesize) |

Details: see [packages/json-tree-size/README.md](packages/json-tree-size/README.md)

### `packages/xml-tree-size`

New extension line for XML/SOAP-style payload analysis.

- XML parser worker and node construction
- XML-specific command/configuration surface
- Independent release lifecycle

Marketplace listing badges:

| Extension | Version | Installs | Rating |
|---|---|---|---|
| XML Tree Size | [![Version](https://vsmarketplacebadges.dev/version/AlvaroEnriqueRuano.xml-tree-size.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.xml-tree-size) | [![Installs](https://vsmarketplacebadges.dev/installs/AlvaroEnriqueRuano.xml-tree-size.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.xml-tree-size) | [![Rating](https://vsmarketplacebadges.dev/rating/AlvaroEnriqueRuano.xml-tree-size.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.xml-tree-size) |

Details: see [packages/xml-tree-size/README.md](packages/xml-tree-size/README.md)

## Development Workflows

From repository root:

- `npm run compile`: compile JSON + XML packages
- `npm run test`: run JSON tests (default stable line)
- `npm run test:all`: run JSON + XML tests
- `npm run release:json:patch|minor|major`: release JSON extension
- `npm run release:xml:patch|minor|major`: release XML extension

## Release Strategy

Each extension ships independently:

- JSON releases use the existing version/tag flow
- XML releases use `xml-v*` tags and a dedicated workflow

This allows rapid iteration on one extension without forcing releases on the other.

## Design Principles

- Reuse by default, specialize only where needed
- Keep parser logic format-specific and isolated
- Keep UI behavior consistent across extensions
- Preserve backward compatibility for existing marketplace users
- Keep release automation explicit and auditable

## Future Packages

This layout intentionally supports additional analyzers (for other structured payload formats) by reusing `tree-size-core` and introducing new package folders under `packages/`.
