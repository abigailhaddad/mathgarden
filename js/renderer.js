// Proof by Elimination — Canvas renderer
// Creepy but readable: deep blacks, green-lit numbers, flickering, unsettling

(function() {
  'use strict';

  var STATE = window.LiarsGarden.STATE;

  // Palette: dark but with bright enough numbers to read
  var C = {
    bg: '#080808',
    hidden: '#0e0e0e',
    hiddenBorder: '#1a1a1a',
    revealed: '#181816',
    revealedBorder: '#3a3a28',
    walked: '#1a3a1a',
    walkedBorder: '#3a7a3a',
    death: '#3a0000',
    deathBorder: '#880000',
    exit: '#1a1800',
    exitBorder: '#5a4a00',
    exitShimmer: '#7a6a00',
    start: '#0e1818',
    startBorder: '#2a4a4a',
    playerBody: '#5a8a5a',
    playerShell: '#3a5a3a',
    numberText: '#b0d8a0',         // bright sickly green — readable
    numberTextWalked: '#90c080',
    numberTextStart: '#a0cccc',
    hudBg: '#050505',
    hudText: '#6a7a5a',
    hudTextDim: '#3a4a2a',
    lifeOn: '#7a2020',
    lifeOff: '#1a0a0a',
    overlay: 'rgba(0, 0, 0, 0.85)',
    overlayText: '#8a9a6a',
    deathText: '#cc2222',
    ruleText: '#8a8a30',
    hintText: '#4a4a2a',
  };

  // Flicker — subtle variation per frame
  var flickerSeed = 0;
  function flicker(base, range) {
    flickerSeed = (flickerSeed + 1) % 1000;
    var t = Date.now() * 0.003 + flickerSeed * 7.3;
    var f = Math.sin(t) * Math.sin(t * 2.7) * Math.sin(t * 0.3);
    return base + f * range;
  }

  function createRenderer(canvas) {
    var ctx = canvas.getContext('2d');
    var tileSize = 0;
    var gridOffsetX = 0;
    var gridOffsetY = 0;
    var HUD_HEIGHT = 48;

    function resize(gameState) {
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (gameState && gameState.levelData) {
        computeLayout(gameState, rect.width, rect.height);
      }
    }

    function computeLayout(gs, canvasW, canvasH) {
      var lvl = gs.levelData;
      var availW = canvasW - 20;
      var availH = canvasH - HUD_HEIGHT - 20;
      tileSize = Math.floor(Math.min(availW / lvl.cols, availH / lvl.rows));
      tileSize = Math.min(tileSize, 80);
      gridOffsetX = Math.floor((canvasW - tileSize * lvl.cols) / 2);
      gridOffsetY = HUD_HEIGHT + Math.floor((canvasH - HUD_HEIGHT - tileSize * lvl.rows) / 2);
    }

    function render(gs) {
      var rect = canvas.getBoundingClientRect();

      // Background
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Title screen
      if (gs.state === STATE.TITLE) {
        drawTitle(rect.width, rect.height);
        return;
      }

      if (gs.levelData) {
        computeLayout(gs, rect.width, rect.height);
      }

      drawVignette(rect.width, rect.height);
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

    function drawTitle(w, h) {
      drawVignette(w, h);

      // Floating numbers in background
      var time = Date.now() * 0.001;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var i = 0; i < 40; i++) {
        var nx = (Math.sin(i * 3.7 + time * 0.3) * 0.5 + 0.5) * w;
        var ny = (Math.cos(i * 2.3 + time * 0.2) * 0.5 + 0.5) * h;
        var num = ((i * 7 + 3) % 100) + 1;
        var alpha = 0.08 + 0.05 * Math.sin(time * 0.5 + i * 1.1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#6a8a5a';
        ctx.fillText(String(num), nx, ny);
      }
      ctx.globalAlpha = 1;

      // Title
      var titleAlpha = 0.7 + 0.2 * Math.sin(time * 1.5);
      ctx.globalAlpha = titleAlpha;
      ctx.fillStyle = C.numberText;
      ctx.shadowColor = '#4a8a3a';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 32px monospace';
      ctx.fillText('PROOF BY ELIMINATION', w / 2, h / 2 - 40);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Subtitle — bright enough to read
      ctx.fillStyle = '#a0b090';
      ctx.font = '14px monospace';
      ctx.globalAlpha = 0.8 + 0.1 * Math.sin(time * 2);
      ctx.fillText('Every number hides a secret.', w / 2, h / 2 + 10);
      ctx.fillText('Step wrong and you die.', w / 2, h / 2 + 30);
      ctx.globalAlpha = 1;

      // Start button
      var btnW = 180, btnH = 44;
      var btnX = w / 2 - btnW / 2;
      var btnY = h / 2 + 60;
      var btnPulse = 0.6 + 0.15 * Math.sin(time * 2.5);

      // Button border glow
      ctx.shadowColor = '#4a8a3a';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(140, 180, 120, ' + btnPulse + ')';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(btnX, btnY, btnW, btnH);
      ctx.shadowBlur = 0;

      // Button fill
      ctx.fillStyle = 'rgba(20, 30, 15, 0.8)';
      ctx.fillRect(btnX, btnY, btnW, btnH);

      // Button text
      ctx.fillStyle = '#b0d0a0';
      ctx.font = 'bold 16px monospace';
      ctx.globalAlpha = 0.8 + 0.15 * Math.sin(time * 3);
      ctx.fillText('[ START ]', w / 2, btnY + btnH / 2);
      ctx.globalAlpha = 1;

      // Store button bounds for click detection
      createRenderer._titleBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    }

    function drawVignette(w, h) {
      var grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    function drawHUD(gs, canvasW) {
      if (!gs.levelData) return;

      ctx.fillStyle = C.hudBg;
      ctx.fillRect(0, 0, canvasW, HUD_HEIGHT);

      // Separator
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, HUD_HEIGHT);
      ctx.lineTo(canvasW, HUD_HEIGHT);
      ctx.stroke();

      // Level name
      var nameAlpha = 0.7 + flicker(0, 0.1);
      ctx.globalAlpha = Math.max(0.4, Math.min(1, nameAlpha));
      ctx.fillStyle = C.hudText;
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(gs.levelData.name, 12, HUD_HEIGHT / 2);
      ctx.globalAlpha = 1;

      // Lives
      var dotR = 7;
      var dotSpacing = 22;
      var livesWidth = gs.totalLives * dotSpacing;
      var livesStartX = (canvasW - livesWidth) / 2 + dotR;
      for (var i = 0; i < gs.totalLives; i++) {
        ctx.beginPath();
        ctx.arc(livesStartX + i * dotSpacing, HUD_HEIGHT / 2, dotR, 0, Math.PI * 2);
        if (i < gs.lives) {
          var pulse = 0.5 + 0.3 * Math.sin(Date.now() * 0.002 + i * 1.5);
          ctx.fillStyle = 'rgba(122, 32, 32, ' + pulse + ')';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(livesStartX + i * dotSpacing, HUD_HEIGHT / 2, dotR + 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(122, 32, 32, 0.12)';
          ctx.fill();
        } else {
          ctx.fillStyle = C.lifeOff;
          ctx.fill();
        }
      }

      // Level counter
      ctx.fillStyle = C.hudTextDim;
      ctx.textAlign = 'right';
      ctx.font = '13px monospace';
      ctx.fillText('Level ' + (gs.currentLevel + 1) + '/8', canvasW - 12, HUD_HEIGHT / 2);

      // Hint
      ctx.fillStyle = C.hintText;
      ctx.textAlign = 'center';
      ctx.font = '11px monospace';
      var hintAlpha = 0.35 + flicker(0, 0.1);
      ctx.globalAlpha = Math.max(0.2, Math.min(0.6, hintAlpha));
      ctx.fillText(gs.levelData.hint, canvasW / 2, HUD_HEIGHT + 14);
      ctx.globalAlpha = 1;
    }

    function drawGrid(gs) {
      if (!gs.levelData) return;
      var lvl = gs.levelData;
      for (var r = 0; r < lvl.rows; r++) {
        for (var c = 0; c < lvl.cols; c++) {
          drawTile(gs, r, c);
        }
      }
    }

    function drawTile(gs, r, c) {
      var lvl = gs.levelData;
      var x = gridOffsetX + c * tileSize;
      var y = gridOffsetY + r * tileSize;
      var num = lvl.grid[r][c];
      var isStart = r === 0 && c === 0;
      var isExit = r === lvl.rows - 1 && c === lvl.cols - 1;
      var isDeath = gs.deathTile && gs.deathTile.row === r && gs.deathTile.col === c;
      var isWalked = gs.walked && gs.walked[r][c];
      var isRevealed = gs.revealed && gs.revealed[r][c];
      var isPastDeath = gs.deathTiles && gs.deathTiles.some(function(d) { return d.row === r && d.col === c; });
      var isPastSafe = gs.safeWalked && gs.safeWalked.some(function(d) { return d.row === r && d.col === c; });

      var bg, border;

      if (isDeath && gs.state === STATE.DYING) {
        bg = C.death;
        border = C.deathBorder;
      } else if (isPastDeath) {
        bg = '#2a0808';
        border = '#661a1a';
      } else if (isExit) {
        bg = C.exit;
        border = C.exitBorder;
      } else if (isStart) {
        bg = C.start;
        border = C.startBorder;
      } else if (isWalked) {
        bg = C.walked;
        border = C.walkedBorder;
      } else if (isPastSafe) {
        bg = '#1a3a1a';
        border = '#3a7a3a';
      } else if (isRevealed) {
        bg = C.revealed;
        border = C.revealedBorder;
      } else {
        bg = C.hidden;
        border = C.hiddenBorder;
      }

      var pad = 2;
      ctx.fillStyle = bg;
      ctx.fillRect(x + pad, y + pad, tileSize - pad * 2, tileSize - pad * 2);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + pad, y + pad, tileSize - pad * 2, tileSize - pad * 2);

      // Exit: pulsing glow
      if (isExit) {
        var exitPulse = 0.15 + 0.1 * Math.sin(Date.now() * 0.002);
        ctx.fillStyle = 'rgba(122, 106, 0, ' + exitPulse + ')';
        ctx.fillRect(x + pad + 1, y + pad + 1, tileSize - pad * 2 - 2, tileSize - pad * 2 - 2);
      }

      // Death tile: red flash
      if (isDeath && gs.state === STATE.DYING) {
        var deathFlash = 0.3 + 0.3 * Math.sin(Date.now() * 0.01);
        ctx.fillStyle = 'rgba(136, 0, 0, ' + deathFlash + ')';
        ctx.fillRect(x + pad, y + pad, tileSize - pad * 2, tileSize - pad * 2);
      }

      // Hidden tiles: subtle crawling
      if (!isRevealed && !isStart && !isExit && !(isDeath && gs.state === STATE.DYING)) {
        var noiseAlpha = 0.03 + 0.02 * Math.sin(Date.now() * 0.001 + r * 3.7 + c * 5.3);
        ctx.fillStyle = 'rgba(30, 40, 20, ' + noiseAlpha + ')';
        ctx.fillRect(x + pad, y + pad, tileSize - pad * 2, tileSize - pad * 2);
      }

      // Number text — BRIGHT enough to read clearly
      if (isRevealed || isStart || isExit || (isDeath && gs.state === STATE.DYING) || isPastDeath || isPastSafe) {
        var displayNum = (isStart || isExit) ? '\u2605' : String(num);

        if (isDeath && gs.state === STATE.DYING) {
          ctx.fillStyle = '#ee2222';
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 15;
        } else if (isPastDeath) {
          ctx.fillStyle = '#cc4444';
          ctx.shadowColor = '#880000';
          ctx.shadowBlur = 6;
        } else if (isWalked) {
          ctx.fillStyle = C.numberTextWalked;
          ctx.shadowColor = '#5a8a4a';
          ctx.shadowBlur = 6;
        } else if (isStart || isExit) {
          ctx.fillStyle = C.numberTextStart;
          ctx.shadowColor = '#4a8a8a';
          ctx.shadowBlur = 6;
        } else {
          // Revealed but not walked — flicker just slightly
          var numFlicker = 0.75 + flicker(0, 0.12);
          ctx.globalAlpha = Math.max(0.6, Math.min(1, numFlicker));
          ctx.fillStyle = C.numberText;
          ctx.shadowColor = '#5a9a4a';
          ctx.shadowBlur = 5;
        }

        ctx.font = 'bold ' + Math.floor(tileSize * 0.4) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayNum, x + tileSize / 2, y + tileSize / 2);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    function drawPlayer(gs) {
      if (!gs.levelData) return;
      if (gs.state === STATE.DYING || gs.state === STATE.GAME_OVER || gs.state === STATE.WIN) return;

      var x = gridOffsetX + gs.playerCol * tileSize + tileSize / 2;
      var y = gridOffsetY + gs.playerRow * tileSize + tileSize / 2;
      var r = tileSize * 0.28;

      // Glow under player
      ctx.beginPath();
      ctx.arc(x, y, r + 6, 0, Math.PI * 2);
      var glowPulse = 0.1 + 0.05 * Math.sin(Date.now() * 0.003);
      ctx.fillStyle = 'rgba(90, 138, 90, ' + glowPulse + ')';
      ctx.fill();

      // Body
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

      // Eyes — glowing
      var eyeGlow = 0.7 + 0.3 * Math.sin(Date.now() * 0.004);
      ctx.fillStyle = 'rgba(160, 220, 130, ' + eyeGlow + ')';
      ctx.beginPath();
      ctx.arc(x - r * 0.22, y - r * 0.15, 2.5, 0, Math.PI * 2);
      ctx.arc(x + r * 0.22, y - r * 0.15, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawDeathOverlay(gs, w, h) {
      ctx.fillStyle = 'rgba(20, 0, 0, 0.6)';
      ctx.fillRect(0, 0, w, h);

      var deathAlpha = 0.6 + 0.4 * Math.sin(Date.now() * 0.008);
      ctx.globalAlpha = deathAlpha;
      ctx.fillStyle = C.deathText;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('That was a ' + gs.deathNumber, w / 2, h / 2);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    function drawRuleReveal(gs, w, h) {
      ctx.fillStyle = C.overlay;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = C.ruleText;
      ctx.shadowColor = '#5a5a00';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('...the path revealed...', w / 2, h / 2 - 30);
      ctx.shadowBlur = 0;

      ctx.fillStyle = C.overlayText;
      ctx.font = '16px monospace';
      ctx.fillText(gs.levelData.ruleText, w / 2, h / 2 + 10);
    }

    function drawGameOver(w, h) {
      ctx.fillStyle = 'rgba(10, 0, 0, 0.9)';
      ctx.fillRect(0, 0, w, h);

      var goAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.003);
      ctx.globalAlpha = goAlpha;
      ctx.fillStyle = C.deathText;
      ctx.shadowColor = '#880000';
      ctx.shadowBlur = 30;
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 30);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      ctx.fillStyle = C.hudTextDim;
      ctx.font = '14px monospace';
      ctx.fillText('Press R or tap to restart', w / 2, h / 2 + 30);
    }

    function drawWin(w, h) {
      ctx.fillStyle = C.overlay;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = C.ruleText;
      ctx.shadowColor = '#5a5a00';
      ctx.shadowBlur = 12;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Q.E.D.', w / 2, h / 2 - 20);
      ctx.shadowBlur = 0;

      ctx.fillStyle = C.hudTextDim;
      ctx.font = '13px monospace';
      ctx.fillText('Press R to begin again.', w / 2, h / 2 + 20);
    }

    return {
      resize: resize,
      render: render,
    };
  }

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.createRenderer = createRenderer;
})();
