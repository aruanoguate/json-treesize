# Contributing

Contributions are welcome! This is an open-source project maintained by a solo developer.

## Getting Started

```bash
git clone https://github.com/aruanoguate/file-tree-size.git
cd file-tree-size
npm install
npm run compile   # build JSON + XML extensions
npm run test:all  # run all tests
```

Press **F5** in VS Code from any extension package to launch the Extension Development Host.

## Repository Structure

This is an npm-workspaces monorepo:

```text
.
├── packages/
│   ├── tree-size-core/      # Shared types, utilities, and webview helpers
│   ├── json-tree-size/      # JSON Tree Size — VS Code extension
│   └── xml-tree-size/       # XML Tree Size — VS Code extension
└── .github/workflows/       # Independent release + quality workflows
```

### `tree-size-core`

Shared implementation consumed by both extensions:

- Domain-agnostic types and message contracts (`types.ts`)
- Utility helpers (`utils.ts`)
- Webview color and formatting helpers (`webview/`)

### Extension packages

Each extension package (`json-tree-size`, `xml-tree-size`) contains:

- Format-specific parser in `src/worker/parser.ts`
- Extension entry point, webview panel, and configuration surface
- Independent `package.json` with its own marketplace identity
- Localization bundles for 20 languages
- Full test suite

## Why a Monorepo?

The JSON and XML extensions share most of the product surface:

- Same interaction model (tree view + ranked breakdown)
- Same visualization techniques (size bars and heat map)
- Same UX conventions and localization strategy
- Same release and quality gates

Separate repositories would duplicate fixes, tests, and design decisions. The monorepo keeps those concerns centralized while preserving independent extension packages and release tracks.

## Development Commands

From the repository root:

| Command | Description |
|---|---|
| `npm run compile` | Build JSON + XML extensions |
| `npm run test` | Run JSON tests (stable line) |
| `npm run test:all` | Run JSON + XML tests |
| `npm run watch` | Watch mode for JSON extension |

## Recording Demo Media

Both extension packages support Playwright-based demo recording for README screenshots and GIFs.

### Prerequisites

- Install GIF tooling on macOS: `brew install ffmpeg gifsicle`
- The recorder expects the local VS Code app at `/Applications/Visual Studio Code.app/Contents/MacOS/Electron`
- Run commands from the repository root so workspace dependencies and the root lock file stay consistent

### Commands

| Command | Description |
|---|---|
| `npm run demo -w packages/json-tree-size` | Record JSON screenshot + GIFs |
| `npm run demo:no-gif -w packages/json-tree-size` | Record JSON videos only |
| `npm run demo -w packages/xml-tree-size` | Record XML screenshot + GIFs |
| `npm run demo:no-gif -w packages/xml-tree-size` | Record XML videos only |

### Output files

- JSON assets are written to `packages/json-tree-size/docs/`
- XML assets are written to `packages/xml-tree-size/docs/`
- Temporary Playwright recordings are written to each package's `scripts/demo-recordings/` directory

### XML-specific notes

- The XML fixture used for recordings lives at `packages/xml-tree-size/docs/demo.xml`
- The XML interaction demo is designed to show XML-only structures such as attributes (`@sku`, `@category`) and CDATA nodes
- If you update the parser or UI behavior, regenerate the XML screenshot and GIFs so the README stays accurate

## Release Strategy

Each extension ships independently via GitHub Actions. **Never** run `vsce publish` manually.

| Extension | Command | Tag pattern | Workflow |
|---|---|---|---|
| JSON Tree Size | `npm run release:json:patch\|minor\|major` | `v*` | `release.yml` |
| XML Tree Size | `npm run release:xml:patch\|minor\|major` | `xml-v*` | `release-xml.yml` |

The release scripts bump the version, commit, tag, and push. GitHub Actions picks up the tag and publishes to the VS Code Marketplace automatically.

## Design Principles

- Reuse by default, specialize only where needed
- Keep parser logic format-specific and isolated
- Keep UI behavior consistent across extensions
- Preserve backward compatibility for existing marketplace users
- Keep release automation explicit and auditable

## Adding a New Format

This layout supports additional analyzers for other structured payload formats:

1. Create a new package under `packages/`
2. Import shared types and helpers from `tree-size-core`
3. Implement a format-specific parser in `src/worker/parser.ts`
4. Add a release workflow under `.github/workflows/`
