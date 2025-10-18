const images = ['https://picsum.photos/seed/1/400/240', 'https://picsum.photos/seed/2/400/240', 'https://picsum.photos/seed/3/400/240']; let i = 0; const img = document.getElementById('img'); function render() { img.src = images[i]; } render(); document.getElementById('prev').addEventListener('click', () => { i = (i - 1 + images.length) % images.length; render(); }); document.getElementById('next').addEventListener('click', () => { i = (i + 1) % images.length; render(); });
// TODOs: autoplay/pause; keyboard focus; swipe; captions; indicators
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
