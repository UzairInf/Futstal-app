import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { PageLoader } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import { Stars } from '../components/ratings/StarRating.jsx'
import { MIN_RATINGS_FOR_REPUTATION } from '../lib/constants.js'
import { getPlayerStats } from '../lib/ratingsApi.js'
import { KARACHI_TZ } from '../lib/karachiTime.js'
import ReportButton from '../components/reports/ReportButton.jsx'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const monthYear = new Intl.DateTimeFormat('en-US', {
  timeZone: KARACHI_TZ, month: 'long', year: 'numeric',
})

function NotFound() {
  return (
    <div className="card auth-card">
      <h1>Player not found</h1>
      <p>This player doesn't exist.</p>
      <Link to="/opponents" className="btn">Find opponents</Link>
    </div>
  )
}

export default function PlayerProfile() {
  const { id } = useParams()
  const { user } = useAuth()

  const validId = UUID_RE.test(id)
  const fetchKey = id
  const [result, setResult] = useState({ key: null, player: null, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const loading = validId && result.key !== `${fetchKey}|${reloadKey}`

  useEffect(() => {
    if (!validId) return
    let cancelled = false
    const key = `${fetchKey}|${reloadKey}`
    getPlayerStats(id)
      .then((player) => {
        if (!cancelled) setResult({ key, player, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, player: null, error: err.message })
      })
    return () => { cancelled = true }
  }, [id, validId, fetchKey, reloadKey])

  if (!validId) return <NotFound />
  if (loading) return <PageLoader />
  if (result.error) {
    return <ErrorMessage message={result.error} onRetry={() => setReloadKey((k) => k + 1)} />
  }
  if (!result.player) return <NotFound />

  const p = result.player
  const average = p.average_rating == null ? null : Number(p.average_rating)

  return (
    <div className="card profile-card">
      <div className="profile-header">
        <Avatar url={p.avatar_url} name={p.full_name} size={96} />
        <div className="profile-meta">
          <h1>{p.full_name || 'Unnamed player'}</h1>
          <p className="muted">{p.area ? `📍 ${p.area}, Karachi` : 'No area set'}</p>
          <p className="muted">Member since {monthYear.format(new Date(p.member_since))}</p>
          {user?.id === p.player_id && (
            <Link to="/profile" className="btn btn-outline btn-small">Edit profile</Link>
          )}
        </div>
      </div>

      {p.bio && <p className="pre-wrap">{p.bio}</p>}

      <ul className="facts">
        <li><strong>Matches played:</strong> {p.matches_played}</li>
        <li>
          <strong>Rating:</strong>{' '}
          {average === null ? (
            <span className="muted">
              Not enough ratings yet ({p.rating_count} of {MIN_RATINGS_FOR_REPUTATION} needed)
            </span>
          ) : (
            <>
              <Stars value={average} /> {average.toFixed(1)}{' '}
              <span className="muted">({p.rating_count} ratings)</span>
            </>
          )}
        </li>
        <li>
          <strong>Showed up:</strong>{' '}
          {p.show_up_rate === null
            ? <span className="muted">Not enough ratings yet</span>
            : `${p.show_up_rate}% of rated matches`}
        </li>
      </ul>

      {user && user.id !== p.player_id && <ReportButton targetType="player" targetId={p.player_id} />}
    </div>
  )
}