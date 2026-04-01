# JSON TreeSize

A VS Code extension that visualizes JSON file size by path — giving you the same "folder size explorer" experience as [TreeSize](https://www.jam-software.com/treesize) or DaisyDisk, but for JSON files.

Useful when you need to understand what's bloating a large JSON file and decide what to trim.

![JSON TreeSize split view](docs/screenshot.png)

## Features

- **Split view panel** — tree on the left, size breakdown on the right
- **Inline size bars** — each tree row shows a proportional mini-bar and heat-colored size label
- **Detail bar chart** — click any node to see all its children ranked by byte size with percentage bars
- **Go to in editor** — jump the cursor directly to any key in the raw JSON editor
- **Worker thread parsing** — files up to 50 MB+ parsed without blocking the UI
- **VS Code theme aware** — uses your current color theme variables

## Usage

1. Right-click any `.json` file in the Explorer sidebar
2. Select **"Analyze with JSON TreeSize"**

Or open the Command Palette (`Cmd+Shift+P`) and run **"Analyze with JSON TreeSize"** while a `.json` file is active.

## How to read the view

| Color | Meaning |
|-------|---------|
| Red   | Node is ≥ 20% of its parent's size |
| Yellow | Node is 5–20% of its parent's size |
| Grey  | Node is < 5% of its parent's size |

Click a node in the tree to drill into its children. Click a bar in the detail pane to drill deeper. Use **"Go to in editor ↗"** to open the raw JSON at that exact key.

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
├── panel.ts            # Webview panel — lifecycle, worker spawning, message bridge
├── types.ts            # Shared TypeScript types (SizeNode, message protocol)
├── worker/
│   └── parser.ts       # Worker thread — JSON parsing and size tree computation
└── webview/
    ├── index.html      # Webview shell
    ├── main.ts         # Webview renderer — tree + detail pane
    └── styles.css      # Layout and styling
```

## License

[MIT](LICENSE)
