import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../hooks/useToast.js'
import { PageLoader, Spinner } from '../../components/ui/Spinner.jsx'
import ErrorMessage from '../../components/ui/ErrorMessage.jsx'
import RequestCard from '../../components/opponents/RequestCard.jsx'
import MatchContact from '../../components/opponents/MatchContact.jsx'
import { listMyResponses, withdrawResponse } from '../../lib/matchResponsesApi.js'
import { responseBadge } from '../../lib/responseStatus.js'

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'closed', label: 'Closed' },
]

const EMPTY_TEXT = {
  pending: 'You have no pending responses.',
  accepted: 'No accepted matches yet.',
  closed: 'Nothing here yet.',
}

function bucketOf(response, now) {
  if (response.status === 'accepted') return 'accepted'
  if (response.status === 'pending' && new Date(response.starts_at).getTime() > now) return 'pending'
  return 'closed'
}

// RequestCard expects a request-shaped object, so reshape the response row
function asRequest(r) {
  return {
    id: r.request_id,
    ground_id: r.ground_id,
    ground_name: r.ground_name,
    booking_id: r.booking_id,
    area: r.area,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    team_size: r.team_size,
    skill_level: r.skill_level,
    notes: r.notes,
    profiles: { full_name: r.host_name, avatar_url: r.host_avatar_url },
  }
}

export default function MyResponses() {
  const toast = useToast()

  const [state, setState] = useState({ loading: true, responses: [], now: 0, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState('pending')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    listMyResponses()
      .then((responses) => {
        if (!cancelled) setState({ loading: false, responses, now: Date.now(), error: '' })
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, responses: [], now: 0, error: err.message })
      })
    return () => { cancelled = true }
  }, [reloadKey])

  function retry() {
    setState({ loading: true, responses: [], now: 0, error: '' })
    setReloadKey((k) => k + 1)
  }

  async function handleWithdraw(response) {
    const ok = window.confirm(`Withdraw your response for ${response.ground_name}?`)
    if (!ok) return

    setBusyId(response.response_id)
    try {
      await withdrawResponse(response.response_id)
      setState((s) => ({
        ...s,
        responses: s.responses.map((r) =>
          r.response_id === response.response_id ? { ...r, status: 'withdrawn' } : r
        ),
      }))
      toast.success('Response withdrawn')
    } catch (err) {
      toast.error(err.message)
    }
    setBusyId(null)
  }

  if (state.loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

  const grouped = { pending: [], accepted: [], closed: [] }
  for (const r of state.responses) grouped[bucketOf(r, state.now)].push(r)
  grouped.pending.reverse() // fetched latest match first; show the soonest match first

  const visible = grouped[tab]

  return (
    <div className="stack">
      <div className="page-header">
        <h1>My responses</h1>
        <div className="form-actions">
          <Link to="/opponents" className="btn">Find opponents</Link>
          <Link to="/opponents/mine" className="btn btn-outline">My requests</Link>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
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
          {tab === 'pending' && <Link to="/opponents" className="btn">Find an opponent</Link>}
        </div>
      )}

      <div className="requests-grid">
        {visible.map((r) => {
          const badge = responseBadge(r, state.now)
          const bucket = bucketOf(r, state.now)
          return (
            <RequestCard
              key={r.response_id}
              request={asRequest(r)}
              statusBadge={<span className={`badge ${badge.cls}`}>{badge.text}</span>}
            >
              {r.message && <p className="muted pre-wrap">Your message: {r.message}</p>}

              {r.status === 'accepted' && r.host_phone && (
                <MatchContact
                  title="You're in! Contact the host to arrange the match"
                  name={r.host_name || 'Host'}
                  phone={r.host_phone}
                />
              )}

              {r.status === 'cancelled' && (
                <p className="muted">The ground booking was cancelled, so this match is off.</p>
              )}

              {bucket === 'pending' && (
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => handleWithdraw(r)}
                  disabled={busyId === r.response_id}
                >
                  {busyId === r.response_id ? <Spinner size={14} /> : 'Withdraw response'}
                </button>
              )}
            </RequestCard>
          )
        })}
      </div>
    </div>
  )
}