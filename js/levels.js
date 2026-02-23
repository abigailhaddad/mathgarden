// All 18 levels
// G=ground, T=thorn, F=flower, M=mushroom, R=rock, S=seed, E=exit, D=dark_ground, B=biolume, W=wall, P=player start

const TILE_KEY = {
  'G': 'ground', 'T': 'thorn', 'F': 'flower', 'M': 'mushroom', 'R': 'rock',
  'S': 'seed', 'E': 'exit', 'D': 'dark_ground', 'B': 'biolume', 'W': 'wall',
};

function parseGrid(lines) {
  const grid = [];
  let playerRow = 0, playerCol = 0;
  for (let r = 0; r < lines.length; r++) {
    const row = [];
    const cells = lines[r].split(' ');
    for (let c = 0; c < cells.length; c++) {
      const ch = cells[c];
      if (ch === 'P') {
        row.push('ground');
        playerRow = r;
        playerCol = c;
      } else {
        row.push(TILE_KEY[ch] || 'ground');
      }
    }
    grid.push(row);
  }
  return { grid, playerRow, playerCol };
}

const LEVELS = [
  // === ACT 1: Learn the rules ===

  // Level 1: The Clearing
  {
    name: 'The Clearing',
    theme: 'dayforest',
    ruleOverrides: { thorn: { deadly: false } }, // thorns DON'T kill yet — safe intro
    ...parseGrid([
      'G G G G G',
      'G P G T G',
      'G G T G G',
      'G T G G G',
      'G G G G E',
    ]),
  },

  // Level 2: Briars
  {
    name: 'Briars',
    theme: 'dayforest',
    ruleOverrides: {}, // thorns block but now deadly (default)
    ...parseGrid([
      'P G T T T',
      'T G T G G',
      'T G G G T',
      'T T T G T',
      'T T T G E',
    ]),
  },

  // Level 3: The Flowers
  {
    name: 'The Flowers',
    theme: 'dayforest',
    ruleOverrides: {},
    ...parseGrid([
      'P G T T T T',
      'T G F F T T',
      'T T F G G T',
      'T F F T G T',
      'T T G T G T',
      'T T G G G E',
    ]),
  },

  // === ACT 2: First lies ===

  // Level 4: Something's Wrong — flowers kill!
  {
    name: "Something's Wrong",
    theme: 'duskforest',
    ruleOverrides: { flower: { deadly: true, passable: true } },
    ...parseGrid([
      'P G F G T T',
      'T G F G G T',
      'T G F F G T',
      'T G G G F T',
      'T T G G F T',
      'T T G G G E',
    ]),
  },

  // Level 5: The Mushrooms — mushrooms introduced (blocking), flowers still deadly
  {
    name: 'The Mushrooms',
    theme: 'duskforest',
    ruleOverrides: { flower: { deadly: true, passable: true } },
    ...parseGrid([
      'P G G M T T',
      'T G M G G T',
      'T G G G M T',
      'T M G F G T',
      'T G G F G T',
      'T T G G G E',
    ]),
  },

  // Level 6: Spores — mushrooms become passable! Only path goes through them
  {
    name: 'Spores',
    theme: 'duskforest',
    ruleOverrides: {
      flower: { deadly: true, passable: true },
      mushroom: { passable: true },
    },
    ...parseGrid([
      'T T T T T T',
      'T P G F T T',
      'T T M T T T',
      'T T M T T T',
      'T T M G F T',
      'T T G G G E',
    ]),
  },

  // === ACT 3: Push mechanic + more lies ===

  // Level 7: Something Yields — push introduced
  {
    name: 'Something Yields',
    theme: 'deepforest',
    ruleOverrides: {},
    ...parseGrid([
      'T T T T T T T',
      'T P G R G G T',
      'T T T G T G T',
      'T G G G T G T',
      'T G T T T G T',
      'T G G G G G E',
    ]),
  },

  // Level 8: The Stone Garden — push puzzles, wrong push = stuck
  {
    name: 'The Stone Garden',
    theme: 'deepforest',
    ruleOverrides: {},
    ...parseGrid([
      'T T T T T T T',
      'T P G G G T T',
      'T G R G T T T',
      'T G G R G G T',
      'T T G G T G T',
      'T T T G R G T',
      'T T T G G G E',
    ]),
  },

  // Level 9: Heavy Things — mushrooms back to blocking. Tests memory.
  {
    name: 'Heavy Things',
    theme: 'deepforest',
    ruleOverrides: {},
    ...parseGrid([
      'T T T T T T T',
      'T P G G M G T',
      'T T T G M G T',
      'T G R G G G T',
      'T G G G T M T',
      'T M G G T G T',
      'T G G G G G E',
    ]),
  },

  // Level 10: The Thorned Passage — THORNS become safe/passable!
  {
    name: 'The Thorned Passage',
    theme: 'deepforest',
    ruleOverrides: {
      thorn: { passable: true, deadly: false },
    },
    ...parseGrid([
      'T T T T T T T T',
      'T P G M M M G T',
      'T M T T T M G T',
      'T M T G T M G T',
      'T M T G T G G T',
      'T M G G T T T T',
      'T M M M M M M E',
    ]),
  },

  // === ACT 4: Pickup + compound lies ===

  // Level 11: The Seeds — pickup introduced, flowers safe again
  {
    name: 'The Seeds',
    theme: 'deepforest',
    ruleOverrides: {},
    requiredSeeds: 2,
    ...parseGrid([
      'T T T T T T T',
      'T P G G T S T',
      'T T T G T G T',
      'T G G G G G T',
      'T G T T T T T',
      'T S G G G G T',
      'T T T T T G E',
    ]),
  },

  // Level 12: The Gift — seed inside walkable mushroom
  {
    name: 'The Gift',
    theme: 'deepforest',
    ruleOverrides: {
      mushroom: { passable: true },
    },
    requiredSeeds: 2,
    ...parseGrid([
      'T T T T T T T',
      'T P G G T T T',
      'T T T G T T T',
      'T S G G M T T',
      'T T T T M T T',
      'T T T T S T T',
      'T T T T G G T',
      'T T T T T G E',
    ]),
  },

  // Level 13: Two Keys — dark ground kills! biolume theme
  {
    name: 'Two Keys',
    theme: 'biolume',
    ruleOverrides: {
      dark_ground: { deadly: true, passable: true },
    },
    requiredSeeds: 2,
    ...parseGrid([
      'B B B B B B B B',
      'B P G D G S B B',
      'B B B D B G B B',
      'B G G G B G B B',
      'B G B B B G D B',
      'B G D G G G D B',
      'B S G B B G G E',
    ]),
  },

  // Level 14: The False Path — flower-lined path = trap, thorns = escape
  {
    name: 'The False Path',
    theme: 'duskforest',
    ruleOverrides: {
      flower: { deadly: true, passable: true },
      thorn: { passable: true, deadly: false },
    },
    ...parseGrid([
      'T T T T T T T T',
      'T P F F F G T T',
      'T G T T F T T T',
      'T G T T F T T T',
      'T G T T F T G T',
      'T G T T T T G T',
      'T T T T T T G T',
      'T T T T T T G E',
    ]),
  },

  // === ACT 5: Full weird ===

  // Level 15: The Impersonator — disguise system! Some flowers are thorns
  {
    name: 'The Impersonator',
    theme: 'deepforest',
    ruleOverrides: {},
    disguises: {
      '1,4': { appears: 'flower', behaves: 'thorn' },
      '3,2': { appears: 'flower', behaves: 'thorn' },
      '5,5': { appears: 'flower', behaves: 'thorn' },
      '2,6': { appears: 'ground', behaves: 'ground' },
    },
    ...parseGrid([
      'T T T T T T T T',
      'T P G G F G T T',
      'T T T G T G G T',
      'T G F G G T G T',
      'T G T T G T G T',
      'T G G G G F G T',
      'T T T G T T G T',
      'T T T G G G G E',
    ]),
  },

  // Level 16: Bioluminescence — biolume tiles kill!
  {
    name: 'Bioluminescence',
    theme: 'biolume',
    ruleOverrides: {
      biolume: { deadly: true, passable: true },
    },
    ...parseGrid([
      'G G G B G G G G',
      'G P G B G B G G',
      'G G G G G B G G',
      'B B G G G G G B',
      'G G G B B G G G',
      'G B G G G G B G',
      'G G G B G G G G',
      'G G G G G B G E',
    ]),
  },

  // Level 17: Everything Lies — multiple rules inverted
  {
    name: 'Everything Lies',
    theme: 'alien',
    ruleOverrides: {
      thorn: { passable: true, deadly: false },
      flower: { deadly: true, passable: true },
      mushroom: { passable: true },
      biolume: { deadly: true, passable: true },
    },
    ...parseGrid([
      'T T T T T T T T',
      'T P F T B G G T',
      'T G T T G T G T',
      'T G M G G B G T',
      'T G T B G T G T',
      'T G T G G F G T',
      'T G T T T T G T',
      'T G G G G G G E',
    ]),
  },

  // Level 18: The Garden Knows — all rules back to default. Trust issues.
  {
    name: 'The Garden Knows',
    theme: 'dayforest',
    ruleOverrides: {},
    ...parseGrid([
      'T T T T T T T',
      'T P F G T G T',
      'T G T F G G T',
      'T G G G T G T',
      'T T G F G G T',
      'T G G G G F T',
      'T G G G G G E',
    ]),
  },
];
