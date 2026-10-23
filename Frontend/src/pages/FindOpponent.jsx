import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { PageLoader } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import RequestCard from '../components/opponents/RequestCard.jsx'
import LoadMore from '../components/ui/LoadMore.jsx'
import ReportButton from '../components/reports/ReportButton.jsx'
import { AREAS, TEAM_SIZES, SKILL_LEVELS, PAGE_SIZE } from '../lib/constants.js'
import { listOpenRequests } from '../lib/matchRequestsApi.js'
import { todayInKarachi, addDays, dayLabel } from '../lib/karachiTime.js'
import RequestRespond from '../components/opponents/RequestRespond.jsx'
import { listMyActiveResponses } from '../lib/matchResponsesApi.js'

// Ignore hand-edited URL values that aren't real options
function pick(value, allowed) {
    return allowed.map(String).includes(value) ? value : ''
}

export default function FindOpponent() {
    const { user } = useAuth()
    const [params, setParams] = useSearchParams()

    const [today] = useState(todayInKarachi)
    const dayOptions = Array.from({ length: 31 }, (_, i) => addDays(today, i))

    const area = pick(params.get('area'), AREAS)
    const skill = pick(params.get('skill'), SKILL_LEVELS.map((s) => s.value))
    const teamSize = pick(params.get('size'), TEAM_SIZES)
    const date = pick(params.get('date'), dayOptions)
    const verifiedOnly = params.get('verified') === '1'
    const hasFilters = Boolean(area || skill || teamSize || date || verifiedOnly)

    const filterKey = [area, skill, teamSize, date, verifiedOnly].join('|')
    const [limit, setLimit] = useState(PAGE_SIZE)
    const [result, setResult] = useState({ key: null, limit: PAGE_SIZE, requests: [], hasMore: false, error: '' })
    const [reloadKey, setReloadKey] = useState(0)
    const loading = result.key !== filterKey
    const loadingMore = !loading && !result.error && result.limit !== limit


    // Requests I already responded to (request id -> true)
    const [responded, setResponded] = useState({})

    useEffect(() => {
        let cancelled = false
        listMyActiveResponses(user.id)
            .then((rows) => {
                if (!cancelled) setResponded(Object.fromEntries(rows.map((r) => [r.request_id, true])))
            })
            .catch(() => { }) // not critical: the database still blocks duplicate responses
        return () => { cancelled = true }
    }, [user.id])

    function markResponded(requestId) {
        setResponded((prev) => ({ ...prev, [requestId]: true }))
    }

    useEffect(() => {
        let cancelled = false
        listOpenRequests(user.id, { area, skill, teamSize, date, verifiedOnly, limit })
            .then((rows) => {
                if (!cancelled) {
                    setResult({ key: filterKey, limit, requests: rows.slice(0, limit), hasMore: rows.length > limit, error: '' })
                }
            })
            .catch((err) => {
                if (!cancelled) setResult({ key: filterKey, limit, requests: [], hasMore: false, error: err.message })
            })
        return () => { cancelled = true }
    }, [user.id, area, skill, teamSize, date, verifiedOnly, filterKey, limit, reloadKey])

    function setFilter(name, value) {
        setLimit(PAGE_SIZE)
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev)
                if (value) next.set(name, value)
                else next.delete(name)
                return next
            },
            { replace: true }
        )
    }

    function clearFilters() {
        setLimit(PAGE_SIZE)
        setParams({}, { replace: true })
    }

    function retry() {
        setResult((r) => ({ ...r, key: null }))
        setReloadKey((k) => k + 1)
    }

    let content
    if (loading) {
        content = <PageLoader label="Loading requests..." />
    } else if (result.error) {
        content = <ErrorMessage message={result.error} onRetry={retry} />
    } else if (result.requests.length === 0) {
        content = (
            <div className="card empty-state">
                <h3>{hasFilters ? 'No requests match your filters' : 'No open requests right now'}</h3>
                <p className="muted">
                    {hasFilters
                        ? 'Try different filters, or post your own request.'
                        : 'Be the first to post one and let other teams find you.'}
                </p>
                {hasFilters ? (
                    <button type="button" className="btn" onClick={clearFilters}>Clear filters</button>
                ) : (
                    <Link to="/opponents/new" className="btn">Post a request</Link>
                )}
            </div>
        )
    } else {
        content = (
            <>
                <p className="muted">
                    {result.requests.length}{result.hasMore ? '+' : ''} open request{result.requests.length === 1 ? '' : 's'}
                </p>
                <div className="requests-grid">
                    {result.requests.map((r) => (
                        <RequestCard key={r.id} request={r}>
                            <RequestRespond
                                request={r}
                                responded={Boolean(responded[r.id])}
                                onResponded={markResponded}
                            />
                            <ReportButton targetType="request" targetId={r.id} />
                        </RequestCard>
                    ))}
                </div>
                <LoadMore
                    hasMore={result.hasMore}
                    loading={loadingMore}
                    onClick={() => setLimit((l) => l + PAGE_SIZE)}
                />
            </>
        )
    }

    return (
        <div className="stack">
            <div className="page-header">
                <h1>Find an opponent</h1>
                <div className="form-actions">
                    <Link to="/opponents/new" className="btn">+ Post a request</Link>
                    <Link to="/opponents/mine" className="btn btn-outline">My requests</Link>
                    <Link to="/opponents/responses" className="btn btn-outline">My responses</Link>
                </div>
            </div>

            <div className="card filters">
                <div className="form-group">
                    <label htmlFor="f-area">Area</label>
                    <select id="f-area" value={area} onChange={(e) => setFilter('area', e.target.value)}>
                        <option value="">All areas</option>
                        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="f-skill">Skill level</label>
                    <select id="f-skill" value={skill} onChange={(e) => setFilter('skill', e.target.value)}>
                        <option value="">Any level</option>
                        {SKILL_LEVELS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="f-size">Team size</label>
                    <select id="f-size" value={teamSize} onChange={(e) => setFilter('size', e.target.value)}>
                        <option value="">Any size</option>
                        {TEAM_SIZES.map((s) => <option key={s} value={s}>{s} a side</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="f-date">Date</label>
                    <select id="f-date" value={date} onChange={(e) => setFilter('date', e.target.value)}>
                        <option value="">Any date</option>
                        {dayOptions.map((d) => <option key={d} value={d}>{dayLabel(d, today)}</option>)}
                    </select>
                </div>

                <label className="checkbox-item">
                    <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setFilter('verified', e.target.checked ? '1' : '')}
                    />
                    Booking verified only
                </label>

                {hasFilters && (
                    <button type="button" className="btn btn-outline" onClick={clearFilters}>
                        Clear filters
                    </button>
                )}
            </div>

            {content}
        </div>
    )
}