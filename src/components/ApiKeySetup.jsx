import { useState } from 'react'

export function ApiKeySetup({ onApiKeySet, status, setStatus }) {
  const [apiKey, setApiKey] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSetApiKey(e) {
    e.preventDefault()
    if (!apiKey.trim()) {
      setStatus('Please enter a valid API key.')
      return
    }

    setIsSaving(true)
    try {
      // Store the API key in localStorage
      localStorage.setItem('smartfarm_weather_ai_key', apiKey.trim())

      // Test the connection by trying to fetch usage
      const response = await fetch('https://api.weather-ai.co/v1/usage', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      })

      if (!response.ok) {
        localStorage.removeItem('smartfarm_weather_ai_key')
        throw new Error(`API key validation failed: ${response.statusText}`)
      }

      setStatus('✅ API key successfully configured!')
      setApiKey('')
      setShowInput(false)
      onApiKeySet()
    } catch (error) {
      setStatus(`❌ ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  function handleChangeApiKey() {
    const currentKey = localStorage.getItem('smartfarm_weather_ai_key') || ''
    setApiKey(currentKey)
    setShowInput(true)
  }

  const hasApiKey = Boolean(
    localStorage.getItem('smartfarm_weather_ai_key') ||
      localStorage.getItem('weatherAiToken') ||
      localStorage.getItem('weather_ai_key') ||
      localStorage.getItem('weather-ai-key'),
  )

  if (showInput) {
    return (
      <div className="panel api-key-setup">
        <h3>🔑 Weather API Configuration</h3>
        <p className="panel-note">Enter your WeatherAI API key. Get one for free at weather-ai.co</p>

        <form onSubmit={handleSetApiKey}>
          <label>
            WeatherAI API Key
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Bearer token from weather-ai.co"
              disabled={isSaving}
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={isSaving || !apiKey.trim()}>
              {isSaving ? 'Validating...' : 'Save & Validate'}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setShowInput(false)
                setApiKey('')
              }}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  if (!hasApiKey) {
    return (
      <div className="panel api-key-setup">
        <h3>🔐 API Key Required</h3>
        <p className="panel-note">Your SmartFarm needs a WeatherAI API key to fetch weather data and perform image analysis.</p>

        <div className="setup-info">
          <strong>Free Tier Includes:</strong>
          <ul>
            <li>1,000 weather requests/month</li>
            <li>200 AI requests/month</li>
            <li>7-day forecasts</li>
            <li>5 image analyses/month</li>
          </ul>
        </div>

        <button className="primary-button" onClick={handleChangeApiKey}>
          🔑 Enter API Key
        </button>

        <p className="panel-note" style={{ marginTop: '16px', fontSize: '12px' }}>
          Don't have an API key? Visit{' '}
          <a href="https://weather-ai.co" target="_blank" rel="noopener noreferrer">
            weather-ai.co
          </a>{' '}
          to sign up for free.
        </p>
      </div>
    )
  }

  return (
    <div className="panel api-key-setup">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h3 style={{ marginBottom: '4px' }}>🔑 API Key</h3>
          <p className="panel-note" style={{ margin: 0 }}>Configured and active</p>
        </div>
        <button className="ghost-button" onClick={handleChangeApiKey} style={{ minHeight: '40px', whiteSpace: 'nowrap' }}>
          Change Key
        </button>
      </div>
    </div>
  )
}
