// Read-only stars, e.g. <Stars value={4} />
export function Stars({ value }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)))
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  )
}

// Clickable stars for the rating form
export function StarInput({ value, onChange, disabled }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          className={`star-btn${n <= value ? ' on' : ''}`}
          onClick={() => onChange(n)}
          disabled={disabled}
        >
          ★
        </button>
      ))}
    </div>
  )
}