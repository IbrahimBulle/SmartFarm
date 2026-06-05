import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchFarms } from './services/farmApi'
import { fetchUsage, fetchWeatherKeyStatus, saveWeatherApiKey } from './services/weatherApi'
import { summarizeUsage } from './utils/formatters'
import { AuthPage } from './components/AuthPage'
import { ApiKeySetup } from './components/ApiKeySetup'
import { FarmList } from './components/FarmList'
import { WeatherSection } from './components/WeatherSection'
import { ImageAnalysis } from './components/ImageAnalysis'
import { UsageMeter } from './components/UsageMeter'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('smartfarm_token') || '')
  const [apiKeyReady, setApiKeyReady] = useState(false)
  const [farms, setFarms] = useState([])
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [usage, setUsage] = useState(null)
  const [usageError, setUsageError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState('')

  const usageSummary = useMemo(() => summarizeUsage(usage, usageError), [usage, usageError])

  const loadFarms = useCallback(
    async (activeToken = token) => {
      setBusy('farms')
      setStatus('')

      try {
        const data = await fetchFarms(activeToken)
        setFarms(data || [])
        if (data?.[0] && !selectedFarmId) setSelectedFarmId(String(data[0].id))
      } catch (error) {
        setStatus(`Could not load farms: ${error.message}`)
      } finally {
        setBusy('')
      }
    },
    [selectedFarmId, token],
  )

  const loadUsage = useCallback(async () => {
    try {
      const data = await fetchUsage()
      // More lenient validation - just check if we got valid data with any quota info
      if (!data || typeof data !== 'object') {
        throw new Error('WeatherAI usage endpoint returned invalid data.')
      }
      // Check if we have at least some quota information
      const hasQuotaInfo =
        data.period ||
        data.limits ||
        data.remaining ||
        data.requests_remaining ||
        data.quota ||
        data.used ||
        data.requestCount
      if (!hasQuotaInfo) {
        throw new Error('WeatherAI usage endpoint returned no quota data.')
      }
      setUsage(data)
      setUsageError('')
    } catch (error) {
      setUsage(null)
      setUsageError(error.message || 'WeatherAI usage endpoint is not working.')
    }
  }, [])

  const loadApiKeyStatus = useCallback(async () => {
    try {
      const data = await fetchWeatherKeyStatus()
      const configured = Boolean(data?.configured)
      setApiKeyReady(configured)

      if (!configured) {
        setStatus('Please set up your WeatherAI API key to continue.')
      }

      return configured
    } catch (error) {
      setApiKeyReady(false)
      setStatus(`Could not check WeatherAI API key: ${error.message}`)
      return false
    }
  }, [])

  useEffect(() => {
    if (!token) return
    queueMicrotask(async () => {
      loadFarms(token)
      const configured = await loadApiKeyStatus()
      if (configured) loadUsage()
    })
  }, [loadApiKeyStatus, loadFarms, loadUsage, token])

  function handleLogin(newToken) {
    setApiKeyReady(false)
    setUsage(null)
    setUsageError('')
    setToken(newToken)
  }

  function handleApiKeySet() {
    setApiKeyReady(true)
    setStatus('API key configured successfully!')
    loadUsage()
  }

  function handleSignOut() {
    localStorage.removeItem('smartfarm_token')
    setToken('')
    setFarms([])
    setSelectedFarmId('')
    setUsage(null)
    setUsageError('')
    setApiKeyReady(false)
    setStatus('Signed out.')
  }

  if (!token) {
    return <AuthPage onLogin={handleLogin} status={status} setStatus={setStatus} />
  }

  if (!apiKeyReady) {
    return (
      <main className="app-shell">
        <aside className="sidebar">
          <div className="brand-lockup">
            <div className="brand-mark">SF</div>
            <div>
              <p className="eyebrow">SmartFarm</p>
              <strong>Field intelligence</strong>
            </div>
          </div>

          <button className="ghost-button" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </aside>

        <section className="content">
          <div className="topbar">
            <h1>SmartFarm Setup</h1>
          </div>

          <ApiKeySetup
            onApiKeySet={handleApiKeySet}
            setStatus={setStatus}
            configured={apiKeyReady}
          />

          {status && <div className="status-line">{status}</div>}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">SF</div>
          <div>
            <p className="eyebrow">SmartFarm</p>
            <strong>Field intelligence</strong>
          </div>
        </div>

        <nav>
          <p className="eyebrow">Navigation</p>
          <ul className="nav-list">
            <li>
              <a href="#farms">🌾 Farms</a>
            </li>
            <li>
              <a href="#weather">🌤️ Weather</a>
            </li>
            <li>
              <a href="#trees">🌳 Analysis</a>
            </li>
          </ul>
        </nav>

        <div className="quota-panel">
          <button className="ghost-button" type="button" onClick={loadUsage}>
            Refresh usage
          </button>
          <UsageMeter compact={true} summary={usageSummary} />
        </div>

        <button
          className="ghost-button"
          type="button"
          onClick={async () => {
            const newKey = prompt('Enter your WeatherAI API key:')
            if (!newKey?.trim()) return

            setBusy('api-key')
            try {
              await saveWeatherApiKey(newKey.trim())
              setApiKeyReady(true)
              setStatus('API key updated.')
              loadUsage()
            } catch (error) {
              setStatus(`API key update failed: ${error.message}`)
            } finally {
              setBusy('')
            }
          }}
          disabled={busy === 'api-key'}
        >
          {busy === 'api-key' ? 'Updating key...' : '🔑 Change API Key'}
        </button>

        <button className="ghost-button" type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </aside>

      <section className="content">
        <div className="topbar">
          <h1>SmartFarm Dashboard</h1>
          <div className="topbar-actions">
            {status ? <div className="status-line">{status}</div> : null}
          </div>
        </div>

        <div className="usage-section">
          <UsageMeter summary={usageSummary} />
        </div>

        <FarmList
          farms={farms}
          selectedFarmId={selectedFarmId}
          token={token}
          onFarmsChange={setFarms}
          setStatus={setStatus}
          busy={busy}
          setBusy={setBusy}
        />

        <WeatherSection
          setStatus={setStatus}
          busy={busy}
          setBusy={setBusy}
          onWeatherLoaded={loadUsage}
        />

        <ImageAnalysis
          setStatus={setStatus}
          busy={busy}
          setBusy={setBusy}
          onAnalysisComplete={loadUsage}
        />
      </section>
    </main>
  )
}

export default App
