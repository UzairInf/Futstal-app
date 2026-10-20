import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageLoader } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import GroundListCard from '../components/grounds/GroundListCard.jsx'
import { AREAS, TEAM_SIZES, PRICE_LIMITS } from '../lib/constants.js'
import { listActiveGrounds } from '../lib/groundsApi.js'

// Ignore hand-edited URL values that aren't real options
function pick(value, allowed) {
  return allowed.map(String).includes(value) ? value : ''
}

export default function Grounds() {
  const [params, setParams] = useSearchParams()

  const area = pick(params.get('area'), AREAS)
  const teamSize = pick(params.get('size'), TEAM_SIZES)
  const maxPrice = pick(params.get('max'), PRICE_LIMITS)
  const open24h = params.get('open24') === '1'
  const hasFilters = Boolean(area || teamSize || maxPrice || open24h)

  const filterKey = [area, teamSize, maxPrice, open24h].join('|')
  const [result, setResult] = useState({ key: null, grounds: [], error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const loading = result.key !== filterKey

  useEffect(() => {
    let cancelled = false
    listActiveGrounds({ area, teamSize, maxPrice, open24h })
      .then((grounds) => {
        if (!cancelled) setResult({ key: filterKey, grounds, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: filterKey, grounds: [], error: err.message })
      })
    return () => { cancelled = true }
  }, [area, teamSize, maxPrice, open24h, filterKey, reloadKey])

  function setFilter(name, value) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(name, value)
        else next.delete(name)
        return next
      },
      { replace: true }
    )
  }

  function clearFilters() {
    setParams({}, { replace: true })
  }

  function retry() {
    setResult((r) => ({ ...r, key: null }))
    setReloadKey((k) => k + 1)
  }

  let content
  if (loading) {
    content = <PageLoader label="Loading grounds..." />
  } else if (result.error) {
    content = <ErrorMessage message={result.error} onRetry={retry} />
  } else if (result.grounds.length === 0) {
    content = (
      <div className="card empty-state">
        <h3>{hasFilters ? 'No grounds match your filters' : 'No grounds listed yet'}</h3>
        <p className="muted">
          {hasFilters
            ? 'Try a different area, a higher price limit, or fewer filters.'
            : 'Check back soon. Ground owners are adding their grounds.'}
        </p>
        {hasFilters && (
          <button type="button" className="btn" onClick={clearFilters}>Clear filters</button>
        )}
      </div>
    )
  } else {
    content = (
      <>
        <p className="muted">
          {result.grounds.length} ground{result.grounds.length === 1 ? '' : 's'} found
        </p>
        <div className="grounds-grid">
          {result.grounds.map((g) => (
            <GroundListCard key={g.id} ground={g} />
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="stack">
      <h1>Find a ground</h1>

      <div className="card filters">
        <div className="form-group">
          <label htmlFor="f-area">Area</label>
          <select id="f-area" value={area} onChange={(e) => setFilter('area', e.target.value)}>
            <option value="">All areas</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="f-size">Team size</label>
          <select id="f-size" value={teamSize} onChange={(e) => setFilter('size', e.target.value)}>
            <option value="">Any size</option>
            {TEAM_SIZES.map((s) => <option key={s} value={s}>{s} a side</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="f-price">Max price per hour</label>
          <select id="f-price" value={maxPrice} onChange={(e) => setFilter('max', e.target.value)}>
            <option value="">Any price</option>
            {PRICE_LIMITS.map((p) => (
              <option key={p} value={p}>Up to Rs {p.toLocaleString()}</option>
            ))}
          </select>
        </div>

        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={open24h}
            onChange={(e) => setFilter('open24', e.target.checked ? '1' : '')}
          />
          Open 24 hours
        </label>

        {hasFilters && (
          <button type="button" className="btn btn-outline" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {content}
    </div>
  )
}