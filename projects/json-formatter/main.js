/*
JSON Formatter & Validator - Features:
-------------------------------------------------
1. Beautify JSON: Format and indent JSON for readability.
2. Minify JSON: Compress JSON to a single line.
3. Validate JSON: Check for syntax errors and highlight issues.
4. Tree Viewer: Visualize JSON structure with expand/collapse nodes.
5. Search: Find keys/values in JSON with instant results.
6. Copy/Download/Upload: Clipboard and file operations for JSON data.
7. Sorting: Sort object keys alphabetically.
8. Auto-validate: Toggle live validation as you type.
9. JSON Statistics: Analyze JSON for keys, arrays, objects, depth, types.
10. Shortcuts: Keyboard shortcuts for beautify, minify, and search.
11. Log Panel: View recent actions and events.
-------------------------------------------------
*/
// Advanced JSON statistics function
function getJSONStats(obj) {
    let stats = {
        totalKeys: 0,
        totalArrays: 0,
        totalObjects: 0,
        maxDepth: 0,
        stringCount: 0,
        numberCount: 0,
        boolCount: 0,
        nullCount: 0
    };
    function walk(node, depth) {
        if (depth > stats.maxDepth) stats.maxDepth = depth;
        if (Array.isArray(node)) {
            stats.totalArrays++;
            node.forEach(v => walk(v, depth + 1));
        } else if (node && typeof node === 'object') {
            stats.totalObjects++;
            Object.entries(node).forEach(([k, v]) => {
                stats.totalKeys++;
                walk(v, depth + 1);
            });
        } else if (typeof node === 'string') stats.stringCount++;
        else if (typeof node === 'number') stats.numberCount++;
        else if (typeof node === 'boolean') stats.boolCount++;
        else if (node === null) stats.nullCount++;
    }
    walk(obj, 1);
    return stats;
}

const btnJSONStats = document.getElementById('btn-json-stats');
const jsonStatsPanel = document.getElementById('json-stats-panel');
let statsVisible = false;
btnJSONStats.addEventListener('click', () => {
    if (!lastValidJSON) {
        alert('No valid JSON loaded.');
        return;
    }
    if (!statsVisible) {
        const stats = getJSONStats(lastValidJSON);
        jsonStatsPanel.innerHTML = `
            <strong>JSON Statistics</strong><br>
            <ul style="margin:8px 0 0 16px;">
                <li>Total Keys: <b>${stats.totalKeys}</b></li>
                <li>Total Arrays: <b>${stats.totalArrays}</b></li>
                <li>Total Objects: <b>${stats.totalObjects}</b></li>
                <li>Max Depth: <b>${stats.maxDepth}</b></li>
                <li>Strings: <b>${stats.stringCount}</b></li>
                <li>Numbers: <b>${stats.numberCount}</b></li>
                <li>Booleans: <b>${stats.boolCount}</b></li>
                <li>Nulls: <b>${stats.nullCount}</b></li>
            </ul>
        `;
        jsonStatsPanel.style.display = 'block';
        btnJSONStats.textContent = 'Hide Stats';
        statsVisible = true;
    } else {
        jsonStatsPanel.style.display = 'none';
        btnJSONStats.textContent = 'JSON Stats';
        statsVisible = false;
    }
});

// Grab UI elements
const codeEl = document.getElementById('code');
const btnBeautify = document.getElementById('btn-beautify');
const btnMinify = document.getElementById('btn-minify');
const btnValidate = document.getElementById('btn-validate');
const btnCopy = document.getElementById('btn-copy');
const btnDownload = document.getElementById('btn-download');
const btnUpload = document.getElementById('btn-upload');
const fileIn = document.getElementById('file-in');
const pillInfo = document.getElementById('pill-info');
const prettyEl = document.getElementById('pretty');
const treeEl = document.getElementById('tree');
const btnTree = document.getElementById('btn-tree');
const btnExpand = document.getElementById('btn-expand');
const btnCollapse = document.getElementById('btn-collapse');
const selIndent = document.getElementById('sel-indent');
const selSort = document.getElementById('sel-sort');
const selAuto = document.getElementById('sel-autovalid');
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');
const btnSample = document.getElementById('btn-sample');
const logEl = document.getElementById('log');

// Internal state
let lastValidJSON = null; // keep a parsed object when last valid
let currentTreeNodes = []; // references to tree nodes for expand/collapse
let autoValidate = true;

