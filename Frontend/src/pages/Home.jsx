import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function Home() {
  const [status, setStatus] = useState('Checking Supabase connection...')

  useEffect(() => {
    supabase.auth.getSession().then(({ error }) => {
      setStatus(error ? `Connection failed: ${error.message}` : 'Connected to Supabase ✅')
    })
  }, [])

  return (
    <div>
      <h1>Futsal Opponent Finder Karachi</h1>
      <p>{status}</p>
    </div>
  )
}