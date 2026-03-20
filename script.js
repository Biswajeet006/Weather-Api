document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const weatherSection = document.getElementById('weather-section');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const loader = document.getElementById('loader');

    // Weather elements mapping
    const elements = {
        cityName: document.getElementById('city-name'),
        countryName: document.getElementById('country-name'),
        dateTime: document.getElementById('date-time'),
        temp: document.getElementById('temp'),
        weatherDesc: document.getElementById('weather-desc'),
        weatherIcon: document.getElementById('weather-icon'),
        feelsLike: document.getElementById('feels-like'),
        humidity: document.getElementById('humidity'),
        windSpeed: document.getElementById('wind-speed'),
        precipitation: document.getElementById('precipitation')
    };

    // WMO Weather codes mapped to icons and styles
    const weatherCodes = {
        0: { desc: 'Clear sky', icon: 'fa-sun', class: 'sunny' },
        1: { desc: 'Mainly clear', icon: 'fa-sun', class: 'sunny' },
        2: { desc: 'Partly cloudy', icon: 'fa-cloud-sun', class: 'cloudy' },
        3: { desc: 'Overcast', icon: 'fa-cloud', class: 'cloudy' },
        45: { desc: 'Fog', icon: 'fa-smog', class: 'cloudy' },
        48: { desc: 'Depositing rime fog', icon: 'fa-smog', class: 'cloudy' },
        51: { desc: 'Light drizzle', icon: 'fa-cloud-rain', class: 'rainy' },
        53: { desc: 'Moderate drizzle', icon: 'fa-cloud-rain', class: 'rainy' },
        55: { desc: 'Dense drizzle', icon: 'fa-cloud-showers-heavy', class: 'rainy' },
        56: { desc: 'Light freezing drizzle', icon: 'fa-cloud-rain', class: 'rainy' },
        57: { desc: 'Dense freezing drizzle', icon: 'fa-cloud-rain', class: 'rainy' },
        61: { desc: 'Slight rain', icon: 'fa-cloud-rain', class: 'rainy' },
        63: { desc: 'Moderate rain', icon: 'fa-cloud-showers-heavy', class: 'rainy' },
        65: { desc: 'Heavy rain', icon: 'fa-cloud-showers-heavy', class: 'rainy' },
        66: { desc: 'Light freezing rain', icon: 'fa-cloud-rain', class: 'rainy' },
        67: { desc: 'Heavy freezing rain', icon: 'fa-cloud-showers-heavy', class: 'rainy' },
        71: { desc: 'Slight snow fall', icon: 'fa-snowflake', class: 'snowy' },
        73: { desc: 'Moderate snow fall', icon: 'fa-snowflake', class: 'snowy' },
        75: { desc: 'Heavy snow fall', icon: 'fa-snowflake', class: 'snowy' },
        77: { desc: 'Snow grains', icon: 'fa-snowflake', class: 'snowy' },
        80: { desc: 'Slight rain showers', icon: 'fa-cloud-rain', class: 'rainy' },
        81: { desc: 'Moderate rain showers', icon: 'fa-cloud-showers-heavy', class: 'rainy' },
        82: { desc: 'Violent rain showers', icon: 'fa-cloud-showers-heavy', class: 'rainy' },
        85: { desc: 'Slight snow showers', icon: 'fa-snowflake', class: 'snowy' },
        86: { desc: 'Heavy snow showers', icon: 'fa-snowflake', class: 'snowy' },
        95: { desc: 'Thunderstorm', icon: 'fa-cloud-bolt', class: 'storm' },
        96: { desc: 'Thunderstorm with slight hail', icon: 'fa-cloud-bolt', class: 'storm' },
        99: { desc: 'Thunderstorm with heavy hail', icon: 'fa-cloud-bolt', class: 'storm' }
    };

    const updateDateTime = (timezoneStr) => {
        try {
            const now = new Date();
            const options = {
                weekday: 'long',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                timeZone: timezoneStr
            };
            const formatter = new Intl.DateTimeFormat('en-US', options);
            elements.dateTime.textContent = formatter.format(now);
        } catch (e) {
            const now = new Date();
            const options = { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true };
            elements.dateTime.textContent = now.toLocaleDateString('en-US', options);
        }
    };

    const showError = (message) => {
        errorText.textContent = message;
        errorMessage.classList.add('show');
        weatherSection.classList.add('hidden');
        loader.classList.add('hidden');
    };

    const hideError = () => {
        errorMessage.classList.remove('show');
    };

    const updateBackgroundTheme = (weatherClass) => {
        const root = document.documentElement;
        if (weatherClass === 'sunny') {
            root.style.setProperty('--bg-gradient-start', '#1e1e2f');
            root.style.setProperty('--bg-gradient-end', '#2d2b42');
        } else if (weatherClass === 'cloudy') {
            root.style.setProperty('--bg-gradient-start', '#232526');
            root.style.setProperty('--bg-gradient-end', '#414345');
        } else if (weatherClass === 'rainy') {
            root.style.setProperty('--bg-gradient-start', '#0f2027');
            root.style.setProperty('--bg-gradient-end', '#203a43');
        } else if (weatherClass === 'snowy') {
            root.style.setProperty('--bg-gradient-start', '#8e9eab');
            root.style.setProperty('--bg-gradient-end', '#eef2f3');
        } else if (weatherClass === 'storm') {
            root.style.setProperty('--bg-gradient-start', '#141e30');
            root.style.setProperty('--bg-gradient-end', '#243b55');
        }
    };

    const getWeather = async (city) => {
        if (!city.trim()) return;

        hideError();
        weatherSection.classList.add('hidden');
        loader.classList.remove('hidden');

        try {
            // First API: Open-Meteo Geocoding (No API Key Required)
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                showError("City not found. Please try again.");
                return;
            }

            const { latitude: lat, longitude: lon, name, country, timezone } = geoData.results[0];

            // Second API: Open-Meteo Weather Forecast (No API Key Required)
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();

            if (weatherData.error) {
                showError("Could not fetch weather data.");
                return;
            }

            const current = weatherData.current;

            // Populate UI
            elements.cityName.textContent = name;
            elements.countryName.textContent = country || '';
            updateDateTime(weatherData.timezone);

            elements.temp.textContent = Math.round(current.temperature_2m);
            elements.feelsLike.textContent = Math.round(current.apparent_temperature);
            elements.humidity.textContent = current.relative_humidity_2m;
            elements.windSpeed.textContent = current.wind_speed_10m;
            elements.precipitation.textContent = current.precipitation;

            // Update Icon & Description
            const code = current.weather_code;
            const weatherInfo = weatherCodes[code] || weatherCodes[0];

            elements.weatherDesc.textContent = weatherInfo.desc;
            elements.weatherIcon.className = `fa-solid wea-icon ${weatherInfo.icon} ${weatherInfo.class}`;

            updateBackgroundTheme(weatherInfo.class);

            // Show weather data
            loader.classList.add('hidden');
            weatherSection.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            showError("An error occurred while fetching data.");
        }
    };

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        getWeather(cityInput.value);
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getWeather(cityInput.value);
        }
    });

    // Load default weather
    getWeather('Delhi');
});
