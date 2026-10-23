import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../hooks/useToast.js'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import AdminNav from '../components/admin/AdminNav.jsx'
import { REPORT_REASON_LABELS } from '../lib/constants.js'
import { formatDay, formatTime } from '../lib/karachiTime.js'
import { listReports, reviewReport } from '../lib/reportsApi.js'

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
]

function ReportCard({ report, onReview }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function act(status, action = 'none') {
    setBusy(true)
    await onReview({ id: report.id, status, note: note.trim(), action })
    setBusy(false)
  }

  let target = report.target_label
  if (report.target_type === 'player') {
    target = <Link to={`/players/${report.target_id}`}>{report.target_label}</Link>
  } else if (report.target_type === 'ground') {
    target = <Link to={`/grounds/${report.target_id}`}>{report.target_label}</Link>
  }

  return (
    <div className="card request-card">
      <div className="request-head">
        <strong>{REPORT_REASON_LABELS[report.reason] ?? report.reason}</strong>
        <span className="muted">
          {formatDay(report.created_at)}, {formatTime(report.created_at)}
        </span>
      </div>
      <p>
        <span className="tag">{report.target_type}</span> {target}
        {report.report_count > 1 && (
          <span className="badge badge-rejected"> {report.report_count} reports on this item</span>
        )}
      </p>
      {report.details && <p className="pre-wrap">{report.details}</p>}
      <p className="muted">Reported by {report.reporter_name}</p>

      {report.status === 'open' ? (
        <>
          <input
            type="text"
            placeholder="Optional admin note"
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
          />
          <div className="form-actions request-actions">
            <button className="btn btn-outline" onClick={() => act('dismissed')} disabled={busy}>
              {busy ? <Spinner size={16} /> : 'Dismiss'}
            </button>
            <button className="btn" onClick={() => act('resolved')} disabled={busy}>Mark resolved</button>
            {report.target_type === 'request' && (
              <button className="btn btn-danger" onClick={() => act('resolved', 'close_request')} disabled={busy}>
                Resolve and close request
              </button>
            )}
            {report.target_type === 'ground' && (
              <button className="btn btn-danger" onClick={() => act('resolved', 'deactivate_ground')} disabled={busy}>
                Resolve and deactivate ground
              </button>
            )}
          </div>
        </>
      ) : (
        <p>
          <span className={`badge badge-${report.status === 'resolved' ? 'approved' : 'rejected'}`}>{report.status}</span>
          {report.admin_note && <span className="muted"> · {report.admin_note}</span>}
        </p>
      )}
    </div>
  )
}

export default function AdminReports() {
  const toast = useToast()
  const [tab, setTab] = useState('open')
  const [result, setResult] = useState({ key: null, reports: [], error: '' })
  const [reloadKey, setReloadKey] = useState(0)
  const key = `${tab}|${reloadKey}`
  const loading = result.key !== key

  useEffect(() => {
    let cancelled = false
    listReports(tab)
      .then((reports) => {
        if (!cancelled) setResult({ key, reports, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, reports: [], error: err.message })
      })
    return () => { cancelled = true }
  }, [tab, key])

  async function handleReview(args) {
    try {
      await reviewReport(args)
      toast.success('Report updated')
      setReloadKey((k) => k + 1)
    } catch (err) {
      toast.error(err.message)
    }
  }

  let content
  if (loading) content = <PageLoader />
  else if (result.error) content = <ErrorMessage message={result.error} onRetry={() => setReloadKey((k) => k + 1)} />
  else if (result.reports.length === 0) content = <p className="muted">Nothing here.</p>
  else content = result.reports.map((r) => <ReportCard key={r.id} report={r} onReview={handleReview} />)

  return (
    <div className="stack">
      <h1>Reports</h1>
      <AdminNav />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {content}
    </div>
  )
}