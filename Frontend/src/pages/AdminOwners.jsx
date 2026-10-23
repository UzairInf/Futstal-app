import { useEffect, useState } from 'react'
import { useToast } from '../hooks/useToast.js'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import AdminNav from '../components/admin/AdminNav.jsx'
import { formatDay } from '../lib/karachiTime.js'
import { listOwners, revokeOwner } from '../lib/reportsApi.js'

function OwnerCard({ owner, onRevoke }) {
  const [cancelBookings, setCancelBookings] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    const ok = window.confirm(
      `Remove the owner role from ${owner.full_name || 'this user'}?\n\n` +
      'Their grounds will be deactivated and they become a normal player.' +
      (cancelBookings ? '\nTheir upcoming bookings will be cancelled.' : '')
    )
    if (!ok) return
    setBusy(true)
    await onRevoke(owner.owner_id, cancelBookings)
    setBusy(false)
  }

  return (
    <div className="card request-card">
      <div className="request-head">
        <strong>{owner.full_name || 'Unnamed owner'}</strong>
        <span className="muted">{owner.area} · member since {formatDay(owner.member_since)}</span>
      </div>
      <ul className="facts">
        <li>Grounds: {owner.active_grounds} active of {owner.total_grounds}</li>
        <li>Upcoming confirmed bookings: {owner.upcoming_bookings}</li>
        <li>
          Open reports:{' '}
          {owner.open_reports > 0
            ? <span className="badge badge-rejected">{owner.open_reports}</span>
            : 0}
        </li>
      </ul>
      <label className="checkbox-item">
        <input
          type="checkbox"
          checked={cancelBookings}
          onChange={(e) => setCancelBookings(e.target.checked)}
          disabled={busy}
        />
        Also cancel their upcoming bookings
      </label>
      <div className="form-actions">
        <button className="btn btn-danger" onClick={handleClick} disabled={busy}>
          {busy ? <Spinner size={16} /> : 'Remove owner role'}
        </button>
      </div>
    </div>
  )
}

export default function AdminOwners() {
  const toast = useToast()
  const [result, setResult] = useState({ key: null, owners: [], error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const loading = result.key !== reloadKey

  useEffect(() => {
    let cancelled = false
    listOwners()
      .then((owners) => {
        if (!cancelled) setResult({ key: reloadKey, owners, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: reloadKey, owners: [], error: err.message })
      })
    return () => { cancelled = true }
  }, [reloadKey])

  async function handleRevoke(userId, cancelBookings) {
    try {
      const cancelled = await revokeOwner(userId, cancelBookings)
      toast.success(cancelled > 0 ? `Owner removed. ${cancelled} booking(s) cancelled.` : 'Owner removed.')
      setReloadKey((k) => k + 1)
    } catch (err) {
      toast.error(err.message)
    }
  }

  let content
  if (loading) content = <PageLoader />
  else if (result.error) content = <ErrorMessage message={result.error} onRetry={() => setReloadKey((k) => k + 1)} />
  else if (result.owners.length === 0) content = <p className="muted">There are no ground owners.</p>
  else content = result.owners.map((o) => <OwnerCard key={o.owner_id} owner={o} onRevoke={handleRevoke} />)

  return (
    <div className="stack">
      <h1>Ground owners</h1>
      <AdminNav />
      {content}
    </div>
  )
}