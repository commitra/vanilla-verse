const c = document.getElementById('maze'); const ctx = c.getContext('2d');
// TODO: implement maze generation and basic player movement
ctx.fillStyle = '#17171c'; ctx.fillRect(0, 0, c.width, c.height);
ctx.fillStyle = '#6ee7b7'; ctx.fillRect(8, 8, 24, 24);
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
