// TODO: Generate QR code from input text/URL
// TODO: Display generated QR code
// TODO: Download QR code image
// TODO: Scan uploaded QR code image
// TODO: Display scanned QR code result

function initQRCodeGeneratorScanner() {
  // TODO: Generate QR code from input
  // TODO: Scan QR code from image
  // TODO: Display results
  // TODO: Download QR code
}

window.addEventListener('DOMContentLoaded', initQRCodeGeneratorScanner);

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
