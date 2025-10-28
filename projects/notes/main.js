const form = document.getElementById('form');
const title = document.getElementById('title');
const tag = document.getElementById('tag');
const content = document.getElementById('content');
const grid = document.getElementById('notes');
const search = document.getElementById('search');
const tagFilter = document.getElementById('tagFilter');
const sortNotes = document.getElementById('sortNotes');
const themeToggle = document.getElementById('themeToggle');
const clearButton = document.getElementById('clear-form');
const titleCount = document.getElementById('title-count');
const contentCount = document.getElementById('content-count');
const autosaveStatus = document.getElementById('autosaveStatus');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

let notes = JSON.parse(localStorage.getItem('notes')) || [];
let currentTheme = localStorage.getItem('theme') || 'dark';
let undoStack = [];
let redoStack = [];
let autosaveTimer;

// Initialize theme
document.body.classList.toggle('light', currentTheme === 'light');
updateThemeIcon();

// Character counters
title.addEventListener('input', () => {
  titleCount.textContent = title.value.length;
});
content.addEventListener('input', () => {
  contentCount.textContent = content.value.length;
  pushToUndoStack();
});

// Autosave simulation
[title, tag, content].forEach(el => {
  el.addEventListener('input', () => {
    autosaveStatus.textContent = 'Saving...';
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveNotes();
      autosaveStatus.textContent = 'Saved';
    }, 1000);
  });
});

// Undo/Redo logic
function pushToUndoStack() {
  undoStack.push(content.value);
  if (undoStack.length > 50) undoStack.shift();
}

undoBtn.addEventListener('click', () => {
  if (undoStack.length > 0) {
    redoStack.push(content.value);
    content.value = undoStack.pop();
    contentCount.textContent = content.value.length;
  }
});

redoBtn.addEventListener('click', () => {
  if (redoStack.length > 0) {
    undoStack.push(content.value);
    content.value = redoStack.pop();
    contentCount.textContent = content.value.length;
  }
});

// Form submission
form.addEventListener('submit', e => {
  e.preventDefault();

  const submitButton = form.querySelector('.btn-primary');
  const originalText = submitButton.textContent;

  submitButton.classList.add('loading');
  submitButton.textContent = 'Adding...';
  submitButton.disabled = true;

  setTimeout(() => {
    const newNote = {
      id: crypto.randomUUID(),
      title: title.value.trim(),
      tag: tag.value || null,
      content: content.value.trim(),
      created: Date.now(),
      pinned: false
    };

    notes.unshift(newNote);
    saveNotes();

    form.classList.add('submit-success');
    setTimeout(() => {
      form.classList.remove('submit-success');
      resetForm();
      submitButton.classList.remove('loading');
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }, 300);

    render(search.value, tagFilter.value, sortNotes.value);
    populateTags();
  }, 800);
});

// Clear form
clearButton.addEventListener('click', () => {
  resetForm();
  title.focus();
});

function resetForm() {
  form.reset();
  titleCount.textContent = '0';
  contentCount.textContent = '0';
  autosaveStatus.textContent = 'Saved';
  undoStack = [];
  redoStack = [];
}

function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function render(filterText = '', tagFilterValue = '', sortBy = 'latest') {
  grid.innerHTML = '';
  let filteredNotes = notes.filter(n =>
    (n.title.toLowerCase().includes(filterText.toLowerCase()) ||
    (n.tag && n.tag.toLowerCase().includes(filterText.toLowerCase())) ||
    n.content.toLowerCase().includes(filterText.toLowerCase()))
  );

  if (tagFilterValue) {
    filteredNotes = filteredNotes.filter(n => n.tag && n.tag.toLowerCase() === tagFilterValue.toLowerCase());
  }

  if (sortBy === 'title') {
    filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    filteredNotes.sort((a, b) => b.pinned - a.pinned || b.created - a.created);
  }

  if (filteredNotes.length === 0) {
    grid.innerHTML = `<p style="text-align: center; opacity: 0.6; grid-column: 1 / -1; padding: 2rem;">No notes found.</p>`;
    return;
  }

  for (const n of filteredNotes) {
    const card = document.createElement('article');
    card.className = 'card';
    const date = new Date(n.created).toLocaleString();
    card.innerHTML = `
      <div class="card-header">
        <h3>${escapeHtml(n.title)}</h3>
        <button class="pin" aria-label="${n.pinned ? 'Unpin note' : 'Pin note'}">${n.pinned ? '📌' : '📍'}</button>
      </div>
      ${n.tag ? `<span class="tag">#${escapeHtml(n.tag)}</span>` : ''}
      <p class="note-preview">${escapeHtml(n.content.slice(0, 100))}...</p>
      <div class="note-footer">
        <small class="note-timestamp">Last edited: ${date}</small>
        <button class="del" aria-label="Delete note">Delete</button>
      </div>
    `;

    card.querySelector('.del').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(x => x.id !== n.id);
        saveNotes();
        render(search.value, tagFilter.value, sortNotes.value);
        populateTags();
      }
    });

    card.querySelector('.pin').addEventListener('click', () => {
      n.pinned = !n.pinned;
      saveNotes();
      render(search.value, tagFilter.value, sortNotes.value);
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

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Search debounce
let searchTimeout;
search.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    render(search.value, tagFilter.value, sortNotes.value);
  }, 300);
});

tagFilter.addEventListener('change', () => {
  render(search.value, tagFilter.value, sortNotes.value);
});

sortNotes.addEventListener('change', () => {
  render(search.value, tagFilter.value, sortNotes.value);
});

// Theme toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  currentTheme = document.body.classList.contains('light') ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
  updateThemeIcon();
});

function updateThemeIcon() {
  themeToggle.textContent = document.body.classList.contains('light') ? '🌞' : '🌙';
}

// Focus on title input
window.addEventListener('load', () => {
  title.focus();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    search.focus();
  }

  if (e.key === 'Escape' && document.activeElement === search) {
    search.value = '';
    render('', tagFilter.value, sortNotes.value);
  }

  if (e.ctrlKey && e.key === 'k' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    resetForm();
    title.focus();
  }
});

// Initialize
render();
populateTags();
