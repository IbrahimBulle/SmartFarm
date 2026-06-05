// Testing/development helper for the SmartFarm backend weather proxy.

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080'

function getAuthHeader() {
  const token = typeof window !== 'undefined' ? window.localStorage?.getItem('smartfarm_token') : ''

  if (!token) throw new Error('Sign in before testing backend weather APIs.')
  return { Authorization: `Bearer ${token}` }
}

// =========================
// CORE FETCH HELPER
// =========================
async function request(endpoint) {
  try {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeader(),
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
  request(`/weather?lat=${lat}&lon=${lon}&days=7`);

// Current conditions
export const getCurrent = (lat, lon) =>
  request(`/weather?lat=${lat}&lon=${lon}&days=1&ai=false`);

// Daily forecast
export const getDaily = (lat, lon) =>
  request(`/weather?lat=${lat}&lon=${lon}&days=7&ai=false`);

// Hourly forecast
export const getHourly = (lat, lon) =>
  request(`/weather?lat=${lat}&lon=${lon}&days=1&ai=false`);

// 7-day forecast default (free limit)
export const getForecast7 = (lat, lon) =>
  request(`/weather?lat=${lat}&lon=${lon}&days=7`);

// Weather from IP (no coords needed)
export const getWeatherFromIP = () =>
  request(`/weather`);

// Geo-based weather helper
export const getWeatherGeo = () =>
  request(`/weather`);

// =========================
// 📊 ACCOUNT (FREE)
// =========================

// Usage + quota tracking
export const getUsage = () =>
  request(`/weather/usage`);

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
