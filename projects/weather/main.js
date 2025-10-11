const form = document.getElementById('form'); const city = document.getElementById('city'); const out = document.getElementById('out');
form.addEventListener('submit', async e => {
    e.preventDefault(); out.textContent = 'Loading...'; try { const q = encodeURIComponent(city.value); const res = await fetch(`https://wttr.in/${q}?format=j1`); const data = await res.json(); const cur = data.current_condition?.[0]; out.innerHTML = cur ? `<strong>${city.value}</strong>: ${cur.temp_C}°C, ${cur.weatherDesc?.[0]?.value}` : 'No data'; } catch (err) { out.textContent = 'Failed to fetch weather'; }
});
// TODOs: use icons; toggle units; cache; geolocation; error states
