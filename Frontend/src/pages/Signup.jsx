import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../hooks/useAuth.js'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import AuthShell, { PasswordInput } from '../components/auth/AuthShell.jsx'
import { AREAS } from '../lib/constants.js'

export default function Signup() {
    const { user, loading: authLoading } = useAuth()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [sentTo, setSentTo] = useState('')
    const [area, setArea] = useState('')

    if (authLoading) return <PageLoader />
    if (user) return <Navigate to="/" replace />

    // "Check your email" screen after a successful signup
    if (sentTo) {
        return (
            <AuthShell>
                <h1>Check your email</h1>
                <p className="auth-sub">
                    We sent a verification link to <strong>{sentTo}</strong>. Click it to
                    activate your account, then log in.
                </p>
                <Link to="/login" className="btn btn-block">Go to login</Link>
            </AuthShell>
        )
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        const cleanName = fullName.trim()
        const cleanEmail = email.trim().toLowerCase()

        if (!cleanName) return setError('Please enter your name.')
        if (cleanName.length > 80) return setError('Your name must be 80 characters or fewer.')
        if (!area) return setError('Please select your area.')
        if (password.length < 8) return setError('Password must be at least 8 characters.')

        setSubmitting(true)
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
                data: { full_name: cleanName, area },
                emailRedirectTo: window.location.origin,
            },
        })
        setSubmitting(false)

        if (signUpError) {
            setError(signUpError.message)
            return
        }

        // With email confirmation on, an existing email returns a user
        // with an empty identities array instead of an error.
        if (data.user && data.user.identities?.length === 0) {
            setError('An account with this email already exists. Try logging in instead.')
            return
        }

        setSentTo(cleanEmail)
    }

    return (
        <AuthShell>
            <h1>Create your account</h1>
            <p className="auth-sub">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="fullName">Full name</label>
                    <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="area">Area</label>
                    <select
                        id="area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        required
                    >
                        <option value="" disabled>Select your area</option>
                        {AREAS.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        minLength={8}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-block" disabled={submitting}>
                    {submitting ? <Spinner size={16} /> : 'Sign up'}
                </button>
            </form>

            <p className="auth-switch">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </AuthShell>
    )
}