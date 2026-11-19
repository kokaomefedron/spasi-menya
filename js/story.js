/* ============================================================
   story.js — бой с Сомнением, клетка, финал
   ============================================================ */

/* ============================================================
   БОСС
   ============================================================ */
const BOSS_X = 690;
const BOSS_CY = 300;
const HER_X = 268;
const ARENA_GROUND = 440;

const boss = {
  hp: 6,
  maxHp: 6,
  herHp: 5,
  maxHerHp: 5,
  phase: 'idle',
  t: 0,
  shake: 0,
  bossFlash: 0,
  herFlash: 0,
  squish: 1,
  playerHits: 0,
  bossHits: 0,
  hitDone: false,
  revived: false,
  talked: false,
  win: 0,
};

const HER_LINES = [
  'Я иду к тебе. Слышишь?',
  'Страх — это просто погода. А я иду.',
  'Он ждёт меня. Этого достаточно.',
  'Ты не отнимешь то, что я чувствую.',
  'Я не одна. Он со мной, даже здесь.',
  'Хватит. Я его люблю.',
];

const BOSS_LINES = [
  'А вдруг ты ему надоешь?',
  'Все уходят. Это закон.',
  'Любовь — просто привычка.',
  'Он не ждёт. Он спит.',
  'Ты не дойдёшь.',
  '...почему ты ещё улыбаешься?',
];

const HER_REPLIES = [
  'Не надоест. Он сам так сказал.',
  'Мы — исключение.',
  'Тогда почему мне так тепло?',
  'Тогда я разбужу.',
  'Уже почти дошла.',
  'Потому что он — мой дом.',
];

const BOSS_INTRO = [
  { who: 'Сомнение', text: 'Стой. Дальше — только я.' },
  { who: 'Ты', text: 'Тогда я пройду через тебя.' },
  { who: 'Сомнение', text: 'Все проходят. Никто не возвращается с тем, кого любит.' },
  { who: 'Ты', text: 'Проверим.' },
];

function setBossLog(text) {
  dom.bossLog.textContent = text || '';
  dom.bossLog.classList.remove('show');
  if (!text) return;
  void dom.bossLog.offsetWidth;
  dom.bossLog.classList.add('show');
}

function updateBossUI(pop) {
  dom.bossBar.style.width = (boss.hp / boss.maxHp * 100) + '%';
  const parts = [];
  for (let i = 0; i < boss.maxHerHp; i++) {
    const on = i < boss.herHp;
    parts.push(`<span class="${on ? 'on' : ''}${on && pop ? ' pop' : ''}">♥</span>`);
  }
  dom.herHearts.innerHTML = parts.join('');
}

function initBoss() {
  boss.hp = boss.maxHp;
  boss.herHp = boss.maxHerHp;
  boss.phase = 'intro';
  boss.t = 0;
  boss.shake = 0;
  boss.bossFlash = 0;
  boss.herFlash = 0;
  boss.squish = 1;
  boss.playerHits = 0;
  boss.bossHits = 0;
  boss.hitDone = false;
  boss.revived = false;
  boss.talked = false;
  boss.win = 0;

  updateBossUI();
  setBossLog('');
  dom.bossUI.classList.remove('hidden');
  dom.touch.classList.add('hidden');
  dom.attackBtn.disabled = true;

  Dialogue.start(BOSS_INTRO, () => {
    boss.phase = 'player';
    boss.t = 0;
    dom.attackBtn.disabled = false;
    setBossLog('Твой ход. Ударь его тем, что сильнее страха.');
  });
}

dom.attackBtn.addEventListener('click', () => {
  if (scene !== 'boss' || boss.phase !== 'player') return;
  boss.phase = 'herAttack';
  boss.t = 0;
  boss.hitDone = false;
  dom.attackBtn.disabled = true;
  Sound.cast();
  setBossLog('Ты: ' + HER_LINES[Math.min(boss.playerHits, HER_LINES.length - 1)]);
});

