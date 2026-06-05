/**
 * WeatherAI API service
 * Free tier: 1000 req/mo, 200 AI req/mo, 7 day forecast, 5 analyses/mo
 */

const BASE_URL = 'https://api.weather-ai.co/v1'

function getAuthHeader() {
  const key =
    localStorage.getItem('weatherAiKey') ||
    localStorage.getItem('weatherAiToken') ||
    localStorage.getItem('weather_ai_key') ||
    localStorage.getItem('weather-ai-key') ||
    ''

  if (!key) throw new Error('Missing WeatherAI API key in localStorage.')
  return { Authorization: `Bearer ${key}` }
}

async function readResponse(response) {
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.message || text || response.statusText)
  }

  return data
}

/**
 * Fetch weather forecast for coordinates
 * @param {Object} params - {lat, lon, days?, ai?, units?, lang?}
 */
export async function fetchWeather(params) {
  const query = new URLSearchParams({
    lat: params.lat,
    lon: params.lon,
    days: params.days || '7',
    ai: params.ai !== false ? 'true' : 'false',
    units: params.units || 'metric',
    lang: params.lang || 'en',
  })

  const response = await fetch(`${BASE_URL}/weather?${query}`, {
    headers: getAuthHeader(),
  })

  return readResponse(response)
}

/**
 * Fetch usage and quota information
 */
export async function fetchUsage() {
  const response = await fetch(`${BASE_URL}/usage`, {
    headers: getAuthHeader(),
  })

  return readResponse(response)
}

/**
 * Analyze farm image for tree count and health
 * @param {File} imageFile - Image file to analyze
 * @param {Object} metadata - {farmerId?, county?, landAcres?, location?, notes?}
 */
export async function analyzeImage(imageFile, metadata = {}) {
  const form = new FormData()
  form.append('image', imageFile)

  if (metadata.farmerId) form.append('farmerId', metadata.farmerId)
  if (metadata.county) form.append('county', metadata.county)
  if (metadata.landAcres) form.append('landAcres', metadata.landAcres)
  if (metadata.location) form.append('location', metadata.location)
  if (metadata.notes) form.append('notes', metadata.notes)

  const response = await fetch(`${BASE_URL}/trees/analyze`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: form,
  })

  return readResponse(response)
}

/**
 * Get tree analysis quota
 */
export async function fetchTreeQuota() {
  const response = await fetch(`${BASE_URL}/trees/quota`, {
    headers: getAuthHeader(),
  })

  return readResponse(response)
}
