import { useAuth } from '../hooks/useAuth.js'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div>
      <h1>My profile</h1>
      <p>Logged in as <strong>{user.email}</strong></p>
      <p>Profile editing comes in Phase 2.</p>
    </div>
  )
}