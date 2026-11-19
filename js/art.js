/* ============================================================
   art.js — вся графика рисуется кодом: небо, она, он, Люми, босс
   ============================================================ */

const STARS = Array.from({ length: 170 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H * 0.82,
  r: Math.random() * 1.35 + 0.25,
  p: Math.random() * TAU,
  s: Math.random() * 1.1 + 0.35,
}));

/* ---------- простые формы ---------- */

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  const k = size / 16;
  ctx.scale(k, k);
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-15, -6, -9, -17, 0, -9);
  ctx.bezierCurveTo(9, -17, 15, -6, 0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSparkle(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.18, -size * 0.18, size, 0);
  ctx.quadraticCurveTo(size * 0.18, size * 0.18, 0, size);
  ctx.quadraticCurveTo(-size * 0.18, size * 0.18, -size, 0);
  ctx.quadraticCurveTo(-size * 0.18, -size * 0.18, 0, -size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ---------- небо ---------- */

function drawSky(ctx, t, o = {}) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, o.top || '#060411');
  grad.addColorStop(0.42, o.mid || '#161030');
  grad.addColorStop(0.74, o.low || '#2f1d49');
  grad.addColorStop(1, o.bottom || '#49294f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // мягкие туманности
  const nebulas = o.nebulas || [
    [180, 220, 260, 'rgba(120,70,220,.14)'],
    [760, 160, 240, 'rgba(255,120,150,.10)'],
    [520, 380, 320, 'rgba(90,60,180,.12)'],
  ];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, c] of nebulas) {
    const ng = ctx.createRadialGradient(x, y, 0, x, y, r);
    ng.addColorStop(0, c);
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // звёзды
  for (const s of STARS) {
    const a = 0.28 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
    ctx.globalAlpha = a;
    ctx.fillStyle = s.r > 1.15 ? '#fff3de' : '#d9d3ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // пара крупных звёзд с бликом
  for (let i = 0; i < 4; i++) {
    const x = 90 + i * 210 + Math.sin(t * 0.3 + i) * 8;
    const y = 60 + ((i * 97) % 190);
    const a = 0.4 + 0.4 * Math.sin(t * 1.2 + i * 2);
    ctx.globalAlpha = a;
    drawSparkle(ctx, x, y, 4.5, '#fff0da');
  }
  ctx.globalAlpha = 1;
}

function drawMoon(ctx, x, y, r, t = 0) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 3.4);
  glow.addColorStop(0, 'rgba(255,235,205,.32)');
  glow.addColorStop(0.45, 'rgba(255,210,190,.10)');
  glow.addColorStop(1, 'rgba(255,180,180,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.4, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffeccf';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();

  ctx.fillStyle = 'rgba(214,186,166,.30)';
  const craters = [
    [-0.3, -0.25, 0.22], [0.25, -0.35, 0.14], [0.12, 0.2, 0.18], [-0.2, 0.35, 0.10], [0.38, 0.05, 0.09],
  ];
  for (const [cx, cy, cr] of craters) {
    ctx.beginPath();
    ctx.arc(x + cx * r, y + cy * r, cr * r, 0, TAU);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255,255,255,.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x - r * 0.12, y - r * 0.1, r * 0.86, 3.6, 5.6);
  ctx.stroke();
}

function drawHillLayer(ctx, camX, baseY, amp, speed, color, seed) {
  const off = camX * speed;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 20) {
    const w = x + off;
    const y = baseY
      + Math.sin(w * 0.004 + seed) * amp
      + Math.sin(w * 0.011 + seed * 1.7) * amp * 0.35;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W + 20, H);
  ctx.closePath();
  ctx.fill();
}

