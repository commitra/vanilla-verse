const data = [{ q: '2 + 2 = ?', a: ['3', '4', '5'], c: 1 }, { q: 'Capital of France?', a: ['Berlin', 'Paris', 'Rome'], c: 1 }];
let i = 0, score = 0; const q = document.getElementById('q'), answers = document.getElementById('answers'), result = document.getElementById('result');
function render() { if (i >= data.length) { q.textContent = 'Done!'; answers.innerHTML = ''; result.textContent = `Score: ${score}/${data.length}`; return; } const cur = data[i]; q.textContent = cur.q; answers.innerHTML = ''; cur.a.forEach((ans, idx) => { const b = document.createElement('button'); b.textContent = ans; b.addEventListener('click', () => { if (idx === cur.c) score++; i++; render(); }); answers.appendChild(b); }); }
render();
// TODOs: categories; shuffle; timer; high-scores; import JSON question sets
