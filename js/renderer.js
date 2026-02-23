// Liar's Garden v2 — Canvas renderer
// Draws tiles, numbers, player, HUD, overlays

(function() {
  'use strict';

  const STATE = window.LiarsGarden.STATE;

  // Colors
  const C = {
    bg: '#1a2a1a',
    hidden: '#2a3a2a',
    hiddenBorder: '#3a4a3a',
    revealed: '#3a4a3a',
    revealedBorder: '#5a6a5a',
    walked: '#2a5a2a',
    walkedBorder: '#4a7a4a',
    death: '#8a2a2a',
    deathBorder: '#cc3333',
    exit: '#8a7a2a',
    exitBorder: '#ccbb33',
    exitShimmer: '#ffee88',
    start: '#3a5a5a',
    startBorder: '#5a8a8a',
    player: '#7a6a5a',
    playerBody: '#9a8a7a',
    playerShell: '#6a5a4a',
    numberText: '#e0e0d0',
    hudBg: '#0a1a0a',
    hudText: '#c0d0b0',
    lifeOn: '#cc4444',
    lifeOff: '#4a3a3a',
    overlay: 'rgba(0, 0, 0, 0.75)',
    overlayText: '#e0e0d0',
    deathText: '#ff6666',
    ruleText: '#ffcc44',
  };

  function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    let tileSize = 0;
    let gridOffsetX = 0;
    let gridOffsetY = 0;
    const HUD_HEIGHT = 48;

    function resize(gameState) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (gameState && gameState.levelData) {
        computeLayout(gameState, rect.width, rect.height);
      }
    }

    function computeLayout(gs, canvasW, canvasH) {
      const lvl = gs.levelData;
      const availW = canvasW - 20;
      const availH = canvasH - HUD_HEIGHT - 20;
      tileSize = Math.floor(Math.min(availW / lvl.cols, availH / lvl.rows));
      tileSize = Math.min(tileSize, 80);
      gridOffsetX = Math.floor((canvasW - tileSize * lvl.cols) / 2);
      gridOffsetY = HUD_HEIGHT + Math.floor((canvasH - HUD_HEIGHT - tileSize * lvl.rows) / 2);
    }

    function render(gs) {
      const rect = canvas.getBoundingClientRect();
      computeLayout(gs, rect.width, rect.height);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      drawHUD(gs, rect.width);
      drawGrid(gs);
      drawPlayer(gs);

      if (gs.state === STATE.DYING) {
        drawDeathOverlay(gs, rect.width, rect.height);
      } else if (gs.state === STATE.RULE_REVEAL) {
        drawRuleReveal(gs, rect.width, rect.height);
      } else if (gs.state === STATE.GAME_OVER) {
        drawGameOver(rect.width, rect.height);
      } else if (gs.state === STATE.WIN) {
        drawWin(rect.width, rect.height);
      }
    }

    function drawHUD(gs, canvasW) {
      ctx.fillStyle = C.hudBg;
      ctx.fillRect(0, 0, canvasW, HUD_HEIGHT);

      ctx.fillStyle = C.hudText;
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(gs.levelData.name, 12, HUD_HEIGHT / 2);

      // Lives as dots
      const dotR = 8;
      const dotSpacing = 24;
      const livesWidth = gs.totalLives * dotSpacing;
      const livesStartX = (canvasW - livesWidth) / 2 + dotR;
      for (let i = 0; i < gs.totalLives; i++) {
        ctx.beginPath();
        ctx.arc(livesStartX + i * dotSpacing, HUD_HEIGHT / 2, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i < gs.lives ? C.lifeOn : C.lifeOff;
        ctx.fill();
      }

      ctx.fillStyle = C.hudText;
      ctx.textAlign = 'right';
      ctx.fillText('Level ' + (gs.currentLevel + 1) + '/8', canvasW - 12, HUD_HEIGHT / 2);
    }

    function drawGrid(gs) {
      const lvl = gs.levelData;
      for (let r = 0; r < lvl.rows; r++) {
        for (let c = 0; c < lvl.cols; c++) {
          drawTile(gs, r, c);
        }
      }
    }

    function drawTile(gs, r, c) {
      const lvl = gs.levelData;
      const x = gridOffsetX + c * tileSize;
      const y = gridOffsetY + r * tileSize;
      const num = lvl.grid[r][c];
      const isStart = r === 0 && c === 0;
      const isExit = r === lvl.rows - 1 && c === lvl.cols - 1;
      const isDeath = gs.deathTile && gs.deathTile.row === r && gs.deathTile.col === c;
      const isWalked = gs.walked && gs.walked[r][c];
      const isRevealed = gs.revealed && gs.revealed[r][c];

      let bg, border;

      if (isDeath && gs.state === STATE.DYING) {
        bg = C.death;
        border = C.deathBorder;
      } else if (isExit) {
        bg = C.exit;
        border = C.exitBorder;
      } else if (isStart) {
        bg = C.start;
        border = C.startBorder;
      } else if (isWalked) {
        bg = C.walked;
        border = C.walkedBorder;
      } else if (isRevealed) {
        bg = C.revealed;
        border = C.revealedBorder;
      } else {
        bg = C.hidden;
        border = C.hiddenBorder;
      }

      const pad = 2;
      ctx.fillStyle = bg;
      ctx.fillRect(x + pad, y + pad, tileSize - pad * 2, tileSize - pad * 2);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + pad, y + pad, tileSize - pad * 2, tileSize - pad * 2);

      // Exit shimmer
      if (isExit) {
        ctx.fillStyle = C.exitShimmer;
        ctx.globalAlpha = 0.3 + 0.15 * Math.sin(Date.now() / 300);
        ctx.fillRect(x + pad + 2, y + pad + 2, tileSize - pad * 2 - 4, tileSize - pad * 2 - 4);
        ctx.globalAlpha = 1;
      }

      // Number text
      if (isRevealed || isStart || isExit || (isDeath && gs.state === STATE.DYING)) {
        const displayNum = (isStart || isExit) ? '\u2605' : String(num);
        ctx.fillStyle = (isDeath && gs.state === STATE.DYING) ? '#ff4444' : C.numberText;
        ctx.font = 'bold ' + Math.floor(tileSize * 0.4) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayNum, x + tileSize / 2, y + tileSize / 2);
      }
    }

    function drawPlayer(gs) {
      if (gs.state === STATE.DYING || gs.state === STATE.GAME_OVER || gs.state === STATE.WIN) return;

      const x = gridOffsetX + gs.playerCol * tileSize + tileSize / 2;
      const y = gridOffsetY + gs.playerRow * tileSize + tileSize / 2;
      const r = tileSize * 0.3;

      // Roly-poly body
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.playerBody;
      ctx.fill();
      ctx.strokeStyle = C.playerShell;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shell segments
      ctx.beginPath();
      ctx.moveTo(x - r * 0.3, y - r * 0.5);
      ctx.lineTo(x - r * 0.3, y + r * 0.5);
      ctx.moveTo(x + r * 0.3, y - r * 0.5);
      ctx.lineTo(x + r * 0.3, y + r * 0.5);
      ctx.strokeStyle = C.playerShell;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(x - r * 0.2, y - r * 0.15, 2, 0, Math.PI * 2);
      ctx.arc(x + r * 0.2, y - r * 0.15, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawDeathOverlay(gs, w, h) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = C.deathText;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('That was a ' + gs.deathNumber, w / 2, h / 2);
    }

    function drawRuleReveal(gs, w, h) {
      ctx.fillStyle = C.overlay;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = C.ruleText;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Level Complete!', w / 2, h / 2 - 30);

      ctx.fillStyle = C.overlayText;
      ctx.font = '18px monospace';
      ctx.fillText('The rule was: ' + gs.levelData.ruleText, w / 2, h / 2 + 10);
    }

    function drawGameOver(w, h) {
      ctx.fillStyle = C.overlay;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = C.deathText;
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 30);

      ctx.fillStyle = C.overlayText;
      ctx.font = '18px monospace';
      ctx.fillText('Press R or tap to restart', w / 2, h / 2 + 20);
    }

    function drawWin(w, h) {
      ctx.fillStyle = C.overlay;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = C.ruleText;
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('You escaped the garden!', w / 2, h / 2 - 20);

      ctx.fillStyle = C.overlayText;
      ctx.font = '16px monospace';
      ctx.fillText('All 8 levels complete. Press R to play again.', w / 2, h / 2 + 20);
    }

    return {
      resize: resize,
      render: render,
    };
  }

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.createRenderer = createRenderer;
})();
