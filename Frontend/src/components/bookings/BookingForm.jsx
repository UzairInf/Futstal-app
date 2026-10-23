import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { Spinner } from '../ui/Spinner.jsx'
import ErrorMessage from '../ui/ErrorMessage.jsx'
import { PHONE_RE, EMAIL_RE } from '../../lib/constants.js'
import { getAvailableSlots, createBooking } from '../../lib/bookingsApi.js'
import {
  todayInKarachi, karachiDate, addDays, addHours, weekStart,
  weekdayShort, monthShort, dayOfMonth,
  formatHour, formatDay, formatRange,
} from '../../lib/karachiTime.js'
import { Link } from 'react-router-dom'

const CANCEL_WINDOW_MS = 12 * 3600e3
const MAX_HOURS = 24
const nowMs = () => Date.now()

// Works out the new selection after a tap on slot number `i`.
// A selection is { from, to } (slot positions, inclusive) or null.
function nextSelection(slots, sel, i) {
  const ok = (k) => slots[k].slot_status === 'available'
  if (!ok(i)) return sel
  if (!sel) return { from: i, to: i }

  // One slot selected: tapping it again clears it, tapping another makes a range
  if (sel.from === sel.to) {
    if (i === sel.from) return null
    const from = Math.min(sel.from, i)
    const to = Math.max(sel.from, i)
    let free = to - from + 1 <= MAX_HOURS
    for (let k = from; k <= to && free; k++) free = ok(k)
    return free ? { from, to } : { from: i, to: i }
  }

  // A range is selected: extend or shrink at its ends, otherwise start over
  const length = sel.to - sel.from + 1
  if (i === sel.to + 1 && length < MAX_HOURS) return { from: sel.from, to: i }
  if (i === sel.from - 1 && length < MAX_HOURS) return { from: i, to: sel.to }
  if (i === sel.to) return { from: sel.from, to: sel.to - 1 }
  if (i === sel.from) return { from: sel.from + 1, to: sel.to }
  return { from: i, to: i }
}

