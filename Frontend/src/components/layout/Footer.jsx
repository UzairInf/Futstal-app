import { Link } from 'react-router-dom'
import { BallIcon } from '../ui/FutsalArt.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">
          <span className="brand-mark"><BallIcon size={15} /></span>
          Futsal Opponent Finder · Karachi
        </span>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/grounds">Grounds</Link>
          <Link to="/opponents">Find opponent</Link>
        </nav>
      </div>
    </footer>
  )
}