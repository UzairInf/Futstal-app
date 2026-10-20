import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { PageLoader } from '../ui/Spinner.jsx'
import ErrorMessage from '../ui/ErrorMessage.jsx'

export default function RoleRoute({ allow }) {
  const { profile, profileLoading, profileError, refreshProfile } = useAuth()

  if (profileLoading) return <PageLoader />

  if (!profile) {
    return (
      <ErrorMessage
        message={profileError || 'Could not load your profile.'}
        onRetry={refreshProfile}
      />
    )
  }

  if (!allow.includes(profile.role)) {
    return (
      <div className="card auth-card">
        <h1>Access denied</h1>
        <p>You don't have permission to view this page.</p>
        <Link to="/" className="btn">Back to home</Link>
      </div>
    )
  }

  return <Outlet />
}