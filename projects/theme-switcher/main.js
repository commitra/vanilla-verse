     
        let accentColor = '#6ee7b7';
        let currentPalette = ['#6ee7b7'];
        let savedPalettes = [];

        function init() {
            loadFromStorage();
            loadFromHash();
            updateUI();
            renderSavedPalettes();
            document.getElementById('colorPicker').addEventListener('change', (e) => {
                accentColor = e.target.value;
                updateUI();
            });
        }

        function updateUI() {
            document.documentElement.style.setProperty('--accent', accentColor);
            document.getElementById('colorPreview').style.backgroundColor = accentColor;
            document.getElementById('colorValue').textContent = accentColor;
            document.getElementById('colorPicker').value = accentColor;
            renderPaletteColors();
            updateHash();
        }

        function renderPaletteColors() {
            const container = document.getElementById('paletteColors');
            container.innerHTML = '';
            currentPalette.forEach(color => {
                const div = document.createElement('div');
                div.className = 'palette-color';
                div.style.backgroundColor = color;
                div.title = color;
                div.onclick = () => applySpecificColor(color);
                container.appendChild(div);
            });
        }

        function applyColor() {
            updateUI();
            showToast('Color Applied', `${accentColor} is now your accent color`);
        }

        function applySpecificColor(color) {
            accentColor = color;
            updateUI();
            showToast('Color Applied', `${color} is now your accent color`);
        }

        function generateRandomPalette() {
            const colors = [];
            for (let i = 0; i < 5; i++) {
                const hue = Math.floor(Math.random() * 360);
                const saturation = 60 + Math.floor(Math.random() * 30);
                const lightness = 45 + Math.floor(Math.random() * 30);
                colors.push(hslToHex(hue, saturation, lightness));
            }
            currentPalette = colors;
            accentColor = colors[0];
            updateUI();
            showToast('Random Palette', 'New random palette generated!');
        }

        function generateVibrantPalette() {
            const vibrantColors = [
                '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF',
                '#FF4081', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
                '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'
            ];
            const shuffled = [...vibrantColors].sort(() => Math.random() - 0.5);
            currentPalette = shuffled.slice(0, 5);
            accentColor = currentPalette[0];
            updateUI();
            showToast('Vibrant Colors', 'High-energy palette created!');
        }

        function generatePastelPalette() {
            const colors = [];
            for (let i = 0; i < 5; i++) {
                const hue = Math.floor(Math.random() * 360);
                const saturation = 25 + Math.floor(Math.random() * 35);
                const lightness = 75 + Math.floor(Math.random() * 15);
                colors.push(hslToHex(hue, saturation, lightness));
            }
            currentPalette = colors;
            accentColor = colors[0];
            updateUI();
            showToast('Pastel Colors', 'Soft soothing palette created!');
        }

        function generateScheme(type) {
            const baseHue = Math.floor(Math.random() * 360);
            let colors = [];
            switch (type) {
                case 'monochromatic':
                    colors = Array.from({ length: 5 }, (_, i) => {
                        const lightness = 20 + (i * 15);
                        return hslToHex(baseHue, 70, lightness);
                    });
                    break;
                case 'analogous':
                    colors = Array.from({ length: 5 }, (_, i) => {
                        const hue = (baseHue + (i * 30) - 60) % 360;
                        return hslToHex(hue, 70, 60);
                    });
                    break;
                case 'complementary':
                    colors = [
                        hslToHex(baseHue, 70, 60),
                        hslToHex(baseHue, 70, 40),
                        hslToHex((baseHue + 180) % 360, 70, 60),
                        hslToHex((baseHue + 180) % 360, 70, 40),
                        hslToHex(baseHue, 50, 80)
                    ];
                    break;
                case 'triadic':
                    colors = [
                        hslToHex(baseHue, 70, 60),
                        hslToHex((baseHue + 120) % 360, 70, 60),
                        hslToHex((baseHue + 240) % 360, 70, 60),
                        hslToHex(baseHue, 70, 40),
                        hslToHex((baseHue + 120) % 360, 70, 40)
                    ];
                    break;
                default:
                    showToast('Error', 'Unknown scheme type', 'error');
                    return;
            }
            currentPalette = colors;
            accentColor = colors[0];
            updateUI();
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} Scheme`, `${type} palette generated!`);
        }

        function savePalette() {
            const name = document.getElementById('paletteName').value.trim();
            if (!name) {
                showToast('Name Required', 'Please enter a palette name', 'error');
                return;
            }
            if (savedPalettes.some(p => p.name === name)) {
                showToast('Name Exists', 'A palette with this name already exists', 'error');
                return;
            }
            const palette = {
                id: Date.now().toString(),
                name: name,
                colors: [...currentPalette],
                timestamp: Date.now()
            };
            savedPalettes.push(palette);
            saveToStorage();
            renderSavedPalettes();
            document.getElementById('paletteName').value = '';
            showToast('Palette Saved', `"${name}" saved successfully!`);
        }

        function deletePalette(id) {
            const palette = savedPalettes.find(p => p.id === id);
            savedPalettes = savedPalettes.filter(p => p.id !== id);
            saveToStorage();
            renderSavedPalettes();
            showToast('Palette Deleted', `"${palette.name}" has been deleted`);
        }

        function loadPalette(id) {
            const palette = savedPalettes.find(p => p.id === id);
            if (palette) {
                currentPalette = [...palette.colors];
                accentColor = palette.colors[0];
                updateUI();
                showToast('Palette Loaded', `"${palette.name}" applied successfully!`);
            }
        }

        function sharePalette() {
            const data = { colors: currentPalette };
            const hash = encodeURIComponent(JSON.stringify(data));
            const url = `${window.location.origin}${window.location.pathname}#${hash}`;
            copyToClipboard(url).then(() => {
                showToast('Link Copied', 'Share link copied to clipboard!');
            }).catch(() => {
                showToast('Error', 'Failed to copy link', 'error');
            });
        }

        function copyColor() {
            copyToClipboard(accentColor).then(() => {
                showToast('Color Copied', `${accentColor} copied to clipboard!`);
            }).catch(() => {
                showToast('Error', 'Failed to copy color', 'error');
            });
        }

        function copyToClipboard(text) {
            if (navigator.clipboard) {
                return navigator.clipboard.writeText(text);
            } else {
                return new Promise((resolve, reject) => {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        const successful = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        if (successful) {
                            resolve();
                        } else {
                            reject(new Error('Copy command failed'));
                        }
                    } catch (err) {
                        document.body.removeChild(textArea);
                        reject(err);
                    }
                });
            }
        }

        function renderSavedPalettes() {
            const container = document.getElementById('savedPalettes');
            container.innerHTML = '';
            if (savedPalettes.length === 0) {
                container.innerHTML = '<div class="empty-state">No saved palettes yet. Create and save your first palette!</div>';
                return;
            }
            savedPalettes.forEach(palette => {
                const card = createPaletteCard(palette);
                container.appendChild(card);
            });
        }

        function createPaletteCard(palette) {
            const card = document.createElement('div');
            card.className = 'palette-card';
            const header = document.createElement('div');
            header.className = 'palette-header';
            const nameDiv = document.createElement('div');
            nameDiv.innerHTML = `
                <div class="palette-name">${palette.name}</div>
                <div class="palette-date">${new Date(palette.timestamp).toLocaleDateString()}</div>
            `;
            const actions = document.createElement('div');
            actions.className = 'palette-actions';
            const applyBtn = document.createElement('button');
            applyBtn.className = 'btn-small';
            applyBtn.textContent = 'Apply';
            applyBtn.onclick = (e) => {
                e.stopPropagation();
                loadPalette(palette.id);
            };
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-small btn-delete';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deletePalette(palette.id);
            };
            actions.appendChild(applyBtn);
            actions.appendChild(deleteBtn);
            header.appendChild(nameDiv);
            header.appendChild(actions);
            const colorsRow = document.createElement('div');
            colorsRow.className = 'palette-colors-row';
            palette.colors.forEach(color => {
                const colorDiv = document.createElement('div');
                colorDiv.style.backgroundColor = color;
                colorDiv.title = color;
                colorsRow.appendChild(colorDiv);
            });
            card.appendChild(header);
            card.appendChild(colorsRow);
            card.onclick = () => loadPalette(palette.id);
            return card;
        }

        function showToast(title, message, type = 'success') {
            const existing = document.querySelector('.toast');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        function saveToStorage() {
            localStorage.setItem('themeSwitcherPalettes', JSON.stringify(savedPalettes));
        }

        function loadFromStorage() {
            const saved = localStorage.getItem('themeSwitcherPalettes');
            if (saved) {
                try {
                    savedPalettes = JSON.parse(saved);
                } catch (e) {
                    console.error('Error loading saved palettes:', e);
                    savedPalettes = [];
                }
            }
        }

        function loadFromHash() {
            if (window.location.hash) {
                try {
                    const data = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
                    if (data.colors) {
                        currentPalette = data.colors;
                        accentColor = data.colors[0];
                        showToast('Palette Loaded', 'Palette loaded from shared link!');
                    }
                } catch (e) {
                    console.error('Invalid hash data');
                }
            }
        }

        function updateHash() {
            const data = { colors: currentPalette };
            const hash = encodeURIComponent(JSON.stringify(data));
            window.history.replaceState(null, null, `#${hash}`);
        }

        function hslToHex(h, s, l) {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = n => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');
            };
            return `#${f(0)}${f(8)}${f(4)}`;
        }

        window.addEventListener('DOMContentLoaded', init);
    