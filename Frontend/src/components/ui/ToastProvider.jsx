import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from '../../context/toastContext.js'
import { friendlyMessage } from '../../lib/errors.js'

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (type, message, duration) => {
      const id = ++nextId.current
      setToasts((current) => [...current, { id, type, message }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  const api = useMemo(
    () => ({
      success: (message) => show('success', message, 4000),
      error: (message) => show('error', friendlyMessage(message), 6000),
      info: (message) => show('info', message, 4000),
    }),
    [show]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}