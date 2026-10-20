import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { PageLoader, Spinner } from '../../components/ui/Spinner.jsx'
import ErrorMessage from '../../components/ui/ErrorMessage.jsx'
import { AMENITY_LABELS } from '../../lib/constants.js'
import { listMyGrounds, setGroundActive, deleteGround } from '../../lib/groundsApi.js'
import PhotoCarousel from '../../components/grounds/PhotoCarousel.jsx'
import { formatHours } from '../../lib/groundHours.js'


function GroundCard({ ground, busy, onToggle, onDelete }) {


    return (
        <div className="card ground-card">
            <PhotoCarousel paths={ground.photo_paths} alt={ground.name} className="ground-media" />

            <div className="ground-body">
                <div className="ground-title">
                    <h3>{ground.name}</h3>
                    <span className={`badge badge-${ground.is_active ? 'active' : 'inactive'}`}>
                        {ground.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <p className="muted">📍 {ground.address}, {ground.area}</p>
                <p>
                    <strong>Rs {ground.hourly_price.toLocaleString()}</strong>/hour ·{' '}
                    {ground.team_size} a side · {formatHours(ground.opening_time, ground.closing_time)}
                </p>

                {ground.amenities.length > 0 && (
                    <div className="tag-list">
                        {ground.amenities.map((a) => (
                            <span key={a} className="tag">{AMENITY_LABELS[a] ?? a}</span>
                        ))}
                    </div>
                )}

                <div className="form-actions">
                    <Link to={`/owner/grounds/${ground.id}/edit`} className="btn btn-small">Edit</Link>
                    <button className="btn btn-outline btn-small" onClick={() => onToggle(ground)} disabled={busy}>
                        {busy ? <Spinner size={14} /> : ground.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn btn-danger btn-small" onClick={() => onDelete(ground)} disabled={busy}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function MyGrounds() {
    const { user } = useAuth()
    const toast = useToast()

    const [state, setState] = useState({ loading: true, grounds: [], error: '' })
    const [reloadKey, setReloadKey] = useState(0)
    const [busyId, setBusyId] = useState(null)

    useEffect(() => {
        let cancelled = false
        listMyGrounds(user.id)
            .then((grounds) => {
                if (!cancelled) setState({ loading: false, grounds, error: '' })
            })
            .catch((err) => {
                if (!cancelled) setState({ loading: false, grounds: [], error: err.message })
            })
        return () => { cancelled = true }
    }, [user.id, reloadKey])

    function retry() {
        setState({ loading: true, grounds: [], error: '' })
        setReloadKey((k) => k + 1)
    }

    async function handleToggle(ground) {
        setBusyId(ground.id)
        try {
            const updated = await setGroundActive(ground.id, !ground.is_active)
            setState((s) => ({
                ...s,
                grounds: s.grounds.map((g) => (g.id === ground.id ? updated : g)),
            }))
            toast.success(updated.is_active ? 'Ground activated' : 'Ground deactivated')
        } catch (err) {
            toast.error(err.message)
        }
        setBusyId(null)
    }

    async function handleDelete(ground) {
        const ok = window.confirm(
            `Delete "${ground.name}" permanently? This also removes its photos and cannot be undone.`
        )
        if (!ok) return

        setBusyId(ground.id)
        try {
            await deleteGround(ground)
            setState((s) => ({ ...s, grounds: s.grounds.filter((g) => g.id !== ground.id) }))
            toast.success('Ground deleted')
        } catch (err) {
            toast.error(err.message)
        }
        setBusyId(null)
    }

    if (state.loading) return <PageLoader />
    if (state.error) return <ErrorMessage message={state.error} onRetry={retry} />

    return (
        <div className="stack">
            <div className="page-header">
                <h1>My grounds</h1>
                <Link to="/owner/grounds/new" className="btn">+ Register a ground</Link>
            </div>

            {state.grounds.length === 0 && (
                <div className="card">
                    <p>You haven't registered any grounds yet.</p>
                    <Link to="/owner/grounds/new" className="btn">Register your first ground</Link>
                </div>
            )}

            {state.grounds.map((g) => (
                <GroundCard
                    key={g.id}
                    ground={g}
                    busy={busyId === g.id}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    )
}