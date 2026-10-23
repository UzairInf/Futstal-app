import { friendlyMessage } from '../../lib/errors.js'

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null

  return (
    <div className="alert alert-error" role="alert">
      <span>{friendlyMessage(message)}</span>
      {onRetry && (
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}