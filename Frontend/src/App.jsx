import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import RoleRoute from './components/auth/RoleRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Profile from './pages/Profile.jsx'
import BecomeOwner from './pages/BecomeOwner.jsx'
import AdminOwnerRequests from './pages/AdminOwnerRequests.jsx'
import NotFound from './pages/NotFound.jsx'
import MyGrounds from './pages/owner/MyGrounds.jsx'
import GroundCreate from './pages/owner/GroundCreate.jsx'
import GroundEdit from './pages/owner/GroundEdit.jsx'
import Grounds from './pages/Grounds.jsx'
import GroundDetails from './pages/GroundDetails.jsx'

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
          <Route path="/grounds" element={<Grounds />} />
          <Route path="/grounds/:id" element={<GroundDetails />} />

          <Route element={<RoleRoute allow={['owner']} />}>
            <Route path="/owner/grounds" element={<MyGrounds />} />
            <Route path="/owner/grounds/new" element={<GroundCreate />} />
            <Route path="/owner/grounds/:id/edit" element={<GroundEdit />} />
          </Route>

          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path="/admin/owner-requests" element={<AdminOwnerRequests />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}