import { useState } from 'react'
import { fetchWeather } from '../services/weatherApi'
import { findValue } from '../utils/formatters'

export function WeatherSection({ status, setStatus, busy, setBusy, onWeatherLoaded }) {
  const [weatherForm, setWeatherForm] = useState({
    lat: '-0.7813',
    lon: '35.3416',
    days: '3',
    ai: true,
  })
  const [weather, setWeather] = useState(null)

  const weatherHighlights = weather
    ? {
        temperature: findValue(weather, ['temperature', 'temp', 'temperature_c', 'temp_c']),
        humidity: findValue(weather, ['humidity', 'relative_humidity']),
        wind: findValue(weather, ['wind_speed', 'windSpeed', 'wind_kph']),
        summary: findValue(weather, ['summary', 'ai_summary', 'insight', 'analysis']),
      }
    : null

  async function handleLoadWeather(event) {
    event.preventDefault()
    setBusy('weather')
    setStatus('')

    try {
      const data = await fetchWeather({
        lat: weatherForm.lat,
        lon: weatherForm.lon,
        days: weatherForm.days,
        ai: weatherForm.ai,
        units: 'metric',
        lang: 'en',
      })

      setWeather(data)
      onWeatherLoaded?.(data)
    } catch (error) {
      setStatus(`Weather failed: ${error.message}`)
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="panel" id="weather">
      <h3>Local Forecast</h3>
      <form onSubmit={handleLoadWeather}>
        <label>
          Latitude
          <input
            type="number"
            step="0.0001"
            value={weatherForm.lat}
            onChange={(e) => setWeatherForm({ ...weatherForm, lat: e.target.value })}
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="0.0001"
            value={weatherForm.lon}
            onChange={(e) => setWeatherForm({ ...weatherForm, lon: e.target.value })}
          />
        </label>
        <label>
          Forecast days (1–7 on free plan)
          <input
            type="number"
            min="1"
            max="7"
            value={weatherForm.days}
            onChange={(e) => setWeatherForm({ ...weatherForm, days: e.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={weatherForm.ai}
            onChange={(e) => setWeatherForm({ ...weatherForm, ai: e.target.checked })}
          />
          Include AI summary (uses 1 AI request)
        </label>
        <button type="submit" className="primary-button" disabled={busy === 'weather'}>
          {busy === 'weather' ? 'Loading...' : 'Get Forecast'}
        </button>
      </form>

      {weatherHighlights ? (
        <div className="weather-highlights">
          <div className="metric">
            <strong>{weatherHighlights.temperature || '--'}°</strong>
            <span>Temperature</span>
          </div>
          <div className="metric">
            <strong>{weatherHighlights.humidity || '--'}%</strong>
            <span>Humidity</span>
          </div>
          <div className="metric">
            <strong>{weatherHighlights.wind || '--'} kph</strong>
            <span>Wind</span>
          </div>
        </div>
      ) : null}

      {weatherHighlights?.summary ? (
        <p className="weather-summary">{weatherHighlights.summary}</p>
      ) : null}
    </section>
  )
}
