import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useToast } from '../hooks/useToast.js'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'

function RequestCard({ req, onReview }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function act(approve) {
    setBusy(true)
    await onReview(req.id, approve, note)
    setBusy(false)
  }

  return (
    <div className="card request-card">
      <div className="request-head">
        <strong>{req.profiles?.full_name || 'Unnamed user'}</strong>
        <span className="muted">
          {req.profiles?.area || 'No area'} · {new Date(req.created_at).toLocaleDateString()}
        </span>
      </div>

      <p className="request-phone">📞 {req.phone}</p>
      <p className="request-message">{req.message}</p>

      {req.status === 'pending' ? (
        <>
          <input
            type="text"
            placeholder="Optional note (shown to the applicant if rejected)"
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
          />
          <div className="form-actions request-actions">
            <button className="btn" onClick={() => act(true)} disabled={busy}>
              {busy ? <Spinner size={16} /> : 'Approve'}
            </button>
            <button className="btn btn-danger" onClick={() => act(false)} disabled={busy}>
              Reject
            </button>
          </div>
        </>
      ) : (
        <p>
          <span className={`badge badge-${req.status}`}>{req.status}</span>
          {req.admin_note && <span className="muted"> · {req.admin_note}</span>}
        </p>
      )}
    </div>
  )
}

export default function AdminOwnerRequests() {
  const toast = useToast()
  const [state, setState] = useState({ loading: true, requests: [], error: '' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('owner_requests')
      .select('*, profiles!owner_requests_user_id_fkey(full_name, area)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return
        setState({ loading: false, requests: data ?? [], error: error?.message ?? '' })
      })

    return () => { cancelled = true }
  }, [reloadKey])

  function retry() {
    setState((s) => ({ ...s, loading: true, error: '' }))
    setReloadKey((k) => k + 1)
  }

  async function handleReview(id, approve, note) {
    const { error } = await supabase.rpc('review_owner_request', {
      p_request_id: id,
      p_approve: approve,
      p_note: note.trim() || null,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(approve ? 'Owner approved' : 'Request rejected')
    setReloadKey((k) => k + 1)
  }

  if (state.loading) return <PageLoader />
  if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

  const pending = state.requests.filter((r) => r.status === 'pending')
  const reviewed = state.requests.filter((r) => r.status !== 'pending')

  return (
    <div className="stack">
      <h1>Owner requests</h1>

      <h2>Pending ({pending.length})</h2>
      {pending.length === 0 && <p className="muted">No pending requests.</p>}
      {pending.map((r) => (
        <RequestCard key={r.id} req={r} onReview={handleReview} />
      ))}

      {reviewed.length > 0 && (
        <>
          <h2>Reviewed</h2>
          {reviewed.map((r) => (
            <RequestCard key={r.id} req={r} onReview={handleReview} />
          ))}
        </>
      )}
    </div>
  )
}