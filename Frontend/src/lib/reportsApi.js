import { supabase } from './supabaseClient.js'

export async function submitReport({ targetType, targetId, reason, details }) {
  const { data, error } = await supabase.rpc('submit_report', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reason: reason,
    p_details: details || null,
  })
  if (error) throw error
  return data
}

// Admin only (the database refuses anyone else)
export async function listReports(status) {
  const { data, error } = await supabase.rpc('admin_list_reports', { p_status: status })
  if (error) throw error
  return data ?? []
}

export async function reviewReport({ id, status, note, action = 'none' }) {
  const { error } = await supabase.rpc('review_report', {
    p_report_id: id,
    p_status: status,
    p_note: note || null,
    p_action: action,
  })
  if (error) throw error
}

export async function listOwners() {
  const { data, error } = await supabase.rpc('admin_list_owners')
  if (error) throw error
  return data ?? []
}

export async function revokeOwner(userId, cancelFutureBookings) {
  const { data, error } = await supabase.rpc('admin_revoke_owner', {
    p_user_id: userId,
    p_cancel_future_bookings: cancelFutureBookings,
  })
  if (error) throw error
  return data // number of bookings cancelled
}