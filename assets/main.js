import { loadProjects } from "./projects.js";

const searchEl = document.getElementById("search");
const categoryEl = document.getElementById("categoryFilter");
const gridEl = document.getElementById("projects");

let allProjects = [];

function render(projects) {
  gridEl.innerHTML = "";
  if (!projects.length) {
    gridEl.innerHTML = "<p>No projects found.</p>";
    return;
  }

  for (const p of projects) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="meta">
        <span>${p.category}</span>
        ${p.difficulty ? `<span>Level: ${p.difficulty}</span>` : ""}
      </div>
      <a href="${p.href}">Open project</a>
    `;
    gridEl.appendChild(card);
  }
}

function applyFilters() {
  const q = searchEl.value.trim().toLowerCase();
  const cat = categoryEl.value;
  const filtered = allProjects.filter((p) => {
    const inCat = cat === "all" || p.categoryKey === cat;
    const inText =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return inCat && inText;
  });
  render(filtered);
}

(async function init() {
  try {
    allProjects = await loadProjects();
    render(allProjects);

    searchEl.addEventListener("input", applyFilters);
    categoryEl.addEventListener("change", applyFilters);
  } catch (err) {
    console.error("Failed to load projects", err);
    gridEl.innerHTML = "<p>Failed to load projects list.</p>";
  }
})();

const themeToggle = document.getElementById("themeToggle");
const body = document.body;

const currentTheme = localStorage.getItem("theme") || "light";
if (currentTheme === "dark") {
  body.classList.add("dark-mode");
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");

  const theme = body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", theme);
});
document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() == "x") {
    e.preventDefault();
    searchEl.focus();
  }
  if (e.key === "Escape") {
    e.preventDefault();
    searchEl.blur();
  }
});
