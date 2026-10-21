import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'

export default function Navbar() {
    const { user, profile, loading, signOut } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()

    async function handleLogout() {
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

                <nav className="navbar-links">
                    <NavLink to="/" end className="nav-link">Home</NavLink>
                    <NavLink to="/grounds" className="nav-link">Grounds</NavLink>

                    {!loading && !user && (
                        <>
                            <NavLink to="/login" className="nav-link">Log in</NavLink>
                            <NavLink to="/signup" className="nav-link">Sign up</NavLink>
                        </>
                    )}

                    {!loading && user && (
                        <>
                            {profile?.role === 'owner' && (
                                <NavLink to="/owner/grounds" className="nav-link">My grounds</NavLink>
                            )}
                            {profile?.role === 'owner' && (
                                <NavLink to="/owner/bookings" className="nav-link">Ground bookings</NavLink>
                            )}
                            <NavLink to="/bookings" className="nav-link">My bookings</NavLink>
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