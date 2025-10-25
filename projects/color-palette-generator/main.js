class ColorPaletteGenerator {
    constructor() {
        this.currentPalette = [];
        this.savedPalettes = this.loadSavedPalettes();
        this.init();
    }

    init() {
        this.bindEvents();
        this.initTheme();
        this.generateInitialPalette();
        this.renderSavedPalettes();
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Generation controls
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generatePalette();
        });

        document.getElementById('generationMethod').addEventListener('change', () => {
            this.generatePalette();
        });

        document.getElementById('baseColor').addEventListener('change', () => {
            this.generatePalette();
        });

        // Color count slider
        const colorCountSlider = document.getElementById('colorCount');
        colorCountSlider.addEventListener('input', (e) => {
            document.getElementById('colorCountValue').textContent = e.target.value;
            this.generatePalette();
        });

        // Export buttons
        document.getElementById('exportCSS').addEventListener('click', () => {
            this.exportAsCSS();
        });

        document.getElementById('exportJSON').addEventListener('click', () => {
            this.exportAsJSON();
        });

        document.getElementById('savePalette').addEventListener('click', () => {
            this.savePalette();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
                e.preventDefault();
                this.generatePalette();
            }
        });
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('colorGenerator-theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
        }
    }

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('colorGenerator-theme', isLight ? 'light' : 'dark');
        this.showToast('Theme switched!');
    }

    // Color Generation Methods
    generatePalette() {
        const method = document.getElementById('generationMethod').value;
        const baseColor = document.getElementById('baseColor').value;
        const count = parseInt(document.getElementById('colorCount').value);

        let colors = [];

        switch (method) {
            case 'random':
                colors = this.generateRandomColors(count);
                break;
            case 'complementary':
                colors = this.generateComplementaryColors(baseColor, count);
                break;
            case 'triadic':
                colors = this.generateTriadicColors(baseColor, count);
                break;
            case 'analogous':
                colors = this.generateAnalogousColors(baseColor, count);
                break;
            case 'monochromatic':
                colors = this.generateMonochromaticColors(baseColor, count);
                break;
        }

        this.currentPalette = colors;
        this.renderPalette(colors);
    }

    generateRandomColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = Math.floor(Math.random() * 360);
            const saturation = Math.floor(Math.random() * 50) + 50; // 50-100%
            const lightness = Math.floor(Math.random() * 40) + 30; // 30-70%
            colors.push(this.hslToHex(hue, saturation, lightness));
        }
        return colors;
    }

    generateComplementaryColors(baseColor, count) {
        const hsl = this.hexToHsl(baseColor);
        const colors = [baseColor];
        
        // Add complementary color
        const complementaryHue = (hsl.h + 180) % 360;
        colors.push(this.hslToHex(complementaryHue, hsl.s, hsl.l));
        
        // Fill remaining with variations
        for (let i = 2; i < count; i++) {
            const variation = i % 2 === 0 ? hsl.h : complementaryHue;
            const lightness = hsl.l + (i * 15) % 40 - 20;
            colors.push(this.hslToHex(variation, hsl.s, Math.max(20, Math.min(80, lightness))));
        }
        
        return colors;
    }

    generateTriadicColors(baseColor, count) {
        const hsl = this.hexToHsl(baseColor);
        const colors = [baseColor];
        
        // Add triadic colors (120° apart)
        colors.push(this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l));
        colors.push(this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l));
        
        // Fill remaining with variations
        for (let i = 3; i < count; i++) {
            const baseHue = [hsl.h, (hsl.h + 120) % 360, (hsl.h + 240) % 360][i % 3];
            const lightness = hsl.l + (i * 10) % 30 - 15;
            colors.push(this.hslToHex(baseHue, hsl.s, Math.max(20, Math.min(80, lightness))));
        }
        
        return colors;
    }

    generateAnalogousColors(baseColor, count) {
        const hsl = this.hexToHsl(baseColor);
        const colors = [baseColor];
        
        const step = 30; // 30° apart
        for (let i = 1; i < count; i++) {
            const hue = (hsl.h + (i * step)) % 360;
            const lightness = hsl.l + (i % 2 === 0 ? 10 : -10);
            colors.push(this.hslToHex(hue, hsl.s, Math.max(20, Math.min(80, lightness))));
        }
        
        return colors;
    }

    generateMonochromaticColors(baseColor, count) {
        const hsl = this.hexToHsl(baseColor);
        const colors = [];
        
        const lightnessStep = 60 / (count - 1); // Distribute across lightness range
        for (let i = 0; i < count; i++) {
            const lightness = 20 + (i * lightnessStep);
            colors.push(this.hslToHex(hsl.h, hsl.s, lightness));
        }
        
        return colors;
    }

    generateInitialPalette() {
        this.generatePalette();
    }

    // Color Utility Functions
    hexToHsl(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    hslToHex(h, s, l) {
        s /= 100;
        l /= 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }

        const toHex = (val) => {
            const hex = Math.round((val + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    // Rendering Functions
    renderPalette(colors) {
        const paletteContainer = document.getElementById('colorPalette');
        paletteContainer.innerHTML = '';

        colors.forEach((color, index) => {
            const colorItem = this.createColorItem(color, index);
            paletteContainer.appendChild(colorItem);
        });
    }

    createColorItem(color, index) {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.setAttribute('role', 'listitem');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `Color ${index + 1}: ${color}`);

        const rgb = this.hexToRgb(color);
        const hsl = this.hexToHsl(color);
        
        // Determine if text should be light or dark based on background
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        const textColor = luminance > 0.5 ? '#000000' : '#ffffff';

        item.innerHTML = `
            <div class="color-preview" style="background-color: ${color};">
                <div class="color-contrast-demo" style="background-color: ${textColor}; color: ${color};">
                    Sample Text
                </div>
            </div>
            <div class="color-info">
                <div class="color-value">${color.toUpperCase()}</div>
                <div class="color-formats">
                    <div class="color-format" data-format="rgb" title="Click to copy RGB">
                        rgb(${rgb.r}, ${rgb.g}, ${rgb.b})
                    </div>
                    <div class="color-format" data-format="hsl" title="Click to copy HSL">
                        hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)
                    </div>
                </div>
            </div>
        `;

        // Add click to copy functionality
        item.addEventListener('click', () => {
            this.copyToClipboard(color);
        });

        // Add keyboard navigation
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.copyToClipboard(color);
            }
        });

        // Copy format-specific values
        const formatElements = item.querySelectorAll('.color-format');
        formatElements.forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyToClipboard(e.target.textContent.trim());
            });
        });

        return item;
    }

    // Export Functions
    exportAsCSS() {
        if (this.currentPalette.length === 0) {
            this.showToast('Generate a palette first!', 'error');
            return;
        }

        let css = ':root {\n';
        this.currentPalette.forEach((color, index) => {
            css += `  --color-${index + 1}: ${color};\n`;
        });
        css += '}';

        this.downloadFile(css, 'color-palette.css', 'text/css');
        this.showToast('CSS exported successfully!');
    }

    exportAsJSON() {
        if (this.currentPalette.length === 0) {
            this.showToast('Generate a palette first!', 'error');
            return;
        }

        const paletteData = {
            name: `Palette ${new Date().toLocaleDateString()}`,
            colors: this.currentPalette.map((color, index) => ({
                name: `Color ${index + 1}`,
                hex: color,
                rgb: this.hexToRgb(color),
                hsl: this.hexToHsl(color)
            })),
            createdAt: new Date().toISOString()
        };

        const json = JSON.stringify(paletteData, null, 2);
        this.downloadFile(json, 'color-palette.json', 'application/json');
        this.showToast('JSON exported successfully!');
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Local Storage Functions
    savePalette() {
        if (this.currentPalette.length === 0) {
            this.showToast('Generate a palette first!', 'error');
            return;
        }

        const palette = {
            id: Date.now(),
            colors: [...this.currentPalette],
            createdAt: new Date().toLocaleDateString()
        };

        this.savedPalettes.push(palette);
        this.storeSavedPalettes();
        this.renderSavedPalettes();
        this.showToast('Palette saved to favorites!');
    }

    loadSavedPalettes() {
        try {
            return JSON.parse(localStorage.getItem('colorGenerator-savedPalettes') || '[]');
        } catch {
            return [];
        }
    }

    storeSavedPalettes() {
        localStorage.setItem('colorGenerator-savedPalettes', JSON.stringify(this.savedPalettes));
    }

    deletePalette(id) {
        this.savedPalettes = this.savedPalettes.filter(p => p.id !== id);
        this.storeSavedPalettes();
        this.renderSavedPalettes();
        this.showToast('Palette deleted!');
    }

    loadPalette(colors) {
        this.currentPalette = colors;
        this.renderPalette(colors);
        this.showToast('Palette loaded!');
    }

    renderSavedPalettes() {
        const container = document.getElementById('savedPalettes');
        
        if (this.savedPalettes.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No saved palettes yet.</p>';
            return;
        }

        container.innerHTML = '';
        this.savedPalettes.forEach(palette => {
            const paletteEl = this.createSavedPaletteElement(palette);
            container.appendChild(paletteEl);
        });
    }

    createSavedPaletteElement(palette) {
        const el = document.createElement('div');
        el.className = 'saved-palette';
        el.setAttribute('role', 'listitem');

        const colorsHtml = palette.colors.map(color => 
            `<div class="saved-color" style="background-color: ${color};" title="${color}"></div>`
        ).join('');

        el.innerHTML = `
            <div class="saved-palette-colors" role="button" tabindex="0" aria-label="Load this palette">
                ${colorsHtml}
            </div>
            <div class="saved-palette-info">
                <span class="saved-palette-date">${palette.createdAt}</span>
                <button class="delete-palette" aria-label="Delete this palette">×</button>
            </div>
        `;

        // Load palette on click
        const colorsContainer = el.querySelector('.saved-palette-colors');
        colorsContainer.addEventListener('click', () => {
            this.loadPalette(palette.colors);
        });

        colorsContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.loadPalette(palette.colors);
            }
        });

        // Delete palette
        el.querySelector('.delete-palette').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePalette(palette.id);
        });

        return el;
    }

    // Utility Functions
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast(`Copied: ${text}`);
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast(`Copied: ${text}`);
        } catch (err) {
            this.showToast('Copy failed', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    showToast(message, type = 'success') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColorPaletteGenerator();
});