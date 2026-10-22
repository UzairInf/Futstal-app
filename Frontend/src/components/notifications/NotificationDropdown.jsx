import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import {
  fetchNotifications,
  markNotificationRead,
  subscribeToNotifications,
} from '../../lib/notificationsApi.js'

function relativeTime(isoString) {
  const then = new Date(isoString).getTime()
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (diffSec < 60) return 'just now'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay}d ago`
}

function destinationFor(notification) {
  if (notification.type === 'new_response') return '/opponents/mine'
  if (notification.type === 'response_accepted') return '/opponents/matches'
  return null
}

export default function NotificationDropdown() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const userId = user?.id ?? null
  const [state, setState] = useState({ key: null, data: [], error: null })
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const loading = userId !== null && state.key !== userId
  const unreadCount = state.key === userId ? state.data.filter((n) => !n.is_read).length : 0

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      try {
        const list = await fetchNotifications()
        if (!cancelled) setState({ key: userId, data: list, error: null })
      } catch (err) {
        if (!cancelled) setState({ key: userId, data: [], error: err })
      }
    }

    load()

    const unsubscribe = subscribeToNotifications(userId, {
      onInsert: (row) => {
        setState((prev) =>
          prev.key === userId ? { ...prev, data: [row, ...prev.data] } : prev
        )
      },
      onUpdate: (row) => {
        setState((prev) =>
          prev.key === userId
            ? { ...prev, data: prev.data.map((n) => (n.id === row.id ? row : n)) }
            : prev
        )
      },
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [userId])

  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  async function handleClick(notification) {
    setOpen(false)

    // Optimistic mark-as-read
    if (!notification.is_read) {
      setState((prev) =>
        prev.key === userId
          ? {
              ...prev,
              data: prev.data.map((n) =>
                n.id === notification.id ? { ...n, is_read: true } : n
              ),
            }
          : prev
      )
      try {
        await markNotificationRead(notification.id)
      } catch (err) {
        toast.error(err.message)
        // Revert
        setState((prev) =>
          prev.key === userId
            ? {
                ...prev,
                data: prev.data.map((n) =>
                  n.id === notification.id ? { ...n, is_read: false } : n
                ),
              }
            : prev
        )
      }
    }

    const dest = destinationFor(notification)
    if (dest) navigate(dest)
  }

  if (!userId) return null

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-panel" role="dialog" aria-label="Notifications">
          <div className="notification-panel-head">
            <strong>Notifications</strong>
          </div>

          {loading && <p className="notification-empty">Loading…</p>}

          {!loading && state.error && (
            <p className="notification-empty">Could not load notifications.</p>
          )}

          {!loading && !state.error && state.data.length === 0 && (
            <p className="notification-empty">No notifications yet.</p>
          )}

          {!loading && !state.error && state.data.length > 0 && (
            <ul className="notification-list">
              {state.data.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={
                      'notification-item' + (n.is_read ? ' is-read' : ' is-unread')
                    }
                    onClick={() => handleClick(n)}
                  >
                    <span className="notification-item-title">{n.title}</span>
                    <span className="notification-item-body">{n.body}</span>
                    <span className="notification-item-time">{relativeTime(n.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}