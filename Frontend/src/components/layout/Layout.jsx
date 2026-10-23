import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import { PageLoader } from '../ui/Spinner.jsx'

const AUTH_PATHS = ['/login', '/signup']

export default function Layout() {
  const { pathname } = useLocation()
  const isAuthPage = AUTH_PATHS.includes(pathname)
  const isWide = isAuthPage || pathname === '/'

  return (
    <div className="app-shell">
      {!isAuthPage && <Navbar />}
      <main className={isWide ? 'app-main app-main-wide' : 'app-main container'}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  )
}