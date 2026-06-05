/**
 * SmartFarm Backend API service
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080'

async function readResponse(response) {
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.message || text || response.statusText)
  }

  return data
}

/**
 * Register a new account
 */
export async function registerUser(email, password) {
  const response = await fetch(`${BACKEND_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return readResponse(response)
}

/**
 * Login with email and password
 */
export async function loginUser(email, password) {
  const response = await fetch(`${BACKEND_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return readResponse(response)
}

/**
 * Get all farms for authenticated user
 */
export async function fetchFarms(token) {
  const response = await fetch(`${BACKEND_URL}/farms`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return readResponse(response)
}

/**
 * Create a new farm
 */
export async function createFarm(token, farmData) {
  const response = await fetch(`${BACKEND_URL}/farms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...farmData,
      size_acres: Number(farmData.size_acres || 0),
    }),
  })

  return readResponse(response)
}

/**
 * Update an existing farm
 */
export async function updateFarm(token, farmId, farmData) {
  const response = await fetch(`${BACKEND_URL}/farms/${farmId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...farmData,
      size_acres: Number(farmData.size_acres || 0),
    }),
  })

  return readResponse(response)
}

/**
 * Delete a farm
 */
export async function deleteFarm(token, farmId) {
  const response = await fetch(`${BACKEND_URL}/api/farms/${farmId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  return readResponse(response)
}
