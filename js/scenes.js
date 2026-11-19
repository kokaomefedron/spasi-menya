/* ============================================================
   scenes.js — титул, поляна с Люми, платформер
   ============================================================ */

let scene = 'title';
let sceneT = 0;
let starting = false;

const SCENE_CAPTIONS = {
  meadow: 'поляна',
  cage: 'клетка',
};

function setScene(name) {
  scene = name;
  sceneT = 0;
  document.body.dataset.scene = name;

  Dialogue.active = false;
  Dialogue.onEnd = null;
  dom.dialogue.classList.add('hidden');
  dom.title.classList.toggle('hidden', name !== 'title');
  dom.hud.classList.add('hidden');
  dom.bossUI.classList.add('hidden');
  dom.ending.classList.add('hidden');
  dom.touch.classList.add('hidden');
  dom.attackBtn.disabled = true;

  const caption = SCENE_CAPTIONS[name];
  dom.caption.classList.toggle('hidden', !caption);
  if (caption) dom.captionText.textContent = caption;

  if (name === 'meadow') initMeadow();
  else if (name === 'platformer') initPlatformer();
  else if (name === 'boss') initBoss();
  else if (name === 'cage') initCage();
  else if (name === 'ending') initEnding();

  // высота «экрана» зависит от сцены — пересчитываем кадр
  resizeCanvas();
}

function goTo(name) {
  Fade.to(() => setScene(name));
}

function startGame() {
  if (starting) return;
  starting = true;
  Sound.init();
  goTo('meadow');
  setTimeout(() => { starting = false; }, 1600);
}

dom.startBtn.addEventListener('click', startGame);
dom.title.addEventListener('click', e => {
  if (e.target.closest('button')) return;
  startGame();
});
dom.replayBtn.addEventListener('click', () => location.reload());

/* ============================================================
   ТИТУЛ
   ============================================================ */
function drawTitleScene() {
  drawSky(g, T, {
    top: '#060412', mid: '#191035', low: '#36204e', bottom: '#5a2f58',
    nebulas: [
      [220, 200, 280, 'rgba(120,70,220,.16)'],
      [790, 170, 260, 'rgba(255,120,150,.12)'],
      [560, 420, 340, 'rgba(255,150,120,.07)'],
    ],
  });
  drawMoon(g, 762, 138, 58, T);

  drawHillLayer(g, 0, 400, 16, 0.1, '#1b1130', 1.1);
  drawHillLayer(g, 0, 438, 14, 0.2, '#150d27', 3.2);
  drawPine(g, 40, 470, 150, '#0e091b');
  drawPine(g, 120, 484, 100, '#120c21');
  drawPine(g, 900, 496, 120, '#0d0819');

  drawMeadowGround(g, 486);
  drawLanternPost(g, 150, 486, T);
  drawLanternPost(g, 560, 490, T);

  // она — героиня постера
  drawGirl(g, 742, 500, 1.9, -1, T, { pose: 'idle' });

  // сердечки вокруг
  ctxFloatingHeartsAroundHer();

  drawFireflies(g, T, 20, 240, 470);
  floatingHearts(g, T, 6, { y: 320 });

  // затемнение слева под текст
  const lg = g.createLinearGradient(0, 0, W * 0.62, 0);
  lg.addColorStop(0, 'rgba(5,2,12,.74)');
  lg.addColorStop(0.5, 'rgba(5,2,12,.3)');
  lg.addColorStop(1, 'rgba(5,2,12,0)');
  g.fillStyle = lg;
  g.fillRect(0, 0, W * 0.62, H);

  drawVignette(0.5);
}

function ctxFloatingHeartsAroundHer() {
  const arr = [
    [650, 300, 9, 0.0], [700, 250, 6, 1.2], [800, 320, 7, 2.4],
    [830, 390, 5, 0.7], [660, 400, 5, 1.9], [790, 215, 4, 3.1],
  ];
  for (const [x, y, s, ph] of arr) {
    const yy = y + Math.sin(T * 1.1 + ph) * 9;
    g.globalAlpha = 0.35 + 0.25 * Math.sin(T * 1.3 + ph);
    drawHeart(g, x, yy, s, '#ff9fb4');
  }
  g.globalAlpha = 1;
}

/* ============================================================
   ПОЛЯНА
   ============================================================ */
