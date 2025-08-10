// OpenWeatherMap API Configuration
const API_KEY = '490422f353ae661c2cdb43d5ca5ec32b'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM Elements
const elements = {
    cityInput: document.getElementById('city-input'),
    searchBtn: document.getElementById('search-btn'),
    locationBtn: document.getElementById('location-btn'),
    weatherCard: document.getElementById('weather-card'),
    weatherContent: document.getElementById('weather-content'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    apiNotice: document.getElementById('api-notice'),
    dismissNotice: document.getElementById('dismiss-notice'),
    themeToggle: document.getElementById('theme-toggle'),
    unitToggle: document.getElementById('unit-toggle'),
    
    // Weather data elements
    cityName: document.getElementById('city-name'),
    country: document.getElementById('country'),
    localTime: document.getElementById('local-time'),
    weatherIcon: document.getElementById('weather-icon'),
    temperature: document.getElementById('temperature'),
    weatherDescription: document.getElementById('weather-description'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    visibility: document.getElementById('visibility'),
    pressure: document.getElementById('pressure'),
    
    // Animation containers
    rainContainer: document.getElementById('rain-container'),
    snowContainer: document.getElementById('snow-container')
};

// App State
let currentWeatherData = null;
let currentUnit = 'metric'; // 'metric' for Celsius, 'imperial' for Fahrenheit
let currentTheme = 'light';

// Initialize the app
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    setupEventListeners();
    setupTheme();
    checkApiKey();
}

function setupEventListeners() {
    // Search functionality
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Location functionality
    elements.locationBtn.addEventListener('click', getCurrentLocation);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Unit toggle
    elements.unitToggle.addEventListener('click', toggleUnits);
    
    // API notice
    elements.dismissNotice.addEventListener('click', dismissApiNotice);
}

function setupTheme() {
    const savedTheme = localStorage.getItem('skycast-theme') || 'light';
    currentTheme = savedTheme;
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function checkApiKey() {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showApiNotice();
    } else {
        hideApiNotice();
        // Try to get user's location on app start
        getCurrentLocation();
    }
}

function showApiNotice() {
    elements.apiNotice.style.display = 'block';
    elements.weatherCard.style.display = 'none';
}

function hideApiNotice() {
    elements.apiNotice.style.display = 'none';
    elements.weatherCard.style.display = 'flex';
}

function dismissApiNotice() {
    hideApiNotice();
}

async function handleSearch() {
    const city = elements.cityInput.value.trim();
    if (!city) return;
    
    await getWeatherByCity(city);
}

async function getWeatherByCity(city) {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showApiNotice();
        return;
    }
    
    showLoading();
    hideError();
    
    try {
        const url = `${BASE_URL}?q=${encodeURIComponent(city)}&units=${currentUnit}&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found');
            }
            throw new Error('Weather data unavailable');
        }
        
        const data = await response.json();
        currentWeatherData = data;
        updateUI(data);
        
    } catch (error) {
        console.error('Weather API Error:', error);
        showError(error.message);
    }
}

async function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser');
        return;
    }
    
    showLoading();
    hideError();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await getWeatherByCoords(latitude, longitude);
        },
        (error) => {
            console.error('Geolocation error:', error);
            showError('Unable to get your location. Please search for a city instead.');
        }
    );
}

async function getWeatherByCoords(lat, lon) {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showApiNotice();
        return;
    }
    
    try {
        const url = `${BASE_URL}?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Weather data unavailable');
        }
        
        const data = await response.json();
        currentWeatherData = data;
        updateUI(data);
        
    } catch (error) {
        console.error('Weather API Error:', error);
        showError(error.message);
    }
}

function updateUI(data) {
    hideLoading();
    hideError();
    showWeatherContent();
    
    // Update basic weather info
    elements.cityName.textContent = data.name;
    elements.country.textContent = data.sys.country;
    elements.weatherDescription.textContent = data.weather[0].description;
    
    // Update temperature
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const unit = currentUnit === 'metric' ? '°C' : '°F';
    
    elements.temperature.textContent = `${temp}°`;
    elements.feelsLike.textContent = `Feels like ${feelsLike}${unit}`;
    
    // Update weather details
    elements.humidity.textContent = `${data.main.humidity}%`;
    
    const windSpeed = currentUnit === 'metric' 
        ? `${Math.round(data.wind.speed * 3.6)} km/h`
        : `${Math.round(data.wind.speed)} mph`;
    elements.windSpeed.textContent = windSpeed;
    
    const visibility = data.visibility 
        ? `${(data.visibility / 1000).toFixed(1)} km`
        : 'N/A';
    elements.visibility.textContent = visibility;
    
    elements.pressure.textContent = `${data.main.pressure} hPa`;
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    elements.weatherIcon.alt = data.weather[0].description;
    
    // Update local time
    updateLocalTime(data.timezone);
    
    // Update background and animations
    updateWeatherBackground(data.weather[0].main.toLowerCase());
    
    // Clear search input
    elements.cityInput.value = '';
}

