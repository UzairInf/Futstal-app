export function Spinner({ size = 24 }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label="Loading"
    />
  )
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="page-loader">
      <Spinner size={36} />
      <p>{label}</p>
    </div>
  )
}