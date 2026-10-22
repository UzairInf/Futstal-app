import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../hooks/useToast.js'
import { Spinner } from '../ui/Spinner.jsx'
import ErrorMessage from '../ui/ErrorMessage.jsx'
import { PHONE_RE } from '../../lib/constants.js'
import { respondToRequest } from '../../lib/matchResponsesApi.js'

// The "Respond" button and form that sit at the bottom of a request card
export default function RequestRespond({ request, responded, onResponded }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (responded) {
    return (
      <div className="respond-box">
        <p className="muted">✓ You responded. Waiting for the host to decide.</p>
        <Link to="/opponents/responses" className="btn btn-outline btn-small">
          View my responses
        </Link>
      </div>
    )
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-small" onClick={() => setOpen(true)}>
        Respond to this request
      </button>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanPhone = phone.trim()
    if (!PHONE_RE.test(cleanPhone)) return setError('Enter a valid phone number.')

    setSubmitting(true)
    try {
      await respondToRequest({
        requestId: request.id,
        phone: cleanPhone,
        message: message.trim() || null,
      })
      toast.success('Response sent')
      onResponded(request.id)
    } catch (err) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  return (
    <form className="respond-form" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      <div className="form-group">
        <label htmlFor={`respond-phone-${request.id}`}>Your phone number</label>
        <input
          id={`respond-phone-${request.id}`}
          type="tel"
          autoComplete="tel"
          placeholder="0300 1234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={submitting}
          required
        />
        <p className="muted hint">
          The host only sees your number if they accept you.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor={`respond-message-${request.id}`}>Message (optional)</label>
        <textarea
          id={`respond-message-${request.id}`}
          rows={2}
          maxLength={300}
          placeholder="Tell them about your team"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-small" disabled={submitting}>
          {submitting ? <Spinner size={14} /> : 'Send response'}
        </button>
        <button
          type="button"
          className="btn btn-outline btn-small"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}