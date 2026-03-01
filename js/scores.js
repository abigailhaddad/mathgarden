// Proof by Elimination — Persistent high scores via localStorage

(function() {
  'use strict';

  var STORAGE_KEY = 'proofByElimination_scores';

  function loadScores() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {
      bestScore: 0,
      bestStreak: 0,         // most levels beaten in a row without dying
      gamesPlayed: 0,
      gamesWon: 0,
      totalDeaths: 0,
      fewestDeathsWin: null,  // fewest deaths in a completed run (null = never won)
      dailyStats: {},         // { "2026-03-01": { score, deaths, completed } }
    };
  }

  function saveScores(scores) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch (e) {}
  }

  function recordGameEnd(finalScore, deaths, levelsBeaten, totalLevels, dailyKey) {
    var scores = loadScores();
    scores.gamesPlayed++;
    scores.totalDeaths += deaths;

    if (finalScore > scores.bestScore) {
      scores.bestScore = finalScore;
    }

    if (levelsBeaten > scores.bestStreak) {
      scores.bestStreak = levelsBeaten;
    }

    var won = levelsBeaten >= totalLevels;
    if (won) {
      scores.gamesWon++;
      if (scores.fewestDeathsWin === null || deaths < scores.fewestDeathsWin) {
        scores.fewestDeathsWin = deaths;
      }
    }

    if (dailyKey) {
      scores.dailyStats[dailyKey] = {
        score: finalScore,
        deaths: deaths,
        completed: won,
        levelsBeaten: levelsBeaten,
      };
    }

    saveScores(scores);
    return scores;
  }

  function getScores() {
    return loadScores();
  }

  function getDailyResult(dateKey) {
    var scores = loadScores();
    return scores.dailyStats[dateKey] || null;
  }

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.Scores = {
    getScores: getScores,
    recordGameEnd: recordGameEnd,
    getDailyResult: getDailyResult,
  };
})();
