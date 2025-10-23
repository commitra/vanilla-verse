// contributors.js
// Minimal, dependency-free module to fetch & render contributors for commitra/vanilla-verse
// Place alongside index.html and styles.css and open index.html in a browser.
// --- Notes ---
// To avoid GitHub API rate limits for unauthenticated requests, provide a token:
// 1) Create a personal access token with "public_repo" (no scopes needed for public data).
// 2) Paste it below as `GITHUB_TOKEN` or set in localStorage under key "GH_TOKEN".
// Keep tokens private — don't commit them to public repos. For production use – use server-side token proxy.

const OWNER = 'commitra';
const REPO = 'vanilla-verse';

const GITHUB_TOKEN = ''; // <-- optional: paste token here (or store in localStorage 'GH_TOKEN')

const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contributors?per_page=100`;

/** Utility: small GitHub icon (SVG) */
function githubIconSVG() {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .5C5.73.5.98 5.24.98 11.5c0 4.64 3.01 8.58 7.19 9.97.53.1.72-.23.72-.51 0-.25-.01-.91-.01-1.79-2.92.64-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.55-1.17-1.55-.96-.66.07-.65.07-.65 1.06.08 1.62 1.09 1.62 1.09.94 1.6 2.48 1.14 3.08.87.09-.68.37-1.14.67-1.4-2.33-.27-4.78-1.16-4.78-5.17 0-1.14.41-2.07 1.08-2.8-.11-.27-.47-1.36.1-2.83 0 0 .88-.28 2.88 1.07A9.9 9.9 0 0112 6.8c.89.004 1.78.12 2.62.35 2-.35 2.88-1.07 2.88-1.07.57 1.47.21 2.56.1 2.83.67.73 1.08 1.66 1.08 2.8 0 4.02-2.46 4.89-4.8 5.15.38.33.72.98.72 1.98 0 1.43-.01 2.58-.01 2.94 0 .28.19.61.73.51 4.18-1.39 7.19-5.33 7.19-9.97C23.02 5.24 18.27.5 12 .5z" fill="currentColor"/>
  </svg>`;
}

/** Simple loading skeleton card */
function skeletonCard() {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="avatar" aria-hidden="true"><div style="width:100%;height:100%;background:linear-gradient(90deg,#0b2134,#0b2842)"></div></div>
    <div class="info" style="min-width:0">
      <div style="width:80%;height:14px;background:rgba(255,255,255,0.04);border-radius:8px"></div>
      <div style="height:10px;margin-top:10px;width:40%;background:rgba(255,255,255,0.02);border-radius:6px"></div>
    </div>`;
  return el;
}

/** Render contributors array */
function renderContributors(list) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  if (!Array.isArray(list) || list.length === 0) {
    grid.innerHTML = `<div class="empty">No contributors found.</div>`;
    document.getElementById('count').textContent = '0 contributors';
    return;
  }

  document.getElementById('count').textContent = `${list.length} contributor${list.length>1 ? 's':''}`;

  list.forEach(user => {
    const card = document.createElement('article');
    card.className = 'card';
    const username = user.login || 'unknown';
    const profileUrl = user.html_url || `https://github.com/${username}`;
    const avatar = user.avatar_url || '';
    const contributions = user.contributions ?? 0;

    card.innerHTML = `
      <div class="avatar" title="${username}">
        <img loading="lazy" alt="${username}'s avatar" src="${avatar}" />
      </div>
      <div class="info">
        <div class="name">
          <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="link" style="color:inherit;text-decoration:none;">
            <span>${username}</span>
          </a>
          <span class="badge" aria-hidden="true">${githubIconSVG()}<span style="margin-left:6px">${contributions}</span></span>
        </div>
        <div class="username">@${username}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

/** Fetch contributors from GitHub API */
async function fetchContributors() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  // show some skeletons
  for (let i=0;i<6;i++) grid.appendChild(skeletonCard());

  // token fallback: localStorage > in-file constant
  const maybeToken = localStorage.getItem('GH_TOKEN') || GITHUB_TOKEN || '';
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (maybeToken) headers['Authorization'] = `token ${maybeToken}`;

  try {
    const resp = await fetch(API_URL, { headers });
    if (resp.status === 403) {
      // Rate limited or forbidden
      const reset = resp.headers.get('x-ratelimit-reset');
      let msg = 'Rate limit exceeded or access forbidden.';
      if (reset) {
        const when = new Date(parseInt(reset,10)*1000);
        msg += ` Rate limit resets at ${when.toLocaleString()}.`;
      }
      grid.innerHTML = `<div class="empty">${msg} <br/>Tip: add a token to avoid limits.</div>`;
      document.getElementById('count').textContent = '0 contributors';
      return [];
    }
    if (!resp.ok) {
      const text = await resp.text();
      grid.innerHTML = `<div class="empty">Failed to load contributors. (${resp.status})</div>`;
      console.error('GitHub API error', resp.status, text);
      document.getElementById('count').textContent = '0 contributors';
      return [];
    }
    const data = await resp.json();
    // data is an array of contributors; map to consistent fields
    const mapped = data.map(u => ({
      login: u.login,
      html_url: u.html_url,
      avatar_url: u.avatar_url,
      contributions: u.contributions
    }));
    renderContributors(mapped);
    return mapped;
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="empty">Network error while fetching contributors.</div>`;
    document.getElementById('count').textContent = '0 contributors';
    return [];
  }
}

/** Helpers: search & sort */
function applySearchSort(data) {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const sort = document.getElementById('sort').value;

  let filtered = data.filter(u => {
    if (!q) return true;
    return (u.login && u.login.toLowerCase().includes(q));
  });

  if (sort === 'contributions-desc') filtered.sort((a,b)=> (b.contributions||0) - (a.contributions||0));
  if (sort === 'contributions-asc') filtered.sort((a,b)=> (a.contributions||0) - (b.contributions||0));
  if (sort === 'name-asc') filtered.sort((a,b)=> (a.login||'').localeCompare(b.login||''));
  if (sort === 'name-desc') filtered.sort((a,b)=> (b.login||'').localeCompare(a.login||''));
  renderContributors(filtered);
}

/** Bind UI */
async function init() {
  const data = await fetchContributors();
  // attach listeners
  document.getElementById('search').addEventListener('input', () => applySearchSort(data));
  document.getElementById('sort').addEventListener('change', () => applySearchSort(data));

  // keyboard shortcut: press "t" to toggle token prompt (for dev use)
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'T' || e.key === 't') {
      const current = localStorage.getItem('GH_TOKEN') || '';
      const newToken = prompt('Enter GitHub token (will be stored in localStorage for this page). Leave blank to clear.', current);
      if (newToken === null) return;
      if (newToken.trim()) {
        localStorage.setItem('GH_TOKEN', newToken.trim());
        alert('Token saved to localStorage. Refreshing...');
      } else {
        localStorage.removeItem('GH_TOKEN');
        alert('Token cleared. Refreshing...');
      }
      window.location.reload();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
