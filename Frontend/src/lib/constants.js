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

export const SKILL_LEVELS = [
  { value: 'casual', label: 'Casual' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'competitive', label: 'Competitive' },
]

export const SKILL_LABELS = Object.fromEntries(SKILL_LEVELS.map((s) => [s.value, s.label]))

// Match durations in minutes: 30 minutes up to 6 hours
export const DURATION_OPTIONS = Array.from({ length: 12 }, (_, i) => (i + 1) * 30)

// Phase 9: ratings
export const MIN_RATINGS_FOR_REPUTATION = 3
export const REVIEW_MAX_LENGTH = 500


// Phase 11
export const PAGE_SIZE = 24

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or fake listing' },
  { value: 'fake_info', label: 'False or misleading information' },
  { value: 'harassment', label: 'Harassment or abusive behaviour' },
  { value: 'no_show', label: 'Did not show up / cancelled repeatedly' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Something else' },
]
export const REPORT_REASON_LABELS = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]))
export const REPORT_DETAILS_MAX_LENGTH = 500