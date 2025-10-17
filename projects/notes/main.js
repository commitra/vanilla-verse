const form = document.getElementById('form'); const title = document.getElementById('title');
const content = document.getElementById('content');
const tag = document.getElementById('tag');
const grid = document.getElementById('notes');
let notes = [];
form.addEventListener("submit", (e) => {
  e.preventDefault();
  notes.unshift({
    id: crypto.randomUUID(),
    title: title.value,
    content: content.value,
    tag: tag.value || null,
    created: Date.now(),
  });
  title.value = "";
  content.value = "";
  tag.value = "";
  render();
});

function render() {
  grid.innerHTML = "";
  for (const n of notes) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `<h3>${n.title}</h3><p class="notes">${n.content}</p>${
      n.tag ? `<span class="tag">${n.tag}</span>` : ""
    }<button class="del">Delete</button>`;
    card.querySelector(".del").addEventListener("click", () => {
      notes = notes.filter((x) => x.id !== n.id);
      render();
    });
    grid.appendChild(card);
  }
}
render();
// TODOs: persist to localStorage; full-text search; list by tag; theme toggle
