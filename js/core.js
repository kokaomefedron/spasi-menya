/* ============================================================
   core.js — настройки, холст, ввод, звук, диалоги, частицы
   ============================================================ */

/* ♥♥♥  ЕЁ ИМЯ — поменяй здесь, и оно появится в финале  ♥♥♥ */
const HER_NAME = 'Любимая';

const W = 960;
const H = 540;
const TAU = Math.PI * 2;

const stage = document.getElementById('stage');
const canvas = document.getElementById('game');
const g = canvas.getContext('2d');

let viewScale = 1;
let T = 0;

/* ---------- DOM ---------- */
const dom = {
  title: document.getElementById('title-screen'),
  startBtn: document.getElementById('start-btn'),
  dialogue: document.getElementById('dialogue'),
  dlgName: document.getElementById('dlg-name'),
  dlgText: document.getElementById('dlg-text'),
  dlgNext: document.getElementById('dlg-next'),
  hud: document.getElementById('hud'),
  heartCount: document.getElementById('heart-count'),
  bossUI: document.getElementById('boss-ui'),
  herHearts: document.getElementById('her-hearts'),
  bossBar: document.getElementById('boss-bar'),
  bossLog: document.getElementById('boss-log'),
  attackBtn: document.getElementById('attack-btn'),
  ending: document.getElementById('ending'),
  endingName: document.getElementById('ending-name'),
  replayBtn: document.getElementById('replay-btn'),
  toast: document.getElementById('toast'),
  soundBtn: document.getElementById('sound-btn'),
  touch: document.getElementById('touch'),
  fader: document.getElementById('fader'),
};

/* ---------- утилиты ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const rnd = (a, b) => rand(a, b);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function resizeCanvas() {
  const r = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  viewScale = canvas.width / W;
}

/* ---------- ввод ---------- */
const input = { left: false, right: false, jump: false, jumpQueued: false };

function pressJump() {
  input.jumpQueued = true;
  input.jump = true;
}

window.addEventListener('keydown', e => {
  const code = e.code;
  if (code === 'ArrowLeft' || code === 'KeyA') { input.left = true; e.preventDefault(); }
  if (code === 'ArrowRight' || code === 'KeyD') { input.right = true; e.preventDefault(); }
  if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
    if (!e.repeat) {
      if (Dialogue.active) Dialogue.advance();
      else pressJump();
    }
    e.preventDefault();
  }
  if (code === 'Enter') {
    if (Dialogue.active) { Dialogue.advance(); e.preventDefault(); }
  }
});

window.addEventListener('keyup', e => {
  const code = e.code;
  if (code === 'ArrowLeft' || code === 'KeyA') input.left = false;
  if (code === 'ArrowRight' || code === 'KeyD') input.right = false;
  if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') input.jump = false;
});

stage.addEventListener('pointerdown', e => {
  Sound.init();
  if (e.target.closest('button')) return;
  if (Dialogue.active) Dialogue.advance();
});

