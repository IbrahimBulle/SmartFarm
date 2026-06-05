import { useRef, useState } from 'react'
import { analyzeImage } from '../services/weatherApi'
import { asList } from '../utils/formatters'

export function ImageAnalysis({ setStatus, busy, setBusy, onAnalysisComplete }) {
  const [imageForm, setImageForm] = useState({
    farmerId: '',
    county: 'Bomet',
    landAcres: '',
    location: '',
    notes: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const previewUrl = useRef('')

  const imageInsights = analysis
    ? [...asList(analysis.observations), ...asList(analysis.recommendations)].slice(0, 5)
    : []

  function handleChooseImage(event) {
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

  async function handleAnalyzeImage(event) {
    event.preventDefault()

    if (!imageFile) {
      setStatus('Choose a farm image first.')
      return
    }

    setBusy('image')
    setStatus('')

    try {
      const data = await analyzeImage(imageFile, imageForm)
      setAnalysis(data)
      onAnalysisComplete?.(data)
      setStatus('Image analysis complete.')
    } catch (error) {
      setStatus(`Image analysis failed: ${error.message}`)
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="panel" id="trees">
      <h3>Farm Image Analysis</h3>
      <p className="panel-note">Free plan: 5 analyses/month • Pro: 100/month</p>

      <form onSubmit={handleAnalyzeImage}>
        <label>
          Farm image (JPEG, PNG, WEBP, max 20 MB)
          <input type="file" accept="image/*" onChange={handleChooseImage} />
        </label>

        {preview ? (
          <div className="image-preview">
            <img src={preview} alt="Farm preview" />
          </div>
        ) : null}

        <label>
          Farmer ID (optional)
          <input
            type="text"
            value={imageForm.farmerId}
            onChange={(e) => setImageForm({ ...imageForm, farmerId: e.target.value })}
            placeholder="F-001"
          />
        </label>
        <label>
          County (optional)
          <input
            type="text"
            value={imageForm.county}
            onChange={(e) => setImageForm({ ...imageForm, county: e.target.value })}
            placeholder="Bomet"
          />
        </label>
        <label>
          Land acres (optional)
          <input
            type="number"
            step="0.1"
            value={imageForm.landAcres}
            onChange={(e) => setImageForm({ ...imageForm, landAcres: e.target.value })}
            placeholder="2.5"
          />
        </label>
        <label>
          Location (optional)
          <input
            type="text"
            value={imageForm.location}
            onChange={(e) => setImageForm({ ...imageForm, location: e.target.value })}
            placeholder="Farm name or GPS"
          />
        </label>
        <label>
          Notes (optional)
          <input
            type="text"
            value={imageForm.notes}
            onChange={(e) => setImageForm({ ...imageForm, notes: e.target.value })}
            placeholder="Tea plantation, recently pruned..."
          />
        </label>

        <button type="submit" className="primary-button" disabled={busy === 'image' || !imageFile}>
          {busy === 'image' ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </form>

      {analysis ? (
        <div className="analysis-results">
          <div className="metrics-grid">
            <div className="metric-card">
              <strong>{analysis.total_tree_count}</strong>
              <span>Trees</span>
            </div>
            <div className="metric-card">
              <strong>{analysis.tree_density_per_acre?.toFixed(1) || '--'}</strong>
              <span>Trees/acre</span>
            </div>
            <div className="metric-card">
              <strong>{analysis.canopy_coverage_pct?.toFixed(1) || '--'}%</strong>
              <span>Canopy</span>
            </div>
            <div className="metric-card">
              <strong>{(analysis.confidence_score * 100).toFixed(0) || '--'}%</strong>
              <span>Confidence</span>
            </div>
          </div>

          {analysis.tree_health ? (
            <div className="health-breakdown">
              <h4>Tree Health</h4>
              <p>
                <strong>{analysis.tree_health.healthy}</strong> Healthy
              </p>
              <p>
                <strong>{analysis.tree_health.needs_care}</strong> Needs care
              </p>
              <p>
                <strong>{analysis.tree_health.needs_replacement}</strong> Need replacement
              </p>
            </div>
          ) : null}

          {imageInsights.length > 0 ? (
            <div className="insights">
              <h4>Insights</h4>
              <ul>
                {imageInsights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {analysis.overlay_image_url ? (
            <div className="overlay-image">
              <img src={analysis.overlay_image_url} alt="Analysis overlay" />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
