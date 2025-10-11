const textEl = document.getElementById('text'); const input = document.getElementById('input'); const wpmEl = document.getElementById('wpm'); const accEl = document.getElementById('acc');
const sample = 'The quick brown fox jumps over the lazy dog';
let start = null;
function render() { textEl.textContent = sample; }
input.addEventListener('input', () => { if (!start) start = Date.now(); const typed = input.value; let correct = 0; for (let i = 0; i < typed.length; i++) { if (typed[i] === sample[i]) correct++; } const minutes = (Date.now() - start) / 60000; const wpm = Math.round((typed.length / 5) / Math.max(minutes, 1 / 60)); const acc = Math.round((correct / Math.max(typed.length, 1)) * 100); wpmEl.textContent = String(wpm); accEl.textContent = String(acc); });
render();
// TODOs: timer; multi-sentence corpus; per-char coloring; history
