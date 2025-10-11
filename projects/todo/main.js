const form = document.getElementById('form'); const input = document.getElementById('input'); const list = document.getElementById('list');
let items = [];
form.addEventListener('submit', e => { e.preventDefault(); items.push({ id: crypto.randomUUID(), text: input.value, done: false }); input.value = ''; render(); });
function render() { list.innerHTML = ''; for (const it of items) { const li = document.createElement('li'); li.innerHTML = `<label><input type="checkbox" ${it.done ? 'checked' : ''}> ${it.text}</label> <button class="del">×</button>`; li.querySelector('input').addEventListener('change', e => { it.done = e.target.checked; }); li.querySelector('.del').addEventListener('click', () => { items = items.filter(x => x.id !== it.id); render(); }); list.appendChild(li); } }
render();
// TODOs: save to localStorage; add filter (all/active/done); sort; theme switcher
