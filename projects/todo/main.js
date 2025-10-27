const form = document.getElementById('form');
const input = document.getElementById('input');
const dueInput = document.getElementById('due');
const list = document.getElementById('list');
const counts = document.getElementById('counts');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort');

let items = JSON.parse(localStorage.getItem('todo-items') || '[]');
let filter = 'all';
let sortBy = 'created';

function uid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    // fallback: timestamp + random
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const due = dueInput.value ? new Date(dueInput.value).toISOString() : null;
    items.push({ id: uid(), text, done: false, created: Date.now(), due });
    input.value = '';
    dueInput.value = '';
    saveAndRender();
});

function render() {
    list.innerHTML = '';

    // Apply filter and sort
    let visible = items.slice();
    if (filter === 'active') visible = visible.filter(i => !i.done);
    if (filter === 'completed') visible = visible.filter(i => i.done);

    if (sortBy === 'due') {
        visible.sort((a,b) => {
            if (!a.due && !b.due) return a.created - b.created;
            if (!a.due) return 1;
            if (!b.due) return -1;
            return new Date(a.due) - new Date(b.due);
        });
    } else {
        visible.sort((a,b) => a.created - b.created);
    }

    for (const it of visible) {
        const li = document.createElement('li');
        if (it.done) li.classList.add('done');

        // overdue detection
        const isOverdue = it.due && !it.done && (new Date(it.due) < startOfToday());
        if (isOverdue) li.classList.add('overdue');

        const dueMeta = it.due ? `<small class="meta">Due ${new Date(it.due).toLocaleDateString()}</small>` : '';

        li.innerHTML = `
            <label>
                <input type="checkbox" ${it.done ? 'checked' : ''} aria-label="Mark task as done">
                <span>${escapeHTML(it.text)} ${dueMeta}</span>
            </label>
            <button class="del" aria-label="Delete task">×</button>
        `;

        const checkbox = li.querySelector('input[type=checkbox]');
        checkbox.addEventListener('change', (e) => {
            it.done = e.target.checked;
            li.classList.toggle('done', it.done);
            saveAndRender();
        });

        li.querySelector('.del').addEventListener('click', () => {
            items = items.filter((x) => x.id !== it.id);
            saveAndRender();
        });

        list.appendChild(li);
    }

    updateCounts();
}

function startOfToday() {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
}

function updateCounts() {
    const total = items.length;
    const active = items.filter(i => !i.done).length;
    counts.textContent = `${active} active • ${total} total`;
    // Render pending tasks as short text list (up to 5)
    const pendingEl = document.getElementById('pending-list');
    if (pendingEl) {
        const pending = items.filter(i => !i.done);
        if (!pending.length) {
            pendingEl.textContent = 'No pending tasks';
        } else {
            const max = 5;
            const slice = pending.slice(0, max);
            pendingEl.innerHTML = slice.map(i => `<div class="pending-item">${escapeHTML(i.text)}</div>`).join('');
            if (pending.length > max) {
                const more = pending.length - max;
                pendingEl.insertAdjacentHTML('beforeend', `<div class="muted">+${more} more</div>`);
            }
        }
    }
}

function saveAndRender() {
    localStorage.setItem('todo-items', JSON.stringify(items));
    render();
}

// initialize
render();

// wire filters
filterButtons.forEach(btn => btn.addEventListener('click', (e) => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    render();
}));

sortSelect.addEventListener('change', (e) => { sortBy = e.target.value; render(); });

clearCompletedBtn.addEventListener('click', () => { items = items.filter(i => !i.done); saveAndRender(); });

// theme sync: read global theme from localStorage (some apps use body.dark-mode), apply data-theme
function syncTheme() {
    const theme = localStorage.getItem('theme') || (document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

syncTheme();

// respond to storage changes (theme toggled in another tab or via global control)
window.addEventListener('storage', (e) => {
    if (e.key === 'theme') syncTheme();
});

// keyboard: quick add focus
document.addEventListener('keydown', (e) => {
    if (e.key === 'n') { input.focus(); }
});