const meadow = {
  x: 235,
  facing: 1,
  phase: 0,
  moving: false,
  started: false,
  done: false,
  leaveIn: 0,
};

const MEADOW_LINES = [
  { who: 'Люми', text: 'Ой! Алина! Ты всё-таки пришла. Я знала, что ты придёшь.' },
  { who: 'Люми', text: 'Только... не пугайся. Его заперли. В клетке. На вершине Башни Сомнений.' },
  { who: 'Ты', text: 'Кто запер?' },
  { who: 'Люми', text: 'Сомнение. Оно живёт там, где страшно надеяться. Оно говорит, что вас нельзя любить просто так.' },
  { who: 'Ты', text: 'Тогда я его разубежу.' },
  { who: 'Люми', text: 'Вот это я и хотела услышать. Возьми сердечко — оно будет греть тебя в пути.' },
  { who: 'Люми', text: 'Башня на востоке. Прыгай по облакам, собирай сердечки. И не оглядывайся.' },
  { who: 'Ты', text: 'Я иду.' },
];

function initMeadow() {
  meadow.x = 235;
  meadow.facing = 1;
  meadow.phase = 0;
  meadow.moving = false;
  meadow.started = false;
  meadow.done = false;
  meadow.leaveIn = 0;
  dom.touch.classList.remove('hidden');
}

function startNpcDialogue() {
  meadow.facing = 1;
  Dialogue.start(MEADOW_LINES, () => {
    Sound.quest();
    toast('♥ квест получен: спасти его', 2600);
    meadow.done = true;
    meadow.leaveIn = 2.1;
  });
}

function updateMeadow(dt) {
  const canWalk = !Dialogue.active && !meadow.done;
  meadow.moving = false;

  if (canWalk) {
    let dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) {
      meadow.x += dir * 175 * dt;
      meadow.facing = dir;
      meadow.phase += Math.abs(dir) * 9 * dt;
      meadow.moving = true;
    }
    meadow.x = clamp(meadow.x, 170, 508);
  }

  if (!meadow.started && meadow.x > 468 && !Dialogue.active) {
    meadow.started = true;
    startNpcDialogue();
  }

  if (meadow.done) {
    meadow.leaveIn -= dt;
    if (meadow.leaveIn <= 0 && Fade.dir === 0) goTo('platformer');
  }
}

function drawMeadowScene() {
  drawSky(g, T, {
    top: '#060412', mid: '#1a1136', low: '#34204c', bottom: '#4e2a54',
  });
  drawMoon(g, 800, 112, 48, T);

  drawHillLayer(g, 0, 410, 18, 0.1, '#1b1230', 1.4);
  drawHillLayer(g, 0, 442, 12, 0.22, '#150d26', 3.7);
  drawPine(g, 60, 452, 140, '#0f0a1c');
  drawPine(g, 135, 468, 92, '#130d22');
  drawPine(g, 900, 456, 120, '#0e0919');
  drawPine(g, 840, 470, 80, '#120c20');

  drawMeadowGround(g, 448);

  drawLanternPost(g, 560, 448, T);
  drawLanternPost(g, 760, 448, T);

  drawLumi(g, 664, 328, 1.3, T);
  drawLumiSparkles(664, 328, T);

  drawGirl(g, meadow.x, 448, 1.3, meadow.facing, T, {
    pose: meadow.moving ? 'walk' : 'idle',
    phase: meadow.phase,
  });

  drawFireflies(g, T, 18, 250, 430);
  floatingHearts(g, T, 5, { y: 340 });

  if (!meadow.started && !Dialogue.active) {
    const a = 0.55 + 0.35 * Math.sin(T * 2.4);
    g.save();
    g.textAlign = 'center';
    g.font = '600 13px "Trebuchet MS", sans-serif';
    g.fillStyle = `rgba(255,232,214,${a})`;
    g.shadowColor = 'rgba(0,0,0,.8)';
    g.shadowBlur = 8;
    g.fillText('→ подойди к Люми', W / 2, H - 26);
    g.restore();
  }

  drawVignette(0.42);
}

