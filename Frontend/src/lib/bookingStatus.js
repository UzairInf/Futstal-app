// Shared by the player page (MyBookings) and the owner page (OwnerBookings)

export const BOOKING_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
]

export function bucketOf(booking, now) {
  if (booking.status === 'cancelled') return 'cancelled'
  return new Date(booking.end_at).getTime() > now ? 'upcoming' : 'past'
}

export function bookingBadge(bucket, inProgress) {
  if (bucket === 'cancelled') return { cls: 'badge-rejected', text: 'Cancelled' }
  if (inProgress) return { cls: 'badge-admin', text: 'Happening now' }
  if (bucket === 'upcoming') return { cls: 'badge-active', text: 'Confirmed' }
  return { cls: 'badge-inactive', text: 'Completed' }
}

// Bookings arrive newest first; show the soonest upcoming booking first
export function groupBookings(bookings, now) {
  const grouped = { upcoming: [], past: [], cancelled: [] }
  for (const b of bookings) grouped[bucketOf(b, now)].push(b)
  grouped.upcoming.reverse()
  return grouped
}