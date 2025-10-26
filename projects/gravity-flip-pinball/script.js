const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gravity = { x: 0, y: 0.4, dir: "down" };
let ball = { x: 100, y: 100, vx: 0, vy: 0, radius: 14 };
let score = 0;
let status = "ready";
let challengeMode = false;
let timeRemaining = 60;
let timerInterval = null;

let walls = [];
let gates = [];
let startZone = { x: 50, y: 50, w: 80, h: 80 };
let endZone = { x: 100, y: 100, w: 100, h: 100 };

const layoutConfig = {
  margin: 18,
  thickness: 15,
  gateDefs: [
    { x: 0.18, y: 0.21, w: 0.16, h: 0.02 },
    { x: 0.78, y: 0.45, w: 0.12, h: 0.02 },
    { x: 0.18, y: 0.69, w: 0.06, h: 0.02 },
  ],
};

function setGravity(x, y, dir) {
  gravity = { x, y, dir };
  updateGravityIndicator();
}

function updateGravityIndicator() {
  document.querySelectorAll(".gravity-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const activeBtn = document.querySelector(
    `.gravity-btn[data-key="${
      gravity.dir === "up"
        ? "w"
        : gravity.dir === "down"
        ? "s"
        : gravity.dir === "left"
        ? "a"
        : "d"
    }"]`
  );
  if (activeBtn) activeBtn.classList.add("active");
}

function drawWalls() {
  ctx.strokeStyle = "#6ee7b7";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  walls.forEach((w) => {
    const gradient = ctx.createLinearGradient(w.x, w.y, w.x + w.w, w.y + w.h);
    gradient.addColorStop(0, "rgba(110, 231, 183, 0.3)");
    gradient.addColorStop(1, "rgba(147, 197, 253, 0.3)");
    ctx.fillStyle = gradient;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = "rgba(110, 231, 183, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  });
}

function drawZone(zone, color, label) {
  ctx.fillStyle = color;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  ctx.strokeStyle = color.replace("0.2", "0.6");
  ctx.lineWidth = 3;
  ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label, zone.x + zone.w / 2, zone.y + zone.h / 2 + 6);
  ctx.textAlign = "left";
}

function drawBall() {
  // Outer glow
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius + 4, 0, Math.PI * 2);
  const glowGradient = ctx.createRadialGradient(
    ball.x,
    ball.y,
    0,
    ball.x,
    ball.y,
    ball.radius + 4
  );
  glowGradient.addColorStop(0, "rgba(110, 231, 183, 0.3)");
  glowGradient.addColorStop(1, "rgba(110, 231, 183, 0)");
  ctx.fillStyle = glowGradient;
  ctx.fill();

  // Ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  const ballGradient = ctx.createRadialGradient(
    ball.x - ball.radius / 3,
    ball.y - ball.radius / 3,
    0,
    ball.x,
    ball.y,
    ball.radius
  );
  ballGradient.addColorStop(0, "#6ee7b7");
  ballGradient.addColorStop(1, "#34d399");
  ctx.fillStyle = ballGradient;
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#6ee7b7";
  ctx.fill();
  ctx.shadowBlur = 0;

  // Highlight
  ctx.beginPath();
  ctx.arc(
    ball.x - ball.radius / 4,
    ball.y - ball.radius / 4,
    ball.radius / 3,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fill();
}

function drawGates() {
  gates.forEach((g, i) => {
    if (g.passed) {
      ctx.fillStyle = "rgba(110, 231, 183, 0.6)";
      ctx.strokeStyle = "rgba(110, 231, 183, 0.9)";
    } else {
      ctx.fillStyle = "rgba(251, 191, 36, 0.7)";
      ctx.strokeStyle = "rgba(251, 191, 36, 1)";

      // Pulsing effect for active gates
      const pulse = Math.sin(Date.now() / 300 + i) * 0.2 + 0.8;
      ctx.shadowBlur = 15 * pulse;
      ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
    }

    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.lineWidth = 3;
    ctx.strokeRect(g.x, g.y, g.w, g.h);
    ctx.shadowBlur = 0;

    // Gate number
    ctx.fillStyle = "#0b1020";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(i + 1, g.x + g.w / 2, g.y + g.h / 2 + 4);
    ctx.textAlign = "left";
  });
}

