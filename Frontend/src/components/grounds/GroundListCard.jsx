import { Link, useLocation } from 'react-router-dom'
import PhotoCarousel from './PhotoCarousel.jsx'
import { AMENITY_LABELS } from '../../lib/constants.js'
import { formatHours } from '../../lib/groundHours.js'

const MAX_TAGS = 4

export default function GroundListCard({ ground }) {
  const location = useLocation()
  const shown = ground.amenities.slice(0, MAX_TAGS)
  const extra = ground.amenities.length - shown.length

  return (
    <article className="card listing-card">
      <PhotoCarousel paths={ground.photo_paths} alt={ground.name} />

      <div className="listing-body">
        <h3>{ground.name}</h3>
        <p className="muted">📍 {ground.area}</p>
        <p>
          <strong>Rs {ground.hourly_price.toLocaleString()}</strong>/hour · {ground.team_size} a side
        </p>
        <p className="muted">{formatHours(ground.opening_time, ground.closing_time)}</p>

        {shown.length > 0 && (
          <div className="tag-list">
            {shown.map((a) => (
              <span key={a} className="tag">{AMENITY_LABELS[a] ?? a}</span>
            ))}
            {extra > 0 && <span className="tag">+{extra} more</span>}
          </div>
        )}

        <Link
          to={`/grounds/${ground.id}`}
          state={{ search: location.search }}
          className="btn btn-block"
        >
          View details
        </Link>
      </div>
    </article>
  )
}