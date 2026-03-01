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

  // Math helpers for rules
  function isPerfectCube(n) {
    if (n <= 0) return false;
    var c = Math.round(Math.cbrt(n));
    return c * c * c === n;
  }

  function isPowerOf2(n) {
    return n > 0 && (n & (n - 1)) === 0;
  }

  function digitSum(n) {
    var s = 0;
    while (n > 0) { s += n % 10; n = Math.floor(n / 10); }
    return s;
  }

  function digitProduct(n) {
    var p = 1;
    while (n > 0) { p *= n % 10; n = Math.floor(n / 10); }
    return p;
  }

  function numDigits(n) {
    return String(n).length;
  }

  function hasDigit(n, d) {
    return String(n).indexOf(String(d)) !== -1;
  }

  function isFibonacci(n) {
    // A number is Fibonacci if 5n^2+4 or 5n^2-4 is a perfect square
    if (n <= 0) return false;
    var a = 5 * n * n + 4;
    var b = 5 * n * n - 4;
    var sa = Math.round(Math.sqrt(a));
    var sb = Math.round(Math.sqrt(b));
    return sa * sa === a || sb * sb === b;
  }

  function isTriangular(n) {
    // n = k(k+1)/2 => k^2+k-2n=0 => discriminant = 1+8n
    if (n <= 0) return false;
    var disc = 1 + 8 * n;
    var s = Math.round(Math.sqrt(disc));
    return s * s === disc && (s - 1) % 2 === 0;
  }

  function isPalindrome(n) {
    var s = String(n);
    return s === s.split('').reverse().join('');
  }

  // ---- RULE POOL ----
  // Each rule factory returns {name, hint, ruleText, fn, difficulty}
  // difficulty: 1 = easy to figure out, 2 = medium, 3 = hard
  // The fn always treats 0 as safe (start/exit tiles).

  // -- Tier 1: Warm-up rules (easy) --
  var TIER1_RULES = [
    function() {
      var num = pick([3, 5, 7, 11, 13, 17, 19, 23]);
      return { hint: "Something about this number...", ruleText: "Only the number " + num + " is safe.", difficulty: 1,
        fn: function(n) { return n === 0 || n === num; } };
    },
    function() {
      return { hint: "There's a pattern here...", ruleText: "Even numbers are safe.", difficulty: 1,
        fn: function(n) { return n === 0 || n % 2 === 0; } };
    },
    function() {
      return { hint: "There's a pattern here...", ruleText: "Odd numbers are safe.", difficulty: 1,
        fn: function(n) { return n === 0 || n % 2 === 1; } };
    },
    function() {
      var threshold = pick([15, 20, 25, 30]);
      return { hint: "How high dare you go?", ruleText: "Numbers " + threshold + " or less are safe.", difficulty: 1,
        fn: function(n) { return n === 0 || n <= threshold; } };
    },
    function() {
      var threshold = pick([50, 60, 70, 80]);
      return { hint: "Only the bold survive...", ruleText: "Numbers greater than " + threshold + " are safe.", difficulty: 1,
        fn: function(n) { return n === 0 || n > threshold; } };
    },
  ];

  // -- Tier 2: Pattern rules (medium) --
  var TIER2_RULES = [
    function() {
      var d = pick([3, 4, 5, 6, 7]);
      return { hint: "Count carefully...", ruleText: "Multiples of " + d + " are safe.", difficulty: 2,
        fn: function(n) { return n === 0 || n % d === 0; } };
    },
    function() {
      return { hint: "What makes a number special?", ruleText: "Perfect squares are safe.", difficulty: 2,
        fn: function(n) { return n === 0 || isPerfectSquare(n); } };
    },
    function() {
      return { hint: "Not all numbers are created equal...", ruleText: "Prime numbers are safe.", difficulty: 2,
        fn: function(n) { return n === 0 || isPrime(n); } };
    },
    function() {
      return { hint: "Not all numbers are created equal...", ruleText: "Composite numbers are safe.", difficulty: 2,
        fn: function(n) { return n === 0 || (n > 1 && !isPrime(n)); } };
    },
    function() {
      var d = pick([1, 2, 3, 5, 7, 9]);
      return { hint: "Look at the ones place...", ruleText: "Numbers ending in " + d + " are safe.", difficulty: 2,
        fn: function(n) { return n === 0 || n % 10 === d; } };
    },
    function() {
      var lo = pick([20, 30, 40]);
      var hi = lo + pick([20, 25, 30]);
      return { hint: "Stay in the zone...", ruleText: "Numbers between " + lo + " and " + hi + " are safe.", difficulty: 2,
        fn: function(n) { return n === 0 || (n >= lo && n <= hi); } };
    },
    function() {
      var d = pick([3, 5, 7, 9]);
      return { hint: "Look at each digit...", ruleText: "Numbers containing the digit " + d + " are safe.", difficulty: 2,
        fn: function(n) { return n === 0 || hasDigit(n, d); } };
    },
    function() {
      return { hint: "Two digits are better than one...", ruleText: "Two-digit numbers are safe.", difficulty: 2,
        fn: function(n) { return n === 0 || (n >= 10 && n <= 99); } };
    },
  ];

  // -- Tier 3: Tricky rules (hard) --
  var TIER3_RULES = [
    function() {
      return { hint: "What makes a number special?", ruleText: "Powers of 2 are safe.", difficulty: 3,
        fn: function(n) { return n === 0 || isPowerOf2(n); } };
    },
    function() {
      return { hint: "Nature's sequence...", ruleText: "Fibonacci numbers are safe.", difficulty: 3,
        fn: function(n) { return n === 0 || isFibonacci(n); } };
    },
    function() {
      return { hint: "Stacking stones...", ruleText: "Triangular numbers are safe.", difficulty: 3,
        fn: function(n) { return n === 0 || isTriangular(n); } };
    },
    function() {
      var divisor = pick([5, 6, 7, 8, 9]);
      var maxRem = pick([0, 1, 2]);
      var remText = maxRem === 0
        ? "divisible by " + divisor
        : "remainder \u2264 " + maxRem + " when divided by " + divisor;
      return { hint: "What remains?", ruleText: "Numbers " + remText + " are safe.", difficulty: 3,
        fn: function(n) { return n === 0 || n % divisor <= maxRem; } };
    },
    function() {
      var target = pick([5, 7, 8, 9, 10, 11, 12]);
      return { hint: "Sum it up...", ruleText: "Numbers whose digits sum to " + target + " or less are safe.", difficulty: 3,
        fn: function(n) { return n === 0 || digitSum(n) <= target; } };
    },
    function() {
      return { hint: "Mirror, mirror...", ruleText: "Palindrome numbers are safe.", difficulty: 3,
        fn: function(n) { return n === 0 || isPalindrome(n); } };
    },
    function() {
      var a = pick([3, 4, 5]);
      var b = pick([7, 8, 9, 10, 11]);
      while (b === a) b = pick([7, 8, 9, 10, 11]);
      return { hint: "Two paths diverge...", ruleText: "Multiples of " + a + " or " + b + " are safe.", difficulty: 3,
        fn: function(n) { return n === 0 || n % a === 0 || n % b === 0; } };
    },
    function() {
      return { hint: "What makes a number special?", ruleText: "Perfect cubes are safe.", difficulty: 3,
        fn: function(n) { return n === 0 || isPerfectCube(n); } };
    },
    function() {
      var d = pick([3, 7, 9]);
      return { hint: "Break it down...", ruleText: "Numbers whose digit sum is divisible by " + d + " are safe.", difficulty: 3,
        fn: function(n) { return n === 0 || digitSum(n) % d === 0; } };
    },
    function() {
      return { hint: "Repeat yourself...", ruleText: "Numbers with repeated digits are safe.", difficulty: 3,
        fn: function(n) {
          if (n === 0) return true;
          var s = String(n);
          for (var i = 0; i < s.length; i++) {
            for (var j = i + 1; j < s.length; j++) {
              if (s[i] === s[j]) return true;
            }
          }
          return false;
        } };
    },
  ];

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

  // Ensure only one path exists from start to exit.
  // Any non-path safe tile that creates an alternate route gets swapped to unsafe.
  function enforceUniquePath(grid, rows, cols, ruleFn, rng, pathSet) {
    var changed = true;
    while (changed) {
      changed = false;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (r === 0 && c === 0) continue;
          if (r === rows - 1 && c === cols - 1) continue;
          if (pathSet.has(r + ',' + c)) continue;
          if (!ruleFn(grid[r][c])) continue;
          // Temporarily make it unsafe, see if level is still solvable
          var orig = grid[r][c];
          grid[r][c] = unsafeNumber(ruleFn, rng);
          if (isSolvable(grid, ruleFn)) {
            // Still solvable without this tile — it was either a red herring
            // or part of an alt route. Keep it unsafe to be safe, then re-check.
            // But we WANT some red herrings. Only kill it if it was on an alt route.
            // Check: was the original tile reachable from start AND could reach exit?
            // If removing it didn't break solvability, it might have been an alt route tile
            // or a harmless dead end. To distinguish: if it was adjacent to 2+ safe path-connected
            // tiles, it was likely a bridge. Keep it removed.
            // Simpler: just remove safe non-path tiles that touch the path on 2+ sides
            var adjPathCount = 0;
            var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
            for (var d = 0; d < dirs.length; d++) {
              var nr = r + dirs[d][0], nc = c + dirs[d][1];
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (pathSet.has(nr + ',' + nc) || (nr === 0 && nc === 0) || (nr === rows-1 && nc === cols-1)) {
                  adjPathCount++;
                }
              }
            }
            if (adjPathCount >= 2) {
              // This tile bridges two path segments — could create a shortcut. Remove it.
              changed = true;
            } else {
              // Dead-end red herring — restore it
              grid[r][c] = orig;
            }
          } else {
            // Removing it broke solvability — shouldn't happen since path is intact, but restore
            grid[r][c] = orig;
          }
        }
      }
    }
  }

  // Build a grid for a level
  function buildGrid(rows, cols, ruleFn, seed) {
    var rng = mulberry32(seed);
    var grid = Array.from({length: rows}, function() { return Array(cols).fill(0); });

    grid[0][0] = safeNumber(ruleFn, rng);
    grid[rows - 1][cols - 1] = safeNumber(ruleFn, rng);

    var path = carvePath(grid, rows, cols, ruleFn, rng);
    var pathSet = new Set(path.map(function(p) { return p[0] + ',' + p[1]; }));

    // Fill non-path tiles: mix of safe (red herrings) and unsafe
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue;
        if (r === rows - 1 && c === cols - 1) continue;
        if (grid[r][c] !== 0) continue;
        if (rng() < 0.6) {
          grid[r][c] = unsafeNumber(ruleFn, rng);
        } else {
          grid[r][c] = safeNumber(ruleFn, rng);
        }
      }
    }

    // Sprinkle tempting safe tiles adjacent to the path (red herring lures)
    var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (var pi = 0; pi < path.length; pi++) {
      var pr = path[pi][0], pc = path[pi][1];
      for (var d = 0; d < dirs.length; d++) {
        var nr = pr + dirs[d][0], nc = pc + dirs[d][1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
            && !pathSet.has(nr + ',' + nc)
            && !(nr === 0 && nc === 0)
            && !(nr === rows-1 && nc === cols-1)
            && !ruleFn(grid[nr][nc])
            && rng() < 0.25) {
          grid[nr][nc] = safeNumber(ruleFn, rng);
        }
      }
    }

    // Remove any safe tiles that create alternate routes to the exit
    enforceUniquePath(grid, rows, cols, ruleFn, rng, pathSet);

    // Ensure initially visible tiles (neighbors of start) have no duplicate numbers.
    // Duplicates give away the rule, especially on the exact-number level.
    var startNeighbors = [];
    for (var sd = 0; sd < dirs.length; sd++) {
      var sr = dirs[sd][0], sc = dirs[sd][1];
      if (sr >= 0 && sr < rows && sc >= 0 && sc < cols) {
        startNeighbors.push([sr, sc]);
      }
    }
    var seen = {};
    for (var si = 0; si < startNeighbors.length; si++) {
      var snr = startNeighbors[si][0], snc = startNeighbors[si][1];
      if (snr === rows - 1 && snc === cols - 1) continue;
      var val = grid[snr][snc];
      if (seen[val]) {
        // Duplicate — replace with a different number of the same safety
        var isSafe = ruleFn(val);
        for (var attempt = 0; attempt < 50; attempt++) {
          var replacement = isSafe ? safeNumber(ruleFn, rng) : unsafeNumber(ruleFn, rng);
          if (!seen[replacement]) {
            grid[snr][snc] = replacement;
            seen[replacement] = true;
            break;
          }
        }
      } else {
        seen[val] = true;
      }
    }

    return grid;
  }

  // Grid sizes per level — scales up as difficulty increases
  var GRID_SIZES = [
    [6, 6], [6, 6], [7, 7], [7, 7],
    [8, 8], [8, 8], [9, 9], [9, 9],
  ];

  // Level structure: 2 easy, 3 medium, 3 hard
  var LEVEL_TIERS = [1, 1, 2, 2, 2, 3, 3, 3];
  var TUNNEL_NAMES = [
    "Tunnel I", "Tunnel II", "Tunnel III", "Tunnel IV",
    "Tunnel V", "Tunnel VI", "Tunnel VII", "Tunnel VIII",
  ];

  // Pick N unique rules from a pool
  function pickRules(pool, count, rng) {
    var shuffled = pool.slice();
    // Fisher-Yates with rng
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor((rng || Math.random)() * (i + 1));
      var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
    }
    return shuffled.slice(0, count);
  }

  // Check a rule has enough safe numbers to make a viable grid
  function ruleIsViable(ruleFn) {
    var safeCount = 0;
    for (var i = 1; i <= 100; i++) {
      if (ruleFn(i)) safeCount++;
    }
    // Need at least 5 safe numbers for path carving to work
    return safeCount >= 5;
  }

  // Generate all levels with randomized parameters
  function generateLevels() {
    // Use a time-based master seed so grids vary per playthrough
    var masterSeed = Date.now();

    // Pick rules for each tier
    var tier1Picks = pickRules(TIER1_RULES, 2);
    var tier2Picks = pickRules(TIER2_RULES, 3);
    var tier3Picks = pickRules(TIER3_RULES, 3);

    var ruleFunctions = tier1Picks.concat(tier2Picks).concat(tier3Picks);

    var rules = ruleFunctions.map(function(factory, i) {
      var rule = factory();
      // Retry if rule isn't viable (too few safe numbers)
      for (var attempt = 0; attempt < 10; attempt++) {
        if (ruleIsViable(rule.fn)) break;
        rule = factory();
      }
      rule.name = TUNNEL_NAMES[i];
      return rule;
    });

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
        lvl.grid = buildGrid(lvl.rows, lvl.cols, lvl.isSafe, masterSeed + i * 1000 + attempt * 37 + 7);
      }
    });

    return levels;
  }

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.generateLevels = generateLevels;
  window.LiarsGarden.isSolvable = isSolvable;
})();
