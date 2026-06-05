import { useState } from 'react'
import { createFarm, updateFarm, deleteFarm } from '../services/farmApi'
import { getFarmSize } from '../utils/formatters'

const emptyFarm = {
  name: '',
  location: 'Bomet, Kenya',
  crop_type: 'Tea',
  size_acres: '2.5',
}

export function FarmList({ farms, selectedFarmId, token, onFarmsChange, status, setStatus, busy, setBusy }) {
  const [farmForm, setFarmForm] = useState(emptyFarm)
  const [editingFarmId, setEditingFarmId] = useState('')
  const isEditing = Boolean(editingFarmId)

  const selectedFarm = farms.find((f) => String(f.id) === selectedFarmId) || farms[0]

  const totals = {
    farms: farms.length,
    acres: farms.reduce((sum, f) => sum + getFarmSize(f), 0).toFixed(1),
    crops: new Set(farms.map((f) => f.crop_type).filter(Boolean)).size,
  }

  async function handleSaveFarm(event) {
    event.preventDefault()
    const editing = Boolean(editingFarmId)

    setBusy(editing ? 'update-farm' : 'create-farm')
    setStatus('')

    try {
      const saved = editing
        ? await updateFarm(token, editingFarmId, farmForm)
        : await createFarm(token, farmForm)

      if (editing) {
        onFarmsChange((current) =>
          current.map((farm) => (String(farm.id) === editingFarmId ? saved : farm)),
        )
        setEditingFarmId('')
        setStatus('Farm updated.')
      } else {
        onFarmsChange((current) => [saved, ...current])
        setStatus('Farm created.')
      }

      setFarmForm(emptyFarm)
    } catch (error) {
      setStatus(`Could not ${editing ? 'update' : 'create'} farm: ${error.message}`)
    } finally {
      setBusy('')
    }
  }

  function handleStartEdit(farm) {
    setEditingFarmId(String(farm.id))
    setFarmForm({
      name: farm.name || '',
      location: farm.location || '',
      crop_type: farm.crop_type || '',
      size_acres: String(getFarmSize(farm) || ''),
    })
    setStatus('')
  }

  function handleCancelEdit() {
    setEditingFarmId('')
    setFarmForm(emptyFarm)
  }

  async function handleDeleteFarm(farm) {
    if (!window.confirm(`Delete ${farm.name}? This cannot be undone.`)) return

    setBusy(`delete-farm-${farm.id}`)
    setStatus('')

    try {
      await deleteFarm(token, farm.id)

      const nextFarms = farms.filter((item) => String(item.id) !== String(farm.id))
      onFarmsChange(nextFarms)
      setStatus('Farm deleted.')
    } catch (error) {
      setStatus(`Could not delete farm: ${error.message}`)
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="panel farms-section">
      <h3>Your Farms</h3>

      <div className="farm-stats">
        <div className="stat">
          <strong>{totals.farms}</strong>
          <span>Farms</span>
        </div>
        <div className="stat">
          <strong>{totals.acres}</strong>
          <span>Acres</span>
        </div>
        <div className="stat">
          <strong>{totals.crops}</strong>
          <span>Crop types</span>
        </div>
      </div>

      <form onSubmit={handleSaveFarm} className="farm-form">
        <h4>{isEditing ? 'Edit farm' : 'Add farm'}</h4>

        <label>
          Farm name
          <input
            type="text"
            value={farmForm.name}
            onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
            placeholder="My Farm"
            required
          />
        </label>

        <label>
          Location
          <input
            type="text"
            value={farmForm.location}
            onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
            placeholder="Bomet, Kenya"
            required
          />
        </label>

        <label>
          Crop type
          <input
            type="text"
            value={farmForm.crop_type}
            onChange={(e) => setFarmForm({ ...farmForm, crop_type: e.target.value })}
            placeholder="Tea"
            required
          />
        </label>

        <label>
          Size (acres)
          <input
            type="number"
            step="0.1"
            value={farmForm.size_acres}
            onChange={(e) => setFarmForm({ ...farmForm, size_acres: e.target.value })}
            placeholder="2.5"
            required
          />
        </label>

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={busy === (isEditing ? 'update-farm' : 'create-farm')}
          >
            {busy === (isEditing ? 'update-farm' : 'create-farm')
              ? 'Saving...'
              : isEditing
                ? 'Update'
                : 'Add farm'}
          </button>
          {isEditing ? (
            <button type="button" className="ghost-button" onClick={handleCancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="farms-list">
        <h4>Registered farms</h4>
        {farms.length === 0 ? (
          <p className="empty-state">No farms yet. Add one above to get started.</p>
        ) : (
          <ul>
            {farms.map((farm) => (
              <li key={farm.id} className={selectedFarmId === String(farm.id) ? 'selected' : ''}>
                <div className="farm-info">
                  <strong>{farm.name || 'Unnamed farm'}</strong>
                  <small>
                    {farm.crop_type} • {getFarmSize(farm)} acres
                  </small>
                </div>
                <div className="farm-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => handleStartEdit(farm)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => handleDeleteFarm(farm)}
                    disabled={busy.startsWith('delete-farm')}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
