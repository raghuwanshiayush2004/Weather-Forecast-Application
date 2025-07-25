// ==============================================
// GLOBAL VARIABLES AND CONSTANTS
// ==============================================

// DOM Elements
const locationInput = document.querySelector('.location-input'); // Search input field
const locationSearchBtn = document.querySelector('.location-search'); // Search button
const trackLocationBtn = document.querySelector('.track-location'); // Current location button
const noCityEnteredElement = document.querySelector('.no-city-entered'); // Empty state element
const mainWeatherSection = document.querySelector('.main-weather-section'); // Main weather card
const mainWeatherImage = document.querySelector('.location-weather-image'); // Weather icon
const mainWeatherLocationName = document.querySelector('.location-name'); // Location name
const mainWeatherLocationTemp = document.querySelector('.location-temp'); // Temperature display
const mainWeatherLocationDateTime = document.querySelector('.location-date-time'); // Date/time
const mainWeatherLocationWeatherType = document.querySelector('.location-weather-description'); // Weather description
const weatherOtherDetailsContainer = document.querySelector('.other-weather-section'); // Additional weather info container
const weatherOtherDetailsContainerHeading = document.querySelector('.other-weather-details-section-heading'); // "Today's Highlights" heading
const extendedForecastHeading = document.querySelector('.extended-forecast-heading'); // 5-day forecast heading
const extendedForecastContainer = document.querySelector('.extended-forecast-container'); // Forecast cards container
const recentSearchDropdownContainer = document.querySelector('.recent-search-dropdown-container'); // Recent searches dropdown
const recentSearchDropdown = document.querySelector('.recent-search-dropdown'); // Recent searches list
const recentSearchDropdownHeading = document.querySelector('.recent-search-heading'); // Recent searches button
const toggleUnitBtn = document.getElementById('toggle-unit-btn'); // Temperature unit toggle button

// API Configuration
const VISUAL_CROSSING_API_KEY = "8ZLS6YDNME24NJG9R37MG7RU2"; // Weather API key
const VISUAL_CROSSING_BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";
const GEO_CODE_BASE_URL = "https://geocode.maps.co/reverse?"; // Reverse geocoding API
const GEO_CODE_API_KEY = "668cd66d4bc6b339749963owr35b6b3"; // Geocoding API key

// State Variables
let useCelsius = true; // Temperature unit flag (true = Celsius, false = Fahrenheit)
let currentWeatherData = null; // Stores current weather data for unit conversion

// API URL Templates
const apiUrls = {
    byLocationName: (locationName) => `${VISUAL_CROSSING_BASE_URL}${locationName}/?unitGroup=metric&include=days&key=${VISUAL_CROSSING_API_KEY}&contentType=json`,
    byPositionalValues: (latitude, longitude) => `${VISUAL_CROSSING_BASE_URL}${latitude},${longitude}?unitGroup=metric&include=days&key=${VISUAL_CROSSING_API_KEY}&contentType=json`,
    findLocationByPositions: (latitude, longitude) => `${GEO_CODE_BASE_URL}lat=${latitude}&lon=${longitude}&api_key=${GEO_CODE_API_KEY}`
};

// Recent searches from localStorage or empty array
const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// Weather icon mappings
const weatherTypesImages = {
    sunny: "./resources/sunny.png",
    cloud: "./resources/cloudy.png",
    rain: "./resources/rainy.png",
    snow: "./resources/snow.png",
    clear: "./resources/clear.png",
    wind: "./resources/wind.png",
    fog: "./resources/fog.png",
    'partly-cloudy': "./resources/cloudy.png",
    'mostly-cloudy': "./resources/cloudy.png"
};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Converts Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
function celsiusToFahrenheit(celsius) {
    return Math.round((celsius * 9 / 5) + 32);
}

/**
 * Converts Fahrenheit to Celsius
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
function fahrenheitToCelsius(fahrenheit) {
    return Math.round((fahrenheit - 32) * 5 / 9);
}

/**
 * Shows loading spinner overlay
 */
