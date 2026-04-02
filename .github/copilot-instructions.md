# Copilot Instructions

## Deployment

**Deployment is fully automated via GitHub Actions.**

When asked to "deploy" or "release":
1. Run the appropriate npm release script (`npm run release:patch`, `release:minor`, or `release:major`)
2. That's it — the script bumps the version, commits, tags, and pushes
3. GitHub Actions picks up the tag and publishes to the VS Code Marketplace automatically

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
