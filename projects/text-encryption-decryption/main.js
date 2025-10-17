// Basic algorithms: Caesar, ROT13, Atbash

// Handle Theme Toggle
const themeButton = document.getElementById("themeToggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (prefersDark) document.documentElement.setAttribute("data-theme", "dark");

themeButton.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  themeButton.textContent = next === "dark" ? "🌙" : "☀️";
});

function normalizeShift(n) {
  // Normalize to range [0, 25]
  const mod = ((n % 26) + 26) % 26;
  return mod;
}

function shiftChar(c, shift) {
  const code = c.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    // A-Z
    const base = 65;
    return String.fromCharCode(((code - base + shift + 26) % 26) + base);
  }
  if (code >= 97 && code <= 122) {
    // a-z
    const base = 97;
    return String.fromCharCode(((code - base + shift + 26) % 26) + base);
  }
  return c; // non-letters unchanged
}

function caesarEncrypt(text, shift) {
  const s = normalizeShift(shift);
  return Array.from(text).map(ch => shiftChar(ch, s)).join("");
}

function caesarDecrypt(text, shift) {
  const s = normalizeShift(shift);
  return Array.from(text).map(ch => shiftChar(ch, -s)).join("");
}

function rot13(text) {
  return Array.from(text).map(ch => shiftChar(ch, 13)).join("");
}

function atbash(text) {
  return Array.from(text).map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      // A <-> Z mapping
      return String.fromCharCode(65 + (25 - (code - 65)));
    }
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(97 + (25 - (code - 97)));
    }
    return ch;
  }).join("");
}

function initTextEncryptionDecryption() {
  const inputEl = document.getElementById('inputText');
  const outputEl = document.getElementById('outputText');
  const encryptBtn = document.getElementById('encryptBtn');
  const decryptBtn = document.getElementById('decryptBtn');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const copyStatus = document.getElementById('copyStatus');
  const algorithmEl = document.getElementById('algorithm');
  const shiftGroup = document.getElementById('shiftGroup');
  const shiftEl = document.getElementById('shift');
  const charCount = document.getElementById('charCount');

  function updateCharCount() {
    const len = inputEl.value.length;
    charCount.textContent = `${len} ${len === 1 ? 'character' : 'characters'}`;
  }

  function setOutput(text) {
    outputEl.value = text;
  }

  function getAlgorithm() {
    return algorithmEl.value;
  }

  function isCaesar() {
    return getAlgorithm() === 'caesar';
  }

  function updateShiftVisibility() {
    // Show shift only for Caesar
    shiftGroup.style.display = isCaesar() ? 'flex' : 'none';
  }

  function getShiftValue() {
    const v = parseInt(shiftEl.value, 10);
    if (Number.isNaN(v)) return 0;
    // Clamp within [-25, 25] for UX; algorithm normalizes anyway
    return Math.max(-25, Math.min(25, v));
  }

  function transform(action) {
    const text = inputEl.value || '';
    const algo = getAlgorithm();
    let result = '';
    if (algo === 'caesar') {
      const shift = getShiftValue();
      result = action === 'encrypt' ? caesarEncrypt(text, shift) : caesarDecrypt(text, shift);
    } else if (algo === 'rot13') {
      // ROT13 is symmetric
      result = rot13(text);
    } else if (algo === 'atbash') {
      // Atbash is symmetric
      result = atbash(text);
    }
    setOutput(result);
  }

  async function copyToClipboard() {
    const val = outputEl.value;
    if (!val) {
      copyStatus.textContent = 'Nothing to copy';
      return;
    }
    try {
      await navigator.clipboard.writeText(val);
      copyStatus.textContent = 'Copied!';
    } catch (e) {
      // Fallback
      outputEl.select();
      document.execCommand && document.execCommand('copy');
      copyStatus.textContent = 'Copied (fallback)';
    }
    setTimeout(() => (copyStatus.textContent = ''), 1500);
  }

  // Event hookups
  encryptBtn.addEventListener('click', () => transform('encrypt'));
  decryptBtn.addEventListener('click', () => transform('decrypt'));
  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    setOutput('');
    updateCharCount();
  });
  copyBtn.addEventListener('click', copyToClipboard);
  algorithmEl.addEventListener('change', () => {
    updateShiftVisibility();
  });
  inputEl.addEventListener('input', updateCharCount);
  shiftEl.addEventListener('input', () => {
    // normalize shown value to be within range
    shiftEl.value = String(getShiftValue());
  });

  // Init UI state
  updateShiftVisibility();
  updateCharCount();
}

window.addEventListener('DOMContentLoaded', initTextEncryptionDecryption);