function startBossWin() {
  boss.phase = 'win';
  boss.t = 0;
  boss.win = 0;
  boss.hp = 0;
  updateBossUI();
  dom.attackBtn.disabled = true;
  setBossLog('Сомнение: ...');
  Sound.win();
  burstHearts(BOSS_X, BOSS_CY, 24, 'screen', 320);
  burstSparks(BOSS_X, BOSS_CY, 30, 'screen', '#d9b3ff', 340);
  boss.shake = 14;
}

function updateBossScene(dt) {
  boss.t += dt;

  boss.shake = Math.max(0, boss.shake - dt * 42);
  boss.bossFlash = Math.max(0, boss.bossFlash - dt * 2.4);
  boss.herFlash = Math.max(0, boss.herFlash - dt * 2.2);
  boss.squish = lerp(boss.squish, 1, 1 - Math.pow(0.002, dt));

  if (boss.phase === 'herAttack') {
    if (boss.t >= 0.78 && !boss.hitDone) {
      boss.hitDone = true;
      boss.hp = Math.max(0, boss.hp - 1);
      boss.bossFlash = 1;
      boss.shake = 12;
      boss.squish = 1.22;
      Sound.hit();
      burstHearts(BOSS_X - 16, BOSS_CY + 6, 9, 'screen', 210);
      burstSparks(BOSS_X - 16, BOSS_CY + 6, 14, 'screen', '#ffc4dd', 240);
      updateBossUI();
      if (boss.hp > 0) {
        setBossLog('Ты: ' + HER_LINES[Math.min(boss.playerHits + 1, HER_LINES.length - 1)]);
      }
      boss.playerHits++;
    }
    if (boss.t >= 1.5) {
      if (boss.hp <= 0) {
        startBossWin();
      } else {
        boss.phase = 'bossAttack';
        boss.t = 0;
        boss.hitDone = false;
        setBossLog('Сомнение: ' + BOSS_LINES[Math.min(boss.bossHits, BOSS_LINES.length - 1)]);
      }
    }
  } else if (boss.phase === 'bossAttack') {
    if (boss.t >= 1.0 && !boss.hitDone) {
      boss.hitDone = true;
      boss.herHp -= 1;
      boss.herFlash = 1;
      boss.shake = 10;
      Sound.hurt();
      if (boss.herHp <= 0) {
        boss.herHp = 3;
        boss.revived = true;
        updateBossUI(true);
        setBossLog('Ты: ...я вспомнила его голос. И сердце снова горит.');
        Sound.revive();
        burstHearts(HER_X, 350, 14, 'screen', 190);
        burstSparks(HER_X, 350, 18, 'screen', '#ffb3c4', 200);
      } else {
        updateBossUI();
        setBossLog('Ты: ' + HER_REPLIES[Math.min(boss.bossHits, HER_REPLIES.length - 1)]);
      }
      boss.bossHits++;
    }
    if (boss.t >= 1.75) {
      boss.phase = 'player';
      boss.t = 0;
      dom.attackBtn.disabled = false;
    }
  } else if (boss.phase === 'win') {
    boss.win = clamp((boss.t - 0.1) / 1.5, 0, 1);
    if (boss.t > 0.5 && Math.random() < 0.25) {
      burstHearts(BOSS_X + rand(-60, 60), BOSS_CY + rand(-40, 40), 2, 'screen', 130);
    }
    if (boss.t >= 1.6 && !boss.talked) {
      boss.talked = true;
      boss.phase = 'gone';
      Dialogue.start([
        { who: 'Сомнение', text: '...ладно. Ладно.' },
        { who: 'Сомнение', text: 'Он правда ждёт. Я проверяло.' },
        { who: 'Сомнение', text: 'Иди. И будьте счастливы. Это... тоже вариант.' },
      ], () => goTo('cage'));
    }
  }
}

