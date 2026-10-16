import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import { AREAS } from '../lib/constants.js'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

// Turn a public avatar URL back into its storage path (for deleting the old file)
function pathFromUrl(url) {
  if (!url) return null
  const marker = '/avatars/'
  const i = url.indexOf(marker)
  return i === -1 ? null : url.slice(i + marker.length)
}

export default function Profile() {
  const { user, profile, profileLoading, profileError, refreshProfile, replaceProfile } = useAuth()
  const toast = useToast()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', area: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  if (profileLoading) return <PageLoader />

  if (!profile) {
    return (
      <ErrorMessage
        message={profileError || 'Could not load your profile.'}
        onRetry={refreshProfile}
      />
    )
  }

  function startEditing() {
    setForm({
      full_name: profile.full_name ?? '',
      area: profile.area ?? '',
      bio: profile.bio ?? '',
    })
    setError('')
    setEditing(true)
  }

  function updateField(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')

    const name = form.full_name.trim()
    if (!name) return setError('Name is required.')

    setSaving(true)
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        area: form.area || null,
        bio: form.bio.trim() || null,
      })
      .eq('id', user.id)
      .select()
      .single()
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    replaceProfile(data)
    setEditing(false)
    toast.success('Profile updated')
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) return toast.error('Please use a JPG, PNG, or WebP image.')
    if (file.size > MAX_AVATAR_BYTES) return toast.error('Image must be under 2 MB.')

    setUploading(true)

    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      setUploading(false)
      toast.error(uploadError.message)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      await supabase.storage.from('avatars').remove([path]) // don't leave an orphan file
      setUploading(false)
      toast.error(updateError.message)
      return
    }

    // Best-effort cleanup of the previous avatar
    const oldPath = pathFromUrl(profile.avatar_url)
    if (oldPath) await supabase.storage.from('avatars').remove([oldPath])

    replaceProfile(data)
    setUploading(false)
    toast.success('Avatar updated')
  }

  return (
    <div className="card profile-card">
      <div className="profile-header">
        <Avatar url={profile.avatar_url} name={profile.full_name} size={96} />

        <div className="profile-meta">
          <h1>{profile.full_name || 'Unnamed player'}</h1>
          <p className="muted">{user.email}</p>
          <p className="muted">{profile.area ? `📍 ${profile.area}, Karachi` : 'No area set'}</p>

          <label className="btn btn-outline btn-small" aria-disabled={uploading}>
            {uploading ? <Spinner size={14} /> : 'Change photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              disabled={uploading}
              hidden
            />
          </label>
        </div>
      </div>

      {!editing && (
        <>
          <h3>About</h3>
          <p>{profile.bio || <span className="muted">No bio yet.</span>}</p>
          <button type="button" className="btn" onClick={startEditing}>Edit profile</button>
        </>
      )}

      {editing && (
        <form onSubmit={handleSave}>
          <ErrorMessage message={error} />

          <div className="form-group">
            <label htmlFor="full_name">Full name</label>
            <input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={updateField}
              maxLength={80}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="area">Area</label>
            <select id="area" name="area" value={form.area} onChange={updateField}>
              <option value="">Select your area</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={300}
              value={form.bio}
              onChange={updateField}
            />
            <small className="muted">{form.bio.length}/300</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? <Spinner size={16} /> : 'Save changes'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}