function drawMeadowGround(ctx, y) {
  const grad = ctx.createLinearGradient(0, y, 0, H);
  grad.addColorStop(0, '#22352f');
  grad.addColorStop(0.35, '#1a2929');
  grad.addColorStop(1, '#0d1520');
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, y + 4);
  for (let x = 0; x <= W; x += 18) {
    const yy = y + Math.sin(x * 0.013) * 3 + Math.sin(x * 0.0045 + 1) * 4;
    ctx.lineTo(x, yy);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // кромка травы
  ctx.strokeStyle = 'rgba(130,170,140,.25)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 18) {
    const yy = y + Math.sin(x * 0.013) * 3 + Math.sin(x * 0.0045 + 1) * 4;
    if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
  }
  ctx.stroke();

  // травинки
  ctx.strokeStyle = 'rgba(120,160,130,.35)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 90; i++) {
    const x = (i * 67.3) % W;
    const yy = y + Math.sin(x * 0.013) * 3 + Math.sin(x * 0.0045 + 1) * 4;
    const h = 3 + ((i * 13) % 6);
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.quadraticCurveTo(x + Math.sin(T * 0.8 + i) * 2, yy - h, x + Math.sin(T * 0.8 + i) * 3, yy - h - 2);
    ctx.stroke();
  }

  // цветы
  for (let i = 0; i < 16; i++) {
    const x = 28 + i * 61.5;
    const yy = y + Math.sin(x * 0.013) * 3 + Math.sin(x * 0.0045 + 1) * 4;
    const glow = 0.5 + 0.4 * Math.sin(T * 1.4 + i * 1.3);
    ctx.globalAlpha = 0.55 * glow;
    drawHeart(ctx, x, yy - 6 + Math.sin(T + i) * 1.5, 3.2, i % 3 === 0 ? '#ffd9a8' : '#ffaebc');
    ctx.globalAlpha = 1;
  }
}

function drawLanternPost(ctx, x, baseY, t) {
  ctx.save();
  ctx.strokeStyle = '#241a32';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + 1, baseY - 50, x + 4, baseY - 86);
  ctx.lineTo(x + 26, baseY - 92);
  ctx.stroke();

  const lx = x + 28;
  const ly = baseY - 78 + Math.sin(t * 1.6 + x) * 2;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createRadialGradient(lx, ly, 1, lx, ly, 48);
  gr.addColorStop(0, 'rgba(255,206,130,.4)');
  gr.addColorStop(1, 'rgba(255,170,110,0)');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(lx, ly, 48, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffd08a';
  roundRect(ctx, lx - 7, ly - 10, 14, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#7a5541';
  ctx.fillRect(lx - 5, ly - 13, 10, 3);
  ctx.fillRect(lx - 5, ly + 8, 10, 3);
  ctx.strokeStyle = '#8a6248';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(lx, ly - 13);
  ctx.lineTo(lx, ly - 18);
  ctx.stroke();
  ctx.restore();
}

function drawLumiSparkles(x, y, t) {
  for (let i = 0; i < 5; i++) {
    const a = t * 0.7 + i * 1.9;
    const px = x + Math.cos(a) * (34 + i * 5);
    const py = y + Math.sin(a * 1.3) * (18 + i * 3) - 6;
    g.globalAlpha = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2 + i));
    drawSparkle(g, px, py, 2.2, '#ffe1a8');
  }
  g.globalAlpha = 1;
}

/* ============================================================
   ПЛАТФОРМЕР
   ============================================================ */
const LEVEL = {
  width: 3000,
  groundY: 472,
  platforms: [
    { x: 560, y: 392, w: 170 },
    { x: 830, y: 330, w: 150 },
    { x: 1090, y: 392, w: 170 },
    { x: 1430, y: 378, w: 200 },
    { x: 1710, y: 318, w: 150 },
    { x: 1980, y: 386, w: 190 },
    { x: 2380, y: 408, w: 220 },
    { x: 2620, y: 348, w: 320 },
  ],
  heartSpots: [
    { x: 300, y: 428 }, { x: 645, y: 342 }, { x: 900, y: 280 },
    { x: 1175, y: 342 }, { x: 1530, y: 328 }, { x: 1785, y: 268 },
    { x: 2075, y: 336 },
  ],
  door: { x: 2830, y: 348 },
};

const player = {
  x: 110, y: LEVEL.groundY, vx: 0, vy: 0,
  w: 26, h: 74, onGround: true, facing: 1,
  phase: 0, coyote: 0, jumpBuf: 0,
};
const cam = { x: 0 };
const levelState = {
  hearts: [],
  count: 0,
  done: false,
  hint: 8,
  dustTimer: 0,
};

