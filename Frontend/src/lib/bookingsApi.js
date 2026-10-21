import { supabase } from './supabaseClient.js'

export async function getAvailableSlots(groundId, date) {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_ground_id: groundId,
    p_date: date,
  })
  if (error) throw error
  return data ?? []
}

export async function createBooking({ groundId, start, hours, phone, email, notes }) {
  const { data, error } = await supabase.rpc('create_booking', {
    p_ground_id: groundId,
    p_start: start,
    p_hours: hours,
    p_phone: phone,
    p_email: email,
    p_notes: notes,
  })
  if (error) throw error
  return data
}

export async function listMyBookings(userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, grounds(name, area, address, is_active)')
    .eq('player_id', userId) // owners can also read bookings at their grounds, so filter explicitly
    .order('start_at', { ascending: false })
    .limit(100) // pagination comes in Phase 11
  if (error) throw error
  return data
}

export async function cancelBooking(id, reason = null) {
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: id,
    p_reason: reason,
  })
  if (error) throw error
  return data
}

export async function listOwnerBookings(ownerId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, grounds!inner(name, area, address, owner_id)')
    .eq('grounds.owner_id', ownerId) // an owner can also be a player elsewhere, so filter explicitly
    .order('start_at', { ascending: false })
    .limit(100) // pagination comes in Phase 11
  if (error) throw error
  return data
}