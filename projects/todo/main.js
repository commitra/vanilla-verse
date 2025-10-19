const form = document.getElementById('form');
const input = document.getElementById('input');
const list = document.getElementById('list');

let items = [];

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    items.push({ id: crypto.randomUUID(), text: input.value.trim(), done: false });
    input.value = '';
    render();
});

function render() {
    list.innerHTML = '';
    for (const it of items) {
        const li = document.createElement('li');
        if (it.done) li.classList.add('done');

        li.innerHTML = `
            <label>
                <input type="checkbox" ${it.done ? 'checked' : ''}>
                <span>${escapeHTML(it.text)}</span>
            </label>
            <button class="del" aria-label="Delete">×</button>
        `;

        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            it.done = e.target.checked;
            li.classList.toggle('done', it.done);
        });

        li.querySelector('.del').addEventListener('click', () => {
            items = items.filter((x) => x.id !== it.id);
            render();
        });

        list.appendChild(li);
    }
}

render();
// TODOs: save to localStorage; add filter (all/active/done); sort; theme switcher
