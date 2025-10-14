const kg = document.getElementById('kg'); const cm = document.getElementById('cm'); const out = document.getElementById('out');
function validateWeight(raw) {
  if (!raw) return 'Please enter your weight (kg).';
  const v = Number(raw);
  if (!Number.isFinite(v)) return 'Weight must be a number (e.g., 70).';
  if (v <= 0) return 'Weight must be greater than 0 kg.';
  if (v < 20 || v > 300) return 'Please enter a realistic weight (20–300 kg).';
  return '';
}

function validateHeight(raw) {
  if (!raw) return 'Please enter your height (cm).';
  const v = Number(raw);
  if (!Number.isFinite(v)) return 'Height must be a number (e.g., 170).';
  if (v <= 0) return 'Height must be greater than 0 cm.';
  if (v < 50 || v > 250) return 'Please enter a realistic height (50–250 cm).';
  return '';
}

function clearCustomValidity() {
  kg.setCustomValidity('');
  cm.setCustomValidity('');
  kg.removeAttribute('aria-invalid'); kg.style.borderColor = '';
  cm.removeAttribute('aria-invalid'); cm.style.borderColor = '';
}

function markFieldInvalid(el) {
  if (!el) return;
  el.setAttribute('aria-invalid', 'true');
  el.style.borderColor = '#ff6b6b';
}

function clearFieldInvalid(el) {
  if (!el) return;
  el.removeAttribute('aria-invalid');
  el.style.borderColor = '';
}

form?.addEventListener('submit', e => {
  e.preventDefault();
  if (!kg || !cm || !out) return;

  clearCustomValidity();

  const weightRaw = (kg.value ?? '').trim();
  const heightRaw = (cm.value ?? '').trim();

  const wErr = validateWeight(weightRaw);
  const hErr = validateHeight(heightRaw);

  if (wErr) kg.setCustomValidity(wErr);
  if (hErr) cm.setCustomValidity(hErr);

  if (wErr && hErr) {
    markFieldInvalid(kg);
    markFieldInvalid(cm);
  } else {
    if (wErr) markFieldInvalid(kg); else clearFieldInvalid(kg);
    if (hErr) markFieldInvalid(cm); else clearFieldInvalid(cm);
  }

  if (!form.checkValidity()) {
    const firstInvalid = kg.validity.valid ? cm : kg;
    firstInvalid.reportValidity();
    firstInvalid.focus();
    out.textContent = 'You have invalid Details'; 
    return;
  }

  const w = parseFloat(weightRaw);
  const heightCm = parseFloat(heightRaw);
  const h = heightCm / 100;
  const bmi = w / (h * h);
  const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  out.textContent = `BMI: ${bmi.toFixed(1)} (${cat})`;
  clearCustomValidity();
});

[kg, cm].forEach(el => {
  el?.addEventListener('input', () => {
    el.setCustomValidity('');
    clearFieldInvalid(el);
  });
});