function showLoading() {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loadingElement.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg flex items-center gap-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p class="text-lg font-medium">Loading weather data...</p>
        </div>
    `;
    loadingElement.id = 'loading-spinner';
    document.body.appendChild(loadingElement);
}

/**
 * Hides loading spinner
 */
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.remove();
}

// ==============================================
// WEATHER DISPLAY FUNCTIONS
// ==============================================

/**
 * Updates main weather display with current conditions
 * @param {Object} weatherData - Weather API response
 * @param {string} [locationName] - Optional custom location name
 */
function updateMainWeatherDetails(weatherData, locationName) {
    currentWeatherData = weatherData; // Store for unit toggling

    let { address: name } = weatherData;
    const { icon, temp, datetime: date, description } = weatherData?.days[0];
    let iconImageURL = weatherTypesImages['clear']; // Default icon

    name = locationName ? locationName : name;

    // Show weather elements and hide empty state
    mainWeatherSection.classList.remove('hidden');
    noCityEnteredElement.classList.add('hidden');

    // Find matching weather icon
    Object.keys(weatherTypesImages).forEach(key => {
        if (icon.toLowerCase().includes(key)) {
            iconImageURL = weatherTypesImages[key];
        }
    });

    // Update DOM elements
    mainWeatherImage.src = iconImageURL;
    mainWeatherImage.alt = icon;
    mainWeatherImage.title = icon;
    mainWeatherLocationName.textContent = name.toUpperCase();

    // Update temperature display
    updateTemperatureDisplay(temp);

    // Format and display date
    const dateObj = new Date(date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    mainWeatherLocationDateTime.textContent = dateObj.toLocaleDateString('en-US', options);

    // Capitalize first letter of description
    mainWeatherLocationWeatherType.textContent = description.charAt(0).toUpperCase() + description.slice(1);

    // Show other sections
    weatherOtherDetailsContainerHeading.classList.remove('hidden');
    extendedForecastHeading.classList.remove('hidden');
}

/**
 * Updates temperature display based on current unit
 * @param {number} tempCelsius - Temperature in Celsius
 */
function updateTemperatureDisplay(tempCelsius) {
    const temp = useCelsius ? Math.round(tempCelsius) : celsiusToFahrenheit(tempCelsius);
    mainWeatherLocationTemp.textContent = `${temp}°${useCelsius ? 'C' : 'F'}`;
    mainWeatherLocationTemp.dataset.celsius = tempCelsius; // Store original value
}

/**
 * Clears all children from a DOM element
 * @param {HTMLElement} container - The element to clear
 */
function removePreviousChildren(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

/**
 * Updates additional weather details (Today's Highlights)
 * @param {Object} weatherData - Weather API response
 */
function updateOtherWeatherDetails(weatherData) {
    removePreviousChildren(weatherOtherDetailsContainer);

    const { dew, humidity, precip, windspeed, uvindex, visibility, sunrise, sunset, pressure } = weatherData?.days[0];

    // Weather properties to display
    const weatherProperties = [
        { name: "UV Index", value: uvindex, unit: "", icon: "fa-sun" },
        { name: "Humidity", value: humidity, unit: "%", icon: "fa-droplet" },
        { name: "Precipitation", value: precip, unit: "mm", icon: "fa-umbrella" },
        { name: "Wind Speed", value: windspeed, unit: "km/h", icon: "fa-wind" },
        { name: "Visibility", value: visibility, unit: "km", icon: "fa-eye" },
        { name: "Dew Point", value: useCelsius ? Math.round(dew) : celsiusToFahrenheit(dew), unit: `°${useCelsius ? 'C' : 'F'}`, icon: "fa-temperature-low" },
        { name: "Sunrise", value: sunrise, unit: "", icon: "fa-sun" },
        { name: "Sunset", value: sunset, unit: "", icon: "fa-moon" },
        { name: "Pressure", value: pressure, unit: "hPa", icon: "fa-gauge" }
    ];

    // Create and append weather cards
    weatherProperties.forEach((property, index) => {
        const weatherCard = document.createElement('div');
        weatherCard.className = `weather-card bg-white rounded-xl p-4 shadow-md flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 delay-${index * 100}`;

        const icon = document.createElement('i');
        icon.className = `fas ${property.icon} text-2xl text-primary mb-2`;

        const name = document.createElement('h3');
        name.className = "font-semibold text-lg text-center text-gray-700 mb-1";
        name.textContent = property.name;

        const value = document.createElement('p');
        value.className = "text-xl font-bold text-dark";
        value.textContent = property.value + (property.unit ? property.unit : '');

        // Store original value for unit conversion
        if (property.name === "Dew Point") {
            value.dataset.celsius = dew;
        }

        weatherCard.append(icon, name, value);
        weatherOtherDetailsContainer.appendChild(weatherCard);
    });
}

/**
 * Updates 5-day forecast display
 * @param {Object} weatherData - Weather API response
 */
function updatedExtendedWeatherDetails(weatherData) {
    removePreviousChildren(extendedForecastContainer);

    // Create forecast cards for next 5 days
    weatherData?.days?.slice(1, 6).forEach((day, index) => {
        const { datetime: date, icon, temp, humidity, windspeed, description } = day;
        const dateObj = new Date(date);
        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const displayTemp = useCelsius ? Math.round(temp) : celsiusToFahrenheit(temp);

        // Create forecast card element
        const forecastCard = document.createElement('div');
        forecastCard.className = `weather-card bg-white rounded-xl p-4 shadow-md flex flex-col items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 delay-${index * 100}`;

        // Weekday element
        const weekdayElement = document.createElement('h3');
        weekdayElement.className = "font-bold text-lg text-dark";
        weekdayElement.textContent = weekday;

        // Date element
        const dateElement = document.createElement('p');
        dateElement.className = "text-sm text-gray-500 mb-3";
        dateElement.textContent = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // Weather icon
        let iconImageURL = weatherTypesImages['clear']; // Default
        Object.keys(weatherTypesImages).forEach(key => {
            if (icon.toLowerCase().includes(key)) {
                iconImageURL = weatherTypesImages[key];
            }
        });

        const iconImg = document.createElement('img');
        iconImg.src = iconImageURL;
        iconImg.alt = description;
        iconImg.className = "w-20 h-20 my-2";

        // Temperature element
        const tempElement = document.createElement('p');
        tempElement.className = "text-2xl font-bold text-primary my-2";
        tempElement.textContent = `${displayTemp}°${useCelsius ? 'C' : 'F'}`;
        tempElement.dataset.celsius = temp; // Store original value

        // Weather description
        const descElement = document.createElement('p');
        descElement.className = "text-sm text-gray-600 text-center mb-2";
        descElement.textContent = description.charAt(0).toUpperCase() + description.slice(1);

        // Additional info (humidity and wind)
        const infoContainer = document.createElement('div');
        infoContainer.className = "flex justify-between w-full mt-2 text-xs text-gray-500";

        const humidityElement = document.createElement('span');
        humidityElement.innerHTML = `<i class="fas fa-droplet mr-1"></i>${humidity}%`;

        const windElement = document.createElement('span');
        windElement.innerHTML = `<i class="fas fa-wind mr-1"></i>${Math.round(windspeed)}km/h`;

        infoContainer.append(humidityElement, windElement);
        forecastCard.append(weekdayElement, dateElement, iconImg, tempElement, descElement, infoContainer);
        extendedForecastContainer.appendChild(forecastCard);
    });
}

// ==============================================
// RECENT SEARCHES FUNCTIONS
// ==============================================

/**
 * Adds a location to recent searches
 * @param {string} locationName - Location to add
 * @param {boolean} [toAddForcefully] - Skip duplicate check if true
 */
function addLocationToRecentSearch(locationName, toAddForcefully) {
    // Skip if already exists (unless forced)
    if (!toAddForcefully && recentSearches.includes(locationName.toLowerCase())) return;

    // Limit to 10 recent searches
    if (recentSearchDropdown.children.length >= 10) {
        recentSearchDropdown.removeChild(recentSearchDropdown.lastChild);
    }

    // Create search item element
    const searchItem = document.createElement('div');
    searchItem.className = "location-option px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 transition-colors";
    searchItem.innerHTML = `
        <i class="fas fa-clock text-gray-400"></i>
        <span>${locationName.charAt(0).toUpperCase() + locationName.slice(1)}</span>
    `;

    // Add to beginning of list (unless forced)
    if (!toAddForcefully) {
        recentSearchDropdown.insertBefore(searchItem, recentSearchDropdown.firstChild);
        recentSearches.unshift(locationName.toLowerCase());
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    } else {
        recentSearchDropdown.appendChild(searchItem);
    }

    // Show dropdown if hidden
    recentSearchDropdownContainer.classList.remove('hidden');
}

// ==============================================
// UI UTILITY FUNCTIONS
// ==============================================

/**
 * Shows a temporary popup message
 * @param {string} message - Message to display
 * @param {boolean} [isError] - If true, shows as error style
 */
function popupMessage(message, isError = false) {
    const popup = document.createElement('div');
    popup.className = `fixed top-6 right-6 z-50 animate-fade-in-down`;
    popup.innerHTML = `
        <div class="${isError ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} border px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <i class="fas ${isError ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(popup);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        popup.classList.add('animate-fade-out-up');
        setTimeout(() => popup.remove(), 300);
    }, 3000);
}

