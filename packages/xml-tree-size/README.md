# XML Tree Size

[![Visual Studio Marketplace](https://vsmarketplacebadges.dev/version/AlvaroEnriqueRuano.xml-tree-size.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.xml-tree-size)
[![Installs](https://vsmarketplacebadges.dev/installs/AlvaroEnriqueRuano.xml-tree-size.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.xml-tree-size)
[![Rating](https://vsmarketplacebadges.dev/rating/AlvaroEnriqueRuano.xml-tree-size.svg)](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.xml-tree-size)
[![CI](https://github.com/aruanoguate/file-tree-size/actions/workflows/sonarcloud.yml/badge.svg)](https://github.com/aruanoguate/file-tree-size/actions/workflows/sonarcloud.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=aruanoguate_file-tree-size&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=aruanoguate_file-tree-size)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=aruanoguate_file-tree-size&metric=coverage)](https://sonarcloud.io/summary/new_code?id=aruanoguate_file-tree-size)

**Ever wondered what's bloating that SOAP envelope or XML config?**

XML Tree Size gives you the same "what's eating my disk?" experience as [TreeSize](https://www.jam-software.com/treesize) or [WinDirStat](https://windirstat.net/) — but for XML files, right inside VS Code. No CLI tools, no pasting into online formatters, no leaving your editor.

Built by a developer, for developers. Free, open-source, no telemetry. Just right-click an `.xml` file and see where the bytes are.

![XML Tree Size — split view with tree explorer and detail bar chart](https://raw.githubusercontent.com/aruanoguate/file-tree-size/main/packages/xml-tree-size/docs/screenshot.png)

## Why XML Tree Size?

| Problem | Solution |
|---------|----------|
| "This SOAP response is massive and I can't find why" | Instantly see which elements consume the most bytes |
| "I need to trim our XML payload to improve transfer time" | Drill down the tree to find the heaviest nested elements |
| "Online XML tools feel sketchy for production data" | Everything runs locally in VS Code — your data never leaves your machine |
| "I found the big element — now I need to edit it" | Click **"Open in editor"** to jump straight to that line in the source |

## Features

- **Interactive tree explorer** — expandable nodes showing byte size and percentage of parent
- **Detail bar chart** — click any node to see its children ranked by size with percentage bars
- **Full XML node support** — elements, attributes, text content, and CDATA sections
- **HSL heat-map coloring** — larger nodes get vivid colors, smaller nodes fade to background
- **Theme-aware** — color scale adjusts automatically for dark, light, and high-contrast themes
- **Configurable base color** — pick any hex color from the Settings UI color picker
- **Expand / Collapse all** — toolbar buttons in the tree pane
- **Left↔right sync** — clicking a bar in the detail pane highlights the tree node
- **Open in editor** — one-click navigation from any node to its position in the raw XML
- **SAX streaming parser** — efficient parsing without loading the entire DOM into memory
- **20 languages** — localized UI in Spanish, Chinese, Japanese, Korean, French, German, and [14 more](l10n/)

## Getting Started

### Install

Search for **"XML Tree Size"** in the VS Code Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`), or install from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=AlvaroEnriqueRuano.xml-tree-size).

### Option 1 — Right-click an XML file

Right-click any `.xml` file in the Explorer sidebar and select **"XML Tree Size: Analyze"**.

### Option 2 — Command Palette

With an `.xml` file open, press `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS) and type **"XML Tree Size: Analyze"**.

![Command Palette → XML Tree Size: Analyze](https://raw.githubusercontent.com/aruanoguate/file-tree-size/main/packages/xml-tree-size/docs/demo-command-palette.gif)

### Exploring the results

Click nodes in the tree to see their children ranked by size in the detail pane. The two panels stay in sync — clicking a bar on the right highlights the node on the left, and vice versa. Use **Expand / Collapse all** to navigate large files, and **Open in editor** to jump straight to the source.

![Interacting with the tree and detail pane](https://raw.githubusercontent.com/aruanoguate/file-tree-size/main/packages/xml-tree-size/docs/demo-interaction.gif)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| [`xmlTreeSize.baseColor`](vscode://settings/xmlTreeSize.baseColor) | `"#e8832a"` | Base color for the size heat map. Opens a native color picker in Settings. Leave empty for the default orange. |

## Contributing

See the [Contributing Guide](../../CONTRIBUTING.md) for development setup, architecture overview, and release process.

## License

[MIT](LICENSE) — free for personal and commercial use.

---

*Made with care by [Alvaro Enrique Ruano](https://github.com/aruanoguate). If you find this useful, a ⭐ on [GitHub](https://github.com/aruanoguate/file-tree-size) is appreciated!*
