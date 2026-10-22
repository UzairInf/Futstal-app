import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { Spinner } from '../ui/Spinner.jsx'
import ErrorMessage from '../ui/ErrorMessage.jsx'
import { AREAS, AMENITIES, TEAM_SIZES } from '../../lib/constants.js'
import { MAX_PHOTOS, photoUrl, validatePhotoFile } from '../../lib/groundsApi.js'
import { hoursStatus } from '../../lib/groundHours.js'

const timeValue = (t) => (t ? t.slice(0, 5) : '')

export default function GroundForm({ ground, submitLabel, onSubmit }) {
    const { profile } = useAuth()

    const [values, setValues] = useState({
        name: ground?.name ?? '',
        area: ground?.area ?? profile?.area ?? '',
        address: ground?.address ?? '',
        hourly_price: ground ? String(ground.hourly_price) : '',
        team_size: ground ? String(ground.team_size) : '5',
        opening_time: ground ? timeValue(ground.opening_time) : '18:00',
        closing_time: ground ? timeValue(ground.closing_time) : '23:00',
        description: ground?.description ?? '',
    })
    const [amenities, setAmenities] = useState(ground?.amenities ?? [])
    const [keptPaths, setKeptPaths] = useState(ground?.photo_paths ?? [])
    const [newPhotos, setNewPhotos] = useState([]) // [{ file, preview }]
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Free preview URLs when the form closes
    const previewsRef = useRef([])

    useEffect(() => {
        previewsRef.current = newPhotos
    }, [newPhotos])

    useEffect(() => {
        return () => previewsRef.current.forEach((p) => URL.revokeObjectURL(p.preview))
    }, [])

    function updateField(e) {
        setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
    }

    function toggleAmenity(value) {
        setAmenities((list) =>
            list.includes(value) ? list.filter((a) => a !== value) : [...list, value]
        )
    }

    function handleFiles(e) {
        const files = Array.from(e.target.files ?? [])
        e.target.value = ''
        setError('')

        const room = MAX_PHOTOS - keptPaths.length - newPhotos.length
        if (files.length > room) {
            return setError(
                room <= 0
                    ? `A ground can have at most ${MAX_PHOTOS} photos.`
                    : `You can add ${room} more photo${room === 1 ? '' : 's'}.`
            )
        }

        for (const file of files) {
            const problem = validatePhotoFile(file)
            if (problem) return setError(problem)
        }

        setNewPhotos((list) => [
            ...list,
            ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
        ])
    }

    function removeNew(index) {
        setNewPhotos((list) => {
            URL.revokeObjectURL(list[index].preview)
            return list.filter((_, i) => i !== index)
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        const name = values.name.trim()
        const address = values.address.trim()
        const description = values.description.trim()
        const price = Number(values.hourly_price)

        if (name.length < 3) return setError('Ground name must be at least 3 characters.')
        if (!values.area) return setError('Please select the area.')
        if (address.length < 5) return setError('Please enter the full address.')
        if (!Number.isInteger(price) || price < 100 || price > 100000) {
            return setError('Hourly price must be a whole number between 100 and 100,000 PKR.')
        }


        const fields = {
            name,
            area: values.area,
            address,
            hourly_price: price,
            team_size: Number(values.team_size),
            opening_time: values.opening_time,
            closing_time: values.closing_time,
            amenities,
            description: description || null,
        }

        setSubmitting(true)
        try {
            await onSubmit(fields, keptPaths, newPhotos.map((p) => p.file))
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.')
            setSubmitting(false)
        }
    }

    const status = hoursStatus(values.opening_time, values.closing_time)

    const photoCount = keptPaths.length + newPhotos.length

    return (
        <form onSubmit={handleSubmit}>
            <ErrorMessage message={error} />

            <div className="form-group">
                <label htmlFor="name">Ground name</label>
                <input id="name" name="name" value={values.name} onChange={updateField}
                    maxLength={80} required />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="area">Area</label>
                    <select id="area" name="area" value={values.area} onChange={updateField} required>
                        <option value="" disabled>Select area</option>
                        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="team_size">Team size (per side)</label>
                    <select id="team_size" name="team_size" value={values.team_size}
                        onChange={updateField} required>
                        {TEAM_SIZES.map((s) => <option key={s} value={s}>{s} a side</option>)}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="address">Address</label>
                <input id="address" name="address" value={values.address} onChange={updateField}
                    maxLength={200} required />
            </div>

            <div className="form-group">
                <label htmlFor="hourly_price">Price per hour (PKR)</label>
                <input id="hourly_price" name="hourly_price" type="number" inputMode="numeric"
                    min={100} max={100000} value={values.hourly_price}
                    onChange={updateField} required />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="opening_time">Opens at</label>
                    <input id="opening_time" name="opening_time" type="time"
                        value={values.opening_time} onChange={updateField} required />
                </div>
                <div className="form-group">
                    <label htmlFor="closing_time">Closes at</label>
                    <input id="closing_time" name="closing_time" type="time"
                        value={values.closing_time} onChange={updateField} required />
                </div>
            </div>
            <p className="muted hint">
                Choose the same time for both fields (for example 12:00 AM and 12:00 AM) if your
                ground is open 24 hours.
            </p>
            {status && <p className="hours-status">{status}</p>}
            <div className="form-group">
                <label>Amenities</label>
                <div className="checkbox-grid">
                    {AMENITIES.map((a) => (
                        <label key={a.value} className="checkbox-item">
                            <input type="checkbox" checked={amenities.includes(a.value)}
                                onChange={() => toggleAmenity(a.value)} />
                            {a.label}
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="description">Description (optional)</label>
                <textarea id="description" name="description" rows={4} maxLength={1000}
                    value={values.description} onChange={updateField} />
                <small className="muted">{values.description.length}/1000</small>
            </div>

            <div className="form-group">
                <label>Photos ({photoCount}/6)</label>

                {photoCount > 0 && (
                    <div className="photo-grid">
                        {keptPaths.map((path) => (
                            <div key={path} className="photo-thumb">
                                <img src={photoUrl(path)} alt="" />
                                <button type="button" className="photo-remove" aria-label="Remove photo"
                                    onClick={() => setKeptPaths((l) => l.filter((p) => p !== path))}>×</button>
                            </div>
                        ))}
                        {newPhotos.map((p, i) => (
                            <div key={p.preview} className="photo-thumb">
                                <img src={p.preview} alt="" />
                                <button type="button" className="photo-remove" aria-label="Remove photo"
                                    onClick={() => removeNew(i)}>×</button>
                            </div>
                        ))}
                    </div>
                )}

                {photoCount < MAX_PHOTOS && (
                    <label className="btn btn-outline btn-small">
                        Add photos
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                            onChange={handleFiles} hidden />
                    </label>
                )}
                <p className="muted hint">JPG, PNG, or WebP, up to 3 MB each.</p>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn" disabled={submitting}>
                    {submitting ? <Spinner size={16} /> : submitLabel}
                </button>
                <Link to="/owner/grounds" className="btn btn-outline">Cancel</Link>
            </div>
        </form>
    )
}