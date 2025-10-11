// Offline rates: base = USD
const BASE = 'USD';
const RATES = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.0, JPY: 149.0, AUD: 1.52, CAD: 1.35 };
// Contributors: you can add currencies or override values in localStorage without network calls.
function getRates() { try { const saved = JSON.parse(localStorage.getItem('rates_override') || 'null'); return saved && typeof saved === 'object' ? { ...RATES, ...saved } : RATES; } catch { return RATES; } }
const amount = document.getElementById('amount'); const from = document.getElementById('from'); const to = document.getElementById('to'); const out = document.getElementById('out');
function options() { const rates = getRates(); const codes = Object.keys(rates); from.innerHTML = codes.map(c => `<option>${c}</option>`).join(''); to.innerHTML = codes.map(c => `<option>${c}</option>`).join(''); from.value = 'USD'; to.value = 'EUR'; }
function convert(e) { e.preventDefault(); const rates = getRates(); const a = parseFloat(amount.value || '0'); const rFrom = rates[from.value]; const rTo = rates[to.value]; if (!(rFrom && rTo)) { out.textContent = 'Unknown currency'; return; } const usd = a / rFrom; const result = usd * rTo; out.textContent = `${a.toFixed(2)} ${from.value} = ${result.toFixed(2)} ${to.value}`; }
document.getElementById('form').addEventListener('submit', convert); options();
// TODOs: UI to edit/save override rates; validation; rounding modes; accessibility
