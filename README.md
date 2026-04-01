# JSON TreeSize

A VS Code extension that visualizes JSON file size by path — giving you the same "folder size explorer" experience as [TreeSize](https://www.jam-software.com/treesize) or DaisyDisk, but for JSON files.

Useful when you need to understand what's bloating a large JSON file and decide what to trim.

![JSON TreeSize split view](docs/screenshot.png)

## Features

- **Split view panel** — tree on the left, detail bar chart on the right
- **Dynamic color scale** — bar fills use an HSL heat scale driven by a configurable base color; larger nodes get the most vivid shade, smaller nodes get lighter tints
- **Theme-aware colors** — scale direction inverts automatically for dark vs. light VS Code themes
- **Expand / Collapse all** — toolbar buttons in the tree pane to open or close the whole tree at once
- **Detail bar chart** — click any node to see all its children ranked by byte size with percentage bars
- **Left↔right sync** — clicking a bar in the detail pane expands and highlights the matching node in the tree
- **Go to in editor** — jump the cursor directly to any key in the raw JSON editor
- **Worker thread parsing** — files up to 50 MB+ parsed without blocking the UI

## Usage

1. Right-click any `.json` file in the Explorer sidebar
2. Select **"Analyze with JSON TreeSize"**

Or open the Command Palette (`Cmd+Shift+P`) and run **"Analyze with JSON TreeSize"** while a `.json` file is active.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `jsonTreeSize.baseColor` | `""` | Base color for the size heat map (hex, e.g. `#e06c8a`). Opens a color picker in the Settings UI. Leave empty to use the default blue (`#4a9eda`). |

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.85+

### Setup

```bash
git clone https://github.com/aruanoguate/json-treesize.git
cd json-treesize
npm install
```

### Build

```bash
npm run compile
```

### Watch mode (rebuilds on save)

```bash
npm run watch
```

### Run & debug

Open the project in VS Code and press `F5`. This compiles the extension and launches an Extension Development Host window with the extension loaded.

### Tests

```bash
npm test
```

## Project structure

```
src/
├── extension.ts        # Entry point — registers the command
├── panel.ts            # Webview panel — lifecycle, worker spawning, message bridge, HTML/CSS
├── types.ts            # Shared TypeScript types (SizeNode, message protocol)
├── utils.ts            # Pure helpers (hex color validation)
├── worker/
│   └── parser.ts       # Worker thread — JSON parsing and size tree computation
└── webview/
    ├── color.ts        # Pure color utilities: hexToHsl, heatColor, wcagTextColor
    ├── index.html      # Webview shell
    ├── main.ts         # Webview renderer — tree + detail pane + toolbar
    └── styles.css      # Layout and styling
```

## License

[MIT](LICENSE)