function drawBossScene() {
  const shake = boss.shake;
  g.save();
  if (shake > 0.5) g.translate(rand(-shake, shake) * 0.45, rand(-shake, shake) * 0.45);

  drawBossArena();

  const herPose = boss.phase === 'herAttack' && boss.t > 0.15 && boss.t < 0.9 ? 'cast' : 'idle';
  const herLunge = boss.phase === 'herAttack' ? Math.sin(clamp(boss.t / 0.6, 0, 1) * Math.PI) * 10 : 0;
  const herX = HER_X + herLunge;

  // наша героиня
  drawGirl(g, herX, ARENA_GROUND, 1.22, 1, T, { pose: herPose });

  // её вспышка от удара
  if (boss.herFlash > 0) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(herX, 360, 4, herX, 360, 90);
    gr.addColorStop(0, `rgba(255,120,150,${0.45 * boss.herFlash})`);
    gr.addColorStop(1, 'rgba(255,80,120,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(herX, 360, 90, 0, TAU);
    g.fill();
    g.restore();
  }

  // тень босса
  g.save();
  g.globalAlpha = 0.32;
  g.fillStyle = '#05030c';
  g.beginPath();
  g.ellipse(BOSS_X, ARENA_GROUND + 2, 90, 18, 0, 0, TAU);
  g.fill();
  g.restore();

  // сам босс
  if (boss.phase !== 'gone') {
    const shrink = boss.phase === 'win' ? 1 - easeInOut(boss.win) * 0.9 : 1;
    const alpha = boss.phase === 'win' ? 1 - easeInOut(boss.win) * 0.8 : 1;
    const lunge = boss.phase === 'bossAttack' ? -Math.sin(clamp(boss.t / 0.9, 0, 1) * Math.PI) * 26 : 0;
    g.save();
    g.globalAlpha = alpha;
    drawBoss(g, BOSS_X + lunge, BOSS_CY, 1.08 * shrink, T, boss.hp / boss.maxHp, boss.bossFlash, { squish: boss.squish });
    g.restore();
  }

  // снаряд-сердечко
  if (boss.phase === 'herAttack') {
    const p = clamp((boss.t - 0.3) / 0.48, 0, 1);
    if (boss.t > 0.3 && p < 1) {
      const hx = lerp(herX + 40, BOSS_X - 30, p);
      const hy = lerp(345, BOSS_CY + 4, p) - Math.sin(p * Math.PI) * 70;
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        g.globalAlpha = 0.25 - i * 0.07;
        drawHeart(g, hx - p * 18 * (i + 1), hy + 6 * i, 12 - i * 2, '#ff8fae');
      }
      g.globalAlpha = 1;
      g.shadowColor = '#ff6f9c';
      g.shadowBlur = 24;
      drawHeart(g, hx, hy, 16, '#ffb3c8');
      g.restore();
    }
  }

  // тёмный снаряд босса
  if (boss.phase === 'bossAttack') {
    const p = clamp((boss.t - 0.35) / 0.5, 0, 1);
    if (boss.t > 0.35 && p < 1) {
      const bx = lerp(BOSS_X - 50, herX + 18, p);
      const by = lerp(BOSS_CY + 10, 355, p) - Math.sin(p * Math.PI) * 30;
      g.save();
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(bx, by, 2, bx, by, 30);
      gr.addColorStop(0, 'rgba(200,140,255,.9)');
      gr.addColorStop(1, 'rgba(120,60,220,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(bx, by, 30, 0, TAU);
      g.fill();
      g.restore();
      g.fillStyle = '#d9b3ff';
      g.beginPath();
      g.arc(bx, by, 5, 0, TAU);
      g.fill();
    }
  }

  g.restore();

  drawParticles(g, 'screen', 0);
  drawVignette(0.55);
}

