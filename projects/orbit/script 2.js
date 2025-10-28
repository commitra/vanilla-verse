// Orbit Collector - target-persistent version (wrong collections cost a life)
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: true });

  // UI elements
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const livesEl = document.getElementById('lives');
  const targetNameEl = document.getElementById('targetColorName');
  const restartBtn = document.getElementById('restart');

  // Resize canvas to device pixels
  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  // Game state
  let particles = [];
  let score = 0;
  let level = 1;
  let lives = 3;
  let running = true;

  // colors and names (Crimson is target)
  const COLORS = [
    { name: 'Crimson', hex: '#ff4d6d' }, // index 0 -> target
    { name: 'Amber', hex: '#ffb86b' },
    { name: 'Lime', hex: '#a7ff83' },
    { name: 'Cyan', hex: '#6ee7ff' },
    { name: 'Violet', hex: '#cda4ff' },
  ];

  const CRIMSON_INDEX = COLORS.findIndex(c => c.name === 'Crimson');
  if (CRIMSON_INDEX === -1) throw new Error('Crimson color missing from COLORS');

  // Track how many of each color the player has collected (optional, kept)
  const collectionCounts = {};
  COLORS.forEach(c => (collectionCounts[c.hex] = 0));

  // tuning constants
  const SPAWN_BIAS_FACTOR = 1.6;
  const MIN_WEIGHT = 0.4;

  // Force target to Crimson and lock it
  let targetIndex = CRIMSON_INDEX;
  const targetLocked = true;
  function setTarget(i) {
    if (targetLocked) targetIndex = CRIMSON_INDEX;
    else targetIndex = i % COLORS.length;
    targetNameEl.style.background = COLORS[targetIndex].hex;
    targetNameEl.textContent = '';
    targetNameEl.title = COLORS[targetIndex].name;
  }
  setTarget(0);

  // player attractor (follows mouse)
  const player = { x: window.innerWidth / 2, y: window.innerHeight / 2, radius: 24 };

  // mouse tracking
  window.addEventListener('mousemove', (e) => {
    player.x = e.clientX;
    player.y = e.clientY;
  });

  // click to pulse (brief stronger pull)
  let pulse = 0;
  window.addEventListener('mousedown', () => (pulse = 1.2));
  window.addEventListener('mouseup', () => (pulse = 0));

  // particle constructor
  function createParticle(cx, cy, colorObj, orbitRadius, angle, speed) {
    return {
      x: cx + Math.cos(angle) * orbitRadius,
      y: cy + Math.sin(angle) * orbitRadius,
      cx, cy,
      orbitRadius,
      angle,
      speed,
      color: colorObj.hex,
      name: colorObj.name,
      size: 8 + Math.random() * 6,
      wobble: Math.random() * Math.PI * 2,
    };
  }

  // choose a color object with weights influenced by collectionCounts (kept for variety)
  function chooseColorByWeight(preferNonTarget = false) {
    // compute total collected so far
    const totals = Object.values(collectionCounts).reduce((a,b) => a + b, 0);

    // if nothing collected yet, use uniform distribution
    if (totals === 0) {
      // if preferNonTarget, avoid choosing Crimson
      if (preferNonTarget) {
        const nonTargets = COLORS.filter((c, i) => i !== targetIndex);
        return nonTargets[Math.floor(Math.random() * nonTargets.length)];
      }
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    const raw = COLORS.map((c, i) => {
      const count = collectionCounts[c.hex] || 0;
      const proportion = count / totals;
      // keep a slightly higher base for target so it tends to appear (but we also enforce presence)
      const base = (i === targetIndex) ? 1.2 : 1;
      return MIN_WEIGHT + base * (1 + proportion * SPAWN_BIAS_FACTOR);
    });

    // If preferNonTarget, set target weight to a tiny value so we pick others
    if (preferNonTarget) raw[targetIndex] = MIN_WEIGHT * 0.2;

    const sum = raw.reduce((a,b) => a + b, 0);
    const probs = raw.map(r => r / sum);

    let r = Math.random();
    for (let i = 0; i < probs.length; i++) {
      r -= probs[i];
      if (r <= 0) return COLORS[i];
    }
    return COLORS[COLORS.length - 1];
  }

  // spawn single particle at a logical position; allow forcing a specific color
  function spawnParticleSingle(lv, forcedColorIndex = null) {
    const cx = window.innerWidth / 2 + (Math.random() - 0.5) * 120;
    const cy = window.innerHeight / 2 + (Math.random() - 0.5) * 80;
    const c = (forcedColorIndex !== null) ? COLORS[forcedColorIndex] : chooseColorByWeight();
    const radius = 60 + Math.random() * (Math.min(window.innerWidth, window.innerHeight) / 3);
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.005 + Math.random() * 0.008 + lv * 0.002;
    particles.push(createParticle(cx, cy, c, radius, angle, speed));
  }

  // spawn multiple non-target particles (used when player eats a red)
  function spawnExtraNonTarget(count, lv) {
    for (let i = 0; i < count; i++) {
      // prefer non-target colors when spawning these extras
      const c = chooseColorByWeight(true);
      const cx = window.innerWidth / 2 + (Math.random() - 0.5) * 160;
      const cy = window.innerHeight / 2 + (Math.random() - 0.5) * 120;
      const radius = 60 + Math.random() * (Math.min(window.innerWidth, window.innerHeight) / 3);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.006 + Math.random() * 0.01 + lv * 0.003;
      particles.push(createParticle(cx, cy, c, radius, angle, speed));
    }
  }

  // spawn initial level particles
  function spawnLevel(lv) {
    particles = [];
    const count = 6 + lv * 2;
    for (let i = 0; i < count; i++) spawnParticleSingle(lv);
    // ensure at least one target exists
    ensureTargetPresence();
  }

  // ensure there's always at least one Crimson (target) in the field
  function ensureTargetPresence() {
    const found = particles.some(p => p.color === COLORS[targetIndex].hex);
    if (!found) {
      // spawn 1 forced Crimson
      spawnParticleSingle(level, targetIndex);
    }
  }

  spawnLevel(level);

  // main loop
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(50, now - last);
    last = now;
    update(dt / 16.67);
    render();
    if (running) requestAnimationFrame(loop);
  }

  // update physics
  function update(delta) {
    pulse *= 0.92;

    for (let p of particles) {
      p.angle += p.speed * delta;
      p.wobble += 0.04 * delta;
      const wob = Math.sin(p.wobble) * 6;

      p.x = p.cx + Math.cos(p.angle) * (p.orbitRadius + wob);
      p.y = p.cy + Math.sin(p.angle) * (p.orbitRadius + wob);

      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const strength = (0.6 + pulse * 1.4) * (40 / (dist * dist)) * (1 + level * 0.08);

      p.x += dx * strength * delta * 0.6;
      p.y += dy * strength * delta * 0.6;

      const pdist = Math.hypot(player.x - p.x, player.y - p.y);
      if (pdist < player.radius + p.size / 2) {
        collectParticle(p);
      }
    }

    // make sure target remains present (in case multiple got collected quickly)
    ensureTargetPresence();
  }

  // when a particle is collected
  function collectParticle(p) {
    const correct = p.color === COLORS[targetIndex].hex;
    if (correct) {
      // collected the target (Crimson)
      score += 15; // slightly bigger reward
      scoreEl.textContent = `Score: ${score}`;
      spawnBurst(p.x, p.y, p.color);

      // update collection counts
      if (collectionCounts[p.color] !== undefined) collectionCounts[p.color] += 1;
      else collectionCounts[p.color] = 1;

      // remove the particle
      const idx = particles.indexOf(p);
      if (idx >= 0) particles.splice(idx, 1);

      // Immediately spawn another Crimson (guaranteed target continuity)
      spawnParticleSingle(level, targetIndex);

      // Then spawn extra NON-TARGET particles to make it harder
      // number of extras scales with level and can be tuned
      const extras = 2 + Math.floor(level * 0.6);
      spawnExtraNonTarget(extras, level);

    } else {
      // collected a non-target --> now costs a life
      score += 5;
      scoreEl.textContent = `Score: ${score}`;

      // deduct a life
      lives -= 1;
      livesEl.textContent = `Lives: ${lives}`;

      // bigger white burst for wrong hit
      spawnBurst(p.x, p.y, '#ffffff', true);

      // update collection counts
      if (collectionCounts[p.color] !== undefined) collectionCounts[p.color] += 1;
      else collectionCounts[p.color] = 1;

      // remove particle and respawn a replacement (keeps overall count stable)
      const idx = particles.indexOf(p);
      if (idx >= 0) particles.splice(idx, 1);
      spawnParticleSingle(level);

      // ensure target still present
      ensureTargetPresence();

      // check for game over after life loss
      if (lives <= 0) return gameOver();
    }

    // if few particles left (edge case), advance level
    if (particles.length <= 2) {
      levelUp();
    }
  }

  function levelUp() {
    level += 1;
    levelEl.textContent = `Level: ${level}`;
    // keep target locked to Crimson
    setTarget(targetIndex);
    // spawn fresh level with higher count
    spawnLevel(level);
  }

  function gameOver() {
    running = false;
    setTimeout(() => {
      const msg = document.createElement('div');
      msg.style.position = 'fixed';
      msg.style.left = '50%';
      msg.style.top = '50%';
      msg.style.transform = 'translate(-50%,-50%)';
      msg.style.background = 'rgba(0,0,0,0.6)';
      msg.style.padding = '18px 22px';
      msg.style.borderRadius = '12px';
      msg.style.boxShadow = '0 8px 30px rgba(2,6,23,0.7)';
      msg.style.color = '#fff';
      msg.style.textAlign = 'center';
      msg.innerHTML = `<h2 style="margin-bottom:8px">Game Over</h2>
        <div style="margin-bottom:12px">Score: ${score}</div>
        <button id="playAgain" style="padding:8px 12px;border-radius:8px;border:none;cursor:pointer">Play Again</button>`;
      document.body.appendChild(msg);
      document.getElementById('playAgain').addEventListener('click', () => {
        document.body.removeChild(msg);
        restart();
      });
    }, 120);
  }

  // small particle burst visual
  const bursts = [];
  function spawnBurst(x, y, color = '#fff', big = false) {
    const n = big ? 18 : 10;
    for (let i = 0; i < n; i++) {
      bursts.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (big ? 5 : 3),
        vy: (Math.random() - 0.5) * (big ? 5 : 3),
        life: 30 + Math.random() * 30,
        color,
        size: 1 + Math.random() * 3,
      });
    }
  }

  // render
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const g = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 180);
    g.addColorStop(0, 'rgba(255,255,255,0.03)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let p of particles) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 1;
      ctx.ellipse(p.cx, p.cy, p.orbitRadius, p.orbitRadius * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let p of particles) {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.arc(player.x, player.y, player.radius + 6 + pulse * 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = COLORS[targetIndex].hex;
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.globalAlpha = Math.max(0, b.life / 60);
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.06;
      b.life -= 1;
      if (b.life <= 0) bursts.splice(i, 1);
    }

    // target swatch near cursor
    ctx.beginPath();
    ctx.fillStyle = COLORS[targetIndex].hex;
    ctx.rect(player.x + player.radius + 10, player.y - 8, 20, 16);
    ctx.fill();
  }

  // restart
  function restart() {
    Object.keys(collectionCounts).forEach(k => (collectionCounts[k] = 0));
    score = 0;
    level = 1;
    lives = 3;
    scoreEl.textContent = `Score: ${score}`;
    levelEl.textContent = `Level: ${level}`;
    livesEl.textContent = `Lives: ${lives}`;
    setTarget(targetIndex);
    spawnLevel(level);
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  restartBtn.addEventListener('click', restart);

  // start
  scoreEl.textContent = `Score: ${score}`;
  levelEl.textContent = `Level: ${level}`;
  livesEl.textContent = `Lives: ${lives}`;
  setTarget(targetIndex);
  requestAnimationFrame(loop);

  // keyboard: keep space from changing target because target is locked to Crimson,
  // but allow pause with P
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
      running = !running;
      if (running) {
        last = performance.now();
        requestAnimationFrame(loop);
      }
    }
  });

})();
