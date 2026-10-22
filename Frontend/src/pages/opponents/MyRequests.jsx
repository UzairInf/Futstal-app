import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { PageLoader, Spinner } from '../../components/ui/Spinner.jsx'
import ErrorMessage from '../../components/ui/ErrorMessage.jsx'
import RequestCard from '../../components/opponents/RequestCard.jsx'
import { listMyRequests, closeRequest } from '../../lib/matchRequestsApi.js'

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
]

// An open request whose match time has passed counts as closed (expired)
function bucketOf(request, now) {
  if (request.status === 'closed') return 'closed'
  return new Date(request.starts_at).getTime() > now ? 'open' : 'closed'
}

function statusBadgeFor(request, now) {
  if (request.status === 'open') {
    return new Date(request.starts_at).getTime() > now
      ? <span className="badge badge-active">Open</span>
      : <span className="badge badge-inactive">Expired</span>
  }
  return request.close_reason === 'booking_cancelled'
    ? <span className="badge badge-rejected">Booking cancelled</span>
    : <span className="badge badge-inactive">Closed</span>
}

export default function MyRequests() {
  const { user } = useAuth()
  const toast = useToast()

  const [state, setState] = useState({ loading: true, requests: [], now: 0, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState('open')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    listMyRequests(user.id)
      .then((requests) => {
        if (!cancelled) setState({ loading: false, requests, now: Date.now(), error: '' })
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, requests: [], now: 0, error: err.message })
      })
    return () => { cancelled = true }
  }, [user.id, reloadKey])

  function retry() {
    setState({ loading: true, requests: [], now: 0, error: '' })
    setReloadKey((k) => k + 1)
  }

  async function handleClose(request) {
    const ok = window.confirm(
      `Close your request for ${request.ground_name}? Other players will no longer see it.`
    )
    if (!ok) return

    setBusyId(request.id)
    try {
      const updated = await closeRequest(request.id)
      setState((s) => ({
        ...s,
        requests: s.requests.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
      }))
      toast.success('Request closed')
    } catch (err) {
      toast.error(err.message)
    }
    setBusyId(null)
  }

  if (state.loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

  const grouped = { open: [], closed: [] }
  for (const r of state.requests) grouped[bucketOf(r, state.now)].push(r)
  grouped.open.reverse() // fetched latest first; show the soonest match first

  const visible = grouped[tab]

  return (
    <div className="stack">
      <div className="page-header">
        <h1>My requests</h1>
        <div className="form-actions">
          <Link to="/opponents/new" className="btn">+ Post a request</Link>
          <Link to="/opponents" className="btn btn-outline">Find opponents</Link>
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
          <p className="muted">
            {tab === 'open' ? 'You have no open requests.' : 'No closed requests yet.'}
          </p>
          {tab === 'open' && <Link to="/opponents/new" className="btn">Post a request</Link>}
        </div>
      )}

      <div className="requests-grid">
        {visible.map((r) => (
          <RequestCard
            key={r.id}
            request={r}
            showHost={false}
            statusBadge={statusBadgeFor(r, state.now)}
          >
            {bucketOf(r, state.now) === 'open' && (
              <button
                className="btn btn-danger btn-small"
                onClick={() => handleClose(r)}
                disabled={busyId === r.id}
              >
                {busyId === r.id ? <Spinner size={14} /> : 'Close request'}
              </button>
            )}
          </RequestCard>
        ))}
      </div>
    </div>
  )
}