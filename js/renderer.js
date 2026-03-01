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

      // Choose character screen
      if (gs.state === STATE.CHOOSE_CHARACTER) {
        drawChooseCharacter(rect.width, rect.height);
        return;
      }

      // Choose mode screen
      if (gs.state === STATE.CHOOSE_MODE) {
        drawChooseMode(gs, rect.width, rect.height);
        return;
      }

      // Choose difficulty screen
      if (gs.state === STATE.CHOOSE_LIVES) {
        drawChooseDifficulty(rect.width, rect.height);
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
        drawGameOver(gs, rect.width, rect.height);
      } else if (gs.state === STATE.WIN) {
        drawWin(gs, rect.width, rect.height);
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

    var selectedCharIndex = 0;
    var charButtons = [];

    function drawChooseCharacter(w, h) {
      drawVignette(w, h);
      var CHARS = window.LiarsGarden.CHARACTERS;
      var time = Date.now() * 0.001;

      // Floating numbers background
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

      // Heading
      ctx.fillStyle = C.numberText;
      ctx.shadowColor = '#4a8a3a';
      ctx.shadowBlur = 15;
      ctx.font = 'bold 24px monospace';
      ctx.fillText('CHOOSE YOUR CHARACTER', w / 2, h * 0.18);
      ctx.shadowBlur = 0;

      // Grid of characters
      var cols = 3;
      var rows = Math.ceil(CHARS.length / cols);
      var cellW = 100, cellH = 90;
      var gap = 16;
      var totalW = cols * cellW + (cols - 1) * gap;
      var totalH = rows * cellH + (rows - 1) * gap;
      var startX = w / 2 - totalW / 2;
      var startY = h / 2 - totalH / 2 + 10;

      charButtons = [];

      for (var i = 0; i < CHARS.length; i++) {
        var col = i % cols;
        var row = Math.floor(i / cols);
        var bx = startX + col * (cellW + gap);
        var by = startY + row * (cellH + gap);

        var isSelected = i === selectedCharIndex;
        var pulse = isSelected ? (0.7 + 0.2 * Math.sin(time * 3)) : 0.4;

        // Box
        ctx.strokeStyle = isSelected ? 'rgba(140, 180, 120, ' + pulse + ')' : 'rgba(80, 100, 70, 0.3)';
        ctx.lineWidth = isSelected ? 2 : 1;
        if (isSelected) {
          ctx.shadowColor = '#4a8a3a';
          ctx.shadowBlur = 8;
        }
        ctx.strokeRect(bx, by, cellW, cellH);
        ctx.shadowBlur = 0;

        ctx.fillStyle = isSelected ? 'rgba(20, 35, 15, 0.9)' : 'rgba(15, 20, 10, 0.6)';
        ctx.fillRect(bx, by, cellW, cellH);

        // Emoji
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(CHARS[i].emoji, bx + cellW / 2, by + cellH / 2 - 8);

        // Name
        ctx.font = '11px monospace';
        ctx.fillStyle = isSelected ? C.numberText : '#6a7a5a';
        ctx.fillText(CHARS[i].name, bx + cellW / 2, by + cellH - 14);

        charButtons.push({ x: bx, y: by, w: cellW, h: cellH, index: i });
      }

      // Hint
      ctx.fillStyle = C.hintText;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.5;
      ctx.fillText('Click to select, Enter to confirm', w / 2, startY + totalH + 30);
      ctx.globalAlpha = 1;

      // Store for external access
      createRenderer._charButtons = charButtons;
      createRenderer._selectedCharIndex = selectedCharIndex;
    }

    function handleCharacterKey(key) {
      var CHARS = window.LiarsGarden.CHARACTERS;
      var cols = 3;
      if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        selectedCharIndex = (selectedCharIndex + 1) % CHARS.length;
      } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        selectedCharIndex = (selectedCharIndex - 1 + CHARS.length) % CHARS.length;
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        selectedCharIndex = Math.min(selectedCharIndex + cols, CHARS.length - 1);
      } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        selectedCharIndex = Math.max(selectedCharIndex - cols, 0);
      } else if (key === 'Enter' || key === ' ') {
        return selectedCharIndex;
      }
      return null;
    }

    function handleCharacterClick(mx, my) {
      for (var i = 0; i < charButtons.length; i++) {
        var b = charButtons[i];
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          selectedCharIndex = b.index;
          return b.index;
        }
      }
      return null;
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

      // Score and level counter
      ctx.fillStyle = C.hudTextDim;
      ctx.textAlign = 'right';
      ctx.font = '13px monospace';
      ctx.fillText('Score: ' + gs.score + '  Level ' + (gs.currentLevel + 1) + '/8', canvasW - 12, HUD_HEIGHT / 2);

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
      var isWarned = gs.warnedTiles && gs.warnedTiles.some(function(d) { return d.row === r && d.col === c; });

      var bg, border;

      if (isDeath && gs.state === STATE.DYING) {
        bg = C.death;
        border = C.deathBorder;
      } else if (isPastDeath) {
        bg = '#2a0808';
        border = '#661a1a';
      } else if (isWarned) {
        bg = '#2a0808';
        border = '#661a1a';
      } else if (isExit) {
        bg = C.exit;
        border = C.exitBorder;
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
      if (isRevealed || isStart || isExit || (isDeath && gs.state === STATE.DYING) || isPastDeath || isPastSafe || isWarned) {
        var displayNum = isExit ? '\ud83d\udeaa' : String(num);

        if (isDeath && gs.state === STATE.DYING) {
          ctx.fillStyle = '#ee2222';
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 15;
        } else if (isPastDeath || isWarned) {
          ctx.fillStyle = '#cc4444';
          ctx.shadowColor = '#880000';
          ctx.shadowBlur = 6;
        } else if (isWalked || isStart) {
          ctx.fillStyle = C.numberTextWalked;
          ctx.shadowColor = '#5a8a4a';
          ctx.shadowBlur = 6;
        } else if (isExit) {
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

      var drawCol = gs.playerCol;
      var drawRow = gs.playerRow;

      if (gs.animating) {
        var elapsed = Date.now() - gs.animStart;
        var t = Math.min(1, elapsed / gs.animDuration);
        // Ease out quad
        t = t * (2 - t);
        drawRow = gs.animFromRow + (gs.animToRow - gs.animFromRow) * t;
        drawCol = gs.animFromCol + (gs.animToCol - gs.animFromCol) * t;
      }

      var x = gridOffsetX + drawCol * tileSize + tileSize / 2;
      var y = gridOffsetY + drawRow * tileSize + tileSize / 2;
      var r = tileSize * 0.4;

      // Bright glow under player
      var glowPulse = 0.25 + 0.1 * Math.sin(Date.now() * 0.003);
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(90, 180, 90, ' + glowPulse + ')';
      ctx.fill();

      // Draw character emoji — large enough to fill the tile
      var emoji = gs.character ? gs.character.emoji : '\ud83d\udc1b';
      var fontSize = Math.floor(tileSize * 0.75);
      ctx.font = fontSize + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, x, y);
    }

    // --- Mode selection screen ---
    var modeButtons = [];

    function drawChooseMode(gs, w, h) {
      drawVignette(w, h);
      var time = Date.now() * 0.001;

      drawFloatingNumbers(w, h, time);

      // Heading
      ctx.fillStyle = C.numberText;
      ctx.shadowColor = '#4a8a3a';
      ctx.shadowBlur = 15;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CHOOSE MODE', w / 2, h * 0.22);
      ctx.shadowBlur = 0;

      var btnW = 220, btnH = 60, gap = 20;
      var startY = h / 2 - (btnH + gap / 2);
      modeButtons = [];

      // Campaign button
      var campPulse = 0.6 + 0.15 * Math.sin(time * 2.5);
      drawMenuButton(w / 2 - btnW / 2, startY, btnW, btnH, 'CAMPAIGN', '8 levels, random rules', campPulse, time);
      modeButtons.push({ x: w / 2 - btnW / 2, y: startY, w: btnW, h: btnH, mode: 'campaign' });

      // Daily button
      var dailyPlayed = window.LiarsGarden.Daily && window.LiarsGarden.Daily.hasPlayedToday();
      var dailyLabel = dailyPlayed ? 'DAILY (DONE)' : 'DAILY PUZZLE';
      var dailyDesc = window.LiarsGarden.Daily ? window.LiarsGarden.Daily.todayKey() : '';
      var dailyPulse = 0.6 + 0.15 * Math.sin(time * 2.5 + 1);
      drawMenuButton(w / 2 - btnW / 2, startY + btnH + gap, btnW, btnH, dailyLabel, 'Same puzzle for everyone \u00b7 ' + dailyDesc, dailyPulse, time);
      modeButtons.push({ x: w / 2 - btnW / 2, y: startY + btnH + gap, w: btnW, h: btnH, mode: 'daily' });

      // High scores summary
      var scores = window.LiarsGarden.Scores ? window.LiarsGarden.Scores.getScores() : null;
      if (scores && scores.gamesPlayed > 0) {
        var statsY = startY + (btnH + gap) * 2 + 20;
        ctx.fillStyle = C.hudTextDim;
        ctx.font = '11px monospace';
        ctx.globalAlpha = 0.6;
        var bestText = 'Best: ' + scores.bestScore;
        if (scores.fewestDeathsWin !== null) bestText += '  |  Fewest deaths (win): ' + scores.fewestDeathsWin;
        ctx.fillText(bestText, w / 2, statsY);
        ctx.fillText('Games: ' + scores.gamesPlayed + '  |  Wins: ' + scores.gamesWon, w / 2, statsY + 16);
        ctx.globalAlpha = 1;
      }

      createRenderer._modeButtons = modeButtons;
    }

    function drawMenuButton(x, y, w, h, label, desc, pulse, time) {
      ctx.shadowColor = '#4a8a3a';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(140, 180, 120, ' + pulse + ')';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(20, 30, 15, 0.8)';
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = '#b0d0a0';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2 - 8);

      ctx.fillStyle = C.hintText;
      ctx.font = '10px monospace';
      ctx.globalAlpha = 0.6;
      ctx.fillText(desc, x + w / 2, y + h / 2 + 12);
      ctx.globalAlpha = 1;
    }

    function handleModeKey(key) {
      if (key === '1' || key === 'c' || key === 'C') return 'campaign';
      if (key === '2' || key === 'd' || key === 'D') return 'daily';
      if (key === 'ArrowUp' || key === 'ArrowDown') return null; // just re-render
      if (key === 'Enter' || key === ' ') return 'campaign'; // default
      return null;
    }

    function handleModeClick(mx, my) {
      for (var i = 0; i < modeButtons.length; i++) {
        var b = modeButtons[i];
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          return b.mode;
        }
      }
      return null;
    }

    // --- Difficulty selection screen (Easy / Medium / Hard) ---
    var diffButtons = [];
    var selectedDiffIndex = 1; // default Medium

    function drawChooseDifficulty(w, h) {
      drawVignette(w, h);
      var time = Date.now() * 0.001;
      var DIFFS = window.LiarsGarden.DIFFICULTIES;

      drawFloatingNumbers(w, h, time);

      // Heading
      ctx.fillStyle = C.numberText;
      ctx.shadowColor = '#4a8a3a';
      ctx.shadowBlur = 15;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CHOOSE DIFFICULTY', w / 2, h * 0.25);
      ctx.shadowBlur = 0;

      var btnW = 180, btnH = 56, gap = 16;
      var totalH = DIFFS.length * btnH + (DIFFS.length - 1) * gap;
      var startY = h / 2 - totalH / 2;
      diffButtons = [];

      for (var i = 0; i < DIFFS.length; i++) {
        var bx = w / 2 - btnW / 2;
        var by = startY + i * (btnH + gap);
        var isSelected = i === selectedDiffIndex;
        var pulse = isSelected ? (0.7 + 0.2 * Math.sin(time * 3)) : 0.4;

        ctx.shadowColor = isSelected ? '#4a8a3a' : 'transparent';
        ctx.shadowBlur = isSelected ? 10 : 0;
        ctx.strokeStyle = isSelected ? 'rgba(140, 180, 120, ' + pulse + ')' : 'rgba(80, 100, 70, 0.3)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(bx, by, btnW, btnH);
        ctx.shadowBlur = 0;

        ctx.fillStyle = isSelected ? 'rgba(20, 35, 15, 0.9)' : 'rgba(15, 20, 10, 0.6)';
        ctx.fillRect(bx, by, btnW, btnH);

        ctx.fillStyle = isSelected ? '#b0d0a0' : '#6a7a5a';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(DIFFS[i].label, bx + btnW / 2, by + btnH / 2 - 8);

        ctx.fillStyle = isSelected ? C.hudText : C.hudTextDim;
        ctx.font = '12px monospace';
        ctx.fillText(DIFFS[i].description, bx + btnW / 2, by + btnH / 2 + 12);

        diffButtons.push({ x: bx, y: by, w: btnW, h: btnH, lives: DIFFS[i].lives, index: i });
      }

      // Multiplier hint
      var mult = (10 / DIFFS[selectedDiffIndex].lives).toFixed(1).replace(/\.0$/, '');
      ctx.fillStyle = C.hintText;
      ctx.font = '11px monospace';
      ctx.globalAlpha = 0.5;
      ctx.fillText('Score multiplier: ' + mult + 'x', w / 2, startY + totalH + 25);
      ctx.globalAlpha = 1;

      createRenderer._diffButtons = diffButtons;
    }

    function handleLivesKey(key) {
      var DIFFS = window.LiarsGarden.DIFFICULTIES;
      if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        selectedDiffIndex = Math.max(0, selectedDiffIndex - 1);
        return null;
      }
      if (key === 'ArrowDown' || key === 's' || key === 'S') {
        selectedDiffIndex = Math.min(DIFFS.length - 1, selectedDiffIndex + 1);
        return null;
      }
      if (key === '1') { selectedDiffIndex = 0; return DIFFS[0].lives; }
      if (key === '2') { selectedDiffIndex = 1; return DIFFS[1].lives; }
      if (key === '3') { selectedDiffIndex = 2; return DIFFS[2].lives; }
      if (key === 'Enter' || key === ' ') {
        return DIFFS[selectedDiffIndex].lives;
      }
      return null;
    }

    function handleLivesClick(mx, my) {
      for (var i = 0; i < diffButtons.length; i++) {
        var b = diffButtons[i];
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          selectedDiffIndex = b.index;
          return b.lives;
        }
      }
      return -1;
    }

    // --- Shared floating numbers background ---
    function drawFloatingNumbers(w, h, time) {
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

    function wrapText(text, maxWidth) {
      var words = text.split(' ');
      var lines = [];
      var line = '';
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = words[i];
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines;
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
      ctx.fillText('...the path revealed...', w / 2, h / 2 - 50);
      ctx.shadowBlur = 0;

      ctx.fillStyle = C.overlayText;
      ctx.font = 'bold 16px monospace';
      ctx.fillText(gs.levelData.ruleText, w / 2, h / 2 - 15);

      // Lesson text — wrapped
      if (gs.levelData.lesson) {
        ctx.fillStyle = C.hudText;
        ctx.font = '12px monospace';
        var maxW = Math.min(w - 60, 500);
        var lines = wrapText(gs.levelData.lesson, maxW);
        for (var i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], w / 2, h / 2 + 20 + i * 18);
        }
      }
    }

    var shareBtn = null;
    var shareCopied = false;
    var shareCopiedTime = 0;

    function drawGameOver(gs, w, h) {
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
      ctx.fillText('GAME OVER', w / 2, h / 2 - 80);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Rule lesson — show what the rule was
      var lessonEndY = h / 2 - 25;
      if (gs.levelData) {
        ctx.fillStyle = C.ruleText;
        ctx.shadowColor = '#5a5a00';
        ctx.shadowBlur = 6;
        ctx.font = '14px monospace';
        ctx.fillText('The rule was:', w / 2, h / 2 - 50);
        ctx.shadowBlur = 0;
        ctx.fillStyle = C.overlayText;
        ctx.font = 'bold 15px monospace';
        ctx.fillText(gs.levelData.ruleText, w / 2, h / 2 - 30);

        // Lesson text — wrapped
        if (gs.levelData.lesson) {
          ctx.fillStyle = C.hudText;
          ctx.font = '11px monospace';
          var maxW = Math.min(w - 60, 460);
          var lines = wrapText(gs.levelData.lesson, maxW);
          for (var li = 0; li < lines.length; li++) {
            ctx.fillText(lines[li], w / 2, h / 2 - 8 + li * 16);
          }
          lessonEndY = h / 2 - 8 + lines.length * 16 + 8;
        }
      }

      // Score
      ctx.fillStyle = C.ruleText;
      ctx.font = 'bold 18px monospace';
      ctx.fillText('Score: ' + gs.score, w / 2, lessonEndY + 10);

      ctx.fillStyle = C.hudTextDim;
      ctx.font = '12px monospace';
      var mult = (10 / gs.chosenLives).toFixed(1).replace(/\.0$/, '');
      ctx.fillText(gs.currentLevel + ' levels \u00d7 ' + mult + 'x  |  ' + gs.deaths + ' death' + (gs.deaths !== 1 ? 's' : ''), w / 2, lessonEndY + 30);

      // High score
      var scores = window.LiarsGarden.Scores ? window.LiarsGarden.Scores.getScores() : null;
      if (scores && scores.bestScore > 0) {
        ctx.fillStyle = C.hudTextDim;
        ctx.font = '11px monospace';
        ctx.fillText('Best score: ' + scores.bestScore, w / 2, lessonEndY + 50);
      }

      var bottomY = lessonEndY + 70;

      // Share button for daily mode
      if (gs.gameMode === 'daily') {
        drawShareButton(gs, w, bottomY);
        bottomY += 50;
      }

      ctx.fillStyle = C.hudTextDim;
      ctx.font = '14px monospace';
      ctx.fillText('Press R or tap to restart', w / 2, bottomY);
    }

    function drawWin(gs, w, h) {
      ctx.fillStyle = C.overlay;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = C.ruleText;
      ctx.shadowColor = '#5a5a00';
      ctx.shadowBlur = 12;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Q.E.D.', w / 2, h / 2 - 70);
      ctx.shadowBlur = 0;

      // Score
      ctx.fillStyle = C.numberText;
      ctx.shadowColor = '#4a8a3a';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 22px monospace';
      ctx.fillText('Score: ' + gs.score, w / 2, h / 2 - 30);
      ctx.shadowBlur = 0;

      ctx.fillStyle = C.hudTextDim;
      ctx.font = '12px monospace';
      var mult = (10 / gs.chosenLives).toFixed(1).replace(/\.0$/, '');
      ctx.fillText('8 levels \u00d7 ' + mult + 'x  |  ' + gs.deaths + ' death' + (gs.deaths !== 1 ? 's' : ''), w / 2, h / 2 - 5);

      // High score
      var scores = window.LiarsGarden.Scores ? window.LiarsGarden.Scores.getScores() : null;
      if (scores && scores.bestScore > 0) {
        ctx.fillStyle = C.hudTextDim;
        ctx.font = '11px monospace';
        ctx.fillText('Best score: ' + scores.bestScore, w / 2, h / 2 + 15);
      }

      var bottomY = h / 2 + 35;

      // Share button for daily mode
      if (gs.gameMode === 'daily') {
        drawShareButton(gs, w, bottomY);
        bottomY += 50;
      }

      ctx.fillStyle = C.hudTextDim;
      ctx.font = '13px monospace';
      ctx.fillText('Press R to begin again.', w / 2, bottomY);
    }

    function drawShareButton(gs, w, y) {
      var btnW = 160, btnH = 36;
      var bx = w / 2 - btnW / 2;
      var time = Date.now() * 0.001;
      var pulse = 0.6 + 0.15 * Math.sin(time * 2.5);

      var label = (shareCopied && Date.now() - shareCopiedTime < 2000) ? 'COPIED!' : '[ SHARE RESULT ]';

      ctx.shadowColor = '#5a5a00';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = 'rgba(138, 138, 48, ' + pulse + ')';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, y, btnW, btnH);
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(20, 20, 10, 0.8)';
      ctx.fillRect(bx, y, btnW, btnH);

      ctx.fillStyle = C.ruleText;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, w / 2, y + btnH / 2);

      shareBtn = { x: bx, y: y, w: btnW, h: btnH };
      createRenderer._shareBtn = shareBtn;
    }

    function handleShareClick(mx, my, gs) {
      if (!shareBtn) return false;
      if (mx >= shareBtn.x && mx <= shareBtn.x + shareBtn.w && my >= shareBtn.y && my <= shareBtn.y + shareBtn.h) {
        if (window.LiarsGarden.Daily) {
          var text = window.LiarsGarden.Daily.generateShareText(
            window.LiarsGarden.Daily.todayKey(),
            gs.deaths,
            gs.currentLevel,
            gs.totalLevels || 8,
            gs.chosenLives
          );
          window.LiarsGarden.Daily.copyToClipboard(text);
          shareCopied = true;
          shareCopiedTime = Date.now();
        }
        return true;
      }
      return false;
    }

    return {
      resize: resize,
      render: render,
      handleLivesKey: handleLivesKey,
      handleLivesClick: handleLivesClick,
      handleCharacterKey: handleCharacterKey,
      handleCharacterClick: handleCharacterClick,
      handleModeKey: handleModeKey,
      handleModeClick: handleModeClick,
      handleShareClick: handleShareClick,
    };
  }

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.createRenderer = createRenderer;
})();
