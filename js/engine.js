// Game engine — state machine, input, move resolution

const Engine = {
  // State
  currentLevel: 0,
  grid: [],
  playerRow: 0,
  playerCol: 0,
  playerFacing: 'down',
  rules: {},
  disguises: null,
  collectedSeeds: new Set(),
  totalSeeds: 0,
  requiredSeeds: 0,
  exitLocked: false,
  deaths: 0,
  dying: false,
  won: false,
  unlockedLevels: 1,
  moveEnabled: true,

  // DOM refs
  canvas: null,
  levelNameEl: null,
  deathCounterEl: null,
  seedCounterEl: null,
  titleScreen: null,
  gameContainer: null,
  levelSelectEl: null,
  levelCompleteEl: null,
  completeTextEl: null,

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.levelNameEl = document.getElementById('level-name');
    this.deathCounterEl = document.getElementById('death-counter');
    this.seedCounterEl = document.getElementById('seed-counter');
    this.titleScreen = document.getElementById('title-screen');
    this.gameContainer = document.getElementById('game-container');
    this.levelSelectEl = document.getElementById('level-select');
    this.levelCompleteEl = document.getElementById('level-complete');
    this.completeTextEl = document.getElementById('complete-text');

    // Load progress
    try {
      const saved = localStorage.getItem('liars_garden_progress');
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedLevels = data.unlocked || 1;
        this.deaths = data.deaths || 0;
      }
    } catch (e) {}

    Renderer.init(this.canvas);
    this.bindInput();
    this.showTitle();
  },

  saveProgress() {
    try {
      localStorage.setItem('liars_garden_progress', JSON.stringify({
        unlocked: this.unlockedLevels,
        deaths: this.deaths,
      }));
    } catch (e) {}
  },

  showTitle() {
    this.titleScreen.style.display = '';
    this.gameContainer.style.display = 'none';
    this.levelSelectEl.style.display = 'none';
    Renderer.stopLoop();

    document.getElementById('start-btn').onclick = () => {
      this.startLevel(this.unlockedLevels - 1); // resume from highest unlocked
    };
  },

  showLevelSelect() {
    this.titleScreen.style.display = 'none';
    this.gameContainer.style.display = 'none';
    this.levelSelectEl.style.display = '';
    Renderer.stopLoop();

    const grid = document.getElementById('level-grid');
    // Clear children safely
    while (grid.firstChild) grid.removeChild(grid.firstChild);

    for (let i = 0; i < LEVELS.length; i++) {
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.textContent = String(i + 1);
      if (i < this.unlockedLevels) {
        btn.classList.add('unlocked');
        if (i === this.currentLevel) btn.classList.add('current');
        const levelIndex = i;
        btn.onclick = () => this.startLevel(levelIndex);
      } else {
        btn.classList.add('locked');
      }
      grid.appendChild(btn);
    }

    document.getElementById('back-btn').onclick = () => this.showTitle();
  },

  startLevel(index) {
    if (index < 0 || index >= LEVELS.length) return;
    this.currentLevel = index;
    const level = LEVELS[index];

    // Deep copy grid
    this.grid = level.grid.map(row => [...row]);
    this.playerRow = level.playerRow;
    this.playerCol = level.playerCol;
    this.playerFacing = 'down';
    this.rules = resolveRules(level.ruleOverrides);
    this.disguises = level.disguises || null;
    this.dying = false;
    this.won = false;
    this.moveEnabled = true;

    // Seeds
    this.collectedSeeds = new Set();
    this.requiredSeeds = level.requiredSeeds || 0;
    this.totalSeeds = 0;
    if (this.requiredSeeds > 0) {
      for (let r = 0; r < this.grid.length; r++) {
        for (let c = 0; c < this.grid[r].length; c++) {
          if (this.grid[r][c] === 'seed') this.totalSeeds++;
        }
      }
    }
    this.exitLocked = this.requiredSeeds > 0;

    // UI
    this.titleScreen.style.display = 'none';
    this.levelSelectEl.style.display = 'none';
    this.gameContainer.style.display = '';
    this.levelCompleteEl.style.display = 'none';
    this.levelNameEl.textContent = (index + 1) + '. ' + level.name;
    this.deathCounterEl.textContent = this.deaths > 0 ? 'Deaths: ' + this.deaths : '';
    this.updateSeedUI();

    Renderer.resize(this.grid[0].length, this.grid.length);
    Renderer.stopLoop();
    Renderer.startLoop(() => this.getRenderState());
  },

  getRenderState() {
    return {
      grid: this.grid,
      playerRow: this.playerRow,
      playerCol: this.playerCol,
      playerFacing: this.playerFacing,
      theme: LEVELS[this.currentLevel].theme,
      disguises: this.disguises,
      rules: this.rules,
      collectedSeeds: this.collectedSeeds,
      totalSeeds: this.totalSeeds,
      exitLocked: this.exitLocked,
      dying: this.dying,
    };
  },

  updateSeedUI() {
    if (this.requiredSeeds > 0) {
      this.seedCounterEl.style.display = '';
      this.seedCounterEl.textContent = 'Seeds: ' + this.collectedSeeds.size + '/' + this.totalSeeds;
    } else {
      this.seedCounterEl.style.display = 'none';
    }
  },

  // Movement and game logic
  tryMove(dr, dc) {
    if (!this.moveEnabled || this.dying || this.won) return;

    // Update facing
    if (dc < 0) this.playerFacing = 'left';
    else if (dc > 0) this.playerFacing = 'right';
    else if (dr < 0) this.playerFacing = 'up';
    else if (dr > 0) this.playerFacing = 'down';

    const newR = this.playerRow + dr;
    const newC = this.playerCol + dc;

    // Bounds check
    if (newR < 0 || newR >= this.grid.length || newC < 0 || newC >= this.grid[0].length) return;

    const eff = getEffectiveTile(this.grid, newR, newC, this.disguises);
    const tileRule = this.rules[eff.behavior] || this.rules[eff.visual];

    if (!tileRule) return;

    // Pushable check
    if (tileRule.pushable) {
      const pushR = newR + dr;
      const pushC = newC + dc;
      // Can we push?
      if (pushR >= 0 && pushR < this.grid.length && pushC >= 0 && pushC < this.grid[0].length) {
        const pushEff = getEffectiveTile(this.grid, pushR, pushC, this.disguises);
        const pushTargetRule = this.rules[pushEff.behavior] || this.rules[pushEff.visual];
        if (pushTargetRule && pushTargetRule.passable && !pushTargetRule.pushable) {
          // Push succeeds
          this.grid[pushR][pushC] = this.grid[newR][newC];
          this.grid[newR][newC] = 'ground';
          // Now the tile is ground, fall through to normal move
          return this.tryMove(dr, dc);
        }
      }
      // Push fails — blocked
      return;
    }

    // Not passable — blocked
    if (!tileRule.passable) return;

    // Move player
    this.playerRow = newR;
    this.playerCol = newC;

    // Check deadly
    if (tileRule.deadly) {
      this.die();
      return;
    }

    // Check collectible
    if (tileRule.collectible) {
      const key = newR + ',' + newC;
      if (!this.collectedSeeds.has(key)) {
        this.collectedSeeds.add(key);
        this.updateSeedUI();
        // Check if exit should unlock
        if (this.collectedSeeds.size >= this.totalSeeds) {
          this.exitLocked = false;
        }
      }
    }

    // Check exit
    if (eff.behavior === 'exit' && !this.exitLocked) {
      this.win();
    }
  },

  die() {
    this.dying = true;
    this.deaths++;
    this.deathCounterEl.textContent = 'Deaths: ' + this.deaths;
    this.moveEnabled = false;
    this.saveProgress();

    // Death flash
    this.canvas.classList.add('death-flash');
    setTimeout(() => {
      this.canvas.classList.remove('death-flash');
      this.startLevel(this.currentLevel);
    }, 600);
  },

  win() {
    this.won = true;
    this.moveEnabled = false;

    // Unlock next level
    if (this.currentLevel + 1 < LEVELS.length) {
      if (this.currentLevel + 2 > this.unlockedLevels) {
        this.unlockedLevels = this.currentLevel + 2;
      }
    }
    this.saveProgress();

    // Show completion
    if (this.currentLevel + 1 >= LEVELS.length) {
      this.completeTextEl.textContent = 'The garden has nothing left to teach you.';
    } else {
      this.completeTextEl.textContent = LEVELS[this.currentLevel].name + ' — cleared';
    }
    this.levelCompleteEl.style.display = 'flex';

    setTimeout(() => {
      if (this.currentLevel + 1 < LEVELS.length) {
        this.startLevel(this.currentLevel + 1);
      } else {
        this.showTitle();
      }
    }, 1500);
  },

  restart() {
    if (this.dying || this.won) return;
    this.startLevel(this.currentLevel);
  },

  // Input
  bindInput() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); this.tryMove(-1, 0); break;
        case 'ArrowDown':  case 's': case 'S': e.preventDefault(); this.tryMove(1, 0);  break;
        case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); this.tryMove(0, -1); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); this.tryMove(0, 1);  break;
        case 'r': case 'R': this.restart(); break;
        case 'l': case 'L': this.showLevelSelect(); break;
      }
    });

    // Touch / swipe
    let touchStartX = 0, touchStartY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const threshold = 20;

      if (absDx < threshold && absDy < threshold) return; // tap, not swipe

      if (absDx > absDy) {
        this.tryMove(0, dx > 0 ? 1 : -1);
      } else {
        this.tryMove(dy > 0 ? 1 : -1, 0);
      }
      e.preventDefault();
    }, { passive: false });
  },
};

// Boot
window.addEventListener('DOMContentLoaded', () => Engine.init());