export default function BookingForm({ ground }) {
  const { user } = useAuth()
  const toast = useToast()

  const [today] = useState(todayInKarachi)
  const maxDate = addDays(today, 30)

  const [date, setDate] = useState(today)
  const [weekStartDate, setWeekStartDate] = useState(() => weekStart(today))
  const [slotsState, setSlotsState] = useState({ key: null, slots: [], error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [selection, setSelection] = useState(null) // { from, to, cancellable }
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(user.email ?? '')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(null)

  const slotsKey = `${ground.id}|${date}`
  const slotsLoading = slotsState.key !== slotsKey

  useEffect(() => {
    let cancelled = false
    getAvailableSlots(ground.id, date)
      .then((slots) => {
        if (!cancelled) setSlotsState({ key: slotsKey, slots, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setSlotsState({ key: slotsKey, slots: [], error: err.message })
      })
    return () => { cancelled = true }
  }, [ground.id, date, slotsKey, reloadKey])

  function refreshSlots() {
    setSelection(null)
    setSlotsState((s) => ({ ...s, key: null }))
    setReloadKey((k) => k + 1)
  }

  if (ground.owner_id === user.id) {
    return (
      <div className="card">
        <h3>Book this ground</h3>
        <p className="muted">This is your ground. Owners can't book their own grounds.</p>
      </div>
    )
  }

  function selectDate(d) {
    setDate(d)
    setSelection(null)
    setError('')
    setConfirmed(null)
  }

  const weekDays = Array.from({ length: 7 }, (_, k) => addDays(weekStartDate, k))
  const canGoPrev = weekStartDate > weekStart(today)
  const canGoNext = addDays(weekStartDate, 7) <= maxDate

  function changeWeek(delta) {
    const nextStart = addDays(weekStartDate, delta * 7)
    setWeekStartDate(nextStart)
    const firstOpenDay = Array.from({ length: 7 }, (_, k) => addDays(nextStart, k))
      .find((d) => d >= today && d <= maxDate)
    if (firstOpenDay) selectDate(firstOpenDay)
  }

  const slots = slotsState.slots
  const sel = selection && slots[selection.to] ? selection : null
  const hours = sel ? sel.to - sel.from + 1 : 0
  const start = sel ? slots[sel.from].slot_start : null
  const end = sel ? addHours(slots[sel.to].slot_start, 1) : null

  function handleSlotClick(i) {
    const next = nextSelection(slots, sel, i)
    if (next === sel) return
    setError('')
    setConfirmed(null)
    if (!next) {
      setSelection(null)
      return
    }
    const now = nowMs()
    setSelection({
      ...next,
      cancellable: new Date(slots[next.from].slot_start).getTime() - now >= CANCEL_WINDOW_MS,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!sel) return setError('Please pick a time slot.')

    const cleanPhone = phone.trim()
    const cleanEmail = email.trim()
    if (!PHONE_RE.test(cleanPhone)) return setError('Enter a valid phone number.')
    if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
      return setError('Enter a valid email address, or leave it blank.')
    }

    setSubmitting(true)
    try {
      const booking = await createBooking({
        groundId: ground.id,
        start,
        hours,
        phone: cleanPhone,
        email: cleanEmail || null,
        notes: notes.trim() || null,
      })
      setConfirmed(booking)
      setNotes('')
      toast.success('Booking confirmed')
      refreshSlots()
    } catch (err) {
      setError(err.message)
      if (err.code === '23P01') refreshSlots() // someone took it a moment ago
    }
    setSubmitting(false)
  }

  let slotsContent
  if (slotsLoading) {
    slotsContent = (
      <div className="inline-loader"><Spinner size={18} /> Loading times...</div>
    )
  } else if (slotsState.error) {
    slotsContent = <ErrorMessage message={slotsState.error} onRetry={refreshSlots} />
  } else if (slots.length === 0) {
    slotsContent = <p className="muted">There are no times to show for this day.</p>
  } else {
    slotsContent = (
      <>
        <div className="slot-grid">
          {slots.map((s, i) => {
            const inRange = sel && i >= sel.from && i <= sel.to
            const nextDay = karachiDate(s.slot_start) !== date
            return (
              <button
                key={s.slot_start}
                type="button"
                className={`slot slot-${s.slot_status}${inRange ? ' selected' : ''}`}
                disabled={s.slot_status !== 'available'}
                aria-pressed={Boolean(inRange)}
                onClick={() => handleSlotClick(i)}
              >
                <span>
                  {formatHour(s.slot_start)} – {formatHour(addHours(s.slot_start, 1))}
                </span>
                {s.slot_status === 'booked' ? (
                  <small>Booked</small>
                ) : (
                  nextDay && <small>Next day</small>
                )}
              </button>
            )
          })}
        </div>

        <div className="slot-legend">
          <span><i className="dot dot-available" />Available</span>
          <span><i className="dot dot-selected" />Selected</span>
          <span><i className="dot dot-booked" />Booked</span>
          <span><i className="dot dot-unavailable" />Unavailable</span>
        </div>
      </>
    )
  }

  return (
    <div className="card stack">
      <h3>Book this ground</h3>

      {confirmed && (
        <div className="alert alert-success" role="status">
          <div>
            <strong>Booking confirmed</strong>
            <div>
              {formatDay(confirmed.start_at)} · {formatRange(confirmed.start_at, confirmed.end_at)} ·{' '}
              Rs {confirmed.total_price.toLocaleString()}
            </div>
          </div>
          <Link to="/bookings" className="btn btn-outline btn-small">View my bookings</Link>
        </div>
      )}

      <div>
        <div className="week-header">
          <button type="button" className="week-arrow" aria-label="Previous week"
            onClick={() => changeWeek(-1)} disabled={!canGoPrev}>‹</button>
          <span className="week-label">
            {monthShort(weekDays[0])} {dayOfMonth(weekDays[0])} – {monthShort(weekDays[6])} {dayOfMonth(weekDays[6])}
          </span>
          <button type="button" className="week-arrow" aria-label="Next week"
            onClick={() => changeWeek(1)} disabled={!canGoNext}>›</button>
        </div>

        <div className="week-days">
          {weekDays.map((d) => (
            <button
              key={d}
              type="button"
              className={`day-chip${d === date ? ' selected' : ''}`}
              disabled={d < today || d > maxDate}
              aria-pressed={d === date}
              onClick={() => selectDate(d)}
            >
              <span>{weekdayShort(d)}</span>
              <strong>{dayOfMonth(d)}</strong>
              <small>{d === today ? 'Today' : monthShort(d)}</small>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label>Pick your time (Karachi time)</label>
        <p className="muted hint">
          Tap a start time, then tap an end time to book several hours in a row.
        </p>
        {slotsContent}
      </div>

      {sel && (
        <form onSubmit={handleSubmit}>
          <ErrorMessage message={error} />

          <div className="booking-summary">
            <p>
              <strong>{formatDay(start)}</strong> · {formatRange(start, end)}{' '}
              ({hours} hour{hours === 1 ? '' : 's'})
            </p>
            <p>
              Rs {ground.hourly_price.toLocaleString()} × {hours} ={' '}
              <strong>Rs {(ground.hourly_price * hours).toLocaleString()}</strong>
            </p>
            <p className="muted">No online payment yet. Payment is handled with the ground.</p>
          </div>

          {sel.cancellable ? (
            <p className="muted">You can cancel until 12 hours before the start time.</p>
          ) : (
            <div className="alert alert-warning" role="alert">
              <span>
                This booking starts in less than 12 hours, so it can't be cancelled after you confirm.
              </span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="booking-phone">Phone number</label>
            <input
              id="booking-phone"
              type="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="booking-email">Email (optional)</label>
            <input
              id="booking-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="booking-notes">Notes (optional)</label>
            <textarea
              id="booking-notes"
              rows={3}
              maxLength={300}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-block" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : 'Confirm booking'}
          </button>
        </form>
      )}
    </div>
  )
}