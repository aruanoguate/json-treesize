# JSON Tree Size

[![Visual Studio Marketplace](https://vsmarketplacebadges.dev/version/AlvaroEnriqueRuano.json-treesize.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.json-treesize)
[![Installs](https://vsmarketplacebadges.dev/installs/AlvaroEnriqueRuano.json-treesize.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.json-treesize)
[![Rating](https://vsmarketplacebadges.dev/rating/AlvaroEnriqueRuano.json-treesize.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.json-treesize)
[![Open VSX](https://img.shields.io/open-vsx/v/AlvaroEnriqueRuano/json-treesize?label=Open%20VSX)](https://open-vsx.org/extension/AlvaroEnriqueRuano/json-treesize)
[![CI](https://github.com/aruanoguate/file-tree-size/actions/workflows/sonarcloud.yml/badge.svg)](https://github.com/aruanoguate/file-tree-size/actions/workflows/sonarcloud.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=aruanoguate_file-tree-size&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=aruanoguate_file-tree-size)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=aruanoguate_file-tree-size&metric=coverage)](https://sonarcloud.io/summary/new_code?id=aruanoguate_file-tree-size)

**Ever wondered what's bloating that 50 MB JSON file?**

JSON Tree Size gives you the same "what's eating my disk?" experience as [TreeSize](https://www.jam-software.com/treesize) or [WinDirStat](https://windirstat.net/) — but for JSON files, right inside VS Code. No CLI tools, no pasting into online formatters, no leaving your editor.

Built by a developer, for developers. Free, open-source, no telemetry. Just right-click a `.json` file and see where the bytes are.

![JSON Tree Size — split view with tree explorer and detail bar chart](https://raw.githubusercontent.com/aruanoguate/file-tree-size/main/packages/json-tree-size/docs/screenshot.png)

## Why JSON Tree Size?

| Problem | Solution |
|---------|----------|
| "This config file is 12 MB and I have no idea why" | Instantly see which keys consume the most bytes |
| "I need to cut our API response payload" | Drill down the tree to find the heaviest nested objects |
| "Online JSON size tools feel sketchy for production data" | Everything runs locally in VS Code — your data never leaves your machine |
| "I found the big key — now I need to edit it" | Click **"Open in editor"** to jump straight to that line in the source |

## Features

- **Interactive tree explorer** — expandable nodes showing byte size and percentage of parent
- **Detail bar chart** — click any node to see its children ranked by size with percentage bars
- **HSL heat-map coloring** — larger nodes get vivid colors, smaller nodes fade to background
- **Theme-aware** — color scale adjusts automatically for dark, light, and high-contrast themes
- **Configurable base color** — pick any hex color from the Settings UI color picker
- **Expand / Collapse all** — toolbar buttons in the tree pane
- **Left↔right sync** — clicking a bar in the detail pane highlights the tree node
- **Open in editor** — one-click navigation from any node to its position in the raw JSON
- **Worker thread parsing** — files up to 50 MB+ parsed without blocking the editor UI
- **20 languages** — localized UI in Spanish, Chinese, Japanese, Korean, French, German, and [14 more](l10n/)

## Getting Started

### Install

Search for **"JSON Tree Size"** in the VS Code Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`), or install from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.json-treesize).

### Option 1 — Right-click a JSON file

Right-click any `.json` file in the Explorer sidebar and select **"Analyze with JSON Tree Size"**.

### Option 2 — Command Palette

With a `.json` file open, press `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS) and type **"JSON Tree Size: Analyze"**.

![Command Palette → JSON Tree Size: Analyze](https://raw.githubusercontent.com/aruanoguate/file-tree-size/main/packages/json-tree-size/docs/demo-command-palette.gif)

### Exploring the results

Click nodes in the tree to see their children ranked by size in the detail pane. The two panels stay in sync — clicking a bar on the right highlights the node on the left, and vice versa. Use **Expand / Collapse all** to navigate large files, and **Open in editor** to jump straight to the source.

![Interacting with the tree and detail pane](https://raw.githubusercontent.com/aruanoguate/file-tree-size/main/packages/json-tree-size/docs/demo-interaction.gif)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| [`jsonTreeSize.baseColor`](vscode://settings/jsonTreeSize.baseColor) | `"#4a9eda"` | Base color for the size heat map. Opens a native color picker in Settings. Leave empty for the default blue. |

## Contributing

See the [Contributing Guide](../../CONTRIBUTING.md) for development setup, architecture overview, and release process.

## License

[MIT](LICENSE) — free for personal and commercial use.

---

*Made with care by [Alvaro Enrique Ruano](https://github.com/aruanoguate). If you find this useful, a ⭐ on [GitHub](https://github.com/aruanoguate/file-tree-size) is appreciated!*
