# Proof by Elimination

A browser-based number puzzle game. Navigate a grid of hidden numbers, figure out the secret math rule, and reach the exit — or die trying.

## How to Play

- **Move** with arrow keys, WASD, or swipe on mobile
- Numbers reveal when you're adjacent to a tile
- Each level has a secret rule — some numbers are safe, others kill you
- Step on an unsafe number and you lose a life
- Reach the exit to reveal the rule and advance
- Beat all 8 levels to win

**R** restarts the current level (free) or the whole game (on game over/win).

## Play It

Open `index.html` in a browser. No build step, no dependencies.

Hosted at: https://abigailhaddad.github.io/mathgarden/

## Structure

- `index.html` — Entry point, input handlers, animation loop
- `style.css` — Dark fullscreen canvas styling
- `js/engine.js` — Game state machine: movement, reveals, death, lives, progression
- `js/renderer.js` — Canvas rendering: tiles, numbers, player, HUD, overlays
- `js/levels.js` — 8 level definitions with grid generation and solvability verification
