import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { PageLoader } from '../components/ui/Spinner.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'



export default function Home() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        supabase.auth.getSession().then(({ error }) => {
            if (error) setError(error.message)
            setLoading(false)
        })
    }, [])

    if (loading) return <PageLoader />

    return (
        <div>
            <h1>Futsal Opponent Finder Karachi</h1>
            <p>Find a ground, book a slot, and get an opponent for your match.</p>
            <ErrorMessage message={error} />
        </div>
    )
}