function safeParseWithErrorInfo(text) {
    try {
        const parsed = JSON.parse(text);
        return { ok: true, value: parsed };
    } catch (err) {
        const message = (err && err.message) ? err.message : String(err);
        let line = 0, col = 0;
        try {
            const beforeError = findErrorContext(text);
            line = beforeError.line; col = beforeError.col;
        } catch (e) { }
        return { ok: false, error: message, line, col };
    }
}

function findErrorContext(text) {
    const n = text.length;
    let low = 0, high = n;
    let failIndex = n;
    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        try {
            JSON.parse(text.slice(0, mid));
            low = mid + 1;
        } catch (e) {
            failIndex = mid;
            high = mid;
        }
    }
    const upto = text.slice(0, failIndex);
    const lines = upto.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    return { line, col, index: failIndex };
}

function log(...args) {
    const t = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.textContent = `[${t}] ` + args.join(' ');
    logEl.prepend(entry);
}

function beautifyText(raw) {
    const indent = selIndent.value === '\t' ? '\t' : parseInt(selIndent.value, 10);
    const sortMode = selSort.value;
    const parsed = JSON.parse(raw);
    const transformed = sortMode === 'alpha' ? sortObjectDeep(parsed) : parsed;
    return JSON.stringify(transformed, null, indent);
}

function sortObjectDeep(value) {
    if (Array.isArray(value)) {
        return value.map(sortObjectDeep);
    } else if (value && typeof value === 'object') {
        const out = {};
        Object.keys(value).sort().forEach(k => {
            out[k] = sortObjectDeep(value[k]);
        });
        return out;
    }
    return value;
}

function minifyText(raw) {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed);
}

function renderPretty(text) {
    const escaped = escapeHtml(text);
    const colored = escaped
        .replace(/(&quot;)(.*?)(?=&quot;:\s)/g, '<span class="hl-key">$1$2</span>')
        .replace(/(&quot;)((?:\\.|.)*?)(?=&quot;[,\n\r\s]*[}\]])/g, '<span class="hl-str">$1$2</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-num">$1</span>')
        .replace(/\b(true|false)\b/g, '<span class="hl-bool">$1</span>')
        .replace(/\b(null)\b/g, '<span class="hl-null">$1</span>');
    prettyEl.innerHTML = colored;
}

function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildTree(obj, container) {
    container.innerHTML = '';
    currentTreeNodes = [];
    const root = createNode('root', obj);
    container.appendChild(root);
}

function createNode(key, value, depth = 0) {
    const li = document.createElement('div');
    li.className = 'node';
    const isObject = value && typeof value === 'object';
    const row = document.createElement('div');
    row.className = 'node-row';
    if (isObject) {
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'toggle-btn';
        toggleBtn.textContent = '+';
        const keySpan = document.createElement('span');
        keySpan.className = 'key';
        keySpan.textContent = key === 'root' ? '' : key;
        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = Array.isArray(value)
            ? `[${value.length}]`
            : `{${Object.keys(value).length}}`;
        row.append(toggleBtn, keySpan, meta);
        li.appendChild(row);
        const children = document.createElement('div');
        children.className = 'child-container';
        children.style.display = 'none';
        toggleBtn.addEventListener('click', () => {
            const isVisible = children.style.display !== 'none';
            if (isVisible) {
                children.style.display = 'none';
                toggleBtn.textContent = '+';
            } else {
                children.style.display = 'block';
                toggleBtn.textContent = '-';
            }
        });
        if (Array.isArray(value)) {
            value.forEach((v, i) => children.appendChild(createNode('[' + i + ']', v, depth + 1)));
        } else {
            Object.entries(value).forEach(([k, v]) => children.appendChild(createNode(k, v, depth + 1)));
        }
        li.appendChild(children);
        currentTreeNodes.push({ li, children, toggleBtn });
    } else {
        const spacer = document.createElement('span');
        spacer.className = 'toggle-btn';
        spacer.textContent = '';
        const keySpan = document.createElement('span');
        keySpan.className = 'key';
        keySpan.textContent = key;
        const valSpan = document.createElement('span');
        valSpan.className = 'val';
        valSpan.textContent = typeof value === 'string' ? '"' + value + '"' : String(value);
        row.append(spacer, keySpan, valSpan);
        li.appendChild(row);
    }
    return li;
}

function expandAll() {
    currentTreeNodes.forEach(n => {
        if (n.children) {
            n.children.style.display = 'block';
            if (n.toggleBtn) n.toggleBtn.textContent = '-';
        }
    });
}
function collapseAll() {
    currentTreeNodes.forEach(n => {
        if (n.children) {
            n.children.style.display = 'none';
            if (n.toggleBtn) n.toggleBtn.textContent = '+';
        }
    });
}

