const form = document.getElementById('form');
const city = document.getElementById('city');
const out = document.getElementById('out');
const geoBtn = document.getElementById('geoBtn');
const unitBtn = document.getElementById('unitBtn');

// State
let unit = 'C'; // C or F
const cache = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Weather icons mapping
const weatherIcons = {
    'Sunny': '☀️',
    'Clear': '🌙',
    'Partly cloudy': '⛅',
    'Cloudy': '☁️',
    'Overcast': '☁️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Light rain': '🌦️',
    'Moderate rain': '🌧️',
    'Heavy rain': '🌧️',
    'Light snow': '🌨️',
    'Moderate snow': '❄️',
    'Heavy snow': '❄️',
    'Thunderstorm': '⛈️',
    'default': '🌤️'
};

function getWeatherIcon(desc) {
    for (const [key, icon] of Object.entries(weatherIcons)) {
        if (desc.includes(key)) return icon;
    }
    return weatherIcons.default;
}

function getCacheKey(cityName) {
    return `weather_${cityName.toLowerCase()}`;
}

function isCacheValid(timestamp) {
    return Date.now() - timestamp < CACHE_DURATION;
}

function convertTemp(tempC) {
    if (unit === 'F') {
        return Math.round(tempC * 9 / 5 + 32);
    }
    return tempC;
}

function displayWeather(data, cityName) {
    const cur = data.current_condition?.[0];
    if (!cur) {
        out.innerHTML = '<div class="error">No weather data available</div>';
        return;
    }

    const desc = cur.weatherDesc?.[0]?.value || 'Unknown';
    const icon = getWeatherIcon(desc);
    const temp = convertTemp(parseInt(cur.temp_C));
    const feelsLike = convertTemp(parseInt(cur.FeelsLikeC));
    const unitSymbol = unit === 'C' ? '°C' : '°F';

    const cacheKey = getCacheKey(cityName);
    const cacheTime = cache[cacheKey]?.timestamp 
        ? new Date(cache[cacheKey].timestamp).toLocaleTimeString() 
        : 'just now';

    out.innerHTML = `
        <div class="weather-card">
            <div class="weather-header">
                <div>
                    <h2 class="weather-city">${cityName}</h2>
                    <p class="weather-desc">${desc}</p>
                </div>
                <div class="weather-icon">${icon}</div>
            </div>
            <div class="weather-temp">${temp}${unitSymbol}</div>
            <div class="weather-details">
                <div class="detail-item">
                    <span class="detail-label">Feels like</span>
                    <span class="detail-value">${feelsLike}${unitSymbol}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Humidity</span>
                    <span class="detail-value">${cur.humidity}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Wind</span>
                    <span class="detail-value">${cur.windspeedKmph} km/h</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pressure</span>
                    <span class="detail-value">${cur.pressure} mb</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Precipitation</span>
                    <span class="detail-value">${cur.precipMM} mm</span>
            </div>
            </div>
            <div class="cache-info">Last updated: ${cacheTime}</div>
        </div>
    `;
}

async function fetchWeather(cityName) {
    const cacheKey = getCacheKey(cityName);
    
    // Check cache
    if (cache[cacheKey] && isCacheValid(cache[cacheKey].timestamp)) {
        displayWeather(cache[cacheKey].data, cityName);
        return;
    }

    out.innerHTML = '<div class="loading">Loading weather data...</div>';

    try {
        const q = encodeURIComponent(cityName);
        const res = await fetch(`https://wttr.in/${q}?format=j1`);
        
        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();

        // Cache the result
        cache[cacheKey] = {
            data: data,
            timestamp: Date.now()
        };

        displayWeather(data, cityName);
    } catch (err) {
        out.innerHTML = `<div class="error">Failed to fetch weather data. Please check the city name and try again.</div>`;
        console.error(err);
    }
}

// Form submit handler
form.addEventListener('submit', async e => {
    e.preventDefault();
    const cityName = city.value.trim();
    if (cityName) {
        await fetchWeather(cityName);
    }
});

// Geolocation handler
geoBtn.addEventListener('click', async () => {
    if (!navigator.geolocation) {
        out.innerHTML = '<div class="error">Geolocation is not supported by your browser</div>';
        return;
    }

    geoBtn.disabled = true;
    out.innerHTML = '<div class="loading">Getting your location...</div>';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            const cityName = `${latitude},${longitude}`;
            city.value = 'My Location';
            await fetchWeather(cityName);
            geoBtn.disabled = false;
        },
        (error) => {
            out.innerHTML = `<div class="error">Unable to get location: ${error.message}</div>`;
            geoBtn.disabled = false;
        }
    );
});

// Unit toggle handler
unitBtn.addEventListener('click', () => {
    unit = unit === 'C' ? 'F' : 'C';
    unitBtn.textContent = `°${unit}`;
    
    // Re-render current weather if exists
    const currentCity = city.value.trim();
    if (currentCity) {
        const cacheKey = getCacheKey(currentCity);
        if (cache[cacheKey]) {
            displayWeather(cache[cacheKey].data, currentCity);
        }
    }
});