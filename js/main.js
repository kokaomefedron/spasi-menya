/* ============================================================
   main.js — запуск, игровой цикл
   ============================================================ */

function update(dt) {
  T += dt;
  Dialogue.update(dt);
  Fade.update(dt);
  updateParticles(dt);

  if (scene === 'meadow') updateMeadow(dt);
  else if (scene === 'platformer') updatePlatformer(dt);
  else if (scene === 'boss') updateBossScene(dt);
  else if (scene === 'cage') updateCage(dt);
  else if (scene === 'ending') updateEnding(dt);
}

function render() {
  g.setTransform(viewScale, 0, 0, viewScale, 0, 0);
  g.clearRect(0, 0, W, H);

  if (scene === 'title') drawTitleScene();
  else if (scene === 'meadow') drawMeadowScene();
  else if (scene === 'platformer') drawPlatformer();
  else if (scene === 'boss') drawBossScene();
  else if (scene === 'cage') drawCageScene();
  else if (scene === 'ending') drawEndingScene();

  g.setTransform(1, 0, 0, 1, 0, 0);
}

let lastTime = 0;

function loop(now) {
  if (!lastTime) lastTime = now;
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener('blur', () => {
  input.left = false;
  input.right = false;
  input.jump = false;
  input.jumpQueued = false;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    input.left = false;
    input.right = false;
    input.jump = false;
  }
});

function boot() {
  // режим для скриншотов: index.html?still — без CSS-анимаций
  if (new URLSearchParams(location.search).has('still')) document.body.classList.add('still');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 120));

  // отладочный переход: index.html#boss / #cage / #ending / #platformer / #meadow
  const hash = location.hash.replace('#', '');
  if (hash && ['meadow', 'platformer', 'boss', 'cage', 'ending'].includes(hash)) {
    setScene(hash);
  } else {
    setScene('title');
  }

  requestAnimationFrame(loop);
}

boot();
