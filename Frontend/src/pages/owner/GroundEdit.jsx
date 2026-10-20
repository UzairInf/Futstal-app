import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { PageLoader } from '../../components/ui/Spinner.jsx'
import ErrorMessage from '../../components/ui/ErrorMessage.jsx'
import GroundForm from '../../components/grounds/GroundForm.jsx'
import { getMyGround, updateGround } from '../../lib/groundsApi.js'

export default function GroundEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [state, setState] = useState({ loading: true, ground: null, error: '' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getMyGround(id, user.id)
      .then((ground) => {
        if (!cancelled) setState({ loading: false, ground, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, ground: null, error: err.message })
      })
    return () => { cancelled = true }
  }, [id, user.id, reloadKey])

  function retry() {
    setState({ loading: true, ground: null, error: '' })
    setReloadKey((k) => k + 1)
  }

  if (state.loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

  if (!state.ground) {
    return (
      <div className="card auth-card">
        <h1>Ground not found</h1>
        <p>It may have been deleted, or it isn't yours to edit.</p>
        <Link to="/owner/grounds" className="btn">Back to my grounds</Link>
      </div>
    )
  }

  async function handleSubmit(fields, keptPaths, newFiles) {
    await updateGround(state.ground, fields, keptPaths, newFiles)
    toast.success('Ground updated')
    navigate('/owner/grounds')
  }

  return (
    <div className="card form-card">
      <h1>Edit ground</h1>
      <GroundForm ground={state.ground} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  )
}