// Badge for a response, as the responder sees it.
// `response` needs: status, starts_at, ends_at
export function responseBadge(response, now) {
  const startsMs = new Date(response.starts_at).getTime()
  const endsMs = new Date(response.ends_at).getTime()

  switch (response.status) {
    case 'pending':
      return startsMs > now
        ? { cls: 'badge-admin', text: 'Waiting for host' }
        : { cls: 'badge-inactive', text: 'Expired' }
    case 'accepted':
      return endsMs > now
        ? { cls: 'badge-active', text: 'Accepted' }
        : { cls: 'badge-inactive', text: 'Completed' }
    case 'rejected':
      return { cls: 'badge-rejected', text: 'Declined' }
    case 'withdrawn':
      return { cls: 'badge-inactive', text: 'Withdrawn' }
    case 'cancelled':
      return { cls: 'badge-rejected', text: 'Match cancelled' }
    default:
      return { cls: 'badge-inactive', text: 'Request closed' }
  }
}