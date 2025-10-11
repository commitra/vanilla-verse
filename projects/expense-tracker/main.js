const form = document.getElementById('form'); const desc = document.getElementById('desc'); const amount = document.getElementById('amount'); const list = document.getElementById('list'); const chart = document.getElementById('chart').getContext('2d');
let items = [];
form.addEventListener('submit', e => { e.preventDefault(); items.push({ id: crypto.randomUUID(), desc: desc.value, amount: parseFloat(amount.value) || 0 }); desc.value = ''; amount.value = ''; render(); });
function render() { list.innerHTML = ''; let total = 0; for (const it of items) { total += it.amount; const li = document.createElement('li'); li.textContent = `${it.desc} — $${it.amount.toFixed(2)}`; list.appendChild(li); } drawChart(total); }
function drawChart(total) { const w = 300, h = 150; chart.clearRect(0, 0, w, h); chart.fillStyle = '#17171c'; chart.fillRect(0, 0, w, h); chart.fillStyle = '#6ee7b7'; chart.fillRect(0, h - (total % h), w, (total % h)); }
render();
// TODOs: categories; monthly grouping; pie/bar chart; currency formatting; export
