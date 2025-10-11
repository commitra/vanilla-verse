const input = document.getElementById('input'); const preview = document.getElementById('preview');
function naive(md) { return md.replace(/^# (.*)$/gm, '<h2>$1</h2>').replace(/^## (.*)$/gm, '<h3>$1</h3>').replace(/^\* (.*)$/gm, '<li>$1</li>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>'); }
function render() { preview.innerHTML = naive(input.value); }
input.addEventListener('input', render); render();
// TODOs: proper markdown parsing; code blocks; copy/download; sanitize HTML