function searchInJSON(query) {
    const txt = codeEl.value;
    if (!query) { searchResults.textContent = 'Empty query'; return; }
    try {
        const parsed = JSON.parse(txt);
        const matches = [];
        deepSearch(parsed, '', query.toLowerCase(), matches);
        renderSearchResults(matches);
    } catch (e) {
        searchResults.textContent = 'Cannot search: invalid JSON';
    }
}

function renderSearchResults(matches) {
    searchResults.innerHTML = '';
    if (matches.length === 0) {
        searchResults.textContent = 'No matches';
        return;
    }
    matches.forEach(m => {
        const d = document.createElement('div');
        d.style.padding = '6px 8px';
        d.style.borderRadius = '8px';
        d.style.marginBottom = '6px';
        d.style.background = 'rgba(255,255,255,0.01)';
        d.textContent = m.path + ' : ' + JSON.stringify(m.value);
        searchResults.appendChild(d);
    });
}

function deepSearch(node, path, q, out) {
    if (node && typeof node === 'object') {
        if (Array.isArray(node)) {
            node.forEach((v, i) => deepSearch(v, path + '[' + i + ']', q, out));
        } else {
            Object.entries(node).forEach(([k, v]) => {
                if (k.toLowerCase().includes(q)) out.push({ path: path ? path + '.' + k : k, value: v });
                if (typeof v === 'string' && v.toLowerCase().includes(q)) out.push({ path: path ? path + '.' + k : k, value: v });
                deepSearch(v, path ? path + '.' + k : k, q, out);
            });
        }
    } else {
        if (String(node).toLowerCase().includes(q)) out.push({ path, value: node });
    }
}

function downloadJSON() {
    const blob = new Blob([codeEl.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    log('Downloaded JSON');
}

async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(codeEl.value);
        pillInfo.textContent = 'Copied';
        setTimeout(() => pillInfo.textContent = 'Idle', 1200);
        log('Copied to clipboard');
    } catch (e) {
        alert('Copy failed: ' + e.message);
    }
}

function handleUploadFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
        codeEl.value = e.target.result;
        log('Loaded file: ' + file.name);
        if (autoValidate) runValidate();
    };
    reader.readAsText(file);
}

const SAMPLES = {
    simple: '{\n  "name": "vanilla-verse",\n  "type": "collection",\n  "count": 12\n}',
    complex: '{\n  "users": [\n    {"id": 1, "name": "Asha", "roles": ["admin","editor"]},\n    {"id": 2, "name": "Vikram", "roles": []}\n  ],\n  "meta": {"created": "2024-08-01T12:00:00Z", "tags": ["demo","json"]}\n}',
    nested: '{\n  "level1": {\n    "level2": {\n      "arr": [1,2,3,{"deep": true}]\n    }\n  }\n}'
};

function runValidate() {
    const text = codeEl.value.trim();
    if (!text) {
        pillInfo.textContent = 'Empty';
        pillInfo.className = 'pill';
        prettyEl.textContent = '';
        treeEl.innerHTML = '';
        return;
    }
    const res = safeParseWithErrorInfo(text);
    if (res.ok) {
        pillInfo.textContent = 'Valid JSON';
        pillInfo.className = 'pill ok';
        // Apply sorting if selected
        let sortedJSON = selSort.value === 'alpha' ? sortObjectDeep(res.value) : res.value;
        lastValidJSON = sortedJSON;
        try {
            const pretty = JSON.stringify(sortedJSON, null, selIndent.value === '\t' ? '\t' : parseInt(selIndent.value, 10));
            renderPretty(pretty);
            buildTree(sortedJSON, treeEl);
        } catch (e) {
            renderPretty(text);
        }
        log('Validation OK');
    } else {
        pillInfo.textContent = 'Invalid: ' + res.error;
        pillInfo.className = 'pill err';
        const lines = codeEl.value.split('\n');
        const ln = res.line || 0; const col = res.col || 0;
        const start = Math.max(0, ln - 3);
        const snippet = lines.slice(start, ln + 2).map((l, i) => {
            const num = (start + i + 1).toString().padStart(3, ' ');
            return num + ' | ' + l;
        }).join('\n');
        prettyEl.textContent = snippet + '\n\nError: ' + res.error + (ln ? (' at line ' + ln + ', col ' + col) : '');
        treeEl.innerHTML = '';
        log('Validation failed');
    }
}

btnBeautify.addEventListener('click', () => {
    try {
        const b = beautifyText(codeEl.value);
        codeEl.value = b;
        runValidate();
        log('Beautified');
    } catch (e) {
        alert('Beautify failed: ' + e.message);
    }
});

