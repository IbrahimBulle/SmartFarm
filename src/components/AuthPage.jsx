import { useState } from 'react'
import { registerUser, loginUser } from '../services/farmApi'

export function AuthPage({ onLogin, status, setStatus }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAuth(event) {
    event.preventDefault()
    setBusy(true)
    setStatus('')

    try {
      if (mode === 'register') {
        await registerUser(email, password)
      }

      const data = await loginUser(email, password)
      localStorage.setItem('smartfarm_token', data.token)
      onLogin(data.token)
      setStatus(mode === 'register' ? 'Account created and signed in.' : 'Signed in.')
    } catch (error) {
      setStatus(`Auth failed: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

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
            SmartFarm brings farm records, local forecasts, WeatherAI guidance, and image-based tree
            analysis into one calm dashboard for better daily decisions.
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="farmer@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
          </label>
          <button className="primary-button auth-submit" type="submit" disabled={busy}>
            {busy ? 'Working...' : mode === 'login' ? 'Open dashboard' : 'Create account'}
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
