import { useState } from 'react'
import { useToast } from '../../hooks/useToast.js'
import { Spinner } from '../ui/Spinner.jsx'
import { REPORT_REASONS, REPORT_DETAILS_MAX_LENGTH } from '../../lib/constants.js'
import { submitReport } from '../../lib/reportsApi.js'

// targetType: 'player' | 'request' | 'ground'
export default function ReportButton({ targetType, targetId }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reason) return setError('Please choose a reason.')
    setError('')
    setBusy(true)
    try {
      await submitReport({ targetType, targetId, reason, details: details.trim() })
      toast.success('Report sent. An admin will review it.')
      setSent(true)
      setOpen(false)
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  if (sent) return <p className="muted report-sent">Reported. Thank you.</p>

  if (!open) {
    return (
      <button type="button" className="link-button report-toggle" onClick={() => setOpen(true)}>
        ⚑ Report
      </button>
    )
  }

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor={`report-reason-${targetId}`}>Why are you reporting this?</label>
        <select
          id={`report-reason-${targetId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
        >
          <option value="">Choose a reason</option>
          {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="form-group">
        <textarea
          rows={3}
          maxLength={REPORT_DETAILS_MAX_LENGTH}
          placeholder="Details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          disabled={busy}
        />
        <small className="muted">{details.length}/{REPORT_DETAILS_MAX_LENGTH}</small>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn btn-danger btn-small" disabled={busy}>
          {busy ? <Spinner size={14} /> : 'Send report'}
        </button>
        <button type="button" className="btn btn-outline btn-small" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  )
}