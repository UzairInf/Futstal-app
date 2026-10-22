import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <h1>Futsal Opponent Finder Karachi</h1>
      <p>Find a ground, book a slot, and get an opponent for your match.</p>
      <Link to="/grounds" className="btn">Browse grounds</Link>
      <Link to="/opponents" className="btn btn-outline">Find an opponent</Link>
    </div>
  )
}