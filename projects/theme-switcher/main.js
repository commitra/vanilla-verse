const input = document.getElementById('color'); document.getElementById('apply').addEventListener('click', () => { document.documentElement.style.setProperty('--accent', input.value); });
// TODOs: generate palettes (HSL); save themes (localStorage); share URL hash
const themeToggle = document.getElementById('themeToggle');
        const body = document.body;

      
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            body.classList.add('dark-mode');
        }

        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
        
            const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
        });
