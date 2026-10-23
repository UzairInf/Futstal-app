import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthArt, BallIcon } from '../ui/FutsalArt.jsx'

function EyeIcon({ off }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      {off && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />}
    </svg>
  )
}

/** Password input with a show / hide control. Same props as a normal <input>. */
export function PasswordInput(props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  )
}

/** Split-screen frame: image panel on the left, account form on the right. */
export default function AuthShell({ children }) {
  return (
    <div className="auth-split">
      <aside className="auth-visual">
        <div className="auth-visual-art">
          <AuthArt />
        </div>

        <div className="auth-visual-top">
          <Link to="/" className="navbar-brand">
            <span className="brand-mark"><BallIcon /></span>
            <span className="brand-name">Futsal Finder</span>
          </Link>
          <Link to="/" className="auth-back">Back to website</Link>
        </div>

        <div className="auth-visual-caption">
          <h2>Find your opponent.<br />Book the ground.</h2>
          <p>Futsal Opponent Finder · Karachi</p>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-panel-inner">{children}</div>
      </section>
    </div>
  )
}