/**
 * Validates location name input
 * @param {string} locationName - Location to validate
 * @returns {boolean} True if valid
 */
function validateLocationName(locationName) {
    if (!locationName.trim()) {
        popupMessage("Please enter a location name", true);
        return false;
    }
    if (!/^[a-zA-Z\s,.'-]+$/.test(locationName)) {
        popupMessage("Please enter a valid location name", true);
        return false;
    }
    return true;
}

// ==============================================
// WEATHER DATA FETCHING
// ==============================================

/**
 * Fetches weather data from API
 * @param {Event} e - Optional event object
 * @param {string} [locationNamePassed] - Predefined location name
 * @param {number} [latitude] - Optional latitude
 * @param {number} [longitude] - Optional longitude
 * @param {string} [tracedLocationName] - Location name from coordinates
 * @param {boolean} [isTrackLocationOn] - If true, skips validation
 */
async function fetchWeatherData(e, locationNamePassed, latitude, longitude, tracedLocationName, isTrackLocationOn) {
    const locationName = locationNamePassed ? locationNamePassed : locationInput.value.trim();

    // Validate input (unless tracking location)
    if (!isTrackLocationOn && !validateLocationName(locationName)) return;

    showLoading();

    try {
        let weatherResponse, weatherResponseJson;

        if (!latitude) {
            // Fetch by location name
            weatherResponse = await fetch(apiUrls.byLocationName(locationName));
            weatherResponseJson = await weatherResponse.json();

            if (!weatherResponseJson || !weatherResponseJson.days) {
                throw new Error("Invalid location or no weather data available");
            }
        } else {
            // Fetch by coordinates
            weatherResponse = await fetch(apiUrls.byPositionalValues(latitude, longitude));
            weatherResponseJson = await weatherResponse.json();
        }

        // Update UI with weather data
        if (tracedLocationName) {
            updateMainWeatherDetails(weatherResponseJson, tracedLocationName);
        } else {
            updateMainWeatherDetails(weatherResponseJson);
        }

        updateOtherWeatherDetails(weatherResponseJson);
        updatedExtendedWeatherDetails(weatherResponseJson);

        // Add to recent searches (unless tracking location)
        if (!isTrackLocationOn) {
            addLocationToRecentSearch(locationName, false);
            locationInput.value = "";
        }

    } catch (error) {
        console.error("Weather fetch error:", error);
        popupMessage(error.message || "Failed to fetch weather data", true);
    } finally {
        hideLoading();
    }
}

// ==============================================
// TEMPERATURE UNIT CONVERSION
// ==============================================

/**
 * Toggles between Celsius and Fahrenheit
 */
function toggleTemperatureUnit() {
    useCelsius = !useCelsius;

    // Update button text
    toggleUnitBtn.textContent = `Switch to ${useCelsius ? 'Fahrenheit' : 'Celsius'}`;

    // Update main temperature if available
    if (currentWeatherData) {
        const currentTemp = currentWeatherData.days[0].temp;
        updateTemperatureDisplay(currentTemp);
    }

    // Update extended forecast temperatures
    document.querySelectorAll('.extended-forecast-container [data-celsius]').forEach(tempElement => {
        const tempCelsius = parseFloat(tempElement.dataset.celsius);
        tempElement.textContent = `${useCelsius ? Math.round(tempCelsius) : celsiusToFahrenheit(tempCelsius)}°${useCelsius ? 'C' : 'F'}`;
    });

    // Update dew point temperatures
    document.querySelectorAll('.other-weather-section [data-celsius]').forEach(dewElement => {
        const dewCelsius = parseFloat(dewElement.dataset.celsius);
        dewElement.textContent = `${useCelsius ? Math.round(dewCelsius) : celsiusToFahrenheit(dewCelsius)}°${useCelsius ? 'C' : 'F'}`;
    });
}

// ==============================================
// RECENT SEARCHES HANDLING
// ==============================================

/**
 * Handles clicks on recent search items
 * @param {Event} e - Click event
 */
function fetchWeatherDataOnLocationClickedInDropdown(e) {
    if (e.target.closest('.location-option')) {
        const locationName = e.target.closest('.location-option').querySelector('span').textContent;
        fetchWeatherData(null, locationName);
    }
}

// ==============================================
// GEOLOCATION FUNCTIONS
// ==============================================

/**
 * Initiates geolocation tracking
 */
function trackLocation(e) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            findCoordinates,
            () => popupMessage("Please enable location permissions in your browser settings", true),
            { enableHighAccuracy: true }
        );
    } else {
        popupMessage("Geolocation is not supported by your browser", true);
    }
}

