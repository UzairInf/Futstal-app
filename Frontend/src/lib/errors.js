// Turns raw Supabase / network errors into messages a player can act on.
// Friendly messages raised by our own RPC functions pass through unchanged.
const TECHNICAL = /violates|relation "|column "|schema cache|syntax error|could not find the function|PGRST|duplicate key|invalid input syntax/i

export function friendlyMessage(error) {
  const raw = typeof error === 'string' ? error : error?.message || ''
  const code = typeof error === 'object' && error ? error.code : undefined

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
    return 'Connection problem. Check your internet and try again.'
  }
  if (/jwt expired|invalid jwt|refresh token/i.test(raw)) {
    return 'Your session expired. Please log in again.'
  }
  if (/row-level security|^permission denied/i.test(raw)) {
    return "You don't have permission to do that."
  }
  if (/statement timeout|canceling statement/i.test(raw) || code === '57014') {
    return 'The server took too long to respond. Please try again.'
  }
  if (code === '23514') return 'Some of the information is not valid. Please check the form.'
  if (code === '22001') return 'One of the fields is too long.'
  if (TECHNICAL.test(raw)) return 'Something went wrong. Please try again.'
  return raw || 'Something went wrong. Please try again.'
}