/* мобильные кнопки */
if (dom.touch) {
  dom.touch.querySelectorAll('.tbtn').forEach(btn => {
    const key = btn.dataset.key;
    const down = e => {
      e.preventDefault();
      btn.classList.add('on');
      Sound.init();
      if (key === 'left') input.left = true;
      if (key === 'right') input.right = true;
      if (key === 'jump') pressJump();
      if (btn.setPointerCapture && e.pointerId != null) {
        try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };
    const up = e => {
      e.preventDefault();
      btn.classList.remove('on');
      if (key === 'left') input.left = false;
      if (key === 'right') input.right = false;
      if (key === 'jump') input.jump = false;
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });
}

/* ---------- звук ---------- */
const Sound = {
  ctx: null,
  master: null,
  musicGain: null,
  muted: false,
  musicOn: false,
  nextChord: 0,
  chordIndex: 0,
  timer: null,
  chords: [
    [220.00, 261.63, 329.63, 440.00],
    [174.61, 220.00, 261.63, 349.23],
    [261.63, 329.63, 392.00, 523.25],
    [196.00, 246.94, 293.66, 392.00],
  ],
  scale: [880, 1046.5, 1174.66, 1318.5, 1568],

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch (_) { return; }

    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1500;
    this.musicGain.connect(lp);
    lp.connect(this.master);

    try {
      const stored = localStorage.getItem('lovegame-muted');
      if (stored === '1') this.setMuted(true, true);
    } catch (_) {}

    this.startMusic();
  },

  startMusic() {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.nextChord = this.ctx.currentTime + 0.3;
    this.timer = setInterval(() => this.schedule(), 400);
    this.schedule();
  },

  schedule() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (this.nextChord < now - 0.5) this.nextChord = now + 0.2;
    while (this.nextChord < now + 2.2) {
      this.playChord(this.nextChord, this.chords[this.chordIndex % this.chords.length]);
      this.nextChord += 5;
      this.chordIndex++;
    }
  },

  playChord(t, notes) {
    const ctx = this.ctx;
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      const peak = i === 0 ? 0.045 : 0.03 / i;
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(peak, t + 1.8);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 6.6);
      o.connect(gn);
      gn.connect(this.musicGain);
      o.start(t);
      o.stop(t + 7);
    });

    // редкие «звёздочки»
    if (Math.random() < 0.8) {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let k = 0; k < count; k++) {
        const tt = t + rand(0.6, 4.2);
        const f = pick(this.scale);
        const o = ctx.createOscillator();
        const gn = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        gn.gain.setValueAtTime(0.0001, tt);
        gn.gain.linearRampToValueAtTime(0.022, tt + 0.04);
        gn.gain.exponentialRampToValueAtTime(0.0001, tt + 1.4);
        o.connect(gn);
        gn.connect(this.musicGain);
        o.start(tt);
        o.stop(tt + 1.6);
      }
    }
  },

  tone(freq, dur, type = 'sine', vol = 0.08, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(vol, t + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn);
    gn.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.03);
  },

  blip() { this.tone(rand(520, 620), 0.06, 'triangle', 0.05, rand(600, 700)); },
  tick() { this.tone(rand(1500, 1800), 0.018, 'sine', 0.012); },
  chime() {
    this.tone(880, 0.32, 'sine', 0.07);
    this.tone(1318.5, 0.42, 'sine', 0.045, null, 0.04);
  },
  cast() { this.tone(320, 0.34, 'sine', 0.06, 980); },
  hit() {
    this.tone(150, 0.24, 'triangle', 0.12, 55);
    this.tone(90, 0.32, 'sine', 0.09, 40);
  },
  hurt() { this.tone(220, 0.2, 'sawtooth', 0.045, 90); },
  revive() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.055, null, i * 0.09));
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.7, 'triangle', 0.055, null, i * 0.11));
  },
  quest() {
    [659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.05, null, i * 0.07));
  },

  setMuted(m, silent) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
    dom.soundBtn.classList.toggle('muted', m);
    dom.soundBtn.textContent = m ? '♩̸' : '♪';
    if (!silent) {
      try { localStorage.setItem('lovegame-muted', m ? '1' : '0'); } catch (_) {}
    }
  },
  toggle() {
    this.init();
    this.setMuted(!this.muted);
    if (!this.muted) this.startMusic();
    else if (this.ctx && this.master) this.master.gain.value = 0;
    if (!this.muted) this.chime();
  },
};

dom.soundBtn.addEventListener('click', () => Sound.toggle());

/* ---------- тост ---------- */
let toastTimer = null;
function toast(text, ms = 2400) {
  dom.toast.textContent = text;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), ms);
}

/* ---------- затемнение между сценами ---------- */
const Fade = {
  a: 0,
  dir: 0,
  cb: null,
  duration: 0.55,
  to(cb) {
    if (this.dir !== 0) return;
    this.dir = 1;
    this.cb = cb;
  },
  update(dt) {
    if (this.dir === 1) {
      this.a += dt / this.duration;
      if (this.a >= 1) {
        this.a = 1;
        this.dir = -1;
        const cb = this.cb;
        this.cb = null;
        if (cb) cb();
      }
    } else if (this.dir === -1) {
      this.a -= dt / this.duration;
      if (this.a <= 0) {
        this.a = 0;
        this.dir = 0;
      }
    }
    if (dom.fader) dom.fader.style.opacity = this.a.toFixed(3);
  },
};

/* ---------- частицы ---------- */
let particles = [];

