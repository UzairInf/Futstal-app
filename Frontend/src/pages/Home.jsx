import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TEAM_SIZES } from '../lib/constants.js'
import { GoalArt, GroundArt, HeroArt } from '../components/ui/FutsalArt.jsx'

const USE_CASES = [
  {
    id: 'players',
    tab: 'Players',
    title: 'Players',
    text: 'Browse grounds, pick an hourly slot and book it. You can cancel up to 12 hours before the start.',
    to: '/grounds',
    action: 'Browse grounds',
  },
  {
    id: 'hosts',
    tab: 'Team hosts',
    title: 'Team hosts',
    text: 'Post an opponent request from a confirmed booking or manually, review the teams that respond, and accept one.',
    to: '/opponents/new',
    action: 'Post a request',
  },
  {
    id: 'owners',
    tab: 'Ground owners',
    title: 'Ground owners',
    text: 'Apply to become an owner, list your grounds with photos and opening hours, and manage the bookings you receive.',
    to: '/become-owner',
    action: 'Become an owner',
  },
]

const minSize = Math.min(...TEAM_SIZES)
const maxSize = Math.max(...TEAM_SIZES)

function StripIcon({ children }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  )
}

export default function Home() {
  const [activeId, setActiveId] = useState(USE_CASES[0].id)
  const active = USE_CASES.find((u) => u.id === activeId) ?? USE_CASES[0]

  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-kicker">Karachi · Futsal</span>
          <h1>Find your opponent. Book the ground.</h1>
          <p>Find a ground, book a slot, and get an opponent for your match.</p>
          <div className="home-hero-actions">
            <Link to="/grounds" className="btn">Browse grounds</Link>
            <Link to="/opponents" className="btn btn-outline">Find an opponent</Link>
          </div>
        </div>
        <div className="home-hero-art"><HeroArt /></div>
      </section>

      {/* Two-column introduction */}
      <section className="home-intro">
        <h2>What is Futsal Opponent Finder?</h2>
        <div>
          <p>
            A web app for futsal players in Karachi. Browse and book grounds, post an
            “I need an opponent” request, accept the team that responds, and rate your
            opponents after the match to build reputation.
          </p>
          <Link to="/grounds" className="btn btn-outline btn-small">Explore grounds</Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="home-features" aria-label="Features">
        <article className="feature-card feature-card-image">
          <div className="feature-body">
            <h3>Grounds that fit your slot</h3>
            <p>Filter by area, team size and price, then pick the hourly slots you want.</p>
          </div>
          <div className="feature-art"><GroundArt /></div>
          <div className="feature-chips" aria-hidden="true">
            <span className="feature-chip"><i />Available</span>
            <span className="feature-chip is-booked"><i />Booked</span>
          </div>
        </article>

        <article className="feature-card feature-card-dark">
          <span className="feature-label">Opponents</span>
          <div>
            <p className="feature-stat">Always a match</p>
            <p>Post a request and accept the team that suits you. Booking-verified requests are marked.</p>
          </div>
        </article>

        <article className="feature-card feature-card-dark is-deep">
          <span className="feature-label">Reputation</span>
          <div>
            <div className="feature-stars" aria-hidden="true">★★★★★</div>
            <p className="feature-stat">Rate every match</p>
            <p>1–5 star ratings and show-up rates build trust between players.</p>
          </div>
        </article>
      </section>

      {/* Information strip */}
      <section className="home-strip" aria-label="Good to know">
        <span className="home-strip-label">Good to know before you play</span>
        <span className="home-strip-item">
          <StripIcon>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </StripIcon>
          Hourly slots
        </span>
        <span className="home-strip-item">
          <StripIcon>
            <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="17" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M15.5 14.6c2.4-.3 4.3.9 5 3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </StripIcon>
          {minSize}–{maxSize} a side
        </span>
        <span className="home-strip-item">
          <StripIcon>
            <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
          </StripIcon>
          Pay at the ground
        </span>
        <span className="home-strip-item">
          <StripIcon>
            <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </StripIcon>
          Phone shared only after accept
        </span>
      </section>

      {/* Use cases */}
      <section className="home-usecases" aria-label="Use cases">
        <div className="usecase-intro">
          <p className="home-eyebrow">Use cases</p>
          <h2>Built for every side of the game</h2>
          <p>
            Whether you are looking for a pitch, a team to play against, or you run a
            ground yourself, everything happens in one place.
          </p>
          <div className="usecase-tabs" role="tablist" aria-label="Use cases">
            {USE_CASES.map((u) => (
              <button
                key={u.id}
                type="button"
                role="tab"
                id={`usecase-tab-${u.id}`}
                aria-selected={u.id === activeId}
                aria-controls="usecase-panel"
                className="usecase-tab"
                onClick={() => setActiveId(u.id)}
              >
                {u.tab}
              </button>
            ))}
          </div>
        </div>

        <article
          className="usecase-card"
          id="usecase-panel"
          role="tabpanel"
          aria-labelledby={`usecase-tab-${active.id}`}
        >
          <div className="usecase-copy">
            <h3>{active.title}</h3>
            <p>{active.text}</p>
            <Link to={active.to} className="usecase-link">{active.action} →</Link>
          </div>
          <div className="usecase-art"><GoalArt /></div>
        </article>
      </section>
    </div>
  )
}