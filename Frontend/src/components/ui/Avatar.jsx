export default function Avatar({ url, name, size = 80 }) {
  const style = { width: size, height: size }

  if (url) {
    return <img className="avatar" src={url} alt="" style={style} />
  }

  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <div className="avatar avatar-fallback" style={{ ...style, fontSize: size * 0.4 }}>
      {initial}
    </div>
  )
}