import { supabase } from './supabaseClient.js'

// Every confirmed or cancelled match I'm in, as host or as opponent
export async function listMyMatches() {
  const { data, error } = await supabase.rpc('list_my_matches')
  if (error) throw error
  return data ?? []
}

export async function cancelMatch(responseId) {
  const { data, error } = await supabase.rpc('cancel_match', { p_response_id: responseId })
  if (error) throw error
  return data?.[0] ?? null // one-row table, so Supabase hands back an array
}