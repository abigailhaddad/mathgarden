// Canvas rendering, theme palettes, camera

const THEMES = {
  dayforest: {
    bg: '#0a0e0a',
    groundTint: null, // use default sprite colors
  },
  duskforest: {
    bg: '#0a080e',
    groundTint: '#241e2a',
  },
  deepforest: {
    bg: '#060a06',
    groundTint: '#1a2018',
  },
  biolume: {
    bg: '#040808',
    groundTint: '#0e1a16',
  },
  alien: {
    bg: '#0a0408',
    groundTint: '#1a101e',
  },
};

const Renderer = {
  canvas: null,
  ctx: null,
  tileSize: 64,
  frame: 0,
  animId: null,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.frame = 0;
  },

  resize(cols, rows) {
    // Fit to screen
    const maxW = window.innerWidth - 20;
    const maxH = window.innerHeight - 100;
    const tileW = Math.floor(maxW / cols);
    const tileH = Math.floor(maxH / rows);
    this.tileSize = Math.min(tileW, tileH, 72);
    this.tileSize = Math.max(this.tileSize, 40); // minimum size
    this.canvas.width = cols * this.tileSize;
    this.canvas.height = rows * this.tileSize;
  },

  // Main render called each animation frame
  render(state) {
    const { grid, playerRow, playerCol, playerFacing, theme, disguises, rules,
            collectedSeeds, totalSeeds, exitLocked, dying } = state;
    const ctx = this.ctx;
    const ts = this.tileSize;
    const themeData = THEMES[theme] || THEMES.dayforest;

    // Background
    ctx.fillStyle = themeData.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const rows = grid.length;
    const cols = grid[0].length;

    // Draw tiles
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * ts;
        const y = r * ts;
        const positionSeed = r * 100 + c; // deterministic per position

        // Get effective tile (accounting for disguises)
        const eff = getEffectiveTile(grid, r, c, disguises);
        const visualType = eff.visual;

        // Check if this seed was already collected
        if (visualType === 'seed' && collectedSeeds && collectedSeeds.has(r + ',' + c)) {
          Sprites.draw('ground', ctx, x, y, ts, this.frame, positionSeed);
          continue;
        }

        // Draw the visual tile type
        const extra = {};
        if (visualType === 'exit') extra.locked = exitLocked;
        Sprites.draw(visualType, ctx, x, y, ts, this.frame, positionSeed, extra);

        // Theme tint overlay
        if (themeData.groundTint && visualType !== 'wall') {
          ctx.fillStyle = themeData.groundTint;
          ctx.globalAlpha = 0.15;
          ctx.fillRect(x, y, ts, ts);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Draw player
    if (!dying) {
      const px = playerCol * ts;
      const py = playerRow * ts;
      Sprites.drawPlayer(ctx, px, py, ts, this.frame, playerFacing);
    }

    this.frame++;
  },

  startLoop(getState) {
    const loop = () => {
      this.render(getState());
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  },

  stopLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
};
