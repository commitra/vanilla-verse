const input = document.getElementById('input');
const preview = document.getElementById('preview');
const themeToggle = document.getElementById('themeToggle');
const exportHtml = document.getElementById('exportHtml');
const body = document.body;

// Theme management (matching home page system)
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
}

function toggleTheme() {
    body.classList.toggle('dark-mode');
    const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
}

// Markdown parsing
function naive(md) {
    return md
        .replace(/^# (.*)$/gm, '<h2>$1</h2>')
        .replace(/^## (.*)$/gm, '<h3>$1</h3>')
        .replace(/^\* (.*)$/gm, '<li>$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function render() {
    preview.innerHTML = naive(input.value);
}

function exportAsHtml() {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Markdown</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
        }
        h2 { color: #333; }
        h3 { color: #555; }
        strong { font-weight: bold; }
        em { font-style: italic; }
        li { margin: 0.25rem 0; }
    </style>
</head>
<body>
    ${preview.innerHTML}
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markdown-export.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event listeners
input.addEventListener('input', render);
themeToggle.addEventListener('click', toggleTheme);
exportHtml.addEventListener('click', exportAsHtml);

// Initialize
applyTheme(currentTheme);
render();