function initPlatformer() {
  player.x = 110;
  player.y = LEVEL.groundY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.facing = 1;
  player.phase = 0;
  cam.x = 0;
  levelState.hearts = LEVEL.heartSpots.map(h => ({ x: h.x, y: h.y, got: false, ph: Math.random() * TAU }));
  levelState.count = 0;
  levelState.done = false;
  levelState.hint = 8;
  levelState.dustTimer = 0;
  input.jumpQueued = false;
  dom.heartCount.textContent = '0';
  dom.hud.classList.remove('hidden');
  dom.touch.classList.remove('hidden');
}

function updatePlatformer(dt) {
  const p = player;
  const accel = 1900;
  const maxSpd = 270;
  const friction = 2500;
  const gravity = 1750;
  const jumpV = -620;

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);

  if (dir !== 0) {
    p.vx += dir * accel * dt;
    p.facing = dir;
  } else {
    const fr = friction * dt;
    if (Math.abs(p.vx) <= fr) p.vx = 0;
    else p.vx -= Math.sign(p.vx) * fr;
  }
  p.vx = clamp(p.vx, -maxSpd, maxSpd);

  // прыжок с буфером и coyote time
  if (input.jumpQueued) {
    p.jumpBuf = 0.13;
    input.jumpQueued = false;
  } else {
    p.jumpBuf -= dt;
  }
  if (p.onGround) p.coyote = 0.1;
  else p.coyote -= dt;

  if (p.jumpBuf > 0 && p.coyote > 0) {
    p.vy = jumpV;
    p.onGround = false;
    p.coyote = 0;
    p.jumpBuf = 0;
    Sound.tone(380, 0.08, 'sine', 0.022, 540);
    burstSparks(p.x, p.y - 2, 5, 'world', '#b7a6d6', 60);
  }

  if (!input.jump && p.vy < -190) p.vy = Math.max(p.vy, -190);
  p.vy = Math.min(p.vy + gravity * dt, 1250);

  p.x = clamp(p.x + p.vx * dt, 40, LEVEL.width - 40);

  const prevY = p.y;
  p.y += p.vy * dt;
  const wasOnGround = p.onGround;
  const fallSpeed = p.vy;
  p.onGround = false;

  if (p.y >= LEVEL.groundY) {
    p.y = LEVEL.groundY;
    p.vy = 0;
    p.onGround = true;
  }

  if (p.vy >= 0) {
    for (const pl of LEVEL.platforms) {
      if (p.x + 14 > pl.x && p.x - 14 < pl.x + pl.w) {
        if (prevY <= pl.y + 1 && p.y >= pl.y) {
          p.y = pl.y;
          p.vy = 0;
          p.onGround = true;
          break;
        }
      }
    }
  }

  if (!wasOnGround && p.onGround && fallSpeed > 260) {
    Sound.tone(180, 0.09, 'sine', 0.03, 120);
    burstSparks(p.x, p.y - 2, 7, 'world', '#9d8bbf', 90);
  }

  if (p.onGround && Math.abs(p.vx) > 40) {
    p.phase += Math.abs(p.vx) * dt * 0.06;
    levelState.dustTimer -= dt;
    if (levelState.dustTimer <= 0) {
      levelState.dustTimer = 0.18;
      makeParticle({
        x: p.x - p.facing * 8, y: p.y - 2,
        vx: -p.facing * rand(10, 30), vy: rand(-25, -6),
        life: rand(0.25, 0.5), size: rand(1.4, 2.6), type: 'dust',
        color: 'rgba(170,150,200,.55)', grav: 40, drag: 2, space: 'world',
      });
    }
  }

  // сердечки
  for (const h of levelState.hearts) {
    if (h.got) continue;
    if (dist(p.x, p.y - 46, h.x, h.y) < 48) {
      h.got = true;
      levelState.count++;
      dom.heartCount.textContent = String(levelState.count);
      Sound.chime();
      burstHearts(h.x, h.y, 7, 'world', 130);
      burstSparks(h.x, h.y, 8, 'world', '#ffd9a8', 110);
      if (levelState.count === LEVEL.heartSpots.length) {
        toast('♥ все сердечки собраны', 2200);
        Sound.win();
      }
    }
  }

  // дверь
  const d = LEVEL.door;
  if (!levelState.done && Math.abs(p.x - d.x) < 58 && Math.abs(p.y - d.y) < 120) {
    levelState.done = true;
    burstHearts(d.x, d.y - 50, 16, 'screen', 220);
    burstSparks(d.x, d.y - 50, 18, 'screen', '#ffe3b0', 220);
    Sound.quest();
    goTo('boss');
  }

  // камера
  const target = clamp(p.x - view.w * 0.45, 0, LEVEL.width - view.w);
  cam.x = lerp(cam.x, target, 1 - Math.pow(0.0006, dt));

  levelState.hint = Math.max(0, levelState.hint - dt);
}