function updateLocalTime(timezone) {
    const updateTime = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const localTime = new Date(utc + (timezone * 1000));
        
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        
        elements.localTime.textContent = localTime.toLocaleTimeString('en-US', options);
    };
    
    updateTime();
    // Update every minute
    setInterval(updateTime, 60000);
}

function updateWeatherBackground(weather) {
    // Remove existing weather classes
    document.body.classList.remove(
        'weather-clear', 'weather-clouds', 'weather-rain', 
        'weather-snow', 'weather-mist', 'weather-fog'
    );
    
    // Stop existing animations
    clearWeatherAnimations();
    
    // Apply new weather class and animations
    switch (weather) {
        case 'clear':
            document.body.classList.add('weather-clear');
            break;
        case 'clouds':
            document.body.classList.add('weather-clouds');
            break;
        case 'rain':
        case 'drizzle':
        case 'thunderstorm':
            document.body.classList.add('weather-rain');
            createRainAnimation();
            break;
        case 'snow':
            document.body.classList.add('weather-snow');
            createSnowAnimation();
            break;
        case 'mist':
        case 'fog':
        case 'haze':
            document.body.classList.add('weather-mist');
            break;
        default:
            document.body.classList.add('weather-clear');
    }
}

function createRainAnimation() {
    const rainCount = 100;
    
    for (let i = 0; i < rainCount; i++) {
        setTimeout(() => {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            raindrop.style.left = Math.random() * 100 + '%';
            raindrop.style.animationDuration = (Math.random() * 1 + 0.5) + 's';
            raindrop.style.animationDelay = Math.random() * 2 + 's';
            
            elements.rainContainer.appendChild(raindrop);
            
            // Remove raindrop after animation
            setTimeout(() => {
                if (raindrop.parentNode) {
                    raindrop.parentNode.removeChild(raindrop);
                }
            }, 3000);
        }, i * 100);
    }
}

function createSnowAnimation() {
    const snowCount = 50;
    const snowflakes = ['❄', '❅', '❆'];
    
    for (let i = 0; i < snowCount; i++) {
        setTimeout(() => {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
            snowflake.style.animationDelay = Math.random() * 2 + 's';
            snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
            
            elements.snowContainer.appendChild(snowflake);
            
            // Remove snowflake after animation
            setTimeout(() => {
                if (snowflake.parentNode) {
                    snowflake.parentNode.removeChild(snowflake);
                }
            }, 5000);
        }, i * 200);
    }
}

function clearWeatherAnimations() {
    elements.rainContainer.innerHTML = '';
    elements.snowContainer.innerHTML = '';
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('skycast-theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    elements.themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

function toggleUnits() {
    if (!currentWeatherData) return;
    
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    elements.unitToggle.textContent = currentUnit === 'metric' ? '°C' : '°F';
    
    // Re-fetch weather data with new units
    if (currentWeatherData.coord) {
        getWeatherByCoords(currentWeatherData.coord.lat, currentWeatherData.coord.lon);
    }
}

function showLoading() {
    elements.loading.style.display = 'flex';
    elements.weatherContent.style.display = 'none';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function showWeatherContent() {
    elements.weatherContent.style.display = 'block';
}

function showError(message) {
    hideLoading();
    elements.weatherContent.style.display = 'none';
    elements.errorMessage.style.display = 'flex';
    elements.errorMessage.querySelector('.error-content p').textContent = message;
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(registrationError => console.log('SW registration failed'));
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        elements.cityInput.focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        elements.cityInput.value = '';
        elements.cityInput.blur();
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Back online');
    hideError();
});

window.addEventListener('offline', () => {
    console.log('Gone offline');
    showError('You are currently offline. Please check your internet connection.');
});

// Auto-refresh weather data every 10 minutes
setInterval(() => {
    if (currentWeatherData && API_KEY !== 'YOUR_API_KEY_HERE') {
        getWeatherByCoords(currentWeatherData.coord.lat, currentWeatherData.coord.lon);
    }
}, 600000); // 10 minutes
