// Proof by Elimination — Daily puzzle mode
// Same seed for everyone, one puzzle per day, shareable results.

(function() {
  'use strict';

  // Get today's date key like "2026-03-01"
  function todayKey() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // Turn a date string into a numeric seed
  function dateToSeed(dateKey) {
    var hash = 0;
    for (var i = 0; i < dateKey.length; i++) {
      hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // Seeded RNG (same as in levels.js)
  function mulberry32(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Generate a daily puzzle: picks a rule, builds a single grid, returns level data
  function generateDailyPuzzle(dateKey) {
    dateKey = dateKey || todayKey();
    var seed = dateToSeed(dateKey);
    var rng = mulberry32(seed);

    // Use the shared level generation. We pick one rule based on the seed.
    // Re-use the rule functions from levels.js indirectly via generateLevels
    // but we need a single level. Let's generate all 8 and pick one.
    // Actually, to keep the daily interesting, generate all 8 with the daily seed
    // and have the player run through all of them — but with a fixed seed so everyone
    // gets the same grids.

    // Override the master seed used in generateLevels
    var originalGenerate = window.LiarsGarden.generateLevels;

    // We need to generate levels with a deterministic seed
    // The easiest way: generate levels, but patch Math.random and Date.now
    var savedRandom = Math.random;
    var savedDateNow = Date.now;

    // Make Math.random deterministic from the daily seed
    var dailyRng = mulberry32(seed);
    Math.random = function() { return dailyRng(); };
    Date.now = function() { return seed; }; // Deterministic "time" for grid seeds

    var levels = originalGenerate('daily');

    Math.random = savedRandom;
    Date.now = savedDateNow;

    return levels;
  }

  // Generate shareable result text
  function generateShareText(dateKey, deaths, levelsBeaten, totalLevels, chosenLives) {
    var won = levelsBeaten >= totalLevels;
    var diffLabel = chosenLives <= 3 ? 'Hard' : (chosenLives <= 5 ? 'Medium' : 'Easy');
    var header = 'Proof by Elimination ' + dateKey;
    var result;
    if (won) {
      result = deaths === 0
        ? 'Flawless! 0 deaths (' + diffLabel + ')'
        : deaths + ' death' + (deaths !== 1 ? 's' : '') + ' (' + diffLabel + ')';
    } else {
      result = 'Reached level ' + levelsBeaten + '/8, ' + deaths + ' death' + (deaths !== 1 ? 's' : '') + ' (' + diffLabel + ')';
    }

    // Generate a spoiler-free grid of emojis showing death/safe pattern
    // One row per level attempted, green = cleared, red = died on, black = not reached
    var grid = '';
    for (var i = 0; i < totalLevels; i++) {
      if (i < levelsBeaten) {
        grid += '\u2705'; // green check
      } else if (i === levelsBeaten && !won) {
        grid += '\ud83d\udfe5'; // red square (died here)
      } else {
        grid += '\u2b1b'; // black square
      }
    }

    return header + '\n' + grid + '\n' + result;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function hasPlayedToday() {
    return !!window.LiarsGarden.Scores.getDailyResult(todayKey());
  }

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.Daily = {
    todayKey: todayKey,
    generateDailyPuzzle: generateDailyPuzzle,
    generateShareText: generateShareText,
    copyToClipboard: copyToClipboard,
    hasPlayedToday: hasPlayedToday,
  };
})();
