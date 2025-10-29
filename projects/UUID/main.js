const btn = document.getElementById('generate');
const out = document.getElementById('uuid');
const copyBtn = document.getElementById('copy');
const themeToggle = document.getElementById('themeToggle');

// Theme toggle with persistence
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
}

const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// UUID generation (v4)
function uuidv4_fallback() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

function generateUUID() {
    try {
        if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch (e) { }
    return uuidv4_fallback();
}

function showCopiedToast() {
    const t = document.createElement('div');
    t.className = 'copied';
    t.textContent = 'Copied to clipboard';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1400);
}

btn.addEventListener('click', () => {
    const id = generateUUID();
    out.textContent = id;
});

copyBtn.addEventListener('click', async () => {
    const text = out.textContent;
    if (!text || text === '—') return;
    try {
        await navigator.clipboard.writeText(text);
        showCopiedToast();
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showCopiedToast(); }
        catch (err) { alert('Copy failed — select the UUID and press Ctrl/Cmd+C'); }
        ta.remove();
    }
});

out.addEventListener('click', async () => {
    const text = out.textContent;
    if (!text || text === '—') return;
    try { await navigator.clipboard.writeText(text); showCopiedToast(); } catch (e) { }
});