function drawPlatformer() {
  drawSky(g, T, {
    top: '#05030f', mid: '#131031', low: '#291a44', bottom: '#42264e',
  });
  drawMoon(g, 240, 108, 46, T);

  drawHillLayer(g, cam.x, 398, 26, 0.12, '#120c25', 0.9);
  drawHillLayer(g, cam.x, 436, 18, 0.26, '#0f0a1f', 2.8);

  // дальние ёлки (параллакс)
  const px1 = 180 - cam.x * 0.35;
  const px2 = 960 - cam.x * 0.3;
  if (px1 > -100 && px1 < W + 100) drawPine(g, px1, 440, 130, '#0c0818');
  if (px2 > -100 && px2 < W + 100) drawPine(g, px2, 448, 150, '#0c0818');

  g.save();
  g.translate(-cam.x, 0);

  drawTowerWorld();
  drawGroundWorld();
  for (const pl of LEVEL.platforms) drawPlatformWorld(pl);
  drawDoorWorld();
  for (const h of levelState.hearts) if (!h.got) drawHeartPickup(h);

  // героиня
  const p = player;
  g.save();
  g.globalAlpha = 0.3;
  g.fillStyle = '#05030d';
  g.beginPath();
  g.ellipse(p.x, p.y + 2, 22, 5.5, 0, 0, TAU);
  g.fill();
  g.restore();

  const pose = !p.onGround ? 'jump' : (Math.abs(p.vx) > 30 ? 'walk' : 'idle');
  drawGirl(g, p.x, p.y, 0.95, p.facing, T, { pose, phase: p.phase });

  g.restore();

  drawParticles(g, 'world', cam.x);
  drawParticles(g, 'screen', 0);

  drawPlatformHint();
  drawVignette(0.46, view.portrait ? view.w / 2 : W / 2);
}

function drawPlatformHint() {
  const a = clamp(levelState.hint / 2.2, 0, 1);
  if (a <= 0) return;
  g.save();
  g.globalAlpha = a;
  g.textAlign = 'center';
  g.font = '600 12px "Trebuchet MS", sans-serif';
  g.fillStyle = 'rgba(255,236,222,.8)';
  g.shadowColor = 'rgba(0,0,0,.85)';
  g.shadowBlur = 10;
  const hintX = view.portrait ? view.w / 2 : W / 2;
  g.fillText(view.portrait ? 'собирай сердечки ♥  ·  прыгай выше' : '← →  идти        ↑  прыгать        собери сердечки', hintX, H - 30);
  g.restore();
}

/* ---------- мир платформера ---------- */

function drawGroundWorld() {
  const y = LEVEL.groundY;
  const grad = g.createLinearGradient(0, y, 0, H);
  grad.addColorStop(0, '#25362f');
  grad.addColorStop(0.3, '#1a2a29');
  grad.addColorStop(1, '#0b131c');
  g.fillStyle = grad;
  g.fillRect(-200, y, LEVEL.width + 400, H - y);

  // кромка
  g.strokeStyle = 'rgba(140,180,150,.28)';
  g.lineWidth = 1.8;
  g.beginPath();
  for (let x = -200; x <= LEVEL.width + 200; x += 24) {
    const yy = y + Math.sin(x * 0.015) * 2.5;
    if (x === -200) g.moveTo(x, yy); else g.lineTo(x, yy);
  }
  g.stroke();

  // травинки и цветы
  for (let i = 0; i < 130; i++) {
    const x = i * 26 + ((i * 37) % 13);
    if (x > LEVEL.width + 200) break;
    const yy = y + Math.sin(x * 0.015) * 2.5;
    g.strokeStyle = 'rgba(120,165,135,.32)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, yy);
    g.quadraticCurveTo(x + Math.sin(T * 0.9 + i) * 2, yy - 5, x + Math.sin(T * 0.9 + i) * 3, yy - 8);
    g.stroke();
  }
  for (let i = 0; i < 26; i++) {
    const x = 60 + i * 112;
    const yy = y + Math.sin(x * 0.015) * 2.5;
    g.globalAlpha = 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(T * 1.5 + i));
    drawHeart(g, x, yy - 8 + Math.sin(T + i) * 1.4, 2.8, i % 4 === 0 ? '#ffe0b0' : '#ffadc0');
    g.globalAlpha = 1;
  }
}

