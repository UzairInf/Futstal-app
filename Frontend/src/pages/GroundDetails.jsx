import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PageLoader } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import PhotoCarousel from '../components/grounds/PhotoCarousel.jsx'
import { AMENITY_LABELS } from '../lib/constants.js'
import { formatHours } from '../lib/groundHours.js'
import { getActiveGround } from '../lib/groundsApi.js'
import BookingForm from '../components/bookings/BookingForm.jsx'

export default function GroundDetails() {
  const { id } = useParams()
  const location = useLocation()
  const backTo = `/grounds${location.state?.search ?? ''}`

  const [state, setState] = useState({ id: null, ground: null, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const loading = state.id !== id

  useEffect(() => {
    let cancelled = false
    getActiveGround(id)
      .then((ground) => {
        if (!cancelled) setState({ id, ground, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setState({ id, ground: null, error: err.message })
      })
    return () => { cancelled = true }
  }, [id, reloadKey])

  function retry() {
    setState({ id: null, ground: null, error: '' })
    setReloadKey((k) => k + 1)
  }

  if (loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

  const g = state.ground

  if (!g) {
    return (
      <div className="card auth-card">
        <h1>Ground not found</h1>
        <p>This ground may have been removed or is no longer available.</p>
        <Link to={backTo} className="btn">Back to grounds</Link>
      </div>
    )
  }

  const mapsUrl =
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(`${g.address}, ${g.area}, Karachi`)

  return (
    <div className="stack">
      <Link to={backTo} className="back-link">← All grounds</Link>

      <div className="details-grid">
        <PhotoCarousel paths={g.photo_paths} alt={g.name} />

        <div className="card">
          <h1>{g.name}</h1>
          <p className="muted">📍 {g.address}, {g.area}</p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
             className="btn btn-outline btn-small">
            Open in Maps
          </a>

          <ul className="facts">
            <li><strong>Rs {g.hourly_price.toLocaleString()}</strong> per hour</li>
            <li>{g.team_size} a side</li>
            <li>{formatHours(g.opening_time, g.closing_time)}</li>
          </ul>

          {g.amenities.length > 0 && (
            <>
              <h3>Amenities</h3>
              <div className="tag-list">
                {g.amenities.map((a) => (
                  <span key={a} className="tag">{AMENITY_LABELS[a] ?? a}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <BookingForm ground={g} />

      {g.description && (
        <div className="card">
          <h3>About this ground</h3>
          <p className="pre-wrap">{g.description}</p>
        </div>
      )}
    </div>
  )
}