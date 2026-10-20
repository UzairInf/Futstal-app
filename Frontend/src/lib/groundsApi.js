import { supabase } from './supabaseClient.js'

const BUCKET = 'ground-photos'
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export const MAX_PHOTOS = 6
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024

export function photoUrl(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export function validatePhotoFile(file) {
  if (!EXT[file.type]) return 'Please use JPG, PNG, or WebP images.'
  if (file.size > MAX_PHOTO_BYTES) return 'Each photo must be under 3 MB.'
  return null
}

// Best effort: a failed cleanup should never break the user's action
async function removePhotos(paths) {
  if (paths.length === 0) return
  await supabase.storage.from(BUCKET).remove(paths)
}

async function uploadPhotos(ownerId, files) {
  const uploaded = []
  for (const file of files) {
    const path = `${ownerId}/${crypto.randomUUID()}.${EXT[file.type]}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type })
    if (error) {
      await removePhotos(uploaded)
      throw error
    }
    uploaded.push(path)
  }
  return uploaded
}

export async function listMyGrounds(ownerId) {
  const { data, error } = await supabase
    .from('grounds')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getMyGround(id, ownerId) {
  const { data, error } = await supabase
    .from('grounds')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createGround(ownerId, fields, files) {
  const paths = await uploadPhotos(ownerId, files)
  const { data, error } = await supabase
    .from('grounds')
    .insert({ ...fields, photo_paths: paths })
    .select()
    .single()
  if (error) {
    await removePhotos(paths) // don't leave orphan files behind
    throw error
  }
  return data
}

export async function updateGround(ground, fields, keptPaths, newFiles) {
  const added = await uploadPhotos(ground.owner_id, newFiles)
  const { data, error } = await supabase
    .from('grounds')
    .update({ ...fields, photo_paths: [...keptPaths, ...added] })
    .eq('id', ground.id)
    .select()
    .single()
  if (error) {
    await removePhotos(added)
    throw error
  }
  // Only after the row is saved, delete the photos the owner removed
  await removePhotos(ground.photo_paths.filter((p) => !keptPaths.includes(p)))
  return data
}

export async function setGroundActive(id, isActive) {
  const { data, error } = await supabase
    .from('grounds')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGround(ground) {
  const { data, error } = await supabase
    .from('grounds')
    .delete()
    .eq('id', ground.id)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('This ground could not be deleted.')
  await removePhotos(ground.photo_paths)
}