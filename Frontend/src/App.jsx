import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import RoleRoute from './components/auth/RoleRoute.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const BecomeOwner = lazy(() => import('./pages/BecomeOwner.jsx'))
const AdminOwnerRequests = lazy(() => import('./pages/AdminOwnerRequests.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const MyGrounds = lazy(() => import('./pages/owner/MyGrounds.jsx'))
const GroundCreate = lazy(() => import('./pages/owner/GroundCreate.jsx'))
const GroundEdit = lazy(() => import('./pages/owner/GroundEdit.jsx'))
const OwnerBookings = lazy(() => import('./pages/owner/OwnerBookings.jsx'))
const Grounds = lazy(() => import('./pages/Grounds.jsx'))
const GroundDetails = lazy(() => import('./pages/GroundDetails.jsx'))
const MyBookings = lazy(() => import('./pages/MyBookings.jsx'))
const FindOpponent = lazy(() => import('./pages/FindOpponent.jsx'))
const RequestCreate = lazy(() => import('./pages/opponents/RequestCreate.jsx'))
const MyRequests = lazy(() => import('./pages/opponents/MyRequests.jsx'))
const MyResponses = lazy(() => import('./pages/opponents/MyResponses.jsx'))
const MyMatches = lazy(() => import('./pages/opponents/MyMatches.jsx'))
const PlayerProfile = lazy(() => import('./pages/PlayerProfile.jsx'))
const AdminReports = lazy(() => import('./pages/AdminReports.jsx'))
const AdminOwners = lazy(() => import('./pages/AdminOwners.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/become-owner" element={<BecomeOwner />} />
          <Route path="/opponents" element={<FindOpponent />} />
          <Route path="/opponents/new" element={<RequestCreate />} />
          <Route path="/opponents/mine" element={<MyRequests />} />
          <Route path="/opponents/responses" element={<MyResponses />} />
          <Route path="/opponents/matches" element={<MyMatches />} />
          <Route path="/players/:id" element={<PlayerProfile />} />
          <Route path="/grounds" element={<Grounds />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/grounds/:id" element={<GroundDetails />} />

          <Route element={<RoleRoute allow={['owner']} />}>
            <Route path="/owner/grounds" element={<MyGrounds />} />
            <Route path="/owner/grounds/new" element={<GroundCreate />} />
            <Route path="/owner/grounds/:id/edit" element={<GroundEdit />} />
            <Route path="/owner/bookings" element={<OwnerBookings />} />
          </Route>

          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path="/admin/owner-requests" element={<AdminOwnerRequests />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/owners" element={<AdminOwners />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}