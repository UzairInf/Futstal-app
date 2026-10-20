import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import GroundForm from '../../components/grounds/GroundForm.jsx'
import { createGround } from '../../lib/groundsApi.js'

export default function GroundCreate() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  async function handleSubmit(fields, _keptPaths, newFiles) {
    await createGround(user.id, fields, newFiles)
    toast.success('Ground registered')
    navigate('/owner/grounds')
  }

  return (
    <div className="card form-card">
      <h1>Register a ground</h1>
      <GroundForm onSubmit={handleSubmit} submitLabel="Register ground" />
    </div>
  )
}