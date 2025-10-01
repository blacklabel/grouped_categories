# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- TypeScript rewrite of the plugin in `ts/groupedCategories.ts`, aligned to Highcharts APIs.
- Demo page `demo.html` showcasing basic, nested, and styled grouped categories.
- Build pipeline with Gulp + TypeScript + Closure Compiler outputting to `dist/`.
- Source maps for minified build.
- ESLint configuration with TypeScript rules and stable parser settings.
- tsconfig with ES2020 targets and declaration output.
- NPM scripts: `build`, `build:gulp`, `lint`, `compile`, `clean`, `test`, `test:watch`.
- README overhaul with usage, development, and testing instructions.

### Changed
- Path rendering logic to match legacy plugin behavior (using 'M'/'L' commands).
- Grid path buffer type to accept string/number for correct SVG path serialization.
- `groupSize` calculations to mirror legacy spacing/offset behavior.
- Font metrics handling for compatibility across HC versions.
- Relaxed type boundaries at Highcharts internal interop points to avoid false negatives.
- Gulp lint task to correctly complete and ignore declaration/test files.
- Closure Compiler flow to avoid duplicate sourcemap key collisions by splitting stages.
- Babel configuration to preserve ES2020 when desired.

### Fixed
- #111
- #179
- #181
- #185
- #197
- #220
- #227
- #228
- #206
- #212
- #232

### Notes / Migration
- Use `npm run build` for TypeScript build only, `npm run build:gulp` for full pipeline.
- Tests require Highcharts installed (dev dep recommended): `npm i -D highcharts`.
- To install Highcharts from GitHub, prefer `--ignore-scripts` or use the published package.
- Recommended editor settings: ensure ESLint extension uses the workspace config.

---

## [1.3.2] - 2025-09-23
- Legacy JS plugin version; current release supersedes it with TS rewrite and modern tooling.