function drawBossArena() {
  drawSky(g, T, {
    top: '#070413', mid: '#160d2e', low: '#2a1244', bottom: '#3b1947',
    nebulas: [
      [700, 260, 320, 'rgba(150,80,255,.16)'],
      [180, 180, 260, 'rgba(255,90,150,.06)'],
      [400, 460, 300, 'rgba(120,60,200,.10)'],
    ],
  });

  // портал за боссом
  g.save();
  g.globalCompositeOperation = 'lighter';
  const pg = g.createRadialGradient(BOSS_X, BOSS_CY, 10, BOSS_X, BOSS_CY, 220);
  pg.addColorStop(0, 'rgba(170,110,255,.22)');
  pg.addColorStop(0.5, 'rgba(120,60,210,.08)');
  pg.addColorStop(1, 'rgba(90,40,180,0)');
  g.fillStyle = pg;
  g.beginPath();
  g.arc(BOSS_X, BOSS_CY, 220, 0, TAU);
  g.fill();
  g.restore();

  // дальние арки
  for (const ax of [110, 830]) {
    g.fillStyle = '#170e2a';
    g.beginPath();
    g.moveTo(ax - 46, ARENA_GROUND);
    g.lineTo(ax - 46, 250);
    g.quadraticCurveTo(ax - 46, 178, ax, 178);
    g.quadraticCurveTo(ax + 46, 178, ax + 46, 250);
    g.lineTo(ax + 46, ARENA_GROUND);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(150,110,220,.12)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(ax - 46, 250);
    g.quadraticCurveTo(ax - 46, 178, ax, 178);
    g.quadraticCurveTo(ax + 46, 178, ax + 46, 250);
    g.stroke();
  }

  // пол
  const floor = g.createLinearGradient(0, ARENA_GROUND, 0, H);
  floor.addColorStop(0, '#2a1b3d');
  floor.addColorStop(0.35, '#1c1230');
  floor.addColorStop(1, '#0c0717');
  g.fillStyle = floor;
  g.fillRect(0, ARENA_GROUND, W, H - ARENA_GROUND);

  g.strokeStyle = 'rgba(160,120,230,.1)';
  g.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    const yy = ARENA_GROUND + 30 + i * 34;
    g.beginPath();
    g.moveTo(0, yy);
    g.bezierCurveTo(W * 0.3, yy + 8, W * 0.6, yy - 6, W, yy + 3);
    g.stroke();
  }

  // светящиеся трещины
  g.save();
  g.globalCompositeOperation = 'lighter';
  const cracks = [
    [180, 480, 260, 500, 300, 470, 370, 505],
    [620, 500, 690, 478, 760, 512, 830, 488],
  ];
  for (const c of cracks) {
    g.strokeStyle = 'rgba(180,120,255,.22)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(c[0], c[1]);
    g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
    g.stroke();
  }
  g.restore();

  // угольки
  for (let i = 0; i < 14; i++) {
    const x = ((i * 173.7 + T * (8 + i)) % W);
    const y = ARENA_GROUND - ((i * 79 + T * 26) % 260);
    g.globalAlpha = 0.18 + 0.25 * (0.5 + 0.5 * Math.sin(T * 2 + i));
    g.fillStyle = i % 3 === 0 ? '#ff9fb4' : '#b98cff';
    g.beginPath();
    g.arc(x, y, 1.6, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;

  drawFireflies(g, T, 10, 250, 430);
}

/* ============================================================
   КЛЕТКА
   ============================================================ */
const cage = {
  phase: 'enter',
  t: 0,
  girlX: 90,
  boyX: 650,
  open: 0,
  heartTimer: 0,
  ended: false,
};

const CAGE_LINES = [
  { who: 'Он', text: '...Это правда ты?' },
  { who: 'Ты', text: 'Я же обещала.' },
  { who: 'Он', text: 'Я слышал тебя. Всё это время. Даже когда сомневался.' },
  { who: 'Ты', text: 'Тогда выходи. Нас ждёт целая жизнь.' },
  { who: 'Он', text: 'Иди сюда.' },
];

function initCage() {
  cage.phase = 'enter';
  cage.t = 0;
  cage.girlX = 80;
  cage.boyX = 650;
  cage.open = 0;
  cage.heartTimer = 0;
  cage.ended = false;
  setBossLog('');
}

function updateCage(dt) {
  cage.t += dt;

  if (cage.phase === 'enter') {
    cage.girlX = lerp(cage.girlX, 338, 1 - Math.pow(0.02, dt));
    if (cage.t > 2.1) {
      cage.phase = 'talk';
      Dialogue.start(CAGE_LINES, () => {
        cage.phase = 'open';
        cage.t = 0;
        Sound.chime();
        burstSparks(650, 360, 18, 'screen', '#ffe0a8', 160);
      });
    }
  } else if (cage.phase === 'open') {
    cage.open = clamp(cage.t / 1.0, 0, 1);
    const w = clamp((cage.t - 0.2) / 1.3, 0, 1);
    cage.boyX = lerp(650, 494, easeInOut(w));
    cage.girlX = lerp(338, 458, easeInOut(clamp(cage.t / 1.2, 0, 1)));
    if (cage.t > 1.6) {
      cage.phase = 'hug';
      cage.t = 0;
      cage.open = 1;
      Sound.revive();
      burstHearts(478, 380, 20, 'screen', 220);
    }
  } else if (cage.phase === 'hug') {
    cage.girlX = 458;
    cage.boyX = 494;
    cage.heartTimer -= dt;
    if (cage.heartTimer <= 0) {
      cage.heartTimer = 0.32;
      makeParticle({
        x: 478 + rand(-40, 40), y: 400 + rand(-30, 20),
        vx: rand(-18, 18), vy: rand(-70, -32),
        life: rand(1.2, 2.2), size: rand(7, 14), type: 'heart',
        color: pick(['#ff8fa9', '#ffb3c0', '#ffd0c4']),
        rot: rand(-0.4, 0.4), vr: rand(-1.4, 1.4), grav: rand(-16, -4), drag: 0.5,
      });
    }
    if (cage.t > 3.1 && !cage.ended) {
      cage.ended = true;
      goTo('ending');
    }
  }
}

function drawCageScene() {
  // стены
  const wall = g.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, '#1d1430');
  wall.addColorStop(0.6, '#161024');
  wall.addColorStop(1, '#0d0917');
  g.fillStyle = wall;
  g.fillRect(0, 0, W, H);

  // кладка
  g.strokeStyle = 'rgba(255,255,255,.035)';
  g.lineWidth = 1.2;
  for (let y = 40; y < 470; y += 46) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
    const off = ((y / 46) % 2) * 60;
    for (let x = off; x < W; x += 120) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 46);
      g.stroke();
    }
  }

  drawWindow();
  drawSconce(120, 250);
  drawSconce(858, 220);

  // пол
  const floor = g.createLinearGradient(0, 470, 0, H);
  floor.addColorStop(0, '#241a33');
  floor.addColorStop(0.4, '#1a1226');
  floor.addColorStop(1, '#0b0712');
  g.fillStyle = floor;
  g.fillRect(0, 470, W, H - 470);
  g.strokeStyle = 'rgba(255,220,180,.05)';
  g.lineWidth = 1;
  for (let x = 0; x < W; x += 80) {
    g.beginPath();
    g.moveTo(x, 470);
    g.lineTo(x - 40, H);
    g.stroke();
  }

  // лунный свет из окна
  g.save();
  g.globalCompositeOperation = 'lighter';
  const beam = g.createLinearGradient(240, 200, 420, 480);
  beam.addColorStop(0, 'rgba(180,190,255,.10)');
  beam.addColorStop(1, 'rgba(150,160,240,0)');
  g.fillStyle = beam;
  g.beginPath();
  g.moveTo(150, 190);
  g.lineTo(350, 190);
  g.lineTo(520, 470);
  g.lineTo(250, 470);
  g.closePath();
  g.fill();
  g.restore();

  // пылинки
  for (let i = 0; i < 16; i++) {
    const x = 180 + ((i * 97 + T * 6) % 460);
    const y = 150 + ((i * 61 + T * 10) % 300);
    g.globalAlpha = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(T * 1.6 + i));
    g.fillStyle = '#dfe4ff';
    g.beginPath();
    g.arc(x, y, 1.2, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;

  // клетка: задняя часть
  drawCageBack(g, 650, 470, T);

  // он
  if (cage.phase !== 'hug') {
    const by = cage.phase === 'open' ? 470 : 464;
    drawBoy(g, cage.boyX, by, 1.0, -1, T, { pose: cage.phase === 'open' ? 'walk' : 'idle', phase: T * 6 });
  }

  // клетка: передние прутья
  drawCageFront(g, 650, 470, cage.open, T);

  // она
  const walking = cage.phase === 'enter' || cage.phase === 'open';
  drawGirl(g, cage.girlX, 470, 1.05, 1, T, {
    pose: cage.phase === 'hug' ? 'hug' : (walking ? 'walk' : 'idle'),
    phase: T * 7,
  });

  // он в объятиях — поверх неё, лицом к ней
  if (cage.phase === 'hug') {
    drawBoy(g, cage.boyX, 470, 1.0, -1, T, { pose: 'hug' });
    drawGirl(g, cage.girlX, 470, 1.05, 1, T, { pose: 'hug' });
    g.save();
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(476, 380, 6, 476, 380, 110);
    gr.addColorStop(0, 'rgba(255,150,180,.22)');
    gr.addColorStop(1, 'rgba(255,120,160,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(476, 380, 110, 0, TAU);
    g.fill();
    g.restore();
  }

  // тёплые искры
  for (let i = 0; i < 8; i++) {
    const x = 400 + ((i * 113 + T * 12) % 220);
    const y = 320 + Math.sin(T * 0.9 + i) * 24 - ((T * 9 + i * 40) % 80);
    g.globalAlpha = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(T * 2 + i));
    drawSparkle(g, x, y, 2, '#ffe0b0');
  }
  g.globalAlpha = 1;

  drawParticles(g, 'screen', 0);
  drawVignette(0.5);
}

