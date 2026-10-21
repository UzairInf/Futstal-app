export const AREAS = [
  'Bahadurabad',
  'Clifton',
  'DHA',
  'Federal B Area',
  'Gulistan-e-Johar',
  'Gulshan-e-Iqbal',
  'Gulshan-e-Maymar',
  'Korangi',
  'Malir',
  'Nazimabad',
  'North Karachi',
  'North Nazimabad',
  'Orangi Town',
  'PECHS',
  'Saddar',
  'Scheme 33',
  'Other',
]

export const TEAM_SIZES = [5, 6, 7, 8]

export const AMENITIES = [
  { value: 'floodlights', label: 'Floodlights' },
  { value: 'parking', label: 'Parking' },
  { value: 'washroom', label: 'Washroom' },
  { value: 'changing_room', label: 'Changing room' },
  { value: 'drinking_water', label: 'Drinking water' },
  { value: 'cafe', label: 'Café' },
  { value: 'seating', label: 'Seating area' },
  { value: 'first_aid', label: 'First aid' },
  { value: 'wifi', label: 'Wi-Fi' },
]

export const AMENITY_LABELS = Object.fromEntries(AMENITIES.map((a) => [a.value, a.label]))

export const PRICE_LIMITS = [2000, 3000, 4000, 5000, 6000, 8000, 10000]

export const PHONE_RE = /^[0-9+() -]{7,20}$/
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/