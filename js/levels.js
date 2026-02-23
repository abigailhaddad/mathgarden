// Liar's Garden v2 — Level definitions
// Each level: name, hint, grid (2D array of numbers), start, exit, rule function, ruleText

(function() {
  'use strict';

  // Seeded RNG for deterministic grids
  function mulberry32(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Math helpers
  function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  function isPerfectSquare(n) {
    if (n <= 0) return false;
    const s = Math.round(Math.sqrt(n));
    return s * s === n;
  }

  // Level rule definitions
  const RULES = [
    { name: "The Number Seven", hint: "Only one number is safe...", ruleText: "Only the number 7 is safe.", fn: n => n === 0 || n === 7 },
    { name: "Even Ground", hint: "Some numbers feel more balanced...", ruleText: "Even numbers are safe.", fn: n => n === 0 || n % 2 === 0 },
    { name: "Odd One Out", hint: "The unusual ones survive...", ruleText: "Odd numbers are safe.", fn: n => n === 0 || n % 2 === 1 },
    { name: "By Fives", hint: "Count on your fingers...", ruleText: "Multiples of 5 are safe.", fn: n => n === 0 || n % 5 === 0 },
    { name: "Small World", hint: "Stay low to the ground...", ruleText: "Numbers 20 or less are safe.", fn: n => n === 0 || n <= 20 },
    { name: "Perfect Squares", hint: "Some numbers have perfect roots...", ruleText: "Perfect squares are safe.", fn: n => n === 0 || isPerfectSquare(n) },
    { name: "Prime Territory", hint: "Indivisible numbers endure...", ruleText: "Prime numbers are safe.", fn: n => n === 0 || isPrime(n) },
    { name: "The Remainder", hint: "Divide by seven, watch what's left...", ruleText: "Numbers where n % 7 <= 1 are safe.", fn: n => n === 0 || n % 7 <= 1 },
  ];

  // Generate a number that satisfies the rule
  function safeNumber(ruleFn, rng) {
    const candidates = [];
    for (let i = 1; i <= 100; i++) {
      if (ruleFn(i)) candidates.push(i);
    }
    return candidates[Math.floor(rng() * candidates.length)];
  }

  // Generate a number that does NOT satisfy the rule
  function unsafeNumber(ruleFn, rng) {
    const candidates = [];
    for (let i = 1; i <= 100; i++) {
      if (!ruleFn(i)) candidates.push(i);
    }
    if (candidates.length === 0) return 50; // fallback
    return candidates[Math.floor(rng() * candidates.length)];
  }

  // BFS to check solvability
  function isSolvable(grid, ruleFn) {
    const rows = grid.length, cols = grid[0].length;
    const visited = Array.from({length: rows}, () => Array(cols).fill(false));
    const queue = [[0, 0]];
    visited[0][0] = true;
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r === rows - 1 && c === cols - 1) return true;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && ruleFn(grid[nr][nc])) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
    return false;
  }

  // Carve a guaranteed path from (0,0) to (rows-1, cols-1) using safe numbers
  function carvePath(grid, rows, cols, ruleFn, rng) {
    let r = 0, c = 0;
    const path = [[0, 0]];
    while (r < rows - 1 || c < cols - 1) {
      const moves = [];
      if (r < rows - 1) moves.push([r + 1, c]);
      if (c < cols - 1) moves.push([r, c + 1]);
      // occasionally allow lateral movement for variety
      if (r > 0 && rng() < 0.15) moves.push([r - 1, c]);
      if (c > 0 && rng() < 0.15) moves.push([r, c - 1]);
      const [nr, nc] = moves[Math.floor(rng() * moves.length)];
      r = nr; c = nc;
      grid[r][c] = safeNumber(ruleFn, rng);
      path.push([r, c]);
    }
    return path;
  }

  // Add some branch paths (some safe, some traps)
  function addBranches(grid, rows, cols, ruleFn, rng, path) {
    const pathSet = new Set(path.map(([r,c]) => `${r},${c}`));
    for (let i = 0; i < Math.min(path.length, 6); i++) {
      const idx = Math.floor(rng() * path.length);
      let [br, bc] = path[idx];
      const branchLen = 2 + Math.floor(rng() * 3);
      const isSafeBranch = rng() < 0.4;
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (let j = 0; j < branchLen; j++) {
        const shuffled = dirs.slice().sort(() => rng() - 0.5);
        let moved = false;
        for (const [dr, dc] of shuffled) {
          const nr = br + dr, nc = bc + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !pathSet.has(`${nr},${nc}`)) {
            grid[nr][nc] = isSafeBranch ? safeNumber(ruleFn, rng) : unsafeNumber(ruleFn, rng);
            br = nr; bc = nc;
            moved = true;
            break;
          }
        }
        if (!moved) break;
      }
    }
  }

  // Build a grid for a level
  function buildGrid(rows, cols, ruleFn, seed) {
    const rng = mulberry32(seed);
    const grid = Array.from({length: rows}, () => Array(cols).fill(0));

    // Start and exit are 0 (always safe)
    grid[0][0] = 0;
    grid[rows - 1][cols - 1] = 0;

    // Carve guaranteed safe path
    const path = carvePath(grid, rows, cols, ruleFn, rng);

    // Add branches
    addBranches(grid, rows, cols, ruleFn, rng, path);

    // Fill remaining tiles (bias toward unsafe)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue;
        if (r === rows - 1 && c === cols - 1) continue;
        if (grid[r][c] !== 0) continue;
        if (rng() < 0.7) {
          grid[r][c] = unsafeNumber(ruleFn, rng);
        } else {
          grid[r][c] = safeNumber(ruleFn, rng);
        }
      }
    }

    return grid;
  }

  // Grid sizes per level
  const GRID_SIZES = [
    [6, 6], [7, 7], [7, 7], [8, 8],
    [8, 8], [9, 9], [9, 9], [9, 9],
  ];

  // Seeds for deterministic generation
  const SEEDS = [42, 137, 256, 314, 512, 619, 777, 888];

  // Build all levels
  const levels = RULES.map((rule, i) => {
    const [rows, cols] = GRID_SIZES[i];
    const grid = buildGrid(rows, cols, rule.fn, SEEDS[i]);
    return {
      name: rule.name,
      hint: rule.hint,
      ruleText: rule.ruleText,
      rows: rows,
      cols: cols,
      grid: grid,
      isSafe: rule.fn,
    };
  });

  // Verify all levels are solvable at load time
  levels.forEach((lvl, i) => {
    if (!isSolvable(lvl.grid, lvl.isSafe)) {
      console.error(`Level ${i + 1} ("${lvl.name}") is NOT solvable!`);
    }
  });

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.levels = levels;
  window.LiarsGarden.isSolvable = isSolvable;
})();
