import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const emptyFarm = {
  name: '',
  location: 'Bomet, Kenya',
  crop_type: 'Tea',
  size_acres: '2.5',
}

const emptyWeather = {
  lat: '-0.7813',
  lon: '35.3416',
  days: '3',
  ai: true,
}

const emptyImage = {
  farmerId: '',
  county: 'Bomet',
  landAcres: '',
  location: '',
  notes: '',
}

function getFarmSize(farm) {
  if (typeof farm.size_acres === 'number') return farm.size_acres
  if (farm.size_acres?.Valid) return farm.size_acres.Float64
  return 0
}

function friendlyDate(value) {
  if (!value) return 'Just now'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function findValue(source, names) {
  if (!source || typeof source !== 'object') return null

  for (const [key, value] of Object.entries(source)) {
    if (names.includes(key) && value !== null && value !== undefined && value !== '') {
      return value
    }

    if (typeof value === 'object') {
      const nested = findValue(value, names)
      if (nested !== null && nested !== undefined && nested !== '') return nested
    }
  }

  return null
}

function asList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return [value]
  return []
}

function displayValue(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return String(value)
  }
  return fallback
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value.replace(/,/g, ''))
    if (Number.isFinite(numeric)) return numeric
  }

  return null
}

function formatNumber(value, fallback = '--') {
  const numeric = toNumber(value)
  if (numeric === null) return fallback
  return new Intl.NumberFormat('en').format(numeric)
}

function formatMaybeDate(value) {
  if (!value) return 'Monthly cycle'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return friendlyDate(value)
}

function getUsageRemaining(usage) {
  if (!usage || typeof usage !== 'object') return null

  const candidates = [
    usage.remaining,
    usage.requests_remaining,
    usage.request_remaining,
    usage.requests?.remaining,
    usage.requests?.remainingRequests,
    usage.requests?.limit && usage.requests?.used !== undefined
      ? usage.requests.limit - usage.requests.used
      : null,
  ]

  return candidates.find((item) => typeof item === 'number' || typeof item === 'string') ?? null
}

function summarizeUsage(usage) {
  const rawRemaining = getUsageRemaining(usage)
  const limit =
    toNumber(
      findValue(usage, [
        'limit',
        'requests_limit',
        'request_limit',
        'monthly_limit',
        'quota',
        'quota_limit',
        'max_requests',
      ]),
    ) ?? 1000
  let used = toNumber(
    findValue(usage, [
      'used',
      'requests_used',
      'request_used',
      'used_requests',
      'requestsUsed',
      'usage_count',
      'count',
    ]),
  )
  let remaining = toNumber(rawRemaining)

  if (used === null && limit !== null && remaining !== null) {
    used = Math.max(limit - remaining, 0)
  }

  if (remaining === null && limit !== null && used !== null) {
    remaining = Math.max(limit - used, 0)
  }

  const percent = limit && used !== null ? Math.min(Math.max((used / limit) * 100, 0), 100) : 0
  const plan = findValue(usage, ['plan', 'tier', 'subscription_plan']) || 'Free plan'
  const reset = findValue(usage, ['reset_at', 'resets_at', 'resetDate', 'renewal_date', 'period_end'])

  return {
    connected: Boolean(usage),
    limit,
    plan,
    remaining,
    reset,
    used,
    percent: Math.round(percent),
  }
}

function UsageMeter({ compact = false, summary }) {
  return (
    <div
      className={compact ? 'usage-meter compact' : 'usage-meter'}
      style={{ '--usage-width': `${summary.percent}%` }}
    >
      <div className="usage-meter-heading">
        <span>{summary.connected ? summary.plan : 'Usage waiting'}</span>
        <strong>{summary.connected ? `${summary.percent}% used` : 'Connect API'}</strong>
      </div>
      <div className="meter-track" aria-hidden="true">
        <span></span>
      </div>
      <div className="usage-meter-stats">
        <span>
          <strong>{formatNumber(summary.used, summary.connected ? '0' : '--')}</strong>
          Used
        </span>
        <span>
          <strong>{formatNumber(summary.remaining)}</strong>
          Remaining
        </span>
        <span>
          <strong>{formatNumber(summary.limit)}</strong>
          Limit
        </span>
      </div>
    </div>
  )
}