function drawPine(ctx, x, baseY, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const w = h * 0.32;
  for (let i = 0; i < 3; i++) {
    const yy = baseY - h * (0.28 + i * 0.24);
    const ww = w * (1 - i * 0.18);
    ctx.moveTo(x - ww, yy);
    ctx.lineTo(x, yy - h * 0.42);
    ctx.lineTo(x + ww, yy);
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillRect(x - 2, baseY - h * 0.2, 4, h * 0.2);
}

function drawFireflies(ctx, t, count = 22, yMin = 200, yMax = 460) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i++) {
    const bx = ((i * 157.3) % (W + 120)) - 60;
    const by = yMin + ((i * 97.7) % Math.max(1, yMax - yMin));
    const x = bx + Math.sin(t * 0.42 + i * 1.7) * 26;
    const y = by + Math.cos(t * 0.33 + i * 2.1) * 20;
    const a = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.4 + i * 1.3));
    const r = 10 + Math.sin(t * 0.8 + i) * 3;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(255,214,140,${0.45 * a})`);
    gr.addColorStop(1, 'rgba(255,180,120,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffe6b8';
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function floatingHearts(ctx, t, count, o = {}) {
  for (let i = 0; i < count; i++) {
    const x = (o.x || 0) + ((i * 181.7 + t * (9 + i * 1.7)) % (W + 80)) - 40;
    const y = (o.y || 300) + Math.sin(t * 0.7 + i * 1.9) * 30 - ((t * 7 + i * 53) % 160);
    const s = 5 + ((i * 7) % 9);
    ctx.globalAlpha = 0.16 + 0.14 * (0.5 + 0.5 * Math.sin(t * 1.1 + i));
    drawHeart(ctx, x, y, s, o.color || '#ff9fb4');
    ctx.globalAlpha = 1;
  }
}

/* ============================================================
   ОНА
   ============================================================ */
function drawGirl(ctx, x, y, s, facing, t, st = {}) {
  const pose = st.pose || 'idle';
  const ph = st.phase || 0;
  const walk = pose === 'walk';
  const bob = walk ? Math.abs(Math.sin(ph)) * 2 : Math.sin(t * 1.5) * 1.4;
  const sway = Math.sin(t * 1.25) * 0.02 + (walk ? Math.sin(ph) * 0.012 : 0);
  const lean = pose === 'cast' ? 0.05 : 0;

  const hairDark = '#7d2419';
  const hair = '#c9412c';
  const hairHi = '#f07a4e';
  const skin = '#f8d6c0';
  const skinShade = '#e8b49c';
  const knit = '#f2e4c8';
  const knitShade = '#d9c3a0';
  const skirt = '#4b2f54';
  const skirtShade = '#3a2342';
  const legCol = '#2f2948';
  const bootCol = '#4a2f3e';

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (facing < 0 ? -1 : 1), s);
  ctx.translate(0, -bob);
  ctx.rotate(lean);

  /* --- длинные волосы сзади --- */
  ctx.save();
  ctx.translate(0, -100);
  ctx.rotate(sway + (pose === 'jump' ? -0.05 : 0));
  ctx.translate(0, 100);

  ctx.fillStyle = hairDark;
  ctx.beginPath();
  ctx.moveTo(-12, -111);
  ctx.bezierCurveTo(-23, -107, -27, -94, -23, -80);
  ctx.bezierCurveTo(-27, -66, -26, -50, -21, -36);
  ctx.quadraticCurveTo(-24, -28, -19, -25);
  ctx.quadraticCurveTo(-16, -29, -13, -25);
  ctx.quadraticCurveTo(-9, -21, -5, -25);
  ctx.quadraticCurveTo(-1, -21, 3, -25);
  ctx.quadraticCurveTo(7, -21, 11, -25);
  ctx.quadraticCurveTo(15, -29, 18, -25);
  ctx.quadraticCurveTo(24, -28, 21, -36);
  ctx.bezierCurveTo(26, -50, 27, -66, 23, -80);
  ctx.bezierCurveTo(27, -94, 23, -107, 12, -111);
  ctx.closePath();
  ctx.fill();

  // длинные пряди
  ctx.strokeStyle = hair;
  ctx.lineCap = 'round';
  ctx.lineWidth = 7.5;
  ctx.beginPath();
  ctx.moveTo(-18, -102);
  ctx.bezierCurveTo(-24, -88, -22, -63, -18, -40);
  ctx.quadraticCurveTo(-20, -33, -15, -29);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(18, -102);
  ctx.bezierCurveTo(24, -88, 23, -62, 19, -39);
  ctx.quadraticCurveTo(21, -32, 16, -28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-7, -106);
  ctx.bezierCurveTo(-12, -90, -11, -64, -8, -40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, -106);
  ctx.bezierCurveTo(12, -89, 11, -62, 8, -38);
  ctx.stroke();

  // блики на волосах
  ctx.strokeStyle = hairHi;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(-21, -96);
  ctx.bezierCurveTo(-26, -82, -25, -58, -21, -40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(21, -96);
  ctx.bezierCurveTo(25, -80, 25, -56, 21, -38);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // кудрявые кончики
  ctx.strokeStyle = hair;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(-18, -32);
  ctx.bezierCurveTo(-22, -27, -21, -21, -16, -24);
  ctx.bezierCurveTo(-13, -26, -14, -29, -16, -28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(19, -32);
  ctx.bezierCurveTo(23, -27, 22, -21, 17, -24);
  ctx.bezierCurveTo(14, -26, 15, -29, 17, -28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, -27);
  ctx.bezierCurveTo(-4, -22, 1, -17, 4, -21);
  ctx.bezierCurveTo(6, -24, 2, -25, 1, -22);
  ctx.stroke();

  ctx.restore();

  /* --- ноги --- */
  const legA = walk ? Math.sin(ph) * 0.52 : pose === 'jump' ? 0.5 : 0;
  const legB = walk ? -Math.sin(ph) * 0.52 : pose === 'jump' ? -0.55 : 0;

  function leg(xOff, ang, back) {
    ctx.save();
    ctx.translate(xOff, -46);
    ctx.rotate(ang);
    ctx.strokeStyle = back ? '#272140' : legCol;
    ctx.lineCap = 'round';
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(0.5, 22, 1.5, 37);
    ctx.stroke();
    ctx.fillStyle = back ? '#3d2833' : bootCol;
    ctx.beginPath();
    ctx.ellipse(3.5, 40, 7.5, 4.4, -0.06, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  leg(-6.5, legB, true);
  leg(6.5, legA, false);

  /* --- юбка --- */
  ctx.fillStyle = skirt;
  ctx.beginPath();
  ctx.moveTo(-10, -58);
  ctx.lineTo(10, -58);
  ctx.quadraticCurveTo(15, -47, 19.5, -36);
  ctx.quadraticCurveTo(0, -29.5, -19.5, -36);
  ctx.quadraticCurveTo(-15, -47, -10, -58);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = skirtShade;
  ctx.beginPath();
  ctx.moveTo(-19, -36);
  ctx.quadraticCurveTo(0, -29.5, 19, -36);
  ctx.quadraticCurveTo(0, -33, -19, -36);
  ctx.closePath();
  ctx.fill();

  /* --- задняя рука --- */
  function drawArm(side, mode, phase) {
    const sx = side * 9;
    const sy = -76;
    let hx, hy;
    if (mode === 'walk') {
      const ang = Math.sin(phase + (side < 0 ? 0 : Math.PI)) * 0.5;
      hx = sx + Math.sin(ang) * 21;
      hy = sy + Math.cos(ang) * 21;
    } else if (mode === 'jump') {
      hx = sx + side * 5;
      hy = -97 - (side > 0 ? 2 : 0);
    } else if (mode === 'cast') {
      if (side > 0) { hx = 36; hy = -68; }
      else { hx = -13; hy = -58; }
    } else if (mode === 'hug') {
      hx = side > 0 ? 33 : 28;
      hy = side > 0 ? -68 : -64;
    } else {
      hx = side * 15.5;
      hy = -52;
    }
    const mx = (sx + hx) / 2 + side * 1.5;
    const my = (sy + hy) / 2 + 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, hx, hy);
    ctx.strokeStyle = '#cbb28b';
    ctx.lineWidth = 8.6;
    ctx.stroke();
    ctx.strokeStyle = side < 0 ? knitShade : knit;
    ctx.lineWidth = 6.6;
    ctx.stroke();
    // манжета и ладонь
    ctx.fillStyle = knitShade;
    ctx.beginPath();
    ctx.arc(hx, hy, 4.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(hx, hy, 3.2, 0, TAU);
    ctx.fill();
  }
  drawArm(-1, pose === 'hug' ? 'hug' : pose, ph);

  /* --- свитер --- */
  ctx.fillStyle = knit;
  ctx.beginPath();
  ctx.moveTo(-9.5, -80);
  ctx.quadraticCurveTo(-13.5, -72, -11, -58);
  ctx.lineTo(11, -58);
  ctx.quadraticCurveTo(13.5, -72, 9.5, -80);
  ctx.quadraticCurveTo(0, -84.5, -9.5, -80);
  ctx.closePath();
  ctx.fill();

  // пояс
  ctx.fillStyle = skirtShade;
  roundRect(ctx, -11.5, -60, 23, 4.5, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,215,160,.5)';
  ctx.beginPath();
  ctx.arc(0, -57.8, 1.4, 0, TAU);
  ctx.fill();

  // тень вязанки
  ctx.strokeStyle = knitShade;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-8 + i * 6, -78);
    ctx.lineTo(-8 + i * 6, -58);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // воротник
  ctx.fillStyle = knitShade;
  ctx.beginPath();
  ctx.ellipse(0, -80, 6.5, 2.6, 0, 0, TAU);
  ctx.fill();

  // брошка-сердечко
  drawHeart(ctx, 5.5, -68, 4.6, '#d94f5c');

  /* --- передняя рука --- */
  drawArm(1, pose, ph);

  /* --- шея и голова --- */
  ctx.fillStyle = skinShade;
  ctx.fillRect(-3.4, -88, 6.8, 9);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -96, 17.4, 0, TAU);
  ctx.fill();
  // ушко
  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.ellipse(14.5, -94, 3.4, 4.4, 0.15, 0, TAU);
  ctx.fill();

  /* --- лицо --- */
  // глаза
  ctx.fillStyle = '#43253a';
  ctx.beginPath();
  ctx.ellipse(-5.2, -96, 2.1, 3.1, 0.06, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(7.4, -96, 2.0, 3.0, -0.06, 0, TAU);
  ctx.fill();
  // блики
  ctx.fillStyle = '#fff4ec';
  ctx.beginPath();
  ctx.arc(-5.7, -97.4, 0.8, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6.9, -97.4, 0.75, 0, TAU);
  ctx.fill();
  // реснички
  ctx.strokeStyle = '#5c3045';
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -98.6);
  ctx.quadraticCurveTo(-5.2, -100.4, -2.6, -98.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4.6, -98.4);
  ctx.quadraticCurveTo(7.4, -100.4, 10, -98.6);
  ctx.stroke();
  // брови
  ctx.strokeStyle = 'rgba(96,49,62,.7)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-8.2, -101.6);
  ctx.quadraticCurveTo(-5.2, -102.8, -2.8, -101.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4.8, -101.4);
  ctx.quadraticCurveTo(7.2, -102.8, 9.8, -101.6);
  ctx.stroke();
  // румянец
  ctx.fillStyle = 'rgba(255,138,150,.30)';
  ctx.beginPath();
  ctx.ellipse(-9.5, -89.5, 4.2, 2.5, 0.1, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(11.5, -89.5, 4.0, 2.4, -0.1, 0, TAU);
  ctx.fill();
  // улыбка
  ctx.strokeStyle = '#b2606b';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(0.4, -87.6);
  ctx.quadraticCurveTo(2.6, -85.6, 5.0, -87.7);
  ctx.stroke();

  /* --- волосы спереди --- */
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.moveTo(-19, -99);
  ctx.bezierCurveTo(-22.5, -112, -10, -120.5, 0, -120);
  ctx.bezierCurveTo(11, -120, 22, -112.5, 19, -99);
  ctx.bezierCurveTo(16, -104, 12.5, -102, 9, -104.5);
  ctx.bezierCurveTo(6, -101, 2.5, -101.5, -1, -104);
  ctx.bezierCurveTo(-5, -100.5, -8.5, -101, -12, -104.5);
  ctx.bezierCurveTo(-15, -102, -17.5, -101.5, -19, -99);
  ctx.closePath();
  ctx.fill();

  // пробор
  ctx.strokeStyle = hairDark;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-1, -119);
  ctx.quadraticCurveTo(2, -114, 1, -109);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // мягкий блик на чёлке
  ctx.strokeStyle = hairHi;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-13, -107);
  ctx.quadraticCurveTo(-6, -111, 2, -109);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -108);
  ctx.quadraticCurveTo(11, -111, 15, -106);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // «шторки» по бокам — локоны, завитые внутрь
  function curtain(mirror, longer) {
    ctx.save();
    ctx.scale(mirror, 1);
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.moveTo(1, -112);
    ctx.bezierCurveTo(13, -112, 21, -106, 22, -98);
    ctx.bezierCurveTo(22, -93, 18, -90, 17.5, -86 - longer);
    ctx.bezierCurveTo(17, -81 - longer, 13, -79 - longer, 12, -83 - longer);
    ctx.bezierCurveTo(11, -88, 15, -91, 15.5, -95);
    ctx.bezierCurveTo(16, -101, 10, -104, 3, -104);
    ctx.closePath();
    ctx.fill();
    // завиток
    ctx.strokeStyle = hair;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(13.5, -84 - longer);
    ctx.bezierCurveTo(9.5, -79 - longer, 13.5, -75 - longer, 16.5, -79.5 - longer);
    ctx.stroke();
    // внутренняя тень
    ctx.strokeStyle = hairDark;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(15, -106);
    ctx.bezierCurveTo(19.5, -100, 19.5, -94, 16.5, -88 - longer);
    ctx.stroke();
    // блик
    ctx.strokeStyle = hairHi;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(7, -110);
    ctx.bezierCurveTo(15, -107, 17.5, -101, 16.5, -95);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  curtain(-1, 0);
  curtain(1, 2.5);

  // блик на макушке
  ctx.strokeStyle = hairHi;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -104, 9, -2.5, -1.2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // звёздочка-заколка
  ctx.save();
  ctx.translate(-13.5, -107);
  ctx.rotate(0.2);
  drawSparkle(ctx, 0, 0, 3.6, '#ffd98a');
  ctx.restore();

  /* --- свечение при касте --- */
  if (pose === 'cast') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const rr = 6 + i * 6 + Math.sin(t * 6 + i) * 2;
      ctx.strokeStyle = `rgba(255,150,180,${0.22 - i * 0.05})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(36, -68, rr, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    drawHeart(ctx, 38, -68, 9, '#ff9fb4');
  }

  ctx.restore();
}