/**
 * Reverse geocodes coordinates to location name
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} Location name
 */
async function findLocationByPositions(latitude, longitude) {
    try {
        const res = await fetch(apiUrls.findLocationByPositions(latitude, longitude));
        const resJSON = await res.json();

        if (resJSON.address) {
            const city = resJSON.address.city || resJSON.address.town || resJSON.address.village;
            const state = resJSON.address.state || resJSON.address.county;
            return city && state ? `${city}, ${state}` : "Current Location";
        }
        return "Current Location";
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return "Current Location";
    }
}

/**
 * Handles successful geolocation
 * @param {GeolocationPosition} positions - Geolocation data
 */
async function findCoordinates(positions) {
    const { latitude, longitude } = positions.coords;
    try {
        const locationName = await findLocationByPositions(latitude, longitude);
        fetchWeatherData(null, locationName, latitude, longitude, locationName, true);
    } catch (error) {
        popupMessage("Failed to determine your location name", true);
        fetchWeatherData(null, "Current Location", latitude, longitude, "Current Location", true);
    }
}

// ==============================================
// INITIALIZATION
// ==============================================

/**
 * Loads recent searches on page load
 */
function initializeRecentSearches() {
    if (recentSearches.length) {
        // Load first recent search automatically
        fetchWeatherData(null, recentSearches[0]);

        // Populate recent searches dropdown
        recentSearches.slice(0, 10).forEach(searchName => {
            addLocationToRecentSearch(searchName, true);
        });
    }
}

// ==============================================
// EVENT LISTENERS
// ==============================================

// Search button click
locationSearchBtn.addEventListener('click', fetchWeatherData);

// Current location button click
trackLocationBtn.addEventListener('click', trackLocation);

// Recent search item click
recentSearchDropdown.addEventListener('click', fetchWeatherDataOnLocationClickedInDropdown);

// Temperature unit toggle
toggleUnitBtn.addEventListener('click', toggleTemperatureUnit);

// Search on Enter key
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchWeatherData();
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeRecentSearches);