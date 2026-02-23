# Project: Liar's Garden

## What This Is

A browser-based puzzle game where rules are learned through play — no instructions — and the game progressively lies about the rules it taught you. Open `index.html` in a browser to play. No build step, no dependencies — just static HTML/CSS/JS with canvas rendering.

## Architecture

- **`index.html`** — Entry point. Loads all JS/CSS.
- **`style.css`** — UI chrome, title screen, overlays. Dark forest aesthetic.
- **`js/engine.js`** — Game loop, state machine, input handling, move resolution.
- **`js/rules.js`** — Default tile behaviors + per-level override merging + disguise system.
- **`js/levels.js`** — All 18 level definitions (grids, rule overrides, themes, disguises).
- **`js/sprites.js`** — Procedural canvas drawing for all tile types and the player character.
- **`js/renderer.js`** — Canvas rendering loop, theme palettes, tile drawing orchestration.

## How the Lying Works

Default tile behaviors are in `rules.js` (`DEFAULT_RULES`). Each level in `levels.js` can specify `ruleOverrides` that change any tile's behavior. Same visual, different rules. The `disguise` system makes a tile at a specific position render as one type but behave as another.

## Level Format

Grids use single-letter codes: G=ground, T=thorn, F=flower, M=mushroom, R=rock, S=seed, E=exit, D=dark_ground, B=biolume, W=wall, P=player start.

## Rules for Claude

- **Commit changes when you make them.**
- No build tools, no frameworks, no npm. Plain static files only.
- All visuals are canvas-drawn — no image assets.
- Keep levels solvable. Every level must have at least one path from P to E.
- When adding levels, maintain the lying progression: early levels teach truth, later levels break it.
- Preserve the Pacific Northwest weird forest aesthetic.
