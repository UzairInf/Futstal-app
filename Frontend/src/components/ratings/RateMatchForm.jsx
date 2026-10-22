import { useState } from 'react'
import { useToast } from '../../hooks/useToast.js'
import { Spinner } from '../ui/Spinner.jsx'
import ErrorMessage from '../ui/ErrorMessage.jsx'
import { StarInput } from './StarRating.jsx'
import { REVIEW_MAX_LENGTH } from '../../lib/constants.js'
import { rateMatch } from '../../lib/ratingsApi.js'

// Goes inside a past match card on the My matches page
export default function RateMatchForm({ matchId, opponentName, onRated, onClose }) {
  const toast = useToast()
  const [stars, setStars] = useState(0)
  const [showedUp, setShowedUp] = useState(null)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (stars < 1) return setError('Choose a rating from 1 to 5 stars.')
    if (showedUp === null) return setError(`Say whether ${opponentName} showed up.`)

    setSubmitting(true)
    try {
      await rateMatch({ matchId, stars, showedUp, review: review.trim() || null })
      toast.success('Rating saved')
      onRated()
    } catch (err) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  return (
    <form className="respond-form" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      <div className="form-group">
        <label>How was {opponentName}?</label>
        <StarInput value={stars} onChange={setStars} disabled={submitting} />
      </div>

      <div className="form-group">
        <label>Did {opponentName} show up?</label>
        <div className="radio-row">
          <label>
            <input
              type="radio"
              name={`showed-${matchId}`}
              checked={showedUp === true}
              onChange={() => setShowedUp(true)}
              disabled={submitting}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name={`showed-${matchId}`}
              checked={showedUp === false}
              onChange={() => setShowedUp(false)}
              disabled={submitting}
            />
            No
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`review-${matchId}`}>Review (optional)</label>
        <textarea
          id={`review-${matchId}`}
          rows={3}
          maxLength={REVIEW_MAX_LENGTH}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          disabled={submitting}
        />
        <p className="muted hint">
          Only {opponentName} can read this. {review.length}/{REVIEW_MAX_LENGTH}
        </p>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-small" disabled={submitting}>
          {submitting ? <Spinner size={14} /> : 'Submit rating'}
        </button>
        <button type="button" className="btn btn-outline btn-small" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}