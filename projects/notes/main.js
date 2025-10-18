const form = document.getElementById('form');
const title = document.getElementById('title');
const tag = document.getElementById('tag');
const grid = document.getElementById('notes');

let notes = [];

form.addEventListener('submit', e => {
    e.preventDefault();
    notes.unshift({
        id: crypto.randomUUID(),
        title: title.value,
        tag: tag.value || null,
        created: Date.now(),
        pinned: false
    });
    title.value = '';
    tag.value = '';
    render();
});

function render() {
    grid.innerHTML = '';

    // Separate pinned and unpinned notes
    const pinnedNotes = notes.filter(n => n.pinned);
    const unpinnedNotes = notes.filter(n => !n.pinned);

    // Render pinned notes first
    if (pinnedNotes.length > 0) {
        const pinnedLabel = document.createElement('div');
        pinnedLabel.className = 'section-label';
        pinnedLabel.textContent = 'PINNED';
        grid.appendChild(pinnedLabel);
        pinnedNotes.forEach(renderCard);
    }

    // Render unpinned notes
    if (unpinnedNotes.length > 0) {
        if (pinnedNotes.length > 0) {
            const otherLabel = document.createElement('div');
            otherLabel.className = 'section-label';
            otherLabel.textContent = 'OTHER NOTES';
            grid.appendChild(otherLabel);
        }
        unpinnedNotes.forEach(renderCard);
    }

    // Show empty state if no notes
    if (notes.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'No notes yet. Create one to get started!';
        grid.appendChild(empty);
    }
}

function renderCard(n) {
    const card = document.createElement('article');
    card.className = `card ${n.pinned ? 'pinned' : ''}`;
    card.innerHTML = `
        <h3>${n.title}</h3>
        ${n.tag ? `<span class="tag">${n.tag}</span>` : ''}
        <div class="card-actions">
            <button class="pin" title="${n.pinned ? 'Unpin' : 'Pin'}">${n.pinned ? 'unpin' : 'pin'}</button>
            <button class="del">Delete</button>
        </div>
    `;

    card.querySelector('.pin').addEventListener('click', () => {
        const note = notes.find(x => x.id === n.id);
        note.pinned = !note.pinned;
        render();
    });

    card.querySelector('.del').addEventListener('click', () => {
        notes = notes.filter(x => x.id !== n.id);
        render();
    });

    grid.appendChild(card);
}

render();

// TODOs: persist to localStorage; full-text search; list by tag; theme toggle