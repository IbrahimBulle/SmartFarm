import { useState } from 'react'
import { saveWeatherApiKey } from '../services/weatherApi'

export function ApiKeySetup({ onApiKeySet, setStatus, configured = false }) {
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
      await saveWeatherApiKey(apiKey.trim())
      setStatus('API key saved to your SmartFarm account.')
      setApiKey('')
      setShowInput(false)
      onApiKeySet()
    } catch (error) {
      setStatus(`API key setup failed: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  function handleChangeApiKey() {
    setApiKey('')
    setShowInput(true)
  }

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
              placeholder="API key or bearer token from weather-ai.co"
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

  if (!configured) {
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
          <p className="panel-note" style={{ margin: 0 }}>Configured for this SmartFarm account</p>
        </div>
        <button className="ghost-button" onClick={handleChangeApiKey} style={{ minHeight: '40px', whiteSpace: 'nowrap' }}>
          Change Key
        </button>
      </div>
    </div>
  )
}
