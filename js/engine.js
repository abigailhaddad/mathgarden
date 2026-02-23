// Liar's Garden v2 — Game engine
// Manages state, movement, reveals, death, lives

(function() {
  'use strict';

  const TOTAL_LIVES = 5;
  const DEATH_DELAY = 600;
  const RULE_REVEAL_DELAY = 2000;

  const STATE = {
    PLAYING: 'playing',
    DYING: 'dying',
    RULE_REVEAL: 'rule_reveal',
    GAME_OVER: 'game_over',
    WIN: 'win',
  };

  function createEngine() {
    let currentLevel = 0;
    let lives = TOTAL_LIVES;
    let playerRow = 0;
    let playerCol = 0;
    let state = STATE.PLAYING;
    let revealed = null;
    let walked = null;
    let deathTile = null;
    let deathNumber = 0;
    let onStateChange = null;

    var levels = null;

    function level() {
      return levels[currentLevel];
    }

    function initLevel() {
      const lvl = level();
      revealed = Array.from({length: lvl.rows}, () => Array(lvl.cols).fill(false));
      walked = Array.from({length: lvl.rows}, () => Array(lvl.cols).fill(false));
      playerRow = 0;
      playerCol = 0;
      deathTile = null;
      deathNumber = 0;
      state = STATE.PLAYING;

      // Start and exit are always revealed
      revealed[0][0] = true;
      walked[0][0] = true;
      revealed[lvl.rows - 1][lvl.cols - 1] = true;

      // Reveal neighbors of start
      revealAdjacent(0, 0);

      notify();
    }

    function revealAdjacent(r, c) {
      const lvl = level();
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < lvl.rows && nc >= 0 && nc < lvl.cols) {
          revealed[nr][nc] = true;
        }
      }
    }

    function move(dr, dc) {
      if (state !== STATE.PLAYING) return;

      const lvl = level();
      const nr = playerRow + dr;
      const nc = playerCol + dc;

      if (nr < 0 || nr >= lvl.rows || nc < 0 || nc >= lvl.cols) return;

      const num = lvl.grid[nr][nc];

      if (!lvl.isSafe(num)) {
        lives--;
        deathTile = {row: nr, col: nc};
        deathNumber = num;
        revealed[nr][nc] = true;
        state = STATE.DYING;
        notify();

        setTimeout(() => {
          if (lives <= 0) {
            state = STATE.GAME_OVER;
            notify();
          } else {
            initLevel();
          }
        }, DEATH_DELAY);
        return;
      }

      playerRow = nr;
      playerCol = nc;
      walked[nr][nc] = true;
      revealAdjacent(nr, nc);

      if (nr === lvl.rows - 1 && nc === lvl.cols - 1) {
        state = STATE.RULE_REVEAL;
        notify();

        setTimeout(() => {
          currentLevel++;
          if (currentLevel >= levels.length) {
            state = STATE.WIN;
            notify();
          } else {
            initLevel();
          }
        }, RULE_REVEAL_DELAY);
        return;
      }

      notify();
    }

    function restartLevel() {
      if (state !== STATE.PLAYING) return;
      initLevel();
    }

    function restartGame() {
      currentLevel = 0;
      lives = TOTAL_LIVES;
      levels = window.LiarsGarden.generateLevels();
      initLevel();
    }

    function startGame() {
      levels = window.LiarsGarden.generateLevels();
      currentLevel = 0;
      lives = TOTAL_LIVES;
      initLevel();
    }

    function notify() {
      if (onStateChange) onStateChange(getState());
    }

    function getState() {
      return {
        state: state,
        currentLevel: currentLevel,
        levelData: level(),
        lives: lives,
        totalLives: TOTAL_LIVES,
        playerRow: playerRow,
        playerCol: playerCol,
        revealed: revealed,
        walked: walked,
        deathTile: deathTile,
        deathNumber: deathNumber,
      };
    }

    return {
      startGame: startGame,
      initLevel: initLevel,
      move: move,
      restartLevel: restartLevel,
      restartGame: restartGame,
      getState: getState,
      get onStateChange() { return onStateChange; },
      set onStateChange(fn) { onStateChange = fn; },
      get currentLevel() { return currentLevel; },
      get lives() { return lives; },
    };
  }

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.createEngine = createEngine;
  window.LiarsGarden.STATE = STATE;
})();
