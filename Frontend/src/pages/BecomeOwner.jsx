import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'

export default function BecomeOwner() {
  const { user, profile, profileLoading, refreshProfile } = useAuth()
  const toast = useToast()

  const [state, setState] = useState({ loading: true, request: null, error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const userId = user.id

  useEffect(() => {
    let cancelled = false

    supabase
      .from('owner_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        setState({ loading: false, request: data, error: error?.message ?? '' })
        // If an admin approved us, pull the new role into the app
        if (data?.status === 'approved') refreshProfile()
      })

    return () => { cancelled = true }
  }, [userId, reloadKey, refreshProfile])

  function reload() {
    setState((s) => ({ ...s, loading: true, error: '' }))
    setReloadKey((k) => k + 1)
  }

  if (profileLoading || state.loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={reload} />
  if (!profile) {
    return <ErrorMessage message="Could not load your profile." onRetry={refreshProfile} />
  }

  if (profile.role !== 'player') {
    return (
      <div className="card auth-card">
        <h1>{profile.role === 'admin' ? 'You are an admin' : "You're a ground owner"}</h1>
        <p>Your account already has the permissions it needs.</p>
        <Link to="/profile" className="btn">Back to profile</Link>
      </div>
    )
  }

  const { request } = state

  if (request?.status === 'pending') {
    return (
      <div className="card auth-card">
        <h1>Request pending</h1>
        <p>
          Thanks! An admin will review your request soon. We'll use{' '}
          <strong>{request.phone}</strong> if we need to reach you.
        </p>
        <Link to="/profile" className="btn btn-outline">Back to profile</Link>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const cleanPhone = phone.trim()
    const cleanMessage = message.trim()

    if (!/^[0-9+() -]{7,20}$/.test(cleanPhone)) {
      return setFormError('Enter a valid phone number.')
    }
    if (cleanMessage.length < 10) {
      return setFormError('Please describe your ground(s) in at least 10 characters.')
    }

    setSubmitting(true)
    const { error } = await supabase
      .from('owner_requests')
      .insert({ phone: cleanPhone, message: cleanMessage })
    setSubmitting(false)

    if (error) {
      setFormError(
        error.code === '23505' ? 'You already have a pending request.' : error.message
      )
      return
    }

    toast.success('Request submitted')
    reload()
  }

  return (
    <div className="card auth-card">
      <h1>Become a ground owner</h1>
      <p className="muted">
        Tell us about the futsal ground(s) you run. An admin reviews every request
        before owner features are unlocked.
      </p>

      {request?.status === 'rejected' && (
        <div className="alert alert-error" role="alert">
          <span>
            Your last request was not approved
            {request.admin_note ? `: ${request.admin_note}` : '.'} You can apply again below.
          </span>
        </div>
      )}

      <ErrorMessage message={formError} />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="phone">Contact phone</label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0300 1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">About your ground(s)</label>
          <textarea
            id="message"
            rows={5}
            maxLength={500}
            placeholder="Ground name, area, how many pitches, and how long you've been running it."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <small className="muted">{message.length}/500</small>
        </div>

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? <Spinner size={16} /> : 'Submit request'}
        </button>
      </form>
    </div>
  )
}