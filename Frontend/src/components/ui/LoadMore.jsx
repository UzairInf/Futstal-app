import { Spinner } from './Spinner.jsx'

export default function LoadMore({ hasMore, loading, onClick, label = 'Load more' }) {
  if (!hasMore) return null

  return (
    <div className="load-more">
      <button type="button" className="btn btn-outline" onClick={onClick} disabled={loading}>
        {loading ? <Spinner size={14} /> : label}
      </button>
    </div>
  )
}