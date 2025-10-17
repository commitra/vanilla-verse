import { loadProjects } from './projects.js';

const projectsContainer = document.getElementById('projects');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('categoryFilter');
const themeToggle = document.getElementById('themeToggle');

let allProjects = [];

// Fetch and initialize projects
async function initProjects() {
    try {
        const response = await fetch('data/projects.json');
        if (!response.ok) throw new Error('Failed to load projects');
        allProjects = await response.json();
        renderProjects(allProjects);
        setupEventListeners();
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsContainer.textContent = 'Failed to load projects. Please refresh.';
    }
}

// Sanitize text to prevent XSS
function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Create project card with safe DOM methods
function createProjectCard(project) {
    const card = document.createElement('article');
    card.className = 'project-card';
    
    const link = document.createElement('a');
    // Validate slug to ensure it's alphanumeric with hyphens
    const safeSlug = project.slug.replace(/[^a-z0-9\-]/g, '');
    link.href = `projects/${safeSlug}/index.html`;
    
    const title = document.createElement('h2');
    title.textContent = project.title; // Safe: textContent
    
    const description = document.createElement('p');
    description.textContent = project.description; // Safe: textContent
    
    const meta = document.createElement('div');
    meta.className = 'project-meta';
    
    const category = document.createElement('span');
    category.className = 'category-badge';
    category.textContent = project.category;
    
    const difficulty = document.createElement('span');
    difficulty.className = `difficulty-badge difficulty-${project.difficulty}`;
    difficulty.textContent = project.difficulty;
    
    meta.appendChild(category);
    meta.appendChild(difficulty);
    
    link.appendChild(title);
    link.appendChild(description);
    link.appendChild(meta);
    
    card.appendChild(link);
    return card;
}

// Filter projects based on search and category
function filterProjects() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    
    const filtered = allProjects.filter(project => {
        const matchesSearch = 
            project.title.toLowerCase().includes(searchTerm) ||
            project.description.toLowerCase().includes(searchTerm);
        
        const matchesCategory = 
            selectedCategory === 'all' || project.categoryKey === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    renderProjects(filtered);
}

// Safely render projects
function renderProjects(projects) {
    projectsContainer.innerHTML = ''; // Safe: we control the content
    
    if (projects.length === 0) {
        const message = document.createElement('p');
        message.className = 'no-results';
        message.textContent = 'No projects found. Try a different search.';
        projectsContainer.appendChild(message);
        return;
    }
    
    projects.forEach(project => {
        const card = createProjectCard(project);
        projectsContainer.appendChild(card);
    });
}

// Theme toggle
function setupThemeToggle() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

// Setup event listeners with debouncing
function setupEventListeners() {
    let debounceTimer;
    
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(filterProjects, 300);
    });
    
    categoryFilter.addEventListener('change', filterProjects);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    initProjects();
});