function makeParticle(o) {
  particles.push({
    x: o.x, y: o.y,
    vx: o.vx || 0, vy: o.vy || 0,
    life: o.life || 1, maxLife: o.life || 1,
    size: o.size || 6,
    color: o.color || '#ff9fb4',
    type: o.type || 'spark',
    rot: o.rot || 0, vr: o.vr || 0,
    grav: o.grav != null ? o.grav : 90,
    drag: o.drag != null ? o.drag : 0.6,
    space: o.space || 'screen',
    alpha: o.alpha != null ? o.alpha : 1,
  });
}

function burstHearts(x, y, count = 10, space = 'screen', spread = 150, color) {
  for (let i = 0; i < count; i++) {
    const a = rand(-Math.PI, 0);
    const sp = rand(spread * 0.25, spread);
    makeParticle({
      x: x + rand(-12, 12), y: y + rand(-10, 10),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(20, 60),
      life: rand(0.9, 1.8), size: rand(6, 13), type: 'heart',
      color: color || pick(['#ff8fa9', '#ffb3c0', '#ffd0c4', '#ff6f9c']),
      rot: rand(-0.5, 0.5), vr: rand(-2, 2), grav: rand(40, 110), drag: 0.8, space,
    });
  }
}

function burstSparks(x, y, count = 14, space = 'screen', color = '#ffd7a1', spread = 180) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, TAU);
    const sp = rand(30, spread);
    makeParticle({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: rand(0.35, 0.9), size: rand(1.5, 3.6), type: 'spark',
      color, grav: 20, drag: 1.6, space,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy += p.grav * dt;
    p.vx -= p.vx * p.drag * dt;
    p.vy -= p.vy * p.drag * dt * 0.4;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
  }
}

function drawParticles(ctx, space, camX) {
  for (const p of particles) {
    if (p.space !== space) continue;
    const t = p.life / p.maxLife;
    const alpha = clamp(t * 1.6, 0, 1) * p.alpha;
    const x = p.x - (camX || 0);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, p.y);
    if (p.type === 'heart') {
      ctx.rotate(p.rot);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      drawHeart(ctx, 0, 0, p.size, p.color);
    } else if (p.type === 'spark') {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, TAU);
      ctx.fill();
    } else if (p.type === 'dust') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, TAU);
      ctx.fill();
    } else if (p.type === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * (2 - t), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* ---------- диалоги ---------- */
const Dialogue = {
  active: false,
  lines: [],
  idx: 0,
  charTime: 0,
  shown: 0,
  cur: '',
  done: false,
  onEnd: null,
  speed: 44,

  start(lines, onEnd) {
    this.lines = lines;
    this.idx = 0;
    this.onEnd = onEnd || null;
    this.active = true;
    this.cur = '';
    dom.dialogue.classList.remove('hidden');
    this.load();
  },

  load() {
    const l = this.lines[this.idx];
    if (!l) { this.end(); return; }
    this.cur = l.text;
    this.charTime = 0;
    this.shown = 0;
    this.done = false;
    dom.dlgName.textContent = l.who || '';
    dom.dlgName.dataset.who = l.who === 'Люми' ? 'npc' : (l.who === 'Ты' ? 'her' : (l.who === 'Сомнение' ? 'boss' : 'him'));
    dom.dlgText.textContent = '';
    dom.dlgNext.classList.remove('show');
    Sound.blip();
  },

  update(dt) {
    if (!this.active || this.done) return;
    this.charTime += dt;
    const target = Math.min(this.cur.length, Math.floor(this.charTime * this.speed));
    if (target !== this.shown) {
      this.shown = target;
      dom.dlgText.textContent = this.cur.slice(0, target);
      if (target % 5 === 0) Sound.tick();
    }
    if (target >= this.cur.length) {
      this.done = true;
      dom.dlgText.textContent = this.cur;
      dom.dlgNext.classList.add('show');
    }
  },

  advance() {
    if (!this.active) return;
    if (!this.done) {
      this.shown = this.cur.length;
      dom.dlgText.textContent = this.cur;
      this.done = true;
      dom.dlgNext.classList.add('show');
      return;
    }
    this.idx++;
    if (this.idx >= this.lines.length) this.end();
    else this.load();
  },

  end() {
    this.active = false;
    dom.dialogue.classList.add('hidden');
    const cb = this.onEnd;
    this.onEnd = null;
    if (cb) cb();
  },
};
