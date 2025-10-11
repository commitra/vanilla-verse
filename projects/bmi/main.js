const kg = document.getElementById('kg'); const cm = document.getElementById('cm'); const out = document.getElementById('out');
function bmi() {
    const w = parseFloat(kg.value), h = parseFloat(cm.value) / 100;
    if (!(w > 0 && h > 0)) { out.textContent = 'Enter valid numbers'; return; } const v = w / (h * h); let cat = v < 18.5 ? 'Underweight' : v < 25 ? 'Normal' : v < 30 ? 'Overweight' : 'Obese'; out.textContent = `BMI: ${v.toFixed(1)} (${cat})`;
}
document.getElementById('form').addEventListener('submit', e => { e.preventDefault(); bmi(); });
// TODOs: save history; chart; unit toggle; input validation states
