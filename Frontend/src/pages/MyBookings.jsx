import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import { listMyBookings, cancelBooking } from '../lib/bookingsApi.js'
import { formatDay, formatTime, formatRange } from '../lib/karachiTime.js'

const CANCEL_WINDOW_MS = 12 * 3600e3

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
]

const EMPTY_TEXT = {
  upcoming: 'You have no upcoming bookings.',
  past: 'No past bookings yet.',
  cancelled: 'No cancelled bookings.',
}

function bucketOf(booking, now) {
  if (booking.status === 'cancelled') return 'cancelled'
  return new Date(booking.end_at).getTime() > now ? 'upcoming' : 'past'
}

function BookingCard({ booking, now, userId, busy, onCancel }) {
  const ground = booking.grounds
  const bucket = bucketOf(booking, now)
  const startMs = new Date(booking.start_at).getTime()
  const hours = Math.round((new Date(booking.end_at).getTime() - startMs) / 3600e3)
  const deadlineIso = new Date(startMs - CANCEL_WINDOW_MS).toISOString()

  const inProgress = bucket === 'upcoming' && startMs <= now
  const canCancel = bucket === 'upcoming' && startMs - CANCEL_WINDOW_MS >= now

  let badge
  if (bucket === 'cancelled') badge = { cls: 'badge-rejected', text: 'Cancelled' }
  else if (inProgress) badge = { cls: 'badge-admin', text: 'Happening now' }
  else if (bucket === 'upcoming') badge = { cls: 'badge-active', text: 'Confirmed' }
  else badge = { cls: 'badge-inactive', text: 'Completed' }

  return (
    <div className="card booking-card">
      <div className="booking-head">
        <h3>
          {ground?.is_active ? (
            <Link to={`/grounds/${booking.ground_id}`}>{ground.name}</Link>
          ) : (
            ground?.name ?? 'Ground unavailable'
          )}
        </h3>
        <span className={`badge ${badge.cls}`}>{badge.text}</span>
      </div>

      {ground && <p className="muted">📍 {ground.address}, {ground.area}</p>}

      <p className="booking-when">
        {formatDay(booking.start_at)} · {formatRange(booking.start_at, booking.end_at)}
      </p>
      <p>
        {hours} hour{hours === 1 ? '' : 's'} · <strong>Rs {booking.total_price.toLocaleString()}</strong>
      </p>
      {booking.notes && <p className="muted">Notes: {booking.notes}</p>}

      {bucket === 'cancelled' && (
        <p className="muted">
          Cancelled by {booking.cancelled_by === userId ? 'you' : 'the ground owner'}
          {booking.cancelled_at ? ` on ${formatDay(booking.cancelled_at)}` : ''}
          {booking.cancel_reason ? `: ${booking.cancel_reason}` : ''}
        </p>
      )}

      {canCancel && (
        <>
          <p className="muted">
            Free cancellation until {formatDay(deadlineIso)}, {formatTime(deadlineIso)}
          </p>
          <button className="btn btn-danger btn-small" onClick={() => onCancel(booking)} disabled={busy}>
            {busy ? <Spinner size={14} /> : 'Cancel booking'}
          </button>
        </>
      )}

      {bucket === 'upcoming' && !canCancel && !inProgress && (
        <p className="muted">Cancellation closed 12 hours before the start time.</p>
      )}

      <p className="booking-ref">Booking #{booking.id.slice(0, 8).toUpperCase()}</p>
    </div>
  )
}

export default function MyBookings() {
  const { user } = useAuth()
  const toast = useToast()

  const [state, setState] = useState({ loading: true, bookings: [], now: 0, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState('upcoming')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    listMyBookings(user.id)
      .then((bookings) => {
        if (!cancelled) setState({ loading: false, bookings, now: Date.now(), error: '' })
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, bookings: [], now: 0, error: err.message })
      })
    return () => { cancelled = true }
  }, [user.id, reloadKey])

  function retry() {
    setState({ loading: true, bookings: [], now: 0, error: '' })
    setReloadKey((k) => k + 1)
  }

  async function handleCancel(booking) {
    const name = booking.grounds?.name ?? 'this ground'
    const ok = window.confirm(
      `Cancel your booking at ${name}?\n\n` +
      `${formatDay(booking.start_at)}, ${formatRange(booking.start_at, booking.end_at)}\n\n` +
      `This can't be undone.`
    )
    if (!ok) return

    setBusyId(booking.id)
    try {
      const updated = await cancelBooking(booking.id)
      // keep the joined ground details, update the rest
      setState((s) => ({
        ...s,
        bookings: s.bookings.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)),
      }))
      toast.success('Booking cancelled')
    } catch (err) {
      toast.error(err.message)
    }
    setBusyId(null)
  }

  if (state.loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

  const grouped = { upcoming: [], past: [], cancelled: [] }
  for (const b of state.bookings) grouped[bucketOf(b, state.now)].push(b)
  grouped.upcoming.reverse() // fetched newest first; show the soonest upcoming booking first

  const visible = grouped[tab]

  return (
    <div className="stack">
      <h1>My bookings</h1>

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
          {tab === 'upcoming' && <Link to="/grounds" className="btn">Find a ground</Link>}
        </div>
      )}

      {visible.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          now={state.now}
          userId={user.id}
          busy={busyId === b.id}
          onCancel={handleCancel}
        />
      ))}
    </div>
  )
}