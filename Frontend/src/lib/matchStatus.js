// Match history buckets and badges. A match is "completed" once its end time has passed;
// nothing is stored for that, the same way bookings and responses work.

export const MATCH_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function bucketOf(match, now) {
  if (match.status === 'cancelled') return 'cancelled'
  return new Date(match.ends_at).getTime() > now ? 'upcoming' : 'past'
}

export function isInProgress(match, now) {
  return (
    bucketOf(match, now) === 'upcoming' && new Date(match.starts_at).getTime() <= now
  )
}

// Players can cancel a confirmed match until it starts
export function canCancel(match, now) {
  return bucketOf(match, now) === 'upcoming' && new Date(match.starts_at).getTime() > now
}

export function matchBadge(bucket, inProgress) {
  if (bucket === 'cancelled') return { cls: 'badge-rejected', text: 'Cancelled' }
  if (inProgress) return { cls: 'badge-admin', text: 'Happening now' }
  if (bucket === 'upcoming') return { cls: 'badge-active', text: 'Confirmed' }
  return { cls: 'badge-inactive', text: 'Completed' }
}

// Rows arrive latest match first; show the soonest upcoming match first
export function groupMatches(matches, now) {
  const grouped = { upcoming: [], past: [], cancelled: [] }
  for (const m of matches) grouped[bucketOf(m, now)].push(m)
  grouped.upcoming.reverse()
  return grouped
}