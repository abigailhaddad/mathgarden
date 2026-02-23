// Procedural canvas drawing for all tile types
// All draw functions: (ctx, x, y, size, frame, seed)
// seed = deterministic per-position value for wobble

const Sprites = {
  // Seeded wobble for hand-drawn feel
  wobble(seed, i, amount) {
    return Math.sin(seed * 7.3 + i * 2.9) * amount;
  },

  drawGround(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#2a3a1e';
    ctx.fillRect(x, y, size, size);
    // Moss dots
    ctx.fillStyle = '#3d4f2a';
    for (let i = 0; i < 4; i++) {
      const dx = x + (((seed * 13 + i * 37) % 80) / 100) * size;
      const dy = y + (((seed * 17 + i * 53) % 80) / 100) * size;
      const r = 1.5 + (i % 2);
      ctx.beginPath();
      ctx.arc(dx + size * 0.1, dy + size * 0.1, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawDarkGround(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#1e2a16';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#2a3520';
    for (let i = 0; i < 3; i++) {
      const dx = x + (((seed * 11 + i * 41) % 80) / 100) * size;
      const dy = y + (((seed * 19 + i * 47) % 80) / 100) * size;
      ctx.beginPath();
      ctx.arc(dx + size * 0.1, dy + size * 0.1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawThorn(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#2a3a1e';
    ctx.fillRect(x, y, size, size);
    // Brambles
    ctx.strokeStyle = '#5a2020';
    ctx.lineWidth = 2;
    const cx = x + size / 2;
    const cy = y + size / 2;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + this.wobble(seed, i, 0.4);
      const r = size * 0.35 + this.wobble(seed, i + 10, 3);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
      // Thorny tips
      const tx = cx + Math.cos(angle) * r;
      const ty = cy + Math.sin(angle) * r;
      ctx.fillStyle = '#7a3030';
      ctx.beginPath();
      ctx.arc(tx, ty, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center knot
    ctx.fillStyle = '#4a1818';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  },

  drawFlower(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#2a3a1e';
    ctx.fillRect(x, y, size, size);
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Petals
    ctx.fillStyle = '#b8a0d4';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + this.wobble(seed, i, 0.2);
      const px = cx + Math.cos(angle) * size * 0.22;
      const py = cy + Math.sin(angle) * size * 0.22;
      ctx.beginPath();
      ctx.ellipse(px, py, size * 0.12, size * 0.08, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center
    ctx.fillStyle = '#d4a843';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  },

  drawMushroom(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#2a3a1e';
    ctx.fillRect(x, y, size, size);
    const cx = x + size / 2;
    // Stem
    ctx.fillStyle = '#c8c0a8';
    ctx.fillRect(cx - size * 0.08, y + size * 0.5, size * 0.16, size * 0.35);
    // Cap
    ctx.fillStyle = '#6a4a5a';
    ctx.beginPath();
    ctx.ellipse(cx, y + size * 0.45, size * 0.3, size * 0.22, 0, Math.PI, 0);
    ctx.fill();
    // Spots
    ctx.fillStyle = '#e8e0d0';
    for (let i = 0; i < 3; i++) {
      const sx = cx + this.wobble(seed, i, size * 0.15);
      const sy = y + size * 0.32 + this.wobble(seed, i + 5, size * 0.06);
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawRock(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#2a3a1e';
    ctx.fillRect(x, y, size, size);
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Irregular polygon
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath();
    const points = 6;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = size * 0.3 + this.wobble(seed, i, size * 0.08);
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    // Highlight
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath();
    ctx.arc(cx - size * 0.08, cy - size * 0.08, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  },

  drawSeed(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#2a3a1e';
    ctx.fillRect(x, y, size, size);
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.4);
    glow.addColorStop(0, 'rgba(212, 168, 67, 0.3)');
    glow.addColorStop(1, 'rgba(212, 168, 67, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, size, size);
    // Seed shape
    const bob = Math.sin(frame * 0.05) * 2;
    ctx.fillStyle = '#d4a843';
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob, size * 0.1, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c860';
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy + bob - 1, size * 0.05, size * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  drawExit(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#2a3a1e';
    ctx.fillRect(x, y, size, size);
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Shimmer glow
    const shimmer = 0.3 + Math.sin(frame * 0.04) * 0.15;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
    glow.addColorStop(0, `rgba(212, 168, 67, ${shimmer})`);
    glow.addColorStop(1, 'rgba(212, 168, 67, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, size, size);
    // Arch
    ctx.strokeStyle = '#d4a843';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.15, size * 0.25, Math.PI, 0);
    ctx.lineTo(cx + size * 0.25, cy + size * 0.35);
    ctx.lineTo(cx - size * 0.25, cy + size * 0.35);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = `rgba(212, 168, 67, ${shimmer * 0.5})`;
    ctx.fill();
  },

  drawExitLocked(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#2a3a1e';
    ctx.fillRect(x, y, size, size);
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Dim arch
    ctx.strokeStyle = '#665530';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.15, size * 0.25, Math.PI, 0);
    ctx.lineTo(cx + size * 0.25, cy + size * 0.35);
    ctx.lineTo(cx - size * 0.25, cy + size * 0.35);
    ctx.closePath();
    ctx.stroke();
    // X mark
    ctx.strokeStyle = '#884444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.12, cy - size * 0.05);
    ctx.lineTo(cx + size * 0.12, cy + size * 0.15);
    ctx.moveTo(cx + size * 0.12, cy - size * 0.05);
    ctx.lineTo(cx - size * 0.12, cy + size * 0.15);
    ctx.stroke();
  },

  drawBiolume(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#1a2a1e';
    ctx.fillRect(x, y, size, size);
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Glow pulse
    const pulse = 0.25 + Math.sin(frame * 0.03 + seed * 0.5) * 0.1;
    const isCyan = seed % 2 === 0;
    const color = isCyan ? [0, 220, 200] : [200, 50, 220];
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
    glow.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${pulse})`);
    glow.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, size, size);
    // Small luminous dots
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${pulse + 0.3})`;
    for (let i = 0; i < 3; i++) {
      const dx = cx + this.wobble(seed, i, size * 0.25);
      const dy = cy + this.wobble(seed, i + 3, size * 0.25);
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawWall(ctx, x, y, size, frame, seed) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  },

  drawPlayer(ctx, x, y, size, frame, facing) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    // Breathing animation
    const breath = Math.sin(frame * 0.06) * 1.5;
    // Body - roly poly / pill bug
    ctx.fillStyle = '#7a8a60';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1 + breath * 0.3, size * 0.22, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shell segments
    ctx.strokeStyle = '#5a6a42';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * size * 0.08, cy - size * 0.15 + breath * 0.3);
      ctx.lineTo(cx + i * size * 0.08, cy + size * 0.15 + breath * 0.3);
      ctx.stroke();
    }
    // Eyes
    const eyeOffX = facing === 'left' ? -3 : facing === 'right' ? 3 : 0;
    const eyeOffY = facing === 'up' ? -2 : facing === 'down' ? 2 : 0;
    ctx.fillStyle = '#e8e8d0';
    ctx.beginPath();
    ctx.arc(cx - 4 + eyeOffX * 0.3, cy - 3 + breath * 0.2 + eyeOffY * 0.3, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 4 + eyeOffX * 0.3, cy - 3 + breath * 0.2 + eyeOffY * 0.3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Pupils
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx - 4 + eyeOffX * 0.7, cy - 3 + breath * 0.2 + eyeOffY * 0.7, 1.2, 0, Math.PI * 2);
    ctx.arc(cx + 4 + eyeOffX * 0.7, cy - 3 + breath * 0.2 + eyeOffY * 0.7, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // Antennae
    ctx.strokeStyle = '#7a8a60';
    ctx.lineWidth = 1.5;
    const antWave = Math.sin(frame * 0.08) * 2;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - size * 0.16 + breath * 0.2);
    ctx.quadraticCurveTo(cx - 8 + antWave, cy - size * 0.35, cx - 6 + antWave, cy - size * 0.38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 3, cy - size * 0.16 + breath * 0.2);
    ctx.quadraticCurveTo(cx + 8 - antWave, cy - size * 0.35, cx + 6 - antWave, cy - size * 0.38);
    ctx.stroke();
    // Antenna tips
    ctx.fillStyle = '#d4a843';
    ctx.beginPath();
    ctx.arc(cx - 6 + antWave, cy - size * 0.38, 1.8, 0, Math.PI * 2);
    ctx.arc(cx + 6 - antWave, cy - size * 0.38, 1.8, 0, Math.PI * 2);
    ctx.fill();
  },

  // Lookup by tile type
  draw(tileType, ctx, x, y, size, frame, seed, extra) {
    switch (tileType) {
      case 'ground':      this.drawGround(ctx, x, y, size, frame, seed); break;
      case 'dark_ground': this.drawDarkGround(ctx, x, y, size, frame, seed); break;
      case 'thorn':       this.drawThorn(ctx, x, y, size, frame, seed); break;
      case 'flower':      this.drawFlower(ctx, x, y, size, frame, seed); break;
      case 'mushroom':    this.drawMushroom(ctx, x, y, size, frame, seed); break;
      case 'rock':        this.drawRock(ctx, x, y, size, frame, seed); break;
      case 'seed':        this.drawSeed(ctx, x, y, size, frame, seed); break;
      case 'exit':
        if (extra && extra.locked) this.drawExitLocked(ctx, x, y, size, frame, seed);
        else this.drawExit(ctx, x, y, size, frame, seed);
        break;
      case 'biolume':     this.drawBiolume(ctx, x, y, size, frame, seed); break;
      case 'wall':        this.drawWall(ctx, x, y, size, frame, seed); break;
      default:            this.drawGround(ctx, x, y, size, frame, seed); break;
    }
  }
};
