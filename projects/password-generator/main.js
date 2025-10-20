
        // Character sets
        const SETS = {
            lower: 'abcdefghijklmnopqrstuvwxyz',
            upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+[]{}|;:,.<>?/~`-='
        };

        // Elements
        const els = {
            length: document.getElementById('length'),
            lower: document.getElementById('lower'),
            upper: document.getElementById('upper'),
            numbers: document.getElementById('numbers'),
            symbols: document.getElementById('symbols'),
            password: document.getElementById('password'),
            generate: document.getElementById('generate'),
            regen: document.getElementById('regen'),
            copyBtn: document.getElementById('copyBtn'),
            shuffleBtn: document.getElementById('shuffleBtn'),
            strengthBar: document.getElementById('strengthBar'),
            strengthText: document.getElementById('strengthText')
        };

        function buildCharset() {
            let s = '';
            if (els.lower.checked) s += SETS.lower;
            if (els.upper.checked) s += SETS.upper;
            if (els.numbers.checked) s += SETS.numbers;
            if (els.symbols.checked) s += SETS.symbols;
            return s;
        }

        // Secure random integer in [0, max)
        function randomInt(max) {
            // crypto.getRandomValues for uniform random
            const uint32 = crypto.getRandomValues(new Uint32Array(1))[0];
            return uint32 % max;
        }

        function shuffleArray(arr) {
            // Fisher-Yates using crypto
            for (let i = arr.length - 1; i > 0; i--) {
                const j = randomInt(i + 1);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        function generatePassword() {
            const length = Math.max(4, Math.min(256, parseInt(els.length.value, 10) || 16));
            const charset = buildCharset();
            if (!charset) {
                alert('Select at least one character type.');
                return '';
            }

            const chars = [];
            // Ensure at least one character from each selected set is included
            const requiredSets = [];
            if (els.lower.checked) requiredSets.push(SETS.lower);
            if (els.upper.checked) requiredSets.push(SETS.upper);
            if (els.numbers.checked) requiredSets.push(SETS.numbers);
            if (els.symbols.checked) requiredSets.push(SETS.symbols);

            // Add one required char from each selected set first
            for (const set of requiredSets) {
                chars.push(set[randomInt(set.length)]);
            }

            // Fill remaining
            for (let i = chars.length; i < length; i++) {
                chars.push(charset[randomInt(charset.length)]);
            }

            // Shuffle final characters for randomness
            shuffleArray(chars);
            const pw = chars.join('');
            updateStrength(pw);
            return pw;
        }

        function updateStrength(pw) {
            const len = pw.length;
            // Basic entropy estimation: bits per char ~ log2(uniqueCharset)
            const unique = new Set(pw.split('')).size;
            // Rough strength metric 0..100
            const entropy = Math.min(100, Math.round((Math.log2(unique || 1) * len) / len * 20));
            els.strengthBar.style.width = entropy + '%';
            let text = 'Very weak';
            if (entropy > 80) text = 'Very strong';
            else if (entropy > 60) text = 'Strong';
            else if (entropy > 40) text = 'Moderate';
            else if (entropy > 20) text = 'Weak';
            els.strengthText.textContent = 'Strength: ' + text + ' (' + entropy + '%)';
        }

        function setPassword(pw) {
            els.password.value = pw;
            if (pw) {
                els.copyBtn.disabled = false;
            } else {
                els.copyBtn.disabled = true;
                els.strengthBar.style.width = '0%';
                els.strengthText.textContent = 'Strength: —';
            }
        }

        // Event handlers
        els.generate.addEventListener('click', () => {
            setPassword(generatePassword());
        });

        els.regen.addEventListener('click', () => {
            setPassword(generatePassword());
        });

        els.copyBtn.addEventListener('click', async () => {
            const text = els.password.value;
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                els.copyBtn.textContent = 'Copied';
                setTimeout(() => (els.copyBtn.textContent = 'Copy'), 1500);
            } catch (e) {
                // fallback
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                els.copyBtn.textContent = 'Copied';
                setTimeout(() => (els.copyBtn.textContent = 'Copy'), 1500);
            }
        });

        els.shuffleBtn.addEventListener('click', () => {
            const curr = els.password.value;
            if (!curr) return;
            setPassword(shuffleArray(curr.split('')).join(''));
        });

        // Generate initial password
        setPassword(generatePassword());

        // live update strength when options change
        ['lower','upper','numbers','symbols','length'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                // If there's already a password, regenerate to reflect new options
                if (els.password.value) setPassword(generatePassword());
            });
        });