function ballRectCollision(b, rect) {
  const closestX = Math.max(rect.x, Math.min(b.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(b.y, rect.y + rect.h));

  const dx = b.x - closestX;
  const dy = b.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq < b.radius * b.radius) {
    const dist = Math.sqrt(distSq) || 1;
    const overlap = b.radius - dist;

    b.x += (dx / dist) * overlap;
    b.y += (dy / dist) * overlap;

    const normalX = dx / dist;
    const normalY = dy / dist;
    const dot = b.vx * normalX + b.vy * normalY;
    b.vx -= 2 * dot * normalX;
    b.vy -= 2 * dot * normalY;

    b.vx *= 0.8;
    b.vy *= 0.8;
  }
}

function updateBall() {
  if (status !== "playing") return;

  ball.vx += gravity.x;
  ball.vy += gravity.y;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
    ball.vx *= -0.8;
    ball.x = Math.max(
      ball.radius,
      Math.min(canvas.width - ball.radius, ball.x)
    );
  }
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    ball.vy *= -0.8;
    ball.y = Math.max(
      ball.radius,
      Math.min(canvas.height - ball.radius, ball.y)
    );
  }

  walls.forEach((w) => ballRectCollision(ball, w));

  gates.forEach((g, i) => {
    if (
      !g.passed &&
      ball.x > g.x + 1 &&
      ball.x < g.x + g.w - 1 &&
      ball.y > g.y + 1 &&
      ball.y < g.y + g.h - 1
    ) {
      g.passed = true;
      score += 10;
      document.getElementById("score").textContent = score;
      document.getElementById("gates").textContent = `${
        gates.filter((g) => g.passed).length
      }/${gates.length}`;
    }
  });

  if (
    ball.x > endZone.x &&
    ball.x < endZone.x + endZone.w &&
    ball.y > endZone.y &&
    ball.y < endZone.y + endZone.h
  ) {
    const allGatesPassed = gates.every((g) => g.passed);
    if (allGatesPassed) {
      status = "won";
      document.getElementById("status").textContent = "Victory!";
      showVictoryModal();
    }
  }
}

function showVictoryModal() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const modal = document.getElementById("victoryModal");
  const title = document.getElementById("victoryTitle");
  const message = document.getElementById("victoryMessage");

  if (challengeMode) {
    const timeTaken = 60 - timeRemaining;
    title.textContent = "Challenge Complete!";
    message.textContent = `You finished in ${timeTaken} seconds with a score of ${score}!`;
  } else {
    title.textContent = "Victory!";
    message.textContent = `You collected all gates with a score of ${score}!`;
  }

  modal.classList.add("show");
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timeRemaining = 60;
  const timerEl = document.getElementById("timer");
  timerEl.textContent = timeRemaining;
  timerEl.classList.remove("warning", "critical");

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerEl.textContent = timeRemaining;

    if (timeRemaining <= 10) {
      timerEl.classList.add("critical");
      timerEl.classList.remove("warning");
    } else if (timeRemaining <= 20) {
      timerEl.classList.add("warning");
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      status = "lost";
      document.getElementById("status").textContent = "Time's Up!";
      document.getElementById("victoryTitle").textContent = "Time's Up!";
      document.getElementById(
        "victoryMessage"
      ).textContent = `You scored ${score} points. Try again!`;
      document.getElementById("victoryModal").classList.add("show");
    }
  }, 1000);
}

