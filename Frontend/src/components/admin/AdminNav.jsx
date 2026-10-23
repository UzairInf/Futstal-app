import { NavLink } from 'react-router-dom'

export default function AdminNav() {
  return (
    <div className="tabs admin-nav">
      <NavLink to="/admin/owner-requests" className="tab">Owner requests</NavLink>
      <NavLink to="/admin/reports" className="tab">Reports</NavLink>
      <NavLink to="/admin/owners" className="tab">Owners</NavLink>
    </div>
  )
}