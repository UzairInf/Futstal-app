import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'
import Signup from './pages/Signup.jsx'
import Login from './pages/Login.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}