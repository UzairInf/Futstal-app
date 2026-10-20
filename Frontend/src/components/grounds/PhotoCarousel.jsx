
import { useState } from 'react'
import { photoUrl } from '../../lib/groundsApi.js'

export default function PhotoCarousel({ paths, alt = '', className = '' }) {
  const [index, setIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)

  if (!paths || paths.length === 0) {
    return <div className={`carousel carousel-empty ${className}`}>⚽</div>
  }

  const count = paths.length
  const current = Math.min(index, count - 1)
  const go = (delta) => setIndex((current + delta + count) % count)

  function handleTouchEnd(e) {
    if (touchStart === null) return
    const dx = e.changedTouches[0].clientX - touchStart
    setTouchStart(null)
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
  }

  return (
    <div
      className={`carousel ${className}`}
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      <img className="carousel-img" src={photoUrl(paths[current])} alt={alt} />

      {count > 1 && (
        <>
          <button type="button" className="carousel-btn carousel-prev"
                  aria-label="Previous photo" onClick={() => go(-1)}>‹</button>
          <button type="button" className="carousel-btn carousel-next"
                  aria-label="Next photo" onClick={() => go(1)}>›</button>
          <span className="carousel-count">{current + 1}/{count}</span>
          <div className="carousel-dots">
            {paths.map((p, i) => (
              <button
                key={p}
                type="button"
                className={`carousel-dot ${i === current ? 'active' : ''}`}
                aria-label={`Show photo ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}