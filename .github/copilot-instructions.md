# Copilot Instructions

## Monorepo Structure

This is an **npm workspaces** monorepo. All extension packages live under `packages/`:

```
packages/
├── tree-size-core/      # Shared types, utilities, webview helpers (no package-lock)
├── json-tree-size/      # JSON Tree Size VS Code extension
└── xml-tree-size/       # XML Tree Size VS Code extension
```

### Installing dependencies

- **Always install from the repo root**: `npm install <pkg> -w packages/<target-package>`
- **Never** `cd` into a package and run `npm install` — this desyncs the root lock file and breaks CI (`npm ci` fails).
- After any dependency change, verify the root `package-lock.json` was updated and commit it.
- Shared code in `tree-size-core` is imported via relative paths (e.g., `../../tree-size-core/src/types`), not published to npm.

### Frozen identifiers

- The JSON extension marketplace name is `json-treesize` (no dash). **Do not rename** the `name` field in `packages/json-tree-size/package.json`.
- JSON commands use `jsonTreeSize.*` prefix; XML commands use `xmlTreeSize.*` prefix.

## Deployment

**Deployment is fully automated via GitHub Actions.**

When asked to "deploy" or "release":
1. Run the appropriate npm release script from the repo root:
   - JSON: `npm run release:json:patch`, `release:json:minor`, or `release:json:major`
   - XML: `npm run release:xml:patch`, `release:xml:minor`, or `release:xml:major`
2. That's it — the script bumps the version, commits, tags, and pushes
3. GitHub Actions picks up the tag and publishes to the VS Code Marketplace automatically

JSON tags use the `json-v*` prefix. XML tags use the `xml-v*` prefix.

**Never** run `vsce:publish` or attempt a manual marketplace publish.

## Build

```bash
npm run compile   # one-time build
npm run watch     # watch mode during development
```

`@vscode/l10n` must be bundled (not external) in `esbuild.js` — VS Code does not provide it as a built-in runtime module.

## Testing

```bash
npm test
```
