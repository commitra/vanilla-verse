let secs = 25 * 60, t, running = false; const timeEl = document.getElementById('time');
function fmt(s) { const m = Math.floor(s / 60), r = s % 60; return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`; }
function render() { timeEl.textContent = fmt(secs); }
function tick() { if (secs > 0) { secs--; render(); } else { clearInterval(t); running = false; alert('Time!'); } }
document.getElementById('start').addEventListener('click', () => { if (running) return; running = true; t = setInterval(tick, 1000); });
document.getElementById('reset').addEventListener('click', () => { clearInterval(t); running = false; secs = 25 * 60; render(); });
render();
// TODOs: settings for work/break; notifications; sound; stats history
