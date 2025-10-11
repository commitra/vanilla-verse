const input = document.getElementById('color'); document.getElementById('apply').addEventListener('click', () => { document.documentElement.style.setProperty('--accent', input.value); });
// TODOs: generate palettes (HSL); save themes (localStorage); share URL hash