btnMinify.addEventListener('click', () => {
    try {
        const m = minifyText(codeEl.value);
        codeEl.value = m;
        runValidate();
        log('Minified');
    } catch (e) {
        alert('Minify failed: ' + e.message);
    }
});

btnValidate.addEventListener('click', () => { runValidate(); });
btnCopy.addEventListener('click', () => { copyToClipboard(); });
btnDownload.addEventListener('click', () => { downloadJSON(); });
btnUpload.addEventListener('click', () => { fileIn.click(); });
fileIn.addEventListener('change', (e) => { const f = e.target.files[0]; if (f) handleUploadFile(f); });

btnTree.addEventListener('click', () => {
    if (!lastValidJSON) { alert('No valid JSON to build tree from'); return; }
    buildTree(lastValidJSON, treeEl);
    expandAll(); // Always expand after building for better visibility
    // Ensure treeEl is visible (in case hidden by CSS)
    if (treeEl && treeEl.parentElement) {
        treeEl.parentElement.style.display = '';
    }
});
btnExpand.addEventListener('click', expandAll);
btnCollapse.addEventListener('click', collapseAll);

searchInput.addEventListener('input', (e) => { searchInJSON(e.target.value); });
selAuto.addEventListener('change', (e) => { autoValidate = e.target.value === 'on'; });
selSort.addEventListener('change', () => { runValidate(); });
btnSample.addEventListener('click', () => { codeEl.value = SAMPLES.complex; runValidate(); });

document.addEventListener('keydown', (e) => {
    const cmd = (e.ctrlKey || e.metaKey);
    if (cmd && e.key.toLowerCase() === 'b') {
        e.preventDefault(); btnBeautify.click();
    }
    if (cmd && e.key.toLowerCase() === 'm') {
        e.preventDefault(); btnMinify.click();
    }
    if (cmd && e.key.toLowerCase() === 'f') {
        if (document.activeElement !== codeEl) { e.preventDefault(); searchInput.focus(); }
    }
});

let typingTimer = null;
codeEl.addEventListener('input', () => {
    if (autoValidate) {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => runValidate(), 700);
    }
});

codeEl.value = SAMPLES.simple;
setTimeout(() => runValidate(), 200);

function deepClone(obj) {
    if (typeof structuredClone === 'function') return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
}

function isJSON(str) {
    if (typeof str !== 'string') return false;
    str = str.trim();
    if (!str) return false;
    try { JSON.parse(str); return true; } catch (e) { return false; }
}

function prettyPrint(obj) {
    try { return JSON.stringify(obj, null, 2); } catch (e) { return String(obj); }
}

document.addEventListener('copy', (e) => {
    // if user has selection in textarea, do nothing
});

function simpleShapeValidate(obj, shape) {
    const issues = [];
    function check(o, s, path) {
        if (typeof s === 'string') {
            if (s === 'array') { if (!Array.isArray(o)) issues.push(path + ' should be array'); }
            else if (s === 'object') { if (typeof o !== 'object' || Array.isArray(o) || o === null) issues.push(path + ' should be object'); }
            else if (s === 'string') { if (typeof o !== 'string') issues.push(path + ' should be string'); }
            else if (s === 'number') { if (typeof o !== 'number') issues.push(path + ' should be number'); }
        } else if (typeof s === 'object') {
            if (typeof o !== 'object' || o === null) { issues.push(path + ' should be object'); return; }
            Object.entries(s).forEach(([k, v]) => check(o[k], v, path ? path + '.' + k : k));
        }
    }
    check(obj, shape, '');
    return issues;
}


// Tree Viewer toggle logic only
const treePanel = document.querySelector('.tree-panel');
const btnToggleTree = document.getElementById('toggle-tree');

function updateTreePanelLayout() {
    const editorWrap = document.querySelector('.editor.three-col');
    if (treePanel.style.display === 'none') {
        editorWrap.classList.add('two-open');
        editorWrap.classList.remove('one-open');
    } else {
        editorWrap.classList.remove('two-open');
        editorWrap.classList.remove('one-open');
    }
}

btnToggleTree.addEventListener('click', () => {

    treePanel.style.display = 'none';
    btnToggleTree.textContent = 'Hide';

    updateTreePanelLayout();
});

// Initialize layout on load
updateTreePanelLayout();

window.vv = {
    beautify: beautifyText,
    minify: minifyText,
    validate: runValidate,
    lastValidJSONRef: () => lastValidJSON,
    buildTree: () => { if (lastValidJSON) buildTree(lastValidJSON, treeEl); }
};