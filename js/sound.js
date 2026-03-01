// Proof by Elimination — Sound system
// Procedural audio via Web Audio API. Zero dependencies, no mp3 files.

(function() {
  'use strict';

  var ctx = null;
  var muted = false;
  var masterGain = null;

  function ensureContext() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.3;
      masterGain.connect(ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Resume context on user interaction (required by browsers)
  function resume() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playTone(freq, duration, type, volume, rampDown) {
    if (muted || !ensureContext()) return;
    resume();
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime((volume || 0.3), now);
    if (rampDown !== false) {
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playNoise(duration, volume) {
    if (muted || !ensureContext()) return;
    resume();
    var now = ctx.currentTime;
    var bufferSize = ctx.sampleRate * duration;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(gain);
    gain.connect(masterGain);
    source.start(now);
  }

  // --- Sound effects ---

  function safeStep() {
    // Soft thud: low frequency short tone + tiny noise
    playTone(120, 0.08, 'sine', 0.2);
    playNoise(0.04, 0.05);
  }

  function death() {
    // Crunch: noise burst + descending tone
    playNoise(0.25, 0.3);
    playTone(300, 0.3, 'sawtooth', 0.15);
    if (ensureContext()) {
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  }

  function levelComplete() {
    // Ascending chime: three quick notes
    playTone(440, 0.15, 'sine', 0.2);
    setTimeout(function() { playTone(554, 0.15, 'sine', 0.2); }, 100);
    setTimeout(function() { playTone(659, 0.3, 'sine', 0.25); }, 200);
  }

  function gameOver() {
    // Low descending tones
    playTone(200, 0.4, 'sine', 0.2);
    setTimeout(function() { playTone(150, 0.4, 'sine', 0.2); }, 200);
    setTimeout(function() { playTone(100, 0.6, 'sine', 0.25); }, 400);
  }

  function win() {
    // Triumphant arpeggio
    var notes = [523, 659, 784, 1047];
    notes.forEach(function(freq, i) {
      setTimeout(function() { playTone(freq, 0.3, 'sine', 0.2); }, i * 120);
    });
    setTimeout(function() { playTone(1047, 0.6, 'triangle', 0.15); }, 500);
  }

  function uiClick() {
    playTone(800, 0.05, 'sine', 0.1);
  }

  window.LiarsGarden = window.LiarsGarden || {};
  window.LiarsGarden.Sound = {
    resume: resume,
    safeStep: safeStep,
    death: death,
    levelComplete: levelComplete,
    gameOver: gameOver,
    win: win,
    uiClick: uiClick,
    toggleMute: function() {
      muted = !muted;
      return muted;
    },
    isMuted: function() { return muted; },
  };
})();
