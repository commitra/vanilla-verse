

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;
  const scoreBox = document.getElementById('scoreBox');
  const highBox = document.getElementById('highBox');
  const statusText = document.getElementById('statusText');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');

  // Game state
  let rafId = null;
  let running = false;
  let paused = false;
  let gameOver = false;

  // Timing (ms)
  let lastTime = 0;

  // Scoring / difficulty
  let score = 0;                 // displayed integer score
  let scoreAcc = 0;              // float accumulator for smoother scoring
  let speed = 320;               // pixels/second - base world speed
  let spawnTimer = 0;            // ms
  let spawnInterval = 1400;      // ms
  let difficultyTimer = 0;       // ms

  // High score
  let highScore = Number(localStorage.getItem('dino-highscore') || 0);
  highBox.textContent = 'High: ' + highScore;

  // Physics tuned for canvas size
  const dino = {
    x: 80,
    y: H - 60 - 44,
    w: 44,
    h: 44,
    vy: 0,                 // pixels/second
    gravity: 2200,         // px/s^2
    jumpForce: -700,       // px/s (initial upward velocity)
    grounded: true,
    ducking: false,
    draw() {
      ctx.save();
      ctx.fillStyle = 'hsl(42,95%,56%)';
      const by = this.y + (this.ducking ? 12 : 0);
      const bh = this.h - (this.ducking ? 12 : 0);
      roundRect(ctx, this.x, by, this.w, bh, 6);
      ctx.fill();

      // simple eye
      ctx.fillStyle = '#05251b';
      ctx.fillRect(this.x + 28, by + 8, 6, 6);
      ctx.restore();
    },
    update(dt) {
      // dt in seconds
      if (!this.grounded || this.vy !== 0) {
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        if (this.y >= H - 60 - this.h) {
          this.y = H - 60 - this.h;
          this.vy = 0;
          this.grounded = true;
        }
      }
    },
    jump() {
      if (this.grounded && !this.ducking) {
        this.vy = this.jumpForce;
        this.grounded = false;
      } else if (gameOver) {
        // if game over, pressing jump will restart (convenience)
        restart();
      }
    },
    duck(isDown) {
      if (isDown && this.grounded) this.ducking = true;
      else this.ducking = false;
    },
    getBounds() {
      const by = this.y + (this.ducking ? 12 : 0);
      const bh = this.h - (this.ducking ? 12 : 0);
      return { x: this.x, y: by, w: this.w, h: bh };
    }
  };

  const obstacles = [];

  function spawnObstacle() {
    const isFlying = Math.random() < 0.18;
    let hgt = isFlying ? randInt(14, 28) : randInt(18, 48);
    let y = H - 60 - hgt;
    if (isFlying) {
      // place flying obstacles higher
      y = H - 120 - hgt - randInt(0, 18);
    }
    const w = randInt(18, 36);

    obstacles.push({
      x: W + 20,
      y,
      w,
      h: hgt,
      type: isFlying ? 'flying' : 'ground',
      draw() {
        ctx.save();
        ctx.fillStyle = isFlying ? 'hsl(340,80%,62%)' : 'hsl(220,60%,60%)';
        roundRect(ctx, this.x, this.y, this.w, this.h, 6);
        ctx.fill();
        ctx.restore();
      },
      update(dt) {
        // move using the global speed so difficulty affects all obstacles
        this.x -= speed * dt;
      }
    });
  }

  function drawGround(offset) {
    ctx.save();
    ctx.fillStyle = '#07101b';
    ctx.fillRect(0, H - 60, W, 60);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -offset % 40; x < W + 40; x += 40) {
      ctx.moveTo(x, H - 30);
      ctx.lineTo(x + 24, H - 30);
    }
    ctx.stroke();
    ctx.restore();
  }

  function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rad = r || 6;
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function collides(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Controls
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (!running) start();
      dino.jump();
    }
    if (e.code === 'ArrowDown') {
      dino.duck(true);
    }
    if (e.code === 'KeyP') togglePause();
    if (e.code === 'KeyR') restart();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') dino.duck(false);
  });

  // Touch / mobile controls
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!running) start();
    dino.jump();
  }, { passive: false });

  // Optional on-screen buttons (if present in HTML)
  const touchJumpBtn = document.getElementById('touchJump');
  const touchDuckBtn = document.getElementById('touchDuck');
  if (touchJumpBtn) touchJumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (!running) start(); dino.jump(); }, { passive: false });
  if (touchDuckBtn) touchDuckBtn.addEventListener('touchstart', (e) => { e.preventDefault(); dino.duck(true); }, { passive: false });
  if (touchDuckBtn) touchDuckBtn.addEventListener('touchend', (e) => { e.preventDefault(); dino.duck(false); }, { passive: false });

  pauseBtn.addEventListener('click', togglePause);
  restartBtn.addEventListener('click', restart);

  function togglePause() {
    if (!running) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    statusText.textContent = paused ? 'Paused' : 'Running';
    // keep RAF running to keep rendering; update() respects paused flag
  }

  function restart() {
    // Stop the loop
    running = false;
    gameOver = false;
    paused = false;
    if (rafId) cancelAnimationFrame(rafId);

    // Reset state
    score = 0;
    scoreAcc = 0;
    speed = 320;
    spawnInterval = 1400;
    spawnTimer = 0;
    difficultyTimer = 0;
    obstacles.length = 0;

    dino.y = H - 60 - dino.h;
    dino.vy = 0;
    dino.grounded = true;
    dino.ducking = false;

    scoreBox.textContent = 'Score: 0';
    statusText.textContent = 'Ready — press Space to start';
    pauseBtn.textContent = 'Pause';

    renderStartScreen();
  }

  function start() {
    if (running) return;
    running = true;
    paused = false;
    gameOver = false;
    lastTime = performance.now();
    score = 0;
    scoreAcc = 0;
    scoreBox.textContent = 'Score: ' + score;
    statusText.textContent = 'Running';
    rafId = requestAnimationFrame(loop);
  }

  function doGameOver() {
    gameOver = true;
    running = false;
    statusText.textContent = 'Game Over — press Restart or R';
    pauseBtn.textContent = 'Pause';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('dino-highscore', String(highScore));
      highBox.textContent = 'High: ' + highScore;
    }
  }

  // Renderers
  function renderStartScreen() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#dbeafe';
    ctx.font = '700 20px Inter, Arial';
    ctx.fillText('Mini Dino Run', 20, 36);

    ctx.font = '14px Inter, Arial';
    ctx.fillStyle = 'rgba(219,234,254,0.72)';
    ctx.fillText('Press Space or Tap to start', 20, 60);

    dino.draw();
    drawGround(0);
  }

  // Main loop
  function loop(time) {
    rafId = requestAnimationFrame(loop);
    if (!lastTime) lastTime = time;
    const dt = Math.min(0.05, (time - lastTime) / 1000); // clamp dt to 50ms to avoid big jumps
    lastTime = time;

    if (!running) return; // safety

    if (!paused && !gameOver) {
      update(dt);
    }

    render();

    if (gameOver && rafId) {
      // stop animation frames after rendering the final state to avoid runaway RAFs
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function update(dt) {
    // difficulty increases over time
    difficultyTimer += dt * 1000;
    if (difficultyTimer > 2500) {
      difficultyTimer = 0;
      speed += 12; // increase world speed
      spawnInterval = Math.max(650, spawnInterval - 60);
    }

    // spawn
    spawnTimer += dt * 1000;
    if (spawnTimer >= spawnInterval) {
      spawnTimer -= spawnInterval;
      spawnObstacle();
    }

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.update(dt);
      if (o.x + o.w < -60) obstacles.splice(i, 1);
    }

    // player
    dino.update(dt);

    // score: grows with time and speed
    scoreAcc += dt * (10 + speed / 60);
    const newScore = Math.floor(scoreAcc);
    if (newScore !== score) {
      score = newScore;
      scoreBox.textContent = 'Score: ' + score;
    }

    // collision
    const p = dino.getBounds();
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const ob = { x: o.x, y: o.y, w: o.w, h: o.h };
      if (collides(p, ob)) {
        doGameOver();
        break;
      }
    }
  }

  let groundOffset = 0;
  function render() {
    ctx.clearRect(0, 0, W, H);

    // sky / stars
    drawStars();

    // mountains / parallax
    drawMountains();

    // ground
    groundOffset = (groundOffset + speed * 0.4 * (1/60)) % 40;
    drawGround(groundOffset);

    // obstacles
    for (const obs of obstacles) obs.draw();

    // dino
    dino.draw();

    // overlays
    if (paused) {
      ctx.save();
      ctx.fillStyle = 'rgba(4,6,12,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '600 20px Inter, Arial';
      ctx.fillText('Paused', W/2 - 34, H/2);
      ctx.restore();
    }

    if (gameOver) {
      ctx.save();
      ctx.fillStyle = 'rgba(2,6,10,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '700 22px Inter, Arial';
      ctx.fillText('Game Over', W/2 - 66, H/2 - 8);
      ctx.font = '14px Inter, Arial';
      ctx.fillText('Press Restart (or R) to try again', W/2 - 120, H/2 + 16);
      ctx.restore();
    }
  }

  function drawMountains() {
    ctx.save();
    ctx.fillStyle = 'rgba(10,20,40,0.6)';
    // three simple mountains
    ctx.beginPath(); ctx.moveTo(0, H - 60); ctx.lineTo(60, H - 140); ctx.lineTo(140, H - 60); ctx.fill();
    ctx.beginPath(); ctx.moveTo(180, H - 60); ctx.lineTo(260, H - 180); ctx.lineTo(340, H - 60); ctx.fill();
    ctx.beginPath(); ctx.moveTo(420, H - 60); ctx.lineTo(560, H - 220); ctx.lineTo(700, H - 60); ctx.fill();
    ctx.restore();
  }

  function drawStars() {
    ctx.save();
    const t = performance.now() / 1000;
    for (let i = 0; i < 40; i++) {
      const x = (i * 29 + Math.cos(t + i) * 18) % W;
      const y = 18 + ((i * 37) % 80);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.04 + (i % 4) * 0.02) + ')';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }

  // initial render
  renderStartScreen();

  // allow clicking canvas to start
  canvas.addEventListener('click', () => { if (!running) start(); });

})();
