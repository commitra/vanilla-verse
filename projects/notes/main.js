const form = document.getElementById('form');
const title = document.getElementById('title');
const tag = document.getElementById('tag');
const content = document.getElementById('content');
const grid = document.getElementById('notes');
const search = document.getElementById('search');
const tagFilter = document.getElementById('tagFilter');
const themeToggle = document.getElementById('themeToggle');

let notes = JSON.parse(localStorage.getItem('notes')) || [];
let currentTheme = localStorage.getItem('theme') || 'dark';

document.body.classList.toggle('light', currentTheme === 'light');
updateThemeIcon();

form.addEventListener('submit', e => {
  e.preventDefault();
  const newNote = {
    id: crypto.randomUUID(),
    title: title.value.trim(),
    tag: tag.value.trim() || null,
    content: content.value.trim(),
    created: Date.now(),
    pinned: false
  };
  notes.unshift(newNote);
  saveNotes();
  title.value = '';
  tag.value = '';
  content.value = '';
  render();
  populateTags();
});

function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function render(filterText = '', tagFilterValue = '') {
  grid.innerHTML = '';
  let filteredNotes = notes.filter(n =>
    (n.title.toLowerCase().includes(filterText.toLowerCase()) ||
    (n.tag && n.tag.toLowerCase().includes(filterText.toLowerCase())) ||
    n.content.toLowerCase().includes(filterText.toLowerCase()))
  );

  if (tagFilterValue) {
    filteredNotes = filteredNotes.filter(n => n.tag && n.tag.toLowerCase() === tagFilterValue.toLowerCase());
  }

  if (filteredNotes.length === 0) {
    grid.innerHTML = `<p style="text-align: center; opacity: 0.6;">No notes found.</p>`;
    return;
  }

  filteredNotes.sort((a, b) => b.pinned - a.pinned || b.created - a.created);

  for (const n of filteredNotes) {
    const card = document.createElement('article');
    card.className = 'card';
    const date = new Date(n.created).toLocaleString();
    card.innerHTML = `
      <div class="card-header">
        <h3>${n.title}</h3>
        <button class="pin">${n.pinned ? '📌' : '📍'}</button>
      </div>
      ${n.tag ? `<span class="tag">${n.tag}</span>` : ''}
      <p>${n.content}</p>
      <div class="note-footer">
        <small>${date}</small>
        <button class="del">Delete</button>
      </div>
    `;

    card.querySelector('.del').addEventListener('click', () => {
      notes = notes.filter(x => x.id !== n.id);
      saveNotes();
      render(search.value, tagFilter.value);
      populateTags();
    });

    card.querySelector('.pin').addEventListener('click', () => {
      n.pinned = !n.pinned;
      saveNotes();
      render(search.value, tagFilter.value);
    });

    grid.appendChild(card);
  }
}

function populateTags() {
  const tags = [...new Set(notes.filter(n => n.tag).map(n => n.tag))];
  tagFilter.innerHTML = `<option value="">All Tags</option>`;
  tags.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    tagFilter.appendChild(opt);
  });
}

search.addEventListener('input', () => render(search.value, tagFilter.value));
tagFilter.addEventListener('change', () => render(search.value, tagFilter.value));

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  currentTheme = document.body.classList.contains('light') ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  updateThemeIcon();
});

function updateThemeIcon() {
  themeToggle.textContent = document.body.classList.contains('light') ? '🌞' : '🌙';
}

render();
populateTags();
