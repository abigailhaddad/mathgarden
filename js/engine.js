// Liar's Garden v2 — Game engine
// Manages state, movement, reveals, death, lives

(function() {
  'use strict';

  const DEFAULT_LIVES = 5;
  const DEATH_DELAY = 600;
  const RULE_REVEAL_DELAY = 2000;

  const STATE = {
    TITLE: 'title',
    CHOOSE_CHARACTER: 'choose_character',
    CHOOSE_MODE: 'choose_mode',
    CHOOSE_LIVES: 'choose_lives',
    PLAYING: 'playing',
    DYING: 'dying',
    RULE_REVEAL: 'rule_reveal',
    GAME_OVER: 'game_over',
    WIN: 'win',
  };

  const DIFFICULTIES = [
    { label: 'Easy', lives: 10, description: '10 lives' },
    { label: 'Medium', lives: 5, description: '5 lives' },
    { label: 'Hard', lives: 3, description: '3 lives' },
  ];

  const CHARACTERS = [
    { id: 'dog', emoji: '\ud83d\udc36', name: 'Dog' },
    { id: 'spaceship', emoji: '\ud83d\ude80', name: 'Spaceship' },
    { id: 'waffle', emoji: '\ud83e\uddc7', name: 'Waffle' },
    { id: 'ghost', emoji: '\ud83d\udc7b', name: 'Ghost' },
    { id: 'mushroom', emoji: '\ud83c\udf44', name: 'Mushroom' },
    { id: 'bug', emoji: '\ud83d\udc1b', name: 'Bug' },
  ];

  // Score = (levels_beaten * 1000 - deaths * 100) * multiplier
  // multiplier = 10 / chosenLives (1 life = 10x, 5 lives = 2x, 9 lives ~1.1x)
  function calcMultiplier(chosenLives) {
    return 10 / chosenLives;
  }

  function calcScore(levelsBeat, deaths, chosenLives) {
    var raw = levelsBeat * 1000 - deaths * 100;
    return Math.max(0, Math.round(raw * calcMultiplier(chosenLives)));
  }

  function createEngine() {
    let currentLevel = 0;
    let chosenLives = DEFAULT_LIVES;
    let lives = DEFAULT_LIVES;
    let deaths = 0;
    let playerRow = 0;
    let playerCol = 0;
    let state = STATE.TITLE;
    let revealed = null;
    let walked = null;
    let deathTile = null;
    let deathNumber = 0;
    let deathTiles = [];
    let safeWalked = [];
    let warnedTiles = [];
    let chosenCharacter = CHARACTERS[0];
    let gameMode = 'campaign'; // 'campaign' or 'daily'
    let onStateChange = null;
    let animating = false;
    let animFromRow = 0;
    let animFromCol = 0;
    let animToRow = 0;
    let animToCol = 0;
    let animStart = 0;
    let animDuration = 100; // ms

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
      // Don't reset deathTiles/safeWalked — they persist until level beat or game over
      state = STATE.PLAYING;

      // Start is always revealed and walked (shows green)
      revealed[0][0] = true;
      walked[0][0] = true;
      revealed[lvl.rows - 1][lvl.cols - 1] = true;

      // Find a safe adjacent tile to pre-reveal as a freebie
      const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
      for (const [dr, dc] of dirs) {
        const nr = dr, nc = dc;
        if (nr >= 0 && nr < lvl.rows && nc >= 0 && nc < lvl.cols && lvl.isSafe(lvl.grid[nr][nc])) {
          revealed[nr][nc] = true;
          walked[nr][nc] = true;
          break;
        }
      }

      // Find an unsafe adjacent tile to pre-reveal as a warning (red)
      warnedTiles = [];
      for (const [dr, dc] of dirs) {
        const nr = dr, nc = dc;
        if (nr >= 0 && nr < lvl.rows && nc >= 0 && nc < lvl.cols && !lvl.isSafe(lvl.grid[nr][nc])) {
          revealed[nr][nc] = true;
          warnedTiles.push({row: nr, col: nc});
          break;
        }
      }

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
      if (state !== STATE.PLAYING || animating) return;

      const lvl = level();
      const nr = playerRow + dr;
      const nc = playerCol + dc;

      if (nr < 0 || nr >= lvl.rows || nc < 0 || nc >= lvl.cols) return;

      const num = lvl.grid[nr][nc];

      if (!lvl.isSafe(num)) {
        lives--;
        deaths++;
        deathTile = {row: nr, col: nc};
        deathNumber = num;
        deathTiles.push({row: nr, col: nc});
        revealed[nr][nc] = true;
        state = STATE.DYING;
        if (window.LiarsGarden.Sound) window.LiarsGarden.Sound.death();
        notify();

        setTimeout(() => {
          if (lives <= 0) {
            state = STATE.GAME_OVER;
            if (window.LiarsGarden.Sound) window.LiarsGarden.Sound.gameOver();
            var dailyKey = gameMode === 'daily' ? window.LiarsGarden.Daily.todayKey() : null;
            if (window.LiarsGarden.Scores) window.LiarsGarden.Scores.recordGameEnd(calcScore(currentLevel, deaths, chosenLives), deaths, currentLevel, levels.length, dailyKey);
            notify();
          } else {
            initLevel();
          }
        }, DEATH_DELAY);
        return;
      }

      // Start slide animation
      animFromRow = playerRow;
      animFromCol = playerCol;
      animToRow = nr;
      animToCol = nc;
      animStart = Date.now();
      animating = true;

      playerRow = nr;
      playerCol = nc;
      walked[nr][nc] = true;
      safeWalked.push({row: nr, col: nc});
      revealAdjacent(nr, nc);

      if (window.LiarsGarden.Sound) window.LiarsGarden.Sound.safeStep();

      var isExit = (nr === lvl.rows - 1 && nc === lvl.cols - 1);

      setTimeout(function() {
        animating = false;

        if (isExit) {
          state = STATE.RULE_REVEAL;
          if (window.LiarsGarden.Sound) window.LiarsGarden.Sound.levelComplete();
          notify();

          setTimeout(() => {
            currentLevel++;
            deathTiles = [];
            safeWalked = [];
            if (currentLevel >= levels.length) {
              state = STATE.WIN;
              if (window.LiarsGarden.Sound) window.LiarsGarden.Sound.win();
              var dailyKeyWin = gameMode === 'daily' ? window.LiarsGarden.Daily.todayKey() : null;
              if (window.LiarsGarden.Scores) window.LiarsGarden.Scores.recordGameEnd(calcScore(currentLevel, deaths, chosenLives), deaths, currentLevel, levels.length, dailyKeyWin);
              notify();
            } else {
              initLevel();
            }
          }, RULE_REVEAL_DELAY);
          return;
        }

        notify();
      }, animDuration);

      notify();
    }

    function restartLevel() {
      if (state !== STATE.PLAYING) return;
      initLevel();
    }

    function restartGame() {
      state = STATE.CHOOSE_CHARACTER;
      notify();
    }

    function showTitle() {
      state = STATE.TITLE;
      notify();
    }

    function chooseCharacter() {
      state = STATE.CHOOSE_CHARACTER;
      notify();
    }

    function selectCharacter(index) {
      chosenCharacter = CHARACTERS[index] || CHARACTERS[0];
      state = STATE.CHOOSE_MODE;
      notify();
    }

    function chooseMode(mode) {
      gameMode = mode;
      state = STATE.CHOOSE_LIVES;
      notify();
    }

    function chooseLives() {
      state = STATE.CHOOSE_LIVES;
      notify();
    }

    function startGame(numLives) {
      chosenLives = numLives;
      lives = numLives;
      deaths = 0;
      currentLevel = 0;
      deathTiles = [];
      safeWalked = [];
      if (gameMode === 'daily') {
        levels = window.LiarsGarden.Daily.generateDailyPuzzle();
      } else {
        levels = window.LiarsGarden.generateLevels();
      }
      initLevel();
    }

    function notify() {
      if (onStateChange) onStateChange(getState());
    }

    function getState() {
      return {
        state: state,
        currentLevel: currentLevel,
        gameMode: gameMode,
        levelData: (state === STATE.TITLE || state === STATE.CHOOSE_CHARACTER || state === STATE.CHOOSE_MODE || state === STATE.CHOOSE_LIVES) ? null : level(),
        character: chosenCharacter,
        lives: lives,
        chosenLives: chosenLives,
        totalLives: chosenLives,
        deaths: deaths,
        score: calcScore(currentLevel, deaths, chosenLives),
        playerRow: playerRow,
        playerCol: playerCol,
        revealed: revealed,
        walked: walked,
        deathTile: deathTile,
        deathNumber: deathNumber,
        deathTiles: deathTiles,
        safeWalked: safeWalked,
        warnedTiles: warnedTiles,
        totalLevels: levels ? levels.length : 8,
        animating: animating,
        animFromRow: animFromRow,
        animFromCol: animFromCol,
        animToRow: animToRow,
        animToCol: animToCol,
        animStart: animStart,
        animDuration: animDuration,
      };
    }

    return {
      showTitle: showTitle,
      chooseCharacter: chooseCharacter,
      selectCharacter: selectCharacter,
      chooseMode: chooseMode,
      chooseLives: chooseLives,
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
  window.LiarsGarden.CHARACTERS = CHARACTERS;
  window.LiarsGarden.DIFFICULTIES = DIFFICULTIES;
})();
