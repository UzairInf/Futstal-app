import { supabase } from './supabaseClient.js'

// These functions return a one-row table, so Supabase hands back an array
const first = (data) => data?.[0] ?? null

export async function respondToRequest({ requestId, phone, message }) {
  const { data, error } = await supabase.rpc('respond_to_match_request', {
    p_request_id: requestId,
    p_phone: phone,
    p_message: message,
  })
  if (error) throw error
  return first(data)
}

export async function withdrawResponse(id) {
  const { data, error } = await supabase.rpc('withdraw_match_response', { p_response_id: id })
  if (error) throw error
  return first(data)
}

export async function rejectResponse(id) {
  const { data, error } = await supabase.rpc('reject_match_response', { p_response_id: id })
  if (error) throw error
  return first(data)
}

export async function acceptResponse(id, hostPhone) {
  const { data, error } = await supabase.rpc('accept_match_response', {
    p_response_id: id,
    p_host_phone: hostPhone,
  })
  if (error) throw error
  return first(data)
}

// Host side: every response to every request I posted
export async function listResponsesToMyRequests() {
  const { data, error } = await supabase.rpc('list_responses_to_my_requests')
  if (error) throw error
  return data ?? []
}

// Responder side: every response I sent, with the match details
export async function listMyResponses() {
  const { data, error } = await supabase.rpc('list_my_responses')
  if (error) throw error
  return data ?? []
}

// Used on the Find opponent page to show "You responded" instead of the button
export async function listMyActiveResponses(userId) {
  const { data, error } = await supabase
    .from('match_responses')
    .select('request_id, status')
    .eq('responder_id', userId) // the database already limits this to your own rows
    .in('status', ['pending', 'accepted'])
  if (error) throw error
  return data
}