async function readResponse(response) {
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.message || text || response.statusText)
  }

  return data
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('smartfarm_token') || '')
  const [mode, setMode] = useState('login')
  const [auth, setAuth] = useState({ email: '', password: '' })
  const [farmForm, setFarmForm] = useState(emptyFarm)
  const [farms, setFarms] = useState([])
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [weatherForm, setWeatherForm] = useState(emptyWeather)
  const [weather, setWeather] = useState(null)
  const [usage, setUsage] = useState(null)
  const [imageForm, setImageForm] = useState(emptyImage)
  const [imageFile, setImageFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [preview, setPreview] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState('')
  const previewUrl = useRef('')

  const selectedFarm = useMemo(
    () => farms.find((farm) => String(farm.id) === selectedFarmId) || farms[0],
    [farms, selectedFarmId],
  )

  const totals = useMemo(() => {
    const acres = farms.reduce((sum, farm) => sum + getFarmSize(farm), 0)
    const cropTypes = new Set(farms.map((farm) => farm.crop_type).filter(Boolean))

    return {
      farms: farms.length,
      acres: acres.toFixed(acres % 1 ? 1 : 0),
      crops: cropTypes.size,
    }
  }, [farms])

  const weatherHighlights = useMemo(() => {
    if (!weather) return null

    return {
      temperature: findValue(weather, ['temperature', 'temp', 'temperature_c', 'temp_c']),
      humidity: findValue(weather, ['humidity', 'relative_humidity']),
      wind: findValue(weather, ['wind_speed', 'windSpeed', 'wind_kph']),
      summary: findValue(weather, ['summary', 'ai_summary', 'insight', 'analysis']),
    }
  }, [weather])

  const imageInsights = useMemo(() => {
    if (!analysis) return []
    return [
      ...asList(analysis.observations),
      ...asList(analysis.recommendations),
    ].slice(0, 5)
  }, [analysis])

  const usageSummary = useMemo(() => summarizeUsage(usage), [usage])

  const loadFarms = useCallback(async (activeToken = token) => {
    setBusy('farms')
    setStatus('')

    try {
      const data = await fetch('/api/farms', {
        headers: { Authorization: `Bearer ${activeToken}` },
      }).then(readResponse)

      setFarms(data || [])
      if (data?.[0] && !selectedFarmId) setSelectedFarmId(String(data[0].id))
    } catch (error) {
      setStatus(`Could not load farms: ${error.message}`)
    } finally {
      setBusy('')
    }
  }, [selectedFarmId, token])

  const loadUsage = useCallback(async () => {
    try {
      const data = await fetch('/weather-ai/v1/usage').then(readResponse)
      setUsage(data)
    } catch {
      setUsage(null)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    queueMicrotask(() => {
      loadFarms(token)
      loadUsage()
    })
  }, [loadFarms, loadUsage, token])

  async function handleAuth(event) {
    event.preventDefault()
    setBusy('auth')
    setStatus('')

    try {
      if (mode === 'register') {
        await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auth),
        }).then(readResponse)
      }

      const data = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth),
      }).then(readResponse)

      localStorage.setItem('smartfarm_token', data.token)
      setToken(data.token)
      setStatus(mode === 'register' ? 'Account created and signed in.' : 'Signed in.')
    } catch (error) {
      setStatus(`Auth failed: ${error.message}`)
    } finally {
      setBusy('')
    }
  }

  async function createFarm(event) {
    event.preventDefault()
    setBusy('create-farm')
    setStatus('')

    try {
      const created = await fetch('/api/farms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...farmForm,
          size_acres: Number(farmForm.size_acres || 0),
        }),
      }).then(readResponse)

      setFarms((current) => [created, ...current])
      setSelectedFarmId(String(created.id))
      setFarmForm(emptyFarm)
      setStatus('Farm created.')
    } catch (error) {
      setStatus(`Could not create farm: ${error.message}`)
    } finally {
      setBusy('')
    }
  }

  async function loadWeather(event) {
    event.preventDefault()
    setBusy('weather')
    setStatus('')

    const params = new URLSearchParams({
      lat: weatherForm.lat,
      lon: weatherForm.lon,
      days: weatherForm.days,
      ai: String(weatherForm.ai),
      units: 'metric',
      lang: 'en',
    })

    try {
      const data = await fetch(`/weather-ai/v1/weather?${params}`).then(readResponse)
      setWeather(data)
      loadUsage()
    } catch (error) {
      setStatus(`Weather failed: ${error.message}`)
    } finally {
      setBusy('')
    }
  }

  async function analyzeImage(event) {
    event.preventDefault()

    if (!imageFile) {
      setStatus('Choose a farm image first.')
      return
    }

    setBusy('image')
    setStatus('')

    const form = new FormData()
    form.append('image', imageFile)

    Object.entries(imageForm).forEach(([key, value]) => {
      if (value) form.append(key, value)
    })

    try {
      const data = await fetch('/weather-ai/v1/trees/analyze', {
        method: 'POST',
        body: form,
      }).then(readResponse)

      setAnalysis(data)
      loadUsage()
      setStatus('Image analysis complete.')
    } catch (error) {
      setStatus(`Image analysis failed: ${error.message}`)
    } finally {
      setBusy('')
    }
  }

  function chooseImage(event) {
    const file = event.target.files?.[0] || null

    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current)
      previewUrl.current = ''
    }

    setImageFile(file)

    if (file) {
      const url = URL.createObjectURL(file)
      previewUrl.current = url
      setPreview(url)
    } else {
      setPreview('')
    }
  }

  function signOut() {
    localStorage.removeItem('smartfarm_token')
    setToken('')
    setFarms([])
    setSelectedFarmId('')
    setStatus('Signed out.')
  }

  if (!token) {
    return (
      <main className="auth-page">
        <section className="auth-showcase">
          <div className="auth-brand-row">
            <div className="brand-mark">SF</div>
            <div>
              <p className="eyebrow">SmartFarm</p>
              <strong>Farm intelligence system</strong>
            </div>
          </div>

          <div className="auth-copy">
            <p className="eyebrow">Field clarity</p>
            <h1>Know what is happening on the farm before the day gets away.</h1>
            <p>
              SmartFarm brings farm records, local forecasts, WeatherAI guidance, and
              image-based tree analysis into one calm dashboard for better daily decisions.
            </p>
          </div>

          <div className="auth-system-grid" aria-label="SmartFarm workflow preview">
            <div className="system-card primary">
              <span>01</span>
              <strong>Register farms</strong>
              <small>Crop, acreage, county, and location context.</small>
            </div>
            <div className="system-card weather">
              <span>02</span>
              <strong>Check weather</strong>
              <small>Forecasts with optional AI field guidance.</small>
            </div>
            <div className="system-card vision">
              <span>03</span>
              <strong>Analyze images</strong>
              <small>Tree counts, canopy signals, and recommendations.</small>
            </div>
          </div>

          <div className="auth-visual" aria-hidden="true">
            <div className="scan-panel">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="signal-panel">
              <span>Forecast</span>
              <strong>3 day outlook</strong>
              <div></div>
            </div>
          </div>
        </section>

        <section className="auth-card" aria-label="Account access">
          <div className="auth-card-heading">
            <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create access'}</p>
            <h2>{mode === 'login' ? 'Login to dashboard' : 'Start your account'}</h2>
            <p>
              {mode === 'login'
                ? 'Use your SmartFarm backend account to continue.'
                : 'Create an account, then SmartFarm will take you straight to the dashboard.'}
            </p>
          </div>

          {status ? <div className="status-line auth-status">{status}</div> : null}

          <form className="auth-panel" onSubmit={handleAuth}>
            <div className="segmented" role="tablist" aria-label="Auth mode">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => setMode('register')}
              >
                Sign up
              </button>
            </div>
            <label>
              Email
              <input
                type="email"
                value={auth.email}
                onChange={(event) => setAuth({ ...auth, email: event.target.value })}
                placeholder="farmer@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={auth.password}
                onChange={(event) => setAuth({ ...auth, password: event.target.value })}
                placeholder="Enter password"
                required
              />
            </label>
            <button className="primary-button auth-submit" type="submit" disabled={busy === 'auth'}>
              {busy === 'auth' ? 'Working...' : mode === 'login' ? 'Open dashboard' : 'Create account'}
            </button>
          </form>

          <div className="auth-footnote">
            <span>Local backend</span>
            <strong>WeatherAI key stays server side</strong>
          </div>
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
            <h1>Farm intelligence dashboard</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Dashboard sections">
          <a href="#dashboard"><span>01</span> Dashboard</a>
          <a href="#usage"><span>02</span> API usage</a>
          <a href="#farms"><span>03</span> Farms</a>
          <a href="#weather"><span>04</span> Weather</a>
          <a href="#trees"><span>05</span> Image AI</a>
        </nav>

        <div className="quota-panel">
          <p className="eyebrow">API usage</p>
          <UsageMeter compact summary={usageSummary} />
          <span>Weather, AI summaries, and image analysis run through your WeatherAI quota.</span>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Backend</p>
            <strong>SmartFarmBackend on port 8080</strong>
          </div>
          <div className="topbar-actions">
            <span className="connection-pill">Local API</span>
            <button className="ghost-button" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        {status ? <div className="status-line">{status}</div> : null}

            <section className="hero-band" id="dashboard">
              <div>
                <p className="eyebrow">Selected farm</p>
                <h2>{selectedFarm?.name || 'Create your first farm'}</h2>
                <p>
                  {selectedFarm
                    ? `${selectedFarm.crop_type} in ${selectedFarm.location}`
                    : 'Add a farm below to begin tracking weather and image insights.'}
                </p>
                {selectedFarm ? (
                  <div className="hero-tags">
                    <span>{getFarmSize(selectedFarm)} acres</span>
                    <span>{selectedFarm.crop_type}</span>
                    <span>{selectedFarm.location}</span>
                  </div>
                ) : null}
              </div>
              <div className="field-visual" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </section>

            <section className="api-usage-card" id="usage">
              <div className="api-usage-copy">
                <p className="eyebrow">WeatherAI account</p>
                <h3>API usage and remaining quota</h3>
                <p>
                  Keep one simple mental model: used requests fill the bar, remaining
                  requests are what you can still spend this month.
                </p>
              </div>
              <UsageMeter summary={usageSummary} />
              <div className="usage-actions">
                <button className="ghost-button" type="button" onClick={loadUsage}>
                  Refresh usage
                </button>
                <span>Resets: {formatMaybeDate(usageSummary.reset)}</span>
              </div>
            </section>

            <section className="metric-grid" aria-label="Farm summary">
              <div>
                <span>Total farms</span>
                <strong>{totals.farms}</strong>
                <small>Saved in backend</small>
              </div>
              <div>
                <span>Acres</span>
                <strong>{totals.acres}</strong>
                <small>Across all farms</small>
              </div>
              <div>
                <span>Crop types</span>
                <strong>{totals.crops}</strong>
                <small>Portfolio mix</small>
              </div>
              <div>
                <span>Weather quota</span>
                <strong>{formatNumber(usageSummary.remaining, usageSummary.connected ? '0' : 'Ready')}</strong>
                <small>{usageSummary.connected ? 'Requests remaining' : 'Waiting for usage'}</small>
              </div>
            </section>

            <section className="workspace-grid">
              <form className="panel" id="farms" onSubmit={createFarm}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Create farm</p>
                    <h3>Farm profile</h3>
                  </div>
                </div>
                <label>
                  Farm name
                  <input
                    value={farmForm.name}
                    onChange={(event) => setFarmForm({ ...farmForm, name: event.target.value })}
                    placeholder="Kapkimolwa Block C"
                    required
                  />
                </label>
                <label>
                  Location
                  <input
                    value={farmForm.location}
                    onChange={(event) =>
                      setFarmForm({ ...farmForm, location: event.target.value })
                    }
                    required
                  />
                </label>
                <div className="two-columns">
                  <label>
                    Crop
                    <input
                      value={farmForm.crop_type}
                      onChange={(event) =>
                        setFarmForm({ ...farmForm, crop_type: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Acres
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={farmForm.size_acres}
                      onChange={(event) =>
                        setFarmForm({ ...farmForm, size_acres: event.target.value })
                      }
                    />
                  </label>
                </div>
                <button className="primary-button" type="submit" disabled={busy === 'create-farm'}>
                  {busy === 'create-farm' ? 'Saving...' : 'Create farm'}
                </button>
              </form>

              <section className="panel farm-list">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Dashboard</p>
                    <h3>Your farms</h3>
                  </div>
                  <button className="ghost-button" type="button" onClick={() => loadFarms()}>
                    Refresh
                  </button>
                </div>
                {farms.length ? (
                  <div className="list-stack">
                    {farms.map((farm) => (
                      <button
                        className={String(farm.id) === String(selectedFarm?.id) ? 'farm active' : 'farm'}
                        key={farm.id}
                        type="button"
                        onClick={() => setSelectedFarmId(String(farm.id))}
                      >
                        <span>
                          <strong>{farm.name}</strong>
                          <small>
                            {farm.crop_type} · {getFarmSize(farm)} acres
                          </small>
                        </span>
                        <small>{friendlyDate(farm.created_at)}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted">{busy === 'farms' ? 'Loading farms...' : 'No farms yet.'}</p>
                )}
              </section>
            </section>

            <section className="workspace-grid">
              <form className="panel" id="weather" onSubmit={loadWeather}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Free WeatherAI</p>
                    <h3>Forecast lookup</h3>
                  </div>
                </div>
                <div className="two-columns">
                  <label>
                    Latitude
                    <input
                      value={weatherForm.lat}
                      onChange={(event) =>
                        setWeatherForm({ ...weatherForm, lat: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Longitude
                    <input
                      value={weatherForm.lon}
                      onChange={(event) =>
                        setWeatherForm({ ...weatherForm, lon: event.target.value })
                      }
                      required
                    />
                  </label>
                </div>
                <label>
                  Forecast days
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={weatherForm.days}
                    onChange={(event) =>
                      setWeatherForm({ ...weatherForm, days: event.target.value })
                    }
                  />
                </label>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={weatherForm.ai}
                    onChange={(event) =>
                      setWeatherForm({ ...weatherForm, ai: event.target.checked })
                    }
                  />
                  Include AI summary
                </label>
                <button className="primary-button" type="submit" disabled={busy === 'weather'}>
                  {busy === 'weather' ? 'Fetching...' : 'Get forecast'}
                </button>
              </form>

              <section className="panel weather-result">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Insights</p>
                    <h3>Weather result</h3>
                  </div>
                </div>
                {weather ? (
                  <div className="result-stack">
                    <div className="insight-grid">
                      <div>
                        <span>Temperature</span>
                        <strong>{displayValue(weatherHighlights?.temperature)}</strong>
                      </div>
                      <div>
                        <span>Humidity</span>
                        <strong>{displayValue(weatherHighlights?.humidity)}</strong>
                      </div>
                      <div>
                        <span>Wind</span>
                        <strong>{displayValue(weatherHighlights?.wind)}</strong>
                      </div>
                    </div>
                    {displayValue(weatherHighlights?.summary, '') ? (
                      <div className="callout">
                        <p className="eyebrow">AI guidance</p>
                        <p>{displayValue(weatherHighlights.summary)}</p>
                      </div>
                    ) : null}
                    <details>
                      <summary>Raw weather payload</summary>
                      <pre>{JSON.stringify(weather, null, 2)}</pre>
                    </details>
                  </div>
                ) : (
                  <div className="empty-state">
                    <strong>No forecast loaded</strong>
                    <p>Enter coordinates and fetch a free-plan forecast with optional AI guidance.</p>
                  </div>
                )}
              </section>
            </section>

            <section className="workspace-grid">
              <form className="panel" id="trees" onSubmit={analyzeImage}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Free image AI</p>
                    <h3>Tree analysis</h3>
                  </div>
                </div>
                <label className="upload-zone">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={chooseImage}
                  />
                  {preview ? (
                    <img src={preview} alt="Farm upload preview" />
                  ) : (
                    <span>
                      <strong>Upload field image</strong>
                      JPEG, PNG, or WEBP up to 20 MB
                    </span>
                  )}
                </label>
                <div className="two-columns">
                  <label>
                    Farmer ID
                    <input
                      value={imageForm.farmerId}
                      onChange={(event) =>
                        setImageForm({ ...imageForm, farmerId: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    County
                    <input
                      value={imageForm.county}
                      onChange={(event) =>
                        setImageForm({ ...imageForm, county: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="two-columns">
                  <label>
                    Acres
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={imageForm.landAcres}
                      onChange={(event) =>
                        setImageForm({ ...imageForm, landAcres: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Location
                    <input
                      value={imageForm.location}
                      onChange={(event) =>
                        setImageForm({ ...imageForm, location: event.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  Notes
                  <textarea
                    value={imageForm.notes}
                    onChange={(event) => setImageForm({ ...imageForm, notes: event.target.value })}
                    rows="3"
                  />
                </label>
                <button className="primary-button" type="submit" disabled={busy === 'image'}>
                  {busy === 'image' ? 'Analyzing...' : 'Analyze image'}
                </button>
              </form>

              <section className="panel analysis-result">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Computer vision</p>
                    <h3>Analysis result</h3>
                  </div>
                </div>
                {analysis ? (
                  <div className="analysis-grid">
                    <div>
                      <span>Trees</span>
                      <strong>{analysis.total_tree_count ?? '-'}</strong>
                    </div>
                    <div>
                      <span>Confidence</span>
                      <strong>
                        {analysis.confidence_score
                          ? `${Math.round(analysis.confidence_score * 100)}%`
                          : '-'}
                      </strong>
                    </div>
                    <div>
                      <span>Canopy</span>
                      <strong>{analysis.canopy_coverage_pct ?? '-'}%</strong>
                    </div>
                    {imageInsights.length ? (
                      <div className="insight-list">
                        {imageInsights.map((item) => (
                          <p key={item}>{item}</p>
                        ))}
                      </div>
                    ) : null}
                    <details>
                      <summary>Raw analysis payload</summary>
                      <pre>{JSON.stringify(analysis, null, 2)}</pre>
                    </details>
                  </div>
                ) : (
                  <div className="empty-state">
                    <strong>No image analyzed</strong>
                    <p>Free plan includes 5 tree image analyses per month.</p>
                  </div>
                )}
              </section>
            </section>

            <section className="locked-band">
              <div>
                <p className="eyebrow">SMS</p>
                <h3>Locked on free plan</h3>
                <p>
                  WeatherAI SMS and USSD routes require the Scale plan and approval, so this
                  frontend keeps that action disabled.
                </p>
              </div>
              <button type="button" disabled>
                SMS unavailable
              </button>
            </section>
      </section>
    </main>
  )
}

export default App