/* ============================================================
   ОН
   ============================================================ */
function drawBoy(ctx, x, y, s, facing, t, st = {}) {
  const pose = st.pose || 'idle';
  const ph = st.phase || 0;
  const walk = pose === 'walk';
  const bob = walk ? Math.abs(Math.sin(ph)) * 2 : Math.sin(t * 1.35 + 1) * 1.2;

  const skin = '#f2cbb1';
  const skinShade = '#dfae94';
  const hair = '#312632';
  const hairHi = '#4d3947';
  const hoodie = '#456b78';
  const hoodieDark = '#355460';
  const jeans = '#34334f';
  const shoe = '#261f2f';

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (facing < 0 ? -1 : 1), s);
  ctx.translate(0, -bob);
  if (pose === 'hug') ctx.rotate(0.03);

  // ноги
  const legA = walk ? Math.sin(ph) * 0.5 : 0;
  const legB = walk ? -Math.sin(ph) * 0.5 : 0;
  function leg(xOff, ang, back) {
    ctx.save();
    ctx.translate(xOff, -46);
    ctx.rotate(ang);
    ctx.strokeStyle = back ? '#2a2942' : jeans;
    ctx.lineCap = 'round';
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(0.5, 22, 1.5, 37);
    ctx.stroke();
    ctx.fillStyle = back ? '#1f1a2b' : shoe;
    ctx.beginPath();
    ctx.ellipse(4, 40, 7.8, 4.4, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  leg(-4.5, legB, true);
  leg(4.5, legA, false);

  // руки
  function arm(side) {
    const sx = side * 10;
    const sy = -76;
    let hx, hy;
    if (pose === 'hug') { hx = 30; hy = -70; }
    else if (walk) {
      const ang = Math.sin(ph + (side < 0 ? 0 : Math.PI)) * 0.45;
      hx = sx + Math.sin(ang) * 21;
      hy = sy + Math.cos(ang) * 21;
    } else { hx = side * 13; hy = -56; }
    ctx.strokeStyle = side < 0 ? hoodieDark : hoodie;
    ctx.lineWidth = 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo((sx + hx) / 2 + side * 1.5, (sy + hy) / 2 + 5, hx, hy);
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(hx, hy, 3.2, 0, TAU);
    ctx.fill();
  }
  arm(-1);

  // тело — худи
  ctx.fillStyle = hoodie;
  ctx.beginPath();
  ctx.moveTo(-10, -80);
  ctx.quadraticCurveTo(-15, -70, -13, -54);
  ctx.lineTo(13, -54);
  ctx.quadraticCurveTo(15, -70, 10, -80);
  ctx.quadraticCurveTo(0, -84, -10, -80);
  ctx.closePath();
  ctx.fill();

  // карман
  ctx.strokeStyle = hoodieDark;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-7, -62);
  ctx.quadraticCurveTo(0, -58, 7, -62);
  ctx.stroke();

  // шнурки
  ctx.strokeStyle = '#d9cfc0';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-3, -80); ctx.lineTo(-3.6, -71);
  ctx.moveTo(3, -80); ctx.lineTo(3.6, -71);
  ctx.stroke();

  arm(1);

  // шея
  ctx.fillStyle = skinShade;
  ctx.fillRect(-3.4, -87, 6.8, 8);
  // голова
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -95, 17, 0, TAU);
  ctx.fill();
  // ухо
  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.ellipse(-14.2, -93, 3.2, 4.2, -0.15, 0, TAU);
  ctx.fill();

  // глаза
  ctx.fillStyle = '#2c2030';
  ctx.beginPath();
  ctx.ellipse(-5.4, -95.5, 2.0, 2.9, 0.05, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6.8, -95.5, 1.95, 2.85, -0.05, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff4ec';
  ctx.beginPath(); ctx.arc(-5.9, -96.8, 0.75, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(6.3, -96.8, 0.7, 0, TAU); ctx.fill();
  // брови
  ctx.strokeStyle = '#3b2b36';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8.4, -100.5); ctx.quadraticCurveTo(-5.4, -101.8, -2.6, -100.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4.4, -100.6); ctx.quadraticCurveTo(6.8, -101.8, 9.4, -100.5);
  ctx.stroke();
  // улыбка
  ctx.strokeStyle = '#b06a68';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-0.5, -88);
  ctx.quadraticCurveTo(2.6, -85.4, 5.4, -88.2);
  ctx.stroke();

  // волосы — взъерошенные
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.moveTo(-18, -97);
  ctx.bezierCurveTo(-21, -110, -14, -116.5, -6, -116);
  ctx.bezierCurveTo(-9, -120, -2, -123, 2, -118);
  ctx.bezierCurveTo(5, -123, 12, -120, 11, -115);
  ctx.bezierCurveTo(19, -115, 22, -107, 18.5, -97);
  ctx.bezierCurveTo(15, -105, 8, -106.5, 2, -106);
  ctx.bezierCurveTo(-5, -107, -14, -104, -18, -97);
  ctx.closePath();
  ctx.fill();

  // прядь на лбу
  ctx.strokeStyle = hairHi;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(-8, -108);
  ctx.bezierCurveTo(-2, -111, 5, -110, 9, -106);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/* ============================================================
   ЛЮМИ — дух-фонарик
   ============================================================ */
