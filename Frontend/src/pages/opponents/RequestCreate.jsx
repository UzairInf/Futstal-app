import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { PageLoader, Spinner } from '../../components/ui/Spinner.jsx'
import ErrorMessage from '../../components/ui/ErrorMessage.jsx'
import { AREAS, TEAM_SIZES, SKILL_LEVELS, DURATION_OPTIONS } from '../../lib/constants.js'
import { listMyBookings } from '../../lib/bookingsApi.js'
import { listActiveGrounds } from '../../lib/groundsApi.js'
import {
  listMyRequests, createRequestFromBooking, createRequestManual,
} from '../../lib/matchRequestsApi.js'
import {
  todayInKarachi, addDays, dayLabel, toKarachiIso, formatDay, formatRange,
} from '../../lib/karachiTime.js'
import { formatDuration } from '../../lib/matchFormat.js'

export default function RequestCreate() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [today] = useState(todayInKarachi)
  const dayOptions = Array.from({ length: 31 }, (_, i) => addDays(today, i))

  const [data, setData] = useState({
    loading: true, bookings: [], requests: [], grounds: [], now: 0, error: '',
  })
  const [reloadKey, setReloadKey] = useState(0)

  const [modeChoice, setModeChoice] = useState(null)
  const [bookingChoice, setBookingChoice] = useState('')
  const [groundChoice, setGroundChoice] = useState('')
  const [groundName, setGroundName] = useState('')
  const [area, setArea] = useState('')
  const [date, setDate] = useState(() => addDays(today, 1))
  const [time, setTime] = useState('20:00')
  const [duration, setDuration] = useState('60')
  const [teamSize, setTeamSize] = useState('5')
  const [skill, setSkill] = useState('intermediate')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([listMyBookings(user.id), listMyRequests(user.id), listActiveGrounds()])
      .then(([bookings, requests, grounds]) => {
        if (cancelled) return
        setData({
          loading: false,
          bookings,
          requests,
          grounds: [...grounds].sort((a, b) => a.name.localeCompare(b.name)),
          now: Date.now(),
          error: '',
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setData({ loading: false, bookings: [], requests: [], grounds: [], now: 0, error: err.message })
        }
      })
    return () => { cancelled = true }
  }, [user.id, reloadKey])

  function retry() {
    setData({ loading: true, bookings: [], requests: [], grounds: [], now: 0, error: '' })
    setReloadKey((k) => k + 1)
  }

  if (data.loading) return <PageLoader />
  if (data.error) return <ErrorMessage message={data.error} onRetry={retry} />

  // Bookings that can still get a request: confirmed, upcoming, and no open request yet
  const alreadyLinked = new Set(
    data.requests.filter((r) => r.status === 'open' && r.booking_id).map((r) => r.booking_id)
  )
  const eligible = data.bookings
    .filter(
      (b) =>
        b.status === 'confirmed' &&
        new Date(b.start_at).getTime() > data.now &&
        !alreadyLinked.has(b.id)
    )
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

  const mode = modeChoice ?? (eligible.length > 0 ? 'booking' : 'manual')
  const bookingId = eligible.some((b) => b.id === bookingChoice)
    ? bookingChoice
    : eligible[0]?.id ?? ''
  const selectedBooking = eligible.find((b) => b.id === bookingId)

  function handleGroundChange(e) {
    const id = e.target.value
    setGroundChoice(id)
    const ground = data.grounds.find((g) => g.id === id)
    if (ground) setTeamSize(String(ground.team_size))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const cleanNotes = notes.trim() || null

    if (mode === 'booking') {
      if (!bookingId) return setError('Choose one of your bookings.')
      setSubmitting(true)
      try {
        await createRequestFromBooking({ bookingId, skill, notes: cleanNotes })
        toast.success('Request posted')
        navigate('/opponents/mine')
      } catch (err) {
        setError(err.message)
        setSubmitting(false)
      }
      return
    }

    const typedName = groundName.trim()
    if (!groundChoice && typedName.length < 2) return setError('Enter the ground name.')
    if (!groundChoice && !area) return setError('Select the area.')

    const startsAt = toKarachiIso(date, time)
    if (new Date(startsAt).getTime() < Date.now() + 30 * 60000) {
      return setError('The match must start at least 30 minutes from now.')
    }

    setSubmitting(true)
    try {
      await createRequestManual({
        startsAt,
        durationMinutes: Number(duration),
        teamSize: Number(teamSize),
        skill,
        groundId: groundChoice || null,
        groundName: groundChoice ? null : typedName,
        area: groundChoice ? null : area,
        notes: cleanNotes,
      })
      toast.success('Request posted')
      navigate('/opponents/mine')
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="card form-card">
      <h1>Post a request</h1>
      <p className="muted">Tell other players when and where you want a match.</p>

      <div className="mode-options" role="radiogroup" aria-label="Do you have a booking?">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'booking'}
          className={`mode-card${mode === 'booking' ? ' selected' : ''}`}
          onClick={() => setModeChoice('booking')}
        >
          <strong>I have a booking</strong>
          <span>Pick a booking you made on the app. Your request shows as ✓ Booking verified.</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'manual'}
          className={`mode-card${mode === 'manual' ? ' selected' : ''}`}
          onClick={() => setModeChoice('manual')}
        >
          <strong>I don't have a booking yet</strong>
          <span>Booked elsewhere or still arranging? Enter the match details yourself.</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <ErrorMessage message={error} />

        {mode === 'booking' && (
          eligible.length === 0 ? (
            <div className="alert alert-warning" role="alert">
              <span>
                You have no upcoming bookings without a request.{' '}
                <Link to="/grounds">Book a ground</Link> or choose "I don't have a booking yet".
              </span>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="booking">Your booking</label>
                <select id="booking" value={bookingId} onChange={(e) => setBookingChoice(e.target.value)}>
                  {eligible.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.grounds?.name ?? 'Ground'} · {formatDay(b.start_at)} · {formatRange(b.start_at, b.end_at)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBooking && (
                <div className="booking-summary">
                  <p>
                    <strong>{selectedBooking.grounds?.name ?? 'Ground'}</strong>
                    {selectedBooking.grounds ? ` · ${selectedBooking.grounds.area}` : ''}
                  </p>
                  <p>{formatDay(selectedBooking.start_at)} · {formatRange(selectedBooking.start_at, selectedBooking.end_at)}</p>
                  {selectedBooking.grounds?.team_size && (
                    <p className="muted">{selectedBooking.grounds.team_size} a side</p>
                  )}
                  <p className="muted">The ground, time and team size come from your booking.</p>
                </div>
              )}
            </>
          )
        )}

        {mode === 'manual' && (
          <>
            <div className="form-group">
              <label htmlFor="ground">Ground</label>
              <select id="ground" value={groundChoice} onChange={handleGroundChange}>
                <option value="">Not listed here (type the name)</option>
                {data.grounds.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} · {g.area}</option>
                ))}
              </select>
            </div>

            {!groundChoice && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ground-name">Ground name</label>
                  <input
                    id="ground-name"
                    value={groundName}
                    maxLength={80}
                    onChange={(e) => setGroundName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="area">Area</label>
                  <select id="area" value={area} onChange={(e) => setArea(e.target.value)}>
                    <option value="" disabled>Select area</option>
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <select id="date" value={date} onChange={(e) => setDate(e.target.value)}>
                  {dayOptions.map((d) => <option key={d} value={d}>{dayLabel(d, today)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="time">Start time (Karachi)</label>
                <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration</label>
                <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  {DURATION_OPTIONS.map((m) => (
                    <option key={m} value={m}>{formatDuration(m)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="team-size">Team size (per side)</label>
                <select id="team-size" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                  {TEAM_SIZES.map((s) => <option key={s} value={s}>{s} a side</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="skill">Skill level</label>
          <select id="skill" value={skill} onChange={(e) => setSkill(e.target.value)}>
            {SKILL_LEVELS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            rows={3}
            maxLength={300}
            placeholder="Anything opponents should know: jersey colour, how you want to split the fee, and so on."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn"
            disabled={submitting || (mode === 'booking' && eligible.length === 0)}
          >
            {submitting ? <Spinner size={16} /> : 'Post request'}
          </button>
          <Link to="/opponents" className="btn btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  )
}