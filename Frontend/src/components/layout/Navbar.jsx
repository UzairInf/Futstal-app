import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">⚽ Futsal Finder</Link>

        <nav className="navbar-links">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          {/* Phase 1: Login / Sign up / Logout go here */}
        </nav>
      </div>
    </header>
  )
}