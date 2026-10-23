// Owners often type the area into the address too, so only add the area when it isn't there already.
export function fullAddress(address, area) {
  const a = (address || '').trim()
  const ar = (area || '').trim()
  if (!ar || a.toLowerCase().includes(ar.toLowerCase())) return a
  return `${a}, ${ar}`
}

// Best-effort Google Maps search (grounds have no saved coordinates). Including the ground's
// name lets Maps match the business listing instead of guessing from the street text.
export function mapsSearchUrl(ground) {
  const place = fullAddress(ground.address, ground.area)
  const parts = [ground.name, place]
  if (!/karachi/i.test(place)) parts.push('Karachi')
  return (
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(parts.filter(Boolean).join(', '))
  )
}