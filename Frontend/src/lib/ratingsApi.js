import { supabase } from './supabaseClient.js'

// Rate your opponent after a completed match. The database works out who is being
// rated and refuses non-participants, unfinished matches and duplicate ratings.
export async function rateMatch({ matchId, stars, showedUp, review }) {
  const { data, error } = await supabase.rpc('rate_match', {
    p_match_id: matchId,
    p_stars: stars,
    p_showed_up: showedUp,
    p_review: review,
  })
  if (error) throw error
  return data
}

// Public statistics for one player. Resolves to null when the player doesn't exist.
export async function getPlayerStats(playerId) {
  const { data, error } = await supabase.rpc('get_player_stats', { p_player_id: playerId })
  if (error) throw error
  return data?.[0] ?? null // one-row table, so Supabase hands back an array
}