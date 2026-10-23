import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import { PageLoader } from '../ui/Spinner.jsx'

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main container">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}