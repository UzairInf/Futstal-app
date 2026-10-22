import { phoneHref } from '../../lib/matchFormat.js'

// Shown only after a response is accepted (the database hides the numbers before that)
export default function MatchContact({ title, name, phone, yourPhone }) {
  return (
    <div className="contact-box">
      <strong>{title}</strong>
      <p>
        {name} · 📞 <a href={phoneHref(phone)}>{phone}</a>
      </p>
      {yourPhone && <p>Your number shared with them: {yourPhone}</p>}
    </div>
  )
}