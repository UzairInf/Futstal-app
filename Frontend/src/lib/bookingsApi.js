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