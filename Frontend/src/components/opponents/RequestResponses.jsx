import { useState } from 'react'
import Avatar from '../ui/Avatar.jsx'
import { Spinner } from '../ui/Spinner.jsx'
import ErrorMessage from '../ui/ErrorMessage.jsx'
import MatchContact from './MatchContact.jsx'
import { useToast } from '../../hooks/useToast.js'
import { PHONE_RE } from '../../lib/constants.js'
import { formatDay } from '../../lib/karachiTime.js'
import { acceptResponse, rejectResponse } from '../../lib/matchResponsesApi.js'

function ResponseRow({ response, onChanged }) {
  const toast = useToast()
  const [accepting, setAccepting] = useState(false)
  const [hostPhone, setHostPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const name = response.responder_name || 'Player'

  async function handleAccept(e) {
    e.preventDefault()
    setError('')

    const cleanPhone = hostPhone.trim()
    if (!PHONE_RE.test(cleanPhone)) return setError('Enter a valid phone number.')

    setBusy(true)
    try {
      await acceptResponse(response.response_id, cleanPhone)
      toast.success(`Match confirmed with ${name}`)
    } catch (err) {
      toast.error(err.message)
    }
    onChanged() // reload either way, so the screen matches the database
    setBusy(false)
  }

  async function handleReject() {
    if (!window.confirm(`Decline ${name}'s response?`)) return
    setBusy(true)
    try {
      await rejectResponse(response.response_id)
      toast.success('Response declined')
    } catch (err) {
      toast.error(err.message)
    }
    onChanged()
    setBusy(false)
  }

  return (
    <div className="response-row">
      <div className="response-head">
        <div className="response-who">
          <Avatar url={response.responder_avatar_url} name={name} size={28} />
          <div>
            <strong>{name}</strong>
            <div className="muted hint">
              {response.responder_area} · sent {formatDay(response.created_at)}
            </div>
          </div>
        </div>
        <span className="badge badge-admin">New</span>
      </div>

      {response.message && <p className="pre-wrap">{response.message}</p>}

      {!accepting && (
        <div className="response-actions">
          <button
            type="button"
            className="btn btn-small"
            onClick={() => setAccepting(true)}
            disabled={busy}
          >
            Accept
          </button>
          <button
            type="button"
            className="btn btn-outline btn-small"
            onClick={handleReject}
            disabled={busy}
          >
            {busy ? <Spinner size={14} /> : 'Decline'}
          </button>
        </div>
      )}

      {accepting && (
        <form className="respond-form" onSubmit={handleAccept}>
          <ErrorMessage message={error} />
          <div className="form-group">
            <label htmlFor={`host-phone-${response.response_id}`}>Your phone number</label>
            <input
              id={`host-phone-${response.response_id}`}
              type="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
              value={hostPhone}
              onChange={(e) => setHostPhone(e.target.value)}
              disabled={busy}
              required
            />
            <p className="muted hint">
              {name} will see this number. Accepting closes your request and declines
              everyone else. It can't be undone.
            </p>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-small" disabled={busy}>
              {busy ? <Spinner size={14} /> : 'Confirm match'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={() => setAccepting(false)}
              disabled={busy}
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// Goes inside a request card on the My requests page
export default function RequestResponses({ request, responses, onChanged }) {
  // A matched request shows the opponent instead of a list
  if (request.status === 'closed' && request.close_reason === 'matched') {
    const match = responses.find((r) => r.status === 'accepted' || r.status === 'cancelled')
    if (!match) return null

    if (match.status === 'cancelled') {
      return (
        <div className="alert alert-warning" role="status">
          <span>
            The ground booking for this match was cancelled, so the match is off.
            {' '}{match.responder_name || 'Your opponent'} will see it as cancelled too.
          </span>
        </div>
      )
    }

    return (
      <MatchContact
        title="Opponent confirmed"
        name={match.responder_name || 'Player'}
        phone={match.responder_phone}
        yourPhone={match.host_phone}
      />
    )
  }

  const pending = responses.filter((r) => r.status === 'pending')

  if (pending.length === 0) {
    return <p className="muted">No responses yet.</p>
  }

  return (
    <div className="response-list">
      <h4>Responses ({pending.length})</h4>
      {pending.map((r) => (
        <ResponseRow key={r.response_id} response={r} onChanged={onChanged} />
      ))}
    </div>
  )
}