function drawPlatformWorld(pl) {
  const { x, w, y } = pl;

  // тень
  g.fillStyle = 'rgba(5,3,12,.3)';
  g.beginPath();
  g.ellipse(x + w / 2, y + 34, w * 0.5, 9, 0, 0, TAU);
  g.fill();

  // тело платформы
  const grad = g.createLinearGradient(0, y, 0, y + 28);
  grad.addColorStop(0, '#4d4266');
  grad.addColorStop(0.5, '#3a3152');
  grad.addColorStop(1, '#241c37');
  g.fillStyle = grad;
  roundRect(g, x, y, w, 26, 10);
  g.fill();

  // трава сверху
  g.fillStyle = '#4e6b58';
  roundRect(g, x - 2, y - 5, w + 4, 11, 6);
  g.fill();
  g.fillStyle = 'rgba(160,205,165,.22)';
  roundRect(g, x - 2, y - 5, w + 4, 4, 3);
  g.fill();

  // свисающие травинки
  g.strokeStyle = 'rgba(110,155,120,.4)';
  g.lineWidth = 1.3;
  for (let i = 0; i < Math.floor(w / 34); i++) {
    const xx = x + 16 + i * 34;
    g.beginPath();
    g.moveTo(xx, y + 5);
    g.quadraticCurveTo(xx + 2, y + 16, xx - 1 + Math.sin(T + i) * 2, y + 24);
    g.stroke();
  }

  // камешки
  g.fillStyle = 'rgba(255,255,255,.07)';
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.arc(x + 20 + ((i * 41) % Math.max(20, w - 40)), y + 12 + (i % 2) * 5, 2.2, 0, TAU);
    g.fill();
  }
}

function drawTowerWorld() {
  const tx = 2750;
  const base = LEVEL.groundY;
  const top = 40;

  // силуэт башни
  g.fillStyle = '#1b1230';
  g.fillRect(tx, top + 70, 170, base - top - 70);
  g.beginPath();
  g.moveTo(tx - 14, top + 74);
  g.lineTo(tx + 85, top - 6);
  g.lineTo(tx + 184, top + 74);
  g.closePath();
  g.fill();
  // зубцы
  for (let i = 0; i < 5; i++) {
    g.fillRect(tx + i * 34, top + 60, 18, 18);
  }
  // окно
  const wx = tx + 85;
  const wy = top + 126;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const wg = g.createRadialGradient(wx, wy, 2, wx, wy, 50);
  wg.addColorStop(0, 'rgba(255,206,140,.45)');
  wg.addColorStop(1, 'rgba(255,170,110,0)');
  g.fillStyle = wg;
  g.beginPath();
  g.arc(wx, wy, 50, 0, TAU);
  g.fill();
  g.restore();
  g.fillStyle = '#ffd58c';
  g.beginPath();
  g.arc(wx, wy, 9, 0, TAU);
  g.fill();
  g.strokeStyle = '#2a1c3c';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(wx - 9, wy); g.lineTo(wx + 9, wy);
  g.moveTo(wx, wy - 9); g.lineTo(wx, wy + 9);
  g.stroke();

  // тонкая дымка вокруг
  g.fillStyle = 'rgba(90,60,140,.08)';
  g.beginPath();
  g.ellipse(tx + 85, top + 170, 130, 60, 0, 0, TAU);
  g.fill();
}

