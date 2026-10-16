import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'

export default function Login() {
  const { user, loading: authLoading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [resending, setResending] = useState(false)

  if (authLoading) return <PageLoader />
  if (user) return <Navigate to={redirectTo} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setUnverified(false)
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setSubmitting(false)

    if (signInError) {
      if (signInError.code === 'email_not_confirmed') {
        setError('Please verify your email first. Check your inbox for the link.')
        setUnverified(true)
      } else if (signInError.code === 'invalid_credentials') {
        setError('Incorrect email or password.')
      } else {
        setError(signInError.message)
      }
      return
    }

    navigate(redirectTo, { replace: true })
  }

  async function handleResend() {
    setResending(true)
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    })
    setResending(false)

    if (resendError) {
      toast.error(resendError.message)
    } else {
      toast.success('Verification email sent. Check your inbox.')
    }
  }

  return (
    <div className="card auth-card">
      <h1>Log in</h1>
      <ErrorMessage message={error} />

      {unverified && (
        <button
          type="button"
          className="btn btn-outline btn-block resend-btn"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? <Spinner size={16} /> : 'Resend verification email'}
        </button>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? <Spinner size={16} /> : 'Log in'}
        </button>
      </form>

      <p className="auth-switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  )
}