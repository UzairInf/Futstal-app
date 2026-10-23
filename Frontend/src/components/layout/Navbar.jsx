import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import NotificationDropdown from '../notifications/NotificationDropdown.jsx'

export default function Navbar() {
    const { user, profile, loading, signOut } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)

    async function handleLogout() {
        setMenuOpen(false)
        navigate('/login', { replace: true, state: null })

        const { error } = await signOut()
        if (error) {
            toast.error(error.message)
            return
        }
        toast.success('Logged out')
    }

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">⚽ Futsal Finder</Link>

                <button
                    type="button"
                    className="navbar-toggle"
                    aria-label="Toggle menu"
                    aria-expanded={menuOpen}
                    aria-controls="main-nav"
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    {menuOpen ? '✕' : '☰'}
                </button>

                <nav
                    id="main-nav"
                    className={`navbar-links${menuOpen ? ' is-open' : ''}`}
                    onClick={(e) => {
                        // Close the mobile menu after following a link (but not when opening the bell)
                        if (e.target.closest('a')) setMenuOpen(false)
                    }}
                >
                    <NavLink to="/" end className="nav-link">Home</NavLink>
                    <NavLink to="/grounds" className="nav-link">Grounds</NavLink>
                    <NavLink to="/opponents" className="nav-link">Find opponent</NavLink>

                    {!loading && !user && (
                        <>
                            <NavLink to="/login" className="nav-link">Log in</NavLink>
                            <NavLink to="/signup" className="nav-link">Sign up</NavLink>
                        </>
                    )}

                    {!loading && user && (
                        <>
                            {profile?.role === 'admin' && (
                                <NavLink to="/admin/reports" className="nav-link">Admin</NavLink>
                            )}
                            {profile?.role === 'owner' && (
                                <NavLink to="/owner/grounds" className="nav-link">My grounds</NavLink>
                            )}
                            {profile?.role === 'owner' && (
                                <NavLink to="/owner/bookings" className="nav-link">Ground bookings</NavLink>
                            )}
                            <NavLink to="/bookings" className="nav-link">My bookings</NavLink>
                            <NavLink to="/opponents/matches" className="nav-link">My matches</NavLink>
                            <NotificationDropdown />
                            <NavLink to="/profile" className="nav-link">Profile</NavLink>
                            <button type="button" className="btn btn-outline" onClick={handleLogout}>
                                Log out
                            </button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    )
}