function drawLumi(ctx, x, y, s, t) {
  const bob = Math.sin(t * 1.7) * 6;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(s, s);

  // ореол
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 62);
  halo.addColorStop(0, 'rgba(255,214,130,.38)');
  halo.addColorStop(0.5, 'rgba(255,170,110,.12)');
  halo.addColorStop(1, 'rgba(255,150,100,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, TAU);
  ctx.fill();
  ctx.restore();

  // крылышки
  const flap = Math.sin(t * 9) * 0.35;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffe9c0';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 17, 2);
    ctx.rotate(side * (0.5 + flap));
    ctx.beginPath();
    ctx.ellipse(side * 9, 0, 12, 5.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // корпус фонарика
  const bodyGrad = ctx.createLinearGradient(0, -22, 0, 22);
  bodyGrad.addColorStop(0, '#ffe6b0');
  bodyGrad.addColorStop(0.55, '#ffc978');
  bodyGrad.addColorStop(1, '#f0a45e');
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, -16, -21, 32, 42, 10);
  ctx.fill();

  // рёбра
  ctx.strokeStyle = 'rgba(190,110,60,.35)';
  ctx.lineWidth = 1.2;
  for (const yy of [-10, 0, 10]) {
    ctx.beginPath();
    ctx.moveTo(-14, yy);
    ctx.lineTo(14, yy);
    ctx.stroke();
  }

  // металлические крышки
  ctx.fillStyle = '#8a5a48';
  roundRect(ctx, -12, -25, 24, 5, 2.4);
  ctx.fill();
  roundRect(ctx, -12, 20, 24, 5, 2.4);
  ctx.fill();

  // петелька и огонёк
  ctx.strokeStyle = '#b98a63';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -28, 3.5, 0, TAU);
  ctx.stroke();
  const flame = 4 + Math.sin(t * 6) * 1.2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255,230,160,.9)';
  ctx.beginPath();
  ctx.ellipse(0, -32, 2.6, flame, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  // лицо
  ctx.fillStyle = '#5b3a2e';
  ctx.beginPath();
  ctx.ellipse(-5.6, -3, 1.8, 2.7, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5.6, -3, 1.8, 2.7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff6e2';
  ctx.beginPath(); ctx.arc(-6, -4, 0.7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(5.2, -4, 0.7, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#7a4a36';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2.4, 4.5);
  ctx.quadraticCurveTo(0, 7, 2.4, 4.5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,110,.3)';
  ctx.beginPath(); ctx.ellipse(-9, 1.5, 2.6, 1.5, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9, 1.5, 2.6, 1.5, 0, 0, TAU); ctx.fill();

  ctx.restore();
}

/* ============================================================
   СОМНЕНИЕ — босс
   ============================================================ */
function drawBoss(ctx, x, y, s, t, hpRatio = 1, flash = 0, opts = {}) {
  const bob = Math.sin(t * 1.25) * 7;
  const low = hpRatio <= 0.34;
  const wob = low ? 0.75 : 1;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(s * (opts.squish || 1) * wob, s * (1 / (opts.squish || 1)) * wob);

  // аура
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 150);
  aura.addColorStop(0, 'rgba(150,90,255,.20)');
  aura.addColorStop(0.6, 'rgba(110,60,200,.08)');
  aura.addColorStop(1, 'rgba(90,40,180,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 150, 0, TAU);
  ctx.fill();
  ctx.restore();

  // щупальца-дым
  ctx.save();
  ctx.strokeStyle = 'rgba(60,30,100,.85)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const bx = -60 + i * 30;
    const wave = Math.sin(t * 1.5 + i * 1.7) * 16;
    ctx.lineWidth = 12 - i * 1.2;
    ctx.beginPath();
    ctx.moveTo(bx * 0.7, 52);
    ctx.bezierCurveTo(bx + wave, 80, bx - wave, 100, bx + wave * 0.6, 128);
    ctx.stroke();
  }
  ctx.restore();

  // тело
  const bodyGrad = ctx.createRadialGradient(-20, -25, 10, 0, 0, 100);
  bodyGrad.addColorStop(0, '#4a2a70');
  bodyGrad.addColorStop(0.6, '#301a4d');
  bodyGrad.addColorStop(1, '#1c0f30');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  const steps = 56;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TAU;
    const r = 78 + Math.sin(a * 3 + t * 1.8) * 6 + Math.sin(a * 5 - t * 1.1) * 4;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * 0.94;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // светлая кромка
  ctx.strokeStyle = 'rgba(170,120,255,.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // глаза
  const eyeGlow = ctx.createRadialGradient(0, -18, 2, 0, -18, 40);
  eyeGlow.addColorStop(0, 'rgba(255,140,190,.5)');
  eyeGlow.addColorStop(1, 'rgba(255,100,160,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = eyeGlow;
  ctx.beginPath();
  ctx.arc(0, -18, 40, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffb3cf';
  ctx.shadowColor = '#ff5f9e';
  ctx.shadowBlur = 18;
  const eyeY = low ? -12 : -18;
  const eyeH = low ? 4.5 : 7;
  ctx.beginPath();
  ctx.ellipse(-27, eyeY, low ? 9 : 8, eyeH, 0.18, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(27, eyeY, low ? 9 : 8, eyeH, -0.18, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;

  // «брови»
  ctx.strokeStyle = 'rgba(20,8,36,.8)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-40, low ? -30 : -34);
  ctx.lineTo(-16, low ? -26 : -30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(40, low ? -30 : -34);
  ctx.lineTo(16, low ? -26 : -30);
  ctx.stroke();

  // сердце-ядро
  if (!low) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = '#ff6f9c';
    ctx.shadowBlur = 16;
    drawHeart(ctx, 0, 18, 26, 'rgba(255,90,130,.85)');
    ctx.restore();
    ctx.strokeStyle = 'rgba(40,10,30,.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, 8);
    ctx.lineTo(4, 16);
    ctx.lineTo(-3, 21);
    ctx.lineTo(3, 29);
    ctx.stroke();
  } else {
    // треснувшее, почти погасшее сердце
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#ff8fae';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.bezierCurveTo(-16, 14, -9, 4, 0, 12);
    ctx.bezierCurveTo(9, 4, 16, 14, 0, 26);
    ctx.stroke();
    ctx.restore();
  }

  // рот
  ctx.strokeStyle = 'rgba(255,160,190,.6)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (low) {
    ctx.arc(0, 46, 10, Math.PI + 0.4, TAU - 0.4);
  } else {
    ctx.moveTo(-11, 45);
    ctx.quadraticCurveTo(-5, 51, 0, 45);
    ctx.quadraticCurveTo(5, 51, 11, 45);
  }
  ctx.stroke();

  // вспышка от удара
  if (flash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = clamp(flash, 0, 0.85);
    ctx.fillStyle = '#ffd9e8';
    ctx.beginPath();
    ctx.arc(0, 0, 84, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}

/* ---------- клетка ---------- */
function drawCageBack(ctx, cx, baseY, t) {
  const w = 86;
  const top = baseY - 212;
  ctx.save();

  // каменный постамент
  ctx.fillStyle = '#2a2238';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 112, 20, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#332a45';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 6, 98, 15, 0, 0, TAU);
  ctx.fill();

  // задние прутья
  ctx.strokeStyle = '#151020';
  ctx.lineWidth = 3;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 22, top + 26);
    ctx.lineTo(cx + i * 22, baseY - 8);
    ctx.stroke();
  }

  // купол
  ctx.strokeStyle = '#191322';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - w, top + 36);
  ctx.bezierCurveTo(cx - w, top - 22, cx + w, top - 22, cx + w, top + 36);
  ctx.stroke();

  // кольца
  ctx.strokeStyle = '#241a33';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(cx, top + 38, w, 10, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 10, w, 10, 0, 0, TAU);
  ctx.stroke();

  // шишечка
  ctx.fillStyle = '#3a2c50';
  ctx.beginPath();
  ctx.arc(cx, top - 12, 7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,210,150,.25)';
  ctx.beginPath();
  ctx.arc(cx, top - 12, 3, 0, TAU);
  ctx.fill();

  ctx.restore();
}

function drawCageFront(ctx, cx, baseY, open, t) {
  const w = 86;
  const top = baseY - 212;
  const lift = easeInOut(clamp(open, 0, 1)) * 150;
  ctx.save();

  // передние прутья
  for (let i = -2; i <= 2; i++) {
    const x = cx + i * 27;
    ctx.strokeStyle = '#1d1629';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(x, top + 40 - lift);
    ctx.lineTo(x, baseY - 10 - lift);
    ctx.stroke();
    if (lift > 2) {
      ctx.strokeStyle = 'rgba(255,215,160,.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 1.4, top + 40 - lift);
      ctx.lineTo(x + 1.4, baseY - 10 - lift);
      ctx.stroke();
    }
  }

  // поперечные обручи
  ctx.strokeStyle = '#241a33';
  ctx.lineWidth = 4;
  const rings = [top + 42 - lift, baseY - 12 - lift];
  for (const ry of rings) {
    if (ry < top + 36 - lift) continue;
    ctx.beginPath();
    ctx.moveTo(cx - w, ry);
    ctx.lineTo(cx + w, ry);
    ctx.stroke();
  }

  if (lift > 2) {
    // поднятая решётка над клеткой
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#2a2038';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 27, top + 30);
      ctx.lineTo(cx + i * 27, top + 36);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // замок
  if (open < 0.15) {
    const lx = cx + 42;
    ctx.fillStyle = '#8a6a45';
    roundRect(ctx, lx - 7, baseY - 96, 14, 13, 3);
    ctx.fill();
    ctx.strokeStyle = '#8a6a45';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(lx, baseY - 96, 5, Math.PI, TAU);
    ctx.stroke();
    ctx.fillStyle = '#3a2a1e';
    ctx.beginPath();
    ctx.arc(lx, baseY - 90, 1.6, 0, TAU);
    ctx.fill();
  }

  ctx.restore();
}
