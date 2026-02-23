// Liar's Garden v2 — Level definitions
// Rule parameters are randomized each playthrough so players can't memorize.
// Grids are generated fresh each load.

(function() {
  'use strict';

  // Seeded RNG for deterministic grid layout
  function mulberry32(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Pick a random element from an array
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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

  // Rule templates — each returns {name, hint, ruleText, fn}
  // Parameters are chosen randomly so each playthrough differs.

  function ruleExactNumber() {
    var num = pick([3, 5, 7, 11, 13, 17, 19, 23]);
    return {
      name: "The Number " + num,
      hint: "Only one number is safe...",
      ruleText: "Only the number " + num + " is safe.",
      fn: function(n) { return n === 0 || n === num; }
    };
  }

  function ruleEvenOdd() {
    // Randomly even or odd
    var isEven = Math.random() < 0.5;
    if (isEven) {
      return {
        name: "Even Ground",
        hint: "Some numbers feel more balanced...",
        ruleText: "Even numbers are safe.",
        fn: function(n) { return n === 0 || n % 2 === 0; }
      };
    } else {
      return {
        name: "Odd One Out",
        hint: "The unusual ones survive...",
        ruleText: "Odd numbers are safe.",
        fn: function(n) { return n === 0 || n % 2 === 1; }
      };
    }
  }

  function ruleOppositeEvenOdd(prevRule) {
    // Whatever level 2 wasn't
    var prevWasEven = prevRule.name === "Even Ground";
    if (prevWasEven) {
      return {
        name: "Odd One Out",
        hint: "The unusual ones survive...",
        ruleText: "Odd numbers are safe.",
        fn: function(n) { return n === 0 || n % 2 === 1; }
      };
    } else {
      return {
        name: "Even Ground",
        hint: "Some numbers feel more balanced...",
        ruleText: "Even numbers are safe.",
        fn: function(n) { return n === 0 || n % 2 === 0; }
      };
    }
  }

  function ruleDivisible() {
    var d = pick([3, 4, 5, 6]);
    return {
      name: "By " + (d === 3 ? "Threes" : d === 4 ? "Fours" : d === 5 ? "Fives" : "Sixes"),
      hint: "Count carefully...",
      ruleText: "Multiples of " + d + " are safe.",
      fn: function(n) { return n === 0 || n % d === 0; }
    };
  }

  function ruleSmallNumbers() {
    var threshold = pick([15, 20, 25, 30]);
    return {
      name: "Small World",
      hint: "Stay low to the ground...",
      ruleText: "Numbers " + threshold + " or less are safe.",
      fn: function(n) { return n === 0 || n <= threshold; }
    };
  }

  function rulePerfectSquares() {
    return {
      name: "Perfect Squares",
      hint: "Some numbers have perfect roots...",
      ruleText: "Perfect squares are safe.",
      fn: function(n) { return n === 0 || isPerfectSquare(n); }
    };
  }

  function rulePrimes() {
    return {
      name: "Prime Territory",
      hint: "Indivisible numbers endure...",
      ruleText: "Prime numbers are safe.",
      fn: function(n) { return n === 0 || isPrime(n); }
    };
  }

  function ruleRemainder() {
    var divisor = pick([5, 6, 7, 8]);
    var maxRem = pick([0, 1]);
    var remText = maxRem === 0
      ? "divisible by " + divisor
      : "n % " + divisor + " is 0 or 1";
    return {
      name: "The Remainder",
      hint: "Divide by " + divisor + ", watch what's left...",
      ruleText: "Numbers where " + remText + " are safe.",
      fn: function(n) { return n === 0 || n % divisor <= maxRem; }
    };
  }

  // Generate a number that satisfies the rule
  function safeNumber(ruleFn, rng) {
    var candidates = [];
    for (var i = 1; i <= 100; i++) {
      if (ruleFn(i)) candidates.push(i);
    }
    return candidates[Math.floor(rng() * candidates.length)];
  }

  // Generate a number that does NOT satisfy the rule
  function unsafeNumber(ruleFn, rng) {
    var candidates = [];
    for (var i = 1; i <= 100; i++) {
      if (!ruleFn(i)) candidates.push(i);
    }
    if (candidates.length === 0) return 50;
    return candidates[Math.floor(rng() * candidates.length)];
  }

  // BFS to check solvability
  function isSolvable(grid, ruleFn) {
    var rows = grid.length, cols = grid[0].length;
    var visited = Array.from({length: rows}, function() { return Array(cols).fill(false); });
    var queue = [[0, 0]];
    visited[0][0] = true;
    var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    while (queue.length > 0) {
      var pos = queue.shift();
      var r = pos[0], c = pos[1];
      if (r === rows - 1 && c === cols - 1) return true;
      for (var d = 0; d < dirs.length; d++) {
        var nr = r + dirs[d][0], nc = c + dirs[d][1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && ruleFn(grid[nr][nc])) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
    return false;
  }

  // Carve a guaranteed path from (0,0) to (rows-1, cols-1) using safe numbers
  // Wanders significantly so the solution isn't a near-straight diagonal
  function carvePath(grid, rows, cols, ruleFn, rng) {
    var r = 0, c = 0;
    var visited = Array.from({length: rows}, function() { return Array(cols).fill(false); });
    visited[0][0] = true;
    var path = [[0, 0]];
    var maxSteps = rows * cols * 3; // safety limit

    while ((r < rows - 1 || c < cols - 1) && path.length < maxSteps) {
      var moves = [];
      var dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];

      for (var d = 0; d < dirs.length; d++) {
        var nr = r + dirs[d][0], nc = c + dirs[d][1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          moves.push([nr, nc]);
        }
      }

      if (moves.length === 0) break; // stuck, shouldn't happen often

      // Bias: 40% of the time pick a random neighbor (wander),
      // 60% of the time prefer moves toward the exit
      var next;
      if (rng() < 0.4 && moves.length > 1) {
        next = moves[Math.floor(rng() * moves.length)];
      } else {
        // Sort by distance to exit, pick closest (with some randomness among ties)
        moves.sort(function(a, b) {
          var da = (rows - 1 - a[0]) + (cols - 1 - a[1]);
          var db = (rows - 1 - b[0]) + (cols - 1 - b[1]);
          return da - db + (rng() - 0.5) * 0.5;
        });
        next = moves[0];
      }

      r = next[0]; c = next[1];
      visited[r][c] = true;
      grid[r][c] = safeNumber(ruleFn, rng);
      path.push([r, c]);
    }
    return path;
  }

  // Add some branch paths (some safe, some traps)
  function addBranches(grid, rows, cols, ruleFn, rng, path) {
    var pathSet = new Set(path.map(function(p) { return p[0] + ',' + p[1]; }));
    for (var i = 0; i < Math.min(path.length, 6); i++) {
      var idx = Math.floor(rng() * path.length);
      var br = path[idx][0], bc = path[idx][1];
      var branchLen = 2 + Math.floor(rng() * 3);
      var isSafeBranch = rng() < 0.4;
      var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (var j = 0; j < branchLen; j++) {
        var shuffled = dirs.slice().sort(function() { return rng() - 0.5; });
        var moved = false;
        for (var d = 0; d < shuffled.length; d++) {
          var nr = br + shuffled[d][0], nc = bc + shuffled[d][1];
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !pathSet.has(nr + ',' + nc)) {
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
    var rng = mulberry32(seed);
    var grid = Array.from({length: rows}, function() { return Array(cols).fill(0); });

    grid[0][0] = 0;
    grid[rows - 1][cols - 1] = 0;

    var path = carvePath(grid, rows, cols, ruleFn, rng);
    addBranches(grid, rows, cols, ruleFn, rng, path);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
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
  var GRID_SIZES = [
    [6, 6], [7, 7], [7, 7], [8, 8],
    [8, 8], [9, 9], [9, 9], [9, 9],
  ];

  // Generate all levels with randomized parameters
  function generateLevels() {
    // Pick random parameters for each rule
    var rule2 = ruleEvenOdd();
    var rules = [
      ruleExactNumber(),
      rule2,
      ruleOppositeEvenOdd(rule2),
      ruleDivisible(),
      ruleSmallNumbers(),
      rulePerfectSquares(),
      rulePrimes(),
      ruleRemainder(),
    ];

    // Use a time-based master seed so grids vary per playthrough
    var masterSeed = Date.now();

    var levels = rules.map(function(rule, i) {
      var size = GRID_SIZES[i];
      var rows = size[0], cols = size[1];
      var grid = buildGrid(rows, cols, rule.fn, masterSeed + i * 1000);
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

    // Verify solvability — retry with different seeds until it works
    levels.forEach(function(lvl, i) {
      for (var attempt = 0; attempt < 20; attempt++) {
        if (isSolvable(lvl.grid, lvl.isSafe)) break;
        console.warn('Level ' + (i + 1) + ' ("' + lvl.name + '") not solvable, retrying (attempt ' + (attempt + 1) + ')...');
        lvl.grid = buildGrid(lvl.rows, lvl.cols, lvl.isSafe, masterSeed + i * 1000 + attempt * 37 + 7);
      }
      if (!isSolvable(lvl.grid, lvl.isSafe)) {
        console.error('Level ' + (i + 1) + ' ("' + lvl.name + '") could not be made solvable!');
      }
    });

    return levels;
  }

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.generateLevels = generateLevels;
  window.LiarsGarden.isSolvable = isSolvable;
})();
