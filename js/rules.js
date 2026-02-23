// Default tile behaviors — the "truth" the game teaches before lying
const DEFAULT_RULES = {
  ground:      { passable: true,  deadly: false, pushable: false, collectible: false },
  thorn:       { passable: false, deadly: true,  pushable: false, collectible: false },
  flower:      { passable: true,  deadly: false, pushable: false, collectible: false },
  mushroom:    { passable: false, deadly: false, pushable: false, collectible: false },
  rock:        { passable: false, deadly: false, pushable: true,  collectible: false },
  seed:        { passable: true,  deadly: false, pushable: false, collectible: true  },
  exit:        { passable: true,  deadly: false, pushable: false, collectible: false },
  dark_ground: { passable: true,  deadly: false, pushable: false, collectible: false },
  biolume:     { passable: true,  deadly: false, pushable: false, collectible: false },
  player:      { passable: false, deadly: false, pushable: false, collectible: false },
  wall:        { passable: false, deadly: false, pushable: false, collectible: false },
};

// Merge default rules with per-level overrides
// ruleOverrides: { flower: { deadly: true }, mushroom: { passable: true } }
// disguises: { "3,4": { appears: "flower", behaves: "thorn" } }
function resolveRules(ruleOverrides) {
  const merged = {};
  for (const tile in DEFAULT_RULES) {
    merged[tile] = Object.assign({}, DEFAULT_RULES[tile]);
  }
  if (ruleOverrides) {
    for (const tile in ruleOverrides) {
      if (merged[tile]) {
        Object.assign(merged[tile], ruleOverrides[tile]);
      }
    }
  }
  return merged;
}

// Get the effective tile type at a position, accounting for disguises
function getEffectiveTile(grid, row, col, disguises) {
  const visual = grid[row][col];
  if (disguises) {
    const key = row + ',' + col;
    if (disguises[key]) {
      return { visual: disguises[key].appears, behavior: disguises[key].behaves };
    }
  }
  return { visual: visual, behavior: visual };
}