function buildLayout() {
  const w = canvas.width;
  const h = canvas.height;
  const m = layoutConfig.margin;
  const t = layoutConfig.thickness;

  startZone = { x: m + 8, y: m + 8, w: 88, h: 88 };
  endZone = { x: w - m - 110, y: h - m - 110, w: 100, h: 100 };

  gates = layoutConfig.gateDefs.map((g) => ({
    x: Math.floor(g.x * w),
    y: Math.floor(g.y * h),
    w: Math.max(24, Math.floor(g.w * w)),
    h: Math.max(10, Math.floor(g.h * h)),
    passed: false,
  }));

  walls = [];
  walls.push({ x: 0, y: 0, w: t, h: h });
  walls.push({ x: w - t, y: 0, w: t, h: h });
  walls.push({ x: 0, y: 0, w: w, h: t });
  walls.push({ x: 0, y: h - t, w: w, h: t });

  //horizontal walls
  const horizontalYs = [
    Math.floor(h * 0.22),
    Math.floor(h * 0.46),
    Math.floor(h * 0.7),
  ];

  horizontalYs.forEach((yy) => {
    const wallY = yy - Math.floor(t / 2);
    let segments = [{ x1: m, x2: w - m }];

    layoutConfig.gateDefs.forEach((gd) => {
      const gx = Math.floor(gd.x * w);
      const gw = Math.max(24, Math.floor(gd.w * w));
      const gy = Math.floor(gd.y * h);
      const gh = Math.max(10, Math.floor(gd.h * h));

      if (Math.abs(gy - yy) < gh + t) {
        const newSegs = [];
        segments.forEach((s) => {
          if (gx > s.x1 + 10 && gx < s.x2 - 10) {
            newSegs.push({ x1: s.x1, x2: gx - 4 });
            newSegs.push({ x1: gx + gw + 4, x2: s.x2 });
          } else if (gx + gw < s.x2 - 10 && gx + gw > s.x1 + 10) {
            newSegs.push(s);
          }
        });
        if (newSegs.length > 0) segments = newSegs;
      }
    });

    segments.forEach((s) => {
      const segW = Math.max(20, s.x2 - s.x1);
      if (segW > 30) {
        walls.push({ x: s.x1, y: wallY, w: segW, h: t });
      }
    });
  });

  //vertical walls
  walls.push({
    x: Math.floor(w * 0.4),
    y: Math.floor(h * 0.31),
    w: t,
    h: Math.floor(h * 0.14),
  });
  walls.push({
    x: Math.floor(w * 0.66),
    y: Math.floor(h * 0.47),
    w: t,
    h: Math.floor(h * 0.14),
  });
  walls.push({
    x: Math.floor(w * 0.32),
    y: Math.floor(h * 0.55),
    w: t,
    h: Math.floor(h * 0.14),
  });
  walls.push({
    x: Math.floor(w * 0.44),
    y: Math.floor(h * 0.84),
    w: t,
    h: Math.floor(h * 0.14),
  });

  ball.x = startZone.x + startZone.w / 2;
  ball.y = startZone.y + startZone.h / 2;
  ball.vx = 0;
  ball.vy = 0;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildLayout();
}

resizeCanvas();

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWalls();
  drawZone(startZone, "rgba(110, 231, 183, 0.2)", "START");
  drawZone(endZone, "rgba(239, 68, 68, 0.2)", "END");
  drawGates();
  drawBall();
}

function loop() {
  updateBall();
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
  if (status !== "playing") return;

  if (e.key === "w" || e.key === "W") setGravity(0, -0.5, "up");
  if (e.key === "s" || e.key === "S") setGravity(0, 0.5, "down");
  if (e.key === "a" || e.key === "A") setGravity(-0.5, 0, "left");
  if (e.key === "d" || e.key === "D") setGravity(0.5, 0, "right");
});

document.querySelectorAll(".gravity-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (status !== "playing") return;
    const key = btn.dataset.key;
    if (key === "w") setGravity(0, -0.4, "up");
    if (key === "s") setGravity(0, 0.4, "down");
    if (key === "a") setGravity(-0.4, 0, "left");
    if (key === "d") setGravity(0.4, 0, "right");
  });
});

window.addEventListener("resize", resizeCanvas);

document.getElementById("startBtn").addEventListener("click", () => {
  challengeMode = document.getElementById("challengeMode").checked;
  status = "playing";
  document.getElementById("status").textContent = "Playing";
  document.getElementById("startBtn").style.display = "none";

  if (challengeMode) {
    document.getElementById("timer").classList.add("active");
    startTimer();
  }
});

function replay() {
  document.getElementById("victoryModal").classList.remove("show");
  resizeCanvas();
  gates.forEach((g) => (g.passed = false));
  score = 0;
  document.getElementById("score").textContent = score;
  document.getElementById("gates").textContent = `0/${gates.length}`;
  status = "playing";
  document.getElementById("status").textContent = "Playing";
  document.getElementById("startBtn").style.display = "none";
  setGravity(0, 0.5, "down");

  challengeMode = document.getElementById("challengeMode").checked;
  if (challengeMode) {
    document.getElementById("timer").classList.add("active");
    startTimer();
  } else {
    document.getElementById("timer").classList.remove("active");
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
}

document.getElementById("replayBtn").addEventListener("click", replay);

canvas.addEventListener("dblclick", () => {
  document.getElementById("victoryModal").classList.remove("show");
  gates.forEach((g) => (g.passed = false));
  score = 0;
  document.getElementById("score").textContent = score;
  document.getElementById("gates").textContent = `0/${gates.length}`;
  status = "playing";
  document.getElementById("status").textContent = "Playing";
  ball.x = startZone.x + startZone.w / 2;
  ball.y = startZone.y + startZone.h / 2;
  ball.vx = 0;
  ball.vy = 0;
  setGravity(0, 0.5, "down");

  if (challengeMode) {
    startTimer();
  }
});

updateGravityIndicator();
loop();
