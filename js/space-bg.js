/**
 * space-bg.js — Animated space background
 * Renders onto #space-canvas (fixed, z-index:-1):
 *   • Deep star field (3 layers — tiny/medium/bright, different twinkle rates)
 *   • Milky Way band (diagonal, animated dust and star density)
 *   • 4 nebulae (emission + reflection, each with unique colour, size, drift)
 *   • Occasional star shimmer
 *
 * Pure Canvas 2D — no Three.js, no libraries needed.
 * Runs at ~60fps via rAF, pauses when tab is hidden.
 */
'use strict';

(function initSpaceBg() {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  let W = 0, H = 0;
  let t = 0;          // frame counter
  let raf;

  /* ── Resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildStars();     // rebuild star positions on resize
  }

  /* ════════════════════════════════════════════
     STARS
     Three layers with different sizes, opacity
     ranges, and twinkle frequencies.
  ════════════════════════════════════════════ */
  let stars = [];

  function buildStars() {
    stars = [];
    const dpr    = Math.min(window.devicePixelRatio, 2);
    const area   = W * H;
    const count  = Math.floor(area / 3000);   // density relative to screen area

    for (let i = 0; i < count; i++) {
      const rnd  = Math.random();
      let size, baseOpacity, twinkleAmp, twinkleSpeed, hue;

      if (rnd < 0.70) {
        // Small dim stars — majority
        size         = Math.random() * 0.8 + 0.3;
        baseOpacity  = Math.random() * 0.35 + 0.15;
        twinkleAmp   = 0.08;
        twinkleSpeed = Math.random() * 0.008 + 0.002;
        hue          = Math.random() < 0.5 ? 'white' : (Math.random() < 0.5 ? 'blue' : 'yellow');
      } else if (rnd < 0.92) {
        // Medium stars
        size         = Math.random() * 1.2 + 0.8;
        baseOpacity  = Math.random() * 0.45 + 0.30;
        twinkleAmp   = 0.14;
        twinkleSpeed = Math.random() * 0.012 + 0.004;
        hue          = Math.random() < 0.4 ? 'blue' : (Math.random() < 0.5 ? 'yellow' : 'white');
      } else {
        // Bright feature stars — few
        size         = Math.random() * 1.6 + 1.4;
        baseOpacity  = Math.random() * 0.30 + 0.65;
        twinkleAmp   = 0.22;
        twinkleSpeed = Math.random() * 0.018 + 0.006;
        hue          = Math.random() < 0.3 ? 'warm' : (Math.random() < 0.5 ? 'blue' : 'white');
      }

      const colours = {
        white:  `rgba(255,255,255,`,
        blue:   `rgba(180,210,255,`,
        yellow: `rgba(255,245,180,`,
        warm:   `rgba(255,220,160,`,
      };

      stars.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        size,
        baseOpacity,
        twinkleAmp,
        twinkleSpeed,
        phase:  Math.random() * Math.PI * 2,
        colour: colours[hue] || colours.white,
        // Is this a "glint" star? (gets cross spikes)
        glint:  size > 2.2 && Math.random() < 0.5,
      });
    }
  }

  function drawStars() {
    stars.forEach(s => {
      const opacity = s.baseOpacity + Math.sin(t * s.twinkleSpeed + s.phase) * s.twinkleAmp;
      const clamp   = Math.max(0, Math.min(1, opacity));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.colour + clamp + ')';
      ctx.fill();

      // Cross spikes on bright glint stars
      if (s.glint) {
        const gl = ctx.createLinearGradient(s.x - s.size * 6, s.y, s.x + s.size * 6, s.y);
        gl.addColorStop(0,   s.colour + '0)');
        gl.addColorStop(0.5, s.colour + (clamp * 0.6) + ')');
        gl.addColorStop(1,   s.colour + '0)');
        ctx.beginPath();
        ctx.strokeStyle = gl;
        ctx.lineWidth   = 0.6;
        ctx.moveTo(s.x - s.size * 6, s.y);
        ctx.lineTo(s.x + s.size * 6, s.y);
        ctx.stroke();

        const gv = ctx.createLinearGradient(s.x, s.y - s.size * 6, s.x, s.y + s.size * 6);
        gv.addColorStop(0,   s.colour + '0)');
        gv.addColorStop(0.5, s.colour + (clamp * 0.6) + ')');
        gv.addColorStop(1,   s.colour + '0)');
        ctx.beginPath();
        ctx.strokeStyle = gv;
        ctx.moveTo(s.x, s.y - s.size * 6);
        ctx.lineTo(s.x, s.y + s.size * 6);
        ctx.stroke();
      }
    });
  }

  /* ════════════════════════════════════════════
     MILKY WAY
     A diagonal band of soft star density + glow
     that slowly breathes and drifts.
  ════════════════════════════════════════════ */
  function drawMilkyWay() {
    ctx.save();

    // Translate to centre, rotate, draw the band, restore
    const cx = W * 0.52, cy = H * 0.42;
    ctx.translate(cx, cy);
    ctx.rotate(-0.52);   // ~30° diagonal

    const bandW = Math.max(W, H) * 1.8;
    const bandH = H * 0.65;

    // Pulsing opacity — very slow breath
    const pulse = 0.82 + Math.sin(t * 0.0008) * 0.12;

    // ── Core dense cluster ──
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, bandH * 0.22);
    core.addColorStop(0,   `rgba(200,185,255,${0.055 * pulse})`);
    core.addColorStop(0.4, `rgba(160,140,220,${0.030 * pulse})`);
    core.addColorStop(1,   'rgba(120,100,180,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(0, 0, bandW * 0.18, bandH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Main band glow ──
    const band = ctx.createRadialGradient(0, 0, 0, 0, 0, bandH * 0.5);
    band.addColorStop(0,    `rgba(180,165,240,${0.040 * pulse})`);
    band.addColorStop(0.3,  `rgba(140,120,200,${0.025 * pulse})`);
    band.addColorStop(0.65, `rgba(100, 80,160,${0.012 * pulse})`);
    band.addColorStop(1,    'rgba(60,40,120,0)');
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.ellipse(0, 0, bandW * 0.55, bandH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Dust lane (dark absorption) — subtle dark stripe through centre ──
    const dust = ctx.createLinearGradient(0, -bandH * 0.06, 0, bandH * 0.06);
    dust.addColorStop(0,   'rgba(0,0,0,0)');
    dust.addColorStop(0.5, 'rgba(0,0,5,0.06)');
    dust.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = dust;
    ctx.fillRect(-bandW * 0.6, -bandH * 0.06, bandW * 1.2, bandH * 0.12);

    // ── Star cluster density patches (drifting slowly) ──
    const drift = Math.sin(t * 0.0004) * 0.03;
    const patches = [
      { x: -bandW * 0.28, y: -bandH * 0.04, r: bandH * 0.12, op: 0.032 },
      { x:  bandW * 0.05,  y:  bandH * 0.03, r: bandH * 0.10, op: 0.028 },
      { x:  bandW * 0.22, y: -bandH * 0.02, r: bandH * 0.09, op: 0.025 },
      { x: -bandW * 0.08, y:  bandH * 0.05, r: bandH * 0.07, op: 0.020 },
    ];

    patches.forEach((p, i) => {
      const px = p.x + Math.sin(t * 0.0003 + i) * bandW * drift;
      const py = p.y + Math.cos(t * 0.0002 + i) * bandH * drift;
      const g  = ctx.createRadialGradient(px, py, 0, px, py, p.r);
      g.addColorStop(0,   `rgba(210,200,255,${p.op * pulse})`);
      g.addColorStop(0.5, `rgba(170,155,230,${p.op * 0.5 * pulse})`);
      g.addColorStop(1,   'rgba(130,110,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(px, py, p.r, p.r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /* ════════════════════════════════════════════
     NEBULAE
     4 distinct nebulae, each with:
     — unique colour palette
     — multi-layer radial gradients
     — independent drift + pulse animation
     — filament tendrils
  ════════════════════════════════════════════ */
  const NEBULAE = [
    {
      // Orion-style — blue/purple emission, upper-left
      cx: 0.18, cy: 0.22,
      rx: 0.28, ry: 0.22,
      angle: -0.3,
      layers: [
        { dr: 0, op: 0.18, colour: [120,  80, 220] },  // violet core
        { dr: 1, op: 0.11, colour: [ 60,  80, 200] },  // blue mid
        { dr: 2, op: 0.06, colour: [ 40, 100, 180] },  // teal outer
      ],
      pulseSpeed: 0.00055, pulseAmp: 0.18,
      driftX: 0.00012, driftY: 0.00008,
    },
    {
      // Crab-style — rose/magenta, right side
      cx: 0.82, cy: 0.35,
      rx: 0.22, ry: 0.30,
      angle: 0.4,
      layers: [
        { dr: 0, op: 0.16, colour: [220,  60, 130] },  // magenta core
        { dr: 1, op: 0.09, colour: [180,  40, 100] },  // rose mid
        { dr: 2, op: 0.05, colour: [140,  30,  80] },  // deep red outer
      ],
      pulseSpeed: 0.00042, pulseAmp: 0.20,
      driftX: -0.00010, driftY: 0.00006,
    },
    {
      // Lagoon-style — teal/cyan emission, bottom-left
      cx: 0.14, cy: 0.72,
      rx: 0.24, ry: 0.18,
      angle: 0.2,
      layers: [
        { dr: 0, op: 0.15, colour: [  0, 180, 180] },  // cyan core
        { dr: 1, op: 0.09, colour: [  0, 140, 160] },  // teal mid
        { dr: 2, op: 0.05, colour: [  0, 100, 130] },  // deep teal outer
      ],
      pulseSpeed: 0.00038, pulseAmp: 0.16,
      driftX: 0.00008, driftY: -0.00007,
    },
    {
      // Galactic core — warm gold, centre-right background
      cx: 0.65, cy: 0.58,
      rx: 0.35, ry: 0.20,
      angle: -0.15,
      layers: [
        { dr: 0, op: 0.10, colour: [200, 130,  50] },  // amber core
        { dr: 1, op: 0.06, colour: [160, 100,  40] },  // gold mid
        { dr: 2, op: 0.03, colour: [120,  70,  30] },  // brown outer
      ],
      pulseSpeed: 0.00028, pulseAmp: 0.12,
      driftX: -0.00006, driftY: 0.00004,
    },
  ];

  function drawNebulae() {
    NEBULAE.forEach((neb, ni) => {
      const pulse = 1 + Math.sin(t * neb.pulseSpeed + ni * 1.8) * neb.pulseAmp;
      const ox    = Math.sin(t * neb.driftX + ni * 2.1) * W * 0.012;
      const oy    = Math.cos(t * neb.driftY + ni * 1.6) * H * 0.010;
      const cx    = neb.cx * W + ox;
      const cy    = neb.cy * H + oy;
      const rx    = neb.rx * Math.min(W, H);
      const ry    = neb.ry * Math.min(W, H);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(neb.angle + Math.sin(t * 0.00015 + ni) * 0.04);

      neb.layers.forEach((layer, li) => {
        const spread = 1 + li * 0.55;
        const r      = [rx, ry].map(v => v * spread);
        const op     = layer.op * pulse;
        const [R, G, B] = layer.colour;

        // Build multi-stop gradient for realistic nebula falloff
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r[0]);
        g.addColorStop(0,    `rgba(${R},${G},${B},${Math.min(op, 0.25)})`);
        g.addColorStop(0.25, `rgba(${R},${G},${B},${op * 0.75})`);
        g.addColorStop(0.55, `rgba(${R},${G},${B},${op * 0.35})`);
        g.addColorStop(0.80, `rgba(${R},${G},${B},${op * 0.10})`);
        g.addColorStop(1,    `rgba(${R},${G},${B},0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, r[0], r[1], 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Filament tendrils — wispy arms extending from nebula core ──
      const [R, G, B] = neb.layers[0].colour;
      const filaments = 4 + ni;
      for (let f = 0; f < filaments; f++) {
        const angle  = (f / filaments) * Math.PI * 2 + t * 0.00008 + ni;
        const len    = rx * (0.8 + Math.sin(t * 0.0002 + f + ni) * 0.2);
        const ex     = Math.cos(angle) * len;
        const ey     = Math.sin(angle) * (len * (ry / rx));
        const fOp    = neb.layers[0].op * 0.3 * pulse;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          Math.cos(angle + 0.4) * len * 0.5,
          Math.sin(angle + 0.4) * len * 0.5 * (ry / rx),
          ex, ey
        );
        ctx.strokeStyle = `rgba(${R},${G},${B},${Math.min(fOp, 0.08)})`;
        ctx.lineWidth   = 2 + Math.sin(t * 0.001 + f) * 1;
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  /* ════════════════════════════════════════════
     SHOOTING STARS — generated dynamically
  ════════════════════════════════════════════ */
  let shooters = [];

  function spawnShooter() {
    shooters.push({
      x:     Math.random() * W * 0.8,
      y:     Math.random() * H * 0.4,
      vx:    Math.random() * 5 + 4,
      vy:    Math.random() * 3 + 1.5,
      life:  0,
      maxLife: Math.random() * 40 + 30,
      len:   Math.random() * 120 + 60,
      opacity: 0,
    });
  }

  function drawShooters() {
    // Randomly spawn
    if (Math.random() < 0.003 && shooters.length < 3) spawnShooter();

    shooters = shooters.filter(s => s.life < s.maxLife);
    shooters.forEach(s => {
      s.life++;
      s.x += s.vx;
      s.y += s.vy;

      // Fade in then out
      const prog = s.life / s.maxLife;
      s.opacity  = prog < 0.15 ? prog / 0.15 : 1 - (prog - 0.15) / 0.85;

      const angle = Math.atan2(s.vy, s.vx);
      const tail  = ctx.createLinearGradient(
        s.x - Math.cos(angle) * s.len, s.y - Math.sin(angle) * s.len,
        s.x, s.y
      );
      tail.addColorStop(0,   `rgba(255,255,255,0)`);
      tail.addColorStop(0.6, `rgba(220,235,255,${s.opacity * 0.4})`);
      tail.addColorStop(1,   `rgba(255,255,255,${s.opacity})`);

      ctx.beginPath();
      ctx.moveTo(s.x - Math.cos(angle) * s.len, s.y - Math.sin(angle) * s.len);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = tail;
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Head glow
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.fill();
    });
  }

  /* ════════════════════════════════════════════
     RENDER LOOP
  ════════════════════════════════════════════ */
  function render() {
    t++;

    // Deep space base — composited over the CSS bg-gradient
    ctx.clearRect(0, 0, W, H);

    drawMilkyWay();
    drawNebulae();
    drawStars();
    drawShooters();

    raf = requestAnimationFrame(render);
  }

  /* ── Pause when tab hidden ── */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else render();
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  render();
})();
