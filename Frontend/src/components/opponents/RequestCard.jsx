import { Link } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'
import { SKILL_LABELS } from '../../lib/constants.js'
import { formatDay, formatRange } from '../../lib/karachiTime.js'
import { formatDuration, minutesBetween } from '../../lib/matchFormat.js'

export default function RequestCard({ request, showHost = true, statusBadge, children }) {
  const host = request.profiles
  const verified = Boolean(request.booking_id)

  return (
    <article className="card request-card">
      <div className="request-top">
        <h3>
          {request.ground_id ? (
            <Link to={`/grounds/${request.ground_id}`}>{request.ground_name}</Link>
          ) : (
            request.ground_name
          )}
        </h3>
        <div className="request-badges">
          {statusBadge}
          <span
            className={`badge ${verified ? 'badge-active' : 'badge-inactive'}`}
            title={verified ? 'This match is booked through the app.' : 'No booking made through the app.'}
          >
            {verified ? '✓ Booking verified' : 'Booking not verified'}
          </span>
        </div>
      </div>

      {showHost && host && (
        <div className="host-row">
          <Avatar url={host.avatar_url} name={host.full_name} size={28} />
          <span>{host.full_name || 'Player'}</span>
        </div>
      )}

      <p className="muted">📍 {request.area}, Karachi</p>
      <p className="request-when">
        {formatDay(request.starts_at)} · {formatRange(request.starts_at, request.ends_at)}{' '}
        <span className="muted">({formatDuration(minutesBetween(request.starts_at, request.ends_at))})</span>
      </p>

      <div className="tag-list">
        <span className="tag">{request.team_size} a side</span>
        <span className="tag">{SKILL_LABELS[request.skill_level] ?? request.skill_level}</span>
      </div>

      {request.notes && <p className="pre-wrap">{request.notes}</p>}
      {children}
    </article>
  )
}