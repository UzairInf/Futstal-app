import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { PageLoader, Spinner } from '../../components/ui/Spinner.jsx'
import ErrorMessage from '../../components/ui/ErrorMessage.jsx'
import RequestCard from '../../components/opponents/RequestCard.jsx'
import RequestResponses from '../../components/opponents/RequestResponses.jsx'
import { listMyRequests, closeRequest } from '../../lib/matchRequestsApi.js'
import { listResponsesToMyRequests } from '../../lib/matchResponsesApi.js'

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'matched', label: 'Matched' },
  { key: 'closed', label: 'Closed' },
]

const EMPTY_TEXT = {
  open: 'You have no open requests.',
  matched: 'No matches yet. When you accept an opponent, the match shows up here.',
  closed: 'No closed requests yet.',
}

// An open request whose match time has passed counts as closed (expired)
function bucketOf(request, now) {
  if (request.status === 'closed') return request.close_reason === 'matched' ? 'matched' : 'closed'
  return new Date(request.starts_at).getTime() > now ? 'open' : 'closed'
}

function statusBadgeFor(request, now, responses) {
  if (request.status === 'open') {
    return new Date(request.starts_at).getTime() > now
      ? <span className="badge badge-active">Open</span>
      : <span className="badge badge-inactive">Expired</span>
  }
  if (request.close_reason === 'matched') {
    return responses.some((r) => r.status === 'cancelled')
      ? <span className="badge badge-rejected">Match cancelled</span>
      : <span className="badge badge-active">Opponent found</span>
  }
  return request.close_reason === 'booking_cancelled'
    ? <span className="badge badge-rejected">Booking cancelled</span>
    : <span className="badge badge-inactive">Closed</span>
}

export default function MyRequests() {
  const { user } = useAuth()
  const toast = useToast()

  const [state, setState] = useState({
    loading: true, requests: [], responses: [], now: 0, error: '',
  })
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState('open')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([listMyRequests(user.id), listResponsesToMyRequests()])
      .then(([requests, responses]) => {
        if (!cancelled) setState({ loading: false, requests, responses, now: Date.now(), error: '' })
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ loading: false, requests: [], responses: [], now: 0, error: err.message })
        }
      })
    return () => { cancelled = true }
  }, [user.id, reloadKey])

  function retry() {
    setState({ loading: true, requests: [], responses: [], now: 0, error: '' })
    setReloadKey((k) => k + 1)
  }

  // Reload quietly (no full-page spinner) after accepting, declining or closing
  function refresh() {
    setReloadKey((k) => k + 1)
  }

  async function handleClose(request) {
    const ok = window.confirm(
      `Close your request for ${request.ground_name}? Other players will no longer see it, ` +
      'and any pending responses will be closed.'
    )
    if (!ok) return

    setBusyId(request.id)
    try {
      await closeRequest(request.id)
      toast.success('Request closed')
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
    setBusyId(null)
  }

  if (state.loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

  const grouped = { open: [], matched: [], closed: [] }
  for (const r of state.requests) grouped[bucketOf(r, state.now)].push(r)
  grouped.open.reverse() // fetched latest first; show the soonest match first

  const responsesByRequest = {}
  for (const resp of state.responses) {
    if (!responsesByRequest[resp.request_id]) responsesByRequest[resp.request_id] = []
    responsesByRequest[resp.request_id].push(resp)
  }

  const visible = grouped[tab]

  return (
    <div className="stack">
      <div className="page-header">
        <h1>My requests</h1>
        <div className="form-actions">
          <Link to="/opponents/new" className="btn">+ Post a request</Link>
          <Link to="/opponents" className="btn btn-outline">Find opponents</Link>
          <Link to="/opponents/responses" className="btn btn-outline">My responses</Link>
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
          {tab === 'open' && <Link to="/opponents/new" className="btn">Post a request</Link>}
        </div>
      )}

      <div className="requests-grid">
        {visible.map((r) => {
          const bucket = bucketOf(r, state.now)
          const responses = responsesByRequest[r.id] ?? []
          return (
            <RequestCard
              key={r.id}
              request={r}
              showHost={false}
              statusBadge={statusBadgeFor(r, state.now, responses)}
            >
              {(bucket === 'open' || bucket === 'matched') && (
                <RequestResponses request={r} responses={responses} onChanged={refresh} />
              )}

              {bucket === 'open' && (
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleClose(r)}
                  disabled={busyId === r.id}
                >
                  {busyId === r.id ? <Spinner size={14} /> : 'Close request'}
                </button>
              )}
            </RequestCard>
          )
        })}
      </div>
    </div>
  )
}