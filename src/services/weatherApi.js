/**
 * WeatherAI service via the SmartFarm backend.
 * The browser never stores or sends the WeatherAI key directly.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080'

function getAuthHeader() {
  const token = localStorage.getItem('smartfarm_token') || ''

  if (!token) throw new Error('Please sign in before using WeatherAI services.')
  return { Authorization: `Bearer ${token}` }
}

async function readResponse(response) {
  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      (typeof data === 'object' && data?.message) ||
      (typeof data === 'string' && data) ||
      response.statusText
    throw new Error(message)
  }

  return data
}

/**
 * Check whether the signed-in SmartFarm user has a stored WeatherAI key.
 */
export async function fetchWeatherKeyStatus() {
  const response = await fetch(`${BACKEND_URL}/weather/key`, {
    headers: getAuthHeader(),
  })

  return readResponse(response)
}

/**
 * Save and validate a WeatherAI API key for the signed-in SmartFarm user.
 */
export async function saveWeatherApiKey(apiKey) {
  const response = await fetch(`${BACKEND_URL}/weather/key`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ api_key: apiKey }),
  })

  return readResponse(response)
}

/**
 * Remove the stored WeatherAI API key for the signed-in SmartFarm user.
 */
export async function deleteWeatherApiKey() {
  const response = await fetch(`${BACKEND_URL}/weather/key`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  })

  return readResponse(response)
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

  const response = await fetch(`${BACKEND_URL}/weather?${query}`, {
    headers: getAuthHeader(),
  })

  return readResponse(response)
}

/**
 * Fetch usage and quota information
 */
export async function fetchUsage() {
  const response = await fetch(`${BACKEND_URL}/weather/usage`, {
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

  const response = await fetch(`${BACKEND_URL}/weather/trees/analyze`, {
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
  const response = await fetch(`${BACKEND_URL}/weather/trees/quota`, {
    headers: getAuthHeader(),
  })

  return readResponse(response)
}