function drawWindow() {
  const cx = 250;
  const top = 62;
  const w = 230;
  const bottom = 400;

  g.save();
  g.beginPath();
  g.moveTo(cx - w / 2, bottom);
  g.lineTo(cx - w / 2, top + 90);
  g.quadraticCurveTo(cx - w / 2, top, cx, top);
  g.quadraticCurveTo(cx + w / 2, top, cx + w / 2, top + 90);
  g.lineTo(cx + w / 2, bottom);
  g.closePath();
  g.clip();

  const sky = g.createLinearGradient(0, top, 0, bottom);
  sky.addColorStop(0, '#08051a');
  sky.addColorStop(0.6, '#1a1440');
  sky.addColorStop(1, '#2a2050');
  g.fillStyle = sky;
  g.fillRect(cx - w / 2, top, w, bottom - top);

  for (let i = 0; i < 22; i++) {
    const x = cx - w / 2 + ((i * 41.3) % w);
    const y = top + 20 + ((i * 53.7) % 240);
    g.globalAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(T * 1.3 + i));
    g.fillStyle = '#e7e2ff';
    g.beginPath();
    g.arc(x, y, 1.1, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;

  drawMoon(g, cx + 42, top + 86, 32, T);

  // далёкие холмы
  g.fillStyle = '#10102a';
  g.beginPath();
  g.moveTo(cx - w / 2, bottom);
  for (let x = 0; x <= w; x += 12) {
    const y = bottom - 42 - Math.sin((x + cx) * 0.03) * 18 - Math.sin((x + cx) * 0.011) * 12;
    g.lineTo(cx - w / 2 + x, y);
  }
  g.lineTo(cx + w / 2, bottom);
  g.closePath();
  g.fill();

  g.restore();

  // рама
  g.strokeStyle = '#3a2b4e';
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(cx - w / 2, bottom);
  g.lineTo(cx - w / 2, top + 90);
  g.quadraticCurveTo(cx - w / 2, top, cx, top);
  g.quadraticCurveTo(cx + w / 2, top, cx + w / 2, top + 90);
  g.lineTo(cx + w / 2, bottom);
  g.stroke();

  g.strokeStyle = 'rgba(255,220,180,.14)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx - w / 2 - 3, bottom);
  g.lineTo(cx - w / 2 - 3, top + 90);
  g.quadraticCurveTo(cx - w / 2 - 3, top - 3, cx, top - 3);
  g.stroke();

  // переплёт
  g.strokeStyle = '#2a1e3c';
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(cx, top + 6); g.lineTo(cx, bottom);
  g.moveTo(cx - w / 2, 250); g.lineTo(cx + w / 2, 250);
  g.stroke();
}

function drawSconce(x, y) {
  ctxSconce(x, y);
}

function ctxSconce(x, y) {
  const flick = 0.85 + 0.15 * Math.sin(T * 7 + x);
  g.save();
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 2, x, y, 72);
  gr.addColorStop(0, `rgba(255,190,120,${0.26 * flick})`);
  gr.addColorStop(1, 'rgba(255,150,90,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, 72, 0, TAU);
  g.fill();
  g.restore();

  g.fillStyle = '#3a2a2c';
  g.fillRect(x - 4, y + 12, 8, 30);
  g.fillStyle = '#6b4a3a';
  roundRect(g, x - 10, y + 6, 20, 9, 3);
  g.fill();
  g.fillStyle = '#ffd9a0';
  roundRect(g, x - 4, y - 10, 8, 20, 3);
  g.fill();
  const fh = 9 + Math.sin(T * 9 + x) * 2;
  g.fillStyle = 'rgba(255,214,140,.95)';
  g.beginPath();
  g.ellipse(x, y - 16, 3.2, fh, 0, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(255,245,210,.9)';
  g.beginPath();
  g.ellipse(x, y - 15, 1.3, fh * 0.5, 0, 0, TAU);
  g.fill();
}

/* ============================================================
   ФИНАЛ
   ============================================================ */
let endingT = 0;
let endingHeartTimer = 0;

function initEnding() {
  endingT = 0;
  endingHeartTimer = 0;
  dom.endingName.textContent = HER_NAME ? ('для тебя, ' + HER_NAME) : 'для тебя';
  dom.ending.classList.remove('hidden');
  dom.touch.classList.add('hidden');
  dom.bossUI.classList.add('hidden');
  dom.hud.classList.add('hidden');
  dom.dialogue.classList.add('hidden');
  Sound.chime();
  setTimeout(() => Sound.chime(), 700);
}

function updateEnding(dt) {
  endingT += dt;
  endingHeartTimer -= dt;
  if (endingHeartTimer <= 0) {
    endingHeartTimer = rand(0.35, 0.8);
    makeParticle({
      x: rand(60, W - 60), y: rand(430, 540),
      vx: rand(-12, 12), vy: rand(-55, -24),
      life: rand(2.4, 4.2), size: rand(5, 12), type: 'heart',
      color: pick(['#ff8fa9', '#ffb3c0', '#ffd0c4', '#ff9a7a']),
      rot: rand(-0.5, 0.5), vr: rand(-0.8, 0.8),
      grav: rand(-14, -4), drag: 0.25, alpha: 0.75,
    });
  }
}

function drawEndingScene() {
  drawSky(g, T, {
    top: '#08051a', mid: '#1b1038', low: '#40204d', bottom: '#6b3455',
    nebulas: [
      [220, 180, 300, 'rgba(130,80,220,.16)'],
      [800, 260, 300, 'rgba(255,120,140,.12)'],
      [520, 440, 380, 'rgba(255,170,120,.10)'],
    ],
  });
  drawMoon(g, 776, 122, 50, T);

  // сияние у горизонта
  g.save();
  g.globalCompositeOperation = 'lighter';
  const hg = g.createLinearGradient(0, 380, 0, H);
  hg.addColorStop(0, 'rgba(255,150,130,0)');
  hg.addColorStop(1, 'rgba(255,150,130,.14)');
  g.fillStyle = hg;
  g.fillRect(0, 380, W, H - 380);
  g.restore();

  drawHillLayer(g, 0, 430, 20, 0.06, '#241735', 1.2);
  drawHillLayer(g, 0, 470, 14, 0.12, '#1a1029', 3.4);

  // трава
  const groundGrad = g.createLinearGradient(0, 500, 0, H);
  groundGrad.addColorStop(0, '#241b33');
  groundGrad.addColorStop(1, '#0d0816');
  g.fillStyle = groundGrad;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 18) {
    const y = 508 + Math.sin(x * 0.011) * 4;
    g.lineTo(x, y);
  }
  g.lineTo(W, H);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(150,180,150,.2)';
  g.lineWidth = 1.4;
  g.beginPath();
  for (let x = 0; x <= W; x += 18) {
    const y = 508 + Math.sin(x * 0.011) * 4;
    if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();

  // пара
  drawCoupleSilhouette(g, 480, 522, 1.18, T);

  // искры и сердечки
  for (let i = 0; i < 10; i++) {
    const x = 430 + ((i * 131 + T * 10) % 120) - 60;
    g.globalAlpha = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(T * 2 + i));
    drawSparkle(g, x, 400 - ((T * 12 + i * 31) % 70), 2, '#ffe0b0');
  }
  g.globalAlpha = 1;

  drawParticles(g, 'screen', 0);
  drawVignette(0.5);
}

function drawCoupleSilhouette(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // тёплое сияние за парой
  const glow = ctx.createRadialGradient(0, -50, 10, 0, -50, 100);
  glow.addColorStop(0, 'rgba(255,160,140,.16)');
  glow.addColorStop(1, 'rgba(255,120,120,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -50, 100, 0, TAU);
  ctx.fill();

  const dark = '#1b1126';
  const rim = 'rgba(255,190,150,.32)';

  // он — слева
  ctx.fillStyle = dark;
  // голова
  ctx.beginPath();
  ctx.arc(-20, -104, 13.5, 0, TAU);
  ctx.fill();
  // плечи и тело
  ctx.beginPath();
  ctx.moveTo(-34, -92);
  ctx.quadraticCurveTo(-40, -70, -36, -48);
  ctx.lineTo(-4, -48);
  ctx.quadraticCurveTo(-2, -76, -8, -92);
  ctx.quadraticCurveTo(-20, -98, -34, -92);
  ctx.closePath();
  ctx.fill();
  // ноги
  ctx.fillRect(-31, -50, 10, 50);
  ctx.fillRect(-12, -50, 10, 50);
  // рука к центру
  ctx.strokeStyle = dark;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -84);
  ctx.quadraticCurveTo(4, -70, 6, -66);
  ctx.stroke();

  // она — справа
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(20, -102, 13, 0, TAU);
  ctx.fill();
  // платье
  ctx.beginPath();
  ctx.moveTo(8, -90);
  ctx.quadraticCurveTo(4, -70, 0, -48);
  ctx.lineTo(38, -48);
  ctx.quadraticCurveTo(36, -72, 31, -90);
  ctx.quadraticCurveTo(20, -96, 8, -90);
  ctx.closePath();
  ctx.fill();
  // длинные волосы
  ctx.beginPath();
  ctx.moveTo(9, -104);
  ctx.bezierCurveTo(3, -96, 4, -78, 8, -62);
  ctx.bezierCurveTo(4, -56, 8, -50, 12, -54);
  ctx.bezierCurveTo(14, -66, 14, -84, 18, -92);
  ctx.bezierCurveTo(28, -88, 33, -78, 32, -64);
  ctx.bezierCurveTo(30, -55, 36, -50, 39, -56);
  ctx.bezierCurveTo(42, -76, 38, -94, 30, -100);
  ctx.bezierCurveTo(24, -106, 15, -108, 9, -104);
  ctx.closePath();
  ctx.fill();
  // её рука к нему
  ctx.strokeStyle = dark;
  ctx.lineWidth = 7.5;
  ctx.beginPath();
  ctx.moveTo(8, -84);
  ctx.quadraticCurveTo(0, -72, -1, -67);
  ctx.stroke();

  // соединённые руки
  ctx.fillStyle = '#241730';
  ctx.beginPath();
  ctx.arc(2, -66, 5.4, 0, TAU);
  ctx.fill();

  // контурный свет
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(-20, -104, 13.9, -2.6, -0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(20, -102, 13.4, -2.4, -0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(31, -90);
  ctx.quadraticCurveTo(39, -72, 38, -49);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-34, -90);
  ctx.quadraticCurveTo(-41, -70, -37, -49);
  ctx.stroke();

  ctx.restore();
}
