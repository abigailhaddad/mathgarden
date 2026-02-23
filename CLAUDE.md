# Project: Liar's Garden v2

## What This Is
A browser-based number puzzle game. Grid of hidden numbers, secret math rules, limited lives. Open `index.html` to play. No build step, no dependencies — plain HTML/CSS/JS with canvas rendering.

## Architecture

- **`index.html`** — Entry point. Loads all JS, sets up input handlers and animation loop.
- **`style.css`** — Minimal styling. Dark background, fullscreen canvas, no scroll.
- **`js/levels.js`** — 8 level definitions with deterministic grid generation, rule functions, and solvability verification.
- **`js/engine.js`** — Game state machine: movement, tile reveals, death, lives, level progression.
- **`js/renderer.js`** — Canvas rendering: tiles, numbers, player (roly-poly bug), HUD, overlays.

## Core Mechanic
- Grid tiles hide numbers (1-100). Numbers reveal when player is 4-directionally adjacent.
- Each level has a secret rule defining which numbers are safe to step on.
- Unsafe step = death = lose 1 of 5 total lives. 0 lives = game over, restart from level 1.
- Beat a level = rule revealed, advance to next.

## 8 Levels
1. The Number Seven (n === 7)
2. Even Ground (even numbers)
3. Odd One Out (odd numbers)
4. By Fives (multiples of 5)
5. Small World (n <= 20)
6. Perfect Squares (1, 4, 9, 16, ...)
7. Prime Territory (primes)
8. The Remainder (n % 7 <= 1)

## Controls
- Arrow keys / WASD: move
- R: restart level (free, no life cost) or restart game (on game over/win)
- Touch swipe: mobile support

## Rules for Claude
- Commit changes when you make them.
- No build tools, no frameworks, no npm. Plain static files only.
- Keep the dark forest visual aesthetic.
- Grids must be deterministic (seeded RNG) and solvable (BFS-verified at load).
- Start tile (0,0) and exit tile (bottom-right) always have number 0, which is always safe.
