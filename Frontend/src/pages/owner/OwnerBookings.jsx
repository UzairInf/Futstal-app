import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { PageLoader, Spinner } from '../../components/ui/Spinner.jsx'
import ErrorMessage from '../../components/ui/ErrorMessage.jsx'
import { listOwnerBookings, cancelBooking } from '../../lib/bookingsApi.js'
import { BOOKING_TABS, bookingBadge, bucketOf, groupBookings } from '../../lib/bookingStatus.js'
import { formatDay, formatRange } from '../../lib/karachiTime.js'
import { fullAddress } from '../../lib/placeFormat.js'
import LoadMore from '../../components/ui/LoadMore.jsx'
import { PAGE_SIZE } from '../../lib/constants.js'

const EMPTY_TEXT = {
  upcoming: 'No upcoming bookings at your grounds.',
  past: 'No past bookings yet.',
  cancelled: 'No cancelled bookings.',
}

const phoneHref = (phone) => `tel:${phone.replace(/[^0-9+]/g, '')}`

function OwnerBookingCard({ booking, now, ownerId, busy, onCancel }) {
  const ground = booking.grounds
  const bucket = bucketOf(booking, now)
  const startMs = new Date(booking.start_at).getTime()
  const hours = Math.round((new Date(booking.end_at).getTime() - startMs) / 3600e3)

  // Owners may cancel any time before the start (the database enforces this too)
  const inProgress = bucket === 'upcoming' && startMs <= now
  const canCancel = bucket === 'upcoming' && startMs > now
  const badge = bookingBadge(bucket, inProgress)

  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')

  async function handleConfirm() {
    const ok = await onCancel(booking, reason.trim() || null)
    if (ok) setConfirming(false)
  }

  return (
    <div className="card booking-card">
      <div className="booking-head">
        <h3>{ground?.name ?? 'Ground'}</h3>
        <span className={`badge ${badge.cls}`}>{badge.text}</span>
      </div>

      {ground && <p className="muted">📍 {fullAddress(ground.address, ground.area)}</p>}

      <p className="booking-when">
        {formatDay(booking.start_at)} · {formatRange(booking.start_at, booking.end_at)}
      </p>
      <p>
        {hours} hour{hours === 1 ? '' : 's'} · <strong>Rs {booking.total_price.toLocaleString()}</strong>
      </p>

      <p>
        📞 <a href={phoneHref(booking.contact_phone)}>{booking.contact_phone}</a>
        {booking.contact_email && (
          <>
            {' · '}
            <a href={`mailto:${booking.contact_email}`}>{booking.contact_email}</a>
          </>
        )}
      </p>
      {booking.notes && <p className="muted">Notes: {booking.notes}</p>}

      {bucket === 'cancelled' && (
        <p className="muted">
          Cancelled by {booking.cancelled_by === ownerId ? 'you' : 'the player'}
          {booking.cancelled_at ? ` on ${formatDay(booking.cancelled_at)}` : ''}
          {booking.cancel_reason ? `: ${booking.cancel_reason}` : ''}
        </p>
      )}

      {inProgress && (
        <p className="muted">This booking has started, so it can no longer be cancelled.</p>
      )}

      {canCancel && !confirming && (
        <button
          type="button"
          className="btn btn-danger btn-small"
          onClick={() => setConfirming(true)}
          disabled={busy}
        >
          Cancel booking
        </button>
      )}

      {canCancel && confirming && (
        <div className="cancel-form">
          <label htmlFor={`cancel-reason-${booking.id}`}>Reason (optional)</label>
          <input
            id={`cancel-reason-${booking.id}`}
            type="text"
            maxLength={300}
            placeholder="e.g. Ground closed for maintenance"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
          />
          <p className="muted hint">
            The player will see this reason. A cancelled booking can't be restored.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-danger btn-small"
              onClick={handleConfirm}
              disabled={busy}
            >
              {busy ? <Spinner size={14} /> : 'Confirm cancellation'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              Keep booking
            </button>
          </div>
        </div>
      )}

      <p className="booking-ref">Booking #{booking.id.slice(0, 8).toUpperCase()}</p>
    </div>
  )
}

export default function OwnerBookings() {
  const { user } = useAuth()
  const toast = useToast()

  const [limit, setLimit] = useState(PAGE_SIZE)
  const [state, setState] = useState({ loading: true, limit: PAGE_SIZE, hasMore: false, bookings: [], now: 0, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState('upcoming')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    listOwnerBookings(user.id, limit)
      .then((rows) => {
        if (!cancelled) {
          setState({ loading: false, limit, hasMore: rows.length > limit, bookings: rows.slice(0, limit), now: Date.now(), error: '' })
        }
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, limit, hasMore: false, bookings: [], now: 0, error: err.message })
      })
    return () => { cancelled = true }
  }, [user.id, limit, reloadKey])

  function retry() {
    setState({ loading: true, limit, hasMore: false, bookings: [], now: 0, error: '' })
    setReloadKey((k) => k + 1)
  }

  // Returns true when the booking was cancelled, so the card can close its form
  async function handleCancel(booking, reason) {
    setBusyId(booking.id)
    let ok = false
    try {
      const updated = await cancelBooking(booking.id, reason)
      // keep the joined ground details, update the rest
      setState((s) => ({
        ...s,
        bookings: s.bookings.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)),
      }))
      toast.success('Booking cancelled')
      ok = true
    } catch (err) {
      toast.error(err.message)
    }
    setBusyId(null)
    return ok
  }

  if (state.loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

  const grouped = groupBookings(state.bookings, state.now)
  const visible = grouped[tab]

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Ground bookings</h1>
        <Link to="/owner/grounds" className="btn btn-outline">My grounds</Link>
      </div>

      <div className="tabs" role="tablist">
        {BOOKING_TABS.map((t) => (
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
        </div>
      )}

      {visible.map((b) => (
        <OwnerBookingCard
          key={b.id}
          booking={b}
          now={state.now}
          ownerId={user.id}
          busy={busyId === b.id}
          onCancel={handleCancel}
        />
      ))}

      <LoadMore
        hasMore={state.hasMore}
        loading={state.limit !== limit}
        onClick={() => setLimit((l) => l + PAGE_SIZE)}
        label="Load older bookings"
      />
    </div>
  )
}