function drawDoorWorld() {
  const { x, y } = LEVEL.door;
  const w = 72;
  const h = 116;

  // луч
  g.save();
  g.globalCompositeOperation = 'lighter';
  const beam = g.createLinearGradient(0, y - h - 160, 0, y);
  beam.addColorStop(0, 'rgba(255,200,140,0)');
  beam.addColorStop(1, 'rgba(255,200,140,.14)');
  g.fillStyle = beam;
  g.beginPath();
  g.moveTo(x - 22, y - h - 160);
  g.lineTo(x + 22, y - h - 160);
  g.lineTo(x + 52, y);
  g.lineTo(x - 52, y);
  g.closePath();
  g.fill();
  g.restore();

  // свечение арки
  g.save();
  g.globalCompositeOperation = 'lighter';
  const glow = g.createRadialGradient(x, y - h / 2, 6, x, y - h / 2, 120);
  glow.addColorStop(0, 'rgba(255,214,150,.42)');
  glow.addColorStop(1, 'rgba(255,170,120,0)');
  g.fillStyle = glow;
  g.beginPath();
  g.arc(x, y - h / 2, 120, 0, TAU);
  g.fill();
  g.restore();

  // камни
  g.fillStyle = '#382c4c';
  g.beginPath();
  g.moveTo(x - w / 2 - 10, y);
  g.lineTo(x - w / 2 - 10, y - h * 0.55);
  g.quadraticCurveTo(x - w / 2 - 10, y - h - 16, x, y - h - 16);
  g.quadraticCurveTo(x + w / 2 + 10, y - h - 16, x + w / 2 + 10, y - h * 0.55);
  g.lineTo(x + w / 2 + 10, y);
  g.closePath();
  g.fill();

  // светящийся проём
  const dg = g.createLinearGradient(0, y - h, 0, y);
  dg.addColorStop(0, '#ffe9c0');
  dg.addColorStop(0.6, '#ffc98a');
  dg.addColorStop(1, '#e89a74');
  g.fillStyle = dg;
  g.beginPath();
  g.moveTo(x - w / 2, y);
  g.lineTo(x - w / 2, y - h * 0.55);
  g.quadraticCurveTo(x - w / 2, y - h, x, y - h);
  g.quadraticCurveTo(x + w / 2, y - h, x + w / 2, y - h * 0.55);
  g.lineTo(x + w / 2, y);
  g.closePath();
  g.fill();

  // сердечко над аркой
  const bob = Math.sin(T * 1.8) * 5;
  g.save();
  g.globalAlpha = 0.9;
  g.shadowColor = '#ff8fae';
  g.shadowBlur = 18;
  drawHeart(g, x, y - h - 34 + bob, 9, '#ffb3c4');
  g.restore();

  // искры
  for (let i = 0; i < 5; i++) {
    const a = (T * 0.6 + i * 1.4) % TAU;
    g.globalAlpha = 0.3 + 0.3 * Math.sin(T * 2 + i);
    drawSparkle(g, x + Math.cos(a) * 26, y - 60 + Math.sin(a * 1.7) * 26, 2.4, '#ffe3b4');
  }
  g.globalAlpha = 1;
}

function drawHeartPickup(h) {
  const yy = h.y + Math.sin(T * 1.8 + h.ph) * 6;
  const pulse = 0.85 + 0.15 * Math.sin(T * 3 + h.ph);
  g.save();
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(h.x, yy, 2, h.x, yy, 28);
  gr.addColorStop(0, 'rgba(255,130,170,.38)');
  gr.addColorStop(1, 'rgba(255,110,160,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(h.x, yy, 28, 0, TAU);
  g.fill();
  g.restore();

  g.save();
  g.translate(h.x, yy);
  g.scale(pulse, pulse);
  drawHeart(g, 0, 0, 10, '#ff8fa9');
  g.globalAlpha = 0.55;
  drawHeart(g, 0, 0, 5, '#ffe3e9');
  g.restore();

  g.globalAlpha = 0.5 + 0.4 * Math.sin(T * 2.5 + h.ph);
  drawSparkle(g, h.x + 10, yy - 12, 2.2, '#ffe9c0');
  g.globalAlpha = 1;
}

/* ---------- общее ---------- */
function drawVignette(a, cx) {
  if (cx == null) cx = W / 2;
  const vg = g.createRadialGradient(cx, H * 0.46, H * 0.36, cx, H * 0.52, H * 1.02);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(4,2,10,${a})`);
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);
}
