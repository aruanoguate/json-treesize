# Changelog

All notable changes to the **JSON TreeSize** extension will be documented in this file.

## [1.0.0] — 2026-04-02

### Added

- 20-language localization (Spanish, Chinese, Japanese, Korean, French, German, and 14 more)
- Automated demo recording with Playwright (command palette + interaction GIFs + screenshot)
- Centralized default base color constant (`#4a9eda`)

### Changed

- All demo scripts rewritten in TypeScript for consistency
- README rewritten with project structure, badges, and automated GIF demos
- 100% test coverage (83 tests)

## [0.1.0] — 2026-04-01

### Added

- Interactive tree explorer with expandable nodes showing byte size and percentage
- Detail bar chart pane — click any node to see children ranked by size
- HSL heat-map coloring with configurable base color
- Theme-aware color scaling (dark, light, high-contrast)
- Expand / Collapse all toolbar buttons
- Left↔right sync between tree and detail pane
- "Go to in editor" navigation from any node to the source JSON
- Worker thread parsing for large files (50 MB+)
- Right-click context menu integration for `.json` files
- Command Palette support: **JSON TreeSize: Analyze**
