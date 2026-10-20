function to12h(time) {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export function isOpen24h(opening, closing) {
  return opening.slice(0, 5) === closing.slice(0, 5)
}

export function formatHours(opening, closing) {
  if (isOpen24h(opening, closing)) return 'Open 24 hours'
  return `${to12h(opening)} to ${to12h(closing)}`
}

// Live hint shown under the time fields in the form
export function hoursStatus(opening, closing) {
  if (!opening || !closing) return ''
  if (isOpen24h(opening, closing)) return 'Open 24 hours'
  if (closing.slice(0, 5) < opening.slice(0, 5)) return 'Closes after midnight'
  return ''
}