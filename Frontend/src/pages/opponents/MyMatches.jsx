import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../hooks/useToast.js'
import { PageLoader, Spinner } from '../../components/ui/Spinner.jsx'
import ErrorMessage from '../../components/ui/ErrorMessage.jsx'
import Avatar from '../../components/ui/Avatar.jsx'
import RequestCard from '../../components/opponents/RequestCard.jsx'
import MatchContact from '../../components/opponents/MatchContact.jsx'
import { listMyMatches, cancelMatch } from '../../lib/matchesApi.js'
import { formatDay, formatRange } from '../../lib/karachiTime.js'
import {
  MATCH_TABS, bucketOf, canCancel, groupMatches, isInProgress, matchBadge,
} from '../../lib/matchStatus.js'

const EMPTY_TEXT = {
  upcoming: 'You have no upcoming matches.',
  past: 'No past matches yet.',
  cancelled: 'No cancelled matches.',
}

// RequestCard expects a request-shaped object, so reshape the match row
function asRequest(m) {
  return {
    id: m.request_id,
    ground_id: m.ground_id,
    ground_name: m.ground_name,
    booking_id: m.booking_id,
    area: m.area,
    starts_at: m.starts_at,
    ends_at: m.ends_at,
    team_size: m.team_size,
    skill_level: m.skill_level,
    notes: m.notes,
  }
}

function cancelledText(m) {
  const when = m.cancelled_at ? ` on ${formatDay(m.cancelled_at)}` : ''
  if (m.cancelled_by_system) return 'The ground booking was cancelled, so this match is off.'
  if (m.cancelled_by_me) return `You cancelled this match${when}.`
  return `Your opponent cancelled this match${when}.`
}

function MatchItem({ match, now, busy, onCancel }) {
  const bucket = bucketOf(match, now)
  const badge = matchBadge(bucket, isInProgress(match, now))
  const opponent = match.opponent_name || 'Player'

  return (
    <RequestCard
      request={asRequest(match)}
      showHost={false}
      statusBadge={<span className={`badge ${badge.cls}`}>{badge.text}</span>}
    >
      <div className="host-row">
        <Avatar url={match.opponent_avatar_url} name={opponent} size={28} />
        <span>
          Opponent: <strong>{opponent}</strong>
          {match.opponent_area && <span className="muted"> · {match.opponent_area}</span>}
        </span>
      </div>
      <p className="muted hint">
        {match.role === 'host' ? 'You posted this request' : 'You joined this request'}
      </p>

      {bucket === 'cancelled' && <p className="muted">{cancelledText(match)}</p>}

      {bucket === 'upcoming' && match.opponent_phone && (
        <MatchContact
          title="Contact your opponent to arrange the match"
          name={opponent}
          phone={match.opponent_phone}
          yourPhone={match.my_phone}
        />
      )}

      {canCancel(match, now) && (
        <button
          type="button"
          className="btn btn-danger btn-small"
          onClick={() => onCancel(match)}
          disabled={busy}
        >
          {busy ? <Spinner size={14} /> : 'Cancel match'}
        </button>
      )}
    </RequestCard>
  )
}

export default function MyMatches() {
  const toast = useToast()

  const [state, setState] = useState({ loading: true, matches: [], now: 0, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState('upcoming')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    listMyMatches()
      .then((matches) => {
        if (!cancelled) setState({ loading: false, matches, now: Date.now(), error: '' })
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, matches: [], now: 0, error: err.message })
      })
    return () => { cancelled = true }
  }, [reloadKey])

  function retry() {
    setState({ loading: true, matches: [], now: 0, error: '' })
    setReloadKey((k) => k + 1)
  }

  async function handleCancel(match) {
    const ok = window.confirm(
      `Cancel your match at ${match.ground_name}?\n\n` +
      `${formatDay(match.starts_at)}, ${formatRange(match.starts_at, match.ends_at)}\n\n` +
      `Your opponent will see it as cancelled. This can't be undone.`
    )
    if (!ok) return

    setBusyId(match.match_id)
    try {
      await cancelMatch(match.match_id)
      toast.success('Match cancelled')
    } catch (err) {
      toast.error(err.message)
    }
    setReloadKey((k) => k + 1) // reload either way, so the screen matches the database
    setBusyId(null)
  }

  if (state.loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

  const grouped = groupMatches(state.matches, state.now)
  const visible = grouped[tab]

  return (
    <div className="stack">
      <div className="page-header">
        <h1>My matches</h1>
        <div className="form-actions">
          <Link to="/opponents" className="btn">Find opponents</Link>
          <Link to="/opponents/mine" className="btn btn-outline">My requests</Link>
          <Link to="/opponents/responses" className="btn btn-outline">My responses</Link>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {MATCH_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className="tab-count">{grouped[t.key].length}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="card empty-state">
          <p className="muted">{EMPTY_TEXT[tab]}</p>
          {tab === 'upcoming' && <Link to="/opponents" className="btn">Find an opponent</Link>}
        </div>
      )}

      <div className="requests-grid">
        {visible.map((m) => (
          <MatchItem
            key={m.match_id}
            match={m}
            now={state.now}
            busy={busyId === m.match_id}
            onCancel={handleCancel}
          />
        ))}
      </div>
    </div>
  )
}