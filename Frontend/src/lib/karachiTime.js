export const KARACHI_TZ = 'Asia/Karachi'

const dateKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: KARACHI_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
})
const timeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: KARACHI_TZ, hour: 'numeric', minute: '2-digit', hour12: true,
})
const dayFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: KARACHI_TZ, weekday: 'short', month: 'short', day: 'numeric',
})

// 'YYYY-MM-DD' in Karachi
export const todayInKarachi = () => dateKey.format(new Date())
export const karachiDate = (iso) => dateKey.format(new Date(iso))

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const addHours = (iso, h) => new Date(new Date(iso).getTime() + h * 3600e3).toISOString()

export const formatTime = (iso) => timeFmt.format(new Date(iso))   // 6:00 PM
export const formatDay = (iso) => dayFmt.format(new Date(iso))     // Fri, Oct 23
export const formatRange = (startIso, endIso) => `${formatTime(startIso)} – ${formatTime(endIso)}`
const weekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' })
const monthFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' })
const hourFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: KARACHI_TZ, hour: 'numeric', hour12: true,
})

const utcMidnight = (dateStr) => new Date(`${dateStr}T00:00:00Z`)

export const weekdayShort = (dateStr) => weekdayFmt.format(utcMidnight(dateStr)) // Mon
export const monthShort = (dateStr) => monthFmt.format(utcMidnight(dateStr))    // Oct
export const dayOfMonth = (dateStr) => Number(dateStr.slice(8, 10))             // 23
export const formatHour = (iso) => hourFmt.format(new Date(iso))                // 12 PM

// The Monday of the week that contains dateStr
export function weekStart(dateStr) {
  const mondayIndex = (utcMidnight(dateStr).getUTCDay() + 6) % 7
  return addDays(dateStr, -mondayIndex)
}

// Label for a day in a picker: Today, Tomorrow, or "Fri, Oct 23"
export function dayLabel(dateStr, today) {
  if (dateStr === today) return 'Today'
  if (dateStr === addDays(today, 1)) return 'Tomorrow'
  return `${weekdayShort(dateStr)}, ${monthShort(dateStr)} ${dayOfMonth(dateStr)}`
}

// Combine a Karachi date and time ('2026-10-23', '20:00') into a timestamp string
export const toKarachiIso = (dateStr, timeStr) => `${dateStr}T${timeStr}:00+05:00`