import { supabase } from './supabaseClient.js'
import { addDays } from './karachiTime.js'

const WITH_HOST = '*, profiles(full_name, area, avatar_url)'

// A Karachi calendar day (YYYY-MM-DD) as a UTC timestamp
const dayStart = (dateStr) => new Date(`${dateStr}T00:00:00+05:00`).toISOString()

export async function listOpenRequests(userId, { area, skill, teamSize, date, verifiedOnly } = {}) {
  let query = supabase
    .from('match_requests')
    .select(WITH_HOST)
    .eq('status', 'open')
    .neq('host_id', userId) // your own requests live on the My requests page
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(60) // pagination comes in Phase 11

  if (area) query = query.eq('area', area)
  if (skill) query = query.eq('skill_level', skill)
  if (teamSize) query = query.eq('team_size', Number(teamSize))
  if (verifiedOnly) query = query.not('booking_id', 'is', null)
  if (date) {
    query = query.gte('starts_at', dayStart(date)).lt('starts_at', dayStart(addDays(date, 1)))
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listMyRequests(userId) {
  const { data, error } = await supabase
    .from('match_requests')
    .select('*')
    .eq('host_id', userId)
    .order('starts_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function createRequestFromBooking({ bookingId, skill, notes }) {
  const { data, error } = await supabase.rpc('create_match_request_from_booking', {
    p_booking_id: bookingId,
    p_skill_level: skill,
    p_notes: notes,
  })
  if (error) throw error
  return data
}

export async function createRequestManual({
  startsAt, durationMinutes, teamSize, skill, groundId, groundName, area, notes,
}) {
  const { data, error } = await supabase.rpc('create_match_request_manual', {
    p_starts_at: startsAt,
    p_duration_minutes: durationMinutes,
    p_team_size: teamSize,
    p_skill_level: skill,
    p_ground_id: groundId,
    p_ground_name: groundName,
    p_area: area,
    p_notes: notes,
  })
  if (error) throw error
  return data
}

export async function closeRequest(id) {
  const { data, error } = await supabase.rpc('close_match_request', { p_request_id: id })
  if (error) throw error
  return data
}