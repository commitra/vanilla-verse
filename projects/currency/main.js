// Offline rates: base = USD
const BASE = 'USD';
const DEFAULT_RATES = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.0, JPY: 149.0, AUD: 1.52, CAD: 1.35 };

// DOM
const amountEl = document.getElementById('amount');
const fromEl = document.getElementById('from');
const toEl = document.getElementById('to');
const outEl = document.getElementById('out');
const form = document.getElementById('form');
const swapBtn = document.getElementById('swap');
const autoChk = document.getElementById('auto');
const editRatesBtn = document.getElementById('editRates');
const rateEditor = document.getElementById('rateEditor');
const ratesList = document.getElementById('ratesList');
const ratesForm = document.getElementById('ratesForm');
const saveRatesBtn = document.getElementById('saveRates');
const cancelRatesBtn = document.getElementById('cancelRates');
const clearOverridesBtn = document.getElementById('clearOverrides');

function safeParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}

function getOverrides() {
  return safeParse(localStorage.getItem('rates_override')) || null;
}

function saveOverrides(obj) {
  localStorage.setItem('rates_override', JSON.stringify(obj));
}

function clearOverrides() {
  localStorage.removeItem('rates_override');
}

function getRates() {
  const overrides = getOverrides();
  return overrides && typeof overrides === 'object' ? { ...DEFAULT_RATES, ...overrides } : { ...DEFAULT_RATES };
}

function populateOptions() {
  const rates = getRates();
  const codes = Object.keys(rates).sort();
  const html = codes.map(c => `<option value="${c}">${c}</option>`).join('');
  fromEl.innerHTML = html;
  toEl.innerHTML = html;

  // sensible defaults only if not set
  if (!fromEl.value) fromEl.value = BASE;
  if (!toEl.value) toEl.value = 'EUR' in rates ? 'EUR' : codes[1] || BASE;
}

function formatNumber(n) {
  return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A';
}

function validateInputs(a, f, t, rates) {
  if (!Number.isFinite(a) || a < 0) return 'Enter a valid non-negative amount.';
  if (!rates[f] || !rates[t]) return 'Unknown currency selected.';
  return null;
}

function convert(e) {
  if (e) e.preventDefault();
  const rates = getRates();
  const a = parseFloat(amountEl.value || '0');
  const f = fromEl.value;
  const t = toEl.value;

  const err = validateInputs(a, f, t, rates);
  if (err) {
    outEl.textContent = err;
    outEl.classList.add('err');
    return;
  }

  outEl.classList.remove('err');
  // convert via base (USD): amount_in_usd = amount / rateFrom; result = amount_in_usd * rateTo
  const amountInUSD = a / rates[f];
  const result = amountInUSD * rates[t];
  outEl.innerHTML = `<strong>${formatNumber(a)}</strong> ${escapeHtml(f)} = <strong>${formatNumber(result)}</strong> ${escapeHtml(t)}
    <div class="meta">1 ${escapeHtml(f)} = ${formatNumber(rates[t] / rates[f])} ${escapeHtml(t)}</div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function swapCurrencies() {
  const prevFrom = fromEl.value;
  const prevTo = toEl.value;
  fromEl.value = prevTo;
  toEl.value = prevFrom;
  convert();
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// AUTO-CONVERT handlers
const liveConvert = debounce(() => {
  if (autoChk.checked) convert();
}, 300);

// Rate editor
function openRateEditor() {
  const rates = getRates();
  ratesList.innerHTML = '';
  Object.entries(rates).sort().forEach(([code, value]) => {
    const row = document.createElement('div');
    row.className = 'rate-row';
    row.innerHTML = `
      <label>${escapeHtml(code)}</label>
      <input name="${escapeHtml(code)}" type="number" step="0.0001" min="0" value="${Number(value)}" />
    `;
    ratesList.appendChild(row);
  });
  rateEditor.classList.remove('hidden');
  rateEditor.setAttribute('aria-hidden', 'false');
  ratesList.querySelector('input')?.focus();
}

function closeRateEditor() {
  rateEditor.classList.add('hidden');
  rateEditor.setAttribute('aria-hidden', 'true');
}

function onSaveRates(e) {
  e.preventDefault();
  const formData = new FormData(ratesForm);
  const newRates = {};
  for (const [key, val] of formData.entries()) {
    const num = parseFloat(val);
    if (!Number.isFinite(num) || num <= 0) {
      alert(`Invalid value for ${key}. Must be a positive number.`);
      return;
    }
    newRates[key] = num;
  }
  // We only save overrides relative to DEFAULT_RATES (store only changed or new entries)
  const overrides = {};
  for (const [k, v] of Object.entries(newRates)) {
    if (!(k in DEFAULT_RATES) || DEFAULT_RATES[k] !== v) overrides[k] = v;
  }
  saveOverrides(overrides);
  populateOptions();
  closeRateEditor();
  convert();
}

function onClearOverrides() {
  if (!confirm('Clear saved rate overrides from localStorage?')) return;
  clearOverrides();
  populateOptions();
  convert();
}

// initial wiring
populateOptions();
form.addEventListener('submit', convert);
swapBtn.addEventListener('click', swapCurrencies);
amountEl.addEventListener('input', liveConvert);
fromEl.addEventListener('change', liveConvert);
toEl.addEventListener('change', liveConvert);
autoChk.addEventListener('change', () => {
  if (autoChk.checked) convert();
});
editRatesBtn.addEventListener('click', openRateEditor);
cancelRatesBtn.addEventListener('click', (e) => { e.preventDefault(); closeRateEditor(); });
ratesForm.addEventListener('submit', onSaveRates);
clearOverridesBtn.addEventListener('click', onClearOverrides);

// small accessibility: Enter on swap when focused
swapBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    swapCurrencies();
  }
});
