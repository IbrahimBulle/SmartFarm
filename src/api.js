// ⚠️ IMPORTANT: This file is for testing/development only
// The main app uses src/services/weatherApi.js which reads the API key from localStorage
// Users must provide their own API key via the app - do NOT hardcode keys here

function getApiKey() {
  // Try to read from localStorage (for production use)
  const key =
    (typeof window !== 'undefined' && window.localStorage?.getItem('smartfarm_weather_ai_key')) ||
    (typeof window !== 'undefined' && window.localStorage?.getItem('weatherAiToken')) ||
    (typeof window !== 'undefined' && window.localStorage?.getItem('weather_ai_key')) ||
    (typeof window !== 'undefined' && window.localStorage?.getItem('weather-ai-key'))

  if (!key) {
    throw new Error(
      'No WeatherAI API key found. Please set your API key via the SmartFarm app or in localStorage (smartfarm_weather_ai_key)',
    )
  }

  return key
}

const BASE_URL = 'https://api.weather-ai.co/v1'

// =========================
// CORE FETCH HELPER
// =========================
async function request(endpoint) {
  try {
    const API_KEY = getApiKey()

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "API Error");
    }

    return data;
  } catch (err) {
    console.error("API ERROR:", err.message);
    return null;
  }
}

// =========================
// 🌦 WEATHER APIS (FREE)
// =========================

// Current weather + AI summary
export const getWeather = (lat, lon) =>
  request(`/weather?lat=${lat}&lon=${lon}`);

// Basic forecast
export const getForecast = (lat, lon) =>
  request(`/forecast?lat=${lat}&lon=${lon}`);

// Current conditions
export const getCurrent = (lat, lon) =>
  request(`/current?lat=${lat}&lon=${lon}`);

// Daily forecast
export const getDaily = (lat, lon) =>
  request(`/daily?lat=${lat}&lon=${lon}`);

// Hourly forecast
export const getHourly = (lat, lon) =>
  request(`/hourly?lat=${lat}&lon=${lon}`);

// 7-day forecast default (free limit)
export const getForecast7 = (lat, lon) =>
  request(`/weather?lat=${lat}&lon=${lon}&days=7`);

// Weather from IP (no coords needed)
export const getWeatherFromIP = () =>
  request(`/ip-lookup`);

// Geo-based weather helper
export const getWeatherGeo = () =>
  request(`/weather-geo`);

// =========================
// 📊 ACCOUNT (FREE)
// =========================

// Usage + quota tracking
export const getUsage = () =>
  request(`/usage`);

// =========================
// 🧪 QUICK TEST FUNCTION
// =========================

export async function testAllFreeAPIs() {
  console.log("Testing WeatherAI Free APIs...");

  const lat = -1.2921;
  const lon = 36.8219;

  const results = {
    weather: await getWeather(lat, lon),
    forecast: await getForecast(lat, lon),
    current: await getCurrent(lat, lon),
    daily: await getDaily(lat, lon),
    hourly: await getHourly(lat, lon),
    ip: await getWeatherFromIP(),
    geo: await getWeatherGeo(),
    usage: await getUsage(),
  };

  console.log("ALL RESULTS:", results);

  return results;
}

getUsage()